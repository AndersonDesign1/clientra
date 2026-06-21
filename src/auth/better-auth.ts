import { createHmac } from "node:crypto";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { lastLoginMethod, organization } from "better-auth/plugins";
import { tanstackStartCookies } from "better-auth/tanstack-start";
import { ROLES } from "@/auth/roles";
import { db } from "@/db/client";
import { loadEnvFiles } from "@/db/load-env";
import {
  accounts,
  invitations,
  members,
  organizations,
  sessions,
  users,
  verifications,
} from "@/db/schema";
import { sendTransactionalEmail } from "@/server/email/loop";

loadEnvFiles();

const rawBaseUrl = process.env.BETTER_AUTH_URL?.trim();
if (!rawBaseUrl && process.env.NODE_ENV === "production") {
  throw new Error("Missing REQUIRED environment variable: BETTER_AUTH_URL");
}
const rawAuthSecret = process.env.BETTER_AUTH_SECRET?.trim();
if (!rawAuthSecret && process.env.NODE_ENV === "production") {
  throw new Error("Missing REQUIRED environment variable: BETTER_AUTH_SECRET");
}
const validatedBaseUrl = rawBaseUrl || "http://localhost:3000";

function normalizeCredential(value: string | undefined) {
  const normalized = value?.trim();
  return normalized ? normalized : undefined;
}

function getTrustedOrigins() {
  return [
    process.env.BETTER_AUTH_URL,
    ...(process.env.BETTER_AUTH_TRUSTED_ORIGINS?.split(",") ?? []),
  ]
    .map((origin) => origin?.trim())
    .filter((origin): origin is string => Boolean(origin));
}

function getEmailLogId(email: string) {
  const secret = process.env.BETTER_AUTH_SECRET ?? "clientra-auth-email-log";

  return createHmac("sha256", secret)
    .update(email.trim().toLowerCase())
    .digest("hex")
    .slice(0, 12);
}

async function sendAuthEmail(
  input: Parameters<typeof sendTransactionalEmail>[0]
) {
  try {
    await sendTransactionalEmail(input);
  } catch (error) {
    // Keep raw email out of logs; this stable HMAC id is enough to correlate failures.
    console.error("Loops auth email failed", {
      emailLogId: getEmailLogId(input.email),
      error,
      template: input.template,
    });
  }
}

function getSocialProviderConfig({
  clientId,
  clientSecret,
  provider,
}: {
  clientId: string | undefined;
  clientSecret: string | undefined;
  provider: "github" | "google";
}) {
  const normalizedClientId = normalizeCredential(clientId);
  const normalizedClientSecret = normalizeCredential(clientSecret);

  if (
    normalizedClientId === undefined &&
    normalizedClientSecret === undefined
  ) {
    return undefined;
  }

  if (!(normalizedClientId && normalizedClientSecret)) {
    throw new Error(
      `Missing ${provider} OAuth credentials. Set both ${provider.toUpperCase()}_CLIENT_ID and ${provider.toUpperCase()}_CLIENT_SECRET or remove the provider configuration.`
    );
  }

  return {
    clientId: normalizedClientId,
    clientSecret: normalizedClientSecret,
  };
}

const githubProvider = getSocialProviderConfig({
  clientId: process.env.GITHUB_CLIENT_ID,
  clientSecret: process.env.GITHUB_CLIENT_SECRET,
  provider: "github",
});

const googleProvider = getSocialProviderConfig({
  clientId: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  provider: "google",
});

export const userAdditionalFields = {
  role: {
    type: "string",
    defaultValue: ROLES.CLIENT,
    input: false,
  },
} as const;

export const auth = betterAuth({
  account: {
    accountLinking: {
      enabled: true,
      trustedProviders: ["google", "github"],
    },
  },
  advanced: {
    useSecureCookies: process.env.NODE_ENV === "production",
  },
  baseURL: validatedBaseUrl,
  databaseHooks: {
    user: {
      create: {
        before: (user) =>
          Promise.resolve({
            data: { ...user, role: ROLES.CLIENT },
          }),
      },
    },
  },
  database: drizzleAdapter(db, {
    provider: "sqlite",
    schema: {
      account: accounts,
      invitation: invitations,
      member: members,
      organization: organizations,
      session: sessions,
      user: users,
      verification: verifications,
    },
  }),
  secret: process.env.BETTER_AUTH_SECRET,
  emailAndPassword: {
    enabled: true,
    sendResetPassword: ({ token, url, user }) => {
      return sendAuthEmail({
        dataVariables: {
          expiryMinutes: "60",
          resetPasswordUrl: url,
          supportEmail: process.env.SUPPORT_EMAIL ?? "support@clientra.app",
        },
        email: user.email,
        idempotencyKey: `better-auth:reset-password:${token}`,
        template: "resetPassword",
      });
    },
  },
  emailVerification: {
    sendVerificationEmail: ({ token, url, user }) => {
      return sendAuthEmail({
        dataVariables: {
          token,
          verificationUrl: url,
        },
        email: user.email,
        idempotencyKey: `better-auth:verify-email:${token}`,
        template: "verifyEmail",
      });
    },
  },
  rateLimit: {
    enabled: true,
    max: 100,
    window: 60,
  },
  socialProviders: {
    ...(githubProvider ? { github: githubProvider } : {}),
    ...(googleProvider ? { google: googleProvider } : {}),
  },
  user: {
    fields: {
      name: "name",
      emailVerified: "emailVerified",
      image: "image",
    },
    additionalFields: userAdditionalFields,
  },
  plugins: [
    organization({
      // Any authenticated user can create one organization (their workspace).
      allowUserToCreateOrganization: true,
      sendInvitationEmail: async ({
        email,
        invitation,
        organization,
        inviter,
      }) => {
        const inviteUrl = `${validatedBaseUrl}/invite/worker/${invitation.id}`;
        try {
          await sendTransactionalEmail({
            email,
            template: "invite",
            idempotencyKey: `org-invite:${organization.id}:${email}`,
            dataVariables: {
              appUrl: validatedBaseUrl,
              clientCompany: organization.name,
              clientName: inviter.user.name,
              inviteUrl,
              recipientEmail: email,
            },
          });
        } catch (error) {
          console.error("Failed to send organization invitation email", error);
        }
      },
    }),
    tanstackStartCookies(),
    lastLoginMethod(),
  ],
  trustedOrigins: getTrustedOrigins(),
});

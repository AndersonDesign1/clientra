import { createHmac } from "node:crypto";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { tanstackStartCookies } from "better-auth/tanstack-start";
import { db } from "@/db/client";
import { loadEnvFiles } from "@/db/load-env";
import { accounts, sessions, users, verifications } from "@/db/schema";
import { sendTransactionalEmail } from "@/server/email/loop";

loadEnvFiles();

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
    disableImplicitSignUp: true,
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

export const auth = betterAuth({
  advanced: {
    useSecureCookies: process.env.NODE_ENV === "production",
  },
  baseURL: process.env.BETTER_AUTH_URL,
  database: drizzleAdapter(db, {
    provider: "sqlite",
    schema: {
      account: accounts,
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
    additionalFields: {
      role: {
        type: "string",
        defaultValue: "client",
      },
    },
  },
  plugins: [tanstackStartCookies()],
  trustedOrigins: getTrustedOrigins(),
});

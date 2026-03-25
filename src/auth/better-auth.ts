import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { tanstackStartCookies } from "better-auth/tanstack-start";
import { db } from "@/db/client";
import { loadEnvFiles } from "@/db/load-env";
import { accounts, sessions, users, verifications } from "@/db/schema";

loadEnvFiles();

function normalizeCredential(value: string | undefined) {
  const normalized = value?.trim();
  return normalized ? normalized : undefined;
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
});

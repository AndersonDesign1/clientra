"use client";

import { Link, useRouter } from "@tanstack/react-router";
import { useState } from "react";
import { AuthShell } from "@/components/auth/auth-shell";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldSeparator,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { authClient } from "@/lib/auth-client";

function GoogleIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24">
      <path
        d="M21.35 11.1h-9.17v2.98h5.26c-.23 1.48-1.69 4.33-5.26 4.33-3.17 0-5.75-2.63-5.75-5.87s2.58-5.87 5.75-5.87c1.8 0 3.01.77 3.7 1.43l2.53-2.46C16.79 4.14 14.72 3 12.18 3 7.2 3 3.18 7.05 3.18 12.04s4.02 9.04 9 9.04c5.2 0 8.64-3.64 8.64-8.77 0-.59-.06-1.03-.17-1.21Z"
        fill="currentColor"
      />
    </svg>
  );
}

function GitHubIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24">
      <path
        d="M12 .5a12 12 0 0 0-3.79 23.39c.6.11.82-.26.82-.58v-2.03c-3.35.73-4.06-1.42-4.06-1.42a3.2 3.2 0 0 0-1.35-1.76c-1.11-.77.08-.75.08-.75a2.54 2.54 0 0 1 1.85 1.25 2.58 2.58 0 0 0 3.52 1 2.58 2.58 0 0 1 .77-1.62c-2.67-.31-5.47-1.36-5.47-6.02a4.73 4.73 0 0 1 1.24-3.27 4.4 4.4 0 0 1 .12-3.23s1.01-.33 3.3 1.25a11.17 11.17 0 0 1 6 0c2.28-1.58 3.29-1.25 3.29-1.25a4.4 4.4 0 0 1 .12 3.23 4.72 4.72 0 0 1 1.23 3.27c0 4.67-2.8 5.7-5.48 6a2.89 2.89 0 0 1 .83 2.24v3.31c0 .32.21.7.83.58A12 12 0 0 0 12 .5Z"
        fill="currentColor"
      />
    </svg>
  );
}

function getErrorMessage(result: {
  error?: { message?: string | null } | null;
}) {
  return result.error?.message ?? "Something went wrong. Please try again.";
}

export function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeProvider, setActiveProvider] = useState<string | null>(null);

  async function handleEmailSignIn(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      const result = await authClient.signIn.email({
        callbackURL: "/",
        email,
        password,
      });

      if (result.error) {
        setError(getErrorMessage(result));
        return;
      }

      await router.navigate({ to: "/" });
    } catch (error) {
      setError(
        error instanceof Error && error.message
          ? error.message
          : "Something went wrong. Please try again."
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleSocialSignIn(provider: "github" | "google") {
    setError(null);
    setActiveProvider(provider);
    try {
      const result = await authClient.signIn.social({
        callbackURL: "/",
        provider,
      });

      if (result.error) {
        setActiveProvider(null);
        setError(getErrorMessage(result));
      }
    } catch (error) {
      setActiveProvider(null);
      setError(
        error instanceof Error && error.message
          ? error.message
          : "Unable to start social sign-in."
      );
    }
  }

  return (
    <AuthShell
      asideDescription="Sign in to manage active engagements, track project delivery, and keep clients in a polished, secure workspace."
      asideEyebrow="Sign In"
      asideTitle="Bring your client workspace back into focus."
    >
      <div className="flex flex-col gap-6">
        <Card className="border-white/70 bg-white/90 shadow-[0_24px_70px_rgba(15,23,42,0.08)] backdrop-blur">
          <CardHeader className="space-y-2 text-center">
            <CardTitle className="text-2xl">Welcome back</CardTitle>
            <CardDescription className="text-balance text-slate-600">
              Admins can sign in with email, Google, or GitHub. Clients should
              continue with their invite link.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleEmailSignIn}>
              <FieldGroup>
                <Field>
                  <Button
                    disabled={activeProvider !== null}
                    onClick={() => {
                      handleSocialSignIn("google");
                    }}
                    type="button"
                    variant="outline"
                  >
                    <GoogleIcon />
                    {activeProvider === "google"
                      ? "Connecting to Google..."
                      : "Continue with Google"}
                  </Button>
                  <Button
                    disabled={activeProvider !== null}
                    onClick={() => {
                      handleSocialSignIn("github");
                    }}
                    type="button"
                    variant="outline"
                  >
                    <GitHubIcon />
                    {activeProvider === "github"
                      ? "Connecting to GitHub..."
                      : "Continue with GitHub"}
                  </Button>
                </Field>
                <FieldSeparator className="*:data-[slot=field-separator-content]:bg-white/90">
                  Or continue with email
                </FieldSeparator>
                <Field>
                  <FieldLabel htmlFor="email">Email</FieldLabel>
                  <Input
                    autoComplete="email"
                    id="email"
                    onChange={(event) => setEmail(event.target.value)}
                    placeholder="hello@clientra.app"
                    required
                    type="email"
                    value={email}
                  />
                </Field>
                <Field>
                  <FieldLabel htmlFor="password">Password</FieldLabel>
                  <Input
                    autoComplete="current-password"
                    id="password"
                    onChange={(event) => setPassword(event.target.value)}
                    placeholder="Enter your password"
                    required
                    type="password"
                    value={password}
                  />
                </Field>
                <FieldError>{error}</FieldError>
                <Field>
                  <Button
                    disabled={isSubmitting || activeProvider !== null}
                    type="submit"
                  >
                    {isSubmitting ? "Signing in..." : "Sign in"}
                  </Button>
                  <FieldDescription className="text-center text-slate-500">
                    Need admin access?{" "}
                    <Link className="font-medium text-slate-900" to="/signup">
                      Create an admin account
                    </Link>
                  </FieldDescription>
                </Field>
              </FieldGroup>
            </form>
          </CardContent>
        </Card>
        <FieldDescription className="px-6 text-center text-slate-500">
          Client access is invite-only. If a workspace owner invited you, use
          the secure link from your email to finish setup.
        </FieldDescription>
      </div>
    </AuthShell>
  );
}

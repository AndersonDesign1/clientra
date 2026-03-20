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
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";

function getThrownErrorMessage(error: unknown) {
  if (error instanceof Error && error.message) {
    return error.message;
  }

  return "Unable to create your account right now.";
}

export function AdminSignupForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch("/api/auth/admin-signup", {
        body: JSON.stringify({ email, name, password }),
        headers: {
          "content-type": "application/json",
        },
        method: "POST",
      });
      const data = (await response.json().catch(() => null)) as {
        error?: string;
      } | null;

      if (!response.ok) {
        setError(data?.error ?? "Unable to create your account right now.");
        return;
      }

      await router.navigate({ to: "/dashboard" });
    } catch (error) {
      setError(getThrownErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <AuthShell
      asideDescription="Create the admin account that will own your workspace, send client invites, and manage the delivery side of every project."
      asideEyebrow="Admin Signup"
      asideTitle="Start the workspace your clients will trust."
    >
      <Card className="border-white/70 bg-white/90 shadow-[0_24px_70px_rgba(15,23,42,0.08)] backdrop-blur">
        <CardHeader className="space-y-2 text-center">
          <CardTitle className="text-2xl">Create an admin account</CardTitle>
          <CardDescription className="text-balance text-slate-600">
            Public signup is reserved for workspace owners. Clients join later
            through invite-only access.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit}>
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="name">Full name</FieldLabel>
                <Input
                  autoComplete="name"
                  id="name"
                  onChange={(event) => setName(event.target.value)}
                  placeholder="Jordan Lee"
                  required
                  value={name}
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="email">Work email</FieldLabel>
                <Input
                  autoComplete="email"
                  id="email"
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="you@studio.com"
                  required
                  type="email"
                  value={email}
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="password">Password</FieldLabel>
                <Input
                  autoComplete="new-password"
                  id="password"
                  minLength={8}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="Create a secure password"
                  required
                  type="password"
                  value={password}
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="confirm-password">
                  Confirm password
                </FieldLabel>
                <Input
                  autoComplete="new-password"
                  id="confirm-password"
                  minLength={8}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  placeholder="Repeat your password"
                  required
                  type="password"
                  value={confirmPassword}
                />
              </Field>
              <FieldError>{error}</FieldError>
              <Field>
                <Button disabled={isSubmitting} type="submit">
                  {isSubmitting
                    ? "Creating account..."
                    : "Create admin account"}
                </Button>
                <FieldDescription className="text-center text-slate-500">
                  Already have access?{" "}
                  <Link className="font-medium text-slate-900" to="/login">
                    Sign in instead
                  </Link>
                </FieldDescription>
              </Field>
            </FieldGroup>
          </form>
        </CardContent>
      </Card>
    </AuthShell>
  );
}

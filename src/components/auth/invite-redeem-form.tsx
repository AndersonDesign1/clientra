"use client";

import { useRouter } from "@tanstack/react-router";
import { useEffect, useState } from "react";
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

interface InvitePreview {
  email: string;
  expiresAt: string;
}

export function InviteRedeemForm({ token }: { token: string }) {
  const router = useRouter();
  const [invite, setInvite] = useState<InvitePreview | null>(null);
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoadingInvite, setIsLoadingInvite] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    let isCancelled = false;

    async function loadInvite() {
      setIsLoadingInvite(true);
      setError(null);

      const response = await fetch(
        `/api/invites/redeem?token=${encodeURIComponent(token)}`
      );
      const data = (await response.json().catch(() => null)) as {
        email?: string;
        error?: string;
        expiresAt?: string;
      } | null;

      if (isCancelled) {
        return;
      }

      if (!(response.ok && data?.email && data?.expiresAt)) {
        setError(data?.error ?? "This invite is invalid or has expired.");
        setIsLoadingInvite(false);
        return;
      }

      setInvite({ email: data.email, expiresAt: data.expiresAt });
      setEmail(data.email);
      setIsLoadingInvite(false);
    }

    loadInvite().catch(() => {
      if (!isCancelled) {
        setError("We could not load this invite.");
        setIsLoadingInvite(false);
      }
    });

    return () => {
      isCancelled = true;
    };
  }, [token]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setError(null);
    try {
      const response = await fetch("/api/invites/redeem", {
        body: JSON.stringify({ email, name, password, token }),
        headers: {
          "content-type": "application/json",
        },
        method: "POST",
      });

      const data = (await response.json().catch(() => null)) as {
        error?: string;
      } | null;

      if (!response.ok) {
        setError(data?.error ?? "Unable to accept this invite.");
        return;
      }

      await router.navigate({ to: "/portal" });
    } catch (error) {
      setError(
        error instanceof Error && error.message
          ? error.message
          : "Network error accepting invite."
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <AuthShell
      asideDescription="Finish your account setup and you’ll land straight in your Clientra portal with the projects your team invited you to review."
      asideEyebrow="Invite Access"
      asideTitle="Your client portal is almost ready."
    >
      <Card className="border-white/70 bg-white/90 shadow-[0_24px_70px_rgba(15,23,42,0.08)] backdrop-blur">
        <CardHeader className="space-y-2 text-center">
          <CardTitle className="text-2xl">Accept invite</CardTitle>
          <CardDescription className="text-balance text-slate-600">
            Set your password once and we’ll connect you to the right client
            workspace.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoadingInvite ? (
            <div className="rounded-2xl border border-slate-200 border-dashed bg-slate-50 px-4 py-10 text-center text-slate-500 text-sm">
              Validating your invite...
            </div>
          ) : null}
          {!isLoadingInvite && error && !invite ? (
            <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-6 text-rose-700 text-sm">
              {error}
            </div>
          ) : null}
          {!isLoadingInvite && invite ? (
            <form onSubmit={handleSubmit}>
              <FieldGroup>
                <Field>
                  <FieldLabel htmlFor="invite-email">Invited email</FieldLabel>
                  <Input
                    id="invite-email"
                    onChange={(event) => setEmail(event.target.value)}
                    readOnly={Boolean(invite.email)}
                    required
                    type="email"
                    value={email}
                  />
                  <FieldDescription>
                    This invite expires on{" "}
                    {new Date(invite.expiresAt).toLocaleString()}.
                  </FieldDescription>
                </Field>
                <Field>
                  <FieldLabel htmlFor="invite-name">Full name</FieldLabel>
                  <Input
                    autoComplete="name"
                    id="invite-name"
                    onChange={(event) => setName(event.target.value)}
                    placeholder="Your name"
                    required
                    value={name}
                  />
                </Field>
                <Field>
                  <FieldLabel htmlFor="invite-password">
                    Create password
                  </FieldLabel>
                  <Input
                    autoComplete="new-password"
                    id="invite-password"
                    minLength={8}
                    onChange={(event) => setPassword(event.target.value)}
                    placeholder="Minimum 8 characters"
                    required
                    type="password"
                    value={password}
                  />
                </Field>
                <FieldError>{error}</FieldError>
                <Field>
                  <Button disabled={isSubmitting} type="submit">
                    {isSubmitting ? "Activating portal..." : "Accept invite"}
                  </Button>
                </Field>
              </FieldGroup>
            </form>
          ) : null}
        </CardContent>
      </Card>
    </AuthShell>
  );
}

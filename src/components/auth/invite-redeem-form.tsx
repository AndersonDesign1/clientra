"use client";

import { useRouter } from "@tanstack/react-router";
import { useReducer } from "react";
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
  expiresAt: string;
  maskedEmail: string;
}

interface InviteRedeemState {
  email: string;
  error: string | null;
  isSubmitting: boolean;
  name: string;
  password: string;
}

type InviteRedeemAction =
  | { type: "set-email"; value: string }
  | { type: "set-name"; value: string }
  | { type: "set-password"; value: string }
  | { type: "set-error"; value: string | null }
  | { type: "set-submitting"; value: boolean };

function inviteRedeemReducer(
  state: InviteRedeemState,
  action: InviteRedeemAction
) {
  switch (action.type) {
    case "set-email":
      return { ...state, email: action.value };
    case "set-error":
      return { ...state, error: action.value };
    case "set-name":
      return { ...state, name: action.value };
    case "set-password":
      return { ...state, password: action.value };
    case "set-submitting":
      return { ...state, isSubmitting: action.value };
    default:
      return state;
  }
}

export function InviteRedeemForm({
  initialInvite,
  token,
}: {
  initialInvite: InvitePreview | null;
  token: string;
}) {
  const router = useRouter();
  const invite = initialInvite;
  const [state, dispatch] = useReducer(inviteRedeemReducer, {
    email: "",
    error: initialInvite ? null : "This invite is invalid or has expired.",
    isSubmitting: false,
    name: "",
    password: "",
  });

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    dispatch({ type: "set-submitting", value: true });
    dispatch({ type: "set-error", value: null });
    try {
      const response = await fetch("/api/invites/redeem", {
        body: JSON.stringify({
          email: state.email,
          name: state.name,
          password: state.password,
          token,
        }),
        headers: {
          "content-type": "application/json",
        },
        method: "POST",
      });

      const data = (await response.json().catch(() => null)) as {
        error?: string;
      } | null;

      if (!response.ok) {
        dispatch({
          type: "set-error",
          value: data?.error ?? "Unable to accept this invite.",
        });
        return;
      }

      await router.navigate({ to: "/portal" });
    } catch (error) {
      dispatch({
        type: "set-error",
        value:
          error instanceof Error && error.message
            ? error.message
            : "Network error accepting invite.",
      });
    } finally {
      dispatch({ type: "set-submitting", value: false });
    }
  }

  return (
    <AuthShell
      asideDescription="Finish your account setup and you’ll land straight in your Clientra portal with the projects your team invited you to review."
      asideTitle="Your client portal is almost ready."
    >
      <Card className="rounded-lg border-slate-200 bg-white shadow-none">
        <CardHeader className="space-y-2">
          <CardTitle className="text-2xl">Accept invite</CardTitle>
          <CardDescription className="text-slate-600">
            Set your password once and we’ll connect you to the right client
            workspace.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {state.error && !invite ? (
            <div className="rounded-md border border-rose-200 bg-rose-50 px-4 py-6 text-rose-700 text-sm">
              {state.error}
            </div>
          ) : null}
          {invite ? (
            <form onSubmit={handleSubmit}>
              <FieldGroup>
                <Field>
                  <FieldLabel htmlFor="invite-email">Invited email</FieldLabel>
                  <Input
                    autoComplete="email"
                    id="invite-email"
                    onChange={(event) =>
                      dispatch({ type: "set-email", value: event.target.value })
                    }
                    required
                    type="email"
                    value={state.email}
                  />
                  <FieldDescription>
                    Use the invited email address matching{" "}
                    <span className="font-medium text-slate-700">
                      {invite.maskedEmail}
                    </span>
                    . This invite expires on{" "}
                    {new Date(invite.expiresAt).toLocaleString()}.
                  </FieldDescription>
                </Field>
                <Field>
                  <FieldLabel htmlFor="invite-name">Full name</FieldLabel>
                  <Input
                    autoComplete="name"
                    id="invite-name"
                    onChange={(event) =>
                      dispatch({ type: "set-name", value: event.target.value })
                    }
                    placeholder="Your name"
                    required
                    value={state.name}
                  />
                </Field>
                <Field>
                  <FieldLabel htmlFor="invite-password">
                    Create password
                  </FieldLabel>
                  <Input
                    autoComplete="new-password"
                    id="invite-password"
                    minLength={12}
                    onChange={(event) =>
                      dispatch({
                        type: "set-password",
                        value: event.target.value,
                      })
                    }
                    placeholder="Minimum 12 characters"
                    required
                    type="password"
                    value={state.password}
                  />
                </Field>
                <FieldError>{state.error}</FieldError>
                <Field>
                  <Button disabled={state.isSubmitting} type="submit">
                    {state.isSubmitting
                      ? "Activating portal..."
                      : "Accept invite"}
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

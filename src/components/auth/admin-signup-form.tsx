"use client";

import { Link, useRouter } from "@tanstack/react-router";
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

function getThrownErrorMessage(error: unknown) {
  if (error instanceof Error && error.message) {
    return error.message;
  }

  return "Unable to create your account right now.";
}

interface AdminSignupState {
  confirmPassword: string;
  email: string;
  error: string | null;
  isSubmitting: boolean;
  name: string;
  password: string;
}

type AdminSignupAction =
  | { type: "set-confirm-password"; value: string }
  | { type: "set-email"; value: string }
  | { type: "set-error"; value: string | null }
  | { type: "set-name"; value: string }
  | { type: "set-password"; value: string }
  | { type: "set-submitting"; value: boolean };

function adminSignupReducer(
  state: AdminSignupState,
  action: AdminSignupAction
) {
  switch (action.type) {
    case "set-confirm-password":
      return { ...state, confirmPassword: action.value };
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

export function AdminSignupForm({
  isBootstrapOpen,
}: {
  isBootstrapOpen: boolean;
}) {
  const router = useRouter();
  const [state, dispatch] = useReducer(adminSignupReducer, {
    confirmPassword: "",
    email: "",
    error: null,
    isSubmitting: false,
    name: "",
    password: "",
  });

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    dispatch({ type: "set-error", value: null });

    if (!isBootstrapOpen) {
      dispatch({
        type: "set-error",
        value:
          "Admin signup is closed for this workspace. Sign in with an existing admin account.",
      });
      return;
    }

    if (state.password !== state.confirmPassword) {
      dispatch({ type: "set-error", value: "Passwords do not match." });
      return;
    }

    dispatch({ type: "set-submitting", value: true });
    try {
      const response = await fetch("/api/auth/admin-signup", {
        body: JSON.stringify({
          email: state.email,
          name: state.name,
          password: state.password,
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
          value: data?.error ?? "Unable to create your account right now.",
        });
        return;
      }

      await router.navigate({ to: "/dashboard" });
    } catch (error) {
      dispatch({ type: "set-error", value: getThrownErrorMessage(error) });
    } finally {
      dispatch({ type: "set-submitting", value: false });
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
          {isBootstrapOpen ? null : (
            <div className="mb-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-4 text-amber-900 text-sm">
              This workspace already has an admin account. Use the sign-in page
              instead of creating another public admin.
            </div>
          )}
          <form onSubmit={handleSubmit}>
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="name">Full name</FieldLabel>
                <Input
                  autoComplete="name"
                  id="name"
                  onChange={(event) =>
                    dispatch({ type: "set-name", value: event.target.value })
                  }
                  placeholder="Jordan Lee"
                  required
                  value={state.name}
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="email">Work email</FieldLabel>
                <Input
                  autoComplete="email"
                  id="email"
                  onChange={(event) =>
                    dispatch({ type: "set-email", value: event.target.value })
                  }
                  placeholder="you@studio.com"
                  required
                  type="email"
                  value={state.email}
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="password">Password</FieldLabel>
                <Input
                  autoComplete="new-password"
                  id="password"
                  minLength={12}
                  onChange={(event) =>
                    dispatch({
                      type: "set-password",
                      value: event.target.value,
                    })
                  }
                  placeholder="Create a secure password"
                  required
                  type="password"
                  value={state.password}
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="confirm-password">
                  Confirm password
                </FieldLabel>
                <Input
                  autoComplete="new-password"
                  id="confirm-password"
                  minLength={12}
                  onChange={(event) =>
                    dispatch({
                      type: "set-confirm-password",
                      value: event.target.value,
                    })
                  }
                  placeholder="Repeat your password"
                  required
                  type="password"
                  value={state.confirmPassword}
                />
              </Field>
              <FieldError>{state.error}</FieldError>
              <Field>
                <Button
                  disabled={!isBootstrapOpen || state.isSubmitting}
                  type="submit"
                >
                  {state.isSubmitting
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

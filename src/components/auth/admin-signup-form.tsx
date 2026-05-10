"use client";

import { Link, useRouter } from "@tanstack/react-router";
import { useReducer } from "react";
import { AuthShell } from "@/components/auth/auth-shell";
import { ClientAccessDialog } from "@/components/auth/client-access-dialog";
import { Button } from "@/components/ui/button";
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

export function AdminSignupForm() {
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
      asideTitle="Start the workspace your clients will trust."
    >
      <div className="mx-auto flex w-full max-w-sm flex-col gap-8 lg:mx-0">
        <div className="text-center lg:text-left">
          <h2 className="font-bold text-3xl tracking-tight">
            Create an admin account
          </h2>
        </div>

        <form onSubmit={handleSubmit}>
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="name">Full name</FieldLabel>
              <Input
                autoComplete="name"
                className="h-10 px-3 py-2 text-sm"
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
                className="h-10 px-3 py-2 text-sm"
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
                className="h-10 px-3 py-2 text-sm"
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
                className="h-10 px-3 py-2 text-sm"
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
                className="mt-2 h-10 w-full px-4 text-sm"
                disabled={state.isSubmitting}
                type="submit"
              >
                {state.isSubmitting
                  ? "Creating account..."
                  : "Create admin account"}
              </Button>
              <FieldDescription className="mt-2 text-center text-slate-500">
                Already have access?{" "}
                <Link className="font-medium text-slate-900" to="/login">
                  Sign in instead
                </Link>
              </FieldDescription>
            </Field>
          </FieldGroup>
        </form>

        <FieldDescription className="text-center text-slate-500">
          <ClientAccessDialog />
        </FieldDescription>
      </div>
    </AuthShell>
  );
}

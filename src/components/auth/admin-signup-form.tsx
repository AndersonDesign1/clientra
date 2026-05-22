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
      <div className="mx-auto flex w-full max-w-sm flex-col gap-6 font-sans lg:mx-0">
        <div
          className="animate-slide-up-fade text-center lg:text-left"
          style={{ animationDelay: "50ms" }}
        >
          <h2 className="font-bold text-3xl text-[#08361f] tracking-tight dark:text-white">
            Create an admin account
          </h2>
          <p className="mt-1.5 text-muted-foreground text-xs">
            Set up your administrator profile to claim your workspace
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <FieldGroup>
            <Field
              className="animate-slide-up-fade"
              style={{ animationDelay: "100ms" }}
            >
              <FieldLabel
                className="text-slate-700 dark:text-slate-300"
                htmlFor="name"
              >
                Full name
              </FieldLabel>
              <Input
                autoComplete="name"
                className="h-10 border-border bg-card px-3.5 py-2 text-sm transition-all duration-150 focus-visible:border-primary focus-visible:ring-primary/20"
                id="name"
                onChange={(event) =>
                  dispatch({ type: "set-name", value: event.target.value })
                }
                placeholder="Jordan Lee"
                required
                value={state.name}
              />
            </Field>
            <Field
              className="animate-slide-up-fade"
              style={{ animationDelay: "150ms" }}
            >
              <FieldLabel
                className="text-slate-700 dark:text-slate-300"
                htmlFor="email"
              >
                Work email
              </FieldLabel>
              <Input
                autoComplete="email"
                className="h-10 border-border bg-card px-3.5 py-2 text-sm transition-all duration-150 focus-visible:border-primary focus-visible:ring-primary/20"
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
            <Field
              className="animate-slide-up-fade"
              style={{ animationDelay: "200ms" }}
            >
              <FieldLabel
                className="text-slate-700 dark:text-slate-300"
                htmlFor="password"
              >
                Password
              </FieldLabel>
              <Input
                autoComplete="new-password"
                className="h-10 border-border bg-card px-3.5 py-2 text-sm transition-all duration-150 focus-visible:border-primary focus-visible:ring-primary/20"
                id="password"
                minLength={12}
                onChange={(event) =>
                  dispatch({
                    type: "set-password",
                    value: event.target.value,
                  })
                }
                placeholder="Create a secure password (min 12 chars)"
                required
                type="password"
                value={state.password}
              />
            </Field>
            <Field
              className="animate-slide-up-fade"
              style={{ animationDelay: "250ms" }}
            >
              <FieldLabel
                className="text-slate-700 dark:text-slate-300"
                htmlFor="confirm-password"
              >
                Confirm password
              </FieldLabel>
              <Input
                autoComplete="new-password"
                className="h-10 border-border bg-card px-3.5 py-2 text-sm transition-all duration-150 focus-visible:border-primary focus-visible:ring-primary/20"
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
            {state.error && (
              <FieldError className="animate-slide-up-fade">
                {state.error}
              </FieldError>
            )}
            <Field
              className="animate-slide-up-fade"
              style={{ animationDelay: "300ms" }}
            >
              <Button
                className="mt-2 h-10 w-full bg-primary px-4 font-semibold text-primary-foreground text-sm shadow-sm transition-all duration-150 hover:bg-primary/90 active:scale-[0.985]"
                disabled={state.isSubmitting}
                type="submit"
              >
                {state.isSubmitting
                  ? "Creating account..."
                  : "Create admin account"}
              </Button>
              <FieldDescription className="mt-3 text-center text-slate-500">
                Already have access?{" "}
                <Link
                  className="font-medium text-slate-900 underline underline-offset-2 transition-colors hover:text-primary dark:text-white"
                  to="/login"
                >
                  Sign in instead
                </Link>
              </FieldDescription>
            </Field>
          </FieldGroup>
        </form>

        <FieldDescription
          className="animate-slide-up-fade text-center text-slate-500"
          style={{ animationDelay: "350ms" }}
        >
          <ClientAccessDialog />
        </FieldDescription>
      </div>
    </AuthShell>
  );
}

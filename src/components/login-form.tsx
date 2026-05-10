"use client";

import { Link, useRouter } from "@tanstack/react-router";
import { useReducer } from "react";
import { AuthShell } from "@/components/auth/auth-shell";
import { ClientAccessDialog } from "@/components/auth/client-access-dialog";
import { GitHubIcon, GoogleIcon } from "@/components/auth/social-icons";
import { Button } from "@/components/ui/button";
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

function getErrorMessage(result: {
  error?: { message?: string | null } | null;
}) {
  return result.error?.message ?? "Something went wrong. Please try again.";
}

interface LoginState {
  activeProvider: "github" | "google" | null;
  email: string;
  error: string | null;
  isSubmitting: boolean;
  password: string;
}

type LoginAction =
  | { type: "set-active-provider"; value: LoginState["activeProvider"] }
  | { type: "set-email"; value: string }
  | { type: "set-error"; value: string | null }
  | { type: "set-password"; value: string }
  | { type: "set-submitting"; value: boolean };

function loginReducer(state: LoginState, action: LoginAction): LoginState {
  switch (action.type) {
    case "set-active-provider":
      return { ...state, activeProvider: action.value };
    case "set-email":
      return { ...state, email: action.value };
    case "set-error":
      return { ...state, error: action.value };
    case "set-password":
      return { ...state, password: action.value };
    case "set-submitting":
      return { ...state, isSubmitting: action.value };
    default:
      return state;
  }
}

export function LoginForm() {
  const router = useRouter();
  const lastMethod = authClient.getLastUsedLoginMethod();
  const [state, dispatch] = useReducer(loginReducer, {
    activeProvider: null,
    email: "",
    error: null,
    isSubmitting: false,
    password: "",
  });

  async function handleEmailSignIn(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    dispatch({ type: "set-error", value: null });
    dispatch({ type: "set-submitting", value: true });
    try {
      const result = await authClient.signIn.email({
        callbackURL: "/",
        email: state.email,
        password: state.password,
      });

      if (result.error) {
        dispatch({ type: "set-error", value: getErrorMessage(result) });
        return;
      }

      await router.navigate({ to: "/" });
    } catch (error) {
      dispatch({
        type: "set-error",
        value:
          error instanceof Error && error.message
            ? error.message
            : "Something went wrong. Please try again.",
      });
    } finally {
      dispatch({ type: "set-submitting", value: false });
    }
  }

  async function handleSocialSignIn(provider: "github" | "google") {
    dispatch({ type: "set-error", value: null });
    dispatch({ type: "set-active-provider", value: provider });
    try {
      const result = await authClient.signIn.social({
        callbackURL: "/",
        provider,
      });

      if (result.error) {
        dispatch({ type: "set-active-provider", value: null });
        dispatch({ type: "set-error", value: getErrorMessage(result) });
      }
    } catch (error) {
      dispatch({ type: "set-active-provider", value: null });
      dispatch({
        type: "set-error",
        value:
          error instanceof Error && error.message
            ? error.message
            : "Unable to start social sign-in.",
      });
    }
  }

  return (
    <AuthShell
      asideDescription="Sign in to manage active engagements, track project delivery, and keep clients in a polished, secure workspace."
      asideTitle="Bring your client workspace back into focus."
    >
      <div className="mx-auto flex w-full max-w-sm flex-col gap-8 lg:mx-0">
        <div className="text-center lg:text-left">
          <h2 className="font-bold text-3xl tracking-tight">Welcome back</h2>
        </div>

        <form onSubmit={handleEmailSignIn}>
          <FieldGroup>
            <Field>
              <div className="grid grid-cols-2 gap-4">
                <Button
                  className="relative h-10 w-full px-4 font-medium text-sm"
                  disabled={state.activeProvider !== null}
                  onClick={() => {
                    handleSocialSignIn("google");
                  }}
                  type="button"
                  variant="outline"
                >
                  <GoogleIcon />
                  {state.activeProvider === "google"
                    ? "Connecting..."
                    : "Google"}
                  {lastMethod === "google" && (
                    <span className="absolute -top-2 -right-2 rounded-full bg-emerald-100 px-1.5 py-0.5 font-medium text-[10px] text-emerald-700 leading-none">
                      Last used
                    </span>
                  )}
                </Button>
                <Button
                  className="relative h-10 w-full px-4 font-medium text-sm"
                  disabled={state.activeProvider !== null}
                  onClick={() => {
                    handleSocialSignIn("github");
                  }}
                  type="button"
                  variant="outline"
                >
                  <GitHubIcon />
                  {state.activeProvider === "github"
                    ? "Connecting..."
                    : "GitHub"}
                  {lastMethod === "github" && (
                    <span className="absolute -top-2 -right-2 rounded-full bg-emerald-100 px-1.5 py-0.5 font-medium text-[10px] text-emerald-700 leading-none">
                      Last used
                    </span>
                  )}
                </Button>
              </div>
            </Field>
            <FieldSeparator>
              Or continue with email
              {lastMethod === "email" && (
                <span className="ml-2 rounded-full bg-emerald-100 px-1.5 py-0.5 font-medium text-[10px] text-emerald-700 leading-none">
                  Last used
                </span>
              )}
            </FieldSeparator>
            <Field>
              <FieldLabel htmlFor="email">Email</FieldLabel>
              <Input
                autoComplete="email"
                className="h-10 px-3 py-2 text-sm"
                id="email"
                onChange={(event) =>
                  dispatch({ type: "set-email", value: event.target.value })
                }
                placeholder="hello@clientra.app"
                required
                type="email"
                value={state.email}
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="password">Password</FieldLabel>
              <Input
                autoComplete="current-password"
                className="h-10 px-3 py-2 text-sm"
                id="password"
                onChange={(event) =>
                  dispatch({
                    type: "set-password",
                    value: event.target.value,
                  })
                }
                placeholder="Enter your password"
                required
                type="password"
                value={state.password}
              />
            </Field>
            <FieldError>{state.error}</FieldError>
            <Field>
              <Button
                className="mt-2 h-10 w-full px-4 text-sm"
                disabled={state.isSubmitting || state.activeProvider !== null}
                type="submit"
              >
                {state.isSubmitting ? "Signing in..." : "Sign in"}
              </Button>
              <FieldDescription className="mt-2 text-center text-slate-500">
                Need admin access?{" "}
                <Link className="font-medium text-slate-900" to="/signup">
                  Create an admin account
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

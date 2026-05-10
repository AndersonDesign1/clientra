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
  FieldSeparator,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { authClient } from "@/lib/auth-client";

function GoogleIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="mr-2 h-4 w-4">
      <path
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
        fill="#4285F4"
      />
      <path
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        fill="#34A853"
      />
      <path
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
        fill="#FBBC05"
      />
      <path
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
        fill="#EA4335"
      />
      <path d="M1 1h22v22H1z" fill="none" />
    </svg>
  );
}

function GitHubIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="mr-2 h-4 w-4">
      <path
        d="M12 1.27a11 11 0 00-3.48 21.46c.55.1.75-.24.75-.53v-1.89c-3.06.67-3.71-1.47-3.71-1.47-.5-1.27-1.22-1.61-1.22-1.61-1-.68.08-.67.08-.67 1.1.08 1.68 1.13 1.68 1.13.98 1.68 2.57 1.2 3.2.92.1-.71.38-1.2.69-1.48-2.44-.28-5.01-1.22-5.01-5.43 0-1.2.43-2.18 1.13-2.95-.11-.28-.49-1.4.11-2.91 0 0 .92-.3 3.01 1.12a10.48 10.48 0 015.5 0c2.09-1.42 3.01-1.12 3.01-1.12.6 1.51.22 2.63.11 2.91.7.77 1.13 1.75 1.13 2.95 0 4.22-2.58 5.15-5.03 5.43.39.34.74 1.01.74 2.04v3.02c0 .3.2.64.76.53A11 11 0 0012 1.27"
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
      <div className="flex flex-col gap-8 w-full max-w-sm mx-auto lg:mx-0">
        <div className="text-center lg:text-left">
          <h2 className="text-3xl font-bold tracking-tight">Welcome back</h2>
        </div>
        
        <form onSubmit={handleEmailSignIn}>
          <FieldGroup>
            <Field>
              <div className="grid grid-cols-2 gap-4">
                <Button
                  className="w-full h-10 px-4 text-sm font-medium relative"
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
                    <span className="absolute -top-2 -right-2 text-[10px] font-medium bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded-full leading-none">
                      Last used
                    </span>
                  )}
                </Button>
                <Button
                  className="w-full h-10 px-4 text-sm font-medium relative"
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
                    <span className="absolute -top-2 -right-2 text-[10px] font-medium bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded-full leading-none">
                      Last used
                    </span>
                  )}
                </Button>
              </div>
            </Field>
            <FieldSeparator>
              Or continue with email
              {lastMethod === "email" && (
                <span className="ml-2 text-[10px] font-medium bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded-full leading-none">
                  Last used
                </span>
              )}
            </FieldSeparator>
            <Field>
              <FieldLabel htmlFor="email">Email</FieldLabel>
              <Input
                className="h-10 px-3 py-2 text-sm"
                autoComplete="email"
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
                className="h-10 px-3 py-2 text-sm"
                autoComplete="current-password"
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
                className="w-full h-10 px-4 text-sm mt-2"
                disabled={
                  state.isSubmitting || state.activeProvider !== null
                }
                type="submit"
              >
                {state.isSubmitting ? "Signing in..." : "Sign in"}
              </Button>
              <FieldDescription className="text-center text-slate-500 mt-2">
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

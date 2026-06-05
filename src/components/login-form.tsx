"use client";

import { Link, useRouter, useSearch } from "@tanstack/react-router";
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

function getSocialErrorMessage(errorCode: string | null | undefined) {
  if (!errorCode) return null;
  switch (errorCode.toUpperCase()) {
    case "ACCOUNT_LINKING_REQUIRED":
      return "This email is registered with a different login method. Please sign in using your password.";
    case "SIGN_UP_DISABLED":
    case "SIGNIN_FAILED":
    case "SIGN_IN_FAILED":
      return "Sign up is disabled. If you have an invite, please register using the invite link.";
    case "CONFIGURATION_ERROR":
      return "Authentication provider is not configured correctly.";
    default:
      return `Authentication failed: ${errorCode}. Please try again.`;
  }
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
  const search = useSearch({ strict: false }) as { error?: string };
  const urlError = search.error;
  const initialError = getSocialErrorMessage(urlError);

  const lastMethod = authClient.getLastUsedLoginMethod();
  const [state, dispatch] = useReducer(loginReducer, {
    activeProvider: null,
    email: "",
    error: initialError,
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
        errorCallbackURL: "/login",
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
      <div className="mx-auto flex w-full max-w-sm flex-col gap-6 font-sans lg:mx-0">
        <div
          className="animate-slide-up-fade text-center lg:text-left"
          style={{ animationDelay: "50ms" }}
        >
          <h2 className="font-bold text-3xl text-[#08361f] tracking-tight dark:text-white">
            Welcome back
          </h2>
          <p className="mt-1.5 text-muted-foreground text-xs">
            Enter your details below to access your workspace
          </p>
        </div>

        <form onSubmit={handleEmailSignIn}>
          <FieldGroup>
            <Field
              className="animate-slide-up-fade"
              style={{ animationDelay: "100ms" }}
            >
              <div className="grid grid-cols-2 gap-3.5">
                <Button
                  className="relative h-10 w-full border-border bg-card px-4 font-medium text-sm shadow-xs transition-transform duration-100 hover:scale-[1.01] hover:bg-accent hover:text-accent-foreground active:scale-[0.99]"
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
                    <span className="absolute -top-2 -right-1.5 rounded-full bg-emerald-100 px-1.5 py-0.5 font-medium text-[9px] text-emerald-700 leading-none">
                      Last used
                    </span>
                  )}
                </Button>
                <Button
                  className="relative h-10 w-full border-border bg-card px-4 font-medium text-sm shadow-xs transition-transform duration-100 hover:scale-[1.01] hover:bg-accent hover:text-accent-foreground active:scale-[0.99]"
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
                    <span className="absolute -top-2 -right-1.5 rounded-full bg-emerald-100 px-1.5 py-0.5 font-medium text-[9px] text-emerald-700 leading-none">
                      Last used
                    </span>
                  )}
                </Button>
              </div>
            </Field>
            <FieldSeparator
              className="animate-slide-up-fade"
              style={{ animationDelay: "150ms" }}
            >
              Or continue with email
              {lastMethod === "email" && (
                <span className="ml-2 rounded-full bg-emerald-100 px-1.5 py-0.5 font-medium text-[9px] text-emerald-700 leading-none">
                  Last used
                </span>
              )}
            </FieldSeparator>
            <Field
              className="animate-slide-up-fade"
              style={{ animationDelay: "200ms" }}
            >
              <FieldLabel
                className="text-slate-700 dark:text-slate-300"
                htmlFor="email"
              >
                Email
              </FieldLabel>
              <Input
                autoComplete="email"
                className="h-10 border-border bg-card px-3.5 py-2 text-sm transition-all duration-150 focus-visible:border-primary focus-visible:ring-primary/20"
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
            <Field
              className="animate-slide-up-fade"
              style={{ animationDelay: "250ms" }}
            >
              <FieldLabel
                className="text-slate-700 dark:text-slate-300"
                htmlFor="password"
              >
                Password
              </FieldLabel>
              <Input
                autoComplete="current-password"
                className="h-10 border-border bg-card px-3.5 py-2 text-sm transition-all duration-150 focus-visible:border-primary focus-visible:ring-primary/20"
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
                disabled={state.isSubmitting || state.activeProvider !== null}
                type="submit"
              >
                {state.isSubmitting ? "Signing in..." : "Sign in"}
              </Button>
              <FieldDescription className="mt-3 text-center text-slate-500">
                Need an account?{" "}
                <Link
                  className="font-medium text-slate-900 underline underline-offset-2 transition-colors hover:text-primary dark:text-white"
                  to="/signup"
                >
                  Create one here
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

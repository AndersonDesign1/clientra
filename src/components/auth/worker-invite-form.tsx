"use client";

import { Link, useRouter } from "@tanstack/react-router";
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
import { authClient } from "@/lib/auth-client";

interface InvitationData {
  email: string;
  id: string;
  inviterEmail: string;
  organizationName: string;
  organizationSlug: string;
  role: string;
}

const handleSignOut = async () => {
  await authClient.signOut();
  window.location.reload();
};

export function WorkerInviteForm({ token }: { token: string }) {
  const router = useRouter();
  const [invitation, setInvitation] = useState<InvitationData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [sessionUser, setSessionUser] = useState<any>(null);

  // Fetch invitation details and current session
  useEffect(() => {
    async function loadData() {
      try {
        const [invRes, sessRes] = await Promise.all([
          authClient.organization.getInvitation({
            query: { id: token },
          }),
          authClient.getSession(),
        ]);

        if (invRes.error) {
          setError(
            invRes.error.message ?? "This invitation is invalid or has expired."
          );
        } else if (invRes.data) {
          setInvitation(invRes.data as any);
        }

        if (sessRes.data?.user) {
          setSessionUser(sessRes.data.user);
        }
      } catch (err) {
        setError("Failed to load invitation details.");
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [token]);

  const handleAccept = async () => {
    setIsSubmitting(true);
    setError(null);
    try {
      const { error: acceptError } =
        await authClient.organization.acceptInvitation({
          invitationId: token,
        });

      if (acceptError) {
        setError(acceptError.message ?? "Failed to accept the invitation.");
        return;
      }

      await router.navigate({ to: "/dashboard" });
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "An unexpected error occurred."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <AuthShell
        asideDescription="Joining a workspace allows you to collaborate with your team, manage clients, and track delivery across all projects."
        asideTitle="Setting up your team workspace..."
      >
        <Card className="rounded-lg shadow-none">
          <CardContent className="pt-6 text-center text-slate-500 text-sm">
            Loading invitation details...
          </CardContent>
        </Card>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      asideDescription="Joining a workspace allows you to collaborate on projects, manage client deliverables, and align with your team in one polished home."
      asideTitle="Collaborate with your team."
    >
      <Card className="rounded-lg shadow-none">
        <CardHeader className="space-y-2">
          <CardTitle className="text-2xl">Join Workspace</CardTitle>
          <CardDescription className="text-slate-600">
            {invitation
              ? `You've been invited by ${invitation.inviterEmail} to join their workspace.`
              : "Accept your invitation to get started."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {error ? (
            <div className="space-y-4">
              <div className="rounded-md border border-rose-200 bg-rose-50 px-4 py-4 text-rose-700 text-sm">
                {error}
              </div>
              <Button
                className="h-10 w-full bg-slate-900 font-semibold text-sm text-white"
                onClick={() => router.navigate({ to: "/login" })}
              >
                Go to login
              </Button>
            </div>
          ) : invitation ? (
            <div className="space-y-6">
              <div className="rounded-xl border border-emerald-100 bg-emerald-50/50 p-5 dark:border-emerald-950/20 dark:bg-emerald-950/10">
                <div className="text-muted-foreground text-xs uppercase tracking-wider">
                  Workspace
                </div>
                <div className="mt-1 font-bold text-emerald-900 text-xl dark:text-emerald-100">
                  {invitation.organizationName}
                </div>
                <div className="mt-2 text-slate-600 text-xs">
                  Role:{" "}
                  <span className="font-semibold text-slate-800 dark:text-slate-200">
                    {invitation.role}
                  </span>
                </div>
                <div className="mt-1 text-slate-600 text-xs">
                  Invited Email:{" "}
                  <span className="font-semibold text-slate-800 dark:text-slate-200">
                    {invitation.email}
                  </span>
                </div>
              </div>

              {sessionUser ? (
                sessionUser.email.toLowerCase() ===
                invitation.email.toLowerCase() ? (
                  <div className="space-y-3">
                    <Button
                      className="h-10 w-full bg-primary px-4 font-semibold text-primary-foreground text-sm shadow-sm transition-all duration-150 hover:bg-primary/90"
                      disabled={isSubmitting}
                      onClick={handleAccept}
                    >
                      {isSubmitting
                        ? "Joining workspace..."
                        : "Accept invitation & join"}
                    </Button>
                    <div className="text-center text-slate-500 text-xs">
                      Logged in as {sessionUser.email}
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="rounded-md border border-amber-200 bg-amber-50 p-4 text-amber-800 text-xs leading-relaxed">
                      You are currently logged in as{" "}
                      <span className="font-semibold">{sessionUser.email}</span>
                      , but this invitation was sent to{" "}
                      <span className="font-semibold">{invitation.email}</span>.
                    </div>
                    <div className="flex flex-col gap-3">
                      <Button
                        className="h-10 w-full bg-primary font-semibold text-primary-foreground text-sm hover:bg-primary/90"
                        onClick={handleSignOut}
                      >
                        Sign out to accept invitation
                      </Button>
                      <Link
                        className="inline-flex h-10 w-full items-center justify-center rounded-lg border border-border bg-card font-semibold text-sm hover:bg-accent hover:text-accent-foreground"
                        to="/dashboard"
                      >
                        Go to Dashboard
                      </Link>
                    </div>
                  </div>
                )
              ) : (
                <div className="space-y-4">
                  <div className="rounded-md border border-slate-200 bg-slate-50 p-4 text-slate-700 text-xs leading-relaxed">
                    Please log in or create a new account using{" "}
                    <span className="font-semibold">{invitation.email}</span> to
                    accept this invitation.
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <Link
                      className="inline-flex h-10 items-center justify-center rounded-lg border border-border bg-card font-semibold text-sm hover:bg-accent hover:text-accent-foreground"
                      search={{ error: undefined }}
                      to="/login"
                    >
                      Sign in
                    </Link>
                    <Link
                      className="inline-flex h-10 items-center justify-center rounded-lg bg-primary font-semibold text-primary-foreground text-sm hover:bg-primary/90"
                      to="/signup"
                    >
                      Sign up
                    </Link>
                  </div>
                </div>
              )}
            </div>
          ) : null}
        </CardContent>
      </Card>
    </AuthShell>
  );
}

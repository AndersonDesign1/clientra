"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "@tanstack/react-router";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/auth-client";

export function SignOutButton({
  className,
  variant = "outline",
}: {
  className?: string;
  variant?:
    | "default"
    | "outline"
    | "secondary"
    | "ghost"
    | "destructive"
    | "link";
}) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [isPending, setIsPending] = useState(false);

  return (
    <Button
      className={className}
      disabled={isPending}
      onClick={async () => {
        setIsPending(true);
        let didSignOut = false;

        try {
          await authClient.signOut();
          queryClient.clear();
          didSignOut = true;
        } catch (error) {
          console.error("sign out failed", error);
        } finally {
          setIsPending(false);
        }

        if (didSignOut) {
          await router.navigate({ to: "/login" });
        }
      }}
      type="button"
      variant={variant}
    >
      {isPending ? "Signing out..." : "Sign out"}
    </Button>
  );
}

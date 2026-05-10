"use client";

import { MailOpen02Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export function ClientAccessDialog() {
  return (
    <Dialog>
      <DialogTrigger
        render={
          <button
            className="cursor-pointer font-medium text-slate-900 underline underline-offset-2 transition-colors hover:text-slate-700"
            type="button"
          />
        }
      >
        Are you a client?
      </DialogTrigger>
      <DialogContent className="gap-5 p-6 sm:max-w-md">
        <DialogHeader>
          <div className="mb-1 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
              <HugeiconsIcon icon={MailOpen02Icon} size={20} strokeWidth={2} />
            </div>
            <DialogTitle className="text-base">
              Client access is invite-only
            </DialogTitle>
          </div>
          <DialogDescription className="text-sm/relaxed">
            Clientra workspaces are private. If a workspace owner has added you
            to a project, check your email for a secure invite link — that's
            your way in.
          </DialogDescription>
        </DialogHeader>
        <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3.5 text-slate-600 text-sm">
          <p className="mb-1.5 font-medium text-slate-700">
            Can't find your invite?
          </p>
          <p className="leading-relaxed">
            Ask your workspace owner to resend it, or check your spam folder.
            Invite links expire after a set period for security.
          </p>
        </div>
        <DialogFooter showCloseButton />
      </DialogContent>
    </Dialog>
  );
}

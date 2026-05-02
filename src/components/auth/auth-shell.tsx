import { Link } from "@tanstack/react-router";
import { cn } from "@/lib/utils";

export function AuthShell({
  asideDescription,
  asideEyebrow,
  asideTitle,
  children,
  className,
}: {
  asideDescription: string;
  asideEyebrow: string;
  asideTitle: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className="min-h-[100dvh] bg-stone-50 text-zinc-950">
      <div className="mx-auto grid min-h-[100dvh] max-w-6xl gap-10 px-6 py-8 lg:grid-cols-[1.05fr_0.95fr] lg:px-10">
        <section className="flex flex-col justify-between border-slate-200 border-r py-10 pr-8">
          <div className="space-y-6">
            <Link
              className="inline-flex w-fit items-center font-semibold text-lg tracking-tight"
              to="/"
            >
              Clientra
            </Link>
            <div className="space-y-4">
              <p className="text-slate-500 text-sm">{asideEyebrow}</p>
              <h1 className="max-w-lg font-semibold text-3xl leading-tight tracking-tight">
                {asideTitle}
              </h1>
              <p className="max-w-xl text-base text-slate-600 leading-7">
                {asideDescription}
              </p>
            </div>
          </div>
          <div className="grid gap-4 border-slate-200 border-t pt-8 text-slate-600 text-sm sm:grid-cols-2">
            <div>
              <p className="font-medium text-zinc-950">Admin access</p>
              <p className="mt-2 leading-6">
                Public signup is reserved for workspace admins who manage
                clients, projects, and invites.
              </p>
            </div>
            <div>
              <p className="font-medium text-zinc-950">Client access</p>
              <p className="mt-2 leading-6">
                Clients join through secure invite links and land directly in
                their portal after setup.
              </p>
            </div>
          </div>
        </section>
        <section
          className={cn("flex items-center justify-center py-6", className)}
        >
          <div className="w-full max-w-md">{children}</div>
        </section>
      </div>
    </div>
  );
}

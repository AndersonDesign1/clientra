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
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(15,23,42,0.06),_transparent_38%),linear-gradient(135deg,_#f8fafc_0%,_#eef2ff_45%,_#f8fafc_100%)] text-slate-950">
      <div className="mx-auto grid min-h-screen max-w-6xl gap-10 px-6 py-8 lg:grid-cols-[1.1fr_0.9fr] lg:px-10">
        <section className="flex flex-col justify-between rounded-[2rem] border border-white/70 bg-slate-950 px-8 py-10 text-white shadow-[0_32px_80px_rgba(15,23,42,0.18)]">
          <div className="space-y-6">
            <Link
              className="inline-flex w-fit items-center rounded-full border border-white/20 px-3 py-1 text-[0.7rem] text-slate-200 uppercase tracking-[0.28em]"
              to="/"
            >
              Clientra
            </Link>
            <div className="space-y-4">
              <p className="text-sky-200/80 text-xs uppercase tracking-[0.3em]">
                {asideEyebrow}
              </p>
              <h1 className="max-w-lg font-semibold text-4xl leading-tight">
                {asideTitle}
              </h1>
              <p className="max-w-xl text-base text-slate-300 leading-7">
                {asideDescription}
              </p>
            </div>
          </div>
          <div className="grid gap-4 pt-8 text-slate-300 text-sm sm:grid-cols-2">
            <div className="rounded-2xl border border-white/12 bg-white/6 p-4 backdrop-blur-sm">
              <p className="font-medium text-white">Admin access</p>
              <p className="mt-2 leading-6">
                Public signup is reserved for workspace admins who manage
                clients, projects, and invites.
              </p>
            </div>
            <div className="rounded-2xl border border-white/12 bg-white/6 p-4 backdrop-blur-sm">
              <p className="font-medium text-white">Client access</p>
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

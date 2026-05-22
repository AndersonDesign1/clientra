import { Link } from "@tanstack/react-router";
import { cn } from "@/lib/utils";
import logoUrl from "/logo.webp";
import logoWhiteUrl from "/logo-white.webp";

export function AuthShell({
  asideDescription,
  asideTitle,
  children,
  className,
}: {
  asideDescription: string;
  asideTitle: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className="flex min-h-[100dvh] w-full bg-background font-sans">
      {/* Left panel: Deep forest, blueprint grid pattern, typographic branding (no glassmorphism) */}
      <div className="relative hidden flex-col overflow-hidden border-[#0d2a1a] border-r bg-[#051c10] p-16 text-primary-foreground lg:flex lg:w-1/2">
        {/* Subtle grid lines background overlay */}
        <div className="pointer-events-none absolute inset-0 select-none">
          <svg
            aria-hidden="true"
            className="absolute inset-0 h-full w-full stroke-white/[0.03] [mask-image:radial-gradient(80%_80%_at_30%_30%,white,transparent)]"
            xmlns="http://www.w3.org/2000/svg"
          >
            <defs>
              <pattern
                height="32"
                id="auth-grid-pattern"
                patternUnits="userSpaceOnUse"
                width="32"
                x="-1"
                y="-1"
              >
                <path d="M.5 32V.5H32" fill="none" />
              </pattern>
            </defs>
            <rect fill="url(#auth-grid-pattern)" height="100%" width="100%" />
          </svg>
          {/* Subtle warm green glowing source */}
          <div className="absolute -top-1/4 -left-1/4 h-3/4 w-3/4 rounded-full bg-emerald-500/10 blur-[120px]" />
          <div className="absolute -right-1/4 -bottom-1/4 h-3/4 w-3/4 rounded-full bg-teal-500/5 blur-[120px]" />
        </div>

        {/* Content */}
        <div className="relative z-10 flex h-full flex-col justify-between">
          <div>
            <Link
              className="inline-flex w-fit items-center gap-2 font-semibold text-2xl text-white tracking-tight transition-opacity hover:opacity-90"
              to="/"
            >
              <img
                alt="Clientra Logo"
                className="h-7 w-auto shrink-0"
                height={28}
                src={logoWhiteUrl}
                width={28}
              />
              <span className="tracking-tight">Clientra</span>
            </Link>
          </div>
          <div className="my-auto flex max-w-lg flex-col space-y-5">
            <h1 className="font-bold text-4xl text-white leading-tight tracking-tight">
              {asideTitle}
            </h1>
            <p className="font-normal text-base text-emerald-100/80 leading-relaxed">
              {asideDescription}
            </p>
          </div>
          <div className="font-normal text-emerald-100/40 text-xs tracking-wide">
            © {new Date().getFullYear()} Clientra. Refined workspace design.
          </div>
        </div>
      </div>

      {/* Right panel: Elegant form layout */}
      <div
        className={cn(
          "relative flex flex-1 items-center justify-center bg-background p-8 md:p-12 lg:p-16",
          className
        )}
      >
        {/* Soft layout wrapper for form */}
        <div className="w-full max-w-sm space-y-6">
          <div className="mb-6 flex justify-center lg:hidden">
            <Link
              className="inline-flex items-center gap-2 font-semibold text-2xl text-primary tracking-tight"
              to="/"
            >
              <img
                alt="Clientra Logo"
                className="h-7 w-auto"
                height={28}
                src={logoUrl}
                width={28}
              />
              <span className="text-[#08361f] tracking-tight dark:text-primary">
                Clientra
              </span>
            </Link>
          </div>
          {children}
        </div>
      </div>
    </div>
  );
}

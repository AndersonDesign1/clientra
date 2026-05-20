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
    <div className="flex min-h-[100dvh] w-full bg-background">
      <div className="hidden flex-col bg-primary p-12 text-primary-foreground lg:flex lg:w-1/2">
        <div>
          <Link
            className="inline-flex w-fit items-center gap-1.5 font-semibold text-2xl tracking-tight"
            to="/"
          >
            <img
              alt="Clientra Logo"
              className="h-8 w-auto"
              height={32}
              src={logoWhiteUrl}
              width={32}
            />
            Clientra
          </Link>
        </div>
        <div className="flex max-w-lg flex-1 flex-col justify-center space-y-6">
          <h1 className="font-bold text-4xl leading-tight tracking-tight">
            {asideTitle}
          </h1>
          <p className="text-lg text-primary-foreground/90 leading-relaxed">
            {asideDescription}
          </p>
        </div>
      </div>

      <div
        className={cn(
          "flex flex-1 items-center justify-center p-6 lg:p-12",
          className
        )}
      >
        <div className="w-full max-w-sm space-y-8">
          <div className="mb-8 flex justify-center lg:hidden">
            <Link
              className="inline-flex items-center gap-1.5 font-semibold text-2xl text-primary tracking-tight"
              to="/"
            >
              <img
                alt="Clientra Logo"
                className="h-8 w-auto"
                height={32}
                src={logoUrl}
                width={32}
              />
              Clientra
            </Link>
          </div>
          {children}
        </div>
      </div>
    </div>
  );
}

import { Link } from "@tanstack/react-router";
import { cn } from "@/lib/utils";

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
      <div className="hidden lg:flex lg:w-1/2 bg-primary text-primary-foreground p-12 flex-col">
        <div>
          <Link
            className="inline-flex w-fit items-center font-semibold text-2xl tracking-tight"
            to="/"
          >
            <div className="bg-primary-foreground text-primary rounded-md p-1.5 mr-2">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>
            </div>
            Clientra
          </Link>
        </div>
        <div className="space-y-6 max-w-lg flex-1 flex flex-col justify-center">
          <h1 className="font-bold text-4xl leading-tight tracking-tight">
            {asideTitle}
          </h1>
          <p className="text-lg text-primary-foreground/90 leading-relaxed">
            {asideDescription}
          </p>
        </div>
      </div>
      
      <div className={cn("flex flex-1 items-center justify-center p-6 lg:p-12", className)}>
        <div className="w-full max-w-sm space-y-8">
           <div className="lg:hidden flex justify-center mb-8">
              <Link className="inline-flex items-center font-semibold text-2xl tracking-tight text-primary" to="/">
                <div className="bg-primary text-primary-foreground rounded-md p-1.5 mr-2">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>
                </div>
                Clientra
              </Link>
           </div>
           {children}
        </div>
      </div>
    </div>
  );
}

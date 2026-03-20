import { TanStackDevtools } from "@tanstack/react-devtools";
import {
  createRootRoute,
  HeadContent,
  Link,
  Scripts,
} from "@tanstack/react-router";
import { TanStackRouterDevtoolsPanel } from "@tanstack/react-router-devtools";

import appCss from "../styles.css?url";

export const Route = createRootRoute({
  head: () => ({
    meta: [
      {
        charSet: "utf-8",
      },
      {
        name: "viewport",
        content: "width=device-width, initial-scale=1",
      },
      {
        title: "Clientra",
      },
    ],
    links: [
      {
        rel: "stylesheet",
        href: appCss,
      },
    ],
  }),
  notFoundComponent: RootNotFound,
  shellComponent: RootDocument,
});

function RootDocument({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <TanStackDevtools
          config={{
            position: "bottom-right",
          }}
          plugins={[
            {
              name: "Tanstack Router",
              render: <TanStackRouterDevtoolsPanel />,
            },
          ]}
        />
        <Scripts />
      </body>
    </html>
  );
}

function RootNotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 p-6 text-slate-900">
      <div className="w-full max-w-md rounded-2xl border bg-white p-6 text-center shadow-sm">
        <p className="font-medium text-slate-400 text-sm uppercase tracking-[0.2em]">
          Clientra
        </p>
        <h1 className="mt-3 font-semibold text-2xl">Page not found</h1>
        <p className="mt-2 text-slate-600 text-sm">
          The page you tried to open does not exist or is no longer available.
        </p>
        <div className="mt-6 flex items-center justify-center gap-4">
          <Link
            className="rounded-md bg-slate-900 px-4 py-2 text-sm text-white"
            to="/dashboard"
          >
            Go to dashboard
          </Link>
          <Link className="text-sm underline" to="/">
            Back home
          </Link>
        </div>
      </div>
    </div>
  );
}

// @vitest-environment jsdom

import { QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  RouterProvider,
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
} from "@tanstack/react-router";
import { cleanup, render, screen } from "@testing-library/react";
import { act } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  PortalProjectsPendingPage,
  SettingsPendingPage,
} from "@/components/common/route-pending";
import { createQueryClient } from "@/lib/query-client";
import { getRouter } from "@/router";
import { Route as PortalProjectsRoute } from "@/routes/portal/projects/index";
import { Route as SettingsRoute } from "@/routes/settings";

vi.mock("@/lib/auth-client", () => ({
  authClient: {
    signOut: vi.fn(async () => undefined),
    useSession: () => ({
      data: {
        user: {
          email: "tester@example.com",
          id: "user-1",
          name: "Test User",
          role: "admin",
        },
      },
    }),
  },
}));

vi.mock("@/components/auth/sign-out-button", () => ({
  SignOutButton: ({ className }: { className?: string }) => (
    <button className={className} type="button">
      Sign out
    </button>
  ),
}));

afterEach(() => {
  cleanup();
});

function createDeferred() {
  let resolvePromise!: () => void;
  const promise = new Promise<void>((resolve) => {
    resolvePromise = resolve;
  });

  return {
    promise,
    resolve: resolvePromise,
  };
}

function renderWithQueryClient(ui: React.ReactNode) {
  const queryClient = createQueryClient();

  return render(
    <QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>
  );
}

describe("route pending states", () => {
  it("shows the settings pending skeleton during admin navigation", async () => {
    const pending = createDeferred();
    const rootRoute = createRootRoute({
      component: () => <Outlet />,
    });

    const dashboardRoute = createRoute({
      component: () => <div>Dashboard ready</div>,
      getParentRoute: () => rootRoute,
      path: "/dashboard",
    });

    const clientsRoute = createRoute({
      component: () => <div>Clients ready</div>,
      getParentRoute: () => rootRoute,
      path: "/clients",
    });

    const projectsRoute = createRoute({
      component: () => <div>Projects ready</div>,
      getParentRoute: () => rootRoute,
      path: "/projects",
    });

    const usersRoute = createRoute({
      component: () => <div>Users ready</div>,
      getParentRoute: () => rootRoute,
      path: "/users",
    });

    const loginRoute = createRoute({
      component: () => <div>Login</div>,
      getParentRoute: () => rootRoute,
      path: "/login",
    });

    const settingsRoute = createRoute({
      component: () => <div>Settings ready</div>,
      getParentRoute: () => rootRoute,
      loader: async () => pending.promise,
      path: "/settings",
      pendingComponent: SettingsPendingPage,
      pendingMinMs: 0,
      pendingMs: 0,
    });

    const router = createRouter({
      history: createMemoryHistory({
        initialEntries: ["/dashboard"],
      }),
      routeTree: rootRoute.addChildren([
        dashboardRoute,
        clientsRoute,
        projectsRoute,
        usersRoute,
        settingsRoute,
        loginRoute,
      ]),
    });

    await act(async () => {
      await router.load();
    });

    renderWithQueryClient(<RouterProvider router={router} />);
    expect(await screen.findByText("Dashboard ready")).toBeTruthy();

    let navigationPromise!: Promise<void>;

    await act(async () => {
      navigationPromise = router.navigate({ to: "/settings" });
      await Promise.resolve();
    });

    expect(await screen.findByTestId("settings-route-pending")).toBeTruthy();

    pending.resolve();

    await act(async () => {
      await navigationPromise;
    });

    expect(await screen.findByText("Settings ready")).toBeTruthy();
  });

  it("shows the portal projects pending skeleton during portal navigation", async () => {
    const pending = createDeferred();
    const rootRoute = createRootRoute({
      component: () => <Outlet />,
    });

    const portalHomeRoute = createRoute({
      component: () => <div>Portal ready</div>,
      getParentRoute: () => rootRoute,
      path: "/portal",
    });

    const loginRoute = createRoute({
      component: () => <div>Login</div>,
      getParentRoute: () => rootRoute,
      path: "/login",
    });

    const portalProjectsRoute = createRoute({
      component: () => <div>Portal projects ready</div>,
      getParentRoute: () => rootRoute,
      loader: async () => pending.promise,
      path: "/portal/projects",
      pendingComponent: PortalProjectsPendingPage,
      pendingMinMs: 0,
      pendingMs: 0,
    });

    const router = createRouter({
      history: createMemoryHistory({
        initialEntries: ["/portal"],
      }),
      routeTree: rootRoute.addChildren([
        portalHomeRoute,
        portalProjectsRoute,
        loginRoute,
      ]),
    });

    await act(async () => {
      await router.load();
    });

    renderWithQueryClient(<RouterProvider router={router} />);
    expect(await screen.findByText("Portal ready")).toBeTruthy();

    let navigationPromise!: Promise<void>;

    await act(async () => {
      navigationPromise = router.navigate({ to: "/portal/projects" });
      await Promise.resolve();
    });

    expect(
      await screen.findByTestId("portal-projects-route-pending")
    ).toBeTruthy();

    pending.resolve();

    await act(async () => {
      await navigationPromise;
    });

    expect(await screen.findByText("Portal projects ready")).toBeTruthy();
  });

  it("keeps the real app routes wired to the shared pending components", () => {
    expect(SettingsRoute.options.loader).toBeTruthy();
    expect(SettingsRoute.options.pendingComponent).toBe(SettingsPendingPage);
    expect(PortalProjectsRoute.options.loader).toBeTruthy();
    expect(PortalProjectsRoute.options.pendingComponent).toBe(
      PortalProjectsPendingPage
    );
  });

  it("sets fast default router pending timing", () => {
    const router = getRouter();

    expect(router.options.defaultPendingMs).toBe(50);
    expect(router.options.defaultPendingMinMs).toBe(250);
  });
});

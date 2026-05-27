// @vitest-environment jsdom

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { getPortalPath } from "@/routes/settings";

const { mockSettings, mockUser } = vi.hoisted(() => ({
  mockSettings: {
    id: "default",
    workspaceName: "Clientra",
    supportEmail: "support@clientra.com",
    portalUrl: "https://useclientra.vercel.app/portal/clientra",
    allowSignups: true,
    enableNotifications: true,
    autoArchive: false,
  },
  mockUser: {
    name: "Jordan Lee",
    email: "jordan@example.com",
  },
}));

const ONBOARDING_BANNER_REGEX =
  /We've pre-filled the profile below with your signup credentials/;

vi.mock("@/lib/api", () => ({
  useSettingsData: () => ({
    data: mockSettings,
    isLoading: false,
    error: null,
  }),
  useUpdateSettingsMutation: () => ({
    mutateAsync: vi.fn(),
    isPending: false,
  }),
}));

vi.mock("@/lib/auth-client", () => ({
  authClient: {
    useSession: () => ({
      data: {
        user: mockUser,
      },
    }),
  },
}));

import { WorkspaceTab } from "@/routes/settings";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
    },
  },
});

function renderWithClient(ui: ReactNode) {
  return render(
    <QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>
  );
}

afterEach(() => {
  cleanup();
  queryClient.clear();
});

describe("Settings Route - getPortalPath", () => {
  it("converts workspace names to clean URL slugs", () => {
    expect(getPortalPath("Clientra")).toBe("clientra");
    expect(getPortalPath("My Awesome Workspace!!! 123")).toBe(
      "my-awesome-workspace-123"
    );
    expect(getPortalPath("  --dirty--path--  ")).toBe("dirty-path");
    expect(getPortalPath("")).toBe("workspace");
  });
});

describe("Settings Route - WorkspaceTab", () => {
  it("renders workspace settings profile input fields and uploader button", () => {
    renderWithClient(<WorkspaceTab />);

    expect(screen.getByLabelText("Workspace Name")).toBeTruthy();
    expect(screen.getByLabelText("Support Email")).toBeTruthy();
    expect(screen.getByText("Workspace Profile")).toBeTruthy();
    expect(
      screen.getByText("Click here to upload workspace logo")
    ).toBeTruthy();
  });

  it("displays the personalized onboarding banner if settings are at factory defaults", () => {
    renderWithClient(<WorkspaceTab />);

    expect(screen.getByText("✨ Personalize your workspace")).toBeTruthy();
    expect(screen.getByText(ONBOARDING_BANNER_REGEX)).toBeTruthy();
  });
});

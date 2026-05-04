// @vitest-environment jsdom

import { cleanup, render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { LoadableData, PendingInvite } from "@/lib/api";

vi.mock("@/lib/api", () => ({
  ensureClientsData: vi.fn(),
  ensurePendingInvitesData: vi.fn(),
  ensureProjectsData: vi.fn(),
  useClientsData: vi.fn(),
  usePendingInvitesData: vi.fn(),
  useProjectsData: vi.fn(),
  useResendInviteMutation: () => ({
    error: null,
    isPending: false,
    mutateAsync: vi.fn(async () => undefined),
    variables: undefined,
  }),
  useRevokeInviteMutation: () => ({
    error: null,
    isPending: false,
    mutateAsync: vi.fn(async () => undefined),
    variables: undefined,
  }),
  useUpdateClientMutation: vi.fn(),
}));

vi.mock("@/components/ui/field", () => ({
  FieldError: ({ children }: { children?: ReactNode }) =>
    children ? <p>{children}</p> : null,
}));

import { PendingInvitesPanel } from "@/routes/clients/$id";

afterEach(() => {
  cleanup();
});

function createState(
  overrides: Partial<LoadableData<PendingInvite[]>> = {}
): LoadableData<PendingInvite[]> {
  return {
    data: [],
    error: null,
    isLoading: false,
    ...overrides,
  };
}

describe("PendingInvitesPanel", () => {
  it("renders pending invite rows", () => {
    render(
      <PendingInvitesPanel
        pendingInvites={createState({
          data: [
            {
              clientId: "client_1",
              createdAt: "2026-04-01T10:00:00.000Z",
              email: "jordan@example.com",
              expiresAt: "2026-04-08T10:00:00.000Z",
              id: "invite_1",
            },
          ],
        })}
      />
    );

    expect(screen.getByText("Pending invites")).toBeTruthy();
    expect(screen.getByText("jordan@example.com")).toBeTruthy();
    expect(screen.getByText("1 pending")).toBeTruthy();
    expect(screen.getByText("Pending")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Resend" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Revoke" })).toBeTruthy();
  });

  it("renders an empty state", () => {
    render(<PendingInvitesPanel pendingInvites={createState()} />);

    expect(screen.getByText("0 pending")).toBeTruthy();
    expect(
      screen.getByText("No pending invites for this client.")
    ).toBeTruthy();
  });

  it("renders loading and error states without hiding surrounding content", () => {
    render(
      <>
        <p>Acme Inc.</p>
        <PendingInvitesPanel
          pendingInvites={createState({
            error: "Unable to load pending invites.",
            isLoading: true,
          })}
        />
      </>
    );

    expect(screen.getByText("Acme Inc.")).toBeTruthy();
    expect(screen.getByText("Loading pending invites...")).toBeTruthy();
    expect(screen.getByText("Unable to load pending invites.")).toBeTruthy();
  });
});

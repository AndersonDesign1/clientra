import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { LoopEmailError, sendTransactionalEmail } from "@/server/email/loop";
import {
  filterNotificationRecipients,
  type NotificationRecipient,
} from "@/server/email/notifications";

const sendTransactionalEmailMock = vi.hoisted(() => vi.fn());

vi.mock("loops", () => ({
  LoopsClient: vi.fn(() => ({
    sendTransactionalEmail: sendTransactionalEmailMock,
  })),
}));

const recipients: NotificationRecipient[] = [
  {
    email: "client@example.com",
    id: "client_1",
    name: "Client",
    role: "client",
  },
  {
    email: "CLIENT@example.com",
    id: "client_2",
    name: "Duplicate Client",
    role: "client",
  },
  {
    email: "admin@example.com",
    id: "admin_1",
    name: "Admin",
    role: "admin",
  },
];

describe("Loop email service", () => {
  beforeEach(() => {
    sendTransactionalEmailMock.mockResolvedValue({ success: true });
    vi.stubEnv("LOOPS_ENABLED", "true");
    vi.stubEnv("LOOPS_API_KEY", "loops_secret");
    vi.stubEnv("LOOPS_INVITE_TRANSACTIONAL_ID", "invite_template");
  });

  afterEach(() => {
    sendTransactionalEmailMock.mockReset();
    vi.unstubAllEnvs();
  });

  it("sends transactional payloads with template ids and idempotency keys", async () => {
    await sendTransactionalEmail({
      dataVariables: {
        appUrl: "https://clientra.test",
        inviteUrl: "https://clientra.test/invite/token",
      },
      email: "client@example.com",
      idempotencyKey: "invite:invite_1",
      template: "invite",
    });

    expect(sendTransactionalEmailMock).toHaveBeenCalledWith({
      addToAudience: true,
      dataVariables: {
        appUrl: "https://clientra.test",
        inviteUrl: "https://clientra.test/invite/token",
      },
      email: "client@example.com",
      headers: {
        "Idempotency-Key": "invite:invite_1",
      },
      transactionalId: "invite_template",
    });
  });

  it("throws a configuration error when a template id is missing", async () => {
    vi.stubEnv("LOOPS_INVITE_TRANSACTIONAL_ID", "");

    await expect(
      sendTransactionalEmail({
        dataVariables: {},
        email: "client@example.com",
        template: "invite",
      })
    ).rejects.toThrow(LoopEmailError);
    expect(sendTransactionalEmailMock).not.toHaveBeenCalled();
  });

  it("keeps legacy LOOP_* env names working while deployments migrate", async () => {
    vi.stubEnv("LOOPS_API_KEY", "");
    vi.stubEnv("LOOPS_INVITE_TRANSACTIONAL_ID", "");
    vi.stubEnv("LOOP_API_KEY", "legacy_loop_secret");
    vi.stubEnv("LOOP_INVITE_TEMPLATE_ID", "legacy_invite_template");

    await sendTransactionalEmail({
      dataVariables: {},
      email: "client@example.com",
      template: "invite",
    });

    expect(sendTransactionalEmailMock).toHaveBeenCalledWith(
      expect.objectContaining({
        transactionalId: "legacy_invite_template",
      })
    );
  });
});

describe("notification recipients", () => {
  it("dedupes by email and skips the actor", () => {
    expect(filterNotificationRecipients(recipients, "admin_1")).toEqual([
      recipients[0],
    ]);
  });
});

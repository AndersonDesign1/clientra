import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { LoopEmailError, sendTransactionalEmail } from "@/server/email/loop";
import {
  filterNotificationRecipients,
  type NotificationRecipient,
} from "@/server/email/notifications";

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
    vi.stubEnv("LOOP_ENABLED", "true");
    vi.stubEnv("LOOP_API_KEY", "loop_secret");
    vi.stubEnv("LOOP_INVITE_TEMPLATE_ID", "invite_template");
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        Response.json({
          success: true,
        })
      )
    );
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
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

    expect(fetch).toHaveBeenCalledWith(
      "https://app.loops.so/api/v1/transactional",
      expect.objectContaining({
        body: JSON.stringify({
          addToAudience: true,
          dataVariables: {
            appUrl: "https://clientra.test",
            inviteUrl: "https://clientra.test/invite/token",
          },
          email: "client@example.com",
          transactionalId: "invite_template",
        }),
        method: "POST",
      })
    );
    const headers = vi.mocked(fetch).mock.calls[0]?.[1]?.headers as Headers;
    expect(headers.get("authorization")).toBe("Bearer loop_secret");
    expect(headers.get("idempotency-key")).toBe("invite:invite_1");
  });

  it("throws a configuration error when a template id is missing", async () => {
    vi.stubEnv("LOOP_INVITE_TEMPLATE_ID", "");

    await expect(
      sendTransactionalEmail({
        dataVariables: {},
        email: "client@example.com",
        template: "invite",
      })
    ).rejects.toThrow(LoopEmailError);
    expect(fetch).not.toHaveBeenCalled();
  });
});

describe("notification recipients", () => {
  it("dedupes by email and skips the actor", () => {
    expect(filterNotificationRecipients(recipients, "admin_1")).toEqual([
      recipients[0],
    ]);
  });
});

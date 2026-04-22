import { describe, expect, it } from "vitest";
import { findClientByPathParam, getClientPathParam } from "@/lib/client-slugs";

const client = {
  company: "Acme Inc.",
  email: "jordan@acme.co",
  id: "cli_1",
  name: "Jordan Lee",
  notes: "",
  phone: "",
  status: "active" as const,
  tags: [],
  website: "",
};

describe("client URL slugs", () => {
  it("uses the client name for client route params", () => {
    expect(getClientPathParam(client)).toBe("jordan-lee-cli_1");
  });

  it("resolves clients by readable slug or legacy id", () => {
    expect(findClientByPathParam([client], "jordan-lee-cli_1")?.id).toBe(
      "cli_1"
    );
    expect(findClientByPathParam([client], "cli_1")?.id).toBe("cli_1");
  });

  it("does not guess a bare slug when duplicate client names exist", () => {
    const duplicateClient = {
      ...client,
      email: "other@acme.co",
      id: "cli_2",
    };

    expect(findClientByPathParam([client, duplicateClient], "jordan-lee")).toBe(
      undefined
    );
    expect(
      findClientByPathParam([client, duplicateClient], "jordan-lee-cli_2")?.id
    ).toBe("cli_2");
  });
});

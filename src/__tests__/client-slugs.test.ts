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
    expect(getClientPathParam(client)).toBe("jordan-lee");
  });

  it("resolves clients by readable slug or legacy id", () => {
    expect(findClientByPathParam([client], "jordan-lee")?.id).toBe("cli_1");
    expect(findClientByPathParam([client], "cli_1")?.id).toBe("cli_1");
  });
});

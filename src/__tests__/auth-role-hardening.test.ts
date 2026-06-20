import { describe, expect, it } from "vitest";
import { userAdditionalFields } from "@/auth/better-auth";
import { ROLES } from "@/auth/roles";

describe("auth role hardening", () => {
  it("does not accept role as user input at signup", () => {
    expect(userAdditionalFields.role.input).toBe(false);
  });

  it("defaults new accounts to the client role", () => {
    expect(userAdditionalFields.role.defaultValue).toBe(ROLES.CLIENT);
  });
});
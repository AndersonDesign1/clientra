import { describe, expect, it } from "vitest";
import { formatClientOptionLabel } from "@/components/admin/crud-dialogs";
import { formatStatusLabel } from "@/components/common/status-badge";

describe("admin CRUD labels", () => {
  it("formats client options with company and contact name", () => {
    expect(
      formatClientOptionLabel({
        company: "Acme Inc.",
        email: "jordan@acme.co",
        id: "cli_1",
        name: "Jordan Lee",
        notes: "",
        phone: "",
        status: "active",
        tags: [],
        website: "",
      })
    ).toBe("Acme Inc. - Jordan Lee");
  });

  it("formats status values as readable labels", () => {
    expect(formatStatusLabel("in_progress")).toBe("In progress");
    expect(formatStatusLabel("completed")).toBe("Completed");
  });
});

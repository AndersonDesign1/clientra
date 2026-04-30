import { describe, expect, it } from "vitest";
import {
  formatClientOptionLabel,
  getClientFormState,
  getProjectFormState,
  toClientPayload,
  toProjectPayload,
} from "@/components/admin/crud-dialogs";
import type { Client } from "@/features/clients/mock-data";
import type { Project } from "@/features/projects/mock-data";

const client: Client = {
  company: "Acme Inc.",
  email: "jordan@acme.co",
  id: "client_1",
  name: "Jordan Lee",
  notes: "Primary stakeholder.",
  phone: "+1 555-0101",
  status: "active",
  tags: ["retainer", "web"],
  website: "https://acme.co",
};

const project: Project = {
  budget: 12_000,
  clientId: "client_1",
  deadline: "2026-04-30",
  description: "Delivery portal.",
  id: "project_1",
  slug: "delivery-portal",
  status: "in_progress",
  title: "Delivery Portal",
};

describe("admin CRUD dialog helpers", () => {
  it("formats client select options with company and contact", () => {
    expect(formatClientOptionLabel(client)).toBe("Acme Inc. - Jordan Lee");
  });

  it("hydrates client edit state and serializes a trimmed client payload", () => {
    expect(getClientFormState(client)).toEqual({
      company: "Acme Inc.",
      email: "jordan@acme.co",
      name: "Jordan Lee",
      notes: "Primary stakeholder.",
      phone: "+1 555-0101",
      status: "active",
      tags: "retainer, web",
      website: "https://acme.co",
    });

    expect(
      toClientPayload({
        company: " Acme Studio ",
        email: " ops@acme.co ",
        name: " Jordan Lee ",
        notes: " ",
        phone: " +1 555-0101 ",
        status: "archived",
        tags: " retainer, web, , urgent ",
        website: " https://acme.co ",
      })
    ).toEqual({
      company: "Acme Studio",
      email: "ops@acme.co",
      name: "Jordan Lee",
      notes: undefined,
      phone: "+1 555-0101",
      status: "archived",
      tags: ["retainer", "web", "urgent"],
      website: "https://acme.co",
    });
  });

  it("uses the first client for new projects and preserves the linked client on edits", () => {
    expect(getProjectFormState([client])).toEqual({
      budget: "0",
      clientId: "client_1",
      deadline: "",
      description: "",
      status: "planning",
      title: "",
    });

    expect(getProjectFormState([client], project)).toEqual({
      budget: "12000",
      clientId: "client_1",
      deadline: "2026-04-30",
      description: "Delivery portal.",
      status: "in_progress",
      title: "Delivery Portal",
    });
  });

  it("serializes project payloads for create, edit, and status updates", () => {
    expect(
      toProjectPayload({
        budget: "12000.50",
        clientId: "client_1",
        deadline: " ",
        description: " Delivery portal. ",
        status: "completed",
        title: " Delivery Portal v2 ",
      })
    ).toEqual({
      budget: 12_000.5,
      clientId: "client_1",
      deadline: undefined,
      description: "Delivery portal.",
      status: "completed",
      title: "Delivery Portal v2",
    });

    expect(
      toProjectPayload({
        ...getProjectFormState([client]),
        budget: "not-a-number",
      }).budget
    ).toBe(0);
  });
});

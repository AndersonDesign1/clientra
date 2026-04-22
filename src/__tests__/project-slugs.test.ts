import { describe, expect, it } from "vitest";
import {
  findProjectByClientAndProjectPathParams,
  findProjectByPathParam,
  getProjectPathParam,
  getProjectPathParams,
} from "@/lib/project-slugs";

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

const project = {
  budget: 12_000,
  clientId: "cli_1",
  deadline: "2026-04-10",
  description: "Modernize IA, design system, and page templates.",
  id: "proj_1",
  slug: "marketing-site-redesign",
  status: "in_progress" as const,
  title: "Marketing Site Redesign",
};

describe("project URL slugs", () => {
  it("uses the project title for project route params", () => {
    expect(getProjectPathParam(project)).toBe("marketing-site-redesign");
  });

  it("builds nested client and project route params", () => {
    expect(getProjectPathParams(project, [client])).toEqual({
      clientSlug: "jordan-lee-cli_1",
      projectSlug: "marketing-site-redesign",
    });
  });

  it("resolves projects by readable slug or legacy id", () => {
    expect(
      findProjectByPathParam([project], "marketing-site-redesign")?.id
    ).toBe("proj_1");
    expect(findProjectByPathParam([project], "proj_1")?.id).toBe("proj_1");
  });

  it("resolves projects by client and project slugs", () => {
    expect(
      findProjectByClientAndProjectPathParams({
        clients: [client],
        clientSlug: "jordan-lee",
        projects: [project],
        projectSlug: "marketing-site-redesign",
      })?.id
    ).toBe("proj_1");
    expect(
      findProjectByClientAndProjectPathParams({
        clients: [client],
        clientSlug: "jordan-lee-cli_1",
        projects: [project],
        projectSlug: "marketing-site-redesign",
      })?.id
    ).toBe("proj_1");
  });
});

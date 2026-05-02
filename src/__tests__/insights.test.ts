import { describe, expect, it, vi } from "vitest";
import type { Project } from "@/features/projects/mock-data";
import {
  formatMonthLabel,
  getDeadlineData,
  getNextDeadline,
  parseDateOnlyLocal,
} from "@/lib/insights";

function project(overrides: Partial<Project>): Project {
  return {
    budget: 1000,
    clientId: "cli_1",
    deadline: "2026-05-20",
    description: "Project description",
    id: "proj_1",
    slug: "project",
    status: "in_progress",
    title: "Project",
    ...overrides,
  };
}

describe("deadline insights", () => {
  it("parses date-only deadlines in local calendar time", () => {
    const date = parseDateOnlyLocal("2026-05-20");

    expect(date?.getFullYear()).toBe(2026);
    expect(date?.getMonth()).toBe(4);
    expect(date?.getDate()).toBe(20);
  });

  it("keeps projects due today eligible as the next deadline", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 4, 20, 23, 30));

    expect(
      getNextDeadline([
        project({ deadline: "2026-05-19", id: "past", title: "Past" }),
        project({ deadline: "2026-05-20", id: "today", title: "Today" }),
        project({ deadline: "2026-05-21", id: "future", title: "Future" }),
      ])?.id
    ).toBe("today");

    vi.useRealTimers();
  });

  it("groups deadline chart data by local month labels", () => {
    expect(
      getDeadlineData([
        project({ deadline: "2026-01-31", id: "jan" }),
        project({ deadline: "2026-10-01", id: "oct" }),
      ]).map((item) => item.label)
    ).toEqual([
      formatMonthLabel(new Date(2026, 0, 1)),
      formatMonthLabel(new Date(2026, 9, 1)),
    ]);
  });
});

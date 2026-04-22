export interface Project {
  budget: number;
  clientId: string;
  deadline: string;
  description: string;
  id: string;
  slug: string;
  status: "planning" | "in_progress" | "completed";
  title: string;
}

export const projects: Project[] = [
  {
    id: "proj_1",
    clientId: "cli_1",
    title: "Marketing Site Redesign",
    slug: "marketing-site-redesign",
    status: "in_progress",
    budget: 12_000,
    deadline: "2026-04-10",
    description: "Modernize IA, design system, and page templates.",
  },
  {
    id: "proj_2",
    clientId: "cli_2",
    title: "iOS Client Portal",
    slug: "ios-client-portal",
    status: "planning",
    budget: 18_000,
    deadline: "2026-05-20",
    description: "Client-facing project status and messaging app.",
  },
];

export const projectTimeline = [
  "Project created",
  "Kickoff call completed",
  "Note added by admin",
  "Deadline updated",
];

import { z } from "zod";

export const roleSchema = z.enum(["admin", "client"]);
const trimmedOptionalString = z.string().trim().max(2000).optional();
const emailSchema = z.string().trim().email().max(320);
const idSchema = z.string().trim().min(1).max(128);

export const createClientSchema = z.object({
  name: z.string().trim().min(1).max(120),
  company: z.string().trim().min(1).max(160),
  email: emailSchema,
  phone: z.string().trim().max(40).optional(),
  website: z.string().trim().url().max(2048).optional(),
  status: z.enum(["active", "archived"]).default("active"),
  notes: trimmedOptionalString,
  tags: z.array(z.string().trim().min(1).max(40)).max(20).default([]),
});

export const updateClientSchema = createClientSchema;

export const createProjectSchema = z.object({
  clientId: idSchema,
  title: z.string().trim().min(1).max(160),
  status: z.enum(["planning", "in_progress", "completed"]),
  budget: z.number().nonnegative(),
  deadline: z.string().trim().max(32).optional(),
  description: trimmedOptionalString,
});

export const updateProjectSchema = createProjectSchema;

export const createNoteSchema = z.object({
  projectId: idSchema,
  content: z.string().trim().min(1).max(10_000),
});

export const projectUpdateSchema = z.object({
  body: z.string().trim().min(1).max(10_000),
  status: z.enum(["on_track", "at_risk", "blocked", "complete"]),
  title: z.string().trim().min(1).max(160),
});

export const projectMilestoneSchema = z.object({
  description: trimmedOptionalString,
  dueDate: z.string().trim().max(32).optional(),
  sortOrder: z.number().int().min(0).max(10_000).default(0),
  status: z.enum(["todo", "in_progress", "done"]),
  title: z.string().trim().min(1).max(160),
});

export const inviteSchema = z.object({
  email: emailSchema,
  clientId: idSchema,
});

export const inviteRedeemSchema = z.object({
  email: emailSchema,
  name: z.string().trim().min(1).max(120),
  password: z.string().min(12).max(256),
  token: z.string().trim().min(1).max(255),
});

export const adminSignupSchema = z.object({
  email: emailSchema,
  name: z.string().trim().min(1).max(120),
  password: z.string().min(12).max(256),
});

export const updateUserRoleSchema = z.object({
  role: roleSchema,
});

export const searchSchema = z.object({
  query: z.string().trim().max(200).default(""),
});

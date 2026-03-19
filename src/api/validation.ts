import { z } from "zod";

export const roleSchema = z.enum(["admin", "client"]);

export const createClientSchema = z.object({
  name: z.string().min(1),
  company: z.string().min(1),
  email: z.email(),
  phone: z.string().optional(),
  website: z.string().url().optional(),
  status: z.enum(["active", "archived"]).default("active"),
  notes: z.string().optional(),
  tags: z.array(z.string()).default([]),
});

export const createProjectSchema = z.object({
  clientId: z.string(),
  title: z.string().min(1),
  status: z.enum(["planning", "in_progress", "completed"]),
  budget: z.number().nonnegative(),
  deadline: z.string().optional(),
  description: z.string().optional(),
});

export const createNoteSchema = z.object({
  projectId: z.string(),
  userId: z.string(),
  content: z.string().min(1),
});

export const inviteSchema = z.object({
  email: z.email(),
  clientId: z.string(),
});

export const searchSchema = z.object({
  query: z.string().min(1),
});

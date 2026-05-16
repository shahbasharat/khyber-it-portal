import { z } from "zod";

// Auth Schemas
export const LoginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export type LoginInput = z.infer<typeof LoginSchema>;

// Issue Schemas
export const CreateIssueSchema = z.object({
  title: z.string().min(3, "Title is required"),
  description: z.string().min(5, "Description is required"),
  priority: z.enum(["CRITICAL", "HIGH", "MEDIUM", "LOW"]),
});

export type CreateIssueInput = z.infer<typeof CreateIssueSchema>;

export const UpdateIssueSchema = z.object({
  status: z.enum(["OPEN", "IN_PROGRESS", "RESOLVED", "ESCALATED"]).optional(),
  priority: z.enum(["CRITICAL", "HIGH", "MEDIUM", "LOW"]).optional(),
  assigneeId: z.string().uuid().optional().nullable(),
});

export type UpdateIssueInput = z.infer<typeof UpdateIssueSchema>;

// Shared ENUM types mapping to Prisma
export const IssueStatus = {
  OPEN: "OPEN",
  IN_PROGRESS: "IN_PROGRESS",
  RESOLVED: "RESOLVED",
  ESCALATED: "ESCALATED",
} as const;

export const IssuePriority = {
  CRITICAL: "CRITICAL",
  HIGH: "HIGH",
  MEDIUM: "MEDIUM",
  LOW: "LOW",
} as const;

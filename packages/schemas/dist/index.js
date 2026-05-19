"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.IssuePriority = exports.IssueStatus = exports.EscalateIssueSchema = exports.CreateIssueNoteSchema = exports.UpdateIssueSchema = exports.CreateIssueSchema = exports.LoginSchema = void 0;
const zod_1 = require("zod");
// Auth Schemas
exports.LoginSchema = zod_1.z.object({
    email: zod_1.z.string().email("Invalid email address"),
    password: zod_1.z.string().min(8, "Password must be at least 8 characters"),
});
// Issue Schemas
exports.CreateIssueSchema = zod_1.z.object({
    title: zod_1.z.string().min(3, "Title is required"),
    description: zod_1.z.string().min(5, "Description is required"),
    priority: zod_1.z.enum(["CRITICAL", "HIGH", "MEDIUM", "LOW"]),
});
exports.UpdateIssueSchema = zod_1.z.object({
    status: zod_1.z.enum(["OPEN", "IN_PROGRESS", "RESOLVED", "ESCALATED"]).optional(),
    priority: zod_1.z.enum(["CRITICAL", "HIGH", "MEDIUM", "LOW"]).optional(),
    assigneeId: zod_1.z.string().uuid().optional().nullable(),
    resolutionNote: zod_1.z.string().optional(),
});
exports.CreateIssueNoteSchema = zod_1.z.object({
    content: zod_1.z.string().min(1, "Note cannot be empty"),
});
exports.EscalateIssueSchema = zod_1.z.object({
    escalatedTo: zod_1.z.string().min(1, "Escalated to is required"),
    contactDetails: zod_1.z.string().optional(),
    remarks: zod_1.z.string().optional(),
});
// Shared ENUM types mapping to Prisma
exports.IssueStatus = {
    OPEN: "OPEN",
    IN_PROGRESS: "IN_PROGRESS",
    RESOLVED: "RESOLVED",
    ESCALATED: "ESCALATED",
};
exports.IssuePriority = {
    CRITICAL: "CRITICAL",
    HIGH: "HIGH",
    MEDIUM: "MEDIUM",
    LOW: "LOW",
};

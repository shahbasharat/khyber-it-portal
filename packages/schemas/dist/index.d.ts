import { z } from "zod";
export declare const LoginSchema: z.ZodObject<{
    email: z.ZodString;
    password: z.ZodString;
}, "strip", z.ZodTypeAny, {
    email: string;
    password: string;
}, {
    email: string;
    password: string;
}>;
export type LoginInput = z.infer<typeof LoginSchema>;
export declare const CreateIssueSchema: z.ZodObject<{
    title: z.ZodString;
    description: z.ZodString;
    priority: z.ZodEnum<["CRITICAL", "HIGH", "MEDIUM", "LOW"]>;
}, "strip", z.ZodTypeAny, {
    title: string;
    description: string;
    priority: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";
}, {
    title: string;
    description: string;
    priority: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";
}>;
export type CreateIssueInput = z.infer<typeof CreateIssueSchema>;
export declare const UpdateIssueSchema: z.ZodObject<{
    status: z.ZodOptional<z.ZodEnum<["OPEN", "IN_PROGRESS", "RESOLVED", "ESCALATED"]>>;
    priority: z.ZodOptional<z.ZodEnum<["CRITICAL", "HIGH", "MEDIUM", "LOW"]>>;
    assigneeId: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    resolutionNote: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    status?: "OPEN" | "IN_PROGRESS" | "RESOLVED" | "ESCALATED" | undefined;
    priority?: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW" | undefined;
    assigneeId?: string | null | undefined;
    resolutionNote?: string | undefined;
}, {
    status?: "OPEN" | "IN_PROGRESS" | "RESOLVED" | "ESCALATED" | undefined;
    priority?: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW" | undefined;
    assigneeId?: string | null | undefined;
    resolutionNote?: string | undefined;
}>;
export type UpdateIssueInput = z.infer<typeof UpdateIssueSchema>;
export declare const CreateIssueNoteSchema: z.ZodObject<{
    content: z.ZodString;
}, "strip", z.ZodTypeAny, {
    content: string;
}, {
    content: string;
}>;
export type CreateIssueNoteInput = z.infer<typeof CreateIssueNoteSchema>;
export declare const EscalateIssueSchema: z.ZodObject<{
    escalatedTo: z.ZodString;
    contactDetails: z.ZodOptional<z.ZodString>;
    remarks: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    escalatedTo: string;
    contactDetails?: string | undefined;
    remarks?: string | undefined;
}, {
    escalatedTo: string;
    contactDetails?: string | undefined;
    remarks?: string | undefined;
}>;
export type EscalateIssueInput = z.infer<typeof EscalateIssueSchema>;
export declare const IssueStatus: {
    readonly OPEN: "OPEN";
    readonly IN_PROGRESS: "IN_PROGRESS";
    readonly RESOLVED: "RESOLVED";
    readonly ESCALATED: "ESCALATED";
};
export declare const IssuePriority: {
    readonly CRITICAL: "CRITICAL";
    readonly HIGH: "HIGH";
    readonly MEDIUM: "MEDIUM";
    readonly LOW: "LOW";
};

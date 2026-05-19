import { Request, Response } from "express";
import { prisma } from "../lib/prisma";
import bcrypt from "bcryptjs";
import { z } from "zod";
import logger from "../lib/logger";

const VALID_ROLES = ["MANAGER", "ENGINEER", "SENIOR_ASSOCIATE", "ASSOCIATE", "VIEWER"] as const;

const CreateUserSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  name: z.string().min(1, "Name is required").max(100),
  role: z.enum(VALID_ROLES).default("ASSOCIATE"),
});

const UpdateUserSchema = z.object({
  name: z.string().min(1, "Name is required").max(100).optional(),
  role: z.enum(VALID_ROLES).optional(),
  password: z.string().min(8, "Password must be at least 8 characters").optional(),
});

export const getUsers = async (req: Request, res: Response) => {
  try {
    const users = await prisma.user.findMany({
      select: { id: true, email: true, name: true, role: true, createdAt: true },
    });
    res.json(users);
  } catch (error) {
    logger.error(error, "Failed to get users");
    res.status(500).json({ error: "Failed to get users" });
  }
};

export const createUser = async (req: Request, res: Response) => {
  try {
    const parseResult = CreateUserSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({ error: parseResult.error.issues });
    }
    const { email, password, name, role } = parseResult.data;

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ error: "User with this email already exists" });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const user = await prisma.user.create({
      data: { email, passwordHash, name, role },
      select: { id: true, email: true, name: true, role: true },
    });

    res.status(201).json(user);
  } catch (error) {
    logger.error(error, "Failed to create user");
    res.status(500).json({ error: "Failed to create user" });
  }
};

export const updateUser = async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;

    const parseResult = UpdateUserSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({ error: parseResult.error.issues });
    }
    const { name, role, password } = parseResult.data;

    const data: any = {};
    if (name !== undefined) data.name = name;
    if (role !== undefined) data.role = role;
    if (password) {
      const salt = await bcrypt.genSalt(10);
      data.passwordHash = await bcrypt.hash(password, salt);
    }

    const user = await prisma.user.update({
      where: { id },
      data,
      select: { id: true, email: true, name: true, role: true },
    });

    res.json(user);
  } catch (error) {
    logger.error(error, "Failed to update user");
    res.status(500).json({ error: "Failed to update user" });
  }
};

export const deleteUser = async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const userId = (req as any).user.userId;

    if (id === userId) {
      return res.status(400).json({ error: "Cannot delete yourself" });
    }

    // Prevent deleting the last manager
    const targetUser = await prisma.user.findUnique({ where: { id }, select: { role: true } });
    if (targetUser?.role === "MANAGER") {
      const managerCount = await prisma.user.count({ where: { role: "MANAGER" } });
      if (managerCount <= 1) {
        return res.status(400).json({ error: "Cannot delete the last manager account" });
      }
    }

    await prisma.user.delete({ where: { id } });
    res.json({ success: true });
  } catch (error) {
    logger.error(error, "Failed to delete user");
    res.status(500).json({ error: "Failed to delete user" });
  }
};

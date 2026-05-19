import { Request, Response } from "express";
import { prisma } from "../lib/prisma";
import bcrypt from "bcryptjs";
import logger from "../lib/logger";

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
    const { email, password, name, role } = req.body;
    
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
    const { name, role, password } = req.body;

    const data: any = { name, role };
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
    
    // Prevent deleting the last manager or oneself
    const userRole = (req as any).user.role;
    const userId = (req as any).user.userId;

    if (id === userId) {
        return res.status(400).json({ error: "Cannot delete yourself" });
    }

    await prisma.user.delete({ where: { id } });
    res.json({ success: true });
  } catch (error) {
    logger.error(error, "Failed to delete user");
    res.status(500).json({ error: "Failed to delete user" });
  }
};

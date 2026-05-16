import { Request, Response } from "express";
import { prisma } from "../lib/prisma";

export const getNotifications = async (req: any, res: Response) => {
  const userId = req.user.userId;

  try {
    const notifications = await prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 20,
    });
    res.json(notifications);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch notifications" });
  }
};

export const markAsRead = async (req: Request, res: Response) => {
  const { id } = req.params;

  try {
    const notification = await prisma.notification.update({
      where: { id },
      data: { isRead: true },
    });
    res.json(notification);
  } catch (error) {
    res.status(500).json({ error: "Failed to update notification" });
  }
};

export const createNotification = async (userId: string, title: string, message: string, type: string, linkUrl?: string) => {
  try {
    return await prisma.notification.create({
      data: {
        userId,
        title,
        message,
        type,
        linkUrl,
      },
    });
  } catch (error) {
    console.error("Failed to create notification", error);
  }
};

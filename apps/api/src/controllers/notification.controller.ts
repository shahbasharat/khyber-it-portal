import { Request, Response } from "express";
import { prisma } from "../lib/prisma";
import logger from "../lib/logger";

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
    logger.error(error, `Failed to fetch notifications for user ${userId}`);
    res.status(500).json({ error: "Failed to fetch notifications" });
  }
};

export const markAsRead = async (req: Request, res: Response) => {
  const { id } = req.params;

  try {
    const notification = await prisma.notification.update({
      where: { id: id as string },
      data: { isRead: true },
    });
    res.json(notification);
  } catch (error) {
    logger.error(error, `Failed to update notification ${id} as read`);
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
    logger.error(error, `Failed to create notification for user ${userId} with title: ${title}`);
  }
};

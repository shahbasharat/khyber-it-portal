import { Request, Response } from "express";
import { prisma } from "../lib/prisma";
import { startOfDay, endOfDay } from "date-fns";

export const getDailyChecklist = async (req: any, res: Response) => {
  const userId = req.user.userId;
  const today = new Date();
  const start = startOfDay(today);
  const end = endOfDay(today);

  try {
    const items = await prisma.checklistItem.findMany({
      orderBy: { order: "asc" },
      include: {
        responses: {
          where: {
            createdAt: {
              gte: start,
              lte: end,
            },
          },
          include: {
            user: { select: { name: true } },
          },
        },
      },
    });

    const formattedItems = items.map((item) => {
      const response = item.responses[0];
      return {
        id: item.id,
        title: item.title,
        category: item.category,
        description: item.description,
        completed: !!response?.completed,
        remarks: response?.remarks || "",
        completedBy: response?.user?.name || null,
        completedAt: response?.createdAt || null,
      };
    });

    res.json(formattedItems);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch checklist" });
  }
};

export const updateChecklistItem = async (req: any, res: Response) => {
  const { itemId } = req.params;
  const { completed, remarks } = req.body;
  const userId = req.user.userId;

  const today = new Date();
  const start = startOfDay(today);
  const end = endOfDay(today);

  try {
    // Find or create response for today
    const existingResponse = await prisma.checklistResponse.findFirst({
      where: {
        checklistItemId: itemId as string,
        createdAt: {
          gte: start,
          lte: end,
        },
      },
    });

    if (existingResponse) {
      const updated = await prisma.checklistResponse.update({
        where: { id: existingResponse.id },
        data: { 
          ...(completed !== undefined && { completed }),
          ...(remarks !== undefined && { remarks }),
          userId 
        },
      });
      return res.json(updated);
    }

    const created = await prisma.checklistResponse.create({
      data: {
        checklistItemId: itemId,
        userId,
        completed: completed || false,
        remarks: remarks || "",
      },
    });

    res.status(201).json(created);
  } catch (error) {
    res.status(500).json({ error: "Failed to toggle checklist item" });
  }
};

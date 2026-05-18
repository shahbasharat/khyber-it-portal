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
      let status = response?.status || "PENDING";
      if (response?.completed && status === "PENDING") {
        status = "WORKING";
      }

      return {
        id: item.id,
        title: item.title,
        category: item.category,
        description: item.description,
        completed: !!response?.completed,
        status,
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
  const { completed, status, remarks } = req.body;
  const userId = req.user.userId;

  const today = new Date();
  const start = startOfDay(today);
  const end = endOfDay(today);

  try {
    const existingResponse = await prisma.checklistResponse.findFirst({
      where: {
        checklistItemId: itemId as string,
        createdAt: {
          gte: start,
          lte: end,
        },
      },
    });

    let newStatus = status;
    let newCompleted = completed;

    if (newStatus !== undefined && newCompleted === undefined) {
      newCompleted = newStatus === "WORKING";
    } else if (newCompleted !== undefined && newStatus === undefined) {
      newStatus = newCompleted ? "WORKING" : "PENDING";
    }

    if (existingResponse) {
      const updated = await prisma.checklistResponse.update({
        where: { id: existingResponse.id },
        data: { 
          ...(newCompleted !== undefined && { completed: newCompleted }),
          ...(newStatus !== undefined && { status: newStatus }),
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
        completed: newCompleted || false,
        status: newStatus || "PENDING",
        remarks: remarks || "",
      },
    });

    res.status(201).json(created);
  } catch (error) {
    res.status(500).json({ error: "Failed to update checklist item" });
  }
};

export const bulkUpdateChecklistItems = async (req: any, res: Response) => {
  const { category, status } = req.body;
  const userId = req.user.userId;

  if (!category || !status) {
    return res.status(400).json({ error: "Category and status are required" });
  }

  const today = new Date();
  const start = startOfDay(today);
  const end = endOfDay(today);

  try {
    const items = await prisma.checklistItem.findMany({
      where: { category },
      select: { id: true }
    });

    const completed = status === "WORKING";

    const existingResponses = await prisma.checklistResponse.findMany({
      where: {
        checklistItemId: { in: items.map(i => i.id) },
        createdAt: { gte: start, lte: end }
      }
    });

    const existingItemIds = new Set(existingResponses.map(r => r.checklistItemId));
    const missingItems = items.filter(i => !existingItemIds.has(i.id));

    const transactions = [
      ...existingResponses.map(r => 
        prisma.checklistResponse.update({
          where: { id: r.id },
          data: { status, completed, userId }
        })
      ),
      ...missingItems.map(i => 
        prisma.checklistResponse.create({
          data: {
            checklistItemId: i.id,
            userId,
            completed,
            status,
            remarks: ""
          }
        })
      )
    ];

    await prisma.$transaction(transactions);

    res.json({ success: true, updatedCount: items.length });
  } catch (error) {
    res.status(500).json({ error: "Failed to bulk update checklist category" });
  }
};

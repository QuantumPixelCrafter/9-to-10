import { Router, type IRouter, type Request, type Response } from "express";
import { db, inboxMessagesTable, usersTable } from "@workspace/db";
import { eq, desc } from "drizzle-orm";

const router: IRouter = Router();

router.get("/inbox", async (req: Request, res: Response) => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const messages = await db
    .select({
      id: inboxMessagesTable.id,
      type: inboxMessagesTable.type,
      points: inboxMessagesTable.points,
      message: inboxMessagesTable.message,
      readAt: inboxMessagesTable.readAt,
      createdAt: inboxMessagesTable.createdAt,
      sender: {
        id: usersTable.id,
        username: usersTable.username,
        firstName: usersTable.firstName,
        lastName: usersTable.lastName,
        profileImageUrl: usersTable.profileImageUrl,
        isDeveloper: usersTable.isDeveloper,
      },
    })
    .from(inboxMessagesTable)
    .leftJoin(usersTable, eq(inboxMessagesTable.senderId, usersTable.id))
    .where(eq(inboxMessagesTable.recipientId, req.user!.id))
    .orderBy(desc(inboxMessagesTable.createdAt));

  res.json({ messages });
});

router.put("/inbox/:id/read", async (req: Request, res: Response) => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const { id } = req.params;

  await db
    .update(inboxMessagesTable)
    .set({ readAt: new Date() })
    .where(eq(inboxMessagesTable.id, id));

  res.json({ success: true });
});

router.put("/inbox/read-all", async (req: Request, res: Response) => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  await db
    .update(inboxMessagesTable)
    .set({ readAt: new Date() })
    .where(eq(inboxMessagesTable.recipientId, req.user!.id));

  res.json({ success: true });
});

export default router;

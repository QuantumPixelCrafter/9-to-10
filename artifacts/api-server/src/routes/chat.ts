import { Router, type IRouter } from "express";
import { db, chatMessagesTable, friendshipsTable, usersTable } from "@workspace/db";
import { eq, or, and, desc } from "drizzle-orm";

const router: IRouter = Router();

function requireAuth(req: any, res: any): boolean {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Unauthorized" });
    return false;
  }
  return true;
}

async function areFriends(userId: string, otherId: string): Promise<boolean> {
  const [fs] = await db
    .select()
    .from(friendshipsTable)
    .where(
      and(
        eq(friendshipsTable.status, "accepted"),
        or(
          and(eq(friendshipsTable.requesterId, userId), eq(friendshipsTable.addresseeId, otherId)),
          and(eq(friendshipsTable.requesterId, otherId), eq(friendshipsTable.addresseeId, userId))
        )
      )
    )
    .limit(1);
  return !!fs;
}

// GET messages with a specific user (must be friends)
router.get("/chat/:userId", async (req, res) => {
  if (!requireAuth(req, res)) return;
  const otherId = req.params.userId;

  const friends = await areFriends(req.user.id, otherId);
  if (!friends) {
    res.status(403).json({ error: "You must be friends to chat" });
    return;
  }

  const messages = await db
    .select()
    .from(chatMessagesTable)
    .where(
      or(
        and(eq(chatMessagesTable.senderId, req.user.id), eq(chatMessagesTable.receiverId, otherId)),
        and(eq(chatMessagesTable.senderId, otherId), eq(chatMessagesTable.receiverId, req.user.id))
      )
    )
    .orderBy(desc(chatMessagesTable.createdAt))
    .limit(100);

  // Mark unread messages as read
  await db
    .update(chatMessagesTable)
    .set({ readAt: new Date() })
    .where(
      and(
        eq(chatMessagesTable.senderId, otherId),
        eq(chatMessagesTable.receiverId, req.user.id)
      )
    );

  res.json(messages.reverse());
});

// POST send a message (must be friends)
router.post("/chat/:userId", async (req, res) => {
  if (!requireAuth(req, res)) return;
  const otherId = req.params.userId;
  const { content } = req.body;

  if (!content || typeof content !== "string" || content.trim().length === 0) {
    res.status(400).json({ error: "Message content required" });
    return;
  }
  if (content.trim().length > 2000) {
    res.status(400).json({ error: "Message too long (max 2000 chars)" });
    return;
  }

  const friends = await areFriends(req.user.id, otherId);
  if (!friends) {
    res.status(403).json({ error: "You must be friends to chat" });
    return;
  }

  const [msg] = await db
    .insert(chatMessagesTable)
    .values({ senderId: req.user.id, receiverId: otherId, content: content.trim() })
    .returning();

  res.status(201).json(msg);
});

// GET unread message count across all friends
router.get("/chat/unread/count", async (req, res) => {
  if (!requireAuth(req, res)) return;

  const unread = await db
    .select()
    .from(chatMessagesTable)
    .where(
      and(
        eq(chatMessagesTable.receiverId, req.user.id),
      )
    );

  const count = unread.filter(m => !m.readAt).length;
  res.json({ count });
});

export default router;

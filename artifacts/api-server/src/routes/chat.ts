import { Router, type IRouter } from "express";
import { db, chatMessagesTable, friendshipsTable, usersTable, inboxMessagesTable, userAchievementsTable } from "@workspace/db";
import { eq, or, and, sql } from "drizzle-orm";
import { ACHIEVEMENTS } from "../lib/achievements";

const router: IRouter = Router();

const MESSAGE_COST = 10;

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

async function getUserBalance(userId: string): Promise<number> {
  const [earned, [userRow]] = await Promise.all([
    db.select({ key: userAchievementsTable.achievementKey }).from(userAchievementsTable).where(eq(userAchievementsTable.userId, userId)),
    db.select({ pointsSpent: usersTable.pointsSpent, bonusPoints: usersTable.bonusPoints }).from(usersTable).where(eq(usersTable.id, userId)),
  ]);
  const totalEarned = earned.reduce((sum, e) => {
    const def = ACHIEVEMENTS.find(a => a.key === e.key);
    return sum + (def?.points ?? 0);
  }, 0);
  const bonus = userRow?.bonusPoints ?? 0;
  const spent = userRow?.pointsSpent ?? 0;
  return Math.max(0, totalEarned + bonus - spent);
}

// GET current user's chat balance + warning threshold
router.get("/chat/balance", async (req, res) => {
  if (!requireAuth(req, res)) return;
  const userId = req.user.id;

  const [userRow] = await db
    .select({ chatPointWarningThreshold: usersTable.chatPointWarningThreshold, freeMessages: usersTable.freeMessages })
    .from(usersTable)
    .where(eq(usersTable.id, userId));

  const balance = await getUserBalance(userId);
  res.json({ balance, threshold: userRow?.chatPointWarningThreshold ?? null, messageCost: MESSAGE_COST, freeMessages: userRow?.freeMessages ?? 0 });
});

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
    .orderBy(chatMessagesTable.createdAt)
    .limit(100);

  // Mark unread messages from friend as read (only messages we received)
  await db
    .update(chatMessagesTable)
    .set({ readAt: new Date() })
    .where(
      and(
        eq(chatMessagesTable.senderId, otherId),
        eq(chatMessagesTable.receiverId, req.user.id)
      )
    );

  res.json(messages);
});

// POST send a message (must be friends) — costs 10 pts for sender
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

  // Fetch warning threshold + free message quota
  const [userRow] = await db
    .select({ chatPointWarningThreshold: usersTable.chatPointWarningThreshold, freeMessages: usersTable.freeMessages })
    .from(usersTable)
    .where(eq(usersTable.id, req.user.id));
  const threshold = userRow?.chatPointWarningThreshold ?? null;
  const freeMessages = userRow?.freeMessages ?? 0;

  // Use a free message quota if available, otherwise deduct points
  let balanceBefore: number;
  let balanceAfter: number;
  let usedFreeMessage = false;

  if (freeMessages > 0) {
    usedFreeMessage = true;
    await db
      .update(usersTable)
      .set({ freeMessages: sql`${usersTable.freeMessages} - 1`, updatedAt: new Date() })
      .where(eq(usersTable.id, req.user.id));
    balanceBefore = await getUserBalance(req.user.id);
    balanceAfter = balanceBefore;
  } else {
    // Check sender has enough points
    balanceBefore = await getUserBalance(req.user.id);
    if (balanceBefore < MESSAGE_COST) {
      res.status(402).json({ error: `Not enough points — sending a message costs ${MESSAGE_COST} pts (you have ${balanceBefore} pts)` });
      return;
    }

    // Deduct points from sender
    await db
      .update(usersTable)
      .set({ pointsSpent: sql`${usersTable.pointsSpent} + ${MESSAGE_COST}`, updatedAt: new Date() })
      .where(eq(usersTable.id, req.user.id));

    balanceAfter = balanceBefore - MESSAGE_COST;
  }

  // Send inbox warning if balance just crossed below threshold
  if (threshold !== null && balanceBefore > threshold && balanceAfter <= threshold) {
    const SYSTEM_ID = req.user.id;
    await db.insert(inboxMessagesTable).values({
      recipientId: req.user.id,
      senderId: SYSTEM_ID,
      type: "chat_point_warning",
      points: balanceAfter,
      message: `Your points balance has dropped to ${balanceAfter} pts — at or below your messaging warning threshold of ${threshold} pts. Each message costs ${MESSAGE_COST} pts.`,
    });
  }

  // Insert the message
  const [msg] = await db
    .insert(chatMessagesTable)
    .values({ senderId: req.user.id, receiverId: otherId, content: content.trim() })
    .returning();

  res.status(201).json({ ...msg, balanceAfter, usedFreeMessage });
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

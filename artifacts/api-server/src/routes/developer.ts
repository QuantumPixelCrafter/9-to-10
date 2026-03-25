import { Router, type IRouter, type Request, type Response } from "express";
import { db, usersTable, inboxMessagesTable } from "@workspace/db";
import { eq, sql } from "drizzle-orm";

const router: IRouter = Router();

function requireDeveloper(req: Request, res: Response, next: () => void) {
  if (!req.isAuthenticated() || !req.user?.isDeveloper) {
    res.status(403).json({ error: "Developer access only." });
    return;
  }
  next();
}

router.get("/developer/users", requireDeveloper, async (req: Request, res: Response) => {
  const users = await db
    .select({
      id: usersTable.id,
      username: usersTable.username,
      firstName: usersTable.firstName,
      lastName: usersTable.lastName,
      email: usersTable.email,
      xp: usersTable.xp,
      bonusPoints: usersTable.bonusPoints,
      isDeveloper: usersTable.isDeveloper,
      profileImageUrl: usersTable.profileImageUrl,
    })
    .from(usersTable)
    .orderBy(usersTable.createdAt);

  res.json({ users });
});

router.post("/developer/give-points", requireDeveloper, async (req: Request, res: Response) => {
  const { recipientId, points, message } = req.body;

  if (!recipientId || typeof recipientId !== "string") {
    res.status(400).json({ error: "recipientId is required." });
    return;
  }
  if (!points || typeof points !== "number" || points <= 0 || !Number.isInteger(points)) {
    res.status(400).json({ error: "points must be a positive integer." });
    return;
  }
  if (points > 10000) {
    res.status(400).json({ error: "Cannot give more than 10,000 points at once." });
    return;
  }

  const [recipient] = await db
    .select({ id: usersTable.id })
    .from(usersTable)
    .where(eq(usersTable.id, recipientId))
    .limit(1);

  if (!recipient) {
    res.status(404).json({ error: "User not found." });
    return;
  }

  await db.update(usersTable)
    .set({ bonusPoints: sql`${usersTable.bonusPoints} + ${points}` })
    .where(eq(usersTable.id, recipientId));

  await db.insert(inboxMessagesTable).values({
    recipientId,
    senderId: req.user!.id,
    type: "points",
    points,
    message: message?.trim() || null,
  });

  res.json({ success: true });
});

export default router;

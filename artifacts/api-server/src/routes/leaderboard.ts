import { Router, type IRouter } from "express";
import { db, scoresTable, usersTable } from "@workspace/db";
import { eq, desc } from "drizzle-orm";

const router: IRouter = Router();

router.get("/leaderboard", async (req, res) => {
  const allScores = await db
    .select({
      id: scoresTable.id,
      userId: scoresTable.userId,
      gameType: scoresTable.gameType,
      score: scoresTable.score,
      createdAt: scoresTable.createdAt,
      firstName: usersTable.firstName,
      lastName: usersTable.lastName,
      profileImageUrl: usersTable.profileImageUrl,
    })
    .from(scoresTable)
    .leftJoin(usersTable, eq(scoresTable.userId, usersTable.id))
    .orderBy(desc(scoresTable.score));

  const toEntry = (row: (typeof allScores)[0]) => ({
    id: row.id,
    userId: row.userId,
    displayName: [row.firstName, row.lastName].filter(Boolean).join(" ") || "Anonymous",
    profileImageUrl: row.profileImageUrl ?? null,
    gameType: row.gameType,
    score: row.score,
    createdAt: row.createdAt.toISOString(),
  });

  res.json({
    memoryMatch: allScores.filter(s => s.gameType === "memory-match").slice(0, 20).map(toEntry),
    bubblePop: allScores.filter(s => s.gameType === "bubble-pop").slice(0, 20).map(toEntry),
    quiz: allScores.filter(s => s.gameType === "quiz").slice(0, 20).map(toEntry),
  });
});

router.post("/leaderboard/scores", async (req, res) => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const { gameType, score } = req.body;
  if (!gameType || typeof score !== "number") {
    res.status(400).json({ error: "gameType and score are required" });
    return;
  }

  const [saved] = await db
    .insert(scoresTable)
    .values({ userId: req.user.id, gameType, score })
    .returning();

  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, req.user.id));

  res.json({
    id: saved.id,
    userId: saved.userId,
    displayName: [user?.firstName, user?.lastName].filter(Boolean).join(" ") || "Anonymous",
    profileImageUrl: user?.profileImageUrl ?? null,
    gameType: saved.gameType,
    score: saved.score,
    createdAt: saved.createdAt.toISOString(),
  });
});

export default router;

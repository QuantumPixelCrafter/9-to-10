import { Router, type IRouter } from "express";
import { db, scoresTable, usersTable } from "@workspace/db";
import { eq, desc } from "drizzle-orm";
import { awardXp, getLevelProgress } from "../lib/xp";

const router: IRouter = Router();

router.get("/leaderboard", async (req, res) => {
  const quizLevel = typeof req.query.quizLevel === "string" ? req.query.quizLevel : null;
  const quizSubject = typeof req.query.quizSubject === "string" ? req.query.quizSubject : null;

  const allScores = await db
    .select({
      id: scoresTable.id,
      userId: scoresTable.userId,
      gameType: scoresTable.gameType,
      score: scoresTable.score,
      subject: scoresTable.subject,
      userLevel: scoresTable.userLevel,
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
    subject: row.subject ?? null,
    userLevel: row.userLevel ?? null,
    createdAt: row.createdAt.toISOString(),
  });

  const memoryMatch = allScores.filter(s => s.gameType === "memory-match").slice(0, 20).map(toEntry);
  const bubblePop = allScores.filter(s => s.gameType === "bubble-pop").slice(0, 20).map(toEntry);

  let quizScores = allScores.filter(s => s.gameType === "quiz");
  if (quizLevel) quizScores = quizScores.filter(s => s.userLevel === quizLevel);
  if (quizSubject) quizScores = quizScores.filter(s => s.subject === quizSubject);
  const quiz = quizScores.slice(0, 20).map(toEntry);

  const allQuiz = allScores.filter(s => s.gameType === "quiz");
  const quizSubjects = [...new Set(allQuiz.filter(s => !quizLevel || s.userLevel === quizLevel).map(s => s.subject).filter(Boolean))].sort();
  const quizLevels = [...new Set(allQuiz.map(s => s.userLevel).filter(Boolean))].sort();

  // XP / game level leaderboard
  const xpBoard = await db
    .select({
      id: usersTable.id,
      firstName: usersTable.firstName,
      lastName: usersTable.lastName,
      profileImageUrl: usersTable.profileImageUrl,
      level: usersTable.level,
      gameLevel: usersTable.gameLevel,
      xp: usersTable.xp,
      equippedNametag: usersTable.equippedNametag,
    })
    .from(usersTable)
    .orderBy(desc(usersTable.xp))
    .limit(50);

  const levelBoard = xpBoard.map((u, i) => ({
    rank: i + 1,
    userId: u.id,
    displayName: [u.firstName, u.lastName].filter(Boolean).join(" ") || "Anonymous",
    profileImageUrl: u.profileImageUrl ?? null,
    level: u.level ?? null,
    gameLevel: u.gameLevel ?? 1,
    xp: u.xp ?? 0,
    equippedNametag: u.equippedNametag ?? null,
    levelProgress: getLevelProgress(u.xp ?? 0),
  }));

  res.json({
    memoryMatch,
    bubblePop,
    quiz,
    levelBoard,
    quizMeta: {
      levels: quizLevels,
      subjects: quizSubjects,
    },
  });
});

router.post("/leaderboard/scores", async (req, res) => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const { gameType, score, subject, userLevel } = req.body;
  if (!gameType || typeof score !== "number") {
    res.status(400).json({ error: "gameType and score are required" });
    return;
  }

  const [saved] = await db
    .insert(scoresTable)
    .values({
      userId: req.user.id,
      gameType,
      score,
      subject: subject ?? null,
      userLevel: userLevel ?? null,
    })
    .returning();

  // Award XP based on game type
  let xpAwarded = 0;
  let levelUp: { leveledUp: boolean; newLevel: number } | null = null;
  try {
    if (gameType === "quiz") {
      xpAwarded = Math.max(5, Math.floor(score * 0.25));
    } else {
      xpAwarded = Math.max(2, Math.floor(score * 0.05));
    }
    const result = await awardXp(req.user.id, xpAwarded);
    levelUp = { leveledUp: result.leveledUp, newLevel: result.newLevel };
  } catch {}

  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, req.user.id));

  res.json({
    id: saved.id,
    userId: saved.userId,
    displayName: [user?.firstName, user?.lastName].filter(Boolean).join(" ") || "Anonymous",
    profileImageUrl: user?.profileImageUrl ?? null,
    gameType: saved.gameType,
    score: saved.score,
    subject: saved.subject ?? null,
    userLevel: saved.userLevel ?? null,
    createdAt: saved.createdAt.toISOString(),
    xpAwarded,
    levelUp,
  });
});

export default router;

import { Router, type IRouter } from "express";
import { db, scoresTable, usersTable } from "@workspace/db";
import { eq, desc, and } from "drizzle-orm";

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

  res.json({
    memoryMatch,
    bubblePop,
    quiz,
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
  });
});

export default router;

import { Router, type IRouter } from "express";
import { db, usersTable, userAchievementsTable, scoresTable, friendshipsTable } from "@workspace/db";
import { eq, or, and, desc } from "drizzle-orm";
import { ACHIEVEMENTS } from "../lib/achievements";
import { getLevelProgress } from "../lib/xp";

const router: IRouter = Router();

// GET public profile of any user
router.get("/users/:userId", async (req, res) => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  const { userId } = req.params;

  const [user] = await db
    .select({
      id: usersTable.id,
      username: usersTable.username,
      firstName: usersTable.firstName,
      lastName: usersTable.lastName,
      profileImageUrl: usersTable.profileImageUrl,
      level: usersTable.level,
      gameLevel: usersTable.gameLevel,
      xp: usersTable.xp,
      equippedBackground: usersTable.equippedBackground,
      equippedFrame: usersTable.equippedFrame,
      equippedNametag: usersTable.equippedNametag,
      isPublic: usersTable.isPublic,
      createdAt: usersTable.createdAt,
    })
    .from(usersTable)
    .where(eq(usersTable.id, userId))
    .limit(1);

  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }

  const isOwnProfile = user.id === req.user.id;

  // Achievements
  const earnedRows = await db
    .select()
    .from(userAchievementsTable)
    .where(eq(userAchievementsTable.userId, userId));
  const earned = new Set(earnedRows.map(r => r.achievementKey));
  const totalPoints = earnedRows.reduce((sum, e) => {
    const def = ACHIEVEMENTS.find(a => a.key === e.key);
    return sum + (def?.points ?? 0);
  }, 0);
  const achievements = ACHIEVEMENTS.map(a => ({
    ...a,
    earned: earned.has(a.key),
    earnedAt: earnedRows.find(r => r.achievementKey === a.key)?.earnedAt ?? null,
  }));

  // Top scores
  const scores = await db
    .select()
    .from(scoresTable)
    .where(eq(scoresTable.userId, userId))
    .orderBy(desc(scoresTable.score))
    .limit(50);

  const bestMemory = scores.filter(s => s.gameType === "memory-match").sort((a, b) => b.score - a.score)[0] ?? null;
  const bestBubble = scores.filter(s => s.gameType === "bubble-pop").sort((a, b) => b.score - a.score)[0] ?? null;
  const bestQuiz = scores.filter(s => s.gameType === "quiz").sort((a, b) => b.score - a.score)[0] ?? null;

  // Friendship status with caller
  const [fs] = await db
    .select()
    .from(friendshipsTable)
    .where(
      or(
        and(eq(friendshipsTable.requesterId, req.user.id), eq(friendshipsTable.addresseeId, userId)),
        and(eq(friendshipsTable.requesterId, userId), eq(friendshipsTable.addresseeId, req.user.id))
      )
    )
    .limit(1);

  const levelInfo = getLevelProgress(user.xp ?? 0);

  const isPublic = user.isPublic !== false;

  res.json({
    id: user.id,
    username: user.username ?? null,
    displayName: [user.firstName, user.lastName].filter(Boolean).join(" ") || user.username || "Anonymous",
    profileImageUrl: user.profileImageUrl ?? null,
    isPublic,
    level: user.level ?? null,
    gameLevel: user.gameLevel ?? 1,
    xp: user.xp ?? 0,
    levelProgress: levelInfo,
    equippedBackground: user.equippedBackground ?? null,
    equippedFrame: user.equippedFrame ?? null,
    equippedNametag: user.equippedNametag ?? null,
    createdAt: user.createdAt.toISOString(),
    achievements: { earned: earned.size, total: ACHIEVEMENTS.length, totalPoints, list: achievements },
    scores: { memory: bestMemory?.score ?? null, bubble: bestBubble?.score ?? null, quiz: bestQuiz?.score ?? null },
    friendship: fs
      ? { id: fs.id, status: fs.status, iAmRequester: fs.requesterId === req.user.id }
      : null,
  });
});

// GET all users (for leaderboard / friends search)
router.get("/users", async (req, res) => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const users = await db
    .select({
      id: usersTable.id,
      username: usersTable.username,
      firstName: usersTable.firstName,
      lastName: usersTable.lastName,
      profileImageUrl: usersTable.profileImageUrl,
      level: usersTable.level,
      gameLevel: usersTable.gameLevel,
      xp: usersTable.xp,
      equippedNametag: usersTable.equippedNametag,
      isPublic: usersTable.isPublic,
      showNameInSearch: usersTable.showNameInSearch,
    })
    .from(usersTable)
    .orderBy(usersTable.gameLevel);

  res.json(
    users
      .filter(u => u.isPublic !== false || u.id === req.user.id)
      .map(u => {
        const showName = u.showNameInSearch !== false || u.id === req.user.id;
        const fullName = [u.firstName, u.lastName].filter(Boolean).join(" ");
        return {
          ...u,
          displayName: showName ? (fullName || u.username || "Anonymous") : (u.username || "Anonymous"),
        };
      })
  );
});

export default router;

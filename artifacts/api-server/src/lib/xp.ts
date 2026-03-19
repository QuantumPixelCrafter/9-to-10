import { db, usersTable } from "@workspace/db";
import { eq, sql } from "drizzle-orm";

// XP required to reach each level (index = level - 1)
export const LEVEL_THRESHOLDS = [
  0,       // Level 1
  100,     // Level 2
  250,     // Level 3
  500,     // Level 4
  900,     // Level 5
  1400,    // Level 6
  2100,    // Level 7
  3000,    // Level 8
  4200,    // Level 9
  6000,    // Level 10
  8500,    // Level 11
  12000,   // Level 12
  16000,   // Level 13
  21000,   // Level 14
  27000,   // Level 15
  34000,   // Level 16
  42000,   // Level 17
  51000,   // Level 18
  61000,   // Level 19
  75000,   // Level 20 (max)
];

export const MAX_LEVEL = LEVEL_THRESHOLDS.length;

export function getLevelFromXp(xp: number): number {
  let level = 1;
  for (let i = 0; i < LEVEL_THRESHOLDS.length; i++) {
    if (xp >= LEVEL_THRESHOLDS[i]!) level = i + 1;
  }
  return Math.min(level, MAX_LEVEL);
}

export function getXpForLevel(level: number): number {
  return LEVEL_THRESHOLDS[Math.min(level - 1, LEVEL_THRESHOLDS.length - 1)] ?? 0;
}

export function getXpForNextLevel(level: number): number | null {
  if (level >= MAX_LEVEL) return null;
  return LEVEL_THRESHOLDS[level] ?? null;
}

export function getLevelProgress(xp: number): { level: number; currentXp: number; xpInLevel: number; xpNeeded: number; progress: number } {
  const level = getLevelFromXp(xp);
  const currentLevelXp = getXpForLevel(level);
  const nextLevelXp = getXpForNextLevel(level);
  const xpInLevel = xp - currentLevelXp;
  const xpNeeded = nextLevelXp !== null ? nextLevelXp - currentLevelXp : 0;
  const progress = nextLevelXp !== null ? Math.min(100, Math.round((xpInLevel / xpNeeded) * 100)) : 100;
  return { level, currentXp: xp, xpInLevel, xpNeeded, progress };
}

export async function awardXp(userId: string, amount: number): Promise<{ newXp: number; newLevel: number; leveledUp: boolean; oldLevel: number }> {
  const [user] = await db.select({ xp: usersTable.xp, gameLevel: usersTable.gameLevel }).from(usersTable).where(eq(usersTable.id, userId));
  if (!user) throw new Error("User not found");

  const oldLevel = user.gameLevel ?? 1;
  const newXp = (user.xp ?? 0) + amount;
  const newLevel = getLevelFromXp(newXp);
  const leveledUp = newLevel > oldLevel;

  await db.update(usersTable).set({ xp: newXp, gameLevel: newLevel }).where(eq(usersTable.id, userId));

  return { newXp, newLevel, leveledUp, oldLevel };
}

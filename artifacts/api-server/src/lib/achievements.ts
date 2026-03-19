import { db, notesTable, subjectsTable, goalsTable, schedulesTable, moodsTable, scoresTable, userAchievementsTable, usersTable } from "@workspace/db";
import { eq, count, and } from "drizzle-orm";

export interface AchievementDef {
  key: string;
  title: string;
  description: string;
  icon: string;
  points: number;
  category: "general" | "notes" | "quiz" | "goals" | "timetable" | "mood" | "games";
}

export const ACHIEVEMENTS: AchievementDef[] = [
  // General
  { key: "welcome",          title: "Welcome!",          description: "Join Study Smart",                      icon: "🎉", points: 10,  category: "general" },
  { key: "level_set",        title: "All Set",            description: "Choose your education level",           icon: "🎓", points: 20,  category: "general" },

  // Notes
  { key: "first_note",       title: "First Words",        description: "Create your first note",                icon: "📝", points: 15,  category: "notes" },
  { key: "notes_5",          title: "Note Taker",         description: "Write 5 notes",                         icon: "📚", points: 30,  category: "notes" },
  { key: "notes_20",         title: "Knowledge Base",     description: "Write 20 notes",                        icon: "🧠", points: 75,  category: "notes" },
  { key: "first_subject",    title: "Organized",          description: "Create your first subject",             icon: "📁", points: 15,  category: "notes" },
  { key: "subjects_3",       title: "Multi-Subject",      description: "Create 3 or more subjects",             icon: "🗂️", points: 40,  category: "notes" },

  // Goals
  { key: "first_goal",       title: "Goal Setter",        description: "Set your first goal",                   icon: "🎯", points: 15,  category: "goals" },
  { key: "goal_completed",   title: "Goal Crusher",       description: "Complete your first goal",              icon: "✅", points: 30,  category: "goals" },
  { key: "goals_5_done",     title: "Overachiever",       description: "Complete 5 goals",                      icon: "🌟", points: 75,  category: "goals" },

  // Timetable
  { key: "first_event",      title: "Scheduled",          description: "Add your first timetable event",        icon: "📅", points: 15,  category: "timetable" },
  { key: "events_5",         title: "Planner",            description: "Schedule 5 or more events",             icon: "🗓️", points: 35,  category: "timetable" },
  { key: "exam_scheduled",   title: "Exam Ready",         description: "Add an exam event to your timetable",   icon: "📋", points: 25,  category: "timetable" },
  { key: "eca_scheduled",    title: "All-Rounder",        description: "Schedule an ECA activity",              icon: "⚽", points: 20,  category: "timetable" },

  // Mood
  { key: "first_mood",       title: "Check-In",           description: "Log your first mood",                   icon: "😊", points: 10,  category: "mood" },
  { key: "mood_7",           title: "Consistent",         description: "Log your mood 7 times",                 icon: "💪", points: 50,  category: "mood" },
  { key: "mood_30",          title: "Mood Master",        description: "Log your mood 30 times",                icon: "🧘", points: 150, category: "mood" },

  // Games & Quiz
  { key: "memory_match",     title: "Memory Pro",         description: "Submit a Memory Match score",           icon: "🃏", points: 20,  category: "games" },
  { key: "bubble_pop",       title: "Pop Star",           description: "Submit a Bubble Pop score",             icon: "🫧", points: 20,  category: "games" },
  { key: "quiz_submitted",   title: "Quiz Time",          description: "Submit your first quiz score",          icon: "❓", points: 25,  category: "quiz" },
  { key: "quiz_5",           title: "Quiz Regular",       description: "Submit 5 quiz scores",                  icon: "📊", points: 60,  category: "quiz" },
  { key: "quiz_10",          title: "Quiz Master",        description: "Submit 10 quiz scores",                 icon: "🏆", points: 100, category: "quiz" },
  { key: "all_games",        title: "Triple Threat",      description: "Play all three game types",             icon: "🎮", points: 50,  category: "games" },
];

export interface AchievementWithStatus extends AchievementDef {
  earned: boolean;
  earnedAt?: string;
}

export async function getUserAchievements(userId: string): Promise<AchievementWithStatus[]> {
  const earned = await db
    .select()
    .from(userAchievementsTable)
    .where(eq(userAchievementsTable.userId, userId));

  const earnedMap = new Map(earned.map(e => [e.achievementKey, e.earnedAt]));

  return ACHIEVEMENTS.map(a => ({
    ...a,
    earned: earnedMap.has(a.key),
    earnedAt: earnedMap.get(a.key)?.toISOString(),
  }));
}

export async function checkAndAwardAchievements(userId: string): Promise<AchievementDef[]> {
  const [
    alreadyEarned,
    [userRow],
    [{ notesCount }],
    [{ subjectsCount }],
    [{ goalsCount }],
    [{ goalsCompletedCount }],
    [{ schedulesCount }],
    [{ moodsCount }],
    userScores,
    examSchedule,
    ecaSchedule,
  ] = await Promise.all([
    db.select({ key: userAchievementsTable.achievementKey }).from(userAchievementsTable).where(eq(userAchievementsTable.userId, userId)),
    db.select({ level: usersTable.level }).from(usersTable).where(eq(usersTable.id, userId)),
    db.select({ notesCount: count() }).from(notesTable),
    db.select({ subjectsCount: count() }).from(subjectsTable),
    db.select({ goalsCount: count() }).from(goalsTable),
    db.select({ goalsCompletedCount: count() }).from(goalsTable).where(eq(goalsTable.completed, true)),
    db.select({ schedulesCount: count() }).from(schedulesTable),
    db.select({ moodsCount: count() }).from(moodsTable),
    db.select({ gameType: scoresTable.gameType }).from(scoresTable).where(eq(scoresTable.userId, userId)),
    db.select({ id: schedulesTable.id }).from(schedulesTable).where(eq(schedulesTable.eventType, "exam")).limit(1),
    db.select({ id: schedulesTable.id }).from(schedulesTable).where(eq(schedulesTable.eventType, "eca")).limit(1),
  ]);

  const alreadyEarnedSet = new Set(alreadyEarned.map(e => e.key));

  const gameTypes = new Set(userScores.map(s => s.gameType));
  const quizScoreCount = userScores.filter(s => s.gameType === "quiz").length;

  const conditions: Record<string, boolean> = {
    welcome:        true,
    level_set:      !!userRow?.level,
    first_note:     notesCount >= 1,
    notes_5:        notesCount >= 5,
    notes_20:       notesCount >= 20,
    first_subject:  subjectsCount >= 1,
    subjects_3:     subjectsCount >= 3,
    first_goal:     goalsCount >= 1,
    goal_completed: goalsCompletedCount >= 1,
    goals_5_done:   goalsCompletedCount >= 5,
    first_event:    schedulesCount >= 1,
    events_5:       schedulesCount >= 5,
    exam_scheduled: examSchedule.length > 0,
    eca_scheduled:  ecaSchedule.length > 0,
    first_mood:     moodsCount >= 1,
    mood_7:         moodsCount >= 7,
    mood_30:        moodsCount >= 30,
    memory_match:   gameTypes.has("memory-match"),
    bubble_pop:     gameTypes.has("bubble-pop"),
    quiz_submitted: quizScoreCount >= 1,
    quiz_5:         quizScoreCount >= 5,
    quiz_10:        quizScoreCount >= 10,
    all_games:      gameTypes.has("memory-match") && gameTypes.has("bubble-pop") && gameTypes.has("quiz"),
  };

  const newlyEarned: AchievementDef[] = [];
  for (const [key, earned] of Object.entries(conditions)) {
    if (earned && !alreadyEarnedSet.has(key)) {
      const def = ACHIEVEMENTS.find(a => a.key === key);
      if (def) {
        await db.insert(userAchievementsTable).values({ userId, achievementKey: key }).onConflictDoNothing();
        newlyEarned.push(def);
      }
    }
  }

  return newlyEarned;
}

export function getTotalPoints(achievements: AchievementWithStatus[]): number {
  return achievements.filter(a => a.earned).reduce((sum, a) => sum + a.points, 0);
}

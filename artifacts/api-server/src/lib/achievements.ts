import { db, notesTable, subjectsTable, goalsTable, schedulesTable, moodsTable, scoresTable, userAchievementsTable, usersTable } from "@workspace/db";
import { eq, count, and, sum, isNotNull, asc } from "drizzle-orm";
import { sql } from "drizzle-orm";

export interface AchievementDef {
  key: string;
  title: string;
  description: string;
  requirement: string;
  icon: string;
  points: number;
  category: "general" | "notes" | "quiz" | "goals" | "timetable" | "mood" | "games";
}

export const ACHIEVEMENTS: AchievementDef[] = [
  // General
  { key: "welcome",          title: "Welcome!",            description: "Join Study Smart",                                                   requirement: "Create your account",                                          icon: "🎉", points: 10,  category: "general" },
  { key: "level_set",        title: "All Set",              description: "Choose your education level",                                        requirement: "Select your education level in your profile",                  icon: "🎓", points: 20,  category: "general" },

  // Game Level milestones
  { key: "game_level_1",    title: "First Steps",           description: "You've begun your journey. Every legend starts somewhere.",          requirement: "Reach Game Level 1",                                           icon: "👣", points: 10,  category: "general" },
  { key: "game_level_25",   title: "Rising Challenger",     description: "Your skills are sharpening, and your presence is being felt.",       requirement: "Reach Game Level 25",                                          icon: "⚔️", points: 75,  category: "general" },
  { key: "game_level_50",   title: "Seasoned Warrior",      description: "Halfway to greatness—your dedication is undeniable.",                requirement: "Reach Game Level 50",                                          icon: "🛡️", points: 150, category: "general" },
  { key: "game_level_75",   title: "Master of Trials",      description: "Few reach this height. You've proven your strength and resilience.", requirement: "Reach Game Level 75",                                          icon: "👑", points: 250, category: "general" },
  { key: "game_level_100",  title: "Legend Eternal",        description: "The pinnacle of achievement. Your name will be remembered forever.", requirement: "Reach Game Level 100",                                         icon: "🌠", points: 500, category: "general" },

  // Achievement Points milestones
  { key: "points_50",       title: "Getting Started",       description: "Your first milestone—proof that progress has begun.",                requirement: "Earn 50 total achievement points",                              icon: "💫", points: 5,   category: "general" },
  { key: "points_500",      title: "Point Collector",       description: "You're gathering momentum, stacking up rewards with skill.",         requirement: "Earn 500 total achievement points",                             icon: "💎", points: 10,  category: "general" },
  { key: "points_2000",     title: "Treasure Hunter",       description: "Your dedication shines as you uncover riches of effort.",            requirement: "Earn 2,000 total achievement points",                           icon: "🏅", points: 20,  category: "general" },
  { key: "points_5000",     title: "Elite Scorer",          description: "You've reached rare heights—few achieve this level of mastery.",     requirement: "Earn 5,000 total achievement points",                           icon: "🥇", points: 50,  category: "general" },
  { key: "points_10000",    title: "Mythic Champion",       description: "The ultimate accolade. Your name echoes in legend.",                 requirement: "Earn 10,000 total achievement points",                          icon: "🏆", points: 100, category: "general" },

  // Notes
  { key: "first_note",       title: "First Words",          description: "Create your first note",                                            requirement: "Create your first note",                                       icon: "📝", points: 15,  category: "notes" },
  { key: "notes_5",          title: "Note Taker",           description: "Write 5 notes",                                                     requirement: "Write 5 notes",                                                icon: "📚", points: 30,  category: "notes" },
  { key: "notes_20",         title: "Knowledge Base",       description: "Write 20 notes",                                                    requirement: "Write 20 notes",                                               icon: "🧠", points: 75,  category: "notes" },
  { key: "first_subject",    title: "Organized",            description: "Create your first subject",                                         requirement: "Create your first subject",                                    icon: "📁", points: 15,  category: "notes" },
  { key: "subjects_3",       title: "Multi-Subject",        description: "Create 3 or more subjects",                                         requirement: "Create 3 or more subjects",                                    icon: "🗂️", points: 40,  category: "notes" },

  // Goals
  { key: "first_goal",       title: "Goal Setter",          description: "Set your first goal",                                               requirement: "Set your first goal",                                          icon: "🎯", points: 15,  category: "goals" },
  { key: "goal_completed",   title: "Goal Crusher",         description: "Complete your first goal",                                          requirement: "Mark your first goal as complete",                             icon: "✅", points: 30,  category: "goals" },
  { key: "goals_5_done",     title: "Overachiever",         description: "Complete 5 goals",                                                  requirement: "Complete 5 goals",                                             icon: "🌟", points: 75,  category: "goals" },

  // Timetable
  { key: "first_event",      title: "Scheduled",            description: "Add your first timetable event",                                    requirement: "Add your first event to the timetable",                        icon: "📅", points: 15,  category: "timetable" },
  { key: "events_5",         title: "Planner",              description: "Schedule 5 or more events",                                         requirement: "Add 5 or more events to your timetable",                       icon: "🗓️", points: 35,  category: "timetable" },
  { key: "exam_scheduled",   title: "Exam Ready",           description: "Add an exam event to your timetable",                               requirement: "Add an exam event to your timetable",                          icon: "📋", points: 25,  category: "timetable" },
  { key: "eca_scheduled",    title: "All-Rounder",          description: "Schedule an ECA activity",                                          requirement: "Add an ECA activity to your timetable",                        icon: "⚽", points: 20,  category: "timetable" },

  // Mood
  { key: "first_mood",       title: "Check-In",             description: "Log your first mood",                                               requirement: "Log your mood for the first time",                             icon: "😊", points: 10,  category: "mood" },
  { key: "mood_7",           title: "Consistent",           description: "Log your mood 7 times",                                             requirement: "Log your mood 7 times",                                        icon: "💪", points: 50,  category: "mood" },
  { key: "mood_30",          title: "Mood Master",          description: "Log your mood 30 times",                                            requirement: "Log your mood 30 times",                                       icon: "🧘", points: 150, category: "mood" },

  // Quiz milestones
  { key: "quiz_submitted",         title: "Quiz Time",          description: "Submit your first quiz score",                                  requirement: "Complete and submit a quiz",                                   icon: "❓", points: 25,  category: "quiz" },
  { key: "quiz_5",                 title: "Quiz Regular",       description: "Submit 5 quiz scores",                                          requirement: "Submit 5 quiz scores",                                         icon: "📊", points: 60,  category: "quiz" },
  { key: "quiz_10",                title: "Quiz Veteran",       description: "Submit 10 quiz scores",                                         requirement: "Submit 10 quiz scores",                                        icon: "🎖️", points: 100, category: "quiz" },
  { key: "quiz_first_attempt",     title: "First Attempt",      description: "You've taken the leap—your learning journey begins here.",      requirement: "Complete your first quiz",                                     icon: "🎯", points: 15,  category: "quiz" },
  { key: "quiz_curious_learner",   title: "Curious Learner",    description: "Your thirst for knowledge is growing stronger.",                requirement: "Submit 10 quiz scores",                                        icon: "🔍", points: 40,  category: "quiz" },
  { key: "quiz_dedicated_scholar", title: "Dedicated Scholar",  description: "Consistency pays off—you're mastering the art of practice.",   requirement: "Submit 50 quiz scores",                                        icon: "📖", points: 100, category: "quiz" },
  { key: "quiz_knowledge_seeker",  title: "Knowledge Seeker",   description: "A true explorer of wisdom, pushing boundaries with every test.",requirement: "Submit 100 quiz scores",                                       icon: "🧭", points: 200, category: "quiz" },
  { key: "quiz_master_200",        title: "Quiz Master",        description: "You've conquered countless challenges—your expertise shines bright.", requirement: "Submit 200 quiz scores",                                  icon: "🎓", points: 400, category: "quiz" },

  // Games — existing
  { key: "memory_match",     title: "Memory Pro",           description: "Submit a Memory Match score",                                       requirement: "Complete a Memory Match game",                                  icon: "🃏", points: 20,  category: "games" },
  { key: "bubble_pop",       title: "Pop Star",             description: "Submit a Bubble Pop score",                                         requirement: "Play a round of Bubble Pop",                                   icon: "🫧", points: 20,  category: "games" },
  { key: "all_games",        title: "Triple Threat",        description: "Play all three game types",                                         requirement: "Play Memory Match, Bubble Pop, and complete a Quiz",            icon: "🎮", points: 50,  category: "games" },

  // Bubble Pop milestones (cumulative bubbles popped)
  { key: "bubbles_10",       title: "Pop Rookie",           description: "You've started bursting bubbles—keep the streak alive!",            requirement: "Pop 10 bubbles total across all Bubble Pop games",              icon: "🫧", points: 20,  category: "games" },
  { key: "bubbles_25",       title: "Bubble Breaker",       description: "Your popping skills are growing sharper with every tap.",           requirement: "Pop 25 bubbles total across all Bubble Pop games",              icon: "💦", points: 40,  category: "games" },
  { key: "bubbles_50",       title: "Burst Specialist",     description: "You've proven your speed and precision in bubble popping.",         requirement: "Pop 50 bubbles total across all Bubble Pop games",              icon: "⚡", points: 75,  category: "games" },
  { key: "bubbles_100",      title: "Bubble Storm",         description: "An unstoppable flurry—your popping power is unmatched.",           requirement: "Pop 100 bubbles total across all Bubble Pop games",             icon: "🌪️", points: 150, category: "games" },
  { key: "bubbles_200",      title: "Bubble Deity",         description: "Beyond mortal limits—you've ascended to divine popping status.",   requirement: "Pop 200 bubbles total across all Bubble Pop games",             icon: "🔮", points: 300, category: "games" },

  // Memory Match time achievements
  { key: "memory_under_50",  title: "Swift Starter",        description: "You've proven you can finish fast—speed is on your side.",          requirement: "Complete Memory Match in under 50 seconds",                    icon: "⏱️", points: 30,  category: "games" },
  { key: "memory_under_30",  title: "Rapid Runner",         description: "Your reflexes and focus are razor sharp.",                          requirement: "Complete Memory Match in under 30 seconds",                    icon: "🏃", points: 60,  category: "games" },
  { key: "memory_under_20",  title: "Lightning Striker",    description: "You blaze through challenges with electrifying speed.",             requirement: "Complete Memory Match in under 20 seconds",                    icon: "⚡", points: 100, category: "games" },
  { key: "memory_under_15",  title: "Blazing Phantom",      description: "Almost untouchable—your moves are a blur.",                        requirement: "Complete Memory Match in under 15 seconds",                    icon: "👻", points: 200, category: "games" },
  { key: "memory_under_10",  title: "Time-Breaker",         description: "So hard, yet you did it. You've shattered the limits of possibility.", requirement: "Complete Memory Match in under 10 seconds",                icon: "💥", points: 500, category: "games" },
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
    [{ totalBubbles }],
    bestMemoryTime,
  ] = await Promise.all([
    db.select({ key: userAchievementsTable.achievementKey }).from(userAchievementsTable).where(eq(userAchievementsTable.userId, userId)),
    db.select({ level: usersTable.level, gameLevel: usersTable.gameLevel }).from(usersTable).where(eq(usersTable.id, userId)),
    db.select({ notesCount: count() }).from(notesTable),
    db.select({ subjectsCount: count() }).from(subjectsTable),
    db.select({ goalsCount: count() }).from(goalsTable),
    db.select({ goalsCompletedCount: count() }).from(goalsTable).where(eq(goalsTable.completed, true)),
    db.select({ schedulesCount: count() }).from(schedulesTable),
    db.select({ moodsCount: count() }).from(moodsTable),
    db.select({ gameType: scoresTable.gameType }).from(scoresTable).where(eq(scoresTable.userId, userId)),
    db.select({ id: schedulesTable.id }).from(schedulesTable).where(eq(schedulesTable.eventType, "exam")).limit(1),
    db.select({ id: schedulesTable.id }).from(schedulesTable).where(eq(schedulesTable.eventType, "eca")).limit(1),
    db.select({ totalBubbles: sql<number>`coalesce(sum(${scoresTable.score}), 0)` })
      .from(scoresTable)
      .where(and(eq(scoresTable.userId, userId), eq(scoresTable.gameType, "bubble-pop"))),
    db.select({ secondsTaken: scoresTable.secondsTaken })
      .from(scoresTable)
      .where(and(eq(scoresTable.userId, userId), eq(scoresTable.gameType, "memory-match"), isNotNull(scoresTable.secondsTaken)))
      .orderBy(asc(scoresTable.secondsTaken))
      .limit(1),
  ]);

  const alreadyEarnedSet = new Set(alreadyEarned.map(e => e.key));

  // Compute total achievement points already earned
  const earnedPointsTotal = alreadyEarned.reduce((sum, e) => {
    const def = ACHIEVEMENTS.find(a => a.key === e.key);
    return sum + (def?.points ?? 0);
  }, 0);

  const gameTypes = new Set(userScores.map(s => s.gameType));
  const quizScoreCount = userScores.filter(s => s.gameType === "quiz").length;
  const bubbleTotal = Number(totalBubbles ?? 0);
  const bestMemorySecs = bestMemoryTime[0]?.secondsTaken ?? null;
  const gameLevel = userRow?.gameLevel ?? 1;

  const conditions: Record<string, boolean> = {
    // Existing
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

    // Game Level milestones
    game_level_1:   gameLevel >= 1,
    game_level_25:  gameLevel >= 25,
    game_level_50:  gameLevel >= 50,
    game_level_75:  gameLevel >= 75,
    game_level_100: gameLevel >= 100,

    // Achievement Points milestones
    points_50:      earnedPointsTotal >= 50,
    points_500:     earnedPointsTotal >= 500,
    points_2000:    earnedPointsTotal >= 2000,
    points_5000:    earnedPointsTotal >= 5000,
    points_10000:   earnedPointsTotal >= 10000,

    // Quiz milestones
    quiz_first_attempt:     quizScoreCount >= 1,
    quiz_curious_learner:   quizScoreCount >= 10,
    quiz_dedicated_scholar: quizScoreCount >= 50,
    quiz_knowledge_seeker:  quizScoreCount >= 100,
    quiz_master_200:        quizScoreCount >= 200,

    // Bubble Pop milestones (cumulative bubbles)
    bubbles_10:  bubbleTotal >= 10,
    bubbles_25:  bubbleTotal >= 25,
    bubbles_50:  bubbleTotal >= 50,
    bubbles_100: bubbleTotal >= 100,
    bubbles_200: bubbleTotal >= 200,

    // Memory Match time achievements
    memory_under_50: bestMemorySecs !== null && bestMemorySecs <= 50,
    memory_under_30: bestMemorySecs !== null && bestMemorySecs <= 30,
    memory_under_20: bestMemorySecs !== null && bestMemorySecs <= 20,
    memory_under_15: bestMemorySecs !== null && bestMemorySecs <= 15,
    memory_under_10: bestMemorySecs !== null && bestMemorySecs <= 10,
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

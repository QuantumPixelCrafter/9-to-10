import { db, notesTable, subjectsTable, goalsTable, schedulesTable, moodsTable, scoresTable, userAchievementsTable, usersTable } from "@workspace/db";
import { eq, count, and, sum, isNotNull, asc, gte } from "drizzle-orm";
import { sql } from "drizzle-orm";

export interface AchievementDef {
  key: string;
  title: string;
  description: string;
  requirement: string;
  icon: string;
  points: number;
  category: "general" | "notes" | "quiz" | "goals" | "timetable" | "mood" | "games" | "challenges";
  periodic?: "weekly" | "monthly" | "seasonal";
}

export const ACHIEVEMENTS: AchievementDef[] = [
  // General
  { key: "welcome",          title: "Welcome!",            description: "Join Study Smart",                                                   requirement: "Create your account",                                          icon: "🎉", points: 40,  category: "general" },
  { key: "level_set",        title: "All Set",              description: "Choose your education level",                                        requirement: "Select your education level in your profile",                  icon: "🎓", points: 80,  category: "general" },

  // Game Level milestones
  { key: "game_level_1",    title: "First Steps",           description: "You've begun your journey. Every legend starts somewhere.",          requirement: "Reach Game Level 1",                                           icon: "👣", points: 40,  category: "general" },
  { key: "game_level_25",   title: "Rising Challenger",     description: "Your skills are sharpening, and your presence is being felt.",       requirement: "Reach Game Level 25",                                          icon: "⚔️", points: 300,  category: "general" },
  { key: "game_level_50",   title: "Seasoned Warrior",      description: "Halfway to greatness—your dedication is undeniable.",                requirement: "Reach Game Level 50",                                          icon: "🛡️", points: 600, category: "general" },
  { key: "game_level_75",   title: "Master of Trials",      description: "Few reach this height. You've proven your strength and resilience.", requirement: "Reach Game Level 75",                                          icon: "👑", points: 1000, category: "general" },
  { key: "game_level_100",  title: "Legend Eternal",        description: "The pinnacle of achievement. Your name will be remembered forever.", requirement: "Reach Game Level 100",                                         icon: "🌠", points: 2000, category: "general" },

  // Achievement Points milestones
  { key: "points_50",       title: "Getting Started",       description: "Your first milestone—proof that progress has begun.",                requirement: "Earn 50 total achievement points",                              icon: "💫", points: 20,   category: "general" },
  { key: "points_500",      title: "Point Collector",       description: "You're gathering momentum, stacking up rewards with skill.",         requirement: "Earn 500 total achievement points",                             icon: "💎", points: 40,  category: "general" },
  { key: "points_2000",     title: "Treasure Hunter",       description: "Your dedication shines as you uncover riches of effort.",            requirement: "Earn 2,000 total achievement points",                           icon: "🏅", points: 80,  category: "general" },
  { key: "points_5000",     title: "Elite Scorer",          description: "You've reached rare heights—few achieve this level of mastery.",     requirement: "Earn 5,000 total achievement points",                           icon: "🥇", points: 200,  category: "general" },
  { key: "points_10000",    title: "Mythic Champion",       description: "The ultimate accolade. Your name echoes in legend.",                 requirement: "Earn 10,000 total achievement points",                          icon: "🏆", points: 400, category: "general" },

  // Notes
  { key: "first_note",       title: "First Words",          description: "Create your first note",                                            requirement: "Create your first note",                                       icon: "📝", points: 60,  category: "notes" },
  { key: "notes_5",          title: "Note Taker",           description: "Write 5 notes",                                                     requirement: "Write 5 notes",                                                icon: "📚", points: 120,  category: "notes" },
  { key: "notes_20",         title: "Knowledge Base",       description: "Write 20 notes",                                                    requirement: "Write 20 notes",                                               icon: "🧠", points: 300,  category: "notes" },
  { key: "first_subject",    title: "Organized",            description: "Create your first subject",                                         requirement: "Create your first subject",                                    icon: "📁", points: 60,  category: "notes" },
  { key: "subjects_3",       title: "Multi-Subject",        description: "Create 3 or more subjects",                                         requirement: "Create 3 or more subjects",                                    icon: "🗂️", points: 160,  category: "notes" },

  // Goals
  { key: "first_goal",       title: "Goal Setter",          description: "Set your first goal",                                               requirement: "Set your first goal",                                          icon: "🎯", points: 60,  category: "goals" },
  { key: "goal_completed",   title: "Goal Crusher",         description: "Complete your first goal",                                          requirement: "Mark your first goal as complete",                             icon: "✅", points: 120,  category: "goals" },
  { key: "goals_5_done",     title: "Overachiever",         description: "Complete 5 goals",                                                  requirement: "Complete 5 goals",                                             icon: "🌟", points: 300,  category: "goals" },

  // Timetable
  { key: "first_event",      title: "Scheduled",            description: "Add your first timetable event",                                    requirement: "Add your first event to the timetable",                        icon: "📅", points: 60,  category: "timetable" },
  { key: "events_5",         title: "Planner",              description: "Schedule 5 or more events",                                         requirement: "Add 5 or more events to your timetable",                       icon: "🗓️", points: 140,  category: "timetable" },
  { key: "exam_scheduled",   title: "Exam Ready",           description: "Add an exam event to your timetable",                               requirement: "Add an exam event to your timetable",                          icon: "📋", points: 100,  category: "timetable" },
  { key: "eca_scheduled",    title: "All-Rounder",          description: "Schedule an ECA activity",                                          requirement: "Add an ECA activity to your timetable",                        icon: "⚽", points: 80,  category: "timetable" },

  // Mood
  { key: "first_mood",       title: "Check-In",             description: "Log your first mood",                                               requirement: "Log your mood for the first time",                             icon: "😊", points: 40,  category: "mood" },
  { key: "mood_7",           title: "Consistent",           description: "Log your mood 7 times",                                             requirement: "Log your mood 7 times",                                        icon: "💪", points: 200,  category: "mood" },
  { key: "mood_30",          title: "Mood Master",          description: "Log your mood 30 times",                                            requirement: "Log your mood 30 times",                                       icon: "🧘", points: 600, category: "mood" },

  // Quiz milestones
  { key: "quiz_submitted",         title: "Quiz Time",          description: "Submit your first quiz score",                                  requirement: "Complete and submit a quiz",                                   icon: "❓", points: 100,  category: "quiz" },
  { key: "quiz_5",                 title: "Quiz Regular",       description: "Submit 5 quiz scores",                                          requirement: "Submit 5 quiz scores",                                         icon: "📊", points: 240,  category: "quiz" },
  { key: "quiz_10",                title: "Quiz Veteran",       description: "Submit 10 quiz scores",                                         requirement: "Submit 10 quiz scores",                                        icon: "🎖️", points: 400, category: "quiz" },
  { key: "quiz_first_attempt",     title: "First Attempt",      description: "You've taken the leap—your learning journey begins here.",      requirement: "Complete your first quiz",                                     icon: "🎯", points: 60,  category: "quiz" },
  { key: "quiz_curious_learner",   title: "Curious Learner",    description: "Your thirst for knowledge is growing stronger.",                requirement: "Submit 10 quiz scores",                                        icon: "🔍", points: 160,  category: "quiz" },
  { key: "quiz_dedicated_scholar", title: "Dedicated Scholar",  description: "Consistency pays off—you're mastering the art of practice.",   requirement: "Submit 50 quiz scores",                                        icon: "📖", points: 400, category: "quiz" },
  { key: "quiz_knowledge_seeker",  title: "Knowledge Seeker",   description: "A true explorer of wisdom, pushing boundaries with every test.",requirement: "Submit 100 quiz scores",                                       icon: "🧭", points: 800, category: "quiz" },
  { key: "quiz_master_200",        title: "Quiz Master",        description: "You've conquered countless challenges—your expertise shines bright.", requirement: "Submit 200 quiz scores",                                  icon: "🎓", points: 1600, category: "quiz" },

  // Games — existing
  { key: "memory_match",     title: "Memory Pro",           description: "Submit a Memory Match score",                                       requirement: "Complete a Memory Match game",                                  icon: "🃏", points: 80,  category: "games" },
  { key: "bubble_pop",       title: "Pop Star",             description: "Submit a Bubble Pop score",                                         requirement: "Play a round of Bubble Pop",                                   icon: "🫧", points: 80,  category: "games" },
  { key: "all_games",        title: "Triple Threat",        description: "Play all three game types",                                         requirement: "Play Memory Match, Bubble Pop, and complete a Quiz",            icon: "🎮", points: 200,  category: "games" },

  // Bubble Pop milestones (cumulative bubbles popped)
  { key: "bubbles_10",       title: "Pop Rookie",           description: "You've started bursting bubbles—keep the streak alive!",            requirement: "Pop 10 bubbles total across all Bubble Pop games",              icon: "🫧", points: 80,  category: "games" },
  { key: "bubbles_25",       title: "Bubble Breaker",       description: "Your popping skills are growing sharper with every tap.",           requirement: "Pop 25 bubbles total across all Bubble Pop games",              icon: "💦", points: 160,  category: "games" },
  { key: "bubbles_50",       title: "Burst Specialist",     description: "You've proven your speed and precision in bubble popping.",         requirement: "Pop 50 bubbles total across all Bubble Pop games",              icon: "⚡", points: 300,  category: "games" },
  { key: "bubbles_100",      title: "Bubble Storm",         description: "An unstoppable flurry—your popping power is unmatched.",           requirement: "Pop 100 bubbles total across all Bubble Pop games",             icon: "🌪️", points: 600, category: "games" },
  { key: "bubbles_200",      title: "Bubble Deity",         description: "Beyond mortal limits—you've ascended to divine popping status.",   requirement: "Pop 200 bubbles total across all Bubble Pop games",             icon: "🔮", points: 1200, category: "games" },

  // Memory Match time achievements
  { key: "memory_under_50",  title: "Swift Starter",        description: "You've proven you can finish fast—speed is on your side.",          requirement: "Complete Memory Match in under 50 seconds",                    icon: "⏱️", points: 120,  category: "games" },
  { key: "memory_under_30",  title: "Rapid Runner",         description: "Your reflexes and focus are razor sharp.",                          requirement: "Complete Memory Match in under 30 seconds",                    icon: "🏃", points: 240,  category: "games" },
  { key: "memory_under_20",  title: "Lightning Striker",    description: "You blaze through challenges with electrifying speed.",             requirement: "Complete Memory Match in under 20 seconds",                    icon: "⚡", points: 400, category: "games" },
  { key: "memory_under_15",  title: "Blazing Phantom",      description: "Almost untouchable—your moves are a blur.",                        requirement: "Complete Memory Match in under 15 seconds",                    icon: "👻", points: 800, category: "games" },
  { key: "memory_under_10",  title: "Time-Breaker",         description: "So hard, yet you did it. You've shattered the limits of possibility.", requirement: "Complete Memory Match in under 10 seconds",                icon: "💥", points: 2000, category: "games" },

  // ─── Challenges (periodic) ───────────────────────────────────────────────

  // Weekly
  { key: "weekly_quiz_5",    title: "Weekly Grinder",       description: "Stay sharp—quiz yourself every week to keep the momentum going.",   requirement: "Complete 5 quizzes this week",                                 icon: "⚡", points: 200, category: "challenges", periodic: "weekly" },
  { key: "weekly_notes_3",   title: "Weekly Scribe",        description: "Capture ideas while they're fresh—3 new notes every week.",         requirement: "Write 3 notes this week",                                      icon: "✍️", points: 150, category: "challenges", periodic: "weekly" },
  { key: "weekly_mood_5",    title: "Weekly Check-In",      description: "A small habit, a big impact—log your mood 5 days this week.",       requirement: "Log your mood 5 times this week",                              icon: "😌", points: 100, category: "challenges", periodic: "weekly" },

  // Monthly
  { key: "monthly_quiz_20",  title: "Monthly Marathon",     description: "Twenty quizzes in a month—your dedication is something else.",      requirement: "Complete 20 quizzes this month",                               icon: "🏃", points: 500, category: "challenges", periodic: "monthly" },
  { key: "monthly_notes_10", title: "Monthly Writer",       description: "Ten notes in a month shows you're actively building your knowledge.", requirement: "Write 10 notes this month",                                  icon: "📒", points: 400, category: "challenges", periodic: "monthly" },
  { key: "monthly_mood_20",  title: "Month of Mindfulness", description: "Twenty mood logs in a month—consistency is your superpower.",       requirement: "Log your mood 20 times this month",                            icon: "🧘", points: 300, category: "challenges", periodic: "monthly" },
  { key: "monthly_goals_2",  title: "Monthly Achiever",     description: "Set the pace—crush at least 2 goals every month.",                  requirement: "Complete 2 goals this month",                                  icon: "🎯", points: 350, category: "challenges", periodic: "monthly" },

  // Seasonal
  { key: "seasonal_quiz_50", title: "Seasonal Scholar",     description: "Fifty quizzes a season proves you're always in study mode.",        requirement: "Complete 50 quizzes this season",                              icon: "📚", points: 1000, category: "challenges", periodic: "seasonal" },
  { key: "seasonal_notes_20",title: "Seasonal Author",      description: "Twenty notes across a season—your knowledge library is growing.",   requirement: "Write 20 notes this season",                                   icon: "🗒️", points: 800, category: "challenges", periodic: "seasonal" },
  { key: "seasonal_mood_50", title: "Seasonal Wellness",    description: "Fifty mood logs in one season—you're truly in tune with yourself.", requirement: "Log your mood 50 times this season",                           icon: "🌸", points: 600, category: "challenges", periodic: "seasonal" },
];

// ─── Period helpers ───────────────────────────────────────────────────────────

function getWeekStart(date: Date): Date {
  const d = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  const day = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() - day + 1);
  return d;
}

function getWeekKey(date: Date): string {
  const d = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  const day = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - day);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
  return `${d.getUTCFullYear()}-W${String(weekNo).padStart(2, "0")}`;
}

function getMonthStart(date: Date): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1));
}

function getMonthKey(date: Date): string {
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`;
}

function getSeasonStart(date: Date): Date {
  const q = Math.floor(date.getUTCMonth() / 3);
  return new Date(Date.UTC(date.getUTCFullYear(), q * 3, 1));
}

function getSeasonKey(date: Date): string {
  const q = Math.floor(date.getUTCMonth() / 3) + 1;
  return `${date.getUTCFullYear()}-Q${q}`;
}

// ─── Types ────────────────────────────────────────────────────────────────────

export interface AchievementWithStatus extends AchievementDef {
  earned: boolean;
  earnedAt?: string;
  timesEarned?: number;
}

// ─── Queries ──────────────────────────────────────────────────────────────────

export async function getUserAchievements(userId: string): Promise<AchievementWithStatus[]> {
  const earned = await db
    .select()
    .from(userAchievementsTable)
    .where(eq(userAchievementsTable.userId, userId));

  const earnedMap = new Map(earned.map(e => [e.achievementKey, e.earnedAt]));

  return ACHIEVEMENTS.map(a => {
    if (a.periodic) {
      const prefix = `${a.key}__`;
      const matches = earned.filter(e => e.achievementKey.startsWith(prefix));
      const timesEarned = matches.length;
      const latest = matches.sort((x, y) => y.earnedAt.getTime() - x.earnedAt.getTime())[0];
      return {
        ...a,
        earned: timesEarned > 0,
        earnedAt: latest?.earnedAt.toISOString(),
        timesEarned,
      };
    }
    return {
      ...a,
      earned: earnedMap.has(a.key),
      earnedAt: earnedMap.get(a.key)?.toISOString(),
      timesEarned: earnedMap.has(a.key) ? 1 : 0,
    };
  });
}

export async function checkAndAwardAchievements(userId: string): Promise<AchievementDef[]> {
  const now = new Date();
  const weekStart  = getWeekStart(now);
  const monthStart = getMonthStart(now);
  const seasonStart = getSeasonStart(now);
  const weekKey   = getWeekKey(now);
  const monthKey  = getMonthKey(now);
  const seasonKey = getSeasonKey(now);

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
    // Periodic counts
    [{ weeklyQuizCount }],
    [{ monthlyQuizCount }],
    [{ seasonalQuizCount }],
    [{ weeklyNotesCount }],
    [{ monthlyNotesCount }],
    [{ seasonalNotesCount }],
    [{ weeklyMoodCount }],
    [{ monthlyMoodCount }],
    [{ seasonalMoodCount }],
    [{ weeklyGoalsCompleted }],
    [{ monthlyGoalsCompleted }],
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
    // Periodic quiz counts (scoresTable has userId — accurate per-user)
    db.select({ weeklyQuizCount: count() }).from(scoresTable).where(and(eq(scoresTable.userId, userId), eq(scoresTable.gameType, "quiz"), gte(scoresTable.createdAt, weekStart))),
    db.select({ monthlyQuizCount: count() }).from(scoresTable).where(and(eq(scoresTable.userId, userId), eq(scoresTable.gameType, "quiz"), gte(scoresTable.createdAt, monthStart))),
    db.select({ seasonalQuizCount: count() }).from(scoresTable).where(and(eq(scoresTable.userId, userId), eq(scoresTable.gameType, "quiz"), gte(scoresTable.createdAt, seasonStart))),
    // Periodic notes counts (no userId on notes table — global, same as existing behavior)
    db.select({ weeklyNotesCount: count() }).from(notesTable).where(gte(notesTable.createdAt, weekStart)),
    db.select({ monthlyNotesCount: count() }).from(notesTable).where(gte(notesTable.createdAt, monthStart)),
    db.select({ seasonalNotesCount: count() }).from(notesTable).where(gte(notesTable.createdAt, seasonStart)),
    // Periodic mood counts
    db.select({ weeklyMoodCount: count() }).from(moodsTable).where(gte(moodsTable.createdAt, weekStart)),
    db.select({ monthlyMoodCount: count() }).from(moodsTable).where(gte(moodsTable.createdAt, monthStart)),
    db.select({ seasonalMoodCount: count() }).from(moodsTable).where(gte(moodsTable.createdAt, seasonStart)),
    // Periodic goals completed
    db.select({ weeklyGoalsCompleted: count() }).from(goalsTable).where(and(eq(goalsTable.completed, true), gte(goalsTable.createdAt, weekStart))),
    db.select({ monthlyGoalsCompleted: count() }).from(goalsTable).where(and(eq(goalsTable.completed, true), gte(goalsTable.createdAt, monthStart))),
  ]);

  const alreadyEarnedSet = new Set(alreadyEarned.map(e => e.key));

  // Total points earned (handles both permanent and periodic keys)
  const earnedPointsTotal = alreadyEarned.reduce((sum, e) => {
    const baseKey = e.key.includes("__") ? e.key.split("__")[0] : e.key;
    const def = ACHIEVEMENTS.find(a => a.key === baseKey);
    return sum + (def?.points ?? 0);
  }, 0);

  const gameTypes = new Set(userScores.map(s => s.gameType));
  const quizScoreCount = userScores.filter(s => s.gameType === "quiz").length;
  const bubbleTotal = Number(totalBubbles ?? 0);
  const bestMemorySecs = bestMemoryTime[0]?.secondsTaken ?? null;
  const gameLevel = userRow?.gameLevel ?? 1;

  const conditions: Record<string, boolean> = {
    // ── Permanent ──────────────────────────────────────────────────────────
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
    game_level_1:   gameLevel >= 1,
    game_level_25:  gameLevel >= 25,
    game_level_50:  gameLevel >= 50,
    game_level_75:  gameLevel >= 75,
    game_level_100: gameLevel >= 100,
    points_50:      earnedPointsTotal >= 50,
    points_500:     earnedPointsTotal >= 500,
    points_2000:    earnedPointsTotal >= 2000,
    points_5000:    earnedPointsTotal >= 5000,
    points_10000:   earnedPointsTotal >= 10000,
    quiz_first_attempt:     quizScoreCount >= 1,
    quiz_curious_learner:   quizScoreCount >= 10,
    quiz_dedicated_scholar: quizScoreCount >= 50,
    quiz_knowledge_seeker:  quizScoreCount >= 100,
    quiz_master_200:        quizScoreCount >= 200,
    bubbles_10:  bubbleTotal >= 10,
    bubbles_25:  bubbleTotal >= 25,
    bubbles_50:  bubbleTotal >= 50,
    bubbles_100: bubbleTotal >= 100,
    bubbles_200: bubbleTotal >= 200,
    memory_under_50: bestMemorySecs !== null && bestMemorySecs <= 50,
    memory_under_30: bestMemorySecs !== null && bestMemorySecs <= 30,
    memory_under_20: bestMemorySecs !== null && bestMemorySecs <= 20,
    memory_under_15: bestMemorySecs !== null && bestMemorySecs <= 15,
    memory_under_10: bestMemorySecs !== null && bestMemorySecs <= 10,

    // ── Periodic (keys include period suffix so they can be re-earned) ──────
    [`weekly_quiz_5__${weekKey}`]:    weeklyQuizCount >= 5,
    [`weekly_notes_3__${weekKey}`]:   weeklyNotesCount >= 3,
    [`weekly_mood_5__${weekKey}`]:    weeklyMoodCount >= 5,

    [`monthly_quiz_20__${monthKey}`]:  monthlyQuizCount >= 20,
    [`monthly_notes_10__${monthKey}`]: monthlyNotesCount >= 10,
    [`monthly_mood_20__${monthKey}`]:  monthlyMoodCount >= 20,
    [`monthly_goals_2__${monthKey}`]:  monthlyGoalsCompleted >= 2,

    [`seasonal_quiz_50__${seasonKey}`]:  seasonalQuizCount >= 50,
    [`seasonal_notes_20__${seasonKey}`]: seasonalNotesCount >= 20,
    [`seasonal_mood_50__${seasonKey}`]:  seasonalMoodCount >= 50,
  };

  const newlyEarned: AchievementDef[] = [];
  for (const [key, earned] of Object.entries(conditions)) {
    if (earned && !alreadyEarnedSet.has(key)) {
      const baseKey = key.includes("__") ? key.split("__")[0] : key;
      const def = ACHIEVEMENTS.find(a => a.key === baseKey);
      if (def) {
        await db.insert(userAchievementsTable).values({ userId, achievementKey: key }).onConflictDoNothing();
        newlyEarned.push(def);
      }
    }
  }

  return newlyEarned;
}

export function getTotalPoints(achievements: AchievementWithStatus[]): number {
  return achievements.reduce((sum, a) => {
    if (!a.earned) return sum;
    return sum + a.points * (a.timesEarned ?? 1);
  }, 0);
}

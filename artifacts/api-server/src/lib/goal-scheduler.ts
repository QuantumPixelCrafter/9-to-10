import { db, goalsTable, inboxMessagesTable } from "@workspace/db";
import { and, eq, lt, isNotNull } from "drizzle-orm";

// The system/admin account that sends automated notifications.
// This is the developer/approver account already used for system messages.
const SYSTEM_SENDER_ID = "5705e7da-bb0b-47e5-8563-9bdd23b24973";

async function checkOverdueGoals() {
  const now = new Date();

  // Find goals that are:
  //  - past their deadline
  //  - NOT completed
  //  - NOT yet notified
  //  - owned by a real user
  const overdueGoals = await db
    .select()
    .from(goalsTable)
    .where(
      and(
        isNotNull(goalsTable.userId),
        eq(goalsTable.completed, false),
        eq(goalsTable.overdueNotified, false),
        lt(goalsTable.deadline, now),
      ),
    );

  if (overdueGoals.length === 0) return;

  for (const goal of overdueGoals) {
    try {
      // Send inbox notification to the goal owner
      await db.insert(inboxMessagesTable).values({
        recipientId: goal.userId!,
        senderId: SYSTEM_SENDER_ID,
        type: "system",
        message: `You missed your goal: "${goal.title}" — the deadline was ${goal.deadline.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}. Don't give up — set a new one!`,
        status: "none",
      });

      // Mark as notified so we don't spam
      await db
        .update(goalsTable)
        .set({ overdueNotified: true })
        .where(eq(goalsTable.id, goal.id));

      console.log(`[goal-scheduler] Notified user ${goal.userId} about overdue goal "${goal.title}"`);
    } catch (err: any) {
      console.error(`[goal-scheduler] Failed to notify for goal ${goal.id}:`, err.message);
    }
  }
}

/** Start the overdue-goals scheduler. Checks every 15 minutes. */
export function startGoalScheduler() {
  const INTERVAL_MS = 15 * 60 * 1000; // 15 minutes

  // Run immediately on startup to catch any overdue goals from downtime
  checkOverdueGoals().catch((err) =>
    console.error("[goal-scheduler] Initial check failed:", err.message),
  );

  setInterval(() => {
    checkOverdueGoals().catch((err) =>
      console.error("[goal-scheduler] Check failed:", err.message),
    );
  }, INTERVAL_MS);

  console.log("[goal-scheduler] Started — checking every 15 minutes for overdue goals");
}

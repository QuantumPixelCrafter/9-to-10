import { Router, type IRouter } from "express";
import { db, goalsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import {
  CreateGoalBody,
  UpdateGoalBody,
  UpdateGoalParams,
  DeleteGoalParams,
} from "@workspace/api-zod";
import { awardXp } from "../lib/xp";

const router: IRouter = Router();

router.get("/goals", async (_req, res) => {
  const goals = await db
    .select()
    .from(goalsTable)
    .orderBy(goalsTable.deadline);
  res.json(goals);
});

router.post("/goals", async (req, res) => {
  const body = CreateGoalBody.parse(req.body);
  const [goal] = await db.insert(goalsTable).values(body).returning();
  res.status(201).json(goal);
});

router.put("/goals/:id", async (req, res) => {
  const { id } = UpdateGoalParams.parse(req.params);
  const body = UpdateGoalBody.parse(req.body);

  // Check if this update is marking as completed
  const [existing] = await db.select().from(goalsTable).where(eq(goalsTable.id, id)).limit(1);
  const justCompleted = body.completed === true && existing && !existing.completed;

  const [goal] = await db
    .update(goalsTable)
    .set(body)
    .where(eq(goalsTable.id, id))
    .returning();

  if (!goal) {
    res.status(404).json({ error: "Goal not found" });
    return;
  }

  let xpAwarded: number | null = null;
  let levelUp: { leveledUp: boolean; newLevel: number } | null = null;

  if (justCompleted && req.isAuthenticated()) {
    try {
      const result = await awardXp(req.user.id, 20);
      xpAwarded = 20;
      levelUp = { leveledUp: result.leveledUp, newLevel: result.newLevel };
    } catch {}
  }

  res.json({ ...goal, xpAwarded, levelUp });
});

router.delete("/goals/:id", async (req, res) => {
  const { id } = DeleteGoalParams.parse(req.params);
  await db.delete(goalsTable).where(eq(goalsTable.id, id));
  res.status(204).send();
});

export default router;

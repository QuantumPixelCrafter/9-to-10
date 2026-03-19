import { Router, type IRouter } from "express";
import { db, schedulesTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import {
  CreateScheduleBody,
  UpdateScheduleBody,
  UpdateScheduleParams,
  DeleteScheduleParams,
} from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/schedules", async (_req, res) => {
  const schedules = await db
    .select()
    .from(schedulesTable)
    .orderBy(schedulesTable.dayOfWeek, schedulesTable.startTime);
  res.json(schedules);
});

router.post("/schedules", async (req, res) => {
  const body = CreateScheduleBody.parse(req.body);
  const [schedule] = await db.insert(schedulesTable).values(body).returning();
  res.status(201).json(schedule);
});

router.put("/schedules/:id", async (req, res) => {
  const { id } = UpdateScheduleParams.parse(req.params);
  const body = UpdateScheduleBody.parse(req.body);
  const [schedule] = await db
    .update(schedulesTable)
    .set(body)
    .where(eq(schedulesTable.id, id))
    .returning();
  if (!schedule) {
    res.status(404).json({ error: "Schedule not found" });
    return;
  }
  res.json(schedule);
});

router.delete("/schedules/:id", async (req, res) => {
  const { id } = DeleteScheduleParams.parse(req.params);
  await db.delete(schedulesTable).where(eq(schedulesTable.id, id));
  res.status(204).send();
});

export default router;

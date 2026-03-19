import { Router, type IRouter } from "express";
import { db, moodsTable } from "@workspace/db";
import { desc } from "drizzle-orm";
import { CreateMoodBody } from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/moods", async (_req, res) => {
  const moods = await db
    .select()
    .from(moodsTable)
    .orderBy(desc(moodsTable.createdAt))
    .limit(30);
  res.json(moods);
});

router.post("/moods", async (req, res) => {
  const body = CreateMoodBody.parse(req.body);
  const [mood] = await db.insert(moodsTable).values(body).returning();
  res.status(201).json(mood);
});

export default router;

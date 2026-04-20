import { Router, type IRouter } from "express";
import { db, moodsTable } from "@workspace/db";
import { desc, eq } from "drizzle-orm";
import { CreateMoodBody } from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/moods", async (req, res) => {
  const userId = req.isAuthenticated() ? (req.user as any).id : null;
  const moods = await db
    .select()
    .from(moodsTable)
    .where(userId ? eq(moodsTable.userId, userId) : undefined)
    .orderBy(desc(moodsTable.createdAt))
    .limit(30);
  res.json(moods);
});

router.post("/moods", async (req, res) => {
  const body = CreateMoodBody.parse(req.body);
  const userId = req.isAuthenticated() ? (req.user as any).id : null;
  const [mood] = await db.insert(moodsTable).values({ ...body, userId }).returning();
  res.status(201).json(mood);
});

export default router;

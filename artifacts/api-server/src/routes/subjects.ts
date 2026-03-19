import { Router, type IRouter } from "express";
import { db, subjectsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import {
  CreateSubjectBody,
  UpdateSubjectBody,
  UpdateSubjectParams,
  DeleteSubjectParams,
} from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/subjects", async (_req, res) => {
  const subjects = await db.select().from(subjectsTable).orderBy(subjectsTable.createdAt);
  res.json(subjects);
});

router.post("/subjects", async (req, res) => {
  const body = CreateSubjectBody.parse(req.body);
  const [subject] = await db.insert(subjectsTable).values(body).returning();
  res.status(201).json(subject);
});

router.put("/subjects/:id", async (req, res) => {
  const { id } = UpdateSubjectParams.parse(req.params);
  const body = UpdateSubjectBody.parse(req.body);
  const [subject] = await db
    .update(subjectsTable)
    .set(body)
    .where(eq(subjectsTable.id, id))
    .returning();
  if (!subject) {
    res.status(404).json({ error: "Subject not found" });
    return;
  }
  res.json(subject);
});

router.delete("/subjects/:id", async (req, res) => {
  const { id } = DeleteSubjectParams.parse(req.params);
  await db.delete(subjectsTable).where(eq(subjectsTable.id, id));
  res.status(204).send();
});

export default router;

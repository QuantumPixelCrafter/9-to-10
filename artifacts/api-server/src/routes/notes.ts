import { Router, type IRouter } from "express";
import { db, notesTable, subjectsTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import {
  CreateNoteBody,
  UpdateNoteBody,
  UpdateNoteParams,
  DeleteNoteParams,
  GetNoteParams,
  ListNotesQueryParams,
} from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/notes", async (req, res) => {
  const query = ListNotesQueryParams.parse(req.query);
  const conditions = query.subjectId
    ? eq(notesTable.subjectId, query.subjectId)
    : undefined;

  const notes = await db
    .select({
      id: notesTable.id,
      title: notesTable.title,
      content: notesTable.content,
      subjectId: notesTable.subjectId,
      subjectName: subjectsTable.name,
      lastUsedAt: notesTable.lastUsedAt,
      createdAt: notesTable.createdAt,
      updatedAt: notesTable.updatedAt,
    })
    .from(notesTable)
    .leftJoin(subjectsTable, eq(notesTable.subjectId, subjectsTable.id))
    .where(conditions)
    .orderBy(notesTable.updatedAt);

  res.json(notes);
});

router.post("/notes", async (req, res) => {
  const body = CreateNoteBody.parse(req.body);
  const [note] = await db
    .insert(notesTable)
    .values({ ...body, updatedAt: new Date() })
    .returning();
  res.status(201).json({ ...note, subjectName: null });
});

router.get("/notes/:id", async (req, res) => {
  const { id } = GetNoteParams.parse(req.params);
  const [note] = await db
    .select({
      id: notesTable.id,
      title: notesTable.title,
      content: notesTable.content,
      subjectId: notesTable.subjectId,
      subjectName: subjectsTable.name,
      lastUsedAt: notesTable.lastUsedAt,
      createdAt: notesTable.createdAt,
      updatedAt: notesTable.updatedAt,
    })
    .from(notesTable)
    .leftJoin(subjectsTable, eq(notesTable.subjectId, subjectsTable.id))
    .where(eq(notesTable.id, id));

  if (!note) {
    res.status(404).json({ error: "Note not found" });
    return;
  }

  await db
    .update(notesTable)
    .set({ lastUsedAt: new Date() })
    .where(eq(notesTable.id, id));

  res.json(note);
});

router.put("/notes/:id", async (req, res) => {
  const { id } = UpdateNoteParams.parse(req.params);
  const body = UpdateNoteBody.parse(req.body);
  const [note] = await db
    .update(notesTable)
    .set({ ...body, updatedAt: new Date() })
    .where(eq(notesTable.id, id))
    .returning();
  if (!note) {
    res.status(404).json({ error: "Note not found" });
    return;
  }
  res.json({ ...note, subjectName: null });
});

router.delete("/notes/:id", async (req, res) => {
  const { id } = DeleteNoteParams.parse(req.params);
  await db.delete(notesTable).where(eq(notesTable.id, id));
  res.status(204).send();
});

export default router;

import { Router, type IRouter } from "express";
import { db, notesTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { GenerateQuizBody, GenerateQuizParams } from "@workspace/api-zod";
import { openai } from "@workspace/integrations-openai-ai-server";

const router: IRouter = Router();

router.post("/notes/:id/quiz", async (req, res) => {
  const { id } = GenerateQuizParams.parse(req.params);
  const body = GenerateQuizBody.parse(req.body);

  const [note] = await db
    .select()
    .from(notesTable)
    .where(eq(notesTable.id, id));

  if (!note) {
    res.status(404).json({ error: "Note not found" });
    return;
  }

  const questionCount = body.questionCount ?? 5;
  const difficulty = body.difficulty;

  const difficultyInstructions = {
    easy: "Create straightforward questions testing basic recall and simple understanding.",
    normal: "Create moderately challenging questions testing understanding and application.",
    difficult: "Create challenging questions requiring deep understanding, analysis, and synthesis.",
  }[difficulty];

  const prompt = `You are a study assistant. Generate a ${difficulty} difficulty quiz with exactly ${questionCount} multiple-choice questions based on the following study notes.

${difficultyInstructions}

Notes title: ${note.title}
Notes content:
${note.content}

Return ONLY valid JSON in this exact format (no markdown, no explanation):
{
  "questions": [
    {
      "id": 1,
      "question": "Question text here?",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correctAnswer": 0,
      "explanation": "Brief explanation of why the answer is correct"
    }
  ]
}

Rules:
- correctAnswer is the 0-based index of the correct option
- Always provide exactly 4 options
- Make distractors plausible but clearly wrong
- Base questions ONLY on the provided notes
- Do not ask about images or visual content`;

  const completion = await openai.chat.completions.create({
    model: "gpt-5.2",
    max_completion_tokens: 8192,
    messages: [{ role: "user", content: prompt }],
  });

  const content = completion.choices[0]?.message?.content ?? "{}";

  let questions;
  try {
    const parsed = JSON.parse(content);
    questions = parsed.questions;
  } catch {
    res.status(500).json({ error: "Failed to parse quiz from AI response" });
    return;
  }

  res.json({
    noteId: id,
    difficulty,
    questions,
  });
});

export default router;

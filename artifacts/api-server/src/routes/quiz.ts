import { Router, type IRouter } from "express";
import { db, notesTable, subjectsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { GenerateQuizBody, GenerateQuizParams } from "@workspace/api-zod";
import { openai } from "@workspace/integrations-openai-ai-server";

const router: IRouter = Router();

const LEVEL_LABELS: Record<string, string> = {
  P1: "Primary 1", P2: "Primary 2", P3: "Primary 3",
  P4: "Primary 4", P5: "Primary 5", P6: "Primary 6",
  S1: "Secondary 1", S2: "Secondary 2", S3: "Secondary 3",
  S4: "Secondary 4", S5: "Secondary 5", S6: "Secondary 6",
  U1: "University Year 1", U2: "University Year 2",
  U3: "University Year 3", U4: "University Year 4",
};

const LEVEL_INSTRUCTIONS: Record<string, string> = {
  P1: "Use very simple vocabulary and short sentences. Focus on basic concepts a 7-year-old can grasp.",
  P2: "Use simple language. Focus on foundational concepts for an 8-year-old.",
  P3: "Use straightforward language appropriate for a 9-year-old student.",
  P4: "Suitable for a 10-year-old. Questions may involve simple reasoning.",
  P5: "Suitable for an 11-year-old. Include some application questions.",
  P6: "Suitable for a 12-year-old. Include application and some analysis questions.",
  S1: "Suitable for a 13-year-old secondary student. Intermediate vocabulary.",
  S2: "Suitable for a 14-year-old secondary student. Questions should test understanding.",
  S3: "Suitable for a 15-year-old. Include analysis and evaluation questions.",
  S4: "Suitable for a 16-year-old preparing for major exams. Rigorous questions.",
  S5: "Suitable for a 17-year-old. Exam-level questions with detailed reasoning.",
  S6: "Suitable for a 18-year-old pre-university student. Advanced analysis required.",
  U1: "University Year 1 level. Questions should test conceptual understanding and application.",
  U2: "University Year 2 level. Expect deeper analysis and cross-topic reasoning.",
  U3: "University Year 3 level. Advanced questions requiring synthesis and critical evaluation.",
  U4: "Final year university level. Research-level thinking; expect nuanced, complex questions.",
};

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
  const level = body.level;

  const difficultyInstructions = {
    easy: "Create straightforward questions testing basic recall and simple understanding.",
    normal: "Create moderately challenging questions testing understanding and application.",
    difficult: "Create challenging questions requiring deep understanding, analysis, and synthesis.",
  }[difficulty];

  const levelLabel = level ? LEVEL_LABELS[level] : null;
  const levelInstruction = level ? LEVEL_INSTRUCTIONS[level] : null;

  const levelSection = levelLabel && levelInstruction
    ? `\nStudent Education Level: ${levelLabel}\nLevel-appropriate instruction: ${levelInstruction}`
    : "";

  const prompt = `You are a study assistant. Generate a ${difficulty} difficulty quiz with exactly ${questionCount} multiple-choice questions based on the following study notes.
${levelSection}

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
- Do not ask about images or visual content
- Tailor vocabulary and complexity to the specified student level`;

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

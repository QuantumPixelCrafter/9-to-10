import { useState, useCallback } from "react";
import { useAuth } from "@workspace/replit-auth-web";
import { useSubmitScore, customFetch } from "@workspace/api-client-react";
import { useGetPowerups, useUsePowerup } from "@workspace/api-client-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Layout } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { ChevronLeft, CheckCircle2, XCircle, ArrowRight, Trophy, Upload, RotateCcw, Sparkles, BookOpen, Lightbulb, Zap } from "lucide-react";
import {
  type LevelGroup, type QuizSubject, type QuizTopic, type Difficulty,
  LEVEL_GROUP_INFO, LEVEL_TO_GROUP, LEVEL_LABELS, LEVEL_GROUP_SECTIONS,
  getSubjectsForGroup, DIFFICULTY_LABELS,
} from "@/lib/quiz-curriculum";

type Step = "levelGroup" | "subject" | "topic" | "settings" | "loading" | "playing" | "results";

type QuizQuestion = {
  id: number; question: string;
  options: string[]; correctAnswer: number; explanation: string;
};

type QuizData = {
  level: string; subject: string; topic: string; difficulty: string;
  questions: QuizQuestion[];
};

const QUESTION_COUNTS = [5, 10, 15] as const;
type QCount = (typeof QUESTION_COUNTS)[number];

function calcScore(correct: number, total: number, difficulty: string): number {
  const m = difficulty === "easy" ? 1 : difficulty === "difficult" ? 2 : 1.5;
  return Math.round(correct * m * 100);
}

function ProgressDots({ step }: { step: Step }) {
  const steps: Step[] = ["levelGroup", "subject", "topic", "settings", "playing"];
  const cur = steps.indexOf(step === "loading" ? "playing" : step === "results" ? "playing" : step);
  return (
    <div className="flex items-center gap-2 justify-center mb-2">
      {steps.map((s, i) => (
        <div key={s} className={cn(
          "h-1.5 rounded-full transition-all duration-300",
          i < cur ? "w-6 bg-primary" : i === cur ? "w-8 bg-primary" : "w-4 bg-muted"
        )} />
      ))}
    </div>
  );
}

type RandomBonusResult =
  | { rewardType: "points"; points: number }
  | { rewardType: "powerup"; powerupKey: string; powerupName: string; powerupEmoji: string };

export default function QuizPage() {
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const submitScoreMut = useSubmitScore();
  const { data: powerupsData, refetch: refetchPowerups } = useGetPowerups();
  const usePowerupMut = useUsePowerup();
  const qc = useQueryClient();

  const [step, setStep] = useState<Step>("levelGroup");
  const [levelGroup, setLevelGroup] = useState<LevelGroup | null>(null);
  const [level, setLevel] = useState<string>(() => user?.level ?? "");
  const [subject, setSubject] = useState<QuizSubject | null>(null);
  const [topic, setTopic] = useState<QuizTopic | null>(null);
  const [difficulty, setDifficulty] = useState<Difficulty>("normal");
  const [questionCount, setQuestionCount] = useState<QCount>(10);

  const [quiz, setQuiz] = useState<QuizData | null>(null);
  const [currentQ, setCurrentQ] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [showExp, setShowExp] = useState(false);
  const [score, setScore] = useState(0);
  const [scoreSubmitted, setScoreSubmitted] = useState(false);

  const [doublePointsActive, setDoublePointsActive] = useState(false);
  const [doublePointsUsed, setDoublePointsUsed] = useState(false);
  const [hintUsedThisQ, setHintUsedThisQ] = useState(false);
  const [eliminatedOptions, setEliminatedOptions] = useState<Set<number>>(new Set());
  const [randomBonusActive, setRandomBonusActive] = useState(false);

  const hintQty = powerupsData?.inventory.find(p => p.key === "hint_token")?.quantity ?? 0;
  const doubleQty = powerupsData?.inventory.find(p => p.key === "double_points")?.quantity ?? 0;
  const retryQty = powerupsData?.inventory.find(p => p.key === "retry_pass")?.quantity ?? 0;
  const randomBonusQty = powerupsData?.inventory.find(p => p.key === "random_quiz_bonus")?.quantity ?? 0;

  const useRandomBonusMut = useMutation({
    mutationFn: () => customFetch<RandomBonusResult>("/api/powerups/use-random-bonus", { method: "POST" }),
  });

  const generateMut = useMutation({
    mutationFn: async (params: { level: string; subject: string; topic: string; difficulty: string; questionCount: number }) => {
      const sid = localStorage.getItem("study_smart_sid");
      const res = await fetch("/api/curriculum-quiz/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(sid ? { Authorization: `Bearer ${sid}` } : {}),
        },
        credentials: "include",
        body: JSON.stringify(params),
      });
      if (!res.ok) throw new Error("Failed to generate quiz");
      return res.json() as Promise<QuizData>;
    },
  });

  const pickGroup = (g: LevelGroup) => {
    setLevelGroup(g);
    const info = LEVEL_GROUP_INFO[g];
    if (!level || LEVEL_TO_GROUP[level] !== g) setLevel(info.levels[0]);
    setSubject(null);
    setTopic(null);
    setStep("subject");
  };

  const pickSubject = (s: QuizSubject) => {
    setSubject(s);
    setTopic(null);
    setStep("topic");
  };

  const pickTopic = (t: QuizTopic) => {
    setTopic(t);
    setStep("settings");
  };

  const startQuiz = async () => {
    if (!level || !subject || !topic) return;
    setStep("loading");
    setScore(0);
    setCurrentQ(0);
    setSelected(null);
    setShowExp(false);
    setScoreSubmitted(false);
    setHintUsedThisQ(false);
    setEliminatedOptions(new Set());

    if (doublePointsActive && !doublePointsUsed) {
      try {
        await usePowerupMut.mutateAsync("double_points");
        setDoublePointsUsed(true);
        refetchPowerups();
      } catch {
        setDoublePointsActive(false);
      }
    }

    if (randomBonusActive && randomBonusQty > 0) {
      try {
        const result = await useRandomBonusMut.mutateAsync();
        refetchPowerups();
        if (result.rewardType === "points") {
          toast({
            title: "🎲 Random Quiz Bonus!",
            description: `You received ${result.points.toLocaleString()} bonus points!`,
          });
        } else {
          toast({
            title: "🎲 Random Quiz Bonus!",
            description: `You received a ${result.powerupEmoji} ${result.powerupName}!`,
          });
        }
        setRandomBonusActive(false);
      } catch {
        // bonus failed silently — quiz still runs
      }
    }

    try {
      const data = await generateMut.mutateAsync({ level, subject: subject.name, topic: topic.name, difficulty, questionCount });
      setQuiz(data);
      setStep("playing");
    } catch {
      setStep("settings");
    }
  };

  const handleAnswer = useCallback((idx: number) => {
    if (showExp || !quiz || eliminatedOptions.has(idx)) return;
    setSelected(idx);
    setShowExp(true);
    if (idx === quiz.questions[currentQ].correctAnswer) setScore(s => s + 1);
  }, [showExp, quiz, currentQ, eliminatedOptions]);

  const handleUseHint = async () => {
    if (!quiz || hintUsedThisQ || hintQty <= 0 || showExp) return;
    const q = quiz.questions[currentQ];
    const wrongOptions = q.options.map((_, i) => i).filter(i => i !== q.correctAnswer);
    const toEliminate = wrongOptions.sort(() => Math.random() - 0.5).slice(0, 2);
    try {
      await usePowerupMut.mutateAsync("hint_token");
      setEliminatedOptions(new Set(toEliminate));
      setHintUsedThisQ(true);
      refetchPowerups();
    } catch {
      // not enough hints
    }
  };

  const nextQuestion = () => {
    if (!quiz) return;
    setHintUsedThisQ(false);
    setEliminatedOptions(new Set());
    if (currentQ < quiz.questions.length - 1) {
      setCurrentQ(i => i + 1);
      setSelected(null);
      setShowExp(false);
    } else {
      setStep("results");
    }
  };

  const reset = () => {
    setStep("levelGroup");
    setLevelGroup(null);
    setSubject(null);
    setTopic(null);
    setQuiz(null);
    setScoreSubmitted(false);
    setDoublePointsActive(false);
    setDoublePointsUsed(false);
    setHintUsedThisQ(false);
    setEliminatedOptions(new Set());
  };

  const retryTopic = () => {
    setQuiz(null);
    setStep("settings");
    setScoreSubmitted(false);
    setDoublePointsActive(false);
    setDoublePointsUsed(false);
    setHintUsedThisQ(false);
    setEliminatedOptions(new Set());
  };

  const retryWithPass = async () => {
    try {
      await usePowerupMut.mutateAsync("retry_pass");
      refetchPowerups();
      retryTopic();
    } catch {
      // no passes left
    }
  };

  const q = quiz?.questions[currentQ];
  const rawScore = quiz ? calcScore(score, quiz.questions.length, quiz.difficulty) : 0;
  const finalScore = doublePointsActive ? rawScore * 2 : rawScore;
  const pct = quiz ? Math.round((score / quiz.questions.length) * 100) : 0;
  const subjects = levelGroup ? getSubjectsForGroup(levelGroup) : [];
  const groupInfo = levelGroup ? LEVEL_GROUP_INFO[levelGroup] : null;

  return (
    <Layout title="AI Quiz">
      <div className="max-w-2xl mx-auto py-4 space-y-4">
        {(step !== "levelGroup") && (
          <ProgressDots step={step} />
        )}

        <AnimatePresence mode="wait">
          {/* ─── STEP 1: Level Group ─────────────────────────────────── */}
          {step === "levelGroup" && (
            <motion.div key="levelGroup" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }}>
              <div className="text-center mb-8">
                <div className="w-16 h-16 bg-primary/10 rounded-3xl flex items-center justify-center mx-auto mb-4">
                  <Sparkles className="w-8 h-8 text-primary" />
                </div>
                <h2 className="text-2xl font-bold mb-2">AI-Powered Quiz</h2>
                <p className="text-muted-foreground max-w-md mx-auto">Select your education level to get started. Our AI will craft quiz questions tailored to your curriculum.</p>
              </div>

              <div className="space-y-6">
                {LEVEL_GROUP_SECTIONS.map(section => (
                  <div key={section.label}>
                    <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2 pl-1">{section.label}</p>
                    <div className={cn("gap-3", section.groups.length > 1 ? "grid grid-cols-2" : "flex")}>
                      {section.groups.map(g => {
                        const info = LEVEL_GROUP_INFO[g];
                        return (
                          <motion.button
                            key={g}
                            onClick={() => pickGroup(g)}
                            whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}
                            className="w-full text-left bg-card border border-border/60 rounded-2xl p-4 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5 transition-all duration-200 group"
                          >
                            <div className="flex items-start gap-3">
                              <div className={cn("w-10 h-10 rounded-xl bg-gradient-to-br flex items-center justify-center text-xl shrink-0 shadow-md", info.gradient)}>
                                {info.emoji}
                              </div>
                              <div className="flex-1 min-w-0">
                                <h3 className="text-sm font-bold group-hover:text-primary transition-colors leading-tight">{info.label}</h3>
                                <div className="flex flex-wrap gap-1 mt-1.5">
                                  {info.levels.map(l => (
                                    <span key={l} className={cn(
                                      "text-[10px] font-bold px-1.5 py-0.5 rounded-full text-white bg-gradient-to-r", info.gradient
                                    )}>{l}</span>
                                  ))}
                                </div>
                              </div>
                              <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors shrink-0 mt-0.5" />
                            </div>
                            <p className="text-xs text-muted-foreground mt-2 line-clamp-2">{info.description}</p>
                          </motion.button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {/* ─── STEP 2: Subject ─────────────────────────────────────── */}
          {step === "subject" && groupInfo && (
            <motion.div key="subject" initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -24 }}>
              <button onClick={() => setStep("levelGroup")} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-4 transition-colors">
                <ChevronLeft className="w-4 h-4" /> Back
              </button>

              <h3 className="text-lg font-bold mb-4">Choose a Subject</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {subjects.map(s => (
                  <motion.button key={s.id} onClick={() => pickSubject(s)} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                    className="text-left bg-card border border-border/60 rounded-2xl p-4 hover:border-primary/30 hover:shadow-md transition-all group">
                    <div className={cn("w-10 h-10 rounded-xl bg-gradient-to-br flex items-center justify-center text-xl mb-3 shadow-sm", s.color)}>
                      {s.icon}
                    </div>
                    <p className="font-bold text-sm group-hover:text-primary transition-colors">{s.name}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{s.topics.length} quiz topics</p>
                  </motion.button>
                ))}
              </div>
            </motion.div>
          )}

          {/* ─── STEP 3: Topic ───────────────────────────────────────── */}
          {step === "topic" && subject && (
            <motion.div key="topic" initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -24 }}>
              <button onClick={() => setStep("subject")} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-4 transition-colors">
                <ChevronLeft className="w-4 h-4" /> Back to Subjects
              </button>

              <div className="flex items-center gap-3 mb-5">
                <div className={cn("w-10 h-10 rounded-xl bg-gradient-to-br flex items-center justify-center text-xl", subject.color)}>{subject.icon}</div>
                <div>
                  <h3 className="text-lg font-bold">{subject.name}</h3>
                  <p className="text-xs text-muted-foreground">{level ? LEVEL_LABELS[level] : ""}</p>
                </div>
              </div>

              <p className="text-sm font-semibold text-muted-foreground mb-3">Choose a topic to quiz on:</p>
              <div className="space-y-3">
                {subject.topics.map((t, i) => (
                  <motion.button key={t.id} onClick={() => pickTopic(t)}
                    initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                    whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}
                    className="w-full text-left bg-card border border-border/60 rounded-2xl p-4 hover:border-primary/30 hover:shadow-md transition-all group flex items-center gap-4"
                  >
                    <div className={cn("w-9 h-9 rounded-xl bg-gradient-to-br flex items-center justify-center text-white font-extrabold text-sm shrink-0", subject.color)}>
                      {i + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm group-hover:text-primary transition-colors">{t.name}</p>
                      <p className="text-xs text-muted-foreground mt-0.5 leading-snug">{t.description}</p>
                    </div>
                    <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors shrink-0" />
                  </motion.button>
                ))}
              </div>
            </motion.div>
          )}

          {/* ─── STEP 4: Settings ────────────────────────────────────── */}
          {step === "settings" && topic && subject && (
            <motion.div key="settings" initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -24 }}>
              <button onClick={() => setStep("topic")} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-4 transition-colors">
                <ChevronLeft className="w-4 h-4" /> Back to Topics
              </button>

              <div className="bg-gradient-to-r from-primary/10 to-violet-500/10 border border-primary/20 rounded-2xl p-4 mb-5 flex items-center gap-3">
                <div className={cn("w-10 h-10 rounded-xl bg-gradient-to-br flex items-center justify-center text-xl shrink-0", subject.color)}>{subject.icon}</div>
                <div>
                  <p className="font-bold text-sm">{topic.name}</p>
                  <p className="text-xs text-muted-foreground">{subject.name} · {level ? LEVEL_LABELS[level] : ""}</p>
                </div>
              </div>

              <div className="space-y-5">
                <div>
                  <p className="text-sm font-bold mb-3">Difficulty</p>
                  <div className="grid grid-cols-3 gap-2">
                    {DIFFICULTY_LABELS.map(d => (
                      <button key={d.value} onClick={() => setDifficulty(d.value)}
                        className={cn(
                          "rounded-2xl p-4 border text-center transition-all",
                          difficulty === d.value
                            ? "border-primary bg-primary/5 shadow-md shadow-primary/10"
                            : "border-border/60 bg-card hover:border-primary/30"
                        )}>
                        <div className="text-xl mb-1">{d.emoji}</div>
                        <div className="font-bold text-sm">{d.label}</div>
                        <div className="text-[10px] text-muted-foreground mt-0.5 leading-snug">{d.desc}</div>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <p className="text-sm font-bold mb-3">Number of Questions</p>
                  <div className="flex gap-2">
                    {QUESTION_COUNTS.map(n => (
                      <button key={n} onClick={() => setQuestionCount(n)}
                        className={cn(
                          "flex-1 py-3 rounded-xl border font-bold text-sm transition-all",
                          questionCount === n
                            ? "border-primary bg-primary text-primary-foreground shadow-md"
                            : "border-border/60 bg-card hover:border-primary/40 text-muted-foreground"
                        )}>
                        {n}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Power-up activations */}
                {(doubleQty > 0 || hintQty > 0 || randomBonusQty > 0) && (
                  <div className="space-y-2">
                    <p className="text-sm font-bold">Power-ups</p>
                    {randomBonusQty > 0 && (
                      <button
                        onClick={() => setRandomBonusActive(v => !v)}
                        className={cn(
                          "w-full flex items-center gap-3 rounded-2xl border p-3.5 text-left transition-all",
                          randomBonusActive
                            ? "border-purple-400 bg-purple-500/10 shadow-md shadow-purple-500/10"
                            : "border-border/60 bg-card hover:border-purple-400/40"
                        )}
                      >
                        <span className="text-2xl">🎲</span>
                        <div className="flex-1">
                          <p className="text-sm font-bold">Random Quiz Bonus</p>
                          <p className="text-xs text-muted-foreground">
                            50% pts (300–1000) · 50% random power-up · {randomBonusQty} charge{randomBonusQty !== 1 ? "s" : ""} available
                          </p>
                        </div>
                        <div className={cn(
                          "w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0",
                          randomBonusActive ? "border-purple-500 bg-purple-500" : "border-muted-foreground/40"
                        )}>
                          {randomBonusActive && <CheckCircle2 className="w-3 h-3 text-white" />}
                        </div>
                      </button>
                    )}
                    {doubleQty > 0 && (
                      <button
                        onClick={() => setDoublePointsActive(v => !v)}
                        className={cn(
                          "w-full flex items-center gap-3 rounded-2xl border p-3.5 text-left transition-all",
                          doublePointsActive
                            ? "border-amber-400 bg-amber-500/10 shadow-md shadow-amber-500/10"
                            : "border-border/60 bg-card hover:border-amber-400/40"
                        )}
                      >
                        <span className="text-2xl">⚡</span>
                        <div className="flex-1">
                          <p className="text-sm font-bold">Double Points Boost</p>
                          <p className="text-xs text-muted-foreground">All quiz points ×2 · {doubleQty} charge{doubleQty !== 1 ? "s" : ""} available</p>
                        </div>
                        <div className={cn(
                          "w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0",
                          doublePointsActive ? "border-amber-500 bg-amber-500" : "border-muted-foreground/40"
                        )}>
                          {doublePointsActive && <CheckCircle2 className="w-3 h-3 text-white" />}
                        </div>
                      </button>
                    )}
                    {hintQty > 0 && (
                      <div className="flex items-center gap-3 rounded-2xl border border-border/60 bg-muted/30 p-3.5">
                        <span className="text-2xl">💡</span>
                        <div className="flex-1">
                          <p className="text-sm font-bold">Hint Tokens</p>
                          <p className="text-xs text-muted-foreground">{hintQty} available · Use during quiz to eliminate 2 wrong answers</p>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {generateMut.isError && (
                  <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3 text-sm text-red-600 dark:text-red-400 text-center">
                    Failed to generate quiz. Please try again.
                  </div>
                )}

                <Button size="lg" onClick={startQuiz} className={cn(
                  "w-full rounded-2xl shadow-xl text-base gap-2",
                  doublePointsActive ? "bg-gradient-to-r from-amber-500 to-orange-500 border-0 shadow-amber-500/20" : "shadow-primary/20"
                )}>
                  {doublePointsActive ? <><Zap className="w-5 h-5" /> Generate Quiz (2× Points!)</> : <><Sparkles className="w-5 h-5" /> Generate {questionCount}-Question Quiz</>}
                </Button>
              </div>
            </motion.div>
          )}

          {/* ─── LOADING ─────────────────────────────────────────────── */}
          {step === "loading" && (
            <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center py-24 gap-5">
              <div className="w-16 h-16 rounded-full border-4 border-primary border-t-transparent animate-spin" />
              <div className="text-center">
                <p className="font-bold text-lg">AI is crafting your quiz…</p>
                <p className="text-muted-foreground text-sm mt-1">Generating {questionCount} {difficulty} questions on {topic?.name}</p>
                {doublePointsActive && (
                  <p className="text-amber-500 text-sm font-bold mt-2">⚡ Double Points active!</p>
                )}
              </div>
            </motion.div>
          )}

          {/* ─── PLAYING ─────────────────────────────────────────────── */}
          {step === "playing" && q && quiz && (
            <motion.div key={`q-${currentQ}`} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
              className="space-y-4">
              {/* HUD */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <BookOpen className="w-4 h-4" />
                  <span className="font-medium">{quiz.topic}</span>
                </div>
                <div className="flex items-center gap-2">
                  {doublePointsActive && (
                    <div className="flex items-center gap-1 bg-amber-500/15 text-amber-600 dark:text-amber-400 text-[10px] font-bold px-2 py-0.5 rounded-full border border-amber-400/30">
                      ⚡ 2×
                    </div>
                  )}
                  {!showExp && hintQty > 0 && !hintUsedThisQ && (
                    <button
                      onClick={handleUseHint}
                      disabled={usePowerupMut.isPending}
                      className="flex items-center gap-1 bg-blue-500/10 hover:bg-blue-500/20 text-blue-600 dark:text-blue-400 text-[10px] font-bold px-2 py-1 rounded-full border border-blue-400/30 transition-all"
                    >
                      <Lightbulb className="w-3 h-3" /> Hint ×{hintQty}
                    </button>
                  )}
                  {hintUsedThisQ && (
                    <div className="text-[10px] text-muted-foreground font-medium bg-muted px-2 py-0.5 rounded-full">
                      💡 Hint used
                    </div>
                  )}
                  <div className="text-sm font-bold text-primary">{score} / {currentQ + (showExp ? 1 : 0)} correct</div>
                  <div className="text-xs text-muted-foreground font-medium bg-muted px-2 py-1 rounded-full">
                    {currentQ + 1} / {quiz.questions.length}
                  </div>
                </div>
              </div>

              {/* Progress bar */}
              <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                <motion.div className="h-full bg-primary rounded-full"
                  animate={{ width: `${((currentQ) / quiz.questions.length) * 100}%` }} transition={{ duration: 0.4 }} />
              </div>

              {/* Question card */}
              <div className="bg-card border border-border/60 rounded-3xl p-6 shadow-sm">
                <p className="text-base font-semibold leading-snug">{q.question}</p>
              </div>

              {/* Options */}
              <div className="space-y-2.5">
                {q.options.map((opt, idx) => {
                  const isCorrect = idx === q.correctAnswer;
                  const isSelected = idx === selected;
                  const isEliminated = eliminatedOptions.has(idx);
                  return (
                    <motion.button key={idx} onClick={() => handleAnswer(idx)} whileTap={{ scale: 0.99 }}
                      disabled={showExp || isEliminated}
                      className={cn(
                        "w-full text-left p-4 rounded-2xl border transition-all duration-200 flex items-center gap-3",
                        isEliminated
                          ? "opacity-30 bg-muted/20 border-border/20 cursor-not-allowed line-through"
                          : !showExp ? "bg-card border-border/60 hover:border-primary/40 hover:bg-primary/5 cursor-pointer"
                          : isCorrect ? "bg-green-500/10 border-green-500 text-green-700 dark:text-green-300"
                          : isSelected ? "bg-red-500/10 border-red-500 text-red-700 dark:text-red-300"
                          : "bg-muted/30 border-border/30 text-muted-foreground cursor-default"
                      )}>
                      <span className={cn(
                        "w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0",
                        isEliminated ? "bg-muted/40 text-muted-foreground/40"
                          : !showExp ? "bg-muted text-muted-foreground"
                          : isCorrect ? "bg-green-500 text-white"
                          : isSelected ? "bg-red-500 text-white"
                          : "bg-muted text-muted-foreground"
                      )}>
                        {["A","B","C","D"][idx]}
                      </span>
                      <span className="text-sm font-medium flex-1">{opt}</span>
                      {showExp && isCorrect && <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0" />}
                      {showExp && isSelected && !isCorrect && <XCircle className="w-4 h-4 text-red-500 shrink-0" />}
                      {isEliminated && <XCircle className="w-4 h-4 text-muted-foreground/30 shrink-0" />}
                    </motion.button>
                  );
                })}
              </div>

              {/* Explanation */}
              <AnimatePresence>
                {showExp && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="overflow-hidden">
                    <div className={cn(
                      "rounded-2xl p-4 border text-sm",
                      selected === q.correctAnswer
                        ? "bg-green-500/10 border-green-500/30 text-green-700 dark:text-green-300"
                        : "bg-red-500/10 border-red-500/20 text-red-700 dark:text-red-300"
                    )}>
                      <p className="font-bold mb-1">{selected === q.correctAnswer ? "✓ Correct!" : "✗ Not quite."}</p>
                      <p className="text-sm leading-relaxed opacity-90">{q.explanation}</p>
                    </div>
                    <Button className="w-full mt-3 rounded-2xl gap-2" onClick={nextQuestion}>
                      {currentQ < quiz.questions.length - 1 ? (<>Next Question <ArrowRight className="w-4 h-4" /></>) : (<><Trophy className="w-4 h-4" /> See Results</>)}
                    </Button>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )}

          {/* ─── RESULTS ─────────────────────────────────────────────── */}
          {step === "results" && quiz && (
            <motion.div key="results" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
              className="space-y-5">
              <div className="text-center">
                <motion.div className="text-6xl mb-4" animate={{ rotate: [0,-10,10,-10,10,0] }} transition={{ duration: 0.6, delay: 0.2 }}>
                  {pct >= 80 ? "🏆" : pct >= 50 ? "🎯" : "📚"}
                </motion.div>
                <h2 className="text-2xl font-bold mb-1">{pct >= 80 ? "Excellent!" : pct >= 50 ? "Good job!" : "Keep studying!"}</h2>
                <p className="text-muted-foreground text-sm">{quiz.topic} · {LEVEL_LABELS[quiz.level] ?? quiz.level}</p>
                {doublePointsActive && (
                  <div className="inline-flex items-center gap-1.5 mt-2 bg-amber-500/15 text-amber-600 dark:text-amber-400 text-xs font-bold px-3 py-1 rounded-full border border-amber-400/30">
                    ⚡ Double Points applied — score doubled!
                  </div>
                )}
              </div>

              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: "Score", value: finalScore.toLocaleString(), sub: doublePointsActive ? "pts (2×)" : "pts", highlight: true },
                  { label: "Correct", value: `${score}/${quiz.questions.length}`, sub: "answers", highlight: false },
                  { label: "Accuracy", value: `${pct}%`, sub: "correct", highlight: false },
                ].map(({ label, value, sub, highlight }) => (
                  <div key={label} className={cn("rounded-2xl p-4 text-center", highlight ? "bg-primary/10 border border-primary/20" : "bg-muted/40")}>
                    <div className={cn("text-xl font-extrabold", highlight && "text-primary")}>{value}</div>
                    <div className="text-[10px] text-muted-foreground font-medium mt-0.5 uppercase tracking-wide">{label}</div>
                    <div className="text-[9px] text-muted-foreground">{sub}</div>
                  </div>
                ))}
              </div>

              <div className="h-3 bg-muted rounded-full overflow-hidden">
                <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 1, ease: "easeOut", delay: 0.2 }}
                  className={cn("h-full rounded-full", pct >= 80 ? "bg-green-500" : pct >= 50 ? "bg-amber-500" : "bg-red-500")} />
              </div>

              <div className="space-y-3">
                {isAuthenticated && !scoreSubmitted && (
                  <Button onClick={async () => {
                    await submitScoreMut.mutateAsync({ data: {
                      gameType: "quiz", score: finalScore,
                      subject: quiz.subject, userLevel: quiz.level,
                    }});
                    setScoreSubmitted(true);
                  }}
                    disabled={submitScoreMut.isPending}
                    className="w-full rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 border-0 shadow-lg shadow-amber-500/20 gap-2">
                    <Upload className="w-4 h-4" />
                    {submitScoreMut.isPending ? "Submitting…" : `Submit ${finalScore.toLocaleString()} pts to Leaderboard`}
                  </Button>
                )}
                {scoreSubmitted && (
                  <div className="bg-green-500/10 border border-green-500/20 rounded-2xl p-3 flex items-center justify-center gap-2 text-green-600 dark:text-green-400 font-semibold text-sm">
                    <CheckCircle2 className="w-4 h-4" /> Score submitted to leaderboard!
                  </div>
                )}

                {/* Retry Pass */}
                {retryQty > 0 && (
                  <Button
                    variant="outline"
                    className="w-full rounded-2xl gap-2 border-blue-400/40 text-blue-600 dark:text-blue-400 hover:bg-blue-500/10"
                    onClick={retryWithPass}
                    disabled={usePowerupMut.isPending}
                  >
                    🔄 Use Retry Pass ({retryQty} left) — redo this quiz
                  </Button>
                )}

                <div className="flex gap-2">
                  <Button variant="outline" className="flex-1 rounded-xl gap-2" onClick={retryTopic}>
                    <RotateCcw className="w-4 h-4" /> Try Again
                  </Button>
                  <Button variant="outline" className="flex-1 rounded-xl gap-2" onClick={() => setStep("topic")}>
                    <BookOpen className="w-4 h-4" /> New Topic
                  </Button>
                  <Button variant="outline" className="flex-1 rounded-xl gap-2" onClick={reset}>
                    <Sparkles className="w-4 h-4" /> New Quiz
                  </Button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </Layout>
  );
}

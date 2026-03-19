import { useState, useEffect, useRef, useCallback } from "react";
import { Layout } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { useGenerateRevisionCards, useSubmitScore } from "@workspace/api-client-react";
import { useAuth } from "@workspace/replit-auth-web";
import { Brain, Gamepad2, Sparkles, Trophy, Timer, RefreshCw, Play, RotateCcw, Leaf, Star, Upload } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

// ─── Memory Match Game ────────────────────────────────────────────────
type CardType = { id: number; pairId: number; text: string; type: "term" | "definition"; flipped: boolean; matched: boolean };

function MemoryMatch() {
  const [cards, setCards] = useState<CardType[]>([]);
  const [flipped, setFlipped] = useState<number[]>([]);
  const [matches, setMatches] = useState(0);
  const [moves, setMoves] = useState(0);
  const [seconds, setSeconds] = useState(0);
  const [gameState, setGameState] = useState<"idle" | "loading" | "playing" | "won" | "noNotes">("idle");
  const [finalScore, setFinalScore] = useState(0);
  const [scoreSubmitted, setScoreSubmitted] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const lockRef = useRef(false);

  const { isAuthenticated } = useAuth();
  const genMut = useGenerateRevisionCards();
  const submitScoreMut = useSubmitScore();

  const startGame = async () => {
    setGameState("loading");
    setScoreSubmitted(false);
    setFinalScore(0);
    setMoves(0);
    setMatches(0);
    setSeconds(0);
    setFlipped([]);
    try {
      const result = await genMut.mutateAsync({ data: { count: 6 } });
      const raw = result.cards ?? [];
      if (raw.length === 0) { setGameState("noNotes"); return; }

      const deck: CardType[] = [];
      raw.forEach((card: { id: number; term: string; definition: string }) => {
        deck.push({ id: card.id * 2 - 1, pairId: card.id, text: card.term, type: "term", flipped: false, matched: false });
        deck.push({ id: card.id * 2, pairId: card.id, text: card.definition, type: "definition", flipped: false, matched: false });
      });

      const shuffled = deck.sort(() => Math.random() - 0.5);
      setCards(shuffled);
      setGameState("playing");
      timerRef.current = setInterval(() => setSeconds(s => s + 1), 1000);
    } catch {
      setGameState("idle");
    }
  };

  const handleFlip = (idx: number) => {
    if (lockRef.current || gameState !== "playing") return;
    const card = cards[idx];
    if (card.flipped || card.matched || flipped.includes(idx)) return;

    const newFlipped = [...flipped, idx];
    const newCards = cards.map((c, i) => i === idx ? { ...c, flipped: true } : c);
    setCards(newCards);
    setFlipped(newFlipped);

    if (newFlipped.length === 2) {
      setMoves(m => m + 1);
      lockRef.current = true;
      const [a, b] = newFlipped;
      if (newCards[a].pairId === newCards[b].pairId) {
        setTimeout(() => {
          setCards(prev => prev.map((c, i) => (i === a || i === b) ? { ...c, matched: true } : c));
          setFlipped([]);
          setMatches(m => {
            const next = m + 1;
            if (next === (newCards.length / 2)) {
              setGameState("won");
              if (timerRef.current) clearInterval(timerRef.current);
              setSeconds(s => {
                setMoves(mv => {
                  const computed = Math.max(50, 1000 - s * 3 - mv * 15);
                  setFinalScore(computed);
                  return mv;
                });
                return s;
              });
            }
            return next;
          });
          lockRef.current = false;
        }, 600);
      } else {
        setTimeout(() => {
          setCards(prev => prev.map((c, i) => (i === a || i === b) ? { ...c, flipped: false } : c));
          setFlipped([]);
          lockRef.current = false;
        }, 1000);
      }
    }
  };

  useEffect(() => () => { if (timerRef.current) clearInterval(timerRef.current); }, []);

  const fmt = (s: number) => `${Math.floor(s / 60).toString().padStart(2, "0")}:${(s % 60).toString().padStart(2, "0")}`;

  return (
    <div className="h-full flex flex-col">
      <AnimatePresence mode="wait">
        {gameState === "idle" && (
          <motion.div key="idle" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="flex-1 flex flex-col items-center justify-center text-center px-8 py-12">
            <div className="w-20 h-20 bg-primary/10 rounded-3xl flex items-center justify-center mb-6 mx-auto">
              <Brain className="w-10 h-10 text-primary" />
            </div>
            <h3 className="text-2xl font-bold mb-3">Memory Match</h3>
            <p className="text-muted-foreground max-w-sm mb-8 leading-relaxed">
              AI reads all your notes and generates term/definition pairs. Flip cards and find matching pairs to win!
            </p>
            <div className="grid grid-cols-3 gap-4 mb-8 text-center">
              {[["6 Pairs", "12 cards to match"], ["AI-Generated", "From your notes"], ["Beat the clock", "Fastest wins"]].map(([t, d]) => (
                <div key={t} className="bg-primary/5 rounded-2xl p-4">
                  <div className="font-bold text-sm">{t}</div>
                  <div className="text-xs text-muted-foreground mt-1">{d}</div>
                </div>
              ))}
            </div>
            <Button size="lg" className="rounded-2xl px-10 shadow-xl shadow-primary/20 text-base" onClick={startGame}>
              <Play className="w-5 h-5 mr-2" /> Start Game
            </Button>
          </motion.div>
        )}

        {gameState === "loading" && (
          <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="flex-1 flex flex-col items-center justify-center gap-4">
            <div className="w-16 h-16 rounded-full border-4 border-primary border-t-transparent animate-spin" />
            <p className="font-semibold text-lg">AI is reading your notes…</p>
            <p className="text-muted-foreground text-sm">Generating flashcard pairs</p>
          </motion.div>
        )}

        {gameState === "noNotes" && (
          <motion.div key="noNotes" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="flex-1 flex flex-col items-center justify-center gap-4 text-center px-8">
            <Brain className="w-16 h-16 text-muted-foreground/40" />
            <h3 className="text-xl font-bold">No notes yet</h3>
            <p className="text-muted-foreground">Add some study notes first, then come back to play!</p>
            <Button variant="outline" onClick={() => setGameState("idle")} className="rounded-xl mt-2">Got it</Button>
          </motion.div>
        )}

        {gameState === "won" && (
          <motion.div key="won" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
            className="flex-1 flex flex-col items-center justify-center text-center px-8 py-12">
            <motion.div className="text-7xl mb-6" animate={{ rotate: [0, -10, 10, -10, 10, 0] }} transition={{ duration: 0.6, delay: 0.2 }}>
              🏆
            </motion.div>
            <h3 className="text-3xl font-bold mb-2">You won!</h3>
            <p className="text-muted-foreground mb-6">All {matches} pairs matched</p>
            <div className="flex gap-4 mb-6 justify-center">
              <div className="bg-primary/10 rounded-2xl p-4 text-center min-w-[80px]">
                <div className="text-xl font-bold text-primary">{fmt(seconds)}</div>
                <div className="text-xs text-muted-foreground mt-1">Time</div>
              </div>
              <div className="bg-primary/10 rounded-2xl p-4 text-center min-w-[80px]">
                <div className="text-xl font-bold text-primary">{moves}</div>
                <div className="text-xs text-muted-foreground mt-1">Moves</div>
              </div>
              <div className="bg-amber-500/10 rounded-2xl p-4 text-center min-w-[80px] border border-amber-500/20">
                <div className="text-xl font-bold text-amber-500">{finalScore}</div>
                <div className="text-xs text-muted-foreground mt-1">Score</div>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 justify-center w-full max-w-xs">
              {isAuthenticated && !scoreSubmitted && (
                <Button
                  variant="outline"
                  onClick={async () => {
                    await submitScoreMut.mutateAsync({ data: { gameType: "memory-match", score: finalScore } });
                    setScoreSubmitted(true);
                  }}
                  disabled={submitScoreMut.isPending}
                  className="rounded-xl gap-2 border-amber-500/30 text-amber-600 hover:bg-amber-500/5"
                >
                  <Upload className="w-4 h-4" />
                  {submitScoreMut.isPending ? "Saving…" : "Submit Score"}
                </Button>
              )}
              {scoreSubmitted && (
                <p className="text-sm text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1.5 justify-center">
                  ✓ Score submitted to leaderboard!
                </p>
              )}
              <Button size="lg" className="rounded-xl px-8 shadow-xl shadow-primary/20" onClick={startGame}>
                <RefreshCw className="w-5 h-5 mr-2" /> Play Again
              </Button>
            </div>
          </motion.div>
        )}

        {gameState === "playing" && (
          <motion.div key="playing" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex-1 flex flex-col">
            {/* HUD */}
            <div className="flex items-center justify-between px-2 py-3 shrink-0">
              <div className="flex items-center gap-2 bg-primary/10 rounded-xl px-4 py-2">
                <Timer className="w-4 h-4 text-primary" />
                <span className="font-mono font-bold text-primary">{fmt(seconds)}</span>
              </div>
              <div className="text-sm font-medium text-muted-foreground">{matches}/{cards.length / 2} pairs</div>
              <div className="flex items-center gap-2 bg-muted rounded-xl px-4 py-2">
                <Trophy className="w-4 h-4 text-amber-500" />
                <span className="font-bold">{moves} moves</span>
              </div>
            </div>

            {/* Board */}
            <div className="flex-1 overflow-auto py-2">
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2.5 auto-rows-max">
                {cards.map((card, idx) => (
                  <motion.button
                    key={card.id}
                    onClick={() => handleFlip(idx)}
                    className={cn(
                      "relative h-24 sm:h-28 rounded-2xl border-2 text-xs font-medium transition-all duration-200 overflow-hidden",
                      card.matched
                        ? "bg-green-50 dark:bg-green-900/20 border-green-400 cursor-default shadow-md shadow-green-500/10"
                        : card.flipped
                        ? "bg-primary/5 border-primary shadow-lg shadow-primary/15 cursor-pointer"
                        : "bg-muted/60 border-border/60 hover:border-primary/30 hover:bg-primary/5 cursor-pointer shadow-sm"
                    )}
                    whileTap={!card.matched && !card.flipped ? { scale: 0.96 } : {}}
                  >
                    <AnimatePresence mode="wait">
                      {card.flipped || card.matched ? (
                        <motion.div
                          key="front"
                          initial={{ rotateY: 90, opacity: 0 }}
                          animate={{ rotateY: 0, opacity: 1 }}
                          transition={{ duration: 0.2 }}
                          className="absolute inset-0 p-2 flex flex-col items-center justify-center"
                        >
                          <span className={cn(
                            "text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full mb-1.5",
                            card.type === "term"
                              ? "bg-primary/15 text-primary"
                              : "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                          )}>
                            {card.type === "term" ? "Term" : "Definition"}
                          </span>
                          <p className="text-center leading-snug line-clamp-3">{card.text}</p>
                        </motion.div>
                      ) : (
                        <motion.div
                          key="back"
                          initial={{ rotateY: -90, opacity: 0 }}
                          animate={{ rotateY: 0, opacity: 1 }}
                          transition={{ duration: 0.2 }}
                          className="absolute inset-0 flex items-center justify-center"
                        >
                          <Brain className="w-7 h-7 text-muted-foreground/30" />
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.button>
                ))}
              </div>
            </div>

            <div className="py-2 flex justify-center shrink-0">
              <Button variant="ghost" size="sm" onClick={() => { setGameState("idle"); if (timerRef.current) clearInterval(timerRef.current); }} className="rounded-xl text-muted-foreground gap-2">
                <RotateCcw className="w-4 h-4" /> Give up
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Bubble Pop Game ──────────────────────────────────────────────────
type Bubble = { id: number; x: number; y: number; r: number; color: string; speed: number; wobble: number; wobbleOffset: number; popping: boolean };

const BUBBLE_COLORS = [
  "from-sky-300 to-blue-400",
  "from-violet-300 to-purple-400",
  "from-teal-300 to-emerald-400",
  "from-pink-300 to-rose-400",
  "from-amber-300 to-orange-400",
  "from-indigo-300 to-blue-500",
  "from-green-300 to-teal-400",
  "from-fuchsia-300 to-pink-500",
];

let bubbleIdCounter = 0;

function BubblePop() {
  const [bubbles, setBubbles] = useState<Bubble[]>([]);
  const [score, setScore] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [scoreSubmitted, setScoreSubmitted] = useState(false);
  const [finalBubbleScore, setFinalBubbleScore] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const animRef = useRef<number>(0);
  const lastSpawnRef = useRef(0);
  const bubblesRef = useRef<Bubble[]>([]);

  const { isAuthenticated } = useAuth();
  const submitScoreMut = useSubmitScore();

  const spawnBubble = useCallback(() => {
    const w = containerRef.current?.clientWidth ?? 400;
    const r = 28 + Math.random() * 26;
    const b: Bubble = {
      id: ++bubbleIdCounter,
      x: r + Math.random() * (w - r * 2),
      y: (containerRef.current?.clientHeight ?? 600) + r,
      r,
      color: BUBBLE_COLORS[Math.floor(Math.random() * BUBBLE_COLORS.length)],
      speed: 0.4 + Math.random() * 0.5,
      wobble: Math.random() * 2 - 1,
      wobbleOffset: Math.random() * Math.PI * 2,
      popping: false,
    };
    return b;
  }, []);

  const tick = useCallback((ts: number) => {
    if (ts - lastSpawnRef.current > 1200) {
      lastSpawnRef.current = ts;
      const nb = spawnBubble();
      bubblesRef.current = [...bubblesRef.current, nb];
    }

    bubblesRef.current = bubblesRef.current
      .filter(b => !b.popping && b.y > -(b.r * 2))
      .map(b => ({
        ...b,
        y: b.y - b.speed,
        x: b.x + Math.sin((Date.now() / 1000) * b.wobble + b.wobbleOffset) * 0.3,
      }));

    setBubbles([...bubblesRef.current]);
    animRef.current = requestAnimationFrame(tick);
  }, [spawnBubble]);

  const startGame = () => {
    setScore(0);
    setScoreSubmitted(false);
    setFinalBubbleScore(0);
    bubblesRef.current = [];
    setBubbles([]);
    setPlaying(true);
    lastSpawnRef.current = 0;
    animRef.current = requestAnimationFrame(tick);
  };

  const stopGame = () => {
    setPlaying(false);
    cancelAnimationFrame(animRef.current);
    bubblesRef.current = [];
    setBubbles([]);
    setScore(s => { setFinalBubbleScore(s); return s; });
  };

  const popBubble = (id: number) => {
    bubblesRef.current = bubblesRef.current.filter(b => b.id !== id);
    setScore(s => s + 1);
    setBubbles([...bubblesRef.current]);
  };

  useEffect(() => () => cancelAnimationFrame(animRef.current), []);

  return (
    <div className="h-full flex flex-col">
      {!playing ? (
        finalBubbleScore > 0 ? (
          /* Results screen after stopping */
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
            className="flex-1 flex flex-col items-center justify-center text-center px-8 py-12">
            <div className="text-6xl mb-5">🫧</div>
            <h3 className="text-2xl font-bold mb-1">Great session!</h3>
            <p className="text-muted-foreground mb-6">You popped {finalBubbleScore} bubbles</p>
            <div className="bg-sky-500/10 rounded-2xl px-10 py-5 border border-sky-500/10 mb-6">
              <div className="text-4xl font-extrabold text-sky-500">{finalBubbleScore}</div>
              <div className="text-sm text-muted-foreground mt-1">bubbles popped</div>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 justify-center w-full max-w-xs">
              {isAuthenticated && !scoreSubmitted && (
                <Button
                  variant="outline"
                  onClick={async () => {
                    await submitScoreMut.mutateAsync({ data: { gameType: "bubble-pop", score: finalBubbleScore } });
                    setScoreSubmitted(true);
                  }}
                  disabled={submitScoreMut.isPending}
                  className="rounded-xl gap-2 border-sky-500/30 text-sky-600 hover:bg-sky-500/5"
                >
                  <Upload className="w-4 h-4" />
                  {submitScoreMut.isPending ? "Saving…" : "Submit Score"}
                </Button>
              )}
              {scoreSubmitted && (
                <p className="text-sm text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1.5 justify-center">
                  ✓ Score submitted to leaderboard!
                </p>
              )}
              <Button size="lg" className="rounded-xl bg-gradient-to-r from-sky-500 to-violet-500 hover:opacity-90 border-0 shadow-lg" onClick={startGame}>
                <RefreshCw className="w-4 h-4 mr-2" /> Play Again
              </Button>
            </div>
          </motion.div>
        ) : (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          className="flex-1 flex flex-col items-center justify-center text-center px-8 py-12">
          <div className="w-20 h-20 bg-gradient-to-br from-sky-400 to-violet-500 rounded-3xl flex items-center justify-center mb-6 mx-auto shadow-xl shadow-violet-500/20">
            <Leaf className="w-10 h-10 text-white" />
          </div>
          <h3 className="text-2xl font-bold mb-3">Bubble Pop</h3>
          <p className="text-muted-foreground max-w-sm mb-8 leading-relaxed">
            Relax and pop colorful bubbles as they float by. No pressure, no time limit — just pop as many as you like!
          </p>
          <div className="grid grid-cols-3 gap-4 mb-8 text-center">
            {[["Stress-free", "No time limit"], ["Satisfying", "Pop to your heart's content"], ["Colourful", "Beautiful bubbles"]].map(([t, d]) => (
              <div key={t} className="bg-sky-500/5 rounded-2xl p-4 border border-sky-500/10">
                <div className="font-bold text-sm">{t}</div>
                <div className="text-xs text-muted-foreground mt-1">{d}</div>
              </div>
            ))}
          </div>
          <Button size="lg" className="rounded-2xl px-10 shadow-xl shadow-violet-500/20 text-base bg-gradient-to-r from-sky-500 to-violet-500 hover:opacity-90 border-0" onClick={startGame}>
            <Play className="w-5 h-5 mr-2" /> Start Relaxing
          </Button>
        </motion.div>
        )

      ) : (
        <div className="flex-1 flex flex-col">
          <div className="flex items-center justify-between px-2 py-3 shrink-0">
            <div className="flex items-center gap-2 bg-sky-500/10 rounded-xl px-4 py-2">
              <Star className="w-4 h-4 text-sky-500" />
              <span className="font-bold text-sky-600 dark:text-sky-400">{score} popped</span>
            </div>
            <Button variant="ghost" size="sm" onClick={stopGame} className="rounded-xl text-muted-foreground gap-2">
              <RotateCcw className="w-4 h-4" /> Stop
            </Button>
          </div>

          <div
            ref={containerRef}
            className="flex-1 relative overflow-hidden bg-gradient-to-b from-sky-50/30 to-violet-50/30 dark:from-sky-950/20 dark:to-violet-950/20 rounded-2xl border border-sky-200/30 dark:border-sky-800/20"
            style={{ cursor: "crosshair" }}
          >
            <AnimatePresence>
              {bubbles.map(b => (
                <motion.button
                  key={b.id}
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 0.85 }}
                  exit={{ scale: 1.6, opacity: 0 }}
                  transition={{ duration: 0.15 }}
                  onClick={() => popBubble(b.id)}
                  className={cn(
                    "absolute rounded-full bg-gradient-to-br border border-white/30 shadow-lg cursor-pointer",
                    "hover:scale-110 active:scale-125 transition-transform",
                    b.color
                  )}
                  style={{
                    width: b.r * 2,
                    height: b.r * 2,
                    left: b.x - b.r,
                    top: b.y - b.r,
                  }}
                >
                  <div className="absolute top-[20%] left-[22%] w-[30%] h-[22%] bg-white/50 rounded-full rotate-[-30deg]" />
                  <div className="absolute top-[35%] left-[55%] w-[15%] h-[10%] bg-white/30 rounded-full rotate-[-30deg]" />
                </motion.button>
              ))}
            </AnimatePresence>

            {bubbles.length === 0 && (
              <div className="absolute inset-0 flex items-center justify-center">
                <p className="text-muted-foreground/40 text-sm select-none">Bubbles incoming…</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────
type Game = "memory" | "bubbles" | null;

export default function GamesPage() {
  const [activeGame, setActiveGame] = useState<Game>(null);

  return (
    <Layout title="Minigames">
      {activeGame === null ? (
        <div className="max-w-3xl mx-auto py-6">
          <p className="text-muted-foreground mb-8">Two games to keep your brain happy — one to sharpen it, one to rest it.</p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {/* Memory Match Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
              className="bg-card rounded-3xl border border-border/60 shadow-sm overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer group"
              onClick={() => setActiveGame("memory")}
            >
              <div className="h-3 bg-gradient-to-r from-primary to-purple-500" />
              <div className="p-6">
                <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
                  <Brain className="w-7 h-7 text-primary" />
                </div>
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="text-xl font-bold">Memory Match</h3>
                  <span className="text-[10px] font-bold uppercase tracking-wider bg-primary/10 text-primary px-2 py-0.5 rounded-full">AI Powered</span>
                </div>
                <p className="text-sm text-muted-foreground mb-5 leading-relaxed">
                  AI generates flashcard pairs from all your notes. Flip cards and match each term with its definition before time runs out.
                </p>
                <div className="flex flex-wrap gap-2 mb-6 text-xs">
                  {["Revision", "Flashcards", "Memory", "Challenging"].map(tag => (
                    <span key={tag} className="bg-muted px-2.5 py-1 rounded-full">{tag}</span>
                  ))}
                </div>
                <Button className="w-full rounded-2xl shadow-lg shadow-primary/15 group-hover:shadow-primary/25 transition-all">
                  <Play className="w-4 h-4 mr-2" /> Play Now
                </Button>
              </div>
            </motion.div>

            {/* Bubble Pop Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
              className="bg-card rounded-3xl border border-border/60 shadow-sm overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer group"
              onClick={() => setActiveGame("bubbles")}
            >
              <div className="h-3 bg-gradient-to-r from-sky-400 to-violet-500" />
              <div className="p-6">
                <div className="w-14 h-14 bg-gradient-to-br from-sky-400/20 to-violet-500/20 rounded-2xl flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
                  <Leaf className="w-7 h-7 text-sky-500" />
                </div>
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="text-xl font-bold">Bubble Pop</h3>
                  <span className="text-[10px] font-bold uppercase tracking-wider bg-sky-500/10 text-sky-600 dark:text-sky-400 px-2 py-0.5 rounded-full">Relaxing</span>
                </div>
                <p className="text-sm text-muted-foreground mb-5 leading-relaxed">
                  Watch colourful bubbles float gently upward and pop them at your own pace. No timer, no pressure — just a moment to unwind.
                </p>
                <div className="flex flex-wrap gap-2 mb-6 text-xs">
                  {["Relaxing", "Stress Relief", "Casual", "Satisfying"].map(tag => (
                    <span key={tag} className="bg-muted px-2.5 py-1 rounded-full">{tag}</span>
                  ))}
                </div>
                <Button className="w-full rounded-2xl bg-gradient-to-r from-sky-500 to-violet-500 hover:opacity-90 border-0 shadow-lg shadow-violet-500/15 group-hover:shadow-violet-500/25 transition-all">
                  <Play className="w-4 h-4 mr-2" /> Play Now
                </Button>
              </div>
            </motion.div>
          </div>
        </div>
      ) : (
        <div className="flex flex-col h-[calc(100vh-140px)]">
          <div className="flex items-center gap-3 mb-4 shrink-0">
            <Button variant="ghost" size="sm" onClick={() => setActiveGame(null)} className="rounded-xl gap-2 text-muted-foreground">
              <Gamepad2 className="w-4 h-4" /> All Games
            </Button>
            <span className="text-muted-foreground/40">/</span>
            <span className="font-semibold">{activeGame === "memory" ? "Memory Match" : "Bubble Pop"}</span>
            {activeGame === "memory" && (
              <span className="ml-1 text-[10px] font-bold uppercase tracking-wider bg-primary/10 text-primary px-2 py-0.5 rounded-full flex items-center gap-1">
                <Sparkles className="w-2.5 h-2.5" /> AI
              </span>
            )}
          </div>
          <div className="flex-1 bg-card rounded-3xl border border-border/60 shadow-sm p-4 md:p-6 overflow-hidden flex flex-col">
            {activeGame === "memory" ? <MemoryMatch /> : <BubblePop />}
          </div>
        </div>
      )}
    </Layout>
  );
}

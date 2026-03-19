import { useState, useEffect } from "react";
import { useGetLeaderboard } from "@workspace/api-client-react";
import { useAuth } from "@workspace/replit-auth-web";
import { Layout } from "@/components/layout";
import { Brain, Leaf, Sparkles, Trophy, GraduationCap, BookOpen } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

const ALL_LEVELS = ["P1","P2","P3","P4","P5","P6","S1","S2","S3","S4","S5","S6","U1","U2","U3","U4"];

const TABS = [
  { key: "memoryMatch", label: "Memory Match", icon: Brain, color: "text-primary", bg: "bg-primary/10", gradient: "from-primary to-violet-500" },
  { key: "bubblePop", label: "Bubble Pop", icon: Leaf, color: "text-sky-500", bg: "bg-sky-500/10", gradient: "from-sky-400 to-violet-500" },
  { key: "quiz", label: "Quiz Scores", icon: Sparkles, color: "text-amber-500", bg: "bg-amber-500/10", gradient: "from-amber-400 to-orange-500" },
] as const;

type TabKey = (typeof TABS)[number]["key"];

function RankBadge({ rank }: { rank: number }) {
  if (rank === 1) return <span className="text-xl">🥇</span>;
  if (rank === 2) return <span className="text-xl">🥈</span>;
  if (rank === 3) return <span className="text-xl">🥉</span>;
  return <span className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-sm font-bold text-muted-foreground">{rank}</span>;
}

export default function LeaderboardPage() {
  const [tab, setTab] = useState<TabKey>("memoryMatch");
  const { user } = useAuth();

  const [quizLevel, setQuizLevel] = useState<string>("");
  const [quizSubject, setQuizSubject] = useState<string>("");

  useEffect(() => {
    if (user?.level && !quizLevel) {
      setQuizLevel(user.level);
    }
  }, [user?.level]);

  const params = tab === "quiz" ? { quizLevel: quizLevel || undefined, quizSubject: quizSubject || undefined } : {};
  const { data: lb, isLoading } = useGetLeaderboard(params);

  const entries = tab === "quiz" ? (lb?.quiz ?? []) : tab === "memoryMatch" ? (lb?.memoryMatch ?? []) : (lb?.bubblePop ?? []);
  const activeTab = TABS.find(t => t.key === tab)!;
  const quizMeta = lb?.quizMeta;

  const availableSubjects = quizMeta?.subjects ?? [];

  return (
    <Layout title="Leaderboard">
      <div className="max-w-2xl mx-auto space-y-6 py-4">
        {/* Tabs */}
        <div className="flex gap-2 p-1 bg-muted/50 rounded-2xl">
          {TABS.map(t => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={cn(
                "flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-sm font-semibold transition-all duration-200",
                tab === t.key
                  ? "bg-card shadow-sm text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <t.icon className={cn("w-4 h-4", tab === t.key ? t.color : "")} />
              <span className="hidden sm:inline">{t.label}</span>
            </button>
          ))}
        </div>

        {/* Header */}
        <div className={`rounded-3xl bg-gradient-to-r ${activeTab.gradient} p-6 text-white shadow-xl`}>
          <div className="flex items-center gap-3 mb-1">
            <Trophy className="w-6 h-6" />
            <h2 className="text-xl font-bold">{activeTab.label} Rankings</h2>
          </div>
          <p className="text-white/70 text-sm">
            {tab === "quiz"
              ? quizLevel
                ? `Top scores for ${quizLevel}${quizSubject ? ` · ${quizSubject}` : " · All subjects"}`
                : "Select a level to see scores"
              : "Top 20 scores from all students"}
          </p>
        </div>

        {/* Quiz Filters */}
        {tab === "quiz" && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-card rounded-2xl border border-border/60 shadow-sm p-4 space-y-3"
          >
            <p className="text-sm font-semibold text-muted-foreground flex items-center gap-2">
              <GraduationCap className="w-4 h-4" /> Filter by Level & Subject
            </p>

            {/* Level picker */}
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2">Level</p>
              <div className="flex flex-wrap gap-1.5">
                <button
                  onClick={() => setQuizLevel("")}
                  className={cn(
                    "px-3 py-1.5 rounded-lg text-xs font-bold transition-all",
                    !quizLevel ? "bg-foreground text-background" : "bg-muted text-muted-foreground hover:bg-muted/80"
                  )}
                >
                  All
                </button>
                {ALL_LEVELS.map(l => (
                  <button
                    key={l}
                    onClick={() => { setQuizLevel(l); setQuizSubject(""); }}
                    className={cn(
                      "px-3 py-1.5 rounded-lg text-xs font-bold transition-all",
                      quizLevel === l
                        ? l.startsWith("P") ? "bg-green-500 text-white shadow-green-500/25 shadow-md"
                          : l.startsWith("S") ? "bg-blue-500 text-white shadow-blue-500/25 shadow-md"
                          : "bg-purple-500 text-white shadow-purple-500/25 shadow-md"
                        : l.startsWith("P") ? "bg-green-500/10 text-green-700 dark:text-green-400 hover:bg-green-500/20"
                          : l.startsWith("S") ? "bg-blue-500/10 text-blue-700 dark:text-blue-400 hover:bg-blue-500/20"
                          : "bg-purple-500/10 text-purple-700 dark:text-purple-400 hover:bg-purple-500/20"
                    )}
                  >
                    {l}
                  </button>
                ))}
              </div>
            </div>

            {/* Subject picker - only show if there are subjects for this level */}
            {quizLevel && availableSubjects.length > 0 && (
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2">Subject</p>
                <div className="flex flex-wrap gap-1.5">
                  <button
                    onClick={() => setQuizSubject("")}
                    className={cn(
                      "px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5",
                      !quizSubject ? "bg-amber-500 text-white shadow-amber-500/25 shadow-md" : "bg-muted text-muted-foreground hover:bg-muted/80"
                    )}
                  >
                    <BookOpen className="w-3 h-3" /> All Subjects
                  </button>
                  {availableSubjects.map(s => (
                    <button
                      key={s}
                      onClick={() => setQuizSubject(s)}
                      className={cn(
                        "px-3 py-1.5 rounded-lg text-xs font-bold transition-all",
                        quizSubject === s ? "bg-amber-500 text-white shadow-amber-500/25 shadow-md" : "bg-amber-500/10 text-amber-700 dark:text-amber-400 hover:bg-amber-500/20"
                      )}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {quizLevel && availableSubjects.length === 0 && !isLoading && (
              <p className="text-xs text-muted-foreground">No quiz scores yet for {quizLevel}. Be the first to submit!</p>
            )}

            {user?.level && !quizLevel && (
              <p className="text-xs text-muted-foreground">
                Your level is <span className="font-bold text-primary">{user.level}</span> — select it above to see your competition.
              </p>
            )}
          </motion.div>
        )}

        {/* Table */}
        <div className="bg-card rounded-3xl border border-border/60 shadow-sm overflow-hidden">
          {isLoading ? (
            <div className="flex flex-col gap-1 p-4">
              {[1, 2, 3, 4, 5].map(i => (
                <div key={i} className="h-16 rounded-2xl bg-muted animate-pulse" />
              ))}
            </div>
          ) : entries.length === 0 ? (
            <div className="py-20 text-center">
              <Trophy className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
              <p className="font-semibold text-lg mb-1">No scores yet</p>
              <p className="text-muted-foreground text-sm">
                {tab === "quiz" && !quizLevel
                  ? "Select a level above to filter quiz scores."
                  : "Be the first to play and claim the top spot!"}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-border/40">
              <AnimatePresence>
                {entries.map((entry, idx) => {
                  const isMe = entry.userId === user?.id;
                  const entryInitials = entry.displayName.split(" ").map((w: string) => w[0]).join("").toUpperCase().slice(0, 2) || "?";
                  return (
                    <motion.div
                      key={entry.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.03, duration: 0.2 }}
                      className={cn(
                        "flex items-center gap-4 px-5 py-4 transition-colors",
                        isMe ? "bg-primary/5" : "hover:bg-muted/30"
                      )}
                    >
                      {/* Rank */}
                      <div className="w-8 flex items-center justify-center shrink-0">
                        <RankBadge rank={idx + 1} />
                      </div>

                      {/* Avatar */}
                      {entry.profileImageUrl ? (
                        <img
                          src={entry.profileImageUrl}
                          alt={entry.displayName}
                          className="w-10 h-10 rounded-xl object-cover border-2 border-border/40 shrink-0"
                        />
                      ) : (
                        <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${activeTab.gradient} flex items-center justify-center text-white text-sm font-bold shrink-0`}>
                          {entryInitials}
                        </div>
                      )}

                      {/* Name + meta */}
                      <div className="flex-1 min-w-0">
                        <p className={cn("font-semibold truncate", isMe && "text-primary")}>
                          {entry.displayName}
                          {isMe && <span className="ml-2 text-xs font-bold bg-primary/10 text-primary px-1.5 py-0.5 rounded-full">You</span>}
                        </p>
                        <div className="flex items-center gap-1.5 flex-wrap mt-0.5">
                          <p className="text-xs text-muted-foreground">
                            {new Date(entry.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                          </p>
                          {tab === "quiz" && entry.userLevel && (
                            <span className={cn(
                              "text-[10px] font-bold px-1.5 py-0.5 rounded-full",
                              entry.userLevel.startsWith("P") ? "bg-green-500/15 text-green-700 dark:text-green-400"
                                : entry.userLevel.startsWith("S") ? "bg-blue-500/15 text-blue-700 dark:text-blue-400"
                                : "bg-purple-500/15 text-purple-700 dark:text-purple-400"
                            )}>
                              {entry.userLevel}
                            </span>
                          )}
                          {tab === "quiz" && entry.subject && (
                            <span className="text-[10px] font-medium bg-amber-500/10 text-amber-700 dark:text-amber-400 px-1.5 py-0.5 rounded-full">
                              {entry.subject}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Score */}
                      <div className="text-right shrink-0">
                        <p className={cn("text-xl font-extrabold", idx === 0 ? "text-amber-500" : idx === 1 ? "text-slate-400" : idx === 2 ? "text-amber-700" : "text-foreground")}>
                          {entry.score.toLocaleString()}
                        </p>
                        <p className="text-xs text-muted-foreground">pts</p>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          )}
        </div>

        {/* My rank callout if not in top 20 */}
        {user && entries.length > 0 && !entries.find(e => e.userId === user.id) && (
          <div className="bg-muted/40 rounded-2xl p-4 border border-border/40 text-center text-sm text-muted-foreground">
            {tab === "quiz"
              ? "You haven't submitted a quiz score here yet. Generate an AI quiz from your notes to get on the board!"
              : "You haven't submitted a score here yet. Play the game to get on the board!"}
          </div>
        )}
      </div>
    </Layout>
  );
}

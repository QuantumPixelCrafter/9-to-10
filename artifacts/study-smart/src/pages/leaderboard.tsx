import { useState } from "react";
import { useGetLeaderboard } from "@workspace/api-client-react";
import { useAuth } from "@workspace/replit-auth-web";
import { Layout } from "@/components/layout";
import { Brain, Leaf, Sparkles, Trophy, Medal } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

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
  const { data: lb, isLoading } = useGetLeaderboard();

  const entries = lb?.[tab] ?? [];
  const activeTab = TABS.find(t => t.key === tab)!;

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
          <p className="text-white/70 text-sm">Top 20 scores from all students</p>
        </div>

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
              <p className="text-muted-foreground text-sm">Be the first to play and claim the top spot!</p>
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

                      {/* Name */}
                      <div className="flex-1 min-w-0">
                        <p className={cn("font-semibold truncate", isMe && "text-primary")}>
                          {entry.displayName}
                          {isMe && <span className="ml-2 text-xs font-bold bg-primary/10 text-primary px-1.5 py-0.5 rounded-full">You</span>}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(entry.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                        </p>
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
            You haven't submitted a score here yet. Play the game to get on the board!
          </div>
        )}
      </div>
    </Layout>
  );
}

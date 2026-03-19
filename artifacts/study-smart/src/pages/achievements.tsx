import { useEffect } from "react";
import { Layout } from "@/components/layout";
import { useGetAchievements, useCheckAchievements } from "@workspace/api-client-react";
import { useToast } from "@/hooks/use-toast";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { Star, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";

const CATEGORY_META: Record<string, { label: string; color: string; bg: string }> = {
  general:   { label: "General",   color: "text-slate-600 dark:text-slate-300",  bg: "bg-slate-500/10" },
  notes:     { label: "Notes",     color: "text-blue-600 dark:text-blue-400",    bg: "bg-blue-500/10" },
  goals:     { label: "Goals",     color: "text-accent dark:text-accent",        bg: "bg-accent/10" },
  timetable: { label: "Timetable", color: "text-secondary dark:text-secondary",  bg: "bg-secondary/10" },
  mood:      { label: "Mood",      color: "text-pink-600 dark:text-pink-400",    bg: "bg-pink-500/10" },
  games:     { label: "Games",     color: "text-emerald-600 dark:text-emerald-400", bg: "bg-emerald-500/10" },
  quiz:      { label: "Quiz",      color: "text-amber-600 dark:text-amber-400",  bg: "bg-amber-500/10" },
};

const CATEGORIES = ["general", "notes", "goals", "timetable", "mood", "games", "quiz"];

export default function AchievementsPage() {
  const { toast } = useToast();
  const { data, isLoading } = useGetAchievements();
  const checkMut = useCheckAchievements();

  useEffect(() => {
    checkMut.mutate(undefined, {
      onSuccess: (res) => {
        if (res.newlyEarned.length > 0) {
          res.newlyEarned.forEach(a => {
            toast({ title: `Achievement Unlocked! ${a.icon} ${a.title}`, description: `+${a.points} pts — ${a.description}` });
          });
        }
      },
    });
  }, []);

  const achievements = data?.achievements ?? [];
  const totalPoints = data?.totalPoints ?? 0;
  const earned = achievements.filter(a => a.earned).length;
  const total = achievements.length;
  const pct = total > 0 ? Math.round((earned / total) * 100) : 0;

  return (
    <Layout title="Achievements">
      <div className="space-y-6 pb-12">

        {/* Summary Card */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-br from-primary to-accent rounded-3xl p-6 text-white shadow-xl shadow-primary/20"
        >
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-white/70 text-sm font-medium">Total Points Earned</p>
              <p className="text-4xl font-black tracking-tight">{totalPoints.toLocaleString()} <span className="text-xl font-bold text-white/70">pts</span></p>
            </div>
            <div className="w-16 h-16 rounded-2xl bg-white/20 flex items-center justify-center text-3xl shadow-inner">
              🏅
            </div>
          </div>
          <div className="space-y-1">
            <div className="flex justify-between text-sm font-medium">
              <span className="text-white/80">{earned} / {total} achievements</span>
              <span className="text-white/80">{pct}%</span>
            </div>
            <div className="h-2.5 bg-white/20 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${pct}%` }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                className="h-full bg-white rounded-full"
              />
            </div>
          </div>
          <div className="mt-3 flex justify-end">
            <Button
              size="sm"
              variant="outline"
              onClick={() => checkMut.mutate(undefined, {
                onSuccess: (res) => {
                  if (res.newlyEarned.length > 0) {
                    res.newlyEarned.forEach(a => toast({ title: `Achievement Unlocked! ${a.icon} ${a.title}`, description: `+${a.points} pts` }));
                  } else {
                    toast({ title: "All caught up!", description: "No new achievements this time." });
                  }
                },
              })}
              disabled={checkMut.isPending}
              className="bg-white/10 border-white/20 text-white hover:bg-white/20 rounded-xl text-xs"
            >
              {checkMut.isPending ? "Checking..." : "Check for New"}
            </Button>
          </div>
        </motion.div>

        {/* Achievements by Category */}
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="h-24 rounded-2xl bg-muted/50 animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="space-y-8">
            {CATEGORIES.map(cat => {
              const catAchievements = achievements.filter(a => a.category === cat);
              if (catAchievements.length === 0) return null;
              const meta = CATEGORY_META[cat];
              const catEarned = catAchievements.filter(a => a.earned).length;
              return (
                <div key={cat}>
                  <div className="flex items-center gap-3 mb-3">
                    <span className={cn("text-xs font-bold px-2.5 py-1 rounded-full", meta.bg, meta.color)}>
                      {meta.label}
                    </span>
                    <span className="text-xs text-muted-foreground">{catEarned}/{catAchievements.length}</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {catAchievements.map((a, i) => (
                      <motion.div
                        key={a.key}
                        initial={{ opacity: 0, scale: 0.96 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: i * 0.04 }}
                        className={cn(
                          "relative p-4 rounded-2xl border flex items-center gap-4 transition-all duration-200",
                          a.earned
                            ? "bg-card border-border/50 shadow-sm hover:shadow-md"
                            : "bg-muted/30 border-border/30 opacity-60"
                        )}
                      >
                        {/* Icon */}
                        <div className={cn(
                          "w-12 h-12 rounded-2xl flex items-center justify-center text-2xl shrink-0 shadow-sm",
                          a.earned ? "bg-background" : "bg-muted/50 grayscale"
                        )}>
                          {a.earned ? a.icon : <Lock className="w-5 h-5 text-muted-foreground/50" />}
                        </div>

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className={cn("font-bold text-sm leading-tight truncate", !a.earned && "text-muted-foreground")}>
                              {a.title}
                            </p>
                            {a.earned && (
                              <span className="shrink-0 flex items-center gap-0.5 text-[10px] font-bold text-amber-500">
                                <Star className="w-3 h-3 fill-amber-500" /> {a.points}
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground mt-0.5 leading-snug">{a.description}</p>
                          {a.earned && a.earnedAt && (
                            <p className="text-[10px] text-muted-foreground/60 mt-1">
                              {new Date(a.earnedAt).toLocaleDateString()}
                            </p>
                          )}
                          {!a.earned && (
                            <p className="text-[10px] font-medium mt-1" style={{ color: "var(--primary)" }}>
                              +{a.points} pts
                            </p>
                          )}
                        </div>

                        {/* Earned badge */}
                        {a.earned && (
                          <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-green-500 flex items-center justify-center">
                            <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                            </svg>
                          </div>
                        )}
                      </motion.div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </Layout>
  );
}

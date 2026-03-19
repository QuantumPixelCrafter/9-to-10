import { useState, useEffect } from "react";
import { Layout } from "@/components/layout";
import { useGetAchievements, useCheckAchievements } from "@workspace/api-client-react";
import { useToast } from "@/hooks/use-toast";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { Star, Lock, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";

const CATEGORY_META: Record<string, { label: string; color: string; bg: string; gradient: string; border: string }> = {
  general:   { label: "General",   color: "text-slate-600 dark:text-slate-300",     bg: "bg-slate-500/10",  gradient: "from-slate-400 to-slate-600",   border: "border-slate-500/20" },
  notes:     { label: "Notes",     color: "text-blue-600 dark:text-blue-400",       bg: "bg-blue-500/10",   gradient: "from-blue-400 to-indigo-500",   border: "border-blue-500/20" },
  goals:     { label: "Goals",     color: "text-accent dark:text-accent",           bg: "bg-accent/10",     gradient: "from-emerald-400 to-teal-500",  border: "border-emerald-500/20" },
  timetable: { label: "Timetable", color: "text-secondary dark:text-secondary",     bg: "bg-secondary/10",  gradient: "from-orange-400 to-amber-500",  border: "border-orange-500/20" },
  mood:      { label: "Mood",      color: "text-pink-600 dark:text-pink-400",       bg: "bg-pink-500/10",   gradient: "from-pink-400 to-rose-500",     border: "border-pink-500/20" },
  games:     { label: "Games",     color: "text-emerald-600 dark:text-emerald-400", bg: "bg-emerald-500/10",gradient: "from-green-400 to-emerald-500",  border: "border-emerald-500/20" },
  quiz:      { label: "Quiz",      color: "text-amber-600 dark:text-amber-400",     bg: "bg-amber-500/10",  gradient: "from-amber-400 to-orange-500",  border: "border-amber-500/20" },
};

const CATEGORIES = ["general", "notes", "goals", "timetable", "mood", "games", "quiz"];

export default function AchievementsPage() {
  const { toast } = useToast();
  const { data, isLoading } = useGetAchievements();
  const checkMut = useCheckAchievements();
  const [newlyEarnedKeys, setNewlyEarnedKeys] = useState<Set<string>>(new Set());

  useEffect(() => {
    checkMut.mutate(undefined, {
      onSuccess: (res) => {
        if (res.newlyEarned.length > 0) {
          setNewlyEarnedKeys(new Set(res.newlyEarned.map(a => a.key)));
          res.newlyEarned.forEach(a => {
            toast({ title: `Achievement Unlocked! ${a.icon} ${a.title}`, description: `+${a.points} pts — ${a.description}` });
          });
          setTimeout(() => setNewlyEarnedKeys(new Set()), 3000);
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
      <div className="space-y-5 pb-12">

        {/* Summary Card */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-br from-primary to-accent rounded-3xl p-6 text-white shadow-xl shadow-primary/20"
        >
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-white/70 text-sm font-medium">Total Points Earned</p>
              <p className="text-4xl font-black tracking-tight">
                {totalPoints.toLocaleString()} <span className="text-xl font-bold text-white/70">pts</span>
              </p>
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
          <div className="mt-4 flex items-center justify-between">
            <div className="flex gap-4 text-xs text-white/70">
              <span>✅ <span className="font-bold text-white">{earned}</span> unlocked</span>
              <span>🔒 <span className="font-bold text-white">{total - earned}</span> locked</span>
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={() => checkMut.mutate(undefined, {
                onSuccess: (res) => {
                  if (res.newlyEarned.length > 0) {
                    setNewlyEarnedKeys(new Set(res.newlyEarned.map(a => a.key)));
                    res.newlyEarned.forEach(a => toast({ title: `Achievement Unlocked! ${a.icon} ${a.title}`, description: `+${a.points} pts` }));
                    setTimeout(() => setNewlyEarnedKeys(new Set()), 3000);
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

        {/* Achievement Index */}
        {isLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 10 }).map((_, i) => (
              <div key={i} className="h-12 rounded-xl bg-muted/50 animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="space-y-6">
            {CATEGORIES.map((cat, catIdx) => {
              const catAchievements = achievements.filter(a => a.category === cat);
              if (catAchievements.length === 0) return null;
              const meta = CATEGORY_META[cat];
              const catEarned = catAchievements.filter(a => a.earned).length;

              return (
                <motion.div
                  key={cat}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: catIdx * 0.05 }}
                >
                  {/* Category header */}
                  <div className="flex items-center gap-3 mb-2">
                    <span className={cn("text-xs font-bold px-2.5 py-1 rounded-full", meta.bg, meta.color)}>
                      {meta.label}
                    </span>
                    <div className="flex-1 h-px bg-border" />
                    <span className="text-xs text-muted-foreground font-semibold">
                      {catEarned}/{catAchievements.length}
                    </span>
                  </div>

                  {/* Achievement rows */}
                  <div className={cn("rounded-2xl border overflow-hidden divide-y", meta.border)}>
                    {catAchievements.map((a, rowIdx) => {
                      const isNew = newlyEarnedKeys.has(a.key);
                      return (
                        <AnimatePresence key={a.key}>
                          <motion.div
                            initial={isNew ? { backgroundColor: "rgba(255,255,255,0.15)" } : {}}
                            animate={{ backgroundColor: "transparent" }}
                            transition={{ duration: 1.5 }}
                            className={cn(
                              "flex items-center gap-3 px-4 py-3 relative",
                              a.earned
                                ? "bg-card hover:bg-muted/30 transition-colors"
                                : "bg-muted/20"
                            )}
                          >
                            {/* Icon */}
                            <div className={cn(
                              "w-9 h-9 rounded-xl flex items-center justify-center text-lg shrink-0",
                              a.earned
                                ? cn("bg-gradient-to-br shadow-sm", meta.gradient)
                                : "bg-muted"
                            )}>
                              <span className={cn("select-none", !a.earned && "opacity-25 grayscale")}>
                                {a.icon}
                              </span>
                            </div>

                            {/* Text */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <span className={cn(
                                  "text-sm font-semibold truncate",
                                  a.earned ? "text-foreground" : "text-muted-foreground/50"
                                )}>
                                  {a.title}
                                </span>
                                {isNew && (
                                  <span className="shrink-0 text-[9px] font-black px-1.5 py-0.5 rounded-full bg-primary text-white animate-pulse">
                                    NEW
                                  </span>
                                )}
                              </div>
                              <p className={cn(
                                "text-xs truncate",
                                a.earned ? "text-muted-foreground" : "text-muted-foreground/35"
                              )}>
                                {a.description}
                              </p>
                            </div>

                            {/* Points */}
                            <div className={cn(
                              "shrink-0 flex items-center gap-0.5 text-xs font-bold",
                              a.earned ? "text-amber-500" : "text-muted-foreground/30"
                            )}>
                              <Star className={cn("w-3 h-3", a.earned && "fill-amber-400 text-amber-400")} />
                              {a.points}
                            </div>

                            {/* Status icon */}
                            <div className="shrink-0 w-6 flex items-center justify-center">
                              {a.earned ? (
                                <motion.div
                                  initial={isNew ? { scale: 0 } : false}
                                  animate={{ scale: 1 }}
                                  transition={{ type: "spring", stiffness: 400, damping: 15 }}
                                >
                                  <CheckCircle2 className="w-5 h-5 text-green-500 fill-green-500/20" />
                                </motion.div>
                              ) : (
                                <Lock className="w-4 h-4 text-muted-foreground/30" />
                              )}
                            </div>

                            {/* Earned date — shown on hover via absolute tooltip-style */}
                            {a.earned && a.earnedAt && (
                              <div className="absolute right-12 top-1/2 -translate-y-1/2 hidden sm:block">
                                <span className="text-[10px] text-muted-foreground/40">
                                  {new Date(a.earnedAt).toLocaleDateString()}
                                </span>
                              </div>
                            )}
                          </motion.div>
                        </AnimatePresence>
                      );
                    })}
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </Layout>
  );
}

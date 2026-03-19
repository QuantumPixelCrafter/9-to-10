import { useState, useEffect } from "react";
import { Layout } from "@/components/layout";
import { useGetAchievements, useCheckAchievements } from "@workspace/api-client-react";
import { useToast } from "@/hooks/use-toast";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { Star, Lock, CheckCircle2, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

const CATEGORY_META: Record<string, { label: string; color: string; bg: string; gradient: string; border: string }> = {
  general:   { label: "General",   color: "text-slate-600 dark:text-slate-300",     bg: "bg-slate-500/10",  gradient: "from-slate-400 to-slate-600",   border: "border-slate-200 dark:border-slate-700" },
  notes:     { label: "Notes",     color: "text-blue-600 dark:text-blue-400",       bg: "bg-blue-500/10",   gradient: "from-blue-400 to-indigo-500",   border: "border-blue-200 dark:border-blue-900" },
  goals:     { label: "Goals",     color: "text-emerald-600 dark:text-emerald-400", bg: "bg-emerald-500/10",gradient: "from-emerald-400 to-teal-500",  border: "border-emerald-200 dark:border-emerald-900" },
  timetable: { label: "Timetable", color: "text-orange-600 dark:text-orange-400",   bg: "bg-orange-500/10", gradient: "from-orange-400 to-amber-500",  border: "border-orange-200 dark:border-orange-900" },
  mood:      { label: "Mood",      color: "text-pink-600 dark:text-pink-400",       bg: "bg-pink-500/10",   gradient: "from-pink-400 to-rose-500",     border: "border-pink-200 dark:border-pink-900" },
  games:     { label: "Games",     color: "text-emerald-600 dark:text-emerald-400", bg: "bg-emerald-500/10",gradient: "from-green-400 to-emerald-500",  border: "border-emerald-200 dark:border-emerald-900" },
  quiz:      { label: "Quiz",      color: "text-amber-600 dark:text-amber-400",     bg: "bg-amber-500/10",  gradient: "from-amber-400 to-orange-500",  border: "border-amber-200 dark:border-amber-900" },
};

const CATEGORIES = ["general", "notes", "goals", "timetable", "mood", "games", "quiz"];

export default function AchievementsPage() {
  const { toast } = useToast();
  const { data, isLoading, isError } = useGetAchievements();
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
              className="bg-white/10 border-white/20 text-white hover:bg-white/20 rounded-xl text-xs gap-1.5"
            >
              <RefreshCw className={cn("w-3 h-3", checkMut.isPending && "animate-spin")} />
              {checkMut.isPending ? "Checking..." : "Check for New"}
            </Button>
          </div>
        </motion.div>

        {/* Achievement Index */}
        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="space-y-2">
                <div className="h-5 w-24 rounded-full bg-muted/60 animate-pulse" />
                <div className="rounded-2xl border overflow-hidden divide-y divide-border">
                  {Array.from({ length: 3 }).map((_, j) => (
                    <div key={j} className="h-14 bg-muted/30 animate-pulse" />
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : isError ? (
          <div className="text-center py-12 text-muted-foreground">
            <p className="text-lg font-semibold mb-1">Couldn't load achievements</p>
            <p className="text-sm">Make sure you're logged in and try again.</p>
          </div>
        ) : (
          <div className="space-y-5">
            {CATEGORIES.map((cat, catIdx) => {
              const catAchievements = achievements.filter(a => a.category === cat);
              if (catAchievements.length === 0) return null;
              const meta = CATEGORY_META[cat];
              const catEarned = catAchievements.filter(a => a.earned).length;

              return (
                <motion.div
                  key={cat}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: catIdx * 0.04 }}
                >
                  {/* Category header */}
                  <div className="flex items-center gap-3 mb-2">
                    <span className={cn("text-xs font-bold px-2.5 py-1 rounded-full shrink-0", meta.bg, meta.color)}>
                      {meta.label}
                    </span>
                    <div className="flex-1 h-px bg-border" />
                    <span className="text-xs text-muted-foreground font-semibold shrink-0">
                      {catEarned} / {catAchievements.length}
                    </span>
                  </div>

                  {/* Achievement rows */}
                  <div className={cn("rounded-2xl border overflow-hidden divide-y", meta.border)}>
                    {catAchievements.map((a) => {
                      const isNew = newlyEarnedKeys.has(a.key);
                      return (
                        <div
                          key={a.key}
                          className={cn(
                            "flex items-center gap-3 px-4 py-3",
                            a.earned
                              ? "bg-card"
                              : "bg-muted/10"
                          )}
                        >
                          {/* Icon */}
                          <div className={cn(
                            "w-10 h-10 rounded-xl flex items-center justify-center text-xl shrink-0",
                            a.earned
                              ? cn("bg-gradient-to-br", meta.gradient)
                              : "bg-muted/50 border border-border"
                          )}>
                            <span className={cn("select-none text-lg", !a.earned && "grayscale opacity-50")}>
                              {a.icon}
                            </span>
                          </div>

                          {/* Text */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className={cn(
                                "text-sm font-semibold",
                                a.earned ? "text-foreground" : "text-foreground/60"
                              )}>
                                {a.title}
                              </span>
                              {isNew && (
                                <span className="text-[9px] font-black px-1.5 py-0.5 rounded-full bg-primary text-white animate-pulse">
                                  NEW
                                </span>
                              )}
                              {!a.earned && (
                                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground border border-border">
                                  LOCKED
                                </span>
                              )}
                            </div>
                            <p className={cn(
                              "text-xs mt-0.5",
                              a.earned ? "text-muted-foreground" : "text-muted-foreground/70"
                            )}>
                              {a.description}
                            </p>
                          </div>

                          {/* Points */}
                          <div className={cn(
                            "shrink-0 flex items-center gap-0.5 text-xs font-bold",
                            a.earned ? "text-amber-500" : "text-muted-foreground/50"
                          )}>
                            <Star className={cn("w-3 h-3", a.earned && "fill-amber-400 text-amber-400")} />
                            {a.points}
                          </div>

                          {/* Status */}
                          <div className="shrink-0 w-6 flex items-center justify-center">
                            {a.earned ? (
                              <CheckCircle2 className="w-5 h-5 text-green-500 fill-green-500/20" />
                            ) : (
                              <Lock className="w-4 h-4 text-muted-foreground/40" />
                            )}
                          </div>
                        </div>
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

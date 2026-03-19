import { useState, useEffect } from "react";
import { Layout } from "@/components/layout";
import { useGetAchievements, useCheckAchievements } from "@workspace/api-client-react";
import { useToast } from "@/hooks/use-toast";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { Star } from "lucide-react";
import { Button } from "@/components/ui/button";

const CATEGORY_META: Record<string, { label: string; color: string; bg: string; gradient: string }> = {
  general:   { label: "General",   color: "text-slate-600 dark:text-slate-300",     bg: "bg-slate-500/10",  gradient: "from-slate-400 to-slate-600" },
  notes:     { label: "Notes",     color: "text-blue-600 dark:text-blue-400",       bg: "bg-blue-500/10",   gradient: "from-blue-400 to-indigo-500" },
  goals:     { label: "Goals",     color: "text-accent dark:text-accent",           bg: "bg-accent/10",     gradient: "from-emerald-400 to-teal-500" },
  timetable: { label: "Timetable", color: "text-secondary dark:text-secondary",     bg: "bg-secondary/10",  gradient: "from-orange-400 to-amber-500" },
  mood:      { label: "Mood",      color: "text-pink-600 dark:text-pink-400",       bg: "bg-pink-500/10",   gradient: "from-pink-400 to-rose-500" },
  games:     { label: "Games",     color: "text-emerald-600 dark:text-emerald-400", bg: "bg-emerald-500/10",gradient: "from-green-400 to-emerald-500" },
  quiz:      { label: "Quiz",      color: "text-amber-600 dark:text-amber-400",     bg: "bg-amber-500/10",  gradient: "from-amber-400 to-orange-500" },
};

const CATEGORIES = ["general", "notes", "goals", "timetable", "mood", "games", "quiz"];

function LockBreakIcon({ breaking }: { breaking: boolean }) {
  return (
    <AnimatePresence mode="wait">
      {breaking ? (
        <motion.div
          key="breaking"
          className="relative w-7 h-7"
          initial={{ scale: 1, rotate: 0 }}
          animate={{ scale: [1, 1.4, 0], rotate: [0, -15, 25], opacity: [1, 1, 0] }}
          transition={{ duration: 0.6, ease: "easeIn" }}
        >
          <span className="text-2xl select-none">🔓</span>
        </motion.div>
      ) : (
        <motion.div
          key="locked"
          className="relative"
          initial={{ scale: 0, rotate: -10 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: "spring", stiffness: 400, damping: 20 }}
        >
          <span className="text-2xl select-none drop-shadow-lg">🔒</span>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function AchievementCard({
  achievement,
  index,
  isNewlyEarned,
}: {
  achievement: {
    key: string; title: string; description: string; icon: string;
    points: number; earned: boolean; earnedAt?: string | null; category: string;
  };
  index: number;
  isNewlyEarned: boolean;
}) {
  const [playUnlock, setPlayUnlock] = useState(false);
  const [showLockBreak, setShowLockBreak] = useState(false);

  useEffect(() => {
    if (isNewlyEarned) {
      setShowLockBreak(true);
      setPlayUnlock(true);
      const t = setTimeout(() => setShowLockBreak(false), 800);
      return () => clearTimeout(t);
    }
  }, [isNewlyEarned]);

  const meta = CATEGORY_META[achievement.category];

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: index * 0.04 }}
      className="relative"
    >
      {/* Unlock flash overlay */}
      <AnimatePresence>
        {playUnlock && (
          <motion.div
            key="flash"
            className="absolute inset-0 rounded-2xl bg-white z-20 pointer-events-none"
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 0.7, 0] }}
            transition={{ duration: 0.5 }}
            onAnimationComplete={() => setPlayUnlock(false)}
          />
        )}
      </AnimatePresence>

      <div className={cn(
        "relative p-4 rounded-2xl border flex items-center gap-4 transition-all duration-500 overflow-hidden",
        achievement.earned
          ? "bg-card border-border/50 shadow-sm hover:shadow-lg hover:shadow-primary/10"
          : "bg-[#0e0e0e] dark:bg-[#0a0a0a] border-white/5"
      )}>

        {/* Index badge */}
        <div className={cn(
          "absolute top-2 left-2 text-[9px] font-black rounded-full w-5 h-5 flex items-center justify-center z-10",
          achievement.earned
            ? cn("text-white bg-gradient-to-br", meta.gradient)
            : "bg-white/10 text-white/30"
        )}>
          {index}
        </div>

        {/* Icon area */}
        <div className={cn(
          "w-14 h-14 rounded-2xl flex items-center justify-center text-2xl shrink-0 relative mt-2",
          achievement.earned
            ? cn("bg-gradient-to-br shadow-lg", meta.gradient)
            : "bg-white/5"
        )}>
          {achievement.earned ? (
            <motion.span
              key="earned-icon"
              initial={isNewlyEarned ? { scale: 0, rotate: -20 } : false}
              animate={isNewlyEarned ? { scale: [0, 1.3, 1], rotate: [-20, 10, 0] } : {}}
              transition={{ delay: 0.3, type: "spring", stiffness: 300 }}
              className="text-2xl select-none"
            >
              {achievement.icon}
            </motion.span>
          ) : (
            <div className="flex items-center justify-center">
              <span className="text-2xl select-none opacity-15 grayscale">{achievement.icon}</span>
            </div>
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className={cn(
              "font-bold text-sm leading-tight",
              achievement.earned ? "text-foreground" : "text-white/25"
            )}>
              {achievement.title}
            </p>
            <span className={cn(
              "shrink-0 flex items-center gap-0.5 text-[10px] font-bold",
              achievement.earned ? "text-amber-400" : "text-white/20"
            )}>
              <Star className={cn("w-3 h-3", achievement.earned ? "fill-amber-400" : "")} />
              {achievement.points}
            </span>
          </div>
          <p className={cn(
            "text-xs mt-0.5 leading-snug",
            achievement.earned ? "text-muted-foreground" : "text-white/20"
          )}>
            {achievement.description}
          </p>
          {achievement.earned && achievement.earnedAt && (
            <p className="text-[10px] text-muted-foreground/50 mt-1">
              Earned {new Date(achievement.earnedAt).toLocaleDateString()}
            </p>
          )}
        </div>

        {/* Right side: lock or checkmark */}
        <div className="shrink-0 flex flex-col items-center justify-center">
          {achievement.earned ? (
            <motion.div
              key="check"
              initial={isNewlyEarned ? { scale: 0 } : false}
              animate={isNewlyEarned ? { scale: [0, 1.4, 1] } : {}}
              transition={{ delay: 0.5, type: "spring" }}
              className="w-7 h-7 rounded-full bg-green-500 flex items-center justify-center shadow-lg shadow-green-500/30"
            >
              <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </motion.div>
          ) : (
            <LockBreakIcon breaking={showLockBreak} />
          )}
        </div>

        {/* Dark overlay for locked */}
        {!achievement.earned && (
          <div className="absolute inset-0 rounded-2xl bg-black/60 pointer-events-none" />
        )}
      </div>
    </motion.div>
  );
}

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
          setTimeout(() => setNewlyEarnedKeys(new Set()), 2000);
        }
      },
    });
  }, []);

  const achievements = data?.achievements ?? [];
  const totalPoints = data?.totalPoints ?? 0;
  const earned = achievements.filter(a => a.earned).length;
  const total = achievements.length;
  const pct = total > 0 ? Math.round((earned / total) * 100) : 0;

  let globalIndex = 0;

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

          {/* Index summary row */}
          <div className="mt-4 flex items-center justify-between">
            <div className="flex gap-4 text-xs text-white/70">
              <span>🔓 <span className="font-bold text-white">{earned}</span> unlocked</span>
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
                    setTimeout(() => setNewlyEarnedKeys(new Set()), 2000);
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
                  {/* Category header */}
                  <div className="flex items-center gap-3 mb-3">
                    <span className={cn("text-xs font-bold px-2.5 py-1 rounded-full", meta.bg, meta.color)}>
                      {meta.label}
                    </span>
                    <span className="text-xs text-muted-foreground font-medium">{catEarned}/{catAchievements.length}</span>
                    {/* Mini progress bar */}
                    <div className="flex-1 h-1 bg-muted rounded-full overflow-hidden max-w-[80px]">
                      <motion.div
                        className={cn("h-full rounded-full bg-gradient-to-r", meta.gradient)}
                        initial={{ width: 0 }}
                        animate={{ width: catAchievements.length > 0 ? `${(catEarned / catAchievements.length) * 100}%` : "0%" }}
                        transition={{ duration: 0.6, ease: "easeOut" }}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {catAchievements.map((a) => {
                      globalIndex += 1;
                      return (
                        <AchievementCard
                          key={a.key}
                          achievement={a}
                          index={globalIndex}
                          isNewlyEarned={newlyEarnedKeys.has(a.key)}
                        />
                      );
                    })}
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

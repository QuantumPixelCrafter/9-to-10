import { useState } from "react";
import { useAuth } from "@workspace/replit-auth-web";
import { useGetLeaderboard } from "@workspace/api-client-react";
import { Layout } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { LogOut, Trophy, Brain, Leaf, Sparkles, Star, User, Mail, GraduationCap, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

const LEVELS = [
  { code: "P1", label: "P1", group: "Primary" },
  { code: "P2", label: "P2", group: "Primary" },
  { code: "P3", label: "P3", group: "Primary" },
  { code: "P4", label: "P4", group: "Primary" },
  { code: "P5", label: "P5", group: "Primary" },
  { code: "P6", label: "P6", group: "Primary" },
  { code: "S1", label: "S1", group: "Secondary" },
  { code: "S2", label: "S2", group: "Secondary" },
  { code: "S3", label: "S3", group: "Secondary" },
  { code: "S4", label: "S4", group: "Secondary" },
  { code: "S5", label: "S5", group: "Secondary" },
  { code: "S6", label: "S6", group: "Secondary" },
  { code: "U1", label: "U1", group: "University" },
  { code: "U2", label: "U2", group: "University" },
  { code: "U3", label: "U3", group: "University" },
  { code: "U4", label: "U4", group: "University" },
];

const LEVEL_GROUPS = [
  { name: "Primary", color: "text-green-600 dark:text-green-400", bg: "bg-green-500/10", selected: "bg-green-500 text-white shadow-green-500/25", levels: LEVELS.filter(l => l.group === "Primary") },
  { name: "Secondary", color: "text-blue-600 dark:text-blue-400", bg: "bg-blue-500/10", selected: "bg-blue-500 text-white shadow-blue-500/25", levels: LEVELS.filter(l => l.group === "Secondary") },
  { name: "University", color: "text-purple-600 dark:text-purple-400", bg: "bg-purple-500/10", selected: "bg-purple-500 text-white shadow-purple-500/25", levels: LEVELS.filter(l => l.group === "University") },
];

export default function ProfilePage() {
  const { user, logout, updateLevel } = useAuth();
  const { data: lb } = useGetLeaderboard();
  const [savingLevel, setSavingLevel] = useState(false);
  const { toast } = useToast();

  const displayName = [user?.firstName, user?.lastName].filter(Boolean).join(" ") || "Anonymous";
  const initials = displayName.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2) || "?";

  const myMemoryBest = lb?.memoryMatch?.filter(e => e.userId === user?.id).sort((a, b) => b.score - a.score)[0];
  const myBubbleBest = lb?.bubblePop?.filter(e => e.userId === user?.id).sort((a, b) => b.score - a.score)[0];
  const myQuizBest = lb?.quiz?.filter(e => e.userId === user?.id).sort((a, b) => b.score - a.score)[0];

  const memoryRank = myMemoryBest ? (lb?.memoryMatch?.findIndex(e => e.userId === user?.id) ?? -1) + 1 : null;
  const bubbleRank = myBubbleBest ? (lb?.bubblePop?.findIndex(e => e.userId === user?.id) ?? -1) + 1 : null;
  const quizRank = myQuizBest ? (lb?.quiz?.findIndex(e => e.userId === user?.id) ?? -1) + 1 : null;

  const stats = [
    { label: "Memory Match", icon: Brain, best: myMemoryBest?.score, rank: memoryRank, color: "from-primary to-violet-500", bg: "bg-primary/10", text: "text-primary" },
    { label: "Bubble Pop", icon: Leaf, best: myBubbleBest?.score, rank: bubbleRank, color: "from-sky-400 to-violet-500", bg: "bg-sky-500/10", text: "text-sky-500" },
    { label: "Quiz", icon: Sparkles, best: myQuizBest?.score, rank: quizRank, color: "from-amber-400 to-orange-500", bg: "bg-amber-500/10", text: "text-amber-500" },
  ];

  const handleLevelSelect = async (code: string) => {
    if (savingLevel) return;
    const newLevel = user?.level === code ? null : code;
    setSavingLevel(true);
    try {
      await updateLevel(newLevel);
      toast({ title: newLevel ? `Level set to ${newLevel}` : "Level cleared", description: newLevel ? "Your quizzes and leaderboard will now match your level." : "" });
    } catch {
      toast({ title: "Failed to update level", variant: "destructive" });
    } finally {
      setSavingLevel(false);
    }
  };

  return (
    <Layout title="My Profile">
      <div className="max-w-2xl mx-auto space-y-6 py-4">
        {/* Avatar Card */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          className="bg-card rounded-3xl border border-border/60 shadow-sm overflow-hidden">
          <div className="h-24 bg-gradient-to-r from-primary via-violet-500 to-accent" />
          <div className="px-8 pb-8 -mt-12">
            <div className="flex items-end gap-5 mb-5">
              {user?.profileImageUrl ? (
                <img
                  src={user.profileImageUrl}
                  alt={displayName}
                  className="w-20 h-20 rounded-2xl border-4 border-card shadow-xl object-cover"
                />
              ) : (
                <div className="w-20 h-20 rounded-2xl border-4 border-card shadow-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white text-2xl font-bold">
                  {initials}
                </div>
              )}
              <div className="pb-1">
                <h2 className="text-2xl font-bold">{displayName}</h2>
                {user?.email && (
                  <p className="text-muted-foreground text-sm flex items-center gap-1.5 mt-0.5">
                    <Mail className="w-3.5 h-3.5" /> {user.email}
                  </p>
                )}
                {user?.level && (
                  <span className="mt-1.5 inline-flex items-center gap-1.5 bg-primary/10 text-primary text-xs font-bold px-2.5 py-1 rounded-full">
                    <GraduationCap className="w-3 h-3" />
                    {user.level} — {LEVELS.find(l => l.code === user.level)?.group}
                  </span>
                )}
              </div>
            </div>
            <Button onClick={logout} variant="outline" className="rounded-xl gap-2 border-destructive/30 text-destructive hover:bg-destructive/5 hover:text-destructive">
              <LogOut className="w-4 h-4" /> Sign Out
            </Button>
          </div>
        </motion.div>

        {/* Level Picker */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.06 }}
          className="bg-card rounded-3xl border border-border/60 shadow-sm p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
              <GraduationCap className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h3 className="font-bold text-base">My Education Level</h3>
              <p className="text-xs text-muted-foreground">Used to tailor AI quizzes and filter leaderboard scores</p>
            </div>
          </div>

          <div className="space-y-4">
            {LEVEL_GROUPS.map(group => (
              <div key={group.name}>
                <p className={cn("text-xs font-bold uppercase tracking-widest mb-2", group.color)}>{group.name}</p>
                <div className="grid grid-cols-6 gap-2">
                  {group.levels.map(lvl => {
                    const isSelected = user?.level === lvl.code;
                    return (
                      <button
                        key={lvl.code}
                        onClick={() => handleLevelSelect(lvl.code)}
                        disabled={savingLevel}
                        className={cn(
                          "relative py-2.5 rounded-xl text-sm font-bold transition-all duration-200 active:scale-95",
                          isSelected
                            ? `${group.selected} shadow-lg`
                            : `${group.bg} ${group.color} hover:opacity-80`
                        )}
                      >
                        {lvl.code}
                        {isSelected && (
                          <span className="absolute -top-1 -right-1 w-4 h-4 bg-white rounded-full flex items-center justify-center shadow">
                            <CheckCircle2 className="w-3.5 h-3.5 text-green-500" />
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          {!user?.level && (
            <p className="text-xs text-muted-foreground mt-4 bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 p-3 rounded-xl border border-amber-200 dark:border-amber-500/20">
              Set your level so your quiz scores appear on the right leaderboard and the AI generates age-appropriate questions.
            </p>
          )}
        </motion.div>

        {/* Stats */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.12 }}>
          <h3 className="font-bold text-lg mb-3 px-1">My Best Scores</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {stats.map((s, i) => (
              <motion.div key={s.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.16 + i * 0.06 }}
                className="bg-card rounded-2xl border border-border/60 shadow-sm p-5">
                <div className={`w-10 h-10 rounded-xl ${s.bg} flex items-center justify-center mb-3`}>
                  <s.icon className={`w-5 h-5 ${s.text}`} />
                </div>
                <p className="text-sm text-muted-foreground mb-1">{s.label}</p>
                {s.best != null ? (
                  <>
                    <p className="text-2xl font-extrabold">{s.best}</p>
                    {s.rank && (
                      <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                        <Trophy className="w-3 h-3 text-amber-500" />
                        {s.rank === 1 ? "🥇 1st place" : s.rank === 2 ? "🥈 2nd place" : s.rank === 3 ? "🥉 3rd place" : `#${s.rank} overall`}
                      </p>
                    )}
                  </>
                ) : (
                  <p className="text-muted-foreground text-sm italic">No score yet</p>
                )}
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Account Info */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.22 }}
          className="bg-card rounded-3xl border border-border/60 shadow-sm p-6">
          <h3 className="font-bold text-lg mb-4">Account Info</h3>
          <div className="space-y-3">
            <div className="flex items-center gap-3 py-2.5 border-b border-border/40">
              <User className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground w-24">Display name</span>
              <span className="font-medium">{displayName}</span>
            </div>
            {user?.email && (
              <div className="flex items-center gap-3 py-2.5 border-b border-border/40">
                <Mail className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground w-24">Email</span>
                <span className="font-medium">{user.email}</span>
              </div>
            )}
            <div className="flex items-center gap-3 py-2.5">
              <GraduationCap className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground w-24">Level</span>
              <span className="font-medium">{user?.level ? `${user.level} (${LEVELS.find(l => l.code === user.level)?.group})` : "Not set"}</span>
            </div>
          </div>
        </motion.div>

        {/* Tip */}
        <div className="bg-primary/5 rounded-2xl p-5 border border-primary/10 flex gap-3">
          <Star className="w-5 h-5 text-primary shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-sm mb-1">Climb the leaderboard!</p>
            <p className="text-sm text-muted-foreground">Play Memory Match and Bubble Pop, or take AI quizzes on your notes. Your best scores appear on the leaderboard — filtered by your level and subject so you compete with students at the same stage.</p>
          </div>
        </div>
      </div>
    </Layout>
  );
}

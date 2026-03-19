import { useAuth } from "@workspace/replit-auth-web";
import { useGetLeaderboard } from "@workspace/api-client-react";
import { Layout } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { LogOut, Trophy, Brain, Leaf, Sparkles, Star, User, Mail } from "lucide-react";

export default function ProfilePage() {
  const { user, logout } = useAuth();
  const { data: lb } = useGetLeaderboard();

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
              </div>
            </div>
            <Button onClick={logout} variant="outline" className="rounded-xl gap-2 border-destructive/30 text-destructive hover:bg-destructive/5 hover:text-destructive">
              <LogOut className="w-4 h-4" /> Sign Out
            </Button>
          </div>
        </motion.div>

        {/* Stats */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }}>
          <h3 className="font-bold text-lg mb-3 px-1">My Best Scores</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {stats.map((s, i) => (
              <motion.div key={s.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.12 + i * 0.06 }}
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
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
          className="bg-card rounded-3xl border border-border/60 shadow-sm p-6">
          <h3 className="font-bold text-lg mb-4">Account Info</h3>
          <div className="space-y-3">
            <div className="flex items-center gap-3 py-2.5 border-b border-border/40">
              <User className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground w-24">Display name</span>
              <span className="font-medium">{displayName}</span>
            </div>
            {user?.email && (
              <div className="flex items-center gap-3 py-2.5">
                <Mail className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground w-24">Email</span>
                <span className="font-medium">{user.email}</span>
              </div>
            )}
          </div>
        </motion.div>

        {/* Tip */}
        <div className="bg-primary/5 rounded-2xl p-5 border border-primary/10 flex gap-3">
          <Star className="w-5 h-5 text-primary shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-sm mb-1">Climb the leaderboard!</p>
            <p className="text-sm text-muted-foreground">Play Memory Match and Bubble Pop in the Minigames section. Your top scores appear on the global leaderboard for all students to see.</p>
          </div>
        </div>
      </div>
    </Layout>
  );
}

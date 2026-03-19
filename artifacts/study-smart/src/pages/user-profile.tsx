import { useParams, useLocation } from "wouter";
import { Layout } from "@/components/layout";
import { useGetUserProfile, useSendFriendRequest, useAcceptFriendRequest, useDeclineFriendRequest, useRemoveFriend } from "@workspace/api-client-react";
import { useAuth } from "@workspace/replit-auth-web";
import { motion } from "framer-motion";
import { useToast } from "@/hooks/use-toast";
import { getBgStyle, getFrameGradient, getItemDef } from "@/lib/shop-data";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Brain, Leaf, Sparkles, Trophy, Zap, UserPlus, UserCheck, MessageCircle, ArrowLeft, GraduationCap, Star, Medal } from "lucide-react";

function XpBar({ progress, level, xpInLevel, xpNeeded }: { progress: number; level: number; xpInLevel: number; xpNeeded: number }) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-xs">
        <span className="font-bold text-violet-600 dark:text-violet-400 flex items-center gap-1"><Zap className="w-3 h-3" /> Level {level}</span>
        {xpNeeded > 0 ? (
          <span className="text-muted-foreground">{xpInLevel.toLocaleString()} / {xpNeeded.toLocaleString()} XP</span>
        ) : (
          <span className="text-violet-500 font-bold">Level 100</span>
        )}
      </div>
      <div className="h-2 bg-violet-500/15 rounded-full overflow-hidden">
        <div className="h-full bg-gradient-to-r from-violet-500 to-primary rounded-full transition-all duration-500" style={{ width: `${progress}%` }} />
      </div>
    </div>
  );
}

export default function UserProfilePage() {
  const params = useParams<{ userId: string }>();
  const userId = params.userId ?? "";
  const { user: me } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  const { data: profile, isLoading, refetch } = useGetUserProfile(userId);
  const sendReqMut = useSendFriendRequest();
  const acceptMut = useAcceptFriendRequest();
  const declineMut = useDeclineFriendRequest();
  const removeMut = useRemoveFriend();

  if (isLoading) {
    return (
      <Layout title="Profile">
        <div className="max-w-xl mx-auto flex items-center justify-center py-20">
          <div className="w-10 h-10 rounded-full border-4 border-primary/30 border-t-primary animate-spin" />
        </div>
      </Layout>
    );
  }
  if (!profile) {
    return <Layout title="Not Found"><div className="text-center py-20 text-muted-foreground">User not found.</div></Layout>;
  }

  const isMe = me?.id === profile.id;
  const bgStyle = getBgStyle(profile.equippedBackground);
  const frameGrad = getFrameGradient(profile.equippedFrame);
  const nametagDef = getItemDef(profile.equippedNametag);
  const levelInfo = profile.levelProgress;

  const fs = profile.friendship;
  const isFriend = fs?.status === "accepted";
  const isPending = fs?.status === "pending";
  const isIncoming = isPending && !fs?.iAmRequester;

  const handleAddFriend = () => {
    sendReqMut.mutate(profile.id, {
      onSuccess: () => { toast({ title: "Friend request sent!" }); refetch(); },
    });
  };
  const handleAccept = () => {
    if (!fs) return;
    acceptMut.mutate(fs.id, { onSuccess: () => { toast({ title: "Friend accepted!" }); refetch(); } });
  };
  const handleRemove = () => {
    if (!fs) return;
    removeMut.mutate(fs.id, { onSuccess: () => { toast({ title: "Removed" }); refetch(); } });
  };

  const earnedAchievements = profile.achievements.list.filter(a => a.earned);

  return (
    <Layout title={profile.displayName}>
      <div className="max-w-xl mx-auto space-y-5 pb-12">
        <button onClick={() => history.back()} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back
        </button>

        {/* Profile card */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="bg-card rounded-3xl border border-border/60 shadow-sm overflow-hidden">
          <div className="h-24" style={{ background: bgStyle }} />
          <div className="px-6 pb-6 -mt-10">
            <div className="flex items-end gap-4 mb-4">
              {frameGrad ? (
                <div className="rounded-2xl p-[3px] shadow-xl" style={{ background: frameGrad }}>
                  <div className="w-20 h-20 rounded-[14px] overflow-hidden bg-card">
                    {profile.profileImageUrl ? (
                      <img src={profile.profileImageUrl} alt={profile.displayName} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white text-2xl font-bold">
                        {profile.displayName.split(" ").map(w => w[0]).join("").slice(0, 2)}
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="w-20 h-20 rounded-2xl border-4 border-card shadow-xl overflow-hidden bg-gradient-to-br from-primary to-accent">
                  {profile.profileImageUrl ? (
                    <img src={profile.profileImageUrl} alt={profile.displayName} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-white text-2xl font-bold">
                      {profile.displayName.split(" ").map(w => w[0]).join("").slice(0, 2)}
                    </div>
                  )}
                </div>
              )}
              <div className="pb-1 flex-1">
                <div className="flex items-center flex-wrap gap-2">
                  <h2 className="text-xl font-bold">{profile.displayName}</h2>
                  {nametagDef && (
                    <span className="inline-flex items-center gap-1 bg-gradient-to-r from-primary/20 to-accent/20 border border-primary/20 text-xs font-bold px-2 py-0.5 rounded-full">
                      {nametagDef.emoji} {nametagDef.name}
                    </span>
                  )}
                </div>
                {profile.level && (
                  <span className="mt-1 inline-flex items-center gap-1 bg-primary/10 text-primary text-xs font-bold px-2 py-0.5 rounded-full">
                    <GraduationCap className="w-3 h-3" /> {profile.level}
                  </span>
                )}
              </div>
            </div>

            {/* XP bar */}
            <XpBar level={levelInfo.level} progress={levelInfo.progress} xpInLevel={levelInfo.xpInLevel} xpNeeded={levelInfo.xpNeeded} />

            {/* Action buttons */}
            {!isMe && (
              <div className="flex gap-2 mt-4">
                {!fs && (
                  <Button size="sm" onClick={handleAddFriend} disabled={sendReqMut.isPending} className="rounded-xl gap-1.5">
                    <UserPlus className="w-3.5 h-3.5" /> Add Friend
                  </Button>
                )}
                {isIncoming && (
                  <>
                    <Button size="sm" onClick={handleAccept} className="rounded-xl gap-1.5">
                      <UserCheck className="w-3.5 h-3.5" /> Accept
                    </Button>
                    <Button size="sm" variant="outline" onClick={handleRemove} className="rounded-xl">Decline</Button>
                  </>
                )}
                {isPending && !isIncoming && (
                  <Button size="sm" variant="outline" disabled className="rounded-xl">Pending…</Button>
                )}
                {isFriend && (
                  <>
                    <Button size="sm" onClick={() => setLocation("/friends")} className="rounded-xl gap-1.5">
                      <MessageCircle className="w-3.5 h-3.5" /> Chat
                    </Button>
                    <Button size="sm" variant="outline" onClick={handleRemove} className="rounded-xl text-destructive hover:bg-destructive hover:text-white border-destructive/30">Remove</Button>
                  </>
                )}
              </div>
            )}
          </div>
        </motion.div>

        {/* Stats */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.06 }}
          className="grid grid-cols-3 gap-3">
          {[
            { label: "Memory", icon: Brain, score: profile.scores.memory, color: "text-primary", bg: "bg-primary/10" },
            { label: "Bubble", icon: Leaf, score: profile.scores.bubble, color: "text-sky-500", bg: "bg-sky-500/10" },
            { label: "Quiz", icon: Sparkles, score: profile.scores.quiz, color: "text-amber-500", bg: "bg-amber-500/10" },
          ].map(s => (
            <div key={s.label} className="bg-card border border-border/60 rounded-2xl p-4">
              <div className={cn("w-8 h-8 rounded-xl mb-2 flex items-center justify-center", s.bg)}>
                <s.icon className={cn("w-4 h-4", s.color)} />
              </div>
              <p className="text-xs text-muted-foreground">{s.label}</p>
              <p className="font-extrabold text-lg">{s.score != null ? s.score.toLocaleString() : "—"}</p>
            </div>
          ))}
        </motion.div>

        {/* Achievements */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="bg-card border border-border/60 rounded-2xl p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Medal className="w-5 h-5 text-yellow-500" />
              <h3 className="font-bold">Achievements</h3>
            </div>
            <div className="flex items-center gap-1.5 text-amber-500">
              <Star className="w-3.5 h-3.5 fill-amber-500" />
              <span className="font-bold text-sm">{profile.achievements.totalPoints.toLocaleString()} pts</span>
            </div>
          </div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-muted-foreground">{profile.achievements.earned} / {profile.achievements.total} unlocked</span>
          </div>
          <div className="h-1.5 bg-yellow-500/20 rounded-full overflow-hidden mb-4">
            <div className="h-full bg-yellow-500 rounded-full" style={{ width: `${Math.round((profile.achievements.earned / profile.achievements.total) * 100)}%` }} />
          </div>
          <div className="grid grid-cols-2 gap-2">
            {earnedAchievements.slice(0, 8).map(a => (
              <div key={a.key} className="flex items-center gap-2 bg-yellow-500/5 border border-yellow-500/10 rounded-xl px-3 py-2">
                <span className="text-lg">{a.icon}</span>
                <div className="min-w-0">
                  <p className="text-xs font-bold truncate">{a.title}</p>
                  <p className="text-[10px] text-muted-foreground">+{a.points} pts</p>
                </div>
              </div>
            ))}
          </div>
          {earnedAchievements.length > 8 && (
            <p className="text-xs text-muted-foreground text-center mt-2">+{earnedAchievements.length - 8} more</p>
          )}
          {earnedAchievements.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-4">No achievements yet</p>
          )}
        </motion.div>
      </div>
    </Layout>
  );
}

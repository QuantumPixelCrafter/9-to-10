import { useState, useRef } from "react";
import { useAuth } from "@workspace/replit-auth-web";
import { useGetLeaderboard, useGetAchievements, useUploadProfilePicture, useUpdateName } from "@workspace/api-client-react";
import { Layout } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { LogOut, Trophy, Brain, Leaf, Sparkles, Star, User, Mail, GraduationCap, CheckCircle2, Medal, ShoppingBag, Camera, Pencil, X, Check, Zap } from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { getBgStyle, getFrameGradient, getItemDef } from "@/lib/shop-data";

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
  { name: "Primary",    color: "text-green-600 dark:text-green-400",  bg: "bg-green-500/10",  selected: "bg-green-500 text-white shadow-green-500/25",   levels: LEVELS.filter(l => l.group === "Primary") },
  { name: "Secondary",  color: "text-blue-600 dark:text-blue-400",    bg: "bg-blue-500/10",   selected: "bg-blue-500 text-white shadow-blue-500/25",     levels: LEVELS.filter(l => l.group === "Secondary") },
  { name: "University", color: "text-purple-600 dark:text-purple-400", bg: "bg-purple-500/10", selected: "bg-purple-500 text-white shadow-purple-500/25", levels: LEVELS.filter(l => l.group === "University") },
];

function resizeImage(file: File, maxPx: number): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const size = Math.min(img.width, img.height, maxPx);
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext("2d")!;
        const sx = (img.width - Math.min(img.width, img.height)) / 2;
        const sy = (img.height - Math.min(img.width, img.height)) / 2;
        const sSize = Math.min(img.width, img.height);
        ctx.drawImage(img, sx, sy, sSize, sSize, 0, 0, size, size);
        resolve(canvas.toDataURL("image/jpeg", 0.85));
      };
      img.onerror = reject;
      img.src = e.target!.result as string;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export default function ProfilePage() {
  const { user, logout, updateLevel } = useAuth();
  const { data: lb } = useGetLeaderboard();
  const { data: achData } = useGetAchievements();
  const uploadPicMut = useUploadProfilePicture();
  const updateNameMut = useUpdateName();
  const [savingLevel, setSavingLevel] = useState(false);
  const [uploadingPic, setUploadingPic] = useState(false);
  const [editingName, setEditingName] = useState(false);
  const [nameFirst, setNameFirst] = useState("");
  const [nameLast, setNameLast] = useState("");
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const totalPoints = achData?.totalPoints ?? 0;
  const earnedCount = achData?.achievements.filter(a => a.earned).length ?? 0;
  const totalCount = achData?.achievements.length ?? 0;

  const displayName = [user?.firstName, user?.lastName].filter(Boolean).join(" ") || "Anonymous";
  const initials = displayName.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2) || "?";

  const bgStyle = getBgStyle(user?.equippedBackground);
  const frameGrad = getFrameGradient(user?.equippedFrame);
  const nametagDef = getItemDef(user?.equippedNametag);

  const myMemoryBest = lb?.memoryMatch?.filter(e => e.userId === user?.id).sort((a, b) => b.score - a.score)[0];
  const myBubbleBest = lb?.bubblePop?.filter(e => e.userId === user?.id).sort((a, b) => b.score - a.score)[0];
  const myQuizBest = lb?.quiz?.filter(e => e.userId === user?.id).sort((a, b) => b.score - a.score)[0];

  const memoryRank = myMemoryBest ? (lb?.memoryMatch?.findIndex(e => e.userId === user?.id) ?? -1) + 1 : null;
  const bubbleRank = myBubbleBest ? (lb?.bubblePop?.findIndex(e => e.userId === user?.id) ?? -1) + 1 : null;
  const quizRank   = myQuizBest   ? (lb?.quiz?.findIndex(e => e.userId === user?.id) ?? -1) + 1   : null;

  const stats = [
    { label: "Memory Match", icon: Brain,    best: myMemoryBest?.score, rank: memoryRank, bg: "bg-primary/10",  text: "text-primary" },
    { label: "Bubble Pop",   icon: Leaf,     best: myBubbleBest?.score, rank: bubbleRank, bg: "bg-sky-500/10",  text: "text-sky-500" },
    { label: "Quiz",         icon: Sparkles, best: myQuizBest?.score,   rank: quizRank,   bg: "bg-amber-500/10",text: "text-amber-500" },
  ];

  const handleLevelSelect = async (code: string) => {
    if (savingLevel) return;
    const newLevel = user?.level === code ? null : code;
    setSavingLevel(true);
    try {
      await updateLevel(newLevel);
      toast({ title: newLevel ? `Level set to ${newLevel}` : "Level cleared" });
    } catch {
      toast({ title: "Failed to update level", variant: "destructive" });
    } finally {
      setSavingLevel(false);
    }
  };

  const handleStartEditName = () => {
    setNameFirst(user?.firstName ?? "");
    setNameLast(user?.lastName ?? "");
    setEditingName(true);
  };

  const handleSaveName = async () => {
    const first = nameFirst.trim();
    if (!first) {
      toast({ title: "First name is required", variant: "destructive" });
      return;
    }
    try {
      await updateNameMut.mutateAsync({ firstName: first, lastName: nameLast.trim() || undefined });
      toast({ title: "Name updated!" });
      setEditingName(false);
      window.location.reload();
    } catch {
      toast({ title: "Failed to update name", variant: "destructive" });
    }
  };

  const handlePicChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast({ title: "Please select an image file", variant: "destructive" });
      return;
    }
    setUploadingPic(true);
    try {
      const dataUrl = await resizeImage(file, 512);
      await uploadPicMut.mutateAsync(dataUrl);
      toast({ title: "Profile picture updated!" });
      window.location.reload();
    } catch {
      toast({ title: "Failed to upload picture", variant: "destructive" });
    } finally {
      setUploadingPic(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  return (
    <Layout title="My Profile">
      <div className="max-w-2xl mx-auto space-y-6 py-4">

        {/* Avatar Card */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          className="bg-card rounded-3xl border border-border/60 shadow-sm overflow-hidden">
          {/* Equipped background banner */}
          <div className="h-28 relative" style={{ background: bgStyle }}>
            {user?.equippedBackground && (
              <span className="absolute bottom-2 right-3 text-[10px] text-white/60 font-medium">
                {getItemDef(user.equippedBackground)?.name} background
              </span>
            )}
          </div>

          {/* Avatar — overlaps banner */}
          <div className="px-6 -mt-10 mb-3 flex items-end gap-4">
            <div className="relative shrink-0">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handlePicChange}
              />
              {frameGrad ? (
                <div className="rounded-2xl p-[3px] shadow-xl" style={{ background: frameGrad }}>
                  <div className="w-20 h-20 rounded-[14px] overflow-hidden bg-card">
                    {user?.profileImageUrl ? (
                      <img src={user.profileImageUrl} alt={displayName} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white text-2xl font-bold">
                        {initials}
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="w-20 h-20 rounded-2xl border-4 border-card shadow-xl overflow-hidden bg-gradient-to-br from-primary to-accent">
                  {user?.profileImageUrl ? (
                    <img src={user.profileImageUrl} alt={displayName} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-white text-2xl font-bold">
                      {initials}
                    </div>
                  )}
                </div>
              )}
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadingPic}
                className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-lg hover:scale-105 transition-transform"
                title="Change profile picture"
              >
                {uploadingPic ? (
                  <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <Camera className="w-3.5 h-3.5" />
                )}
              </button>
            </div>
          </div>

          {/* Name + details — always below the banner */}
          <div className="px-6 pb-6">
            <div className="mb-5">
              {editingName ? (
                <div className="space-y-2">
                  <div className="flex gap-2">
                    <input
                      autoFocus
                      value={nameFirst}
                      onChange={e => setNameFirst(e.target.value)}
                      placeholder="First name"
                      className="flex-1 min-w-0 rounded-xl border border-border bg-background px-3 py-1.5 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-primary"
                      onKeyDown={e => { if (e.key === "Enter") handleSaveName(); if (e.key === "Escape") setEditingName(false); }}
                    />
                    <input
                      value={nameLast}
                      onChange={e => setNameLast(e.target.value)}
                      placeholder="Last name"
                      className="flex-1 min-w-0 rounded-xl border border-border bg-background px-3 py-1.5 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-primary"
                      onKeyDown={e => { if (e.key === "Enter") handleSaveName(); if (e.key === "Escape") setEditingName(false); }}
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" className="rounded-xl gap-1.5 h-7 px-3 text-xs" onClick={handleSaveName} disabled={updateNameMut.isPending}>
                      <Check className="w-3 h-3" /> Save
                    </Button>
                    <Button size="sm" variant="outline" className="rounded-xl gap-1.5 h-7 px-3 text-xs" onClick={() => setEditingName(false)}>
                      <X className="w-3 h-3" /> Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex items-center flex-wrap gap-2">
                    <h2 className="text-2xl font-bold leading-tight">{displayName}</h2>
                    <button
                      onClick={handleStartEditName}
                      className="w-6 h-6 rounded-lg bg-muted hover:bg-muted/80 flex items-center justify-center transition-colors"
                      title="Edit name"
                    >
                      <Pencil className="w-3.5 h-3.5 text-muted-foreground" />
                    </button>
                    {nametagDef && (
                      <span className="inline-flex items-center gap-1 bg-gradient-to-r from-primary/20 to-accent/20 border border-primary/20 text-xs font-bold px-2 py-0.5 rounded-full">
                        {nametagDef.emoji} {nametagDef.name}
                      </span>
                    )}
                  </div>
                  {user?.email && (
                    <p className="text-muted-foreground text-sm flex items-center gap-1.5 mt-1">
                      <Mail className="w-3.5 h-3.5" /> {user.email}
                    </p>
                  )}
                  {user?.level && (
                    <span className="mt-2 inline-flex items-center gap-1.5 bg-primary/10 text-primary text-xs font-bold px-2.5 py-1 rounded-full">
                      <GraduationCap className="w-3 h-3" />
                      {user.level} — {LEVELS.find(l => l.code === user.level)?.group}
                    </span>
                  )}
                </>
              )}
            </div>

            <div className="flex gap-2">
              <Button onClick={() => setLocation("/shop")} variant="outline" className="rounded-xl gap-2 flex-1 border-border/60">
                <ShoppingBag className="w-4 h-4" /> Shop
              </Button>
              <Button onClick={logout} variant="outline" className="rounded-xl gap-2 flex-1 border-destructive/30 text-destructive hover:bg-destructive/5 hover:text-destructive">
                <LogOut className="w-4 h-4" /> Sign Out
              </Button>
            </div>
          </div>
        </motion.div>

        {/* XP / Game Level */}
        {(() => {
          const LEVEL_THRESHOLDS = [0,100,250,500,900,1400,2100,3000,4200,6000,8500,12000,16000,21000,27000,34000,42000,51000,61000,75000];
          const xp = (user as any)?.xp ?? 0;
          const gameLevel = (user as any)?.gameLevel ?? 1;
          const currentThresh = LEVEL_THRESHOLDS[gameLevel - 1] ?? 0;
          const nextThresh = LEVEL_THRESHOLDS[gameLevel] ?? null;
          const xpInLevel = xp - currentThresh;
          const xpNeeded = nextThresh !== null ? nextThresh - currentThresh : 0;
          const progress = nextThresh !== null ? Math.min(100, Math.round((xpInLevel / xpNeeded) * 100)) : 100;
          return (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.04 }}
              className="bg-gradient-to-r from-violet-500/10 to-fuchsia-500/10 border border-violet-500/20 rounded-2xl p-5">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-9 h-9 rounded-xl bg-violet-500/20 flex items-center justify-center">
                    <Zap className="w-5 h-5 text-violet-500" />
                  </div>
                  <div>
                    <p className="font-bold text-sm">Game Level</p>
                    <p className="text-xs text-muted-foreground">{xp.toLocaleString()} XP total</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-3xl font-black text-violet-500">{gameLevel}</p>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Level</p>
                </div>
              </div>
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">{xpInLevel.toLocaleString()} XP</span>
                  {nextThresh !== null
                    ? <span className="text-muted-foreground">{xpNeeded.toLocaleString()} XP to Lv.{gameLevel + 1}</span>
                    : <span className="text-violet-500 font-bold">MAX LEVEL</span>}
                </div>
                <div className="h-2.5 bg-violet-500/15 rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-violet-500 to-fuchsia-500 rounded-full transition-all duration-700" style={{ width: `${progress}%` }} />
                </div>
              </div>
            </motion.div>
          );
        })()}

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
                      <button key={lvl.code} onClick={() => handleLevelSelect(lvl.code)} disabled={savingLevel}
                        className={cn(
                          "relative py-2.5 rounded-xl text-sm font-bold transition-all duration-200 active:scale-95",
                          isSelected ? `${group.selected} shadow-lg` : `${group.bg} ${group.color} hover:opacity-80`
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
            <p className="text-xs mt-4 bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 p-3 rounded-xl border border-amber-200 dark:border-amber-500/20">
              Set your level so your quiz scores appear on the right leaderboard and the AI generates age-appropriate questions.
            </p>
          )}
        </motion.div>

        {/* Achievements + Shop quick links */}
        <div className="grid grid-cols-2 gap-3">
          <motion.button initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
            onClick={() => setLocation("/achievements")}
            className="text-left bg-gradient-to-r from-yellow-500/10 to-amber-500/10 border border-yellow-500/20 rounded-2xl p-4 hover:from-yellow-500/15 hover:to-amber-500/15 transition-all group"
          >
            <div className="flex items-center gap-2 mb-2">
              <Medal className="w-5 h-5 text-yellow-500" />
              <span className="font-bold text-sm">Achievements</span>
            </div>
            <p className="text-2xl font-black text-yellow-500">{totalPoints.toLocaleString()}<span className="text-xs font-medium text-muted-foreground ml-1">pts</span></p>
            <p className="text-[10px] text-muted-foreground mt-0.5">{earnedCount}/{totalCount} unlocked</p>
            {totalCount > 0 && (
              <div className="mt-2 h-1.5 bg-yellow-500/20 rounded-full overflow-hidden">
                <div className="h-full bg-yellow-500 rounded-full" style={{ width: `${Math.round((earnedCount/totalCount)*100)}%` }} />
              </div>
            )}
          </motion.button>

          <motion.button initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.12 }}
            onClick={() => setLocation("/shop")}
            className="text-left bg-gradient-to-r from-rose-500/10 to-pink-500/10 border border-rose-500/20 rounded-2xl p-4 hover:from-rose-500/15 hover:to-pink-500/15 transition-all group"
          >
            <div className="flex items-center gap-2 mb-2">
              <ShoppingBag className="w-5 h-5 text-rose-500" />
              <span className="font-bold text-sm">Shop</span>
            </div>
            <div className="space-y-1">
              {user?.equippedBackground || user?.equippedFrame || user?.equippedNametag ? (
                <>
                  <p className="text-xs text-muted-foreground">Equipped:</p>
                  {user.equippedBackground && <p className="text-[11px] font-medium">🖼️ {getItemDef(user.equippedBackground)?.name}</p>}
                  {user.equippedFrame && <p className="text-[11px] font-medium">⭕ {getItemDef(user.equippedFrame)?.name} frame</p>}
                  {user.equippedNametag && <p className="text-[11px] font-medium">{getItemDef(user.equippedNametag)?.emoji} {getItemDef(user.equippedNametag)?.name} tag</p>}
                </>
              ) : (
                <p className="text-xs text-muted-foreground">Buy backgrounds, frames & nametags</p>
              )}
            </div>
          </motion.button>
        </div>

        {/* Stats */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.14 }}>
          <h3 className="font-bold text-lg mb-3 px-1">My Best Scores</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {stats.map((s, i) => (
              <motion.div key={s.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.18 + i * 0.06 }}
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
                        {s.rank === 1 ? "🥇 1st" : s.rank === 2 ? "🥈 2nd" : s.rank === 3 ? "🥉 3rd" : `#${s.rank}`}
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

        <div className="bg-primary/5 rounded-2xl p-5 border border-primary/10 flex gap-3">
          <Star className="w-5 h-5 text-primary shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-sm mb-1">Tip: Earn points, customise your profile!</p>
            <p className="text-sm text-muted-foreground">Complete achievements to earn points, then visit the Shop to buy backgrounds, frames, and nametags for your profile.</p>
          </div>
        </div>
      </div>
    </Layout>
  );
}

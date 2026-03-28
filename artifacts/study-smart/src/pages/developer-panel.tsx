import { useState } from "react";
import { Layout } from "@/components/layout";
import { useAuth } from "@workspace/replit-auth-web";
import { useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { customFetch } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import {
  BadgeCheck, Coins, Gift, Search, Users, ShieldPlus, GraduationCap,
  Check, X, Clock, CheckCircle2, XCircle, UserRound, Zap, MessageSquare, ChevronDown,
} from "lucide-react";
import { getCountry, getGradeName } from "@/lib/countries-grades";
import { cn } from "@/lib/utils";

interface DevUser {
  id: string;
  username: string | null;
  firstName: string | null;
  lastName: string | null;
  email: string | null;
  xp: number;
  bonusPoints: number;
  isDeveloper: boolean;
  profileImageUrl: string | null;
}

interface GradeChangeRequest {
  id: string;
  userId: string;
  username: string | null;
  firstName: string | null;
  lastName: string | null;
  profileImageUrl: string | null;
  country: string;
  currentGradeIndex: number;
  requestedGradeIndex: number;
  reason: string;
  status: "pending" | "approved" | "declined";
  createdAt: string;
}

type ActiveTab = "gift-all" | "gift-user" | "promote" | "grade-changes";
type GiftType = "points" | "powerup" | "free_messages";

const POWERUP_OPTIONS = [
  { key: "streak_freeze",    name: "Streak Freeze",        emoji: "🧊" },
  { key: "double_points",    name: "Double Points Boost",  emoji: "⚡" },
  { key: "hint_token",       name: "Hint Token",           emoji: "💡" },
  { key: "retry_pass",       name: "Retry Pass",           emoji: "🔄" },
  { key: "random_quiz_bonus",name: "Random Quiz Bonus",    emoji: "🎲" },
];

const POWERUP_EMOJIS: Record<string, string> = {
  "Streak Freeze": "🧊",
  "Double Points Boost": "⚡",
  "Hint Token": "💡",
  "Retry Pass": "🔄",
};

function fuzzyMatch(text: string, query: string): boolean {
  if (!query.trim()) return false;
  const t = text.toLowerCase();
  const q = query.toLowerCase();
  let qi = 0;
  for (let i = 0; i < t.length && qi < q.length; i++) {
    if (t[i] === q[qi]) qi++;
  }
  return qi === q.length;
}

function getDisplayName(u: { firstName: string | null; lastName: string | null; username: string | null; email?: string | null }) {
  return [u.firstName, u.lastName].filter(Boolean).join(" ") || u.username || u.email || "Unknown";
}

export default function DeveloperPanel() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState<ActiveTab>("gift-all");

  const [giftName, setGiftName] = useState("");
  const [points, setPoints] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);

  const [search, setSearch] = useState("");
  const [selectedUser, setSelectedUser] = useState<DevUser | null>(null);

  const [giftUserSearch, setGiftUserSearch] = useState("");
  const [giftUserSelected, setGiftUserSelected] = useState<DevUser | null>(null);
  const [giftType, setGiftType] = useState<GiftType>("points");
  const [giftPoints, setGiftPoints] = useState("");
  const [giftPowerupKey, setGiftPowerupKey] = useState("streak_freeze");
  const [giftPowerupQty, setGiftPowerupQty] = useState("1");
  const [giftFreeMessages, setGiftFreeMessages] = useState("");

  if (!user?.isDeveloper) {
    setLocation("/");
    return null;
  }

  const { data, isLoading } = useQuery({
    queryKey: ["developer-users"],
    queryFn: () => customFetch<{ users: DevUser[] }>("/api/developer/users"),
  });

  const { data: gradeRequestsData, isLoading: gradeLoading } = useQuery({
    queryKey: ["grade-change-requests"],
    queryFn: () => customFetch<{ requests: GradeChangeRequest[] }>("/api/grade-change-requests"),
    enabled: activeTab === "grade-changes",
  });

  const giftAllMutation = useMutation({
    mutationFn: ({ name, pts }: { name: string; pts: number }) =>
      customFetch<{ success: boolean; recipientCount: number }>("/api/developer/gift-all", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ giftName: name, points: pts }),
      }),
    onSuccess: (result) => {
      toast({
        title: "Gift sent!",
        description: `"${giftName}" — ${points} points delivered to ${result.recipientCount} users.`,
      });
      setGiftName("");
      setPoints("");
      queryClient.invalidateQueries({ queryKey: ["developer-users"] });
    },
    onError: (err: Error) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  const giftUserMutation = useMutation({
    mutationFn: (payload: Record<string, unknown>) =>
      customFetch<{ success: boolean; message: string }>("/api/developer/gift-user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      }),
    onSuccess: (result) => {
      toast({ title: "Gift sent!", description: result.message });
      setGiftUserSelected(null);
      setGiftUserSearch("");
      setGiftPoints("");
      setGiftPowerupQty("1");
      setGiftFreeMessages("");
    },
    onError: (err: Error) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  const promoteMutation = useMutation({
    mutationFn: (targetUserId: string) =>
      customFetch("/api/developer/request-promote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetUserId }),
      }),
    onSuccess: () => {
      toast({
        title: "Request sent!",
        description: `A promotion request for ${getDisplayName(selectedUser!)} has been sent to zen horizon for approval.`,
      });
      setSelectedUser(null);
    },
    onError: (err: Error) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  const gradeDecisionMutation = useMutation({
    mutationFn: ({ id, action }: { id: string; action: "approve" | "decline" }) =>
      customFetch(`/api/grade-change-requests/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      }),
    onSuccess: (_data, { action }) => {
      toast({ title: action === "approve" ? "Grade change approved ✅" : "Grade change declined ❌" });
      queryClient.invalidateQueries({ queryKey: ["grade-change-requests"] });
    },
    onError: (err: Error) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  const allSuggestions = ["Streak Freeze", "Double Points Boost", "Hint Token", "Retry Pass"];
  const suggestions = giftName.trim() ? allSuggestions.filter(name => fuzzyMatch(name, giftName)) : [];

  const allUsers = data?.users ?? [];

  const filteredPromote = allUsers.filter((u) => {
    const q = search.toLowerCase();
    return (
      u.username?.toLowerCase().includes(q) ||
      u.firstName?.toLowerCase().includes(q) ||
      u.lastName?.toLowerCase().includes(q) ||
      u.email?.toLowerCase().includes(q)
    );
  });

  const filteredGift = giftUserSearch.trim()
    ? allUsers.filter((u) => {
        const q = giftUserSearch.toLowerCase();
        return (
          u.username?.toLowerCase().includes(q) ||
          u.firstName?.toLowerCase().includes(q) ||
          u.lastName?.toLowerCase().includes(q) ||
          u.email?.toLowerCase().includes(q)
        );
      })
    : allUsers;

  const totalUsers = allUsers.length;
  const allRequests = gradeRequestsData?.requests ?? [];
  const pendingRequests = allRequests.filter(r => r.status === "pending");
  const decidedRequests = allRequests.filter(r => r.status !== "pending");

  function handleGiftAllSubmit(e: React.FormEvent) {
    e.preventDefault();
    const pts = parseInt(points, 10);
    if (!giftName.trim()) {
      toast({ title: "Missing gift name", description: "Please enter a name for this gift.", variant: "destructive" });
      return;
    }
    if (!pts || pts <= 0) {
      toast({ title: "Invalid points", description: "Please enter a positive number.", variant: "destructive" });
      return;
    }
    giftAllMutation.mutate({ name: giftName.trim(), pts });
  }

  function handleGiftUserSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!giftUserSelected) {
      toast({ title: "No user selected", description: "Select a user to gift.", variant: "destructive" });
      return;
    }
    if (giftType === "points") {
      const pts = parseInt(giftPoints, 10);
      if (!pts || pts <= 0) {
        toast({ title: "Invalid points", variant: "destructive" });
        return;
      }
      giftUserMutation.mutate({ targetUserId: giftUserSelected.id, giftType: "points", points: pts });
    } else if (giftType === "powerup") {
      const qty = parseInt(giftPowerupQty, 10);
      if (!qty || qty <= 0) {
        toast({ title: "Invalid quantity", variant: "destructive" });
        return;
      }
      giftUserMutation.mutate({ targetUserId: giftUserSelected.id, giftType: "powerup", powerupKey: giftPowerupKey, powerupQty: qty });
    } else {
      const msgs = parseInt(giftFreeMessages, 10);
      if (!msgs || msgs <= 0) {
        toast({ title: "Invalid quantity", variant: "destructive" });
        return;
      }
      giftUserMutation.mutate({ targetUserId: giftUserSelected.id, giftType: "free_messages", freeMessages: msgs });
    }
  }

  const tabs: { key: ActiveTab; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { key: "gift-all",      label: "Gift All",    icon: Gift },
    { key: "gift-user",     label: "Gift User",   icon: UserRound },
    { key: "promote",       label: "Developer",   icon: ShieldPlus },
    { key: "grade-changes", label: "Grades",      icon: GraduationCap },
  ];

  return (
    <Layout title="Developer Panel">
      <div className="space-y-6 pb-8 max-w-2xl">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-violet-500/10">
            <BadgeCheck className="w-6 h-6 text-violet-500" />
          </div>
          <div>
            <h2 className="text-xl font-bold">Developer Panel</h2>
            <p className="text-sm text-muted-foreground">Manage users and permissions</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1.5 p-1 bg-muted/50 rounded-2xl">
          {tabs.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl text-xs sm:text-sm font-medium transition-all relative ${
                activeTab === key
                  ? "bg-card shadow-sm text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Icon className="w-3.5 h-3.5 shrink-0" />
              <span className="hidden sm:inline">{label}</span>
              {key === "grade-changes" && pendingRequests.length > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white rounded-full text-[10px] font-bold flex items-center justify-center">
                  {pendingRequests.length}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Gift All tab */}
        {activeTab === "gift-all" && (
          <div className="bg-card border border-border/50 rounded-2xl p-6 space-y-5">
            <div className="space-y-1">
              <h3 className="font-semibold">Send a gift to everyone</h3>
              <p className="text-sm text-muted-foreground">
                All <span className="font-medium text-foreground">{totalUsers}</span> users will receive the same amount of points and an inbox notification.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-amber-500/5 border border-amber-500/15 flex items-start gap-3">
              <Coins className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
              <p className="text-xs text-muted-foreground leading-relaxed">
                Each user will see: <span className="font-medium text-foreground italic">"A gift from the development team: [gift name]"</span>
              </p>
            </div>

            <form onSubmit={handleGiftAllSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Gift name</label>
                <div className="relative">
                  <Input
                    placeholder='e.g. "Spring Celebration" or "Weekend Bonus"'
                    value={giftName}
                    onChange={(e) => { setGiftName(e.target.value); setShowSuggestions(true); }}
                    onFocus={() => setShowSuggestions(true)}
                    onBlur={() => setTimeout(() => setShowSuggestions(false), 120)}
                    className="rounded-xl"
                    required
                  />
                  {showSuggestions && suggestions.length > 0 && (
                    <div className="absolute z-10 top-full mt-1 w-full bg-card border border-border rounded-xl shadow-lg overflow-hidden">
                      {suggestions.map(name => (
                        <button
                          key={name}
                          type="button"
                          onMouseDown={(e) => e.preventDefault()}
                          onClick={() => { setGiftName(name); setShowSuggestions(false); }}
                          className="w-full flex items-center gap-2.5 px-3 py-2.5 text-sm hover:bg-muted transition-colors text-left"
                        >
                          <span className="text-base">{POWERUP_EMOJIS[name]}</span>
                          <span className="font-medium">{name}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Points per user</label>
                <Input
                  type="number"
                  placeholder="e.g. 500"
                  min={1}
                  max={100000}
                  value={points}
                  onChange={(e) => setPoints(e.target.value)}
                  className="rounded-xl"
                  required
                />
              </div>

              {giftName.trim() && points && (
                <div className="p-3 rounded-xl bg-muted/60 text-sm text-muted-foreground">
                  Preview: <span className="font-medium text-foreground">"A gift from the development team: {giftName.trim()}"</span>
                  {" "}— <span className="text-amber-600 dark:text-amber-400 font-semibold">+{points} pts</span> to each user
                </div>
              )}

              <Button
                type="submit"
                className="w-full rounded-xl"
                disabled={giftAllMutation.isPending}
              >
                <Gift className="w-4 h-4 mr-2" />
                {giftAllMutation.isPending
                  ? "Sending gift..."
                  : `Gift ${points || "?"} Points to All ${totalUsers} Users`}
              </Button>
            </form>
          </div>
        )}

        {/* Gift User tab */}
        {activeTab === "gift-user" && (
          <div className="space-y-4">
            <div className="bg-card border border-border/50 rounded-2xl p-5 space-y-4">
              <div className="space-y-1">
                <h3 className="font-semibold">Gift a specific user</h3>
                <p className="text-sm text-muted-foreground">
                  Send bonus points, a power-up, or free chat message quota to any user.
                </p>
              </div>

              {/* User search */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Select user</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by name or username…"
                    className="pl-9 rounded-xl"
                    value={giftUserSearch}
                    onChange={(e) => { setGiftUserSearch(e.target.value); setGiftUserSelected(null); }}
                  />
                </div>
                <div className="max-h-48 overflow-y-auto space-y-1 rounded-xl border border-border/50 bg-muted/20 p-1">
                  {isLoading ? (
                    <p className="text-xs text-muted-foreground text-center py-3">Loading users…</p>
                  ) : filteredGift.length === 0 ? (
                    <p className="text-xs text-muted-foreground text-center py-3">No users found</p>
                  ) : (
                    filteredGift.map((u) => (
                      <div
                        key={u.id}
                        onClick={() => setGiftUserSelected(giftUserSelected?.id === u.id ? null : u)}
                        className={`flex items-center gap-2.5 px-3 py-2 rounded-lg cursor-pointer transition-all ${
                          giftUserSelected?.id === u.id
                            ? "bg-primary/10 border border-primary/20"
                            : "hover:bg-muted border border-transparent"
                        }`}
                      >
                        <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white text-[10px] font-bold shrink-0 overflow-hidden">
                          {u.profileImageUrl ? (
                            <img src={u.profileImageUrl} alt="" className="w-full h-full object-cover" />
                          ) : (
                            getDisplayName(u).slice(0, 2).toUpperCase()
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1">
                            <p className="text-xs font-medium truncate">{getDisplayName(u)}</p>
                            {u.isDeveloper && <BadgeCheck className="w-3 h-3 text-blue-500 shrink-0" />}
                          </div>
                          <p className="text-[10px] text-muted-foreground truncate">@{u.username || "—"}</p>
                        </div>
                        {giftUserSelected?.id === u.id && (
                          <div className="w-2 h-2 rounded-full bg-primary shrink-0" />
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Gift type */}
              {giftUserSelected && (
                <form onSubmit={handleGiftUserSubmit} className="space-y-4 pt-2 border-t border-border/40">
                  <div className="flex items-center gap-2 py-1">
                    <div className="w-6 h-6 rounded-md bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white text-[10px] font-bold shrink-0 overflow-hidden">
                      {giftUserSelected.profileImageUrl ? (
                        <img src={giftUserSelected.profileImageUrl} alt="" className="w-full h-full object-cover" />
                      ) : (
                        getDisplayName(giftUserSelected).slice(0, 2).toUpperCase()
                      )}
                    </div>
                    <p className="text-sm font-medium">Gifting to <span className="text-primary">{getDisplayName(giftUserSelected)}</span></p>
                  </div>

                  {/* Type selector */}
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium">Gift type</label>
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { key: "points" as GiftType,        label: "Points",        icon: Coins,          color: "text-amber-500",   bg: "bg-amber-500/10 border-amber-500/20" },
                        { key: "powerup" as GiftType,       label: "Power-up",      icon: Zap,            color: "text-violet-500",  bg: "bg-violet-500/10 border-violet-500/20" },
                        { key: "free_messages" as GiftType, label: "Free Messages", icon: MessageSquare,  color: "text-teal-500",    bg: "bg-teal-500/10 border-teal-500/20" },
                      ].map(({ key, label, icon: Icon, color, bg }) => (
                        <button
                          key={key}
                          type="button"
                          onClick={() => setGiftType(key)}
                          className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border transition-all text-xs font-medium ${
                            giftType === key ? bg : "border-border/50 hover:bg-muted"
                          }`}
                        >
                          <Icon className={`w-4 h-4 ${giftType === key ? color : "text-muted-foreground"}`} />
                          <span className={giftType === key ? color : "text-muted-foreground"}>{label}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Points input */}
                  {giftType === "points" && (
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium">Amount (bonus points)</label>
                      <Input
                        type="number"
                        placeholder="e.g. 1000"
                        min={1}
                        max={100000}
                        value={giftPoints}
                        onChange={(e) => setGiftPoints(e.target.value)}
                        className="rounded-xl"
                        required
                      />
                    </div>
                  )}

                  {/* Power-up input */}
                  {giftType === "powerup" && (
                    <div className="space-y-3">
                      <div className="space-y-1.5">
                        <label className="text-sm font-medium">Power-up type</label>
                        <div className="relative">
                          <select
                            value={giftPowerupKey}
                            onChange={(e) => setGiftPowerupKey(e.target.value)}
                            className="w-full appearance-none bg-background border border-input rounded-xl px-3 py-2 text-sm pr-8 focus:outline-none focus:ring-1 focus:ring-ring"
                          >
                            {POWERUP_OPTIONS.map(p => (
                              <option key={p.key} value={p.key}>{p.emoji} {p.name}</option>
                            ))}
                          </select>
                          <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                        </div>
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-sm font-medium">Quantity</label>
                        <Input
                          type="number"
                          placeholder="e.g. 3"
                          min={1}
                          max={99}
                          value={giftPowerupQty}
                          onChange={(e) => setGiftPowerupQty(e.target.value)}
                          className="rounded-xl"
                          required
                        />
                      </div>
                    </div>
                  )}

                  {/* Free messages input */}
                  {giftType === "free_messages" && (
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium">Number of free messages</label>
                      <Input
                        type="number"
                        placeholder="e.g. 50"
                        min={1}
                        max={10000}
                        value={giftFreeMessages}
                        onChange={(e) => setGiftFreeMessages(e.target.value)}
                        className="rounded-xl"
                        required
                      />
                      <p className="text-xs text-muted-foreground">
                        Each free message lets the user send one chat message without spending points.
                      </p>
                    </div>
                  )}

                  {/* Preview */}
                  {giftType === "points" && giftPoints && (
                    <div className="p-3 rounded-xl bg-amber-500/5 border border-amber-500/15 text-xs text-muted-foreground">
                      Will gift <span className="font-semibold text-amber-600 dark:text-amber-400">+{parseInt(giftPoints, 10).toLocaleString()} bonus points</span> to {getDisplayName(giftUserSelected)}
                    </div>
                  )}
                  {giftType === "powerup" && giftPowerupQty && (
                    <div className="p-3 rounded-xl bg-violet-500/5 border border-violet-500/15 text-xs text-muted-foreground">
                      Will gift <span className="font-semibold text-violet-600 dark:text-violet-400">{giftPowerupQty}x {POWERUP_OPTIONS.find(p => p.key === giftPowerupKey)?.emoji} {POWERUP_OPTIONS.find(p => p.key === giftPowerupKey)?.name}</span> to {getDisplayName(giftUserSelected)}
                    </div>
                  )}
                  {giftType === "free_messages" && giftFreeMessages && (
                    <div className="p-3 rounded-xl bg-teal-500/5 border border-teal-500/15 text-xs text-muted-foreground">
                      Will grant <span className="font-semibold text-teal-600 dark:text-teal-400">{parseInt(giftFreeMessages, 10).toLocaleString()} free messages</span> to {getDisplayName(giftUserSelected)}
                    </div>
                  )}

                  <Button
                    type="submit"
                    className="w-full rounded-xl"
                    disabled={giftUserMutation.isPending}
                  >
                    <Gift className="w-4 h-4 mr-2" />
                    {giftUserMutation.isPending ? "Sending…" : "Send Gift"}
                  </Button>
                </form>
              )}
            </div>
          </div>
        )}

        {/* Make Developer tab */}
        {activeTab === "promote" && (
          <div className="bg-card border border-border/50 rounded-2xl p-5 space-y-4">
            <div className="space-y-1">
              <h3 className="font-semibold">Promote a user to developer</h3>
              <p className="text-sm text-muted-foreground">
                A request will be sent to <span className="font-medium">zen horizon</span> for approval.
              </p>
            </div>

            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search users..."
                className="pl-9 rounded-xl"
                value={search}
                onChange={(e) => { setSearch(e.target.value); setSelectedUser(null); }}
              />
            </div>

            <div className="space-y-2 max-h-72 overflow-y-auto">
              {isLoading ? (
                <p className="text-sm text-muted-foreground text-center py-4">Loading users...</p>
              ) : filteredPromote.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">No users found</p>
              ) : (
                filteredPromote.map((u) => (
                  <div
                    key={u.id}
                    onClick={() => !u.isDeveloper && setSelectedUser(selectedUser?.id === u.id ? null : u)}
                    className={`flex items-center gap-3 p-3 rounded-xl transition-all border ${
                      u.isDeveloper
                        ? "opacity-50 cursor-not-allowed border-transparent"
                        : selectedUser?.id === u.id
                        ? "bg-violet-500/10 border-violet-500/20 cursor-pointer"
                        : "hover:bg-muted border-transparent cursor-pointer"
                    }`}
                  >
                    <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white text-xs font-bold shrink-0 overflow-hidden">
                      {u.profileImageUrl ? (
                        <img src={u.profileImageUrl} alt="" className="w-full h-full object-cover" />
                      ) : (
                        getDisplayName(u).slice(0, 2).toUpperCase()
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <p className="text-sm font-medium truncate">{getDisplayName(u)}</p>
                        {u.isDeveloper && <BadgeCheck className="w-3.5 h-3.5 text-blue-500 shrink-0" />}
                      </div>
                      <p className="text-xs text-muted-foreground truncate">
                        @{u.username || "no username"}
                        {u.isDeveloper && " · Already a developer"}
                      </p>
                    </div>
                    {selectedUser?.id === u.id && (
                      <div className="w-2 h-2 rounded-full bg-violet-500 shrink-0" />
                    )}
                  </div>
                ))
              )}
            </div>

            {selectedUser && (
              <div className="space-y-3 pt-1 border-t border-border/40">
                <p className="text-sm text-muted-foreground pt-2">
                  Request to promote <span className="font-medium text-foreground">{getDisplayName(selectedUser)}</span>?
                </p>
                <Button
                  className="w-full rounded-xl bg-violet-600 hover:bg-violet-700 text-white"
                  onClick={() => promoteMutation.mutate(selectedUser.id)}
                  disabled={promoteMutation.isPending}
                >
                  <ShieldPlus className="w-4 h-4 mr-2" />
                  {promoteMutation.isPending ? "Sending request..." : "Send Promotion Request"}
                </Button>
              </div>
            )}
          </div>
        )}

        {/* Grade Changes tab */}
        {activeTab === "grade-changes" && (
          <div className="space-y-4">
            <div className="bg-card border border-border/50 rounded-2xl p-5">
              <h3 className="font-semibold mb-1">Grade Change Requests</h3>
              <p className="text-sm text-muted-foreground">Review and approve or decline student grade change requests.</p>
            </div>

            {gradeLoading ? (
              <div className="text-center py-10 text-muted-foreground text-sm">Loading requests…</div>
            ) : allRequests.length === 0 ? (
              <div className="bg-card border border-border/50 rounded-2xl p-10 text-center">
                <GraduationCap className="w-10 h-10 text-muted-foreground/40 mx-auto mb-3" />
                <p className="text-sm text-muted-foreground">No grade change requests yet.</p>
              </div>
            ) : (
              <>
                {pendingRequests.length > 0 && (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 px-1">
                      <Clock className="w-4 h-4 text-amber-500" />
                      <span className="text-sm font-semibold">Pending ({pendingRequests.length})</span>
                    </div>
                    {pendingRequests.map(req => {
                      const c = getCountry(req.country);
                      const from = getGradeName(req.country, req.currentGradeIndex);
                      const to = getGradeName(req.country, req.requestedGradeIndex);
                      return (
                        <div key={req.id} className="bg-card border border-amber-500/20 rounded-2xl p-4 space-y-3">
                          <div className="flex items-start gap-3">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white text-xs font-bold shrink-0 overflow-hidden">
                              {req.profileImageUrl ? (
                                <img src={req.profileImageUrl} alt="" className="w-full h-full object-cover" />
                              ) : (
                                getDisplayName(req).slice(0, 2).toUpperCase()
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-sm">{getDisplayName(req)}</p>
                              <p className="text-xs text-muted-foreground">@{req.username || "—"}</p>
                              <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                                <span className="text-xs bg-muted px-2 py-0.5 rounded-full">{c?.flag} {c?.name ?? req.country}</span>
                                <span className="text-xs text-muted-foreground">{from}</span>
                                <span className="text-xs text-muted-foreground">→</span>
                                <span className="text-xs font-semibold text-primary">{to}</span>
                              </div>
                            </div>
                            <span className="text-[10px] text-muted-foreground shrink-0 mt-0.5">
                              {new Date(req.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                          {req.reason && (
                            <div className="bg-muted/40 rounded-xl px-3 py-2 text-sm text-muted-foreground italic">
                              "{req.reason}"
                            </div>
                          )}
                          <div className="flex gap-2 pt-1">
                            <Button
                              size="sm"
                              className="flex-1 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white"
                              disabled={gradeDecisionMutation.isPending}
                              onClick={() => gradeDecisionMutation.mutate({ id: req.id, action: "approve" })}
                            >
                              <Check className="w-3.5 h-3.5 mr-1.5" /> Approve
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="flex-1 rounded-xl border-red-500/30 text-red-500 hover:bg-red-500/5"
                              disabled={gradeDecisionMutation.isPending}
                              onClick={() => gradeDecisionMutation.mutate({ id: req.id, action: "decline" })}
                            >
                              <X className="w-3.5 h-3.5 mr-1.5" /> Decline
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {decidedRequests.length > 0 && (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 px-1">
                      <span className="text-sm font-semibold text-muted-foreground">History ({decidedRequests.length})</span>
                    </div>
                    {decidedRequests.map(req => {
                      const c = getCountry(req.country);
                      const from = getGradeName(req.country, req.currentGradeIndex);
                      const to = getGradeName(req.country, req.requestedGradeIndex);
                      const approved = req.status === "approved";
                      return (
                        <div key={req.id} className={cn("bg-card border rounded-2xl p-4", approved ? "border-emerald-500/20" : "border-border/50 opacity-70")}>
                          <div className="flex items-center gap-3">
                            {approved ? <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" /> : <XCircle className="w-4 h-4 text-red-400 shrink-0" />}
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium">{getDisplayName(req)}</p>
                              <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                                <span className="text-xs text-muted-foreground">{c?.flag} {c?.name ?? req.country}</span>
                                <span className="text-xs text-muted-foreground">{from} → {to}</span>
                              </div>
                            </div>
                            <span className={cn("text-[10px] font-semibold uppercase tracking-wide", approved ? "text-emerald-500" : "text-red-400")}>
                              {req.status}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>
    </Layout>
  );
}

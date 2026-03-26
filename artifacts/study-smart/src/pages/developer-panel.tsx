import { useState } from "react";
import { Layout } from "@/components/layout";
import { useAuth } from "@workspace/replit-auth-web";
import { useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { customFetch } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { BadgeCheck, Coins, Gift, Search, Users, ShieldPlus } from "lucide-react";

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

type ActiveTab = "gift" | "promote";

export default function DeveloperPanel() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState<ActiveTab>("gift");

  // Gift all state
  const [giftName, setGiftName] = useState("");
  const [points, setPoints] = useState("");

  // Promote state
  const [search, setSearch] = useState("");
  const [selectedUser, setSelectedUser] = useState<DevUser | null>(null);

  if (!user?.isDeveloper) {
    setLocation("/");
    return null;
  }

  const { data, isLoading } = useQuery({
    queryKey: ["developer-users"],
    queryFn: () => customFetch<{ users: DevUser[] }>("/api/developer/users"),
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

  const filtered = (data?.users ?? []).filter((u) => {
    const q = search.toLowerCase();
    return (
      u.username?.toLowerCase().includes(q) ||
      u.firstName?.toLowerCase().includes(q) ||
      u.lastName?.toLowerCase().includes(q) ||
      u.email?.toLowerCase().includes(q)
    );
  });

  function getDisplayName(u: DevUser) {
    return [u.firstName, u.lastName].filter(Boolean).join(" ") || u.username || u.email || "Unknown";
  }

  function handleGiftSubmit(e: React.FormEvent) {
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

  const totalUsers = data?.users.length ?? 0;

  return (
    <Layout title="Developer Panel">
      <div className="space-y-6 pb-8 max-w-2xl">
        {/* Header */}
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
        <div className="flex gap-2 p-1 bg-muted/50 rounded-2xl">
          <button
            onClick={() => setActiveTab("gift")}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
              activeTab === "gift"
                ? "bg-card shadow-sm text-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Gift className="w-4 h-4" />
            Gift All Users
          </button>
          <button
            onClick={() => setActiveTab("promote")}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
              activeTab === "promote"
                ? "bg-card shadow-sm text-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <ShieldPlus className="w-4 h-4" />
            Make Developer
          </button>
        </div>

        {/* Gift All tab */}
        {activeTab === "gift" && (
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

            <form onSubmit={handleGiftSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Gift name</label>
                <Input
                  placeholder='e.g. "Spring Celebration" or "Weekend Bonus"'
                  value={giftName}
                  onChange={(e) => setGiftName(e.target.value)}
                  className="rounded-xl"
                  required
                />
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
              ) : filtered.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">No users found</p>
              ) : (
                filtered.map((u) => (
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
      </div>
    </Layout>
  );
}

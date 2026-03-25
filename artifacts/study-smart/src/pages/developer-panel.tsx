import { useState } from "react";
import { Layout } from "@/components/layout";
import { useAuth } from "@workspace/replit-auth-web";
import { useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { customFetch } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { BadgeCheck, Coins, Search, Users } from "lucide-react";

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

export default function DeveloperPanel() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [search, setSearch] = useState("");
  const [selectedUser, setSelectedUser] = useState<DevUser | null>(null);
  const [points, setPoints] = useState("");
  const [message, setMessage] = useState("");

  if (!user?.isDeveloper) {
    setLocation("/");
    return null;
  }

  const { data, isLoading } = useQuery({
    queryKey: ["developer-users"],
    queryFn: async () => {
      const res = await customFetch("/api/developer/users");
      if (!res.ok) throw new Error("Failed to fetch users");
      return res.json() as Promise<{ users: DevUser[] }>;
    },
  });

  const givePointsMutation = useMutation({
    mutationFn: async ({ recipientId, pts, msg }: { recipientId: string; pts: number; msg: string }) => {
      const res = await customFetch("/api/developer/give-points", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ recipientId, points: pts, message: msg }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error ?? "Failed to give points");
      }
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Points sent!", description: `${points} points sent to ${selectedUser?.username || selectedUser?.firstName || "user"}.` });
      setPoints("");
      setMessage("");
      setSelectedUser(null);
      queryClient.invalidateQueries({ queryKey: ["developer-users"] });
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

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedUser) return;
    const pts = parseInt(points, 10);
    if (!pts || pts <= 0) {
      toast({ title: "Invalid points", description: "Please enter a positive number.", variant: "destructive" });
      return;
    }
    givePointsMutation.mutate({ recipientId: selectedUser.id, pts, msg: message });
  }

  return (
    <Layout title="Developer Panel">
      <div className="space-y-6 pb-8 max-w-4xl">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-violet-500/10">
            <BadgeCheck className="w-6 h-6 text-violet-500" />
          </div>
          <div>
            <h2 className="text-xl font-bold">Developer Panel</h2>
            <p className="text-sm text-muted-foreground">Give points to any user</p>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* User List */}
          <div className="bg-card border border-border/50 rounded-2xl p-5 space-y-4">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-muted-foreground" />
              <h3 className="font-semibold text-sm">Select a User</h3>
            </div>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search users..."
                className="pl-9 rounded-xl"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <div className="space-y-2 max-h-80 overflow-y-auto">
              {isLoading ? (
                <p className="text-sm text-muted-foreground text-center py-4">Loading users...</p>
              ) : filtered.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">No users found</p>
              ) : (
                filtered.map((u) => (
                  <div
                    key={u.id}
                    onClick={() => setSelectedUser(u)}
                    className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all ${
                      selectedUser?.id === u.id
                        ? "bg-violet-500/10 border border-violet-500/20"
                        : "hover:bg-muted border border-transparent"
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
                      <p className="text-xs text-muted-foreground truncate">@{u.username || "no username"} · {u.bonusPoints} pts</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Give Points Form */}
          <div className="bg-card border border-border/50 rounded-2xl p-5 space-y-4">
            <div className="flex items-center gap-2">
              <Coins className="w-4 h-4 text-muted-foreground" />
              <h3 className="font-semibold text-sm">Give Points</h3>
            </div>

            {!selectedUser ? (
              <div className="flex items-center justify-center h-48 text-sm text-muted-foreground">
                Select a user on the left to give them points
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-xl">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white text-xs font-bold overflow-hidden">
                    {selectedUser.profileImageUrl ? (
                      <img src={selectedUser.profileImageUrl} alt="" className="w-full h-full object-cover" />
                    ) : (
                      getDisplayName(selectedUser).slice(0, 2).toUpperCase()
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <p className="font-medium text-sm">{getDisplayName(selectedUser)}</p>
                      {selectedUser.isDeveloper && <BadgeCheck className="w-3.5 h-3.5 text-blue-500" />}
                    </div>
                    <p className="text-xs text-muted-foreground">Current: {selectedUser.bonusPoints} bonus points</p>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-medium">Points to give</label>
                  <Input
                    type="number"
                    placeholder="e.g. 100"
                    min={1}
                    max={10000}
                    value={points}
                    onChange={(e) => setPoints(e.target.value)}
                    className="rounded-xl"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-medium">Message <span className="text-muted-foreground font-normal">(optional)</span></label>
                  <Textarea
                    placeholder="Add a message for the user..."
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    className="rounded-xl resize-none"
                    rows={3}
                  />
                </div>

                <Button
                  type="submit"
                  className="w-full rounded-xl"
                  disabled={givePointsMutation.isPending}
                >
                  {givePointsMutation.isPending ? "Sending..." : `Give ${points || "?"} Points`}
                </Button>
              </form>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}

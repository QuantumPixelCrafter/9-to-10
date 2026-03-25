import { Layout } from "@/components/layout";
import { useAuth } from "@workspace/replit-auth-web";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { customFetch } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { BadgeCheck, Coins, Inbox as InboxIcon, MailOpen, ShieldPlus, ShieldCheck, ShieldX } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { useToast } from "@/hooks/use-toast";

const APPROVER_ID = "5705e7da-bb0b-47e5-8563-9bdd23b24973";

interface InboxMessage {
  id: string;
  type: string;
  points: number | null;
  message: string | null;
  status: string;
  targetUserId: string | null;
  readAt: string | null;
  createdAt: string;
  sender: {
    id: string;
    username: string | null;
    firstName: string | null;
    lastName: string | null;
    profileImageUrl: string | null;
    isDeveloper: boolean;
  } | null;
}

function getSenderName(sender: InboxMessage["sender"]) {
  if (!sender) return "System";
  return [sender.firstName, sender.lastName].filter(Boolean).join(" ") || sender.username || "Unknown";
}

export default function InboxPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const isApprover = user?.id === APPROVER_ID;

  const { data, isLoading } = useQuery({
    queryKey: ["inbox"],
    queryFn: async () => {
      const res = await customFetch("/api/inbox");
      if (!res.ok) throw new Error("Failed to fetch inbox");
      return res.json() as Promise<{ messages: InboxMessage[] }>;
    },
    refetchInterval: 30000,
  });

  const readAllMutation = useMutation({
    mutationFn: async () => {
      const res = await customFetch("/api/inbox/read-all", { method: "PUT" });
      if (!res.ok) throw new Error("Failed to mark as read");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["inbox"] });
      queryClient.invalidateQueries({ queryKey: ["inbox-unread-count"] });
      toast({ title: "All messages marked as read" });
    },
  });

  const readOneMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await customFetch(`/api/inbox/${id}/read`, { method: "PUT" });
      if (!res.ok) throw new Error("Failed to mark as read");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["inbox"] });
      queryClient.invalidateQueries({ queryKey: ["inbox-unread-count"] });
    },
  });

  const approveMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await customFetch(`/api/inbox/${id}/approve`, { method: "PUT" });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error ?? "Failed to approve");
      }
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Approved!", description: "Developer promotion has been granted." });
      queryClient.invalidateQueries({ queryKey: ["inbox"] });
      queryClient.invalidateQueries({ queryKey: ["inbox-unread-count"] });
    },
    onError: (err: Error) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  const rejectMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await customFetch(`/api/inbox/${id}/reject`, { method: "PUT" });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error ?? "Failed to reject");
      }
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Rejected", description: "Developer promotion request has been rejected." });
      queryClient.invalidateQueries({ queryKey: ["inbox"] });
      queryClient.invalidateQueries({ queryKey: ["inbox-unread-count"] });
    },
    onError: (err: Error) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  const messages = data?.messages ?? [];
  const unreadCount = messages.filter((m) => !m.readAt).length;

  return (
    <Layout title="Inbox">
      <div className="space-y-6 pb-8 max-w-2xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-indigo-500/10">
              <InboxIcon className="w-6 h-6 text-indigo-500" />
            </div>
            <div>
              <h2 className="text-xl font-bold">Inbox</h2>
              <p className="text-sm text-muted-foreground">
                {unreadCount > 0 ? `${unreadCount} unread message${unreadCount > 1 ? "s" : ""}` : "All caught up!"}
              </p>
            </div>
          </div>
          {unreadCount > 0 && (
            <Button
              variant="outline"
              size="sm"
              className="rounded-xl gap-2"
              onClick={() => readAllMutation.mutate()}
              disabled={readAllMutation.isPending}
            >
              <MailOpen className="w-4 h-4" />
              Mark all as read
            </Button>
          )}
        </div>

        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-24 bg-muted/40 rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : messages.length === 0 ? (
          <div className="text-center py-20 space-y-3">
            <div className="w-16 h-16 rounded-2xl bg-muted/50 flex items-center justify-center mx-auto">
              <InboxIcon className="w-8 h-8 text-muted-foreground/50" />
            </div>
            <p className="font-medium text-muted-foreground">Your inbox is empty</p>
            <p className="text-sm text-muted-foreground/70">Points and messages will appear here.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`bg-card border rounded-2xl p-5 transition-all ${
                  !msg.readAt ? "border-indigo-500/30 shadow-sm shadow-indigo-500/10" : "border-border/50"
                } ${msg.type === "developer_request" ? "border-violet-500/30 shadow-violet-500/10" : ""}`}
                onClick={() => {
                  if (!msg.readAt && msg.type !== "developer_request") readOneMutation.mutate(msg.id);
                }}
              >
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white text-sm font-bold shrink-0 overflow-hidden">
                    {msg.sender?.profileImageUrl ? (
                      <img src={msg.sender.profileImageUrl} alt="" className="w-full h-full object-cover" />
                    ) : (
                      getSenderName(msg.sender).slice(0, 2).toUpperCase()
                    )}
                  </div>
                  <div className="flex-1 min-w-0 space-y-2">
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <div className="flex items-center gap-1.5">
                        <span className="font-semibold text-sm">{getSenderName(msg.sender)}</span>
                        {msg.sender?.isDeveloper && <BadgeCheck className="w-4 h-4 text-blue-500 shrink-0" />}
                      </div>
                      <div className="flex items-center gap-2">
                        {!msg.readAt && msg.type !== "developer_request" && (
                          <span className="w-2 h-2 rounded-full bg-indigo-500 shrink-0" />
                        )}
                        <span className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(msg.createdAt), { addSuffix: true })}
                        </span>
                      </div>
                    </div>

                    {/* Points message */}
                    {msg.type === "points" && msg.points != null && msg.points > 0 && (
                      <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-500/10 text-amber-600 dark:text-amber-400 rounded-lg text-sm font-semibold">
                        <Coins className="w-4 h-4" />
                        +{msg.points} bonus points
                      </div>
                    )}

                    {/* Developer approved notification */}
                    {msg.type === "developer_approved" && (
                      <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-lg text-sm font-semibold">
                        <BadgeCheck className="w-4 h-4" />
                        Developer access granted
                      </div>
                    )}

                    {/* Developer request (shown to approver) */}
                    {msg.type === "developer_request" && (
                      <div className="space-y-3">
                        <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-violet-500/10 text-violet-600 dark:text-violet-400 rounded-lg text-sm font-semibold">
                          <ShieldPlus className="w-4 h-4" />
                          Developer promotion request
                        </div>
                        {msg.status === "pending" && isApprover && (
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              className="rounded-xl gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white"
                              onClick={() => approveMutation.mutate(msg.id)}
                              disabled={approveMutation.isPending || rejectMutation.isPending}
                            >
                              <ShieldCheck className="w-3.5 h-3.5" />
                              Approve
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="rounded-xl gap-1.5 border-destructive/30 text-destructive hover:bg-destructive/5"
                              onClick={() => rejectMutation.mutate(msg.id)}
                              disabled={approveMutation.isPending || rejectMutation.isPending}
                            >
                              <ShieldX className="w-3.5 h-3.5" />
                              Reject
                            </Button>
                          </div>
                        )}
                        {msg.status === "approved" && (
                          <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 text-sm font-medium">
                            <ShieldCheck className="w-4 h-4" /> Approved
                          </div>
                        )}
                        {msg.status === "rejected" && (
                          <div className="flex items-center gap-1.5 text-destructive text-sm font-medium">
                            <ShieldX className="w-4 h-4" /> Rejected
                          </div>
                        )}
                      </div>
                    )}

                    {msg.message && (
                      <p className="text-sm text-muted-foreground leading-relaxed">{msg.message}</p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}

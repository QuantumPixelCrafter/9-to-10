import { Layout } from "@/components/layout";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { customFetch } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { BadgeCheck, Coins, Inbox as InboxIcon, MailOpen } from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";
import { useToast } from "@/hooks/use-toast";

interface InboxMessage {
  id: string;
  type: string;
  points: number | null;
  message: string | null;
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
  const { toast } = useToast();
  const queryClient = useQueryClient();

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
            <p className="text-sm text-muted-foreground/70">Points and messages from developers will appear here.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`bg-card border rounded-2xl p-5 transition-all ${
                  !msg.readAt ? "border-indigo-500/30 shadow-sm shadow-indigo-500/10" : "border-border/50"
                }`}
                onClick={() => {
                  if (!msg.readAt) readOneMutation.mutate(msg.id);
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
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <div className="flex items-center gap-1.5">
                        <span className="font-semibold text-sm">{getSenderName(msg.sender)}</span>
                        {msg.sender?.isDeveloper && (
                          <BadgeCheck className="w-4 h-4 text-blue-500 shrink-0" />
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        {!msg.readAt && (
                          <span className="w-2 h-2 rounded-full bg-indigo-500 shrink-0" />
                        )}
                        <span className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(msg.createdAt), { addSuffix: true })}
                        </span>
                      </div>
                    </div>

                    {msg.type === "points" && msg.points != null && msg.points > 0 && (
                      <div className="mt-2 inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-500/10 text-amber-600 dark:text-amber-400 rounded-lg text-sm font-semibold">
                        <Coins className="w-4 h-4" />
                        +{msg.points} bonus points
                      </div>
                    )}

                    {msg.message && (
                      <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{msg.message}</p>
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

import { useState, useRef, useEffect } from "react";
import { Layout } from "@/components/layout";
import { useAuth } from "@workspace/replit-auth-web";
import {
  useGetFriends, useSearchUsers, useSendFriendRequest, useAcceptFriendRequest,
  useDeclineFriendRequest, useRemoveFriend, useGetChat, useSendMessage,
  type FriendEntry, type FriendUser,
} from "@workspace/api-client-react";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Search, UserPlus, MessageCircle, Check, X, Trash2,
  ArrowLeft, Send, User, Zap, ChevronRight, Users
} from "lucide-react";
import { getItemDef } from "@/lib/shop-data";

function Avatar({ user, size = "md" }: { user: { profileImageUrl?: string | null; displayName: string }; size?: "sm" | "md" | "lg" }) {
  const dim = size === "sm" ? "w-9 h-9 text-xs" : size === "md" ? "w-11 h-11 text-sm" : "w-14 h-14 text-base";
  const initials = user.displayName.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2) || "?";
  if (user.profileImageUrl)
    return <img src={user.profileImageUrl} alt={user.displayName} className={cn("rounded-xl object-cover shrink-0", dim)} />;
  return (
    <div className={cn("rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white font-bold shrink-0", dim)}>
      {initials}
    </div>
  );
}

function LevelBadge({ gameLevel }: { gameLevel: number }) {
  return (
    <span className="inline-flex items-center gap-0.5 bg-violet-500/10 text-violet-600 dark:text-violet-400 text-[10px] font-bold px-1.5 py-0.5 rounded-full">
      <Zap className="w-2.5 h-2.5" /> Lv.{gameLevel}
    </span>
  );
}

function FriendListItem({
  entry, selected, onSelect, onAccept, onDecline, onRemove, myId, onViewProfile,
}: {
  entry: FriendEntry;
  selected: boolean;
  onSelect: () => void;
  onAccept: () => void;
  onDecline: () => void;
  onRemove: () => void;
  myId: string;
  onViewProfile: () => void;
}) {
  const u = entry.user;
  if (!u) return null;
  const nametag = getItemDef(u.equippedNametag);
  const isPending = entry.status === "pending";
  const isIncoming = isPending && !entry.iAmRequester;
  const isOutgoing = isPending && entry.iAmRequester;

  return (
    <div className={cn(
      "flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer transition-all group border",
      selected ? "bg-primary/10 border-primary/20" : "hover:bg-muted/50 border-transparent"
    )}>
      <div onClick={onSelect} className="flex items-center gap-3 flex-1 min-w-0">
        <Avatar user={u} size="md" />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5 flex-wrap">
            <p className="font-semibold text-sm truncate">{u.displayName}</p>
            {nametag && <span className="text-sm">{nametag.emoji}</span>}
          </div>
          <div className="flex items-center gap-1.5 mt-0.5">
            <LevelBadge gameLevel={u.gameLevel} />
            {isIncoming && <span className="text-[10px] text-primary font-bold bg-primary/10 px-1.5 py-0.5 rounded-full">Incoming</span>}
            {isOutgoing && <span className="text-[10px] text-muted-foreground font-medium">Pending…</span>}
          </div>
        </div>
      </div>
      <div className="flex items-center gap-1 shrink-0">
        {isIncoming && (
          <>
            <button onClick={onAccept} className="w-7 h-7 rounded-lg bg-green-500 text-white flex items-center justify-center hover:bg-green-600 transition-colors"><Check className="w-3.5 h-3.5" /></button>
            <button onClick={onDecline} className="w-7 h-7 rounded-lg bg-muted text-muted-foreground flex items-center justify-center hover:bg-destructive hover:text-white transition-colors"><X className="w-3.5 h-3.5" /></button>
          </>
        )}
        {entry.status === "accepted" && (
          <button onClick={onSelect} className="w-7 h-7 rounded-lg bg-muted/60 text-muted-foreground flex items-center justify-center hover:bg-primary hover:text-primary-foreground transition-colors"><MessageCircle className="w-3.5 h-3.5" /></button>
        )}
        <button onClick={onViewProfile} className="w-7 h-7 rounded-lg bg-muted/60 text-muted-foreground flex items-center justify-center hover:bg-muted transition-colors"><User className="w-3.5 h-3.5" /></button>
        {!isIncoming && (
          <button onClick={onRemove} className="w-7 h-7 rounded-lg bg-muted/60 text-muted-foreground flex items-center justify-center hover:bg-destructive hover:text-white transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
        )}
      </div>
    </div>
  );
}

export default function FriendsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [searchQ, setSearchQ] = useState("");
  const [selectedFriendId, setSelectedFriendId] = useState<string | null>(null);
  const [messageText, setMessageText] = useState("");
  const chatEndRef = useRef<HTMLDivElement>(null);

  const { data: friends = [], isLoading: friendsLoading } = useGetFriends();
  const { data: searchResults = [], isLoading: searching } = useSearchUsers(searchQ);
  const sendReqMut = useSendFriendRequest();
  const acceptMut = useAcceptFriendRequest();
  const declineMut = useDeclineFriendRequest();
  const removeMut = useRemoveFriend();
  const sendMsgMut = useSendMessage();

  const selectedEntry = friends.find(f => f.user?.id === selectedFriendId && f.status === "accepted");
  const { data: messages = [] } = useGetChat(selectedFriendId ?? "", !!selectedFriendId && !!selectedEntry);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const acceptedFriends = friends.filter(f => f.status === "accepted");
  const pending = friends.filter(f => f.status === "pending");

  const handleSendRequest = (u: FriendUser) => {
    if (u.friendshipStatus) return;
    sendReqMut.mutate(u.id, {
      onSuccess: () => toast({ title: `Friend request sent to ${u.displayName}!` }),
      onError: () => toast({ title: "Could not send request", variant: "destructive" }),
    });
  };

  const handleSendMessage = () => {
    if (!messageText.trim() || !selectedFriendId) return;
    sendMsgMut.mutate({ userId: selectedFriendId, content: messageText }, {
      onSuccess: () => setMessageText(""),
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const selectedFriendUser = selectedEntry?.user;

  return (
    <Layout title="Friends">
      <div className="max-w-5xl mx-auto">
        <div className="flex gap-4 h-[calc(100vh-160px)] min-h-[500px]">

          {/* Left panel: list */}
          <div className={cn(
            "flex flex-col gap-3 transition-all",
            selectedFriendId ? "hidden md:flex md:w-72 lg:w-80 shrink-0" : "flex w-full"
          )}>

            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                value={searchQ}
                onChange={e => setSearchQ(e.target.value)}
                placeholder="Search users by name…"
                className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-border bg-card text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            {/* Search results */}
            {searchQ.length >= 2 && (
              <div className="bg-card border border-border/60 rounded-2xl overflow-hidden">
                <p className="text-xs font-bold text-muted-foreground px-3 pt-3 pb-1.5 uppercase tracking-wide">Search Results</p>
                {searching && <div className="px-3 py-4 text-sm text-muted-foreground">Searching…</div>}
                {!searching && searchResults.length === 0 && <div className="px-3 py-4 text-sm text-muted-foreground">No users found</div>}
                <div className="divide-y divide-border/30">
                  {searchResults.map(u => {
                    const nametag = getItemDef(u.equippedNametag);
                    return (
                      <div key={u.id} className="flex items-center gap-3 px-3 py-2.5">
                        <Avatar user={u} size="sm" />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1"><p className="font-semibold text-sm truncate">{u.displayName}</p>{nametag && <span>{nametag.emoji}</span>}</div>
                          <LevelBadge gameLevel={u.gameLevel} />
                        </div>
                        <div className="flex gap-1">
                          <button onClick={() => setLocation(`/users/${u.id}`)} className="text-[10px] font-bold text-muted-foreground hover:text-foreground transition-colors px-2 py-1 rounded-lg hover:bg-muted">View</button>
                          {!u.friendshipStatus ? (
                            <button onClick={() => handleSendRequest(u)} disabled={sendReqMut.isPending} className="flex items-center gap-1 text-[10px] font-bold bg-primary text-primary-foreground px-2 py-1 rounded-lg hover:bg-primary/90 transition-colors">
                              <UserPlus className="w-3 h-3" /> Add
                            </button>
                          ) : (
                            <span className="text-[10px] font-bold text-muted-foreground px-2 py-1 rounded-lg bg-muted">
                              {u.friendshipStatus === "accepted" ? "Friends" : "Pending"}
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Pending */}
            {pending.length > 0 && (
              <div className="bg-card border border-amber-500/20 rounded-2xl overflow-hidden">
                <p className="text-xs font-bold text-amber-600 dark:text-amber-400 px-3 pt-3 pb-1.5 uppercase tracking-wide">Pending ({pending.length})</p>
                <div className="space-y-0.5 px-2 pb-2">
                  {pending.map(entry => (
                    <FriendListItem key={entry.friendshipId} entry={entry} selected={false}
                      onSelect={() => {}} myId={user?.id ?? ""}
                      onAccept={() => acceptMut.mutate(entry.friendshipId)}
                      onDecline={() => declineMut.mutate(entry.friendshipId)}
                      onRemove={() => removeMut.mutate(entry.friendshipId)}
                      onViewProfile={() => entry.user && setLocation(`/users/${entry.user.id}`)}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Friends list */}
            <div className="bg-card border border-border/60 rounded-2xl overflow-hidden flex-1 flex flex-col min-h-0">
              <p className="text-xs font-bold text-muted-foreground px-3 pt-3 pb-1.5 uppercase tracking-wide shrink-0">
                Friends ({acceptedFriends.length})
              </p>
              {friendsLoading && <div className="px-3 py-4 text-sm text-muted-foreground">Loading…</div>}
              {!friendsLoading && acceptedFriends.length === 0 && (
                <div className="px-4 py-6 text-center">
                  <Users className="w-8 h-8 text-muted-foreground/40 mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">No friends yet. Search for users above to add them!</p>
                </div>
              )}
              <div className="space-y-0.5 px-2 pb-2 overflow-y-auto flex-1">
                {acceptedFriends.map(entry => (
                  <FriendListItem key={entry.friendshipId} entry={entry}
                    selected={selectedFriendId === entry.user?.id}
                    onSelect={() => setSelectedFriendId(prev => prev === entry.user?.id ? null : (entry.user?.id ?? null))}
                    myId={user?.id ?? ""}
                    onAccept={() => {}}
                    onDecline={() => {}}
                    onRemove={() => removeMut.mutate(entry.friendshipId, { onSuccess: () => setSelectedFriendId(null) })}
                    onViewProfile={() => entry.user && setLocation(`/users/${entry.user.id}`)}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Right panel: chat */}
          {selectedFriendId && selectedFriendUser && (
            <div className="flex flex-col flex-1 min-w-0 bg-card border border-border/60 rounded-2xl overflow-hidden">
              {/* Chat header */}
              <div className="flex items-center gap-3 px-4 py-3 border-b border-border/40 shrink-0">
                <button onClick={() => setSelectedFriendId(null)} className="md:hidden w-8 h-8 rounded-lg bg-muted flex items-center justify-center">
                  <ArrowLeft className="w-4 h-4" />
                </button>
                <Avatar user={selectedFriendUser} size="sm" />
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-sm truncate">{selectedFriendUser.displayName}</p>
                  <LevelBadge gameLevel={selectedFriendUser.gameLevel} />
                </div>
                <button onClick={() => setLocation(`/users/${selectedFriendUser.id}`)} className="text-xs font-bold text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors">
                  Profile <ChevronRight className="w-3 h-3" />
                </button>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {messages.length === 0 && (
                  <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
                    Start the conversation!
                  </div>
                )}
                {messages.map(msg => {
                  const isMe = msg.senderId === user?.id;
                  return (
                    <div key={msg.id} className={cn("flex", isMe ? "justify-end" : "justify-start")}>
                      <div className={cn(
                        "max-w-[75%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed",
                        isMe
                          ? "bg-primary text-primary-foreground rounded-br-md"
                          : "bg-muted text-foreground rounded-bl-md"
                      )}>
                        <p>{msg.content}</p>
                        <p className={cn("text-[10px] mt-1 opacity-60", isMe ? "text-right" : "text-left")}>
                          {new Date(msg.createdAt).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}
                        </p>
                      </div>
                    </div>
                  );
                })}
                <div ref={chatEndRef} />
              </div>

              {/* Message input */}
              <div className="flex gap-2 p-3 border-t border-border/40 shrink-0">
                <input
                  value={messageText}
                  onChange={e => setMessageText(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Type a message… (Enter to send)"
                  className="flex-1 px-4 py-2.5 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  maxLength={2000}
                />
                <Button size="icon" onClick={handleSendMessage} disabled={!messageText.trim() || sendMsgMut.isPending} className="rounded-xl w-10 h-10 shrink-0">
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}

          {/* Right panel placeholder when no chat selected */}
          {!selectedFriendId && acceptedFriends.length > 0 && (
            <div className="hidden md:flex flex-1 items-center justify-center text-muted-foreground/40 flex-col gap-3">
              <MessageCircle className="w-12 h-12" />
              <p className="text-sm">Select a friend to start chatting</p>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}

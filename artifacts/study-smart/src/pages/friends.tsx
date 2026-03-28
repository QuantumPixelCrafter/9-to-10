import { useState, useRef, useEffect } from "react";
import { Layout } from "@/components/layout";
import { useAuth } from "@workspace/replit-auth-web";
import {
  useGetFriends, useSearchUsers, useSendFriendRequest, useAcceptFriendRequest,
  useDeclineFriendRequest, useRemoveFriend, useGetChat, useSendMessage, useGetChatBalance,
  useGetPowerups, useUnreadChatMessages, customFetch,
  type FriendEntry, type FriendUser,
} from "@workspace/api-client-react";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Search, UserPlus, MessageCircle, Check, X, Trash2,
  ArrowLeft, Send, User, Zap, ChevronRight, Users, Gift, X as XIcon, AlertTriangle, Coins, Settings,
  Paperclip, FileText, Loader2, MoreVertical, Lock, LockOpen,
} from "lucide-react";
import { getItemDef } from "@/lib/shop-data";
import { useLanguage } from "@/lib/language-context";

const GIFTABLE_POWERUPS = [
  { key: "streak_freeze", name: "Streak Freeze", emoji: "🧊", price: 2000, cooldownDays: 4 },
  { key: "double_points", name: "Double Points Boost", emoji: "⚡", price: 1500, cooldownDays: 3 },
  { key: "hint_token", name: "Hint Token", emoji: "💡", price: 500, cooldownDays: 1 },
];

// ── Helpers ───────────────────────────────────────────────────────────────────
function loadChatLocks(): Record<string, string> {
  try { return JSON.parse(localStorage.getItem("mf_chat_locks") ?? "{}"); } catch { return {}; }
}

// ── Avatar ────────────────────────────────────────────────────────────────────
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

// ── LevelBadge ────────────────────────────────────────────────────────────────
function LevelBadge({ gameLevel }: { gameLevel: number }) {
  return (
    <span className="inline-flex items-center gap-0.5 bg-violet-500/10 text-violet-600 dark:text-violet-400 text-[10px] font-bold px-1.5 py-0.5 rounded-full">
      <Zap className="w-2.5 h-2.5" /> Lv.{gameLevel}
    </span>
  );
}

// ── PinKeypad ─────────────────────────────────────────────────────────────────
function PinKeypad({
  title, subtitle, error, onComplete, onCancel,
}: {
  title: string;
  subtitle?: string;
  error?: string;
  onComplete: (pin: string) => void;
  onCancel: () => void;
}) {
  const [digits, setDigits] = useState<string[]>([]);

  const addDigit = (d: string) => {
    setDigits(prev => {
      if (prev.length >= 6) return prev;
      const next = [...prev, d];
      if (next.length === 6) setTimeout(() => onComplete(next.join("")), 80);
      return next;
    });
  };

  const removeDigit = () => setDigits(prev => prev.slice(0, -1));

  useEffect(() => { setDigits([]); }, [error]);

  const KEYS = ["1","2","3","4","5","6","7","8","9","","0","⌫"];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onCancel}>
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
      <div
        className="relative bg-card border border-border rounded-3xl p-6 w-full max-w-xs space-y-5 shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        <div className="text-center space-y-1">
          <div className="text-4xl mb-1">🔒</div>
          <h3 className="font-extrabold text-lg">{title}</h3>
          {subtitle && <p className="text-sm text-muted-foreground">{subtitle}</p>}
        </div>

        {/* dots */}
        <div className="flex justify-center gap-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className={cn(
              "w-3.5 h-3.5 rounded-full border-2 transition-all duration-150",
              i < digits.length
                ? "bg-primary border-primary scale-110"
                : "bg-transparent border-muted-foreground/30"
            )} />
          ))}
        </div>

        {error && (
          <p className="text-center text-sm text-destructive font-semibold animate-pulse">{error}</p>
        )}

        {/* Numpad */}
        <div className="grid grid-cols-3 gap-2.5">
          {KEYS.map((key, idx) => {
            if (key === "") return <div key={idx} />;
            const isBackspace = key === "⌫";
            return (
              <button
                key={key}
                onClick={() => isBackspace ? removeDigit() : addDigit(key)}
                className={cn(
                  "h-14 rounded-2xl font-bold text-xl transition-all active:scale-95 select-none",
                  isBackspace
                    ? "bg-muted text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                    : "bg-muted/60 hover:bg-primary/10 hover:text-primary active:bg-primary/20"
                )}
              >
                {key}
              </button>
            );
          })}
        </div>

        <button
          onClick={onCancel}
          className="w-full text-sm text-muted-foreground hover:text-foreground transition-colors py-1"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

// ── GiftModal ─────────────────────────────────────────────────────────────────
function GiftModal({
  friend, onClose, onGift, isGifting,
}: {
  friend: { id: string; displayName: string; profileImageUrl?: string | null };
  onClose: () => void;
  onGift: (type: string) => void;
  isGifting: boolean;
}) {
  const [selected, setSelected] = useState<string | null>(null);
  const { data: powerupsData } = useGetPowerups();
  const { t } = useLanguage();
  const balance = powerupsData?.balance ?? 0;
  const selectedDef = GIFTABLE_POWERUPS.find(p => p.key === selected);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
      <div className="relative bg-card border border-border rounded-3xl p-6 w-full max-w-sm space-y-5 shadow-2xl" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Avatar user={friend} size="sm" />
            <div>
              <p className="font-bold text-sm">{t.friends.giftTo.replace("{name}", friend.displayName)}</p>
              <p className="text-xs text-muted-foreground">{t.friends.yourBalance}: <span className="font-semibold text-amber-500">{balance.toLocaleString()} {t.friends.pts}</span></p>
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-xl bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors">
            <XIcon className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-2">
          {GIFTABLE_POWERUPS.map(p => {
            const canAfford = balance >= p.price;
            const isSel = selected === p.key;
            return (
              <button key={p.key} onClick={() => canAfford && setSelected(isSel ? null : p.key)} disabled={!canAfford}
                className={cn(
                  "w-full flex items-center gap-3 p-3 rounded-2xl border transition-all text-left",
                  isSel ? "bg-emerald-500/10 border-emerald-500/30"
                    : canAfford ? "bg-muted/40 border-border hover:bg-muted/80"
                    : "opacity-40 cursor-not-allowed bg-muted/20 border-border/40"
                )}>
                <span className="text-2xl">{p.emoji}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold">{p.name}</p>
                  <p className="text-xs text-muted-foreground">{t.friends.cooldownDays.replace("{n}", String(p.cooldownDays))}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-xs font-bold text-amber-500">{p.price.toLocaleString()} pts</p>
                  {!canAfford && <p className="text-[10px] text-destructive font-medium">{t.friends.notEnough}</p>}
                </div>
              </button>
            );
          })}
        </div>

        {selectedDef && (
          <div className="p-3 rounded-xl bg-muted/60 text-xs text-muted-foreground">
            {t.friends.giftCooldownMsg.replace("{n}", String(selectedDef.cooldownDays))}
          </div>
        )}

        <Button
          className="w-full rounded-2xl gap-2 bg-emerald-600 hover:bg-emerald-700 text-white"
          disabled={!selected || isGifting}
          onClick={() => selected && onGift(selected)}
        >
          <Gift className="w-4 h-4" />
          {isGifting ? t.friends.gifting : selected
            ? `${t.friends.sendGift} ${GIFTABLE_POWERUPS.find(p => p.key === selected)?.emoji} ${GIFTABLE_POWERUPS.find(p => p.key === selected)?.name}`
            : t.friends.selectPowerup}
        </Button>
      </div>
    </div>
  );
}

// ── FriendListItem ─────────────────────────────────────────────────────────────
function FriendListItem({
  entry, selected, onSelect, onAccept, onDecline, onRemove, myId, onViewProfile, onGift, onLockChat, isLocked, unreadCount,
}: {
  entry: FriendEntry;
  selected: boolean;
  onSelect: () => void;
  onAccept: () => void;
  onDecline: () => void;
  onRemove: () => void;
  myId: string;
  onViewProfile: () => void;
  onGift?: () => void;
  onLockChat?: () => void;
  isLocked?: boolean;
  unreadCount?: number;
}) {
  const u = entry.user;
  if (!u) return null;
  const { t } = useLanguage();
  const nametag = getItemDef(u.equippedNametag);
  const isPending = entry.status === "pending";
  const isIncoming = isPending && !entry.iAmRequester;
  const isOutgoing = isPending && entry.iAmRequester;
  const isAccepted = entry.status === "accepted";

  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menuOpen) return;
    const handler = (e: MouseEvent) => {
      if (!menuRef.current?.contains(e.target as Node)) setMenuOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [menuOpen]);

  return (
    <div className={cn(
      "flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer transition-all group border",
      selected ? "bg-primary/10 border-primary/20" : "hover:bg-muted/50 border-transparent"
    )}>
      <div onClick={onSelect} className="flex items-center gap-3 flex-1 min-w-0">
        <div className="relative shrink-0">
          <Avatar user={u} size="md" />
          {!!unreadCount && !selected && (
            <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-red-500 text-white text-[10px] font-black flex items-center justify-center shadow-sm border-2 border-card leading-none">
              {unreadCount > 99 ? "99+" : unreadCount}
            </span>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5 flex-wrap">
            <button
              onClick={(e) => { e.stopPropagation(); onViewProfile(); }}
              className="font-semibold text-sm truncate hover:underline hover:text-primary transition-colors text-left"
            >{u.displayName}</button>
            {nametag && <span className="text-sm">{nametag.emoji}</span>}
            {isLocked && <Lock className="w-3 h-3 text-amber-500 shrink-0" />}
          </div>
          <div className="flex items-center gap-1.5 mt-0.5">
            <LevelBadge gameLevel={u.gameLevel} />
            {isIncoming && <span className="text-[10px] text-primary font-bold bg-primary/10 px-1.5 py-0.5 rounded-full">{t.friends.incoming}</span>}
            {isOutgoing && <span className="text-[10px] text-muted-foreground font-medium">{t.friends.pendingDots}</span>}
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
        {isAccepted && (
          <>
            <button onClick={onSelect} className="w-7 h-7 rounded-lg bg-muted/60 text-muted-foreground flex items-center justify-center hover:bg-primary hover:text-primary-foreground transition-colors" title="Open chat">
              <MessageCircle className="w-3.5 h-3.5" />
            </button>
            {onGift && (
              <button onClick={(e) => { e.stopPropagation(); onGift(); }} className="w-7 h-7 rounded-lg bg-muted/60 text-muted-foreground flex items-center justify-center hover:bg-emerald-500 hover:text-white transition-colors" title="Gift a power-up">
                <Gift className="w-3.5 h-3.5" />
              </button>
            )}
          </>
        )}

        {/* 3-dots menu */}
        <div className="relative" ref={menuRef}>
          <button
            onClick={(e) => { e.stopPropagation(); setMenuOpen(v => !v); }}
            className="w-7 h-7 rounded-lg bg-muted/60 text-muted-foreground flex items-center justify-center hover:bg-muted transition-colors"
          >
            <MoreVertical className="w-3.5 h-3.5" />
          </button>

          {menuOpen && (
            <div className="absolute right-0 top-full mt-1 z-30 w-44 bg-card border border-border rounded-2xl shadow-xl overflow-hidden py-1">
              {/* Profile */}
              <button
                onClick={() => { setMenuOpen(false); onViewProfile(); }}
                className="w-full flex items-center gap-2.5 px-3 py-2 text-sm hover:bg-muted/60 transition-colors text-left"
              >
                <User className="w-3.5 h-3.5 text-muted-foreground" />
                Profile
              </button>

              {/* Lock Chat — only for accepted friends */}
              {isAccepted && onLockChat && (
                <button
                  onClick={() => { setMenuOpen(false); onLockChat(); }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-sm hover:bg-muted/60 transition-colors text-left"
                >
                  {isLocked
                    ? <LockOpen className="w-3.5 h-3.5 text-amber-500" />
                    : <Lock className="w-3.5 h-3.5 text-muted-foreground" />
                  }
                  {isLocked ? "Unlock Chat" : "Lock Chat"}
                </button>
              )}

              {/* Divider */}
              {!isIncoming && <div className="border-t border-border/50 my-1" />}

              {/* Delete Friend */}
              {!isIncoming && (
                <button
                  onClick={() => { setMenuOpen(false); onRemove(); }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-sm hover:bg-destructive/10 text-destructive transition-colors text-left"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  {isAccepted ? "Delete Friend" : "Cancel Request"}
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── LockModal state type ──────────────────────────────────────────────────────
type LockModal =
  | { mode: "setup-1"; friendId: string; error?: string }
  | { mode: "setup-2"; friendId: string; firstPin: string; error?: string }
  | { mode: "unlock-to-open"; friendId: string; onSuccess: () => void; error?: string }
  | { mode: "unlock-to-remove"; friendId: string; error?: string };

// ── FriendsPage ───────────────────────────────────────────────────────────────
export default function FriendsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const { t } = useLanguage();
  const [, setLocation] = useLocation();
  const qc = useQueryClient();
  const [searchQ, setSearchQ] = useState("");
  const [selectedFriendId, setSelectedFriendId] = useState<string | null>(null);
  const [messageText, setMessageText] = useState("");
  const [giftFriend, setGiftFriend] = useState<{ id: string; displayName: string; profileImageUrl?: string | null } | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [pendingMedia, setPendingMedia] = useState<{
    objectPath: string;
    preview: string | null;
    name: string;
    mediaType: "image" | "video" | "file";
  } | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  // Lock chat state
  const [chatLocks, setChatLocks] = useState<Record<string, string>>(loadChatLocks);
  const [lockModal, setLockModal] = useState<LockModal | null>(null);

  const saveLock = (friendId: string, pin: string) => {
    const next = { ...chatLocks, [friendId]: pin };
    setChatLocks(next);
    localStorage.setItem("mf_chat_locks", JSON.stringify(next));
  };

  const removeLock = (friendId: string) => {
    const next = { ...chatLocks };
    delete next[friendId];
    setChatLocks(next);
    localStorage.setItem("mf_chat_locks", JSON.stringify(next));
  };

  // Open chat — intercept with lock if needed
  const handleOpenChat = (friendId: string) => {
    const open = () => {
      setSelectedFriendId(prev => prev === friendId ? null : friendId);
      // backend marks messages as read on GET /chat/:id; invalidate unread count
      qc.invalidateQueries({ queryKey: ["chat-unread-messages"] });
    };
    if (chatLocks[friendId]) {
      setLockModal({
        mode: "unlock-to-open",
        friendId,
        onSuccess: () => { setSelectedFriendId(friendId); qc.invalidateQueries({ queryKey: ["chat-unread-messages"] }); },
      });
    } else {
      open();
    }
  };

  // Lock Chat menu item handler
  const handleLockChat = (friendId: string) => {
    if (chatLocks[friendId]) {
      setLockModal({ mode: "unlock-to-remove", friendId });
    } else {
      setLockModal({ mode: "setup-1", friendId });
    }
  };

  // PinKeypad submit handler
  const handlePinSubmit = (pin: string) => {
    if (!lockModal) return;

    if (lockModal.mode === "setup-1") {
      setLockModal({ mode: "setup-2", friendId: lockModal.friendId, firstPin: pin });
    } else if (lockModal.mode === "setup-2") {
      if (pin === lockModal.firstPin) {
        saveLock(lockModal.friendId, pin);
        setLockModal(null);
        toast({ title: "🔒 Chat locked", description: "Passcode set successfully." });
      } else {
        setLockModal({ ...lockModal, error: "Passcodes don't match — try again" });
      }
    } else if (lockModal.mode === "unlock-to-open") {
      if (pin === chatLocks[lockModal.friendId]) {
        lockModal.onSuccess();
        setLockModal(null);
      } else {
        setLockModal({ ...lockModal, error: "Incorrect passcode" });
      }
    } else if (lockModal.mode === "unlock-to-remove") {
      if (pin === chatLocks[lockModal.friendId]) {
        removeLock(lockModal.friendId);
        setLockModal(null);
        toast({ title: "🔓 Chat unlocked" });
      } else {
        setLockModal({ ...lockModal, error: "Incorrect passcode" });
      }
    }
  };

  const lockModalTitle = lockModal
    ? lockModal.mode === "setup-1" ? "Set a Passcode"
    : lockModal.mode === "setup-2" ? "Confirm Passcode"
    : lockModal.mode === "unlock-to-open" ? "Enter Passcode"
    : "Enter Passcode to Unlock"
    : "";

  const lockModalSubtitle = lockModal
    ? lockModal.mode === "setup-1" ? "Enter a 6-digit passcode for this chat"
    : lockModal.mode === "setup-2" ? "Re-enter the same passcode to confirm"
    : lockModal.mode === "unlock-to-open" ? "This chat is locked — enter your passcode to open it"
    : "Enter your current passcode to remove the lock"
    : "";

  const { data: unreadData } = useUnreadChatMessages(true);
  const unreadByFriend: Record<string, number> = {};
  for (const msg of unreadData?.messages ?? []) {
    unreadByFriend[msg.senderId] = (unreadByFriend[msg.senderId] ?? 0) + 1;
  }

  const { data: friends = [], isLoading: friendsLoading } = useGetFriends();
  const { data: searchResults = [], isLoading: searching } = useSearchUsers(searchQ);
  const sendReqMut = useSendFriendRequest();
  const acceptMut = useAcceptFriendRequest();
  const declineMut = useDeclineFriendRequest();
  const removeMut = useRemoveFriend();
  const sendMsgMut = useSendMessage();

  const giftMut = useMutation({
    mutationFn: ({ recipientId, type }: { recipientId: string; type: string }) =>
      customFetch<{ success: boolean; cooldownDays: number; cooldownEndsAt: string }>("/api/powerups/gift", {
        method: "POST",
        body: JSON.stringify({ recipientId, type }),
      }),
    onSuccess: (res, vars) => {
      const def = GIFTABLE_POWERUPS.find(p => p.key === vars.type);
      toast({
        title: `${def?.emoji} Gift sent!`,
        description: `You can send another gift in ${res.cooldownDays} day${res.cooldownDays !== 1 ? "s" : ""}.`,
      });
      setGiftFriend(null);
      qc.invalidateQueries({ queryKey: ["powerups"] });
    },
    onError: (err: Error) => {
      toast({ title: "Couldn't send gift", description: err.message, variant: "destructive" });
    },
  });

  const selectedEntry = friends.find(f => f.user?.id === selectedFriendId && f.status === "accepted");
  const { data: messages = [] } = useGetChat(selectedFriendId ?? "", !!selectedFriendId && !!selectedEntry);
  const { data: chatBalance } = useGetChatBalance(!!selectedFriendId && !!selectedEntry);

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
    if (!messageText.trim() && !pendingMedia) return;
    if (!selectedFriendId) return;
    const balance = chatBalance?.balance ?? null;
    const cost = chatBalance?.messageCost ?? 10;
    if (balance !== null && balance < cost) {
      toast({ title: "Not enough points", description: `Sending a message costs ${cost} pts. You have ${balance} pts.`, variant: "destructive" });
      return;
    }
    const mediaUrl = pendingMedia ? `/api/storage${pendingMedia.objectPath}` : undefined;
    sendMsgMut.mutate({ userId: selectedFriendId, content: messageText, mediaUrl }, {
      onSuccess: () => { setMessageText(""); setPendingMedia(null); },
      onError: (err: Error) => toast({ title: "Message not sent", description: err.message, variant: "destructive" }),
    });
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploading(true);
    try {
      const { uploadURL, objectPath } = await customFetch<{ uploadURL: string; objectPath: string; contentType: string }>(
        "/api/storage/uploads/request-url",
        { method: "POST", body: JSON.stringify({ contentType: file.type || "application/octet-stream" }) }
      );
      await fetch(uploadURL, { method: "PUT", body: file, headers: { "Content-Type": file.type || "application/octet-stream" } });
      const mediaType: "image" | "video" | "file" = file.type.startsWith("image/") ? "image" : file.type.startsWith("video/") ? "video" : "file";
      const preview = mediaType !== "file" ? URL.createObjectURL(file) : null;
      const typedPath = mediaType !== "file" ? `${objectPath}?t=${mediaType}` : objectPath;
      setPendingMedia({ objectPath: typedPath, preview, name: file.name, mediaType });
    } catch (err: any) {
      toast({ title: "Upload failed", description: err.message, variant: "destructive" });
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSendMessage(); }
  };

  const selectedFriendUser = selectedEntry?.user;

  return (
    <Layout title={t.nav.friends}>
      <div className="max-w-5xl mx-auto">
        <div className="flex gap-4 h-[calc(100vh-160px)] min-h-[500px]">

          {/* Left panel */}
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
                placeholder={t.friends.searchPlaceholder}
                className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-border bg-card text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            {/* Search results */}
            {searchQ.length >= 2 && (
              <div className="bg-card border border-border/60 rounded-2xl overflow-hidden">
                <p className="text-xs font-bold text-muted-foreground px-3 pt-3 pb-1.5 uppercase tracking-wide">{t.friends.searchResults}</p>
                {searching && <div className="px-3 py-4 text-sm text-muted-foreground">{t.friends.searching}</div>}
                {!searching && searchResults.length === 0 && <div className="px-3 py-4 text-sm text-muted-foreground">{t.friends.noUsersFound}</div>}
                <div className="divide-y divide-border/30">
                  {searchResults.map(u => {
                    const nametag = getItemDef(u.equippedNametag);
                    return (
                      <div key={u.id} className="flex items-center gap-3 px-3 py-2.5">
                        <Avatar user={u} size="sm" />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1">
                            <button onClick={() => setLocation(`/users/${u.id}`)} className="font-semibold text-sm truncate hover:underline hover:text-primary transition-colors text-left">{u.displayName}</button>
                            {nametag && <span>{nametag.emoji}</span>}
                          </div>
                          <LevelBadge gameLevel={u.gameLevel} />
                        </div>
                        <div className="flex gap-1">
                          <button onClick={() => setLocation(`/users/${u.id}`)} className="text-[10px] font-bold text-muted-foreground hover:text-foreground transition-colors px-2 py-1 rounded-lg hover:bg-muted">{t.friends.view}</button>
                          {!u.friendshipStatus ? (
                            <button onClick={() => handleSendRequest(u)} disabled={sendReqMut.isPending} className="flex items-center gap-1 text-[10px] font-bold bg-primary text-primary-foreground px-2 py-1 rounded-lg hover:bg-primary/90 transition-colors">
                              <UserPlus className="w-3 h-3" /> {t.friends.add}
                            </button>
                          ) : (
                            <span className="text-[10px] font-bold text-muted-foreground px-2 py-1 rounded-lg bg-muted">
                              {u.friendshipStatus === "accepted" ? t.friends.friends : t.friends.pending}
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
                <p className="text-xs font-bold text-amber-600 dark:text-amber-400 px-3 pt-3 pb-1.5 uppercase tracking-wide">{t.friends.pending} ({pending.length})</p>
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
                {t.friends.friends} ({acceptedFriends.length})
              </p>
              {friendsLoading && <div className="px-3 py-4 text-sm text-muted-foreground">Loading…</div>}
              {!friendsLoading && acceptedFriends.length === 0 && (
                <div className="px-4 py-6 text-center">
                  <Users className="w-8 h-8 text-muted-foreground/40 mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">{t.friends.noFriends}</p>
                </div>
              )}
              <div className="space-y-0.5 px-2 pb-2 overflow-y-auto flex-1">
                {acceptedFriends.map(entry => (
                  <FriendListItem key={entry.friendshipId} entry={entry}
                    selected={selectedFriendId === entry.user?.id}
                    onSelect={() => entry.user && handleOpenChat(entry.user.id)}
                    myId={user?.id ?? ""}
                    onAccept={() => {}}
                    onDecline={() => {}}
                    onRemove={() => removeMut.mutate(entry.friendshipId, { onSuccess: () => setSelectedFriendId(null) })}
                    onViewProfile={() => entry.user && setLocation(`/users/${entry.user.id}`)}
                    onGift={() => entry.user && setGiftFriend({ id: entry.user.id, displayName: entry.user.displayName, profileImageUrl: entry.user.profileImageUrl })}
                    onLockChat={() => entry.user && handleLockChat(entry.user.id)}
                    isLocked={!!entry.user && !!chatLocks[entry.user.id]}
                    unreadCount={entry.user ? (unreadByFriend[entry.user.id] ?? 0) : 0}
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
                  <div className="flex items-center gap-1.5">
                    <button onClick={() => setLocation(`/users/${selectedFriendUser.id}`)} className="font-bold text-sm truncate hover:underline hover:text-primary transition-colors text-left">{selectedFriendUser.displayName}</button>
                    {chatLocks[selectedFriendUser.id] && <Lock className="w-3 h-3 text-amber-500 shrink-0" />}
                  </div>
                  <LevelBadge gameLevel={selectedFriendUser.gameLevel} />
                </div>
                <button
                  onClick={() => setGiftFriend({ id: selectedFriendUser.id, displayName: selectedFriendUser.displayName, profileImageUrl: selectedFriendUser.profileImageUrl })}
                  className="flex items-center gap-1.5 text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 transition-colors px-2 py-1 rounded-lg hover:bg-emerald-500/10"
                >
                  <Gift className="w-3.5 h-3.5" /> {t.friends.gift}
                </button>
                <button onClick={() => setLocation(`/users/${selectedFriendUser.id}`)} className="text-xs font-bold text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors">
                  {t.friends.profile} <ChevronRight className="w-3 h-3" />
                </button>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {messages.length === 0 && (
                  <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
                    {t.friends.startChat}
                  </div>
                )}
                {messages.map(msg => {
                  const isMe = msg.senderId === user?.id;
                  const hasMedia = !!msg.mediaUrl;
                  const isImage = hasMedia && (msg.mediaUrl!.includes("?t=image") || /\.(jpe?g|png|gif|webp|avif|svg)(\?|$)/i.test(msg.mediaUrl!));
                  const isVideo = hasMedia && (msg.mediaUrl!.includes("?t=video") || /\.(mp4|webm|ogg|mov)(\?|$)/i.test(msg.mediaUrl!));
                  return (
                    <div key={msg.id} className={cn("flex", isMe ? "justify-end" : "justify-start")}>
                      <div className={cn(
                        "max-w-[75%] rounded-2xl text-sm leading-relaxed overflow-hidden",
                        hasMedia && !msg.content ? "p-0" : "px-4 py-2.5",
                        isMe ? "bg-primary text-primary-foreground rounded-br-md" : "bg-muted text-foreground rounded-bl-md"
                      )}>
                        {hasMedia && (
                          <div className={msg.content ? "mb-2" : ""}>
                            {isVideo ? (
                              <video src={msg.mediaUrl!} controls className="max-w-[260px] max-h-[200px] rounded-xl" />
                            ) : isImage ? (
                              <a href={msg.mediaUrl!} target="_blank" rel="noopener noreferrer">
                                <img src={msg.mediaUrl!} alt="media" className="max-w-[260px] max-h-[200px] rounded-xl object-cover" />
                              </a>
                            ) : (
                              <a href={msg.mediaUrl!} target="_blank" rel="noopener noreferrer"
                                className={cn("flex items-center gap-2 px-4 py-3 rounded-xl text-xs font-medium underline", isMe ? "text-primary-foreground/80" : "text-muted-foreground")}>
                                <FileText className="w-4 h-4 shrink-0" />
                                Attachment
                              </a>
                            )}
                          </div>
                        )}
                        {msg.content && <p className={hasMedia ? "px-4 pb-2.5" : ""}>{msg.content}</p>}
                        <p className={cn("text-[10px] mt-1 opacity-60", isMe ? "text-right" : "text-left", hasMedia && !msg.content ? "px-4 pb-2" : "")}>
                          {new Date(msg.createdAt).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}
                        </p>
                      </div>
                    </div>
                  );
                })}
                <div ref={chatEndRef} />
              </div>

              {/* Low balance warning */}
              {chatBalance && chatBalance.threshold !== null && chatBalance.balance <= chatBalance.threshold && (
                <div className="mx-3 mb-0 px-3 py-2 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center gap-2 text-amber-600 dark:text-amber-400 text-xs font-medium shrink-0">
                  <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                  <span>
                    {t.friends.lowBalance} — <span className="font-bold">{chatBalance.balance} {t.friends.pts}</span> {t.friends.remaining}
                    {chatBalance.balance < chatBalance.messageCost && ` (${t.friends.notEnoughSend})`}
                  </span>
                  <a href="/preferences" className="ml-auto flex items-center gap-1 text-amber-500 hover:text-amber-600 transition-colors shrink-0">
                    <Settings className="w-3 h-3" /> Settings
                  </a>
                </div>
              )}

              {/* Message input */}
              <div className="flex flex-col gap-1 p-3 border-t border-border/40 shrink-0">
                {pendingMedia && (
                  <div className="flex items-center gap-2 mb-1 px-1">
                    <div className="relative flex-1 max-w-[200px]">
                      {pendingMedia.mediaType === "image" && pendingMedia.preview ? (
                        <img src={pendingMedia.preview} alt="preview" className="h-16 w-auto rounded-xl object-cover border border-border" />
                      ) : pendingMedia.mediaType === "video" && pendingMedia.preview ? (
                        <video src={pendingMedia.preview} className="h-16 w-auto rounded-xl border border-border" />
                      ) : (
                        <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-muted border border-border text-xs font-medium text-muted-foreground">
                          <FileText className="w-4 h-4 shrink-0" />
                          <span className="truncate max-w-[120px]">{pendingMedia.name}</span>
                        </div>
                      )}
                      <button onClick={() => setPendingMedia(null)} className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center shadow">
                        <XIcon className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                )}
                <div className="flex gap-2">
                  <input ref={fileInputRef} type="file" className="hidden" onChange={handleFileChange} />
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploading || (chatBalance !== undefined && chatBalance.balance < (chatBalance.messageCost ?? 10))}
                    className="w-10 h-10 shrink-0 rounded-xl border border-border bg-background text-muted-foreground hover:text-foreground hover:bg-muted flex items-center justify-center transition-colors disabled:opacity-40"
                    title="Attach file"
                  >
                    {isUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Paperclip className="w-4 h-4" />}
                  </button>
                  <input
                    value={messageText}
                    onChange={e => setMessageText(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder={t.friends.messagePlaceholder}
                    className="flex-1 px-4 py-2.5 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                    maxLength={2000}
                    disabled={chatBalance !== undefined && chatBalance.balance < (chatBalance.messageCost ?? 10)}
                  />
                  <Button size="icon" onClick={handleSendMessage}
                    disabled={(!messageText.trim() && !pendingMedia) || isUploading || sendMsgMut.isPending || (chatBalance !== undefined && chatBalance.balance < (chatBalance.messageCost ?? 10))}
                    className="rounded-xl w-10 h-10 shrink-0">
                    <Send className="w-4 h-4" />
                  </Button>
                </div>
                <div className="flex items-center gap-1 text-[10px] text-muted-foreground/60 px-1">
                  <Coins className="w-3 h-3" />
                  <span>{t.friends.msgCosts.replace("{n}", String(chatBalance?.messageCost ?? 10))}</span>
                  {chatBalance !== undefined && (
                    <span className="ml-auto font-medium text-muted-foreground">{chatBalance.balance} {t.friends.pts} {t.friends.remaining}</span>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Right panel placeholder */}
          {!selectedFriendId && acceptedFriends.length > 0 && (
            <div className="hidden md:flex flex-1 items-center justify-center text-muted-foreground/40 flex-col gap-3">
              <MessageCircle className="w-12 h-12" />
              <p className="text-sm">{t.friends.selectFriend}</p>
            </div>
          )}
        </div>
      </div>

      {/* Gift modal */}
      {giftFriend && (
        <GiftModal
          friend={giftFriend}
          onClose={() => setGiftFriend(null)}
          onGift={(type) => giftMut.mutate({ recipientId: giftFriend.id, type })}
          isGifting={giftMut.isPending}
        />
      )}

      {/* Lock / unlock keypad */}
      {lockModal && (
        <PinKeypad
          key={`${lockModal.mode}-${lockModal.error ?? ""}`}
          title={lockModalTitle}
          subtitle={lockModalSubtitle}
          error={lockModal.error}
          onComplete={handlePinSubmit}
          onCancel={() => setLockModal(null)}
        />
      )}
    </Layout>
  );
}

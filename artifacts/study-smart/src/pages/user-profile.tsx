import { useParams, useLocation } from "wouter";
import { Layout } from "@/components/layout";
import { useGetUserProfile, useSendFriendRequest, useAcceptFriendRequest, useDeclineFriendRequest, useRemoveFriend } from "@workspace/api-client-react";
import { useAuth } from "@workspace/replit-auth-web";
import { motion } from "framer-motion";
import { useToast } from "@/hooks/use-toast";
import { getBgStyle, getFrameGradient, getItemDef } from "@/lib/shop-data";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ArrowLeft, GraduationCap, MessageCircle, UserCheck, UserPlus } from "lucide-react";

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

  const displayName = [profile.displayName].filter(Boolean).join("") || profile.username || null;

  return (
    <Layout title={displayName ?? "Profile"}>
      <div className="max-w-md mx-auto space-y-5 pb-12">
        <button onClick={() => history.back()} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back
        </button>

        {/* Profile card */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
          className="bg-card rounded-3xl border border-border/60 shadow-sm overflow-hidden">

          {/* Background banner */}
          {bgStyle && <div className="h-24" style={{ background: bgStyle }} />}

          <div className={cn("px-6 pb-6", bgStyle ? "-mt-10" : "pt-6")}>
            <div className="flex items-end gap-4 mb-5">
              {/* Avatar with optional frame */}
              {frameGrad ? (
                <div className="rounded-2xl p-[3px] shadow-xl shrink-0" style={{ background: frameGrad }}>
                  <div className="w-20 h-20 rounded-[14px] overflow-hidden bg-card">
                    {profile.profileImageUrl ? (
                      <img src={profile.profileImageUrl} alt={displayName ?? ""} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white text-2xl font-bold">
                        {(displayName ?? "?").slice(0, 2).toUpperCase()}
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="w-20 h-20 rounded-2xl border-4 border-card shadow-xl overflow-hidden bg-gradient-to-br from-primary to-accent shrink-0">
                  {profile.profileImageUrl ? (
                    <img src={profile.profileImageUrl} alt={displayName ?? ""} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-white text-2xl font-bold">
                      {(displayName ?? "?").slice(0, 2).toUpperCase()}
                    </div>
                  )}
                </div>
              )}

              {/* Name + nametag + level */}
              <div className="pb-1 flex-1 min-w-0">
                <div className="flex items-center flex-wrap gap-2">
                  {displayName && <h2 className="text-xl font-bold">{displayName}</h2>}
                  {nametagDef && (
                    <span className="inline-flex items-center gap-1 bg-gradient-to-r from-primary/20 to-accent/20 border border-primary/20 text-xs font-bold px-2 py-0.5 rounded-full">
                      {nametagDef.emoji} {nametagDef.name}
                    </span>
                  )}
                </div>
                {profile.username && (
                  <p className="text-sm text-muted-foreground mt-0.5">@{profile.username}</p>
                )}
                {profile.level && (
                  <span className="mt-2 inline-flex items-center gap-1 bg-primary/10 text-primary text-xs font-bold px-2 py-0.5 rounded-full">
                    <GraduationCap className="w-3 h-3" /> {profile.level}
                  </span>
                )}
              </div>
            </div>

            {/* Friend actions (only if viewing someone else's profile) */}
            {!isMe && (
              <div className="flex gap-2">
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
      </div>
    </Layout>
  );
}

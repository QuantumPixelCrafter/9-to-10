import { useState } from "react";
import { Layout } from "@/components/layout";
import { useGetShop, usePurchaseItem, useEquipItem, type ShopItem } from "@workspace/api-client-react";
import { useGetAchievements } from "@workspace/api-client-react";
import { useToast } from "@/hooks/use-toast";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { Star, ShoppingBag, Check, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

const TYPE_TABS = [
  { key: "background", label: "Backgrounds", emoji: "🖼️" },
  { key: "frame",      label: "Frames",       emoji: "🖼️" },
  { key: "nametag",    label: "Nametags",     emoji: "🏷️" },
] as const;

function BackgroundPreview({ colors, size = "lg" }: { colors?: string[]; size?: "lg" | "sm" }) {
  if (!colors || colors.length === 0) return <div className={cn("rounded-xl bg-muted", size === "lg" ? "h-20 w-full" : "h-10 w-16 rounded-lg")} />;
  const gradient = colors.length === 1
    ? `linear-gradient(135deg, ${colors[0]}, ${colors[0]})`
    : `linear-gradient(135deg, ${colors.join(", ")})`;
  return <div className={cn("rounded-xl", size === "lg" ? "h-20 w-full" : "h-10 w-16 rounded-lg")} style={{ background: gradient }} />;
}

function FramePreview({ colors, size = "lg" }: { colors?: string[]; size?: "sm" | "lg" }) {
  const dim = size === "lg" ? "w-16 h-16" : "w-10 h-10";
  if (!colors || colors.length < 2) {
    const c = colors?.[0] ?? "#94A3B8";
    return <div className={cn("rounded-full border-4 bg-gradient-to-br from-muted to-muted/60 mx-auto", dim)} style={{ borderColor: c }} />;
  }
  const gradient = `linear-gradient(135deg, ${colors.join(", ")})`;
  return (
    <div className={cn("rounded-full p-[3px] mx-auto", dim)} style={{ background: gradient }}>
      <div className="w-full h-full rounded-full bg-gradient-to-br from-muted to-muted/60" />
    </div>
  );
}

function NametagPreview({ item }: { item: ShopItem }) {
  return (
    <div className="flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-full bg-gradient-to-r from-primary/20 to-accent/20 border border-primary/20">
      <span className="text-lg">{item.emoji}</span>
      <span className="text-xs font-bold">{item.name}</span>
    </div>
  );
}

export default function ShopPage() {
  const { toast } = useToast();
  const { data: shop, isLoading } = useGetShop();
  const { data: achData } = useGetAchievements();
  const purchaseMut = usePurchaseItem();
  const equipMut = useEquipItem();
  const [activeTab, setActiveTab] = useState<"background" | "frame" | "nametag">("background");

  const balance = shop?.balance ?? 0;
  const totalEarned = achData?.totalPoints ?? 0;
  const items = (shop?.items ?? []).filter(i => i.type === activeTab);

  const handlePurchase = (item: ShopItem) => {
    purchaseMut.mutate(item.key, {
      onSuccess: (r) => toast({ title: `Bought "${item.name}"!`, description: `New balance: ${r.newBalance} pts` }),
      onError: (e: unknown) => toast({ title: "Purchase failed", description: (e as { message?: string })?.message, variant: "destructive" }),
    });
  };

  const handleEquip = (item: ShopItem) => {
    equipMut.mutate({ itemKey: item.equipped ? "" : item.key, slot: item.type }, {
      onSuccess: () => toast({ title: item.equipped ? `Unequipped "${item.name}"` : `Equipped "${item.name}"!` }),
    });
  };

  return (
    <Layout title="Shop">
      <div className="space-y-6 pb-12">

        {/* Balance Header */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-amber-500/10 to-yellow-500/10 border border-amber-500/20 rounded-2xl p-5 flex items-center justify-between"
        >
          <div>
            <p className="text-xs font-medium text-muted-foreground mb-0.5">Available Points</p>
            <div className="flex items-baseline gap-2">
              <p className="text-3xl font-black text-amber-500">{balance.toLocaleString()}</p>
              <p className="text-sm text-muted-foreground">/ {totalEarned.toLocaleString()} earned</p>
            </div>
          </div>
          <div className="w-14 h-14 rounded-2xl bg-amber-500/20 flex items-center justify-center text-3xl">
            🛍️
          </div>
        </motion.div>

        {/* Equipped Cosmetics Preview */}
        {shop?.equipped && (
          <div className="bg-card border border-border/50 rounded-2xl p-4">
            <p className="text-xs font-semibold text-muted-foreground mb-3 uppercase tracking-wide">Currently Equipped</p>
            <div className="grid grid-cols-3 gap-3 text-center">
              {(["background", "frame", "nametag"] as const).map(slot => {
                const key = shop.equipped[slot];
                const item = shop.items.find(i => i.key === key);
                return (
                  <div key={slot} className="space-y-1">
                    <p className="text-[10px] font-medium text-muted-foreground capitalize">{slot}</p>
                    {item ? (
                      <div className="flex flex-col items-center gap-1">
                        {slot === "background" && <BackgroundPreview colors={item.colors} size="sm" />}
                        {slot === "frame" && <FramePreview colors={item.colors} size="sm" />}
                        {slot === "nametag" && <span className="text-xl">{item.emoji}</span>}
                        <p className="text-[10px] font-semibold">{item.name}</p>
                      </div>
                    ) : (
                      <p className="text-[10px] text-muted-foreground/50 italic">None</p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-2">
          {TYPE_TABS.map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={cn(
                "flex-1 py-2.5 rounded-xl text-sm font-bold transition-all border",
                activeTab === tab.key
                  ? "bg-primary text-primary-foreground border-primary shadow-lg shadow-primary/20"
                  : "bg-muted/40 text-muted-foreground border-transparent hover:border-border"
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Items Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-40 rounded-2xl bg-muted/40 animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {items.map((item, i) => (
              <motion.div
                key={item.key}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className={cn(
                  "bg-card border rounded-2xl p-4 space-y-3 transition-all",
                  item.equipped ? "border-primary/50 shadow-lg shadow-primary/10" : "border-border/50 hover:border-border"
                )}
              >
                {/* Preview */}
                <div className="relative">
                  {item.type === "background" && <BackgroundPreview colors={item.colors} />}
                  {item.type === "frame" && (
                    <div className="flex justify-center py-2">
                      <FramePreview colors={item.colors} />
                    </div>
                  )}
                  {item.type === "nametag" && (
                    <div className="flex justify-center py-3">
                      <NametagPreview item={item} />
                    </div>
                  )}
                  {item.equipped && (
                    <div className="absolute top-2 right-2 bg-primary text-primary-foreground text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                      <Check className="w-3 h-3" /> Equipped
                    </div>
                  )}
                  {item.owned && !item.equipped && (
                    <div className="absolute top-2 right-2 bg-green-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                      Owned
                    </div>
                  )}
                </div>

                {/* Info */}
                <div>
                  <div className="flex items-center justify-between">
                    <p className="font-bold text-sm">{item.name}</p>
                    <div className="flex items-center gap-1 text-amber-500 font-bold text-sm">
                      <Star className="w-3.5 h-3.5 fill-amber-500" />
                      {item.price}
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">{item.description}</p>
                </div>

                {/* Action */}
                {item.owned ? (
                  <Button
                    size="sm"
                    variant={item.equipped ? "outline" : "default"}
                    className="w-full rounded-xl"
                    onClick={() => handleEquip(item)}
                    disabled={equipMut.isPending}
                  >
                    {item.equipped ? "Unequip" : "Equip"}
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    className="w-full rounded-xl"
                    onClick={() => handlePurchase(item)}
                    disabled={purchaseMut.isPending || balance < item.price}
                    variant={balance < item.price ? "outline" : "default"}
                  >
                    {balance < item.price ? (
                      <span className="text-muted-foreground text-xs">Need {item.price - balance} more pts</span>
                    ) : (
                      <>
                        <ShoppingBag className="w-3.5 h-3.5 mr-1.5" />
                        Buy for {item.price} pts
                      </>
                    )}
                  </Button>
                )}
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}

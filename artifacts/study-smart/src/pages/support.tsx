import { useState, useEffect } from "react";
import { Layout } from "@/components/layout";
import { useQuery, useMutation } from "@tanstack/react-query";
import { customFetch } from "@workspace/api-client-react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Heart, Coffee, Star, Trophy, Zap, Gem, Rocket,
  CheckCircle2, XCircle, Loader2, ShoppingBag, Coins, Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import { useQueryClient } from "@tanstack/react-query";
import { cn } from "@/lib/utils";

interface Price {
  id: string;
  unit_amount: number;
  currency: string;
  recurring: null | { interval: string };
}

interface Product {
  id: string;
  name: string;
  description: string;
  metadata: Record<string, string>;
  prices: Price[];
}

const COIN_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  "Starter Pack": Zap,
  "Value Pack": Gem,
  "Mega Pack": Rocket,
};

const COIN_GRADIENTS: Record<string, string> = {
  "Starter Pack": "from-sky-400 to-blue-500",
  "Value Pack": "from-violet-500 to-purple-600",
  "Mega Pack": "from-rose-500 to-pink-600",
};

const COIN_BG: Record<string, string> = {
  "Starter Pack": "from-sky-500/10 to-blue-500/5 border-sky-500/20",
  "Value Pack": "from-violet-500/10 to-purple-500/5 border-violet-500/20",
  "Mega Pack": "from-rose-500/10 to-pink-500/5 border-rose-500/20",
};

const SUPPORT_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  Supporter: Coffee,
  Champion: Star,
  Legend: Trophy,
};

const SUPPORT_GRADIENTS: Record<string, string> = {
  Supporter: "from-amber-500 to-orange-500",
  Champion: "from-blue-500 to-indigo-500",
  Legend: "from-purple-500 to-pink-500",
};

function formatAmount(unitAmount: number, currency: string) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency.toUpperCase(),
    minimumFractionDigits: 2,
  }).format(unitAmount / 100);
}

function formatPoints(pts: number) {
  return pts >= 1000 ? `${(pts / 1000).toFixed(pts % 1000 === 0 ? 0 : 1)}k` : String(pts);
}

export default function Support() {
  const [location] = useLocation();
  const queryClient = useQueryClient();
  const [loadingPriceId, setLoadingPriceId] = useState<string | null>(null);
  const [claimedPoints, setClaimedPoints] = useState<number | null>(null);
  const [claiming, setClaiming] = useState(false);

  const params = new URLSearchParams(window.location.search);
  const isSuccess = params.get("success") === "1";
  const isCanceled = params.get("canceled") === "1";
  const sessionId = params.get("session_id");

  useEffect(() => {
    if (isSuccess && sessionId && !claiming && claimedPoints === null) {
      setClaiming(true);
      customFetch("/api/stripe/claim", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId }),
      })
        .then(r => r.json())
        .then((data: { pointsAwarded?: number; alreadyClaimed?: boolean }) => {
          setClaimedPoints(data.pointsAwarded ?? 0);
          if ((data.pointsAwarded ?? 0) > 0) {
            queryClient.invalidateQueries({ queryKey: ["shop-items"] });
          }
        })
        .catch(() => setClaimedPoints(0))
        .finally(() => setClaiming(false));
    }
  }, [isSuccess, sessionId]);

  const { data, isLoading, isError } = useQuery({
    queryKey: ["stripe-products"],
    queryFn: async () => {
      const res = await customFetch("/api/stripe/products");
      if (!res.ok) throw new Error("Failed to load products");
      const json = await res.json() as { data: Product[] };
      return json.data.filter(p => p.prices.length > 0);
    },
  });

  const coinPacks = data?.filter(p => p.metadata?.category === "coins") ?? [];
  const supportTiers = data?.filter(p => p.metadata?.category === "support") ?? [];

  const checkoutMutation = useMutation({
    mutationFn: async (priceId: string) => {
      setLoadingPriceId(priceId);
      const res = await customFetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ priceId }),
      });
      if (!res.ok) {
        const err = await res.json() as { error: string };
        throw new Error(err.error || "Checkout failed");
      }
      const { url } = await res.json() as { url: string };
      return url;
    },
    onSuccess: (url) => {
      window.location.href = url;
    },
    onSettled: () => {
      setLoadingPriceId(null);
    },
  });

  return (
    <Layout title="Store">
      <div className="max-w-2xl mx-auto space-y-8 pb-12">

        {/* Success banner */}
        <AnimatePresence>
          {isSuccess && (
            <motion.div
              initial={{ opacity: 0, y: -12 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-start gap-3 p-4 rounded-2xl bg-green-500/10 border border-green-500/20 text-green-700 dark:text-green-400"
            >
              <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold">Payment successful!</p>
                {claiming && (
                  <p className="text-sm opacity-80 flex items-center gap-1.5 mt-0.5">
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    Crediting your account…
                  </p>
                )}
                {!claiming && claimedPoints !== null && claimedPoints > 0 && (
                  <p className="text-sm opacity-80 mt-0.5">
                    <span className="font-bold">+{claimedPoints.toLocaleString()} pts</span> have been added to your balance. Enjoy!
                  </p>
                )}
                {!claiming && claimedPoints !== null && claimedPoints === 0 && (
                  <p className="text-sm opacity-80 mt-0.5">Thank you for your support! It means the world to us.</p>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Canceled banner */}
        <AnimatePresence>
          {isCanceled && (
            <motion.div
              initial={{ opacity: 0, y: -12 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-3 p-4 rounded-2xl bg-muted border border-border text-muted-foreground"
            >
              <XCircle className="w-5 h-5 shrink-0" />
              <p className="text-sm">No worries — your payment was cancelled. Feel free to come back anytime!</p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-4"
        >
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-xl shadow-primary/20 shrink-0">
            <ShoppingBag className="w-7 h-7 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Mind Forge Store</h2>
            <p className="text-muted-foreground text-sm">Boost your balance or support the team</p>
          </div>
        </motion.div>

        {isLoading && (
          <div className="flex justify-center py-16">
            <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
          </div>
        )}

        {isError && (
          <div className="text-center py-10 text-muted-foreground">
            <p>Could not load the store. Please try again later.</p>
          </div>
        )}

        {/* Coin Packs */}
        {coinPacks.length > 0 && (
          <motion.section
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.08 }}
            className="space-y-4"
          >
            <div className="flex items-center gap-2">
              <Coins className="w-5 h-5 text-amber-500" />
              <h3 className="font-bold text-lg">Point Packs</h3>
              <span className="text-xs text-muted-foreground font-normal ml-1">Instantly boost your in-app balance</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {coinPacks.map((product, i) => {
                const Icon = COIN_ICONS[product.name] ?? Sparkles;
                const gradient = COIN_GRADIENTS[product.name] ?? "from-primary to-accent";
                const bg = COIN_BG[product.name] ?? "from-primary/10 to-accent/5 border-primary/20";
                const price = product.prices[0];
                const bonusPoints = parseInt(product.metadata?.bonus_points ?? "0", 10);
                const isLoadingThis = loadingPriceId === price.id;

                return (
                  <motion.div
                    key={product.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.12 + i * 0.06 }}
                    className={cn(
                      "relative rounded-2xl border bg-gradient-to-b p-5 flex flex-col gap-4",
                      bg
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center shrink-0 shadow-lg`}>
                        <Icon className="w-5 h-5 text-white" />
                      </div>
                      <div className="min-w-0">
                        <p className="font-bold text-sm leading-tight">{product.name}</p>
                        <div className="flex items-center gap-1 mt-0.5">
                          <Coins className="w-3 h-3 text-amber-500 shrink-0" />
                          <span className="text-xs font-semibold text-amber-600 dark:text-amber-400">
                            {bonusPoints.toLocaleString()} pts
                          </span>
                        </div>
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed flex-1">{product.description}</p>
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xl font-bold">{formatAmount(price.unit_amount, price.currency)}</span>
                      <Button
                        size="sm"
                        className={`bg-gradient-to-r ${gradient} text-white border-0 hover:opacity-90 transition-opacity shrink-0`}
                        onClick={() => checkoutMutation.mutate(price.id)}
                        disabled={checkoutMutation.isPending}
                      >
                        {isLoadingThis ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          "Buy"
                        )}
                      </Button>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </motion.section>
        )}

        {/* Divider */}
        {coinPacks.length > 0 && supportTiers.length > 0 && (
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border/50" />
            </div>
            <div className="relative flex justify-center">
              <span className="bg-background px-3 text-xs text-muted-foreground">or</span>
            </div>
          </div>
        )}

        {/* Support Tiers */}
        {supportTiers.length > 0 && (
          <motion.section
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="space-y-4"
          >
            <div className="flex items-center gap-2">
              <Heart className="w-5 h-5 text-rose-500" />
              <h3 className="font-bold text-lg">Support the Team</h3>
              <span className="text-xs text-muted-foreground font-normal ml-1">Help keep Mind Forge free for everyone</span>
            </div>
            <div className="grid gap-3">
              {supportTiers.map((product, i) => {
                const Icon = SUPPORT_ICONS[product.name] ?? Heart;
                const gradient = SUPPORT_GRADIENTS[product.name] ?? "from-rose-500 to-pink-500";
                const price = product.prices[0];
                const emoji = product.metadata?.emoji ?? "💙";
                const isLoadingThis = loadingPriceId === price.id;

                return (
                  <motion.div
                    key={product.id}
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.24 + i * 0.06 }}
                    className="rounded-2xl border border-border/60 bg-card p-4 flex items-center gap-4"
                  >
                    <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center shrink-0 shadow-md`}>
                      <Icon className="w-5 h-5 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span>{emoji}</span>
                        <h4 className="font-bold text-sm">{product.name}</h4>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5 leading-snug">{product.description}</p>
                    </div>
                    <div className="shrink-0 text-right space-y-1.5">
                      <p className="text-lg font-bold">{formatAmount(price.unit_amount, price.currency)}</p>
                      <Button
                        size="sm"
                        variant="outline"
                        className={`border-0 text-white bg-gradient-to-r ${gradient} hover:opacity-90 transition-opacity`}
                        onClick={() => checkoutMutation.mutate(price.id)}
                        disabled={checkoutMutation.isPending}
                      >
                        {isLoadingThis ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          "Donate"
                        )}
                      </Button>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </motion.section>
        )}

        {data && data.length === 0 && !isLoading && (
          <div className="text-center py-10 text-muted-foreground">
            <ShoppingBag className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p className="font-medium">Store coming soon</p>
            <p className="text-sm mt-1">Check back shortly!</p>
          </div>
        )}

        {/* Footer */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="text-center text-xs text-muted-foreground space-y-1 pt-2"
        >
          <p>Payments are processed securely by Stripe.</p>
          <p>All purchases are one-time — no subscriptions or hidden fees.</p>
        </motion.div>
      </div>
    </Layout>
  );
}

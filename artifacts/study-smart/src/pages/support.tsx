import { useState } from "react";
import { Layout } from "@/components/layout";
import { useQuery, useMutation } from "@tanstack/react-query";
import { customFetch } from "@workspace/api-client-react";
import { motion } from "framer-motion";
import { Heart, Coffee, Star, Trophy, CheckCircle2, XCircle, Loader2, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";

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

const TIER_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  Supporter: Coffee,
  Champion: Star,
  Legend: Trophy,
};

const TIER_GRADIENTS: Record<string, string> = {
  Supporter: "from-amber-500 to-orange-500",
  Champion: "from-blue-500 to-indigo-500",
  Legend: "from-purple-500 to-pink-500",
};

const TIER_BG: Record<string, string> = {
  Supporter: "bg-amber-500/10 border-amber-500/20",
  Champion: "bg-blue-500/10 border-blue-500/20",
  Legend: "bg-purple-500/10 border-purple-500/20",
};

function formatAmount(unitAmount: number, currency: string) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency.toUpperCase(),
    minimumFractionDigits: 0,
  }).format(unitAmount / 100);
}

export default function Support() {
  const [location] = useLocation();
  const [loadingPriceId, setLoadingPriceId] = useState<string | null>(null);

  const isSuccess = location.includes("success=1") || new URLSearchParams(window.location.search).get("success") === "1";
  const isCanceled = location.includes("canceled=1") || new URLSearchParams(window.location.search).get("canceled") === "1";

  const { data, isLoading, isError } = useQuery({
    queryKey: ["stripe-products"],
    queryFn: async () => {
      const res = await customFetch("/api/stripe/products");
      if (!res.ok) throw new Error("Failed to load support tiers");
      const json = await res.json() as { data: Product[] };
      return json.data.filter(p => p.prices.length > 0);
    },
  });

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
    <Layout title="Support Us">
      <div className="max-w-2xl mx-auto space-y-8 pb-10">

        {isSuccess && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-3 p-4 rounded-2xl bg-green-500/10 border border-green-500/20 text-green-600 dark:text-green-400"
          >
            <CheckCircle2 className="w-5 h-5 shrink-0" />
            <div>
              <p className="font-semibold">Thank you so much!</p>
              <p className="text-sm opacity-80">Your generous support means the world to us and helps keep Mind Forge running.</p>
            </div>
          </motion.div>
        )}

        {isCanceled && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-3 p-4 rounded-2xl bg-muted border border-border text-muted-foreground"
          >
            <XCircle className="w-5 h-5 shrink-0" />
            <p className="text-sm">No worries — your payment was cancelled. Feel free to come back anytime!</p>
          </motion.div>
        )}

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="text-center space-y-3"
        >
          <div className="flex items-center justify-center">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-rose-500 to-pink-500 flex items-center justify-center shadow-xl shadow-rose-500/20">
              <Heart className="w-8 h-8 text-white" />
            </div>
          </div>
          <h2 className="text-2xl font-bold tracking-tight">Help us keep Mind Forge free</h2>
          <p className="text-muted-foreground leading-relaxed max-w-md mx-auto">
            Mind Forge is built with love by a small team. Your support helps us pay for servers,
            build new features, and keep the app free for every student around the world.
          </p>
        </motion.div>

        {isLoading && (
          <div className="flex justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
          </div>
        )}

        {isError && (
          <div className="text-center py-8 text-muted-foreground">
            <p>Could not load support options. Please try again later.</p>
          </div>
        )}

        {data && data.length > 0 && (
          <div className="grid gap-4">
            {data.map((product, i) => {
              const Icon = TIER_ICONS[product.name] ?? Heart;
              const gradient = TIER_GRADIENTS[product.name] ?? "from-rose-500 to-pink-500";
              const bg = TIER_BG[product.name] ?? "bg-rose-500/10 border-rose-500/20";
              const price = product.prices[0];
              const emoji = product.metadata?.emoji ?? "💙";
              const isLoadingThis = loadingPriceId === price.id;

              return (
                <motion.div
                  key={product.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 + i * 0.07 }}
                  className={`rounded-2xl border p-5 flex items-center gap-5 ${bg}`}
                >
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center shrink-0 shadow-lg`}>
                    <Icon className="w-6 h-6 text-white" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{emoji}</span>
                      <h3 className="font-bold text-base">{product.name}</h3>
                    </div>
                    <p className="text-sm text-muted-foreground mt-0.5 leading-snug">{product.description}</p>
                  </div>

                  <div className="shrink-0 text-right space-y-2">
                    <p className="text-xl font-bold">{formatAmount(price.unit_amount, price.currency)}</p>
                    <Button
                      size="sm"
                      className={`bg-gradient-to-r ${gradient} text-white border-0 hover:opacity-90 transition-opacity`}
                      onClick={() => checkoutMutation.mutate(price.id)}
                      disabled={checkoutMutation.isPending}
                    >
                      {isLoadingThis ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <>
                          <ExternalLink className="w-3.5 h-3.5 mr-1.5" />
                          Donate
                        </>
                      )}
                    </Button>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}

        {data && data.length === 0 && !isLoading && (
          <div className="text-center py-8 text-muted-foreground">
            <p>Support tiers are coming soon. Check back shortly!</p>
          </div>
        )}

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="text-center text-xs text-muted-foreground space-y-1"
        >
          <p>Payments are processed securely by Stripe.</p>
          <p>This is a one-time donation — no subscription, no hidden fees.</p>
        </motion.div>
      </div>
    </Layout>
  );
}

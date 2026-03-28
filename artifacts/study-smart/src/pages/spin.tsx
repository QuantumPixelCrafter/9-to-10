import { useState, useRef } from "react";
import { useAuth } from "@workspace/replit-auth-web";
import { useGetPowerups } from "@workspace/api-client-react";
import { customFetch } from "@workspace/api-client-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Layout } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { Ticket, Sparkles, ShoppingBag } from "lucide-react";
import { useLocation } from "wouter";

// ── Wheel segment definitions ─────────────────────────────────────────────────
const SEGMENTS = [
  { id: "grand_prize",    emoji: "🍀", label: "20K pts\n+ Nametag",   color: "#F59E0B", dark: "#92400E" },
  { id: "streak_freezes", emoji: "🧊", label: "5 Streak\nFreezes",     color: "#3B82F6", dark: "#1E3A5F" },
  { id: "objective_pass", emoji: "🎯", label: "Objective\nPass",       color: "#8B5CF6", dark: "#2D1B5A" },
  { id: "message_quota",  emoji: "💬", label: "1500\nQuotas",          color: "#EC4899", dark: "#500E30" },
  { id: "free_spins",     emoji: "🎡", label: "5 Free\nSpins",         color: "#06B6D4", dark: "#0E3A50" },
  { id: "discount_50",    emoji: "🔥", label: "50% Shop\nDiscount",    color: "#EF4444", dark: "#4A0000" },
  { id: "discount_25",    emoji: "🏷️", label: "25% Shop\nDiscount",   color: "#F97316", dark: "#4A1600" },
  { id: "pts_5000",       emoji: "💎", label: "5,000\nPoints",         color: "#10B981", dark: "#0A3B28" },
  { id: "pts_2000",       emoji: "⭐", label: "2,000\nPoints",         color: "#22C55E", dark: "#0F3A1E" },
  { id: "pts_tier9",      emoji: "✨", label: "1500–1990\nPoints",     color: "#84CC16", dark: "#2A3A0A" },
  { id: "pts_tier10",     emoji: "🌟", label: "1000–1490\nPoints",     color: "#EAB308", dark: "#3A2E00" },
  { id: "pts_tier11",     emoji: "💫", label: "500–990\nPoints",       color: "#F59E0B", dark: "#3A2000" },
  { id: "pts_tier12",     emoji: "🎲", label: "10–490\nPoints",        color: "#94A3B8", dark: "#1E2D3A" },
];

const NUM_SEGMENTS = SEGMENTS.length;
const SEGMENT_ANGLE = 360 / NUM_SEGMENTS;

type SpinResult = {
  segmentId: string;
  rewardDescription: string;
  bonusPts?: number;
  vouchersLeft: number;
};

// ── SVG Wheel ─────────────────────────────────────────────────────────────────
function WheelSVG({ rotation }: { rotation: number }) {
  const R = 160;
  const cx = R, cy = R;

  function segmentPath(i: number) {
    const a0 = ((i * SEGMENT_ANGLE) - 90) * (Math.PI / 180);
    const a1 = (((i + 1) * SEGMENT_ANGLE) - 90) * (Math.PI / 180);
    const x0 = cx + R * Math.cos(a0);
    const y0 = cy + R * Math.sin(a0);
    const x1 = cx + R * Math.cos(a1);
    const y1 = cy + R * Math.sin(a1);
    return `M ${cx} ${cy} L ${x0} ${y0} A ${R} ${R} 0 0 1 ${x1} ${y1} Z`;
  }

  function emojiPos(i: number) {
    const mid = ((i + 0.5) * SEGMENT_ANGLE - 90) * (Math.PI / 180);
    const r = R * 0.68;
    return { x: cx + r * Math.cos(mid), y: cy + r * Math.sin(mid) };
  }

  return (
    <svg
      width={R * 2} height={R * 2}
      style={{ transform: `rotate(${rotation}deg)`, transition: "transform 4s cubic-bezier(0.17,0.67,0.12,0.99)" }}
    >
      {SEGMENTS.map((seg, i) => {
        const { x, y } = emojiPos(i);
        return (
          <g key={seg.id}>
            <path d={segmentPath(i)} fill={seg.color} stroke="white" strokeWidth="1.5" />
            <text x={x} y={y} textAnchor="middle" dominantBaseline="middle"
              fontSize="16" style={{ userSelect: "none", pointerEvents: "none" }}>
              {seg.emoji}
            </text>
          </g>
        );
      })}
      {/* Center hub */}
      <circle cx={cx} cy={cy} r={20} fill="white" stroke="#e2e8f0" strokeWidth="2" />
      <circle cx={cx} cy={cy} r={10} fill="#6366f1" />
    </svg>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function SpinPage() {
  const { isAuthenticated } = useAuth();
  const qc = useQueryClient();
  const [, setLocation] = useLocation();
  const { data: powerupsData, refetch: refetchPowerups } = useGetPowerups();

  const [rotation, setRotation] = useState(0);
  const [isSpinning, setIsSpinning] = useState(false);
  const [result, setResult] = useState<SpinResult | null>(null);
  const [showResult, setShowResult] = useState(false);
  const spinTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const voucherQty = powerupsData?.inventory.find(p => p.key === "spinning_voucher")?.quantity ?? 0;

  const spinMut = useMutation({
    mutationFn: () => customFetch<SpinResult>("/api/spin/wheel", { method: "POST" }),
  });

  const handleSpin = async () => {
    if (isSpinning || voucherQty <= 0) return;
    setIsSpinning(true);
    setResult(null);
    setShowResult(false);

    try {
      const spinResult = await spinMut.mutateAsync();

      const segIndex = SEGMENTS.findIndex(s => s.id === spinResult.segmentId);
      const segIndex2 = segIndex === -1 ? 0 : segIndex;

      // Bring segment centre to top (pointer). The segment centre is at (segIndex + 0.5) * SEGMENT_ANGLE from top.
      // To place it at the pointer (top), we need to rotate the wheel so that offset is at 0°.
      const targetAngle = 360 - (segIndex2 + 0.5) * SEGMENT_ANGLE;
      const currentMod = rotation % 360;
      const diff = ((targetAngle - currentMod) % 360 + 360) % 360;
      const newRotation = rotation + 5 * 360 + diff;

      setRotation(newRotation);

      if (spinTimeoutRef.current) clearTimeout(spinTimeoutRef.current);
      spinTimeoutRef.current = setTimeout(() => {
        setResult(spinResult);
        setShowResult(true);
        setIsSpinning(false);
        refetchPowerups();
        qc.invalidateQueries({ queryKey: ["userBalance"] });
      }, 4200);
    } catch {
      setIsSpinning(false);
    }
  };

  const seg = result ? SEGMENTS.find(s => s.id === result.segmentId) : null;

  return (
    <Layout title="Wheel of Fortune">
      <div className="max-w-lg mx-auto py-6 space-y-6">

        {/* Header */}
        <div className="text-center space-y-1">
          <h1 className="text-2xl font-extrabold tracking-tight">🎡 Wheel of Fortune</h1>
          <p className="text-muted-foreground text-sm">Spend a Spinning Voucher to win amazing rewards</p>
        </div>

        {/* Voucher count */}
        <div className="flex items-center justify-between bg-muted/40 rounded-2xl px-4 py-3">
          <div className="flex items-center gap-2 text-sm font-medium">
            <Ticket className="w-4 h-4 text-primary" />
            <span>Spinning Vouchers</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xl font-extrabold text-primary">{voucherQty}</span>
            <Button size="sm" variant="outline" className="rounded-xl h-7 text-xs gap-1 px-2"
              onClick={() => setLocation("/shop?tab=powerups")}>
              <ShoppingBag className="w-3 h-3" /> Buy (1,000 pts)
            </Button>
          </div>
        </div>

        {/* Wheel */}
        <div className="flex flex-col items-center gap-4">
          {/* Pointer */}
          <div className="relative">
            <div className="absolute left-1/2 -translate-x-1/2 -top-3 z-10 w-0 h-0"
              style={{ borderLeft: "10px solid transparent", borderRight: "10px solid transparent", borderTop: "20px solid #6366f1" }} />
            <div className="rounded-full overflow-hidden shadow-2xl">
              <WheelSVG rotation={rotation} />
            </div>
          </div>

          {/* Spin button */}
          <Button
            onClick={handleSpin}
            disabled={isSpinning || !isAuthenticated || voucherQty <= 0}
            className="w-48 h-12 rounded-2xl text-base font-bold bg-gradient-to-r from-violet-500 to-purple-600 border-0 shadow-lg shadow-violet-500/30 gap-2"
          >
            {isSpinning
              ? <><Sparkles className="w-4 h-4 animate-spin" /> Spinning…</>
              : voucherQty <= 0
                ? "No Vouchers"
                : <><Ticket className="w-4 h-4" /> SPIN!</>
            }
          </Button>
        </div>

        {/* Result */}
        <AnimatePresence>
          {showResult && result && seg && (
            <motion.div
              key="result"
              initial={{ opacity: 0, scale: 0.85, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="rounded-3xl p-6 text-center space-y-3 border-2"
              style={{ borderColor: seg.color + "60", backgroundColor: seg.color + "18" }}
            >
              <div className="text-5xl">{seg.emoji}</div>
              <div className="font-extrabold text-xl">{result.rewardDescription}</div>
              {result.bonusPts && (
                <div className="inline-flex items-center gap-1.5 bg-amber-500/15 text-amber-600 dark:text-amber-400 text-sm font-bold px-3 py-1 rounded-full border border-amber-400/30">
                  <Sparkles className="w-3.5 h-3.5" /> +{result.bonusPts.toLocaleString()} points added
                </div>
              )}
              <p className="text-xs text-muted-foreground">
                {result.vouchersLeft} voucher{result.vouchersLeft !== 1 ? "s" : ""} remaining
              </p>
              {result.vouchersLeft > 0 && (
                <Button size="sm" className="rounded-xl gap-2 bg-gradient-to-r from-violet-500 to-purple-600 border-0"
                  onClick={() => { setShowResult(false); setResult(null); }}>
                  <Ticket className="w-3.5 h-3.5" /> Spin Again
                </Button>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Reward table */}
        <div className="rounded-2xl border bg-card p-4 space-y-3">
          <h3 className="font-bold text-sm">Possible Rewards</h3>
          <div className="space-y-1.5">
            {SEGMENTS.map(seg => (
              <div key={seg.id} className="flex items-center gap-2.5 text-sm">
                <span className="text-base">{seg.emoji}</span>
                <span className="flex-1 text-muted-foreground">{seg.label.replace("\n", " ")}</span>
                <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: seg.color }} />
              </div>
            ))}
          </div>
        </div>

      </div>
    </Layout>
  );
}

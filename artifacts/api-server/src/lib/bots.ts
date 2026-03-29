/**
 * Leaderboard bots — purely visual, injected at response time only.
 * No DB entries are created. Reward distribution (distributeRewards) operates
 * on real DB scores only, so bots never receive XP or coins.
 *
 * WEEKLY CALIBRATION (week of 2025-03-28 — testing week):
 *   Scores are set conservatively since no real user baseline exists yet.
 *   Each Monday, check the top human score per board and update the
 *   stand-out bot scores so they stay ~5–10% above the human peak,
 *   keeping the board competitive but beatable.
 */

export interface BotEntry {
  userId: string;
  displayName: string;
  isBot: true;
}

interface BotScore extends BotEntry {
  score: number;
}

const BOT_CREATED_AT = "2025-03-28T08:00:00.000Z";

// ── Bot personas ──────────────────────────────────────────────────────────────
// Stand-out bots (★) sit at the top of each board — still beatable by ~5–10%.
// Regular bots fill the mid-table to keep boards looking active.

const BOTS = {
  // Stand-outs
  zara_m:    { userId: "bot_zara_m",    displayName: "Zara M.",     isBot: true as const },
  tylerw:    { userId: "bot_tylerw",    displayName: "TylerW",      isBot: true as const },
  // Mid-pack
  sophie_j:  { userId: "bot_sophie_j",  displayName: "Sophie_J",    isBot: true as const },
  liam_r:    { userId: "bot_liam_r",    displayName: "Liam R.",      isBot: true as const },
  noah_k:    { userId: "bot_noah_k",    displayName: "NoahK",        isBot: true as const },
  emma_c:    { userId: "bot_emma_c",    displayName: "Emma C.",      isBot: true as const },
  alex99:    { userId: "bot_alex99",    displayName: "alex99",        isBot: true as const },
  priya_s:   { userId: "bot_priya_s",   displayName: "Priya_S",      isBot: true as const },
  james_b:   { userId: "bot_james_b",   displayName: "JamesB",        isBot: true as const },
  mia_ht:    { userId: "bot_mia_ht",    displayName: "mia_ht",        isBot: true as const },
};

// ── Per-board bot scores ──────────────────────────────────────────────────────

/** Bubble Pop — score = bubbles popped in a round */
export const BUBBLE_POP_BOTS: BotScore[] = [
  { ...BOTS.zara_m,   score: 45 }, // ★ stand-out
  { ...BOTS.tylerw,   score: 40 }, // ★ stand-out
  { ...BOTS.sophie_j, score: 32 },
  { ...BOTS.liam_r,   score: 26 },
  { ...BOTS.noah_k,   score: 21 },
  { ...BOTS.emma_c,   score: 17 },
  { ...BOTS.alex99,   score: 13 },
];

/** Memory Match — score = raw game score submitted */
export const MEMORY_MATCH_BOTS: BotScore[] = [
  { ...BOTS.emma_c,   score: 28 }, // ★ stand-out
  { ...BOTS.liam_r,   score: 24 }, // ★ stand-out
  { ...BOTS.priya_s,  score: 19 },
  { ...BOTS.noah_k,   score: 15 },
  { ...BOTS.alex99,   score: 11 },
  { ...BOTS.james_b,  score: 8  },
];

/** Quiz — score = percentage (0–100) */
export const QUIZ_BOTS: BotScore[] = [
  { ...BOTS.priya_s,  score: 92 }, // ★ stand-out
  { ...BOTS.mia_ht,   score: 88 }, // ★ stand-out
  { ...BOTS.sophie_j, score: 76 },
  { ...BOTS.noah_k,   score: 65 },
  { ...BOTS.liam_r,   score: 55 },
  { ...BOTS.james_b,  score: 47 },
  { ...BOTS.alex99,   score: 40 },
];

/** Math Blitz Easy — score = correct answers in 60 s */
export const MATH_BLITZ_EASY_BOTS: BotScore[] = [
  { ...BOTS.alex99,   score: 18 }, // ★ stand-out
  { ...BOTS.emma_c,   score: 16 }, // ★ stand-out
  { ...BOTS.liam_r,   score: 12 },
  { ...BOTS.priya_s,  score: 10 },
  { ...BOTS.mia_ht,   score: 8  },
  { ...BOTS.james_b,  score: 6  },
];

/** Math Blitz Normal — score = correct answers in 60 s */
export const MATH_BLITZ_NORMAL_BOTS: BotScore[] = [
  { ...BOTS.zara_m,   score: 13 }, // ★ stand-out
  { ...BOTS.tylerw,   score: 11 }, // ★ stand-out
  { ...BOTS.noah_k,   score: 8  },
  { ...BOTS.sophie_j, score: 6  },
  { ...BOTS.liam_r,   score: 5  },
  { ...BOTS.alex99,   score: 4  },
];

/** Math Blitz Hard (shared Hard + Extreme board) — score = correct answers */
export const MATH_BLITZ_HARD_BOTS: BotScore[] = [
  { ...BOTS.mia_ht,   score: 9 }, // ★ stand-out
  { ...BOTS.priya_s,  score: 7 }, // ★ stand-out
  { ...BOTS.tylerw,   score: 5 },
  { ...BOTS.emma_c,   score: 4 },
  { ...BOTS.james_b,  score: 3 },
];

// ── Merge helper ──────────────────────────────────────────────────────────────

type LeaderboardEntry = {
  id?: number;
  rank?: number;
  userId: string;
  displayName: string;
  profileImageUrl: null | string;
  profileViewable?: boolean;
  gameType?: string;
  score: number;
  subject?: null | string;
  userLevel?: null | string;
  createdAt?: string;
  equippedNametag?: null | string;
  gameLevel?: number;
  isBot?: true;
};

/**
 * Merges real leaderboard entries with bot entries, sorts by score descending,
 * and re-assigns sequential ranks. The returned array is limited to `limit`.
 */
export function mergeWithBots(
  real: LeaderboardEntry[],
  bots: BotScore[],
  limit = 50,
  useRank = false,
): LeaderboardEntry[] {
  const botEntries: LeaderboardEntry[] = bots.map(b => ({
    userId: b.userId,
    displayName: b.displayName,
    profileImageUrl: null,
    profileViewable: false,
    score: b.score,
    subject: null,
    userLevel: null,
    createdAt: BOT_CREATED_AT,
    equippedNametag: null,
    gameLevel: 1,
    isBot: true as const,
  }));

  const merged = [...real, ...botEntries].sort((a, b) => b.score - a.score).slice(0, limit);

  return merged.map((entry, i) => ({
    ...entry,
    ...(useRank ? { rank: i + 1 } : { id: i + 1 }),
  }));
}

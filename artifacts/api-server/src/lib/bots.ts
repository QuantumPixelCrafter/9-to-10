/**
 * Leaderboard bots — purely visual, injected at response time only.
 * No DB entries are created. Reward distribution operates on real DB
 * scores only, so bots never receive XP or coins.
 *
 * WEEKLY CALIBRATION:
 *   Each Monday, check top human scores per board and nudge stand-out
 *   bot scores (~5–10% above the human peak) to keep boards competitive
 *   but beatable. All scores live in this one file.
 *
 * Current calibration: week of 2025-03-28 (testing baseline — conservative).
 */

import { getLevelProgress } from "./xp";

export interface BotScore {
  userId: string;
  displayName: string;
  isBot: true;
  score: number;
  userLevel?: string;
}

export interface LevelBoardBot {
  userId: string;
  displayName: string;
  isBot: true;
  xp: number;
  gameLevel: number;
  level: string | null;
}

// ─── Bot personas ─────────────────────────────────────────────────────────────

const B = (id: string, name: string) =>
  ({ userId: `bot_${id}`, displayName: name, isBot: true as const });

// Shared across multiple boards
const ZARA   = B("zara_m",   "Zara M.");
const TYLER  = B("tylerw",   "TylerW");
const SOPHIE = B("sophie_j", "Sophie_J");
const LIAM   = B("liam_r",   "Liam R.");
const EMMA   = B("emma_c",   "Emma C.");
const PRIYA  = B("priya_s",  "Priya_S");
const ALEX   = B("alex99",   "alex99");
const NOAH   = B("noah_k",   "NoahK");
const MIA    = B("mia_ht",   "mia_ht");

// Quiz-only personas
const CHARLIE = B("charlie_p", "charlie_p");
const LUNA    = B("luna_w",    "luna_w");
const AVA     = B("ava_ms",    "Ava M.");
const BEN     = B("ben_lt",    "ben_lt");
const LEO     = B("leo_h",     "Leo H.");
const FINN    = B("finn_a",    "finn_a");
const MAYA    = B("maya_b",    "Maya B.");
const ETHAN   = B("ethan_s",   "EthanS");
const JADE    = B("jade_n",    "Jade N.");
const RIVER   = B("river_d",   "river_d");
const SASHA   = B("sasha_m",   "Sasha M.");
const QUINN   = B("quinn_f",   "QuinnF");
const MORGAN  = B("morgan_k",  "Morgan K.");
const THEO    = B("theo_p",    "theo_p");
const REESE   = B("reese_b",   "Reese B.");
const AVERY   = B("avery_l",   "Avery L.");
const SKYLER  = B("skyler_n",  "Skyler N.");
const DREW    = B("drew_c",    "DrewC");
const ALEX_R  = B("alex_r",    "Alex R.");
const CASEY   = B("casey_w",   "casey_w");

// Level-board-only personas
const NINA    = B("nina_k",    "Nina K.");
const MARK    = B("mark_h",    "Mark H.");
const DEREK   = B("derek_y",   "Derek Y.");
const CAITLIN = B("caitlin_p", "Caitlin P.");
const KAI_M   = B("kai_m",     "KaiM");
const BELLA   = B("bella_r",   "Bella R.");

// ─── Bubble Pop bots ──────────────────────────────────────────────────────────
// Top 30% (top 3 of 9) in 70–110 range to motivate real users.

export const BUBBLE_POP_BOTS: BotScore[] = [
  { ...ZARA,   score: 105 }, // ★ stand-out
  { ...TYLER,  score: 88  }, // ★ stand-out
  { ...SOPHIE, score: 72  }, // ★ stand-out  ← top 3 are all in 70–110
  { ...LIAM,   score: 55  },
  { ...EMMA,   score: 42  },
  { ...PRIYA,  score: 34  },
  { ...ALEX,   score: 25  },
  { ...NOAH,   score: 18  },
  { ...MIA,    score: 12  },
];

// ─── Memory Match bots ────────────────────────────────────────────────────────

export const MEMORY_MATCH_BOTS: BotScore[] = [
  { ...EMMA,  score: 28 }, // ★ stand-out
  { ...LIAM,  score: 24 }, // ★ stand-out
  { ...PRIYA, score: 19 },
  { ...NOAH,  score: 15 },
  { ...ALEX,  score: 11 },
  { ...MIA,   score: 8  },
];

// ─── Quiz bots (accumulated weekly total, 1–3 per level) ─────────────────────
// Scores represent the SUM of all quiz scores in the period.
// Shared bots (LIAM, EMMA, PRIYA, ALEX) appear in both this and Bubble Pop.

export const QUIZ_BOTS: BotScore[] = [
  // P1
  { ...CHARLIE, score: 42, userLevel: "P1" }, // ★
  { ...LUNA,    score: 22, userLevel: "P1" },
  // P2
  { ...AVA,     score: 55, userLevel: "P2" }, // ★
  { ...BEN,     score: 30, userLevel: "P2" },
  // P3
  { ...LEO,     score: 68, userLevel: "P3" }, // ★
  // P4
  { ...FINN,    score: 78, userLevel: "P4" }, // ★
  { ...LIAM,    score: 45, userLevel: "P4" }, // shared with Bubble Pop
  // P5
  { ...MAYA,    score: 88, userLevel: "P5" }, // ★
  { ...ETHAN,   score: 52, userLevel: "P5" },
  // P6
  { ...JADE,    score: 95, userLevel: "P6" }, // ★
  { ...ALEX,    score: 58, userLevel: "P6" }, // shared with Bubble Pop
  // S1
  { ...RIVER,   score: 108, userLevel: "S1" }, // ★
  { ...EMMA,    score: 62,  userLevel: "S1" }, // shared with Bubble Pop
  { ...SASHA,   score: 45,  userLevel: "S1" },
  // S2
  { ...QUINN,   score: 122, userLevel: "S2" }, // ★
  { ...PRIYA,   score: 72,  userLevel: "S2" }, // shared with Bubble Pop
  // S3
  { ...MORGAN,  score: 135, userLevel: "S3" }, // ★
  { ...THEO,    score: 80,  userLevel: "S3" },
  // S4
  { ...REESE,   score: 148, userLevel: "S4" }, // ★
  { ...AVERY,   score: 90,  userLevel: "S4" },
  // S5
  { ...SKYLER,  score: 158, userLevel: "S5" }, // ★
  { ...DREW,    score: 95,  userLevel: "S5" },
  // Uni
  { ...ALEX_R,  score: 172, userLevel: "Uni" }, // ★
  { ...CASEY,   score: 108, userLevel: "Uni" },
];

// ─── Math Blitz bots ─────────────────────────────────────────────────────────

export const MATH_BLITZ_EASY_BOTS: BotScore[] = [
  { ...ALEX,  score: 18 }, // ★
  { ...EMMA,  score: 16 }, // ★
  { ...LIAM,  score: 12 },
  { ...PRIYA, score: 10 },
  { ...MIA,   score: 8  },
  { ...MIA,   score: 6  },
];

export const MATH_BLITZ_NORMAL_BOTS: BotScore[] = [
  { ...ZARA,   score: 13 }, // ★
  { ...TYLER,  score: 11 }, // ★
  { ...NOAH,   score: 8  },
  { ...SOPHIE, score: 6  },
  { ...LIAM,   score: 5  },
  { ...ALEX,   score: 4  },
];

export const MATH_BLITZ_HARD_BOTS: BotScore[] = [
  { ...MIA,   score: 9 }, // ★
  { ...PRIYA, score: 7 }, // ★
  { ...TYLER, score: 5 },
  { ...EMMA,  score: 4 },
  { ...MIA,   score: 3 },
];

// ─── Level board bots ────────────────────────────────────────────────────────
// Sorted by XP descending. Shared personas (Zara, Sophie, Tyler) tie the boards
// together so the same "player" appears across multiple leaderboards.

export const LEVEL_BOARD_BOTS: LevelBoardBot[] = [
  { ...NINA,    xp: 3500, gameLevel: 30, level: "Uni" },  // ★ stand-out
  { ...MARK,    xp: 2750, gameLevel: 25, level: "S5"  },  // ★ stand-out
  { ...ZARA,    xp: 2050, gameLevel: 20, level: "S3"  },  // shared with Bubble Pop
  { ...DEREK,   xp: 1550, gameLevel: 17, level: "S2"  },
  { ...CAITLIN, xp: 1250, gameLevel: 15, level: "S1"  },
  { ...SOPHIE,  xp: 920,  gameLevel: 12, level: "P6"  },  // shared with Bubble Pop
  { ...KAI_M,   xp: 650,  gameLevel: 9,  level: "S1"  },
  { ...BELLA,   xp: 430,  gameLevel: 7,  level: "P4"  },
  { ...TYLER,   xp: 205,  gameLevel: 5,  level: "P5"  },  // shared with Bubble Pop
];

// ─── Merge helpers ────────────────────────────────────────────────────────────

type LeaderboardEntry = Record<string, unknown> & { score: number };

/**
 * Merges real leaderboard entries with bot entries.
 * For quiz boards, pass `userLevelFilter` to only include level-matching bots.
 * When omitted, all bots are included (useful when no level filter is active).
 */
export function mergeWithBots(
  real: LeaderboardEntry[],
  bots: BotScore[],
  limit = 50,
  useRank = false,
  userLevelFilter?: string,
): LeaderboardEntry[] {
  const filtered = userLevelFilter !== undefined
    ? bots.filter(b => b.userLevel === userLevelFilter)
    : bots;

  const botEntries: LeaderboardEntry[] = filtered.map(b => ({
    userId: b.userId,
    displayName: b.displayName,
    profileImageUrl: null,
    profileViewable: false,
    score: b.score,
    subject: null,
    userLevel: b.userLevel ?? null,
    createdAt: "2025-03-28T08:00:00.000Z",
    equippedNametag: null,
    gameLevel: 1,
    isBot: true,
  }));

  const merged = [...real, ...botEntries]
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);

  return merged.map((entry, i) => ({
    ...entry,
    ...(useRank ? { rank: i + 1 } : { id: i + 1 }),
  }));
}

/**
 * Merges real level board entries with level-board bot entries, sorts by XP,
 * and re-assigns sequential ranks. Bot entries get their levelProgress computed.
 */
export function mergeLevelBoardWithBots(
  real: LeaderboardEntry[],
  bots: LevelBoardBot[],
  limit = 50,
): LeaderboardEntry[] {
  const botEntries: LeaderboardEntry[] = bots.map(b => ({
    userId: b.userId,
    displayName: b.displayName,
    profileImageUrl: null,
    profileViewable: false,
    score: b.xp,
    xp: b.xp,
    gameLevel: b.gameLevel,
    level: b.level,
    equippedNametag: null,
    levelProgress: getLevelProgress(b.xp),
    isBot: true,
  }));

  const merged = [...real, ...botEntries]
    .sort((a, b) => (b.xp as number) - (a.xp as number))
    .slice(0, limit);

  return merged.map((entry, i) => ({ ...entry, rank: i + 1 }));
}

export interface ShopItemDef {
  key: string;
  name: string;
  type: "background" | "frame" | "nametag";
  colors?: string[];
  emoji?: string;
}

export const SHOP_ITEM_DEFS: ShopItemDef[] = [
  { key: "bg_sunset",   name: "Sunset",    type: "background", colors: ["#F97316", "#EC4899"] },
  { key: "bg_ocean",    name: "Ocean",     type: "background", colors: ["#3B82F6", "#06B6D4"] },
  { key: "bg_forest",   name: "Forest",    type: "background", colors: ["#10B981", "#16A34A"] },
  { key: "bg_galaxy",   name: "Galaxy",    type: "background", colors: ["#4F46E5", "#7C3AED"] },
  { key: "bg_candy",    name: "Candy",     type: "background", colors: ["#F9A8D4", "#C084FC"] },
  { key: "bg_fire",     name: "Flame",     type: "background", colors: ["#EF4444", "#F97316"] },
  { key: "bg_mint",     name: "Mint",      type: "background", colors: ["#34D399", "#67E8F9"] },
  { key: "bg_midnight", name: "Midnight",  type: "background", colors: ["#1E1B4B", "#0F172A"] },
  { key: "frame_gold",     name: "Golden",   type: "frame", colors: ["#F59E0B", "#D97706"] },
  { key: "frame_neon",     name: "Neon",     type: "frame", colors: ["#22D3EE", "#10B981"] },
  { key: "frame_crystal",  name: "Crystal",  type: "frame", colors: ["#BAE6FD", "#7DD3FC"] },
  { key: "frame_rainbow",  name: "Rainbow",  type: "frame", colors: ["#F97316", "#EAB308", "#22C55E", "#3B82F6", "#8B5CF6"] },
  { key: "frame_rose",     name: "Rose",     type: "frame", colors: ["#FB7185", "#F43F5E"] },
  { key: "frame_platinum", name: "Platinum", type: "frame", colors: ["#CBD5E1", "#94A3B8"] },
  { key: "tag_rookie",    name: "Rookie",    type: "nametag", emoji: "🌱" },
  { key: "tag_scholar",   name: "Scholar",   type: "nametag", emoji: "📚" },
  { key: "tag_genius",    name: "Genius",    type: "nametag", emoji: "🧠" },
  { key: "tag_champion",  name: "Champion",  type: "nametag", emoji: "🏆" },
  { key: "tag_artist",    name: "Artist",    type: "nametag", emoji: "🎨" },
  { key: "tag_legend",    name: "Legend",    type: "nametag", emoji: "⚡" },
  { key: "tag_explorer",  name: "Explorer",  type: "nametag", emoji: "🌍" },
];

export function getItemDef(key: string | null | undefined): ShopItemDef | undefined {
  if (!key) return undefined;
  return SHOP_ITEM_DEFS.find(i => i.key === key);
}

export function getBgStyle(key: string | null | undefined): string {
  const item = getItemDef(key);
  if (!item?.colors) return "linear-gradient(135deg, hsl(var(--primary)), #7c3aed, hsl(var(--accent)))";
  return `linear-gradient(135deg, ${item.colors.join(", ")})`;
}

export function getFrameGradient(key: string | null | undefined): string | null {
  const item = getItemDef(key);
  if (!item?.colors) return null;
  return `linear-gradient(135deg, ${item.colors.join(", ")})`;
}

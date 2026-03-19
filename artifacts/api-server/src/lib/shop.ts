export type ShopItemType = "background" | "frame" | "nametag";

export interface ShopItem {
  key: string;
  name: string;
  type: ShopItemType;
  price: number;
  description: string;
  preview?: string;
  emoji?: string;
  colors?: string[];
}

export const SHOP_ITEMS: ShopItem[] = [
  // Backgrounds
  { key: "bg_sunset",  name: "Sunset",   type: "background", price: 200, description: "Warm orange and pink gradient",     colors: ["#F97316", "#EC4899"] },
  { key: "bg_ocean",   name: "Ocean",    type: "background", price: 200, description: "Deep blue ocean vibes",             colors: ["#3B82F6", "#06B6D4"] },
  { key: "bg_forest",  name: "Forest",   type: "background", price: 250, description: "Lush green forest calm",            colors: ["#10B981", "#16A34A"] },
  { key: "bg_galaxy",  name: "Galaxy",   type: "background", price: 350, description: "Dark space with purple nebula",     colors: ["#4F46E5", "#7C3AED"] },
  { key: "bg_candy",   name: "Candy",    type: "background", price: 200, description: "Sweet pastel vibes",                colors: ["#F9A8D4", "#C084FC"] },
  { key: "bg_fire",    name: "Flame",    type: "background", price: 300, description: "Bold fiery gradient",               colors: ["#EF4444", "#F97316"] },
  { key: "bg_mint",    name: "Mint",     type: "background", price: 150, description: "Fresh cool mint",                   colors: ["#34D399", "#67E8F9"] },
  { key: "bg_midnight",name: "Midnight", type: "background", price: 400, description: "Deep midnight blue luxury",         colors: ["#1E1B4B", "#0F172A"] },

  // Frames
  { key: "frame_gold",     name: "Golden",    type: "frame", price: 150, description: "Classic shining gold border",    colors: ["#F59E0B", "#D97706"] },
  { key: "frame_neon",     name: "Neon",      type: "frame", price: 300, description: "Electric neon glow",            colors: ["#22D3EE", "#10B981"] },
  { key: "frame_crystal",  name: "Crystal",   type: "frame", price: 200, description: "Icy crystal blue shimmer",      colors: ["#BAE6FD", "#7DD3FC"] },
  { key: "frame_rainbow",  name: "Rainbow",   type: "frame", price: 450, description: "Full spectrum rainbow ring",    colors: ["#F97316", "#EAB308", "#22C55E", "#3B82F6", "#8B5CF6"] },
  { key: "frame_rose",     name: "Rose",      type: "frame", price: 180, description: "Soft rosy pink glow",           colors: ["#FB7185", "#F43F5E"] },
  { key: "frame_platinum", name: "Platinum",  type: "frame", price: 400, description: "Sleek silver metallic ring",    colors: ["#CBD5E1", "#94A3B8"] },

  // Nametags
  { key: "tag_rookie",    name: "Rookie",    type: "nametag", price: 50,  description: "For the new kids on the block", emoji: "🌱" },
  { key: "tag_scholar",   name: "Scholar",   type: "nametag", price: 100, description: "A classic academic title",      emoji: "📚" },
  { key: "tag_genius",    name: "Genius",    type: "nametag", price: 200, description: "For the big brains",            emoji: "🧠" },
  { key: "tag_champion",  name: "Champion",  type: "nametag", price: 250, description: "For the competitive spirit",    emoji: "🏆" },
  { key: "tag_artist",    name: "Artist",    type: "nametag", price: 150, description: "Creative and expressive",       emoji: "🎨" },
  { key: "tag_legend",    name: "Legend",    type: "nametag", price: 500, description: "Reserved for the very best",    emoji: "⚡" },
  { key: "tag_explorer",  name: "Explorer",  type: "nametag", price: 120, description: "Curious and adventurous",       emoji: "🌍" },
];

export function getItem(key: string): ShopItem | undefined {
  return SHOP_ITEMS.find(i => i.key === key);
}

export function getItemsByType(type: ShopItemType): ShopItem[] {
  return SHOP_ITEMS.filter(i => i.type === type);
}

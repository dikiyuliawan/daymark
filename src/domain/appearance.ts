export type TileColor = { key: string; hex: string; label: string };

export const TILE_COLORS: readonly TileColor[] = [
  { key: "pine", hex: "#3f6a55", label: "Pine" },
  { key: "sky", hex: "#0ea5e9", label: "Sky" },
  { key: "violet", hex: "#6c63f0", label: "Violet" },
  { key: "amber", hex: "#f0892e", label: "Amber" },
  { key: "rose", hex: "#e5484d", label: "Rose" },
  { key: "teal", hex: "#14b8a6", label: "Teal" },
  { key: "clay", hex: "#b07a4f", label: "Clay" },
  { key: "slate", hex: "#6e6e73", label: "Slate" },
] as const;

const BY_KEY = new Map(TILE_COLORS.map((color) => [color.key, color]));

export function tileHex(key: string | null | undefined): string | null {
  if (!key) {
    return null;
  }
  return BY_KEY.get(key)?.hex ?? null;
}

export function isTileColorKey(value: unknown): value is string {
  return typeof value === "string" && BY_KEY.has(value);
}

/**
 * The ink a tile's glyph takes: white on a dark colour, near-black on a light
 * one, so the glyph always clears 4.5:1 on its own tile.
 */
export function tileInk(key: string | null | undefined): string {
  const hex = tileHex(key);
  if (hex === null) {
    return "#3d3d42";
  }
  const value = hex.replace("#", "");
  const r = parseInt(value.slice(0, 2), 16) / 255;
  const g = parseInt(value.slice(2, 4), 16) / 255;
  const b = parseInt(value.slice(4, 6), 16) / 255;
  const channel = (c: number) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
  const luminance = 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
  return luminance > 0.45 ? "#101010" : "#ffffff";
}

export const EMOJI_SUGGESTIONS: readonly string[] = [
  "🌱",
  "🧭",
  "📌",
  "🔥",
  "💡",
  "🧪",
  "📦",
  "🎯",
  "🧩",
  "🛠️",
  "📝",
  "🚀",
  "🌙",
  "☕",
  "🧹",
  "📚",
] as const;

export function tileGlyph(title: string): string {
  const trimmed = title.trim();
  return trimmed === "" ? "•" : trimmed.slice(0, 1).toUpperCase();
}

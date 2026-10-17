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

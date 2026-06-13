/** Palette de tuiles colorées pour les budgets (fond pastel + couleur vive). */
export interface TileColor {
  bg: string;
  bar: string;
}

const PALETTE: TileColor[] = [
  { bg: "#e7f7ee", bar: "#22c55e" }, // vert
  { bg: "#e6f0fe", bar: "#3b82f6" }, // bleu
  { bg: "#ede7ff", bar: "#7c5cfc" }, // violet
  { bg: "#fff1e2", bar: "#f59e0b" }, // ambre
  { bg: "#fde7f0", bar: "#ec4899" }, // rose
  { bg: "#e0f7f4", bar: "#14b8a6" }, // turquoise
  { bg: "#feeaea", bar: "#ef4444" }, // rouge
  { bg: "#eef2ff", bar: "#6366f1" }, // indigo
];

function hashString(value: string): number {
  let hash = 0;
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash * 31 + value.charCodeAt(i)) | 0;
  }
  return Math.abs(hash);
}

/** Couleur déterministe d'un budget à partir de son identifiant. */
export function tileColorFor(id: string): TileColor {
  return PALETTE[hashString(id) % PALETTE.length]!;
}

/** iOS system color palette for budget tiles. */
export interface TileColor {
  bg: string;
  bar: string;
}

const PALETTE: TileColor[] = [
  { bg: "#e5f2ff", bar: "#007aff" }, // iOS Blue
  { bg: "#e8faf0", bar: "#34c759" }, // iOS Green
  { bg: "#fff4e0", bar: "#ff9500" }, // iOS Orange
  { bg: "#ffe5e8", bar: "#ff3b30" }, // iOS Red
  { bg: "#f0eeff", bar: "#5856d6" }, // iOS Indigo
  { bg: "#ffe5ef", bar: "#ff2d55" }, // iOS Pink
  { bg: "#e4f5fb", bar: "#32ade6" }, // iOS Teal
  { bg: "#f5e8ff", bar: "#af52de" }, // iOS Purple
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

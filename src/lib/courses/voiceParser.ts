/**
 * Analyse d'une dictée vocale (français) en articles de liste de courses.
 *
 * Exemple : "deux litres de lait, des pommes et trois baguettes"
 *   → [ {label:"lait", quantity:2, unit:"L"},
 *       {label:"pommes", quantity:1},
 *       {label:"baguettes", quantity:3} ]
 *
 * L'analyse reste volontairement tolérante : en cas de doute, l'article est
 * conservé tel quel avec une quantité de 1.
 */

export interface ParsedItem {
  label: string;
  quantity: number;
  unit?: string;
}

/** Mots de liaison qui séparent deux articles dans une phrase dictée. */
const SEPARATORS = /\s*(?:,|;|\bet\b|\bpuis\b|\bensuite\b|\bainsi que\b|\bplus\b)\s*/i;

/** Formules de politesse / verbes à retirer en tête de phrase. */
const FILLERS = [
  "il me faut", "il faut", "j'ai besoin de", "j'ai besoin d'", "je voudrais",
  "je veux", "ajoute", "ajouter", "achète", "acheter", "prends", "prendre",
  "il nous faut", "on a besoin de", "on a besoin d'", "rajoute", "note",
  "n'oublie pas", "n'oublie pas de", "penser à", "penser a", "pense à", "pense a",
];

/** Nombres écrits en toutes lettres (0..20 + dizaines courantes). */
const WORD_NUMBERS: Record<string, number> = {
  un: 1, une: 1, deux: 2, trois: 3, quatre: 4, cinq: 5, six: 6, sept: 7,
  huit: 8, neuf: 9, dix: 10, onze: 11, douze: 12, treize: 13, quatorze: 14,
  quinze: 15, seize: 16, vingt: 20, trente: 30, quarante: 40, cinquante: 50,
  douzaine: 12, demi: 1, "demie": 1,
};

/**
 * Unités reconnues → forme normalisée affichée.
 * Les clés sont des expressions normalisées (sans accent, en minuscules).
 */
const UNITS: Array<[RegExp, string]> = [
  [/^(litres?|l)$/, "L"],
  [/^(kilos?|kilogrammes?|kg)$/, "kg"],
  [/^(grammes?|g)$/, "g"],
  [/^(bouteilles?)$/, "bouteille"],
  [/^(paquets?)$/, "paquet"],
  [/^(boites?|boîtes?)$/, "boîte"],
  [/^(packs?)$/, "pack"],
  [/^(pots?)$/, "pot"],
  [/^(tranches?)$/, "tranche"],
  [/^(douzaines?)$/, "douzaine"],
  [/^(sachets?)$/, "sachet"],
  [/^(barquettes?)$/, "barquette"],
];

function normalize(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

/** Retire les formules d'introduction d'une phrase complète. */
function stripFillers(text: string): string {
  let out = text.trim();
  let changed = true;
  while (changed) {
    changed = false;
    const lower = normalize(out);
    for (const filler of FILLERS) {
      const nf = normalize(filler);
      if (lower.startsWith(nf + " ") || lower === nf) {
        out = out.slice(filler.length).trim();
        changed = true;
        break;
      }
    }
  }
  return out;
}

/** Tente de lire une unité normalisée à partir d'un token. */
function matchUnit(token: string): string | null {
  const n = normalize(token);
  for (const [re, label] of UNITS) {
    if (re.test(n)) return label;
  }
  return null;
}

/** Analyse un fragment correspondant à un seul article. */
function parseChunk(chunk: string): ParsedItem | null {
  let words = chunk.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return null;

  let quantity = 1;
  let unit: string | undefined;

  // 1) Quantité en tête : chiffre ou nombre en lettres.
  const first = normalize(words[0]!);
  const asNumber = Number(first.replace(",", "."));
  if (Number.isFinite(asNumber) && first !== "") {
    quantity = Math.max(1, Math.round(asNumber));
    words = words.slice(1);
  } else if (first in WORD_NUMBERS) {
    quantity = WORD_NUMBERS[first]!;
    words = words.slice(1);
  } else if (["des", "du", "de", "le", "la", "les", "un", "une"].includes(first)) {
    // Articles indéfinis : quantité par défaut, on consomme le déterminant.
    words = words.slice(1);
  }

  if (words.length === 0) return null;

  // 2) Unité éventuelle, suivie de "de"/"d'".
  const maybeUnit = matchUnit(words[0]!);
  if (maybeUnit) {
    unit = maybeUnit;
    words = words.slice(1);
    if (words.length > 0 && ["de", "d'", "des", "du"].includes(normalize(words[0]!).replace("d'", "d'"))) {
      words = words.slice(1);
    } else if (words.length > 0 && normalize(words[0]!).startsWith("d'")) {
      words[0] = words[0]!.replace(/^d['']/i, "");
    }
  }

  // 3) Déterminant résiduel ("de lait" → "lait").
  while (words.length > 1 && ["de", "des", "du", "le", "la", "les"].includes(normalize(words[0]!))) {
    words = words.slice(1);
  }

  const label = words.join(" ").trim().replace(/^d['']/i, "");
  if (!label) return null;

  return { label: cleanLabel(label), quantity, ...(unit ? { unit } : {}) };
}

/** Nettoie et met en forme un libellé d'article. */
function cleanLabel(label: string): string {
  const trimmed = label.replace(/[.,;!?]+$/g, "").trim();
  if (!trimmed) return trimmed;
  return trimmed.charAt(0).toUpperCase() + trimmed.slice(1);
}

/**
 * Analyse une dictée complète en une liste d'articles.
 * Plusieurs articles peuvent être séparés par "et", des virgules, etc.
 */
export function parseVoiceTranscript(transcript: string): ParsedItem[] {
  if (!transcript || !transcript.trim()) return [];
  const cleaned = stripFillers(transcript);
  const chunks = cleaned.split(SEPARATORS);
  const items: ParsedItem[] = [];
  for (const chunk of chunks) {
    const parsed = parseChunk(chunk);
    if (parsed) items.push(parsed);
  }
  return items;
}

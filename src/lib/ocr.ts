/**
 * OCR d'un ticket de caisse, côté appareil (Tesseract.js, sans clé ni serveur).
 * Extrait un montant total probable, une date, et l'en-tête (pour deviner
 * l'enseigne). Heuristiques volontairement simples : le résultat est une
 * proposition à vérifier/corriger.
 */
export interface ReceiptScan {
  amountCents: number | null;
  date: string | null; // "YYYY-MM-DD"
  header: string; // premières lignes du ticket
}

const TOTAL_HINTS = ["total", "ttc", "net a payer", "net à payer", "a payer", "à payer", "montant"];

function parseAmountsFromLine(line: string): number[] {
  return [...line.matchAll(/(\d{1,4})[.,](\d{2})(?!\d)/g)].map(
    (m) => Number(m[1]) * 100 + Number(m[2]),
  );
}

function parseDate(text: string): string | null {
  const m = text.match(/(\d{2})[/.\-](\d{2})[/.\-](\d{2,4})/);
  if (!m) return null;
  const day = m[1]!;
  const month = m[2]!;
  let year = m[3]!;
  if (year.length === 2) year = `20${year}`;
  return `${year}-${month}-${day}`;
}

export async function scanReceipt(imageUrl: string): Promise<ReceiptScan> {
  const { recognize } = await import("tesseract.js");
  const { data } = await recognize(imageUrl, "fra");
  const text = data.text ?? "";
  const lines = text
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);

  // Montant : on privilégie les lignes contenant un mot-clé "total", sinon le
  // plus gros montant repéré sur l'ensemble du ticket.
  const hinted: number[] = [];
  const all: number[] = [];
  for (const line of lines) {
    const amounts = parseAmountsFromLine(line);
    all.push(...amounts);
    if (TOTAL_HINTS.some((h) => line.toLowerCase().includes(h))) hinted.push(...amounts);
  }
  const pool = hinted.length > 0 ? hinted : all;
  const amountCents = pool.length > 0 ? Math.max(...pool) : null;

  const header = lines.slice(0, 3).join(" ");

  return { amountCents, date: parseDate(text), header };
}

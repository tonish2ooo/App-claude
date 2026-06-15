"use client";

import { useCallback, useMemo, useState } from "react";
import { useAppState } from "@/state/AppStateContext";
import { useSpeechRecognition } from "@/components/courses/useSpeechRecognition";
import { parseVoiceTranscript } from "@/lib/courses/voiceParser";
import { CATEGORY_EMOJI } from "@/lib/courses/ticketRestaurant";
import { TextInput } from "@/components/ui/fields";
import { formatCents } from "@/lib/money";

function normalize(text: string): string {
  return text.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
}

function MicIcon({ active }: { active: boolean }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-9 w-9">
      <rect x="9" y="3" width="6" height="11" rx="3" fill={active ? "currentColor" : "none"} />
      <path d="M5 11a7 7 0 0 0 14 0M12 18v3M8 21h8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/** Gros bouton micro + saisie manuelle avec autocomplétion sur la base produits. */
export function MicButton() {
  const {
    addItems,
    addItemFromProduct,
    state: { products },
  } = useAppState();
  const [lastAdded, setLastAdded] = useState<string[]>([]);
  const [manual, setManual] = useState("");

  /** Suggestions issues de la base produits dès les premières lettres saisies. */
  const suggestions = useMemo(() => {
    const q = normalize(manual);
    if (q.length < 1) return [];
    const matches = products.filter((p) => {
      const n = normalize(p.name);
      const b = p.brand ? normalize(p.brand) : "";
      return n.includes(q) || b.includes(q);
    });
    // Préfixe d'abord, puis popularité, puis ordre alphabétique.
    return matches
      .sort((a, b) => {
        const ap = normalize(a.name).startsWith(q) ? 0 : 1;
        const bp = normalize(b.name).startsWith(q) ? 0 : 1;
        return ap - bp || b.timesAdded - a.timesAdded || a.name.localeCompare(b.name);
      })
      .slice(0, 6);
  }, [manual, products]);

  function pickSuggestion(id: string, label: string) {
    addItemFromProduct(id);
    setLastAdded([label]);
    setManual("");
  }

  const handleFinal = useCallback(
    (text: string) => {
      const parsed = parseVoiceTranscript(text);
      if (parsed.length === 0) return;
      const created = addItems(
        parsed.map((p) => ({ label: p.label, quantity: p.quantity, unit: p.unit, source: "voice" as const })),
      );
      setLastAdded(created.map((it) => `${it.quantity > 1 ? `${it.quantity} × ` : ""}${it.label}`));
    },
    [addItems],
  );

  const { supported, listening, interim, error, start, stop } = useSpeechRecognition(handleFinal);

  function submitManual() {
    const parsed = parseVoiceTranscript(manual);
    if (parsed.length === 0) return;
    const created = addItems(
      parsed.map((p) => ({ label: p.label, quantity: p.quantity, unit: p.unit, source: "manual" as const })),
    );
    setLastAdded(created.map((it) => `${it.quantity > 1 ? `${it.quantity} × ` : ""}${it.label}`));
    setManual("");
  }

  return (
    <div className="flex flex-col items-center gap-3">
      {supported ? (
        <>
          <button
            type="button"
            onClick={listening ? stop : start}
            aria-pressed={listening}
            aria-label={listening ? "Arrêter la dictée" : "Dicter des courses"}
            className={
              "relative flex h-28 w-28 items-center justify-center rounded-full text-white shadow-fab transition active:scale-95 " +
              (listening ? "bg-accent" : "bg-brand-600")
            }
          >
            {listening && (
              <span className="absolute inset-0 animate-ping rounded-full bg-accent/40" aria-hidden />
            )}
            <span className="relative">
              <MicIcon active={listening} />
            </span>
          </button>
          <p className="text-sm font-medium text-ink-muted">
            {listening ? "À l'écoute… dictez vos courses" : "Appuyez puis dictez vos courses"}
          </p>
          {interim && (
            <p className="min-h-5 max-w-xs text-center text-sm italic text-ink-soft">“{interim}”</p>
          )}
        </>
      ) : (
        <p className="max-w-xs text-center text-sm text-ink-muted">
          🎤 La dictée vocale n'est pas disponible sur ce navigateur. Ajoutez vos articles ci-dessous.
        </p>
      )}

      {error && <p className="text-sm text-danger">{error}</p>}

      <div className="flex w-full max-w-xs items-center gap-2">
        <TextInput
          value={manual}
          onChange={(e) => setManual(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && submitManual()}
          placeholder="Ou tapez : 2 litres de lait, pain…"
          aria-label="Ajouter un article manuellement"
        />
        <button type="button" className="btn-primary shrink-0" onClick={submitManual} disabled={!manual.trim()}>
          Ajouter
        </button>
      </div>

      {suggestions.length > 0 && (
        <ul className="w-full max-w-xs overflow-hidden rounded-xl bg-surface-subtle">
          {suggestions.map((p) => (
            <li key={p.id}>
              <button
                type="button"
                onClick={() => pickSuggestion(p.id, p.name)}
                className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm transition active:bg-surface-muted"
              >
                <span>{CATEGORY_EMOJI[p.category]}</span>
                <span className="min-w-0 flex-1 truncate">
                  {p.name}
                  {p.brand && <span className="text-ink-muted"> · {p.brand}</span>}
                </span>
                {p.ticketResto === "eligible" && <span title="Éligible ticket resto">🎫</span>}
                {p.priceCents != null && (
                  <span className="shrink-0 text-xs text-ink-muted">{formatCents(p.priceCents)}</span>
                )}
              </button>
            </li>
          ))}
        </ul>
      )}

      {lastAdded.length > 0 && (
        <p className="max-w-xs text-center text-xs text-ok">
          ✓ Ajouté : {lastAdded.join(", ")}
        </p>
      )}
    </div>
  );
}

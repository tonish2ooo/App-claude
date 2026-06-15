"use client";

import { useCallback, useState } from "react";
import { useAppState } from "@/state/AppStateContext";
import { useSpeechRecognition } from "@/components/courses/useSpeechRecognition";
import { parseVoiceTranscript } from "@/lib/courses/voiceParser";
import { TextInput } from "@/components/ui/fields";

function MicIcon({ active }: { active: boolean }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-9 w-9">
      <rect x="9" y="3" width="6" height="11" rx="3" fill={active ? "currentColor" : "none"} />
      <path d="M5 11a7 7 0 0 0 14 0M12 18v3M8 21h8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/** Gros bouton micro + saisie manuelle de secours. */
export function MicButton() {
  const { addItems } = useAppState();
  const [lastAdded, setLastAdded] = useState<string[]>([]);
  const [manual, setManual] = useState("");

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

      {lastAdded.length > 0 && (
        <p className="max-w-xs text-center text-xs text-ok">
          ✓ Ajouté : {lastAdded.join(", ")}
        </p>
      )}
    </div>
  );
}

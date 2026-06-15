"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Reconnaissance vocale via la Web Speech API (Chrome, Safari, Edge).
 * Les types ne sont pas standardisés dans lib.dom : on déclare le minimum.
 */

interface SpeechRecognitionAlternative {
  transcript: string;
}
interface SpeechRecognitionResult {
  0: SpeechRecognitionAlternative;
  isFinal: boolean;
}
interface SpeechRecognitionResultList {
  length: number;
  [index: number]: SpeechRecognitionResult;
}
interface SpeechRecognitionEventLike {
  resultIndex: number;
  results: SpeechRecognitionResultList;
}
interface SpeechRecognitionLike {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  start: () => void;
  stop: () => void;
  abort: () => void;
  onresult: ((e: SpeechRecognitionEventLike) => void) | null;
  onerror: ((e: { error: string }) => void) | null;
  onend: (() => void) | null;
}
type SpeechRecognitionCtor = new () => SpeechRecognitionLike;

function getRecognitionCtor(): SpeechRecognitionCtor | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as {
    SpeechRecognition?: SpeechRecognitionCtor;
    webkitSpeechRecognition?: SpeechRecognitionCtor;
  };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

export interface UseSpeechRecognitionResult {
  supported: boolean;
  listening: boolean;
  /** Texte en cours (interim + final non encore validé). */
  interim: string;
  error: string | null;
  start: () => void;
  stop: () => void;
}

/**
 * @param onFinal Appelé pour chaque segment finalisé (phrase reconnue).
 * @param lang    Langue de reconnaissance (par défaut "fr-FR").
 */
export function useSpeechRecognition(
  onFinal: (text: string) => void,
  lang = "fr-FR",
): UseSpeechRecognitionResult {
  const [supported, setSupported] = useState(false);
  const [listening, setListening] = useState(false);
  const [interim, setInterim] = useState("");
  const [error, setError] = useState<string | null>(null);
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const onFinalRef = useRef(onFinal);
  const manualStopRef = useRef(false);

  useEffect(() => {
    onFinalRef.current = onFinal;
  }, [onFinal]);

  useEffect(() => {
    const Ctor = getRecognitionCtor();
    if (!Ctor) {
      setSupported(false);
      return;
    }
    setSupported(true);
    const recognition = new Ctor();
    recognition.lang = lang;
    recognition.continuous = true;
    recognition.interimResults = true;

    recognition.onresult = (event) => {
      let interimText = "";
      for (let i = event.resultIndex; i < event.results.length; i += 1) {
        const result = event.results[i];
        if (!result) continue;
        const transcript = result[0]?.transcript ?? "";
        if (result.isFinal) {
          const trimmed = transcript.trim();
          if (trimmed) onFinalRef.current(trimmed);
        } else {
          interimText += transcript;
        }
      }
      setInterim(interimText);
    };

    recognition.onerror = (e) => {
      if (e.error === "no-speech" || e.error === "aborted") return;
      setError(
        e.error === "not-allowed"
          ? "Micro refusé. Autorisez l'accès au microphone."
          : "Erreur de reconnaissance vocale.",
      );
    };

    recognition.onend = () => {
      setInterim("");
      // Relance automatiquement tant que l'utilisateur n'a pas arrêté.
      if (!manualStopRef.current) {
        try {
          recognition.start();
          return;
        } catch {
          // ignore : déjà démarré
        }
      }
      setListening(false);
    };

    recognitionRef.current = recognition;
    return () => {
      manualStopRef.current = true;
      recognition.abort();
      recognitionRef.current = null;
    };
  }, [lang]);

  const start = useCallback(() => {
    const recognition = recognitionRef.current;
    if (!recognition) return;
    setError(null);
    manualStopRef.current = false;
    try {
      recognition.start();
      setListening(true);
    } catch {
      // Déjà démarré : on ignore.
    }
  }, []);

  const stop = useCallback(() => {
    const recognition = recognitionRef.current;
    if (!recognition) return;
    manualStopRef.current = true;
    recognition.stop();
    setListening(false);
    setInterim("");
  }, []);

  return { supported, listening, interim, error, start, stop };
}

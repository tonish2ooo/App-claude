"use client";

import type { ReactNode } from "react";
import { useEffect } from "react";

/** Drawer/panneau bas modal pour les formulaires (mobile-first). */
export function Sheet({
  open,
  onClose,
  title,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    // Verrouille le défilement de l'arrière-plan tant que le panneau est ouvert.
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = previousOverflow;
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={title}
      className="fixed inset-0 z-50 flex items-end justify-center sm:items-center"
    >
      <div className="absolute inset-0 bg-ink/40 backdrop-blur-sm" onClick={onClose} aria-hidden />
      <div className="relative mx-auto flex max-h-[92dvh] w-full max-w-app flex-col rounded-t-3xl bg-surface shadow-card sm:rounded-3xl">
        <div className="flex items-center justify-between border-b border-surface-muted px-4 py-3">
          <h3 className="text-base font-semibold">{title}</h3>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-1.5 text-ink-muted transition hover:bg-surface-subtle"
            aria-label="Fermer"
          >
            ✕
          </button>
        </div>
        <div
          className="overflow-y-auto px-4 py-4"
          style={{ paddingBottom: "max(1rem, env(safe-area-inset-bottom))" }}
        >
          {children}
        </div>
      </div>
    </div>
  );
}

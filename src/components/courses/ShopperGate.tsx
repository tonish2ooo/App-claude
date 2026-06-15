"use client";

import { useState } from "react";
import { useAppState } from "@/state/AppStateContext";
import { TextInput } from "@/components/ui/fields";

const EMOJI_CHOICES = ["🧑‍🍳", "🥑", "🛒", "🧁", "🐱", "🌿", "🍓", "🐶", "☕️", "🍋"];

/** Onboarding minimal : créer / choisir l'utilisateur courant de la liste partagée. */
export function ShopperGate() {
  const { shoppers, addShopper, setCurrentShopper, completeOnboarding, loadDemo } = useAppState();
  const [name, setName] = useState("");
  const [emoji, setEmoji] = useState(EMOJI_CHOICES[0]!);

  function create() {
    const trimmed = name.trim();
    if (!trimmed) return;
    const created = addShopper({ name: trimmed, emoji });
    setCurrentShopper(created.id);
    completeOnboarding();
  }

  function pick(id: string) {
    setCurrentShopper(id);
    completeOnboarding();
  }

  return (
    <div className="app-shell px-6 pb-10 pt-16">
      <div className="mx-auto flex w-full max-w-sm flex-1 flex-col">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-3xl bg-hero text-3xl shadow-fab">
            🛒
          </div>
          <h1 className="text-2xl font-bold tracking-tight">App Courses</h1>
          <p className="mt-1 text-sm text-ink-muted">
            Dictez vos courses à la voix et partagez une liste commune.
          </p>
        </div>

        {shoppers.length > 0 && (
          <div className="mb-6">
            <p className="mb-2 px-1 text-[13px] font-semibold uppercase tracking-wider text-ink-muted">
              Qui fait les courses ?
            </p>
            <div className="flex flex-col gap-2">
              {shoppers.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => pick(s.id)}
                  className="card card-tap flex items-center gap-3"
                >
                  <span className="text-2xl">{s.emoji}</span>
                  <span className="font-medium">{s.name}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="card">
          <p className="mb-2 text-sm font-semibold">
            {shoppers.length > 0 ? "Ajouter un autre membre" : "Créez votre profil"}
          </p>
          <div className="mb-3 flex flex-wrap gap-1.5">
            {EMOJI_CHOICES.map((e) => (
              <button
                key={e}
                type="button"
                onClick={() => setEmoji(e)}
                className={
                  "flex h-10 w-10 items-center justify-center rounded-xl text-xl transition " +
                  (emoji === e ? "bg-brand-100 ring-2 ring-brand-600" : "bg-surface-subtle")
                }
              >
                {e}
              </button>
            ))}
          </div>
          <TextInput
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && create()}
            placeholder="Votre prénom"
            autoFocus
          />
          <button type="button" className="btn-primary mt-3 w-full" onClick={create} disabled={!name.trim()}>
            C'est parti
          </button>
        </div>

        {shoppers.length === 0 && (
          <button type="button" onClick={loadDemo} className="mt-4 text-center text-sm text-brand-600">
            Voir une liste de démonstration
          </button>
        )}
      </div>
    </div>
  );
}

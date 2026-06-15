"use client";

import { useState } from "react";
import { useAppState } from "@/state/AppStateContext";
import { SectionTitle } from "@/components/ui/primitives";
import { Field, TextInput } from "@/components/ui/fields";

const EMOJI_CHOICES = ["🧑‍🍳", "🥑", "🛒", "🧁", "🐱", "🌿", "🍓", "🐶", "☕️", "🍋"];

export default function TeamPage() {
  const {
    state: { household, shoppers, items, products },
    currentShopper,
    addShopper,
    removeShopper,
    setCurrentShopper,
    updateHousehold,
    resetEmpty,
  } = useAppState();

  const [name, setName] = useState("");
  const [emoji, setEmoji] = useState(EMOJI_CHOICES[0]!);

  function add() {
    const trimmed = name.trim();
    if (!trimmed) return;
    addShopper({ name: trimmed, emoji });
    setName("");
  }

  return (
    <div>
      <SectionTitle>Liste partagée</SectionTitle>
      <div className="card">
        <Field label="Nom de la liste">
          <TextInput
            value={household.name}
            onChange={(e) => updateHousehold({ name: e.target.value })}
            placeholder="Notre liste"
          />
        </Field>
        <p className="text-xs text-ink-muted">
          {items.length} article{items.length > 1 ? "s" : ""} · {products.length} produit
          {products.length > 1 ? "s" : ""} en base · {shoppers.length} membre{shoppers.length > 1 ? "s" : ""}
        </p>
      </div>

      <SectionTitle>Membres</SectionTitle>
      <div className="flex flex-col gap-2">
        {shoppers.map((s) => {
          const isCurrent = currentShopper?.id === s.id;
          return (
            <div key={s.id} className="card flex items-center gap-3">
              <span className="text-2xl">{s.emoji}</span>
              <div className="flex-1">
                <p className="font-medium">{s.name}</p>
                {isCurrent && <p className="text-xs text-brand-600">Profil actif</p>}
              </div>
              {!isCurrent && (
                <button type="button" className="btn-ghost" onClick={() => setCurrentShopper(s.id)}>
                  Choisir
                </button>
              )}
              {shoppers.length > 1 && (
                <button
                  type="button"
                  className="flex h-8 w-8 items-center justify-center rounded-full text-ink-faint transition hover:text-danger"
                  aria-label={`Retirer ${s.name}`}
                  onClick={() => removeShopper(s.id)}
                >
                  ✕
                </button>
              )}
            </div>
          );
        })}
      </div>

      <SectionTitle>Ajouter un membre</SectionTitle>
      <div className="card">
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
        <div className="flex items-center gap-2">
          <TextInput
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && add()}
            placeholder="Prénom du membre"
          />
          <button type="button" className="btn-primary shrink-0" onClick={add} disabled={!name.trim()}>
            Ajouter
          </button>
        </div>
      </div>

      <SectionTitle>Données</SectionTitle>
      <div className="card">
        <p className="mb-3 text-sm text-ink-muted">
          La liste est enregistrée sur cet appareil. Configurez Supabase pour la partager en temps réel
          entre plusieurs téléphones.
        </p>
        <button
          type="button"
          className="btn-danger w-full"
          onClick={() => {
            if (confirm("Réinitialiser toutes les données (liste, produits, membres) ?")) resetEmpty();
          }}
        >
          Réinitialiser l'application
        </button>
      </div>
    </div>
  );
}

"use client";

import { useState } from "react";
import { useAppState } from "@/state/AppStateContext";
import { Field, TextInput } from "@/components/ui/fields";

/** Onboarding : découvrir la démo ou créer son foyer (1er utilisateur). */
export function Onboarding() {
  const app = useAppState();
  const [step, setStep] = useState<"welcome" | "create">("welcome");
  const [householdName, setHouseholdName] = useState("Mon foyer");
  const [firstName, setFirstName] = useState("");
  const [email, setEmail] = useState("");

  function createHousehold() {
    if (!firstName.trim()) return;
    app.updateHousehold({ name: householdName.trim() || "Mon foyer", mode: "manual" });
    const user = app.addUser({
      firstName: firstName.trim(),
      lastName: "",
      email: email.trim(),
      role: "owner",
      active: true,
    });
    app.setCurrentUser(user.id);
    app.completeOnboarding();
  }

  return (
    <div className="app-shell items-center justify-center px-6 py-10">
      <div className="w-full space-y-6">
        <div className="text-center">
          <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-3xl bg-brand-600 text-3xl text-white shadow-fab">
            💑
          </div>
          <h1 className="text-2xl font-bold">Comptes du foyer</h1>
          <p className="mt-1 text-sm text-ink-soft">
            Pilotez chaque mois les revenus, budgets et dépenses de votre foyer.
          </p>
        </div>

        {step === "welcome" ? (
          <div className="space-y-3">
            <button type="button" className="btn-primary w-full" onClick={() => setStep("create")}>
              Créer mon foyer
            </button>
            <button
              type="button"
              className="btn-ghost w-full"
              onClick={() => app.loadDemo()}
            >
              Découvrir la démonstration
            </button>
          </div>
        ) : (
          <div className="card space-y-1">
            <Field label="Nom du foyer">
              <TextInput value={householdName} onChange={(e) => setHouseholdName(e.target.value)} />
            </Field>
            <Field label="Votre prénom">
              <TextInput value={firstName} onChange={(e) => setFirstName(e.target.value)} autoFocus />
            </Field>
            <Field label="Votre email">
              <TextInput type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
            </Field>
            <button
              type="button"
              className="btn-primary mt-2 w-full"
              disabled={!firstName.trim()}
              onClick={createHousehold}
            >
              Commencer
            </button>
            <button type="button" className="btn-ghost w-full" onClick={() => setStep("welcome")}>
              Retour
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

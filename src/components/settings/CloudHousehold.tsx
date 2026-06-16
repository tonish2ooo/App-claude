"use client";

import { useEffect, useState } from "react";
import { useAppState } from "@/state/AppStateContext";
import { Card } from "@/components/ui/primitives";
import { Field, TextInput } from "@/components/ui/fields";
import { isSupabaseConfigured } from "@/lib/supabase/client";
import { getAuthInfo, onAuthChange, type AuthInfo } from "@/lib/supabase/auth";
import { createInvite, createSharedHousehold, joinHousehold, myHousehold } from "@/lib/supabase/household";

type Msg = { text: string; ok: boolean } | null;

export function CloudHousehold() {
  const app = useAppState();
  const [auth, setAuth] = useState<AuthInfo | null>(null);
  const [householdId, setHouseholdId] = useState<string | null | undefined>(undefined);
  const [invite, setInviteCode] = useState<string | null>(null);
  const [joinCode, setJoinCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<Msg>(null);

  useEffect(() => {
    if (!isSupabaseConfigured()) return;
    getAuthInfo().then(setAuth);
    return onAuthChange(setAuth);
  }, []);

  useEffect(() => {
    if (auth) myHousehold().then(setHouseholdId);
    else setHouseholdId(undefined);
  }, [auth]);

  if (!isSupabaseConfigured()) return null;

  if (!auth) {
    return (
      <Card className="space-y-1">
        <p className="text-sm font-medium">Foyer partagé</p>
        <p className="text-xs text-ink-muted">
          Connectez-vous (carte « Synchronisation cloud ») pour créer ou rejoindre un foyer partagé.
        </p>
      </Card>
    );
  }

  async function create() {
    setBusy(true);
    setMsg(null);
    const { error } = await createSharedHousehold(app.state);
    setBusy(false);
    if (error) return setMsg({ text: error, ok: false });
    if (typeof window !== "undefined") window.location.reload();
  }

  async function genInvite() {
    if (!householdId) return;
    setBusy(true);
    setMsg(null);
    const { code, error } = await createInvite(householdId);
    setBusy(false);
    if (error) return setMsg({ text: error, ok: false });
    setInviteCode(code);
  }

  async function join() {
    setBusy(true);
    setMsg(null);
    const { error } = await joinHousehold(joinCode);
    setBusy(false);
    if (error) return setMsg({ text: error, ok: false });
    if (typeof window !== "undefined") window.location.reload();
  }

  return (
    <Card className="space-y-2">
      <p className="text-sm font-medium">Foyer partagé</p>

      {householdId ? (
        <>
          <p className="text-xs text-ok">Foyer partagé actif — les données sont communes aux membres.</p>
          <button type="button" className="btn-ghost w-full" disabled={busy} onClick={genInvite}>
            Inviter quelqu'un (générer un code)
          </button>
          {invite && (
            <div className="rounded-xl bg-surface-subtle p-3 text-center">
              <p className="text-[11px] text-ink-muted">Code d'invitation (valable 7 jours)</p>
              <p className="text-2xl font-bold tracking-widest">{invite}</p>
              <p className="mt-1 text-[11px] text-ink-muted">
                À saisir par l'autre personne dans « Rejoindre un foyer ».
              </p>
            </div>
          )}
        </>
      ) : householdId === null ? (
        <>
          <p className="text-xs text-ink-muted">
            Crée un foyer partagé (tes données actuelles deviennent communes), ou rejoins celui de ton conjoint avec un code.
          </p>
          <button type="button" className="btn-primary w-full" disabled={busy} onClick={create}>
            Créer un foyer partagé
          </button>
          <Field label="Rejoindre un foyer (code d'invitation)">
            <TextInput value={joinCode} onChange={(e) => setJoinCode(e.target.value.toUpperCase())} placeholder="EX : A1B2C3D4" />
          </Field>
          <button type="button" className="btn-ghost w-full" disabled={busy || !joinCode.trim()} onClick={join}>
            Rejoindre
          </button>
        </>
      ) : (
        <p className="text-xs text-ink-muted">Chargement…</p>
      )}

      {msg && <p className={"text-xs " + (msg.ok ? "text-ok" : "text-danger")}>{msg.text}</p>}
    </Card>
  );
}

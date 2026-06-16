"use client";

import { useEffect, useState } from "react";
import { useAppState } from "@/state/AppStateContext";
import { Card } from "@/components/ui/primitives";
import { Field, TextInput } from "@/components/ui/fields";
import { isSupabaseConfigured } from "@/lib/supabase/client";
import { getAuthInfo, onAuthChange, signIn, signOut, signUp, type AuthInfo } from "@/lib/supabase/auth";
import { loadRemoteState, saveRemoteState } from "@/lib/supabase/sync";

type Msg = { text: string; ok: boolean } | null;

export function CloudSync() {
  const app = useAppState();
  const configured = isSupabaseConfigured();
  const [auth, setAuth] = useState<AuthInfo | null>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mode, setMode] = useState<"login" | "register">("login");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<Msg>(null);

  useEffect(() => {
    if (!configured) return;
    getAuthInfo().then(setAuth);
    return onAuthChange(setAuth);
  }, [configured]);

  if (!configured) {
    return (
      <Card className="space-y-1">
        <p className="text-sm font-medium">Synchronisation cloud</p>
        <p className="text-xs text-ink-muted">
          Non configurée. Renseignez <code>NEXT_PUBLIC_SUPABASE_URL</code> et{" "}
          <code>NEXT_PUBLIC_SUPABASE_ANON_KEY</code> dans <code>.env.local</code>, puis relancez l'app.
        </p>
      </Card>
    );
  }

  async function submit() {
    setBusy(true);
    setMsg(null);
    const { error } = mode === "login" ? await signIn(email, password) : await signUp(email, password);
    setBusy(false);
    if (error) setMsg({ text: error, ok: false });
    else if (mode === "register") setMsg({ text: "Compte créé. Vérifiez votre e-mail si une confirmation est demandée.", ok: true });
  }

  async function save() {
    if (!auth) return;
    setBusy(true);
    setMsg(null);
    const { error } = await saveRemoteState(auth.userId, app.state);
    setBusy(false);
    setMsg(error ? { text: error, ok: false } : { text: "Données sauvegardées dans le cloud.", ok: true });
  }

  async function restore() {
    if (!auth) return;
    if (typeof window !== "undefined" && !window.confirm("Remplacer les données locales par la sauvegarde cloud ?")) return;
    setBusy(true);
    setMsg(null);
    const { state, error } = await loadRemoteState(auth.userId);
    setBusy(false);
    if (error) return setMsg({ text: error, ok: false });
    if (!state) return setMsg({ text: "Aucune sauvegarde cloud trouvée.", ok: false });
    app.importState(state);
    setMsg({ text: "Données restaurées depuis le cloud.", ok: true });
  }

  return (
    <Card className="space-y-2">
      <p className="text-sm font-medium">Synchronisation cloud</p>

      {auth ? (
        <>
          <p className="text-xs text-ink-muted">Connecté : {auth.email ?? auth.userId}</p>
          <p className="text-xs text-ok">
            Synchronisation automatique activée — tes modifications sont enregistrées dans le cloud.
          </p>
          <button type="button" className="btn-ghost w-full" disabled={busy} onClick={save}>
            Forcer la sauvegarde
          </button>
          <button type="button" className="btn-ghost w-full" disabled={busy} onClick={restore}>
            Restaurer depuis le cloud
          </button>
          <button type="button" className="btn-ghost w-full" disabled={busy} onClick={() => signOut()}>
            Se déconnecter
          </button>
        </>
      ) : (
        <>
          <Field label="E-mail">
            <TextInput type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          </Field>
          <Field label="Mot de passe">
            <TextInput type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
          </Field>
          <button type="button" className="btn-primary w-full" disabled={busy || !email || !password} onClick={submit}>
            {mode === "login" ? "Se connecter" : "Créer un compte"}
          </button>
          <button
            type="button"
            className="btn-ghost w-full"
            onClick={() => {
              setMsg(null);
              setMode(mode === "login" ? "register" : "login");
            }}
          >
            {mode === "login" ? "Créer un compte" : "J'ai déjà un compte"}
          </button>
        </>
      )}

      {msg && <p className={"text-xs " + (msg.ok ? "text-ok" : "text-danger")}>{msg.text}</p>}
    </Card>
  );
}

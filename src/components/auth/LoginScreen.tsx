"use client";

import { useState } from "react";
import { useAppState } from "@/state/AppStateContext";
import { Avatar } from "@/components/ui/primitives";
import { Field, TextInput } from "@/components/ui/fields";
import { createLocalAuthService, isQuickSignInSupported } from "@/lib/auth/authService";

/**
 * Écran de connexion. Email + mot de passe et "Connexion rapide" (Face ID sur
 * iPhone via la sécurité de l'appareil) lorsque l'appareil le permet.
 */
export function LoginScreen() {
  const app = useAppState();
  const { state, activeUsers } = app;
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = useState<"login" | "register">("login");
  const [firstName, setFirstName] = useState("");

  const auth = createLocalAuthService(() => state.users);
  const quickAvailable = isQuickSignInSupported() && state.passkeys.length > 0;

  async function signIn() {
    setError(null);
    try {
      const session = await auth.signInWithPassword(email, password);
      app.setCurrentUser(session.userId);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Connexion impossible.");
    }
  }

  function quickSignIn() {
    const passkey = state.passkeys[0];
    if (passkey) app.setCurrentUser(passkey.userId);
  }

  function register() {
    setError(null);
    if (!firstName.trim() || !email.trim()) {
      setError("Renseignez au moins un prénom et un email.");
      return;
    }
    const user = app.addUser({
      firstName: firstName.trim(),
      lastName: "",
      email: email.trim(),
      role: "member",
      active: true,
    });
    app.setCurrentUser(user.id);
  }

  return (
    <div className="app-shell items-center justify-center px-6 py-10">
      <div className="w-full space-y-6">
        <div className="text-center">
          <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-3xl bg-hero text-3xl text-white shadow-hero">
            🔐
          </div>
          <h1 className="text-2xl font-bold">Connexion</h1>
          <p className="mt-1 text-sm text-ink-soft">Accédez aux comptes de votre foyer.</p>
        </div>

        {quickAvailable && (
          <button type="button" className="btn-primary w-full" onClick={quickSignIn}>
            ⚡ Connexion rapide
          </button>
        )}

        <div className="card space-y-1">
          {mode === "register" && (
            <Field label="Prénom">
              <TextInput value={firstName} onChange={(e) => setFirstName(e.target.value)} />
            </Field>
          )}
          <Field label="Email">
            <TextInput type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          </Field>
          {mode === "login" && (
            <Field label="Mot de passe">
              <TextInput type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
            </Field>
          )}
          {error && <p className="mb-2 text-sm text-danger">{error}</p>}
          {mode === "login" ? (
            <button type="button" className="btn-primary w-full" onClick={signIn}>
              Se connecter
            </button>
          ) : (
            <button type="button" className="btn-primary w-full" onClick={register}>
              Créer mon compte
            </button>
          )}
          <button
            type="button"
            className="btn-ghost w-full"
            onClick={() => {
              setError(null);
              setMode(mode === "login" ? "register" : "login");
            }}
          >
            {mode === "login" ? "Créer un compte" : "J'ai déjà un compte"}
          </button>
        </div>

        {activeUsers.length > 0 && (
          <div>
            <p className="mb-2 text-center text-xs uppercase tracking-wide text-ink-muted">
              Accès rapide (démo)
            </p>
            <div className="flex flex-wrap justify-center gap-3">
              {activeUsers.map((u) => (
                <button
                  key={u.id}
                  type="button"
                  onClick={() => app.setCurrentUser(u.id)}
                  className="flex flex-col items-center gap-1"
                >
                  <Avatar name={`${u.firstName} ${u.lastName}`} src={u.photoUrl} size={48} />
                  <span className="text-xs text-ink-soft">{u.firstName}</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

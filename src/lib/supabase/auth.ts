import { getSupabaseClient } from "./client";

export interface AuthInfo {
  userId: string;
  email: string | null;
}

/** Crée un compte e-mail/mot de passe. */
export async function signUp(email: string, password: string): Promise<{ error: string | null }> {
  const sb = getSupabaseClient();
  if (!sb) return { error: "Supabase non configuré." };
  const { error } = await sb.auth.signUp({ email, password });
  return { error: error?.message ?? null };
}

/** Connexion e-mail/mot de passe. */
export async function signIn(email: string, password: string): Promise<{ error: string | null }> {
  const sb = getSupabaseClient();
  if (!sb) return { error: "Supabase non configuré." };
  const { error } = await sb.auth.signInWithPassword({ email, password });
  return { error: error?.message ?? null };
}

export async function signOut(): Promise<void> {
  const sb = getSupabaseClient();
  if (sb) await sb.auth.signOut();
}

/** Session courante (ou null). */
export async function getAuthInfo(): Promise<AuthInfo | null> {
  const sb = getSupabaseClient();
  if (!sb) return null;
  const { data } = await sb.auth.getSession();
  const user = data.session?.user;
  return user ? { userId: user.id, email: user.email ?? null } : null;
}

/** S'abonne aux changements de session. Renvoie une fonction de désabonnement. */
export function onAuthChange(cb: (info: AuthInfo | null) => void): () => void {
  const sb = getSupabaseClient();
  if (!sb) return () => {};
  const { data } = sb.auth.onAuthStateChange((_event, session) => {
    const user = session?.user;
    cb(user ? { userId: user.id, email: user.email ?? null } : null);
  });
  return () => data.subscription.unsubscribe();
}

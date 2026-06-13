import type { AuthUser, PasskeyCredential, UserProfile } from "../types";
import { makeId } from "../id";

/**
 * Service d'authentification.
 *
 * Objectif cible : email + mot de passe et connexion rapide (passkeys / WebAuthn,
 * compatible Face ID sur iPhone via la sécurité de l'appareil). Aucune donnée
 * biométrique n'est jamais stockée ni traitée par l'application.
 *
 * Si Supabase Auth n'est pas configuré, un mode démo/local est utilisé : il ne
 * bloque jamais l'application.
 */
export interface AuthService {
  /** Connexion email + mot de passe. */
  signInWithPassword(email: string, password: string): Promise<AuthUser>;
  /** Création de compte. */
  register(email: string, password: string, userId: string): Promise<AuthUser>;
  /** Déconnexion. */
  signOut(): Promise<void>;
}

/** La connexion rapide (WebAuthn) est-elle supportée par l'appareil ? */
export function isQuickSignInSupported(): boolean {
  return (
    typeof window !== "undefined" &&
    typeof window.PublicKeyCredential !== "undefined"
  );
}

/**
 * Prépare une référence de connexion rapide pour cet appareil.
 * En mode local, on enregistre uniquement une référence opaque (jamais de
 * biométrie). L'intégration WebAuthn réelle viendra avec le backend.
 */
export function createPasskeyReference(userId: string, label: string): PasskeyCredential {
  return {
    id: makeId("pk"),
    userId,
    credentialId: makeId("cred"),
    label,
    createdAt: new Date().toISOString(),
  };
}

/**
 * Service local/démo : valide une connexion à partir des profils du foyer.
 * Le mot de passe n'est pas vérifié (mode démo) — à remplacer par Supabase Auth.
 */
export function createLocalAuthService(getUsers: () => UserProfile[]): AuthService {
  return {
    async signInWithPassword(email) {
      const user = getUsers().find(
        (u) => u.email.toLowerCase() === email.toLowerCase() && u.active,
      );
      if (!user) {
        throw new Error("Aucun compte actif ne correspond à cet email.");
      }
      return { id: makeId("auth"), userId: user.id, email: user.email, provider: "password" };
    },
    async register(email, _password, userId) {
      return { id: makeId("auth"), userId, email, provider: "password" };
    },
    async signOut() {
      // Mode local : la déconnexion est gérée côté état applicatif.
    },
  };
}

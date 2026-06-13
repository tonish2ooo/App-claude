"use client";

import { useAppState } from "@/state/AppStateContext";
import { AdminHeader } from "@/components/layout/AdminHeader";
import { Card } from "@/components/ui/primitives";
import { createPasskeyReference, isQuickSignInSupported } from "@/lib/auth/authService";

export default function AdminSecurityPage() {
  const app = useAppState();
  const { state, currentUser } = app;

  const hasPasskey = currentUser
    ? state.passkeys.some((p) => p.userId === currentUser.id)
    : false;
  const supported = isQuickSignInSupported();

  function enableQuickSignIn() {
    if (!currentUser) return;
    const ref = createPasskeyReference(currentUser.id, "Cet appareil");
    app.addPasskey(ref);
  }

  return (
    <div className="space-y-3">
      <AdminHeader title="Sécurité / connexion" />

      <Card className="space-y-2">
        <p className="text-sm font-medium">Connexion rapide</p>
        <p className="text-xs text-ink-muted">
          Activez la connexion rapide pour vous identifier avec la sécurité de votre appareil
          (Face ID sur iPhone). Aucune donnée biométrique n&apos;est enregistrée par l&apos;application.
        </p>
        {!supported && (
          <p className="text-xs text-warn">Cet appareil ne prend pas en charge la connexion rapide.</p>
        )}
        {hasPasskey ? (
          <p className="text-sm text-ok">✓ Connexion rapide activée sur cet appareil</p>
        ) : (
          <button
            type="button"
            className="btn-primary w-full"
            disabled={!supported || !currentUser}
            onClick={enableQuickSignIn}
          >
            Activer la connexion rapide sur cet appareil
          </button>
        )}
      </Card>

      <Card>
        <button type="button" className="btn-ghost w-full" onClick={() => app.setCurrentUser(null)}>
          Se déconnecter
        </button>
      </Card>
    </div>
  );
}

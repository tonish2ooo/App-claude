"use client";

import { useState } from "react";
import { useAppState } from "@/state/AppStateContext";
import { AdminHeader } from "@/components/layout/AdminHeader";
import { Avatar, Card, EmptyState, Pill } from "@/components/ui/primitives";
import { Sheet } from "@/components/ui/Sheet";
import { UserForm } from "@/components/forms/UserForm";
import type { UserProfile } from "@/lib/types";

const ROLE_LABEL: Record<string, string> = { owner: "Propriétaire", admin: "Admin", member: "Membre" };

export default function AdminUsersPage() {
  const app = useAppState();
  const { state } = app;
  const [editing, setEditing] = useState<UserProfile | null>(null);
  const [creating, setCreating] = useState(false);

  return (
    <div className="space-y-3">
      <AdminHeader
        title="Utilisateurs"
        action={
          <button type="button" className="text-sm font-semibold text-brand-600" onClick={() => setCreating(true)}>
            + Ajouter
          </button>
        }
      />

      <div className="space-y-2">
        {state.users.map((u) => (
          <Card key={u.id} onClick={() => setEditing(u)}>
            <div className="flex items-center gap-3">
              <Avatar name={`${u.firstName} ${u.lastName}`} src={u.photoUrl} />
              <div className="flex-1">
                <p className="font-medium">
                  {u.firstName} {u.lastName}
                </p>
                <p className="text-xs text-ink-muted">{u.email || "Sans email"}</p>
              </div>
              <div className="flex flex-col items-end gap-1">
                <Pill tone="brand">{ROLE_LABEL[u.role]}</Pill>
                {!u.active && <Pill tone="neutral">Inactif</Pill>}
              </div>
            </div>
          </Card>
        ))}
        {state.users.length === 0 && <EmptyState icon="👥" title="Aucun utilisateur" />}
      </div>

      <Sheet open={creating} onClose={() => setCreating(false)} title="Nouvel utilisateur">
        <UserForm onDone={() => setCreating(false)} />
      </Sheet>

      <Sheet open={editing !== null} onClose={() => setEditing(null)} title="Fiche utilisateur">
        {editing && (
          <div>
            <UserForm user={editing} onDone={() => setEditing(null)} />
            <div className="mt-3 flex gap-2">
              <button
                type="button"
                className="btn-ghost flex-1"
                onClick={() => {
                  app.updateUser(editing.id, { active: !editing.active });
                  setEditing(null);
                }}
              >
                {editing.active ? "Désactiver" : "Activer"}
              </button>
              <button
                type="button"
                className="btn-danger flex-1"
                onClick={() => {
                  app.removeUser(editing.id);
                  setEditing(null);
                }}
              >
                Supprimer
              </button>
            </div>
          </div>
        )}
      </Sheet>
    </div>
  );
}

"use client";

import Link from "next/link";
import { useAppState } from "@/state/AppStateContext";
import { Card, SectionTitle } from "@/components/ui/primitives";

const ENTRIES = [
  { href: "/admin/users", icon: "👥", label: "Utilisateurs", desc: "Membres du foyer" },
  { href: "/admin/incomes", icon: "💶", label: "Revenus mensuels", desc: "Salaires et tickets restaurant" },
  { href: "/admin/budgets", icon: "📊", label: "Budgets", desc: "Enveloppes et provisions" },
  { href: "/admin/recurring", icon: "🔁", label: "Abonnements", desc: "Dépenses récurrentes automatiques" },
  { href: "/admin/merchants", icon: "🏬", label: "Enseignes", desc: "Commerçants et fournisseurs" },
  { href: "/admin/settings", icon: "🏠", label: "Paramètres du foyer", desc: "Mois, devise, mode, solde" },
  { href: "/admin/security", icon: "🔐", label: "Sécurité / connexion", desc: "Connexion rapide, déconnexion" },
];

export default function AdminPage() {
  const { currentUser } = useAppState();

  return (
    <div className="space-y-3">
      <SectionTitle>Console d&apos;administration</SectionTitle>
      {currentUser && (
        <Card>
          <p className="text-xs text-ink-muted">Connecté en tant que</p>
          <p className="font-semibold">
            {currentUser.firstName} {currentUser.lastName}
          </p>
        </Card>
      )}
      <div className="space-y-2">
        {ENTRIES.map((e) => (
          <Link key={e.href} href={e.href}>
            <Card className="card-tap">
              <div className="flex items-center gap-3">
                <span className="text-2xl">{e.icon}</span>
                <div className="flex-1">
                  <p className="font-medium">{e.label}</p>
                  <p className="text-xs text-ink-muted">{e.desc}</p>
                </div>
                <span className="text-ink-muted">›</span>
              </div>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}

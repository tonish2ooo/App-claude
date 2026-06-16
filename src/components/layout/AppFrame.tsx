"use client";

import type { ReactNode } from "react";
import { useAppState } from "@/state/AppStateContext";
import { BottomNav } from "@/components/layout/BottomNav";
import { Onboarding } from "@/components/onboarding/Onboarding";
import { LoginScreen } from "@/components/auth/LoginScreen";
import { ThemeButton } from "@/components/settings/ThemeButton";
import { AlertBadge } from "@/components/layout/AlertBadge";
import { Avatar } from "@/components/ui/primitives";

export function AppFrame({ children }: { children: ReactNode }) {
  const { ready, state, currentUser } = useAppState();

  if (!ready) {
    return (
      <div className="app-shell items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-surface-muted border-t-brand-600" />
      </div>
    );
  }

  if (!state.onboardingComplete) {
    return <Onboarding />;
  }

  if (!currentUser) {
    return <LoginScreen />;
  }

  const activeUsers = state.users.filter((u) => u.active);
  const names = activeUsers.map((u) => u.firstName).join(" & ") || currentUser.firstName;

  return (
    <div className="app-shell">
      <header className="sticky top-0 z-20 flex items-center justify-between bg-surface-subtle/90 px-4 py-3 backdrop-blur-xl">
        <div>
          <p className="text-[13px] text-ink-muted">Bonjour</p>
          <div className="flex items-center gap-2">
            <p className="text-xl font-bold tracking-tight">{names}</p>
            <AlertBadge />
          </div>
        </div>
        <div className="flex items-center gap-1">
          <ThemeButton />
          <Avatar name={`${currentUser.firstName} ${currentUser.lastName}`} src={currentUser.photoUrl} size={38} />
        </div>
      </header>

      <main className="flex-1 px-4 pb-28 pt-2">{children}</main>

      <BottomNav />
    </div>
  );
}

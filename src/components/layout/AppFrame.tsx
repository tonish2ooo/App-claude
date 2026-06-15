"use client";

import type { ReactNode } from "react";
import { useAppState } from "@/state/AppStateContext";
import { BottomNav } from "@/components/layout/BottomNav";
import { ShopperGate } from "@/components/courses/ShopperGate";
import { ThemeButton } from "@/components/settings/ThemeButton";

export function AppFrame({ children }: { children: ReactNode }) {
  const { ready, state, currentShopper } = useAppState();

  if (!ready) {
    return (
      <div className="app-shell items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-surface-muted border-t-brand-600" />
      </div>
    );
  }

  if (!state.onboardingComplete || !currentShopper) {
    return <ShopperGate />;
  }

  return (
    <div className="app-shell">
      <header className="sticky top-0 z-20 flex items-center justify-between bg-surface-subtle/90 px-4 py-3 backdrop-blur-xl">
        <div>
          <p className="text-[13px] text-ink-muted">{state.household.name}</p>
          <p className="text-xl font-bold tracking-tight">App Courses</p>
        </div>
        <div className="flex items-center gap-2">
          <ThemeButton />
          <span className="text-2xl" title={currentShopper.name}>
            {currentShopper.emoji}
          </span>
        </div>
      </header>

      <main className="flex-1 px-4 pb-28 pt-2">{children}</main>

      <BottomNav />
    </div>
  );
}

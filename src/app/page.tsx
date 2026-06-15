"use client";

import { MicButton } from "@/components/courses/MicButton";
import { ShoppingListView } from "@/components/courses/ShoppingListView";

export default function HomePage() {
  return (
    <div>
      <section className="mb-2 rounded-3xl bg-surface p-6 shadow-card">
        <MicButton />
      </section>
      <ShoppingListView />
    </div>
  );
}

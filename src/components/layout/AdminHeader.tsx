"use client";

import { useRouter } from "next/navigation";
import type { ReactNode } from "react";

export function AdminHeader({ title, action }: { title: string; action?: ReactNode }) {
  const router = useRouter();
  return (
    <div className="flex items-center justify-between">
      <button type="button" className="text-sm text-brand-600" onClick={() => router.push("/admin")}>
        ‹ Admin
      </button>
      <h1 className="text-base font-semibold">{title}</h1>
      <div className="min-w-[3rem] text-right">{action}</div>
    </div>
  );
}

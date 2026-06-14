"use client";

import { useEffect, useState } from "react";
import { Segmented } from "@/components/ui/fields";
import { applyTheme, getStoredTheme, type Theme } from "@/lib/theme";

export function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>("system");

  useEffect(() => {
    setTheme(getStoredTheme());
    // Réagit aux changements du thème système lorsque la préférence est "système".
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => {
      if (getStoredTheme() === "system") applyTheme("system");
    };
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  function change(next: Theme) {
    setTheme(next);
    applyTheme(next);
  }

  return (
    <Segmented
      value={theme}
      onChange={change}
      options={[
        { value: "light", label: "Clair" },
        { value: "dark", label: "Sombre" },
        { value: "system", label: "Système" },
      ]}
    />
  );
}

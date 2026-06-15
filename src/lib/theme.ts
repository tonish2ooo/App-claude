export type Theme = "light" | "dark" | "system";

const KEY = "app-courses:theme";

/** Préférence de thème enregistrée (par défaut : suit le système). */
export function getStoredTheme(): Theme {
  if (typeof window === "undefined") return "system";
  const t = window.localStorage.getItem(KEY);
  return t === "light" || t === "dark" || t === "system" ? t : "system";
}

function prefersDark(): boolean {
  return typeof window !== "undefined" && window.matchMedia("(prefers-color-scheme: dark)").matches;
}

/** Applique le thème (ajoute/retire la classe `dark`) et mémorise la préférence. */
export function applyTheme(theme: Theme): void {
  if (typeof window === "undefined") return;
  const dark = theme === "dark" || (theme === "system" && prefersDark());
  document.documentElement.classList.toggle("dark", dark);
  window.localStorage.setItem(KEY, theme);
}

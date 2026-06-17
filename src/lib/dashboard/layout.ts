export type WidgetType =
  | "remaining"
  | "monthSpend"
  | "common"
  | "meal"
  | "watch"
  | "todo"
  | "people"
  | "goals"
  | "links";

export type WidgetSize = "small" | "medium" | "large";

export interface WidgetInstance {
  id: string;
  type: WidgetType;
  size: WidgetSize;
}

export interface WidgetMeta {
  type: WidgetType;
  label: string;
  icon: string;
  defaultSize: WidgetSize;
}

/** Catalogue des widgets disponibles pour l'accueil. */
export const WIDGET_CATALOG: WidgetMeta[] = [
  { type: "remaining", label: "Disponible ce mois", icon: "💰", defaultSize: "large" },
  { type: "monthSpend", label: "Dépensé / budget", icon: "📊", defaultSize: "small" },
  { type: "common", label: "Compte commun", icon: "🏦", defaultSize: "small" },
  { type: "meal", label: "Tickets restaurant", icon: "🍽️", defaultSize: "small" },
  { type: "watch", label: "Budgets à surveiller", icon: "🚦", defaultSize: "medium" },
  { type: "todo", label: "À traiter", icon: "📥", defaultSize: "medium" },
  { type: "people", label: "Répartition du foyer", icon: "👥", defaultSize: "large" },
  { type: "goals", label: "Objectifs d'épargne", icon: "🎯", defaultSize: "medium" },
  { type: "links", label: "Raccourcis", icon: "🧭", defaultSize: "small" },
];

export function widgetLabel(type: WidgetType): string {
  return WIDGET_CATALOG.find((w) => w.type === type)?.label ?? type;
}

export const DEFAULT_LAYOUT: WidgetInstance[] = [
  { id: "w_remaining", type: "remaining", size: "large" },
  { id: "w_common", type: "common", size: "small" },
  { id: "w_meal", type: "meal", size: "small" },
  { id: "w_watch", type: "watch", size: "medium" },
  { id: "w_todo", type: "todo", size: "medium" },
  { id: "w_people", type: "people", size: "large" },
  { id: "w_links", type: "links", size: "medium" },
];

const KEY = "comptes-couple-app:dashboard";

export function loadLayout(): WidgetInstance[] {
  if (typeof window === "undefined") return DEFAULT_LAYOUT;
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return DEFAULT_LAYOUT;
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.every((w) => w && w.id && w.type && w.size)) {
      return parsed as WidgetInstance[];
    }
  } catch {
    /* ignore */
  }
  return DEFAULT_LAYOUT;
}

export function saveLayout(layout: WidgetInstance[]): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(layout));
  } catch {
    /* ignore */
  }
}

export function nextSize(size: WidgetSize): WidgetSize {
  return size === "small" ? "medium" : size === "medium" ? "large" : "small";
}

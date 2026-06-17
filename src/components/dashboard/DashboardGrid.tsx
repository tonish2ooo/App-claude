"use client";

import { useEffect, useRef, useState } from "react";
import {
  DndContext,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import { SortableContext, arrayMove, rectSortingStrategy, useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Sheet } from "@/components/ui/Sheet";
import { WidgetCard, widgetHref, type WidgetCtx } from "@/components/dashboard/WidgetCard";
import {
  DEFAULT_LAYOUT,
  WIDGET_CATALOG,
  loadLayout,
  nextSize,
  saveLayout,
  type WidgetInstance,
  type WidgetSize,
} from "@/lib/dashboard/layout";

const SPAN: Record<WidgetSize, { col: number; row: number }> = {
  small: { col: 1, row: 1 },
  medium: { col: 2, row: 1 },
  large: { col: 2, row: 2 },
};

function SortableWidget({
  widget,
  ctx,
  editing,
  onCycleSize,
  onRemove,
}: {
  widget: WidgetInstance;
  ctx: WidgetCtx;
  editing: boolean;
  onCycleSize: () => void;
  onRemove: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: widget.id,
    disabled: !editing,
  });
  const span = SPAN[widget.size];
  const href = widgetHref(widget.type);

  const style: React.CSSProperties = {
    gridColumn: `span ${span.col}`,
    gridRow: `span ${span.row}`,
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.6 : 1,
    touchAction: editing ? "none" : undefined,
  };

  const inner = (
    <div className="relative h-full overflow-hidden rounded-[22px] border border-surface-muted/70 bg-surface p-4 shadow-card">
      {editing && (
        <div className="absolute right-2 top-2 z-10 flex gap-1.5">
          <button
            type="button"
            onPointerDown={(e) => e.stopPropagation()}
            onClick={onCycleSize}
            className="flex h-6 w-6 items-center justify-center rounded-full bg-surface-muted text-[10px] font-bold text-ink"
            aria-label="Changer la taille"
          >
            {widget.size === "small" ? "S" : widget.size === "medium" ? "M" : "L"}
          </button>
          <button
            type="button"
            onPointerDown={(e) => e.stopPropagation()}
            onClick={onRemove}
            className="flex h-6 w-6 items-center justify-center rounded-full bg-danger text-xs font-bold text-white"
            aria-label="Retirer"
          >
            ✕
          </button>
        </div>
      )}
      <WidgetCard type={widget.type} size={widget.size} ctx={ctx} />
    </div>
  );

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={editing ? "cursor-grab ring-2 ring-brand-600/40 rounded-[22px]" : ""}
      {...(editing ? { ...attributes, ...listeners } : {})}
      onClick={() => {
        if (!editing && href) ctx.navigate(href);
      }}
    >
      {inner}
    </div>
  );
}

export function DashboardGrid({ ctx }: { ctx: WidgetCtx }) {
  const [layout, setLayout] = useState<WidgetInstance[]>(DEFAULT_LAYOUT);
  const [editing, setEditing] = useState(false);
  const [adding, setAdding] = useState(false);
  const [rowPx, setRowPx] = useState(150);
  const gridRef = useRef<HTMLDivElement>(null);

  useEffect(() => setLayout(loadLayout()), []);

  useEffect(() => {
    const el = gridRef.current;
    if (!el) return;
    const measure = () => {
      const w = el.clientWidth;
      setRowPx(Math.max(110, Math.round((w - 12) / 2)));
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  function persist(next: WidgetInstance[]) {
    setLayout(next);
    saveLayout(next);
  }

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));

  function onDragEnd(e: DragEndEvent) {
    const { active, over } = e;
    if (!over || active.id === over.id) return;
    const from = layout.findIndex((w) => w.id === active.id);
    const to = layout.findIndex((w) => w.id === over.id);
    if (from < 0 || to < 0) return;
    persist(arrayMove(layout, from, to));
  }

  return (
    <>
      <div className="mb-2 mt-3 flex items-center justify-between px-1">
        <p className="text-[13px] font-semibold uppercase tracking-wider text-ink-muted">Accueil</p>
        <div className="flex items-center gap-3">
          {editing && (
            <button type="button" className="text-sm font-medium text-brand-600" onClick={() => setAdding(true)}>
              + Ajouter
            </button>
          )}
          <button
            type="button"
            className="text-sm font-medium text-brand-600"
            onClick={() => setEditing((v) => !v)}
          >
            {editing ? "Terminé" : "Personnaliser"}
          </button>
        </div>
      </div>

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
        <SortableContext items={layout.map((w) => w.id)} strategy={rectSortingStrategy}>
          <div
            ref={gridRef}
            className="grid grid-cols-2 gap-3"
            style={{ gridAutoRows: `${rowPx}px`, gridAutoFlow: "dense" }}
          >
            {layout.map((w) => (
              <SortableWidget
                key={w.id}
                widget={w}
                ctx={ctx}
                editing={editing}
                onCycleSize={() =>
                  persist(layout.map((x) => (x.id === w.id ? { ...x, size: nextSize(x.size) } : x)))
                }
                onRemove={() => persist(layout.filter((x) => x.id !== w.id))}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>

      {layout.length === 0 && (
        <p className="mt-4 text-center text-sm text-ink-muted">
          Aucun widget. Touchez « Personnaliser » puis « Ajouter ».
        </p>
      )}

      <Sheet open={adding} onClose={() => setAdding(false)} title="Ajouter un widget">
        <div className="space-y-2">
          {WIDGET_CATALOG.map((meta) => (
            <button
              key={meta.type}
              type="button"
              onClick={() => {
                persist([
                  ...layout,
                  { id: `w_${meta.type}_${Date.now().toString(36)}`, type: meta.type, size: meta.defaultSize },
                ]);
                setAdding(false);
              }}
              className="flex w-full items-center gap-3 rounded-xl bg-surface-subtle px-3 py-3 text-left text-sm font-medium"
            >
              <span className="text-xl">{meta.icon}</span>
              {meta.label}
            </button>
          ))}
        </div>
      </Sheet>
    </>
  );
}

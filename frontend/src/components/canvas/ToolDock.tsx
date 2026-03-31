"use client";

import {
  Circle,
  Crop,
  Hand,
  MousePointer2,
  Pencil,
  RectangleHorizontal,
  Slash,
  Eraser,
} from "lucide-react";

import { useCanvasStore } from "@/store/canvasStore";
import type { CanvasTool } from "@/types/canvas";

const tools: Array<{
  id: CanvasTool;
  label: string;
  shortcut: string;
  icon: typeof MousePointer2;
  disabled?: boolean;
}> = [
  { id: "select", label: "Select", shortcut: "V", icon: MousePointer2 },
  { id: "move", label: "Move", shortcut: "H", icon: Hand },
  { id: "brush", label: "Brush", shortcut: "B", icon: Pencil },
  { id: "eraser", label: "Eraser", shortcut: "E", icon: Eraser },
  {
    id: "rect",
    label: "Rectangle",
    shortcut: "R",
    icon: RectangleHorizontal,
  },
  { id: "ellipse", label: "Ellipse", shortcut: "O", icon: Circle },
  { id: "line", label: "Line", shortcut: "L", icon: Slash },
  { id: "crop", label: "Crop", shortcut: "C", icon: Crop, disabled: true },
];

export function ToolDock() {
  const activeTool = useCanvasStore((state) => state.activeTool);
  const setTool = useCanvasStore((state) => state.setTool);

  return (
    <>
      <aside className="sticky top-[92px] hidden h-[calc(100vh-110px)] w-[88px] shrink-0 rounded-[32px] border border-[var(--border)] bg-[var(--panel)] p-3 shadow-[0_24px_80px_rgba(15,23,42,0.08)] lg:flex lg:flex-col">
        <div className="mb-3 rounded-[24px] border border-[var(--border)] bg-[var(--panel-elevated)] px-3 py-4 text-center">
          <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-[var(--muted-foreground)]">
            Tools
          </p>
        </div>

        <div className="flex flex-1 flex-col gap-2 overflow-y-auto">
          {tools.map(({ id, label, shortcut, icon: Icon, disabled }) => {
            const isActive = activeTool === id;

            return (
              <button
                key={id}
                type="button"
                disabled={disabled}
                onClick={() => setTool(id)}
                className={`group relative flex h-14 items-center justify-center rounded-2xl border transition ${
                  isActive
                    ? "border-[var(--accent)] bg-[var(--accent)] text-[var(--accent-foreground)] shadow-lg shadow-[var(--accent)]/25"
                    : "border-[var(--border)] bg-[var(--panel-elevated)] text-[var(--foreground)] hover:border-[var(--accent)]/35 hover:text-[var(--accent)]"
                } disabled:cursor-not-allowed disabled:opacity-45`}
                aria-label={label}
                title={`${label}${disabled ? " (coming soon)" : ` (${shortcut})`}`}
              >
                <Icon size={18} />
                <span className="pointer-events-none absolute left-[calc(100%+12px)] top-1/2 hidden -translate-y-1/2 rounded-full border border-[var(--border)] bg-[var(--panel)] px-3 py-1 text-xs text-[var(--foreground)] shadow-xl group-hover:block">
                  {label} {disabled ? "Soon" : shortcut}
                </span>
              </button>
            );
          })}
        </div>

        <div className="mt-3 rounded-[24px] border border-[var(--border)] bg-[var(--panel-elevated)] px-3 py-4 text-center">
          <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[var(--muted-foreground)]">
            Studio
          </p>
          <p className="mt-1 text-xs leading-5 text-[var(--muted-foreground)]">
            Photoshop-style dock for workspace tools.
          </p>
        </div>
      </aside>

      <div className="fixed bottom-4 left-1/2 z-20 w-[min(92vw,680px)] -translate-x-1/2 rounded-[28px] border border-[var(--border)] bg-[color:var(--panel)]/92 p-2 shadow-[0_24px_80px_rgba(15,23,42,0.18)] backdrop-blur-xl lg:hidden">
        <div className="flex items-center justify-between gap-2 overflow-x-auto">
          {tools.map(({ id, label, icon: Icon, disabled }) => {
            const isActive = activeTool === id;

            return (
              <button
                key={id}
                type="button"
                disabled={disabled}
                onClick={() => setTool(id)}
                className={`flex min-w-[68px] flex-col items-center gap-1 rounded-2xl px-3 py-2 text-xs transition ${
                  isActive
                    ? "bg-[var(--accent)] text-[var(--accent-foreground)]"
                    : "text-[var(--foreground)]"
                } disabled:cursor-not-allowed disabled:opacity-45`}
              >
                <Icon size={16} />
                <span>{label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </>
  );
}

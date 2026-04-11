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
      {/* Desktop vertical rail */}
      <aside className="sticky top-[92px] z-30 hidden h-[calc(100vh-110px)] w-[72px] shrink-0 overflow-visible rounded-2xl border border-[var(--border)] bg-[var(--panel)] p-2 shadow-[0_8px_30px_rgba(0,0,0,0.06)] lg:flex lg:flex-col">
        <div className="flex flex-1 flex-col gap-1 overflow-visible">
          {tools.map(({ id, label, shortcut, icon: Icon, disabled }) => {
            const isActive = activeTool === id;

            return (
              <button
                key={id}
                type="button"
                disabled={disabled}
                onClick={() => setTool(id)}
                className={`group relative flex h-12 w-full items-center justify-center rounded-xl transition-all duration-150 ${
                  isActive
                    ? "bg-[var(--accent)] text-[var(--accent-foreground)] shadow-md shadow-[var(--accent)]/20"
                    : "text-[var(--muted-foreground)] hover:bg-[var(--panel-elevated)] hover:text-[var(--foreground)]"
                } disabled:cursor-not-allowed disabled:opacity-35`}
                aria-label={label}
              >
                <Icon size={18} strokeWidth={isActive ? 2.2 : 1.8} />
                {/* Tooltip flyout */}
                <span className="pointer-events-none absolute left-[calc(100%+10px)] top-1/2 z-50 hidden -translate-y-1/2 whitespace-nowrap rounded-lg bg-[var(--foreground)] px-2.5 py-1 text-[11px] font-medium text-[var(--background)] shadow-lg group-hover:block">
                  {label}
                  {!disabled && (
                    <span className="ml-1.5 rounded bg-white/15 px-1 py-0.5 text-[10px]">
                      {shortcut}
                    </span>
                  )}
                  {disabled && (
                    <span className="ml-1 text-[10px] opacity-60">Soon</span>
                  )}
                </span>
              </button>
            );
          })}
        </div>
      </aside>

      {/* Mobile bottom bar */}
      <div className="fixed bottom-4 left-1/2 z-20 w-[min(92vw,600px)] -translate-x-1/2 rounded-2xl border border-[var(--border)] bg-[color:var(--panel)]/92 p-1.5 shadow-[0_8px_30px_rgba(0,0,0,0.12)] backdrop-blur-xl lg:hidden">
        <div className="flex items-center justify-between gap-1 overflow-x-auto">
          {tools.map(({ id, label, icon: Icon, disabled }) => {
            const isActive = activeTool === id;

            return (
              <button
                key={id}
                type="button"
                disabled={disabled}
                onClick={() => setTool(id)}
                className={`flex min-w-[56px] flex-col items-center gap-0.5 rounded-xl px-2 py-1.5 text-[10px] transition-all duration-150 ${
                  isActive
                    ? "bg-[var(--accent)] text-[var(--accent-foreground)]"
                    : "text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
                } disabled:cursor-not-allowed disabled:opacity-35`}
              >
                <Icon size={16} strokeWidth={isActive ? 2.2 : 1.8} />
                <span className="font-medium">{label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </>
  );
}

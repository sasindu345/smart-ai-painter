"use client";

import { Eraser, Paintbrush } from "lucide-react";

import { useCanvasStore } from "@/store/canvasStore";

const tools = [
  {
    id: "brush" as const,
    label: "Brush",
    hint: "B",
    icon: Paintbrush,
  },
  {
    id: "eraser" as const,
    label: "Eraser",
    hint: "E",
    icon: Eraser,
  },
];

export function ToolbarPanel() {
  const activeTool = useCanvasStore((state) => state.activeTool);
  const setTool = useCanvasStore((state) => state.setTool);

  return (
    <section className="rounded-[28px] border border-[var(--border)] bg-[var(--panel)] p-4 shadow-[0_20px_60px_rgba(15,23,42,0.06)]">
      <p className="text-xs font-medium uppercase tracking-[0.22em] text-[var(--muted-foreground)]">
        Toolkit
      </p>
      <div className="mt-4 grid gap-3">
        {tools.map(({ id, label, hint, icon: Icon }) => {
          const isActive = activeTool === id;

          return (
            <button
              key={id}
              type="button"
              onClick={() => setTool(id)}
              className={`flex items-center justify-between rounded-2xl border px-4 py-3 text-left transition ${
                isActive
                  ? "border-[var(--accent)] bg-[var(--accent)] text-[var(--accent-foreground)] shadow-lg shadow-[var(--accent)]/20"
                  : "border-[var(--border)] bg-[var(--panel-elevated)] text-[var(--foreground)] hover:border-[var(--accent)]/35 hover:bg-[var(--panel)]"
              }`}
            >
              <span className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-black/10">
                  <Icon size={18} />
                </span>
                <span>
                  <span className="block font-medium">{label}</span>
                  <span className="block text-xs opacity-80">
                    {id === "brush"
                      ? "Freehand drawing"
                      : "Erase strokes cleanly"}
                  </span>
                </span>
              </span>
              <span className="rounded-full border border-current/20 px-2 py-1 text-xs">
                {hint}
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
}

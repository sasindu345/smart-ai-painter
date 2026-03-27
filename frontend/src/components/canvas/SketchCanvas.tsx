"use client";

import { useState } from "react";
import { Eraser, RotateCcw, RotateCw, Trash2 } from "lucide-react";

import { useCanvas } from "@/hooks/useCanvas";
import { useCanvasStore } from "@/store/canvasStore";

export function SketchCanvas() {
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const { canvasRef, undo, redo, clear } = useCanvas();
  const canRedo = useCanvasStore((state) => state.canRedo);
  const canUndo = useCanvasStore((state) => state.canUndo);
  const isEmpty = useCanvasStore((state) => state.isEmpty);

  return (
    <section className="relative rounded-[32px] border border-[var(--border)] bg-[var(--panel)] p-5 shadow-[0_24px_80px_rgba(15,23,42,0.08)]">
      <div className="mb-4 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.22em] text-[var(--muted-foreground)]">
            Sketch Board
          </p>
          <h2 className="mt-2 text-2xl font-semibold text-[var(--foreground)]">
            Draw your idea
          </h2>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={undo}
            disabled={!canUndo}
            className="inline-flex items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--panel-elevated)] px-4 py-2 text-sm text-[var(--foreground)] transition enabled:hover:border-[var(--accent)] enabled:hover:text-[var(--accent)] disabled:cursor-not-allowed disabled:opacity-45"
          >
            <RotateCcw size={16} />
            Undo
          </button>
          <button
            type="button"
            onClick={redo}
            disabled={!canRedo}
            className="inline-flex items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--panel-elevated)] px-4 py-2 text-sm text-[var(--foreground)] transition enabled:hover:border-[var(--accent)] enabled:hover:text-[var(--accent)] disabled:cursor-not-allowed disabled:opacity-45"
          >
            <RotateCw size={16} />
            Redo
          </button>
          <button
            type="button"
            onClick={() => setIsConfirmOpen(true)}
            disabled={isEmpty}
            className="inline-flex items-center gap-2 rounded-full border border-rose-300 bg-rose-50 px-4 py-2 text-sm text-rose-600 transition enabled:hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-45 dark:border-rose-500/40 dark:bg-rose-500/10 dark:text-rose-300"
          >
            <Trash2 size={16} />
            Clear
          </button>
        </div>
      </div>

      <div className="mb-3 flex items-center justify-between rounded-2xl border border-[var(--border)] bg-[var(--panel-elevated)] px-4 py-3 text-sm text-[var(--muted-foreground)]">
        <span>Shortcuts: Cmd/Ctrl + Z undo, Shift + Cmd/Ctrl + Z redo.</span>
        <span className="inline-flex items-center gap-2">
          <Eraser size={15} />
          Keep sketching, then move to AI generation in Phase 2.
        </span>
      </div>

      <div className="canvas-surface relative min-h-[540px] overflow-hidden rounded-[28px] border border-[var(--border)] bg-[var(--canvas)]">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.18),transparent_30%),linear-gradient(180deg,transparent,rgba(15,23,42,0.04))]" />
        <canvas ref={canvasRef} className="relative h-full w-full" />
      </div>

      {isConfirmOpen ? (
        <div className="absolute inset-0 flex items-center justify-center rounded-[32px] bg-black/35 p-5 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-[28px] border border-[var(--border)] bg-[var(--panel)] p-6 shadow-2xl">
            <p className="text-xs font-medium uppercase tracking-[0.22em] text-[var(--muted-foreground)]">
              Confirm Clear
            </p>
            <h3 className="mt-2 text-xl font-semibold text-[var(--foreground)]">
              Remove all strokes?
            </h3>
            <p className="mt-2 text-sm leading-6 text-[var(--muted-foreground)]">
              This resets the canvas to a blank state and clears the current
              undo history.
            </p>
            <div className="mt-6 flex gap-3">
              <button
                type="button"
                onClick={() => setIsConfirmOpen(false)}
                className="flex-1 rounded-2xl border border-[var(--border)] bg-[var(--panel-elevated)] px-4 py-3 text-sm text-[var(--foreground)] transition hover:border-[var(--accent)]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  clear();
                  setIsConfirmOpen(false);
                }}
                className="flex-1 rounded-2xl bg-[var(--accent)] px-4 py-3 text-sm font-medium text-[var(--accent-foreground)] transition hover:opacity-90"
              >
                Clear Canvas
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}

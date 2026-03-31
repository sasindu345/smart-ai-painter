"use client";

import type { RefObject } from "react";

import { useCanvasStore } from "@/store/canvasStore";

type SketchCanvasProps = {
  surfaceRef: RefObject<HTMLDivElement>;
  canvasRef: RefObject<HTMLCanvasElement>;
};

export function SketchCanvas({ surfaceRef, canvasRef }: SketchCanvasProps) {
  const activeTool = useCanvasStore((state) => state.activeTool);
  const pagePreset = useCanvasStore((state) => state.pagePreset);
  const pageWidth = useCanvasStore((state) => state.pageWidth);
  const pageHeight = useCanvasStore((state) => state.pageHeight);

  return (
    <section className="flex min-h-[calc(100vh-13rem)] flex-col rounded-[36px] border border-[var(--border)] bg-[var(--panel)] p-4 shadow-[0_30px_100px_rgba(15,23,42,0.10)]">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-[28px] border border-[var(--border)] bg-[var(--panel-elevated)] px-4 py-3">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.22em] text-[var(--muted-foreground)]">
            Canvas Workspace
          </p>
          <h2 className="mt-1 text-2xl font-semibold text-[var(--foreground)]">
            Full-width sketch board
          </h2>
        </div>

        <div className="flex flex-wrap items-center gap-2 text-sm text-[var(--muted-foreground)]">
          <span className="rounded-full border border-[var(--border)] bg-[var(--panel)] px-3 py-1.5">
            Tool: {activeTool}
          </span>
          <span className="rounded-full border border-[var(--border)] bg-[var(--panel)] px-3 py-1.5">
            Page: {pagePreset}
          </span>
          <span className="rounded-full border border-[var(--border)] bg-[var(--panel)] px-3 py-1.5">
            {pageWidth} × {pageHeight}
          </span>
        </div>
      </div>

      <div className="flex-1 overflow-auto rounded-[30px] border border-[var(--border)] bg-[linear-gradient(180deg,rgba(255,255,255,0.16),rgba(15,23,42,0.02))] p-4">
        <div className="flex min-h-full items-center justify-center">
          <div
            ref={surfaceRef}
            className="canvas-surface relative w-full overflow-hidden rounded-[28px] border border-[var(--border)] bg-[var(--canvas)] shadow-[0_32px_100px_rgba(15,23,42,0.12)]"
            style={{ aspectRatio: `${pageWidth} / ${pageHeight}` }}
          >
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.2),transparent_28%),linear-gradient(135deg,rgba(255,255,255,0.06),transparent_38%),linear-gradient(180deg,transparent,rgba(15,23,42,0.04))]" />
            <canvas
              ref={canvasRef}
              className="block"
              aria-label="Drawing canvas"
            />
          </div>
        </div>
      </div>
    </section>
  );
}

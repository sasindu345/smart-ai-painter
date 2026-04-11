"use client";

import type { RefObject } from "react";

import { useCanvasStore } from "@/store/canvasStore";

type SketchCanvasProps = {
  surfaceRef: RefObject<HTMLDivElement>;
  canvasRef: RefObject<HTMLCanvasElement>;
};

export function SketchCanvas({ surfaceRef, canvasRef }: SketchCanvasProps) {
  const pagePreset = useCanvasStore((state) => state.pagePreset);
  const pageWidth = useCanvasStore((state) => state.pageWidth);
  const pageHeight = useCanvasStore((state) => state.pageHeight);

  return (
    <section className="flex min-h-[calc(100vh-13rem)] flex-col rounded-2xl border border-[var(--border)] bg-[var(--panel)] p-3 shadow-[0_2px_12px_rgba(0,0,0,0.04)]">
      <div className="flex-1 overflow-auto rounded-xl bg-[var(--background)] p-4">
        <div className="flex min-h-full items-center justify-center">
          <div
            ref={surfaceRef}
            className="canvas-surface relative w-full overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--canvas)] shadow-[0_8px_30px_rgba(0,0,0,0.08)]"
            style={{ aspectRatio: `${pageWidth} / ${pageHeight}` }}
          >
            <canvas
              ref={canvasRef}
              className="block"
              role="img"
              aria-label={`Drawing canvas, ${pagePreset} ${pageWidth} by ${pageHeight}`}
              tabIndex={0}
            />
          </div>
        </div>
      </div>
    </section>
  );
}

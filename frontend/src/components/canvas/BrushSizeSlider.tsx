"use client";

import { useCanvasStore } from "@/store/canvasStore";

export function BrushSizeSlider() {
  const brushColor = useCanvasStore((state) => state.brushColor);
  const brushSize = useCanvasStore((state) => state.brushSize);
  const setSize = useCanvasStore((state) => state.setSize);

  return (
    <section className="rounded-[28px] border border-[var(--border)] bg-[var(--panel)] p-4 shadow-[0_20px_60px_rgba(15,23,42,0.06)]">
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium uppercase tracking-[0.22em] text-[var(--muted-foreground)]">
          Brush Size
        </p>
        <span className="rounded-full bg-[var(--panel-elevated)] px-3 py-1 text-sm text-[var(--foreground)]">
          {brushSize}px
        </span>
      </div>

      <input
        type="range"
        min={1}
        max={50}
        value={brushSize}
        onChange={(event) => setSize(Number(event.target.value))}
        className="mt-4 w-full accent-[var(--accent)]"
      />

      <div className="mt-5 flex items-center gap-4 rounded-2xl bg-[var(--panel-elevated)] p-4">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-[var(--border)] bg-[var(--canvas)]">
          <span
            className="block rounded-full"
            style={{
              width: `${brushSize}px`,
              height: `${brushSize}px`,
              backgroundColor: brushColor,
            }}
          />
        </div>
        <p className="text-sm leading-6 text-[var(--muted-foreground)]">
          Preview matches the active brush diameter so stroke weight feels
          predictable.
        </p>
      </div>
    </section>
  );
}

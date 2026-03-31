"use client";

import { useMemo } from "react";

import { useCanvasStore } from "@/store/canvasStore";

const presetColors = [
  "#111827",
  "#ef4444",
  "#f97316",
  "#facc15",
  "#22c55e",
  "#14b8a6",
  "#3b82f6",
  "#a855f7",
];

const isValidHexColor = (value: string) => /^#([0-9a-fA-F]{6})$/.test(value);

export function ColorPicker() {
  const brushColor = useCanvasStore((state) => state.brushColor);
  const setColor = useCanvasStore((state) => state.setColor);

  const normalizedValue = useMemo(() => brushColor.toUpperCase(), [brushColor]);

  return (
    <section className="rounded-[28px] border border-[var(--border)] bg-[var(--panel)] p-4 shadow-[0_20px_60px_rgba(15,23,42,0.06)]">
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium uppercase tracking-[0.22em] text-[var(--muted-foreground)]">
          Color
        </p>
        <span className="rounded-full border border-[var(--border)] bg-[var(--panel-elevated)] px-3 py-1 font-mono text-xs text-[var(--foreground)]">
          {normalizedValue}
        </span>
      </div>

      <div className="mt-4 grid grid-cols-4 gap-3">
        {presetColors.map((swatch) => {
          const isActive = brushColor.toUpperCase() === swatch.toUpperCase();

          return (
            <button
              key={swatch}
              type="button"
              onClick={() => setColor(swatch)}
              className={`h-12 rounded-2xl border-2 transition ${
                isActive
                  ? "scale-[1.03] border-[var(--foreground)] shadow-lg"
                  : "border-transparent hover:scale-[1.02]"
              }`}
              style={{ backgroundColor: swatch }}
              aria-label={`Select ${swatch}`}
            />
          );
        })}
      </div>

      <label className="mt-4 block text-sm text-[var(--muted-foreground)]">
        Hex value
        <input
          type="text"
          value={normalizedValue}
          onChange={(event) => setColor(event.target.value)}
          className={`mt-2 w-full rounded-2xl border bg-[var(--panel-elevated)] px-4 py-3 font-mono text-sm uppercase text-[var(--foreground)] outline-none transition ${
            isValidHexColor(brushColor)
              ? "border-[var(--border)] focus:border-[var(--accent)]"
              : "border-rose-500"
          }`}
          spellCheck={false}
          maxLength={7}
        />
      </label>
      {!isValidHexColor(brushColor) ? (
        <p className="mt-2 text-xs text-rose-500">
          Use a full 6-digit hex color like `#3B82F6`.
        </p>
      ) : null}
    </section>
  );
}

"use client";

import { ART_STYLES, type ArtStyle } from "@/types/generate";

type StylePillsProps = {
  value: ArtStyle;
  onChange: (style: ArtStyle) => void;
};

export function StylePills({ value, onChange }: StylePillsProps) {
  return (
    <div className="space-y-1.5">
      <p className="text-xs font-medium uppercase tracking-[0.18em] text-[var(--muted-foreground)]">
        Style
      </p>
      <div className="flex flex-wrap gap-2">
        {ART_STYLES.map((s) => (
          <button
            key={s.value}
            type="button"
            onClick={() => onChange(s.value)}
            className={`rounded-xl px-4 py-2 text-sm font-medium transition ${
              value === s.value
                ? "bg-[var(--accent)] text-[var(--accent-foreground)] shadow-md"
                : "border border-[var(--border)] bg-[var(--panel-elevated)] text-[var(--foreground)] hover:border-[var(--accent)]"
            }`}
          >
            {s.label}
          </button>
        ))}
      </div>
    </div>
  );
}

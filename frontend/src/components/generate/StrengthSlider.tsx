"use client";

type StrengthSliderProps = {
  value: number;
  onChange: (value: number) => void;
};

export function StrengthSlider({ value, onChange }: StrengthSliderProps) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <label
          htmlFor="strength-slider"
          className="text-xs font-medium uppercase tracking-[0.18em] text-[var(--muted-foreground)]"
        >
          AI Strength
        </label>
        <span className="text-xs font-semibold text-[var(--foreground)]">
          {value}%
        </span>
      </div>
      <input
        id="strength-slider"
        type="range"
        min={0}
        max={100}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="h-2 w-full cursor-pointer appearance-none rounded-full bg-[var(--border)] accent-[var(--accent)]"
      />
      <div className="flex justify-between text-[10px] text-[var(--muted-foreground)]">
        <span>Subtle</span>
        <span>Strong</span>
      </div>
    </div>
  );
}

"use client";

const MAX_LENGTH = 200;

type PromptInputProps = {
  value: string;
  onChange: (value: string) => void;
};

export function PromptInput({ value, onChange }: PromptInputProps) {
  const remaining = MAX_LENGTH - value.length;

  return (
    <div className="space-y-1.5">
      <label
        htmlFor="prompt-input"
        className="text-xs font-medium uppercase tracking-[0.18em] text-[var(--muted-foreground)]"
      >
        Prompt
      </label>
      <textarea
        id="prompt-input"
        value={value}
        onChange={(e) => onChange(e.target.value.slice(0, MAX_LENGTH))}
        placeholder="Describe the artwork you want to generate…"
        rows={3}
        maxLength={MAX_LENGTH}
        className="w-full resize-none rounded-2xl border border-[var(--border)] bg-[var(--panel-elevated)] px-4 py-3 text-sm text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] focus:border-[var(--accent)] focus:outline-none"
      />
      <p
        className={`text-right text-xs ${
          remaining <= 20 ? "text-red-500" : "text-[var(--muted-foreground)]"
        }`}
      >
        {remaining} characters remaining
      </p>
    </div>
  );
}

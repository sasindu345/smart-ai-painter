"use client";

import { Loader2, Sparkles } from "lucide-react";

type GenerateButtonProps = {
  onClick: () => void;
  disabled: boolean;
  isLoading: boolean;
};

export function GenerateButton({
  onClick,
  disabled,
  isLoading,
}: GenerateButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled || isLoading}
      className="flex w-full items-center justify-center gap-2 rounded-2xl bg-[var(--accent)] px-6 py-3.5 text-sm font-semibold text-[var(--accent-foreground)] shadow-lg transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
    >
      {isLoading ? (
        <>
          <Loader2 size={18} className="animate-spin" />
          Generating…
        </>
      ) : (
        <>
          <Sparkles size={18} />
          Generate
        </>
      )}
    </button>
  );
}

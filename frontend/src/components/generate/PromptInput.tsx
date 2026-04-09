"use client";

import { useEffect, useRef, useState } from "react";

import { History, X } from "lucide-react";

import { usePromptHistory } from "@/hooks/usePromptHistory";

const MAX_LENGTH = 200;

type PromptInputProps = {
  value: string;
  onChange: (value: string) => void;
};

export function PromptInput({ value, onChange }: PromptInputProps) {
  const remaining = MAX_LENGTH - value.length;
  const { history, removePrompt, clearHistory } = usePromptHistory();
  const [historyOpen, setHistoryOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!historyOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setHistoryOpen(false);
      }
    };

    const handleKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setHistoryOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    window.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      window.removeEventListener("keydown", handleKey);
    };
  }, [historyOpen]);

  return (
    <div className="space-y-1.5" ref={containerRef}>
      <div className="flex items-center justify-between">
        <label
          htmlFor="prompt-input"
          className="text-xs font-medium uppercase tracking-[0.18em] text-[var(--muted-foreground)]"
        >
          Prompt
        </label>
        {history.length > 0 && (
          <div className="relative">
            <button
              type="button"
              onClick={() => setHistoryOpen((open) => !open)}
              aria-haspopup="listbox"
              aria-expanded={historyOpen}
              className="inline-flex items-center gap-1.5 rounded-full border border-[var(--border)] bg-[var(--panel)] px-2.5 py-1 text-[11px] font-medium text-[var(--muted-foreground)] transition hover:border-[var(--accent)] hover:text-[var(--accent)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
            >
              <History size={12} />
              History ({history.length})
            </button>

            {historyOpen && (
              <div
                role="listbox"
                aria-label="Recent prompts"
                className="absolute right-0 top-[calc(100%+6px)] z-30 w-[min(92vw,320px)] rounded-2xl border border-[var(--border)] bg-[var(--panel-elevated)] p-2 shadow-[0_24px_80px_rgba(15,23,42,0.18)] backdrop-blur-xl"
              >
                <div className="mb-1 flex items-center justify-between px-2 py-1">
                  <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--muted-foreground)]">
                    Recent prompts
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      clearHistory();
                      setHistoryOpen(false);
                    }}
                    className="text-[10px] font-medium uppercase tracking-[0.12em] text-[var(--muted-foreground)] transition hover:text-rose-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
                  >
                    Clear all
                  </button>
                </div>

                <ul className="max-h-[240px] space-y-1 overflow-y-auto">
                  {history.map((prompt) => (
                    <li key={prompt} className="group flex items-center gap-1">
                      <button
                        type="button"
                        role="option"
                        aria-selected={value === prompt}
                        onClick={() => {
                          onChange(prompt.slice(0, MAX_LENGTH));
                          setHistoryOpen(false);
                        }}
                        className="flex-1 rounded-xl px-3 py-2 text-left text-xs text-[var(--foreground)] transition hover:bg-[var(--panel)] focus:outline-none focus-visible:bg-[var(--panel)]"
                      >
                        <span className="line-clamp-2">{prompt}</span>
                      </button>
                      <button
                        type="button"
                        onClick={(event) => {
                          event.stopPropagation();
                          removePrompt(prompt);
                        }}
                        aria-label={`Remove prompt ${prompt}`}
                        className="rounded-full p-1.5 text-[var(--muted-foreground)] opacity-0 transition group-hover:opacity-100 hover:bg-[var(--panel)] hover:text-rose-500 focus:opacity-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
                      >
                        <X size={12} />
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>
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

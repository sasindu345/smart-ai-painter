"use client";

import { useEffect, useState } from "react";

import { Brush, Eye, Sparkles, X } from "lucide-react";

const STORAGE_KEY = "smart-ai-painter:onboarding-dismissed";

const STEPS = [
  {
    icon: Brush,
    title: "Sketch freely",
    description:
      "Use brushes, shapes, and the eraser on the full-width canvas. Your strokes are tracked for undo and redo.",
  },
  {
    icon: Eye,
    title: "Open the AI preview",
    description:
      "When you're ready, hit Show AI Preview to slide out the generation drawer without losing your canvas.",
  },
  {
    icon: Sparkles,
    title: "Describe and generate",
    description:
      "Type a prompt, pick a style, and let AI turn your sketch into polished artwork.",
  },
];

export function OnboardingHint() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const dismissed = window.localStorage.getItem(STORAGE_KEY);
    if (!dismissed) {
      setVisible(true);
    }
  }, []);

  function dismiss() {
    setVisible(false);
    if (typeof window !== "undefined") {
      window.localStorage.setItem(STORAGE_KEY, "1");
    }
  }

  if (!visible) {
    return null;
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="onboarding-title"
      aria-describedby="onboarding-desc"
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 backdrop-blur-sm sm:items-center"
    >
      <div className="relative w-full max-w-lg rounded-[28px] border border-[var(--border)] bg-[var(--panel-elevated)] p-6 shadow-[0_30px_120px_rgba(15,23,42,0.30)]">
        <button
          type="button"
          onClick={dismiss}
          aria-label="Close onboarding hint"
          className="absolute right-4 top-4 rounded-full p-1.5 text-[var(--muted-foreground)] transition hover:bg-[var(--panel)] hover:text-[var(--foreground)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
        >
          <X size={16} />
        </button>

        <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[var(--muted-foreground)]">
          Welcome
        </p>
        <h2
          id="onboarding-title"
          className="mt-1 text-2xl font-semibold text-[var(--foreground)]"
        >
          Make something with Smart AI Painter
        </h2>
        <p
          id="onboarding-desc"
          className="mt-2 text-sm text-[var(--muted-foreground)]"
        >
          A quick tour so you can get to drawing in seconds.
        </p>

        <ul className="mt-5 space-y-3">
          {STEPS.map(({ icon: Icon, title, description }) => (
            <li
              key={title}
              className="flex gap-3 rounded-2xl border border-[var(--border)] bg-[var(--panel)] p-3"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[var(--accent)] text-[var(--accent-foreground)]">
                <Icon size={18} />
              </div>
              <div>
                <p className="text-sm font-semibold text-[var(--foreground)]">
                  {title}
                </p>
                <p className="text-xs leading-5 text-[var(--muted-foreground)]">
                  {description}
                </p>
              </div>
            </li>
          ))}
        </ul>

        <div className="mt-5 flex justify-end">
          <button
            type="button"
            onClick={dismiss}
            className="inline-flex items-center gap-2 rounded-full bg-[var(--accent)] px-5 py-2.5 text-sm font-medium text-[var(--accent-foreground)] transition hover:opacity-90 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
          >
            Got it, let&apos;s draw
          </button>
        </div>
      </div>
    </div>
  );
}

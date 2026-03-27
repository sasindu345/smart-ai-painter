"use client";

import { MoonStar, Sparkles, SunMedium } from "lucide-react";
import { useTheme } from "next-themes";

export function TopBar() {
  const { resolvedTheme, setTheme } = useTheme();
  const isDark = resolvedTheme === "dark";

  return (
    <header className="sticky top-0 z-20 border-b border-[var(--border)] bg-[color:var(--panel)]/80 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-5 py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[var(--accent)] text-[var(--accent-foreground)] shadow-lg shadow-black/15">
            <Sparkles size={18} />
          </div>
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.28em] text-[var(--muted-foreground)]">
              Smart AI Painter
            </p>
            <h1 className="text-lg font-semibold text-[var(--foreground)]">
              Canvas Studio
            </h1>
          </div>
        </div>

        <nav className="hidden items-center gap-6 text-sm text-[var(--muted-foreground)] md:flex">
          <span>Canvas</span>
          <span>Generate</span>
          <span>Gallery</span>
        </nav>

        <button
          type="button"
          onClick={() => setTheme(isDark ? "light" : "dark")}
          className="inline-flex items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--panel-elevated)] px-4 py-2 text-sm font-medium text-[var(--foreground)] transition hover:border-[var(--accent)] hover:text-[var(--accent)]"
        >
          {isDark ? <SunMedium size={16} /> : <MoonStar size={16} />}
          {isDark ? "Light" : "Dark"}
        </button>
      </div>
    </header>
  );
}

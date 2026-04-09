"use client";

import { useEffect, useState } from "react";

import { useState as useMenuState } from "react";

import Link from "next/link";
import { LogIn, Menu, MoonStar, Sparkles, SunMedium, X } from "lucide-react";
import { useTheme } from "next-themes";

import { AuthModal } from "@/components/auth/AuthModal";
import { UserAvatar } from "@/components/auth/UserAvatar";
import { useAuth } from "@/hooks/useAuth";

export function TopBar() {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useMenuState(false);
  const { user, loading } = useAuth();

  useEffect(() => setMounted(true), []);

  const isDark = resolvedTheme === "dark";

  return (
    <>
      <header className="sticky top-0 z-20 border-b border-[var(--border)] bg-[color:var(--panel)]/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-[1800px] items-center justify-between gap-4 px-5 py-4">
          <Link href="/" className="flex items-center gap-3">
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
          </Link>

          <nav
            className="hidden items-center gap-6 text-sm text-[var(--muted-foreground)] md:flex"
            aria-label="Primary"
          >
            <Link
              href="/canvas"
              className="transition hover:text-[var(--accent)]"
            >
              Canvas
            </Link>
            <Link
              href="/generate"
              className="transition hover:text-[var(--accent)]"
            >
              Generate
            </Link>
            <Link
              href="/gallery"
              className="transition hover:text-[var(--accent)]"
            >
              Gallery
            </Link>
          </nav>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="inline-flex items-center justify-center rounded-full border border-[var(--border)] bg-[var(--panel-elevated)] p-2 text-[var(--foreground)] transition hover:border-[var(--accent)] hover:text-[var(--accent)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] md:hidden"
              aria-label="Toggle navigation menu"
              aria-expanded={mobileMenuOpen}
              aria-controls="mobile-nav"
            >
              {mobileMenuOpen ? <X size={18} /> : <Menu size={18} />}
            </button>
            <button
              type="button"
              onClick={() => setTheme(isDark ? "light" : "dark")}
              aria-label={`Switch to ${isDark ? "light" : "dark"} theme`}
              aria-pressed={isDark}
              className="inline-flex items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--panel-elevated)] px-4 py-2 text-sm font-medium text-[var(--foreground)] transition hover:border-[var(--accent)] hover:text-[var(--accent)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
            >
              {mounted ? (
                isDark ? (
                  <SunMedium size={16} />
                ) : (
                  <MoonStar size={16} />
                )
              ) : (
                <MoonStar size={16} />
              )}
              {mounted ? (isDark ? "Light" : "Dark") : "Dark"}
            </button>

            {!loading &&
              (user ? (
                <UserAvatar />
              ) : (
                <button
                  type="button"
                  onClick={() => setAuthOpen(true)}
                  className="inline-flex items-center gap-2 rounded-full bg-[var(--accent)] px-4 py-2 text-sm font-medium text-[var(--accent-foreground)] transition hover:opacity-90"
                >
                  <LogIn size={16} />
                  Sign In
                </button>
              ))}
          </div>
        </div>
      </header>

      {mobileMenuOpen && (
        <nav
          id="mobile-nav"
          aria-label="Mobile"
          className="fixed inset-x-0 top-[73px] z-30 border-b border-[var(--border)] bg-[color:var(--panel)]/96 p-4 backdrop-blur-xl md:hidden"
        >
          <div className="flex flex-col gap-2">
            {[
              { href: "/canvas", label: "Canvas" },
              { href: "/generate", label: "Generate" },
              { href: "/gallery", label: "Gallery" },
            ].map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                onClick={() => setMobileMenuOpen(false)}
                className="rounded-xl px-4 py-3 text-sm font-medium text-[var(--foreground)] transition hover:bg-[var(--panel-elevated)]"
              >
                {label}
              </Link>
            ))}
          </div>
        </nav>
      )}

      <AuthModal open={authOpen} onClose={() => setAuthOpen(false)} />
    </>
  );
}

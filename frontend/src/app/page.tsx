import Link from "next/link";
import { ArrowRight, Sparkles } from "lucide-react";

import { TopBar } from "@/components/shared/TopBar";

export default function HomePage() {
  return (
    <>
      <TopBar />
      <main className="min-h-screen bg-[var(--background)] px-4 py-10 sm:px-6 lg:px-8">
        <section className="mx-auto grid max-w-[1400px] gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
          <div className="max-w-2xl">
            <p className="inline-flex items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--panel)] px-4 py-2 text-sm text-[var(--muted-foreground)] shadow-[0_14px_40px_rgba(15,23,42,0.06)]">
              <Sparkles size={16} className="text-[var(--accent)]" />
              Workspace-first editor for sketch-to-image creation
            </p>
            <h1 className="mt-6 text-5xl font-semibold leading-tight text-[var(--foreground)] sm:text-6xl">
              Draw with the full canvas first. Open AI preview only when you
              need it.
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-8 text-[var(--muted-foreground)]">
              Smart AI Painter now starts from a real editor workspace: left
              tool dock, full-width drawing area, page presets, and an AI result
              drawer that stays out of the way while you sketch.
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-4">
              <Link
                href="/canvas"
                className="inline-flex items-center gap-2 rounded-full bg-[var(--accent)] px-6 py-3 text-sm font-medium text-[var(--accent-foreground)] transition hover:opacity-90"
              >
                Open Canvas Workspace
                <ArrowRight size={16} />
              </Link>
              <Link
                href="/gallery"
                className="inline-flex items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--panel)] px-6 py-3 text-sm font-medium text-[var(--foreground)] transition hover:border-[var(--accent)] hover:text-[var(--accent)]"
              >
                View Gallery
              </Link>
            </div>
          </div>

          <div className="rounded-[40px] border border-[var(--border)] bg-[linear-gradient(180deg,var(--panel),rgba(255,255,255,0.18))] p-6 shadow-[0_30px_120px_rgba(15,23,42,0.10)]">
            <div className="rounded-[28px] border border-[var(--border)] bg-[var(--panel-elevated)] p-5">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--accent)] text-[var(--accent-foreground)]">
                  <Sparkles size={20} />
                </div>
                <div>
                  <p className="text-xs font-medium uppercase tracking-[0.22em] text-[var(--muted-foreground)]">
                    Phase 1 Upgrade
                  </p>
                  <h2 className="mt-1 text-2xl font-semibold text-[var(--foreground)]">
                    Workspace shell
                  </h2>
                </div>
              </div>

              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                <div className="rounded-[24px] border border-[var(--border)] bg-[var(--panel)] p-4">
                  <p className="text-xs font-medium uppercase tracking-[0.2em] text-[var(--muted-foreground)]">
                    Editor
                  </p>
                  <p className="mt-2 text-sm leading-6 text-[var(--foreground)]">
                    Left tool dock, full-width drawing area, page presets, zoom,
                    and shape tools in progress.
                  </p>
                </div>
                <div className="rounded-[24px] border border-[var(--border)] bg-[var(--panel)] p-4">
                  <p className="text-xs font-medium uppercase tracking-[0.2em] text-[var(--muted-foreground)]">
                    AI Flow
                  </p>
                  <p className="mt-2 text-sm leading-6 text-[var(--foreground)]">
                    Result preview moves into an on-demand drawer so the canvas
                    never loses working space.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
    </>
  );
}

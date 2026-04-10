import Link from "next/link";
import { ArrowRight, Brush, Sparkles, Layers, Wand2 } from "lucide-react";

import { TopBar } from "@/components/shared/TopBar";

export default function HomePage() {
  return (
    <>
      <TopBar />
      <main className="min-h-screen bg-[var(--background)] px-4 py-6 sm:px-6 sm:py-10 lg:px-8">
        {/* Hero */}
        <section className="mx-auto grid max-w-[1400px] gap-8 sm:gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
          <div className="max-w-2xl">
            <p className="inline-flex items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--panel)] px-3 py-1.5 text-xs text-[var(--muted-foreground)] shadow-[0_14px_40px_rgba(15,23,42,0.06)] sm:px-4 sm:py-2 sm:text-sm">
              <Sparkles size={14} className="text-[var(--accent)]" />
              Sketch-to-image AI editor
            </p>
            <h1 className="mt-4 text-3xl font-semibold leading-[1.15] text-[var(--foreground)] sm:mt-6 sm:text-5xl sm:leading-tight lg:text-6xl">
              Draw first. Generate when you&rsquo;re ready.
            </h1>
            <p className="mt-4 text-base leading-7 text-[var(--muted-foreground)] sm:mt-6 sm:max-w-xl sm:text-lg sm:leading-8">
              A real editor workspace with drawing tools, page presets, and an
              AI result panel that stays out of your way while you sketch.
            </p>

            <div className="mt-6 flex flex-col gap-3 sm:mt-8 sm:flex-row sm:items-center sm:gap-4">
              <Link
                href="/canvas"
                className="inline-flex items-center justify-center gap-2 rounded-full bg-[var(--accent)] px-6 py-3.5 text-sm font-medium text-[var(--accent-foreground)] shadow-lg shadow-[var(--accent)]/20 transition hover:opacity-90 active:scale-[0.97]"
              >
                Open Canvas
                <ArrowRight size={16} />
              </Link>
              <Link
                href="/gallery"
                className="inline-flex items-center justify-center gap-2 rounded-full border border-[var(--border)] bg-[var(--panel)] px-6 py-3.5 text-sm font-medium text-[var(--foreground)] transition hover:border-[var(--accent)] hover:text-[var(--accent)] active:scale-[0.97]"
              >
                View Gallery
              </Link>
            </div>
          </div>

          {/* Feature card */}
          <div className="rounded-[28px] border border-[var(--border)] bg-[linear-gradient(180deg,var(--panel),rgba(255,255,255,0.18))] p-4 shadow-[0_30px_120px_rgba(15,23,42,0.10)] sm:rounded-[40px] sm:p-6">
            <div className="rounded-[20px] border border-[var(--border)] bg-[var(--panel-elevated)] p-4 sm:rounded-[28px] sm:p-5">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--accent)] text-[var(--accent-foreground)] sm:h-12 sm:w-12 sm:rounded-2xl">
                  <Sparkles size={18} />
                </div>
                <div>
                  <p className="text-[10px] font-medium uppercase tracking-[0.22em] text-[var(--muted-foreground)] sm:text-xs">
                    What&rsquo;s inside
                  </p>
                  <h2 className="mt-0.5 text-lg font-semibold text-[var(--foreground)] sm:text-2xl">
                    Workspace shell
                  </h2>
                </div>
              </div>

              <div className="mt-4 grid gap-3 sm:mt-6 sm:grid-cols-2">
                <FeatureCard
                  icon={Brush}
                  title="Editor"
                  description="Tool dock, full-width canvas, page presets, zoom, and shape tools."
                />
                <FeatureCard
                  icon={Wand2}
                  title="AI Flow"
                  description="Generate artwork from sketches with an on-demand AI result panel."
                />
                <FeatureCard
                  icon={Layers}
                  title="Gallery"
                  description="Save, browse, and share your generated artworks from one place."
                />
                <FeatureCard
                  icon={Sparkles}
                  title="Mobile"
                  description="Dedicated phone and tablet layouts with touch-first controls."
                />
              </div>
            </div>
          </div>
        </section>
      </main>
    </>
  );
}

function FeatureCard({
  icon: Icon,
  title,
  description,
}: {
  icon: typeof Sparkles;
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-2xl border border-[var(--border)] bg-[var(--panel)] p-3.5 sm:rounded-[24px] sm:p-4">
      <div className="flex items-center gap-2">
        <Icon size={14} className="shrink-0 text-[var(--accent)]" />
        <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--muted-foreground)] sm:text-xs">
          {title}
        </p>
      </div>
      <p className="mt-1.5 text-[13px] leading-5 text-[var(--foreground)] sm:mt-2 sm:text-sm sm:leading-6">
        {description}
      </p>
    </div>
  );
}

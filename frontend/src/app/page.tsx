"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  Brush,
  Circle,
  Layers,
  MousePointer2,
  Pencil,
  Play,
  RectangleHorizontal,
  Slash,
  Sparkles,
  Wand2,
  Zap,
} from "lucide-react";

import { TopBar } from "@/components/shared/TopBar";

/* ------------------------------------------------------------------ */
/*  Tiny hook: triggers once the element scrolls into view             */
/* ------------------------------------------------------------------ */
function useInView<T extends HTMLElement>(threshold = 0.15) {
  const ref = useRef<T>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setVisible(true);
          io.disconnect();
        }
      },
      { threshold },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [threshold]);

  return { ref, visible };
}

/* ------------------------------------------------------------------ */
/*  Mini canvas preview — draws random strokes                         */
/* ------------------------------------------------------------------ */
function MiniCanvasPreview() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const w = 320;
    const h = 200;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    ctx.scale(dpr, dpr);

    const colors = ["#ff6b57", "#7dd3fc", "#f59e0b", "#16a34a", "#7c3aed"];
    let frame = 0;
    let animId: number;

    function drawStroke(
      points: Array<{ x: number; y: number }>,
      color: string,
      width: number,
    ) {
      if (!ctx || points.length < 2) return;
      ctx.strokeStyle = color;
      ctx.lineWidth = width;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.beginPath();
      ctx.moveTo(points[0].x, points[0].y);
      for (let i = 1; i < points.length; i++) {
        const xc = (points[i - 1].x + points[i].x) / 2;
        const yc = (points[i - 1].y + points[i].y) / 2;
        ctx.quadraticCurveTo(points[i - 1].x, points[i - 1].y, xc, yc);
      }
      ctx.stroke();
    }

    // Pre-generate some strokes
    const strokes = Array.from({ length: 6 }, () => {
      const pts: Array<{ x: number; y: number }> = [];
      let x = 30 + Math.random() * (w - 60);
      let y = 20 + Math.random() * (h - 40);
      const len = 12 + Math.floor(Math.random() * 20);
      for (let i = 0; i < len; i++) {
        x += (Math.random() - 0.5) * 28;
        y += (Math.random() - 0.5) * 18;
        pts.push({
          x: Math.max(5, Math.min(w - 5, x)),
          y: Math.max(5, Math.min(h - 5, y)),
        });
      }
      return {
        points: pts,
        color: colors[Math.floor(Math.random() * colors.length)],
        width: 2 + Math.random() * 3,
      };
    });

    function animate() {
      if (!ctx) return;
      ctx.clearRect(0, 0, w, h);

      // Draw strokes progressively
      for (let s = 0; s < strokes.length; s++) {
        const delay = s * 30;
        const progress = Math.min(1, Math.max(0, (frame - delay) / 60));
        const visiblePts = Math.floor(progress * strokes[s].points.length);
        if (visiblePts > 1) {
          drawStroke(
            strokes[s].points.slice(0, visiblePts),
            strokes[s].color,
            strokes[s].width,
          );
        }
      }

      frame++;
      if (frame < 300) {
        animId = requestAnimationFrame(animate);
      }
    }

    animate();
    return () => cancelAnimationFrame(animId);
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="h-full w-full"
      style={{ width: "100%", height: "100%" }}
    />
  );
}

/* ------------------------------------------------------------------ */
/*  Floating tool icons that orbit around the hero                     */
/* ------------------------------------------------------------------ */
function FloatingTools() {
  const tools = [
    { icon: Pencil, delay: "0s", x: "8%", y: "18%" },
    { icon: RectangleHorizontal, delay: "0.5s", x: "85%", y: "12%" },
    { icon: Circle, delay: "1s", x: "92%", y: "60%" },
    { icon: Slash, delay: "1.5s", x: "5%", y: "72%" },
    { icon: MousePointer2, delay: "2s", x: "78%", y: "85%" },
  ];

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {tools.map(({ icon: Icon, delay, x, y }, i) => (
        <div
          key={i}
          className="absolute animate-float opacity-20 dark:opacity-15"
          style={{
            left: x,
            top: y,
            animationDelay: delay,
            animationDuration: `${4 + i * 0.7}s`,
          }}
        >
          <Icon size={24 + i * 4} className="text-[var(--accent)]" />
        </div>
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Feature card with hover tilt + glow                                */
/* ------------------------------------------------------------------ */
function FeatureCard({
  icon: Icon,
  title,
  description,
  index,
  visible,
}: {
  icon: typeof Sparkles;
  title: string;
  description: string;
  index: number;
  visible: boolean;
}) {
  const cardRef = useRef<HTMLDivElement>(null);

  function handleMouseMove(e: React.MouseEvent<HTMLDivElement>) {
    const card = cardRef.current;
    if (!card) return;
    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    card.style.setProperty("--mouse-x", `${x}px`);
    card.style.setProperty("--mouse-y", `${y}px`);
  }

  return (
    <div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      className={`feature-card group relative overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--panel)] p-5 transition-all duration-500 hover:-translate-y-1 hover:border-[var(--accent)]/40 hover:shadow-xl hover:shadow-[var(--accent)]/10 sm:rounded-3xl sm:p-6 ${
        visible ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0"
      }`}
      style={{ transitionDelay: `${index * 120}ms` }}
    >
      {/* Glow effect on hover */}
      <div
        className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
        style={{
          background:
            "radial-gradient(250px circle at var(--mouse-x, 50%) var(--mouse-y, 50%), rgba(125,211,252,0.12), transparent 60%)",
        }}
      />

      <div className="relative">
        <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--accent)]/10 text-[var(--accent)] transition-transform duration-300 group-hover:scale-110 sm:h-12 sm:w-12 sm:rounded-2xl">
          <Icon size={20} />
        </div>
        <h3 className="text-sm font-semibold uppercase tracking-[0.15em] text-[var(--foreground)] sm:text-base">
          {title}
        </h3>
        <p className="mt-1.5 text-[13px] leading-5 text-[var(--muted-foreground)] sm:mt-2 sm:text-sm sm:leading-6">
          {description}
        </p>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Stats counter                                                      */
/* ------------------------------------------------------------------ */
function AnimatedStat({
  value,
  label,
  suffix = "",
  visible,
  delay,
}: {
  value: number;
  label: string;
  suffix?: string;
  visible: boolean;
  delay: number;
}) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!visible) return;
    const timeout = setTimeout(() => {
      let start = 0;
      const duration = 1200;
      const startTime = performance.now();

      function tick(now: number) {
        const elapsed = now - startTime;
        const progress = Math.min(elapsed / duration, 1);
        // ease-out cubic
        const eased = 1 - Math.pow(1 - progress, 3);
        start = Math.round(eased * value);
        setCount(start);
        if (progress < 1) requestAnimationFrame(tick);
      }

      requestAnimationFrame(tick);
    }, delay);

    return () => clearTimeout(timeout);
  }, [visible, value, delay]);

  return (
    <div
      className={`text-center transition-all duration-700 ${visible ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"}`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      <p className="text-3xl font-bold text-[var(--foreground)] sm:text-4xl">
        {count}
        {suffix}
      </p>
      <p className="mt-1 text-xs text-[var(--muted-foreground)] sm:text-sm">
        {label}
      </p>
    </div>
  );
}

/* ================================================================== */
/*  PAGE                                                               */
/* ================================================================== */
export default function HomePage() {
  const [heroReady, setHeroReady] = useState(false);
  const features = useInView<HTMLDivElement>(0.1);
  const stats = useInView<HTMLDivElement>(0.2);
  const cta = useInView<HTMLDivElement>(0.2);

  useEffect(() => {
    // slight delay so the paint finishes before animating in
    const id = requestAnimationFrame(() => setHeroReady(true));
    return () => cancelAnimationFrame(id);
  }, []);

  return (
    <>
      <TopBar />

      {/* ─── Hero ─── */}
      <section className="relative overflow-hidden px-4 pb-10 pt-10 sm:px-6 sm:pb-16 sm:pt-16 lg:px-8 lg:pb-24 lg:pt-20">
        <FloatingTools />

        {/* Animated gradient blobs */}
        <div className="pointer-events-none absolute -left-40 -top-40 h-[500px] w-[500px] animate-blob rounded-full bg-[var(--accent)]/10 mix-blend-multiply blur-3xl dark:mix-blend-screen" />
        <div className="pointer-events-none absolute -right-40 top-20 h-[400px] w-[400px] animate-blob rounded-full bg-sky-300/10 mix-blend-multiply blur-3xl [animation-delay:2s] dark:mix-blend-screen" />

        <div className="mx-auto grid max-w-[1400px] gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
          {/* Left: text */}
          <div className="max-w-2xl">
            <p
              className={`inline-flex items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--panel)] px-3 py-1.5 text-xs text-[var(--muted-foreground)] shadow-[0_14px_40px_rgba(15,23,42,0.06)] transition-all duration-700 sm:px-4 sm:py-2 sm:text-sm ${heroReady ? "translate-y-0 opacity-100" : "-translate-y-4 opacity-0"}`}
            >
              <Sparkles
                size={14}
                className="animate-pulse text-[var(--accent)]"
              />
              Sketch-to-image AI editor
            </p>

            <h1
              className={`mt-5 text-4xl font-bold leading-[1.1] tracking-tight text-[var(--foreground)] transition-all duration-700 [transition-delay:150ms] sm:mt-7 sm:text-5xl sm:leading-tight lg:text-[3.5rem] ${heroReady ? "translate-y-0 opacity-100" : "translate-y-6 opacity-0"}`}
            >
              Draw first.{" "}
              <span className="bg-gradient-to-r from-[var(--accent)] to-sky-400 bg-clip-text text-transparent dark:to-sky-300">
                Generate
              </span>{" "}
              when you&rsquo;re ready.
            </h1>

            <p
              className={`mt-4 text-base leading-7 text-[var(--muted-foreground)] transition-all duration-700 [transition-delay:300ms] sm:mt-6 sm:max-w-xl sm:text-lg sm:leading-8 ${heroReady ? "translate-y-0 opacity-100" : "translate-y-6 opacity-0"}`}
            >
              A real editor workspace with drawing tools, page presets, and an
              AI result panel that stays out of your way while you sketch.
            </p>

            <div
              className={`mt-7 flex flex-col gap-3 transition-all duration-700 [transition-delay:450ms] sm:mt-9 sm:flex-row sm:items-center sm:gap-4 ${heroReady ? "translate-y-0 opacity-100" : "translate-y-6 opacity-0"}`}
            >
              <Link
                href="/canvas"
                className="group inline-flex items-center justify-center gap-2 rounded-full bg-[var(--accent)] px-7 py-3.5 text-sm font-semibold text-[var(--accent-foreground)] shadow-lg shadow-[var(--accent)]/25 transition-all hover:shadow-xl hover:shadow-[var(--accent)]/30 active:scale-[0.97]"
              >
                Open Canvas
                <ArrowRight
                  size={16}
                  className="transition-transform group-hover:translate-x-1"
                />
              </Link>
              <Link
                href="/gallery"
                className="group inline-flex items-center justify-center gap-2 rounded-full border border-[var(--border)] bg-[var(--panel)] px-7 py-3.5 text-sm font-medium text-[var(--foreground)] transition-all hover:border-[var(--accent)]/50 hover:text-[var(--accent)] active:scale-[0.97]"
              >
                <Play
                  size={14}
                  className="transition-transform group-hover:scale-110"
                />
                View Gallery
              </Link>
            </div>
          </div>

          {/* Right: interactive canvas preview */}
          <div
            className={`transition-all duration-1000 [transition-delay:300ms] ${heroReady ? "translate-y-0 opacity-100 scale-100" : "translate-y-10 opacity-0 scale-95"}`}
          >
            <div className="group relative rounded-[28px] border border-[var(--border)] bg-[var(--panel)] p-3 shadow-[0_30px_120px_rgba(15,23,42,0.12)] transition-shadow duration-500 hover:shadow-[0_40px_140px_rgba(15,23,42,0.18)] sm:rounded-[36px] sm:p-4">
              {/* Fake title bar */}
              <div className="mb-3 flex items-center gap-2 px-2">
                <div className="flex gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-full bg-rose-400/70" />
                  <span className="h-2.5 w-2.5 rounded-full bg-amber-400/70" />
                  <span className="h-2.5 w-2.5 rounded-full bg-emerald-400/70" />
                </div>
                <span className="ml-2 text-[10px] font-medium text-[var(--muted-foreground)]">
                  Canvas — Untitled sketch
                </span>
              </div>

              {/* Live canvas preview */}
              <div
                className="overflow-hidden rounded-2xl border border-[var(--border)] bg-white sm:rounded-[20px]"
                style={{ aspectRatio: "16/10" }}
              >
                <MiniCanvasPreview />
              </div>

              {/* Fake toolbar */}
              <div className="mt-3 flex items-center justify-between px-2">
                <div className="flex gap-2">
                  {[Pencil, RectangleHorizontal, Circle, Slash].map(
                    (Icon, i) => (
                      <span
                        key={i}
                        className={`flex h-8 w-8 items-center justify-center rounded-lg border text-[var(--muted-foreground)] transition-colors ${
                          i === 0
                            ? "border-[var(--accent)]/50 bg-[var(--accent)]/10 text-[var(--accent)]"
                            : "border-[var(--border)]"
                        }`}
                      >
                        <Icon size={13} />
                      </span>
                    ),
                  )}
                </div>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-[var(--accent)]/10 px-3 py-1 text-[10px] font-semibold text-[var(--accent)]">
                  <Sparkles size={10} />
                  AI Ready
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Features ─── */}
      <section
        ref={features.ref}
        className="px-4 py-12 sm:px-6 sm:py-20 lg:px-8"
      >
        <div className="mx-auto max-w-[1400px]">
          <div
            className={`mb-8 text-center transition-all duration-700 sm:mb-12 ${features.visible ? "translate-y-0 opacity-100" : "translate-y-6 opacity-0"}`}
          >
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-[var(--accent)]">
              Everything you need
            </p>
            <h2 className="mt-2 text-2xl font-bold text-[var(--foreground)] sm:text-3xl lg:text-4xl">
              A complete creative workspace
            </h2>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <FeatureCard
              icon={Brush}
              title="Editor"
              description="Full canvas with brush, shapes, eraser, selection, zoom, undo/redo, and page presets."
              index={0}
              visible={features.visible}
            />
            <FeatureCard
              icon={Wand2}
              title="AI Flow"
              description="Describe your vision, hit generate, and watch AI transform your sketch into artwork."
              index={1}
              visible={features.visible}
            />
            <FeatureCard
              icon={Layers}
              title="Gallery"
              description="All your generated artworks saved in one place. Browse, revisit, and share anytime."
              index={2}
              visible={features.visible}
            />
            <FeatureCard
              icon={Zap}
              title="Touch-first"
              description="Dedicated phone and tablet layouts built for finger drawing with zero compromise."
              index={3}
              visible={features.visible}
            />
          </div>
        </div>
      </section>

      {/* ─── Stats ─── */}
      <section
        ref={stats.ref}
        className="border-y border-[var(--border)] bg-[var(--panel)]/50 px-4 py-12 backdrop-blur-xl sm:px-6 sm:py-16 lg:px-8"
      >
        <div className="mx-auto flex max-w-[900px] items-center justify-around gap-6">
          <AnimatedStat
            value={7}
            label="Drawing tools"
            visible={stats.visible}
            delay={0}
          />
          <div className="h-10 w-px bg-[var(--border)]" />
          <AnimatedStat
            value={5}
            label="Page presets"
            visible={stats.visible}
            delay={150}
          />
          <div className="h-10 w-px bg-[var(--border)]" />
          <AnimatedStat
            value={3}
            label="Device layouts"
            visible={stats.visible}
            delay={300}
          />
          <div className="h-10 w-px bg-[var(--border)]" />
          <AnimatedStat
            value={100}
            suffix="%"
            label="Touch-friendly"
            visible={stats.visible}
            delay={450}
          />
        </div>
      </section>

      {/* ─── Bottom CTA ─── */}
      <section ref={cta.ref} className="px-4 py-16 sm:px-6 sm:py-24 lg:px-8">
        <div
          className={`mx-auto max-w-2xl text-center transition-all duration-700 ${cta.visible ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0"}`}
        >
          <h2 className="text-2xl font-bold text-[var(--foreground)] sm:text-4xl">
            Ready to create?
          </h2>
          <p className="mt-3 text-[var(--muted-foreground)] sm:text-lg">
            Open the canvas, sketch something, and let AI do the rest.
          </p>
          <Link
            href="/canvas"
            className="group mt-8 inline-flex items-center gap-2 rounded-full bg-[var(--accent)] px-8 py-4 text-base font-semibold text-[var(--accent-foreground)] shadow-lg shadow-[var(--accent)]/25 transition-all hover:shadow-xl hover:shadow-[var(--accent)]/30 active:scale-[0.97]"
          >
            Start Drawing
            <ArrowRight
              size={18}
              className="transition-transform group-hover:translate-x-1"
            />
          </Link>
        </div>
      </section>
    </>
  );
}

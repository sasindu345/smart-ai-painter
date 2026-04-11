"use client";

import { useState } from "react";

import {
  Check,
  ChevronRight,
  Circle,
  Eraser,
  Hand,
  Loader2,
  Maximize2,
  MousePointer2,
  Pencil,
  RectangleHorizontal,
  RotateCcw,
  RotateCw,
  Save,
  Slash,
  Sparkles,
  Trash2,
  ZoomIn,
  ZoomOut,
} from "lucide-react";

import type { UseCanvasReturn } from "@/hooks/useCanvas";
import { useAuth } from "@/hooks/useAuth";
import { useSketches } from "@/hooks/useSketches";
import { useCanvasStore } from "@/store/canvasStore";
import { PAGE_PRESET_SIZES, type CanvasTool } from "@/types/canvas";

import { ResultPanel } from "../result/ResultPanel";

const TOOLS: Array<{
  id: CanvasTool;
  label: string;
  icon: typeof MousePointer2;
}> = [
  { id: "brush", label: "Brush", icon: Pencil },
  { id: "eraser", label: "Eraser", icon: Eraser },
  { id: "rect", label: "Rectangle", icon: RectangleHorizontal },
  { id: "ellipse", label: "Ellipse", icon: Circle },
  { id: "line", label: "Line", icon: Slash },
  { id: "select", label: "Select", icon: MousePointer2 },
  { id: "move", label: "Pan", icon: Hand },
];

const QUICK_COLORS = [
  "#111827",
  "#dc2626",
  "#ea580c",
  "#f59e0b",
  "#16a34a",
  "#0891b2",
  "#2563eb",
  "#7c3aed",
  "#db2777",
];

const pagePresets = Object.entries(PAGE_PRESET_SIZES) as Array<
  [
    keyof typeof PAGE_PRESET_SIZES,
    (typeof PAGE_PRESET_SIZES)[keyof typeof PAGE_PRESET_SIZES],
  ]
>;

interface TabletShellProps {
  canvas: UseCanvasReturn;
  loadingSketch: boolean;
}

export function TabletShell({ canvas, loadingSketch }: TabletShellProps) {
  const [aiPanelOpen, setAiPanelOpen] = useState(false);
  const [saveMessage, setSaveMessage] = useState("");

  const activeTool = useCanvasStore((s) => s.activeTool);
  const brushColor = useCanvasStore((s) => s.brushColor);
  const brushSize = useCanvasStore((s) => s.brushSize);
  const zoomLevel = useCanvasStore((s) => s.zoomLevel);
  const pagePreset = useCanvasStore((s) => s.pagePreset);
  const pageWidth = useCanvasStore((s) => s.pageWidth);
  const pageHeight = useCanvasStore((s) => s.pageHeight);
  const canUndo = useCanvasStore((s) => s.canUndo);
  const canRedo = useCanvasStore((s) => s.canRedo);
  const isEmpty = useCanvasStore((s) => s.isEmpty);

  const setTool = useCanvasStore((s) => s.setTool);
  const setColor = useCanvasStore((s) => s.setColor);
  const setSize = useCanvasStore((s) => s.setSize);
  const setPagePreset = useCanvasStore((s) => s.setPagePreset);

  const { user } = useAuth();
  const { saveSketch, isSaving } = useSketches();

  const supportsStrokeControls =
    activeTool === "brush" ||
    activeTool === "eraser" ||
    activeTool === "rect" ||
    activeTool === "ellipse" ||
    activeTool === "line";

  function handleSaveSketch() {
    const canvasEl = document.querySelector("canvas");
    if (!canvasEl) return;
    const dataUrl = canvasEl.toDataURL("image/png");
    const base64 = dataUrl.split(",")[1];

    saveSketch(
      {
        title: `Sketch ${new Date().toLocaleDateString()}`,
        image_base64: base64,
        page_preset: pagePreset,
        page_width: pageWidth,
        page_height: pageHeight,
      },
      {
        onSuccess: () => {
          setSaveMessage("Saved!");
          setTimeout(() => setSaveMessage(""), 2000);
        },
        onError: () => {
          setSaveMessage("Failed");
          setTimeout(() => setSaveMessage(""), 3000);
        },
      },
    );
  }

  function handleClear() {
    if (!isEmpty && window.confirm("Clear the current canvas?")) {
      canvas.clear();
    }
  }

  return (
    <div className="flex flex-1 flex-col bg-[var(--background)]">
      {/* Compact action bar — TopBar is already rendered by CanvasWorkspaceShell */}
      <header className="z-20 flex items-center justify-between gap-2 border-b border-[var(--border)] bg-[color:var(--panel)]/85 px-3 py-2 backdrop-blur-xl">
        <div className="flex items-center gap-1.5">
          <IconButton
            label="Undo"
            disabled={!canUndo}
            onClick={canvas.undo}
            icon={RotateCcw}
          />
          <IconButton
            label="Redo"
            disabled={!canRedo}
            onClick={canvas.redo}
            icon={RotateCw}
          />

          <div className="mx-1 h-6 w-px bg-[var(--border)]" />

          <IconButton
            label="Delete selected"
            onClick={canvas.deleteSelected}
            icon={Trash2}
          />
          <IconButton
            label="Clear canvas"
            disabled={isEmpty}
            onClick={handleClear}
            icon={Trash2}
            tone="danger"
          />
        </div>

        <span className="text-xs font-medium text-[var(--muted-foreground)]">
          {pagePreset} · {pageWidth}×{pageHeight} ·{" "}
          {Math.round(zoomLevel * 100)}%
        </span>

        <div className="flex items-center gap-2">
          {user && (
            <button
              type="button"
              onClick={handleSaveSketch}
              disabled={isEmpty || isSaving}
              className="inline-flex h-10 items-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--panel-elevated)] px-3 text-sm font-medium text-[var(--foreground)] transition enabled:hover:border-green-500 enabled:hover:text-green-600 disabled:cursor-not-allowed disabled:opacity-45"
            >
              {isSaving ? (
                <Loader2 size={15} className="animate-spin" />
              ) : saveMessage === "Saved!" ? (
                <Check size={15} className="text-green-500" />
              ) : (
                <Save size={15} />
              )}
              {isSaving ? "Saving" : saveMessage || "Save"}
            </button>
          )}
          <button
            type="button"
            onClick={() => setAiPanelOpen((open) => !open)}
            aria-pressed={aiPanelOpen}
            className="inline-flex h-10 items-center gap-2 rounded-xl bg-[var(--accent)] px-4 text-sm font-semibold text-[var(--accent-foreground)] shadow-md transition hover:opacity-90"
          >
            <Sparkles size={15} />
            {aiPanelOpen ? "Hide AI" : "AI Generate"}
          </button>
        </div>
      </header>

      {/* Body: tool rail + canvas + slide-out AI panel */}
      <div className="relative flex flex-1 overflow-hidden">
        {/* Vertical tool rail */}
        <aside
          aria-label="Drawing tools"
          className="flex w-[88px] shrink-0 flex-col gap-2 border-r border-[var(--border)] bg-[var(--panel)]/60 p-3 backdrop-blur-xl"
        >
          {TOOLS.map(({ id, label, icon: Icon }) => {
            const isActive = activeTool === id;
            return (
              <button
                key={id}
                type="button"
                onClick={() => setTool(id)}
                aria-label={label}
                className={`group relative flex h-14 items-center justify-center rounded-2xl border transition active:scale-95 ${
                  isActive
                    ? "border-[var(--accent)] bg-[var(--accent)] text-[var(--accent-foreground)] shadow-lg shadow-[var(--accent)]/25"
                    : "border-[var(--border)] bg-[var(--panel-elevated)] text-[var(--foreground)] hover:border-[var(--accent)]/40"
                }`}
              >
                <Icon size={20} />
              </button>
            );
          })}

          <div className="mt-2 h-px bg-[var(--border)]" />

          {/* Color swatch — opens system color picker */}
          <label
            className="relative flex h-14 cursor-pointer items-center justify-center rounded-2xl border border-[var(--border)] bg-[var(--panel-elevated)]"
            aria-label="Brush color"
          >
            <span
              aria-hidden
              className="h-7 w-7 rounded-xl border border-[var(--border)] shadow-inner"
              style={{ backgroundColor: brushColor }}
            />
            <input
              type="color"
              value={brushColor}
              onChange={(e) => setColor(e.target.value)}
              className="sr-only"
              disabled={!supportsStrokeControls || activeTool === "eraser"}
            />
          </label>
        </aside>

        {/* Canvas area */}
        <main className="relative flex-1 overflow-hidden">
          {/* Floating brush + page strip */}
          <div className="pointer-events-none absolute inset-x-0 top-3 z-10 flex justify-center px-4">
            <div className="pointer-events-auto flex items-center gap-3 rounded-2xl border border-[var(--border)] bg-[color:var(--panel)]/92 px-3 py-2 shadow-lg backdrop-blur-xl">
              <div className="flex items-center gap-2 px-1">
                <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--muted-foreground)]">
                  Size
                </span>
                <input
                  type="range"
                  min={1}
                  max={50}
                  value={brushSize}
                  disabled={!supportsStrokeControls}
                  onChange={(e) => setSize(Number(e.target.value))}
                  className="w-32 accent-[var(--accent)] disabled:opacity-40"
                  aria-label="Brush size"
                />
                <span className="w-7 text-center font-mono text-xs text-[var(--foreground)]">
                  {brushSize}
                </span>
              </div>

              <div className="h-6 w-px bg-[var(--border)]" />

              <div className="flex items-center gap-1.5">
                {QUICK_COLORS.slice(0, 6).map((color) => {
                  const isActive =
                    brushColor.toLowerCase() === color.toLowerCase();
                  return (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setColor(color)}
                      aria-label={`Color ${color}`}
                      aria-pressed={isActive}
                      className={`h-7 w-7 rounded-full border-2 transition active:scale-95 ${
                        isActive
                          ? "border-[var(--accent)] shadow"
                          : "border-[var(--border)]"
                      }`}
                      style={{ backgroundColor: color }}
                    />
                  );
                })}
              </div>

              <div className="h-6 w-px bg-[var(--border)]" />

              <div className="flex items-center gap-1">
                {pagePresets.map(([preset, presetConfig]) => {
                  const isActive = pagePreset === preset;
                  return (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setPagePreset(preset)}
                      className={`rounded-full px-3 py-1 text-xs font-medium transition ${
                        isActive
                          ? "bg-[var(--accent)] text-[var(--accent-foreground)]"
                          : "text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
                      }`}
                    >
                      {presetConfig.label}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Canvas viewport */}
          <div className="absolute inset-0 flex items-center justify-center overflow-auto p-4 pt-20">
            <div
              ref={canvas.surfaceRef}
              className="canvas-surface relative w-full max-w-full overflow-hidden rounded-[28px] border border-[var(--border)] bg-[var(--canvas)] shadow-[0_30px_80px_rgba(15,23,42,0.18)]"
              style={{ aspectRatio: `${pageWidth} / ${pageHeight}` }}
            >
              <canvas
                ref={canvas.canvasRef}
                className="block"
                role="img"
                aria-label={`Drawing canvas, ${pagePreset} ${pageWidth} by ${pageHeight}`}
                tabIndex={0}
              />
            </div>
          </div>

          {loadingSketch && (
            <div className="absolute inset-0 z-20 flex items-center justify-center bg-[var(--panel)]/80 backdrop-blur-sm">
              <div className="flex flex-col items-center gap-3">
                <Loader2
                  size={32}
                  className="animate-spin text-[var(--accent)]"
                />
                <p className="text-sm text-[var(--muted-foreground)]">
                  Loading sketch…
                </p>
              </div>
            </div>
          )}

          {/* Floating zoom controls */}
          <div className="pointer-events-none absolute bottom-4 right-4 flex flex-col gap-2">
            <button
              type="button"
              onClick={canvas.zoomIn}
              aria-label="Zoom in"
              className="pointer-events-auto flex h-12 w-12 items-center justify-center rounded-2xl border border-[var(--border)] bg-[color:var(--panel)]/92 text-[var(--foreground)] shadow-lg backdrop-blur-xl transition active:scale-95"
            >
              <ZoomIn size={18} />
            </button>
            <button
              type="button"
              onClick={canvas.zoomOut}
              aria-label="Zoom out"
              className="pointer-events-auto flex h-12 w-12 items-center justify-center rounded-2xl border border-[var(--border)] bg-[color:var(--panel)]/92 text-[var(--foreground)] shadow-lg backdrop-blur-xl transition active:scale-95"
            >
              <ZoomOut size={18} />
            </button>
            <button
              type="button"
              onClick={canvas.resetZoom}
              aria-label="Fit to screen"
              className="pointer-events-auto flex h-12 w-12 items-center justify-center rounded-2xl border border-[var(--border)] bg-[color:var(--panel)]/92 text-[var(--foreground)] shadow-lg backdrop-blur-xl transition active:scale-95"
            >
              <Maximize2 size={18} />
            </button>
          </div>
        </main>

        {/* Right slide-out AI panel */}
        {aiPanelOpen && (
          <button
            type="button"
            aria-label="Close AI panel"
            onClick={() => setAiPanelOpen(false)}
            className="absolute inset-0 z-30 bg-black/30 backdrop-blur-[2px]"
          />
        )}

        <aside
          aria-label="AI generate panel"
          className={`absolute right-0 top-0 z-40 flex h-full w-[420px] max-w-[85vw] transform flex-col border-l border-[var(--border)] bg-[var(--panel-elevated)] shadow-2xl backdrop-blur-xl transition-transform duration-300 ${
            aiPanelOpen ? "translate-x-0" : "translate-x-full"
          }`}
        >
          <div className="flex items-center justify-between gap-3 border-b border-[var(--border)] px-5 py-4">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[var(--muted-foreground)]">
                AI Studio
              </p>
              <h2 className="text-lg font-semibold text-[var(--foreground)]">
                Generate artwork
              </h2>
            </div>
            <button
              type="button"
              onClick={() => setAiPanelOpen(false)}
              aria-label="Close panel"
              className="flex h-11 w-11 items-center justify-center rounded-2xl border border-[var(--border)] bg-[var(--panel)] text-[var(--foreground)] transition hover:border-[var(--accent)] hover:text-[var(--accent)]"
            >
              <ChevronRight size={18} />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto px-5 py-4">
            <ResultPanel />
          </div>
        </aside>
      </div>
    </div>
  );
}

interface IconButtonProps {
  icon: typeof Save;
  label: string;
  onClick: () => void;
  disabled?: boolean;
  tone?: "default" | "danger";
}

function IconButton({
  icon: Icon,
  label,
  onClick,
  disabled,
  tone = "default",
}: IconButtonProps) {
  const danger = tone === "danger";
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      title={label}
      className={`flex h-11 w-11 items-center justify-center rounded-2xl border transition enabled:hover:border-[var(--accent)] enabled:hover:text-[var(--accent)] disabled:cursor-not-allowed disabled:opacity-45 ${
        danger
          ? "border-rose-300 bg-rose-50 text-rose-600 dark:border-rose-500/40 dark:bg-rose-500/10 dark:text-rose-300"
          : "border-[var(--border)] bg-[var(--panel-elevated)] text-[var(--foreground)]"
      }`}
    >
      <Icon size={16} />
    </button>
  );
}

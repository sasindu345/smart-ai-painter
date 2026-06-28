"use client";

import { useState } from "react";

import {
  Check,
  EyeOff,
  Loader2,
  Minus,
  Palette,
  Plus,
  RotateCcw,
  RotateCw,
  Save,
  Sparkles,
  Trash2,
} from "lucide-react";

import type { UseCanvasReturn } from "@/hooks/useCanvas";
import { useAuth } from "@/hooks/useAuth";
import { useSketches } from "@/hooks/useSketches";
import { useCanvasStore } from "@/store/canvasStore";
import { PAGE_PRESET_SIZES } from "@/types/canvas";

import { KeyboardShortcutsHint } from "./KeyboardShortcutsHint";

type CanvasTopBarProps = Pick<
  UseCanvasReturn,
  | "undo"
  | "redo"
  | "clear"
  | "deleteSelected"
  | "zoomIn"
  | "zoomOut"
  | "resetZoom"
> & {
  loadTemplate?: (type: "face" | "house" | "tree") => void;
};

const pagePresets = Object.entries(PAGE_PRESET_SIZES) as Array<
  [
    keyof typeof PAGE_PRESET_SIZES,
    (typeof PAGE_PRESET_SIZES)[keyof typeof PAGE_PRESET_SIZES],
  ]
>;

const QUICK_COLORS = [
  "#111827",
  "#dc2626",
  "#ea580c",
  "#f59e0b",
  "#16a34a",
  "#2563eb",
  "#7c3aed",
  "#db2777",
  "#ffffff",
];

export function CanvasTopBar({
  undo,
  redo,
  clear,
  deleteSelected,
  zoomIn,
  zoomOut,
  resetZoom,
  loadTemplate,
}: CanvasTopBarProps) {
  const activeTool = useCanvasStore((state) => state.activeTool);
  const brushColor = useCanvasStore((state) => state.brushColor);
  const brushSize = useCanvasStore((state) => state.brushSize);
  const zoomLevel = useCanvasStore((state) => state.zoomLevel);
  const pagePreset = useCanvasStore((state) => state.pagePreset);
  const canUndo = useCanvasStore((state) => state.canUndo);
  const canRedo = useCanvasStore((state) => state.canRedo);
  const isEmpty = useCanvasStore((state) => state.isEmpty);
  const isResultDrawerOpen = useCanvasStore(
    (state) => state.isResultDrawerOpen,
  );
  const setColor = useCanvasStore((state) => state.setColor);
  const setSize = useCanvasStore((state) => state.setSize);
  const setPagePreset = useCanvasStore((state) => state.setPagePreset);
  const toggleResultDrawer = useCanvasStore(
    (state) => state.toggleResultDrawer,
  );

  const { user } = useAuth();
  const { saveSketch, isSaving, isSaveSuccess, resetSave } = useSketches();
  const [saveMessage, setSaveMessage] = useState("");

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
        page_width: useCanvasStore.getState().pageWidth,
        page_height: useCanvasStore.getState().pageHeight,
      },
      {
        onSuccess: () => {
          setSaveMessage("Saved!");
          setTimeout(() => {
            setSaveMessage("");
            resetSave();
          }, 2000);
        },
        onError: () => {
          setSaveMessage("Failed to save");
          setTimeout(() => setSaveMessage(""), 3000);
        },
      },
    );
  }

  return (
    <section className="mb-4 space-y-2">
      {/* Row 1: Actions bar */}
      <div className="flex items-center justify-between gap-3 rounded-2xl border border-[var(--border)] bg-[var(--panel)] px-3 py-2 shadow-[0_2px_12px_rgba(0,0,0,0.04)]">
        {/* Left: undo/redo/delete */}
        <div className="flex items-center gap-1">
          <ActionBtn
            icon={RotateCcw}
            label="Undo"
            onClick={undo}
            disabled={!canUndo}
            shortcut="Ctrl+Z"
          />
          <ActionBtn
            icon={RotateCw}
            label="Redo"
            onClick={redo}
            disabled={!canRedo}
            shortcut="Ctrl+Y"
          />

          <Divider />

          <ActionBtn
            icon={Trash2}
            label="Delete selected"
            onClick={deleteSelected}
          />
          <ActionBtn
            icon={Trash2}
            label="Clear canvas"
            onClick={() => {
              if (!isEmpty && window.confirm("Clear the current canvas?")) {
                clear();
              }
            }}
            disabled={isEmpty}
            tone="danger"
          />
        </div>

        {/* Center: page presets & template quick-select */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 rounded-xl bg-[var(--panel-elevated)] p-1">
            {pagePresets.map(([preset, presetConfig]) => {
              const isActive = pagePreset === preset;
              return (
                <button
                  key={preset}
                  type="button"
                  onClick={() => setPagePreset(preset)}
                  className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-all duration-150 ${
                    isActive
                      ? "bg-[var(--accent)] text-[var(--accent-foreground)] shadow-sm"
                      : "text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
                  }`}
                >
                  {presetConfig.label}
                </button>
              );
            })}
          </div>

          {loadTemplate && (
            <div className="flex items-center gap-1.5 rounded-xl bg-[var(--panel-elevated)] p-1 border border-[var(--border)]/45">
              <span className="text-[9px] font-bold text-[var(--muted-foreground)] uppercase tracking-wider px-2">
                Templates:
              </span>
              <button
                type="button"
                onClick={() => loadTemplate("face")}
                className="rounded-lg px-2.5 py-1 text-xs font-semibold text-[var(--foreground)] hover:bg-[var(--panel)] transition-all"
              >
                😀 Face
              </button>
              <button
                type="button"
                onClick={() => loadTemplate("house")}
                className="rounded-lg px-2.5 py-1 text-xs font-semibold text-[var(--foreground)] hover:bg-[var(--panel)] transition-all"
              >
                🏠 House
              </button>
              <button
                type="button"
                onClick={() => loadTemplate("tree")}
                className="rounded-lg px-2.5 py-1 text-xs font-semibold text-[var(--foreground)] hover:bg-[var(--panel)] transition-all"
              >
                🌲 Tree
              </button>
            </div>
          )}
        </div>

        {/* Right: save, shortcuts, AI */}
        <div className="flex items-center gap-1.5">
          {user && (
            <button
              type="button"
              onClick={handleSaveSketch}
              disabled={isEmpty || isSaving}
              className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-[var(--border)] bg-[var(--panel-elevated)] px-3 text-xs font-medium text-[var(--foreground)] transition-all duration-150 enabled:hover:border-green-500 enabled:hover:text-green-600 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {isSaving ? (
                <Loader2 size={14} className="animate-spin" />
              ) : isSaveSuccess || saveMessage === "Saved!" ? (
                <Check size={14} className="text-green-500" />
              ) : (
                <Save size={14} />
              )}
              {isSaving ? "Saving…" : saveMessage || "Save"}
            </button>
          )}
          <KeyboardShortcutsHint />
          <button
            type="button"
            onClick={toggleResultDrawer}
            className={`inline-flex h-9 items-center gap-1.5 rounded-xl px-4 text-xs font-semibold transition-all duration-150 ${
              isResultDrawerOpen
                ? "border border-[var(--accent)]/30 bg-[var(--accent)]/10 text-[var(--accent)]"
                : "bg-[var(--accent)] text-[var(--accent-foreground)] shadow-md shadow-[var(--accent)]/20 hover:shadow-lg hover:shadow-[var(--accent)]/25"
            }`}
          >
            {isResultDrawerOpen ? <EyeOff size={14} /> : <Sparkles size={14} />}
            {isResultDrawerOpen ? "Hide AI" : "AI Generate"}
          </button>
        </div>
      </div>

      {/* Row 2: Stroke + Zoom */}
      <div className="flex items-center gap-2">
        {/* Stroke settings */}
        <div className="flex flex-1 items-center gap-3 rounded-2xl border border-[var(--border)] bg-[var(--panel)] px-3 py-2 shadow-[0_2px_12px_rgba(0,0,0,0.04)]">
          <Palette
            size={14}
            className="shrink-0 text-[var(--muted-foreground)]"
          />

          {/* Brush size slider */}
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-semibold uppercase tracking-widest text-[var(--muted-foreground)]">
              Size
            </span>
            <input
              type="range"
              min={1}
              max={50}
              value={brushSize}
              disabled={!supportsStrokeControls}
              onChange={(e) => setSize(Number(e.target.value))}
              className="w-28 accent-[var(--accent)] disabled:opacity-30 xl:w-36"
              aria-label="Brush size"
            />
            <span className="w-6 text-center font-mono text-xs text-[var(--foreground)]">
              {brushSize}
            </span>
          </div>

          <div className="h-5 w-px bg-[var(--border)]" />

          {/* Quick color swatches */}
          <div className="flex items-center gap-1.5">
            {QUICK_COLORS.map((color) => {
              const isActive = brushColor.toLowerCase() === color.toLowerCase();
              return (
                <button
                  key={color}
                  type="button"
                  onClick={() => setColor(color)}
                  disabled={!supportsStrokeControls || activeTool === "eraser"}
                  aria-label={`Color ${color}`}
                  aria-pressed={isActive}
                  className={`h-6 w-6 rounded-full border-2 transition-all duration-150 disabled:opacity-30 ${
                    isActive
                      ? "scale-110 border-[var(--accent)] shadow-md"
                      : "border-transparent hover:scale-105 hover:border-[var(--border)]"
                  } ${color === "#ffffff" ? "ring-1 ring-[var(--border)]" : ""}`}
                  style={{ backgroundColor: color }}
                />
              );
            })}

            <div className="h-5 w-px bg-[var(--border)]" />

            {/* Custom color picker */}
            <label
              className="relative flex h-6 w-6 cursor-pointer items-center justify-center rounded-full"
              aria-label="Custom color"
            >
              <span
                className="h-6 w-6 rounded-full border-2 border-dashed border-[var(--border)]"
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

            <span className="ml-1 rounded-md bg-[var(--panel-elevated)] px-1.5 py-0.5 font-mono text-[10px] text-[var(--muted-foreground)]">
              {brushColor.toUpperCase()}
            </span>
          </div>
        </div>

        {/* Zoom controls */}
        <div className="flex items-center gap-1 rounded-2xl border border-[var(--border)] bg-[var(--panel)] px-2 py-2 shadow-[0_2px_12px_rgba(0,0,0,0.04)]">
          <button
            type="button"
            onClick={zoomOut}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-[var(--muted-foreground)] transition-colors hover:bg-[var(--panel-elevated)] hover:text-[var(--foreground)]"
            aria-label="Zoom out"
          >
            <Minus size={14} />
          </button>
          <span className="min-w-[52px] text-center text-xs font-medium text-[var(--foreground)]">
            {Math.round(zoomLevel * 100)}%
          </span>
          <button
            type="button"
            onClick={zoomIn}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-[var(--muted-foreground)] transition-colors hover:bg-[var(--panel-elevated)] hover:text-[var(--foreground)]"
            aria-label="Zoom in"
          >
            <Plus size={14} />
          </button>
          <button
            type="button"
            onClick={resetZoom}
            className="rounded-lg px-2 py-1 text-[11px] font-medium text-[var(--muted-foreground)] transition-colors hover:bg-[var(--panel-elevated)] hover:text-[var(--foreground)]"
          >
            Fit
          </button>
        </div>
      </div>
    </section>
  );
}

/* ── Shared small icon button ── */
function ActionBtn({
  icon: Icon,
  label,
  onClick,
  disabled,
  shortcut,
  tone = "default",
}: {
  icon: typeof Save;
  label: string;
  onClick: () => void;
  disabled?: boolean;
  shortcut?: string;
  tone?: "default" | "danger";
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      title={shortcut ? `${label} (${shortcut})` : label}
      className={`flex h-9 w-9 items-center justify-center rounded-xl transition-all duration-150 disabled:cursor-not-allowed disabled:opacity-35 ${
        tone === "danger"
          ? "text-rose-500 hover:bg-rose-500/10 dark:text-rose-400"
          : "text-[var(--muted-foreground)] hover:bg-[var(--panel-elevated)] hover:text-[var(--foreground)]"
      }`}
    >
      <Icon size={16} strokeWidth={1.8} />
    </button>
  );
}

function Divider() {
  return <div className="mx-0.5 h-5 w-px bg-[var(--border)]" />;
}

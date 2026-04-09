"use client";

import { useState } from "react";

import {
  Check,
  Eye,
  Loader2,
  Minus,
  Plus,
  RotateCcw,
  RotateCw,
  Save,
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
>;

const pagePresets = Object.entries(PAGE_PRESET_SIZES) as Array<
  [
    keyof typeof PAGE_PRESET_SIZES,
    (typeof PAGE_PRESET_SIZES)[keyof typeof PAGE_PRESET_SIZES],
  ]
>;

export function CanvasTopBar({
  undo,
  redo,
  clear,
  deleteSelected,
  zoomIn,
  zoomOut,
  resetZoom,
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
    <section className="mb-4 rounded-[30px] border border-[var(--border)] bg-[var(--panel)] p-4 shadow-[0_22px_80px_rgba(15,23,42,0.08)]">
      <div className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.22em] text-[var(--muted-foreground)]">
              Workspace Controls
            </p>
            <h2 className="mt-1 text-2xl font-semibold text-[var(--foreground)]">
              Full-width editor
            </h2>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={undo}
              disabled={!canUndo}
              className="inline-flex items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--panel-elevated)] px-4 py-2 text-sm text-[var(--foreground)] transition enabled:hover:border-[var(--accent)] enabled:hover:text-[var(--accent)] disabled:cursor-not-allowed disabled:opacity-45"
            >
              <RotateCcw size={16} />
              Undo
            </button>
            <button
              type="button"
              onClick={redo}
              disabled={!canRedo}
              className="inline-flex items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--panel-elevated)] px-4 py-2 text-sm text-[var(--foreground)] transition enabled:hover:border-[var(--accent)] enabled:hover:text-[var(--accent)] disabled:cursor-not-allowed disabled:opacity-45"
            >
              <RotateCw size={16} />
              Redo
            </button>
            <button
              type="button"
              onClick={deleteSelected}
              className="inline-flex items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--panel-elevated)] px-4 py-2 text-sm text-[var(--foreground)] transition hover:border-[var(--accent)] hover:text-[var(--accent)]"
            >
              <Trash2 size={16} />
              Delete Selected
            </button>
            <button
              type="button"
              onClick={() => {
                if (!isEmpty && window.confirm("Clear the current canvas?")) {
                  clear();
                }
              }}
              disabled={isEmpty}
              className="inline-flex items-center gap-2 rounded-full border border-rose-300 bg-rose-50 px-4 py-2 text-sm text-rose-600 transition enabled:hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-45 dark:border-rose-500/40 dark:bg-rose-500/10 dark:text-rose-300"
            >
              <Trash2 size={16} />
              New Page
            </button>
            {user && (
              <button
                type="button"
                onClick={handleSaveSketch}
                disabled={isEmpty || isSaving}
                className="inline-flex items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--panel-elevated)] px-4 py-2 text-sm font-medium text-[var(--foreground)] transition enabled:hover:border-green-500 enabled:hover:text-green-600 disabled:cursor-not-allowed disabled:opacity-45 dark:enabled:hover:text-green-400"
              >
                {isSaving ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : isSaveSuccess || saveMessage === "Saved!" ? (
                  <Check size={16} className="text-green-500" />
                ) : (
                  <Save size={16} />
                )}
                {isSaving ? "Saving…" : saveMessage || "Save Sketch"}
              </button>
            )}
            <KeyboardShortcutsHint />
            <button
              type="button"
              onClick={toggleResultDrawer}
              className="inline-flex items-center gap-2 rounded-full bg-[var(--accent)] px-4 py-2 text-sm font-medium text-[var(--accent-foreground)] transition hover:opacity-90 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
            >
              <Eye size={16} />
              {isResultDrawerOpen ? "Hide AI Preview" : "Show AI Preview"}
            </button>
          </div>
        </div>

        <div className="grid gap-3 xl:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)_auto]">
          <div className="rounded-[24px] border border-[var(--border)] bg-[var(--panel-elevated)] p-3">
            <p className="text-xs font-medium uppercase tracking-[0.2em] text-[var(--muted-foreground)]">
              Page Size
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              {pagePresets.map(([preset, presetConfig]) => {
                const isActive = pagePreset === preset;

                return (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => setPagePreset(preset)}
                    className={`rounded-full border px-4 py-2 text-sm transition ${
                      isActive
                        ? "border-[var(--accent)] bg-[var(--accent)] text-[var(--accent-foreground)]"
                        : "border-[var(--border)] bg-[var(--panel)] text-[var(--foreground)] hover:border-[var(--accent)]/40"
                    }`}
                  >
                    {presetConfig.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="rounded-[24px] border border-[var(--border)] bg-[var(--panel-elevated)] p-3">
            <p className="text-xs font-medium uppercase tracking-[0.2em] text-[var(--muted-foreground)]">
              Stroke Settings
            </p>
            <div className="mt-3 flex flex-wrap items-center gap-4">
              <label className="flex min-w-[220px] flex-1 items-center gap-3 text-sm text-[var(--foreground)]">
                <span className="shrink-0">Size</span>
                <input
                  type="range"
                  min={1}
                  max={50}
                  value={brushSize}
                  disabled={!supportsStrokeControls}
                  onChange={(event) => setSize(Number(event.target.value))}
                  className="w-full accent-[var(--accent)] disabled:opacity-40"
                />
                <span className="w-10 text-right text-[var(--muted-foreground)]">
                  {brushSize}
                </span>
              </label>

              <label className="flex items-center gap-3 text-sm text-[var(--foreground)]">
                <span>Color</span>
                <input
                  type="color"
                  value={brushColor}
                  disabled={!supportsStrokeControls || activeTool === "eraser"}
                  onChange={(event) => setColor(event.target.value)}
                  className="h-10 w-14 rounded-xl border border-[var(--border)] bg-transparent disabled:opacity-40"
                />
                <span className="rounded-full border border-[var(--border)] bg-[var(--panel)] px-3 py-1.5 font-mono text-xs text-[var(--muted-foreground)]">
                  {brushColor.toUpperCase()}
                </span>
              </label>
            </div>
          </div>

          <div className="rounded-[24px] border border-[var(--border)] bg-[var(--panel-elevated)] p-3">
            <p className="text-xs font-medium uppercase tracking-[0.2em] text-[var(--muted-foreground)]">
              Zoom
            </p>
            <div className="mt-3 flex items-center gap-2">
              <button
                type="button"
                onClick={zoomOut}
                className="flex h-10 w-10 items-center justify-center rounded-2xl border border-[var(--border)] bg-[var(--panel)] text-[var(--foreground)] transition hover:border-[var(--accent)] hover:text-[var(--accent)]"
                aria-label="Zoom out"
              >
                <Minus size={16} />
              </button>
              <span className="min-w-[68px] text-center text-sm font-medium text-[var(--foreground)]">
                {Math.round(zoomLevel * 100)}%
              </span>
              <button
                type="button"
                onClick={zoomIn}
                className="flex h-10 w-10 items-center justify-center rounded-2xl border border-[var(--border)] bg-[var(--panel)] text-[var(--foreground)] transition hover:border-[var(--accent)] hover:text-[var(--accent)]"
                aria-label="Zoom in"
              >
                <Plus size={16} />
              </button>
              <button
                type="button"
                onClick={resetZoom}
                className="rounded-full border border-[var(--border)] bg-[var(--panel)] px-4 py-2 text-sm text-[var(--foreground)] transition hover:border-[var(--accent)] hover:text-[var(--accent)]"
              >
                Fit
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

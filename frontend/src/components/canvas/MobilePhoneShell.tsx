"use client";

import { useState } from "react";

import {
  Check,
  Circle,
  Eraser,
  Hand,
  Keyboard,
  Loader2,
  Maximize2,
  MousePointer2,
  Palette,
  Pencil,
  Plus,
  RectangleHorizontal,
  RotateCcw,
  RotateCw,
  Save,
  Settings2,
  Slash,
  Sparkles,
  Trash2,
  Wrench,
  ZoomIn,
  ZoomOut,
} from "lucide-react";

import type { UseCanvasReturn } from "@/hooks/useCanvas";
import { useAuth } from "@/hooks/useAuth";
import { useSketches } from "@/hooks/useSketches";
import { useCanvasStore } from "@/store/canvasStore";
import { PAGE_PRESET_SIZES, type CanvasTool } from "@/types/canvas";

import { ResultPanel } from "../result/ResultPanel";
import { BottomSheet } from "../shared/BottomSheet";

type Sheet = "tools" | "brush" | "generate" | "more" | "shortcuts" | null;

const DRAWING_TOOLS: Array<{
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
  "#ffffff",
];

const SHORTCUT_GROUPS: Array<{
  group: string;
  items: Array<{ keys: string[]; description: string }>;
}> = [
  {
    group: "History",
    items: [
      { keys: ["⌘/Ctrl", "Z"], description: "Undo" },
      { keys: ["⌘/Ctrl", "⇧", "Z"], description: "Redo" },
    ],
  },
  {
    group: "Tools",
    items: [
      { keys: ["B"], description: "Brush" },
      { keys: ["E"], description: "Eraser" },
      { keys: ["R"], description: "Rectangle" },
      { keys: ["O"], description: "Ellipse" },
      { keys: ["L"], description: "Line" },
      { keys: ["V"], description: "Select" },
      { keys: ["H"], description: "Pan" },
    ],
  },
];

const pagePresets = Object.entries(PAGE_PRESET_SIZES) as Array<
  [
    keyof typeof PAGE_PRESET_SIZES,
    (typeof PAGE_PRESET_SIZES)[keyof typeof PAGE_PRESET_SIZES],
  ]
>;

interface MobilePhoneShellProps {
  canvas: UseCanvasReturn;
  loadingSketch: boolean;
}

export function MobilePhoneShell({
  canvas,
  loadingSketch,
}: MobilePhoneShellProps) {
  const [sheet, setSheet] = useState<Sheet>(null);
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

  const activeToolMeta = DRAWING_TOOLS.find((t) => t.id === activeTool);
  const ActiveToolIcon = activeToolMeta?.icon ?? Pencil;

  const closeSheet = () => setSheet(null);

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
    closeSheet();
  }

  return (
    <div className="flex min-h-[calc(100dvh-73px)] flex-1 flex-col bg-[var(--background)]">
      {/* Compact status strip */}
      <div className="flex items-center justify-between gap-2 border-b border-[var(--border)] bg-[var(--panel)]/85 px-4 py-2 backdrop-blur-xl">
        <div className="flex min-w-0 items-center gap-2">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl bg-[var(--accent)] text-[var(--accent-foreground)]">
            <ActiveToolIcon size={16} />
          </span>
          <div className="min-w-0">
            <p className="truncate text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--muted-foreground)]">
              {pagePreset} · {Math.round(zoomLevel * 100)}%
            </p>
            <p className="truncate text-sm font-semibold capitalize text-[var(--foreground)]">
              {activeToolMeta?.label ?? activeTool}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={canvas.undo}
            disabled={!canUndo}
            aria-label="Undo"
            className="flex h-10 w-10 items-center justify-center rounded-2xl border border-[var(--border)] bg-[var(--panel-elevated)] text-[var(--foreground)] transition enabled:hover:border-[var(--accent)] disabled:cursor-not-allowed disabled:opacity-40"
          >
            <RotateCcw size={16} />
          </button>
          <button
            type="button"
            onClick={canvas.redo}
            disabled={!canRedo}
            aria-label="Redo"
            className="flex h-10 w-10 items-center justify-center rounded-2xl border border-[var(--border)] bg-[var(--panel-elevated)] text-[var(--foreground)] transition enabled:hover:border-[var(--accent)] disabled:cursor-not-allowed disabled:opacity-40"
          >
            <RotateCw size={16} />
          </button>
          <button
            type="button"
            onClick={canvas.resetZoom}
            aria-label="Fit to screen"
            className="flex h-10 w-10 items-center justify-center rounded-2xl border border-[var(--border)] bg-[var(--panel-elevated)] text-[var(--foreground)] transition hover:border-[var(--accent)]"
          >
            <Maximize2 size={16} />
          </button>
        </div>
      </div>

      {/* Full-bleed canvas viewport */}
      <main className="relative flex-1 overflow-hidden">
        <div className="absolute inset-0 flex items-center justify-center overflow-auto p-3">
          <div
            ref={canvas.surfaceRef}
            className="canvas-surface relative w-full max-w-full overflow-hidden rounded-3xl border border-[var(--border)] bg-[var(--canvas)] shadow-[0_24px_60px_rgba(15,23,42,0.18)]"
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
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-[var(--panel)]/80 backdrop-blur-sm">
            <div className="flex flex-col items-center gap-3">
              <Loader2
                size={28}
                className="animate-spin text-[var(--accent)]"
              />
              <p className="text-sm text-[var(--muted-foreground)]">
                Loading sketch…
              </p>
            </div>
          </div>
        )}

        {/* Floating zoom controls */}
        <div className="pointer-events-none absolute right-3 top-3 flex flex-col gap-2">
          <button
            type="button"
            onClick={canvas.zoomIn}
            aria-label="Zoom in"
            className="pointer-events-auto flex h-11 w-11 items-center justify-center rounded-2xl border border-[var(--border)] bg-[color:var(--panel)]/92 text-[var(--foreground)] shadow-lg backdrop-blur-xl transition active:scale-95"
          >
            <ZoomIn size={18} />
          </button>
          <button
            type="button"
            onClick={canvas.zoomOut}
            aria-label="Zoom out"
            className="pointer-events-auto flex h-11 w-11 items-center justify-center rounded-2xl border border-[var(--border)] bg-[color:var(--panel)]/92 text-[var(--foreground)] shadow-lg backdrop-blur-xl transition active:scale-95"
          >
            <ZoomOut size={18} />
          </button>
        </div>
      </main>

      {/* Bottom action dock */}
      <nav
        aria-label="Canvas actions"
        className="sticky bottom-0 z-20 flex items-stretch justify-between gap-1 border-t border-[var(--border)] bg-[color:var(--panel)]/95 px-3 pt-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] backdrop-blur-xl"
      >
        <DockButton
          icon={Wrench}
          label="Tools"
          onClick={() => setSheet("tools")}
        />
        <DockButton
          icon={Palette}
          label="Brush"
          onClick={() => setSheet("brush")}
        />
        <DockButton
          icon={Sparkles}
          label="Generate"
          highlight
          onClick={() => setSheet("generate")}
        />
        <DockButton
          icon={Settings2}
          label="More"
          onClick={() => setSheet("more")}
        />
      </nav>

      {/* Tool sheet */}
      <BottomSheet
        open={sheet === "tools"}
        onClose={closeSheet}
        title="Drawing tools"
        description="Pick a tool"
      >
        <div className="grid grid-cols-3 gap-3 pb-2">
          {DRAWING_TOOLS.map(({ id, label, icon: Icon }) => {
            const isActive = activeTool === id;
            return (
              <button
                key={id}
                type="button"
                onClick={() => {
                  setTool(id);
                  closeSheet();
                }}
                className={`flex flex-col items-center gap-2 rounded-3xl border px-3 py-5 text-sm font-medium transition active:scale-95 ${
                  isActive
                    ? "border-[var(--accent)] bg-[var(--accent)] text-[var(--accent-foreground)] shadow-lg shadow-[var(--accent)]/25"
                    : "border-[var(--border)] bg-[var(--panel)] text-[var(--foreground)]"
                }`}
              >
                <Icon size={22} />
                {label}
              </button>
            );
          })}
        </div>
      </BottomSheet>

      {/* Brush / color / page sheet */}
      <BottomSheet
        open={sheet === "brush"}
        onClose={closeSheet}
        title="Brush settings"
        description="Color, size & page"
      >
        <div className="space-y-6 pb-2">
          <section>
            <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--muted-foreground)]">
              Quick colors
            </p>
            <div className="flex flex-wrap gap-3">
              {QUICK_COLORS.map((color) => {
                const isActive =
                  brushColor.toLowerCase() === color.toLowerCase();
                return (
                  <button
                    key={color}
                    type="button"
                    onClick={() => setColor(color)}
                    aria-label={`Select color ${color}`}
                    aria-pressed={isActive}
                    className={`flex h-12 w-12 items-center justify-center rounded-2xl border-2 transition active:scale-95 ${
                      isActive
                        ? "border-[var(--accent)] shadow-lg"
                        : "border-[var(--border)]"
                    }`}
                    style={{ backgroundColor: color }}
                  >
                    {isActive && (
                      <Check
                        size={18}
                        className={
                          color === "#ffffff"
                            ? "text-[var(--foreground)]"
                            : "text-white"
                        }
                      />
                    )}
                  </button>
                );
              })}
              <label className="flex h-12 w-12 cursor-pointer items-center justify-center rounded-2xl border-2 border-dashed border-[var(--border)] text-[var(--muted-foreground)]">
                <Plus size={18} />
                <input
                  type="color"
                  value={brushColor}
                  onChange={(e) => setColor(e.target.value)}
                  className="sr-only"
                  aria-label="Pick custom color"
                />
              </label>
            </div>
          </section>

          <section>
            <div className="mb-2 flex items-center justify-between">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--muted-foreground)]">
                Brush size
              </p>
              <span className="font-mono text-sm text-[var(--foreground)]">
                {brushSize}px
              </span>
            </div>
            <input
              type="range"
              min={1}
              max={50}
              value={brushSize}
              onChange={(e) => setSize(Number(e.target.value))}
              className="h-2 w-full accent-[var(--accent)]"
              aria-label="Brush size"
            />
            <div className="mt-3 flex items-center justify-center rounded-2xl border border-[var(--border)] bg-[var(--panel)] p-4">
              <div
                className="rounded-full"
                style={{
                  width: `${brushSize * 2}px`,
                  height: `${brushSize * 2}px`,
                  backgroundColor:
                    activeTool === "eraser" ? "#cbd5e1" : brushColor,
                }}
              />
            </div>
          </section>

          <section>
            <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--muted-foreground)]">
              Page size
            </p>
            <div className="grid grid-cols-3 gap-2">
              {pagePresets.map(([preset, presetConfig]) => {
                const isActive = pagePreset === preset;
                return (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => setPagePreset(preset)}
                    className={`rounded-2xl border px-3 py-3 text-sm font-medium transition ${
                      isActive
                        ? "border-[var(--accent)] bg-[var(--accent)] text-[var(--accent-foreground)]"
                        : "border-[var(--border)] bg-[var(--panel)] text-[var(--foreground)]"
                    }`}
                  >
                    {presetConfig.label}
                  </button>
                );
              })}
            </div>
          </section>
        </div>
      </BottomSheet>

      {/* Generate sheet — full-screen */}
      <BottomSheet
        open={sheet === "generate"}
        onClose={closeSheet}
        title="AI Generate"
        description="Describe your art"
        size="full"
      >
        <ResultPanel />
      </BottomSheet>

      {/* More sheet */}
      <BottomSheet
        open={sheet === "more"}
        onClose={closeSheet}
        title="More actions"
        description="History · Save · Help"
      >
        <div className="space-y-2 pb-2">
          <ActionRow
            icon={RotateCcw}
            label="Undo last action"
            onClick={() => {
              canvas.undo();
              closeSheet();
            }}
            disabled={!canUndo}
          />
          <ActionRow
            icon={RotateCw}
            label="Redo"
            onClick={() => {
              canvas.redo();
              closeSheet();
            }}
            disabled={!canRedo}
          />
          <ActionRow
            icon={Trash2}
            label="Delete selected object"
            onClick={() => {
              canvas.deleteSelected();
              closeSheet();
            }}
          />
          <ActionRow
            icon={Trash2}
            label="Clear canvas"
            tone="danger"
            disabled={isEmpty}
            onClick={handleClear}
          />
          {user && (
            <ActionRow
              icon={
                isSaving ? Loader2 : saveMessage === "Saved!" ? Check : Save
              }
              label={
                isSaving
                  ? "Saving sketch…"
                  : saveMessage || "Save sketch to gallery"
              }
              disabled={isEmpty || isSaving}
              spinning={isSaving}
              onClick={handleSaveSketch}
            />
          )}
          <ActionRow
            icon={Keyboard}
            label="Keyboard shortcuts"
            onClick={() => setSheet("shortcuts")}
          />
        </div>
      </BottomSheet>

      {/* Shortcuts sheet */}
      <BottomSheet
        open={sheet === "shortcuts"}
        onClose={() => setSheet("more")}
        title="Keyboard shortcuts"
        description="Quick reference"
      >
        <div className="space-y-5 pb-2">
          {SHORTCUT_GROUPS.map((group) => (
            <div key={group.group}>
              <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--muted-foreground)]">
                {group.group}
              </p>
              <ul className="space-y-1.5">
                {group.items.map((shortcut) => (
                  <li
                    key={shortcut.description}
                    className="flex items-center justify-between gap-3 rounded-xl bg-[var(--panel)] px-3 py-2"
                  >
                    <span className="text-sm text-[var(--foreground)]">
                      {shortcut.description}
                    </span>
                    <span className="flex shrink-0 items-center gap-1">
                      {shortcut.keys.map((key, index) => (
                        <kbd
                          key={`${shortcut.description}-${index}`}
                          className="rounded-md border border-[var(--border)] bg-[var(--panel-elevated)] px-1.5 py-0.5 font-mono text-[11px] font-medium text-[var(--foreground)]"
                        >
                          {key}
                        </kbd>
                      ))}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </BottomSheet>
    </div>
  );
}

interface DockButtonProps {
  icon: typeof Wrench;
  label: string;
  onClick: () => void;
  highlight?: boolean;
}

function DockButton({
  icon: Icon,
  label,
  onClick,
  highlight,
}: DockButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex flex-1 flex-col items-center gap-1 rounded-2xl px-2 py-2 text-[11px] font-medium transition active:scale-95 ${
        highlight
          ? "bg-[var(--accent)] text-[var(--accent-foreground)] shadow-md"
          : "text-[var(--foreground)] hover:bg-[var(--panel-elevated)]"
      }`}
    >
      <Icon size={20} />
      {label}
    </button>
  );
}

interface ActionRowProps {
  icon: typeof Save;
  label: string;
  onClick: () => void;
  disabled?: boolean;
  spinning?: boolean;
  tone?: "default" | "danger";
}

function ActionRow({
  icon: Icon,
  label,
  onClick,
  disabled,
  spinning,
  tone = "default",
}: ActionRowProps) {
  const danger = tone === "danger";
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`flex w-full items-center gap-3 rounded-2xl border px-4 py-3.5 text-left text-sm font-medium transition active:scale-[0.98] ${
        danger
          ? "border-rose-300 bg-rose-50 text-rose-600 enabled:hover:bg-rose-100 dark:border-rose-500/40 dark:bg-rose-500/10 dark:text-rose-300"
          : "border-[var(--border)] bg-[var(--panel)] text-[var(--foreground)] enabled:hover:border-[var(--accent)]/40"
      } disabled:cursor-not-allowed disabled:opacity-45`}
    >
      <Icon size={18} className={spinning ? "animate-spin" : undefined} />
      {label}
    </button>
  );
}

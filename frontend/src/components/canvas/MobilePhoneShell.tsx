"use client";

import { useState } from "react";

import {
  Check,
  Circle,
  Eraser,
  Hand,
  Loader2,
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
  Brush,
} from "lucide-react";
import Link from "next/link";

import type { UseCanvasReturn } from "@/hooks/useCanvas";
import { useAuth } from "@/hooks/useAuth";
import { useSketches } from "@/hooks/useSketches";
import { useCanvasStore } from "@/store/canvasStore";
import { PAGE_PRESET_SIZES, type CanvasTool } from "@/types/canvas";

import { ResultPanel } from "../result/ResultPanel";
import { BottomSheet } from "../shared/BottomSheet";
import { SketchCanvas } from "./SketchCanvas";

type Sheet = "tools" | "brush" | "generate" | "more" | null;

const DRAWING_TOOLS: Array<{
  id: CanvasTool;
  label: string;
  icon: typeof MousePointer2;
}> = [
  { id: "brush", label: "Brush", icon: Pencil },
  { id: "eraser", label: "Eraser", icon: Eraser },
  { id: "rect", label: "Rect", icon: RectangleHorizontal },
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

const pagePresets = Object.entries(PAGE_PRESET_SIZES) as Array<
  [
    keyof typeof PAGE_PRESET_SIZES,
    (typeof PAGE_PRESET_SIZES)[keyof typeof PAGE_PRESET_SIZES],
  ]
>;

interface MobilePhoneShellProps {
  canvas: UseCanvasReturn;
  loadingSketch: boolean;
  handleGenerate: () => void;
  aiLoading: boolean;
}

export function MobilePhoneShell({
  canvas,
  loadingSketch,
  handleGenerate,
  aiLoading,
}: MobilePhoneShellProps) {
  const [sheet, setSheet] = useState<Sheet>(null);
  const [saveMessage, setSaveMessage] = useState("");

  const activeTool = useCanvasStore((s) => s.activeTool);
  const brushColor = useCanvasStore((s) => s.brushColor);
  const brushSize = useCanvasStore((s) => s.brushSize);
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
    <div className="flex flex-1 flex-col">
      {/* Canvas — takes all remaining space */}
      <main className="relative flex-1 overflow-hidden p-1.5 flex flex-col">
        <SketchCanvas
          surfaceRef={canvas.surfaceRef}
          canvasRef={canvas.canvasRef}
          loadTemplate={canvas.loadTemplate}
        />
        {loadingSketch && (
          <div className="absolute inset-0 z-30 flex items-center justify-center bg-[var(--panel)]/80 backdrop-blur-sm">
            <Loader2 size={28} className="animate-spin text-[var(--accent)]" />
          </div>
        )}

        {/* Floating: undo/redo top-left */}
        <div className="pointer-events-none absolute left-2 top-2 flex gap-1.5">
          <button
            type="button"
            onClick={canvas.undo}
            disabled={!canUndo}
            aria-label="Undo"
            className="pointer-events-auto flex h-9 w-9 items-center justify-center rounded-xl border border-[var(--border)] bg-[color:var(--panel)]/90 text-[var(--foreground)] shadow backdrop-blur-xl transition active:scale-95 disabled:opacity-35"
          >
            <RotateCcw size={15} />
          </button>
          <button
            type="button"
            onClick={canvas.redo}
            disabled={!canRedo}
            aria-label="Redo"
            className="pointer-events-auto flex h-9 w-9 items-center justify-center rounded-xl border border-[var(--border)] bg-[color:var(--panel)]/90 text-[var(--foreground)] shadow backdrop-blur-xl transition active:scale-95 disabled:opacity-35"
          >
            <RotateCw size={15} />
          </button>
        </div>

        {/* Floating: active tool badge top-center */}
        <div className="pointer-events-none absolute left-1/2 top-2 -translate-x-1/2">
          <span className="pointer-events-auto inline-flex items-center gap-1.5 rounded-xl border border-[var(--border)] bg-[color:var(--panel)]/90 px-2.5 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-[var(--muted-foreground)] shadow backdrop-blur-xl">
            <ActiveToolIcon size={12} />
            {activeToolMeta?.label ?? activeTool}
          </span>
        </div>
      </main>

      {/* Bottom dock — compact, always visible */}
      <nav
        aria-label="Canvas actions"
        className="z-20 flex items-center gap-0.5 border-t border-[var(--border)] bg-[color:var(--panel)]/95 px-1 pt-1 pb-[max(0.25rem,env(safe-area-inset-bottom))] backdrop-blur-xl"
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
          badge={
            <span
              className="absolute -right-0.5 -top-0.5 h-3 w-3 rounded-full border border-[var(--panel)]"
              style={{ backgroundColor: brushColor }}
            />
          }
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
        <div className="grid grid-cols-4 gap-2 pb-2">
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
                className={`flex flex-col items-center gap-1.5 rounded-2xl border px-2 py-3 text-xs font-medium transition active:scale-95 ${
                  isActive
                    ? "border-[var(--accent)] bg-[var(--accent)] text-[var(--accent-foreground)] shadow-lg shadow-[var(--accent)]/25"
                    : "border-[var(--border)] bg-[var(--panel)] text-[var(--foreground)]"
                }`}
              >
                <Icon size={20} />
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
        title="Brush & page"
        description="Color, size & page"
      >
        <div className="space-y-5 pb-2">
          <section>
            <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--muted-foreground)]">
              Color
            </p>
            <div className="flex flex-wrap gap-2.5">
              {QUICK_COLORS.map((c) => {
                const isActive = brushColor.toLowerCase() === c.toLowerCase();
                return (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setColor(c)}
                    aria-label={`Color ${c}`}
                    aria-pressed={isActive}
                    className={`flex h-10 w-10 items-center justify-center rounded-xl border-2 transition active:scale-95 ${
                      isActive
                        ? "border-[var(--accent)] shadow-md"
                        : "border-[var(--border)]"
                    }`}
                    style={{ backgroundColor: c }}
                  >
                    {isActive && (
                      <Check
                        size={14}
                        className={
                          c === "#ffffff"
                            ? "text-[var(--foreground)]"
                            : "text-white"
                        }
                      />
                    )}
                  </button>
                );
              })}
              <label className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-xl border-2 border-dashed border-[var(--border)] text-[var(--muted-foreground)]">
                <Plus size={14} />
                <input
                  type="color"
                  value={brushColor}
                  onChange={(e) => setColor(e.target.value)}
                  className="sr-only"
                  aria-label="Custom color"
                />
              </label>
            </div>
          </section>

          <section>
            <div className="mb-1.5 flex items-center justify-between">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--muted-foreground)]">
                Size
              </p>
              <span className="font-mono text-xs text-[var(--foreground)]">
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
          </section>

          <section>
            <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--muted-foreground)]">
              Page
            </p>
            <div className="grid grid-cols-3 gap-2">
              {pagePresets.map(([preset, presetConfig]) => {
                const isActive = pagePreset === preset;
                return (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => setPagePreset(preset)}
                    className={`rounded-xl border px-3 py-2.5 text-sm font-medium transition ${
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
        <ResultPanel
          handleGenerate={handleGenerate}
          aiLoading={aiLoading}
          onClose={closeSheet}
        />
      </BottomSheet>

      {/* More sheet */}
      <BottomSheet
        open={sheet === "more"}
        onClose={closeSheet}
        title="More"
        description="Actions"
      >
        <div className="space-y-2 pb-2">
          <ActionRow
            icon={Trash2}
            label="Delete selected"
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
              label={isSaving ? "Saving…" : saveMessage || "Save sketch"}
              disabled={isEmpty || isSaving}
              spinning={isSaving}
              onClick={handleSaveSketch}
            />
          )}
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
  badge?: React.ReactNode;
}

function DockButton({
  icon: Icon,
  label,
  onClick,
  highlight,
  badge,
}: DockButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`relative flex flex-1 flex-col items-center gap-0.5 rounded-xl px-1 py-1.5 text-[10px] font-medium transition active:scale-95 ${
        highlight
          ? "bg-[var(--accent)] text-[var(--accent-foreground)] shadow-md"
          : "text-[var(--foreground)]"
      }`}
    >
      <Icon size={18} />
      {label}
      {badge}
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
      className={`flex w-full items-center gap-3 rounded-2xl border px-4 py-3 text-left text-sm font-medium transition active:scale-[0.98] ${
        danger
          ? "border-rose-300 bg-rose-50 text-rose-600 enabled:hover:bg-rose-100 dark:border-rose-500/40 dark:bg-rose-500/10 dark:text-rose-300"
          : "border-[var(--border)] bg-[var(--panel)] text-[var(--foreground)]"
      } disabled:cursor-not-allowed disabled:opacity-45`}
    >
      <Icon size={16} className={spinning ? "animate-spin" : undefined} />
      {label}
    </button>
  );
}

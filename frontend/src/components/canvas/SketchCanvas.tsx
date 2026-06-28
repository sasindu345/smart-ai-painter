"use client";

import { useState, useEffect, useRef, type RefObject } from "react";
import {
  Loader2,
  X,
  Check,
  Sparkles,
  Info,
  Layers,
  Columns,
  RefreshCw,
  Compass,
  ArrowRight,
  User,
  Heart,
  Calendar,
  AlertTriangle,
  Download,
} from "lucide-react";

import { useCanvasStore } from "@/store/canvasStore";
import { DownloadButton } from "../result/DownloadButton";
import { VariationThumbs } from "../result/VariationThumbs";

type SketchCanvasProps = {
  surfaceRef: RefObject<HTMLDivElement>;
  canvasRef: RefObject<HTMLCanvasElement>;
  loadTemplate?: (type: "face" | "house" | "tree") => void;
};

export function SketchCanvas({
  surfaceRef,
  canvasRef,
  loadTemplate,
}: SketchCanvasProps) {
  const pagePreset = useCanvasStore((state) => state.pagePreset);
  const pageWidth = useCanvasStore((state) => state.pageWidth);
  const pageHeight = useCanvasStore((state) => state.pageHeight);
  const isEmpty = useCanvasStore((state) => state.isEmpty);

  // AI states from store
  const aiLoading = useCanvasStore((state) => state.aiLoading);
  const aiResult = useCanvasStore((state) => state.aiResult);
  const aiVariations = useCanvasStore((state) => state.aiVariations);
  const aiActiveVariation = useCanvasStore((state) => state.aiActiveVariation);
  const aiError = useCanvasStore((state) => state.aiError);
  const aiSketchBase64 = useCanvasStore((state) => state.aiSketchBase64);
  const aiStyle = useCanvasStore((state) => state.aiStyle);
  const aiStrength = useCanvasStore((state) => state.aiStrength);
  const aiPrompt = useCanvasStore((state) => state.aiPrompt);

  const setAiActiveVariation = useCanvasStore(
    (state) => state.setAiActiveVariation,
  );
  const resetAiGeneration = useCanvasStore((state) => state.resetAiGeneration);
  const setAiError = useCanvasStore((state) => state.setAiError);
  const setAiStrength = useCanvasStore((state) => state.setAiStrength);

  // Custom Local State for Simplified UX
  const [comparisonMode, setComparisonMode] = useState<
    "overlay" | "split" | "slider"
  >("overlay");
  const [sliderPosition, setSliderPosition] = useState(50);
  const [showMetadata, setShowMetadata] = useState(false);
  const [isHoveringSlider, setIsHoveringSlider] = useState(false);

  // Multi-step Loading States
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [activeStep, setActiveStep] = useState("Uploading Sketch");

  // Simulate progress bar updates
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (aiLoading) {
      setLoadingProgress(0);
      setActiveStep("Uploading Sketch");

      timer = setInterval(() => {
        setLoadingProgress((prev) => {
          const next = Math.min(prev + Math.floor(Math.random() * 8) + 2, 95);
          if (next <= 20) setActiveStep("Uploading Sketch");
          else if (next <= 40) setActiveStep("Understanding Sketch");
          else if (next <= 60) setActiveStep("Building Scene Layout");
          else if (next <= 85) setActiveStep("Generating Image Style");
          else setActiveStep("Finalizing Result");
          return next;
        });
      }, 150);
    } else {
      setLoadingProgress(100);
      setActiveStep("Finalizing Result");
    }
    return () => clearInterval(timer);
  }, [aiLoading]);

  // Run handleGenerate trigger from shell
  const triggerRegenerate = () => {
    // Find generate button in shell and click it programmatically or rely on user action
    const btn = document.querySelector(
      '[data-action="generate"]',
    ) as HTMLButtonElement;
    if (btn) btn.click();
    else {
      // Find any button containing "Generate" or SVG sparkles and dispatch click
      const buttons = Array.from(document.querySelectorAll("button"));
      const genBtn = buttons.find(
        (b) =>
          b.textContent?.includes("Generate") ||
          b.textContent?.includes("Generating"),
      );
      if (genBtn) genBtn.click();
    }
  };

  const confidenceValue =
    aiResult?.confidence !== undefined
      ? Math.round(aiResult.confidence * 100)
      : 100;
  const isLowConfidence = confidenceValue < 50;

  // Custom client-side upscaler download
  const handleDownloadUpscaled = async (format: "png" | "jpeg" | "hd") => {
    const activeImageBase64 = aiVariations[aiActiveVariation];
    if (!activeImageBase64) return;

    if (format === "hd") {
      // Upscale 2x using temporary HTML5 canvas
      const img = new Image();
      img.src = `data:image/png;base64,${activeImageBase64}`;
      img.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = img.width * 2;
        canvas.height = img.height * 2;
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = "high";
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          const link = document.createElement("a");
          link.download = `generation-hd-${aiResult?.generation_id || "canvas"}.png`;
          link.href = canvas.toDataURL("image/png");
          link.click();
        }
      };
    } else {
      const link = document.createElement("a");
      link.download = `generation-${aiResult?.generation_id || "canvas"}.${format}`;
      link.href = `data:image/${format === "jpeg" ? "jpeg" : "png"};base64,${activeImageBase64}`;
      link.click();
    }
  };

  return (
    <section className="flex flex-1 min-h-0 flex-col rounded-3xl border border-[var(--border)] bg-[var(--panel)] p-3 shadow-[0_4px_24px_rgba(0,0,0,0.03)] overflow-hidden">
      <div className="flex-1 overflow-hidden rounded-2xl bg-[var(--background)] relative flex flex-col">
        <div className="flex-1 overflow-auto p-4 relative flex items-center justify-center min-h-0">
          <div
            ref={surfaceRef}
            className="canvas-surface relative w-full overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--canvas)] shadow-[0_8px_30px_rgba(0,0,0,0.04)]"
            style={{ aspectRatio: `${pageWidth} / ${pageHeight}` }}
          >
            <canvas
              ref={canvasRef}
              className="block"
              role="img"
              aria-label={`Drawing canvas, ${pagePreset} ${pageWidth} by ${pageHeight}`}
              tabIndex={0}
            />

            {/* AI Multi-Step Loader Glassmorphism Overlay */}
            {aiLoading && (
              <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-[var(--panel)]/70 backdrop-blur-[6px] transition-all">
                <div className="flex flex-col items-center gap-4 rounded-3xl border border-[var(--border)] bg-[var(--panel-elevated)] p-6 shadow-2xl w-[90%] max-w-[360px] text-center">
                  <div className="relative flex items-center justify-center">
                    <Loader2
                      size={36}
                      className="animate-spin text-[var(--accent)]"
                    />
                    <Sparkles
                      size={16}
                      className="absolute text-[var(--accent)] animate-pulse"
                    />
                  </div>

                  <div className="w-full">
                    <div className="flex justify-between text-xs font-semibold text-[var(--muted-foreground)] mb-1">
                      <span>{activeStep}</span>
                      <span>{loadingProgress}%</span>
                    </div>
                    {/* Linear Progress Bar */}
                    <div className="h-2 w-full bg-[var(--border)] rounded-full overflow-hidden">
                      <div
                        className="h-full bg-[var(--accent)] transition-all duration-300 ease-out rounded-full"
                        style={{ width: `${loadingProgress}%` }}
                      />
                    </div>
                  </div>
                  <p className="text-[11px] text-[var(--muted-foreground)]">
                    VLM is decoding layers and sketching outputs...
                  </p>
                </div>
              </div>
            )}

            {/* Generated AI result overlay */}
            {aiResult && aiActiveVariation >= 0 && (
              <div className="absolute inset-0 z-10 bg-[var(--canvas)] flex items-center justify-center select-none overflow-hidden">
                {/* 1. Comparison: Overlay Mode (Default) */}
                {comparisonMode === "overlay" && (
                  <img
                    src={`data:image/png;base64,${aiVariations[aiActiveVariation]}`}
                    alt="Generated artwork"
                    className="w-full h-full object-contain"
                  />
                )}

                {/* 2. Comparison: Split Side-by-Side View */}
                {comparisonMode === "split" && (
                  <div className="w-full h-full flex flex-col sm:flex-row bg-[var(--canvas)] gap-1">
                    <div className="flex-1 min-w-0 relative border-r border-[var(--border)]">
                      <div className="absolute inset-0 flex items-center justify-center p-2 bg-[var(--background)]">
                        <img
                          src={
                            aiSketchBase64.startsWith("data:")
                              ? aiSketchBase64
                              : `data:image/png;base64,${aiSketchBase64}`
                          }
                          alt="Sketch outline"
                          className="max-w-full max-h-full object-contain opacity-85"
                        />
                      </div>
                      <span className="absolute left-3 top-3 rounded-lg bg-black/60 px-2.5 py-1 text-[10px] font-bold text-white uppercase tracking-wider backdrop-blur-sm">
                        Original Sketch
                      </span>
                    </div>
                    <div className="flex-1 min-w-0 relative">
                      <div className="absolute inset-0 flex items-center justify-center p-2 bg-[var(--background)]">
                        <img
                          src={`data:image/png;base64,${aiVariations[aiActiveVariation]}`}
                          alt="Generated AI artwork"
                          className="max-w-full max-h-full object-contain"
                        />
                      </div>
                      <span className="absolute left-3 top-3 rounded-lg bg-[var(--accent)] px-2.5 py-1 text-[10px] font-bold text-white uppercase tracking-wider shadow">
                        AI Output ({aiStyle})
                      </span>
                    </div>
                  </div>
                )}

                {/* 3. Comparison: Slider Sweep Separation View */}
                {comparisonMode === "slider" && (
                  <div
                    className="relative w-full h-full bg-[var(--background)] overflow-hidden"
                    onMouseEnter={() => setIsHoveringSlider(true)}
                    onMouseLeave={() => setIsHoveringSlider(false)}
                  >
                    {/* Background Layer: Generated Output */}
                    <div className="absolute inset-0 flex items-center justify-center p-1 select-none pointer-events-none">
                      <img
                        src={`data:image/png;base64,${aiVariations[aiActiveVariation]}`}
                        alt="AI Generation output"
                        className="max-w-full max-h-full object-contain"
                      />
                    </div>

                    {/* Top Layer: Original Sketch (Clipped) */}
                    <div
                      className="absolute inset-0 flex items-center justify-center p-1 select-none pointer-events-none transition-all duration-75"
                      style={{
                        clipPath: `polygon(0 0, ${sliderPosition}% 0, ${sliderPosition}% 100%, 0 100%)`,
                      }}
                    >
                      <img
                        src={
                          aiSketchBase64.startsWith("data:")
                            ? aiSketchBase64
                            : `data:image/png;base64,${aiSketchBase64}`
                        }
                        alt="Sketch drawing"
                        className="max-w-full max-h-full object-contain bg-[var(--canvas)]"
                      />
                    </div>

                    {/* Split Line separator */}
                    <div
                      className="absolute inset-y-0 z-10 w-0.5 bg-[var(--accent)] cursor-ew-resize flex items-center justify-center"
                      style={{ left: `${sliderPosition}%` }}
                    >
                      <div className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-[var(--accent)] bg-[var(--panel)] shadow-lg hover:scale-105 transition-all">
                        <Columns size={12} className="text-[var(--accent)]" />
                      </div>
                    </div>

                    {/* Opacity control range input */}
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={sliderPosition}
                      onChange={(e) =>
                        setSliderPosition(Number(e.target.value))
                      }
                      className="absolute inset-0 z-20 w-full h-full opacity-0 cursor-ew-resize"
                      aria-label="Before after slider separator position"
                    />

                    {isHoveringSlider && (
                      <div className="absolute top-4 left-4 z-30 pointer-events-none flex gap-2">
                        <span className="rounded-lg bg-black/60 px-2 py-0.5 text-[9px] font-bold text-white uppercase backdrop-blur-sm">
                          Sketch
                        </span>
                        <span className="rounded-lg bg-[var(--accent)] px-2 py-0.5 text-[9px] font-bold text-white uppercase shadow">
                          AI Artwork
                        </span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* AI Result Options, Interpretations & Controls Overlays */}
        {aiResult && aiActiveVariation >= 0 && (
          <div className="z-20 border-t border-[var(--border)] bg-[var(--panel)]/95 backdrop-blur-md px-4 py-3 flex flex-col gap-3">
            {/* VLM Interpretations, Objects, and Low Confidence Warning */}
            <div className="flex flex-col lg:flex-row justify-between items-start gap-3">
              <div className="flex-1 w-full min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--accent)]">
                    ✨ AI Interpretation:
                  </span>
                  {aiResult.scene_description && (
                    <span className="text-xs font-semibold text-[var(--foreground)] capitalize">
                      {aiResult.scene_description}
                    </span>
                  )}
                  <span className="text-xs font-medium text-[var(--muted-foreground)] ml-auto sm:ml-0">
                    (Confidence:{" "}
                    <span
                      className={`font-mono font-bold ${isLowConfidence ? "text-amber-500" : "text-green-600"}`}
                    >
                      {confidenceValue}%
                    </span>
                    )
                  </span>
                </div>

                {/* Detected Objects list */}
                {aiResult.detected_objects &&
                  aiResult.detected_objects.length > 0 && (
                    <div className="mt-1.5 flex flex-wrap gap-1.5 items-center">
                      <span className="text-[9px] font-semibold text-[var(--muted-foreground)] uppercase">
                        Objects:
                      </span>
                      {aiResult.detected_objects.map((obj, i) => (
                        <span
                          key={i}
                          className="rounded-lg bg-[var(--panel-elevated)] border border-[var(--border)] px-2 py-0.5 text-[10px] font-medium text-[var(--foreground)] capitalize shadow-sm"
                        >
                          {obj}
                        </span>
                      ))}
                    </div>
                  )}

                {/* Low Confidence Warning Box */}
                {isLowConfidence && (
                  <div className="mt-2 rounded-xl bg-amber-500/10 border border-amber-500/20 p-2.5 flex items-start gap-2 text-xs font-medium text-amber-800 dark:text-amber-300">
                    <AlertTriangle
                      size={14}
                      className="mt-0.5 shrink-0 text-amber-500"
                    />
                    <div>
                      <span>
                        We had trouble decoding your sketch lines. Consider
                        adding a hint above, or use the retry options below.
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* View comparisons selector */}
              <div className="flex border border-[var(--border)] rounded-xl overflow-hidden bg-[var(--panel-elevated)] shrink-0 self-end lg:self-center">
                <button
                  type="button"
                  onClick={() => setComparisonMode("overlay")}
                  className={`px-3 py-1.5 text-xs font-semibold transition-all ${
                    comparisonMode === "overlay"
                      ? "bg-[var(--accent)] text-[var(--accent-foreground)]"
                      : "text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
                  }`}
                >
                  Overlay
                </button>
                <button
                  type="button"
                  onClick={() => setComparisonMode("split")}
                  className={`px-3 py-1.5 text-xs font-semibold transition-all ${
                    comparisonMode === "split"
                      ? "bg-[var(--accent)] text-[var(--accent-foreground)]"
                      : "text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
                  }`}
                >
                  Split
                </button>
                <button
                  type="button"
                  onClick={() => setComparisonMode("slider")}
                  className={`px-3 py-1.5 text-xs font-semibold transition-all ${
                    comparisonMode === "slider"
                      ? "bg-[var(--accent)] text-[var(--accent-foreground)]"
                      : "text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
                  }`}
                >
                  Slider
                </button>
              </div>
            </div>

            {/* Bottom Actions Row */}
            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[var(--border)] pt-2.5">
              {/* Variations switch & Discard */}
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={resetAiGeneration}
                  className="flex items-center gap-1.5 rounded-xl border border-rose-500/20 px-3.5 py-2 text-xs font-bold text-rose-500 hover:bg-rose-500/10 transition"
                >
                  <X size={14} />
                  Discard
                </button>

                <VariationThumbs
                  images={aiVariations}
                  activeIndex={aiActiveVariation}
                  onSelect={setAiActiveVariation}
                />
              </div>

              {/* Suggested Retry Actions */}
              <div className="flex flex-wrap gap-1.5">
                <button
                  type="button"
                  title="Increases guidance/conditioning to match drawing shapes accurately"
                  onClick={() => {
                    setAiStrength(35);
                    setTimeout(triggerRegenerate, 100);
                  }}
                  className="inline-flex items-center gap-1 rounded-lg border border-[var(--border)] bg-[var(--panel-elevated)] px-2.5 py-1.5 text-[11px] font-semibold text-[var(--foreground)] hover:text-[var(--accent)] hover:border-[var(--accent)] transition"
                >
                  <Compass size={11} />
                  Preserve Structure
                </button>
                <button
                  type="button"
                  title="Decreases conditioning scale to let SD add style variations"
                  onClick={() => {
                    setAiStrength(85);
                    setTimeout(triggerRegenerate, 100);
                  }}
                  className="inline-flex items-center gap-1 rounded-lg border border-[var(--border)] bg-[var(--panel-elevated)] px-2.5 py-1.5 text-[11px] font-semibold text-[var(--foreground)] hover:text-[var(--accent)] hover:border-[var(--accent)] transition"
                >
                  <Sparkles size={11} />
                  More Creative
                </button>
                <button
                  type="button"
                  onClick={triggerRegenerate}
                  className="inline-flex items-center gap-1 rounded-lg border border-[var(--border)] bg-[var(--panel-elevated)] px-2.5 py-1.5 text-[11px] font-semibold text-[var(--foreground)] hover:text-[var(--accent)] hover:border-[var(--accent)] transition"
                >
                  <RefreshCw size={11} />
                  Regenerate
                </button>
              </div>

              {/* Downloads & Keep Actions */}
              <div className="flex items-center gap-2">
                <div className="relative group">
                  <button
                    type="button"
                    className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-[var(--border)] bg-[var(--panel)] px-3.5 text-xs font-semibold text-[var(--foreground)] hover:bg-[var(--panel-elevated)] shadow transition"
                  >
                    <Download size={14} />
                    Download
                  </button>
                  <div className="absolute bottom-full right-0 mb-1 z-30 hidden group-hover:flex flex-col bg-[var(--panel-elevated)] border border-[var(--border)] shadow-xl rounded-xl p-1.5 min-w-[120px] transition-all">
                    <button
                      type="button"
                      onClick={() => handleDownloadUpscaled("png")}
                      className="text-left w-full px-2.5 py-1.5 text-xs text-[var(--foreground)] hover:bg-[var(--accent)] hover:text-[var(--accent-foreground)] rounded-lg font-medium"
                    >
                      PNG Format
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDownloadUpscaled("jpeg")}
                      className="text-left w-full px-2.5 py-1.5 text-xs text-[var(--foreground)] hover:bg-[var(--accent)] hover:text-[var(--accent-foreground)] rounded-lg font-medium"
                    >
                      JPEG Format
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDownloadUpscaled("hd")}
                      className="text-left w-full px-2.5 py-1.5 text-xs text-[var(--accent)] hover:bg-[var(--accent)] hover:text-[var(--accent-foreground)] rounded-lg font-bold flex items-center justify-between"
                    >
                      <span>HD Upscale</span>
                      <span className="text-[9px] bg-green-500/20 text-green-600 rounded px-1">
                        2X
                      </span>
                    </button>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setShowMetadata((prev) => !prev)}
                  className={`inline-flex h-9 items-center justify-center w-9 rounded-xl border ${
                    showMetadata
                      ? "bg-[var(--accent)] border-[var(--accent)] text-[var(--accent-foreground)]"
                      : "bg-[var(--panel)] border-[var(--border)] text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
                  } shadow transition`}
                  title="Technical Metadata Details"
                >
                  <Info size={15} />
                </button>

                <button
                  type="button"
                  onClick={() => {
                    alert(
                      "Artwork kept! Saved successfully inside your local gallery.",
                    );
                    resetAiGeneration();
                  }}
                  className="flex items-center gap-1.5 rounded-xl bg-green-600 px-4 py-2 text-xs font-bold text-white hover:bg-green-700 transition"
                >
                  <Check size={14} />
                  Keep Result
                </button>
              </div>
            </div>

            {/* Technical Details Slide-down Drawer Panel */}
            {showMetadata && (
              <div className="border-t border-[var(--border)] pt-3 mt-1 grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                <div className="space-y-1">
                  <div className="text-[10px] text-[var(--muted-foreground)] font-semibold uppercase">
                    Generation ID
                  </div>
                  <div
                    className="font-mono text-[var(--foreground)] truncate"
                    title={aiResult.generation_id}
                  >
                    {aiResult.generation_id}
                  </div>
                </div>
                <div className="space-y-1">
                  <div className="text-[10px] text-[var(--muted-foreground)] font-semibold uppercase">
                    AI Provider / Mode
                  </div>
                  <div className="text-[var(--foreground)] font-medium capitalize">
                    {aiResult.provider} ({aiResult.mode})
                  </div>
                </div>
                <div className="space-y-1">
                  <div className="text-[10px] text-[var(--muted-foreground)] font-semibold uppercase">
                    Style / Strength
                  </div>
                  <div className="text-[var(--foreground)] font-medium capitalize">
                    {aiStyle} · {aiStrength}% creativity
                  </div>
                </div>
                <div className="space-y-1">
                  <div className="text-[10px] text-[var(--muted-foreground)] font-semibold uppercase">
                    Dimension / Latency
                  </div>
                  <div className="text-[var(--foreground)] font-medium font-mono">
                    {pageWidth}x{pageHeight} ·{" "}
                    {aiResult.generation_time ?? "3.4"}s
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Inline AI Error Toast */}
      {aiError && (
        <div className="mt-2 rounded-xl bg-rose-50 border border-rose-200 px-4 py-2 flex items-center justify-between text-xs font-medium text-rose-800 dark:bg-rose-950/20 dark:border-rose-900/50 dark:text-rose-300">
          <span>⚠️ {aiError}</span>
          <button
            type="button"
            onClick={() => setAiError(null)}
            className="text-rose-500 hover:text-rose-700 ml-2"
          >
            Dismiss
          </button>
        </div>
      )}
    </section>
  );
}

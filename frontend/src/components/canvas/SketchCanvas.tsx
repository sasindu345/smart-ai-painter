"use client";

import type { RefObject } from "react";
import { Loader2, X, Check } from "lucide-react";

import { useCanvasStore } from "@/store/canvasStore";
import { DownloadButton } from "../result/DownloadButton";
import { VariationThumbs } from "../result/VariationThumbs";

type SketchCanvasProps = {
  surfaceRef: RefObject<HTMLDivElement>;
  canvasRef: RefObject<HTMLCanvasElement>;
};

export function SketchCanvas({ surfaceRef, canvasRef }: SketchCanvasProps) {
  const pagePreset = useCanvasStore((state) => state.pagePreset);
  const pageWidth = useCanvasStore((state) => state.pageWidth);
  const pageHeight = useCanvasStore((state) => state.pageHeight);

  // AI states from store
  const aiLoading = useCanvasStore((state) => state.aiLoading);
  const aiResult = useCanvasStore((state) => state.aiResult);
  const aiVariations = useCanvasStore((state) => state.aiVariations);
  const aiActiveVariation = useCanvasStore((state) => state.aiActiveVariation);
  const aiError = useCanvasStore((state) => state.aiError);

  const setAiActiveVariation = useCanvasStore(
    (state) => state.setAiActiveVariation,
  );
  const resetAiGeneration = useCanvasStore((state) => state.resetAiGeneration);
  const setAiError = useCanvasStore((state) => state.setAiError);

  return (
    <section className="flex flex-1 min-h-0 flex-col rounded-2xl border border-[var(--border)] bg-[var(--panel)] p-3 shadow-[0_2px_12px_rgba(0,0,0,0.04)] overflow-hidden">
      <div className="flex-1 overflow-auto rounded-xl bg-[var(--background)] p-4 relative">
        <div className="flex min-h-full items-center justify-center">
          <div
            ref={surfaceRef}
            className="canvas-surface relative w-full overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--canvas)] shadow-[0_8px_30px_rgba(0,0,0,0.08)]"
            style={{ aspectRatio: `${pageWidth} / ${pageHeight}` }}
          >
            <canvas
              ref={canvasRef}
              className="block"
              role="img"
              aria-label={`Drawing canvas, ${pagePreset} ${pageWidth} by ${pageHeight}`}
              tabIndex={0}
            />

            {/* AI Loading glassmorphism overlay */}
            {aiLoading && (
              <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-[var(--panel)]/70 backdrop-blur-[4px]">
                <div className="flex flex-col items-center gap-3 rounded-2xl border border-[var(--border)] bg-[var(--panel-elevated)] p-5 shadow-lg">
                  <Loader2
                    size={32}
                    className="animate-spin text-[var(--accent)]"
                  />
                  <p className="text-sm font-semibold text-[var(--foreground)]">
                    AI is painting your vision…
                  </p>
                </div>
              </div>
            )}

            {/* Generated AI result overlay */}
            {aiResult && aiActiveVariation >= 0 && (
              <div className="absolute inset-0 z-10 bg-[var(--canvas)] flex flex-col justify-between">
                <img
                  src={`data:image/png;base64,${aiVariations[aiActiveVariation]}`}
                  alt="Generated artwork"
                  className="w-full h-full object-contain"
                />

                {/* Floating control bar */}
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 flex flex-col items-center gap-2 max-w-[90%] w-[480px]">
                  {aiResult.scene_description && (
                    <div className="rounded-xl border border-[var(--border)] bg-[var(--panel-elevated)]/96 px-3 py-1.5 text-center text-xs font-semibold text-[var(--foreground)] shadow-md backdrop-blur-md">
                      ✨ VLM Description:{" "}
                      <span className="capitalize text-[var(--accent)]">
                        {aiResult.scene_description}
                      </span>
                    </div>
                  )}

                  <VariationThumbs
                    images={aiVariations}
                    activeIndex={aiActiveVariation}
                    onSelect={setAiActiveVariation}
                  />

                  <div className="flex items-center gap-2 rounded-2xl border border-[var(--border)] bg-[var(--panel-elevated)]/96 p-2 shadow-lg backdrop-blur-md w-full justify-between">
                    <button
                      type="button"
                      onClick={resetAiGeneration}
                      className="flex items-center gap-1.5 rounded-xl border border-rose-500/20 px-3.5 py-2 text-xs font-bold text-rose-500 hover:bg-rose-500/10 transition"
                    >
                      <X size={14} />
                      Discard & Back
                    </button>

                    <div className="flex items-center gap-2">
                      <DownloadButton
                        imageBase64={aiVariations[aiActiveVariation]}
                      />
                      <button
                        type="button"
                        onClick={() => {
                          alert(
                            "Artwork kept! You can view it in the Gallery page.",
                          );
                        }}
                        className="flex items-center gap-1.5 rounded-xl bg-green-600 px-4.5 py-2 text-xs font-bold text-white hover:bg-green-700 transition"
                      >
                        <Check size={14} />
                        Keep
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
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

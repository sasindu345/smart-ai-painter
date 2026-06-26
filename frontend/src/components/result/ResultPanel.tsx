"use client";

import { useEffect, useRef, useState } from "react";

import { GenerateButton } from "@/components/generate/GenerateButton";
import { PromptInput } from "@/components/generate/PromptInput";
import { StrengthSlider } from "@/components/generate/StrengthSlider";
import { StylePills } from "@/components/generate/StylePills";
import { EmptyState } from "@/components/shared/EmptyState";
import { ErrorToast } from "@/components/shared/ErrorToast";
import { LoadingBar } from "@/components/shared/LoadingBar";
import { useGenerate } from "@/hooks/useGenerate";
import { usePromptHistory } from "@/hooks/usePromptHistory";
import { useCanvasStore } from "@/store/canvasStore";
import type { ArtStyle } from "@/types/generate";

import { DownloadButton } from "./DownloadButton";
import { SceneLabel } from "./SceneLabel";
import { VariationThumbs } from "./VariationThumbs";

export function ResultPanel() {
  const [prompt, setPrompt] = useState("");
  const [showPromptInput, setShowPromptInput] = useState(false);
  const [style, setStyle] = useState<ArtStyle>("realistic");
  const [strength, setStrength] = useState(65);
  const [variations, setVariations] = useState<string[]>([]);
  const [activeVariation, setActiveVariation] = useState(0);
  const variationsRef = useRef<string[]>([]);

  const isEmpty = useCanvasStore((s) => s.isEmpty);
  const pagePreset = useCanvasStore((s) => s.pagePreset);
  const pageWidth = useCanvasStore((s) => s.pageWidth);
  const pageHeight = useCanvasStore((s) => s.pageHeight);

  const { generate, data, isLoading, isError, error, reset } = useGenerate();
  const { addPrompt } = usePromptHistory();

  const canGenerate = !isEmpty;

  useEffect(() => {
    variationsRef.current = variations;
  }, [variations]);

  function handleGenerate() {
    // Get canvas element and export as base64
    const canvasEl = document.querySelector("canvas");
    if (!canvasEl) return;

    const dataUrl = canvasEl.toDataURL("image/png");
    const base64 = dataUrl.split(",")[1];

    const trimmedPrompt = prompt.trim();

    generate(
      {
        sketch_base64: base64,
        prompt: trimmedPrompt || undefined,
        style,
        strength: strength / 100,
        page_preset: pagePreset,
        page_width: pageWidth,
        page_height: pageHeight,
      },
      {
        onSuccess: (result) => {
          if (trimmedPrompt) {
            addPrompt(trimmedPrompt);
          }
          const next = [...variationsRef.current, result.image_base64].slice(
            -3,
          );
          setVariations(next);
          setActiveVariation(next.length - 1);

          // If the AI model needs a hint, show the prompt input
          if (result.needs_hint) {
            setShowPromptInput(true);
          }
        },
      },
    );
  }

  const displayImage = data?.image_base64 ?? variations[activeVariation];

  return (
    <section className="flex flex-col gap-4">
      {/* Header */}
      <div>
        <p className="text-xs font-medium uppercase tracking-[0.22em] text-[var(--muted-foreground)]">
          AI Output
        </p>
        <h2 className="mt-1 text-xl font-semibold text-[var(--foreground)]">
          Generate Artwork
        </h2>
      </div>

      {/* Controls */}
      <div className="space-y-4 rounded-[28px] border border-[var(--border)] bg-[var(--panel-elevated)] p-4">
        {showPromptInput ? (
          <div className="space-y-2">
            <PromptInput value={prompt} onChange={setPrompt} />
            <button
              type="button"
              onClick={() => {
                setShowPromptInput(false);
                setPrompt("");
              }}
              className="text-[11px] font-medium text-rose-500 hover:underline focus:outline-none"
            >
              Hide hint input
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setShowPromptInput(true)}
            className="inline-flex items-center gap-1 text-[11px] font-medium text-[var(--muted-foreground)] hover:text-[var(--accent)] hover:underline focus:outline-none"
          >
            + Add a hint to guide the AI (optional)
          </button>
        )}
        <StylePills value={style} onChange={setStyle} />
        <StrengthSlider value={strength} onChange={setStrength} />
        <GenerateButton
          onClick={handleGenerate}
          disabled={!canGenerate}
          isLoading={isLoading}
        />
      </div>

      {/* Loading */}
      {isLoading && (
        <div
          role="status"
          aria-live="polite"
          className="space-y-2 rounded-[28px] border border-[var(--border)] bg-[var(--panel-elevated)] p-4"
        >
          <LoadingBar />
          <p className="text-center text-xs text-[var(--muted-foreground)]">
            Generating your artwork…
          </p>
        </div>
      )}

      {/* Error */}
      {isError && error && (
        <ErrorToast message={error.message} onDismiss={reset} />
      )}

      {/* Result */}
      {displayImage ? (
        <div className="space-y-3 rounded-[28px] border border-[var(--border)] bg-[var(--panel-elevated)] p-4">
          <img
            src={`data:image/png;base64,${displayImage}`}
            alt="Generated artwork"
            className="w-full rounded-2xl border border-[var(--border)]"
          />

          {data?.scene_description && (
            <SceneLabel
              sceneDescription={data.scene_description}
              confidence={data.confidence ?? 1.0}
            />
          )}

          {data?.needs_hint && (
            <p className="rounded-xl bg-amber-50 border border-amber-200 px-3 py-1.5 text-center text-xs font-medium text-amber-800 dark:bg-amber-950/20 dark:border-amber-900/50 dark:text-amber-300">
              ⚠️ AI is not sure about this sketch. Consider adding a hint above
              to improve results.
            </p>
          )}

          {data?.mode === "mock" && (
            <p className="rounded-xl bg-amber-100 px-3 py-1.5 text-center text-xs font-medium text-amber-800 dark:bg-amber-950/50 dark:text-amber-300">
              Mock mode — using placeholder generation
            </p>
          )}

          <VariationThumbs
            images={variations}
            activeIndex={activeVariation}
            onSelect={setActiveVariation}
          />

          <DownloadButton imageBase64={displayImage} />
        </div>
      ) : (
        !isLoading && (
          <EmptyState
            title="Generated artwork will appear here"
            description="Draw something on the canvas, select a style, then hit Generate to see AI-powered results."
          />
        )
      )}
    </section>
  );
}

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
import { useCanvasStore } from "@/store/canvasStore";
import type { ArtStyle } from "@/types/generate";

import { DownloadButton } from "./DownloadButton";
import { VariationThumbs } from "./VariationThumbs";

export function ResultPanel() {
  const [prompt, setPrompt] = useState("");
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

  const canGenerate = !isEmpty && prompt.trim().length > 0;

  useEffect(() => {
    variationsRef.current = variations;
  }, [variations]);

  function handleGenerate() {
    // Get canvas element and export as base64
    const canvasEl = document.querySelector("canvas");
    if (!canvasEl) return;

    const dataUrl = canvasEl.toDataURL("image/png");
    const base64 = dataUrl.split(",")[1];

    generate(
      {
        sketch_base64: base64,
        prompt: prompt.trim(),
        style,
        strength: strength / 100,
        page_preset: pagePreset,
        page_width: pageWidth,
        page_height: pageHeight,
      },
      {
        onSuccess: (result) => {
          const next = [...variationsRef.current, result.image_base64].slice(
            -3,
          );
          setVariations(next);
          setActiveVariation(next.length - 1);
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
        <PromptInput value={prompt} onChange={setPrompt} />
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
        <div className="space-y-2 rounded-[28px] border border-[var(--border)] bg-[var(--panel-elevated)] p-4">
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
            description="Draw something on the canvas, type a prompt, then hit Generate to see AI-powered results."
          />
        )
      )}
    </section>
  );
}

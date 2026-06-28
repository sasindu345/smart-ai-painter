"use client";

import { useEffect, useRef, useState } from "react";

import { Loader2, Sparkles } from "lucide-react";
import { useSearchParams } from "next/navigation";

import { CanvasTopBar } from "@/components/canvas/CanvasTopBar";
import { MobilePhoneShell } from "@/components/canvas/MobilePhoneShell";
import { SketchCanvas } from "@/components/canvas/SketchCanvas";
import { TabletShell } from "@/components/canvas/TabletShell";
import { ToolDock } from "@/components/canvas/ToolDock";
import { useCanvas } from "@/hooks/useCanvas";
import { useDeviceType, type DeviceType } from "@/hooks/useDeviceType";
import { apiRequest } from "@/lib/api";
import { useCanvasStore } from "@/store/canvasStore";
import { PAGE_PRESET_SIZES } from "@/types/canvas";
import { useGenerate } from "@/hooks/useGenerate";

import { StylePills } from "../generate/StylePills";
import { StrengthSlider } from "../generate/StrengthSlider";
import { PromptInput } from "../generate/PromptInput";
import { OnboardingHint } from "../shared/OnboardingHint";
import { TopBar } from "../shared/TopBar";

interface SketchData {
  id: string;
  title: string;
  image_url: string;
  page_preset: string;
  page_width: number;
  page_height: number;
}

export function CanvasWorkspaceShell() {
  const device = useDeviceType();

  const isResultDrawerOpen = useCanvasStore((s) => s.isResultDrawerOpen);
  const aiStyle = useCanvasStore((s) => s.aiStyle);
  const aiStrength = useCanvasStore((s) => s.aiStrength);
  const aiPrompt = useCanvasStore((s) => s.aiPrompt);
  const showAiPromptInput = useCanvasStore((s) => s.showAiPromptInput);
  const aiLoading = useCanvasStore((s) => s.aiLoading);
  const aiVariations = useCanvasStore((s) => s.aiVariations);

  const setAiStyle = useCanvasStore((s) => s.setAiStyle);
  const setAiStrength = useCanvasStore((s) => s.setAiStrength);
  const setAiPrompt = useCanvasStore((s) => s.setAiPrompt);
  const setAiResult = useCanvasStore((s) => s.setAiResult);
  const setAiVariations = useCanvasStore((s) => s.setAiVariations);
  const setAiActiveVariation = useCanvasStore((s) => s.setAiActiveVariation);
  const setShowAiPromptInput = useCanvasStore((s) => s.setShowAiPromptInput);
  const setAiLoading = useCanvasStore((s) => s.setAiLoading);
  const setAiError = useCanvasStore((s) => s.setAiError);

  const { generate } = useGenerate();
  const variationsRef = useRef<string[]>([]);

  useEffect(() => {
    variationsRef.current = aiVariations;
  }, [aiVariations]);

  function handleGenerate() {
    const canvasEl = document.querySelector("canvas");
    if (!canvasEl) return;

    const dataUrl = canvasEl.toDataURL("image/png");
    const base64 = dataUrl.split(",")[1];

    setAiLoading(true);
    setAiError(null);
    useCanvasStore.setState({ aiSketchBase64: base64 });

    generate(
      {
        sketch_base64: base64,
        prompt: aiPrompt.trim() || undefined,
        style: aiStyle,
        strength: aiStrength / 100,
        page_preset: useCanvasStore.getState().pagePreset,
        page_width: useCanvasStore.getState().pageWidth,
        page_height: useCanvasStore.getState().pageHeight,
      },
      {
        onSuccess: (result) => {
          setAiLoading(false);
          setAiResult(result);
          const next = [...variationsRef.current, result.image_base64].slice(
            -3,
          );
          setAiVariations(next);
          setAiActiveVariation(next.length - 1);

          // Add to local history sidebar list
          const historyItem = {
            id: result.generation_id || Math.random().toString(36).substr(2, 9),
            timestamp: new Date().toLocaleDateString(undefined, {
              month: "short",
              day: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            }),
            imageUrl: result.image_base64,
            sketchUrl: base64,
            style: aiStyle,
            objects: result.detected_objects || [],
            confidence: Math.round((result.confidence ?? 1.0) * 100),
            generationTime: result.generation_time ?? 0,
            provider: result.provider || "xAI / local",
            model:
              result.mode === "mock" ? "Mock Model" : "Stable Diffusion XL",
            prompt:
              aiPrompt.trim() ||
              result.scene_description ||
              "VLM Generated Prompt",
            strength: aiStrength,
          };
          useCanvasStore.getState().addToHistory(historyItem);

          if (result.needs_hint) {
            setShowAiPromptInput(true);
          }
        },
        onError: (err) => {
          setAiLoading(false);
          setAiError(err.message || "Failed to generate image.");
        },
      },
    );
  }

  if (device === null) {
    return (
      <div className="flex min-h-[100dvh] flex-col items-center justify-center gap-4 bg-[var(--background)]">
        <div className="flex h-14 w-14 items-center justify-center rounded-3xl bg-[var(--accent)] text-[var(--accent-foreground)] shadow-lg">
          <Sparkles size={22} />
        </div>
        <Loader2
          size={28}
          className="animate-spin text-[var(--muted-foreground)]"
        />
      </div>
    );
  }

  return (
    <CanvasShellInner
      key={device}
      device={device}
      handleGenerate={handleGenerate}
      aiLoading={aiLoading}
    />
  );
}

interface CanvasShellInnerProps {
  device: DeviceType;
  handleGenerate: () => void;
  aiLoading: boolean;
}

function CanvasShellInner({
  device,
  handleGenerate,
  aiLoading,
}: CanvasShellInnerProps) {
  const canvas = useCanvas();
  const searchParams = useSearchParams();
  const sketchId = searchParams.get("sketch");
  const [loadingSketch, setLoadingSketch] = useState(!!sketchId);
  const loadedRef = useRef(false);

  const isResultDrawerOpen = useCanvasStore((s) => s.isResultDrawerOpen);
  const aiStyle = useCanvasStore((s) => s.aiStyle);
  const aiStrength = useCanvasStore((s) => s.aiStrength);
  const aiPrompt = useCanvasStore((s) => s.aiPrompt);
  const showAiPromptInput = useCanvasStore((s) => s.showAiPromptInput);

  const setAiStyle = useCanvasStore((s) => s.setAiStyle);
  const setAiStrength = useCanvasStore((s) => s.setAiStrength);
  const setAiPrompt = useCanvasStore((s) => s.setAiPrompt);
  const setShowAiPromptInput = useCanvasStore((s) => s.setShowAiPromptInput);

  useEffect(() => {
    if (!sketchId || loadedRef.current) return;
    loadedRef.current = true;

    async function loadSketch() {
      try {
        const token =
          typeof window !== "undefined"
            ? localStorage.getItem("auth_token")
            : null;
        const headers: Record<string, string> = {};
        if (token) {
          headers.Authorization = `Bearer ${token}`;
        }

        const sketch = await apiRequest<SketchData>(
          `/api/v1/sketches/${sketchId}`,
          { headers },
        );

        const preset = sketch.page_preset as keyof typeof PAGE_PRESET_SIZES;
        if (preset in PAGE_PRESET_SIZES) {
          useCanvasStore.getState().setPagePreset(preset);
        } else {
          useCanvasStore
            .getState()
            .setCustomPageSize(sketch.page_width, sketch.page_height);
        }

        await new Promise((r) => setTimeout(r, 100));
        await canvas.loadSketchImage(sketch.image_url);
      } catch (err) {
        console.error("Failed to load sketch:", err);
      } finally {
        setLoadingSketch(false);
      }
    }

    loadSketch();
  }, [sketchId, canvas, loadedRef, setLoadingSketch]);

  // ——— Phone — no TopBar to maximize drawing space ———
  if (device === "phone") {
    return (
      <div className="flex h-[100dvh] flex-col">
        <MobilePhoneShell
          canvas={canvas}
          loadingSketch={loadingSketch}
          handleGenerate={handleGenerate}
          aiLoading={aiLoading}
        />
        <OnboardingHint />
      </div>
    );
  }

  // ——— Tablet ———
  if (device === "tablet") {
    return (
      <div className="flex min-h-[100dvh] flex-col">
        <TopBar />
        <TabletShell
          canvas={canvas}
          loadingSketch={loadingSketch}
          handleGenerate={handleGenerate}
          aiLoading={aiLoading}
        />
        <OnboardingHint />
      </div>
    );
  }

  // ——— Desktop ———

  const aiControlsPanel = isResultDrawerOpen ? (
    <div className="mb-3 rounded-2xl border border-[var(--border)] bg-[var(--panel)] p-4 shadow-sm flex flex-col gap-3 transition-all duration-300">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <StylePills value={aiStyle} onChange={setAiStyle} />
        <div className="flex-1 min-w-[200px]">
          <StrengthSlider value={aiStrength} onChange={setAiStrength} />
        </div>
        <div className="flex items-center gap-2">
          {showAiPromptInput ? (
            <button
              type="button"
              onClick={() => {
                setShowAiPromptInput(false);
                setAiPrompt("");
              }}
              className="rounded-xl border border-rose-500/30 px-3 py-2 text-xs font-semibold text-rose-500 hover:bg-rose-500/10 transition"
            >
              Remove Hint
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setShowAiPromptInput(true)}
              className="rounded-xl border border-[var(--border)] bg-[var(--panel-elevated)] px-3 py-2 text-xs font-semibold text-[var(--muted-foreground)] hover:text-[var(--accent)] hover:border-[var(--accent)]/50 transition"
            >
              + Add Hint
            </button>
          )}
          <button
            type="button"
            disabled={useCanvasStore.getState().isEmpty || aiLoading}
            onClick={handleGenerate}
            className="flex items-center gap-2 rounded-xl bg-[var(--accent)] px-5 py-2.5 text-xs font-semibold text-[var(--accent-foreground)] shadow-md hover:opacity-90 disabled:opacity-50 transition"
          >
            {aiLoading ? (
              <>
                <Loader2 size={14} className="animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Sparkles size={14} />
                Generate
              </>
            )}
          </button>
        </div>
      </div>
      {showAiPromptInput && (
        <div className="pt-2 border-t border-[var(--border)]">
          <PromptInput value={aiPrompt} onChange={setAiPrompt} />
        </div>
      )}
    </div>
  ) : null;

  const sketchContent = (
    <section className="min-w-0 flex-1 flex flex-col h-full overflow-hidden">
      <CanvasTopBar
        undo={canvas.undo}
        redo={canvas.redo}
        clear={canvas.clear}
        deleteSelected={canvas.deleteSelected}
        zoomIn={canvas.zoomIn}
        zoomOut={canvas.zoomOut}
        resetZoom={canvas.resetZoom}
      />

      {aiControlsPanel}

      <div className="relative flex-1 min-h-0 flex flex-col">
        <SketchCanvas
          surfaceRef={canvas.surfaceRef}
          canvasRef={canvas.canvasRef}
        />
        {loadingSketch && (
          <div className="absolute inset-0 z-10 flex items-center justify-center rounded-[30px] bg-[var(--panel)]/80 backdrop-blur-sm">
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
      </div>
    </section>
  );

  return (
    <div className="flex h-screen flex-col overflow-hidden">
      <TopBar />
      <main className="flex-1 overflow-hidden bg-[var(--background)] px-4 py-4 sm:px-6 lg:px-8">
        <div className="mx-auto flex h-full max-w-[1800px] gap-4 overflow-hidden">
          <ToolDock />
          {sketchContent}
        </div>
      </main>
      <OnboardingHint />
    </div>
  );
}

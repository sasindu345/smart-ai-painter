"use client";

import { useEffect, useRef, useState } from "react";

import { Loader2 } from "lucide-react";
import { useSearchParams } from "next/navigation";

import { CanvasTopBar } from "@/components/canvas/CanvasTopBar";
import { MobileTabShell } from "@/components/canvas/MobileTabShell";
import { SketchCanvas } from "@/components/canvas/SketchCanvas";
import { ToolDock } from "@/components/canvas/ToolDock";
import { useCanvas } from "@/hooks/useCanvas";
import { apiRequest } from "@/lib/api";
import { createSupabaseBrowserClient } from "@/lib/supabase";
import { useCanvasStore } from "@/store/canvasStore";
import { PAGE_PRESET_SIZES } from "@/types/canvas";

import { ResultPanel } from "../result/ResultPanel";
import { ResultPreviewSheet } from "../result/ResultPreviewSheet";
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
  const canvas = useCanvas();
  const searchParams = useSearchParams();
  const sketchId = searchParams.get("sketch");
  const [loadingSketch, setLoadingSketch] = useState(!!sketchId);
  const loadedRef = useRef(false);

  useEffect(() => {
    if (!sketchId || loadedRef.current) return;
    loadedRef.current = true;

    async function loadSketch() {
      try {
        const supabase = createSupabaseBrowserClient();
        const {
          data: { session },
        } = await supabase.auth.getSession();
        const headers: Record<string, string> = {};
        if (session?.access_token) {
          headers.Authorization = `Bearer ${session.access_token}`;
        }

        const sketch = await apiRequest<SketchData>(
          `/api/v1/sketches/${sketchId}`,
          { headers },
        );

        // Set page dimensions
        const preset = sketch.page_preset as keyof typeof PAGE_PRESET_SIZES;
        if (preset in PAGE_PRESET_SIZES) {
          useCanvasStore.getState().setPagePreset(preset);
        } else {
          useCanvasStore
            .getState()
            .setCustomPageSize(sketch.page_width, sketch.page_height);
        }

        // Wait a tick for canvas to be ready after potential resize
        await new Promise((r) => setTimeout(r, 100));

        await canvas.loadSketchImage(sketch.image_url);
      } catch (err) {
        console.error("Failed to load sketch:", err);
      } finally {
        setLoadingSketch(false);
      }
    }

    loadSketch();
  }, [sketchId, canvas]);

  const sketchContent = (
    <section className="min-w-0 flex-1">
      <CanvasTopBar
        undo={canvas.undo}
        redo={canvas.redo}
        clear={canvas.clear}
        deleteSelected={canvas.deleteSelected}
        zoomIn={canvas.zoomIn}
        zoomOut={canvas.zoomOut}
        resetZoom={canvas.resetZoom}
      />

      <div className="relative">
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
                Loading sketch...
              </p>
            </div>
          </div>
        )}
      </div>
    </section>
  );

  const resultContent = (
    <div className="rounded-[28px] border border-[var(--border)] bg-[var(--panel)] p-4">
      <ResultPanel />
    </div>
  );

  return (
    <>
      <TopBar />
      <main className="min-h-screen bg-[var(--background)] px-4 py-5 pb-28 sm:px-6 lg:px-8 lg:pb-5">
        {/* Mobile: tab-based layout */}
        <MobileTabShell
          sketchContent={sketchContent}
          resultContent={resultContent}
        />

        {/* Desktop: side-by-side layout */}
        <div className="mx-auto hidden max-w-[1800px] gap-4 lg:flex">
          <ToolDock />
          {sketchContent}
        </div>
      </main>
      <ResultPreviewSheet />
      <OnboardingHint />
    </>
  );
}

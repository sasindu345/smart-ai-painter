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
  const device = useDeviceType();

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

  return <CanvasShellInner key={device} device={device} />;
}

function CanvasShellInner({ device }: { device: DeviceType }) {
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
  }, [sketchId, canvas]);

  // ——— Phone — no TopBar to maximize drawing space ———
  if (device === "phone") {
    return (
      <div className="flex h-[100dvh] flex-col">
        <MobilePhoneShell canvas={canvas} loadingSketch={loadingSketch} />
        <OnboardingHint />
      </div>
    );
  }

  // ——— Tablet ———
  if (device === "tablet") {
    return (
      <div className="flex min-h-[100dvh] flex-col">
        <TopBar />
        <TabletShell canvas={canvas} loadingSketch={loadingSketch} />
        <OnboardingHint />
      </div>
    );
  }

  // ——— Desktop ———
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
                Loading sketch…
              </p>
            </div>
          </div>
        )}
      </div>
    </section>
  );

  return (
    <>
      <TopBar />
      <main className="min-h-screen bg-[var(--background)] px-4 py-5 pb-5 sm:px-6 lg:px-8">
        <div className="mx-auto flex max-w-[1800px] gap-4 overflow-visible">
          <ToolDock />
          {sketchContent}
        </div>
      </main>
      <ResultPreviewSheet />
      <OnboardingHint />
    </>
  );
}

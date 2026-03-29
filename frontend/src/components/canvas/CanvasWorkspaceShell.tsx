"use client";

import { CanvasTopBar } from "@/components/canvas/CanvasTopBar";
import { SketchCanvas } from "@/components/canvas/SketchCanvas";
import { ToolDock } from "@/components/canvas/ToolDock";
import { useCanvas } from "@/hooks/useCanvas";

import { ResultPreviewSheet } from "../result/ResultPreviewSheet";
import { TopBar } from "../shared/TopBar";

export function CanvasWorkspaceShell() {
  const canvas = useCanvas();

  return (
    <>
      <TopBar />
      <main className="min-h-screen bg-[var(--background)] px-4 py-5 pb-28 sm:px-6 lg:px-8 lg:pb-5">
        <div className="mx-auto flex max-w-[1800px] gap-4">
          <ToolDock />

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

            <SketchCanvas
              surfaceRef={canvas.surfaceRef}
              canvasRef={canvas.canvasRef}
            />
          </section>
        </div>
      </main>
      <ResultPreviewSheet />
    </>
  );
}

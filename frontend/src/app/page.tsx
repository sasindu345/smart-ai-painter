import { BrushSizeSlider } from "@/components/canvas/BrushSizeSlider";
import { ColorPicker } from "@/components/canvas/ColorPicker";
import { SketchCanvas } from "@/components/canvas/SketchCanvas";
import { ToolbarPanel } from "@/components/canvas/ToolbarPanel";
import { ResultPanel } from "@/components/result/ResultPanel";
import { TopBar } from "@/components/shared/TopBar";

export default function HomePage() {
  return (
    <>
      <TopBar />
      <main className="min-h-screen bg-[var(--background)] px-4 py-6 sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-7xl gap-6 xl:grid-cols-[280px_minmax(0,1fr)_360px]">
          <aside className="flex flex-col gap-4">
            <ToolbarPanel />
            <BrushSizeSlider />
            <ColorPicker />
          </aside>

          <section className="min-w-0">
            <SketchCanvas />
          </section>

          <aside className="min-w-0">
            <ResultPanel />
          </aside>
        </div>
      </main>
    </>
  );
}

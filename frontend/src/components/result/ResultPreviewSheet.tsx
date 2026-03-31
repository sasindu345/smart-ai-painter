"use client";

import { X } from "lucide-react";

import { useCanvasStore } from "@/store/canvasStore";

import { ResultPanel } from "./ResultPanel";

export function ResultPreviewSheet() {
  const isOpen = useCanvasStore((state) => state.isResultDrawerOpen);
  const setResultDrawerOpen = useCanvasStore(
    (state) => state.setResultDrawerOpen,
  );

  return (
    <>
      {isOpen ? (
        <button
          type="button"
          className="fixed inset-0 z-30 bg-black/35 backdrop-blur-[2px]"
          aria-label="Close AI preview"
          onClick={() => setResultDrawerOpen(false)}
        />
      ) : null}

      <aside
        className={`fixed right-0 top-0 z-40 flex h-full w-full max-w-[430px] transform flex-col border-l border-[var(--border)] bg-[color:var(--panel)]/96 p-4 shadow-2xl backdrop-blur-xl transition duration-300 sm:w-[430px] ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
        aria-hidden={!isOpen}
      >
        <div className="mb-4 flex items-center justify-between rounded-[28px] border border-[var(--border)] bg-[var(--panel-elevated)] px-4 py-3">
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.22em] text-[var(--muted-foreground)]">
              AI Preview
            </p>
            <h2 className="mt-1 text-xl font-semibold text-[var(--foreground)]">
              On-demand results panel
            </h2>
          </div>
          <button
            type="button"
            onClick={() => setResultDrawerOpen(false)}
            className="flex h-11 w-11 items-center justify-center rounded-2xl border border-[var(--border)] bg-[var(--panel)] text-[var(--foreground)] transition hover:border-[var(--accent)] hover:text-[var(--accent)]"
            aria-label="Close AI preview drawer"
          >
            <X size={18} />
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto">
          <ResultPanel />
        </div>
      </aside>
    </>
  );
}

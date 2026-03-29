import { EmptyState } from "@/components/shared/EmptyState";

export function ResultPanel() {
  return (
    <section className="rounded-[32px] border border-[var(--border)] bg-[var(--panel)] p-5 shadow-[0_24px_80px_rgba(15,23,42,0.08)]">
      <div className="mb-4">
        <p className="text-xs font-medium uppercase tracking-[0.22em] text-[var(--muted-foreground)]">
          AI Output
        </p>
        <h2 className="mt-2 text-2xl font-semibold text-[var(--foreground)]">
          Result Preview
        </h2>
      </div>
      <EmptyState
        title="Generated artwork will appear here"
        description="Phase 1 keeps the canvas full width, so this preview now opens in a drawer. In Phase 2 this panel becomes the AI generation and review workspace."
      />
    </section>
  );
}

"use client";

type SceneLabelProps = {
  sceneDescription: string;
  confidence: number;
};

export function SceneLabel({ sceneDescription, confidence }: SceneLabelProps) {
  if (!sceneDescription) return null;

  // Determine dot color based on confidence
  let dotColorClass = "bg-emerald-500 shadow-emerald-500/20";
  let confidenceText = "High confidence";
  if (confidence < 0.3) {
    dotColorClass = "bg-rose-500 shadow-rose-500/20";
    confidenceText = "Low confidence";
  } else if (confidence < 0.7) {
    dotColorClass = "bg-amber-500 shadow-amber-500/20";
    confidenceText = "Medium confidence";
  }

  return (
    <div className="flex flex-col gap-1 rounded-2xl border border-[var(--border)] bg-[var(--panel)] p-3">
      <div className="flex items-center justify-between gap-2">
        <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--muted-foreground)]">
          AI Sketch Interpretation
        </span>
        <div
          className="flex items-center gap-1.5"
          title={`${confidenceText} (${Math.round(confidence * 100)}%)`}
        >
          <span
            className={`h-2 w-2 rounded-full shadow-[0_0_8px_1px] ${dotColorClass}`}
          />
          <span className="text-[10px] font-medium text-[var(--muted-foreground)]">
            {Math.round(confidence * 100)}% Match
          </span>
        </div>
      </div>
      <p className="mt-1 text-sm font-medium text-[var(--foreground)] capitalize">
        &ldquo;{sceneDescription}&rdquo;
      </p>
    </div>
  );
}

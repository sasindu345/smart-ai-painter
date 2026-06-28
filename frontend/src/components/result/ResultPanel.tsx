import { PromptInput } from "@/components/generate/PromptInput";
import { StrengthSlider } from "@/components/generate/StrengthSlider";
import { StylePills } from "@/components/generate/StylePills";
import { useCanvasStore } from "@/store/canvasStore";

interface ResultPanelProps {
  handleGenerate: () => void;
  aiLoading: boolean;
  onClose?: () => void;
}

export function ResultPanel({
  handleGenerate,
  aiLoading,
  onClose,
}: ResultPanelProps) {
  const isEmpty = useCanvasStore((s) => s.isEmpty);
  const aiStyle = useCanvasStore((s) => s.aiStyle);
  const aiStrength = useCanvasStore((s) => s.aiStrength);
  const aiPrompt = useCanvasStore((s) => s.aiPrompt);
  const showAiPromptInput = useCanvasStore((s) => s.showAiPromptInput);

  const setAiStyle = useCanvasStore((s) => s.setAiStyle);
  const setAiStrength = useCanvasStore((s) => s.setAiStrength);
  const setAiPrompt = useCanvasStore((s) => s.setAiPrompt);
  const setShowAiPromptInput = useCanvasStore((s) => s.setShowAiPromptInput);

  const canGenerate = !isEmpty;

  return (
    <section className="flex flex-col gap-4">
      {/* Header */}
      <div>
        <p className="text-xs font-medium uppercase tracking-[0.22em] text-[var(--muted-foreground)]">
          AI Studio
        </p>
        <h2 className="mt-1 text-xl font-semibold text-[var(--foreground)]">
          Configure Generation
        </h2>
      </div>

      {/* Controls */}
      <div className="space-y-4 rounded-[28px] border border-[var(--border)] bg-[var(--panel-elevated)] p-4">
        {showAiPromptInput ? (
          <div className="space-y-2">
            <PromptInput value={aiPrompt} onChange={setAiPrompt} />
            <button
              type="button"
              onClick={() => {
                setShowAiPromptInput(false);
                setAiPrompt("");
              }}
              className="text-[11px] font-medium text-rose-500 hover:underline focus:outline-none"
            >
              Hide hint input
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setShowAiPromptInput(true)}
            className="inline-flex items-center gap-1 text-[11px] font-medium text-[var(--muted-foreground)] hover:text-[var(--accent)] hover:underline focus:outline-none"
          >
            + Add a hint to guide the AI (optional)
          </button>
        )}
        <StylePills value={aiStyle} onChange={setAiStyle} />
        <StrengthSlider value={aiStrength} onChange={setAiStrength} />

        <button
          type="button"
          disabled={!canGenerate || aiLoading}
          onClick={() => {
            handleGenerate();
            if (onClose) onClose();
          }}
          className="w-full flex items-center justify-center gap-2 rounded-2xl bg-[var(--accent)] py-3.5 text-sm font-semibold text-[var(--accent-foreground)] shadow-lg transition active:scale-95 disabled:opacity-40"
        >
          Generate Artwork
        </button>
      </div>
    </section>
  );
}

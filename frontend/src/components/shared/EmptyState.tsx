import { WandSparkles } from "lucide-react";

type EmptyStateProps = {
  title: string;
  description: string;
};

export function EmptyState({ title, description }: EmptyStateProps) {
  return (
    <div className="flex h-full min-h-[320px] flex-col items-center justify-center rounded-[28px] border border-dashed border-[var(--border)] bg-[linear-gradient(180deg,var(--panel-elevated),transparent)] px-6 text-center">
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--accent)]/12 text-[var(--accent)]">
        <WandSparkles size={22} />
      </div>
      <h3 className="text-xl font-semibold text-[var(--foreground)]">
        {title}
      </h3>
      <p className="mt-2 max-w-sm text-sm leading-6 text-[var(--muted-foreground)]">
        {description}
      </p>
    </div>
  );
}

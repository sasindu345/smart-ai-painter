"use client";

import { Download } from "lucide-react";

type DownloadButtonProps = {
  imageBase64: string;
  filename?: string;
};

export function DownloadButton({
  imageBase64,
  filename = "ai-generated.png",
}: DownloadButtonProps) {
  const href = `data:image/png;base64,${imageBase64}`;

  return (
    <a
      href={href}
      download={filename}
      className="flex items-center justify-center gap-2 rounded-2xl border border-[var(--border)] bg-[var(--panel-elevated)] px-5 py-2.5 text-sm font-medium text-[var(--foreground)] transition hover:border-[var(--accent)] hover:text-[var(--accent)]"
    >
      <Download size={16} />
      Download
    </a>
  );
}

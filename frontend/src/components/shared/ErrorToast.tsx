"use client";

import { AlertCircle, X } from "lucide-react";

type ErrorToastProps = {
  message: string;
  onDismiss: () => void;
};

export function ErrorToast({ message, onDismiss }: ErrorToastProps) {
  return (
    <div className="flex items-start gap-3 rounded-2xl border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-800 dark:bg-red-950/50 dark:text-red-300">
      <AlertCircle size={18} className="mt-0.5 shrink-0" />
      <p className="flex-1">{message}</p>
      <button
        type="button"
        onClick={onDismiss}
        className="shrink-0 rounded-lg p-1 transition hover:bg-red-200 dark:hover:bg-red-900"
        aria-label="Dismiss error"
      >
        <X size={14} />
      </button>
    </div>
  );
}

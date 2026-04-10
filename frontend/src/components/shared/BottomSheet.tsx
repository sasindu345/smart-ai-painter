"use client";

import { useEffect, type ReactNode } from "react";

import { X } from "lucide-react";

type BottomSheetProps = {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: ReactNode;
  /** When `full`, the sheet expands to the entire viewport height. */
  size?: "auto" | "full";
};

/**
 * iOS-style bottom sheet with translucent backdrop, drag handle, and Esc/swipe
 * dismissal. Designed for touch-first phone and tablet layouts.
 */
export function BottomSheet({
  open,
  onClose,
  title,
  description,
  children,
  size = "auto",
}: BottomSheetProps) {
  useEffect(() => {
    if (!open) return;

    const handleKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKey);

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      window.removeEventListener("keydown", handleKey);
      document.body.style.overflow = previousOverflow;
    };
  }, [open, onClose]);

  return (
    <>
      <button
        type="button"
        aria-label="Dismiss sheet"
        onClick={onClose}
        className={`fixed inset-0 z-40 bg-black/45 backdrop-blur-[3px] transition-opacity duration-300 ${
          open
            ? "pointer-events-auto opacity-100"
            : "pointer-events-none opacity-0"
        }`}
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        aria-hidden={!open}
        className={`fixed inset-x-0 bottom-0 z-50 flex flex-col rounded-t-[32px] border-t border-[var(--border)] bg-[var(--panel-elevated)] shadow-[0_-30px_80px_rgba(15,23,42,0.32)] backdrop-blur-2xl transition-transform duration-300 ease-out ${
          open ? "translate-y-0" : "translate-y-full"
        } ${size === "full" ? "h-[100dvh]" : "max-h-[88dvh]"}`}
      >
        <div className="flex items-center justify-center pt-3 pb-1">
          <span
            aria-hidden
            className="h-1.5 w-12 rounded-full bg-[var(--border)]"
          />
        </div>

        <div className="flex items-start justify-between gap-3 px-5 pb-3 pt-1">
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[var(--muted-foreground)]">
              {description ?? "Quick action"}
            </p>
            <h2 className="mt-0.5 text-lg font-semibold text-[var(--foreground)]">
              {title}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close sheet"
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-[var(--border)] bg-[var(--panel)] text-[var(--foreground)] transition hover:border-[var(--accent)] hover:text-[var(--accent)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
          >
            <X size={18} />
          </button>
        </div>

        <div
          className={`flex-1 overflow-y-auto overscroll-contain px-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-1 ${
            size === "full" ? "" : ""
          }`}
        >
          {children}
        </div>
      </div>
    </>
  );
}

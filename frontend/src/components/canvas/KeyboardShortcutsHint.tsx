"use client";

import { useEffect, useRef, useState } from "react";

import { Keyboard, X } from "lucide-react";

type Shortcut = {
  keys: string[];
  description: string;
};

const SHORTCUTS: { group: string; items: Shortcut[] }[] = [
  {
    group: "History",
    items: [
      { keys: ["⌘/Ctrl", "Z"], description: "Undo" },
      { keys: ["⌘/Ctrl", "⇧", "Z"], description: "Redo" },
      { keys: ["⌘/Ctrl", "Y"], description: "Redo (alt)" },
    ],
  },
  {
    group: "Selection",
    items: [
      { keys: ["Delete"], description: "Delete selected object" },
      { keys: ["Backspace"], description: "Delete selected object" },
    ],
  },
  {
    group: "Tools",
    items: [
      { keys: ["V"], description: "Select tool" },
      { keys: ["H"], description: "Move (pan) tool" },
      { keys: ["B"], description: "Brush tool" },
      { keys: ["E"], description: "Eraser tool" },
      { keys: ["R"], description: "Rectangle tool" },
      { keys: ["O"], description: "Ellipse tool" },
      { keys: ["L"], description: "Line tool" },
    ],
  },
];

export function KeyboardShortcutsHint() {
  const [open, setOpen] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    const handleKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
        buttonRef.current?.focus();
      }
    };

    const handleClickOutside = (event: MouseEvent) => {
      if (
        dialogRef.current &&
        !dialogRef.current.contains(event.target as Node) &&
        !buttonRef.current?.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    };

    window.addEventListener("keydown", handleKey);
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      window.removeEventListener("keydown", handleKey);
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [open]);

  return (
    <div className="relative">
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-controls="keyboard-shortcuts-dialog"
        title="Keyboard shortcuts"
        className="inline-flex items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--panel-elevated)] px-4 py-2 text-sm text-[var(--foreground)] transition hover:border-[var(--accent)] hover:text-[var(--accent)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
      >
        <Keyboard size={16} />
        <span className="hidden sm:inline">Shortcuts</span>
      </button>

      {open && (
        <div
          ref={dialogRef}
          id="keyboard-shortcuts-dialog"
          role="dialog"
          aria-modal="false"
          aria-label="Keyboard shortcuts"
          className="absolute right-0 top-[calc(100%+8px)] z-30 w-[min(92vw,360px)] rounded-[24px] border border-[var(--border)] bg-[var(--panel-elevated)] p-5 shadow-[0_24px_80px_rgba(15,23,42,0.18)] backdrop-blur-xl"
        >
          <div className="mb-3 flex items-center justify-between">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[var(--muted-foreground)]">
                Keyboard Shortcuts
              </p>
              <h3 className="mt-1 text-base font-semibold text-[var(--foreground)]">
                Quick reference
              </h3>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Close shortcuts"
              className="rounded-full p-1.5 text-[var(--muted-foreground)] transition hover:bg-[var(--panel)] hover:text-[var(--foreground)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
            >
              <X size={16} />
            </button>
          </div>

          <div className="max-h-[60vh] space-y-4 overflow-y-auto pr-1">
            {SHORTCUTS.map((group) => (
              <div key={group.group}>
                <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--muted-foreground)]">
                  {group.group}
                </p>
                <ul className="space-y-1.5">
                  {group.items.map((shortcut) => (
                    <li
                      key={shortcut.description}
                      className="flex items-center justify-between gap-3"
                    >
                      <span className="text-sm text-[var(--foreground)]">
                        {shortcut.description}
                      </span>
                      <span className="flex shrink-0 items-center gap-1">
                        {shortcut.keys.map((key, index) => (
                          <kbd
                            key={`${shortcut.description}-${index}`}
                            className="rounded-md border border-[var(--border)] bg-[var(--panel)] px-1.5 py-0.5 font-mono text-[11px] font-medium text-[var(--foreground)]"
                          >
                            {key}
                          </kbd>
                        ))}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

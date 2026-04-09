"use client";

import { useState, type ReactNode } from "react";

import { Brush, Sparkles } from "lucide-react";

const tabs = [
  { id: "sketch", label: "Sketch", icon: Brush },
  { id: "result", label: "AI Result", icon: Sparkles },
] as const;

type Tab = (typeof tabs)[number]["id"];

interface MobileTabShellProps {
  sketchContent: ReactNode;
  resultContent: ReactNode;
}

export function MobileTabShell({
  sketchContent,
  resultContent,
}: MobileTabShellProps) {
  const [activeTab, setActiveTab] = useState<Tab>("sketch");

  return (
    <div className="flex flex-col lg:hidden">
      <div className="sticky top-[73px] z-10 flex rounded-2xl border border-[var(--border)] bg-[color:var(--panel)]/92 p-1 backdrop-blur-xl">
        {tabs.map(({ id, label, icon: Icon }) => {
          const isActive = activeTab === id;
          return (
            <button
              key={id}
              type="button"
              role="tab"
              aria-selected={isActive}
              aria-controls={`tabpanel-${id}`}
              onClick={() => setActiveTab(id)}
              className={`flex flex-1 items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-medium transition ${
                isActive
                  ? "bg-[var(--accent)] text-[var(--accent-foreground)] shadow-md"
                  : "text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
              }`}
            >
              <Icon size={16} />
              {label}
            </button>
          );
        })}
      </div>

      <div
        id="tabpanel-sketch"
        role="tabpanel"
        className={activeTab === "sketch" ? "mt-4" : "hidden"}
      >
        {sketchContent}
      </div>

      <div
        id="tabpanel-result"
        role="tabpanel"
        className={activeTab === "result" ? "mt-4" : "hidden"}
      >
        {resultContent}
      </div>
    </div>
  );
}

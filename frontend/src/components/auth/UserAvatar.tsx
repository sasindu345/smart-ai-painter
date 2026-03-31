"use client";

import { LogOut } from "lucide-react";

import { useAuth } from "@/hooks/useAuth";

export function UserAvatar() {
  const { user, signOut } = useAuth();

  if (!user) return null;

  const email = user.email ?? "";
  const initials = email.split("@")[0].slice(0, 2).toUpperCase();

  return (
    <div className="group relative">
      <button
        type="button"
        className="flex h-9 w-9 items-center justify-center rounded-full bg-[var(--accent)] text-xs font-bold text-[var(--accent-foreground)] transition hover:opacity-90"
        title={email}
      >
        {initials}
      </button>

      {/* Dropdown */}
      <div className="invisible absolute right-0 top-full mt-2 min-w-[180px] rounded-2xl border border-[var(--border)] bg-[var(--panel)] p-2 opacity-0 shadow-xl transition-all group-hover:visible group-hover:opacity-100">
        <p className="truncate px-3 py-1.5 text-xs text-[var(--muted-foreground)]">
          {email}
        </p>
        <hr className="my-1 border-[var(--border)]" />
        <button
          type="button"
          onClick={signOut}
          className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm text-[var(--foreground)] transition hover:bg-[var(--panel-elevated)]"
        >
          <LogOut size={14} />
          Sign out
        </button>
      </div>
    </div>
  );
}

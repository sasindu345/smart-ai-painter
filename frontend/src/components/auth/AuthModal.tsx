"use client";

import { useState } from "react";

import { LogIn, Mail, X } from "lucide-react";

import { useAuth } from "@/hooks/useAuth";

interface AuthModalProps {
  open: boolean;
  onClose: () => void;
}

export function AuthModal({ open, onClose }: AuthModalProps) {
  const { signIn, signUp, signInWithGoogle } = useAuth();

  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState("");

  if (!open) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    try {
      if (mode === "login") {
        await signIn(email, password);
        onClose();
      } else {
        await signUp(email, password);
        onClose();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="relative w-full max-w-md rounded-[28px] border border-[var(--border)] bg-[var(--panel)] p-6 shadow-2xl">
        {/* Close button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 rounded-full p-1.5 text-[var(--muted-foreground)] transition hover:bg-[var(--panel-elevated)] hover:text-[var(--foreground)]"
        >
          <X size={18} />
        </button>

        {/* Header */}
        <div className="mb-6 text-center">
          <h2 className="text-xl font-semibold text-[var(--foreground)]">
            {mode === "login" ? "Welcome back" : "Create account"}
          </h2>
          <p className="mt-1 text-sm text-[var(--muted-foreground)]">
            {mode === "login"
              ? "Sign in to access your gallery"
              : "Sign up to save your generations"}
          </p>
        </div>

        {/* Email/Password form */}
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label
              htmlFor="auth-email"
              className="mb-1 block text-xs font-medium text-[var(--muted-foreground)]"
            >
              Email
            </label>
            <div className="relative">
              <Mail
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted-foreground)]"
              />
              <input
                id="auth-email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full rounded-xl border border-[var(--border)] bg-[var(--panel-elevated)] py-2.5 pl-10 pr-4 text-sm text-[var(--foreground)] outline-none transition focus:border-[var(--accent)]"
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="auth-password"
              className="mb-1 block text-xs font-medium text-[var(--muted-foreground)]"
            >
              Password
            </label>
            <input
              id="auth-password"
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full rounded-xl border border-[var(--border)] bg-[var(--panel-elevated)] px-4 py-2.5 text-sm text-[var(--foreground)] outline-none transition focus:border-[var(--accent)]"
            />
          </div>

          {error && (
            <p className="rounded-xl bg-red-100 px-3 py-2 text-xs text-red-700 dark:bg-red-950/50 dark:text-red-300">
              {error}
            </p>
          )}

          {success && (
            <p className="rounded-xl bg-green-100 px-3 py-2 text-xs text-green-700 dark:bg-green-950/50 dark:text-green-300">
              {success}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-[var(--accent)] px-4 py-2.5 text-sm font-medium text-[var(--accent-foreground)] transition hover:opacity-90 disabled:opacity-50"
          >
            <LogIn size={16} />
            {loading
              ? "Please wait…"
              : mode === "login"
                ? "Sign In"
                : "Sign Up"}
          </button>
        </form>

        {/* Toggle mode */}
        <p className="mt-4 text-center text-xs text-[var(--muted-foreground)]">
          {mode === "login"
            ? "Don't have an account?"
            : "Already have an account?"}{" "}
          <button
            type="button"
            onClick={() => {
              setMode(mode === "login" ? "signup" : "login");
              setError("");
              setSuccess("");
            }}
            className="font-medium text-[var(--accent)] hover:underline"
          >
            {mode === "login" ? "Sign up" : "Sign in"}
          </button>
        </p>
      </div>
    </div>
  );
}

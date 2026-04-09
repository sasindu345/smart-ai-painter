"use client";

import { useCallback, useEffect, useState } from "react";

const STORAGE_KEY = "smart-ai-painter:prompt-history";
const MAX_ENTRIES = 10;

function readHistory(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter((value): value is string => typeof value === "string")
      .slice(0, MAX_ENTRIES);
  } catch {
    return [];
  }
}

function writeHistory(history: string[]) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
  } catch {
    // ignore quota errors
  }
}

export function usePromptHistory() {
  const [history, setHistory] = useState<string[]>([]);

  useEffect(() => {
    setHistory(readHistory());
  }, []);

  const addPrompt = useCallback((prompt: string) => {
    const trimmed = prompt.trim();
    if (!trimmed) return;
    setHistory((current) => {
      const next = [trimmed, ...current.filter((item) => item !== trimmed)].slice(
        0,
        MAX_ENTRIES,
      );
      writeHistory(next);
      return next;
    });
  }, []);

  const clearHistory = useCallback(() => {
    writeHistory([]);
    setHistory([]);
  }, []);

  const removePrompt = useCallback((prompt: string) => {
    setHistory((current) => {
      const next = current.filter((item) => item !== prompt);
      writeHistory(next);
      return next;
    });
  }, []);

  return { history, addPrompt, clearHistory, removePrompt };
}

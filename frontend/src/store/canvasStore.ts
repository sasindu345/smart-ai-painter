"use client";

import { create } from "zustand";

import type { CanvasAction, CanvasState } from "@/types/canvas";

const initialState: CanvasState = {
  activeTool: "brush",
  brushColor: "#111827",
  brushSize: 8,
  history: [],
  historyIndex: -1,
  canUndo: false,
  canRedo: false,
  isDirty: false,
  isEmpty: true,
};

export const useCanvasStore = create<CanvasState & CanvasAction>((set) => ({
  ...initialState,
  setTool: (activeTool) => set({ activeTool }),
  setColor: (brushColor) => set({ brushColor }),
  setSize: (brushSize) => set({ brushSize }),
  pushHistory: (snapshot) =>
    set((state) => {
      const nextHistory = state.history.slice(0, state.historyIndex + 1);
      nextHistory.push(snapshot);
      return {
        history: nextHistory,
        historyIndex: nextHistory.length - 1,
        canUndo: nextHistory.length > 1,
        canRedo: false,
        isDirty: nextHistory.length > 1,
      };
    }),
  setHistoryIndex: (historyIndex) =>
    set((state) => ({
      historyIndex,
      canUndo: historyIndex > 0,
      canRedo: historyIndex < state.history.length - 1,
      isDirty: historyIndex > 0,
    })),
  clearHistory: (snapshot) =>
    set({
      history: [snapshot],
      historyIndex: 0,
      canUndo: false,
      canRedo: false,
      isDirty: false,
      isEmpty: true,
    }),
  setCanvasStatus: (status) =>
    set((state) => {
      if (
        state.canUndo === status.canUndo &&
        state.canRedo === status.canRedo &&
        state.isDirty === status.isDirty &&
        state.isEmpty === status.isEmpty
      ) {
        return state;
      }

      return status;
    }),
}));

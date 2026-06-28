"use client";

import { create } from "zustand";

import {
  PAGE_PRESET_SIZES,
  type CanvasAction,
  type CanvasState,
} from "@/types/canvas";

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
  zoomLevel: 1,
  pagePreset: "landscape",
  pageWidth: PAGE_PRESET_SIZES.landscape.width,
  pageHeight: PAGE_PRESET_SIZES.landscape.height,
  isResultDrawerOpen: false,
  aiStyle: "realistic",
  aiStrength: 65,
  aiPrompt: "",
  aiResult: null,
  aiVariations: [],
  aiActiveVariation: -1,
  showAiPromptInput: false,
  aiLoading: false,
  aiError: null,
};

export const useCanvasStore = create<CanvasState & CanvasAction>((set) => ({
  ...initialState,
  setTool: (activeTool) => set({ activeTool }),
  setColor: (brushColor) => set({ brushColor }),
  setSize: (brushSize) => set({ brushSize }),
  setZoomLevel: (zoomLevel) => set({ zoomLevel }),
  setPagePreset: (pagePreset) =>
    set({
      pagePreset,
      pageWidth: PAGE_PRESET_SIZES[pagePreset].width,
      pageHeight: PAGE_PRESET_SIZES[pagePreset].height,
    }),
  setCustomPageSize: (pageWidth, pageHeight) =>
    set({
      pagePreset: "custom",
      pageWidth,
      pageHeight,
    }),
  toggleResultDrawer: () =>
    set((state) => ({
      isResultDrawerOpen: !state.isResultDrawerOpen,
    })),
  setResultDrawerOpen: (isResultDrawerOpen) => set({ isResultDrawerOpen }),
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
  setAiStyle: (aiStyle) => set({ aiStyle }),
  setAiStrength: (aiStrength) => set({ aiStrength }),
  setAiPrompt: (aiPrompt) => set({ aiPrompt }),
  setAiResult: (aiResult) => set({ aiResult }),
  setAiVariations: (aiVariations) => set({ aiVariations }),
  setAiActiveVariation: (aiActiveVariation) => set({ aiActiveVariation }),
  setShowAiPromptInput: (showAiPromptInput) => set({ showAiPromptInput }),
  setAiLoading: (aiLoading) => set({ aiLoading }),
  setAiError: (aiError) => set({ aiError }),
  resetAiGeneration: () =>
    set({
      aiResult: null,
      aiVariations: [],
      aiActiveVariation: -1,
      aiLoading: false,
      aiError: null,
    }),
}));

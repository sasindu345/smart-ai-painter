import type { ArtStyle, GenerateResponse } from "./generate";

export const PAGE_PRESET_SIZES = {
  square: { width: 1024, height: 1024, label: "Square" },
  portrait: { width: 1080, height: 1350, label: "Portrait" },
  landscape: { width: 1600, height: 900, label: "Landscape" },
} as const;

export type CanvasPagePreset = keyof typeof PAGE_PRESET_SIZES | "custom";

export type CanvasTool =
  | "select"
  | "move"
  | "brush"
  | "eraser"
  | "rect"
  | "ellipse"
  | "line"
  | "crop";

export type CanvasState = {
  activeTool: CanvasTool;
  brushColor: string;
  brushSize: number;
  history: string[];
  historyIndex: number;
  canUndo: boolean;
  canRedo: boolean;
  isDirty: boolean;
  isEmpty: boolean;
  zoomLevel: number;
  pagePreset: CanvasPagePreset;
  pageWidth: number;
  pageHeight: number;
  isResultDrawerOpen: boolean;

  // AI generation states
  aiStyle: ArtStyle;
  aiStrength: number;
  aiPrompt: string;
  aiResult: GenerateResponse | null;
  aiVariations: string[];
  aiActiveVariation: number;
  showAiPromptInput: boolean;
  aiLoading: boolean;
  aiError: string | null;
  aiSketchBase64: string;

  // Simplified UX Improvements States
  comparisonMode: "overlay" | "split" | "slider";
  generationHistory: HistoryItem[];
};

export type HistoryItem = {
  id: string;
  timestamp: string;
  imageUrl: string;
  sketchUrl: string;
  style: string;
  objects: string[];
  confidence: number;
  generationTime: number;
  provider: string;
  model: string;
  prompt: string;
  strength: number;
};

export type CanvasAction = {
  setTool: (tool: CanvasTool) => void;
  setColor: (color: string) => void;
  setSize: (size: number) => void;
  setZoomLevel: (zoomLevel: number) => void;
  setPagePreset: (preset: Exclude<CanvasPagePreset, "custom">) => void;
  setCustomPageSize: (width: number, height: number) => void;
  toggleResultDrawer: () => void;
  setResultDrawerOpen: (isOpen: boolean) => void;
  pushHistory: (snapshot: string) => void;
  setHistoryIndex: (index: number) => void;
  clearHistory: (snapshot: string) => void;
  setCanvasStatus: (
    status: Pick<CanvasState, "canUndo" | "canRedo" | "isDirty" | "isEmpty">,
  ) => void;

  // AI generation actions
  setAiStyle: (style: ArtStyle) => void;
  setAiStrength: (strength: number) => void;
  setAiPrompt: (prompt: string) => void;
  setAiResult: (result: GenerateResponse | null) => void;
  setAiVariations: (variations: string[]) => void;
  setAiActiveVariation: (index: number) => void;
  setShowAiPromptInput: (show: boolean) => void;
  setAiLoading: (loading: boolean) => void;
  setAiError: (error: string | null) => void;
  resetAiGeneration: () => void;

  // Simplified UX Actions
  setComparisonMode: (mode: "overlay" | "split" | "slider") => void;
  addToHistory: (item: HistoryItem) => void;
  setHistory: (history: HistoryItem[]) => void;
};

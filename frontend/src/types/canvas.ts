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
};

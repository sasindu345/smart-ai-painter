export type CanvasTool = "brush" | "eraser";

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
};

export type CanvasAction = {
  setTool: (tool: CanvasTool) => void;
  setColor: (color: string) => void;
  setSize: (size: number) => void;
  pushHistory: (snapshot: string) => void;
  setHistoryIndex: (index: number) => void;
  clearHistory: (snapshot: string) => void;
  setCanvasStatus: (
    status: Pick<CanvasState, "canUndo" | "canRedo" | "isDirty" | "isEmpty">,
  ) => void;
};

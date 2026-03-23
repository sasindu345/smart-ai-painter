export interface CanvasState {
  brushSize: number;
  brushColor: string;
  tool: "brush" | "eraser";
  history: string[];
  historyIndex: number;
}

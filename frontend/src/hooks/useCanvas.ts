"use client";

import { useCallback, useEffect, useMemo, useRef, type RefObject } from "react";
import { Canvas, Path, PencilBrush } from "fabric";

import { useCanvasStore } from "@/store/canvasStore";

type UseCanvasReturn = {
  surfaceRef: RefObject<HTMLDivElement>;
  canvasRef: RefObject<HTMLCanvasElement>;
  undo: () => void;
  redo: () => void;
  clear: () => void;
};

export const useCanvas = (): UseCanvasReturn => {
  const surfaceRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fabricRef = useRef<Canvas | null>(null);
  const blankSnapshotRef = useRef<string>("");

  const tool = useCanvasStore((state) => state.activeTool);
  const color = useCanvasStore((state) => state.brushColor);
  const size = useCanvasStore((state) => state.brushSize);
  const history = useCanvasStore((state) => state.history);
  const historyIndex = useCanvasStore((state) => state.historyIndex);
  const pushHistory = useCanvasStore((state) => state.pushHistory);
  const setHistoryIndex = useCanvasStore((state) => state.setHistoryIndex);
  const clearHistory = useCanvasStore((state) => state.clearHistory);
  const setCanvasStatus = useCanvasStore((state) => state.setCanvasStatus);

  const serializeCanvas = useCallback(
    (canvas: Canvas) => JSON.stringify(canvas.toJSON()),
    [],
  );

  const syncCanvasStatus = useCallback(
    (canvas: Canvas, nextIndex: number, nextHistoryLength: number) => {
      const isEmpty = canvas.getObjects().length === 0;
      setCanvasStatus({
        canUndo: nextIndex > 0,
        canRedo: nextIndex < nextHistoryLength - 1,
        isDirty: nextIndex > 0,
        isEmpty,
      });
    },
    [setCanvasStatus],
  );

  const updateBrush = useCallback(() => {
    const canvas = fabricRef.current;
    if (!canvas) {
      return;
    }

    canvas.isDrawingMode = true;
    canvas.freeDrawingBrush ??= new PencilBrush(canvas);

    const brush = canvas.freeDrawingBrush as PencilBrush & {
      globalCompositeOperation?: GlobalCompositeOperation;
    };

    brush.width = size;
    if (tool === "eraser") {
      brush.color = "#000000";
      brush.globalCompositeOperation = "destination-out";
    } else {
      brush.color = color;
      brush.globalCompositeOperation = "source-over";
    }

    canvas.contextTop.globalCompositeOperation =
      brush.globalCompositeOperation ?? "source-over";
  }, [color, size, tool]);

  const saveSnapshot = useCallback(() => {
    const canvas = fabricRef.current;
    if (!canvas) return;
    const snapshot = serializeCanvas(canvas);

    const { history: currentHistory, historyIndex: currentIndex } =
      useCanvasStore.getState();
    if (currentHistory[currentIndex] === snapshot) {
      syncCanvasStatus(canvas, currentIndex, currentHistory.length);
      return;
    }

    pushHistory(snapshot);
    syncCanvasStatus(canvas, currentIndex + 1, currentIndex + 2);
  }, [pushHistory, serializeCanvas, syncCanvasStatus]);

  const saveSnapshotRef = useRef(saveSnapshot);
  useEffect(() => {
    saveSnapshotRef.current = saveSnapshot;
  }, [saveSnapshot]);

  const updateBrushRef = useRef(updateBrush);
  useEffect(() => {
    updateBrushRef.current = updateBrush;
  }, [updateBrush]);

  const loadSnapshot = useCallback(
    async (snapshot: string, nextIndex: number, nextHistoryLength: number) => {
      const canvas = fabricRef.current;
      if (!canvas) return;
      await canvas.loadFromJSON(snapshot);
      updateBrushRef.current();
      canvas.requestRenderAll();
      syncCanvasStatus(canvas, nextIndex, nextHistoryLength);
    },
    [syncCanvasStatus],
  );

  // Canvas initialization — runs once on mount
  useEffect(() => {
    if (!canvasRef.current || !surfaceRef.current || fabricRef.current) {
      return;
    }

    const canvas = new Canvas(canvasRef.current, {
      isDrawingMode: true,
      selection: false,
    });

    fabricRef.current = canvas;

    const resizeCanvas = () => {
      const surface = surfaceRef.current;
      if (!surface) return;

      const nextWidth = Math.max(Math.floor(surface.clientWidth), 1);
      const nextHeight = Math.max(Math.floor(surface.clientHeight), 1);

      if (
        canvas.getWidth() === nextWidth &&
        canvas.getHeight() === nextHeight
      ) {
        return;
      }

      canvas.setDimensions({
        width: nextWidth,
        height: nextHeight,
      });
      canvas.requestRenderAll();
    };

    updateBrushRef.current();
    resizeCanvas();

    const resizeObserver =
      typeof ResizeObserver !== "undefined"
        ? new ResizeObserver(() => resizeCanvas())
        : null;

    resizeObserver?.observe(surfaceRef.current);
    window.addEventListener("resize", resizeCanvas);

    const handlePathCreated = () => saveSnapshotRef.current();
    const handleBeforePathCreated = ({ path }: { path: Path }) => {
      const brush = canvas.freeDrawingBrush as PencilBrush & {
        globalCompositeOperation?: GlobalCompositeOperation;
      };

      path.set(
        "globalCompositeOperation",
        brush.globalCompositeOperation ?? "source-over",
      );
    };

    canvas.on("before:path:created", handleBeforePathCreated);
    canvas.on("path:created", handlePathCreated);

    const blankSnapshot = JSON.stringify(canvas.toJSON());
    blankSnapshotRef.current = blankSnapshot;
    useCanvasStore.getState().clearHistory(blankSnapshot);

    const isEmpty = canvas.getObjects().length === 0;
    useCanvasStore.getState().setCanvasStatus({
      canUndo: false,
      canRedo: false,
      isDirty: false,
      isEmpty,
    });

    return () => {
      resizeObserver?.disconnect();
      window.removeEventListener("resize", resizeCanvas);
      canvas.off("before:path:created", handleBeforePathCreated);
      canvas.off("path:created", handlePathCreated);
      canvas.dispose();
      fabricRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const canvas = fabricRef.current;
    if (!canvas) return;
    canvas.isDrawingMode = true;
    updateBrush();
  }, [updateBrush]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const isUndo =
        (event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "z";
      const isRedo =
        (event.metaKey || event.ctrlKey) &&
        (event.key.toLowerCase() === "y" ||
          (event.shiftKey && event.key.toLowerCase() === "z"));

      if (!isUndo && !isRedo) {
        return;
      }

      event.preventDefault();

      if (isRedo) {
        if (historyIndex >= history.length - 1) return;
        const nextIndex = historyIndex + 1;
        setHistoryIndex(nextIndex);
        void loadSnapshot(history[nextIndex], nextIndex, history.length);
        return;
      }

      if (historyIndex <= 0) return;
      const nextIndex = historyIndex - 1;
      setHistoryIndex(nextIndex);
      void loadSnapshot(history[nextIndex], nextIndex, history.length);
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [history, historyIndex, loadSnapshot, setHistoryIndex]);

  const undo = useCallback(() => {
    if (historyIndex <= 0) return;
    const nextIndex = historyIndex - 1;
    setHistoryIndex(nextIndex);
    void loadSnapshot(history[nextIndex], nextIndex, history.length);
  }, [history, historyIndex, loadSnapshot, setHistoryIndex]);

  const redo = useCallback(() => {
    if (historyIndex >= history.length - 1) return;
    const nextIndex = historyIndex + 1;
    setHistoryIndex(nextIndex);
    void loadSnapshot(history[nextIndex], nextIndex, history.length);
  }, [history, historyIndex, loadSnapshot, setHistoryIndex]);

  const clear = useCallback(() => {
    const canvas = fabricRef.current;
    if (!canvas) return;
    canvas.clear();
    canvas.backgroundColor = "";
    updateBrushRef.current();
    canvas.requestRenderAll();
    clearHistory(blankSnapshotRef.current || serializeCanvas(canvas));
    syncCanvasStatus(canvas, 0, 1);
  }, [clearHistory, serializeCanvas, syncCanvasStatus]);

  return useMemo(
    () => ({
      surfaceRef,
      canvasRef,
      undo,
      redo,
      clear,
    }),
    [undo, redo, clear],
  );
};

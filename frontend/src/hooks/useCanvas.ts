"use client";

import { useCallback, useEffect, useMemo, useRef, type RefObject } from "react";
import {
  ActiveSelection,
  Canvas,
  Ellipse,
  Line,
  Path,
  PencilBrush,
  Point,
  Rect,
} from "fabric";

import { useCanvasStore } from "@/store/canvasStore";
import type { CanvasTool } from "@/types/canvas";

const MIN_ZOOM = 0.5;
const MAX_ZOOM = 3;
const ZOOM_STEP = 0.2;
type CanvasPointerEvent = MouseEvent | TouchEvent | PointerEvent;

const isShapeTool = (tool: CanvasTool): tool is "rect" | "ellipse" | "line" =>
  tool === "rect" || tool === "ellipse" || tool === "line";

const isBrushTool = (tool: CanvasTool): tool is "brush" | "eraser" =>
  tool === "brush" || tool === "eraser";

const clampZoom = (zoomLevel: number) =>
  Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, zoomLevel));

const getClientCoordinates = (
  event: Event,
): { x: number; y: number } | null => {
  if ("clientX" in event && "clientY" in event) {
    const pointerEvent = event as MouseEvent | PointerEvent;

    return {
      x: pointerEvent.clientX,
      y: pointerEvent.clientY,
    };
  }

  if ("touches" in event) {
    const touchEvent = event as TouchEvent;
    if (touchEvent.touches.length === 0) {
      return null;
    }

    return {
      x: touchEvent.touches[0].clientX,
      y: touchEvent.touches[0].clientY,
    };
  }

  if ("changedTouches" in event) {
    const touchEvent = event as TouchEvent;
    if (touchEvent.changedTouches.length === 0) {
      return null;
    }

    return {
      x: touchEvent.changedTouches[0].clientX,
      y: touchEvent.changedTouches[0].clientY,
    };
  }

  return null;
};

export type UseCanvasReturn = {
  surfaceRef: RefObject<HTMLDivElement>;
  canvasRef: RefObject<HTMLCanvasElement>;
  undo: () => void;
  redo: () => void;
  clear: () => void;
  deleteSelected: () => void;
  zoomIn: () => void;
  zoomOut: () => void;
  resetZoom: () => void;
};

type ShapeObject = Rect | Ellipse | Line;

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
  const zoomLevel = useCanvasStore((state) => state.zoomLevel);
  const pushHistory = useCanvasStore((state) => state.pushHistory);
  const setHistoryIndex = useCanvasStore((state) => state.setHistoryIndex);
  const clearHistory = useCanvasStore((state) => state.clearHistory);
  const setCanvasStatus = useCanvasStore((state) => state.setCanvasStatus);
  const setZoomLevel = useCanvasStore((state) => state.setZoomLevel);

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

  const updateObjectInteractivity = useCallback(() => {
    const canvas = fabricRef.current;
    if (!canvas) {
      return;
    }

    const isSelectable = tool === "select";
    canvas.selection = isSelectable;

    canvas.forEachObject((object) => {
      object.set({
        selectable: isSelectable,
        evented: isSelectable,
      });
    });

    if (!isSelectable) {
      canvas.discardActiveObject();
    }

    canvas.requestRenderAll();
  }, [tool]);

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

  const updateObjectInteractivityRef = useRef(updateObjectInteractivity);
  useEffect(() => {
    updateObjectInteractivityRef.current = updateObjectInteractivity;
  }, [updateObjectInteractivity]);

  const loadSnapshot = useCallback(
    async (snapshot: string, nextIndex: number, nextHistoryLength: number) => {
      const canvas = fabricRef.current;
      if (!canvas) return;

      await canvas.loadFromJSON(snapshot);
      canvas.backgroundColor ||= "#ffffff";
      updateBrushRef.current();
      updateObjectInteractivityRef.current();
      canvas.requestRenderAll();
      syncCanvasStatus(canvas, nextIndex, nextHistoryLength);
    },
    [syncCanvasStatus],
  );

  const setZoom = useCallback(
    (nextZoomLevel: number) => {
      const canvas = fabricRef.current;
      if (!canvas) {
        return;
      }

      const clampedZoom = clampZoom(nextZoomLevel);
      const centerPoint = new Point(
        canvas.getWidth() / 2,
        canvas.getHeight() / 2,
      );

      canvas.zoomToPoint(centerPoint, clampedZoom);
      canvas.requestRenderAll();
      setZoomLevel(clampedZoom);
    },
    [setZoomLevel],
  );

  const zoomIn = useCallback(() => {
    setZoom(zoomLevel + ZOOM_STEP);
  }, [setZoom, zoomLevel]);

  const zoomOut = useCallback(() => {
    setZoom(zoomLevel - ZOOM_STEP);
  }, [setZoom, zoomLevel]);

  const resetZoom = useCallback(() => {
    const canvas = fabricRef.current;
    if (!canvas) {
      return;
    }

    canvas.setViewportTransform([1, 0, 0, 1, 0, 0]);
    canvas.requestRenderAll();
    setZoomLevel(1);
  }, [setZoomLevel]);

  useEffect(() => {
    if (!canvasRef.current || !surfaceRef.current || fabricRef.current) {
      return;
    }

    const canvas = new Canvas(canvasRef.current, {
      isDrawingMode: true,
      selection: false,
      preserveObjectStacking: true,
    });

    fabricRef.current = canvas;
    canvas.backgroundColor = "#ffffff";

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
    setZoomLevel(1);

    const resizeObserver =
      typeof ResizeObserver !== "undefined"
        ? new ResizeObserver(() => resizeCanvas())
        : null;

    resizeObserver?.observe(surfaceRef.current);
    window.addEventListener("resize", resizeCanvas);

    const handleBeforePathCreated = ({ path }: { path: Path }) => {
      const brush = canvas.freeDrawingBrush as PencilBrush & {
        globalCompositeOperation?: GlobalCompositeOperation;
      };

      path.set(
        "globalCompositeOperation",
        brush.globalCompositeOperation ?? "source-over",
      );
    };

    const handlePathCreated = () => saveSnapshotRef.current();
    const handleObjectModified = () => saveSnapshotRef.current();

    canvas.on("before:path:created", handleBeforePathCreated);
    canvas.on("path:created", handlePathCreated);
    canvas.on("object:modified", handleObjectModified);

    const blankSnapshot = JSON.stringify(canvas.toJSON());
    blankSnapshotRef.current = blankSnapshot;
    useCanvasStore.getState().clearHistory(blankSnapshot);

    useCanvasStore.getState().setCanvasStatus({
      canUndo: false,
      canRedo: false,
      isDirty: false,
      isEmpty: true,
    });

    return () => {
      resizeObserver?.disconnect();
      window.removeEventListener("resize", resizeCanvas);
      canvas.off("before:path:created", handleBeforePathCreated);
      canvas.off("path:created", handlePathCreated);
      canvas.off("object:modified", handleObjectModified);
      canvas.dispose();
      fabricRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const canvas = fabricRef.current;
    if (!canvas) {
      return;
    }

    canvas.isDrawingMode = isBrushTool(tool);
    canvas.defaultCursor =
      tool === "move"
        ? "grab"
        : tool === "crop"
          ? "not-allowed"
          : isBrushTool(tool)
            ? "crosshair"
            : "default";

    if (isBrushTool(tool)) {
      updateBrush();
    } else {
      canvas.contextTop.globalCompositeOperation = "source-over";
    }

    updateObjectInteractivity();
  }, [tool, updateBrush, updateObjectInteractivity]);

  useEffect(() => {
    const canvas = fabricRef.current;
    if (!canvas || tool !== "move") {
      return;
    }

    let isDragging = false;
    let lastX = 0;
    let lastY = 0;

    const handleMouseDown = ({ e }: { e: Event }) => {
      const coordinates = getClientCoordinates(e);
      if (!coordinates) {
        return;
      }

      isDragging = true;
      lastX = coordinates.x;
      lastY = coordinates.y;
      canvas.defaultCursor = "grabbing";
    };

    const handleMouseMove = ({ e }: { e: Event }) => {
      if (!isDragging) {
        return;
      }

      const coordinates = getClientCoordinates(e);
      if (!coordinates) {
        return;
      }

      const viewportTransform = canvas.viewportTransform;
      if (!viewportTransform) {
        return;
      }

      viewportTransform[4] += coordinates.x - lastX;
      viewportTransform[5] += coordinates.y - lastY;

      lastX = coordinates.x;
      lastY = coordinates.y;

      canvas.requestRenderAll();
    };

    const handleMouseUp = () => {
      if (!isDragging) {
        return;
      }

      isDragging = false;
      canvas.defaultCursor = "grab";

      if (canvas.viewportTransform) {
        canvas.setViewportTransform(canvas.viewportTransform);
      }
    };

    canvas.on("mouse:down", handleMouseDown);
    canvas.on("mouse:move", handleMouseMove);
    canvas.on("mouse:up", handleMouseUp);

    return () => {
      canvas.off("mouse:down", handleMouseDown);
      canvas.off("mouse:move", handleMouseMove);
      canvas.off("mouse:up", handleMouseUp);
    };
  }, [tool]);

  useEffect(() => {
    const canvas = fabricRef.current;
    if (!canvas || !isShapeTool(tool)) {
      return;
    }

    let activeShape: ShapeObject | null = null;
    let startPoint: Point | null = null;

    const createShape = (point: Point) => {
      const commonOptions = {
        fill: "transparent",
        stroke: color,
        strokeWidth: Math.max(2, size / 2),
        selectable: false,
        evented: false,
      };

      if (tool === "rect") {
        return new Rect({
          ...commonOptions,
          left: point.x,
          top: point.y,
          width: 0,
          height: 0,
          rx: 18,
          ry: 18,
        });
      }

      if (tool === "ellipse") {
        return new Ellipse({
          ...commonOptions,
          left: point.x,
          top: point.y,
          rx: 0,
          ry: 0,
          originX: "left",
          originY: "top",
        });
      }

      return new Line([point.x, point.y, point.x, point.y], {
        ...commonOptions,
        strokeLineCap: "round",
      });
    };

    const handleMouseDown = ({ e }: { e: Event }) => {
      startPoint = canvas.getScenePoint(e as CanvasPointerEvent);
      activeShape = createShape(startPoint);
      canvas.add(activeShape);
    };

    const handleMouseMove = ({ e }: { e: Event }) => {
      if (!activeShape || !startPoint) {
        return;
      }

      const currentPoint = canvas.getScenePoint(e as CanvasPointerEvent);
      const deltaX = currentPoint.x - startPoint.x;
      const deltaY = currentPoint.y - startPoint.y;

      if (activeShape instanceof Rect) {
        activeShape.set({
          left: Math.min(startPoint.x, currentPoint.x),
          top: Math.min(startPoint.y, currentPoint.y),
          width: Math.abs(deltaX),
          height: Math.abs(deltaY),
        });
      } else if (activeShape instanceof Ellipse) {
        activeShape.set({
          left: Math.min(startPoint.x, currentPoint.x),
          top: Math.min(startPoint.y, currentPoint.y),
          rx: Math.abs(deltaX) / 2,
          ry: Math.abs(deltaY) / 2,
        });
      } else if (activeShape instanceof Line) {
        activeShape.set({
          x1: startPoint.x,
          y1: startPoint.y,
          x2: currentPoint.x,
          y2: currentPoint.y,
        });
      }

      activeShape.setCoords();
      canvas.requestRenderAll();
    };

    const handleMouseUp = () => {
      if (!activeShape) {
        return;
      }

      const isTinyShape =
        activeShape.getScaledWidth() < 2 && activeShape.getScaledHeight() < 2;

      if (isTinyShape) {
        canvas.remove(activeShape);
      } else {
        activeShape.set({
          selectable: false,
          evented: false,
        });
        activeShape.setCoords();
        saveSnapshotRef.current();
      }

      activeShape = null;
      startPoint = null;
      canvas.requestRenderAll();
    };

    canvas.on("mouse:down", handleMouseDown);
    canvas.on("mouse:move", handleMouseMove);
    canvas.on("mouse:up", handleMouseUp);

    return () => {
      canvas.off("mouse:down", handleMouseDown);
      canvas.off("mouse:move", handleMouseMove);
      canvas.off("mouse:up", handleMouseUp);
    };
  }, [color, size, tool]);

  const deleteSelected = useCallback(() => {
    const canvas = fabricRef.current;
    if (!canvas) {
      return;
    }

    const activeObject = canvas.getActiveObject();
    if (!activeObject) {
      return;
    }

    if (activeObject instanceof ActiveSelection) {
      activeObject.getObjects().forEach((object) => {
        canvas.remove(object);
      });
    } else {
      canvas.remove(activeObject);
    }

    canvas.discardActiveObject();
    canvas.requestRenderAll();
    saveSnapshotRef.current();
  }, []);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const target = event.target;
      const isTypingTarget =
        target instanceof HTMLInputElement ||
        target instanceof HTMLTextAreaElement ||
        (target instanceof HTMLElement && target.isContentEditable);
      const isUndo =
        (event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "z";
      const isRedo =
        (event.metaKey || event.ctrlKey) &&
        (event.key.toLowerCase() === "y" ||
          (event.shiftKey && event.key.toLowerCase() === "z"));
      const isDelete =
        !isTypingTarget &&
        (event.key === "Delete" || event.key === "Backspace");

      if (!isUndo && !isRedo && !isDelete) {
        return;
      }

      event.preventDefault();

      if (isDelete) {
        deleteSelected();
        return;
      }

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
  }, [deleteSelected, history, historyIndex, loadSnapshot, setHistoryIndex]);

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
    canvas.backgroundColor = "#ffffff";
    updateBrushRef.current();
    updateObjectInteractivityRef.current();
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
      deleteSelected,
      zoomIn,
      zoomOut,
      resetZoom,
    }),
    [clear, deleteSelected, redo, resetZoom, undo, zoomIn, zoomOut],
  );
};

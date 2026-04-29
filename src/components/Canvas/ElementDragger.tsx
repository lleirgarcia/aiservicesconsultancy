"use client";

import { ReactNode, useRef, useState, useCallback } from "react";
import { TemplateConfig, TemplateElement } from "@/types/instagram-builder";

type ResizeHandle = "nw" | "n" | "ne" | "w" | "e" | "sw" | "s" | "se";

interface ResizeState {
  handle: ResizeHandle;
  startMouseX: number;
  startMouseY: number;
  startX: number;
  startY: number;
  startWidth: number;
  startHeight: number;
}

interface ElementDraggerProps {
  config: TemplateConfig;
  onElementDrop: (elementId: string, x: number, y: number) => void;
  onElementResize?: (
    elementId: string,
    position: { x: number; y: number },
    size: { width: number; height: number }
  ) => void;
  onTextEdit?: (elementId: string, text: string) => void;
  selectedElementId?: string | null;
  onSelectElement?: (elementId: string | null) => void;
  children: ReactNode;
}

const HANDLE_SIZE = 8;
const HANDLES: ResizeHandle[] = ["nw", "n", "ne", "w", "e", "sw", "s", "se"];

function handleStyle(handle: ResizeHandle): React.CSSProperties {
  const h = HANDLE_SIZE;
  const half = h / 2;
  const mid = `calc(50% - ${half}px)`;
  const end = -half;
  const map: Record<ResizeHandle, React.CSSProperties> = {
    nw: { top: end, left: end, cursor: "nw-resize" },
    n:  { top: end, left: mid, cursor: "n-resize" },
    ne: { top: end, right: end, cursor: "ne-resize" },
    w:  { top: mid, left: end, cursor: "w-resize" },
    e:  { top: mid, right: end, cursor: "e-resize" },
    sw: { bottom: end, left: end, cursor: "sw-resize" },
    s:  { bottom: end, left: mid, cursor: "s-resize" },
    se: { bottom: end, right: end, cursor: "se-resize" },
  };
  return map[handle];
}

export function ElementDragger({
  config,
  onElementDrop,
  onElementResize,
  onTextEdit,
  selectedElementId,
  onSelectElement,
  children,
}: ElementDraggerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [resizeState, setResizeState] = useState<ResizeState | null>(null);
  const [editingTextId, setEditingTextId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState("");

  const getScale = useCallback(() => {
    if (!containerRef.current) return null;
    const canvasRect = containerRef.current.querySelector("canvas")?.getBoundingClientRect();
    if (!canvasRect) return null;
    return {
      toCanvas: { x: 1080 / canvasRect.width, y: 1080 / canvasRect.height },
      toScreen: { x: canvasRect.width / 1080, y: canvasRect.height / 1080 },
      canvasRect,
    };
  }, []);

  const getClosestElement = useCallback(
    (clientX: number, clientY: number): TemplateElement | null => {
      const s = getScale();
      if (!s) return null;
      const cx = (clientX - s.canvasRect.left) * s.toCanvas.x;
      const cy = (clientY - s.canvasRect.top) * s.toCanvas.y;

      let closest: TemplateElement | null = null;
      let minDist = 100;
      for (let i = config.elements.length - 1; i >= 0; i--) {
        const el = config.elements[i];
        const dist = Math.hypot(
          cx - (el.position.x + el.size.width / 2),
          cy - (el.position.y + el.size.height / 2)
        );
        if (dist < minDist) { minDist = dist; closest = el; }
      }
      return closest;
    },
    [config.elements, getScale]
  );

  // Returns element rect relative to container (for absolute-positioned overlays)
  const elementScreenRect = useCallback(
    (elementId: string) => {
      if (!containerRef.current) return null;
      const el = config.elements.find((e) => e.id === elementId);
      if (!el) return null;
      const s = getScale();
      if (!s) return null;
      const containerRect = containerRef.current.getBoundingClientRect();
      return {
        left: el.position.x * s.toScreen.x + (s.canvasRect.left - containerRect.left),
        top: el.position.y * s.toScreen.y + (s.canvasRect.top - containerRect.top),
        width: el.size.width * s.toScreen.x,
        height: el.size.height * s.toScreen.y,
      };
    },
    [config.elements, getScale]
  );

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target.dataset.resizeHandle) return;
      if (target.tagName === "TEXTAREA") return;

      if (editingTextId) {
        setEditingTextId(null);
        return;
      }

      const element = getClosestElement(e.clientX, e.clientY);
      if (!element) {
        onSelectElement?.(null);
        return;
      }

      onSelectElement?.(element.id);

      const s = getScale();
      if (!s) return;
      const cx = (e.clientX - s.canvasRect.left) * s.toCanvas.x;
      const cy = (e.clientY - s.canvasRect.top) * s.toCanvas.y;

      setIsDragging(true);
      setDragOffset({ x: cx - element.position.x, y: cy - element.position.y });
    },
    [config.elements, editingTextId, getClosestElement, getScale, onSelectElement]
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (resizeState && selectedElementId) {
        const s = getScale();
        if (!s) return;
        const dx = (e.clientX - resizeState.startMouseX) * s.toCanvas.x;
        const dy = (e.clientY - resizeState.startMouseY) * s.toCanvas.y;

        let newX = resizeState.startX;
        let newY = resizeState.startY;
        let newW = resizeState.startWidth;
        let newH = resizeState.startHeight;
        const { handle } = resizeState;

        if (handle.includes("e")) newW = Math.max(20, resizeState.startWidth + dx);
        if (handle.includes("s")) newH = Math.max(20, resizeState.startHeight + dy);
        if (handle.includes("w")) {
          newW = Math.max(20, resizeState.startWidth - dx);
          newX = resizeState.startX + (resizeState.startWidth - newW);
        }
        if (handle.includes("n")) {
          newH = Math.max(20, resizeState.startHeight - dy);
          newY = resizeState.startY + (resizeState.startHeight - newH);
        }

        onElementResize?.(selectedElementId, { x: newX, y: newY }, { width: newW, height: newH });
        return;
      }

      if (!isDragging || !selectedElementId) return;
      const s = getScale();
      if (!s) return;
      const cx = (e.clientX - s.canvasRect.left) * s.toCanvas.x;
      const cy = (e.clientY - s.canvasRect.top) * s.toCanvas.y;
      const x = Math.max(0, Math.min(cx - dragOffset.x, 1080 - 50));
      const y = Math.max(0, Math.min(cy - dragOffset.y, 1080 - 50));
      onElementDrop(selectedElementId, x, y);
    },
    [resizeState, isDragging, selectedElementId, dragOffset, getScale, onElementResize, onElementDrop]
  );

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
    setResizeState(null);
  }, []);

  const handleDoubleClick = useCallback(
    (e: React.MouseEvent) => {
      const el = getClosestElement(e.clientX, e.clientY);
      if (!el || el.type !== "text" || !el.content) return;
      setEditingTextId(el.id);
      setEditingText(el.content.text);
      setIsDragging(false);
      setResizeState(null);
    },
    [getClosestElement]
  );

  const handleResizeMouseDown = useCallback(
    (e: React.MouseEvent, handle: ResizeHandle) => {
      if (!selectedElementId) return;
      const el = config.elements.find((e) => e.id === selectedElementId);
      if (!el) return;
      e.preventDefault();
      setResizeState({
        handle,
        startMouseX: e.clientX,
        startMouseY: e.clientY,
        startX: el.position.x,
        startY: el.position.y,
        startWidth: el.size.width,
        startHeight: el.size.height,
      });
    },
    [selectedElementId, config.elements]
  );

  const selectedEl = config.elements.find((e) => e.id === selectedElementId) ?? null;
  const editingEl = editingTextId ? (config.elements.find((e) => e.id === editingTextId) ?? null) : null;
  const selRect = selectedElementId ? elementScreenRect(selectedElementId) : null;
  const editRect = editingTextId ? elementScreenRect(editingTextId) : null;

  const s = getScale();
  const editFontSize =
    editingEl?.content && s
      ? editingEl.content.font_size * s.toScreen.x
      : editingEl?.content?.font_size ?? 16;

  return (
    <div
      ref={containerRef}
      onMouseDownCapture={handleMouseDown}
      onMouseMoveCapture={handleMouseMove}
      onMouseUpCapture={handleMouseUp}
      onMouseLeave={() => { setIsDragging(false); setResizeState(null); }}
      onDoubleClickCapture={handleDoubleClick}
      className={`relative ${resizeState ? "cursor-auto" : isDragging ? "cursor-grabbing" : "cursor-grab"}`}
    >
      {children}

      {/* Selection border + resize handles */}
      {selectedEl && selRect && !editingTextId && (
        <div
          style={{
            position: "absolute",
            left: selRect.left,
            top: selRect.top,
            width: selRect.width,
            height: selRect.height,
            border: "2px solid #89ceff",
            boxSizing: "border-box",
            pointerEvents: "none",
          }}
        >
          {HANDLES.map((h) => (
            <div
              key={h}
              data-resize-handle={h}
              style={{
                position: "absolute",
                width: HANDLE_SIZE,
                height: HANDLE_SIZE,
                background: "#fff",
                border: "2px solid #89ceff",
                borderRadius: 2,
                boxSizing: "border-box",
                pointerEvents: "auto",
                zIndex: 10,
                ...handleStyle(h),
              }}
              onMouseDown={(e) => handleResizeMouseDown(e, h)}
            />
          ))}
        </div>
      )}

      {/* Inline text editing overlay */}
      {editingEl && editRect && editingEl.type === "text" && editingEl.content && (
        <textarea
          style={{
            position: "absolute",
            left: editRect.left,
            top: editRect.top,
            width: editRect.width,
            height: editRect.height,
            fontSize: editFontSize,
            fontFamily: `"${editingEl.content.font_family}", sans-serif`,
            fontWeight: editingEl.content.font_weight,
            color: editingEl.content.color,
            textAlign: editingEl.content.text_align,
            lineHeight: editingEl.content.line_height ?? 1.2,
            background: "rgba(0,0,0,0.45)",
            border: "2px solid #89ceff",
            outline: "none",
            resize: "none",
            padding: 4,
            boxSizing: "border-box",
            zIndex: 20,
          }}
          value={editingText}
          onChange={(e) => {
            setEditingText(e.target.value);
            onTextEdit?.(editingTextId!, e.target.value);
          }}
          onBlur={() => setEditingTextId(null)}
          onKeyDown={(e) => { if (e.key === "Escape") setEditingTextId(null); }}
          autoFocus
        />
      )}
    </div>
  );
}

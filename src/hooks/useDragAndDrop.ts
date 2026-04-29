"use client";

import { useState, useCallback } from "react";

export interface DragState {
  isDragging: boolean;
  draggedElementId: string | null;
  dragOffset: { x: number; y: number };
}

export function useDragAndDrop() {
  const [dragState, setDragState] = useState<DragState>({
    isDragging: false,
    draggedElementId: null,
    dragOffset: { x: 0, y: 0 },
  });

  const handleDragStart = useCallback((e: React.DragEvent<HTMLElement>, elementId: string) => {
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("elementId", elementId);

    setDragState({
      isDragging: true,
      draggedElementId: elementId,
      dragOffset: { x: 0, y: 0 },
    });
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent<HTMLElement>) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLElement>, canvasRect: DOMRect) => {
      e.preventDefault();
      e.stopPropagation();

      const elementId = e.dataTransfer.getData("elementId");
      if (!elementId) return;

      // Calculate position relative to canvas
      const x = e.clientX - canvasRect.left;
      const y = e.clientY - canvasRect.top;

      // Clamp to canvas bounds (allow slight overflow)
      const clampedX = Math.max(0, Math.min(x, canvasRect.width));
      const clampedY = Math.max(0, Math.min(y, canvasRect.height));

      setDragState({
        isDragging: false,
        draggedElementId: null,
        dragOffset: { x: 0, y: 0 },
      });

      return { x: clampedX, y: clampedY };
    },
    []
  );

  const handleDragEnd = useCallback(() => {
    setDragState({
      isDragging: false,
      draggedElementId: null,
      dragOffset: { x: 0, y: 0 },
    });
  }, []);

  return {
    dragState,
    handleDragStart,
    handleDragOver,
    handleDrop,
    handleDragEnd,
  };
}

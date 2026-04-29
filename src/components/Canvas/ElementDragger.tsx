"use client";

import { ReactNode, useRef, useState, useCallback } from "react";
import { TemplateConfig, TemplateElement } from "@/types/instagram-builder";

interface ElementDraggerProps {
  config: TemplateConfig;
  onElementDrop: (elementId: string, x: number, y: number) => void;
  children: ReactNode;
}

export function ElementDragger({ config, onElementDrop, children }: ElementDraggerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [draggedElementId, setDraggedElementId] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  const getElementAtPosition = (x: number, y: number): TemplateElement | null => {
    if (!containerRef.current) return null;

    const rect = containerRef.current.getBoundingClientRect();
    const canvasX = x - rect.left;
    const canvasY = y - rect.top;

    // Scale coordinates to canvas size (1080x1080)
    const canvasRect = containerRef.current.querySelector("canvas")?.getBoundingClientRect();
    if (!canvasRect) return null;

    const scaleX = 1080 / canvasRect.width;
    const scaleY = 1080 / canvasRect.height;

    const scaledX = (x - canvasRect.left) * scaleX;
    const scaledY = (y - canvasRect.top) * scaleY;

    // Find element at position (check in reverse order for z-index)
    for (let i = config.elements.length - 1; i >= 0; i--) {
      const el = config.elements[i];
      if (
        scaledX >= el.position.x &&
        scaledX <= el.position.x + el.size.width &&
        scaledY >= el.position.y &&
        scaledY <= el.position.y + el.size.height
      ) {
        return el;
      }
    }
    return null;
  };

  const handleMouseDown = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const element = getElementAtPosition(e.clientX, e.clientY);
    if (!element) return;

    setIsDragging(true);
    setDraggedElementId(element.id);
    setDragOffset({
      x: e.clientX - element.position.x,
      y: e.clientY - element.position.y,
    });
  }, [config.elements]);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDragging || !draggedElementId || !containerRef.current) return;

    // Visual feedback (optional: could add visual indicator here)
  }, [isDragging, draggedElementId]);

  const handleMouseUp = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDragging || !draggedElementId) {
      setIsDragging(false);
      return;
    }

    const canvasRect = containerRef.current?.querySelector("canvas")?.getBoundingClientRect();
    if (!canvasRect) return;

    // Calculate new position in canvas coordinates
    const scaleX = 1080 / canvasRect.width;
    const scaleY = 1080 / canvasRect.height;

    const newX = (e.clientX - canvasRect.left) * scaleX - dragOffset.x;
    const newY = (e.clientY - canvasRect.top) * scaleY - dragOffset.y;

    // Clamp to canvas bounds
    const clampedX = Math.max(0, Math.min(newX, 1080 - 50));
    const clampedY = Math.max(0, Math.min(newY, 1080 - 50));

    onElementDrop(draggedElementId, clampedX, clampedY);

    setIsDragging(false);
    setDraggedElementId(null);
  }, [isDragging, draggedElementId, dragOffset, onElementDrop]);

  return (
    <div
      ref={containerRef}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={() => setIsDragging(false)}
      className={`relative ${isDragging ? "cursor-grabbing" : "cursor-grab"}`}
    >
      {children}
    </div>
  );
}

"use client";

import { ReactNode, useRef, useState, useCallback } from "react";
import { TemplateConfig, TemplateElement } from "@/types/instagram-builder";

interface ElementDraggerProps {
  config: TemplateConfig;
  onElementDrop: (elementId: string, x: number, y: number) => void;
  onElementDragging?: (elementId: string, x: number, y: number) => void;
  children: ReactNode;
}

export function ElementDragger({ config, onElementDrop, children }: ElementDraggerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [draggedElementId, setDraggedElementId] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  const getElementAtPosition = (x: number, y: number): TemplateElement | null => {
    if (!containerRef.current) return null;

    const canvasRect = containerRef.current.querySelector("canvas")?.getBoundingClientRect();
    if (!canvasRect) return null;

    // Verificar si el click está dentro del canvas
    if (x < canvasRect.left || x > canvasRect.right || y < canvasRect.top || y > canvasRect.bottom) {
      return null;
    }

    // Scale coordinates to canvas size (1080x1080)
    const scaleX = 1080 / canvasRect.width;
    const scaleY = 1080 / canvasRect.height;

    const scaledX = (x - canvasRect.left) * scaleX;
    const scaledY = (y - canvasRect.top) * scaleY;

    // Find element at position (check in reverse order for z-index)
    for (let i = config.elements.length - 1; i >= 0; i--) {
      const el = config.elements[i];
      const tolerance = 10; // Add tolerance for easier selection
      if (
        scaledX >= el.position.x - tolerance &&
        scaledX <= el.position.x + el.size.width + tolerance &&
        scaledY >= el.position.y - tolerance &&
        scaledY <= el.position.y + el.size.height + tolerance
      ) {
        return el;
      }
    }
    return null;
  };

  const handleMouseDown = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const element = getElementAtPosition(e.clientX, e.clientY);
    if (!element || !containerRef.current) return;

    const canvasRect = containerRef.current.querySelector("canvas")?.getBoundingClientRect();
    if (!canvasRect) return;

    // Calculate scaled coordinates
    const scaleX = 1080 / canvasRect.width;
    const scaleY = 1080 / canvasRect.height;

    const scaledX = (e.clientX - canvasRect.left) * scaleX;
    const scaledY = (e.clientY - canvasRect.top) * scaleY;

    setIsDragging(true);
    setDraggedElementId(element.id);
    setDragOffset({
      x: scaledX - element.position.x,
      y: scaledY - element.position.y,
    });
  }, [config.elements]);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDragging || !draggedElementId || !containerRef.current) return;

    const canvasRect = containerRef.current.querySelector("canvas")?.getBoundingClientRect();
    if (!canvasRect) return;

    // Calculate scaled coordinates
    const scaleX = 1080 / canvasRect.width;
    const scaleY = 1080 / canvasRect.height;

    const scaledX = (e.clientX - canvasRect.left) * scaleX;
    const scaledY = (e.clientY - canvasRect.top) * scaleY;

    // Calculate current position (subtract the offset)
    const currentX = scaledX - dragOffset.x;
    const currentY = scaledY - dragOffset.y;

    // Clamp to canvas bounds
    const clampedX = Math.max(0, Math.min(currentX, 1080 - 50));
    const clampedY = Math.max(0, Math.min(currentY, 1080 - 50));

    // Update position in real-time
    onElementDrop?.(draggedElementId, clampedX, clampedY);
  }, [isDragging, draggedElementId, dragOffset, onElementDrop]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
    setDraggedElementId(null);
  }, []);

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

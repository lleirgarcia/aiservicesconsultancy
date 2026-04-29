"use client";

import { ReactNode, useRef, useState, useCallback } from "react";
import { TemplateConfig, TemplateElement } from "@/types/instagram-builder";

interface ElementDraggerProps {
  config: TemplateConfig;
  onElementDrop: (elementId: string, x: number, y: number) => void;
  selectedElementId?: string | null;
  onSelectElement?: (elementId: string | null) => void;
  children: ReactNode;
}

export function ElementDragger({
  config,
  onElementDrop,
  selectedElementId,
  onSelectElement,
  children,
}: ElementDraggerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  const getClosestElement = (x: number, y: number): TemplateElement | null => {
    if (!containerRef.current) return null;

    const canvasRect = containerRef.current.querySelector("canvas")?.getBoundingClientRect();
    if (!canvasRect) return null;

    // Scale coordinates to canvas size (1080x1080)
    const scaleX = 1080 / canvasRect.width;
    const scaleY = 1080 / canvasRect.height;

    const scaledX = (x - canvasRect.left) * scaleX;
    const scaledY = (y - canvasRect.top) * scaleY;

    let closest: TemplateElement | null = null;
    let minDistance = 100; // Max distance to be considered "close"

    // Find closest element (check in reverse order for z-index)
    for (let i = config.elements.length - 1; i >= 0; i--) {
      const el = config.elements[i];
      const centerX = el.position.x + el.size.width / 2;
      const centerY = el.position.y + el.size.height / 2;

      const distance = Math.sqrt(Math.pow(scaledX - centerX, 2) + Math.pow(scaledY - centerY, 2));

      if (distance < minDistance) {
        minDistance = distance;
        closest = el;
      }
    }

    return closest;
  };

  const handleMouseDown = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      const element = getClosestElement(e.clientX, e.clientY);
      if (!element || !containerRef.current) return;

      // Select the element
      onSelectElement?.(element.id);

      const canvasRect = containerRef.current.querySelector("canvas")?.getBoundingClientRect();
      if (!canvasRect) return;

      // Calculate scaled coordinates
      const scaleX = 1080 / canvasRect.width;
      const scaleY = 1080 / canvasRect.height;

      const scaledX = (e.clientX - canvasRect.left) * scaleX;
      const scaledY = (e.clientY - canvasRect.top) * scaleY;

      setIsDragging(true);
      setDragOffset({
        x: scaledX - element.position.x,
        y: scaledY - element.position.y,
      });
    },
    [config.elements, onSelectElement]
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (!isDragging || !selectedElementId || !containerRef.current) return;

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
      onElementDrop(selectedElementId, clampedX, clampedY);
    },
    [isDragging, selectedElementId, dragOffset, onElementDrop]
  );

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
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

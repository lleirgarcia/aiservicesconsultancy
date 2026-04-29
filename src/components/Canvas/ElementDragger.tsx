"use client";

import { ReactNode, useCallback, useState } from "react";
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
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [canvasRect, setCanvasRect] = useState<DOMRect | null>(null);

  const getClosestElement = useCallback(
    (clientX: number, clientY: number): TemplateElement | null => {
      if (!canvasRect) return null;

      // Scale coordinates to canvas size (1080x1080)
      const scaleX = 1080 / canvasRect.width;
      const scaleY = 1080 / canvasRect.height;

      const scaledX = (clientX - canvasRect.left) * scaleX;
      const scaledY = (clientY - canvasRect.top) * scaleY;

      let closest: TemplateElement | null = null;
      let minDistance = 150; // Max distance to be considered "close"

      // Find closest element
      for (let i = config.elements.length - 1; i >= 0; i--) {
        const el = config.elements[i];
        const centerX = el.position.x + el.size.width / 2;
        const centerY = el.position.y + el.size.height / 2;

        const distance = Math.sqrt(
          Math.pow(scaledX - centerX, 2) + Math.pow(scaledY - centerY, 2)
        );

        if (distance < minDistance) {
          minDistance = distance;
          closest = el;
        }
      }

      return closest;
    },
    [canvasRect, config.elements]
  );

  const handleMouseDown = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      const canvas = e.currentTarget;
      const rect = canvas.getBoundingClientRect();
      setCanvasRect(rect);

      const element = getClosestElement(e.clientX, e.clientY);
      if (!element) return;

      // Select the element
      onSelectElement?.(element.id);

      // Calculate scaled coordinates
      const scaleX = 1080 / rect.width;
      const scaleY = 1080 / rect.height;

      const scaledX = (e.clientX - rect.left) * scaleX;
      const scaledY = (e.clientY - rect.top) * scaleY;

      setIsDragging(true);
      setDragOffset({
        x: scaledX - element.position.x,
        y: scaledY - element.position.y,
      });
    },
    [getClosestElement, onSelectElement]
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      if (!isDragging || !selectedElementId || !canvasRect) return;

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
    [isDragging, selectedElementId, canvasRect, dragOffset, onElementDrop]
  );

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleMouseLeave = useCallback(() => {
    setIsDragging(false);
  }, []);

  // Clone children and pass mouse handlers to TemplateCanvas
  return (
    <div className={`relative ${isDragging ? "cursor-grabbing" : "cursor-grab"}`}>
      {children &&
        typeof children === "object" &&
        "type" in children &&
        children.type.name === "TemplateCanvas"
        ? // Render with mouse handlers
          (
            <>
              {/* We'll pass handlers via context or props */}
              {children}
            </>
          )
        : children}
    </div>
  );
}

// Export handlers for use in InstagramPostBuilder
export function useElementDraggerHandlers() {
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [canvasRect, setCanvasRect] = useState<DOMRect | null>(null);

  return {
    isDragging,
    dragOffset,
    canvasRect,
    setCanvasRect,
    setDragOffset,
    setIsDragging,
  };
}

"use client";

import { ReactNode, useRef, useState } from "react";
import { useDragAndDrop } from "@/hooks/useDragAndDrop";
import { TemplateConfig } from "@/types/instagram-builder";

interface ElementDraggerProps {
  config: TemplateConfig;
  onElementDrop: (elementId: string, x: number, y: number) => void;
  children: ReactNode;
}

export function ElementDragger({ config, onElementDrop, children }: ElementDraggerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const { dragState, handleDragOver, handleDrop, handleDragEnd } = useDragAndDrop();
  const [isDraggingLocal, setIsDraggingLocal] = useState(false);

  const handleDragOverLocal = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    handleDragOver(e);
    setIsDraggingLocal(true);
  };

  const handleDropLocal = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();

    if (!containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const result = handleDrop(e, rect);

    if (result) {
      const elementId = e.dataTransfer.getData("elementId");
      onElementDrop(elementId, result.x, result.y);
    }

    setIsDraggingLocal(false);
  };

  const handleDragLeave = () => {
    setIsDraggingLocal(false);
  };

  const handleDragEndLocal = () => {
    handleDragEnd();
    setIsDraggingLocal(false);
  };

  return (
    <div
      ref={containerRef}
      onDragOver={handleDragOverLocal}
      onDrop={handleDropLocal}
      onDragLeave={handleDragLeave}
      onDragEnd={handleDragEndLocal}
      className={`relative ${isDraggingLocal ? "bg-[var(--accent-dim)]" : ""}`}
    >
      {children}
    </div>
  );
}

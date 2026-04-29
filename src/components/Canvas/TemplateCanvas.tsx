"use client";

import { useRef, useEffect, useCallback } from "react";
import { TemplateConfig } from "@/types/instagram-builder";
import { renderTemplateToCanvas } from "@/services/canvasRenderer";

interface TemplateCanvasProps {
  config: TemplateConfig;
  onCanvasReady?: (canvas: HTMLCanvasElement) => void;
  isDragging?: boolean;
}

export function TemplateCanvas({ config, onCanvasReady, isDragging }: TemplateCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    try {
      renderTemplateToCanvas(canvas, config);
      onCanvasReady?.(canvas);
    } catch (error) {
      console.error("Failed to render canvas:", error);
    }
  }, [config, onCanvasReady]);

  return (
    <div className="relative flex items-center justify-center bg-[var(--bg-section)] rounded-lg overflow-hidden border border-[var(--border)]">
      <canvas
        ref={canvasRef}
        width={1080}
        height={1080}
        className={`max-w-full max-h-[600px] cursor-${isDragging ? "grabbing" : "grab"}`}
        style={{
          aspectRatio: "1 / 1",
          imageRendering: "pixelated",
        }}
      />
    </div>
  );
}

"use client";

import { useRef, useEffect } from "react";
import { TemplateConfig } from "@/types/instagram-builder";
import { renderTemplateToCanvas } from "@/services/canvasRenderer";

interface PreviewProps {
  config: TemplateConfig;
  label?: string;
}

export function Preview({ config, label = "Preview" }: PreviewProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    try {
      renderTemplateToCanvas(canvas, config);
    } catch (error) {
      console.error("Failed to render preview:", error);
    }
  }, [config]);

  return (
    <div className="flex flex-col gap-2">
      <p className="text-sm font-medium text-[var(--fg)]">{label}</p>
      <div className="bg-[var(--bg-section)] rounded-lg border border-[var(--border)] p-4 overflow-auto">
        <canvas
          ref={canvasRef}
          width={1080}
          height={1080}
          className="w-full h-auto rounded"
          style={{
            maxWidth: "300px",
            maxHeight: "300px",
          }}
        />
      </div>
    </div>
  );
}

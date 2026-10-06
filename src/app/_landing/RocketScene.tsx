"use client";

import { useEffect, useRef } from "react";

type DrawingHandle = {
  setProgress: (p: number) => void;
  dispose: () => void;
};

/**
 * Cohete dibujado a mano sobre papel: trazos, sombras y color se revelan a
 * medida que `local` avanza de 0 a 1. El módulo (y la imagen) viven en
 * /public/cohete-scroll, cargados como módulo ES nativo del navegador para
 * no pasar por el bundler de Next.
 */
export default function RocketScene({ local }: { local: number }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const drawingRef = useRef<DrawingHandle | null>(null);
  const localRef = useRef(local);
  localRef.current = local;

  useEffect(() => {
    const el = canvasRef.current;
    if (!el) return;
    let cancelled = false;

    // Ruta como variable (no literal): así TypeScript no intenta resolverla como módulo del proyecto,
    // y el bundler la deja pasar como un import ES nativo en runtime hacia el archivo público.
    const drawingModuleUrl = "/cohete-scroll/drawing.js";
    import(/* webpackIgnore: true */ drawingModuleUrl)
      .then((mod: { createDrawing: (canvas: HTMLCanvasElement, src: string) => DrawingHandle }) => {
        if (cancelled || !canvasRef.current) return;
        const drawing = mod.createDrawing(canvasRef.current, "/cohete-scroll/cohete.png");
        drawing.setProgress(localRef.current);
        drawingRef.current = drawing;
      })
      .catch(() => {
        /* Módulo no disponible: el lienzo se queda en blanco, sin romper la escena. */
      });

    return () => {
      cancelled = true;
      drawingRef.current?.dispose();
      drawingRef.current = null;
    };
  }, []);

  useEffect(() => {
    drawingRef.current?.setProgress(local);
  }, [local]);

  return (
    <canvas
      ref={canvasRef}
      role="img"
      aria-label="Cohete que se dibuja a medida que avanzas"
      style={{ display: "block", width: "100%", height: "100%", objectFit: "cover" }}
    />
  );
}

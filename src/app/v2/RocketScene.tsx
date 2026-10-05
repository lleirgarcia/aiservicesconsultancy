"use client";

import { useEffect, useRef } from "react";

type RocketHandle = {
  setSeparation: (percent: number) => void;
  play: () => void;
  pause: () => void;
  setDetail: (enabled: boolean) => void;
  setAutoRotate: (enabled: boolean) => void;
  resetCamera: () => void;
  dispose: () => void;
};

/**
 * Cohete 3D (Three.js) que se ensambla al hacer scroll: empieza despiezado
 * (separación 100, mostrando el detalle de las piezas) y se arma hasta
 * quedar completo (separación 0) a medida que `local` avanza de 0 a 1.
 * El paquete vive en /public/cohete (rocket.js + vendor/three), cargado como
 * módulo ES nativo del navegador para no pasar por el bundler de Next.
 */
export default function RocketScene({ local }: { local: number }) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const rocketRef = useRef<RocketHandle | null>(null);
  const localRef = useRef(local);
  localRef.current = local;

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    let cancelled = false;

    // Ruta como variable (no literal): así TypeScript no intenta resolverla como módulo del proyecto,
    // y el bundler la deja pasar como un import ES nativo en runtime hacia el archivo público.
    const rocketModuleUrl = "/cohete/rocket.js";
    import(/* webpackIgnore: true */ rocketModuleUrl)
      .then((mod: { createRocket: (el: HTMLElement, opts?: Record<string, unknown>) => RocketHandle }) => {
        if (cancelled || !containerRef.current) return;
        const rocket = mod.createRocket(containerRef.current, { autoPlay: false, autoRotate: true, detail: true });
        rocket.setSeparation(Math.round((1 - localRef.current) * 100));
        rocketRef.current = rocket;
      })
      .catch(() => {
        /* WebGL o el módulo no disponible: el contenedor se queda vacío, sin romper la escena. */
      });

    return () => {
      cancelled = true;
      rocketRef.current?.dispose();
      rocketRef.current = null;
    };
  }, []);

  useEffect(() => {
    rocketRef.current?.setSeparation(Math.round((1 - local) * 100));
  }, [local]);

  return (
    <div
      ref={containerRef}
      aria-label="Cohete 3D que se ensambla a medida que avanzas"
      style={{ width: "100%", height: "100%", minHeight: 280 }}
    />
  );
}

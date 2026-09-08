/** Tipos del campo de estrellas (el motor vive en universe.js, sin tocar). */
export type UniverseOptions = {
  count?: number;
  mode?: "scroll" | "time";
  /** "paper": cielo blanco y estrellas de tinta que se oscurecen al bajar. */
  theme?: "paper";
  /** Avance (0→1) a partir del cual empiezan a verse las estrellas. */
  inkStart?: number;
  duration?: number;
  onProgress?: (night: number) => void;
};

export type UniverseHandle = {
  pause(value?: boolean): void;
  restart(): void;
  setProgress(value: number): void;
  readonly paused: boolean;
  destroy(): void;
};

export function createUniverse(
  canvas: HTMLCanvasElement,
  options?: UniverseOptions
): UniverseHandle;

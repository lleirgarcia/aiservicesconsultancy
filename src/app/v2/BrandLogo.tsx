"use client";

/** El PNG del logotipo ya tiene transparencia: no necesita fusión ni chip. */
export default function BrandLogo({ height, ratio }: { height: number; ratio: number }) {
  const width = Math.round(height * ratio);
  return (
    /* eslint-disable-next-line @next/next/no-img-element */
    <img
      src="/kroomix-logo-day.png"
      alt="Kroomix.com"
      width={width}
      height={height}
      style={{ width, height, display: "block" }}
    />
  );
}

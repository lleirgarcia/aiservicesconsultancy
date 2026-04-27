import Image from "next/image";

type LogoProps = {
  size?: number;
  className?: string;
};

export default function Logo({ size, className }: LogoProps) {
  const height = size ?? 200;
  const hasFixedSize = size !== undefined;

  return (
    <Image
      src="/kroomix-logo.png"
      alt="Kroomix.com"
      width={Math.round(height * 1.5)}
      height={height}
      className={hasFixedSize ? (className ?? "").trim() : `${className ?? ""} h-[90px] sm:h-[200px]`.trim()}
      style={{
        width: "auto",
        display: "block",
        mixBlendMode: "screen",
        ...(hasFixedSize ? { height: `${height}px` } : {}),
      }}
      priority
    />
  );
}

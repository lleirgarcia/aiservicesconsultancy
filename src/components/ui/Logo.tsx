import Image from "next/image";

type LogoProps = {
  size?: number;
  className?: string;
};

export default function Logo({ size, className }: LogoProps) {
  const height = size ?? 200;

  return (
    <Image
      src="/kroomix-logo.png"
      alt="Kroomix.com"
      width={height * 4}
      height={height}
      className={`${className ?? ""} h-[90px] sm:h-[200px]`.trim()}
      style={{ width: "auto", display: "block", mixBlendMode: "screen", marginTop: "7px", marginBottom: "9px" }}
      priority
    />
  );
}

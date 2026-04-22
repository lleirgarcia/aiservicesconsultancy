import { ButtonHTMLAttributes } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "ghost";
}

export default function Button({
  variant = "primary",
  className = "",
  children,
  ...props
}: ButtonProps) {
  const base =
    "inline-flex items-center justify-center gap-2 text-sm font-medium cursor-pointer transition-opacity disabled:opacity-40 focus-visible:outline-[2px] focus-visible:outline-offset-2 focus-visible:outline-[#111]";

  const variants = {
    primary:
      "bg-[#111] text-white px-5 py-2.5 rounded hover:opacity-80",
    ghost:
      "text-[#111] underline underline-offset-4 px-0 py-0 hover:opacity-60",
  };

  return (
    <button className={`${base} ${variants[variant]} ${className}`} {...props}>
      {children}
    </button>
  );
}

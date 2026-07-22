"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function BackToDemos() {
  const pathname = usePathname();
  if (pathname === "/demos") return null;
  return (
    <Link
      href="/demos"
      className="text-xs font-medium uppercase tracking-widest"
      style={{ color: "var(--muted)" }}
    >
      ← Demos
    </Link>
  );
}

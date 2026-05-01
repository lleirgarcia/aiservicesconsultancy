import type { Metadata } from "next";
import { StockOmnicanal } from "./StockOmnicanal";

export const metadata: Metadata = {
  title: "Demo · Stock omnicanal en tiempo real — Kroomix",
  description: "TPV de tienda física y tienda online sincronizados al instante.",
  robots: { index: false, follow: false },
};

export default function Page() {
  return <StockOmnicanal />;
}

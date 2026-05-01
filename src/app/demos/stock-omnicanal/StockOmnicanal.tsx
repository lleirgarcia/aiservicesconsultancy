"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { PRODUCTOS_INICIAL, type CanalVenta, type Producto } from "./data";

interface VentaRegistro {
  id: string;
  canal: CanalVenta;
  sku: string;
  nombre: string;
  cantidad: number;
  importe: number;
  registradaEn: string;
}

interface AlertaStock {
  id: string;
  sku: string;
  nombre: string;
  stockActual: number;
  minimo: number;
  generadaEn: string;
}

const cardBase: React.CSSProperties = {
  background: "var(--bg-soft)",
  border: "1px solid var(--border)",
};

function formatoEuro(v: number) {
  return new Intl.NumberFormat("es-ES", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(v);
}

let nextVentaId = 1;
let nextAlertaId = 1;

export function StockOmnicanal() {
  const [productos, setProductos] = useState<Producto[]>(PRODUCTOS_INICIAL);
  const [stockTienda, setStockTienda] = useState<Record<string, number>>(() =>
    Object.fromEntries(PRODUCTOS_INICIAL.map((p) => [p.sku, p.stockInicial])),
  );
  const [stockOnline, setStockOnline] = useState<Record<string, number>>(() =>
    Object.fromEntries(PRODUCTOS_INICIAL.map((p) => [p.sku, p.stockInicial])),
  );
  const [ventas, setVentas] = useState<VentaRegistro[]>([]);
  const [alertas, setAlertas] = useState<AlertaStock[]>([]);
  const [autoOnline, setAutoOnline] = useState(false);
  const ultimoFlash = useRef<{ sku: string; canal: CanalVenta; ts: number } | null>(null);
  const [flashKey, setFlashKey] = useState(0);

  const stockCentral = useMemo(() => {
    const out: Record<string, number> = {};
    for (const p of productos) {
      out[p.sku] = (stockTienda[p.sku] ?? 0) + (stockOnline[p.sku] ?? 0);
    }
    return out;
  }, [productos, stockTienda, stockOnline]);

  const registrarVenta = (sku: string, canal: CanalVenta) => {
    const producto = productos.find((p) => p.sku === sku);
    if (!producto) return;
    const setStock = canal === "tienda" ? setStockTienda : setStockOnline;
    let nuevoStock = -1;
    setStock((prev) => {
      if ((prev[sku] ?? 0) <= 0) return prev;
      const nuevo = prev[sku] - 1;
      nuevoStock = nuevo;
      return { ...prev, [sku]: nuevo };
    });
    if (nuevoStock < 0) return;

    setVentas((prev) =>
      [
        {
          id: `v-${nextVentaId++}`,
          canal,
          sku,
          nombre: producto.nombre,
          cantidad: 1,
          importe: producto.precio,
          registradaEn: new Date().toISOString(),
        },
        ...prev,
      ].slice(0, 30),
    );

    ultimoFlash.current = { sku, canal, ts: Date.now() };
    setFlashKey((k) => k + 1);

    const stockTotalActual = (stockTienda[sku] ?? 0) + (stockOnline[sku] ?? 0) - 1;
    if (stockTotalActual <= producto.stockMinimo) {
      setAlertas((prev) => {
        if (prev.some((a) => a.sku === sku)) return prev;
        return [
          {
            id: `a-${nextAlertaId++}`,
            sku,
            nombre: producto.nombre,
            stockActual: stockTotalActual,
            minimo: producto.stockMinimo,
            generadaEn: new Date().toISOString(),
          },
          ...prev,
        ];
      });
    }
  };

  // Simulación automática del canal online
  useEffect(() => {
    if (!autoOnline) return;
    const id = setInterval(() => {
      const candidatos = productos.filter((p) => (stockOnline[p.sku] ?? 0) > 0);
      if (candidatos.length === 0) return;
      const elegido = candidatos[Math.floor(Math.random() * candidatos.length)];
      registrarVenta(elegido.sku, "online");
    }, 1800);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoOnline, stockOnline, productos]);

  const reiniciar = () => {
    setStockTienda(Object.fromEntries(PRODUCTOS_INICIAL.map((p) => [p.sku, p.stockInicial])));
    setStockOnline(Object.fromEntries(PRODUCTOS_INICIAL.map((p) => [p.sku, p.stockInicial])));
    setVentas([]);
    setAlertas([]);
    setAutoOnline(false);
  };

  const stats = useMemo(() => {
    const ingresoTotal = ventas.reduce((a, v) => a + v.importe, 0);
    const ventasTienda = ventas.filter((v) => v.canal === "tienda").length;
    const ventasOnline = ventas.filter((v) => v.canal === "online").length;
    return { ingresoTotal, ventasTienda, ventasOnline, alertasActivas: alertas.length };
  }, [ventas, alertas]);

  return (
    <div className="px-5 sm:px-8 py-8 max-w-7xl mx-auto">
      <header className="mb-8">
        <div className="label-accent mb-3">
          <span className="text-xs font-medium uppercase tracking-widest">
            Demo · Stock omnicanal en tiempo real
          </span>
        </div>
        <h1
          className="font-headline text-2xl sm:text-3xl"
          style={{ color: "var(--fg)", letterSpacing: "-0.02em" }}
        >
          Tienda y tienda online comparten stock al instante.
        </h1>
        <p className="text-sm mt-2 max-w-3xl" style={{ color: "var(--muted)" }}>
          Cada venta — sea en TPV o en la web — descuenta del stock central inmediatamente. Cuando
          una referencia baja del mínimo, salta una alerta automática para reponer.
        </p>
      </header>

      <div className="flex flex-wrap items-center gap-3 mb-4 p-3" style={cardBase}>
        <button
          onClick={() => setAutoOnline((v) => !v)}
          className="text-xs uppercase tracking-widest px-3 py-2"
          style={{
            border: "1px solid var(--accent)",
            background: autoOnline ? "var(--accent-dim)" : "transparent",
            color: autoOnline ? "var(--accent)" : "var(--muted-hi)",
            cursor: "pointer",
            fontWeight: 600,
          }}
        >
          {autoOnline ? "■ Detener tráfico online" : "▶ Simular tráfico online"}
        </button>
        <button
          onClick={reiniciar}
          className="text-[10px] uppercase tracking-widest px-3 py-2"
          style={{
            border: "1px solid var(--border)",
            background: "transparent",
            color: "var(--muted-hi)",
            cursor: "pointer",
          }}
        >
          ↺ Reiniciar
        </button>
        <div style={{ flex: 1 }} />
        <Stat label="TPV tienda" valor={String(stats.ventasTienda)} />
        <Stat label="Tienda online" valor={String(stats.ventasOnline)} />
        <Stat label="Ingreso" valor={formatoEuro(stats.ingresoTotal)} acento mono />
        <Stat label="Alertas" valor={String(stats.alertasActivas)} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
        <PanelCanal
          titulo="TPV tienda física"
          subtitulo="Vic — Plaça Major"
          productos={productos}
          stock={stockTienda}
          stockCentral={stockCentral}
          stockOtroCanal={stockOnline}
          tipoOtroCanal="online"
          ultimoFlash={ultimoFlash.current}
          flashKey={flashKey}
          onVenta={(sku) => registrarVenta(sku, "tienda")}
          canal="tienda"
        />
        <PanelCanal
          titulo="Tienda online"
          subtitulo="kroomix-demo.shop"
          productos={productos}
          stock={stockOnline}
          stockCentral={stockCentral}
          stockOtroCanal={stockTienda}
          tipoOtroCanal="tienda"
          ultimoFlash={ultimoFlash.current}
          flashKey={flashKey}
          onVenta={(sku) => registrarVenta(sku, "online")}
          canal="online"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_minmax(0,360px)] gap-4">
        <section style={cardBase} className="flex flex-col min-h-0">
          <Encabezado titulo="Log de ventas" sub={`${ventas.length} últimas`} />
          <div style={{ padding: 14, maxHeight: 320, overflowY: "auto" }}>
            {ventas.length === 0 ? (
              <div
                style={{
                  padding: 16,
                  textAlign: "center",
                  fontSize: 12,
                  color: "var(--muted)",
                  border: "1px dashed var(--border)",
                  background: "var(--bg)",
                }}
              >
                Sin ventas todavía. Pulsa «Vender» en cualquier producto.
              </div>
            ) : (
              <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
                {ventas.map((v) => (
                  <li
                    key={v.id}
                    style={{
                      padding: "8px 0",
                      borderBottom: "1px solid var(--border)",
                      display: "flex",
                      alignItems: "center",
                      gap: 12,
                      fontSize: 11.5,
                    }}
                  >
                    <span
                      className="text-[9.5px] uppercase tracking-widest"
                      style={{
                        color: "var(--accent)",
                        fontWeight: 600,
                        width: 60,
                        flexShrink: 0,
                      }}
                    >
                      {v.canal === "tienda" ? "● TPV" : "◐ Online"}
                    </span>
                    <span
                      style={{
                        fontFamily: "var(--font-geist-mono)",
                        color: "var(--muted-hi)",
                        fontSize: 10.5,
                        width: 90,
                        flexShrink: 0,
                      }}
                    >
                      {v.sku}
                    </span>
                    <span
                      style={{ color: "var(--fg)", flex: 1, minWidth: 0 }}
                      className="truncate"
                    >
                      {v.nombre}
                    </span>
                    <span
                      style={{
                        fontFamily: "var(--font-geist-mono)",
                        color: "var(--accent)",
                        fontWeight: 600,
                        flexShrink: 0,
                      }}
                    >
                      {formatoEuro(v.importe)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>

        <section style={cardBase} className="flex flex-col min-h-0">
          <Encabezado
            titulo="Alertas de reposición"
            sub={alertas.length === 0 ? "Sin alertas" : `${alertas.length} activas`}
          />
          <div style={{ padding: 14, maxHeight: 320, overflowY: "auto" }}>
            {alertas.length === 0 ? (
              <div
                style={{
                  padding: 16,
                  textAlign: "center",
                  fontSize: 12,
                  color: "var(--muted)",
                  border: "1px dashed var(--border)",
                  background: "var(--bg)",
                }}
              >
                Stock por encima de mínimos.
              </div>
            ) : (
              <ul style={{ listStyle: "none", padding: 0, margin: 0 }} className="space-y-2">
                {alertas.map((a) => (
                  <li
                    key={a.id}
                    style={{
                      padding: 10,
                      background: "var(--bg)",
                      borderLeft: "2px solid var(--accent)",
                    }}
                  >
                    <div
                      className="text-[10px] font-medium uppercase tracking-widest"
                      style={{ color: "var(--accent)", marginBottom: 2 }}
                    >
                      ⚠ Stock bajo · {a.sku}
                    </div>
                    <div style={{ fontSize: 11.5, color: "var(--muted-hi)", lineHeight: 1.4 }}>
                      {a.nombre}
                    </div>
                    <div className="text-[10px] mt-1" style={{ color: "var(--muted)" }}>
                      Stock actual {a.stockActual} · mínimo {a.minimo} · email enviado a compras
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>
      </div>

      <CTAKroomix />
    </div>
  );
}

function Stat({
  label,
  valor,
  acento,
  mono,
}: {
  label: string;
  valor: string;
  acento?: boolean;
  mono?: boolean;
}) {
  return (
    <div className="flex flex-col items-end">
      <span
        className="text-[9.5px] font-medium uppercase tracking-widest"
        style={{ color: "var(--muted)" }}
      >
        {label}
      </span>
      <span
        style={{
          fontFamily: mono ? "var(--font-geist-mono)" : "inherit",
          fontSize: 14,
          fontWeight: 700,
          color: acento ? "var(--accent)" : "var(--fg)",
        }}
      >
        {valor}
      </span>
    </div>
  );
}

function Encabezado({ titulo, sub }: { titulo: string; sub?: string }) {
  return (
    <div
      style={{
        padding: "14px 16px",
        borderBottom: "1px solid var(--border)",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
      }}
    >
      <span
        className="text-xs font-medium uppercase tracking-widest"
        style={{ color: "var(--fg)" }}
      >
        {titulo}
      </span>
      {sub && (
        <span className="text-[10px] uppercase tracking-widest" style={{ color: "var(--muted)" }}>
          {sub}
        </span>
      )}
    </div>
  );
}

function PanelCanal({
  titulo,
  subtitulo,
  productos,
  stock,
  stockCentral,
  stockOtroCanal,
  tipoOtroCanal,
  ultimoFlash,
  flashKey,
  onVenta,
  canal,
}: {
  titulo: string;
  subtitulo: string;
  productos: Producto[];
  stock: Record<string, number>;
  stockCentral: Record<string, number>;
  stockOtroCanal: Record<string, number>;
  tipoOtroCanal: CanalVenta;
  ultimoFlash: { sku: string; canal: CanalVenta; ts: number } | null;
  flashKey: number;
  onVenta: (sku: string) => void;
  canal: CanalVenta;
}) {
  return (
    <section style={cardBase} className="flex flex-col min-h-0">
      <div
        style={{
          padding: "14px 16px",
          borderBottom: "1px solid var(--border)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <div>
          <div
            className="text-xs font-medium uppercase tracking-widest"
            style={{ color: "var(--fg)" }}
          >
            {titulo}
          </div>
          <div className="text-[10px]" style={{ color: "var(--muted)" }}>
            {subtitulo}
          </div>
        </div>
        <span
          className="text-[10px] uppercase tracking-widest"
          style={{ color: "var(--accent)" }}
        >
          {canal === "tienda" ? "● TPV" : "◐ Web"}
        </span>
      </div>
      <div style={{ padding: 14, maxHeight: 460, overflowY: "auto" }}>
        <ul style={{ listStyle: "none", padding: 0, margin: 0 }} className="space-y-2">
          {productos.map((p) => {
            const stockCanal = stock[p.sku] ?? 0;
            const stockTotal = stockCentral[p.sku] ?? 0;
            const stockOtro = stockOtroCanal[p.sku] ?? 0;
            const sinStock = stockCanal <= 0;
            const stockBajoTotal = stockTotal <= p.stockMinimo;
            const flashing =
              ultimoFlash?.sku === p.sku && Date.now() - ultimoFlash.ts < 1100;
            return (
              <li
                key={p.sku + flashKey}
                style={{
                  padding: 10,
                  background: "var(--bg)",
                  border: flashing ? "1px solid var(--accent)" : "1px solid var(--border)",
                  display: "grid",
                  gridTemplateColumns: "1fr auto",
                  gap: 10,
                  alignItems: "center",
                  transition: "border-color 0.6s",
                }}
              >
                <div style={{ minWidth: 0 }}>
                  <div
                    style={{
                      fontFamily: "var(--font-geist-mono)",
                      fontSize: 10,
                      color: "var(--muted)",
                    }}
                  >
                    {p.sku}
                  </div>
                  <div style={{ fontSize: 12, color: "var(--fg)", fontWeight: 500, lineHeight: 1.3 }}>
                    {p.nombre}
                  </div>
                  <div className="text-[10px] mt-1" style={{ color: "var(--muted)" }}>
                    Stock canal{" "}
                    <span
                      style={{
                        color: sinStock ? "var(--accent)" : "var(--muted-hi)",
                        fontFamily: "var(--font-geist-mono)",
                        fontWeight: 600,
                      }}
                    >
                      {stockCanal}
                    </span>{" "}
                    · {tipoOtroCanal === "online" ? "online" : "tienda"}{" "}
                    <span
                      style={{
                        fontFamily: "var(--font-geist-mono)",
                        color: "var(--muted-hi)",
                      }}
                    >
                      {stockOtro}
                    </span>{" "}
                    · total{" "}
                    <span
                      style={{
                        fontFamily: "var(--font-geist-mono)",
                        color: stockBajoTotal ? "var(--accent)" : "var(--muted-hi)",
                        fontWeight: 600,
                      }}
                    >
                      {stockTotal}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => onVenta(p.sku)}
                  disabled={sinStock}
                  className="text-[10.5px] uppercase tracking-widest px-3 py-1.5"
                  style={{
                    border: sinStock ? "1px solid var(--border)" : "1px solid var(--accent)",
                    background: sinStock ? "transparent" : "var(--accent-dim)",
                    color: sinStock ? "var(--muted)" : "var(--accent)",
                    cursor: sinStock ? "default" : "pointer",
                    fontWeight: 600,
                    fontFamily: "var(--font-geist-mono)",
                  }}
                >
                  {sinStock ? "agotado" : `vender · ${formatoEuro(p.precio)}`}
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}

function CTAKroomix() {
  return (
    <div
      className="mt-8 p-6"
      style={{
        background: "var(--bg-soft)",
        border: "1px solid var(--accent)",
      }}
    >
      <div
        className="text-[10px] font-medium uppercase tracking-widest mb-2"
        style={{ color: "var(--accent)" }}
      >
        ¿Cuánto perdéis por roturas y recuentos manuales?
      </div>
      <p
        className="text-sm mb-4"
        style={{ color: "var(--muted-hi)", lineHeight: 1.6, maxWidth: 720 }}
      >
        Kroomix sincroniza tu TPV (Square, Hiopos, Glop, Lightspeed…) y tu tienda online
        (Shopify, WooCommerce, PrestaShop) con el mismo stock central. Roturas detectadas al
        instante, recuentos automáticos y avisos de reposición sin intervención manual.
      </p>
      <a
        href="/?seccion=contacto"
        className="text-xs font-medium uppercase tracking-widest"
        style={{ color: "var(--fg)", textDecoration: "underline" }}
      >
        Hablar con Kroomix →
      </a>
    </div>
  );
}

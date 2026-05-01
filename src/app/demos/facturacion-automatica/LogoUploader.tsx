"use client";

import { useEffect, useRef, useState } from "react";
import { comprimirImagen, formatearTamano } from "./comprimirImagen";

const STORAGE_KEY = "kroomix-demo-factura-logo";
const MAX_BYTES = 1_000_000; // 1 MB
const TIPOS_VALIDOS = ["image/png", "image/jpeg", "image/jpg", "image/webp"];

interface Props {
  logo: string | null;
  onChange: (logo: string | null) => void;
}

interface InfoCompresion {
  bytesOriginal: number;
  bytesFinal: number;
  ancho: number;
  alto: number;
  formato: string;
  comprimida: boolean;
}

export function LogoUploader({ logo, onChange }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [procesando, setProcesando] = useState(false);
  const [info, setInfo] = useState<InfoCompresion | null>(null);
  const [hidratado, setHidratado] = useState(false);

  // Cargar de localStorage al montar
  useEffect(() => {
    setHidratado(true);
    const guardado = window.localStorage.getItem(STORAGE_KEY);
    if (guardado && !logo) onChange(guardado);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Persistir cambios
  useEffect(() => {
    if (!hidratado) return;
    if (logo) window.localStorage.setItem(STORAGE_KEY, logo);
    else window.localStorage.removeItem(STORAGE_KEY);
  }, [logo, hidratado]);

  const procesarArchivo = async (file: File) => {
    setError(null);
    setInfo(null);
    if (!TIPOS_VALIDOS.includes(file.type)) {
      setError("Formato no soportado. Usa PNG, JPG o WebP.");
      return;
    }
    setProcesando(true);
    try {
      const resultado = await comprimirImagen(file, MAX_BYTES);
      if (resultado.bytes > MAX_BYTES) {
        setError(
          `No se ha podido comprimir por debajo de 1 MB (${formatearTamano(resultado.bytes)}). Prueba una imagen más simple.`,
        );
        return;
      }
      onChange(resultado.dataUrl);
      setInfo({
        bytesOriginal: file.size,
        bytesFinal: resultado.bytes,
        ancho: Math.round(resultado.ancho),
        alto: Math.round(resultado.alto),
        formato: resultado.formato.replace("image/", "").toUpperCase(),
        comprimida: resultado.comprimida,
      });
    } catch {
      setError("No se ha podido procesar la imagen.");
    } finally {
      setProcesando(false);
    }
  };

  return (
    <div
      style={{
        background: "var(--bg-soft)",
        border: "1px solid var(--border)",
        padding: 16,
      }}
    >
      <div
        className="text-[10px] font-medium uppercase tracking-widest mb-3"
        style={{ color: "var(--muted)" }}
      >
        Logo en las facturas
      </div>

      <div className="flex items-center gap-4 flex-wrap">
        <div
          style={{
            width: 92,
            height: 92,
            border: "1px dashed var(--border)",
            background: "var(--bg)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            overflow: "hidden",
            flexShrink: 0,
          }}
        >
          {logo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={logo}
              alt="Logo cargado"
              style={{
                maxWidth: "100%",
                maxHeight: "100%",
                objectFit: "contain",
                background: "white",
                padding: 6,
              }}
            />
          ) : (
            <span
              className="text-[10px] uppercase tracking-widest"
              style={{ color: "var(--muted)" }}
            >
              Sin logo
            </span>
          )}
        </div>

        <div className="flex-1 min-w-[200px]">
          <p
            className="text-xs mb-3"
            style={{ color: "var(--muted-hi)", lineHeight: 1.5 }}
          >
            Sube el logo de tu empresa (PNG, JPG o WebP). Lo comprimimos por debajo de 1 MB
            automáticamente y aparecerá en la cabecera del PDF de cada factura. Se guarda en este
            dispositivo.
          </p>
          <div className="flex flex-wrap gap-2">
            <input
              ref={inputRef}
              type="file"
              accept="image/png,image/jpeg,image/webp"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) procesarArchivo(f);
                if (inputRef.current) inputRef.current.value = "";
              }}
              style={{ display: "none" }}
            />
            <button
              onClick={() => inputRef.current?.click()}
              disabled={procesando}
              className="text-[10.5px] uppercase tracking-widest px-3 py-1.5"
              style={{
                border: "1px solid var(--accent)",
                background: "var(--accent-dim)",
                color: "var(--accent)",
                cursor: procesando ? "default" : "pointer",
                fontWeight: 600,
                opacity: procesando ? 0.5 : 1,
              }}
            >
              {procesando ? "Comprimiendo…" : logo ? "Cambiar logo" : "↑ Subir logo"}
            </button>
            {logo && (
              <button
                onClick={() => {
                  onChange(null);
                  setInfo(null);
                }}
                className="text-[10.5px] uppercase tracking-widest px-3 py-1.5"
                style={{
                  border: "1px solid var(--border)",
                  background: "transparent",
                  color: "var(--muted-hi)",
                  cursor: "pointer",
                }}
              >
                Quitar
              </button>
            )}
          </div>
          {error && (
            <p
              className="text-xs mt-2"
              style={{ color: "var(--accent)", fontWeight: 500 }}
            >
              ⚠ {error}
            </p>
          )}
          {info && !error && (
            <p
              className="text-[10.5px] mt-2"
              style={{
                color: "var(--muted)",
                fontFamily: "var(--font-geist-mono)",
                lineHeight: 1.5,
              }}
            >
              {info.comprimida ? "✓ Comprimido" : "✓ Cargado"} ·{" "}
              {formatearTamano(info.bytesOriginal)} → {formatearTamano(info.bytesFinal)}
              {info.bytesOriginal > info.bytesFinal && (
                <>
                  {" "}
                  (
                  {(
                    (1 - info.bytesFinal / info.bytesOriginal) * 100
                  ).toFixed(0)}
                  % menos)
                </>
              )}{" "}
              · {info.ancho}×{info.alto} · {info.formato}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

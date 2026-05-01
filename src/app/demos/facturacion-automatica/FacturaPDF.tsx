"use client";

import { Document, Image, Page, StyleSheet, Text, View } from "@react-pdf/renderer";
import type { ClienteFact, TrabajoMes } from "./data";

const EMISORA = {
  nombre: "Servicios Técnicos Osona SL",
  nif: "B66112233",
  direccion: "Polígon Industrial El Verdaguer, nau 12",
  poblacion: "08560 Manlleu (Barcelona)",
  email: "facturacio@servicstecnics-osona.cat",
  telefono: "+34 938 88 12 34",
  iban: "ES21 0081 0001 2345 6789 0123",
};

interface Props {
  numero: string;
  fechaEmision: string;
  vencimiento: string;
  cliente: ClienteFact;
  trabajos: TrabajoMes[];
  baseImponible: number;
  iva: number;
  total: number;
  logoDataUrl?: string | null;
}

const styles = StyleSheet.create({
  page: {
    paddingTop: 48,
    paddingBottom: 48,
    paddingHorizontal: 56,
    fontFamily: "Helvetica",
    fontSize: 9.5,
    color: "#1a1a1a",
    backgroundColor: "#fdfdfb",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    paddingBottom: 16,
    marginBottom: 24,
    borderBottomWidth: 2,
    borderBottomColor: "#1a1a1a",
    borderBottomStyle: "solid",
  },
  brandKicker: {
    fontSize: 8,
    letterSpacing: 1.5,
    color: "#666",
    marginBottom: 6,
    textTransform: "uppercase",
  },
  logo: {
    maxWidth: 140,
    maxHeight: 56,
    objectFit: "contain",
    marginBottom: 12,
  },
  brandTitle: {
    fontSize: 20,
    fontFamily: "Helvetica-Bold",
    letterSpacing: -0.4,
  },
  brandSub: {
    fontSize: 9,
    color: "#555",
    marginTop: 4,
  },
  emisoraBlock: {
    textAlign: "right",
  },
  emisoraName: {
    fontSize: 11,
    fontFamily: "Helvetica-Bold",
  },
  emisoraLine: {
    fontSize: 8.5,
    color: "#555",
    marginTop: 1.5,
    lineHeight: 1.3,
  },
  twoCols: {
    flexDirection: "row",
    gap: 24,
    marginBottom: 22,
  },
  col: { flex: 1 },
  blockKicker: {
    fontSize: 7.5,
    letterSpacing: 1.4,
    color: "#777",
    marginBottom: 4,
    textTransform: "uppercase",
    fontFamily: "Helvetica-Bold",
  },
  blockBody: {
    fontSize: 9.5,
    color: "#222",
    lineHeight: 1.45,
  },
  blockBodyStrong: {
    fontSize: 10.5,
    color: "#1a1a1a",
    fontFamily: "Helvetica-Bold",
    marginBottom: 2,
  },
  metaTable: {
    flexDirection: "row",
    backgroundColor: "#f3efe6",
    padding: 12,
    marginBottom: 22,
    borderLeftWidth: 2,
    borderLeftColor: "#1a1a1a",
    borderLeftStyle: "solid",
  },
  metaCell: { flex: 1 },
  metaLabel: {
    fontSize: 7.5,
    letterSpacing: 1.2,
    color: "#777",
    textTransform: "uppercase",
    marginBottom: 2,
  },
  metaValue: {
    fontSize: 10,
    color: "#1a1a1a",
    fontFamily: "Helvetica-Bold",
  },
  tabla: {
    marginBottom: 16,
  },
  thead: {
    flexDirection: "row",
    borderBottomWidth: 1.5,
    borderBottomColor: "#1a1a1a",
    borderBottomStyle: "solid",
    paddingBottom: 6,
    marginBottom: 4,
  },
  th: {
    fontSize: 7.5,
    letterSpacing: 1.2,
    color: "#1a1a1a",
    textTransform: "uppercase",
    fontFamily: "Helvetica-Bold",
  },
  tr: {
    flexDirection: "row",
    paddingVertical: 6,
    borderBottomWidth: 0.5,
    borderBottomColor: "#d8d4cb",
    borderBottomStyle: "solid",
  },
  td: {
    fontSize: 9,
    color: "#222",
  },
  colFecha: { width: 60 },
  colDesc: { flex: 1, paddingRight: 8 },
  colHoras: { width: 45, textAlign: "right" },
  colTarifa: { width: 60, textAlign: "right" },
  colImporte: { width: 70, textAlign: "right" },
  totales: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginTop: 12,
    marginBottom: 28,
  },
  totalesBox: {
    width: 240,
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 3,
  },
  totalLabel: {
    fontSize: 9.5,
    color: "#555",
  },
  totalValue: {
    fontSize: 9.5,
    color: "#1a1a1a",
  },
  totalFinalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "baseline",
    paddingTop: 8,
    marginTop: 4,
    borderTopWidth: 1.5,
    borderTopColor: "#1a1a1a",
    borderTopStyle: "solid",
  },
  totalFinalLabel: {
    fontSize: 11,
    fontFamily: "Helvetica-Bold",
    textTransform: "uppercase",
    letterSpacing: 0.6,
    color: "#1a1a1a",
  },
  totalFinalValue: {
    fontSize: 16,
    fontFamily: "Helvetica-Bold",
    color: "#1a1a1a",
  },
  notasBlock: {
    borderLeftWidth: 2,
    borderLeftColor: "#1a1a1a",
    borderLeftStyle: "solid",
    paddingLeft: 12,
    marginBottom: 24,
  },
  notasKicker: {
    fontSize: 7.5,
    letterSpacing: 1.4,
    color: "#777",
    textTransform: "uppercase",
    fontFamily: "Helvetica-Bold",
    marginBottom: 4,
  },
  notasBody: {
    fontSize: 9,
    color: "#333",
    lineHeight: 1.55,
  },
  pieAvisos: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingTop: 14,
    borderTopWidth: 0.5,
    borderTopColor: "#bcb6a8",
    borderTopStyle: "solid",
  },
  pieCol: { flex: 1 },
  pieLabel: {
    fontSize: 7,
    letterSpacing: 1,
    color: "#888",
    textTransform: "uppercase",
    marginBottom: 2,
  },
  pieValue: {
    fontSize: 8.5,
    color: "#333",
  },
  pageNumber: {
    position: "absolute",
    bottom: 24,
    right: 56,
    fontSize: 8,
    color: "#888",
  },
});

function eur(v: number) {
  return new Intl.NumberFormat("es-ES", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 2,
  }).format(v);
}

function fechaLarga(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return new Intl.DateTimeFormat("es-ES", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(d);
}

function formaPagoLabel(forma: ClienteFact["formaPago"]) {
  return forma === "transferencia"
    ? "Transferencia bancaria"
    : forma === "domiciliacion"
      ? "Domiciliación SEPA"
      : "Tarjeta";
}

export function FacturaPDF({
  numero,
  fechaEmision,
  vencimiento,
  cliente,
  trabajos,
  baseImponible,
  iva,
  total,
  logoDataUrl,
}: Props) {
  return (
    <Document
      title={`Factura ${numero} ${cliente.nombre}`}
      author={EMISORA.nombre}
      subject={`Factura ${numero}`}
      creator="Kroomix Demo"
    >
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            {logoDataUrl ? (
              // eslint-disable-next-line jsx-a11y/alt-text
              <Image src={logoDataUrl} style={styles.logo} />
            ) : null}
            <Text style={styles.brandKicker}>Factura</Text>
            <Text style={styles.brandTitle}>{numero}</Text>
            <Text style={styles.brandSub}>
              Emitida el {fechaLarga(fechaEmision)}
            </Text>
          </View>
          <View style={styles.emisoraBlock}>
            <Text style={styles.emisoraName}>{EMISORA.nombre}</Text>
            <Text style={styles.emisoraLine}>{EMISORA.nif}</Text>
            <Text style={styles.emisoraLine}>{EMISORA.direccion}</Text>
            <Text style={styles.emisoraLine}>{EMISORA.poblacion}</Text>
            <Text style={styles.emisoraLine}>{EMISORA.email}</Text>
            <Text style={styles.emisoraLine}>{EMISORA.telefono}</Text>
          </View>
        </View>

        {/* Cliente + Periodo */}
        <View style={styles.twoCols}>
          <View style={styles.col}>
            <Text style={styles.blockKicker}>Facturar a</Text>
            <Text style={styles.blockBodyStrong}>{cliente.nombre}</Text>
            <Text style={styles.blockBody}>
              {cliente.nif}
              {"\n"}
              {cliente.email}
            </Text>
          </View>
          <View style={styles.col}>
            <Text style={styles.blockKicker}>Periodo facturado</Text>
            <Text style={styles.blockBodyStrong}>
              {fechaLarga(trabajos[0]?.fecha ?? fechaEmision)} —{" "}
              {fechaLarga(trabajos[trabajos.length - 1]?.fecha ?? fechaEmision)}
            </Text>
            <Text style={styles.blockBody}>
              {trabajos.length} {trabajos.length === 1 ? "trabajo" : "trabajos"} ·{" "}
              {trabajos.reduce((a, t) => a + t.horas, 0).toFixed(1)} horas
            </Text>
          </View>
        </View>

        {/* Meta */}
        <View style={styles.metaTable}>
          <View style={styles.metaCell}>
            <Text style={styles.metaLabel}>Vencimiento</Text>
            <Text style={styles.metaValue}>{fechaLarga(vencimiento)}</Text>
          </View>
          <View style={styles.metaCell}>
            <Text style={styles.metaLabel}>Forma de pago</Text>
            <Text style={styles.metaValue}>{formaPagoLabel(cliente.formaPago)}</Text>
          </View>
          <View style={styles.metaCell}>
            <Text style={styles.metaLabel}>Días de pago</Text>
            <Text style={styles.metaValue}>{cliente.diaPago} días</Text>
          </View>
        </View>

        {/* Tabla trabajos */}
        <View style={styles.tabla}>
          <View style={styles.thead}>
            <Text style={[styles.th, styles.colFecha]}>Fecha</Text>
            <Text style={[styles.th, styles.colDesc]}>Concepto</Text>
            <Text style={[styles.th, styles.colHoras]}>Horas</Text>
            <Text style={[styles.th, styles.colTarifa]}>€/h</Text>
            <Text style={[styles.th, styles.colImporte]}>Importe</Text>
          </View>
          {trabajos.map((t) => (
            <View key={t.id} style={styles.tr}>
              <Text style={[styles.td, styles.colFecha]}>{t.fecha}</Text>
              <Text style={[styles.td, styles.colDesc]}>{t.descripcion}</Text>
              <Text style={[styles.td, styles.colHoras]}>{t.horas.toFixed(1)}</Text>
              <Text style={[styles.td, styles.colTarifa]}>{eur(t.tarifaHora)}</Text>
              <Text
                style={[styles.td, styles.colImporte, { fontFamily: "Helvetica-Bold" }]}
              >
                {eur(t.importe)}
              </Text>
            </View>
          ))}
        </View>

        {/* Totales */}
        <View style={styles.totales}>
          <View style={styles.totalesBox}>
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Base imponible</Text>
              <Text style={styles.totalValue}>{eur(baseImponible)}</Text>
            </View>
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>IVA 21%</Text>
              <Text style={styles.totalValue}>{eur(iva)}</Text>
            </View>
            <View style={styles.totalFinalRow}>
              <Text style={styles.totalFinalLabel}>Total</Text>
              <Text style={styles.totalFinalValue}>{eur(total)}</Text>
            </View>
          </View>
        </View>

        {/* Notas */}
        <View style={styles.notasBlock}>
          <Text style={styles.notasKicker}>Forma de cobro</Text>
          <Text style={styles.notasBody}>
            {cliente.formaPago === "domiciliacion"
              ? `El importe se cargará por domiciliación SEPA en la cuenta ${cliente.iban} en la fecha de vencimiento indicada.`
              : `Realiza el pago mediante transferencia bancaria a la cuenta ${EMISORA.iban} indicando el número de factura ${numero} en el concepto. Cuenta del cliente registrada: ${cliente.iban}.`}
          </Text>
        </View>

        <View style={styles.pieAvisos}>
          <View style={styles.pieCol}>
            <Text style={styles.pieLabel}>Emite</Text>
            <Text style={styles.pieValue}>{EMISORA.nombre}</Text>
            <Text style={styles.pieValue}>{EMISORA.nif}</Text>
          </View>
          <View style={styles.pieCol}>
            <Text style={styles.pieLabel}>Recibe</Text>
            <Text style={styles.pieValue}>{cliente.nombre}</Text>
            <Text style={styles.pieValue}>{cliente.nif}</Text>
          </View>
          <View style={styles.pieCol}>
            <Text style={styles.pieLabel}>Documento</Text>
            <Text style={styles.pieValue}>Factura {numero}</Text>
            <Text style={styles.pieValue}>{fechaLarga(fechaEmision)}</Text>
          </View>
        </View>

        <Text
          style={styles.pageNumber}
          render={({ pageNumber, totalPages }) => `${pageNumber} / ${totalPages}`}
          fixed
        />
      </Page>
    </Document>
  );
}

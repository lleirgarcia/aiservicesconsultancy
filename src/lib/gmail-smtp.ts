import nodemailer from "nodemailer";

const DEMO_PREFIX = "[DEMO KROOMIX]";

export interface EnvioDemo {
  remitenteNombre: string;
  // Sufijo del alias plus de Gmail (user+alias@gmail.com). Solo [a-z0-9.-].
  remitenteAlias: string;
  asunto: string;
  cuerpo: string;
  adjuntos: { nombre: string; contenido?: string }[];
}

// PDF mínimo válido de una página. Sirve como adjunto de relleno para que la
// bandeja y el clasificador vean un archivo real, con un resumen del documento.
function pdfPlaceholder(titulo: string, resumen?: string): Buffer {
  const sane = (s: string) =>
    s
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .replace(/[()\\]/g, "")
      .replace(/[^\x20-\x7e]/g, "?");
  const lineas = [
    "Documento de demostracion - Kroomix",
    sane(titulo),
    ...(resumen ? sane(resumen).match(/.{1,80}(\s|$)/g) ?? [] : []),
  ];
  const contenido =
    `BT /F1 11 Tf 50 760 Td ` +
    lineas.map((l, i) => `${i > 0 ? "0 -18 Td " : ""}(${l.trim()}) Tj `).join("") +
    `ET`;
  const objetos = [
    `1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj`,
    `2 0 obj << /Type /Pages /Kids [3 0 R] /Count 1 >> endobj`,
    `3 0 obj << /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >> endobj`,
    `4 0 obj << /Length ${contenido.length} >> stream\n${contenido}\nendstream endobj`,
    `5 0 obj << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >> endobj`,
  ];
  let cuerpoPdf = "%PDF-1.4\n";
  const offsets: number[] = [];
  for (const obj of objetos) {
    offsets.push(cuerpoPdf.length);
    cuerpoPdf += obj + "\n";
  }
  const xrefPos = cuerpoPdf.length;
  cuerpoPdf += `xref\n0 6\n0000000000 65535 f \n`;
  for (const off of offsets) {
    cuerpoPdf += `${String(off).padStart(10, "0")} 00000 n \n`;
  }
  cuerpoPdf += `trailer << /Size 6 /Root 1 0 R >>\nstartxref\n${xrefPos}\n%%EOF`;
  return Buffer.from(cuerpoPdf, "latin1");
}

export async function enviarEmailDemo(envio: EnvioDemo): Promise<void> {
  const user = process.env.GMAIL_USER!;
  const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 465,
    secure: true,
    auth: { user, pass: process.env.GMAIL_APP_PASSWORD! },
  });

  const [local, dominio] = user.split("@");
  const alias = envio.remitenteAlias.replace(/[^a-z0-9.-]/gi, "").toLowerCase();
  const fromAddress = alias ? `${local}+${alias}@${dominio}` : user;

  await transporter.sendMail({
    from: { name: envio.remitenteNombre, address: fromAddress },
    to: user,
    subject: `${DEMO_PREFIX} ${envio.asunto}`,
    text: envio.cuerpo,
    attachments: envio.adjuntos.map((a) => ({
      filename: a.nombre,
      content: pdfPlaceholder(a.nombre, a.contenido),
      contentType: "application/pdf",
    })),
  });
}

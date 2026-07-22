import { ImapFlow } from "imapflow";
import { simpleParser } from "mailparser";
import type { EmailEntrada } from "@/app/demos/asesoria-emails/data";

const DEMO_PREFIX = "[DEMO KROOMIX]";

export async function fetchDemoEmails(): Promise<EmailEntrada[]> {
  const client = new ImapFlow({
    host: "imap.gmail.com",
    port: 993,
    secure: true,
    auth: {
      user: process.env.GMAIL_USER!,
      pass: process.env.GMAIL_APP_PASSWORD!,
    },
    logger: false,
  });

  await client.connect();

  const emails: EmailEntrada[] = [];

  try {
    await client.mailboxOpen("INBOX");

    const uids = await client.search({ subject: DEMO_PREFIX });

    if (!uids || uids.length === 0) return [];

    for await (const msg of client.fetch(uids, { source: true, envelope: true })) {
      if (!msg.source) continue;
      const parsed = await simpleParser(msg.source);

      const asunto = parsed.subject ?? "";
      const adjuntos = (parsed.attachments ?? []).map((a) => ({
        nombre: a.filename ?? "adjunto",
        tamano: formatBytes(a.size ?? 0),
      }));

      emails.push({
        id: String(msg.uid),
        remitenteNombre: parsed.from?.value[0]?.name ?? parsed.from?.value[0]?.address ?? "",
        remitenteEmail: parsed.from?.value[0]?.address ?? "",
        asunto: asunto.replace(DEMO_PREFIX, "").trim(),
        cuerpo:
          parsed.text ??
          (typeof parsed.html === "string"
            ? parsed.html.replace(/<[^>]+>/g, " ")
            : ""),
        fechaRecibido: (parsed.date ?? new Date()).toISOString(),
        adjuntos,
      });
    }
  } finally {
    await client.logout();
  }

  return emails.sort(
    (a, b) => new Date(b.fechaRecibido).getTime() - new Date(a.fechaRecibido).getTime(),
  );
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

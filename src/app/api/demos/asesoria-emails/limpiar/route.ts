import { NextResponse } from "next/server";
import { limpiarDemoEmails } from "@/lib/gmail-imap";

export async function POST() {
  try {
    const eliminados = await limpiarDemoEmails();
    return NextResponse.json({ ok: true, eliminados });
  } catch (err) {
    console.error("Error limpiando emails de demo:", err);
    return NextResponse.json({ error: "No se pudo limpiar la bandeja" }, { status: 500 });
  }
}

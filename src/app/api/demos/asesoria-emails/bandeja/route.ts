import { NextResponse } from "next/server";
import { fetchDemoEmails } from "@/lib/gmail-imap";

export async function GET() {
  try {
    const emails = await fetchDemoEmails();
    return NextResponse.json(emails);
  } catch (err) {
    console.error("Error conectando a Gmail:", err);
    return NextResponse.json({ error: "No se pudo conectar a Gmail" }, { status: 500 });
  }
}

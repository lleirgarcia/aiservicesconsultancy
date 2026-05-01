export function extractFirstParagraph(md: string): string {
  if (!md) return "";

  const lines = md.split(/\r?\n/);
  const buffer: string[] = [];

  for (const raw of lines) {
    const line = raw.trim();
    if (!line) {
      if (buffer.length > 0) break;
      continue;
    }
    if (
      line.startsWith("#") ||
      line.startsWith(">") ||
      line.startsWith("```") ||
      line.startsWith("![") ||
      line.startsWith("---")
    ) {
      if (buffer.length > 0) break;
      continue;
    }
    buffer.push(line);
  }

  return buffer
    .join(" ")
    .replace(/\*\*(.+?)\*\*/g, "$1")
    .replace(/\*(.+?)\*/g, "$1")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
    .trim();
}

export function truncate(text: string, max: number): string {
  if (!text) return "";
  if (text.length <= max) return text;
  const cut = text.slice(0, max - 1).trimEnd();
  return `${cut}…`;
}

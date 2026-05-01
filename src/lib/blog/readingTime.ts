const WORDS_PER_MINUTE = 220;

const URL_PATTERN = /https?:\/\/\S+/g;
const FENCED_CODE_BLOCK = /```[\s\S]*?```/g;
const INLINE_CODE = /`[^`]+`/g;
const MARKDOWN_IMAGE = /!\[[^\]]*\]\([^)]*\)/g;
const MARKDOWN_LINK = /\[([^\]]+)\]\([^)]*\)/g;

export function calculateReadingTime(markdown: string): number {
  if (!markdown || !markdown.trim()) return 1;

  const cleaned = markdown
    .replace(FENCED_CODE_BLOCK, "")
    .replace(MARKDOWN_IMAGE, "")
    .replace(MARKDOWN_LINK, "$1")
    .replace(INLINE_CODE, "")
    .replace(URL_PATTERN, "");

  const words = cleaned
    .split(/\s+/)
    .filter((token) => token.length > 0 && /\w/.test(token));

  if (words.length === 0) return 1;

  return Math.max(1, Math.ceil(words.length / WORDS_PER_MINUTE));
}

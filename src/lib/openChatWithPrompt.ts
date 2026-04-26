export const OPEN_CHAT_PROMPT_EVENT = "kroomix-open-chat-prompt";

export type OpenChatPromptDetail = {
  /** Full user message to send or show in the input. */
  prompt: string;
  /** If true (default), the message is sent immediately. If false, only the input is filled. */
  autoSend?: boolean;
};

export function openChatWithPrompt(detail: OpenChatPromptDetail) {
  if (typeof window === "undefined") return;
  document.getElementById("contacto")?.scrollIntoView({ behavior: "smooth", block: "start" });
  window.dispatchEvent(new CustomEvent<OpenChatPromptDetail>(OPEN_CHAT_PROMPT_EVENT, { detail }));
}

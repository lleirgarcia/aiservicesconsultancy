"use client";

import { useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { useSpeechRecognition } from "@/hooks/useSpeechRecognition";
import { getSessionCount, incrementSessionCount } from "@/lib/chatSession";
import { OPEN_CHAT_PROMPT_EVENT, type OpenChatPromptDetail } from "@/lib/openChatWithPrompt";
import { useI18n } from "@/i18n/LocaleContext";

interface Message {
  role: "user" | "assistant";
  content: string;
}

const MAX_MESSAGES = 40;
const MAX_RESETS = 2;
const CONV_END_MARKER = "<<CONV_END>>";

const PHONE_DISPLAY = "+34 626 572 151";
const PHONE_TEL = "+34626572151";
const WHATSAPP_URL = "https://wa.me/34626572151";
const EMAIL = "lleirgarcia@gmail.com";

function LimitModal({ onClose }: { onClose: () => void }) {
  const { t } = useI18n();
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [onClose]);

  return (
    <div
      role="dialog"
      aria-modal="true"
      onClick={onClose}
      style={{
        position: "absolute",
        inset: 0,
        background: "rgba(0,0,0,0.6)",
        backdropFilter: "blur(8px)",
        WebkitBackdropFilter: "blur(8px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 10,
        borderRadius: 6,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "90%",
          maxWidth: 360,
          background: "var(--bg)",
          border: "1px solid var(--border)",
          borderRadius: 4,
          boxShadow: "0 20px 60px rgba(0,0,0,0.4)",
        }}
      >
        <div
          style={{
            padding: "20px 24px 16px",
            borderBottom: "1px solid var(--border)",
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "space-between",
            gap: 12,
          }}
        >
          <div>
            <p
              className="text-xs font-medium uppercase tracking-widest"
              style={{ color: "var(--accent)", marginBottom: 6 }}
            >
              {t("chat.limitTitle")}
            </p>
            <p className="text-sm" style={{ color: "var(--muted)", lineHeight: 1.5 }}>
              {t("chat.limitBody")}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label={t("chat.close")}
            style={{
              background: "transparent",
              border: "none",
              color: "var(--muted)",
              fontSize: "1.1rem",
              lineHeight: 1,
              cursor: "pointer",
              padding: 0,
              flexShrink: 0,
            }}
          >
            ×
          </button>
        </div>

        <a
          href={`tel:${PHONE_TEL}`}
          onClick={onClose}
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 4,
            padding: "16px 24px",
            borderBottom: "1px solid var(--border)",
            textDecoration: "none",
          }}
        >
          <span
            className="text-xs font-medium uppercase tracking-widest"
            style={{ color: "var(--accent)" }}
          >
            {t("contact.callNow")}
          </span>
          <span className="text-sm" style={{ color: "var(--muted)" }}>
            {PHONE_DISPLAY}
          </span>
        </a>

        <a
          href={WHATSAPP_URL}
          target="_blank"
          rel="noopener noreferrer"
          onClick={onClose}
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 4,
            padding: "16px 24px",
            borderBottom: "1px solid var(--border)",
            textDecoration: "none",
          }}
        >
          <span
            className="text-xs font-medium uppercase tracking-widest"
            style={{ color: "var(--accent)" }}
          >
            {t("contact.wa")}
          </span>
          <span className="text-sm" style={{ color: "var(--muted)" }}>
            {t("contact.waHint")}
          </span>
        </a>

        <a
          href={`mailto:${EMAIL}`}
          onClick={onClose}
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 4,
            padding: "16px 24px",
            textDecoration: "none",
          }}
        >
          <span
            className="text-xs font-medium uppercase tracking-widest"
            style={{ color: "var(--accent)" }}
          >
            {t("contact.email")}
          </span>
          <span className="text-sm" style={{ color: "var(--muted)" }}>
            {EMAIL}
          </span>
        </a>
      </div>
    </div>
  );
}

export default function ChatAgent() {
  const { t, locale, speechRecognitionLang } = useI18n();

  const [messages, setMessages] = useState<Message[]>(() => [
    { role: "assistant", content: t("chat.initial") },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [resetsUsed, setResetsUsed] = useState(0);
  const [showModal, setShowModal] = useState(false);
  const [convClosed, setConvClosed] = useState(false);
  const [leadId, setLeadId] = useState<string | null>(null);
  const messagesRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const rawContentRef = useRef("");
  const didInitialScrollRef = useRef(false);
  const latestMessagesRef = useRef<Message[]>([
    { role: "assistant", content: t("chat.initial") },
  ]);
  const savedRef = useRef(false);
  const wasLoadingRef = useRef(false);
  const submitFromUserTextRef = useRef<(text: string) => Promise<void>>(async () => {});

  const {
    supported: micSupported,
    state: micState,
    error: micError,
    toggle: micToggle,
  } = useSpeechRecognition(
    (transcript) => {
      setInput((prev) => (prev ? `${prev} ${transcript}` : transcript));
    },
    {
      lang: speechRecognitionLang,
      errDenied: t("chat.micErr.denied"),
      errNoDevice: t("chat.micErr.noDevice"),
      errNetwork: t("chat.micErr.network"),
      errStart: t("chat.micErr.startFailed"),
    }
  );

  const resetsExhausted = resetsUsed >= MAX_RESETS;
  const limitReached = messages.length >= MAX_MESSAGES || resetsExhausted;
  const inputBlocked = convClosed || limitReached;
  const canReset = !loading && !resetsExhausted && messages.length > 1;

  const loadingRef = useRef(false);
  const inputBlockedRef = useRef(false);
  loadingRef.current = loading;
  inputBlockedRef.current = inputBlocked;

  useEffect(() => {
    setResetsUsed(getSessionCount());
  }, []);

  useEffect(() => {
    setMessages((prev) => {
      if (prev.length !== 1 || prev[0].role !== "assistant") return prev;
      const next = t("chat.initial");
      if (prev[0].content === next) return prev;
      return [{ role: "assistant", content: next }];
    });
  }, [locale, t]);

  useEffect(() => {
    latestMessagesRef.current = messages;
  }, [messages]);

  useEffect(() => {
    if (!didInitialScrollRef.current) {
      didInitialScrollRef.current = true;
      return;
    }
    const container = messagesRef.current;
    if (!container) return;
    container.scrollTo({ top: container.scrollHeight, behavior: "smooth" });
  }, [messages, loading]);

  useEffect(() => {
    if (resetsExhausted) setShowModal(true);
  }, [resetsExhausted]);

  useEffect(() => {
    const el = inputRef.current;
    if (!el) return;
    el.style.height = "auto";
    const next = Math.min(el.scrollHeight, 140);
    el.style.height = `${next}px`;
  }, [input]);

  useEffect(() => {
    if (wasLoadingRef.current && !loading) {
      inputRef.current?.focus();
    }
    wasLoadingRef.current = loading;
  }, [loading]);

  useEffect(() => {
    function onOpenChatPrompt(e: Event) {
      const ce = e as CustomEvent<OpenChatPromptDetail>;
      const prompt = ce.detail?.prompt?.trim();
      if (!prompt) return;
      const autoSend = ce.detail.autoSend !== false;
      const canAutoSend = autoSend && !inputBlockedRef.current && !loadingRef.current;
      if (canAutoSend) void submitFromUserTextRef.current(prompt);
      else {
        setInput(prompt);
        queueMicrotask(() => inputRef.current?.focus());
      }
    }
    window.addEventListener(OPEN_CHAT_PROMPT_EVENT, onOpenChatPrompt);
    return () => window.removeEventListener(OPEN_CHAT_PROMPT_EVENT, onOpenChatPrompt);
  }, []);

  async function saveChat(msgs: Message[]) {
    if (msgs.length <= 1) return;

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: msgs,
          leadId: leadId,
          isManualSave: true,
          locale,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.leadId && !leadId) {
          setLeadId(data.leadId);
        }
      }
    } catch (err) {
      console.error("Error saving chat:", err);
    }
  }

  async function resetChat() {
    if (!canReset) return;
    await saveChat(latestMessagesRef.current);
    savedRef.current = false;
    const nextUsed = incrementSessionCount();
    setResetsUsed(nextUsed);
    setMessages([{ role: "assistant", content: t("chat.initial") }]);
    setInput("");
    setShowModal(false);
    setLeadId(null);
    if (nextUsed < MAX_RESETS) inputRef.current?.focus();
  }

  async function resetAfterClosure() {
    await saveChat(latestMessagesRef.current);
    savedRef.current = false;
    setConvClosed(false);
    setMessages([{ role: "assistant", content: t("chat.initial") }]);
    setInput("");
    setLeadId(null);
    inputRef.current?.focus();
  }

  async function submitFromUserText(text: string) {
    const trimmed = text.trim();
    if (!trimmed || loading || inputBlocked) return;

    const prev = latestMessagesRef.current;
    const userMessage: Message = { role: "user", content: trimmed };
    const next = [...prev, userMessage];
    setMessages(next);
    setInput("");
    setLoading(true);

    const assistantMessage: Message = { role: "assistant", content: "" };
    const withAssistant = [...next, assistantMessage];
    setMessages(withAssistant);
    rawContentRef.current = "";

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: next, leadId, locale }),
      });

      if (!res.ok) throw new Error("bad response");

      const data = await res.json();
      const assistantContent = data.message || "";
      rawContentRef.current = assistantContent;

      setMessages((prevMsgs) => {
        const updated = [...prevMsgs];
        updated[updated.length - 1] = { role: "assistant", content: assistantContent };
        latestMessagesRef.current = updated;
        return updated;
      });

      if (data.leadId && !leadId) {
        setLeadId(data.leadId);
      }
    } catch {
      setMessages((prevMsgs) => {
        const updated = [...prevMsgs];
        updated[updated.length - 1] = {
          role: "assistant",
          content: t("chat.errorGeneric"),
        };
        return updated;
      });
    } finally {
      setLoading(false);
      if (rawContentRef.current.includes(CONV_END_MARKER)) {
        setConvClosed(true);
      } else if (next.length >= MAX_MESSAGES) {
        setShowModal(true);
      }
    }
  }

  submitFromUserTextRef.current = submitFromUserText;

  async function send() {
    const text = input.trim();
    if (!text || loading || inputBlocked) return;
    await submitFromUserText(text);
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  }

  return (
    <section
      id="contacto"
      className="px-4 sm:px-6 py-10 sm:py-16 max-w-4xl mx-auto"
    >
      <div
        className="h-[min(72vh,560px)] sm:h-[560px]"
        style={{
          position: "relative",
          border: "1px solid var(--border)",
          borderRadius: 6,
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
          minHeight: 420,
        }}
      >
        {showModal && <LimitModal onClose={() => setShowModal(false)} />}

        <div className="terminal-bar" style={{ flexShrink: 0 }}>
          <span className="terminal-dot" style={{ background: "var(--border)" }} />
          <span className="terminal-dot" style={{ background: "var(--muted)" }} />
          <span className="terminal-dot" style={{ background: "var(--accent)" }} />
          <span
            className="ml-2 text-xs"
            style={{ color: "var(--muted)", fontFamily: "var(--font-geist-mono), monospace" }}
          >
            {t("chat.kroomiBar")}
          </span>
          <button
            type="button"
            onClick={resetChat}
            disabled={!canReset}
            title={
              resetsExhausted
                ? t("chat.newThreadTitle", { max: MAX_RESETS })
                : t("chat.newThread")
            }
            style={{
              marginLeft: "auto",
              background: "transparent",
              color: "var(--muted)",
              border: "1px solid var(--border)",
              borderRadius: 4,
              padding: "3px 8px",
              fontSize: 11,
              fontFamily: "var(--font-geist-mono), monospace",
              cursor: canReset ? "pointer" : "not-allowed",
              opacity: canReset ? 1 : 0.4,
              transition: "opacity 0.15s, color 0.15s, border-color 0.15s",
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
            }}
            onMouseEnter={(e) => {
              if (canReset) {
                e.currentTarget.style.color = "var(--fg)";
                e.currentTarget.style.borderColor = "var(--fg)";
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = "var(--muted)";
              e.currentTarget.style.borderColor = "var(--border)";
            }}
          >
            <span>{t("chat.newConv2")}</span>
            <span style={{ opacity: 0.6 }}>
              {resetsUsed}/{MAX_RESETS}
            </span>
          </button>
        </div>

        <div
          ref={messagesRef}
          style={{
            flex: 1,
            minHeight: 0,
            overflowY: "auto",
            overscrollBehavior: "contain",
            padding: "20px 24px",
            display: "flex",
            flexDirection: "column",
            gap: 16,
            background: "var(--bg)",
          }}
        >
          {messages.map((msg, i) => (
            <div
              key={i}
              style={{
                display: "flex",
                justifyContent: msg.role === "user" ? "flex-end" : "flex-start",
              }}
            >
              <div
                className={msg.role === "assistant" ? "chat-markdown" : undefined}
                style={{
                  maxWidth: "78%",
                  padding: "10px 14px",
                  borderRadius: 6,
                  fontSize: 14,
                  lineHeight: 1.6,
                  whiteSpace: msg.role === "user" ? "pre-wrap" : undefined,
                  background:
                    msg.role === "user" ? "var(--accent)" : "var(--bg-soft)",
                  color: msg.role === "user" ? "var(--bg)" : "var(--fg)",
                  border:
                    msg.role === "user" ? "none" : "1px solid var(--border)",
                }}
              >
                {msg.role === "assistant" ? (
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {msg.content.replace(CONV_END_MARKER, "").trimEnd()}
                  </ReactMarkdown>
                ) : (
                  msg.content
                )}
                {i === messages.length - 1 &&
                  msg.role === "assistant" &&
                  loading && (
                    <span className="blinking-cursor" style={{ marginLeft: 2 }} />
                  )}
              </div>
            </div>
          ))}
        </div>

        <div
          style={{
            borderTop: "1px solid var(--border)",
            padding: "12px 16px",
            display: "flex",
            gap: 10,
            alignItems: "flex-end",
            background: "var(--bg-soft)",
            flexShrink: 0,
          }}
        >
          {convClosed ? (
            <button
              type="button"
              onClick={resetAfterClosure}
              style={{
                flex: 1,
                background: "transparent",
                color: "var(--fg)",
                border: "1px solid var(--border)",
                borderRadius: 4,
                padding: "10px 16px",
                fontSize: 13,
                fontWeight: 500,
                cursor: "pointer",
                textAlign: "center",
              }}
            >
              {t("chat.newConv")}
            </button>
          ) : limitReached ? (
            <button
              type="button"
              onClick={() => setShowModal(true)}
              style={{
                flex: 1,
                background: "var(--accent)",
                color: "var(--bg)",
                border: "none",
                borderRadius: 4,
                padding: "10px 16px",
                fontSize: 13,
                fontWeight: 600,
                cursor: "pointer",
                textAlign: "center",
              }}
            >
              {t("chat.limitContact")}
            </button>
          ) : (
            <>
              <textarea
                ref={inputRef}
                rows={1}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={onKeyDown}
                disabled={loading}
                placeholder={t("chat.placeholder")}
                style={{
                  flex: 1,
                  resize: "none",
                  background: "var(--bg)",
                  border: "1px solid var(--border)",
                  borderRadius: 4,
                  padding: "8px 10px",
                  fontSize: 14,
                  color: "var(--fg)",
                  outline: "none",
                  fontFamily: "inherit",
                  lineHeight: 1.5,
                  minHeight: 38,
                  maxHeight: 140,
                  overflowY: "hidden",
                  opacity: loading ? 0.5 : 1,
                }}
              />
              {micSupported && (
                <button
                  type="button"
                  onClick={() => {
                    void micToggle();
                  }}
                  disabled={loading || micState === "requesting"}
                  title={
                    micError
                      ? micError
                      : micState === "recording"
                        ? t("chat.mic.rec")
                        : micState === "requesting"
                          ? t("chat.mic.req")
                          : micState === "error"
                            ? t("chat.mic.err")
                            : t("chat.mic.talk")
                  }
                  style={{
                    background:
                      micState === "recording" ? "var(--accent)" : "transparent",
                    color:
                      micState === "recording"
                        ? "var(--bg)"
                        : micState === "error"
                          ? "#FF5F57"
                          : micState === "requesting"
                            ? "var(--fg)"
                            : "var(--muted)",
                    border: "1px solid var(--border)",
                    borderRadius: 4,
                    width: 38,
                    height: 38,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                    cursor:
                      loading || micState === "requesting" ? "not-allowed" : "pointer",
                    opacity: loading ? 0.4 : 1,
                    transition: "background 0.15s, color 0.15s",
                    alignSelf: "flex-end",
                  }}
                >
                  {micState === "recording" ? (
                    <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: 0 }}>■</span>
                  ) : micState === "requesting" ? (
                    <span
                      className="blinking-cursor"
                      style={{ width: 8, height: 8, background: "currentColor" }}
                    />
                  ) : (
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 1a4 4 0 0 1 4 4v7a4 4 0 0 1-8 0V5a4 4 0 0 1 4-4zm-1 18.93V22h2v-2.07A8.001 8.001 0 0 0 20 12h-2a6 6 0 0 1-12 0H4a8.001 8.001 0 0 0 7 7.93z" />
                    </svg>
                  )}
                </button>
              )}

              <button
                type="button"
                onClick={send}
                disabled={loading || !input.trim()}
                style={{
                  background: "var(--accent)",
                  color: "var(--bg)",
                  border: "none",
                  borderRadius: 4,
                  padding: "8px 14px",
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: loading || !input.trim() ? "not-allowed" : "pointer",
                  opacity: loading || !input.trim() ? 0.4 : 1,
                  flexShrink: 0,
                  transition: "opacity 0.15s",
                  height: 38,
                  alignSelf: "flex-end",
                }}
                aria-label={t("chat.sending")}
              >
                →
              </button>
            </>
          )}
        </div>
      </div>

      <p className="mt-4 text-xs" style={{ color: "var(--muted)" }}>
        {t("chat.hint")}
      </p>
      {micError && (
        <p
          className="mt-2 text-xs"
          style={{ color: "#FF5F57" }}
          role="alert"
        >
          {t("chat.micLog")}: {micError}
        </p>
      )}
    </section>
  );
}

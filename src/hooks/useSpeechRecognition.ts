"use client";

import { useCallback, useEffect, useRef, useState } from "react";

type SpeechState = "idle" | "requesting" | "recording" | "error";

interface SpeechRecognitionAlternative {
  transcript: string;
}

interface SpeechRecognitionResult {
  readonly [index: number]: SpeechRecognitionAlternative;
  readonly length: number;
  readonly isFinal: boolean;
}

interface SpeechRecognitionResultList {
  readonly [index: number]: SpeechRecognitionResult;
  readonly length: number;
}

interface SpeechRecognitionEvent extends Event {
  readonly results: SpeechRecognitionResultList;
  readonly resultIndex: number;
}

interface SpeechRecognitionErrorEvent extends Event {
  readonly error: string;
  readonly message?: string;
}

interface SpeechRecognitionInstance extends EventTarget {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  maxAlternatives: number;
  start(): void;
  stop(): void;
  abort(): void;
  onstart: (() => void) | null;
  onresult: ((e: SpeechRecognitionEvent) => void) | null;
  onend: (() => void) | null;
  onerror: ((e: SpeechRecognitionErrorEvent) => void) | null;
}

interface WindowWithSpeech extends Window {
  SpeechRecognition?: new () => SpeechRecognitionInstance;
  webkitSpeechRecognition?: new () => SpeechRecognitionInstance;
}

interface UseSpeechRecognitionReturn {
  supported: boolean;
  state: SpeechState;
  error: string | null;
  toggle: () => void;
}

type SpeechI18n = {
  lang: string;
  errDenied: string;
  errNoDevice: string;
  errNetwork: string;
  errStart: string;
};

const DEFAULT_I18N: SpeechI18n = {
  lang: "es-ES",
  errDenied: "Permiso de micrófono denegado",
  errNoDevice: "No se detecta ningún micrófono",
  errNetwork: "Error de red en el reconocimiento de voz",
  errStart: "No se pudo iniciar el micrófono",
};

export function useSpeechRecognition(
  onTranscript: (text: string) => void,
  i18n?: Partial<SpeechI18n>
): UseSpeechRecognitionReturn {
  const [supported, setSupported] = useState(false);
  const [state, setState] = useState<SpeechState>("idle");
  const [error, setError] = useState<string | null>(null);

  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);
  const onTranscriptRef = useRef(onTranscript);
  const isRecordingRef = useRef(false);
  const permissionGrantedRef = useRef(false);
  const i18nRef = useRef<SpeechI18n>({ ...DEFAULT_I18N, ...i18n });
  useEffect(() => {
    i18nRef.current = { ...DEFAULT_I18N, ...i18n };
  });

  useEffect(() => {
    onTranscriptRef.current = onTranscript;
  }, [onTranscript]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const w = window as WindowWithSpeech;
    const SR = w.SpeechRecognition ?? w.webkitSpeechRecognition;
    if (!SR) {
      setSupported(false);
      return;
    }

    setSupported(true);

    const rec = new SR();
    rec.lang = i18nRef.current.lang;
    rec.continuous = false;
    rec.interimResults = false;
    rec.maxAlternatives = 1;

    rec.onstart = () => {
      isRecordingRef.current = true;
      setState("recording");
      setError(null);
    };

    rec.onresult = (e: SpeechRecognitionEvent) => {
      const parts: string[] = [];
      for (let i = e.resultIndex ?? 0; i < e.results.length; i++) {
        const result = e.results[i];
        if (result.isFinal ?? true) {
          parts.push(result[0].transcript);
        }
      }
      const transcript = parts.join(" ").trim();
      if (transcript) onTranscriptRef.current(transcript);
    };

    rec.onend = () => {
      isRecordingRef.current = false;
      setState((prev) => (prev === "error" ? prev : "idle"));
    };

    rec.onerror = (e: SpeechRecognitionErrorEvent) => {
      isRecordingRef.current = false;
      const code = e.error || "unknown";

      if (code === "no-speech" || code === "aborted") {
        setState("idle");
        return;
      }

      if (code === "not-allowed" || code === "service-not-allowed") {
        permissionGrantedRef.current = false;
        setError(i18nRef.current.errDenied);
      } else if (code === "audio-capture") {
        setError(i18nRef.current.errNoDevice);
      } else if (code === "network") {
        setError(i18nRef.current.errNetwork);
      } else {
        setError(`Error: ${code}`);
      }

      setState("error");

      if (typeof console !== "undefined") {
        console.warn("[speech-recognition] error:", code, e.message);
      }

      setTimeout(() => {
        setState((prev) => (prev === "error" ? "idle" : prev));
        setError(null);
      }, 2500);
    };

    recognitionRef.current = rec;
    return () => {
      rec.onstart = null;
      rec.onresult = null;
      rec.onend = null;
      rec.onerror = null;
      try {
        rec.abort();
      } catch {
        // ignore
      }
      recognitionRef.current = null;
    };
  }, []);

  const isSafari = useCallback(() => {
    if (typeof window === "undefined") return false;
    const ua = window.navigator.userAgent;
    return /Safari/.test(ua) && !/Chrome/.test(ua);
  }, []);

  const startRecognition = useCallback((rec: SpeechRecognitionInstance) => {
    try {
      rec.start();
    } catch (err) {
      try {
        rec.abort();
        setTimeout(() => {
          try {
            rec.start();
          } catch (err2) {
            console.warn("[speech-recognition] retry start failed:", err2);
            setState("error");
            setError(i18nRef.current.errStart);
            setTimeout(() => { setState("idle"); setError(null); }, 2500);
          }
        }, 200);
      } catch {
        console.warn("[speech-recognition] start failed:", err);
        setState("error");
        setError(i18nRef.current.errStart);
        setTimeout(() => { setState("idle"); setError(null); }, 2500);
      }
    }
  }, []);

  const toggle = useCallback(async () => {
    const rec = recognitionRef.current;
    if (!rec) return;

    rec.lang = i18nRef.current.lang;

    if (isRecordingRef.current) {
      try { rec.stop(); } catch { try { rec.abort(); } catch { /* ignore */ } }
      return;
    }

    // Safari: arrancar directamente — pide permiso solo al llamar start()
    // Si usamos await getUserMedia antes, Safari pierde el contexto de gesto
    if (isSafari()) {
      setState("requesting");
      startRecognition(rec);
      return;
    }

    // Chrome y resto: pedir permiso explícitamente primero
    if (!permissionGrantedRef.current) {
      try {
        setState("requesting");
        if (navigator.mediaDevices?.getUserMedia) {
          const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
          stream.getTracks().forEach((t) => t.stop());
        }
        permissionGrantedRef.current = true;
      } catch (err) {
        setError(i18nRef.current.errDenied);
        setState("error");
        console.warn("[speech-recognition] getUserMedia failed:", err);
        setTimeout(() => { setState("idle"); setError(null); }, 2500);
        return;
      }
    }

    startRecognition(rec);
  }, [isSafari, startRecognition]);

  return { supported, state, error, toggle };
}

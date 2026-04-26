"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  type Locale,
  defaultLocale,
  dictionaries,
  readStoredLocale,
  storeLocale,
} from "@/i18n/dict";
import { makeT, langHtml, speechLang } from "@/lib/i18nT";

type I18nCtx = {
  locale: Locale;
  setLocale: (l: Locale) => void;
  t: ReturnType<typeof makeT>;
  docLang: string;
  speechRecognitionLang: string;
};

const Ctx = createContext<I18nCtx | null>(null);

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(defaultLocale);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setLocaleState(readStoredLocale());
    setReady(true);
  }, []);

  const setLocale = useCallback((l: Locale) => {
    setLocaleState(l);
    storeLocale(l);
  }, []);

  const t = useMemo(() => makeT(dictionaries[locale]), [locale]);

  useEffect(() => {
    if (!ready) return;
    const html = document.documentElement;
    html.setAttribute("lang", langHtml[locale]);
  }, [locale, ready]);

  useEffect(() => {
    if (!ready) return;
    const m = dictionaries[locale].meta;
    document.title = m.title;
    let el = document.querySelector('meta[name="description"]');
    if (!el) {
      el = document.createElement("meta");
      el.setAttribute("name", "description");
      document.head.appendChild(el);
    }
    el.setAttribute("content", m.description);
  }, [locale, ready]);

  const value = useMemo<I18nCtx>(
    () => ({
      locale,
      setLocale,
      t,
      docLang: langHtml[locale],
      speechRecognitionLang: speechLang[locale],
    }),
    [locale, setLocale, t]
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useI18n() {
  const c = useContext(Ctx);
  if (!c) throw new Error("useI18n must be used within I18nProvider");
  return c;
}

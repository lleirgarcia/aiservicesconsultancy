"use client";

import { useEffect, useState } from "react";
import dictES from "./dict/dict.es.json";
import dictCA from "./dict/dict.ca.json";
import dictEN from "./dict/dict.en.json";

type DictType = typeof dictES;

const DICTS: Record<string, DictType> = {
  es: dictES,
  ca: dictCA,
  en: dictEN,
};

export function useTranslations() {
  const [locale, setLocale] = useState<string>("es");

  useEffect(() => {
    const savedLocale = localStorage.getItem("kroomix-locale") || "es";
    setLocale(savedLocale);
  }, []);

  const dict = DICTS[locale] || DICTS.es;

  function t(key: string): string {
    const keys = key.split(".");
    let value: any = dict;

    for (const k of keys) {
      value = value?.[k];
    }

    return typeof value === "string" ? value : key;
  }

  return t;
}

"use client";

import React, { createContext, useContext, useState, useCallback, useMemo, useEffect, ReactNode, useRef } from "react";
import { Locale, defaultLocale, locales } from "./config";
import frMessages from "./locales/fr.json";

// ─── Types ────────────────────────────────────────────────────────────────────

type Messages = Record<string, unknown>;

interface TranslationContextType {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: string, params?: Record<string, string | number>) => string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getNestedValue(obj: Messages, path: string): string | undefined {
  const keys = path.split(".");
  let current: unknown = obj;
  for (const key of keys) {
    if (current == null || typeof current !== "object") return undefined;
    current = (current as Record<string, unknown>)[key];
  }
  return typeof current === "string" ? current : undefined;
}

function interpolate(template: string, params: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (_, key) =>
    params[key] !== undefined ? String(params[key]) : `{${key}}`
  );
}

// ─── Storage ──────────────────────────────────────────────────────────────────

const LOCALE_STORAGE_KEY = "playdex-locale";

function getStoredLocale(): Locale {
  if (typeof window === "undefined") return defaultLocale;
  const stored = localStorage.getItem(LOCALE_STORAGE_KEY);
  if (stored && (locales as readonly string[]).includes(stored)) return stored as Locale;
  return defaultLocale;
}

// ─── Lazy loader ──────────────────────────────────────────────────────────────

// Default locale is always bundled — other locales are loaded on demand
const messagesCache: Partial<Record<Locale, Messages>> = {
  fr: frMessages as Messages,
};

async function loadMessages(locale: Locale): Promise<Messages> {
  if (messagesCache[locale]) return messagesCache[locale]!;
  const mod = await import(`./locales/${locale}.json`);
  messagesCache[locale] = mod.default;
  return mod.default;
}

// ─── Context ──────────────────────────────────────────────────────────────────

const TranslationContext = createContext<TranslationContextType | undefined>(undefined);

export function TranslationProvider({ children }: { children: ReactNode }) {
  const initialLocale = useRef(getStoredLocale()).current;
  const [locale, setLocaleState] = useState<Locale>(initialLocale);
  // Initialize with cached messages if available (always true for 'fr', may be true for others on re-renders)
  const [messages, setMessages] = useState<Messages>(messagesCache[initialLocale] ?? frMessages as Messages);

  // Load messages when locale changes (no-op if already cached synchronously)
  useEffect(() => {
    let cancelled = false;
    loadMessages(locale).then((msgs) => {
      if (!cancelled) setMessages(msgs);
    });
    return () => { cancelled = true; };
  }, [locale]);

  const setLocale = useCallback((newLocale: Locale) => {
    setLocaleState(newLocale);
    localStorage.setItem(LOCALE_STORAGE_KEY, newLocale);
    document.documentElement.lang = newLocale;
  }, []);

  const t = useCallback(
    (key: string, params?: Record<string, string | number>): string => {
      const value = getNestedValue(messages, key);
      if (!value) return key;
      return params ? interpolate(value, params) : value;
    },
    [messages]
  );

  const value = useMemo(() => ({ locale, setLocale, t }), [locale, setLocale, t]);

  return (
    <TranslationContext.Provider value={value}>
      {children}
    </TranslationContext.Provider>
  );
}

export function useTranslation(): TranslationContextType {
  const ctx = useContext(TranslationContext);
  if (!ctx) throw new Error("useTranslation must be used within a TranslationProvider");
  return ctx;
}

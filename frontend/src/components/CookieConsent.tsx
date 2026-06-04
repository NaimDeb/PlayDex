"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useTranslation } from "@/i18n/TranslationProvider";

const CONSENT_KEY = "playdex-cookie-consent";

export function CookieConsent() {
  const [visible, setVisible] = useState(false);
  const { t } = useTranslation();

  useEffect(() => {
    const consent = localStorage.getItem(CONSENT_KEY);
    if (!consent) setVisible(true);
  }, []);

  const accept = () => {
    localStorage.setItem(CONSENT_KEY, "accepted");
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div role="dialog" aria-label={t("cookie.message")} className="fixed bottom-0 left-0 right-0 z-50 bg-[#1e1e1e] border-t border-gray-700 px-6 py-4 shadow-lg">
      <div className="container mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
        <p className="text-sm text-off-white/80">
          {t("cookie.message")}{" "}
          <Link href="/privacy" className="underline hover:text-primary transition-colors">
            {t("cookie.learnMore")}
          </Link>
        </p>
        <button
          onClick={accept}
          className="px-6 py-2 text-sm font-semibold bg-primary hover:bg-secondary text-white rounded transition-colors cursor-pointer whitespace-nowrap"
        >
          {t("cookie.accept")}
        </button>
      </div>
    </div>
  );
}

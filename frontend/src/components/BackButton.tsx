"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { useTranslation } from "@/i18n/TranslationProvider";

export function BackButton() {
  const router = useRouter();
  const { t } = useTranslation();

  return (
    <button
      onClick={() => router.back()}
      className="inline-flex items-center gap-1.5 text-sm text-off-white/70 hover:text-off-white transition-colors cursor-pointer mb-4"
      aria-label={t("common.back")}
    >
      <ArrowLeft className="w-4 h-4" />
      <span className="sm:inline hidden">{t("common.back")}</span>
    </button>
  );
}

"use client";

import { PageSection } from "@/components/PageSection";
import { useTranslation } from "@/i18n/TranslationProvider";

export default function TermsPage() {
  const { t } = useTranslation();

  return (
    <PageSection className="py-12">
      <div className="max-w-2xl mx-auto px-4">
        <h1 className="text-3xl font-bold mb-4">{t("legal.termsTitle")}</h1>
        <p className="mb-2">{t("legal.termsIntro")}</p>
        <h2 className="text-xl font-semibold mt-6 mb-2">{t("legal.platformUsageTitle")}</h2>
        <p className="mb-2">{t("legal.platformUsageText")}</p>
        <h2 className="text-xl font-semibold mt-6 mb-2">{t("legal.userContentTitle")}</h2>
        <p className="mb-2">{t("legal.userContentText")}</p>
        <h2 className="text-xl font-semibold mt-6 mb-2">{t("legal.termsChangeTitle")}</h2>
        <p>{t("legal.termsChangeText")}</p>
        <p>{t("legal.termsMore")}</p>
      </div>
    </PageSection>
  );
}

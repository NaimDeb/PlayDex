"use client";

import { PageSection } from "@/components/PageSection";
import { useTranslation } from "@/i18n/TranslationProvider";

export default function AboutPage() {
  const { t } = useTranslation();

  return (
    <PageSection className="py-12">
      <div className="max-w-2xl mx-auto px-4">
        <h1 className="text-3xl font-bold mb-4">{t("legal.aboutTitle")}</h1>
        <p className="mb-2">{t("legal.aboutIntro")}</p>
        <h2 className="text-xl font-semibold mt-6 mb-2">{t("legal.missionTitle")}</h2>
        <p className="mb-2">{t("legal.missionText")}</p>
        <h2 className="text-xl font-semibold mt-6 mb-2">{t("legal.teamTitle")}</h2>
        <p className="mb-2">{t("legal.teamText")}</p>
        <h2 className="text-xl font-semibold mt-6 mb-2">{t("legal.contactTitle")}</h2>
        <p>{t("legal.contactText")}</p>
      </div>
    </PageSection>
  );
}

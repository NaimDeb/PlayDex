"use client";

import { PageSection } from "@/components/PageSection";
import { useTranslation } from "@/i18n/TranslationProvider";

export default function PrivacyPage() {
  const { t } = useTranslation();

  return (
    <PageSection className="py-12">
      <div className="max-w-2xl mx-auto px-4">
        <h1 className="text-3xl font-bold mb-4">{t("legal.privacyTitle")}</h1>
        <p className="mb-2">{t("legal.privacyIntro")}</p>
        <h2 className="text-xl font-semibold mt-6 mb-2">{t("legal.dataCollectionTitle")}</h2>
        <p className="mb-2">{t("legal.dataCollectionText")}</p>
        <h2 className="text-xl font-semibold mt-6 mb-2">{t("legal.dataUsageTitle")}</h2>
        <p className="mb-2">{t("legal.dataUsageText")}</p>
        <h2 className="text-xl font-semibold mt-6 mb-2">{t("legal.securityTitle")}</h2>
        <p>{t("legal.securityText")}</p>
        <p>{t("legal.privacyMore")}</p>
      </div>
    </PageSection>
  );
}

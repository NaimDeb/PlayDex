"use client";

import { PageSection } from "@/components/PageSection";
import { useTranslation } from "@/i18n/TranslationProvider";

export default function CommunityGuidelinesPage() {
  const { t } = useTranslation();

  return (
    <PageSection className="py-12">
      <div className="max-w-2xl mx-auto px-4">
        <h1 className="text-3xl font-bold mb-4">{t("legal.guidelinesTitle")}</h1>
        <p className="mb-2">{t("legal.guidelinesIntro")}</p>
        <h2 className="text-xl font-semibold mt-6 mb-2">{t("legal.respectTitle")}</h2>
        <p className="mb-2">{t("legal.respectText")}</p>
        <h2 className="text-xl font-semibold mt-6 mb-2">{t("legal.forbiddenContentTitle")}</h2>
        <p className="mb-2">{t("legal.forbiddenContentText")}</p>
        <h2 className="text-xl font-semibold mt-6 mb-2">{t("legal.reportingTitle")}</h2>
        <p>{t("legal.reportingText")}</p>
        <p className="mt-4">{t("legal.guidelinesClosing")}</p>
      </div>
    </PageSection>
  );
}

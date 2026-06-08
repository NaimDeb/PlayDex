"use client";

import { PageSection } from "@/components/PageSection";
import { useTranslation } from "@/i18n/TranslationProvider";
import { Button } from "@heroui/button";

export default function OfflinePage() {
  const { t } = useTranslation();

  return (
    <PageSection className="py-12">
      <div className="max-w-2xl mx-auto px-4 text-center">
        <h1 className="text-3xl font-bold mb-4">{t("offline.title")}</h1>
        <p className="mb-4">{t("offline.intro")}</p>
        <p className="mb-6 text-sm text-gray-400">{t("offline.hint")}</p>
        <Button color="primary" onPress={() => window.location.reload()}>
          {t("offline.retry")}
        </Button>
      </div>
    </PageSection>
  );
}

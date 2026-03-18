"use client";
import ReportForm from "@/components/ReportForm";
import { useParams } from "next/navigation";
import { useTranslation } from "@/i18n/TranslationProvider";

export default function ReportModificationPage() {
  const { id } = useParams() as { id: string };
  const { t } = useTranslation();

  return (
    <>
      <h1 className="text-3xl font-montserrat font-bold mb-2">
        {t("report.modificationTitle")}
      </h1>
      <ReportForm
        reportableId={Number(id)}
        reportableEntity="Modification"
        successMessage={t("report.successModification")}
      />
    </>
  );
}

"use client";
import { useParams } from "next/navigation";
import ReportForm from "@/components/ReportForm";
import { useTranslation } from "@/i18n/TranslationProvider";

export default function ReportPatchnotePage() {
  const { id } = useParams() as { id: string };
  const { t } = useTranslation();

  return (
    <>
      <h1 className="text-3xl font-montserrat font-bold mb-2">
        {t("report.patchnoteTitle")}
      </h1>
      <ReportForm
        reportableId={Number(id)}
        reportableEntity="Patchnote"
        successMessage={t("report.successPatchnote")}
      />
    </>
  );
}

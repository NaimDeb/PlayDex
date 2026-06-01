"use client";
import { useParams } from "next/navigation";
import ReportForm from "@/components/ReportForm";

export default function ReportPatchnotePage() {
  const { id } = useParams() as { id: string };
  return (
    <>
      <h1 className="text-3xl font-montserrat font-bold mb-2">
        Signaler une patchnote
      </h1>
      <ReportForm
        reportableId={Number(id)}
        reportableEntity="Patchnote"
        successMessage="Merci d'avoir signalé cette patchnote."
      />
    </>
  );
}
"use client";
import ReportForm from "@/components/ReportForm";
import { useParams } from "next/navigation";

export default function ReportModificationPage() {
  const { id } = useParams() as { id: string };
  return (
    <>
      <h1 className="text-3xl font-montserrat font-bold mb-2">
        Signaler une modification
      </h1>
      <ReportForm
        reportableId={Number(id)}
        reportableEntity="Modification"
        successMessage="Merci d'avoir signalé cette modification."
      />
    </>
  );
}
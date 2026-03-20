"use client";

import React, { useState, useId } from "react";

// ─── Types ────────────────────────────────────────────────────────────────────

export type ReportableEntity = "Patchnote" | "Modification";

export type ReportOption = {
  value: string;
  label: string;
};

export type ReportFormProps = {
  reportableId: number;
  reportableEntity: ReportableEntity;
  successMessage: string;
};

// ─── Constants ────────────────────────────────────────────────────────────────

const REPORT_OPTIONS: Record<ReportableEntity, ReportOption[]> = {
  Modification: [
    { value: "off_topic",    label: "La modification est hors-sujet" },
    { value: "offensive",    label: "La modification contient des injures" },
    { value: "less_useful",  label: "La modification est moins utile que l'ancienne" },
    { value: "other",        label: "Autre raison" },
  ],
  Patchnote: [
    { value: "off_topic",    label: "Le patch note est hors-sujet" },
    { value: "offensive",    label: "Le patch note contient des injures" },
    { value: "inaccurate",   label: "Le patch note contient des informations incorrectes" },
    { value: "other",        label: "Autre raison" },
  ],
};

const ENTITY_LABELS: Record<ReportableEntity, string> = {
  Modification: "la modification",
  Patchnote:    "le patch note",
};

// ─── Sub-components ───────────────────────────────────────────────────────────

type RadioOptionProps = {
  id: string;
  name: string;
  value: string;
  label: string;
  checked: boolean;
  onChange: (value: string) => void;
};

function RadioOption({ id, name, value, label, checked, onChange }: RadioOptionProps) {
  return (
    <label
      htmlFor={id}
      className="flex items-center gap-3 cursor-pointer group select-none"
    >
      <input
        type="radio"
        id={id}
        name={name}
        value={value}
        checked={checked}
        onChange={() => onChange(value)}
        className="sr-only"
      />
      {/* Custom radio ring */}
      <span
        aria-hidden="true"
        className={[
          "inline-flex items-center justify-center w-[18px] h-[18px] shrink-0 rounded-full border-2 transition-colors duration-150",
          checked
            ? "border-primary"
            : "border-off-white/40 group-hover:border-off-white/70",
        ].join(" ")}
      >
        {checked && (
          <span className="w-[8px] h-[8px] rounded-full bg-primary block" />
        )}
      </span>
      <span className="text-off-white text-sm leading-none">{label}</span>
    </label>
  );
}

// ─── CheckboxField ────────────────────────────────────────────────────────────

type CheckboxFieldProps = {
  id: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  children: React.ReactNode;
};

function CheckboxField({ id, checked, onChange, children }: CheckboxFieldProps) {
  return (
    <label
      htmlFor={id}
      className="flex items-start gap-3 cursor-pointer group select-none"
    >
      <input
        type="checkbox"
        id={id}
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="sr-only"
      />
      {/* Custom checkbox */}
      <span
        aria-hidden="true"
        className={[
          "inline-flex items-center justify-center mt-[2px] w-[18px] h-[18px] shrink-0 border-2 transition-colors duration-150",
          checked
            ? "border-primary bg-primary"
            : "border-off-white/40 group-hover:border-off-white/70 bg-transparent",
        ].join(" ")}
      >
        {checked && (
          <svg
            viewBox="0 0 10 8"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="w-[10px] h-[8px]"
          >
            <path
              d="M1 4l3 3 5-6"
              stroke="#F0F0F0"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        )}
      </span>
      <span className="text-off-white/80 text-sm leading-relaxed">{children}</span>
    </label>
  );
}

// ─── SuccessBanner ────────────────────────────────────────────────────────────

function SuccessBanner({ message }: { message: string }) {
  return (
    <div
      role="status"
      className="mt-6 flex items-start gap-3 rounded-lg border border-primary/40 bg-primary/10 px-5 py-4"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 20 20"
        fill="currentColor"
        className="mt-0.5 h-5 w-5 shrink-0 text-primary"
        aria-hidden="true"
      >
        <path
          fillRule="evenodd"
          d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z"
          clipRule="evenodd"
        />
      </svg>
      <p className="text-off-white text-sm leading-relaxed">{message}</p>
    </div>
  );
}

// ─── ReportForm ───────────────────────────────────────────────────────────────

export default function ReportForm({
  reportableId,
  reportableEntity,
  successMessage,
}: ReportFormProps) {
  const uid = useId();

  const [selectedReason, setSelectedReason] = useState<string>("");
  const [customReason,   setCustomReason]   = useState<string>("");
  const [confirmed,      setConfirmed]      = useState<boolean>(false);
  const [isSubmitting,   setIsSubmitting]   = useState<boolean>(false);
  const [submitted,      setSubmitted]      = useState<boolean>(false);
  const [error,          setError]          = useState<string | null>(null);

  const options     = REPORT_OPTIONS[reportableEntity];
  const entityLabel = ENTITY_LABELS[reportableEntity];

  const isValid = selectedReason !== "" && confirmed;

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();
    if (!isValid || isSubmitting) return;

    setIsSubmitting(true);
    setError(null);

    try {
      // Replace with your actual API call, e.g.:
      // await reportService.submit({ reportableId, reportableEntity, reason: selectedReason, customReason });
      console.info("Submitting report", { reportableId, reportableEntity, selectedReason, customReason });

      // Simulate network delay in dev
      await new Promise<void>((resolve) => setTimeout(resolve, 600));

      setSubmitted(true);
    } catch {
      setError("Une erreur est survenue lors de l'envoi. Veuillez réessayer.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submitted) {
    return <SuccessBanner message={successMessage} />;
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="mt-4 space-y-7">
      {/* ── Description ─────────────────────────────────────────────────────── */}
      <p className="text-off-white/80 text-sm">
        Veuillez préciser pourquoi {entityLabel} enfreint nos règles communautaires
      </p>

      {/* ── Radio options ────────────────────────────────────────────────────── */}
      <fieldset className="space-y-[14px]">
        <legend className="sr-only">Raison du signalement</legend>
        {options.map((option) => (
          <RadioOption
            key={option.value}
            id={`${uid}-radio-${option.value}`}
            name={`${uid}-reason`}
            value={option.value}
            label={option.label}
            checked={selectedReason === option.value}
            onChange={setSelectedReason}
          />
        ))}
      </fieldset>

      {/* ── Textarea ─────────────────────────────────────────────────────────── */}
      <div className="space-y-3">
        <label
          htmlFor={`${uid}-custom-reason`}
          className="block text-off-white font-semibold text-lg font-montserrat"
        >
          Raison :
        </label>
        <textarea
          id={`${uid}-custom-reason`}
          value={customReason}
          onChange={(e) => setCustomReason(e.target.value)}
          rows={6}
          placeholder=""
          className={[
            "block w-full max-w-[612px] resize-none rounded-sm",
            "bg-[#3A3A3A] border border-[#4A4A4A]",
            "px-3 py-3 text-off-white text-sm",
            "placeholder:text-off-white/30",
            "focus:outline-none focus:border-primary/60",
            "transition-colors duration-150",
          ].join(" ")}
        />
      </div>

      {/* ── Good-faith checkbox ──────────────────────────────────────────────── */}
      <CheckboxField
        id={`${uid}-confirm`}
        checked={confirmed}
        onChange={setConfirmed}
      >
        Je confirme que mon signalement est fait de bonne foi et qu'il ne vise pas à
        dénigrer une personne. Je comprends qu'un usage abusif du système peut
        entraîner des sanctions sur mon compte.
      </CheckboxField>

      {/* ── Inline error ─────────────────────────────────────────────────────── */}
      {error !== null && (
        <p role="alert" className="text-red-400 text-sm">
          {error}
        </p>
      )}

      {/* ── Submit ───────────────────────────────────────────────────────────── */}
      <div className="pt-1">
        <button
          type="submit"
          disabled={!isValid || isSubmitting}
          className={[
            "inline-flex items-center justify-center",
            "px-10 py-[10px] rounded",
            "bg-primary hover:bg-secondary",
            "text-white font-semibold text-sm",
            "transition-colors duration-150",
            "disabled:opacity-50 disabled:cursor-not-allowed",
            "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary",
          ].join(" ")}
        >
          {isSubmitting ? (
            <>
              <svg
                className="mr-2 h-4 w-4 animate-spin"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8v8H4z"
                />
              </svg>
              Envoi en cours…
            </>
          ) : (
            "Signaler"
          )}
        </button>
      </div>
    </form>
  );
}
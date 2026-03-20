import React from "react";

export const FIELD_CLASS =
  "w-full bg-off-black border border-gray-600 rounded px-3 py-2.5 text-sm text-off-white " +
  "placeholder:text-gray-600 focus:outline-none focus:border-primary transition-colors [color-scheme:dark]";

export const LABEL_CLASS = "block text-sm font-semibold text-gray-300 mb-1.5";

interface FormFieldProps {
  label: string;
  htmlFor: string;
  required?: boolean;
  error?: string;
  children: React.ReactNode;
}

export function FormField({ label, htmlFor, required, error, children }: FormFieldProps): React.ReactElement {
  return (
    <div className="flex flex-col">
      <label htmlFor={htmlFor} className={LABEL_CLASS}>
        {label}
        {required && <span className="text-red-400 ml-0.5">*</span>}
      </label>
      {children}
      {error && (
        <p className="mt-1 text-xs text-red-400">{error}</p>
      )}
    </div>
  );
}

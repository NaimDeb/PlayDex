/**
 * Patchnote-related constants and types
 * @module constants/patchnote
 */

/** Available patchnote types */
export const PATCHNOTE_TYPES = [
  { label: "Patchnote majeure", value: "major" },
  { label: "Patchnote mineure", value: "minor" },
  { label: "Hotfix", value: "hotfix" },
  { label: "Nouvelle extension", value: "extension" },
] as const;

/** Type for patchnote type values */
export type PatchnoteType = typeof PATCHNOTE_TYPES[number]['value'];

/** Default content truncation length for patchnote previews */
export const PATCHNOTE_PREVIEW_LENGTH = 150;

/** Maximum content length for patchnote entries */
export const PATCHNOTE_MAX_LENGTH = 10000;

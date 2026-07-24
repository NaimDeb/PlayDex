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

/**
 * Badge and left-accent classes per importance.
 * Single source of truth so the patchnote cards and the patchnote detail page
 * stay on the same palette (primary / off-white / red — no stray purple).
 */
export const PATCHNOTE_IMPORTANCE_STYLES = {
  major: {
    badge: "bg-primary/20 text-primary border border-primary/40",
    accent: "border-l-primary",
  },
  minor: {
    badge: "bg-off-white/10 text-off-white/70 border border-off-white/20",
    accent: "border-l-off-white/30",
  },
  hotfix: {
    badge: "bg-red-500/20 text-red-400 border border-red-500/40",
    accent: "border-l-red-500",
  },
} as const;

/** Styles used when a patchnote has no importance set */
export const PATCHNOTE_IMPORTANCE_FALLBACK_STYLE = {
  badge: "bg-off-white/5 text-off-white/50 border border-off-white/15",
  accent: "border-l-off-white/15",
} as const;

/** Translation keys for each importance level */
export const PATCHNOTE_IMPORTANCE_I18N_KEYS: Record<string, string> = {
  major: "patchnote.patchMajor",
  minor: "patchnote.patchMinor",
  hotfix: "patchnote.hotfix",
};

/** Default content truncation length for patchnote previews */
export const PATCHNOTE_PREVIEW_LENGTH = 150;

/** Maximum content length for patchnote entries */
export const PATCHNOTE_MAX_LENGTH = 10000;

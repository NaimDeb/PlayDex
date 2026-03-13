"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";

// Champs optionnels pour ne pas casser les usages existants
interface PatchnoteCardProps {
  id?: number;
  title: string;
  content: string;
  releasedAt?: Date | string;
  importance?: string;
  lineCount?: number;
  // Champs stats (optionnels — affichés si fournis)
  changesCount?: number;
  buffsCount?: number;
  nerfsCount?: number;
}

const IMPORTANCE_LABELS: Record<string, string> = {
  major:  "Patch majeur",
  minor:  "Patch mineur",
  hotfix: "Hotfix",
};

const IMPORTANCE_COLORS: Record<string, string> = {
  major:  "bg-purple-600 text-purple-100",
  minor:  "bg-blue-700 text-blue-100",
  hotfix: "bg-orange-700 text-orange-100",
};

export function PatchnoteCard({ patchnote }: { patchnote: PatchnoteCardProps }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const pathname = usePathname();
  const patchnoteUrl = `${pathname.replace(/\/$/, "")}/patchnote/${patchnote.id}`;

  const truncated = patchnote.content.length > 200
    ? patchnote.content.substring(0, 200) + "…"
    : patchnote.content;

  const formattedDate = patchnote.releasedAt
    ? new Date(patchnote.releasedAt).toLocaleDateString("fr-FR")
    : null;

  const importanceLabel = patchnote.importance
    ? (IMPORTANCE_LABELS[patchnote.importance] ?? patchnote.importance)
    : null;

  const importanceColor = patchnote.importance
    ? (IMPORTANCE_COLORS[patchnote.importance] ?? "bg-gray-600 text-gray-200")
    : null;

  return (
    <article className="bg-[#2a2a2a] rounded-lg p-4 text-white relative">

      {/* ── Row 1 : title + menu ────────────────────────────── */}
      <div className="flex items-start justify-between gap-3 mb-1">
        <h3 className="font-bold text-base leading-snug">{patchnote.title}</h3>

        {/* ··· menu */}
        <div className="relative flex-shrink-0">
          <button
            className="text-gray-400 hover:text-white px-1 leading-none text-lg"
            onClick={() => setMenuOpen((v) => !v)}
            aria-label="Options"
          >
            •••
          </button>
          {menuOpen && (
            <ul className="absolute right-0 top-full mt-1 bg-[#1e1e1e] border border-gray-700
              rounded shadow-lg z-20 text-sm list-none p-1 min-w-[140px]">
              <li>
                <Link
                  href={patchnoteUrl}
                  className="block px-3 py-2 rounded hover:bg-[#2a2a2a] text-gray-300 hover:text-white"
                  onClick={() => setMenuOpen(false)}
                >
                  Voir la patchnote
                </Link>
              </li>
            </ul>
          )}
        </div>
      </div>

      {/* ── Row 2 : date + importance badge ─────────────────── */}
      <div className="flex items-center gap-3 mb-3">
        {formattedDate && (
          <span className="text-sm text-gray-400">
            Date&nbsp;: {formattedDate}
          </span>
        )}
        {importanceLabel && importanceColor && (
          <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${importanceColor}`}>
            {importanceLabel}
          </span>
        )}
      </div>

      {/* ── Row 3 : stats (changements / buffs / nerfs) ─────── */}
      {(patchnote.changesCount !== undefined ||
        patchnote.buffsCount   !== undefined ||
        patchnote.nerfsCount   !== undefined) && (
        <p className="text-sm text-gray-300 mb-3">
          {patchnote.changesCount !== undefined && (
            <span>{patchnote.changesCount} changements</span>
          )}
          {patchnote.buffsCount !== undefined && (
            <span className="text-green-400">
              {" "}•{" "}+{patchnote.buffsCount} buffs
            </span>
          )}
          {patchnote.nerfsCount !== undefined && (
            <span className="text-red-400">
              {" "}•{" "}-{patchnote.nerfsCount} nerfs
            </span>
          )}
        </p>
      )}

      {/* ── Row 4 : content (always truncated) ──────────────── */}
      <p className="text-sm text-gray-300 leading-relaxed whitespace-pre-line mb-4">
        {truncated}
      </p>

      {/* ── Row 5 : footer ──────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <span className="text-xs text-gray-500">
          {patchnote.lineCount ? `${patchnote.lineCount} lignes...` : ""}
        </span>

        <Link
          href={patchnoteUrl}
          className="px-4 py-1.5 text-sm font-semibold rounded
            bg-secondary hover:bg-primary text-white transition-colors"
          onClick={(e) => e.stopPropagation()}
        >
          Voir la patchnote →
        </Link>
      </div>

    </article>
  );
}
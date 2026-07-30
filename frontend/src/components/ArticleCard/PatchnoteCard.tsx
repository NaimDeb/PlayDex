"use client";

import { useRef, useState, useEffect, useMemo } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import ReactMarkdown from "react-markdown";
import rehypeRaw from "rehype-raw";
import { useTranslation } from "@/i18n/TranslationProvider";
import { colorizeContent, formatReleaseDate } from "@/lib/utils";
import {
  PATCHNOTE_IMPORTANCE_FALLBACK_STYLE,
  PATCHNOTE_IMPORTANCE_I18N_KEYS,
  PATCHNOTE_IMPORTANCE_STYLES,
} from "@/constants/patchnote.constants";

// Champs optionnels pour ne pas casser les usages existants
interface PatchnoteCardProps {
  id?: number;
  title: string;
  content: string;
  smallDescription?: string;
  releasedAt?: Date | string;
  importance?: string;
  lineCount?: number;
  // Champs stats (optionnels — affichés si fournis)
  changesCount?: number;
  buffsCount?: number;
  nerfsCount?: number;
  // Nom du jeu (optionnel — affiché si fourni, ex: sur la page d'accueil)
  gameName?: string;
}

interface PatchnoteCardComponentProps {
  patchnote: PatchnoteCardProps;
  baseUrl?: string;
}

/** Longueur max de l'aperçu, avant coupure sur une fin de ligne. */
const PREVIEW_MAX_LENGTH = 400;

/**
 * Rendu markdown compact de l'aperçu : mêmes règles que la page patchnote,
 * en plus petit. Sans ça, la card affichait la source markdown brute.
 */
const PREVIEW_MARKDOWN_COMPONENTS = {
  span: (props: React.ComponentPropsWithoutRef<"span">) => <span {...props} />,
  h1: ({ children }: { children?: React.ReactNode }) => (
    <h4 className="text-sm font-bold text-off-white mt-3 mb-1.5 first:mt-0">{children}</h4>
  ),
  h2: ({ children }: { children?: React.ReactNode }) => (
    <h4 className="text-sm font-bold text-off-white mt-3 mb-1.5 first:mt-0">{children}</h4>
  ),
  h3: ({ children }: { children?: React.ReactNode }) => (
    <h5 className="text-xs font-semibold text-off-white/80 mt-2 mb-1">{children}</h5>
  ),
  p: ({ children }: { children?: React.ReactNode }) => (
    <p className="mb-2 last:mb-0">{children}</p>
  ),
  ul: ({ children }: { children?: React.ReactNode }) => (
    <ul className="space-y-1 mb-2 list-none pl-0">{children}</ul>
  ),
  li: ({ children }: { children?: React.ReactNode }) => (
    <li className="flex items-start gap-2 leading-relaxed">
      <span aria-hidden="true" className="mt-[6px] shrink-0 w-1 h-1 rounded-full bg-off-white/30" />
      <span>{children}</span>
    </li>
  ),
  // Un lien dans l'aperçu ouvrirait une page hors du site au clic sur la card.
  a: ({ children }: { children?: React.ReactNode }) => (
    <span className="text-primary">{children}</span>
  ),
  img: () => null,
};

export function PatchnoteCard({ patchnote, baseUrl }: PatchnoteCardComponentProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();
  const { t } = useTranslation();
  const patchnoteUrl = baseUrl
    ? `${baseUrl.replace(/\/$/, "")}/patchnote/${patchnote.id}`
    : `${pathname.replace(/\/$/, "")}/patchnote/${patchnote.id}`;

  // Close menu on outside click
  useEffect(() => {
    if (!menuOpen) return;
    const handleClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [menuOpen]);

  // Aperçu markdown : on coupe sur une fin de ligne pour ne pas tronquer une
  // liste ou un titre au milieu, ce qui casserait le rendu.
  const preview = useMemo(() => {
    const raw = patchnote.content ?? "";
    if (raw.length <= PREVIEW_MAX_LENGTH) return colorizeContent(raw);

    const cut = raw.slice(0, PREVIEW_MAX_LENGTH);
    const lastBreak = cut.lastIndexOf("\n");
    return colorizeContent(`${lastBreak > 0 ? cut.slice(0, lastBreak) : cut}\n\n…`);
  }, [patchnote.content]);

  const formattedDate = patchnote.releasedAt
    ? formatReleaseDate(patchnote.releasedAt, "")
    : "";

  const importanceKey = patchnote.importance ?? "";
  const importanceLabel = PATCHNOTE_IMPORTANCE_I18N_KEYS[importanceKey]
    ? t(PATCHNOTE_IMPORTANCE_I18N_KEYS[importanceKey])
    : t("patchnote.undefined");

  const importanceStyle =
    PATCHNOTE_IMPORTANCE_STYLES[importanceKey as keyof typeof PATCHNOTE_IMPORTANCE_STYLES]
    ?? PATCHNOTE_IMPORTANCE_FALLBACK_STYLE;

  return (
    <article
      className={`bg-off-gray border border-off-white/10 border-l-4 ${importanceStyle.accent}
        rounded-sm p-4 text-off-white relative h-full flex flex-col overflow-hidden cursor-pointer`}
      onClick={() => window.location.href = patchnoteUrl}
    >

      {/* ── Row 0 : game name (if provided) ───────────────── */}
      {patchnote.gameName && (
        <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1 block">
          {patchnote.gameName}
        </span>
      )}

      {/* ── Row 1 : title + menu ────────────────────────────── */}
      <div className="flex items-start justify-between gap-3 mb-1">
        <h3 className="font-bold text-base leading-snug">{patchnote.title}</h3>

        {/* ··· menu */}
        <div className="relative flex-shrink-0" ref={menuRef}>
          <button
            className="text-off-white/50 hover:text-off-white px-1 leading-none text-lg"
            // Sans stopPropagation, le clic remonte jusqu'à la card et navigue
            // vers la patchnote au lieu d'ouvrir le menu.
            onClick={(e) => {
              e.stopPropagation();
              setMenuOpen((v) => !v);
            }}
            aria-label="Options"
          >
            •••
          </button>
          {menuOpen && (
            <ul className="absolute right-0 top-full mt-1 bg-[#1e1e1e] border border-gray-700
              rounded shadow-lg z-20 text-sm list-none p-1 min-w-[200px]">
              <li>
                <Link
                  href={`${patchnoteUrl}/edit`}
                  className="block px-3 py-2 rounded hover:bg-[#2a2a2a] text-gray-300 hover:text-white"
                  onClick={(e) => {
                    e.stopPropagation();
                    setMenuOpen(false);
                  }}
                >
                  {t("patchnote.edit")}
                </Link>
              </li>
              <li>
                <Link
                  href={`${patchnoteUrl}/modifications`}
                  className="block px-3 py-2 rounded hover:bg-[#2a2a2a] text-gray-300 hover:text-white"
                  onClick={(e) => {
                    e.stopPropagation();
                    setMenuOpen(false);
                  }}
                >
                  {t("patchnote.viewModifications")}
                </Link>
              </li>
              <li>
                <Link
                  href={`/report/patchnote/${patchnote.id}`}
                  className="block px-3 py-2 rounded hover:bg-[#2a2a2a] text-red-400 hover:text-red-300"
                  onClick={(e) => {
                    e.stopPropagation();
                    setMenuOpen(false);
                  }}
                >
                  {t("patchnote.report")}
                </Link>
              </li>
            </ul>
          )}
        </div>
      </div>

      {/* ── Row 2 : date + importance badge ─────────────────── */}
      <div className="flex flex-wrap items-center gap-3 mb-3">
        {formattedDate && (
          <span className="text-sm text-off-white/50">
            Date&nbsp;: {formattedDate}
          </span>
        )}
        <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-sm ${importanceStyle.badge}`}>
          {importanceLabel}
        </span>
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

      {/* ── Row 4 : résumé ──────────────────────────────────── */}
      {patchnote.smallDescription && (
        <p className="text-sm font-medium text-off-white/80 leading-relaxed mb-3">
          {patchnote.smallDescription}
        </p>
      )}

      {/* ── Row 5 : content preview (markdown, tronqué) ─────── */}
      <div className="prose prose-sm max-w-none text-sm text-off-white/70 leading-relaxed
        mb-4 max-h-40 overflow-hidden patchnote-content">
        <ReactMarkdown rehypePlugins={[rehypeRaw]} components={PREVIEW_MARKDOWN_COMPONENTS}>
          {preview}
        </ReactMarkdown>
      </div>

      {/* ── Row 6 : footer ──────────────────────────────────── */}
      <div className="flex items-center justify-between mt-auto">
        <span className="text-xs text-off-white/40">
          {patchnote.lineCount ? `${patchnote.lineCount} lignes...` : ""}
        </span>

        <Link
          href={patchnoteUrl}
          className="hidden sm:inline-flex items-center justify-center px-5 py-2 text-sm
            font-semibold font-montserrat bg-primary hover:bg-secondary text-off-white
            transition-colors duration-150"
          onClick={(e) => e.stopPropagation()}
        >
          {t("patchnote.viewPatchnote")}
        </Link>
      </div>

    </article>
  );
}
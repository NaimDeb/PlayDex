"use client";

import React, { useMemo, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import ReactMarkdown from "react-markdown";
import rehypeRaw from "rehype-raw";
import { usePatchnoteLayout } from "@/contexts/PatchnoteLayoutContext";
import { colorizeContent } from "@/lib/utils";
import { useTranslation } from "@/i18n/TranslationProvider";

// ─── Types ────────────────────────────────────────────────────────────────────

/**
 * Parsed statistics extracted from patchnote content.
 * Replace with API response shape once the endpoint is available.
 */
export type PatchnoteStats = {
  /** Total number of distinct change lines */
  changes: number;
  /** Lines tagged [buff] */
  buffs: number;
  /** Lines tagged [debuff] */
  nerfs: number;
};

export type PatchType = "Patch Majeur" | "Patch Mineur" | "Hotfix";

// ─── Constants ────────────────────────────────────────────────────────────────

const PATCH_TYPE_STYLES: Record<PatchType, { badge: string; accent: string }> = {
  "Patch Majeur": {
    badge:  "bg-primary/20 text-primary border border-primary/40",
    accent: "border-l-primary",
  },
  "Patch Mineur": {
    badge:  "bg-off-white/10 text-off-white/70 border border-off-white/20",
    accent: "border-l-off-white/30",
  },
  Hotfix: {
    badge:  "bg-red-500/20 text-red-400 border border-red-500/40",
    accent: "border-l-red-500",
  },
};

const FALLBACK_PATCH_TYPE: PatchType = "Patch Mineur";

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Counts buffs, nerfs and total changes from raw markdown content.
 * Can be replaced by an API call: `GET /api/patchnote/:id/stats` → PatchnoteStats
 */
function parsePatchnoteStats(content: string): PatchnoteStats {
  const buffMatches  = (content.match(/\[buff\]/gi)   ?? []).length;
  const nerfMatches  = (content.match(/\[debuff\]/gi) ?? []).length;

  // Each bullet line (starts with "- " or "* ") counts as one change
  const changeLines  = (content.match(/^[\-\*]\s+/gm) ?? []).length;
  const changes      = Math.max(changeLines, buffMatches + nerfMatches);

  return { changes, buffs: buffMatches, nerfs: nerfMatches };
}

function formatDate(dateString: string | undefined): string {
  if (!dateString) return "";
  return new Date(dateString).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function isPatchType(value: unknown): value is PatchType {
  return (
    value === "Patch Majeur" ||
    value === "Patch Mineur" ||
    value === "Hotfix"
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

type PatchBadgeProps = { type: PatchType };

function PatchBadge({ type }: PatchBadgeProps) {
  const styles = PATCH_TYPE_STYLES[type];
  return (
    <span
      className={[
        "inline-block px-2.5 py-0.5 text-xs font-semibold rounded-sm",
        styles.badge,
      ].join(" ")}
    >
      {type}
    </span>
  );
}

type StatsRowProps = { stats: PatchnoteStats };

function StatsRow({ stats }: StatsRowProps) {
  if (stats.changes === 0 && stats.buffs === 0 && stats.nerfs === 0) return null;

  return (
    <div className="flex items-center gap-1.5 text-xs text-off-white/50 flex-wrap">
      {stats.changes > 0 && (
        <span>{stats.changes} changement{stats.changes > 1 ? "s" : ""}</span>
      )}
      {stats.buffs > 0 && (
        <>
          <span aria-hidden="true">•</span>
          <span className="text-green-400">{stats.buffs} buff{stats.buffs > 1 ? "s" : ""}</span>
        </>
      )}
      {stats.nerfs > 0 && (
        <>
          <span aria-hidden="true">•</span>
          <span className="text-red-400">{stats.nerfs} nerf{stats.nerfs > 1 ? "s" : ""}</span>
        </>
      )}
    </div>
  );
}

type ActionButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "outlined-primary" | "outlined-warning";
  loading?: boolean;
  children: React.ReactNode;
};

function ActionButton({
  variant = "primary",
  loading = false,
  className = "",
  children,
  ...rest
}: ActionButtonProps) {
  const base =
    "inline-flex items-center justify-center px-5 py-2 text-sm font-semibold font-montserrat transition-colors duration-150 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:opacity-40 disabled:cursor-not-allowed min-w-[120px] cursor-pointer";

  const variants: Record<string, string> = {
    "primary":
      "bg-primary hover:bg-secondary text-off-white",
    "outlined-primary":
      "border border-primary text-primary hover:bg-primary/10",
    "outlined-warning":
      "border border-yellow-400 text-yellow-400 hover:bg-yellow-400/10",
  };

  return (
    <button className={[base, variants[variant], className].join(" ")} disabled={loading || rest.disabled} {...rest}>
      {loading ? (
        <svg className="w-5 h-5 animate-spin" viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeDasharray="31.4 31.4" strokeLinecap="round" />
        </svg>
      ) : children}
    </button>
  );
}

// ─── PatchnoteDetailPage ──────────────────────────────────────────────────────

export default function PatchnoteDetailPage() {
  const router             = useRouter();
  const { slug, id }       = useParams() as { slug: string; id: string };
  const { patchnote, game, loading } = usePatchnoteLayout();
  const { t }              = useTranslation();

  const patchType: PatchType = isPatchType(patchnote?.type)
    ? patchnote.type
    : FALLBACK_PATCH_TYPE;

  const typeStyles = PATCH_TYPE_STYLES[patchType];

  const stats = useMemo<PatchnoteStats>(
    () => parsePatchnoteStats(patchnote?.content ?? ""),
    [patchnote?.content]
  );

  const [loadingAction, setLoadingAction] = useState<string | null>(null);

  const handleAction = (key: string, path: string) => {
    setLoadingAction(key);
    router.push(path);
  };

  const formattedDate = formatDate(patchnote?.releasedAt ?? patchnote?.createdAt);
  const colorizedContent = useMemo(
    () => colorizeContent(patchnote?.content ?? ""),
    [patchnote?.content]
  );

  // ── Loading ────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[40vh] text-off-white/40 text-sm">
        {t("patchnote.loading")}
      </div>
    );
  }

  // ── Not found ─────────────────────────────────────────────────────────

  if (!patchnote || !game) {
    return (
      <div className="flex items-center justify-center min-h-[40vh] text-red-400 text-sm">
        {t("patchnote.notFound")}
      </div>
    );
  }

  // ── Render ─────────────────────────────────────────────────────────────

  return (
    <div className="container mx-auto px-4 sm:px-6 py-6 sm:py-10 max-w-5xl">

      {/* ── Back link ─────────────────────────────────────────────────────── */}
      <Link
        href={`/article/${slug}`}
        className="inline-flex items-center gap-1.5 text-sm text-off-white/60 hover:text-off-white transition-colors duration-150 mb-6 group"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 16 16"
          fill="currentColor"
          className="w-3.5 h-3.5 transition-transform duration-150 group-hover:-translate-x-0.5"
          aria-hidden="true"
        >
          <path
            fillRule="evenodd"
            d="M9.78 4.22a.75.75 0 010 1.06L7.06 8l2.72 2.72a.75.75 0 11-1.06 1.06L5.47 8.53a.75.75 0 010-1.06l3.25-3.25a.75.75 0 011.06 0z"
            clipRule="evenodd"
          />
        </svg>
        Retour
      </Link>

      {/* ── Game identity + action buttons ────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">

        {/* Game card */}
        <Link
          href={`/article/${slug}`}
          className="flex items-center gap-3 group w-fit"
        >
          {game.imageUrl && (
            <div className="relative w-[56px] h-[56px] sm:w-[72px] sm:h-[72px] shrink-0 overflow-hidden rounded-sm border border-off-white/10">
              <Image
                src={game.imageUrl}
                alt={game.title}
                fill
                className="object-cover"
                sizes="72px"
              />
            </div>
          )}
          <div>
            <p className="text-sm font-semibold text-off-white group-hover:text-primary transition-colors duration-150 leading-tight">
              Patch note pour : {game.title}
            </p>
            {game.studio && (
              <p className="text-xs text-off-white/50 mt-0.5">{game.studio}</p>
            )}
          </div>
        </Link>

        {/* Actions */}
        <div className="flex items-center gap-3 flex-wrap">
          <ActionButton
            variant="primary"
            loading={loadingAction === "edit"}
            onClick={() => handleAction("edit", `/article/${slug}/patchnote/${id}/edit`)}
          >
            {t("patchnote.edit")}
          </ActionButton>
          <ActionButton
            variant="outlined-warning"
            loading={loadingAction === "report"}
            onClick={() => handleAction("report", `/report/patchnote/${id}`)}
          >
            {t("patchnote.report")}
          </ActionButton>
          <ActionButton
            variant="outlined-primary"
            loading={loadingAction === "modifications"}
            onClick={() => handleAction("modifications", `/article/${slug}/patchnote/${id}/modifications`)}
          >
            {t("patchnote.viewModifications")}
          </ActionButton>
        </div>
      </div>

      {/* ── Main content card ─────────────────────────────────────────────── */}
      <article
        className={[
          "bg-off-gray border-2 border-off-white/10",
          "border-l-4",
          typeStyles.accent,
          "rounded-sm overflow-hidden",
        ].join(" ")}
        aria-label={`Patch note : ${patchnote.title}`}
      >
        {/* Card header */}
        <header className="px-6 pt-6 pb-5 border-b border-off-white/10 space-y-2">
          <h1 className="text-xl sm:text-2xl font-bold font-montserrat text-off-white leading-snug">
            {patchnote.title}
          </h1>

          <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5">
            {formattedDate && (
              <p className="text-xs text-off-white/50">
                Date de sortie :{" "}
                <time dateTime={patchnote.releasedAt ?? patchnote.createdAt}>
                  {formattedDate}
                </time>
              </p>
            )}
            <PatchBadge type={patchType} />
            <StatsRow stats={stats} />
          </div>
        </header>

        {/* Short description */}
        {patchnote.smallDescription && (
          <div className="px-6 py-5 border-b border-off-white/10">
            <p className="text-sm sm:text-base text-off-white/80 leading-relaxed font-medium">
              {patchnote.smallDescription}
            </p>
          </div>
        )}

        {/* Markdown body */}
        <div className="px-6 py-6">
          <div className="prose prose-sm sm:prose-base max-w-none text-off-white patchnote-content">
            <ReactMarkdown
              rehypePlugins={[rehypeRaw]}
              components={{
                span: (props) => <span {...props} />,
                // Style headers inside the markdown
                h2: ({ children }) => (
                  <h2 className="flex items-center gap-2 text-base font-bold text-off-white mt-6 mb-3 first:mt-0">
                    {children}
                  </h2>
                ),
                h3: ({ children }) => (
                  <h3 className="text-sm font-semibold text-off-white/80 mt-4 mb-2">
                    {children}
                  </h3>
                ),
                ul: ({ children }) => (
                  <ul className="space-y-1.5 mb-4 list-none pl-0">
                    {children}
                  </ul>
                ),
                li: ({ children }) => (
                  <li className="flex items-start gap-2 text-sm leading-relaxed">
                    <span aria-hidden="true" className="mt-[5px] shrink-0 w-1 h-1 rounded-full bg-off-white/30" />
                    <span>{children}</span>
                  </li>
                ),
              }}
              skipHtml={false}
            >
              {colorizedContent}
            </ReactMarkdown>
          </div>
        </div>
      </article>
    </div>
  );
}
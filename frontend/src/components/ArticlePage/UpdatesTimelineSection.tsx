"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import Image from "next/image";
import { useAuth } from "@/providers/AuthProvider";
import { useRouter } from "next/navigation";
import { Patchnote } from "@/types/patchNoteType";
import { Extension } from "@/types/gameType";
import { PatchnoteCard } from "@/components/ArticleCard/PatchnoteCard";

// ─── Types ────────────────────────────────────────────────────────────────────

interface UpdatesTimelineSectionProps {
  patchnotes?: Patchnote[];
  extensions?: Extension[];
  formatDateDifference: (date: Date | string) => string;
}

// Union discriminée — itemType est le seul discriminant, pas de cast unsafe
type PatchnoteItem = Patchnote & { itemType: "patchnote" };
type ExtensionItem = Extension & { itemType: "extension" };
type TimelineItem  = PatchnoteItem | ExtensionItem;

const PATCHNOTE_TYPES = [
  { label: "Patchnote majeure",  value: "major"     },
  { label: "Patchnote mineure",  value: "minor"     },
  { label: "Hotfix",             value: "hotfix"    },
  { label: "Nouvelle extension", value: "extension" },
] as const;

type PatchnoteTypeValue = (typeof PATCHNOTE_TYPES)[number]["value"];

// Normalise Date | string | undefined → string ISO sans cast
function toISO(date: Date | string | undefined): string {
  if (date === undefined || date === null) return new Date(0).toISOString();
  if (typeof date === "string") return date;
  return date.toISOString();
}

// Type-guard strict — évite tous les `as PatchnoteItem`
function isPatchnoteItem(item: TimelineItem): item is PatchnoteItem {
  return item.itemType === "patchnote";
}
function isExtensionItem(item: TimelineItem): item is ExtensionItem {
  return item.itemType === "extension";
}

// ─── SVG geometry (desktop uniquement) ───────────────────────────────────────
//
//  Colonnes desktop :
//    yr-label    : 0 → 60px
//    main-spine  : left=60px, width=3px  → centre abs X = 61.5px
//    SVG         : left=60px             → X0 = 1.5 dans repère SVG
//    sub-spine   : X1 = 37px dans SVG   → centre abs X = 97px
//    it-row      : padding-left = 96px  → centre petit dot = 96−4+5 = 97px ✓
//
const SVG_X0 = 1.5;  // centre main-spine dans repère SVG
const SVG_X1 = 37;   // centre sub-spine  dans repère SVG
const DIAG_H = 20;   // hauteur de la diagonale de départ (px)
const Y_DOT  = 12;   // centre gros dot depuis top de .tl-yr (top:5 + rayon:7)

// ─── Hook : dessine les SVG de bifurcation (desktop) ─────────────────────────

function useTimelineSVG(
  containerRef: React.RefObject<HTMLUListElement | null>,
  deps: unknown[]
): void {
  const drawAll = useCallback((): void => {
    const container = containerRef.current;
    if (!container) return;

    // Sur mobile on ne dessine rien
    if (window.innerWidth < 768) return;

    const spine = container.querySelector<HTMLElement>(".tl-main-spine");
    const yrEls = Array.from(container.querySelectorAll<HTMLElement>(".tl-yr"));

    // Arrête la spine CSS au centre du dernier gros dot
    if (spine !== null && yrEls.length > 0) {
      const lastDot = yrEls[yrEls.length - 1]?.querySelector<HTMLElement>(".tl-yr-dot");
      if (lastDot !== null && lastDot !== undefined) {
        const cRect = container.getBoundingClientRect();
        const dRect = lastDot.getBoundingClientRect();
        spine.style.height = `${dRect.top - cRect.top + dRect.height / 2}px`;
      }
    }

    yrEls.forEach((yr, idx): void => {
      const svg    = yr.querySelector<SVGSVGElement>(".tl-branch-svg");
      const elMask = yr.querySelector<SVGLineElement>(".tl-el-mask");
      const elThrd = yr.querySelector<SVGLineElement>(".tl-el-thread");
      const elPath = yr.querySelector<SVGPathElement>(".tl-el-branch");
      const items  = yr.querySelector<HTMLElement>(".tl-yr-items");
      if (svg === null || elMask === null || elThrd === null || elPath === null || items === null) return;

      if (items.style.display === "none") { svg.style.display = "none"; return; }

      const yrRect  = yr.getBoundingClientRect();
      const yrRow   = yr.querySelector<HTMLElement>(".tl-yr-row");
      const yrRowH  = yrRow?.offsetHeight ?? 0;
      const lastDot = items.querySelector<HTMLElement>("li:last-child .tl-it-dot-col");
      if (lastDot === null) { svg.style.display = "none"; return; }

      const ldRect = lastDot.getBoundingClientRect();
      // Centre du dernier petit dot : offset depuis top de .yr + top-inset(3) + rayon(5)
      const yEnd   = ldRect.top - yrRect.top + 3 + 5;

      // Fil fantôme prolongé jusqu'au centre du prochain gros dot
      let yNextDot  = yEnd;
      const nextYr  = yrEls[idx + 1] ?? null;
      if (nextYr !== null) {
        const ndEl = nextYr.querySelector<HTMLElement>(".tl-yr-dot");
        if (ndEl !== null) {
          const ndRect = ndEl.getBoundingClientRect();
          yNextDot = ndRect.top - yrRect.top + ndRect.height / 2;
        }
      }

      const yStart = yrRowH;
      const y1     = yStart + DIAG_H;

      svg.setAttribute("height", String(yNextDot + 4));
      svg.style.display = "block";

      const setLine = (el: SVGLineElement, x1: number, yy1: number, x2: number, yy2: number): void => {
        el.setAttribute("x1", String(x1)); el.setAttribute("y1", String(yy1));
        el.setAttribute("x2", String(x2)); el.setAttribute("y2", String(yy2));
      };

      // 1. Masque noir — efface la spine CSS sur toute la zone de bifurcation
      setLine(elMask, SVG_X0, Y_DOT, SVG_X0, yNextDot);
      // 2. Fil fantôme — guide l'œil jusqu'au prochain gros dot
      setLine(elThrd, SVG_X0, Y_DOT, SVG_X0, yNextDot);
      // 3. Branche blanche — dot → bas card → diagonale → sub-spine → dernier petit dot
      elPath.setAttribute("d",
        `M ${SVG_X0} ${Y_DOT} L ${SVG_X0} ${yStart} L ${SVG_X1} ${y1} L ${SVG_X1} ${yEnd}`
      );
    });
  // containerRef est stable, pas besoin dans les deps
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [containerRef]);

  useEffect((): (() => void) => {
    const id = setTimeout(drawAll, 20);
    return () => clearTimeout(id);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [drawAll, ...deps]);

  useEffect((): (() => void) => {
    const observer = new ResizeObserver(drawAll);
    if (containerRef.current !== null) observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, [drawAll, containerRef]);
}

// ─── Composant principal ──────────────────────────────────────────────────────

export const UpdatesTimelineSection: React.FC<UpdatesTimelineSectionProps> = ({
  patchnotes = [],
  extensions = [],
  formatDateDifference,
}) => {
  const { isAuthenticated } = useAuth();
  const router              = useRouter();

  const [dateFrom,     setDateFrom]     = useState<string>("");
  const [dateTo,       setDateTo]       = useState<string>("");
  const [checkedTypes, setCheckedTypes] = useState<PatchnoteTypeValue[]>(
    PATCHNOTE_TYPES.map((t) => t.value)
  );
  const [openYears, setOpenYears] = useState<Record<number, boolean>>({});

  const containerRef = useRef<HTMLUListElement>(null);

  // ── Data pipeline ──────────────────────────────────────────────────────────

  const allItems: TimelineItem[] = [
    ...patchnotes.map((p): PatchnoteItem => ({ ...p, itemType: "patchnote" })),
    ...extensions.map((e): ExtensionItem => ({ ...e, itemType: "extension" })),
  ];

  const filtered = allItems.filter((item): boolean => {
    const d       = new Date(toISO(item.releasedAt));
    const typeKey: string = isExtensionItem(item)
      ? "extension"
      : item.importance ?? "";
    return (
      (!dateFrom || d >= new Date(dateFrom)) &&
      (!dateTo   || d <= new Date(dateTo))   &&
      checkedTypes.includes(typeKey as PatchnoteTypeValue)
    );
  });

  const groupedByYear = filtered.reduce<Record<number, TimelineItem[]>>((acc, item) => {
    const y = new Date(toISO(item.releasedAt)).getFullYear();
    (acc[y] ??= []).push(item);
    return acc;
  }, {});

  const years       = Object.keys(groupedByYear).map(Number).sort((a, b) => b - a);
  const currentYear = new Date().getFullYear();

  const isYearOpen = (year: number): boolean => year === currentYear || !!openYears[year];
  const toggleYear = (year: number): void => {
    if (year === currentYear) return;
    setOpenYears((prev) => ({ ...prev, [year]: !prev[year] }));
  };

  const toggleType = (value: PatchnoteTypeValue): void => {
    setCheckedTypes((prev) =>
      prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value]
    );
  };

  useTimelineSVG(containerRef, [openYears, years]);

  const [addLoading, setAddLoading] = useState(false);

  const handleAddPatchnote = (): void => {
    setAddLoading(true);
    if (!isAuthenticated) { void router.push("/login"); return; }
    const path = typeof window !== "undefined" ? window.location.pathname : "";
    void router.push(`${path}/patchnote/new`);
  };

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <section aria-labelledby="timeline-heading">

      {/* ── Header ── */}
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <h2 id="timeline-heading" className="text-3xl font-bold font-montserrat text-nowrap">
          Dernières mises à jours
        </h2>
        <button
          type="button"
          onClick={handleAddPatchnote}
          disabled={addLoading}
          className="px-4 py-2 font-bold transition duration-200 rounded bg-secondary hover:bg-primary text-off-white disabled:opacity-60 min-w-[200px]"
        >
          {addLoading ? (
            <svg className="w-5 h-5 mx-auto animate-spin" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeDasharray="31.4 31.4" strokeLinecap="round" />
            </svg>
          ) : (
            isAuthenticated ? "Ajouter une patchnote" : "Connectez-vous pour ajouter"
          )}
        </button>
      </header>

      {/* ── Filtres ── */}
      <fieldset className="flex flex-col gap-4 mb-8 p-4 bg-off-gray rounded-lg border-0">
        <legend className="sr-only">Filtrer les mises à jour</legend>

        {/* Filtre dates */}
        <div className="flex gap-4 flex-wrap">
          {(["Du", "Au"] as const).map((label) => {
            const val    = label === "Du" ? dateFrom : dateTo;
            const setter = label === "Du" ? setDateFrom : setDateTo;
            const inputId = `date-filter-${label.toLowerCase()}`;
            return (
              <div key={label} className="relative">
                <label htmlFor={inputId} className="block mb-1 text-sm">
                  {label}
                </label>
                <input
                  id={inputId}
                  type="date"
                  className="p-2 pr-7 rounded bg-[#2a2a2a] border border-gray-600 text-off-white focus:outline-none focus:ring-2 focus:ring-secondary text-sm"
                  value={val}
                  onChange={(e) => setter(e.target.value)}
                />
                {val !== "" && (
                  <button
                    type="button"
                    className="absolute right-2 top-[60%] -translate-y-1/2 text-gray-400 hover:text-white"
                    onClick={() => setter("")}
                    aria-label={`Effacer filtre ${label}`}
                  >
                    ✕
                  </button>
                )}
              </div>
            );
          })}
        </div>

        {/* Filtre types */}
        <div className="flex gap-4 flex-wrap" role="group" aria-label="Types de mise à jour">
          {PATCHNOTE_TYPES.map((t) => (
            <label key={t.value} className="flex items-center gap-2 text-sm cursor-pointer select-none">
              <input
                type="checkbox"
                className="accent-secondary"
                checked={checkedTypes.includes(t.value)}
                onChange={() => toggleType(t.value)}
              />
              {t.label}
            </label>
          ))}
        </div>
      </fieldset>

      {/* ── Timeline ── */}
      {years.length === 0 ? (
        <p className="text-gray-500">
          Aucune mise à jour répertoriée.{" "}
          <button type="button" onClick={handleAddPatchnote} className="underline text-secondary">
            Ajoutez-en une !
          </button>
        </p>
      ) : (
        <ul
          ref={containerRef}
          className="relative list-none p-0 pb-8"
          aria-label="Historique des mises à jour"
        >
          {/* Spine principale CSS — height gérée par useTimelineSVG, hidden sur mobile */}
          <div
            aria-hidden="true"
            className="tl-main-spine absolute top-0 left-[60px] w-[3px] bg-white/80 z-0 hidden md:block"
            style={{ height: 0 }}
          />

          {years.map((year) => {
            const yearItems   = groupedByYear[year] ?? [];
            const isOpen      = isYearOpen(year);
            const sorted      = [...yearItems].sort(
              (a, b) => new Date(toISO(b.releasedAt)).getTime() - new Date(toISO(a.releasedAt)).getTime()
            );

            const extItems    = yearItems.filter(isExtensionItem);
            const majorCount  = yearItems.filter((i) => isPatchnoteItem(i) && i.importance === "major").length;
            const minorCount  = yearItems.filter((i) => isPatchnoteItem(i) && i.importance === "minor").length;
            const hotfixCount = yearItems.filter((i) => isPatchnoteItem(i) && i.importance === "hotfix").length;

            return (
              <li key={year} className="tl-yr relative mb-[2px]">

                {/* SVG branche — desktop uniquement, aria-hidden car purement décoratif */}
                <svg
                  aria-hidden="true"
                  className="tl-branch-svg absolute top-0 left-[60px] w-[60px] pointer-events-none z-[1] hidden md:block"
                  style={{ display: "none", overflow: "visible" }}
                >
                  <line className="tl-el-mask"   stroke="#111" strokeWidth="5" />
                  <line className="tl-el-thread" stroke="rgba(255,255,255,0.20)" strokeWidth="1.5" />
                  <path className="tl-el-branch" fill="none" stroke="rgba(255,255,255,0.85)" strokeWidth="2.5" strokeLinecap="square" strokeLinejoin="miter" />
                </svg>

                {/* ── Ligne année — desktop avec spine / mobile sans ── */}
                <div className="tl-yr-row flex items-start relative z-[2]">

                  {/* Label année — desktop seulement (mobile: dans le bouton) */}
                  <div
                    aria-hidden="true"
                    className="hidden md:block w-[60px] flex-shrink-0 pr-[10px] pt-[8px] text-right text-[13px] font-medium text-white"
                  >
                    {year}
                  </div>

                  {/* Gros dot — desktop seulement */}
                  <div aria-hidden="true" className="hidden md:block w-[3px] flex-shrink-0 relative z-[3]">
                    <div className="tl-yr-dot absolute w-[14px] h-[14px] rounded-full bg-white border-[3px] border-[#111] left-[-5px] top-[5px]" />
                  </div>

                  {/* Bouton résumé */}
                  <button
                    type="button"
                    className={[
                      "flex-1 md:ml-[18px]",
                      "bg-[#1c1c1c] border border-white/10 rounded-lg",
                      "px-[14px] py-[9px] text-[#ccc] text-xs font-medium text-left",
                      "flex items-start justify-between gap-2",
                      year !== currentYear ? "cursor-pointer hover:bg-[#222]" : "cursor-default",
                    ].join(" ")}
                    onClick={() => toggleYear(year)}
                    disabled={year === currentYear}
                    aria-expanded={isOpen}
                    aria-controls={`yr-items-${year}`}
                  >
                    <div className="flex-1">
                      {/* Année visible sur mobile dans le bouton */}
                      <span className="md:hidden font-bold text-white mr-2">{year}</span>
                      <span>
                        {extItems.length   > 0 && <>{extItems.length} extension{extItems.length > 1 ? "s" : ""}&nbsp;·&nbsp;</>}
                        {majorCount        > 0 && <>{majorCount} majeure{majorCount > 1 ? "s" : ""}&nbsp;·&nbsp;</>}
                        {minorCount        > 0 && <>{minorCount} mineure{minorCount > 1 ? "s" : ""}&nbsp;·&nbsp;</>}
                        {hotfixCount       > 0 && <>{hotfixCount} hotfix{hotfixCount > 1 ? "es" : ""}</>}
                      </span>
                      {extItems.length > 0 && (
                        <div className="flex gap-[5px] mt-2 overflow-hidden" aria-hidden="true">
                          {extItems.slice(0, 6).map((ext) => (
                            <div
                              key={ext.id}
                              className="w-[46px] h-[66px] rounded flex-shrink-0 bg-[#2c2c2c] overflow-hidden"
                            >
                              <Image
                                src={ext.imageUrl ?? ""}
                                alt=""
                                width={46}
                                height={66}
                                className="object-cover w-full h-full"
                              />
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                    {year !== currentYear && (
                      <span aria-hidden="true" className="text-[#888] text-[9px] flex-shrink-0 mt-[2px]">
                        {isOpen ? "▲" : "▼"}
                      </span>
                    )}
                  </button>
                </div>

                {/* ── Items ── */}
                <ul
                  id={`yr-items-${year}`}
                  className={[
                    "tl-yr-items list-none p-0",
                    // Mobile : simple liste avec border-left
                    "md:block",
                    isOpen ? "block" : "hidden",
                  ].join(" ")}
                  aria-label={`Mises à jour ${year}`}
                  // Pour le hook SVG qui vérifie display (desktop)
                  style={{ display: isOpen ? "block" : "none" }}
                >
                  {sorted.map((item, idx) => {
                    const iso     = toISO(item.releasedAt);
                    const dateStr = new Date(iso).toLocaleDateString("fr-FR");
                    const diffStr = formatDateDifference(iso);

                    return (
                      <li
                        key={`${String(item.id)}-${item.itemType}`}
                        className={[
                          "flex items-start",
                          // Desktop : padding-left pour aligner sur sub-spine
                          "md:pl-[96px]",
                          // Mobile : indentation légère + border-left colorée
                          "pl-4 ml-2 border-l-2 border-white/10",
                          "md:border-l-0 md:ml-0",
                        ].join(" ")}
                        style={{
                          paddingTop:    idx === 0 ? "22px" : "14px",
                          paddingBottom: "10px",
                        }}
                      >
                        {/* Petit dot — desktop uniquement */}
                        <div
                          aria-hidden="true"
                          className="tl-it-dot-col hidden md:block w-[2px] flex-shrink-0 relative z-[3]"
                        >
                          <div className="absolute w-[10px] h-[10px] rounded-full bg-[#ddd] border-[2px] border-[#111] left-[-4px] top-[3px]" />
                        </div>

                        {/* Contenu */}
                        <div className="flex-1 md:pl-[16px]">
                          {/* Date inline */}
                          <div className="flex gap-2 items-baseline mb-[5px]">
                            <time dateTime={iso} className="text-[10px] text-gray-500">
                              {dateStr}
                            </time>
                            <span className="text-[9px] text-gray-600">{diffStr}</span>
                          </div>

                          {isExtensionItem(item) ? (
                            <article className="bg-[#1a1a1a] rounded-lg p-3 flex items-center gap-3 border border-white/[0.07]">
                              <figure className="w-9 h-[54px] bg-[#2a2a2a] rounded flex-shrink-0 overflow-hidden m-0">
                                <Image
                                  src={item.imageUrl ?? ""}
                                  alt={item.title}
                                  width={36}
                                  height={54}
                                  className="object-cover w-full h-full"
                                />
                              </figure>
                              <div>
                                <p className="text-[9px] font-medium text-teal-400 uppercase tracking-wider mb-[2px]">
                                  Nouveau DLC
                                </p>
                                <p className="text-xs font-medium text-white">{item.title}</p>
                                <p className="text-[10px] text-gray-500 mt-[1px]">
                                  Sortie : {dateStr}
                                </p>
                              </div>
                            </article>
                          ) : (
                            <PatchnoteCard patchnote={item} />
                          )}
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
};
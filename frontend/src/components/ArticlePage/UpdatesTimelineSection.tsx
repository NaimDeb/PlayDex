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

type PatchnoteItem = Patchnote & { itemType: "patchnote" };
type ExtensionItem = Extension & { itemType: "extension" };
type TimelineItem  = PatchnoteItem | ExtensionItem;

const PATCHNOTE_TYPES = [
  { label: "Patchnote majeure",  value: "major"     },
  { label: "Patchnote mineure",  value: "minor"     },
  { label: "Hotfix",             value: "hotfix"    },
  { label: "Nouvelle extension", value: "extension" },
] as const;

function toISO(date: Date | string | undefined): string {
  if (!date) return new Date(0).toISOString();
  if (typeof date === "string") return date;
  return date.toISOString();
}

// ─── SVG geometry ─────────────────────────────────────────────────────────────
// main-spine left = 60px, width = 3px → centre abs = 61.5px
// SVG left = 60px → X0 = 1.5 dans le repère SVG
// sub-spine à +37px dans SVG → centre abs = 97px
// it-row padding-left = 96px → centre dot = 96 + 0 - 4 + 5 = 97px ✓
const SVG_X0 = 1.5;
const SVG_X1 = 37;
const DIAG_H = 20;  // hauteur de la diagonale de départ
const Y_DOT  = 12;  // centre gros dot depuis top de .tl-yr (dot: top=5, rayon=7)

// ─── Hook SVG ─────────────────────────────────────────────────────────────────

function useTimelineSVG(
  containerRef: React.RefObject<HTMLUListElement | null>,
  deps: unknown[]
) {
  const drawAll = useCallback(() => {
    const container = containerRef.current;
    if (!container) return;

    const spine = container.querySelector<HTMLElement>(".tl-main-spine");
    const yrEls = Array.from(container.querySelectorAll<HTMLElement>(".tl-yr"));

    // Arrête la spine au centre du dernier gros dot
    if (spine && yrEls.length > 0) {
      const lastDot = yrEls[yrEls.length - 1].querySelector<HTMLElement>(".tl-yr-dot");
      if (lastDot) {
        const cRect = container.getBoundingClientRect();
        const dRect = lastDot.getBoundingClientRect();
        spine.style.height = `${dRect.top - cRect.top + dRect.height / 2}px`;
      }
    }

    yrEls.forEach((yr, idx) => {
      const svg    = yr.querySelector<SVGSVGElement>(".tl-branch-svg");
      const elMask = yr.querySelector<SVGLineElement>(".tl-el-mask");
      const elThrd = yr.querySelector<SVGLineElement>(".tl-el-thread");
      const elPath = yr.querySelector<SVGPathElement>(".tl-el-branch");
      const items  = yr.querySelector<HTMLElement>(".tl-yr-items");
      if (!svg || !elMask || !elThrd || !elPath || !items) return;

      if (items.style.display === "none") { svg.style.display = "none"; return; }

      const yrRect  = yr.getBoundingClientRect();
      const yrRowH  = (yr.querySelector<HTMLElement>(".tl-yr-row")?.offsetHeight ?? 0);
      const lastDot = items.querySelector<HTMLElement>("li:last-child .tl-it-dot-col");
      if (!lastDot) { svg.style.display = "none"; return; }

      const ldRect  = lastDot.getBoundingClientRect();
      const yEnd    = ldRect.top - yrRect.top + 3 + 5; // offset-top + rayon petit dot

      // Fil fantôme jusqu'au prochain gros dot (ou yEnd si dernier)
      let yNextDot  = yEnd;
      const nextYr  = yrEls[idx + 1] ?? null;
      if (nextYr) {
        const ndEl   = nextYr.querySelector<HTMLElement>(".tl-yr-dot");
        if (ndEl) {
          const ndRect = ndEl.getBoundingClientRect();
          yNextDot = ndRect.top - yrRect.top + ndRect.height / 2;
        }
      }

      const yStart = yrRowH;
      const y1     = yStart + DIAG_H;

      svg.setAttribute("height", String(yNextDot + 4));
      svg.style.display = "block";

      const setLine = (el: SVGLineElement, x1: number, yy1: number, x2: number, yy2: number) => {
        el.setAttribute("x1", String(x1)); el.setAttribute("y1", String(yy1));
        el.setAttribute("x2", String(x2)); el.setAttribute("y2", String(yy2));
      };

      setLine(elMask, SVG_X0, Y_DOT, SVG_X0, yNextDot);
      setLine(elThrd, SVG_X0, Y_DOT, SVG_X0, yNextDot);
      elPath.setAttribute("d",
        `M ${SVG_X0} ${Y_DOT} L ${SVG_X0} ${yStart} L ${SVG_X1} ${y1} L ${SVG_X1} ${yEnd}`
      );
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [containerRef]);

  useEffect(() => {
    const id = setTimeout(drawAll, 20);
    return () => clearTimeout(id);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [drawAll, ...deps]);

  useEffect(() => {
    const observer = new ResizeObserver(drawAll);
    if (containerRef.current) observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, [drawAll, containerRef]);
}

// ─── Composant ────────────────────────────────────────────────────────────────

export const UpdatesTimelineSection: React.FC<UpdatesTimelineSectionProps> = ({
  patchnotes = [],
  extensions = [],
  formatDateDifference,
}) => {
  const { isAuthenticated } = useAuth();
  const router              = useRouter();

  const [dateFrom,     setDateFrom]     = useState<string>("");
  const [dateTo,       setDateTo]       = useState<string>("");
  const [checkedTypes, setCheckedTypes] = useState<string[]>(
    PATCHNOTE_TYPES.map((t) => t.value)
  );
  const [openYears, setOpenYears] = useState<Record<number, boolean>>({});

  const containerRef = useRef<HTMLUListElement>(null);

  const allItems: TimelineItem[] = [
    ...patchnotes.map((p): PatchnoteItem => ({ ...p, itemType: "patchnote" })),
    ...extensions.map((e): ExtensionItem => ({ ...e, itemType: "extension" })),
  ];

  const filtered = allItems.filter((item) => {
    const d       = new Date(toISO(item.releasedAt));
    const typeKey = item.itemType === "extension"
      ? "extension"
      : (item as PatchnoteItem).importance ?? "";
    return (
      (!dateFrom || d >= new Date(dateFrom)) &&
      (!dateTo   || d <= new Date(dateTo))   &&
      checkedTypes.includes(typeKey)
    );
  });

  const groupedByYear = filtered.reduce<Record<number, TimelineItem[]>>((acc, item) => {
    const y = new Date(toISO(item.releasedAt)).getFullYear();
    (acc[y] ??= []).push(item);
    return acc;
  }, {});

  const years       = Object.keys(groupedByYear).map(Number).sort((a, b) => b - a);
  const currentYear = new Date().getFullYear();

  const isYearOpen  = (year: number) => year === currentYear || !!openYears[year];
  const toggleYear  = (year: number) => {
    if (year === currentYear) return;
    setOpenYears((prev) => ({ ...prev, [year]: !prev[year] }));
  };

  useTimelineSVG(containerRef, [openYears, years]);

  const handleAddPatchnote = () => {
    if (!isAuthenticated) { router.push("/login"); return; }
    const path = typeof window !== "undefined" ? window.location.pathname : "";
    router.push(`${path}/patchnote/new`);
  };

  return (
    <section>
      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <h2 className="text-3xl font-bold font-montserrat text-nowrap">
          Dernières mises à jours
        </h2>
        <button
          onClick={handleAddPatchnote}
          className="px-4 py-2 font-bold transition duration-200 rounded bg-secondary hover:bg-primary text-off-white"
        >
          {isAuthenticated ? "Ajouter une patchnote" : "Connectez-vous pour ajouter"}
        </button>
      </div>

      {/* ── Filtres ── */}
      <div className="flex flex-col gap-4 mb-8 p-4 bg-off-gray rounded-lg">
        <div className="flex gap-4 flex-wrap">
          {(["Du", "Au"] as const).map((label) => {
            const val    = label === "Du" ? dateFrom : dateTo;
            const setter = label === "Du" ? setDateFrom : setDateTo;
            return (
              <div key={label} className="relative">
                <label className="block mb-1 text-sm">{label}</label>
                <input
                  type="date"
                  className="p-2 pr-7 rounded bg-[#2a2a2a] border border-gray-600 text-off-white focus:outline-none focus:ring-2 focus:ring-secondary text-sm"
                  value={val}
                  onChange={(e) => setter(e.target.value)}
                />
                {val && (
                  <button
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
        <div className="flex gap-4 flex-wrap">
          {PATCHNOTE_TYPES.map((t) => (
            <label key={t.value} className="flex items-center gap-2 text-sm cursor-pointer select-none">
              <input
                type="checkbox"
                className="accent-secondary"
                checked={checkedTypes.includes(t.value)}
                onChange={() =>
                  setCheckedTypes((prev) =>
                    prev.includes(t.value)
                      ? prev.filter((v) => v !== t.value)
                      : [...prev, t.value]
                  )
                }
              />
              {t.label}
            </label>
          ))}
        </div>
      </div>

      {/* ── Timeline ── */}
      {years.length === 0 ? (
        <p className="text-gray-500">
          Aucune mise à jour répertoriée.{" "}
          <button onClick={handleAddPatchnote} className="underline text-secondary">
            Ajoutez-en une !
          </button>
        </p>
      ) : (
        <ul
          ref={containerRef}
          className="relative list-none p-0 pb-8"
          aria-label="Historique des mises à jour"
        >
          {/* Spine principale — height fixée dynamiquement par useTimelineSVG */}
          <div
            className="tl-main-spine absolute top-0 left-[60px] w-[3px] bg-white/80 z-0"
            style={{ height: 0 }}
          />

          {years.map((year) => {
            const yearItems  = groupedByYear[year];
            const isOpen     = isYearOpen(year);
            const sorted     = [...yearItems].sort(
              (a, b) =>
                new Date(toISO(b.releasedAt)).getTime() -
                new Date(toISO(a.releasedAt)).getTime()
            );

            const extItems    = yearItems.filter((i): i is ExtensionItem => i.itemType === "extension");
            const majorCount  = yearItems.filter((i) => i.itemType === "patchnote" && (i as PatchnoteItem).importance === "major").length;
            const minorCount  = yearItems.filter((i) => i.itemType === "patchnote" && (i as PatchnoteItem).importance === "minor").length;
            const hotfixCount = yearItems.filter((i) => i.itemType === "patchnote" && (i as PatchnoteItem).importance === "hotfix").length;

            return (
              <li key={year} className="tl-yr relative mb-[2px]">

                {/* SVG branche */}
                <svg
                  className="tl-branch-svg absolute top-0 left-[60px] w-[60px] pointer-events-none z-[1]"
                  style={{ display: "none", overflow: "visible" }}
                >
                  <line className="tl-el-mask"   stroke="#111" strokeWidth="5" />
                  <line className="tl-el-thread" stroke="rgba(255,255,255,0.20)" strokeWidth="1.5" />
                  <path className="tl-el-branch" fill="none" stroke="rgba(255,255,255,0.85)" strokeWidth="2.5" strokeLinecap="square" strokeLinejoin="miter" />
                </svg>

                {/* Ligne année */}
                <div className="tl-yr-row flex items-start relative z-[2]">
                  <div className="w-[60px] flex-shrink-0 pr-[10px] pt-[8px] text-right text-[13px] font-medium text-white">
                    {year}
                  </div>
                  <div className="w-[3px] flex-shrink-0 relative z-[3]">
                    <div className="tl-yr-dot absolute w-[14px] h-[14px] rounded-full bg-white border-[3px] border-[#111] left-[-5px] top-[5px]" />
                  </div>
                  <button
                    className={`
                      flex-1 ml-[18px] bg-[#1c1c1c] border border-white/10 rounded-lg
                      px-[14px] py-[9px] text-[#ccc] text-xs font-medium text-left
                      flex items-start justify-between gap-2
                      ${year !== currentYear ? "cursor-pointer hover:bg-[#222]" : "cursor-default"}
                    `}
                    onClick={() => toggleYear(year)}
                    disabled={year === currentYear}
                    aria-expanded={isOpen}
                  >
                    <div className="flex-1">
                      <div>
                        {extItems.length   > 0 && <>{extItems.length} extension{extItems.length > 1 ? "s" : ""}&nbsp;·&nbsp;</>}
                        {majorCount        > 0 && <>{majorCount} majeure{majorCount > 1 ? "s" : ""}&nbsp;·&nbsp;</>}
                        {minorCount        > 0 && <>{minorCount} mineure{minorCount > 1 ? "s" : ""}&nbsp;·&nbsp;</>}
                        {hotfixCount       > 0 && <>{hotfixCount} hotfix{hotfixCount > 1 ? "es" : ""}</>}
                      </div>
                      {extItems.length > 0 && (
                        <div className="flex gap-[5px] mt-2 overflow-hidden">
                          {extItems.slice(0, 6).map((ext) => (
                            <div
                              key={ext.id}
                              className="w-[46px] h-[66px] rounded flex-shrink-0 bg-[#2c2c2c] overflow-hidden"
                              title={ext.title}
                            >
                              <Image
                                src={ext.imageUrl ?? ""}
                                alt={ext.title}
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
                      <span className="text-[#888] text-[9px] flex-shrink-0 mt-[2px]">
                        {isOpen ? "▲" : "▼"}
                      </span>
                    )}
                  </button>
                </div>

                {/* Items */}
                <ul
                  className="tl-yr-items list-none p-0"
                  style={{ display: isOpen ? "block" : "none" }}
                  aria-label={`Mises à jour ${year}`}
                >
                  {sorted.map((item, idx) => {
                    const iso     = toISO(item.releasedAt);
                    const dateStr = new Date(iso).toLocaleDateString("fr-FR");
                    const diffStr = formatDateDifference(iso);

                    return (
                      <li
                        key={`${item.id}-${item.itemType}`}
                        className="flex items-start pl-[96px]"
                        style={{
                          paddingTop:    idx === 0 ? "22px" : "14px",
                          paddingBottom: "10px",
                        }}
                      >
                        {/* Petit dot */}
                        <div className="tl-it-dot-col w-[2px] flex-shrink-0 relative z-[3]">
                          <div className="absolute w-[10px] h-[10px] rounded-full bg-[#ddd] border-[2px] border-[#111] left-[-4px] top-[3px]" />
                        </div>

                        {/* Contenu */}
                        <div className="flex-1 pl-[16px]">
                          <div className="flex gap-2 items-baseline mb-[5px]">
                            <time dateTime={iso} className="text-[10px] text-gray-500">
                              {dateStr}
                            </time>
                            <span className="text-[9px] text-gray-600">{diffStr}</span>
                          </div>

                          {item.itemType === "extension" ? (
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
                                <p className="text-[10px] text-gray-500 mt-[1px]">Sortie : {dateStr}</p>
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
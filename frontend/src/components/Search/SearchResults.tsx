"use client";

import { useEffect, useState } from "react";
import { SearchResultCard } from "./SearchResultCard";
import gameService from "@/lib/api/gameService";
import { Game } from "@/types/gameType";
import React from "react";
import { useTranslation } from "@/i18n/TranslationProvider";

// ─── Types ────────────────────────────────────────────────────────────────────

interface SearchFilters {
  q: string;
  category: string;
  order: string;
  sort: string;
  genres: string[];
  platforms: string[];
  companyName: string;
  releasedBefore: string;
  releasedAfter: string;
}

interface SearchResultsProps {
  filters: SearchFilters;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const ITEMS_PER_PAGE = 10;
const MAX_VISIBLE_PAGES = 6;

// ─── Helpers ─────────────────────────────────────────────────────────────────

function buildEndpointFilters(
  filters: SearchFilters,
  page: number
): Record<string, unknown> {
  return {
    page,
    title: filters.q || undefined,
    "genres.name[]":
      filters.genres.length > 0 ? filters.genres : undefined,
    "companies.name": filters.companyName || undefined,
    "releasedAt[before]": filters.releasedBefore || undefined,
    "releasedAt[after]": filters.releasedAfter || undefined,
    [`order[${filters.order}]`]: filters.sort || undefined,
  };
}

function updatePageInUrl(page: number): void {
  const url = new URL(window.location.href);
  url.searchParams.set("page", String(page));
  window.history.replaceState({}, "", url.toString());
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function SkeletonCard(): React.ReactElement {
  return (
    <div className="flex w-full bg-off-gray rounded-lg overflow-hidden animate-pulse">
      <div className="w-[110px] bg-gray-700 flex-shrink-0" style={{ minHeight: "155px" }} />
      <div className="flex-grow p-4 space-y-3">
        <div className="h-5 bg-gray-700 rounded w-3/5" />
        <div className="h-3 bg-gray-700 rounded w-1/4" />
        <div className="h-3 bg-gray-700 rounded w-full mt-4" />
        <div className="h-3 bg-gray-700 rounded w-full" />
        <div className="h-3 bg-gray-700 rounded w-4/5" />
      </div>
    </div>
  );
}

interface PaginationProps {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  previousAriaLabel: string;
  nextAriaLabel: string;
}

function Pagination({
  page,
  totalPages,
  onPageChange,
  previousAriaLabel,
  nextAriaLabel,
}: PaginationProps): React.ReactElement | null {
  if (totalPages <= 1) return null;

  const visiblePages: number[] = Array.from(
    { length: Math.min(MAX_VISIBLE_PAGES, totalPages) },
    (_, i) => i + 1
  );

  const showEllipsis = totalPages > MAX_VISIBLE_PAGES;

  return (
    <div className="mt-8 flex justify-center items-center gap-1 text-white text-sm select-none">
      {/* Previous */}
      <PaginationButton
        label="<"
        onClick={() => onPageChange(page - 1)}
        disabled={page === 1}
        active={false}
        ariaLabel={previousAriaLabel}
      />

      {/* Page numbers */}
      {visiblePages.map((pageNum) => (
        <PaginationButton
          key={pageNum}
          label={String(pageNum)}
          onClick={() => onPageChange(pageNum)}
          active={page === pageNum}
          disabled={false}
        />
      ))}

      {/* Ellipsis + last page */}
      {showEllipsis && (
        <>
          <span className="px-1 text-gray-400">...</span>
          <PaginationButton
            label={String(totalPages)}
            onClick={() => onPageChange(totalPages)}
            active={page === totalPages}
            disabled={false}
          />
        </>
      )}

      {/* Next */}
      <PaginationButton
        label=">"
        onClick={() => onPageChange(page + 1)}
        disabled={page === totalPages || totalPages === 0}
        active={false}
        ariaLabel={nextAriaLabel}
      />
    </div>
  );
}

interface PaginationButtonProps {
  label: string;
  onClick: () => void;
  active: boolean;
  disabled: boolean;
}

function PaginationButton({
  label,
  onClick,
  active,
  disabled,
  ariaLabel,
}: PaginationButtonProps & { ariaLabel?: string }): React.ReactElement {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      aria-label={ariaLabel}
      className={`
        px-3 py-1 rounded transition-colors duration-150
        ${active ? "font-bold text-white" : "text-gray-300 hover:bg-gray-700 hover:text-white"}
        ${disabled ? "opacity-40 cursor-not-allowed" : "cursor-pointer"}
      `}
    >
      {label}
    </button>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function SearchResults({
  filters,
}: SearchResultsProps): React.ReactElement {
  const { t } = useTranslation();
  const [games, setGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [page, setPage] = useState<number>(1);

  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);

  useEffect(() => {
    let cancelled = false;

    const fetchGames = async (): Promise<void> => {
      setLoading(true);

      const endpointFilters = buildEndpointFilters(filters, page);

      let fetchFunction: (
        f: Record<string, unknown>
      ) => Promise<{ member: Game[]; totalItems: number }>;

      switch (filters.category) {
        case "extensions":
          fetchFunction = gameService.getExtensions;
          break;
        case "all":
          fetchFunction = async (f) => {
            const [gamesRes, extensionsRes] = await Promise.all([
              gameService.getGames(f),
              gameService.getExtensions(f),
            ]);
            return {
              member: [...gamesRes.member, ...extensionsRes.member],
              totalItems: gamesRes.totalItems + extensionsRes.totalItems,
            };
          };
          break;
        default:
          fetchFunction = gameService.getGames;
          break;
      }

      const result = await fetchFunction(endpointFilters);

      if (!cancelled) {
        setGames(result.member);
        setTotalCount(result.totalItems);
        setLoading(false);
      }
    };

    fetchGames().catch(() => {
      if (!cancelled) {
        setError(t("search.results.error"));
        setLoading(false);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [filters, page]);

  const handlePageChange = (newPage: number): void => {
    const clamped = Math.max(1, Math.min(totalPages, newPage));
    setPage(clamped);
    updatePageInUrl(clamped);
  };

  if (loading) {
    return (
      <section className="flex flex-col gap-4 w-full">
        {Array.from({ length: 5 }).map((_, idx) => (
          <SkeletonCard key={idx} />
        ))}
      </section>
    );
  }

  if (error) {
    return (
      <section className="w-full">
        <p className="text-red-400 text-center py-12">{error}</p>
      </section>
    );
  }

  return (
    <section className="w-full">
      <div className="flex flex-col gap-4 w-full">
        {games.length === 0 ? (
          <p className="text-gray-400 text-center py-12">
            {t("search.results.noResults")}
          </p>
        ) : (
          games.map((game) => <SearchResultCard key={game.id} game={game} />)
        )}
      </div>

      <Pagination
        page={page}
        totalPages={totalPages}
        onPageChange={handlePageChange}
        previousAriaLabel={t("search.pagination.previous")}
        nextAriaLabel={t("search.pagination.next")}
      />
    </section>
  );
}
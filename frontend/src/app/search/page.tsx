"use client";

import SearchBar from "@/components/Search/SearchBar";
import FiltersSidebar, { SidebarFilters } from "@/components/Search/FiltersSidebar";
import SearchResults from "@/components/Search/SearchResults";
import { PageSection } from "@/components/PageSection";
import { useSearchParams, useRouter } from "next/navigation";
import { useEffect, useState, Suspense, useCallback } from "react";
import React from "react";
import { useTranslation } from "@/i18n/TranslationProvider";

export const dynamic = "force-dynamic";

// ─── Types ────────────────────────────────────────────────────────────────────

interface SearchFilters extends SidebarFilters {
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

// ─── Sort label map ────────────────────────────────────────────────────────────

function useOrderLabels(): Record<string, string> {
  const { t } = useTranslation();
  return {
    releasedAt: t("search.sortReleasedAt"),
    lastUpdatedAt: t("search.sortLastUpdatedAt"),
    title: t("search.sortTitle"),
  };
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function filtersFromParams(searchParams: ReturnType<typeof useSearchParams>): SearchFilters {
  return {
    q: searchParams.get("q") ?? "",
    category: searchParams.get("category") ?? "",
    order: searchParams.get("order") ?? "releasedAt",
    sort: searchParams.get("sort") ?? "desc",
    genres: searchParams.getAll("genres"),
    platforms: searchParams.getAll("platforms"),
    companyName: searchParams.get("companyName") ?? "",
    releasedBefore: searchParams.get("releasedBefore") ?? "",
    releasedAfter: searchParams.get("releasedAfter") ?? "",
  };
}

// ─── Page content ─────────────────────────────────────────────────────────────

function SearchPageContent(): React.ReactElement {
  const { t } = useTranslation();
  const searchParams = useSearchParams();
  const router = useRouter();

  const [filters, setFilters] = useState<SearchFilters>(() =>
    filtersFromParams(searchParams)
  );

  useEffect(() => {
    setFilters(filtersFromParams(searchParams));
  }, [searchParams]);

  const updateFilters = useCallback(
    (newFilters: Partial<SearchFilters>): void => {
      const merged: SearchFilters = { ...filters, ...newFilters };
      const params = new URLSearchParams();

      if (merged.q) params.set("q", merged.q);
      if (merged.category) params.set("category", merged.category);
      if (merged.order) params.set("order", merged.order);
      if (merged.sort) params.set("sort", merged.sort);
      if (merged.genres.length)
        merged.genres.forEach((g) => params.append("genres", g));
      if (merged.platforms.length)
        merged.platforms.forEach((p) => params.append("platforms", p));
      if (merged.companyName) params.set("companyName", merged.companyName);
      if (merged.releasedBefore) params.set("releasedBefore", merged.releasedBefore);
      if (merged.releasedAfter) params.set("releasedAfter", merged.releasedAfter);

      router.push(`?${params.toString()}`);
    },
    [filters, router]
  );

  const handleSidebarChange = useCallback(
    (newSidebarFilters: Partial<SearchFilters>): void => {
      updateFilters(newSidebarFilters);
    },
    [updateFilters]
  );

  const handleOrderChange = (e: React.ChangeEvent<HTMLSelectElement>): void => {
    updateFilters({ order: e.target.value });
  };

  const handleSortToggle = (): void => {
    updateFilters({ sort: filters.sort === "asc" ? "desc" : "asc" });
  };

  return (
    <PageSection className="py-8 flex flex-col lg:flex-row gap-8">

      {/* ── Filters Sidebar ── */}
      <FiltersSidebar filters={filters} onChange={handleSidebarChange} />

      {/* ── Main content ── */}
      <section className="w-full lg:w-3/4 flex flex-col gap-4">

        {/* Search bar */}
        <SearchBar query={filters.q} />

        {/* Sort bar */}
        <div className="flex justify-end items-center gap-1 text-sm text-white">
          <span className="text-gray-400">{t("search.sortBy")}</span>

          {/* Styled native select that looks like inline text */}
          <div className="relative inline-flex items-center">
            <select
              value={filters.order}
              onChange={handleOrderChange}
              className="
                appearance-none bg-transparent
                font-bold text-white pr-0
                focus:outline-none cursor-pointer
                hover:text-primary transition-colors
              "
            >
              {Object.entries(useOrderLabels()).map(([value, label]) => (
                <option key={value} value={value} className="bg-gray-800 font-normal">
                  {label}
                </option>
              ))}
            </select>
          </div>

          {/* Sort direction toggle */}
          <button
            type="button"
            onClick={handleSortToggle}
            title={filters.sort === "asc" ? t("search.sortAsc") : t("search.sortDesc")}
            className="ml-1 text-white hover:text-primary transition-colors font-bold"
            aria-label={t("search.toggleSortAriaLabel")}
          >
            {filters.sort === "asc" ? "↑" : "↓"}
          </button>
        </div>

        {/* Results list */}
        <SearchResults filters={filters} />
      </section>
    </PageSection>
  );
}

// ─── Export ───────────────────────────────────────────────────────────────────

export default function SearchPage(): React.ReactElement {
  return (
    <Suspense
      fallback={
        <PageSection className="py-8">
          <p className="text-white text-sm">Chargement...</p>
        </PageSection>
      }
    >
      <SearchPageContent />
    </Suspense>
  );
}
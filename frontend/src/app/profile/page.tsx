"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import gameService from "@/lib/api/gameService";
import userService from "@/lib/api/userService";
import { FollowedGameWithCount } from "@/types/gameType";
import { ClassicCard } from "@/components/ArticleCard";
import { useAuth } from "@/providers/AuthProvider";
import { useTranslation } from "@/i18n/TranslationProvider";
import { Search, Pencil, ArrowUp, ArrowDown } from "lucide-react";

// ─── Constants ────────────────────────────────────────────────────────────────

const ITEMS_PER_PAGE = 10; // 2 rows × 5 columns

type SortField = "date" | "name";
type SortDir = "asc" | "desc";

// ─── Pagination ───────────────────────────────────────────────────────────────

type PaginationProps = {
  currentPage: number;
  totalPages: number;
  onChange: (page: number) => void;
};

function buildPageRange(current: number, total: number): (number | "…")[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);

  const pages: (number | "…")[] = [1, 2, 3, 4, 5, 6];

  if (current > 4 && current < total - 3) {
    return [1, "…", current - 1, current, current + 1, "…", total];
  }
  if (current <= 4) {
    return [...pages, "…", total];
  }
  return [1, "…", total - 5, total - 4, total - 3, total - 2, total - 1, total];
}

function Pagination({ currentPage, totalPages, onChange }: PaginationProps) {
  if (totalPages <= 1) return null;

  const pages = buildPageRange(currentPage, totalPages);

  const btnBase =
    "flex items-center justify-center min-w-[2rem] h-8 px-1 text-sm font-medium transition-colors duration-150 cursor-pointer";

  return (
    <nav
      aria-label="Pagination"
      className="flex items-center justify-center gap-1 mt-10"
    >
      {/* Previous */}
      <button
        onClick={() => onChange(currentPage - 1)}
        disabled={currentPage === 1}
        aria-label="Page précédente"
        className={`${btnBase} text-off-white/70 hover:text-off-white disabled:opacity-30 disabled:cursor-not-allowed`}
      >
        &lt;
      </button>

      {pages.map((page, idx) =>
        page === "…" ? (
          <span key={`ellipsis-${idx}`} className={`${btnBase} text-off-white/40`}>
            ...
          </span>
        ) : (
          <button
            key={page}
            onClick={() => onChange(page)}
            aria-current={page === currentPage ? "page" : undefined}
            className={[
              btnBase,
              page === currentPage
                ? "text-off-white font-bold underline underline-offset-4"
                : "text-off-white/60 hover:text-off-white",
            ].join(" ")}
          >
            {page}
          </button>
        )
      )}

      {/* Next */}
      <button
        onClick={() => onChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        aria-label="Page suivante"
        className={`${btnBase} text-off-white/70 hover:text-off-white disabled:opacity-30 disabled:cursor-not-allowed`}
      >
        &gt;
      </button>
    </nav>
  );
}

// ─── ProfilePage ──────────────────────────────────────────────────────────────

export default function ProfilePage() {
  const { user, logout } = useAuth();
  const { t } = useTranslation();

  const [followedGames, setFollowedGames] = useState<FollowedGameWithCount[]>([]);
  const [loading,       setLoading]       = useState<boolean>(true);
  const [error,         setError]         = useState<string | null>(null);

  const [search,      setSearch]      = useState<string>("");
  const [sortField,   setSortField]   = useState<SortField>("date");
  const [sortDir,     setSortDir]     = useState<SortDir>("desc");
  const [currentPage, setCurrentPage] = useState<number>(1);

  // ── Fetch ────────────────────────────────────────────────────────────────

  useEffect(() => {
    let cancelled = false;

    const fetchGames = async (): Promise<void> => {
      try {
        setLoading(true);
        const games = await gameService.getFollowedGames();

        if (cancelled) return;

        if (
          Array.isArray(games) &&
          games.length > 0 &&
          Object.prototype.hasOwnProperty.call(games[0], "game")
        ) {
          setFollowedGames(games as FollowedGameWithCount[]);
        } else {
          setFollowedGames([]);
        }
        setError(null);
      } catch (err) {
        if (!cancelled) {
          console.error("Failed to fetch followed games:", err);
          setError(t("profile.loadError"));
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchGames();
    return () => { cancelled = true; };
  }, [t]);

  // ── Filter + sort ────────────────────────────────────────────────────────

  const filteredAndSorted = useMemo<FollowedGameWithCount[]>(() => {
    const lower = search.toLowerCase();

    return [...followedGames]
      .filter((d) => d.game.title.toLowerCase().includes(lower))
      .sort((a, b) => {
        const gA = a.game;
        const gB = b.game;
        const dir = sortDir === "asc" ? 1 : -1;
        if (sortField === "date") {
          return dir * (new Date(gA.releasedAt).getTime() - new Date(gB.releasedAt).getTime());
        }
        return dir * gA.title.localeCompare(gB.title);
      });
  }, [followedGames, search, sortField, sortDir]);

  // ── Pagination ───────────────────────────────────────────────────────────

  const totalPages = Math.max(1, Math.ceil(filteredAndSorted.length / ITEMS_PER_PAGE));

  const paginatedGames = useMemo<FollowedGameWithCount[]>(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredAndSorted.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredAndSorted, currentPage]);

  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>): void => {
    setSearch(e.target.value);
    setCurrentPage(1);
  }, []);

  const handleSortFieldChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>): void => {
    setSortField(e.target.value as SortField);
    setCurrentPage(1);
  }, []);

  const toggleSortDir = useCallback((): void => {
    setSortDir((prev) => (prev === "asc" ? "desc" : "asc"));
    setCurrentPage(1);
  }, []);

  const handlePageChange = useCallback((page: number): void => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  // ── Derived display values ───────────────────────────────────────────────

  const formattedJoinDate = user?.createdAt
    ? new Date(user.createdAt).toLocaleDateString("fr-FR")
    : "";

  const avatarUrl = "/user_placeholder.svg";

  // ── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-off-black text-off-white">

      {/* ════════════════════════════════════════════════════════════════════
          PROFILE HEADER
      ════════════════════════════════════════════════════════════════════ */}
      <section
        className="relative w-full overflow-hidden bg-hero bg-cover bg-center"
        aria-label="Profil utilisateur"
      >
        {/* Dark overlay */}
        <div aria-hidden="true" className="absolute inset-0 bg-black/60" />

        {/* Content */}
        <div className="relative z-10 container mx-auto px-6 py-12">
          <div className="flex flex-col items-start gap-8 md:flex-row md:items-center">

            {/* ── Avatar ───────────────────────────────────────────── */}
            <div className="relative shrink-0">
              <div className="relative w-[200px] h-[200px]">
                <Image
                  src={avatarUrl}
                  alt={`Avatar de ${user?.username ?? "utilisateur"}`}
                  fill
                  className="object-cover rounded-full border-[3px] border-off-white/10"
                  sizes="200px"
                  priority
                />
              </div>
              {/* Edit overlay button */}
              <Link
                href="/profile/edit"
                aria-label="Modifier l'avatar"
                className="absolute bottom-3 right-3 flex items-center justify-center w-9 h-9 rounded-full bg-primary hover:bg-secondary transition-colors duration-150 shadow-lg cursor-pointer"
              >
                <Pencil className="w-4 h-4" />
              </Link>
            </div>

            {/* ── Info block ───────────────────────────────────────── */}
            <div className="flex-grow space-y-1.5">
              <h1 className="text-3xl font-bold font-montserrat text-off-white leading-tight">
                {user?.username ?? t("common.user")}
              </h1>

              {/* Contributions */}
              <span className="text-sm text-off-white/80">
                {(user?.contributionsCount ?? 0).toLocaleString("fr-FR")} contributions
              </span>

              {/* Member since */}
              {formattedJoinDate && (
                <p className="text-sm text-off-white/70">
                  Utilisateur depuis le : {formattedJoinDate}
                </p>
              )}

              {/* Game count */}
              <p className="text-sm text-off-white/70">
                {loading
                  ? t("profile.loadingGames")
                  : `${followedGames.length.toLocaleString("fr-FR")} jeux dans sa liste`}
              </p>
            </div>

            {/* ── Action buttons ───────────────────────────────────── */}
            <div className="flex flex-col gap-3 shrink-0 self-start md:self-center">
              <Link
                href="/profile/edit"
                className="px-5 py-1.5 text-sm font-semibold text-center border border-off-white/50 text-off-white hover:border-off-white hover:bg-off-white/5 transition-colors duration-150 whitespace-nowrap cursor-pointer"
              >
                {t("profile.editAction")}
              </Link>
              <button
                onClick={logout}
                className="px-5 py-1.5 text-sm font-semibold border border-off-white/50 text-off-white hover:border-off-white hover:bg-off-white/5 transition-colors duration-150 cursor-pointer"
              >
                {t("nav.logout")}
              </button>
              <button
                onClick={async () => {
                  if (!user?.id) return;
                  const confirmed = window.confirm(t("profile.deleteConfirm"));
                  if (!confirmed) return;
                  try {
                    await userService.deleteAccount(user.id);
                    logout();
                  } catch (err) {
                    console.error("Failed to delete account:", err);
                    alert(t("profile.deleteError"));
                  }
                }}
                className="px-5 py-1.5 text-sm font-semibold border border-red-500 text-red-400 hover:bg-red-500/10 transition-colors duration-150 cursor-pointer"
              >
                {t("profile.deleteAccount")}
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════════════════
          MA LISTE
      ════════════════════════════════════════════════════════════════════ */}
      <section className="container mx-auto px-6 py-10" aria-label="Ma liste de jeux">

        {/* ── Header row ──────────────────────────────────────────────────── */}
        <div className="flex flex-col gap-4 mb-6 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-3xl font-bold font-montserrat text-off-white">
            Ma liste
          </h2>

          {/* Search bar */}
          <div className="flex items-stretch">
            <input
              type="text"
              value={search}
              onChange={handleSearchChange}
              placeholder={t("search.placeholder")}
              aria-label={t("search.placeholder")}
              className="w-64 px-4 py-2 text-sm bg-off-gray border border-off-white/20 text-off-white placeholder:text-off-white/30 focus:outline-none focus:border-primary/60 transition-colors duration-150"
            />
            <button
              aria-label={t("search.placeholder")}
              className="px-3 bg-primary hover:bg-secondary transition-colors duration-150 text-off-white cursor-pointer"
            >
              <Search className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* ── Sort control ────────────────────────────────────────────────── */}
        <div className="flex items-center justify-end gap-2 mb-5">
          <span className="text-sm text-off-white/50">{t("profile.sortBy")} :</span>
          <select
            value={sortField}
            onChange={handleSortFieldChange}
            className="bg-off-gray border border-off-white/20 text-off-white text-sm px-3 py-1.5 rounded focus:outline-none focus:border-primary/60 transition-colors duration-150 cursor-pointer"
          >
            <option value="date">{t("profile.sortDate")}</option>
            <option value="name">{t("profile.sortName")}</option>
          </select>
          <button
            onClick={toggleSortDir}
            aria-label={sortDir === "asc" ? "Tri croissant" : "Tri décroissant"}
            className="p-1.5 rounded hover:bg-off-white/10 transition-colors duration-150 text-off-white cursor-pointer"
          >
            {sortDir === "asc" ? <ArrowUp className="w-4 h-4" /> : <ArrowDown className="w-4 h-4" />}
          </button>
        </div>

        {/* ── States: loading / error / empty ─────────────────────────────── */}
        {loading && (
          <p className="py-16 text-center text-off-white/50">
            {t("common.loading")}
          </p>
        )}

        {!loading && error !== null && (
          <p
            role="alert"
            className="py-8 px-5 text-center text-sm text-red-400 bg-red-900/20 border border-red-800/40"
          >
            {error}
          </p>
        )}

        {!loading && error === null && followedGames.length === 0 && (
          <p className="py-16 text-center text-off-white/40">
            {t("profile.emptyList")}
          </p>
        )}

        {!loading && error === null && filteredAndSorted.length === 0 && followedGames.length > 0 && (
          <p className="py-16 text-center text-off-white/40">
            {t("profile.noSearchResults")}
          </p>
        )}

        {/* ── Game grid ───────────────────────────────────────────────────── */}
        {!loading && error === null && paginatedGames.length > 0 && (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
            {paginatedGames.map((data) => (
              <ClassicCard
                key={data.game.id}
                game={data.game}
                isAuthenticated={!!user}
                updatesCount={data.newPatchnoteCount}
              />
            ))}
          </div>
        )}

        {/* ── Pagination ──────────────────────────────────────────────────── */}
        {!loading && error === null && filteredAndSorted.length > ITEMS_PER_PAGE && (
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onChange={handlePageChange}
          />
        )}
      </section>
    </div>
  );
}
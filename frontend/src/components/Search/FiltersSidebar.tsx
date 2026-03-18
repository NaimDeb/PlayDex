"use client";

import gameService from "@/lib/api/gameService";
import React, { useEffect, useState } from "react";

// ─── Types ────────────────────────────────────────────────────────────────────

export type SidebarFilters = {
  genres?: string[];
  platforms?: string[];
  companyName?: string;
  releasedAfter?: string;
  releasedBefore?: string;
};

type FiltersSidebarProps = {
  filters: SidebarFilters;
  onChange: (filters: Partial<SidebarFilters>) => void;
};

// ─── Constants ────────────────────────────────────────────────────────────────

const PLATFORM_OPTIONS: string[] = ["PC", "PS4", "PS5", "Xbox Series X", "Xbox One"]; // Todo : Récupérer dynamiquement depuis l'API
const VISIBLE_ITEMS_DEFAULT = 5;

// ─── Design tokens partagés ───────────────────────────────────────────────────
// Pour changer la DA de tous les inputs/checkboxes : modifier cet objet.

const FIELD_BASE =
  "bg-off-black border border-gray-600 rounded text-off-white focus:outline-none focus:border-primary transition-colors";

// ─── Primitives ───────────────────────────────────────────────────────────────

interface SidebarInputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
}

/** Input texte ou date — DA unifiée avec les checkboxes */
function SidebarInput({
  label,
  className = "",
  ...props
}: SidebarInputProps): React.ReactElement {
  return (
    <div className="flex flex-col gap-1 w-full">
      {label && (
        <label className="text-xs text-gray-400">{label}</label>
      )}
      <input
        {...props}
        className={`
          ${FIELD_BASE}
          w-full px-2.5 py-1.5 text-sm
          placeholder:text-gray-600
          [color-scheme:dark]
          ${className}
        `}
      />
    </div>
  );
}

interface SidebarCheckboxProps {
  label: string;
  value: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}

/** Checkbox custom — même fond et bordure que SidebarInput */
function SidebarCheckbox({
  label,
  value,
  checked,
  onChange,
}: SidebarCheckboxProps): React.ReactElement {
  return (
    <label className="flex items-center gap-3 cursor-pointer group select-none">
      {/*
        Checkbox custom : fond off-black + bordure grise = identique aux SidebarInput.
        Coché : fond primary, coche SVG blanche.
      */}
      <span
        className={`
          flex-shrink-0 w-4 h-4 rounded-sm border
          flex items-center justify-center
          transition-colors duration-150
          ${checked
            ? "bg-primary border-primary"
            : "bg-off-black border-gray-600 group-hover:border-gray-400"
          }
        `}
      >
        {checked && (
          <svg
            className="w-2.5 h-2.5 text-white"
            viewBox="0 0 10 8"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M1 4L3.5 6.5L9 1"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        )}
      </span>
      {/* Input natif masqué — accessibilité clavier conservée */}
      <input
        type="checkbox"
        value={value}
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="sr-only"
      />
      <span className="text-sm text-gray-300 group-hover:text-off-white transition-colors">
        {label}
      </span>
    </label>
  );
}

// ─── Section primitives ───────────────────────────────────────────────────────

function SectionHeader({ title }: { title: string }): React.ReactElement {
  return (
    <div className="bg-gray-600 px-4 py-2.5 text-center">
      <h3 className="font-bold text-off-white text-base tracking-wide">{title}</h3>
    </div>
  );
}

interface CheckboxListProps {
  items: string[];
  selected: string[];
  onToggle: (item: string, checked: boolean) => void;
  showAll: boolean;
  onToggleShowAll: () => void;
}

function CheckboxList({
  items,
  selected,
  onToggle,
  showAll,
  onToggleShowAll,
}: CheckboxListProps): React.ReactElement {
  const visibleItems = showAll ? items : items.slice(0, VISIBLE_ITEMS_DEFAULT);

  return (
    <div className="px-4 py-3 flex flex-col gap-2.5">
      {visibleItems.map((item) => (
        <SidebarCheckbox
          key={item}
          label={item}
          value={item}
          checked={selected.includes(item)}
          onChange={(checked) => onToggle(item, checked)}
        />
      ))}
      {items.length > VISIBLE_ITEMS_DEFAULT && (
        <button
          type="button"
          onClick={onToggleShowAll}
          className="mt-1 text-sm text-off-white hover:text-secondary hover:cursor-pointer transition-colors text-left"
        >
          {showAll ? "Voir moins" : "Voir plus"}
        </button>
      )}
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function FiltersSidebar({
  filters,
  onChange,
}: FiltersSidebarProps): React.ReactElement {
  const [genres, setGenres] = useState<string[]>([]);
  const [showAllGenres, setShowAllGenres] = useState(false);
  const [showAllPlatforms, setShowAllPlatforms] = useState(false);
  const [parentGameInput, setParentGameInput] = useState<string>(
    filters.companyName ?? ""
  );

  useEffect(() => {
    setParentGameInput(filters.companyName ?? "");
  }, [filters.companyName]);

  useEffect(() => {
    gameService
      .getGenres()
      .then((res) => setGenres(res.map((g) => g.name)))
      .catch(() => setGenres([]));
  }, []);

  // ── Handlers ──

  const handleGenreToggle = (genre: string, checked: boolean): void => {
    const current = filters.genres ?? [];
    onChange({
      genres: checked ? [...current, genre] : current.filter((g) => g !== genre),
    });
  };

  const handlePlatformToggle = (platform: string, checked: boolean): void => {
    const current = filters.platforms ?? [];
    onChange({
      platforms: checked ? [...current, platform] : current.filter((p) => p !== platform),
    });
  };

  const handleParentGameSearch = (e: React.FormEvent<HTMLFormElement>): void => {
    e.preventDefault();
    onChange({ companyName: parentGameInput });
  };

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const { name, value } = e.target;
    if (name === "releasedAt[after]") onChange({ releasedAfter: value });
    else if (name === "releasedAt[before]") onChange({ releasedBefore: value });
  };

  return (
    <aside className="w-full lg:w-1/4 flex-shrink-0">
      <div className="bg-off-gray rounded-lg overflow-hidden text-off-white divide-y divide-gray-700">

        {/* ── Genre ── */}
        <div>
          <SectionHeader title="Genre" />
          <CheckboxList
            items={genres}
            selected={filters.genres ?? []}
            onToggle={handleGenreToggle}
            showAll={showAllGenres}
            onToggleShowAll={() => setShowAllGenres((v) => !v)}
          />
        </div>

        {/* ── Plateforme ── */}
        <div>
          <SectionHeader title="Plateforme" />
          <CheckboxList
            items={PLATFORM_OPTIONS}
            selected={filters.platforms ?? []}
            onToggle={handlePlatformToggle}
            showAll={showAllPlatforms}
            onToggleShowAll={() => setShowAllPlatforms((v) => !v)}
          />
        </div>

        {/* ── Jeu parent ── */}
        <div>
          <SectionHeader title="Jeu parent" />
          <div className="px-4 py-3">
            <form onSubmit={handleParentGameSearch} className="flex flex-col gap-2">
              <SidebarInput
                label="Nom du jeu"
                type="text"
                value={parentGameInput}
                onChange={(e) => setParentGameInput(e.target.value)}
              />
              <button
                type="submit"
                className="
                  bg-primary hover:bg-secondary text-white
                  text-sm font-semibold py-1.5 px-4 rounded
                  transition-colors duration-200 self-center mt-1
                "
              >
                Rechercher
              </button>
            </form>
          </div>
        </div>

        {/* ── Date de sortie ── */}
        <div>
          <SectionHeader title="Date de sortie" />
          <div className="px-4 py-3">
            <div className="flex items-end gap-3">
              <SidebarInput
                label="De :"
                type="date"
                name="releasedAt[after]"
                value={filters.releasedAfter ?? ""}
                onChange={handleDateChange}
              />
              <SidebarInput
                label="A :"
                type="date"
                name="releasedAt[before]"
                value={filters.releasedBefore ?? ""}
                onChange={handleDateChange}
              />
            </div>
          </div>
        </div>

      </div>
    </aside>
  );
}
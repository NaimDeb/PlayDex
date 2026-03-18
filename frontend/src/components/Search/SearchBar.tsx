"use client";

import React from "react";
import { useTranslation } from "@/i18n/TranslationProvider";

interface SearchBarProps {
  query: string;
}

export default function SearchBar({ query }: SearchBarProps): React.ReactElement {
  const { t } = useTranslation();

  function handleSearch(event: React.FormEvent<HTMLFormElement>): void {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const searchQuery = formData.get("search") as string;

    const url = new URL(window.location.href);
    if (searchQuery) {
      url.searchParams.set("q", searchQuery);
    } else {
      url.searchParams.delete("q");
    }
    window.location.href = url.toString();
  }

  return (
    <form onSubmit={handleSearch} className="flex items-center w-full">
      <input
        type="text"
        name="search"
        defaultValue={query}
        placeholder={t("search.placeholder")}
        className="
          flex-grow bg-[#2a2a38] text-white placeholder-gray-500
          px-4 py-2.5 rounded-l-lg
          border border-gray-600 border-r-0
          focus:outline-none focus:border-primary
          text-sm transition-colors
        "
      />
      <button
        type="submit"
        className="
          bg-primary hover:bg-secondary text-white
          font-semibold py-2.5 px-5 rounded-r-lg
          flex items-center gap-2
          transition-colors duration-200
          whitespace-nowrap text-sm
        "
      >
        {t("common.search")}
        <SearchIcon />
      </button>
    </form>
  );
}

function SearchIcon(): React.ReactElement {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      className="h-4 w-4"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2.5}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
      />
    </svg>
  );
}
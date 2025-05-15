import gameService from "@/lib/api/gameService";
import React, { useEffect, useState } from "react";

type Filters = {
  genres?: string[];
  companyName?: string;
  releasedAfter?: string;
  releasedBefore?: string;
};

type FiltersSidebarProps = {
  filters: Filters;
  onChange: (filters: Partial<Filters>) => void;
};

const GENRES = await gameService
  .getGenres()
  .then((res) => res.map((g) => g.name));

export default function FiltersSidebar({
  filters,
  onChange,
}: FiltersSidebarProps) {
  // Handler pour les genres (checkbox)
  const handleGenreChange = (genre: string, checked: boolean) => {
    let newGenres = filters.genres ? [...filters.genres] : [];
    if (checked) {
      newGenres.push(genre);
    } else {
      newGenres = newGenres.filter((g: string) => g !== genre);
    }
    onChange({ genres: newGenres });
  };

  // Debounced company name state
  const [companyInput, setCompanyInput] = useState(filters.companyName || "");

  // Update local input if filters.companyName changes externally
  useEffect(() => {
    setCompanyInput(filters.companyName || "");
  }, [filters.companyName]);

  // Debounce effect
  useEffect(() => {
    const handler = setTimeout(() => {
      if (companyInput !== filters.companyName) {
        onChange({ companyName: companyInput });
      }
    }, 400);
    return () => clearTimeout(handler);
  }, [companyInput, filters.companyName, onChange]);

  // Handler pour la compagnie (updates local state)
  const handleCompanyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCompanyInput(e.target.value);
  };

  // Handler pour les dates
  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.name === "releasedAt[after]") {
      onChange({ releasedAfter: e.target.value });
    } else if (e.target.name === "releasedAt[before]") {
      onChange({ releasedBefore: e.target.value });
    }
  };

  return (
    <aside className="w-full lg:w-1/4">
      <div className="bg-off-gray p-4 rounded-lg text-white">
        <h2 className="text-xl font-semibold mb-4">Filtres</h2>
        {/* Genre filter */}
        <div className="mb-6">
          <h3 className="font-semibold mb-2">Genre</h3>
          <div
            className="flex flex-col gap-2"
            style={{ maxHeight: 180, overflowY: "auto" }}
          >
            {GENRES.map((genre, idx) => (
              <label
                key={`${genre}-${idx}`}
                className="flex items-center gap-2"
              >
                <input
                  type="checkbox"
                  name="genres.name[]"
                  value={genre}
                  className="accent-primary"
                  checked={filters.genres?.includes(genre) || false}
                  onChange={(e) => handleGenreChange(genre, e.target.checked)}
                />
                {genre}
              </label>
            ))}
          </div>
        </div>
        {/* Company filter */}
        <div className="mb-6">
          <h3 className="font-semibold mb-2">Companie</h3>
          <input
            type="text"
            placeholder="Nom de la compagnie"
            className="w-full bg-gray-700 border border-gray-600 rounded px-2 py-1"
            name="companies.name"
            value={companyInput}
            onChange={handleCompanyChange}
          />
        </div>
        {/* Release date filters */}
        <div className="mb-6">
          <h3 className="font-semibold mb-2">Date de sortie</h3>
          <div className="flex gap-2">
            <input
              type="date"
              className="bg-gray-700 border border-gray-600 rounded px-2 py-1 w-1/2"
              name="releasedAt[after]"
              placeholder="Du"
              value={filters.releasedAfter || ""}
              onChange={handleDateChange}
            />
            <input
              type="date"
              className="bg-gray-700 border border-gray-600 rounded px-2 py-1 w-1/2"
              name="releasedAt[before]"
              placeholder="Au"
              value={filters.releasedBefore || ""}
              onChange={handleDateChange}
            />
          </div>
        </div>
      </div>
    </aside>
  );
}

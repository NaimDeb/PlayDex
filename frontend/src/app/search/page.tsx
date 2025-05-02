"use client";
import SearchBar from "@/components/Search/SearchBar";
import FiltersSidebar from "@/components/Search/FiltersSidebar";
import SearchResults from "@/components/Search/SearchResults";
import { useSearchParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function SearchPage() {

  const searchParams = useSearchParams();
  const router = useRouter();

  const [filters, setFilters] = useState({
    q: searchParams.get("q") || "",
    category: searchParams.get("category") || "",
    order: searchParams.get("order") || "releasedAt",
    sort: searchParams.get("sort") || "desc",
    genres: searchParams.getAll("genres"),
    companyName: searchParams.get("companyName") || "",
    releasedBefore: searchParams.get("releasedBefore") || "",
    releasedAfter: searchParams.get("releasedAfter") || "",
  });



  useEffect(() => {
    setFilters({
      q: searchParams.get("q") || "",
      category: searchParams.get("category") || "",
      order: searchParams.get("order") || "releasedAt",
      sort: searchParams.get("sort") || "desc",
      genres: searchParams.getAll("genres"),
      companyName: searchParams.get("companyName") || "",
      releasedBefore: searchParams.get("releasedBefore") || "",
      releasedAfter: searchParams.get("releasedAfter") || "",
    });
  }, [searchParams]);

  // Met à jour l'URL avec les nouveaux filtres
  const updateFilters = (newFilters: Partial<typeof filters>) => {
    const params = new URLSearchParams();

    const merged = { ...filters, ...newFilters };
    if (merged.q) params.set("q", merged.q);
    if (merged.category) params.set("category", merged.category);
    if (merged.order) params.set("order", merged.order);
    if (merged.sort) params.set("sort", merged.sort);
    if (merged.genres && merged.genres.length)
      merged.genres.forEach((g: string) => params.append("genres", g));
    if (merged.companyName) params.set("companyName", merged.companyName);
    if (merged.releasedBefore) params.set("releasedBefore", merged.releasedBefore);
    if (merged.releasedAfter) params.set("releasedAfter", merged.releasedAfter);

    router.push(`?${params.toString()}`);
  };

  // Handler pour le select de tri
  const handleOrderChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    updateFilters({ order: e.target.value });
  };

  // Handler pour le bouton asc/desc
  const handleSortToggle = () => {
    updateFilters({ sort: filters.sort === "asc" ? "desc" : "asc" });
  };

  // Handler pour FiltersSidebar (à adapter selon l'API de FiltersSidebar)
  const handleSidebarChange = (newSidebarFilters: Partial<typeof filters>) => {
    updateFilters(newSidebarFilters);
  };

  return (
    <div className="container mx-auto px-4 py-8 flex flex-col lg:flex-row gap-8">
      {/* Filters Sidebar */}
      <FiltersSidebar filters={filters} onChange={handleSidebarChange} />

      {/* Main Content Area */}
      <section className="w-full lg:w-3/4">
        {/* Search Bar and Sorting */}
        <aside className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
          <SearchBar query={filters.q} />
          <div className="flex items-center text-white">
            <span>Trier par :</span>
            <select
              className="ml-2 bg-gray-700 border border-gray-600 rounded px-2 py-1 focus:outline-none"
              value={filters.order}
              onChange={handleOrderChange}
            >
              <option value="releasedAt">Date de sortie</option>
              <option value="lastUpdatedAt">Dernière mise à jour</option>
              <option value="title">Titre (A-Z)</option>
            </select>
            <button
              className="ml-2 px-2 py-1 rounded bg-gray-700 hover:bg-gray-600 border border-gray-600"
              title="Changer l'ordre"
              onClick={handleSortToggle}
            >
              {filters.sort === "asc" ? "↑" : "↓"}
            </button>
          </div>
        </aside>

        {/* Search Results */}
        <SearchResults filters={filters} />
      </section>
    </div>
  );
}

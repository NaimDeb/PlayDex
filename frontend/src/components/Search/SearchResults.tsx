import { useEffect, useState } from "react";
import { SearchResultCard } from "./SearchResultCard";
import gameService from "@/lib/api/gameService"; // Adjust the import path as necessary
import { Game } from "@/types/gameType";

interface SearchResultsProps {
    filters: {
        q: string;
        category: string;
        order: string;
        sort: string;
        genres: string[];
        companyName: string;
        releasedBefore: string;
        releasedAfter: string;
    }
}

export default function SearchResults({ filters }: SearchResultsProps) {
const [games, setGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);
  const [count, setCount] = useState(0); // Initialize count state
  const [page, setPage] = useState(1); // Initialize page state

  const itemsPerPage = 10; // Number of items per page

  useEffect(() => {
    const fetchGames = async () => {
      setLoading(true);

      const endpointFilters = {
        page,
        title: filters.q || undefined,
        description: undefined,
        "genres.name[]": filters.genres && filters.genres.length > 0 ? filters.genres : undefined,
        "companies.name": filters.companyName || undefined,
        "releasedAt[before]": filters.releasedBefore || undefined,
        "releasedAt[after]": filters.releasedAfter || undefined,
        [`order[${filters.order}]`]: filters.sort || undefined,
      }

    let fetchFunction;

    switch (filters.category) {
      case "genre":
        if (filters.genres && filters.genres.length > 0) {
          endpointFilters["genres.name[]"] = filters.genres;
        }
        fetchFunction = gameService.getGames;
        break;
      case "entreprise":
        if (filters.companyName) {
          endpointFilters["companies.name"] = filters.companyName;
        }
        fetchFunction = gameService.getGames;
        break;
      case "jeux":
        fetchFunction = gameService.getGames;
        break;
      case "extensions":
        fetchFunction = gameService.getExtensions;
        break;
      case "all":
        // Fetch both games and extensions, then merge results
        fetchFunction = async (filters: Record<string, unknown>) => {
          const [gamesRes, extensionsRes] = await Promise.all([
            gameService.getGames(filters),
            gameService.getExtensions(filters),
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

    const result = await (fetchFunction || gameService.getGames)(endpointFilters);

    setGames(result.member);
    setLoading(false);
    setCount(result.totalItems);
    };

    fetchGames();
  }, [filters, page]);

  if (loading) {
    // Skeleton loader: 6 placeholder cards
    return (
      <section>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, idx) => (
            <div
              key={idx}
              className="animate-pulse bg-gray-700 rounded-lg h-48 w-full"
            >
              <div className="h-32 bg-gray-600 rounded-t-lg" />
              <div className="p-4 space-y-2">
                <div className="h-4 bg-gray-600 rounded w-3/4" />
                <div className="h-3 bg-gray-600 rounded w-1/2" />
              </div>
            </div>
          ))}
        </div>
      </section>
    );
  }
  return (
    <section>
    <div className="flex flex-col gap-6 w-full">
      {games.map((game) => (
        <SearchResultCard key={game.id} game={game} />
      ))}

    {/* Pagination */}
    </div>
    <div className="mt-8 flex justify-center items-center space-x-2 text-white">
      <button
        className="px-3 py-1 rounded hover:bg-gray-700 disabled:opacity-50"
        onClick={() => {
        setPage((p) => Math.max(1, p - 1));
        const url = new URL(window.location.href);
        url.searchParams.set("page", String(Math.max(1, page - 1)));
        window.history.replaceState({}, "", url.toString());
        }}
        disabled={page === 1}
      >
        &lt;
      </button>
      {Array.from({ length: Math.ceil(count / itemsPerPage) })
        .slice(0, 5)
        .map((_, idx) => {
        const pageNum = idx + 1;
        return (
          <button
            key={pageNum}
            className={`px-3 py-1 rounded ${
            page === pageNum ? "bg-primary" : "hover:bg-gray-700"
            }`}
            onClick={() => {
            setPage(pageNum);
            const url = new URL(window.location.href);
            url.searchParams.set("page", String(pageNum));
            window.history.replaceState({}, "", url.toString());
            }}
          >
            {pageNum}
          </button>
        );
        })}
      {Math.ceil(count / itemsPerPage) > 5 && (
        <>
        <span>...</span>
        <button
          className={`px-3 py-1 rounded ${
            page === Math.ceil(count / itemsPerPage)
            ? "bg-primary"
            : "hover:bg-gray-700"
          }`}
          onClick={() => {
            const lastPage = Math.ceil(count / itemsPerPage);
            setPage(lastPage);
            const url = new URL(window.location.href);
            url.searchParams.set("page", String(lastPage));
            window.history.replaceState({}, "", url.toString());
          }}
        >
          {Math.ceil(count / itemsPerPage)}
        </button>
        </>
      )}
      <button
        className="px-3 py-1 rounded hover:bg-gray-700 disabled:opacity-50"
        onClick={() => {
        const nextPage = Math.min(Math.ceil(count / itemsPerPage), page + 1);
        setPage(nextPage);
        const url = new URL(window.location.href);
        url.searchParams.set("page", String(nextPage));
        window.history.replaceState({}, "", url.toString());
        }}
        disabled={page === Math.ceil(count / itemsPerPage) || count === 0}
      >
        &gt;
      </button>
    </div>
    </section>
  );
}

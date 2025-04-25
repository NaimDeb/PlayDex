import { SearchResultCard } from "@/components/Search/SearchResultCard";
import SearchBar from "@/components/Search/SearchBar";
import {FiltersSidebar} from "@/components/Search/FiltersSidebar";
// import SearchResults from "@/components/SearchResults";

export default function SearchPage() {
  return (
    <div className="container mx-auto px-4 py-8 flex flex-col lg:flex-row gap-8">
      {/* Filters Sidebar */}
      <FiltersSidebar />
      

      {/* Main Content Area */}
      <section className="w-full lg:w-3/4">
        {/* Search Bar and Sorting */}
        <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
          {/* Placeholder for SearchBar component */}
          {/* <SearchBar /> */}
          <SearchBar/>
          <div className="flex items-center text-white">
            <span>Trier par :</span>
            <select className="ml-2 bg-gray-700 border border-gray-600 rounded px-2 py-1 focus:outline-none">
              <option>Date de sortie ↑</option>
              {/* Add other sorting options */}
            </select>
          </div>
        </div>

        {/* Search Results */}

        {/* <SearchResults /> */}

        {/* ... more results */}
        {/* <SearchResultCard /> */}

        <div className="mt-8 flex justify-center items-center space-x-2 text-white">
          {/* Placeholder for Pagination component */}
          <button className="px-3 py-1 rounded hover:bg-gray-700">&lt;</button>
          <button className="px-3 py-1 rounded bg-primary">1</button>
          <button className="px-3 py-1 rounded hover:bg-gray-700">2</button>
          <button className="px-3 py-1 rounded hover:bg-gray-700">3</button>
          <span>...</span>
          <button className="px-3 py-1 rounded hover:bg-gray-700">123</button>
          <button className="px-3 py-1 rounded hover:bg-gray-700">&gt;</button>
        </div>
      </section>
    </div>
  );
}

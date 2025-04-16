import Image from "next/image";
// import SearchBar from "@/components/SearchBar";
// import FiltersSidebar from "@/components/FiltersSidebar";
// import SearchResults from "@/components/SearchResults";

export default function SearchPage() {
  return (
    <div className="container mx-auto px-4 py-8 flex flex-col lg:flex-row gap-8">
      {/* Filters Sidebar */}
      <aside className="w-full lg:w-1/4">
        {/* Placeholder for FiltersSidebar component */}
        {/* <FiltersSidebar /> */}
        <div className="bg-off-gray p-4 rounded-lg text-white">
          <h2 className="text-xl font-semibold mb-4">Filters</h2>
          {/* Add filter sections here based on the image */}
          <div className="mb-6">
            <h3 className="font-semibold mb-2">Genre</h3>
            {/* Genre checkboxes */}
          </div>
          <div className="mb-6">
            <h3 className="font-semibold mb-2">Plateforme</h3>
            {/* Platform checkboxes */}
          </div>
          <div className="mb-6">
            <h3 className="font-semibold mb-2">Jeu parent</h3>
            {/* Parent game input */}
          </div>
          <div>
            <h3 className="font-semibold mb-2">Date de sortie</h3>
            {/* Date range inputs */}
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <section className="w-full lg:w-3/4">
        {/* Search Bar and Sorting */}
        <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
           {/* Placeholder for SearchBar component */}
          {/* <SearchBar /> */}
          <input
            type="text"
            placeholder="Search for a game"
            className="bg-gray-700 text-white placeholder-gray-400 px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-600 flex-grow"
          />
           <button className="bg-primary hover:bg-secondary text-white font-bold py-2 px-4 rounded-lg transition duration-200">
             Rechercher
           </button>
          <div className="flex items-center text-white">
            <span>Trier par :</span>
            <select className="ml-2 bg-gray-700 border border-gray-600 rounded px-2 py-1 focus:outline-none">
              <option>Date de sortie ↑</option>
              {/* Add other sorting options */}
            </select>
          </div>
        </div>

        {/* Search Results */}
        {/* Placeholder for SearchResults component */}
        {/* <SearchResults /> */}
        <div className="space-y-4">
          {/* Repeat this block for each search result */}
            <Image src="https://via.placeholder.com/100x150" alt="Game Cover" width={100} height={150} className="w-24 h-36 object-cover rounded flex-shrink-0"/>
            <img src="https://via.placeholder.com/100x150" alt="Game Cover" className="w-24 h-36 object-cover rounded flex-shrink-0"/>
            <div className="text-white flex-grow">
              <h3 className="text-2xl font-bold">The Elder Scrolls: Blades</h3>
              <p className="text-sm text-gray-400 mb-2">Sortie : 11/12/2011</p>
              <p className="text-gray-300 text-sm mb-4">
                Lorem ipsum dolor sit amet, consectetur adipiscing elit. Ut eu erat feugiat, luctus ligula eget, euismod eros. Vivamus tellus lorem, consectetur ac leo nec, aliquet lobortis nibh. Vestibulum tincidunt...
              </p>
            </div>
            <button className="bg-gray-700 hover:bg-gray-600 text-white font-semibold py-2 px-4 rounded-lg transition duration-200 mt-4 sm:mt-0 self-start sm:self-center">
              Suivi
            </button>
          </div>
          {/* ... more results */}

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
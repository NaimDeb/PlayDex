export default function SearchBar({query}: {query: string}) {

  // Todo : There has to be a better way to do this

    function handleSearch(event: React.FormEvent<HTMLFormElement>) {
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
        <form onSubmit={handleSearch} className="flex items-center gap-4 mb-6">
          <input
            type="text"
            name="search"
            defaultValue={query ?? ""}
            placeholder="Search for a game"
            className="bg-gray-700 text-white placeholder-gray-400 px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-600 flex-grow"
          />
          <button className="bg-primary hover:bg-secondary text-white font-bold py-2 px-4 rounded-lg transition duration-200" type="submit">
            Rechercher
          </button>
        </form>
    )
}
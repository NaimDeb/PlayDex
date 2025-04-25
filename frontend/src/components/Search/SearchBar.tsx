import { form } from "@heroui/theme"

export default function SearchBar() {

    function handleSearch(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();
        const formData = new FormData(event.currentTarget);
        const searchQuery = formData.get("search") as string;
    // todo : css

    return (
        <form onSubmit={handleSearch} className="flex items-center gap-4 mb-6">

        <input
            type="text"
            placeholder="Search for a game"
            className="bg-gray-700 text-white placeholder-gray-400 px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-600 flex-grow"
          />
          <button className="bg-primary hover:bg-secondary text-white font-bold py-2 px-4 rounded-lg transition duration-200" type="submit">
            Rechercher
          </button>
        </form>
    )
}
}
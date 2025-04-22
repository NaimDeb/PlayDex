import Link from "next/link";

export function GenreTag({ genre }: { genre: string }) {
    return (
        <Link
            href={`/search?genre=${encodeURIComponent(genre)}`}
            passHref
        >
            <button
            className="bg-off-white text-off-gray text-md font-semibold px-2 py-1 rounded-lg border border-off-gray/50 hover:bg-off-white/20 hover:text-off-white text-center cursor-pointer"
            aria-label={`Search for genre: ${genre}`}
            >
            {genre}
            </button>
        </Link>
    );
}
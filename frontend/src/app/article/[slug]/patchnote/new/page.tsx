"use client";
import { getIdFromSlug } from "@/lib/gameSlug";
import Link from "next/link";
import { useEffect, useState } from "react";
import { FaExclamationTriangle } from "react-icons/fa";

export default function ArticleModificationsPage({
  params,
}: {
  params: { slug: string };
}) {

  const [gameName, setGameName] = useState(""); // Placeholder for game name
  const [gameReleaseDate, setGameReleaseDate] = useState(""); // Placeholder for game release date

  useEffect(() => {

    // get ID from slug

    const gameId = getIdFromSlug(params.slug); // Fetch game ID using the slug

    const fetchGameName = async () => {
      const gameData = await getGameById(gameId); // Fetch game name using the game ID
      setGameName(gameData.name); // Set the game name state
      setGameReleaseDate(gameData.releaseDate); // Set the game release date state
    }
    fetchGameName();
  }, [params.slug])

  function handleAddPatchnote(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); // Prevent the default form submission
    const formData = new FormData(event.currentTarget); // Get the form data

    console.log(formData);
    

  }

  return (
    <div className="container mx-auto px-4 py-8 text-white bg-off-gray min-h-screen">
      {" "}
      {/* Added bg-gray-900 and text-white */}
      <h1 className="text-3xl font-montserrat font-bold mb-2">
        Nouvelle patch note de : {articleTitle}
      </h1>
      <Link
        href={`/article/${params?.slug}/modifications`}
      >
        Voir toutes les modifications
      </Link>
      <div
        className="bg-yellow-900 border-l-4 border-yellow-500 text-yellow-100 p-4 my-6 rounded-md flex items-start"
        role="alert"
      >
        <FaExclamationTriangle
          className="text-yellow-400 mr-3 mt-1 flex-shrink-0"
          size={20}
        />
        <div>
          <p className="font-bold">Attention !</p>
          <p className="text-sm">
            En mettant à jour cette entrée, assurez-vous de respecter{" "}
            <Link href="/rules" className="underline hover:text-yellow-300">
              nos règles d&apos;utilisation
            </Link>
            . Toute modification inappropriée ou non conforme peut entraîner des
            restrictions sur votre compte. Merci de contribuer à une communauté
            claire et organisée !
          </p>
        </div>
      </div>
      <form className="space-y-6" onSubmit={handleAddPatchnote}>
        <div>
          <label
            htmlFor="title"
            className="block text-xl font-montserrat font-semibold mb-2"
          >
            Titre :
          </label>
          <input
            type="text"
            id="title"
            name="title"
            defaultValue="Patch Note #46" // Placeholder or fetched default
            className="w-1/3 p-3 border border-gray-600 rounded bg-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
        </div>

        <div>
          <label
            htmlFor="date"
            className="block text-xl font-montserrat font-semibold mb-2"
          >
            Date :
          </label>
          <input
            type="date" // Consider using a date picker component
            id="date"
            name="date"
            className="w-fit py-3 px-4 border border-gray-600 rounded bg-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-purple-500" // Adjusted width
          />
        </div>

        <div>
          <label
            htmlFor="summary"
            className="block text-xl font-montserrat font-semibold mb-2"
          >
            Résumé :
          </label>
          <textarea
            id="summary"
            name="summary"
            rows={4}
            placeholder="Small resume of the change"
            className="w-full p-3 border border-gray-600 rounded bg-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
        </div>

        <textarea
          id="content"
          name="content"
          rows={8}
          placeholder="The content of the patchnote"
          className="border border-gray-700 p-6 rounded my-6 bg-gray-800 relative w-full"
        ></textarea>

        <div className="flex justify-end pt-6">
          <button
            type="submit"
            className="bg-gray-300 hover:bg-gray-400 text-gray-900 font-bold py-2 px-6 rounded transition duration-150 ease-in-out"
          >
            Publier
          </button>
        </div>
      </form>
    </div>
  );
}



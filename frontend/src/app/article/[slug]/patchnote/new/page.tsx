"use client";
import gameService from "@/lib/api/gameService";
import { getIdFromSlug } from "@/lib/gameSlug";
import Link from "next/link";
import { use, useEffect, useState } from "react";
import { FaExclamationTriangle } from "react-icons/fa";
import { redirect } from "next/navigation";
import MDEditor, { commands as defaultCommands } from "@uiw/react-md-editor";
import {addToast} from "@heroui/toast";

import {
  buffCommand,
  debuffCommand,
} from "@/components/MDEditor/customCommands";

export default function ArticleModificationsPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = use(params); // Unwrap the params promise
  const [gameName, setGameName] = useState(""); // Placeholder for game name
  const [gameReleaseDate, setGameReleaseDate] = useState(""); // Placeholder for game release date
  const [isPatchNoteTitleChanged, setPatchNoteTitleChanged] = useState(false); // State to track if the patch note title has changed
  const [content, setContent] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // get ID from slug
    setIsLoading(true); // Set loading state to true
    const gameId = getIdFromSlug(slug); // Fetch game ID using the slug

    const fetchGameName = async () => {
      const gameData = await gameService.getGameById(gameId); // Fetch game name using the game ID
      setGameName(gameData.title); // Set the game name state
      setGameReleaseDate(gameData.releasedAt); // Set the game release date state
      setIsLoading(false);
    };
    fetchGameName();
  }, [slug]);

  // --- Form submission handler ---
  /**
   *
   * @param event
   */
  async function handleAddPatchnote(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); // Prevent the default form submission
    setIsLoading(true); // Set loading state to true
    const formData = new FormData(event.currentTarget); // Get the form data
    formData.set("content", content); // Add editor content to formData

    const gameId = `/api/games/${getIdFromSlug(slug)}`; // Get the game ID from the slug
    formData.set("game", gameId); // Add the game ID to formData

    // Convert FormData to JSON object
    const jsonObject: Record<string, string | File> = {}; // Initialize an object with specific types
    formData.forEach((value, key) => {
      if (key === "releasedAt") {
        if (
          key === "releasedAt" &&
          typeof value === "string" &&
          !isNaN(Date.parse(value))
        ) {
          jsonObject[key] = new Date(value).toISOString(); // Convert valid date string to ISO string
        } else {
          jsonObject[key] = value; // Keep other values as is
        }
      } else {
        jsonObject[key] = value; // Add other form data as is
      }
    });

    try {
      await gameService.postPatchnote(jsonObject); // Send the form data to the server
    } catch{
      addToast({
        title: "Erreur lors de l'ajout de la patchnote",
        description: "Une erreur est survenue lors de l'ajout de la patchnote.",
      });
      return; // Exit the function on error
    } finally {
      setIsLoading(false);
      addToast({
        title: "Patchnote ajoutée avec succès !",
        description: "La patchnote a bien été sauvegardée.",
        color: "success",
      });
      redirect(`/article/${slug}`); // Redirect to referrer or fallback URL
    }
  }

  /**
   * Change the title of the patchnote based on the selected date
   * @param event
   */
  function changePatchnoteTitle(
    event: React.ChangeEvent<HTMLInputElement>
  ): void {
    const selectedDate = event.target.value; // Get the selected date from the input
    const formattedDate = new Date(selectedDate).toLocaleDateString("fr-FR"); // Format the date to French format
    const newTitle = `Patch Note - ${formattedDate}`; // Create a new title using the formatted date

    const titleInput = document.getElementById("title") as HTMLInputElement; // Get the title input element
    if (
      titleInput &&
      (!isPatchNoteTitleChanged ||
        titleInput.value.startsWith("Patch Note") ||
        titleInput.value === "")
    ) {
      titleInput.value = newTitle; // Update the title input value
    }
  }

  return (
    <>
      <div className="container mx-auto px-4 py-8 text-white bg-off-gray min-h-screen">
        <h1 className="text-3xl font-montserrat font-bold mb-2">
          Nouvelle patch note pour : {gameName}
        </h1>
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
              . Toute modification inappropriée ou non conforme peut entraîner
              des restrictions sur votre compte. Merci de contribuer à une
              communauté claire et organisée !
            </p>
          </div>
        </div>
        <div
          className={`transition-all duration-200 ${isLoading ? "pointer-events-none opacity-50 select-none" : ""}`}
        >
          <form className="space-y-6" onSubmit={handleAddPatchnote}>
            <fieldset disabled={isLoading}>
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
                  defaultValue="Patch Note"
                  onChange={() => setPatchNoteTitleChanged(true)}
                  className="w-1/3 p-3 border border-gray-600 rounded bg-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div>
                <label
                  htmlFor="releasedAt"
                  className="block text-xl font-montserrat font-semibold mb-2"
                >
                  Date :
                </label>
                <input
                  type="date"
                  id="releasedAt"
                  name="releasedAt"
                  min={gameReleaseDate}
                  onChange={changePatchnoteTitle}
                  className="w-fit py-3 px-4 border border-gray-600 rounded bg-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div>
                <label
                  htmlFor="smallDescription"
                  className="block text-xl font-montserrat font-semibold mb-2"
                >
                  Résumé :
                </label>
                <textarea
                  id="smallDescription"
                  name="smallDescription"
                  rows={2}
                  placeholder="Small resume of the change"
                  className="w-1/2  p-3 border border-gray-600 rounded bg-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div>
                <label
                  htmlFor="importance"
                  className="block text-xl font-montserrat font-semibold mb-2"
                >
                  Importance :
                </label>
                <select
                  id="importance"
                  name="importance"
                  className="w-1/3 p-3 border border-gray-600 rounded bg-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  <option value="minor">Minor</option>
                  <option value="major">Major</option>
                  <option value="hotfix">Hotfix</option>
                </select>
              </div>

              <div>
                <label
                  htmlFor="content"
                  className="block text-xl font-montserrat font-semibold mb-2"
                >
                  Contenu :
                </label>
                <MDEditor
                  value={content}
                  onChange={(newContent) => setContent(newContent || "")}
                  textareaProps={{ autoCapitalize: "none", disabled: isLoading }}
                  commands={[
                    defaultCommands.bold,
                    defaultCommands.italic,
                    defaultCommands.divider,
                    buffCommand,
                    debuffCommand,
                    defaultCommands.divider,
                    defaultCommands.link,
                    defaultCommands.quote,
                    defaultCommands.unorderedListCommand,
                    defaultCommands.orderedListCommand,
                    defaultCommands.checkedListCommand,
                    defaultCommands.divider,
                  ]}
                  visibleDragbar={false}
                />
              </div>

              <div className="flex justify-end pt-6">
                <button
                  type="submit"
                  className="bg-gray-300 hover:bg-gray-400 text-gray-900 font-bold py-2 px-6 rounded transition duration-150 ease-in-out"
                  disabled={isLoading}
                >
                  Publier
                </button>
              </div>
            </fieldset>
          </form>
        </div>
      </div>
    </>
  );
}

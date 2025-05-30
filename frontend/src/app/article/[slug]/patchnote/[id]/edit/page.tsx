"use client";
import gameService from "@/lib/api/gameService";
import { getIdFromSlug } from "@/lib/gameSlug";
import Link from "next/link";
import { useEffect, useState } from "react";
import { FaExclamationTriangle } from "react-icons/fa";
import { redirect, useParams } from "next/navigation";
import { Patchnote } from "@/types/patchNoteType";
import MDEditor, { commands as defaultCommands } from "@uiw/react-md-editor";
import { useFlashMessage } from "@/components/FlashMessage/FlashMessageProvider";
import {
  buffCommand,
  debuffCommand,
} from "@/components/MDEditor/customCommands";

export default function EditPatchnotePage() {
  const params = useParams();
  const slug = params.slug as string;
  const id = params.id as string;

  const [gameName, setGameName] = useState("");
  const [gameReleaseDate, setGameReleaseDate] = useState("");
  const [isPatchNoteTitleChanged, setPatchNoteTitleChanged] = useState(false);

  // Patchnote fields
  const [title, setTitle] = useState("");
  const [releasedAt, setReleasedAt] = useState("");
  const [smallDescription, setSmallDescription] = useState("");
  const [importance, setImportance] = useState<"minor" | "major" | "hotfix">(
    "minor"
  );
  const [content, setContent] = useState("");

  const [isLoading, setIsLoading] = useState(false);
  const { showMessage } = useFlashMessage();

  // Fetch patchnote and game data
  useEffect(() => {
    const fetchData = async () => {
      const gameId = getIdFromSlug(slug);
      const gameData = await gameService.getGameById(gameId);
      setGameName(gameData.title);
      setGameReleaseDate(gameData.releasedAt);

      // Ensure getPatchnoteById exists in gameService
      if (typeof gameService.getPatchNoteById !== "function") {
        console.error("gameService.getPatchnoteById is not a function");
        return;
      }
      const patchnoteData = await gameService.getPatchNoteById(id);
      setTitle(patchnoteData.title || "");
      setReleasedAt(
        patchnoteData.releasedAt
          ? new Date(patchnoteData.releasedAt).toISOString().slice(0, 10)
          : ""
      );
      setSmallDescription(patchnoteData.smallDescription || "");
      setImportance(patchnoteData.importance || "minor");
      setContent(patchnoteData.content || "");
    };
    if (slug && id) fetchData();
  }, [slug, id]);

  // --- Form submission handler ---
  async function handleEditPatchnote(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setIsLoading(true);

    const updatedPatchnote: Partial<Patchnote> = {
      title,
      smallDescription,
      importance,
      content,
    };
    if (releasedAt) {
      updatedPatchnote.releasedAt = new Date(releasedAt);
    }

    try {
      await gameService.patchPatchnote(id, updatedPatchnote);
    } catch {
      showMessage("Erreur lors de la modification de la patchnote.", "error");
    } finally {
      showMessage("Patchnote modifiée avec succès !", "success");
      redirect(`/article/${slug}/patchnote/${id}`);
    }
  }

  function changePatchnoteTitle(event: React.ChangeEvent<HTMLInputElement>) {
    const selectedDate = event.target.value;
    // Use a fixed format for the title to avoid hydration issues
    const formattedDate = selectedDate.split("-").reverse().join("/");
    const newTitle = `Patch Note - ${formattedDate}`;
    if (
      !isPatchNoteTitleChanged ||
      title.startsWith("Patch Note") ||
      title === ""
    ) {
      setTitle(newTitle);
    }
    setReleasedAt(selectedDate);
  }

  return (
    <>
      <div className="container mx-auto px-4 py-8 text-white bg-off-gray min-h-screen">
        <h1 className="text-3xl font-montserrat font-bold mb-2">
          Modifier la patch note pour : {gameName}
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
          className={`transition-all duration-200 ${
            isLoading ? "pointer-events-none opacity-50 select-none" : ""
          }`}
        >
          <form className="space-y-6" onSubmit={handleEditPatchnote}>
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
                  value={title}
                  onChange={(e) => {
                    setTitle(e.target.value);
                    setPatchNoteTitleChanged(true);
                  }}
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
                  value={releasedAt}
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
                  value={smallDescription}
                  onChange={(e) => setSmallDescription(e.target.value)}
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
                  value={importance}
                  onChange={(e) =>
                    setImportance(
                      e.target.value as "minor" | "major" | "hotfix"
                    )
                  }
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
                  textareaProps={{
                    autoCapitalize: "none",
                    disabled: isLoading,
                  }}
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
                  previewOptions={{}}
                  visibleDragbar={false}
                  tabIndex={isLoading ? -1 : 0}
                />
              </div>

              <div className="flex justify-end pt-6">
                <button
                  type="submit"
                  className="bg-gray-300 hover:bg-gray-400 text-gray-900 font-bold py-2 px-6 rounded transition duration-150 ease-in-out"
                  disabled={isLoading}
                >
                  {isLoading ? "Sauvegarde..." : "Sauvegarder"}
                </button>
              </div>
            </fieldset>
          </form>
        </div>
      </div>
    </>
  );
}

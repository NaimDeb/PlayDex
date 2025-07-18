"use client";
import {
  useEffect,
  useState,
  createContext,
  useContext,
  use as usePromise,
} from "react";
import Link from "next/link";
import { Breadcrumbs, BreadcrumbItem } from "@heroui/breadcrumbs";
import gameService from "@/lib/api/gameService";
import { Patchnote } from "@/types/patchNoteType";
import { Game } from "@/types/gameType";
import { usePathname } from "next/navigation";

type PatchnoteLayoutContextType = {
  patchnote: Patchnote | null;
  game: Game | null;
  loading: boolean;
};

const PatchnoteLayoutContext = createContext<PatchnoteLayoutContextType>({
  patchnote: null,
  game: null,
  loading: true,
});

export function usePatchnoteLayout() {
  return useContext(PatchnoteLayoutContext);
}

export default function PatchnoteLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ slug: string; id: string }>;
}) {
  const { slug, id } = usePromise(params);
  const [patchnote, setPatchnote] = useState<Patchnote | null>(null);
  const [game, setGame] = useState<Game | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        const patchnoteData = await gameService.getPatchNoteById(id);
        setPatchnote(patchnoteData);

        // If game data is already included as an object, use it directly
        if (
          typeof patchnoteData.game === "object" &&
          patchnoteData.game?.title
        ) {
          setGame(patchnoteData.game as Game);
        } else {
          // Otherwise, fetch the game data separately
          const gameId =
            typeof patchnoteData.game === "string"
              ? patchnoteData.game.split("/").pop() || patchnoteData.game
              : slug; // fallback to slug if we can't determine game ID

          const gameData = await gameService.getGameById(gameId.toString());
          setGame(gameData);
        }
      } catch {
        setPatchnote(null);
        setGame(null);
      }
      setLoading(false);
    }
    fetchData();
  }, [id, slug]);

  const pathname = usePathname();

  return (
    <PatchnoteLayoutContext.Provider value={{ patchnote, game, loading }}>
      <div className="container mx-auto px-4 py-8 text-white">
        <Breadcrumbs underline="hover" className="mb-6">
          <BreadcrumbItem>
            <Link href="/" className="text-gray-400 hover:underline">
              Accueil
            </Link>
          </BreadcrumbItem>
          <BreadcrumbItem>
            <Link
              href={`/article/${slug}`}
              className="text-gray-400 hover:underline"
            >
              {game?.title || "Jeu..."}
            </Link>
          </BreadcrumbItem>
          <BreadcrumbItem>
            <span className="text-white">
              {patchnote?.title || "Patchnote..."}
            </span>
          </BreadcrumbItem>
          {pathname.endsWith("/modifications") && (
            <BreadcrumbItem>
              <span className="text-white">Modifications</span>
            </BreadcrumbItem>
          )}
        </Breadcrumbs>
        {children}
      </div>
    </PatchnoteLayoutContext.Provider>
  );
}

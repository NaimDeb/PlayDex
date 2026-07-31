"use client";
import { useEffect, useState, use as usePromise } from "react";
import Link from "next/link";
import { Breadcrumbs, BreadcrumbItem } from "@heroui/breadcrumbs";
import gameService from "@/lib/api/gameService";
import { getIdFromSlug } from "@/lib/gameSlug";
import { Patchnote } from "@/types/patchNoteType";
import { Game } from "@/types/gameType";
import { usePathname } from "next/navigation";
import { PatchnoteLayoutContext } from "@/contexts/PatchnoteLayoutContext";
import { BackButton } from "@/components/BackButton";
import { PatchnoteGameHeader } from "@/components/PatchnoteGameHeader";
import { useTranslation } from "@/i18n/TranslationProvider";

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
        // patchnote.game n'expose que {id, title} : imageUrl vient de /games.
        const [patchnoteData, gameData] = await Promise.all([
          gameService.getPatchNoteById(id),
          gameService.getGameById(getIdFromSlug(slug)),
        ]);

        setPatchnote(patchnoteData);
        setGame(gameData);
      } catch {
        setPatchnote(null);
        setGame(null);
      }
      setLoading(false);
    }
    fetchData();
  }, [id, slug]);

  const pathname = usePathname();
  const { t } = useTranslation();

  return (
    <PatchnoteLayoutContext.Provider value={{ patchnote, game, loading }}>
      <div className="container mx-auto px-4 py-8 text-white flex-1">
        <BackButton />
        <Breadcrumbs underline="hover" className="mb-6">
          <BreadcrumbItem>
            <Link href="/" className="text-gray-400 hover:underline">
              {t("game.breadcrumbHome")}
            </Link>
          </BreadcrumbItem>
          <BreadcrumbItem>
            <Link
              href={`/article/${slug}`}
              className="text-gray-400 hover:underline"
            >
              {game?.title || t("common.loading")}
            </Link>
          </BreadcrumbItem>
          <BreadcrumbItem>
            <span className="text-white">
              {patchnote?.title || t("common.loading")}
            </span>
          </BreadcrumbItem>
          {pathname.endsWith("/modifications") && (
            <BreadcrumbItem>
              <span className="text-white">{t("patchnote.modificationsTitle")}</span>
            </BreadcrumbItem>
          )}
        </Breadcrumbs>
        {game && (
          <PatchnoteGameHeader
            gameTitle={game.title}
            gameSlug={slug}
            gameImageUrl={game.imageUrl}
          />
        )}
        {children}
      </div>
    </PatchnoteLayoutContext.Provider>
  );
}

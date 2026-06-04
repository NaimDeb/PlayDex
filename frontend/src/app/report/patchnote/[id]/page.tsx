"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Breadcrumbs, BreadcrumbItem } from "@heroui/breadcrumbs";
import ReportForm from "@/components/ReportForm";
import { PatchnoteGameHeader } from "@/components/PatchnoteGameHeader";
import { useTranslation } from "@/i18n/TranslationProvider";
import gameService from "@/lib/api/gameService";
import { Game } from "@/types/gameType";

export default function ReportPatchnotePage() {
  const { id } = useParams() as { id: string };
  const { t } = useTranslation();
  const [game, setGame] = useState<Game | null>(null);
  const [gameSlug, setGameSlug] = useState<string>("");

  useEffect(() => {
    async function fetchContext() {
      try {
        const patchnote = await gameService.getPatchNoteById(id);
        const gameRef = patchnote.game;
        const gameId =
          typeof gameRef === "string"
            ? gameRef.split("/").pop() || gameRef
            : gameRef?.id?.toString() || "";
        if (gameId) {
          const gameData = await gameService.getGameById(gameId);
          setGame(gameData);
          const slug = `${gameData.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "")}-${gameId}`;
          setGameSlug(slug);
        }
      } catch {
        // Silently fail — header just won't show
      }
    }
    fetchContext();
  }, [id]);

  return (
    <>
      <Breadcrumbs underline="hover" className="mb-6">
        <BreadcrumbItem>
          <Link href="/" className="text-gray-400 hover:underline">
            Accueil
          </Link>
        </BreadcrumbItem>
        {game && (
          <BreadcrumbItem>
            <Link href={`/article/${gameSlug}`} className="text-gray-400 hover:underline">
              {game.title}
            </Link>
          </BreadcrumbItem>
        )}
        <BreadcrumbItem>
          <span className="text-white">{t("report.patchnoteTitle")}</span>
        </BreadcrumbItem>
      </Breadcrumbs>

      {game && gameSlug && (
        <PatchnoteGameHeader
          gameTitle={game.title}
          gameSlug={gameSlug}
          gameImageUrl={game.imageUrl}
        />
      )}

      <h1 className="text-2xl font-montserrat font-bold mb-1 leading-snug">
        {t("report.patchnoteTitle")}
      </h1>
      <ReportForm
        reportableId={Number(id)}
        reportableEntity="Patchnote"
        successMessage={t("report.successPatchnote")}
      />
    </>
  );
}

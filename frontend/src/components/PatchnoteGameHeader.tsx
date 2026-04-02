import Image from "next/image";
import Link from "next/link";
import { useTranslation } from "@/i18n/TranslationProvider";
import { changeIgdbImageFormat, IgdbImageFormat } from "@/lib/utils";

interface PatchnoteGameHeaderProps {
  gameTitle: string;
  gameSlug: string;
  gameImageUrl?: string | null;
}

export function PatchnoteGameHeader({ gameTitle, gameSlug, gameImageUrl }: PatchnoteGameHeaderProps) {
  const { t } = useTranslation();
  const coverUrl = gameImageUrl
    ? changeIgdbImageFormat(gameImageUrl, IgdbImageFormat.CoverSmall)
    : "/no_cover.png";

  return (
    <Link
      href={`/article/${gameSlug}`}
      className="flex items-start gap-4 group w-fit mb-6"
    >
      <div className="relative w-[64px] h-[85px] sm:w-[80px] sm:h-[107px] shrink-0 overflow-hidden rounded border border-off-white/10">
        <Image
          src={coverUrl}
          alt={gameTitle}
          fill
          className="object-cover"
          sizes="56px"
        />
      </div>
      <div>
        <p className="text-sm text-off-white/60 leading-tight">
          {t("patchnote.patchnoteFor")}
        </p>
        <p className="text-lg sm:text-xl font-bold text-off-white group-hover:text-primary transition-colors duration-150 leading-tight">
          {gameTitle}
        </p>
      </div>
    </Link>
  );
}

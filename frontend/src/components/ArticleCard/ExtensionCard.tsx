import { changeIgdbImageFormat, IgdbImageFormat } from "@/lib/utils";
import Image from "next/image";

type ExtensionCardProps = {
  id: number;
  title: string;
  imageUrl: string;
  releasedAt: string;
};

export function ExtensionCard({ title, imageUrl, releasedAt }: ExtensionCardProps) {
  const coverUrl = changeIgdbImageFormat(imageUrl, IgdbImageFormat.CoverBig);

  return (
    <div
      className="relative flex-shrink-0 bg-[#2a2a2a] rounded overflow-hidden cursor-pointer
        hover:scale-105 transition-transform duration-200 ease-in-out opacity-85 hover:opacity-100"
      style={{ width: "110px", height: "162px" }}
    >
      <Image
        src={coverUrl || "/no_cover.png"}
        alt={title}
        fill
        style={{ objectFit: "cover" }}
        className="absolute inset-0"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-transparent" />
      <div className="absolute bottom-2 left-2 right-2 text-white z-10">
        <p className="font-semibold leading-tight truncate" style={{ fontSize: "11px" }}>
          {title}
        </p>
        <p className="text-gray-400 mt-0.5" style={{ fontSize: "9px" }}>
          {new Date(releasedAt).toLocaleDateString("fr-FR")}
        </p>
      </div>
    </div>
  );
}

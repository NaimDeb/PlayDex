import { changeIgdbImageFormat, IgdbImageFormat } from "@/lib/utils";
import Image from "next/image";
type ExtensionCardProps = {
      id: number;
      title: string;
      imageUrl: string;
      releasedAt: string;
};


export function ExtensionCard(extension: ExtensionCardProps) {

    const imageUrl = changeIgdbImageFormat(
                extension.imageUrl, IgdbImageFormat.CoverBig)

    
  return (
    <div
      key={extension.id}
      className="relative flex-shrink-0 w-40 h-60 bg-[#2a2a2a] rounded overflow-hidden hover:scale-105 transition-transform duration-200 ease-in-out cursor-pointer"
    >
      <Image
        src={imageUrl}
        alt={extension.title}
        layout="fill"
        objectFit="cover"
        className="absolute inset-0"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent"></div>
      <div className="absolute bottom-2 left-2 right-2 text-white">
        <p className="text-sm font-semibold">{extension.title}</p>
        <p className="text-xs text-gray-300">
          Sortie: {new Date(extension.releasedAt).toLocaleDateString()}
        </p>
    </div>
    </div>
  );
}

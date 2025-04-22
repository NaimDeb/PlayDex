import React from "react";
import { Extension } from "@/types/gameType";
import { ExtensionCard } from "@/components/ArticleCard/ExtensionCard";

interface ExtensionsSectionProps {
  extensions: Extension[];
}

export const ExtensionsSection: React.FC<ExtensionsSectionProps> = ({
  extensions,
}) => {
  return (
    <section className="mb-12">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold font-montserrat">
          {extensions.length} Extension{extensions.length > 1 && "s"}
        </h2>
        {extensions.length > 6 && (
          <button className="hover:text-off-white/20">Tout voir</button>
        )}
      </div>
      <div className="relative">
        <div className="flex space-x-4 overflow-x-auto pb-4">
          {extensions.map((extension) => (
            <ExtensionCard
              id={extension.id}
              title={extension.title}
              imageUrl={extension.imageUrl}
              releasedAt={extension.releasedAt}
              key={extension.id}
            />
          ))}
        </div>
      </div>
    </section>
  );
};

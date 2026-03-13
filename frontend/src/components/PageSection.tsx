import Link from "next/link";

type PageSectionProps = {
  title?: string;
  seeMoreLabel?: string;
  seeMoreHref?: string;
  children: React.ReactNode;
  className?: string;
};

/**
 * Conteneur de section standard — padding horizontal cohérent sur toutes les pages.
 * Basé sur la maquette Figma 1440px.
 *
 * max-w-[1440px]  : correspond à la largeur Figma
 * mx-auto         : centré sur les grands écrans
 * px-6 sm:px-10   : padding latéral responsive
 */
export function PageSection({
  title,
  seeMoreLabel,
  seeMoreHref,
  children,
  className = "",
}: PageSectionProps) {
  return (
    <section className={`w-full max-w-[1440px] mx-auto px-6 sm:px-10 mb-12 ${className}`}>
      {(title || seeMoreHref) && (
        <div className="flex items-center justify-between mb-4">
          {title && <h2 className="text-2xl font-semibold">{title}</h2>}
          {seeMoreHref && seeMoreLabel && (
            <Link href={seeMoreHref} className="text-sm text-gray-400 hover:underline">
              {seeMoreLabel}
            </Link>
          )}
        </div>
      )}
      {children}
    </section>
  );
}

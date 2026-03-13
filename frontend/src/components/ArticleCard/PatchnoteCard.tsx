import { ThumbsUp, ThumbsDown, ChevronDown, ChevronUp } from "lucide-react";
import { useState } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";

interface Update {
  id?: number;
  importance?: string;
  title: string;
  content: string;
  lineCount?: number;
}

export function PatchnoteCard({ patchnote }: { patchnote: Update }) {
  const [expanded, setExpanded] = useState(false);
  const [vote, setVote] = useState<"up" | "down" | null>(null);
  const pathname = usePathname();

  const isTruncated = patchnote.content.length > 200;
  const displayedContent =
    expanded || !isTruncated
      ? patchnote.content
      : patchnote.content.substring(0, 200) + "…";

  const handleVote = (dir: "up" | "down", e: React.MouseEvent) => {
    e.stopPropagation();
    setVote((v) => (v === dir ? null : dir));
  };

  return (
    <div
      className="bg-[#2a2a2a] rounded-lg shadow-md text-gray-300 border-l-2 border-purple-600"
      onClick={() => isTruncated && setExpanded((v) => !v)}
      tabIndex={0}
      role="button"
      aria-expanded={expanded}
      onKeyDown={(e) => {
        if (isTruncated && (e.key === "Enter" || e.key === " ")) {
          setExpanded((v) => !v);
        }
      }}
    >
      {/* Header */}
      <div className="flex justify-between items-start gap-3 px-4 pt-4 pb-3">
        <Link
          href={`${pathname.replace(/\/$/, "")}/patchnote/${patchnote.id}`}
          className="text-white font-bold text-base leading-snug hover:text-purple-400 transition-colors"
          onClick={(e) => e.stopPropagation()}
        >
          {patchnote.title}
        </Link>

        <div className="flex gap-1 items-center flex-shrink-0">
          <button
            className={`p-1.5 rounded transition-colors ${
              vote === "up"
                ? "text-green-400"
                : "text-gray-500 hover:text-white"
            }`}
            onClick={(e) => handleVote("up", e)}
            tabIndex={-1}
          >
            <ThumbsUp size={15} />
          </button>
          <button
            className={`p-1.5 rounded transition-colors ${
              vote === "down"
                ? "text-red-400"
                : "text-gray-500 hover:text-white"
            }`}
            onClick={(e) => handleVote("down", e)}
            tabIndex={-1}
          >
            <ThumbsDown size={15} />
          </button>
        </div>
      </div>

      {/* Separator */}
      <div className="h-px bg-gradient-to-r from-gray-600 to-transparent mx-4" />

      {/* Content */}
      <p className="text-sm leading-relaxed whitespace-pre-line px-4 py-3">
        {displayedContent}
      </p>

      {/* Footer */}
      {(patchnote.lineCount || isTruncated) && (
        <div className="flex items-center justify-between px-4 pb-3">
          {patchnote.lineCount ? (
            <span className="text-xs text-gray-500 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-purple-600 inline-block" />
              {patchnote.lineCount} lignes
            </span>
          ) : (
            <span />
          )}

          {isTruncated && (
            <button
              className="flex items-center gap-1 text-xs font-bold text-purple-500 hover:text-purple-400 transition-colors"
              onClick={(e) => { e.stopPropagation(); setExpanded((v) => !v); }}
            >
              {expanded ? (
                <><ChevronUp size={13} /> Voir moins</>
              ) : (
                <><ChevronDown size={13} /> Voir plus</>
              )}
            </button>
          )}
        </div>
      )}
    </div>
  );
}

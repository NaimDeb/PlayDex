import { ThumbsUp, ThumbsDown } from 'lucide-react'; // Example using lucide-react icons
import React from 'react';

interface Update {
  id?: number
  importance?: string; // Keep this if needed elsewhere, but not used in the card title per image
  title: string; // e.g., "Mise à jour du 18/09/24"
  content: string; // The main description and bullet points
  lineCount?: number; // Optional: for "120 lignes"
}

export function PatchnoteCard({ patchnote }: { patchnote: Update }) {
  const [expanded, setExpanded] = React.useState(false);

  const isTruncated = patchnote.content.length > 150;
  const displayedContent = expanded || !isTruncated
    ? patchnote.content
    : patchnote.content.substring(0, 150) + '...';

  // Get current URL (without hash or search params)
  const currentUrl = window.location.pathname.replace(/\/$/, '');

  return (
    <div
      className="bg-[#2a2a2a] p-4 rounded-lg shadow-md text-gray-300 cursor-pointer group"
      onClick={() => isTruncated && setExpanded((v) => !v)}
      tabIndex={0}
      role="button"
      aria-expanded={expanded}
      onKeyPress={e => {
        if (isTruncated && (e.key === 'Enter' || e.key === ' ')) {
          setExpanded((v) => !v);
        }
      }}
    >
      {/* Header: Title and Actions */}
      <div className="flex justify-between items-center mb-3 pointer-events-none group-hover:pointer-events-auto">
        <a
          href={`${currentUrl}/patchnote/${patchnote.id}`}
          className="text-xl font-bold text-white hover:underline pointer-events-auto"
          onClick={e => e.stopPropagation()}
        >
          {patchnote.title}
        </a>
        <div className="flex gap-2 items-center pointer-events-auto">
          <button
            className="text-gray-400 hover:text-white"
            onClick={e => e.stopPropagation()}
            tabIndex={-1}
          >
            <ThumbsUp size={18} />
          </button>
          <button
            className="text-gray-400 hover:text-white"
            onClick={e => e.stopPropagation()}
            tabIndex={-1}
          >
            <ThumbsDown size={18} />
          </button>
        </div>
      </div>

      {/* Content Body */}
      <p className="text-sm mb-3 whitespace-pre-line">
        {displayedContent}
      </p>

      {/* Footer: Line count and Voir plus */}
      <div className="flex items-center gap-2 text-sm">
        {patchnote.lineCount && (
          <span className="text-gray-400">{patchnote.lineCount} lignes .....</span>
        )}
        {isTruncated && (
          <span className="text-secondary hover:text-primary font-bold">
            {expanded ? 'Voir moins' : 'Voir plus'}
          </span>
        )}
      </div>
    </div>
  );
}
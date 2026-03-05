/**
 * Reusable pagination component
 * Replaces duplicate pagination logic in SearchResults and other components
 */

'use client';

import React from 'react';
import { generatePagination } from '@/lib/utils';

interface PaginationProps {
  /** Current page number (1-indexed) */
  currentPage: number;
  /** Total number of pages */
  totalPages: number;
  /** Callback when page changes */
  onPageChange: (page: number) => void;
  /** Optional className for styling */
  className?: string;
}

/**
 * Pagination component with ellipsis for large page counts
 * @example
 * <Pagination
 *   currentPage={3}
 *   totalPages={10}
 *   onPageChange={(page) => setCurrentPage(page)}
 * />
 */
export function Pagination({
  currentPage,
  totalPages,
  onPageChange,
  className = "",
}: PaginationProps) {
  const pages = generatePagination(currentPage, totalPages);

  return (
    <div className={`flex justify-center items-center gap-2 mt-8 ${className}`}>
      {/* Previous button */}
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className="pagination-btn px-4 py-2 bg-off-gray text-off-white rounded disabled:opacity-50"
        aria-label="Page précédente"
      >
        ←
      </button>

      {/* Page numbers */}
      {pages.map((page, index) => {
        if (page === '...') {
          return (
            <span key={`ellipsis-${index}`} className="px-2 text-off-white">
              ...
            </span>
          );
        }

        const pageNum = page as number;
        const isActive = pageNum === currentPage;

        return (
          <button
            key={pageNum}
            onClick={() => onPageChange(pageNum)}
            className={`pagination-btn px-4 py-2 rounded ${
              isActive
                ? 'bg-primary text-white font-bold'
                : 'bg-off-gray text-off-white hover:bg-secondary'
            }`}
            aria-label={`Page ${pageNum}`}
            aria-current={isActive ? 'page' : undefined}
          >
            {pageNum}
          </button>
        );
      })}

      {/* Next button */}
      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className="pagination-btn px-4 py-2 bg-off-gray text-off-white rounded disabled:opacity-50"
        aria-label="Page suivante"
      >
        →
      </button>
    </div>
  );
}

import { MS_PER_DAY, MS_PER_HOUR, MS_PER_MINUTE, MS_PER_YEAR } from '@/constants/date.constants';

/**
 * Formats a monetary amount in USD currency
 * @param amount - Amount in cents
 * @returns Formatted currency string (e.g., "$12.34")
 */
export const formatCurrency = (amount: number) => {
  return (amount / 100).toLocaleString('en-US', {
    style: 'currency',
    currency: 'USD',
  });
};

/**
 * Combines multiple class names into a single string, filtering out falsy values
 * @param classes - Array of class names or conditional values
 * @returns Combined class name string
 * @example
 * cn('base-class', isActive && 'active', 'another-class') // "base-class active another-class"
 */
export function cn(...classes: (string | undefined | false)[]) {
    return classes.filter(Boolean).join(" ");
  }

/**
 * Formats a date string to local format
 * @param dateStr - ISO date string
 * @param locale - Locale code (default: 'en-US')
 * @returns Formatted date string (e.g., "Jan 15, 2024")
 */
export const formatDateToLocal = (
  dateStr: string,
  locale: string = 'en-US',
) => {
  const date = new Date(dateStr);
  const options: Intl.DateTimeFormatOptions = {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  };
  const formatter = new Intl.DateTimeFormat(locale, options);
  return formatter.format(date);
};

/**
 * Formats the time difference between a given date and now in French
 * Returns a human-readable string like "Il y a 2 jours" or "Il y a 3 ans"
 * @param date - Target date to calculate difference from (Date object or ISO string)
 * @returns Human-readable time difference in French
 * @example
 * formatDateDifference(new Date('2024-01-01')) // "Il y a 43 jours"
 * formatDateDifference('2023-01-01') // "Il y a 1 an"
 */
export function formatDateDifference(date: Date | string): string {
  const targetDate = typeof date === 'string' ? new Date(date) : date;
  const now = new Date();
  const diffMs = Math.abs(now.getTime() - targetDate.getTime());

  // Less than a minute
  if (diffMs < MS_PER_MINUTE) {
    return "Il y a quelques secondes";
  }

  // Less than an hour
  if (diffMs < MS_PER_HOUR) {
    const minutes = Math.floor(diffMs / MS_PER_MINUTE);
    return `Il y a ${minutes} minute${minutes > 1 ? 's' : ''}`;
  }

  // Less than a day
  if (diffMs < MS_PER_DAY) {
    const hours = Math.floor(diffMs / MS_PER_HOUR);
    return `Il y a ${hours} heure${hours > 1 ? 's' : ''}`;
  }

  // Less than a year
  if (diffMs < MS_PER_YEAR) {
    const days = Math.floor(diffMs / MS_PER_DAY);
    if (days <= 1) return "Il y a 1 jour";
    return `Il y a ${days} jours`;
  }

  // One or more years
  const years = Math.floor(diffMs / MS_PER_YEAR);
  if (years === 1) return "Il y a 1 an";
  return `Il y a ${years} ans`;
}


/**
 * Generates pagination array with ellipsis for large page counts
 * Returns an array of page numbers and ellipsis markers ('...') for pagination UI
 * @param currentPage - Current active page number (1-indexed)
 * @param totalPages - Total number of pages available
 * @returns Array of page numbers and/or '...' markers
 * @example
 * generatePagination(1, 5) // [1, 2, 3, 4, 5]
 * generatePagination(5, 10) // [1, '...', 4, 5, 6, '...', 10]
 */
export const generatePagination = (currentPage: number, totalPages: number) => {
  // If the total number of pages is 7 or less, display all pages without any ellipsis
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }

  // If the current page is among the first 3 pages, show the first 3, an ellipsis, and the last 2 pages
  if (currentPage <= 3) {
    return [1, 2, 3, '...', totalPages - 1, totalPages];
  }

  // If the current page is among the last 3 pages, show the first 2, an ellipsis, and the last 3 pages
  if (currentPage >= totalPages - 2) {
    return [1, 2, '...', totalPages - 2, totalPages - 1, totalPages];
  }

  // If the current page is somewhere in the middle, show the first page, an ellipsis,
  // the current page and its neighbors, another ellipsis, and the last page
  return [
    1,
    '...',
    currentPage - 1,
    currentPage,
    currentPage + 1,
    '...',
    totalPages,
  ];
};

/**
 * IGDB (Internet Game Database) image format types
 * Used to specify different image sizes when fetching game cover art and screenshots
 */
export enum IgdbImageFormat {
  Thumbnail = "t_thumb",
  CoverBig2x = "t_cover_big_2x",
  CoverBig = "t_cover_big",
  CoverSmall = "t_cover_small",
  ScreenshotBig = "t_screenshot_big",
  ScreenshotMed = "t_screenshot_med",
}

/**
 * Converts an IGDB image URL to a different format/size
 * Replaces the thumbnail format in the URL with the specified format
 * @param imageUrl - Original IGDB image URL
 * @param format - Desired image format from IgdbImageFormat enum
 * @returns Updated URL with new format
 * @example
 * changeIgdbImageFormat('https://images.igdb.com/igdb/image/upload/t_thumb/abc.jpg', IgdbImageFormat.CoverBig)
 * // Returns: 'https://images.igdb.com/igdb/image/upload/t_cover_big/abc.jpg'
 */
export function changeIgdbImageFormat(imageUrl: string, format: IgdbImageFormat) {
  return imageUrl.replace(IgdbImageFormat.Thumbnail, format);
}

/**
 * Converts custom BBCode-style markup to HTML for buff/debuff highlighting
 * Transforms [buff]text[/buff] and [debuff]text[/debuff] tags into styled spans
 * @param content - Raw content string with BBCode-style markup
 * @returns HTML string with styled span elements
 * @example
 * colorizeContent('Damage [buff]increased[/buff] by 10%')
 * // Returns: 'Damage <span class="buff">increased</span> by 10%'
 */
export function colorizeContent(content: string) {
  return content
    .replace(/\[buff\](.*?)\[\/buff\]/g, '<span class="buff">$1</span>')
    .replace(/\[debuff\](.*?)\[\/debuff\]/g, '<span class="debuff">$1</span>');
}
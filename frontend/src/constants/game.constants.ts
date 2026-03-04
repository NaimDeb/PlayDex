/**
 * Game-related constants and enumerations
 * @module constants/game
 */

/** Available game categories for search */
export const GAME_CATEGORIES = [
  { value: 'jeux', label: 'Jeux' },
  { value: 'extensions', label: 'Extensions' },
  { value: 'genre', label: 'Genre' },
  { value: 'entreprise', label: 'Entreprise' },
] as const;

/** Type for game category values */
export type GameCategory = typeof GAME_CATEGORIES[number]['value'];

/** Skeleton loader placeholder count for game lists */
export const GAME_SKELETON_COUNT = 6;

/** Default content truncation length for game descriptions */
export const GAME_DESCRIPTION_TRUNCATE_LENGTH = 150;

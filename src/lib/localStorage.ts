/**
 * Local Storage Utility
 * Manages user preferences for favorites and difficulty filters
 */

const STORAGE_KEYS = {
  FAVORITES: 'ow2-favorites',
  DIFFICULTY_FILTER: 'ow2-difficulty-filter',
} as const;

export type DifficultyLevel = 'easy' | 'medium' | 'hard';

// ============ FAVORITES ============

export function getFavorites(): string[] {
  if (typeof window === 'undefined') return [];
  
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.FAVORITES);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error('Error loading favorites:', error);
    return [];
  }
}

export function saveFavorites(favorites: string[]): void {
  if (typeof window === 'undefined') return;
  
  try {
    localStorage.setItem(STORAGE_KEYS.FAVORITES, JSON.stringify(favorites));
  } catch (error) {
    console.error('Error saving favorites:', error);
  }
}

export function toggleFavorite(heroId: string): string[] {
  const favorites = getFavorites();
  const index = favorites.indexOf(heroId);
  
  if (index > -1) {
    // Remove from favorites
    favorites.splice(index, 1);
  } else {
    // Add to favorites
    favorites.push(heroId);
  }
  
  saveFavorites(favorites);
  return favorites;
}

export function isFavorite(heroId: string): boolean {
  return getFavorites().includes(heroId);
}

// ============ DIFFICULTY FILTER ============

export function getDifficultyFilter(): DifficultyLevel[] {
  if (typeof window === 'undefined') return ['easy', 'medium', 'hard'];
  
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.DIFFICULTY_FILTER);
    return stored ? JSON.parse(stored) : ['easy', 'medium', 'hard'];
  } catch (error) {
    console.error('Error loading difficulty filter:', error);
    return ['easy', 'medium', 'hard'];
  }
}

export function saveDifficultyFilter(difficulties: DifficultyLevel[]): void {
  if (typeof window === 'undefined') return;
  
  try {
    localStorage.setItem(STORAGE_KEYS.DIFFICULTY_FILTER, JSON.stringify(difficulties));
  } catch (error) {
    console.error('Error saving difficulty filter:', error);
  }
}

export function toggleDifficulty(difficulty: DifficultyLevel): DifficultyLevel[] {
  const current = getDifficultyFilter();
  const index = current.indexOf(difficulty);
  
  // Don't allow removing all difficulties
  if (index > -1 && current.length > 1) {
    current.splice(index, 1);
  } else if (index === -1) {
    current.push(difficulty);
  }
  
  saveDifficultyFilter(current);
  return current;
}


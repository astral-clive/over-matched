/**
 * User Preferences Storage
 * 
 * Handles localStorage operations for:
 * - Favorite heroes
 * - Saved match configurations
 * - Playstyle preferences
 * - Overwatch profile links
 * - Hero stats (playtime, winrate)
 */

export type Playstyle = "aggressive" | "balanced" | "defensive";

export interface UserHeroStats {
  heroId: string;
  playtime: number;      // Hours played
  winRate: number;       // Percentage (0-100)
}

export interface OverwatchProfile {
  platform: "pc" | "xbox" | "playstation" | "nintendo";
  profileUrl: string;    // Link to Overbuff, OverTracker, etc.
  battleTag?: string;    // e.g., "Player#1234"
}

export interface SavedMatchConfig {
  id: string;
  name: string;
  role: string;
  rank: string;
  mapType: string;
  enemyHeroes: string[];
  allyHeroes: string[];
  createdAt: string;     // ISO date string
}

export interface UserPreferences {
  favoriteHeroes: string[];         // Hero ids
  playstyle: Playstyle;
  profile?: OverwatchProfile;
  heroStats: UserHeroStats[];
  savedConfigs: SavedMatchConfig[];
}

const STORAGE_KEY = "ow2-pick-coach-preferences";

// Default preferences
const DEFAULT_PREFERENCES: UserPreferences = {
  favoriteHeroes: [],
  playstyle: "balanced",
  heroStats: [],
  savedConfigs: [],
};

/**
 * Load user preferences from localStorage
 */
export function loadPreferences(): UserPreferences {
  if (typeof window === "undefined") {
    return DEFAULT_PREFERENCES;
  }

  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) {
      return DEFAULT_PREFERENCES;
    }

    const parsed = JSON.parse(stored);
    return {
      ...DEFAULT_PREFERENCES,
      ...parsed,
    };
  } catch (error) {
    console.error("Failed to load preferences:", error);
    return DEFAULT_PREFERENCES;
  }
}

/**
 * Save user preferences to localStorage
 */
export function savePreferences(preferences: UserPreferences): void {
  if (typeof window === "undefined") {
    return;
  }

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(preferences));
  } catch (error) {
    console.error("Failed to save preferences:", error);
  }
}

/**
 * Clear all preferences
 */
export function clearPreferences(): void {
  if (typeof window === "undefined") {
    return;
  }

  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.error("Failed to clear preferences:", error);
  }
}

/**
 * Add a favorite hero
 */
export function addFavoriteHero(heroId: string): void {
  const prefs = loadPreferences();
  if (!prefs.favoriteHeroes.includes(heroId)) {
    prefs.favoriteHeroes.push(heroId);
    savePreferences(prefs);
  }
}

/**
 * Remove a favorite hero
 */
export function removeFavoriteHero(heroId: string): void {
  const prefs = loadPreferences();
  prefs.favoriteHeroes = prefs.favoriteHeroes.filter(id => id !== heroId);
  savePreferences(prefs);
}

/**
 * Update hero stats
 */
export function updateHeroStats(heroId: string, playtime: number, winRate: number): void {
  const prefs = loadPreferences();
  const existingIndex = prefs.heroStats.findIndex(s => s.heroId === heroId);

  if (existingIndex >= 0) {
    prefs.heroStats[existingIndex] = { heroId, playtime, winRate };
  } else {
    prefs.heroStats.push({ heroId, playtime, winRate });
  }

  savePreferences(prefs);
}

/**
 * Get stats for a specific hero
 */
export function getHeroStats(heroId: string): UserHeroStats | undefined {
  const prefs = loadPreferences();
  return prefs.heroStats.find(s => s.heroId === heroId);
}

/**
 * Save a match configuration
 */
export function saveMatchConfig(config: Omit<SavedMatchConfig, "id" | "createdAt">): void {
  const prefs = loadPreferences();
  const newConfig: SavedMatchConfig = {
    ...config,
    id: `config-${Date.now()}`,
    createdAt: new Date().toISOString(),
  };
  prefs.savedConfigs.push(newConfig);
  savePreferences(prefs);
}

/**
 * Delete a saved match configuration
 */
export function deleteMatchConfig(configId: string): void {
  const prefs = loadPreferences();
  prefs.savedConfigs = prefs.savedConfigs.filter(c => c.id !== configId);
  savePreferences(prefs);
}

/**
 * Update playstyle preference
 */
export function updatePlaystyle(playstyle: Playstyle): void {
  const prefs = loadPreferences();
  prefs.playstyle = playstyle;
  savePreferences(prefs);
}

/**
 * Update profile information
 */
export function updateProfile(profile: OverwatchProfile): void {
  const prefs = loadPreferences();
  prefs.profile = profile;
  savePreferences(prefs);
}


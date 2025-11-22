/**
 * Hero Recommendation Engine
 * 
 * HOW THE SCORING WORKS:
 * 1. Base Score: Starts with hero's generalTierScore (0-100)
 * 2. Counter Score: +5 for each enemy hero countered, -4 for each enemy that counters this hero
 * 3. Synergy Score: +3 for each ally hero that synergizes well
 * 4. Map Affinity: +3 if the hero excels on the selected map type
 * 5. Rank Adjustment: Slight adjustments for difficulty vs rank (optional)
 * 
 * HOW TO ADJUST WEIGHTS:
 * - Change COUNTER_BONUS to adjust how much countering enemies matters
 * - Change COUNTER_PENALTY to adjust how much being countered matters
 * - Change SYNERGY_BONUS to adjust how much team synergy matters
 * - Change MAP_BONUS to adjust how much map affinity matters
 * 
 * All constants are at the top of this file for easy editing.
 */

import { HeroMeta, Role, HEROES, HERO_BY_ID, UserHeroStats } from "@/data/heroes";

// ============ SCORING WEIGHTS (Edit these to tune recommendations) ============
const COUNTER_BONUS = 5;        // Points added for each enemy hero countered
const COUNTER_PENALTY = 4;      // Points subtracted for each enemy that counters you
const SYNERGY_BONUS = 3;        // Points added for each ally synergy
const MAP_BONUS = 3;            // Points added if hero favors this map type
const PLAYTIME_BONUS = 2;       // Points per 10 hours of playtime (familiarity)
const WINRATE_BONUS = 0.15;     // Points per 1% win rate above 50%
const FAVORITE_BONUS = 5;       // Points for favorited heroes

// Rank-based difficulty adjustments (optional, currently minimal)
const RANK_ORDER = ["bronze", "silver", "gold", "platinum", "diamond", "master", "grandmaster"];

export interface RecommendationInput {
  role: Role;
  enemyHeroes: string[];   // Hero ids
  allyHeroes: string[];    // Hero ids (excluding player)
  rank?: string;           // e.g., "gold", "platinum", etc.
  mapType?: string;        // "control" | "hybrid" | "payload" | "flashpoint" | "any"
  userStats?: UserHeroStats[];  // User's personal hero stats
  favoriteHeroes?: string[];    // User's favorite heroes
}

export interface HeroRecommendation {
  hero: HeroMeta;
  score: number;
  reasons: string[];       // Human-readable explanations
}

export function recommendHeroes(input: RecommendationInput): HeroRecommendation[] {
  const { role, enemyHeroes, allyHeroes, rank, mapType, userStats = [], favoriteHeroes = [] } = input;

  // Filter heroes by requested role
  const candidates = HEROES.filter(h => h.role === role);

  // Score each candidate
  const recommendations: HeroRecommendation[] = candidates.map(hero => {
    let score = hero.generalTierScore;
    const reasons: string[] = [];

    // 1. Base meta strength
    if (hero.generalTierScore >= 80) {
      reasons.push("High general meta strength");
    } else if (hero.generalTierScore >= 70) {
      reasons.push("Solid meta pick");
    }

    // 2. Counter scoring
    const counteredEnemies: string[] = [];
    const counteredBy: string[] = [];

    enemyHeroes.forEach(enemyId => {
      const enemy = HERO_BY_ID[enemyId];
      if (!enemy) return;

      if (hero.strongAgainst.includes(enemyId)) {
        score += COUNTER_BONUS;
        counteredEnemies.push(enemy.name);
      }
      if (hero.weakAgainst.includes(enemyId)) {
        score -= COUNTER_PENALTY;
        counteredBy.push(enemy.name);
      }
    });

    if (counteredEnemies.length > 0) {
      reasons.push(`Strong against ${counteredEnemies.slice(0, 3).join(", ")}`);
    }
    if (counteredBy.length > 0) {
      reasons.push(`⚠️ Weak against ${counteredBy.slice(0, 2).join(", ")}`);
    }

    // 3. Synergy scoring
    const synergies: string[] = [];
    allyHeroes.forEach(allyId => {
      const ally = HERO_BY_ID[allyId];
      if (!ally) return;

      if (hero.synergizesWith.includes(allyId)) {
        score += SYNERGY_BONUS;
        synergies.push(ally.name);
      }
    });

    if (synergies.length > 0) {
      reasons.push(`Good synergy with ${synergies.slice(0, 3).join(", ")}`);
    }

    // 4. Map affinity
    if (mapType && mapType !== "any" && hero.mapAffinity?.includes(mapType)) {
      score += MAP_BONUS;
      reasons.push(`Excels on ${mapType} maps`);
    }

    // 5. Rank-based difficulty adjustment (optional, light touch)
    if (rank && hero.difficulty) {
      const rankIndex = RANK_ORDER.indexOf(rank.toLowerCase());
      if (rankIndex >= 0) {
        // In lower ranks, easier heroes get a small boost
        if (hero.difficulty === "easy" && rankIndex < 3) {
          score += 2;
          reasons.push("Easy to execute at this rank");
        }
        // In higher ranks, hard heroes are more rewarding
        if (hero.difficulty === "hard" && rankIndex >= 5) {
          score += 1;
        }
      }
    }

    // 6. User stats bonus (familiarity & success)
    const heroStats = userStats.find(s => s.heroId === hero.id);
    if (heroStats) {
      // Playtime bonus: More experience = better performance
      const playtimeBonus = Math.floor(heroStats.playtime / 10) * PLAYTIME_BONUS;
      if (playtimeBonus > 0) {
        score += playtimeBonus;
        reasons.push(`⭐ ${heroStats.playtime.toFixed(1)}h experience`);
      }

      // Win rate bonus: High win rate = proven success
      if (heroStats.winRate > 50) {
        const winrateBonus = (heroStats.winRate - 50) * WINRATE_BONUS;
        score += winrateBonus;
        reasons.push(`⭐ ${heroStats.winRate.toFixed(0)}% win rate`);
      }
    }

    // 7. Favorite hero bonus
    if (favoriteHeroes.includes(hero.id)) {
      score += FAVORITE_BONUS;
      reasons.push("❤️ Favorited hero");
    }

    // Ensure score doesn't go below 0
    score = Math.max(0, score);

    return {
      hero,
      score,
      reasons,
    };
  });

  // Sort by score descending
  recommendations.sort((a, b) => b.score - a.score);

  return recommendations;
}

/**
 * Get a quick summary of why a hero scored well or poorly
 */
export function getScoreSummary(recommendation: HeroRecommendation): string {
  if (recommendation.score >= 90) return "Excellent choice";
  if (recommendation.score >= 80) return "Great pick";
  if (recommendation.score >= 70) return "Good option";
  if (recommendation.score >= 60) return "Viable pick";
  return "Situational";
}


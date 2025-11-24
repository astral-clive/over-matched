"use client";

import { useState, useEffect } from "react";
import { Role } from "@/data/heroes";
import { recommendHeroes, HeroRecommendation } from "@/lib/recommendation";
import HeroCard from "@/components/HeroCard";
import HeroMultiSelect from "@/components/HeroMultiSelect";
import { 
  getFavorites, 
  toggleFavorite as toggleFavoriteStorage,
  getDifficultyFilter,
  toggleDifficulty as toggleDifficultyStorage,
  type DifficultyLevel 
} from "@/lib/localStorage";

const roles: Role[] = ["tank", "damage", "support"];
const ranks = ["Bronze", "Silver", "Gold", "Platinum", "Diamond", "Master", "Grandmaster"];
const mapTypes = ["Any", "Control", "Hybrid", "Payload", "Flashpoint"];

export default function HomePage() {
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [selectedRank, setSelectedRank] = useState<string>("Gold");
  const [selectedMapType, setSelectedMapType] = useState<string>("Any");
  const [enemyHeroes, setEnemyHeroes] = useState<string[]>([]);
  const [allyHeroes, setAllyHeroes] = useState<string[]>([]);
  const [recommendations, setRecommendations] = useState<HeroRecommendation[]>([]);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [difficultyFilter, setDifficultyFilter] = useState<DifficultyLevel[]>(["easy", "medium", "hard"]);

  // Load favorites and difficulty filter from local storage on mount
  useEffect(() => {
    setFavorites(getFavorites());
    setDifficultyFilter(getDifficultyFilter());
  }, []);

  // Auto-update recommendations whenever inputs change
  useEffect(() => {
    if (!selectedRole) {
      setRecommendations([]);
      return;
    }

    const results = recommendHeroes({
      role: selectedRole,
      enemyHeroes,
      allyHeroes,
      rank: selectedRank.toLowerCase(),
      mapType: selectedMapType.toLowerCase(),
      favoriteHeroes: favorites,
      difficultyFilter,
    });

    setRecommendations(results);
  }, [selectedRole, selectedRank, selectedMapType, enemyHeroes, allyHeroes, favorites, difficultyFilter]);

  const handleToggleFavorite = (heroId: string) => {
    const newFavorites = toggleFavoriteStorage(heroId);
    setFavorites(newFavorites);
  };

  const handleToggleDifficulty = (difficulty: DifficultyLevel) => {
    const newFilter = toggleDifficultyStorage(difficulty);
    setDifficultyFilter(newFilter);
  };

  return (
    <div className="min-h-screen p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <header className="text-center mb-8">
          <h1 className="text-4xl sm:text-5xl font-bold bg-gradient-to-r from-blue-400 via-purple-400 to-cyan-400 bg-clip-text text-transparent mb-2">
            OW2 Pick Coach
          </h1>
          <p className="text-slate-400 text-sm sm:text-base">
            Select your lobby, get statistically-informed hero picks
          </p>
        </header>

        {/* Main content */}
        <div className="grid lg:grid-cols-[35%_65%] gap-6">
          {/* Left Panel - Inputs */}
          <div className="bg-slate-800/30 backdrop-blur-sm rounded-xl p-6 border border-slate-700/50 h-fit">
            <h2 className="text-xl font-bold text-slate-100 mb-6">Configure Your Match</h2>

            {/* Role Selector */}
            <div className="mb-6">
              <label className="block text-sm font-semibold text-slate-200 mb-3">
                Your Role
              </label>
              <div className="grid grid-cols-3 gap-2">
                {roles.map(role => {
                  const isSelected = selectedRole === role;
                  const colors = {
                    tank: isSelected
                      ? "bg-blue-500 border-blue-400 text-white"
                      : "bg-blue-500/20 border-blue-500/50 text-blue-300 hover:bg-blue-500/30",
                    damage: isSelected
                      ? "bg-red-500 border-red-400 text-white"
                      : "bg-red-500/20 border-red-500/50 text-red-300 hover:bg-red-500/30",
                    support: isSelected
                      ? "bg-green-500 border-green-400 text-white"
                      : "bg-green-500/20 border-green-500/50 text-green-300 hover:bg-green-500/30",
                  };

                  return (
                    <button
                      key={role}
                      onClick={() => setSelectedRole(role)}
                      className={`px-4 py-3 rounded-lg border-2 font-semibold text-sm uppercase transition-all ${colors[role]}`}
                    >
                      {role}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Rank Selector */}
            <div className="mb-6">
              <label className="block text-sm font-semibold text-slate-200 mb-2">
                Your Rank
              </label>
              <select
                value={selectedRank}
                onChange={(e) => setSelectedRank(e.target.value)}
                className="w-full px-4 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all"
              >
                {ranks.map(rank => (
                  <option key={rank} value={rank}>
                    {rank}
                  </option>
                ))}
              </select>
            </div>

            {/* Map Type Selector */}
            <div className="mb-6">
              <label className="block text-sm font-semibold text-slate-200 mb-2">
                Map Type
              </label>
              <select
                value={selectedMapType}
                onChange={(e) => setSelectedMapType(e.target.value)}
                className="w-full px-4 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all"
              >
                {mapTypes.map(mapType => (
                  <option key={mapType} value={mapType}>
                    {mapType}
                  </option>
                ))}
              </select>
            </div>

            {/* Enemy Heroes */}
            <HeroMultiSelect
              label="Enemy Team Heroes"
              selectedHeroes={enemyHeroes}
              onChange={setEnemyHeroes}
              maxSelections={5}
            />

            {/* Ally Heroes */}
            <HeroMultiSelect
              label="Your Team Heroes"
              selectedHeroes={allyHeroes}
              onChange={setAllyHeroes}
              maxSelections={4}
            />
          </div>

          {/* Right Panel - Recommendations */}
          <div>
            {!selectedRole ? (
              <div className="bg-slate-800/30 backdrop-blur-sm rounded-xl p-12 border border-slate-700/50 text-center">
                <div className="max-w-md mx-auto">
                  <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-purple-500/20 to-cyan-500/20 flex items-center justify-center">
                    <svg
                      className="w-10 h-10 text-slate-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M13 10V3L4 14h7v7l9-11h-7z"
                      />
                    </svg>
                  </div>
                  <h3 className="text-xl font-bold text-slate-200 mb-2">
                    Select Your Role to Start
                  </h3>
                  <p className="text-slate-400 text-sm">
                    Choose your role and configure the match details on the left to get data-driven hero suggestions.
                  </p>
                </div>
              </div>
            ) : recommendations.length === 0 ? (
              <div className="bg-slate-800/30 backdrop-blur-sm rounded-xl p-12 border border-slate-700/50 text-center">
                <div className="max-w-md mx-auto">
                  <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-yellow-500/20 flex items-center justify-center">
                    <svg
                      className="w-10 h-10 text-yellow-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                      />
                    </svg>
                  </div>
                  <h3 className="text-xl font-bold text-slate-200 mb-2">
                    No heroes found
                  </h3>
                  <p className="text-slate-400 text-sm">
                    Try adjusting your team composition or map settings to see recommendations.
                  </p>
                </div>
              </div>
            ) : (
              <div>
                <div className="mb-6">
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-4">
                    <div>
                      <h2 className="text-2xl font-bold text-slate-100">
                        Recommended {selectedRole ? selectedRole.charAt(0).toUpperCase() + selectedRole.slice(1) : "Hero"} Picks
                      </h2>
                      <p className="text-slate-400 text-sm mt-1">
                        Showing {recommendations.length} {recommendations.length === 1 ? "option" : "options"} based on your match setup
                      </p>
                    </div>

                    {/* Difficulty Filter - Moved to results panel */}
                    <div className="bg-slate-800/30 backdrop-blur-sm rounded-lg p-3 border border-slate-700/50">
                      <label className="block text-xs font-semibold text-slate-300 mb-2">
                        Filter by Difficulty
                      </label>
                      <div className="flex gap-2">
                        {(["easy", "medium", "hard"] as DifficultyLevel[]).map((difficulty) => {
                          const isSelected = difficultyFilter.includes(difficulty);
                          const colors = {
                            easy: isSelected
                              ? "bg-green-500 text-white border-green-400 shadow-lg shadow-green-500/20"
                              : "bg-green-500/20 text-green-300 border-green-500/50 hover:bg-green-500/30",
                            medium: isSelected
                              ? "bg-yellow-500 text-white border-yellow-400 shadow-lg shadow-yellow-500/20"
                              : "bg-yellow-500/20 text-yellow-300 border-yellow-500/50 hover:bg-yellow-500/30",
                            hard: isSelected
                              ? "bg-red-500 text-white border-red-400 shadow-lg shadow-red-500/20"
                              : "bg-red-500/20 text-red-300 border-red-500/50 hover:bg-red-500/30",
                          };

                          return (
                            <button
                              key={difficulty}
                              onClick={() => handleToggleDifficulty(difficulty)}
                              className={`px-3 py-1.5 rounded-lg border-2 font-semibold text-xs uppercase transition-all flex items-center justify-center gap-1.5 ${colors[difficulty]}`}
                              title={`${isSelected ? 'Hide' : 'Show'} ${difficulty} heroes`}
                            >
                              {difficulty === "easy" && (
                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                              )}
                              {difficulty === "medium" && (
                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                </svg>
                              )}
                              {difficulty === "hard" && (
                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                </svg>
                              )}
                              <span className="hidden sm:inline">{difficulty}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-1 xl:grid-cols-2">
                  {recommendations.slice(0, 6).map((rec, idx) => (
                    <HeroCard 
                      key={rec.hero.id} 
                      recommendation={rec}
                      isFavorite={favorites.includes(rec.hero.id)}
                      onToggleFavorite={handleToggleFavorite}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}


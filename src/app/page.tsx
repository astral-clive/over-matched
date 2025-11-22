"use client";

import { useState, useEffect } from "react";
import { Role } from "@/data/heroes";
import { recommendHeroes, HeroRecommendation } from "@/lib/recommendation";
import HeroCard from "@/components/HeroCard";
import HeroMultiSelect from "@/components/HeroMultiSelect";
import PreferencesModal from "@/components/PreferencesModal";
import SavedConfigCard from "@/components/SavedConfigCard";
import {
  UserPreferences,
  SavedMatchConfig,
  loadPreferences,
  saveMatchConfig,
  deleteMatchConfig,
} from "@/lib/preferences";

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
  const [hasSearched, setHasSearched] = useState(false);
  const [preferences, setPreferences] = useState<UserPreferences | null>(null);
  const [showPreferences, setShowPreferences] = useState(false);
  const [showSaveConfig, setShowSaveConfig] = useState(false);
  const [configName, setConfigName] = useState("");

  // Load preferences on mount
  useEffect(() => {
    const prefs = loadPreferences();
    setPreferences(prefs);
  }, []);

  const handleRecommend = () => {
    if (!selectedRole || !preferences) {
      return;
    }

    const results = recommendHeroes({
      role: selectedRole,
      enemyHeroes,
      allyHeroes,
      rank: selectedRank.toLowerCase(),
      mapType: selectedMapType.toLowerCase(),
      userStats: preferences.heroStats,
      favoriteHeroes: preferences.favoriteHeroes,
    });

    setRecommendations(results);
    setHasSearched(true);
  };

  const handleSaveConfig = () => {
    if (!configName.trim() || !selectedRole) {
      return;
    }

    saveMatchConfig({
      name: configName,
      role: selectedRole,
      rank: selectedRank,
      mapType: selectedMapType,
      enemyHeroes,
      allyHeroes,
    });

    // Reload preferences to get updated saved configs
    const prefs = loadPreferences();
    setPreferences(prefs);
    setConfigName("");
    setShowSaveConfig(false);
  };

  const handleLoadConfig = (config: SavedMatchConfig) => {
    setSelectedRole(config.role as Role);
    setSelectedRank(config.rank);
    setSelectedMapType(config.mapType);
    setEnemyHeroes(config.enemyHeroes);
    setAllyHeroes(config.allyHeroes);
  };

  const handleDeleteConfig = (configId: string) => {
    deleteMatchConfig(configId);
    const prefs = loadPreferences();
    setPreferences(prefs);
  };

  const handlePreferencesSave = (newPrefs: UserPreferences) => {
    setPreferences(newPrefs);
    // Re-run recommendations if we've already searched
    if (hasSearched && selectedRole) {
      const results = recommendHeroes({
        role: selectedRole,
        enemyHeroes,
        allyHeroes,
        rank: selectedRank.toLowerCase(),
        mapType: selectedMapType.toLowerCase(),
        userStats: newPrefs.heroStats,
        favoriteHeroes: newPrefs.favoriteHeroes,
      });
      setRecommendations(results);
    }
  };

  const canRecommend = selectedRole !== null;
  const hasPreferences =
    preferences &&
    (preferences.favoriteHeroes.length > 0 ||
      preferences.heroStats.length > 0 ||
      preferences.profile?.profileUrl);

  if (!preferences) {
    return null; // Loading
  }

  return (
    <div className="min-h-screen p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <header className="text-center mb-8">
          <div className="flex items-center justify-center gap-4 mb-2">
            <h1 className="text-4xl sm:text-5xl font-bold bg-gradient-to-r from-blue-400 via-purple-400 to-cyan-400 bg-clip-text text-transparent">
              OW2 Pick Coach
            </h1>
            <button
              onClick={() => setShowPreferences(true)}
              className="relative p-3 rounded-lg bg-slate-800/50 border border-slate-700 hover:border-slate-600 transition-all"
              title="Open Preferences"
            >
              <svg className="w-6 h-6 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              {hasPreferences && (
                <span className="absolute -top-1 -right-1 w-3 h-3 bg-cyan-500 rounded-full border-2 border-slate-900"></span>
              )}
            </button>
          </div>
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

            {/* Recommend Button */}
            <button
              onClick={handleRecommend}
              disabled={!canRecommend}
              className={`w-full py-3 px-6 rounded-lg font-bold text-white text-sm uppercase tracking-wide transition-all ${
                canRecommend
                  ? "bg-gradient-to-r from-purple-500 to-cyan-500 hover:from-purple-600 hover:to-cyan-600 shadow-lg hover:shadow-xl"
                  : "bg-slate-700 text-slate-500 cursor-not-allowed"
              }`}
            >
              {canRecommend ? "Get Recommendations" : "Select Your Role First"}
            </button>

            {/* Save Config Button */}
            {canRecommend && (
              <div className="mt-4 pt-4 border-t border-slate-700/50">
                {!showSaveConfig ? (
                  <button
                    onClick={() => setShowSaveConfig(true)}
                    className="w-full py-2 px-4 rounded-lg border border-slate-600 text-slate-300 hover:bg-slate-800 text-sm transition-all"
                  >
                    💾 Save Configuration
                  </button>
                ) : (
                  <div className="space-y-2">
                    <input
                      type="text"
                      value={configName}
                      onChange={(e) => setConfigName(e.target.value)}
                      placeholder="Configuration name..."
                      className="w-full px-3 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-slate-200 text-sm placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={handleSaveConfig}
                        disabled={!configName.trim()}
                        className="flex-1 py-2 px-4 rounded-lg bg-cyan-500 text-white text-sm hover:bg-cyan-600 disabled:bg-slate-700 disabled:text-slate-500 transition-all"
                      >
                        Save
                      </button>
                      <button
                        onClick={() => {
                          setShowSaveConfig(false);
                          setConfigName("");
                        }}
                        className="flex-1 py-2 px-4 rounded-lg border border-slate-600 text-slate-300 hover:bg-slate-800 text-sm transition-all"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Saved Configurations */}
            {preferences.savedConfigs.length > 0 && (
              <div className="mt-4 pt-4 border-t border-slate-700/50">
                <h3 className="text-sm font-semibold text-slate-200 mb-3">Saved Configurations</h3>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {preferences.savedConfigs.map(config => (
                    <SavedConfigCard
                      key={config.id}
                      config={config}
                      onLoad={handleLoadConfig}
                      onDelete={handleDeleteConfig}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right Panel - Recommendations */}
          <div>
            {!hasSearched ? (
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
                    Ready to find your perfect pick?
                  </h3>
                  <p className="text-slate-400 text-sm">
                    Choose your role and configure the match details on the left, then hit the recommend button to get data-driven hero suggestions.
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
                  <h2 className="text-2xl font-bold text-slate-100">
                    Recommended {selectedRole ? selectedRole.charAt(0).toUpperCase() + selectedRole.slice(1) : "Hero"} Picks
                  </h2>
                  <p className="text-slate-400 text-sm mt-1">
                    Showing {recommendations.length} {recommendations.length === 1 ? "option" : "options"} based on your match setup
                  </p>
                </div>

                <div className="grid gap-4 sm:grid-cols-1 xl:grid-cols-2">
                  {recommendations.slice(0, 6).map((rec, idx) => {
                    const userStats = preferences.heroStats.find(s => s.heroId === rec.hero.id);
                    const isFavorite = preferences.favoriteHeroes.includes(rec.hero.id);
                    return (
                      <HeroCard
                        key={rec.hero.id}
                        recommendation={rec}
                        userStats={userStats}
                        isFavorite={isFavorite}
                      />
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Preferences Modal */}
        <PreferencesModal
          isOpen={showPreferences}
          onClose={() => setShowPreferences(false)}
          preferences={preferences}
          onSave={handlePreferencesSave}
        />
      </div>
    </div>
  );
}


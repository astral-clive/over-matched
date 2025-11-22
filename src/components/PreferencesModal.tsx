"use client";

import { useState, useEffect } from "react";
import { HEROES } from "@/data/heroes";
import {
  UserPreferences,
  Playstyle,
  OverwatchProfile,
  UserHeroStats,
  savePreferences,
} from "@/lib/preferences";

interface PreferencesModalProps {
  isOpen: boolean;
  onClose: () => void;
  preferences: UserPreferences;
  onSave: (preferences: UserPreferences) => void;
}

type Tab = "favorites" | "playstyle" | "profile" | "stats";

export default function PreferencesModal({
  isOpen,
  onClose,
  preferences,
  onSave,
}: PreferencesModalProps) {
  const [activeTab, setActiveTab] = useState<Tab>("favorites");
  const [localPrefs, setLocalPrefs] = useState<UserPreferences>(preferences);

  // Update local state when preferences prop changes
  useEffect(() => {
    setLocalPrefs(preferences);
  }, [preferences]);

  if (!isOpen) return null;

  const handleSave = () => {
    savePreferences(localPrefs);
    onSave(localPrefs);
    onClose();
  };

  const toggleFavorite = (heroId: string) => {
    setLocalPrefs(prev => ({
      ...prev,
      favoriteHeroes: prev.favoriteHeroes.includes(heroId)
        ? prev.favoriteHeroes.filter(id => id !== heroId)
        : [...prev.favoriteHeroes, heroId],
    }));
  };

  const updatePlaystyle = (playstyle: Playstyle) => {
    setLocalPrefs(prev => ({ ...prev, playstyle }));
  };

  const updateProfile = (field: keyof OverwatchProfile, value: string) => {
    setLocalPrefs(prev => ({
      ...prev,
      profile: {
        ...(prev.profile || { platform: "pc", profileUrl: "" }),
        [field]: value,
      },
    }));
  };

  const updateHeroStat = (heroId: string, field: "playtime" | "winRate", value: number) => {
    setLocalPrefs(prev => {
      const existingStats = prev.heroStats.filter(s => s.heroId !== heroId);
      const currentStat = prev.heroStats.find(s => s.heroId === heroId) || {
        heroId,
        playtime: 0,
        winRate: 50,
      };

      return {
        ...prev,
        heroStats: [
          ...existingStats,
          {
            ...currentStat,
            [field]: value,
          },
        ].filter(s => s.playtime > 0 || s.winRate !== 50), // Only keep non-default stats
      };
    });
  };

  const tabs: { id: Tab; label: string; icon: string }[] = [
    { id: "favorites", label: "Favorites", icon: "❤️" },
    { id: "playstyle", label: "Playstyle", icon: "⚔️" },
    { id: "profile", label: "Profile", icon: "👤" },
    { id: "stats", label: "Hero Stats", icon: "📊" },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="bg-slate-900 rounded-xl shadow-2xl border border-slate-700 w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-slate-700">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent">
              Preferences
            </h2>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-700 bg-slate-800/50">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 px-4 py-3 text-sm font-semibold transition-colors ${
                activeTab === tab.id
                  ? "text-cyan-400 border-b-2 border-cyan-400 bg-slate-800"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <span className="mr-2">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Favorites Tab */}
          {activeTab === "favorites" && (
            <div>
              <p className="text-slate-400 text-sm mb-4">
                Mark your favorite heroes to get a boost in recommendations.
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {HEROES.map(hero => {
                  const isFavorite = localPrefs.favoriteHeroes.includes(hero.id);
                  return (
                    <button
                      key={hero.id}
                      onClick={() => toggleFavorite(hero.id)}
                      className={`p-3 rounded-lg border-2 transition-all ${
                        isFavorite
                          ? "border-pink-500 bg-pink-500/20"
                          : "border-slate-600 bg-slate-800/50 hover:border-slate-500"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        {isFavorite && <span className="text-pink-500">❤️</span>}
                        <span className="text-sm font-medium text-slate-200">{hero.name}</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Playstyle Tab */}
          {activeTab === "playstyle" && (
            <div>
              <p className="text-slate-400 text-sm mb-6">
                Select your preferred playstyle for personalized recommendations.
              </p>
              <div className="space-y-4">
                {(["aggressive", "balanced", "defensive"] as Playstyle[]).map(style => (
                  <button
                    key={style}
                    onClick={() => updatePlaystyle(style)}
                    className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                      localPrefs.playstyle === style
                        ? "border-cyan-500 bg-cyan-500/20"
                        : "border-slate-600 bg-slate-800/50 hover:border-slate-500"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-semibold text-slate-200 capitalize">{style}</h3>
                        <p className="text-sm text-slate-400 mt-1">
                          {style === "aggressive" && "Focus on damage dealers and flankers"}
                          {style === "balanced" && "Adaptable to team composition"}
                          {style === "defensive" && "Prioritize survivability and support"}
                        </p>
                      </div>
                      {localPrefs.playstyle === style && (
                        <span className="text-cyan-400">✓</span>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Profile Tab */}
          {activeTab === "profile" && (
            <div>
              <p className="text-slate-400 text-sm mb-6">
                Link your Overwatch profile for reference (optional).
              </p>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-200 mb-2">
                    Platform
                  </label>
                  <select
                    value={localPrefs.profile?.platform || "pc"}
                    onChange={e => updateProfile("platform", e.target.value)}
                    className="w-full px-4 py-2 bg-slate-800 border border-slate-600 rounded-lg text-slate-200 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  >
                    <option value="pc">PC</option>
                    <option value="xbox">Xbox</option>
                    <option value="playstation">PlayStation</option>
                    <option value="nintendo">Nintendo Switch</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-200 mb-2">
                    BattleTag (e.g., Player#1234)
                  </label>
                  <input
                    type="text"
                    value={localPrefs.profile?.battleTag || ""}
                    onChange={e => updateProfile("battleTag", e.target.value)}
                    placeholder="Player#1234"
                    className="w-full px-4 py-2 bg-slate-800 border border-slate-600 rounded-lg text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-200 mb-2">
                    Profile Link (Overbuff, OverTracker, etc.)
                  </label>
                  <input
                    type="url"
                    value={localPrefs.profile?.profileUrl || ""}
                    onChange={e => updateProfile("profileUrl", e.target.value)}
                    placeholder="https://www.overbuff.com/players/..."
                    className="w-full px-4 py-2 bg-slate-800 border border-slate-600 rounded-lg text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  />
                </div>

                {localPrefs.profile?.profileUrl && (
                  <a
                    href={localPrefs.profile.profileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-sm text-cyan-400 hover:text-cyan-300"
                  >
                    View Profile
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                  </a>
                )}
              </div>
            </div>
          )}

          {/* Hero Stats Tab */}
          {activeTab === "stats" && (
            <div>
              <p className="text-slate-400 text-sm mb-6">
                Enter your hero stats to boost familiar heroes in recommendations.
              </p>
              <div className="space-y-3">
                {HEROES.map(hero => {
                  const stats = localPrefs.heroStats.find(s => s.heroId === hero.id);
                  return (
                    <div
                      key={hero.id}
                      className="grid grid-cols-[1fr_120px_120px] gap-4 items-center p-3 bg-slate-800/50 rounded-lg border border-slate-700"
                    >
                      <span className="text-sm font-medium text-slate-200">{hero.name}</span>
                      <input
                        type="number"
                        min="0"
                        step="0.1"
                        value={stats?.playtime || ""}
                        onChange={e => updateHeroStat(hero.id, "playtime", parseFloat(e.target.value) || 0)}
                        placeholder="Hours"
                        className="px-3 py-2 bg-slate-900 border border-slate-600 rounded text-slate-200 text-sm focus:outline-none focus:ring-1 focus:ring-cyan-500"
                      />
                      <input
                        type="number"
                        min="0"
                        max="100"
                        step="1"
                        value={stats?.winRate || ""}
                        onChange={e => updateHeroStat(hero.id, "winRate", parseFloat(e.target.value) || 50)}
                        placeholder="Win %"
                        className="px-3 py-2 bg-slate-900 border border-slate-600 rounded text-slate-200 text-sm focus:outline-none focus:ring-1 focus:ring-cyan-500"
                      />
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-slate-700 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-6 py-2 rounded-lg border border-slate-600 text-slate-300 hover:bg-slate-800 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-6 py-2 rounded-lg bg-gradient-to-r from-purple-500 to-cyan-500 text-white font-semibold hover:from-purple-600 hover:to-cyan-600 transition-all"
          >
            Save Preferences
          </button>
        </div>
      </div>
    </div>
  );
}


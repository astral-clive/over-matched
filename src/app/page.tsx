"use client";

import { useState, useEffect } from "react";
import { Role, HEROES, HERO_BY_ID } from "@/data/heroes";
import { recommendHeroes, HeroRecommendation } from "@/lib/recommendation";

export default function HomePage() {
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [selectedMapType, setSelectedMapType] = useState<string>("any");
  const [selectedRank, setSelectedRank] = useState<string>("gold");
  const [selectedDifficulties, setSelectedDifficulties] = useState<string[]>([]);
  const [allyHeroes, setAllyHeroes] = useState<(string | null)[]>([null, null, null, null, null]);
  const [enemyHeroes, setEnemyHeroes] = useState<(string | null)[]>([null, null, null, null, null]);
  const [recommendations, setRecommendations] = useState<HeroRecommendation[]>([]);
  const [showHeroPicker, setShowHeroPicker] = useState<{type: 'ally' | 'enemy', index: number, role: Role} | null>(null);
  const [isSetupOpen, setIsSetupOpen] = useState(false);
  const [showSetupTooltip, setShowSetupTooltip] = useState(false);
  const [showFavoritesTooltip, setShowFavoritesTooltip] = useState(false);
  const [favoriteHeroes, setFavoriteHeroes] = useState<string[]>([]);
  const [showFavoritesModal, setShowFavoritesModal] = useState(false);
  
  // Define slot roles: tank, damage, damage, support, support
  const slotRoles: Role[] = ['tank', 'damage', 'damage', 'support', 'support'];

  // Load saved state from localStorage on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      // Check for reset tooltips query parameter
      const urlParams = new URLSearchParams(window.location.search);
      if (urlParams.has('resetTooltips')) {
        localStorage.removeItem('tooltipHiddenUntil');
        // Remove the query parameter from URL without reloading
        window.history.replaceState({}, '', window.location.pathname);
      }

      const savedRole = localStorage.getItem('selectedRole');
      const savedMapType = localStorage.getItem('selectedMapType');
      const savedRank = localStorage.getItem('selectedRank');
      const savedDifficulties = localStorage.getItem('selectedDifficulties');
      const savedAllyHeroes = localStorage.getItem('allyHeroes');
      const savedEnemyHeroes = localStorage.getItem('enemyHeroes');
      const savedSetupOpen = localStorage.getItem('isSetupOpen');
      const savedFavorites = localStorage.getItem('favoriteHeroes');
      const tooltipHiddenUntil = localStorage.getItem('tooltipHiddenUntil');

      if (savedRole) setSelectedRole(savedRole as Role);
      // Always default to "any" if no saved value or if saved value is empty
      if (savedMapType) {
        setSelectedMapType(savedMapType.toLowerCase());
      } else {
        setSelectedMapType('any');
      }
      if (savedRank) setSelectedRank(savedRank);
      if (savedDifficulties) setSelectedDifficulties(JSON.parse(savedDifficulties));
      if (savedAllyHeroes) setAllyHeroes(JSON.parse(savedAllyHeroes));
      if (savedEnemyHeroes) setEnemyHeroes(JSON.parse(savedEnemyHeroes));
      if (savedSetupOpen) setIsSetupOpen(savedSetupOpen === 'true');
      if (savedFavorites) setFavoriteHeroes(JSON.parse(savedFavorites));
      
      // Show tooltips unless user has hidden them
      const shouldShowTooltip = !tooltipHiddenUntil || Date.now() > parseInt(tooltipHiddenUntil);
      if (shouldShowTooltip) {
        setShowSetupTooltip(true);
      }
    }
  }, []);

  // Save selectedRole to localStorage whenever it changes
  useEffect(() => {
    if (typeof window !== 'undefined') {
      if (selectedRole) {
        localStorage.setItem('selectedRole', selectedRole);
      } else {
        localStorage.removeItem('selectedRole');
      }
    }
  }, [selectedRole]);

  // Save selectedMapType to localStorage whenever it changes
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('selectedMapType', selectedMapType);
    }
  }, [selectedMapType]);

  // Save allyHeroes to localStorage whenever they change
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('allyHeroes', JSON.stringify(allyHeroes));
    }
  }, [allyHeroes]);

  // Save enemyHeroes to localStorage whenever they change
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('enemyHeroes', JSON.stringify(enemyHeroes));
    }
  }, [enemyHeroes]);

  // Save isSetupOpen to localStorage whenever it changes
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('isSetupOpen', String(isSetupOpen));
    }
  }, [isSetupOpen]);

  // Save favoriteHeroes to localStorage whenever they change
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('favoriteHeroes', JSON.stringify(favoriteHeroes));
    }
  }, [favoriteHeroes]);

  // Save selectedRank to localStorage whenever it changes
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('selectedRank', selectedRank);
    }
  }, [selectedRank]);

  // Save selectedDifficulties to localStorage whenever they change
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('selectedDifficulties', JSON.stringify(selectedDifficulties));
    }
  }, [selectedDifficulties]);

  // Auto-update recommendations when inputs change
  useEffect(() => {
    if (selectedRole) {
      const allyHeroIds = allyHeroes.filter((h): h is string => h !== null);
      const results = recommendHeroes({
        role: selectedRole,
        enemyHeroes: enemyHeroes.filter((h): h is string => h !== null),
        allyHeroes: allyHeroIds,
        rank: selectedRank,
        mapType: selectedMapType.toLowerCase(),
        favoriteHeroes: favoriteHeroes,
        difficultyFilter: selectedDifficulties.length > 0 ? selectedDifficulties : undefined,
      });
      // Filter out heroes that are already on your team
      const filteredResults = results.filter(rec => !allyHeroIds.includes(rec.hero.id));
      setRecommendations(filteredResults);
    }
  }, [selectedRole, allyHeroes, enemyHeroes, selectedMapType, favoriteHeroes, selectedRank, selectedDifficulties]);

  const handleSelectHero = (heroId: string) => {
    if (showHeroPicker) {
      const { type, index } = showHeroPicker;
      if (type === 'ally') {
        const newAllies = [...allyHeroes];
        newAllies[index] = heroId;
        setAllyHeroes(newAllies);
      } else {
        const newEnemies = [...enemyHeroes];
        newEnemies[index] = heroId;
        setEnemyHeroes(newEnemies);
      }
      setShowHeroPicker(null);
    }
  };

  const handleClearSlot = (type: 'ally' | 'enemy', index: number) => {
    if (type === 'ally') {
      const newAllies = [...allyHeroes];
      newAllies[index] = null;
      setAllyHeroes(newAllies);
    } else {
      const newEnemies = [...enemyHeroes];
      newEnemies[index] = null;
      setEnemyHeroes(newEnemies);
    }
  };

  const handleClearAll = () => {
    setAllyHeroes([null, null, null, null, null]);
    setEnemyHeroes([null, null, null, null, null]);
    // Don't clear selectedRole or selectedMapType - keep user preferences
    // Only clear recommendations if role is not selected
    if (!selectedRole) {
      setRecommendations([]);
    }
  };

  const toggleFavorite = (heroId: string) => {
    setFavoriteHeroes(prev => 
      prev.includes(heroId)
        ? prev.filter(id => id !== heroId)
        : [...prev, heroId]
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <div className="max-w-md mx-auto px-4 py-4">
        {/* Header */}
        <header className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-400 via-purple-400 to-cyan-400 bg-clip-text text-transparent">
            Overwatch Sidekick
          </h1>
          <div className="flex items-center gap-2">
            <div className="relative">
              <button
                onClick={() => {
                  setShowFavoritesModal(true);
                  if (showFavoritesTooltip) {
                    setShowFavoritesTooltip(false);
                  }
                }}
                className={`p-2 rounded-lg bg-slate-700/50 text-slate-300 hover:bg-slate-700 hover:text-yellow-400 transition-all border border-slate-600 ${showFavoritesTooltip ? 'ring-2 ring-yellow-400 ring-offset-2 ring-offset-slate-900' : ''}`}
                title="Favorites"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                </svg>
              </button>
              {showFavoritesTooltip && (
                <div className="absolute top-full right-0 mt-2 w-64 bg-slate-800 border border-yellow-500/50 rounded-lg p-3 shadow-xl z-50">
                  <div className="flex items-start gap-2">
                    <span className="text-yellow-400 text-lg">⭐</span>
                    <div className="flex-1">
                      <p className="text-sm text-slate-200 mb-2">
                        Click here to mark your favorite heroes! They'll get a boost in recommendations.
                      </p>
                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            setShowFavoritesTooltip(false);
                          }}
                          className="text-xs bg-yellow-500 text-slate-900 px-3 py-1 rounded hover:bg-yellow-400 transition-all font-semibold"
                        >
                          Got it!
                        </button>
                        <button
                          onClick={() => {
                            const oneWeekFromNow = Date.now() + (7 * 24 * 60 * 60 * 1000);
                            localStorage.setItem('tooltipHiddenUntil', oneWeekFromNow.toString());
                            setShowFavoritesTooltip(false);
                          }}
                          className="text-xs bg-slate-700 text-slate-300 px-3 py-1 rounded hover:bg-slate-600 transition-all"
                        >
                          Never Show Again
                        </button>
                      </div>
                    </div>
                  </div>
                  <div className="absolute -top-2 right-4 w-4 h-4 bg-slate-800 border-t border-l border-yellow-500/50 transform rotate-45"></div>
                </div>
              )}
            </div>
            <button
              onClick={handleClearAll}
              className="p-2 rounded-lg bg-slate-700/50 text-slate-300 hover:bg-slate-700 hover:text-slate-100 transition-all border border-slate-600"
              title="Clear All"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </div>
        </header>

        {/* Setup Accordion */}
        <section className="mb-4 relative">
          {showSetupTooltip && (
            <div className="absolute top-full mt-2 left-0 right-0 bg-gradient-to-r from-blue-500/90 to-purple-500/90 backdrop-blur-sm rounded-lg p-4 shadow-xl z-50 border border-blue-400/50">
              <div className="flex items-start gap-3">
                <span className="text-2xl">👋</span>
                <div className="flex-1">
                  <p className="text-sm text-white font-semibold mb-1">Welcome to Overwatch Sidekick!</p>
                  <p className="text-sm text-blue-100 mb-3">
                    Start by clicking here to select your role and map type.
                  </p>
                  <button
                    onClick={() => {
                      setShowSetupTooltip(false);
                      setShowFavoritesTooltip(true);
                      setIsSetupOpen(true);
                    }}
                    className="text-xs bg-white text-blue-600 px-3 py-1.5 rounded hover:bg-blue-50 transition-all font-semibold"
                  >
                    Got it!
                  </button>
                </div>
              </div>
              <div className="absolute -top-2 left-8 w-4 h-4 bg-blue-500/90 transform rotate-45"></div>
            </div>
          )}
          <button
            onClick={() => {
              setIsSetupOpen(!isSetupOpen);
              if (showSetupTooltip) {
                setShowSetupTooltip(false);
              }
            }}
            className={`w-full flex items-center justify-between p-3 bg-slate-800/30 backdrop-blur-sm rounded-lg border border-slate-700/50 hover:border-slate-600 transition-all ${showSetupTooltip ? 'ring-2 ring-blue-400 ring-offset-2 ring-offset-slate-900' : ''}`}
          >
            <h2 className="text-sm font-semibold text-slate-200">
              Setup
              {(selectedRole || selectedMapType || selectedRank !== 'gold' || selectedDifficulties.length > 0) && (
                <span className="text-slate-400 font-normal">
                  {' '}- {selectedRole ? selectedRole.charAt(0).toUpperCase() + selectedRole.slice(1) : ''}{selectedRole && selectedMapType ? ' / ' : ''}{selectedMapType ? selectedMapType.charAt(0).toUpperCase() + selectedMapType.slice(1) : ''}{(selectedRole || selectedMapType) && selectedRank !== 'gold' ? ' / ' : ''}{selectedRank !== 'gold' ? selectedRank.charAt(0).toUpperCase() + selectedRank.slice(1) : ''}{((selectedRole || selectedMapType || selectedRank !== 'gold') && selectedDifficulties.length > 0) ? ' / ' : ''}{selectedDifficulties.length > 0 ? selectedDifficulties.map(d => d.charAt(0).toUpperCase() + d.slice(1)).join('+') : ''}
                </span>
              )}
            </h2>
            <svg
              className={`w-5 h-5 text-slate-400 transition-transform ${isSetupOpen ? 'rotate-180' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          
          {isSetupOpen && (
            <div className="mt-3 space-y-3">
              {/* Your Role Section */}
              <div>
                <h3 className="text-xs font-semibold text-slate-300 mb-2">Your Role</h3>
                <div className="flex gap-2">
                  <button
                    onClick={() => setSelectedRole('tank')}
                    className={`flex-1 py-3 rounded-lg font-semibold text-sm transition-all border-2 ${
                      selectedRole === 'tank'
                        ? 'bg-blue-500 border-blue-400 text-white shadow-lg shadow-blue-500/20'
                        : 'bg-blue-500/20 border-blue-500/50 text-blue-300 hover:bg-blue-500/30'
                    }`}
                  >
                    Tank
                  </button>
                  <button
                    onClick={() => setSelectedRole('damage')}
                    className={`flex-1 py-3 rounded-lg font-semibold text-sm transition-all border-2 ${
                      selectedRole === 'damage'
                        ? 'bg-red-500 border-red-400 text-white shadow-lg shadow-red-500/20'
                        : 'bg-red-500/20 border-red-500/50 text-red-300 hover:bg-red-500/30'
                    }`}
                  >
                    Damage
                  </button>
                  <button
                    onClick={() => setSelectedRole('support')}
                    className={`flex-1 py-3 rounded-lg font-semibold text-sm transition-all border-2 ${
                      selectedRole === 'support'
                        ? 'bg-green-500 border-green-400 text-white shadow-lg shadow-green-500/20'
                        : 'bg-green-500/20 border-green-500/50 text-green-300 hover:bg-green-500/30'
                    }`}
                  >
                    Support
                  </button>
                </div>
              </div>

              {/* Map Type Section */}
              <div>
                <h3 className="text-xs font-semibold text-slate-300 mb-2">Map Type</h3>
                <div className="grid grid-cols-3 gap-2">
                  {['Any', 'Control', 'Hybrid', 'Payload', 'Flashpoint'].map((mapType) => (
                    <button
                      key={mapType}
                      onClick={() => setSelectedMapType(mapType.toLowerCase())}
                      className={`py-2 rounded-lg font-medium text-xs transition-all border-2 ${
                        selectedMapType.toLowerCase() === mapType.toLowerCase()
                          ? 'bg-purple-500 border-purple-400 text-white shadow-lg shadow-purple-500/20'
                          : 'bg-purple-500/20 border-purple-500/50 text-purple-300 hover:bg-purple-500/30'
                      }`}
                    >
                      {mapType}
                    </button>
                  ))}
                </div>
              </div>

              {/* Rank Section */}
              <div>
                <h3 className="text-xs font-semibold text-slate-300 mb-2">Rank</h3>
                <div className="grid grid-cols-4 gap-2">
                  {['Bronze', 'Silver', 'Gold', 'Platinum', 'Diamond', 'Master', 'Grandmaster'].map((rank) => (
                    <button
                      key={rank}
                      onClick={() => setSelectedRank(rank.toLowerCase())}
                      className={`py-2 rounded-lg font-medium text-xs transition-all border-2 ${
                        selectedRank.toLowerCase() === rank.toLowerCase()
                          ? 'bg-amber-500 border-amber-400 text-white shadow-lg shadow-amber-500/20'
                          : 'bg-amber-500/20 border-amber-500/50 text-amber-300 hover:bg-amber-500/30'
                      }`}
                    >
                      {rank}
                    </button>
                  ))}
                </div>
              </div>

              {/* Difficulty Section */}
              <div>
                <h3 className="text-xs font-semibold text-slate-300 mb-2">Difficulty Filter</h3>
                <div className="grid grid-cols-3 gap-2">
                  {['Easy', 'Medium', 'Hard'].map((difficulty) => {
                    const isSelected = selectedDifficulties.includes(difficulty.toLowerCase());
                    return (
                      <button
                        key={difficulty}
                        onClick={() => {
                          if (isSelected) {
                            setSelectedDifficulties(selectedDifficulties.filter(d => d !== difficulty.toLowerCase()));
                          } else {
                            setSelectedDifficulties([...selectedDifficulties, difficulty.toLowerCase()]);
                          }
                        }}
                        className={`py-2 rounded-lg font-medium text-xs transition-all border-2 ${
                          isSelected
                            ? 'bg-cyan-500 border-cyan-400 text-white shadow-lg shadow-cyan-500/20'
                            : 'bg-cyan-500/20 border-cyan-500/50 text-cyan-300 hover:bg-cyan-500/30'
                        }`}
                      >
                        {difficulty}
                      </button>
                    );
                  })}
                </div>
                <p className="text-xs text-slate-500 mt-1">Select none for all difficulties</p>
              </div>
            </div>
          )}
        </section>

        {/* Your Team Section */}
        <section className="mb-4">
          <h2 className="text-sm font-semibold text-slate-200 mb-2">Your Team</h2>
          <div className="grid grid-cols-5 gap-2">
            {allyHeroes.map((heroId, idx) => (
              <HeroSlot
                key={idx}
                role={slotRoles[idx]}
                heroId={heroId}
                onClick={() => setShowHeroPicker({ type: 'ally', index: idx, role: slotRoles[idx] })}
              />
            ))}
          </div>
        </section>

        {/* Top 3 Suggestions */}
        <section className="mb-4">
          <h2 className="text-sm font-semibold text-slate-200 mb-2">Top 3 Suggestions</h2>
          <div className="space-y-2">
            {recommendations.slice(0, 3).map((rec, idx) => (
              <SuggestionCard
                key={rec.hero.id}
                number={idx + 1}
                recommendation={rec}
              />
            ))}
            {recommendations.length === 0 && selectedRole && (
              <div className="bg-slate-800/30 backdrop-blur-sm rounded-lg p-6 border border-slate-700/50 text-center">
                <div className="text-slate-400 text-sm">
                  Select enemy heroes to get recommendations
                </div>
              </div>
            )}
            {!selectedRole && (
              <div className="bg-slate-800/30 backdrop-blur-sm rounded-lg p-6 border border-slate-700/50 text-center">
                <div className="text-slate-400 text-sm">
                  Select your role first
                </div>
              </div>
            )}
          </div>
        </section>

        {/* Enemy Team Section */}
        <section className="mb-4">
          <h2 className="text-sm font-semibold text-slate-200 mb-2">Enemy Team</h2>
          <div className="grid grid-cols-5 gap-2">
            {enemyHeroes.map((heroId, idx) => (
              <HeroSlot
                key={idx}
                role={slotRoles[idx]}
                heroId={heroId}
                onClick={() => setShowHeroPicker({ type: 'enemy', index: idx, role: slotRoles[idx] })}
              />
            ))}
          </div>
        </section>
      </div>

      {/* Hero Picker Modal */}
      {showHeroPicker && (
        <HeroPickerModal
          role={showHeroPicker.role}
          onSelect={handleSelectHero}
          onClose={() => setShowHeroPicker(null)}
          onClear={() => {
            if (showHeroPicker) {
              handleClearSlot(showHeroPicker.type, showHeroPicker.index);
              setShowHeroPicker(null);
            }
          }}
          currentHero={showHeroPicker.type === 'ally' 
            ? allyHeroes[showHeroPicker.index] 
            : enemyHeroes[showHeroPicker.index]}
          disabledHeroes={(() => {
            // Get heroes from the same team and same role (excluding current slot)
            const teamHeroes = showHeroPicker.type === 'ally' ? allyHeroes : enemyHeroes;
            const disabled: string[] = [];
            
            teamHeroes.forEach((heroId, idx) => {
              if (heroId && idx !== showHeroPicker.index && slotRoles[idx] === showHeroPicker.role) {
                disabled.push(heroId);
              }
            });
            
            return disabled;
          })()}
        />
      )}

      {/* Favorites Modal */}
      {showFavoritesModal && (
        <FavoritesModal
          favoriteHeroes={favoriteHeroes}
          onToggleFavorite={toggleFavorite}
          onClose={() => setShowFavoritesModal(false)}
        />
      )}
    </div>
  );
}

// Hero Slot Component
function HeroSlot({ role, heroId, onClick }: { 
  role: Role;
  heroId: string | null;
  onClick: () => void;
}) {
  const hero = heroId ? HERO_BY_ID[heroId] : null;
  
  const roleIcons = {
    tank: (
      <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
        <path d="M12 2L4 5v6.09c0 5.05 3.41 9.76 8 10.91 4.59-1.15 8-5.86 8-10.91V5l-8-3z"/>
      </svg>
    ),
    damage: (
      <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
      </svg>
    ),
    support: (
      <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
        <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
      </svg>
    ),
  };
  
  const roleColors = {
    tank: 'text-blue-400',
    damage: 'text-red-400',
    support: 'text-green-400',
  };

  return (
    <div className="relative">
      <button
        onClick={onClick}
        className="w-full aspect-square rounded-lg bg-slate-700/30 border-2 border-slate-600/50 hover:border-slate-500 transition-all flex items-center justify-center overflow-hidden relative backdrop-blur-sm"
      >
        {hero ? (
          <img 
            src={hero.image} 
            alt={hero.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className={`${roleColors[role]}`}>
            {roleIcons[role]}
          </div>
        )}
      </button>
    </div>
  );
}

// Suggestion Card Component
function SuggestionCard({ number, recommendation }: { 
  number: number;
  recommendation: HeroRecommendation;
}) {
  const { hero, score, reasons } = recommendation;
  
  const roleColors = {
    tank: 'from-blue-500/20 to-blue-600/20 border-blue-500/30',
    damage: 'from-red-500/20 to-red-600/20 border-red-500/30',
    support: 'from-green-500/20 to-green-600/20 border-green-500/30',
  };
  
  return (
    <div className={`bg-gradient-to-r ${roleColors[hero.role]} backdrop-blur-sm rounded-lg p-3 flex items-center gap-3 border`}>
      <div className="w-14 h-14 rounded-lg overflow-hidden bg-slate-700/50 flex-shrink-0 border-2 border-slate-600/50">
        <img 
          src={hero.image} 
          alt={hero.name}
          className="w-full h-full object-cover"
        />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xs font-bold text-slate-400">#{number}</span>
          <h3 className="font-bold text-slate-100 text-sm">
            {hero.name}
          </h3>
          {hero.difficulty && (
            <span className={`text-xs px-1.5 py-0.5 rounded ${
              hero.difficulty === 'easy' 
                ? 'bg-green-500/20 text-green-400 border border-green-500/30' 
                : hero.difficulty === 'medium'
                ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
                : 'bg-red-500/20 text-red-400 border border-red-500/30'
            }`}>
              {hero.difficulty}
            </span>
          )}
        </div>
        <div className="text-xs text-slate-400 space-y-0.5">
          {reasons.slice(0, 3).map((reason, idx) => (
            <p key={idx} className="leading-tight">{reason}</p>
          ))}
          {reasons.length === 0 && <p>Solid pick</p>}
        </div>
      </div>
      <div className="text-right">
        <div className="text-2xl font-bold text-slate-100">{Math.round(score)}</div>
        <div className="text-xs text-slate-500 uppercase">score</div>
      </div>
    </div>
  );
}

// Hero Picker Modal
function HeroPickerModal({ role, onSelect, onClose, onClear, currentHero, disabledHeroes }: {
  role: Role;
  onSelect: (heroId: string) => void;
  onClose: () => void;
  onClear: () => void;
  currentHero: string | null;
  disabledHeroes: string[];
}) {
  const heroes = HEROES.filter(h => h.role === role);
  
  const roleColors = {
    tank: 'text-blue-400',
    damage: 'text-red-400',
    support: 'text-green-400',
  };
  
  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-slate-800 rounded-2xl w-full max-w-lg max-h-[80vh] overflow-hidden flex flex-col border border-slate-700">
        <div className="p-4 border-b border-slate-700 flex items-center justify-between">
          <h2 className={`text-lg font-semibold ${roleColors[role]}`}>
            Select {role.charAt(0).toUpperCase() + role.slice(1)}
          </h2>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-slate-200 rounded-lg hover:bg-slate-700 transition-all"
          >
            ✕
          </button>
        </div>
        
        <div className="overflow-y-auto flex-1 p-4 bg-slate-900/50">
          <div className="grid grid-cols-4 gap-2">
            {heroes.map(hero => {
              const isDisabled = disabledHeroes.includes(hero.id);
              return (
                <button
                  key={hero.id}
                  onClick={() => !isDisabled && onSelect(hero.id)}
                  disabled={isDisabled}
                  className={`aspect-square rounded-lg overflow-hidden border-2 transition-all backdrop-blur-sm ${
                    isDisabled
                      ? 'bg-slate-900/50 border-slate-700/30 opacity-40 cursor-not-allowed'
                      : 'bg-slate-700/30 hover:bg-slate-700 border-slate-600/50 hover:border-slate-500'
                  }`}
                >
                  <img 
                    src={hero.image} 
                    alt={hero.name}
                    className="w-full h-full object-cover"
                    title={isDisabled ? `${hero.name} (Already selected)` : hero.name}
                  />
                </button>
              );
            })}
          </div>
        </div>
        
        {currentHero && (
          <div className="p-4 border-t border-slate-700 bg-slate-800">
            <button
              onClick={onClear}
              className="w-full py-3 rounded-lg bg-red-500/20 border-2 border-red-500/50 text-red-300 font-semibold hover:bg-red-500/30 hover:border-red-400 transition-all"
            >
              Clear Selection
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// Favorites Modal
function FavoritesModal({ favoriteHeroes, onToggleFavorite, onClose }: {
  favoriteHeroes: string[];
  onToggleFavorite: (heroId: string) => void;
  onClose: () => void;
}) {
  const herosByRole = {
    tank: HEROES.filter(h => h.role === 'tank'),
    damage: HEROES.filter(h => h.role === 'damage'),
    support: HEROES.filter(h => h.role === 'support'),
  };

  const roleColors = {
    tank: 'text-blue-400',
    damage: 'text-red-400',
    support: 'text-green-400',
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-slate-800 rounded-2xl w-full max-w-lg max-h-[80vh] overflow-hidden flex flex-col border border-slate-700">
        <div className="p-4 border-b border-slate-700 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-yellow-400">
            ⭐ Favorite Heroes
          </h2>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-slate-200 rounded-lg hover:bg-slate-700 transition-all"
          >
            ✕
          </button>
        </div>
        
        <div className="overflow-y-auto flex-1 p-4 bg-slate-900/50">
          {(Object.keys(herosByRole) as Role[]).map(role => (
            <div key={role} className="mb-6 last:mb-0">
              <h3 className={`text-sm font-semibold ${roleColors[role]} mb-2 uppercase`}>
                {role}
              </h3>
              <div className="grid grid-cols-4 gap-2">
                {herosByRole[role].map(hero => {
                  const isFavorite = favoriteHeroes.includes(hero.id);
                  return (
                    <button
                      key={hero.id}
                      onClick={() => onToggleFavorite(hero.id)}
                      className="relative aspect-square rounded-lg overflow-hidden border-2 transition-all backdrop-blur-sm bg-slate-700/30 hover:bg-slate-700 border-slate-600/50 hover:border-slate-500"
                    >
                      <img 
                        src={hero.image} 
                        alt={hero.name}
                        className="w-full h-full object-cover"
                        title={hero.name}
                      />
                      {isFavorite && (
                        <div className="absolute inset-0 bg-yellow-500/20 border-2 border-yellow-400">
                          <svg 
                            className="absolute top-1 right-1 w-5 h-5 text-yellow-400 drop-shadow-lg" 
                            fill="currentColor" 
                            viewBox="0 0 24 24"
                          >
                            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                          </svg>
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
        
        <div className="p-4 border-t border-slate-700 bg-slate-800 text-center text-sm text-slate-400">
          {favoriteHeroes.length} hero{favoriteHeroes.length !== 1 ? 'es' : ''} favorited
        </div>
      </div>
    </div>
  );
}

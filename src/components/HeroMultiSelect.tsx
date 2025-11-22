"use client";

import { useState } from "react";
import { HEROES, HeroMeta, Role } from "@/data/heroes";

interface HeroMultiSelectProps {
  label: string;
  selectedHeroes: string[];
  onChange: (selectedIds: string[]) => void;
  maxSelections?: number;
}

const roleOrder: Role[] = ["tank", "damage", "support"];

const roleColors: Record<Role, string> = {
  tank: "bg-blue-500/20 text-blue-300 border-blue-500 hover:bg-blue-500/30",
  damage: "bg-red-500/20 text-red-300 border-red-500 hover:bg-red-500/30",
  support: "bg-green-500/20 text-green-300 border-green-500 hover:bg-green-500/30",
};

const selectedRoleColors: Record<Role, string> = {
  tank: "bg-blue-500 text-white border-blue-400",
  damage: "bg-red-500 text-white border-red-400",
  support: "bg-green-500 text-white border-green-400",
};

export default function HeroMultiSelect({
  label,
  selectedHeroes,
  onChange,
  maxSelections,
}: HeroMultiSelectProps) {
  const [isOpen, setIsOpen] = useState(false);

  const toggleHero = (heroId: string) => {
    if (selectedHeroes.includes(heroId)) {
      // Remove hero
      onChange(selectedHeroes.filter(id => id !== heroId));
    } else {
      // Add hero (check max limit)
      if (maxSelections && selectedHeroes.length >= maxSelections) {
        return; // Don't add if max reached
      }
      onChange([...selectedHeroes, heroId]);
    }
  };

  const clearAll = () => {
    onChange([]);
  };

  // Group heroes by role
  const heroesByRole = roleOrder.map(role => ({
    role,
    heroes: HEROES.filter(h => h.role === role),
  }));

  return (
    <div className="mb-4">
      <div className="flex items-center justify-between mb-2">
        <label className="block text-sm font-semibold text-slate-200">
          {label}
        </label>
        {selectedHeroes.length > 0 && (
          <button
            onClick={clearAll}
            className="text-xs text-slate-400 hover:text-slate-200 transition-colors"
          >
            Clear all
          </button>
        )}
      </div>

      {/* Selected heroes display */}
      <div className="mb-2 min-h-[2rem]">
        {selectedHeroes.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {selectedHeroes.map(heroId => {
              const hero = HEROES.find(h => h.id === heroId);
              if (!hero) return null;
              return (
                <button
                  key={heroId}
                  onClick={() => toggleHero(heroId)}
                  className={`px-3 py-1 rounded-full text-xs font-medium border transition-all ${selectedRoleColors[hero.role]}`}
                >
                  {hero.name} ×
                </button>
              );
            })}
          </div>
        ) : (
          <p className="text-sm text-slate-500 italic">None selected</p>
        )}
      </div>

      {/* Toggle button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-4 py-2 bg-slate-700/50 hover:bg-slate-700 border border-slate-600 rounded-lg text-sm text-slate-200 transition-all flex items-center justify-between"
      >
        <span>
          {isOpen ? "Close hero selector" : "Select heroes..."}
          {maxSelections && ` (${selectedHeroes.length}/${maxSelections})`}
        </span>
        <span className={`transition-transform ${isOpen ? "rotate-180" : ""}`}>▼</span>
      </button>

      {/* Hero grid (shown when open) */}
      {isOpen && (
        <div className="mt-2 p-4 bg-slate-800/50 border border-slate-700 rounded-lg max-h-96 overflow-y-auto">
          {heroesByRole.map(({ role, heroes }) => (
            <div key={role} className="mb-4 last:mb-0">
              <h4 className="text-xs font-bold text-slate-400 uppercase mb-2 tracking-wide">
                {role}
              </h4>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {heroes.map(hero => {
                  const isSelected = selectedHeroes.includes(hero.id);
                  const isDisabled = !isSelected && maxSelections && selectedHeroes.length >= maxSelections;
                  
                  return (
                    <button
                      key={hero.id}
                      onClick={() => !isDisabled && toggleHero(hero.id)}
                      disabled={isDisabled}
                      className={`px-3 py-2 rounded-lg text-xs font-medium border transition-all ${
                        isSelected
                          ? selectedRoleColors[role]
                          : isDisabled
                          ? "bg-slate-700/30 text-slate-600 border-slate-700 cursor-not-allowed"
                          : roleColors[role]
                      }`}
                    >
                      {hero.name}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}


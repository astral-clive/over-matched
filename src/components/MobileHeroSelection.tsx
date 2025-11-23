'use client';

import { useState } from 'react';
import { HEROES, HeroMeta, Role } from '@/data/heroes';
import type { RoleLimitState } from '@/types/roleLimits';

interface MobileHeroSelectionProps {
  label: string;
  selectedHeroes: string[];
  onChange: (selectedIds: string[]) => void;
  maxSelections?: number;
  roleLimitState?: RoleLimitState | null;
}

const roleOrder: Role[] = ['tank', 'damage', 'support'];

const roleColors: Record<Role, string> = {
  tank: 'ring-blue-400/60',
  damage: 'ring-red-400/60',
  support: 'ring-green-400/60',
};

const selectedRoleColors: Record<Role, string> = {
  tank: 'ring-blue-300',
  damage: 'ring-red-300',
  support: 'ring-green-300',
};

const roleIcons: Record<Role, string> = {
  tank: '🛡️',
  damage: '⚔️',
  support: '➕',
};

type RoleFilter = Role | 'all';
const roleFilters: RoleFilter[] = ['all', ...roleOrder];

export default function MobileHeroSelection({
  label,
  selectedHeroes,
  onChange,
  maxSelections,
  roleLimitState,
}: MobileHeroSelectionProps) {
  const [activeRole, setActiveRole] = useState<RoleFilter>('all');
  const toggleHero = (heroId: string) => {
    if (selectedHeroes.includes(heroId)) {
      onChange(selectedHeroes.filter(id => id !== heroId));
    } else {
      if (maxSelections && selectedHeroes.length >= maxSelections) {
        return;
      }
      onChange([...selectedHeroes, heroId]);
    }
  };

  const clearAll = () => {
    onChange([]);
  };

  const orderedHeroes: HeroMeta[] = roleOrder.flatMap(role =>
    HEROES.filter(hero => hero.role === role)
  );

  const heroesToRender =
    activeRole === 'all' ? orderedHeroes : orderedHeroes.filter(hero => hero.role === activeRole);

  const heroesForGrid = heroesToRender.filter(hero => {
    if (!roleLimitState) return true;
    if (selectedHeroes.includes(hero.id)) {
      return true;
    }
    const remaining = roleLimitState.remaining[hero.role];
    if (typeof remaining === 'number') {
      return remaining > 0;
    }
    return true;
  });

  return (
    <div className='mb-4'>
      {/* Header */}
      <div className='flex items-center justify-between mb-3'>
        <h3 className='text-lg font-bold text-slate-100 uppercase tracking-wide'>{label}</h3>
        {selectedHeroes.length > 0 && (
          <button
            onClick={clearAll}
            className='text-xs text-slate-400 hover:text-slate-200 transition-colors px-2 py-1'>
            Clear ({selectedHeroes.length})
          </button>
        )}
        {maxSelections && (
          <span className='text-xs text-slate-400'>
            {selectedHeroes.length}/{maxSelections}
          </span>
        )}
      </div>

      {/* Single horizontal hero rail */}
      <div className='bg-slate-800/30 backdrop-blur-sm rounded-xl p-2 border border-slate-700/50'>
        <div className='flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide mb-2 px-1'>
          {roleFilters.map(filter => {
            const isActive = activeRole === filter;
            const colorClass =
              filter === 'tank'
                ? 'border-blue-500/60 text-blue-200'
                : filter === 'damage'
                ? 'border-red-500/60 text-red-200'
                : filter === 'support'
                ? 'border-green-500/60 text-green-200'
                : 'border-slate-600 text-slate-200';

            return (
              <button
                key={filter}
                onClick={() => setActiveRole(filter)}
                className={`flex items-center gap-1 px-2 py-1 rounded-full border text-[10px] transition-colors ${
                  isActive ? 'bg-white/10 text-white border-white/30' : colorClass
                }`}>
                <span>{filter === 'all' ? '✨' : roleIcons[filter as Role]}</span>
                {filter === 'all' ? 'All' : filter}
              </button>
            );
          })}
        </div>
        <div className='overflow-x-auto -mx-2 px-2 pb-1'>
          <div className='flex gap-1.5 min-w-max'>
            {heroesForGrid.map(hero => {
              const isSelected = selectedHeroes.includes(hero.id);
              const isRoleExhausted =
                !!roleLimitState && (roleLimitState.remaining[hero.role] ?? 0) <= 0;
              const isDisabled =
                (!isSelected && !!maxSelections && selectedHeroes.length >= maxSelections) ||
                (!isSelected && isRoleExhausted);

              return (
                <button
                  key={hero.id}
                  onClick={() => !isDisabled && toggleHero(hero.id)}
                  disabled={isDisabled}
                  className={`relative overflow-hidden rounded-lg border border-slate-600 h-20 w-16 flex flex-col justify-end pb-1 px-1 text-center isolate ring-2 ${
                    isSelected
                      ? `${selectedRoleColors[hero.role]}`
                      : isDisabled
                      ? 'opacity-40 cursor-not-allowed'
                      : `${roleColors[hero.role]} hover:opacity-90`
                  }`}>
                  {hero.image && (
                    <img
                      src={hero.image}
                      alt={hero.name}
                      className='absolute inset-0 w-full h-full object-cover'
                      onError={e => {
                        e.currentTarget.style.display = 'none';
                      }}
                    />
                  )}
                  <div
                    aria-hidden
                    className={`absolute inset-0 pointer-events-none ${
                      isSelected ? 'bg-slate-900/25' : 'bg-slate-900/55'
                    }`}
                  />
                  <span className='relative z-10 text-[10px] font-semibold leading-tight uppercase tracking-tight text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.7)]'>
                    {hero.name}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

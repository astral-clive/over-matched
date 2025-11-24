'use client';

import { HeroRecommendation } from '@/lib/recommendation';
import { Role } from '@/data/heroes';

interface MobileRecommendationsProps {
  recommendations: HeroRecommendation[];
  favorites: string[];
  onToggleFavorite: (heroId: string) => void;
}

const roleAccentRings: Record<Role, string> = {
  tank: 'ring-blue-400/70',
  damage: 'ring-red-400/70',
  support: 'ring-green-400/70',
};

export default function MobileRecommendations({
  recommendations,
  favorites,
  onToggleFavorite,
}: MobileRecommendationsProps) {
  const topThree = recommendations.slice(0, 3);

  if (topThree.length === 0) {
    return null;
  }

  const podiumSlots = [
    { podiumRank: 2, recIndex: 1, sizeClass: 'w-24 h-36', shiftClass: 'translate-y-2' },
    { podiumRank: 1, recIndex: 0, sizeClass: 'w-28 h-48', shiftClass: '' },
    { podiumRank: 3, recIndex: 2, sizeClass: 'w-24 h-32', shiftClass: 'translate-y-4' },
  ];

  return (
    <div className='mb-6'>
      <h3 className='text-sm font-semibold text-slate-300 uppercase tracking-[0.2em] text-center mb-3'>
        Podium Picks
      </h3>
      <div className='flex items-end justify-center gap-3'>
        {podiumSlots.map(slot => {
          const rec = topThree[slot.recIndex];
          if (!rec) return null;
          const { hero, score, reasons } = rec;
          const isFavorite = favorites.includes(hero.id);
          const rankLabel = slot.podiumRank === 1 ? 'Champion' : `${slot.podiumRank} Place`;
          const displayReasons = reasons.slice(0, 2);

          return (
            <div
              key={`${hero.id}-${slot.podiumRank}`}
              className={`relative ${slot.sizeClass} ${
                slot.shiftClass
              } rounded-3xl overflow-hidden border border-slate-600/70 ring-4 ${
                roleAccentRings[hero.role]
              } ring-offset-2 ring-offset-slate-900 flex-shrink-0`}>
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
              <div className='absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-900/20 to-transparent' />
              <div className='absolute top-2 left-1/2 -translate-x-1/2 flex items-center gap-2'>
                <span
                  className={`px-3 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wide ${
                    slot.podiumRank === 1
                      ? 'bg-yellow-300 text-slate-900'
                      : 'bg-white/80 text-slate-900'
                  }`}>
                  #{slot.podiumRank}
                </span>
              </div>
              <button
                onClick={() => onToggleFavorite(hero.id)}
                className='absolute top-2 right-2 p-1.5 rounded-full bg-white/80 text-slate-900 hover:bg-white transition-colors backdrop-blur'
                aria-label={isFavorite ? 'Remove from favorites' : 'Add to favorites'}>
                <svg
                  className={`w-4 h-4 ${
                    isFavorite ? 'fill-yellow-400 text-yellow-400' : 'fill-none'
                  }`}
                  stroke='currentColor'
                  strokeWidth={2}
                  viewBox='0 0 24 24'>
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    d='M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z'
                  />
                </svg>
              </button>
              <div className='absolute bottom-2 left-0 right-0 px-2 text-center text-white'>
                <p className='text-[10px] uppercase tracking-widest text-white/70 mb-1'>
                  {rankLabel}
                </p>
                <p className='text-base font-bold leading-tight'>{hero.name}</p>
                <p className='text-[11px] text-white/70 capitalize mb-1'>{hero.role}</p>
                <div className='text-[11px] font-semibold text-yellow-300'>
                  Score {Math.round(score)}
                </div>
                <div className='mt-1 space-y-1'>
                  {displayReasons.map((reason, idx) => (
                    <p key={idx} className='text-[9px] text-slate-200 truncate'>
                      {reason.replace('⚠️ ', '')}
                    </p>
                  ))}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

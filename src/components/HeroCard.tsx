import { HeroRecommendation } from "@/lib/recommendation";
import { Role } from "@/data/heroes";

interface HeroCardProps {
  recommendation: HeroRecommendation;
  isFavorite?: boolean;
  onToggleFavorite?: (heroId: string) => void;
}

// Role-based gradient classes
const roleGradients: Record<Role, string> = {
  tank: "bg-gradient-to-br from-blue-500 to-purple-600",
  damage: "bg-gradient-to-br from-red-500 to-orange-500",
  support: "bg-gradient-to-br from-green-500 to-cyan-500",
};

const roleBadgeColors: Record<Role, string> = {
  tank: "bg-blue-500/20 text-blue-300 border-blue-400",
  damage: "bg-red-500/20 text-red-300 border-red-400",
  support: "bg-green-500/20 text-green-300 border-green-400",
};

export default function HeroCard({ recommendation, isFavorite = false, onToggleFavorite }: HeroCardProps) {
  const { hero, score, reasons } = recommendation;

  return (
    <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl shadow-lg overflow-hidden border border-slate-700/50 hover:border-slate-600/70 transition-all duration-200 hover:shadow-xl">
      {/* Hero header with gradient */}
      <div className={`${roleGradients[hero.role]} p-6 relative`}>
        {/* Hero portrait */}
        <div className="w-20 h-20 rounded-full overflow-hidden bg-white/10 backdrop-blur-md mb-3 shadow-lg border-2 border-white/30 flex items-center justify-center">
          {hero.image ? (
            <img 
              src={hero.image} 
              alt={hero.name}
              className="w-full h-full object-cover"
              onError={(e) => {
                // Fallback to initial if image fails to load
                e.currentTarget.style.display = 'none';
                const fallback = e.currentTarget.parentElement?.querySelector('.fallback-initial');
                if (fallback) (fallback as HTMLElement).style.display = 'flex';
              }}
            />
          ) : null}
          <div className="fallback-initial absolute inset-0 flex items-center justify-center text-3xl font-bold text-white" style={{ display: hero.image ? 'none' : 'flex' }}>
            {hero.name.charAt(0)}
          </div>
        </div>
        
        {/* Hero name */}
        <h3 className="text-2xl font-bold text-white mb-2">{hero.name}</h3>
        
        {/* Role badge */}
        <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold uppercase border ${roleBadgeColors[hero.role]}`}>
          {hero.role}
        </span>

        {/* Score badge and favorite button - grouped together */}
        <div className="absolute top-4 right-4 flex items-center gap-2">
          {/* Favorite button */}
          {onToggleFavorite && (
            <button
              onClick={() => onToggleFavorite(hero.id)}
              className="p-2 rounded-lg bg-white/90 backdrop-blur-sm hover:bg-white transition-all duration-200 hover:scale-110 group shadow-lg"
              aria-label={isFavorite ? "Remove from favorites" : "Add to favorites"}
            >
              <svg
                className={`w-5 h-5 transition-all duration-200 ${
                  isFavorite 
                    ? "fill-yellow-400 text-yellow-400" 
                    : "fill-none text-slate-900 group-hover:text-yellow-500 group-hover:fill-yellow-400"
                }`}
                stroke="currentColor"
                strokeWidth={2}
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z"
                />
              </svg>
            </button>
          )}
          {/* Score */}
          <div className="bg-white/90 backdrop-blur-sm text-slate-900 px-4 py-2 rounded-lg font-bold text-lg shadow-lg">
            {Math.round(score)}
          </div>
        </div>
      </div>

      {/* Hero details */}
      <div className="p-6">
        {/* Score summary */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-slate-400">Recommendation Score</span>
            <span className={`text-sm font-semibold ${
              score >= 80 ? "text-green-400" : 
              score >= 70 ? "text-yellow-400" : 
              "text-slate-400"
            }`}>
              {score >= 80 ? "Excellent" : score >= 70 ? "Good" : "Viable"}
            </span>
          </div>
          <div className="w-full bg-slate-700/50 rounded-full h-2 overflow-hidden">
            <div 
              className={`h-full transition-all duration-500 ${
                score >= 80 ? "bg-green-500" : 
                score >= 70 ? "bg-yellow-500" : 
                "bg-slate-500"
              }`}
              style={{ width: `${Math.min(100, (score / 100) * 100)}%` }}
            />
          </div>
        </div>

        {/* Reasons */}
        <div>
          <h4 className="text-sm font-semibold text-slate-300 mb-2">Why this pick?</h4>
          <ul className="space-y-2">
            {reasons.map((reason, idx) => (
              <li key={idx} className="flex items-start text-sm text-slate-300">
                <span className={`mr-2 mt-0.5 ${reason.includes("⚠️") ? "text-yellow-500" : "text-green-500"}`}>
                  {reason.includes("⚠️") ? "⚠️" : "✓"}
                </span>
                <span className={reason.includes("⚠️") ? "text-yellow-300" : ""}>
                  {reason.replace("⚠️ ", "")}
                </span>
              </li>
            ))}
          </ul>
        </div>

        {/* Additional meta info */}
        {hero.difficulty && (
          <div className="mt-4 pt-4 border-t border-slate-700/50">
            <span className="text-xs text-slate-400">
              Difficulty: <span className={`font-semibold ${
                hero.difficulty === "easy" ? "text-green-400" :
                hero.difficulty === "medium" ? "text-yellow-400" :
                "text-red-400"
              }`}>
                {hero.difficulty.charAt(0).toUpperCase() + hero.difficulty.slice(1)}
              </span>
            </span>
          </div>
        )}
      </div>
    </div>
  );
}


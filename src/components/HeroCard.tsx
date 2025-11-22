import { HeroRecommendation } from "@/lib/recommendation";
import { Role } from "@/data/heroes";

interface HeroCardProps {
  recommendation: HeroRecommendation;
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

export default function HeroCard({ recommendation }: HeroCardProps) {
  const { hero, score, reasons } = recommendation;

  return (
    <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl shadow-lg overflow-hidden border border-slate-700/50 hover:border-slate-600/70 transition-all duration-200 hover:shadow-xl">
      {/* Hero header with gradient */}
      <div className={`${roleGradients[hero.role]} p-6 relative`}>
        {/* Hero initial/icon */}
        <div className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center text-3xl font-bold text-white mb-3 shadow-lg">
          {hero.name.charAt(0)}
        </div>
        
        {/* Hero name */}
        <h3 className="text-2xl font-bold text-white mb-2">{hero.name}</h3>
        
        {/* Role badge */}
        <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold uppercase border ${roleBadgeColors[hero.role]}`}>
          {hero.role}
        </span>

        {/* Score badge */}
        <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm text-slate-900 px-4 py-2 rounded-lg font-bold text-lg shadow-lg">
          {Math.round(score)}
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


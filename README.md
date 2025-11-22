# OW2 Pick Coach

A modern web app that helps Overwatch 2 players choose the best hero based on team composition, enemy heroes, rank, and map type.

## Features

- **Smart Hero Recommendations**: Get data-driven hero picks based on counters, synergies, and meta strength
- **Beautiful UI**: Modern, gradient-based design with role-specific color coding
- **Fully Configurable**: Adjust team composition, enemy heroes, rank, and map type
- **Easy to Extend**: Simple data-driven architecture makes adding heroes and tuning recommendations straightforward

## Getting Started

### Installation

```bash
# Install dependencies
npm install

# Run development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the app.

### Build for Production

```bash
npm run build
npm start
```

## How It Works

### Scoring System

The recommendation engine uses a **heuristic scoring model** with the following components:

1. **Base Score** (0-100): Each hero has a `generalTierScore` representing their overall meta strength
2. **Counter Score**: 
   - +5 points for each enemy hero countered (`strongAgainst`)
   - -4 points for each enemy hero that counters you (`weakAgainst`)
3. **Synergy Score**: +3 points for each ally hero with synergy (`synergizesWith`)
4. **Map Affinity**: +3 points if the hero excels on the selected map type
5. **Rank Adjustment**: Small bonuses for easier heroes in lower ranks

### File Structure

```
src/
├── app/
│   ├── page.tsx           # Main UI page
│   ├── layout.tsx         # Root layout
│   └── globals.css        # Global styles
├── components/
│   ├── HeroCard.tsx       # Hero recommendation card
│   └── HeroMultiSelect.tsx # Multi-select hero picker
├── data/
│   └── heroes.ts          # Hero data & counter matrix
└── lib/
    └── recommendation.ts  # Scoring logic
```

## Customization Guide

### Adding New Heroes

Edit `src/data/heroes.ts`:

```typescript
{
  id: "new-hero",              // Lowercase, hyphenated
  name: "New Hero",             // Display name
  role: "damage",               // "tank" | "damage" | "support"
  strongAgainst: ["hero1", "hero2"],  // Heroes this hero counters
  weakAgainst: ["hero3"],             // Heroes that counter this hero
  synergizesWith: ["hero4", "hero5"], // Heroes with good synergy
  mapAffinity: ["control", "close-quarters"], // Optional map preferences
  generalTierScore: 75,         // 0-100 meta strength
  difficulty: "medium",         // Optional: "easy" | "medium" | "hard"
}
```

### Adjusting Scoring Weights

Edit `src/lib/recommendation.ts` at the top:

```typescript
const COUNTER_BONUS = 5;      // Points for countering enemies
const COUNTER_PENALTY = 4;    // Points lost for being countered
const SYNERGY_BONUS = 3;      // Points for ally synergy
const MAP_BONUS = 3;          // Points for map affinity
```

### Changing UI Styles

- **Colors**: Edit `tailwind.config.js` to adjust role gradients
- **Layout**: Edit `src/app/page.tsx` for grid structure
- **Hero Cards**: Edit `src/components/HeroCard.tsx` for card appearance
- **Global styles**: Edit `src/app/globals.css`

## Tech Stack

- **Next.js 14** (App Router)
- **TypeScript** (Strict mode)
- **Tailwind CSS** (Utility-first styling)
- **React 18** (Functional components + hooks)

## Design Decisions

- **No external hero images**: Uses gradient backgrounds and initials to avoid copyright issues
- **Client-side computation**: All recommendations calculated in-browser for instant results
- **Data-driven**: Easy to update hero data without touching code logic
- **Mobile-responsive**: Works great on desktop and mobile devices

## Future Enhancements

Possible improvements:
- Add more heroes (currently has 21 heroes)
- Implement hero search/filter in multi-select
- Add more sophisticated meta-game tracking
- Include patch notes and meta shifts
- Add user preferences (save favorite heroes, etc.)
- Export/share hero recommendations

## License

ISC


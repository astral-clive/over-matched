"use client";

import { SavedMatchConfig } from "@/lib/preferences";

interface SavedConfigCardProps {
  config: SavedMatchConfig;
  onLoad: (config: SavedMatchConfig) => void;
  onDelete: (configId: string) => void;
}

export default function SavedConfigCard({
  config,
  onLoad,
  onDelete,
}: SavedConfigCardProps) {
  const formatDate = (isoDate: string) => {
    const date = new Date(isoDate);
    return date.toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  return (
    <div className="bg-slate-800/30 rounded-lg p-3 border border-slate-700/50 hover:border-slate-600 transition-all">
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <h4 className="font-semibold text-slate-200 text-sm truncate">{config.name}</h4>
          <div className="flex items-center gap-2 mt-1 text-xs text-slate-400">
            <span className="capitalize">{config.role}</span>
            <span>•</span>
            <span>{config.rank}</span>
            <span>•</span>
            <span>{formatDate(config.createdAt)}</span>
          </div>
        </div>
        <div className="flex gap-1">
          <button
            onClick={() => onLoad(config)}
            className="p-1.5 rounded hover:bg-cyan-500/20 text-cyan-400 transition-colors"
            title="Load configuration"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
            </svg>
          </button>
          <button
            onClick={() => onDelete(config.id)}
            className="p-1.5 rounded hover:bg-red-500/20 text-red-400 transition-colors"
            title="Delete configuration"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}


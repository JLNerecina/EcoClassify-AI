import React from 'react';
import { Trash2, Cpu, History, Settings, Sparkles, RefreshCw } from 'lucide-react';

interface HeaderProps {
  onOpenHistory: () => void;
  onOpenSettings: () => void;
  historyCount: number;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenHistory,
  onOpenSettings,
  historyCount,
}) => {
  return (
    <header className="sticky top-0 z-30 bg-slate-900/95 backdrop-blur-md border-b border-slate-800 text-slate-100 py-3">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 min-h-[72px] flex items-center justify-between gap-4">
        {/* Brand Logo & Title */}
        <div className="flex items-center space-x-4">
          <img
            src="/Gemini_Generated_Image_lmzx7hlmzx7hlmzx-removebg-preview.png"
            alt="EcoClassify AI Logo"
            className="w-20 h-20 sm:w-24 sm:h-24 object-contain filter drop-shadow-[0_0_15px_rgba(16,185,129,0.35)] transition-transform hover:scale-105 shrink-0"
          />
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-white">
                EcoClassify AI
              </h1>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shadow-sm">
                RF-DETR AI
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-400 mt-0.5 font-medium">
              Automated Garbage Classification & Recycling Guidance
            </p>
          </div>
        </div>

        {/* Model info & Action Controls */}
        <div className="flex items-center space-x-2 sm:space-x-3">
          <div className="hidden lg:flex items-center space-x-2 px-3 py-1.5 rounded-lg bg-slate-800/80 border border-slate-700/60 text-xs text-slate-300">
            <Cpu className="w-3.5 h-3.5 text-emerald-400" />
            <span className="text-slate-400">Workflow:</span>
            <span className="font-mono text-emerald-300 truncate max-w-[180px]">
              garbage-classification-3
            </span>
          </div>

          <button
            onClick={onOpenHistory}
            className="relative flex items-center space-x-1.5 px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium transition-colors border border-slate-700/50"
            title="Classification History"
          >
            <History className="w-4 h-4 text-slate-400" />
            <span className="hidden sm:inline">History</span>
            {historyCount > 0 && (
              <span className="ml-1 inline-flex items-center justify-center px-1.5 py-0.5 text-[10px] font-bold leading-none text-emerald-950 bg-emerald-400 rounded-full">
                {historyCount}
              </span>
            )}
          </button>

          <button
            onClick={onOpenSettings}
            className="flex items-center space-x-1.5 px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium transition-colors border border-slate-700/50"
            title="API & Workflow Settings"
          >
            <Settings className="w-4 h-4 text-slate-400" />
            <span className="hidden sm:inline">Settings</span>
          </button>
        </div>
      </div>
    </header>
  );
};

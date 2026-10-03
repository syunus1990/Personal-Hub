import React, { useState } from 'react';
import {
  RotateCcw,
  Download,
  Upload,
  MoreVertical,
  Wifi,
  Battery,
  Signal,
  CheckCircle,
  HelpCircle
} from 'lucide-react';

interface AndroidHeaderProps {
  onResetSampleData: () => void;
  onExportData: () => void;
  onImportData: (e: React.ChangeEvent<HTMLInputElement>) => void;
  activeFilter: string;
}

export const AndroidHeader: React.FC<AndroidHeaderProps> = ({
  onResetSampleData,
  onExportData,
  onImportData,
  activeFilter,
}) => {
  const [showMenu, setShowMenu] = useState(false);
  const [showAbout, setShowAbout] = useState(false);

  return (
    <header className="sticky top-0 z-30 bg-[#0d0e12]/80 backdrop-blur-xl border-b border-white/10 transition-colors">
      {/* Main Material 3 Top App Bar */}
      <div className="px-4 py-2.5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          {/* Logo Badge */}
          <div className="w-9 h-9 rounded-xl bg-violet-600 text-white flex items-center justify-center shadow-lg shadow-violet-500/25 border border-violet-400/30">
            <span className="text-base font-black tracking-tight">F</span>
          </div>

          <div>
            <h1 className="text-base font-bold text-white tracking-tight leading-tight flex items-center gap-1.5">
              <span>FollowUp</span>
              <span className="text-[10px] font-normal px-2 py-0.5 rounded-full bg-violet-500/20 text-violet-300 border border-violet-500/30">
                Glass
              </span>
            </h1>
            <p className="text-[11px] text-slate-400 font-medium">
              Private Chase & Task Tracker
            </p>
          </div>
        </div>

        {/* Action Menu (Reset / Export / Backup) */}
        <div className="relative">
          <button
            type="button"
            id="btn-app-menu"
            onClick={() => setShowMenu(!showMenu)}
            className="p-2 rounded-xl text-slate-300 bg-white/5 border border-white/10 hover:bg-white/10 backdrop-blur-md transition-colors cursor-pointer"
            aria-label="App Menu"
          >
            <MoreVertical className="w-4 h-4" />
          </button>

          {showMenu && (
            <div className="absolute right-0 mt-2 w-56 bg-[#13151c]/95 backdrop-blur-2xl border border-white/15 rounded-2xl shadow-2xl p-1.5 z-40 space-y-1">
              <button
                type="button"
                id="btn-menu-about"
                onClick={() => {
                  setShowAbout(true);
                  setShowMenu(false);
                }}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs text-slate-200 hover:bg-white/10 text-left transition-colors cursor-pointer"
              >
                <HelpCircle className="w-3.5 h-3.5 text-violet-400" />
                <span>How FollowUp Works</span>
              </button>

              <button
                type="button"
                id="btn-menu-export"
                onClick={() => {
                  onExportData();
                  setShowMenu(false);
                }}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs text-slate-200 hover:bg-white/10 text-left transition-colors cursor-pointer"
              >
                <Download className="w-3.5 h-3.5 text-emerald-400" />
                <span>Export Local Backup (JSON)</span>
              </button>

              <label className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs text-slate-200 hover:bg-white/10 text-left transition-colors cursor-pointer">
                <Upload className="w-3.5 h-3.5 text-blue-400" />
                <span>Import Backup</span>
                <input
                  type="file"
                  accept=".json"
                  onChange={(e) => {
                    onImportData(e);
                    setShowMenu(false);
                  }}
                  className="hidden"
                />
              </label>

              <div className="border-t border-white/10 my-1" />

              <button
                type="button"
                id="btn-menu-reset"
                onClick={() => {
                  if (window.confirm('Reset all tasks to original sample data?')) {
                    onResetSampleData();
                  }
                  setShowMenu(false);
                }}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs text-rose-300 hover:bg-rose-500/10 text-left transition-colors cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5 text-rose-400" />
                <span>Reset to Sample Data</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* About Modal */}
      {showAbout && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
          <div className="bg-[#13151c]/95 backdrop-blur-2xl border border-white/15 rounded-3xl p-6 max-w-sm w-full space-y-4 shadow-2xl shadow-violet-950/60">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-violet-600 text-white flex items-center justify-center font-bold shadow-lg shadow-violet-600/30">
                F
              </div>
              <div>
                <h3 className="text-base font-bold text-white">
                  About FollowUp
                </h3>
                <p className="text-xs text-slate-400">
                  Frosted Glass Task & Chase Manager
                </p>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              &quot;Things I am chasing, things I need to do, and things I don&apos;t want to forget.&quot;
            </p>

            <div className="text-xs text-slate-300 space-y-2 bg-white/5 border border-white/10 p-4 rounded-2xl">
              <p>• <strong className="text-violet-300">Same Task Identity:</strong> Following up moves the date without creating duplicate tasks.</p>
              <p>• <strong className="text-emerald-300">History Timeline:</strong> Every follow-up records completion % and remark logs.</p>
              <p>• <strong className="text-blue-300">100% Local:</strong> Stored locally on this device, no login or cloud required.</p>
            </div>

            <button
              type="button"
              onClick={() => setShowAbout(false)}
              className="w-full py-2.5 bg-violet-600 hover:bg-violet-500 text-white text-xs font-bold rounded-2xl cursor-pointer shadow-lg shadow-violet-600/30 transition-colors"
            >
              Got it
            </button>
          </div>
        </div>
      )}
    </header>
  );
};

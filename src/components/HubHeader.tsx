import React, { useState } from 'react';
import {
  Home,
  ArrowLeft,
  MoreVertical,
  Wifi,
  Battery,
  Signal,
  RotateCcw,
  Download,
  Upload,
  HelpCircle,
  Sparkles,
  Shield,
  Lock,
  HardDrive,
  Smartphone,
} from 'lucide-react';
import { ActiveModule } from '../types';
import { PWAInstallButton } from './PWAInstallButton';

interface HubHeaderProps {
  activeModule: ActiveModule;
  onNavigateHome: () => void;
  onBack?: () => void;
  title?: string;
  subtitle?: string;
  onResetAllData?: () => void;
  onClearAllData?: () => void;
  onOpenBackupModal?: () => void;
  onOpenSecurityModal?: () => void;
  onLockNow?: () => void;
  isPinEnabled?: boolean;
  rightAction?: React.ReactNode;
}

export const HubHeader: React.FC<HubHeaderProps> = ({
  activeModule,
  onNavigateHome,
  onBack,
  title,
  subtitle,
  onResetAllData,
  onClearAllData,
  onOpenBackupModal,
  onOpenSecurityModal,
  onLockNow,
  isPinEnabled,
  rightAction,
}) => {
  const [showMenu, setShowMenu] = useState(false);
  const [showAbout, setShowAbout] = useState(false);
  const [showApkGuide, setShowApkGuide] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  const getModuleTitle = () => {
    if (title) return title;
    switch (activeModule) {
      case 'home':
        return 'Personal Hub';
      case 'followup':
        return 'Follow Up & Wishlist';
      case 'money':
      case 'expenses':
        return 'Money';
      case 'loans':
        return 'Loans (INR & SAR)';
      case 'notes':
        return 'Personal Notes';
      case 'calendar':
        return 'Follow-Up Calendar';
      case 'summary':
        return 'Personal Summary';
      default:
        return 'Personal Hub';
    }
  };

  const getModuleSubtitle = () => {
    if (subtitle) return subtitle;
    switch (activeModule) {
      case 'home':
        return 'Everything I need to keep track of';
      case 'followup':
        return 'Things I need to chase, do or remember';
      case 'money':
      case 'expenses':
        return 'Accounts, expenses & loans';
      case 'loans':
        return 'Multi-currency personal loans & SAR conversion';
      case 'notes':
        return 'Quick notes & personal information';
      case 'calendar':
        return 'Follow-up timeline & schedule';
      case 'summary':
        return 'Complete personal overview';
      default:
        return '';
    }
  };

  return (
    <header className="sticky top-0 z-30 bg-[#0d0e12]/85 backdrop-blur-2xl border-b border-white/10 select-none">
      {/* Main Bar */}
      <div className="px-4 py-2.5 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2.5 min-w-0">
          {activeModule !== 'home' ? (
            <div className="flex items-center gap-1">
              <button
                type="button"
                id="btn-header-back"
                onClick={onBack || onNavigateHome}
                className="p-2 rounded-xl text-slate-300 bg-white/5 border border-white/10 hover:bg-white/10 hover:text-white transition-colors cursor-pointer"
                aria-label="Go Back"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
              <button
                type="button"
                id="btn-header-home"
                onClick={onNavigateHome}
                className="p-2 rounded-xl text-violet-300 bg-violet-500/10 border border-violet-500/20 hover:bg-violet-500/20 transition-colors cursor-pointer"
                title="Return to Personal Hub Home"
                aria-label="Return to Home"
              >
                <Home className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="w-9 h-9 rounded-xl bg-violet-600 text-white flex items-center justify-center shadow-lg shadow-violet-500/25 border border-violet-400/30 shrink-0">
              <Sparkles className="w-4 h-4" />
            </div>
          )}

          <div className="min-w-0">
            <h1 className="text-base font-bold text-white tracking-tight leading-tight flex items-center gap-1.5 truncate">
              <span>{getModuleTitle()}</span>
              {activeModule === 'home' && (
                <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-violet-500/20 text-violet-300 border border-violet-500/30">
                  Hub
                </span>
              )}
            </h1>
            <p className="text-[11px] text-slate-400 font-medium truncate">
              {getModuleSubtitle()}
            </p>
          </div>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-1.5 shrink-0">
          <PWAInstallButton compact />

          {rightAction}

          {/* Quick Lock Button if PIN enabled */}
          {isPinEnabled && onLockNow && (
            <button
              type="button"
              id="header-quick-lock-btn"
              onClick={onLockNow}
              className="p-2 rounded-xl text-slate-300 bg-white/5 border border-white/10 hover:bg-white/10 hover:text-amber-400 transition-colors cursor-pointer"
              title="Lock App Now"
            >
              <Lock className="w-4 h-4" />
            </button>
          )}

          {/* Hub Menu */}
          <div className="relative">
            <button
              type="button"
              id="btn-hub-menu"
              onClick={() => setShowMenu(!showMenu)}
              className="p-2 rounded-xl text-slate-300 bg-white/5 border border-white/10 hover:bg-white/10 backdrop-blur-md transition-colors cursor-pointer"
              aria-label="Hub Options Menu"
            >
              <MoreVertical className="w-4 h-4" />
            </button>

            {showMenu && (
              <div className="absolute right-0 mt-2 w-60 bg-[#13151c]/95 backdrop-blur-2xl border border-white/15 rounded-2xl shadow-2xl p-1.5 z-40 space-y-1">
                {onOpenSecurityModal && (
                  <button
                    type="button"
                    id="btn-menu-security"
                    onClick={() => {
                      onOpenSecurityModal();
                      setShowMenu(false);
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs text-slate-200 hover:bg-white/10 text-left transition-colors cursor-pointer"
                  >
                    <Shield className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Privacy & Security (PIN)</span>
                  </button>
                )}

                {onOpenBackupModal && (
                  <button
                    type="button"
                    id="btn-menu-backup"
                    onClick={() => {
                      onOpenBackupModal();
                      setShowMenu(false);
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs text-slate-200 hover:bg-white/10 text-left transition-colors cursor-pointer"
                  >
                    <HardDrive className="w-3.5 h-3.5 text-teal-400" />
                    <span>Backup & Restore Archive</span>
                  </button>
                )}

                <button
                  type="button"
                  id="btn-menu-apk-guide"
                  onClick={() => {
                    setShowApkGuide(true);
                    setShowMenu(false);
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs text-slate-200 hover:bg-white/10 text-left transition-colors cursor-pointer"
                >
                  <Smartphone className="w-3.5 h-3.5 text-cyan-400" />
                  <span>APK & Install on Phone</span>
                </button>

                <button
                  type="button"
                  id="btn-menu-about-hub"
                  onClick={() => {
                    setShowAbout(true);
                    setShowMenu(false);
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs text-slate-200 hover:bg-white/10 text-left transition-colors cursor-pointer"
                >
                  <HelpCircle className="w-3.5 h-3.5 text-violet-400" />
                  <span>About Personal Hub</span>
                </button>

                <div className="border-t border-white/10 my-1" />

                {onClearAllData && (
                  <button
                    type="button"
                    id="btn-menu-clear-all"
                    onClick={() => {
                      setShowClearConfirm(true);
                      setShowMenu(false);
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs text-rose-300 hover:bg-rose-500/15 text-left transition-colors cursor-pointer font-semibold"
                  >
                    <RotateCcw className="w-3.5 h-3.5 text-rose-400" />
                    <span>Clear All Existing Data</span>
                  </button>
                )}

                {onResetAllData && (
                  <button
                    type="button"
                    id="btn-menu-reset-hub"
                    onClick={() => {
                      if (window.confirm('Reset all modules with sample demo data? (Existing data will be replaced by demo data)')) {
                        onResetAllData();
                      }
                      setShowMenu(false);
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs text-slate-400 hover:bg-white/10 text-left transition-colors cursor-pointer"
                  >
                    <RotateCcw className="w-3.5 h-3.5 text-slate-400" />
                    <span>Reset to Sample Data</span>
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* About Modal */}
      {showAbout && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
          <div className="bg-[#13151c]/95 backdrop-blur-2xl border border-white/15 rounded-3xl p-6 max-w-sm w-full space-y-4 shadow-2xl shadow-violet-950/60">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-violet-600 text-white flex items-center justify-center font-bold shadow-lg shadow-violet-600/30">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Personal Hub</h3>
                <p className="text-xs text-slate-400">Everything in one place</p>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              &quot;Things I am chasing, things I need to do, things I don&apos;t want to forget, my notes, daily expenses, and personal loans.&quot;
            </p>

            <div className="text-xs text-slate-300 space-y-2 bg-white/5 border border-white/10 p-4 rounded-2xl">
              <p>• <strong className="text-violet-300">FollowUp:</strong> Track pending chases without losing task identity.</p>
              <p>• <strong className="text-amber-300">Loans:</strong> INR & SAR personal loans with live exchange rates.</p>
              <p>• <strong className="text-emerald-300">Expenses:</strong> Daily tracking with custom accounts and categories.</p>
              <p>• <strong className="text-indigo-300">Security:</strong> PIN lock, Biometric authentication & auto-lock.</p>
              <p>• <strong className="text-teal-300">100% Local & Private:</strong> Offline-first storage with encrypted backups.</p>
            </div>

            {/* 512x512 Icon Download for PWABuilder / App Stores */}
            <div className="p-3 bg-violet-950/40 border border-violet-500/30 rounded-2xl flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <img src="/icons/icon-512x512.png" alt="App Icon" className="w-10 h-10 rounded-xl border border-white/20 shadow-md" />
                <div>
                  <p className="text-xs font-bold text-white leading-tight">512×512 HD Icon</p>
                  <p className="text-[10px] text-violet-300">Required by PWABuilder</p>
                </div>
              </div>
              <a
                href="/icons/icon-512x512.png"
                download="icon-512x512.png"
                className="px-3 py-1.5 bg-violet-600 hover:bg-violet-500 text-white text-[11px] font-semibold rounded-xl flex items-center gap-1 shadow-sm transition-colors"
              >
                <Download className="w-3 h-3" />
                <span>Save</span>
              </a>
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

      {/* APK & Phone Install Guide Modal */}
      {showApkGuide && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md">
          <div className="bg-[#13151c]/95 backdrop-blur-2xl border border-white/20 rounded-[2rem] p-6 max-w-sm w-full space-y-4 shadow-2xl shadow-cyan-950/50">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-2xl bg-cyan-600/30 border border-cyan-500/40 text-cyan-300 flex items-center justify-center">
                  <Smartphone className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Install on Android Phone</h3>
                  <p className="text-[11px] text-slate-400">Two easiest methods</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowApkGuide(false)}
                className="p-1 rounded-xl text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs text-slate-200">
              <div className="p-3 bg-white/5 rounded-2xl border border-white/10 space-y-1.5">
                <span className="font-bold text-emerald-400 block">Method 1: Instant 1-Tap Install (Recommended)</span>
                <p className="text-slate-300 leading-relaxed text-[11px]">
                  1. Open your app URL in Chrome on your phone: <br />
                  <code className="text-emerald-300 font-mono text-[10px]">https://personal-hub-six-beige.vercel.app</code>
                </p>
                <p className="text-slate-300 leading-relaxed text-[11px]">
                  2. Tap Chrome&apos;s <strong>three dots (⋮)</strong> at top right &rarr; select <strong>&quot;Install app&quot;</strong> or <strong>&quot;Add to Home screen&quot;</strong>.
                </p>
                <p className="text-emerald-300/90 text-[10px]">
                  Runs as a 100% full-screen native Android app with offline storage and app icon!
                </p>
              </div>

              <div className="p-3 bg-white/5 rounded-2xl border border-white/10 space-y-1.5">
                <span className="font-bold text-cyan-400 block">Method 2: PWABuilder Direct APK</span>
                <p className="text-slate-300 leading-relaxed text-[11px]">
                  In PWABuilder, click <strong>&quot;Package For Stores&quot;</strong>:
                </p>
                <p className="text-slate-300 text-[11px]">
                  • In the left menu, select <strong>&quot;Other Android&quot;</strong> (not Google Play)
                </p>
                <p className="text-slate-300 text-[11px]">
                  • Set Package ID to <code className="text-cyan-300">com.personalhub.app</code> (Android rejects underscores)
                </p>
                <p className="text-slate-300 text-[11px]">
                  • Set Signing key to <strong>&quot;None&quot;</strong> (avoids key error)
                </p>
                <p className="text-cyan-300 text-[11px] font-semibold">
                  Click Generate &rarr; download your .apk!
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowApkGuide(false)}
              className="w-full py-2.5 bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold rounded-2xl cursor-pointer shadow-lg shadow-cyan-600/30 transition-colors"
            >
              Done
            </button>
          </div>
        </div>
      )}

      {/* Clear All Data Confirmation Modal */}
      {showClearConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="bg-[#13151c]/95 backdrop-blur-2xl border border-rose-500/40 rounded-[2rem] p-6 max-w-sm w-full space-y-4 shadow-2xl shadow-rose-950/60">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-rose-600/30 text-rose-300 border border-rose-500/40 flex items-center justify-center shrink-0">
                <RotateCcw className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">Clear All App Data?</h3>
                <p className="text-[11px] text-rose-300">Reset to completely clean slate</p>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed bg-white/5 p-3 rounded-2xl border border-white/10">
              This will permanently delete all existing tasks, transactions, accounts, notes, and loans. You can then start completely fresh or import from Excel.
            </p>

            <div className="flex gap-2.5 pt-1">
              <button
                type="button"
                onClick={() => setShowClearConfirm(false)}
                className="flex-1 py-2.5 rounded-2xl border border-white/15 text-xs font-bold text-slate-300 hover:bg-white/10 cursor-pointer transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                id="btn-confirm-clear-all-data"
                onClick={() => {
                  if (onClearAllData) onClearAllData();
                  setShowClearConfirm(false);
                }}
                className="flex-1 py-2.5 rounded-2xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold cursor-pointer shadow-lg shadow-rose-600/40 transition-colors"
              >
                Yes, Clear All
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};


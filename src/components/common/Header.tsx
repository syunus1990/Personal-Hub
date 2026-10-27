import React from 'react';
import {
  Settings as SettingsIcon,
  Maximize2,
  Minimize2,
  Search,
  Sparkles,
  ArrowRightLeft,
  Smartphone,
  ScanLine,
  QrCode,
  Sun,
  Moon,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { triggerHaptic } from '../../utils/haptics';
import { getCurrencyConfig } from '../../utils/currency';

export const Header: React.FC = () => {
  const {
    activeTab,
    settings,
    toggleTheme,
    toggleCurrency,
    toggleFullscreen,
    setIsSettingsOpen,
    setIsPwaGuideOpen,
    openSyncModal,
    gateState,
    dataVersion,
    searchQuery,
    setSearchQuery,
  } = useApp();

  const getTitle = () => {
    switch (activeTab) {
      case 'dashboard':
        return 'Personal Hub';
      case 'money':
        return 'Money & Finance';
      case 'notes':
        return 'Notes & Memos';
      case 'followups':
        return 'Follow-ups & Tasks';
      case 'wishlists':
        return 'Wishlists & Goals';
      case 'loans':
        return 'Loans & Debt';
      default:
        return 'Personal Hub';
    }
  };

  return (
    <header className="sticky top-0 z-30 w-full px-4 pt-3 pb-2.5 glass-panel transition-colors duration-200">
      <div className="max-w-md mx-auto flex items-center justify-between gap-3">
        {/* Zone 1: Wordmark / title */}
        <div className="flex items-center gap-2.5 min-w-0">
          <img
            src="/pwa-192x192.png"
            alt="Personal Hub"
            className="w-8 h-8 rounded-xl object-cover shadow-xs ring-1 ring-amber-500/30 shrink-0"
          />
          <div className="truncate">
            <h1 className="text-base font-bold tracking-tight text-slate-900 dark:text-slate-100 truncate">
              {getTitle()}
            </h1>
            <p className="text-[11px] text-purple-600 dark:text-purple-400 font-semibold tracking-wide leading-none flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse inline-block" />
              <span>{settings.brandingLabel || 'Prime Edition'}</span>
            </p>
          </div>
        </div>

        {/* Zone 2 & 3: Actions & Controls */}
        <div className="flex items-center gap-1 shrink-0">
          {/* Currency / Exchange Rate Toggle Button */}
          {settings.enableExchangeRate !== false ? (
            <button
              onClick={toggleCurrency}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-purple-50 hover:bg-purple-100 dark:bg-purple-950/40 dark:hover:bg-purple-900/60 text-purple-700 dark:text-purple-300 text-xs font-semibold tracking-wide transition-colors border border-purple-200/60 dark:border-purple-800/50"
              title={`Active Currency: ${settings.displayCurrency} (${getCurrencyConfig(settings.displayCurrency).creativeSymbol}) - Tap to switch`}
              aria-label="Toggle currency"
            >
              <ArrowRightLeft className="w-3 h-3 opacity-70" />
              <span className="tabular-nums font-mono">
                {settings.displayCurrency} {getCurrencyConfig(settings.displayCurrency).creativeSymbol}
              </span>
            </button>
          ) : (
            <div
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold border border-slate-200 dark:border-slate-700"
              title="Exchange rate disabled: Using primary currency SAR (﷼)"
            >
              <span>SAR ﷼</span>
            </div>
          )}

          {/* Quick Theme Toggle Button (1-Tap Light/Dark Switch) */}
          <button
            onClick={toggleTheme}
            className="w-8 h-8 rounded-xl flex items-center justify-center text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            title={`Switch to ${settings.theme === 'dark' ? 'Light' : 'Dark'} Mode`}
            aria-label="Toggle Theme"
          >
            {settings.theme === 'dark' ? (
              <Sun className="w-4 h-4 text-amber-400" />
            ) : (
              <Moon className="w-4 h-4 text-slate-600" />
            )}
          </button>

          {/* APK / PWA Guide button */}
          <button
            onClick={() => {
              triggerHaptic('light', settings.enableHaptics);
              setIsPwaGuideOpen(true);
            }}
            className="w-8 h-8 rounded-xl flex items-center justify-center text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            title="Download APK / Install PWA"
            aria-label="Download APK"
          >
            <Smartphone className="w-4 h-4" />
          </button>

          {/* Fullscreen Toggle (hide status bar) */}
          <button
            onClick={toggleFullscreen}
            className="w-8 h-8 rounded-xl flex items-center justify-center text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            title={settings.isFullscreen ? 'Exit Full-screen' : 'Enter Full-screen (Hide status bar)'}
            aria-label="Full-screen mode"
          >
            {settings.isFullscreen ? (
              <Minimize2 className="w-4 h-4" />
            ) : (
              <Maximize2 className="w-4 h-4" />
            )}
          </button>

          {/* Settings Trigger */}
          <button
            onClick={() => {
              triggerHaptic('light', settings.enableHaptics);
              setIsSettingsOpen(true);
            }}
            className="w-8 h-8 rounded-xl flex items-center justify-center text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            title="Settings, Data Backup, Currency"
            aria-label="Settings"
          >
            <SettingsIcon className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Global Quick Search Bar */}
      {(activeTab === 'notes' || activeTab === 'followups' || activeTab === 'money' || activeTab === 'loans' || activeTab === 'wishlists') && (
        <div className="max-w-md mx-auto mt-2">
          <div className="relative flex items-center">
            <Search className="w-3.5 h-3.5 absolute left-3 text-slate-400 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={`Search in ${getTitle()}...`}
              className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 focus:bg-white dark:focus:bg-slate-800 focus:outline-none focus:ring-1 focus:ring-purple-400 text-slate-900 dark:text-slate-100 placeholder-slate-400"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 text-[11px] text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                ✕
              </button>
            )}
          </div>
        </div>
      )}
    </header>
  );
};

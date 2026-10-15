import React from 'react';
import {
  Smartphone,
  Download,
  Share2,
  CheckCircle2,
  X,
  ExternalLink,
  Layers,
  Cpu,
} from 'lucide-react';
import { usePWAInstall } from '../../hooks/usePWAInstall';
import { useApp } from '../../context/AppContext';

export const PWAInstallModal: React.FC = () => {
  const { isPwaGuideOpen, setIsPwaGuideOpen } = useApp();
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();

  if (!isPwaGuideOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
    >
      <div className="w-full max-w-md glass-panel rounded-3xl p-5 shadow-2xl border border-white/60 dark:border-white/10 max-h-[90vh] overflow-y-auto no-scrollbar">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-200/50 dark:border-slate-800/50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-purple-100 dark:bg-purple-950/60 flex items-center justify-center text-purple-600 dark:text-purple-400">
              <Smartphone className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                Install App & APK Guide
              </h2>
              <p className="text-[11px] text-slate-400">
                Cross-platform mobile application
              </p>
            </div>
          </div>
          <button
            onClick={() => setIsPwaGuideOpen(false)}
            className="w-7 h-7 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="py-4 space-y-4">
          {/* Luxury App Icon Card */}
          <div className="p-3.5 rounded-2xl bg-gradient-to-r from-amber-500/10 via-purple-500/10 to-indigo-500/10 border border-amber-300/40 dark:border-amber-700/40 flex items-center gap-3.5">
            <img
              src="/apple-touch-icon.png"
              alt="Luxury App Icon"
              className="w-14 h-14 rounded-2xl shadow-lg ring-2 ring-amber-500/40 object-cover shrink-0"
            />
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-xs font-bold text-slate-800 dark:text-slate-100">
                  Luxury Edition Icon
                </span>
                <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-md bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-400/30">
                  Android & iOS
                </span>
              </div>
              <p className="text-[11px] text-slate-600 dark:text-slate-300 mt-0.5 leading-snug">
                Custom obsidian & 24k gold monogram emblem configured for APK, WebAPK, and iOS Home Screen.
              </p>
            </div>
          </div>

          {/* Status banner */}
          <div className="p-3 rounded-2xl bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900/50 text-xs">
            <div className="flex items-start gap-2 text-indigo-900 dark:text-indigo-200">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-indigo-500 mt-0.5" />
              <div>
                <p className="font-semibold">Full Standalone Mobile Experience</p>
                <p className="text-[11px] text-indigo-700/80 dark:text-indigo-300/80 mt-0.5">
                  Personal Hub is built as an offline-first Progressive Web App (PWA) with complete local persistence, smooth gesture ergonomics, and fullscreen support.
                </p>
              </div>
            </div>
          </div>

          {/* Direct Browser 1-Tap Install */}
          {isInstallable && !isInstalled && (
            <div className="p-3.5 rounded-2xl bg-gradient-to-r from-purple-500/10 to-indigo-500/10 border border-purple-200/50 dark:border-purple-800/50">
              <h3 className="text-xs font-semibold text-purple-900 dark:text-purple-200">
                1-Tap Direct Install
              </h3>
              <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-1 mb-3">
                Install as a native-feel WebAPK on your Android home screen with offline access and fullscreen mode.
              </p>
              <button
                onClick={install}
                className="w-full py-2.5 px-4 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold shadow-md shadow-purple-600/20 flex items-center justify-center gap-2 active:scale-98 transition-all"
              >
                <Download className="w-4 h-4" />
                Install Personal Hub App
              </button>
            </div>
          )}

          {isInstalled && (
            <div className="p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
              <span>App is currently running in installed standalone mode!</span>
            </div>
          )}

          {/* Android WebAPK / APK Builder Instructions */}
          <div className="space-y-2">
            <h4 className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-purple-500" />
              Method 1: Android Chrome WebAPK (Recommended)
            </h4>
            <div className="text-[11px] text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/50 p-3 rounded-2xl space-y-1.5">
              <p>1. Open this app in <strong>Google Chrome</strong> on Android.</p>
              <p>2. Tap the three dots menu (<strong>⋮</strong>) in the top-right corner.</p>
              <p>3. Tap <strong>Install app</strong> or <strong>Add to Home Screen</strong>.</p>
              <p>4. Android will automatically compile and register a standalone <strong>.apk</strong> package directly on your phone!</p>
            </div>
          </div>

          {/* Method 2: Convert to signed APK via PWA Builder or Capacitor */}
          <div className="space-y-2">
            <h4 className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <Cpu className="w-3.5 h-3.5 text-indigo-500" />
              Method 2: Standalone APK via PWABuilder / Capacitor
            </h4>
            <div className="text-[11px] text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/50 p-3 rounded-2xl space-y-2">
              <p>
                To generate a downloadable <code>.apk</code> or Google Play package:
              </p>
              <ol className="list-decimal list-inside space-y-1">
                <li>Deploy this project URL (Vercel / Cloud Run).</li>
                <li>Go to <strong>PWABuilder.com</strong> (by Microsoft).</li>
                <li>Enter the live app URL and click <strong>Generate APK</strong>.</li>
                <li>Download your signed <code>personal-hub.apk</code> ready to sideload.</li>
              </ol>
            </div>
          </div>

          {/* iOS Safari Clear Step-by-Step Guide */}
          <div className="space-y-2.5 p-3.5 rounded-2xl bg-gradient-to-br from-pink-50/80 to-purple-50/80 dark:from-pink-950/30 dark:to-purple-950/30 border border-pink-200/60 dark:border-pink-800/60">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
                <Share2 className="w-4 h-4 text-pink-500" />
                iPhone Installation Guide (Step-by-Step)
              </h4>
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-pink-100 dark:bg-pink-900/60 text-pink-700 dark:text-pink-300">
                iOS Safari
              </span>
            </div>

            <p className="text-[11px] text-slate-600 dark:text-slate-400">
              Apple iOS does not allow automatic 1-tap popups, but you can install Personal Hub directly onto your iPhone home screen in 3 simple steps:
            </p>

            <div className="text-[11px] text-slate-700 dark:text-slate-300 bg-white/80 dark:bg-slate-900/80 p-3 rounded-xl space-y-2 border border-slate-200/50 dark:border-slate-800">
              <div className="flex items-start gap-2">
                <span className="w-5 h-5 rounded-full bg-pink-500 text-white font-bold flex items-center justify-center text-[10px] shrink-0 mt-0.5">
                  1
                </span>
                <div>
                  <p className="font-semibold text-slate-800 dark:text-slate-200">Open in Safari Browser</p>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400">Make sure this app is open in Apple <strong>Safari</strong> (not Chrome/Firefox on iOS, as only Safari can add web apps to Home Screen).</p>
                </div>
              </div>

              <div className="flex items-start gap-2">
                <span className="w-5 h-5 rounded-full bg-pink-500 text-white font-bold flex items-center justify-center text-[10px] shrink-0 mt-0.5">
                  2
                </span>
                <div>
                  <p className="font-semibold text-slate-800 dark:text-slate-200">Tap the Share Icon</p>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400">Tap the blue <strong>Share</strong> button (the square with an arrow pointing up ⎋) at the bottom center of Safari.</p>
                </div>
              </div>

              <div className="flex items-start gap-2">
                <span className="w-5 h-5 rounded-full bg-pink-500 text-white font-bold flex items-center justify-center text-[10px] shrink-0 mt-0.5">
                  3
                </span>
                <div>
                  <p className="font-semibold text-slate-800 dark:text-slate-200">Select "Add to Home Screen"</p>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400">Scroll down the share sheet and tap <strong>"Add to Home Screen"</strong> (with the ⊞ plus icon), then tap <strong>"Add"</strong> in the top-right corner.</p>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between pt-1">
              <span className="text-[11px] text-slate-500 dark:text-slate-400">
                Direct app URL for Safari:
              </span>
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(window.location.href);
                  alert('App URL copied to clipboard! Open Safari on your iPhone and paste.');
                }}
                className="px-2.5 py-1 rounded-lg bg-pink-600 text-white text-[11px] font-semibold hover:bg-pink-700 transition-colors shadow-2xs"
              >
                Copy Link
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="pt-2">
          <button
            onClick={() => setIsPwaGuideOpen(false)}
            className="w-full py-2.5 rounded-2xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-xs font-medium text-slate-700 dark:text-slate-200 transition-colors"
          >
            Got It
          </button>
        </div>
      </div>
    </div>
  );
};

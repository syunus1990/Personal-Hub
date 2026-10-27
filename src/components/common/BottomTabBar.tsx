import React from 'react';
import {
  LayoutGrid,
  Wallet,
  FileText,
  CheckSquare,
  Gift,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { TabType } from '../../types';

interface TabItem {
  id: TabType;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  accentColor: string;
}

const TABS: TabItem[] = [
  {
    id: 'dashboard',
    label: 'Home',
    icon: LayoutGrid,
    accentColor: 'text-indigo-600 dark:text-indigo-400 bg-indigo-50/90 dark:bg-indigo-950/50 border border-indigo-200/60 dark:border-indigo-800/40',
  },
  {
    id: 'money',
    label: 'Money',
    icon: Wallet,
    accentColor: 'text-emerald-600 dark:text-emerald-400 bg-emerald-50/90 dark:bg-emerald-950/50 border border-emerald-200/60 dark:border-emerald-800/40',
  },
  {
    id: 'notes',
    label: 'Notes',
    icon: FileText,
    accentColor: 'text-purple-600 dark:text-purple-400 bg-purple-50/90 dark:bg-purple-950/50 border border-purple-200/60 dark:border-purple-800/40',
  },
  {
    id: 'followups',
    label: 'Follow-ups',
    icon: CheckSquare,
    accentColor: 'text-rose-600 dark:text-rose-400 bg-rose-50/90 dark:bg-rose-950/50 border border-rose-200/60 dark:border-rose-800/40',
  },
  {
    id: 'wishlists',
    label: 'Wishlists',
    icon: Gift,
    accentColor: 'text-amber-600 dark:text-amber-400 bg-amber-50/90 dark:bg-amber-950/50 border border-amber-200/60 dark:border-amber-800/40',
  },
];

export const BottomTabBar: React.FC = () => {
  const { activeTab, setActiveTab, wishlists, followups } = useApp();

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-40 pb-safe pointer-events-none"
      role="navigation"
      aria-label="Bottom Navigation"
    >
      <div className="max-w-md mx-auto px-4 pb-3 pointer-events-auto">
        <div className="bg-white/95 dark:bg-[#121926]/95 backdrop-blur-md rounded-3xl p-1.5 shadow-xl shadow-slate-900/10 dark:shadow-black/40 flex items-center justify-between border border-slate-200/95 dark:border-white/10">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            const badgeCount =
              tab.id === 'wishlists'
                ? wishlists.length
                : tab.id === 'followups'
                ? followups.filter((f) => !f.isCompleted).length
                : 0;

            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`relative flex flex-col items-center justify-center flex-1 py-1.5 px-2 rounded-2xl transition-all duration-200 min-h-[48px] ${
                  isActive
                    ? `${tab.accentColor} font-bold shadow-xs`
                    : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200'
                }`}
                aria-selected={isActive}
                role="tab"
              >
                <div className="relative">
                  <Icon
                    className={`w-5 h-5 transition-transform duration-200 ${
                      isActive ? 'scale-110' : 'scale-100'
                    }`}
                  />
                  {badgeCount > 0 && (
                    <span
                      className={`absolute -top-1 -right-2.5 min-w-[15px] h-3.5 px-1 rounded-full text-[9px] font-bold flex items-center justify-center text-white ${
                        tab.id === 'wishlists' ? 'bg-amber-500' : 'bg-rose-500'
                      }`}
                    >
                      {badgeCount}
                    </span>
                  )}
                </div>
                <span className="text-[10px] tracking-tight mt-0.5 whitespace-nowrap font-medium">
                  {tab.label}
                </span>
                {isActive && (
                  <span
                    className="absolute -bottom-0.5 w-1 h-1 rounded-full bg-current"
                    aria-hidden="true"
                  />
                )}
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
};

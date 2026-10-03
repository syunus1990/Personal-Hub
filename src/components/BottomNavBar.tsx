import React from 'react';
import { FilterTab } from '../types';
import {
  Home,
  LayoutDashboard,
  ListTodo,
  Clock,
  Heart,
  Plus,
} from 'lucide-react';
import { motion } from 'motion/react';

interface BottomNavBarProps {
  currentTab: FilterTab;
  onSelectTab: (tab: FilterTab) => void;
  onOpenCreate: () => void;
  onNavigateHome?: () => void;
  overdueCount: number;
  todayCount: number;
}

export const BottomNavBar: React.FC<BottomNavBarProps> = ({
  currentTab,
  onSelectTab,
  onOpenCreate,
  onNavigateHome,
  overdueCount,
  todayCount,
}) => {
  const isDashboard = currentTab === 'Dashboard';

  return (
    <div className="fixed bottom-0 left-0 right-0 z-30 pointer-events-none flex justify-center pb-safe">
      <div className="w-full max-w-md pointer-events-auto relative px-3 pb-3">
        {/* Floating Action Button (FAB) - Positioned for easy right-thumb reach */}
        <motion.button
          id="fab-create-task"
          type="button"
          whileHover={{ scale: 1.06 }}
          whileTap={{ scale: 0.92 }}
          onClick={onOpenCreate}
          className="absolute -top-6 right-5 w-13 h-13 rounded-full bg-violet-600 hover:bg-violet-500 text-white shadow-xl shadow-violet-600/40 flex items-center justify-center cursor-pointer transition-all z-40 border border-violet-400/40"
          aria-label="Create Task"
        >
          <Plus className="w-6 h-6" />
        </motion.button>

        {/* Navigation Bar Pill with Frosted Glass styling */}
        <nav
          id="android-bottom-nav"
          className="bg-[#13151c]/90 backdrop-blur-2xl border border-white/15 rounded-3xl shadow-2xl shadow-black/70 px-2 py-1.5 flex items-center justify-between"
        >
          {/* Tab 0: Home Hub */}
          {onNavigateHome && (
            <button
              type="button"
              id="nav-tab-hub-home"
              onClick={onNavigateHome}
              className="flex flex-col items-center justify-center py-1 px-2.5 rounded-2xl transition-all cursor-pointer text-slate-400 hover:text-violet-300"
              title="Personal Hub Home"
            >
              <div className="p-1.5 rounded-xl transition-all hover:bg-white/5">
                <Home className="w-4 h-4" />
              </div>
              <span className="text-[10px] tracking-tight mt-0.5 font-medium">Hub</span>
            </button>
          )}

          {/* Tab 1: Dashboard */}
          <button
            type="button"
            id="nav-tab-dashboard"
            onClick={() => onSelectTab('Dashboard')}
            className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-2xl transition-all cursor-pointer ${
              isDashboard
                ? 'text-violet-300 font-bold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <div
              className={`p-1.5 rounded-xl transition-all ${
                isDashboard ? 'bg-violet-500/20 border border-violet-500/30 text-violet-300 shadow-sm' : ''
              }`}
            >
              <LayoutDashboard className="w-4 h-4" />
            </div>
            <span className="text-[10px] tracking-tight mt-0.5">Overview</span>
          </button>

          {/* Tab 2: All Tasks */}
          <button
            type="button"
            id="nav-tab-all-tasks"
            onClick={() => onSelectTab('All')}
            className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-2xl transition-all cursor-pointer ${
              currentTab === 'All'
                ? 'text-violet-300 font-bold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <div
              className={`p-1.5 rounded-xl transition-all ${
                currentTab === 'All' ? 'bg-violet-500/20 border border-violet-500/30 text-violet-300 shadow-sm' : ''
              }`}
            >
              <ListTodo className="w-4 h-4" />
            </div>
            <span className="text-[10px] tracking-tight mt-0.5">Tasks</span>
          </button>

          {/* Tab 3: Today */}
          <button
            type="button"
            id="nav-tab-today"
            onClick={() => onSelectTab('Today')}
            className={`relative flex flex-col items-center justify-center py-1 px-2.5 rounded-2xl transition-all cursor-pointer ${
              currentTab === 'Today'
                ? 'text-blue-300 font-bold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <div
              className={`p-1.5 rounded-xl transition-all relative ${
                currentTab === 'Today' ? 'bg-blue-500/20 border border-blue-500/30 text-blue-300 shadow-sm' : ''
              }`}
            >
              <Clock className="w-4 h-4" />
              {todayCount > 0 && (
                <span className="absolute -top-1 -right-1.5 w-3.5 h-3.5 bg-blue-500 text-white rounded-full text-[8px] font-bold flex items-center justify-center shadow-xs">
                  {todayCount}
                </span>
              )}
            </div>
            <span className="text-[10px] tracking-tight mt-0.5">Today</span>
          </button>

          {/* Tab 4: Wishlist */}
          <button
            type="button"
            id="nav-tab-wishlist"
            onClick={() => onSelectTab('Wishlist')}
            className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-2xl transition-all cursor-pointer ${
              currentTab === 'Wishlist'
                ? 'text-purple-300 font-bold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <div
              className={`p-1.5 rounded-xl transition-all ${
                currentTab === 'Wishlist' ? 'bg-purple-500/20 border border-purple-500/30 text-purple-300 shadow-sm' : ''
              }`}
            >
              <Heart className="w-4 h-4" />
            </div>
            <span className="text-[10px] tracking-tight mt-0.5">Wishlist</span>
          </button>
        </nav>
      </div>
    </div>
  );
};


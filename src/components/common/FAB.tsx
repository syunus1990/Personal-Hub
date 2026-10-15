import React, { useState } from 'react';
import {
  Plus,
  ArrowDownLeft,
  FilePlus,
  CheckSquare,
  Gift,
  HandCoins,
  CreditCard,
  Sparkles,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { triggerHaptic } from '../../utils/haptics';

export const FAB: React.FC = () => {
  const { activeTab, openEditModal, openAIAutoDetect, settings } = useApp();
  const [isOpen, setIsOpen] = useState(false);

  const handleFabClick = () => {
    triggerHaptic('medium', settings.enableHaptics);
    // Toggle quick menu with AI Auto-detect and manual options
    setIsOpen(!isOpen);
  };

  const handleOptionSelect = (type: any) => {
    setIsOpen(false);
    openEditModal(type);
  };

  return (
    <div className="fixed bottom-20 right-4 z-40 max-w-md mx-auto pointer-events-none">
      <div className="pointer-events-auto relative">
        {/* Quick Menu Popover */}
        {isOpen && (
          <>
            <div
              className="fixed inset-0 z-40 bg-black/20 dark:bg-black/40 backdrop-blur-xs"
              onClick={() => setIsOpen(false)}
            />
            <div className="absolute bottom-16 right-0 z-50 w-60 glass-panel rounded-3xl p-2 shadow-2xl border border-white/60 dark:border-white/10 flex flex-col gap-1 animate-in fade-in zoom-in-95 duration-150">
              {/* ✨ AI Smart Auto-Detect Button */}
              <button
                onClick={() => {
                  setIsOpen(false);
                  openAIAutoDetect();
                }}
                className="flex items-center gap-2.5 px-3 py-2.5 rounded-2xl bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-600 hover:from-purple-700 hover:to-indigo-700 text-white text-xs font-bold shadow-md transition-all mb-1 border border-purple-400/30"
              >
                <div className="w-6 h-6 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
                  <Sparkles className="w-3.5 h-3.5 text-white" />
                </div>
                <div className="text-left">
                  <span className="block leading-tight">✨ AI Smart Add</span>
                  <span className="text-[10px] font-normal text-purple-200">
                    Auto-detect plain words
                  </span>
                </div>
              </button>

              <button
                onClick={() => handleOptionSelect('transaction')}
                className="flex items-center gap-2.5 px-3 py-2 rounded-2xl hover:bg-emerald-50 dark:hover:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 text-xs font-medium transition-colors"
              >
                <div className="w-6 h-6 rounded-xl bg-emerald-100 dark:bg-emerald-900/60 flex items-center justify-center shrink-0">
                  <ArrowDownLeft className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                </div>
                <span>New Transaction</span>
              </button>

              <button
                onClick={() => handleOptionSelect('note')}
                className="flex items-center gap-2.5 px-3 py-2 rounded-2xl hover:bg-purple-50 dark:hover:bg-purple-950/40 text-purple-800 dark:text-purple-300 text-xs font-medium transition-colors"
              >
                <div className="w-6 h-6 rounded-xl bg-purple-100 dark:bg-purple-900/60 flex items-center justify-center shrink-0">
                  <FilePlus className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
                </div>
                <span>New Note</span>
              </button>

              <button
                onClick={() => handleOptionSelect('followup')}
                className="flex items-center gap-2.5 px-3 py-2 rounded-2xl hover:bg-rose-50 dark:hover:bg-rose-950/40 text-rose-800 dark:text-rose-300 text-xs font-medium transition-colors"
              >
                <div className="w-6 h-6 rounded-xl bg-rose-100 dark:bg-rose-900/60 flex items-center justify-center shrink-0">
                  <CheckSquare className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
                </div>
                <span>New Follow-up</span>
              </button>

              <button
                onClick={() => handleOptionSelect('wishlist')}
                className="flex items-center gap-2.5 px-3 py-2 rounded-2xl hover:bg-amber-50 dark:hover:bg-amber-950/40 text-amber-800 dark:text-amber-300 text-xs font-medium transition-colors"
              >
                <div className="w-6 h-6 rounded-xl bg-amber-100 dark:bg-amber-900/60 flex items-center justify-center shrink-0">
                  <Gift className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                </div>
                <span>New Wishlist Goal</span>
              </button>

              <button
                onClick={() => handleOptionSelect('loan')}
                className="flex items-center gap-2.5 px-3 py-2 rounded-2xl hover:bg-blue-50 dark:hover:bg-blue-950/40 text-blue-800 dark:text-blue-300 text-xs font-medium transition-colors"
              >
                <div className="w-6 h-6 rounded-xl bg-blue-100 dark:bg-blue-900/60 flex items-center justify-center shrink-0">
                  <HandCoins className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                </div>
                <span>New Loan Record</span>
              </button>
            </div>
          </>
        )}

        {/* Main Floating Trigger Button */}
        <button
          onClick={handleFabClick}
          className={`w-13 h-13 rounded-2xl bg-gradient-to-tr from-indigo-500 via-purple-500 to-pink-500 hover:from-indigo-600 hover:to-pink-600 text-white shadow-xl shadow-purple-500/25 dark:shadow-purple-900/40 flex items-center justify-center transition-all duration-200 active:scale-90 ${
            isOpen ? 'rotate-45' : 'rotate-0'
          }`}
          aria-label="Add item"
        >
          <Plus className="w-6 h-6 stroke-[2.5]" />
        </button>
      </div>
    </div>
  );
};

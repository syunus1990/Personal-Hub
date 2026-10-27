import React from 'react';
import {
  Wallet,
  FileText,
  CheckSquare,
  Gift,
  HandCoins,
  ArrowUpRight,
  ArrowDownLeft,
  ChevronRight,
  Clock,
  Sparkles,
  TrendingUp,
  AlertCircle,
  Plus,
  Eye,
  EyeOff,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { SummaryCard } from '../common/SummaryCard';
import { formatCurrency, formatSecondaryEquivalent } from '../../utils/currency';

export const DashboardView: React.FC = () => {
  const [isAmountsHidden, setIsAmountsHidden] = React.useState<boolean>(() => {
    return localStorage.getItem('phub_hide_amounts') === 'true';
  });

  const toggleHideAmounts = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsAmountsHidden((prev) => {
      const next = !prev;
      localStorage.setItem('phub_hide_amounts', String(next));
      return next;
    });
  };
  const {
    setActiveTab,
    openEditModal,
    openSyncModal,
    openAccountLedger,
    dataVersion,
    gateState,
    settings,
    accounts,
    transactions,
    notes,
    followups,
    wishlists,
    loans,
    totalBalanceSAR,
    totalIncomeSAR,
    totalExpenseSAR,
    netRemainingBalanceSAR,
    toggleCompleteFollowUp,
  } = useApp();

  // Metrics calculations
  const pendingFollowups = followups.filter((f) => !f.isCompleted);
  const todayStr = new Date().toISOString().split('T')[0];
  const dueTodayFollowups = pendingFollowups.filter((f) => f.dueDate === todayStr);

  const totalWishlistTarget = wishlists.reduce((acc, w) => acc + w.estimatedPriceSAR, 0);
  const totalWishlistSaved = wishlists.reduce((acc, w) => acc + w.savedAmountSAR, 0);
  const wishlistProgressPct = totalWishlistTarget > 0 ? Math.round((totalWishlistSaved / totalWishlistTarget) * 100) : 0;

  const totalLentSAR = loans.filter((l) => l.type === 'lent').reduce((acc, l) => acc + (l.amountSAR - l.repaidAmountSAR), 0);
  const totalBorrowedSAR = loans.filter((l) => l.type === 'borrowed').reduce((acc, l) => acc + (l.amountSAR - l.repaidAmountSAR), 0);

  const pinnedNotes = notes.filter((n) => n.isPinned);

  return (
    <div className="space-y-4 pb-24">
      {/* 1. Master Hub Summary Widget */}
      <SummaryCard
        title="Personal Hub Overview"
        badge="Live Financials & Tasks"
        primaryLabel="Total Net Worth / Balance"
        primaryValue={isAmountsHidden ? '••••••' : formatCurrency(totalBalanceSAR, settings.displayCurrency, settings.exchangeRateSARtoINR)}
        primarySubValue={isAmountsHidden ? '•••• SAR' : formatSecondaryEquivalent(totalBalanceSAR, settings.displayCurrency, settings.exchangeRateSARtoINR)}
        actions={
          <button
            onClick={toggleHideAmounts}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:text-purple-600 text-xs font-semibold shadow-2xs transition-colors"
            title={isAmountsHidden ? 'Show amounts' : 'Hide amounts (Privacy Mode)'}
            aria-label="Toggle amount visibility"
          >
            {isAmountsHidden ? <EyeOff className="w-3.5 h-3.5 text-purple-600" /> : <Eye className="w-3.5 h-3.5 text-slate-500" />}
            <span className="text-[11px]">{isAmountsHidden ? 'Hidden' : 'Visible'}</span>
          </button>
        }
        metrics={[
          {
            label: 'Monthly Income',
            value: isAmountsHidden ? '••••' : formatCurrency(totalIncomeSAR, settings.displayCurrency, settings.exchangeRateSARtoINR),
            accentClass: 'text-emerald-600 dark:text-emerald-400',
          },
          {
            label: 'Total Expenses',
            value: isAmountsHidden ? '••••' : formatCurrency(totalExpenseSAR, settings.displayCurrency, settings.exchangeRateSARtoINR),
            accentClass: 'text-rose-600 dark:text-rose-400',
          },
          {
            label: 'Net Remaining',
            value: isAmountsHidden ? '••••' : formatCurrency(netRemainingBalanceSAR, settings.displayCurrency, settings.exchangeRateSARtoINR),
            accentClass: netRemainingBalanceSAR >= 0 ? 'text-indigo-600 dark:text-indigo-400' : 'text-rose-600 dark:text-rose-400',
          },
        ]}
        gradientFrom="from-purple-500/10"
        gradientTo="to-indigo-500/10"
      />

      {/* Quick Action Ribbon */}
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
        <button
          onClick={() => openEditModal('transaction')}
          className="flex items-center gap-1.5 px-3 py-2 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 text-xs font-semibold shrink-0 hover:bg-emerald-100 transition-colors border border-emerald-200/60 dark:border-emerald-800/40"
        >
          <Plus className="w-3.5 h-3.5 text-emerald-600" />
          <span>Add Transaction</span>
        </button>
        <button
          onClick={() => openEditModal('note')}
          className="flex items-center gap-1.5 px-3 py-2 rounded-2xl bg-purple-50 dark:bg-purple-950/40 text-purple-800 dark:text-purple-300 text-xs font-semibold shrink-0 hover:bg-purple-100 transition-colors border border-purple-200/60 dark:border-purple-800/40"
        >
          <Plus className="w-3.5 h-3.5 text-purple-600" />
          <span>New Note</span>
        </button>
        <button
          onClick={() => openEditModal('followup')}
          className="flex items-center gap-1.5 px-3 py-2 rounded-2xl bg-rose-50 dark:bg-rose-950/40 text-rose-800 dark:text-rose-300 text-xs font-semibold shrink-0 hover:bg-rose-100 transition-colors border border-rose-200/60 dark:border-rose-800/40"
        >
          <Plus className="w-3.5 h-3.5 text-rose-600" />
          <span>Add Follow-up</span>
        </button>
        <button
          onClick={() => openEditModal('wishlist')}
          className="flex items-center gap-1.5 px-3 py-2 rounded-2xl bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 text-xs font-semibold shrink-0 hover:bg-amber-100 transition-colors border border-amber-200/60 dark:border-amber-800/40"
        >
          <Plus className="w-3.5 h-3.5 text-amber-600" />
          <span>New Wishlist</span>
        </button>
      </div>

      {/* 2. Module Cards Grid / Stack */}

      {/* Card 1: Money Module */}
      <div
        onClick={() => setActiveTab('money')}
        className="glass-card rounded-3xl p-4 cursor-pointer hover:border-emerald-400/80 transition-all duration-200 group border border-slate-200/80 dark:border-slate-800/80"
      >
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shadow-xs">
              <Wallet className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                Money & Accounts
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                {accounts.length} Accounts · {transactions.length} Transactions
              </p>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
        </div>

        {/* Account balance preview chips */}
        <div className="grid grid-cols-2 gap-2 mt-2">
          {accounts.slice(0, 2).map((acc) => (
            <div
              key={acc.id}
              onClick={(e) => {
                e.stopPropagation();
                openAccountLedger(acc.id);
              }}
              className="p-2.5 rounded-2xl bg-slate-50 hover:bg-slate-100 dark:bg-slate-800/60 dark:hover:bg-slate-800 border border-slate-200/90 dark:border-slate-800 cursor-pointer transition-all group/acc shadow-2xs"
              title={`View ${acc.name} in/out transactions`}
            >
              <div className="flex items-center justify-between gap-1.5">
                <div className="flex items-center gap-1.5 min-w-0">
                  <span
                    className="w-2.5 h-2.5 rounded-full shrink-0 shadow-xs"
                    style={{ backgroundColor: acc.color }}
                  />
                  <span className="text-[11px] font-bold text-slate-800 dark:text-slate-200 truncate group-hover/acc:text-purple-600 transition-colors">
                    {acc.name}
                  </span>
                </div>
                <span className="text-[9px] font-bold text-purple-600 dark:text-purple-400 shrink-0">
                  Ledger ›
                </span>
              </div>
              <p className="text-xs font-bold text-slate-900 dark:text-slate-100 mt-1 tabular-nums">
                {isAmountsHidden ? '••••••' : formatCurrency(acc.currentBalanceSAR, settings.displayCurrency, settings.exchangeRateSARtoINR)}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Card 2: Follow-ups / Tasks Module */}
      <div
        onClick={() => setActiveTab('followups')}
        className="glass-card rounded-3xl p-4 cursor-pointer hover:border-rose-400/80 transition-all duration-200 group border border-slate-200/80 dark:border-slate-800/80"
      >
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center shadow-xs">
              <CheckSquare className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 group-hover:text-rose-600 dark:group-hover:text-rose-400 transition-colors">
                Follow-ups & Tasks
              </h3>
              <p className="text-[11px] text-slate-600 dark:text-slate-400 font-medium">
                {pendingFollowups.length} pending · {dueTodayFollowups.length} due today
              </p>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
        </div>

        {/* Task list preview */}
        <div className="mt-2.5 space-y-1.5">
          {pendingFollowups.slice(0, 2).map((fu) => {
            const isToday = fu.dueDate === todayStr;
            const isOverdue = fu.dueDate < todayStr;
            const isUpcoming = fu.dueDate > todayStr;

            return (
              <div
                key={fu.id}
                onClick={(e) => {
                  e.stopPropagation();
                  toggleCompleteFollowUp(fu.id);
                }}
                className="flex items-center gap-2.5 p-2 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-800 text-xs"
              >
                <div
                  className={`w-4 h-4 rounded-md border flex items-center justify-center transition-colors ${
                    fu.isCompleted
                      ? 'bg-rose-500 border-rose-500 text-white'
                      : 'border-slate-300 dark:border-slate-600 hover:border-rose-400'
                  }`}
                >
                  {fu.isCompleted && <span className="text-[9px]">✓</span>}
                </div>
                <span className="flex-1 font-semibold text-slate-800 dark:text-slate-200 truncate">
                  {fu.title}
                </span>
                <span
                  className={`text-[10px] font-bold shrink-0 tabular-nums px-1.5 py-0.5 rounded-md border ${
                    isOverdue
                      ? 'text-rose-700 bg-rose-50 border-rose-200 dark:text-rose-300 dark:bg-rose-950/60 dark:border-rose-800/60'
                      : isToday
                      ? 'text-amber-700 bg-amber-50 border-amber-200 dark:text-amber-300 dark:bg-amber-950/60 dark:border-amber-800/60'
                      : isUpcoming
                      ? 'text-blue-700 bg-blue-50 border-blue-200 dark:text-blue-300 dark:bg-blue-950/60 dark:border-blue-800/60'
                      : 'text-slate-700 bg-slate-100 border-slate-200 dark:text-slate-300 dark:bg-slate-800 dark:border-slate-700'
                  }`}
                >
                  {isToday ? 'Today' : fu.dueDate}
                </span>
              </div>
            );
          })}
          {pendingFollowups.length === 0 && (
            <p className="text-xs text-slate-500 dark:text-slate-400 italic py-1 text-center font-medium">
              All caught up! No pending follow-ups.
            </p>
          )}
        </div>
      </div>

      {/* Card 3: Notes Module */}
      <div
        onClick={() => setActiveTab('notes')}
        className="glass-card rounded-3xl p-4 cursor-pointer hover:border-purple-400/80 transition-all duration-200 group border border-slate-200/80 dark:border-slate-800/80"
      >
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-purple-100 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center shadow-xs">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
                Notes & Ideas
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                {notes.length} total notes · {pinnedNotes.length} pinned
              </p>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
        </div>

        {/* Note snippet preview */}
        {notes.length > 0 && (
          <div className="mt-2 p-3 rounded-2xl bg-purple-50/70 dark:bg-purple-950/30 border border-purple-200/70 dark:border-purple-900/40">
            <p className="text-xs font-bold text-purple-900 dark:text-purple-200 truncate">
              {notes[0].title}
            </p>
            <p className="text-[11px] text-purple-800/80 dark:text-purple-300/80 line-clamp-2 mt-0.5 font-medium">
              {notes[0].content}
            </p>
          </div>
        )}
      </div>

      {/* 2-Column Split: Wishlists & Loans */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {/* Wishlists Module Card */}
        <div
          onClick={() => setActiveTab('wishlists')}
          className="glass-card rounded-3xl p-4 cursor-pointer hover:border-amber-400/80 transition-all duration-200 group border border-slate-200/80 dark:border-slate-800/80"
        >
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-2xl bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center shadow-xs">
                <Gift className="w-4 h-4" />
              </div>
              <h3 className="text-xs font-bold text-slate-900 dark:text-slate-100 group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
                Wishlists
              </h3>
            </div>
            <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400">
              {wishlistProgressPct}% funded
            </span>
          </div>

          <div className="mt-2">
            <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200/50 dark:border-slate-700/50 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-amber-400 to-amber-500 rounded-full transition-all duration-500"
                style={{ width: `${Math.min(100, wishlistProgressPct)}%` }}
              />
            </div>
            <div className="flex items-center justify-between text-[11px] text-slate-600 dark:text-slate-400 mt-2 font-medium">
              <span className="tabular-nums">
                Saved: {formatCurrency(totalWishlistSaved, settings.displayCurrency, settings.exchangeRateSARtoINR, false)}
              </span>
              <span className="tabular-nums">
                Target: {formatCurrency(totalWishlistTarget, settings.displayCurrency, settings.exchangeRateSARtoINR, false)}
              </span>
            </div>
          </div>
        </div>

        {/* Loans Module Card */}
        <div
          onClick={() => setActiveTab('loans')}
          className="glass-card rounded-3xl p-4 cursor-pointer hover:border-blue-400/80 transition-all duration-200 group border border-slate-200/80 dark:border-slate-800/80"
        >
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-2xl bg-blue-100 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center shadow-xs">
                <HandCoins className="w-4 h-4" />
              </div>
              <h3 className="text-xs font-bold text-slate-900 dark:text-slate-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                Loans & Dues
              </h3>
            </div>
            <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400">
              {loans.length} active
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2 mt-2 pt-1 border-t border-slate-200/70 dark:border-slate-800 text-[11px]">
            <div>
              <span className="text-slate-500 dark:text-slate-400 block text-[10px] font-semibold">I Lent (Receivable)</span>
              <span className="font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">
                {formatCurrency(totalLentSAR, settings.displayCurrency, settings.exchangeRateSARtoINR, false)}
              </span>
            </div>
            <div>
              <span className="text-slate-500 dark:text-slate-400 block text-[10px] font-semibold">I Borrowed</span>
              <span className="font-bold text-rose-600 dark:text-rose-400 tabular-nums">
                {formatCurrency(totalBorrowedSAR, settings.displayCurrency, settings.exchangeRateSARtoINR, false)}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

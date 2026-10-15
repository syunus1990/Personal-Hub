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
  Camera,
  QrCode,
  ScanLine,
  Wifi,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { SummaryCard } from '../common/SummaryCard';
import { formatCurrency, formatSecondaryEquivalent } from '../../utils/currency';

export const DashboardView: React.FC = () => {
  const {
    setActiveTab,
    openEditModal,
    openSyncModal,
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
      {/* Quick QR Sync & Scanner Widget */}
      <div className="p-3 rounded-2xl bg-gradient-to-r from-purple-500/10 via-indigo-500/5 to-purple-500/10 border border-purple-200/60 dark:border-purple-800/40 flex items-center justify-between gap-2 shadow-xs">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-8 h-8 rounded-xl bg-purple-600 text-white flex items-center justify-center shrink-0">
            <Wifi className="w-4 h-4" />
          </div>
          <div className="truncate">
            <h3 className="text-xs font-bold text-slate-800 dark:text-slate-100 truncate">
              Local Wi-Fi QR Sync
            </h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
              {dataVersion ? `Synced (${dataVersion.slice(0, 8)})` : 'Connect Mobile & Laptop'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <button
            onClick={() => openSyncModal('scanner')}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold shadow-xs transition-colors"
            title="Open Mobile Scanner"
          >
            <Camera className="w-3.5 h-3.5" />
            <span>Scan PC</span>
          </button>
          <button
            onClick={() => openSyncModal('pc')}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold transition-colors"
            title="Show QR Code on Laptop"
          >
            <QrCode className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Show QR</span>
          </button>
        </div>
      </div>

      {/* 1. Master Hub Summary Widget */}
      <SummaryCard
        title="Personal Hub Overview"
        badge="Live Financials & Tasks"
        primaryLabel="Total Net Worth / Balance"
        primaryValue={formatCurrency(totalBalanceSAR, settings.displayCurrency, settings.exchangeRateSARtoINR)}
        primarySubValue={formatSecondaryEquivalent(totalBalanceSAR, settings.displayCurrency, settings.exchangeRateSARtoINR)}
        metrics={[
          {
            label: 'Monthly Income',
            value: formatCurrency(totalIncomeSAR, settings.displayCurrency, settings.exchangeRateSARtoINR),
            accentClass: 'text-emerald-600 dark:text-emerald-400',
          },
          {
            label: 'Total Expenses',
            value: formatCurrency(totalExpenseSAR, settings.displayCurrency, settings.exchangeRateSARtoINR),
            accentClass: 'text-rose-600 dark:text-rose-400',
          },
          {
            label: 'Net Remaining',
            value: formatCurrency(netRemainingBalanceSAR, settings.displayCurrency, settings.exchangeRateSARtoINR),
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
          className="flex items-center gap-1.5 px-3 py-2 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 text-xs font-semibold shrink-0 hover:bg-emerald-100 transition-colors"
        >
          <Plus className="w-3.5 h-3.5 text-emerald-600" />
          <span>Add Transaction</span>
        </button>
        <button
          onClick={() => openEditModal('note')}
          className="flex items-center gap-1.5 px-3 py-2 rounded-2xl bg-purple-50 dark:bg-purple-950/40 text-purple-800 dark:text-purple-300 text-xs font-semibold shrink-0 hover:bg-purple-100 transition-colors"
        >
          <Plus className="w-3.5 h-3.5 text-purple-600" />
          <span>New Note</span>
        </button>
        <button
          onClick={() => openEditModal('followup')}
          className="flex items-center gap-1.5 px-3 py-2 rounded-2xl bg-rose-50 dark:bg-rose-950/40 text-rose-800 dark:text-rose-300 text-xs font-semibold shrink-0 hover:bg-rose-100 transition-colors"
        >
          <Plus className="w-3.5 h-3.5 text-rose-600" />
          <span>Add Follow-up</span>
        </button>
        <button
          onClick={() => openEditModal('wishlist')}
          className="flex items-center gap-1.5 px-3 py-2 rounded-2xl bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 text-xs font-semibold shrink-0 hover:bg-amber-100 transition-colors"
        >
          <Plus className="w-3.5 h-3.5 text-amber-600" />
          <span>New Wishlist</span>
        </button>
      </div>

      {/* 2. Module Cards Grid / Stack (Listok widget style) */}

      {/* Card 1: Money Module */}
      <div
        onClick={() => setActiveTab('money')}
        className="glass-card rounded-3xl p-4 cursor-pointer hover:border-emerald-300/60 dark:hover:border-emerald-700/60 transition-all duration-200 group"
      >
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <Wallet className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-100 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                Money & Accounts
              </h3>
              <p className="text-[11px] text-slate-400">
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
              className="p-2.5 rounded-2xl bg-slate-50/80 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800"
            >
              <div className="flex items-center gap-1.5">
                <span
                  className="w-2 h-2 rounded-full shrink-0"
                  style={{ backgroundColor: acc.color }}
                />
                <span className="text-[11px] font-medium text-slate-600 dark:text-slate-300 truncate">
                  {acc.name}
                </span>
              </div>
              <p className="text-xs font-bold text-slate-800 dark:text-slate-100 mt-1 tabular-nums">
                {formatCurrency(acc.currentBalanceSAR, settings.displayCurrency, settings.exchangeRateSARtoINR)}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Card 2: Follow-ups / Tasks Module */}
      <div
        onClick={() => setActiveTab('followups')}
        className="glass-card rounded-3xl p-4 cursor-pointer hover:border-rose-300/60 dark:hover:border-rose-700/60 transition-all duration-200 group"
      >
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center">
              <CheckSquare className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-100 group-hover:text-rose-600 dark:group-hover:text-rose-400 transition-colors">
                Follow-ups & Tasks
              </h3>
              <p className="text-[11px] text-slate-400">
                {pendingFollowups.length} pending · {dueTodayFollowups.length} due today
              </p>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
        </div>

        {/* Task list preview */}
        <div className="mt-2.5 space-y-1.5">
          {pendingFollowups.slice(0, 2).map((fu) => (
            <div
              key={fu.id}
              onClick={(e) => {
                e.stopPropagation();
                toggleCompleteFollowUp(fu.id);
              }}
              className="flex items-center gap-2.5 p-2 rounded-2xl bg-slate-50/80 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 text-xs"
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
              <span className="flex-1 font-medium text-slate-700 dark:text-slate-200 truncate">
                {fu.title}
              </span>
              <span className="text-[10px] text-slate-400 shrink-0 tabular-nums">
                {fu.dueDate === todayStr ? 'Today' : fu.dueDate}
              </span>
            </div>
          ))}
          {pendingFollowups.length === 0 && (
            <p className="text-xs text-slate-400 italic py-1 text-center">
              All caught up! No pending follow-ups.
            </p>
          )}
        </div>
      </div>

      {/* Card 3: Notes Module */}
      <div
        onClick={() => setActiveTab('notes')}
        className="glass-card rounded-3xl p-4 cursor-pointer hover:border-purple-300/60 dark:hover:border-purple-700/60 transition-all duration-200 group"
      >
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-purple-100 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-100 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
                Notes & Ideas
              </h3>
              <p className="text-[11px] text-slate-400">
                {notes.length} total notes · {pinnedNotes.length} pinned
              </p>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
        </div>

        {/* Note snippet preview */}
        {notes.length > 0 && (
          <div className="mt-2 p-3 rounded-2xl bg-purple-50/60 dark:bg-purple-950/30 border border-purple-100/80 dark:border-purple-900/40">
            <p className="text-xs font-semibold text-purple-900 dark:text-purple-200 truncate">
              {notes[0].title}
            </p>
            <p className="text-[11px] text-purple-700/80 dark:text-purple-300/80 line-clamp-2 mt-0.5">
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
          className="glass-card rounded-3xl p-4 cursor-pointer hover:border-amber-300/60 dark:hover:border-amber-700/60 transition-all duration-200 group"
        >
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-2xl bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                <Gift className="w-4 h-4" />
              </div>
              <h3 className="text-xs font-semibold text-slate-800 dark:text-slate-100 group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
                Wishlists
              </h3>
            </div>
            <span className="text-[10px] font-semibold text-amber-600 dark:text-amber-400">
              {wishlistProgressPct}% funded
            </span>
          </div>

          <div className="mt-2">
            <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-amber-400 to-amber-500 rounded-full transition-all duration-500"
                style={{ width: `${Math.min(100, wishlistProgressPct)}%` }}
              />
            </div>
            <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 mt-2">
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
          className="glass-card rounded-3xl p-4 cursor-pointer hover:border-blue-300/60 dark:hover:border-blue-700/60 transition-all duration-200 group"
        >
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-2xl bg-blue-100 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                <HandCoins className="w-4 h-4" />
              </div>
              <h3 className="text-xs font-semibold text-slate-800 dark:text-slate-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                Loans & Dues
              </h3>
            </div>
            <span className="text-[10px] font-semibold text-blue-600 dark:text-blue-400">
              {loans.length} active
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2 mt-2 pt-1 border-t border-slate-100 dark:border-slate-800 text-[11px]">
            <div>
              <span className="text-slate-400 block text-[10px]">I Lent (Receivable)</span>
              <span className="font-semibold text-emerald-600 dark:text-emerald-400 tabular-nums">
                {formatCurrency(totalLentSAR, settings.displayCurrency, settings.exchangeRateSARtoINR, false)}
              </span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px]">I Borrowed</span>
              <span className="font-semibold text-rose-600 dark:text-rose-400 tabular-nums">
                {formatCurrency(totalBorrowedSAR, settings.displayCurrency, settings.exchangeRateSARtoINR, false)}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

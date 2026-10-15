import React, { useState } from 'react';
import {
  Gift,
  Plus,
  PiggyBank,
  CheckCircle2,
  ExternalLink,
  Trash2,
  Edit2,
  Calendar,
  Sparkles,
  TrendingUp,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { SummaryCard } from '../common/SummaryCard';
import { ChecklistSection } from '../common/ChecklistSection';
import { formatCurrency, formatSecondaryEquivalent } from '../../utils/currency';
import { WishlistItem, Priority } from '../../types';

export const WishlistsView: React.FC = () => {
  const {
    wishlists,
    accounts,
    settings,
    openEditModal,
    openAIItemModal,
    deleteWishlistItem,
    addSavingsToWishlist,
    addTransaction,
    updateWishlistItem,
    toggleWishlistChecklistItem,
    addWishlistChecklistItem,
    updateWishlistChecklistItem,
    deleteWishlistChecklistItem,
    searchQuery,
  } = useApp();

  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'purchased'>('active');

  const totalTargetSAR = wishlists.reduce((acc, w) => acc + w.estimatedPriceSAR, 0);
  const totalSavedSAR = wishlists.reduce((acc, w) => acc + w.savedAmountSAR, 0);
  const overallProgressPct = totalTargetSAR > 0 ? Math.round((totalSavedSAR / totalTargetSAR) * 100) : 0;

  const filteredWishlists = wishlists.filter((w) => {
    if (filterStatus === 'active' && w.isPurchased) return false;
    if (filterStatus === 'purchased' && !w.isPurchased) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        w.title.toLowerCase().includes(q) ||
        w.category.toLowerCase().includes(q) ||
        (w.notes && w.notes.toLowerCase().includes(q))
      );
    }
    return true;
  });

  const getPriorityBadge = (p: Priority) => {
    switch (p) {
      case 'high':
        return 'bg-rose-50 text-rose-700 dark:bg-rose-950/50 dark:text-rose-300 border-rose-200 dark:border-rose-900';
      case 'medium':
        return 'bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300 border-amber-200 dark:border-amber-900';
      case 'low':
      default:
        return 'bg-sky-50 text-sky-700 dark:bg-sky-950/50 dark:text-sky-300 border-sky-200 dark:border-sky-900';
    }
  };

  return (
    <div className="space-y-4 pb-24">
      {/* 1. Summary Card */}
      <SummaryCard
        title="Wishlists & Savings Goals"
        badge="Progressive Funding"
        primaryLabel="Total Saved Towards Goals"
        primaryValue={formatCurrency(totalSavedSAR, settings.displayCurrency, settings.exchangeRateSARtoINR)}
        primarySubValue={formatSecondaryEquivalent(totalSavedSAR, settings.displayCurrency, settings.exchangeRateSARtoINR)}
        metrics={[
          {
            label: 'Total Target',
            value: formatCurrency(totalTargetSAR, settings.displayCurrency, settings.exchangeRateSARtoINR),
            accentClass: 'text-slate-700 dark:text-slate-300',
          },
          {
            label: 'Funding Progress',
            value: `${overallProgressPct}%`,
            accentClass: 'text-amber-600 dark:text-amber-400',
          },
          {
            label: 'Items Saved',
            value: `${wishlists.filter((w) => w.isPurchased).length} / ${wishlists.length}`,
            accentClass: 'text-emerald-600 dark:text-emerald-400',
          },
        ]}
        gradientFrom="from-amber-500/10"
        gradientTo="to-orange-500/10"
      />

      {/* Filter Tabs & Add Button */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-slate-200/50 dark:bg-slate-800/60 text-xs font-medium">
          <button
            onClick={() => setFilterStatus('active')}
            className={`py-1 px-3 rounded-xl transition-all ${
              filterStatus === 'active'
                ? 'bg-amber-500 text-white shadow-xs font-semibold'
                : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            In Progress ({wishlists.filter((w) => !w.isPurchased).length})
          </button>
          <button
            onClick={() => setFilterStatus('purchased')}
            className={`py-1 px-3 rounded-xl transition-all ${
              filterStatus === 'purchased'
                ? 'bg-emerald-600 text-white shadow-xs font-semibold'
                : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            Acquired ({wishlists.filter((w) => w.isPurchased).length})
          </button>
          <button
            onClick={() => setFilterStatus('all')}
            className={`py-1 px-3 rounded-xl transition-all ${
              filterStatus === 'all'
                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs font-semibold'
                : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            All
          </button>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <button
            onClick={() => openAIItemModal('wishlist')}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/60 dark:hover:bg-amber-900/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800 text-xs font-semibold shadow-2xs transition-colors"
            title="AI Quick Add Wishlist (Rephrase & Clean with preview)"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
            <span>AI Add</span>
          </button>

          <button
            onClick={() => openEditModal('wishlist')}
            className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-semibold shadow-xs shrink-0 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Wishlist</span>
          </button>
        </div>
      </div>

      {/* Wishlist Cards */}
      <div className="space-y-3">
        {filteredWishlists.map((item) => {
          const progressPct =
            item.estimatedPriceSAR > 0
              ? Math.min(100, Math.round((item.savedAmountSAR / item.estimatedPriceSAR) * 100))
              : 100;
          const remainingSAR = Math.max(0, item.estimatedPriceSAR - item.savedAmountSAR);

          return (
            <div
              key={item.id}
              className="glass-card rounded-3xl p-4 border border-slate-200/60 dark:border-slate-800/80 hover:border-amber-300 transition-colors"
            >
              {/* Header */}
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span
                      className={`text-[10px] font-semibold uppercase px-2 py-0.5 rounded-md border ${getPriorityBadge(
                        item.priority
                      )}`}
                    >
                      {item.priority}
                    </span>
                    <span className="text-[10px] text-slate-400">{item.category}</span>
                    {item.isPurchased && (
                      <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                        · Acquired
                      </span>
                    )}
                  </div>

                  <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 truncate">
                    {item.title}
                  </h3>

                  {item.notes && (
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">
                      {item.notes}
                    </p>
                  )}

                  {/* Checklist & Purchase Milestones */}
                  <ChecklistSection
                    items={item.checklist || []}
                    title="Sub-tasks & Milestones"
                    accentColor="amber"
                    onToggle={(subId) => toggleWishlistChecklistItem(item.id, subId)}
                    onAdd={(text) => addWishlistChecklistItem(item.id, text)}
                    onUpdate={(subId, text) => updateWishlistChecklistItem(item.id, subId, text)}
                    onDelete={(subId) => deleteWishlistChecklistItem(item.id, subId)}
                    allowAdd={true}
                  />
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  {item.productUrl && (
                    <a
                      href={item.productUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                      title="Open product link"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  )}
                  <button
                    onClick={() => openAIItemModal('wishlist', item)}
                    className="w-7 h-7 rounded-lg flex items-center justify-center text-amber-500 hover:text-amber-700 hover:bg-amber-50 dark:hover:bg-amber-950/60 transition-colors"
                    title="Improve & rephrase with AI"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => openEditModal('wishlist', item.id, item)}
                    className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                    title="Edit item"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => deleteWishlistItem(item.id)}
                    className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-400 hover:text-rose-500"
                    title="Delete item"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Progress & Financials */}
              <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800/80">
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <span className="text-slate-600 dark:text-slate-300">
                    Saved:{' '}
                    <strong className="text-slate-900 dark:text-white tabular-nums">
                      {formatCurrency(item.savedAmountSAR, settings.displayCurrency, settings.exchangeRateSARtoINR)}
                    </strong>
                  </span>
                  <span className="text-slate-400 text-[11px] tabular-nums">
                    Target: {formatCurrency(item.estimatedPriceSAR, settings.displayCurrency, settings.exchangeRateSARtoINR)}
                  </span>
                </div>

                <div className="w-full h-2.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-300 ${
                      item.isPurchased || progressPct >= 100
                        ? 'bg-emerald-500'
                        : 'bg-gradient-to-r from-amber-400 to-amber-500'
                    }`}
                    style={{ width: `${progressPct}%` }}
                  />
                </div>

                <div className="flex items-center justify-between text-[11px] text-slate-400 mt-2">
                  <div className="flex items-center gap-1">
                    {item.targetDate && (
                      <>
                        <Calendar className="w-3 h-3" />
                        <span>Target: {item.targetDate}</span>
                      </>
                    )}
                  </div>
                  <span className="font-semibold text-amber-600 dark:text-amber-400 tabular-nums">
                    {progressPct}% Funded
                  </span>
                </div>

                {/* Actions: Convert to Expense & Add Savings */}
                {!item.isPurchased ? (
                  <div className="mt-3 pt-2 flex items-center justify-between gap-2 flex-wrap">
                    <span className="text-[11px] text-slate-500">
                      Need {formatCurrency(remainingSAR, settings.displayCurrency, settings.exchangeRateSARtoINR, false)} more
                    </span>
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => {
                          const targetAcc = accounts[0];
                          addTransaction({
                            type: 'expense',
                            amountSAR: item.estimatedPriceSAR,
                            note: `Wishlist: ${item.title}`,
                            accountId: targetAcc?.id || '',
                            category: item.category || 'Shopping',
                            date: new Date().toISOString().split('T')[0],
                          });
                          updateWishlistItem(item.id, {
                            isPurchased: true,
                            savedAmountSAR: item.estimatedPriceSAR,
                          });
                        }}
                        className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 text-xs font-semibold transition-colors"
                        title="Mark purchased and record as expense"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Convert to Expense</span>
                      </button>
                      <button
                        onClick={() =>
                          openEditModal('wishlist', item.id, {
                            isAddSavingsOnly: true,
                            itemId: item.id,
                            itemTitle: item.title,
                            remaining: remainingSAR,
                          })
                        }
                        className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 text-xs font-semibold transition-colors"
                      >
                        <PiggyBank className="w-3.5 h-3.5" />
                        <span>+ Add Savings</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="mt-3 pt-2 flex items-center justify-between text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                    <span className="flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Acquired & Tracked in Expenses
                    </span>
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {filteredWishlists.length === 0 && (
          <div className="text-center py-10 glass-card rounded-3xl text-slate-400 text-xs">
            No wishlist items found. Tap New Wishlist to set up your dream goals!
          </div>
        )}
      </div>
    </div>
  );
};

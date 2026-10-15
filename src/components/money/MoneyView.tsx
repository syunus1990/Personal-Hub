import React, { useState } from 'react';
import {
  Wallet,
  Plus,
  ArrowRightLeft,
  Building2,
  Banknote,
  PiggyBank,
  CreditCard,
  Trash2,
  Edit2,
  Calendar,
  ChevronRight,
  ArrowLeft,
  TrendingUp,
  TrendingDown,
  PieChart,
  Sparkles,
  Filter,
  Layers,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { SummaryCard } from '../common/SummaryCard';
import { formatCurrency, formatSecondaryEquivalent } from '../../utils/currency';
import { LoansView } from '../loans/LoansView';
import { CategorySymbol, TransactionTypeSymbol, CurrencyBadge } from '../common/CustomSymbol';

export const MoneyView: React.FC = () => {
  const {
    accounts,
    transactions,
    categories,
    settings,
    totalBalanceSAR,
    totalIncomeSAR,
    totalExpenseSAR,
    netRemainingBalanceSAR,
    openEditModal,
    openAIBulkExpenses,
    deleteTransaction,
    deleteAccount,
    searchQuery,
  } = useApp();

  const [activeSubTab, setActiveSubTab] = useState<'summary' | 'transactions' | 'accounts' | 'loans'>('summary');
  const [txTypeFilter, setTxTypeFilter] = useState<'all' | 'income' | 'expense' | 'transfer'>('all');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedSubCategoryFilter, setSelectedSubCategoryFilter] = useState<string>('all');

  const totalOpeningBalanceSAR = accounts.reduce((acc, a) => acc + a.openingBalanceSAR, 0);

  // Filter transactions for Transactions tab
  const filteredTransactions = transactions.filter((tx) => {
    if (txTypeFilter !== 'all' && tx.type !== txTypeFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchCat = tx.category.toLowerCase().includes(q);
      const matchSub = (tx.subCategory || '').toLowerCase().includes(q);
      const matchNote = tx.note.toLowerCase().includes(q);
      const acc = accounts.find((a) => a.id === tx.accountId);
      const matchAcc = acc?.name.toLowerCase().includes(q);
      return matchCat || matchSub || matchNote || matchAcc;
    }
    return true;
  });

  // Category breakdown calculation for Summary
  const categoryStats = React.useMemo(() => {
    const expenseTx = transactions.filter((t) => t.type === 'expense');
    const totalExp = expenseTx.reduce((sum, t) => sum + t.amountSAR, 0);

    const map = new Map<
      string,
      {
        name: string;
        totalSAR: number;
        count: number;
        subCategories: Map<string, number>;
      }
    >();

    // Initialize with known categories
    categories.forEach((cat) => {
      map.set(cat.name, {
        name: cat.name,
        totalSAR: 0,
        count: 0,
        subCategories: new Map(),
      });
    });

    // Aggregate transactions
    expenseTx.forEach((tx) => {
      const catName = tx.category || 'Other';
      if (!map.has(catName)) {
        map.set(catName, {
          name: catName,
          totalSAR: 0,
          count: 0,
          subCategories: new Map(),
        });
      }

      const entry = map.get(catName)!;
      entry.totalSAR += tx.amountSAR;
      entry.count += 1;

      if (tx.subCategory) {
        const currentSub = entry.subCategories.get(tx.subCategory) || 0;
        entry.subCategories.set(tx.subCategory, currentSub + tx.amountSAR);
      }
    });

    return Array.from(map.values())
      .map((entry) => ({
        ...entry,
        percentage: totalExp > 0 ? (entry.totalSAR / totalExp) * 100 : 0,
      }))
      .sort((a, b) => b.totalSAR - a.totalSAR);
  }, [transactions, categories]);

  // Expenses strictly for the currently clicked category drilldown
  const categoryExpenses = React.useMemo(() => {
    if (!selectedCategory) return [];
    return transactions.filter((tx) => {
      if (tx.type !== 'expense') return false;
      if (tx.category.toLowerCase() !== selectedCategory.toLowerCase()) return false;
      if (selectedSubCategoryFilter !== 'all') {
        return (tx.subCategory || '').toLowerCase() === selectedSubCategoryFilter.toLowerCase();
      }
      return true;
    });
  }, [transactions, selectedCategory, selectedSubCategoryFilter]);

  const selectedCategoryObj = categories.find(
    (c) => c.name.toLowerCase() === (selectedCategory || '').toLowerCase()
  );

  const getAccountIcon = (type: string) => {
    switch (type) {
      case 'bank':
        return Building2;
      case 'cash':
        return Banknote;
      case 'savings':
        return PiggyBank;
      case 'credit_card':
        return CreditCard;
      default:
        return Wallet;
    }
  };

  return (
    <div className="space-y-4 pb-24">
      {/* 1. Money Top Summary Card */}
      <SummaryCard
        title="Money & Financial Balance"
        badge="Opening · Updated · Remaining"
        primaryLabel="Total Current Balance"
        primaryValue={formatCurrency(totalBalanceSAR, settings.displayCurrency, settings.exchangeRateSARtoINR)}
        primarySubValue={formatSecondaryEquivalent(totalBalanceSAR, settings.displayCurrency, settings.exchangeRateSARtoINR)}
        metrics={[
          {
            label: 'Opening Balance',
            value: formatCurrency(totalOpeningBalanceSAR, settings.displayCurrency, settings.exchangeRateSARtoINR),
            accentClass: 'text-slate-600 dark:text-slate-300',
          },
          {
            label: 'Total Inflow',
            value: `+${formatCurrency(totalIncomeSAR, settings.displayCurrency, settings.exchangeRateSARtoINR, false)}`,
            accentClass: 'text-emerald-600 dark:text-emerald-400',
          },
          {
            label: 'Total Outflow',
            value: `-${formatCurrency(totalExpenseSAR, settings.displayCurrency, settings.exchangeRateSARtoINR, false)}`,
            accentClass: 'text-rose-600 dark:text-rose-400',
          },
          {
            label: 'Remaining Balance',
            value: formatCurrency(netRemainingBalanceSAR, settings.displayCurrency, settings.exchangeRateSARtoINR),
            accentClass: netRemainingBalanceSAR >= 0 ? 'text-indigo-600 dark:text-indigo-400' : 'text-rose-600 dark:text-rose-400',
          },
        ]}
        gradientFrom="from-emerald-500/10"
        gradientTo="to-teal-500/10"
      />

      {/* Sub-tab segment switch (Summary, Transactions, Accounts, Loans) */}
      <div className="flex items-center p-1 rounded-2xl bg-slate-200/50 dark:bg-slate-800/60 text-xs font-medium">
        <button
          onClick={() => {
            setActiveSubTab('summary');
            setSelectedCategory(null);
          }}
          className={`flex-1 py-1.5 px-2 rounded-xl transition-all ${
            activeSubTab === 'summary'
              ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs font-semibold'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
          }`}
        >
          Summary
        </button>
        <button
          onClick={() => setActiveSubTab('transactions')}
          className={`flex-1 py-1.5 px-2 rounded-xl transition-all ${
            activeSubTab === 'transactions'
              ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs font-semibold'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
          }`}
        >
          Transactions
        </button>
        <button
          onClick={() => setActiveSubTab('accounts')}
          className={`flex-1 py-1.5 px-2 rounded-xl transition-all ${
            activeSubTab === 'accounts'
              ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs font-semibold'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
          }`}
        >
          Accounts ({accounts.length})
        </button>
        <button
          onClick={() => setActiveSubTab('loans')}
          className={`flex-1 py-1.5 px-2 rounded-xl transition-all ${
            activeSubTab === 'loans'
              ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs font-semibold'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
          }`}
        >
          Loans
        </button>
      </div>

      {/* ================= SUB-TAB 1: OVERALL SUMMARY (INCOME VS EXPENSE) ================= */}
      {activeSubTab === 'summary' && (
        <div className="space-y-4">
          {/* If a category is clicked, display the Category Expense Drilldown View */}
          {selectedCategory ? (
            <div className="space-y-3 animate-in fade-in duration-200">
              {/* Back button and Category Header */}
              <div className="glass-card rounded-3xl p-4 border border-purple-200/60 dark:border-purple-900/40 space-y-3">
                <div className="flex items-center justify-between">
                  <button
                    onClick={() => {
                      setSelectedCategory(null);
                      setSelectedSubCategoryFilter('all');
                    }}
                    className="flex items-center gap-1.5 text-xs font-semibold text-purple-600 dark:text-purple-400 hover:underline"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    <span>Back to Overall Summary</span>
                  </button>

                  <button
                    onClick={() => openEditModal('transaction', undefined, { category: selectedCategory })}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-purple-600 text-white text-[11px] font-semibold hover:bg-purple-700 transition-colors shadow-2xs"
                  >
                    <Plus className="w-3 h-3" />
                    <span>Add Expense</span>
                  </button>
                </div>

                <div className="flex items-center justify-between gap-3 pt-1">
                  <div className="flex items-center gap-3">
                    <CategorySymbol category={selectedCategory} size="lg" />
                    <div>
                      <h3 className="text-base font-bold text-slate-900 dark:text-white">
                        {selectedCategory}
                      </h3>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">
                        {categoryExpenses.length} expense record{categoryExpenses.length === 1 ? '' : 's'}
                      </p>
                    </div>
                  </div>

                  <div className="text-right">
                    <p className="text-base font-bold text-rose-600 dark:text-rose-400 tabular-nums">
                      {formatCurrency(
                        categoryExpenses.reduce((sum, t) => sum + t.amountSAR, 0),
                        settings.displayCurrency,
                        settings.exchangeRateSARtoINR
                      )}
                    </p>
                    <p className="text-[10px] text-slate-400 tabular-nums">
                      {formatSecondaryEquivalent(
                        categoryExpenses.reduce((sum, t) => sum + t.amountSAR, 0),
                        settings.displayCurrency,
                        settings.exchangeRateSARtoINR
                      )}
                    </p>
                  </div>
                </div>

                {/* Sub-category filter pills for this category (e.g. Fuel, Maintenance, Cleaning for Car) */}
                {selectedCategoryObj && selectedCategoryObj.subCategories.length > 0 && (
                  <div className="pt-2 border-t border-slate-200/50 dark:border-slate-800/60">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                        Sub-categories:
                      </span>
                      <button
                        onClick={() => openEditModal('transaction', undefined, { category: selectedCategory })}
                        className="text-[10px] font-semibold text-purple-600 dark:text-purple-400 hover:underline"
                      >
                        + Add Sub-category
                      </button>
                    </div>

                    <div className="flex items-center gap-1.5 flex-wrap">
                      <button
                        onClick={() => setSelectedSubCategoryFilter('all')}
                        className={`px-2.5 py-1 rounded-xl text-[11px] font-medium transition-all ${
                          selectedSubCategoryFilter === 'all'
                            ? 'bg-purple-600 text-white shadow-2xs font-semibold'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                        }`}
                      >
                        All
                      </button>
                      {selectedCategoryObj.subCategories.map((sub) => {
                        const isSelected = selectedSubCategoryFilter.toLowerCase() === sub.name.toLowerCase();
                        const subCount = transactions.filter(
                          (t) =>
                            t.type === 'expense' &&
                            t.category.toLowerCase() === selectedCategory.toLowerCase() &&
                            (t.subCategory || '').toLowerCase() === sub.name.toLowerCase()
                        ).length;

                        return (
                          <button
                            key={sub.id}
                            onClick={() => setSelectedSubCategoryFilter(sub.name)}
                            className={`px-2.5 py-1 rounded-xl text-[11px] font-medium transition-all flex items-center gap-1 ${
                              isSelected
                                ? 'bg-purple-600 text-white shadow-2xs font-semibold'
                                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                            }`}
                          >
                            <span>{sub.name}</span>
                            <span className="text-[9px] opacity-75 tabular-nums">({subCount})</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* Expense List under this category */}
              <div className="space-y-2">
                <div className="flex items-center justify-between px-1">
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                    Expenses in {selectedCategory} (Sorted by Actual Date)
                  </span>
                </div>

                {categoryExpenses.map((tx) => {
                  const account = accounts.find((a) => a.id === tx.accountId);
                  return (
                    <div
                      key={tx.id}
                      className="glass-card rounded-2xl p-3 flex items-center justify-between gap-3 hover:border-purple-300 transition-colors"
                    >
                      <CategorySymbol
                        category={tx.category}
                        subCategory={tx.subCategory}
                        size="md"
                      />

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-xs font-semibold text-slate-800 dark:text-slate-100 truncate">
                            {tx.note || tx.category}
                          </span>
                          {tx.subCategory && (
                            <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-md bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-300 border border-purple-200/50">
                              {tx.subCategory}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-[10px] text-slate-400 mt-0.5">
                          <span className="tabular-nums flex items-center gap-1">
                            <Calendar className="w-2.5 h-2.5" />
                            {tx.date}
                          </span>
                          {account && <span>· {account.name}</span>}
                        </div>
                      </div>

                      <div className="text-right shrink-0 flex items-center gap-2">
                        <div>
                          <p className="text-xs font-bold text-rose-600 dark:text-rose-400 tabular-nums">
                            -{formatCurrency(tx.amountSAR, settings.displayCurrency, settings.exchangeRateSARtoINR)}
                          </p>
                          <span className="text-[10px] text-slate-400 tabular-nums block">
                            {formatSecondaryEquivalent(tx.amountSAR, settings.displayCurrency, settings.exchangeRateSARtoINR)}
                          </span>
                        </div>

                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => openEditModal('transaction', tx.id, tx)}
                            className="w-6 h-6 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-600"
                            title="Edit"
                          >
                            <Edit2 className="w-3 h-3" />
                          </button>
                          <button
                            onClick={() => deleteTransaction(tx.id)}
                            className="w-6 h-6 rounded-lg flex items-center justify-center text-slate-400 hover:text-rose-500"
                            title="Delete"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}

                {categoryExpenses.length === 0 && (
                  <div className="text-center py-8 glass-card rounded-3xl text-slate-400 text-xs">
                    No expenses recorded in {selectedCategory} yet.
                  </div>
                )}
              </div>
            </div>
          ) : (
            /* Main Income vs Expense Summary View */
            <div className="space-y-4">
              {/* Income vs Expense Balance Comparison Box */}
              <div className="glass-card rounded-3xl p-4 border border-slate-200/60 dark:border-slate-800/80 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center">
                      <PieChart className="w-4 h-4" />
                    </div>
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-200">
                      Income vs. Expense Overview
                    </h3>
                  </div>

                  <span className="text-[11px] font-semibold text-slate-500">
                    Net: {formatCurrency(totalIncomeSAR - totalExpenseSAR, settings.displayCurrency, settings.exchangeRateSARtoINR)}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-1">
                  <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20">
                    <div className="flex items-center gap-1.5 text-emerald-700 dark:text-emerald-400 text-[11px] font-semibold">
                      <TrendingUp className="w-3.5 h-3.5" />
                      <span>Total Inflow</span>
                    </div>
                    <p className="text-base font-bold text-emerald-700 dark:text-emerald-400 tabular-nums mt-1">
                      +{formatCurrency(totalIncomeSAR, settings.displayCurrency, settings.exchangeRateSARtoINR)}
                    </p>
                    <span className="text-[10px] text-emerald-600/80 dark:text-emerald-400/80 tabular-nums">
                      {formatSecondaryEquivalent(totalIncomeSAR, settings.displayCurrency, settings.exchangeRateSARtoINR)}
                    </span>
                  </div>

                  <div className="p-3 rounded-2xl bg-rose-500/10 border border-rose-500/20">
                    <div className="flex items-center gap-1.5 text-rose-700 dark:text-rose-400 text-[11px] font-semibold">
                      <TrendingDown className="w-3.5 h-3.5" />
                      <span>Total Outflow</span>
                    </div>
                    <p className="text-base font-bold text-rose-700 dark:text-rose-400 tabular-nums mt-1">
                      -{formatCurrency(totalExpenseSAR, settings.displayCurrency, settings.exchangeRateSARtoINR)}
                    </p>
                    <span className="text-[10px] text-rose-600/80 dark:text-rose-400/80 tabular-nums">
                      {formatSecondaryEquivalent(totalExpenseSAR, settings.displayCurrency, settings.exchangeRateSARtoINR)}
                    </span>
                  </div>
                </div>

                {/* Progress Bar comparison */}
                <div className="space-y-1 pt-1">
                  <div className="flex justify-between text-[10px] font-semibold text-slate-400">
                    <span>Cashflow Distribution</span>
                    <span>
                      {totalExpenseSAR > 0
                        ? `${Math.round((totalExpenseSAR / (totalIncomeSAR || totalExpenseSAR || 1)) * 100)}% Spent`
                        : '0% Spent'}
                    </span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden flex">
                    <div
                      className="bg-emerald-500 h-full transition-all duration-500"
                      style={{
                        width: `${Math.min(100, Math.max(5, (totalIncomeSAR / (totalIncomeSAR + totalExpenseSAR || 1)) * 100))}%`,
                      }}
                      title="Income portion"
                    />
                    <div
                      className="bg-rose-500 h-full transition-all duration-500"
                      style={{
                        width: `${Math.min(100, Math.max(5, (totalExpenseSAR / (totalIncomeSAR + totalExpenseSAR || 1)) * 100))}%`,
                      }}
                      title="Expense portion"
                    />
                  </div>
                </div>
              </div>

              {/* AI Bulk Multi-Expense Quick Entry Banner */}
              <div className="p-3 rounded-2xl bg-gradient-to-r from-purple-500/10 via-pink-500/5 to-purple-500/10 border border-purple-200/60 dark:border-purple-800/40 flex items-center justify-between gap-2 shadow-xs">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-purple-600 to-pink-500 text-white flex items-center justify-center shrink-0">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <div className="truncate">
                    <h4 className="text-xs font-bold text-slate-800 dark:text-slate-100 truncate">
                      AI Bulk Expenses
                    </h4>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                      Enter multiple expenses at once • Auto rephrasing & sub-categories
                    </p>
                  </div>
                </div>
                <button
                  onClick={openAIBulkExpenses}
                  className="px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold shadow-xs transition-colors shrink-0 flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Enter Bulk</span>
                </button>
              </div>

              {/* Clickable Expense Categories List */}
              <div className="space-y-2">
                <div className="flex items-center justify-between px-1">
                  <div>
                    <h4 className="text-xs font-bold text-slate-800 dark:text-slate-100">
                      Expenses by Category
                    </h4>
                    <p className="text-[10px] text-slate-400">
                      Click any category to display expenses & sub-category breakdown
                    </p>
                  </div>
                  <span className="text-[10px] font-semibold text-purple-600 dark:text-purple-400">
                    {categoryStats.filter((c) => c.totalSAR > 0).length} active
                  </span>
                </div>

                <div className="space-y-2">
                  {categoryStats.map((cat) => {
                    return (
                      <div
                        key={cat.name}
                        onClick={() => setSelectedCategory(cat.name)}
                        className="glass-card rounded-2xl p-3.5 cursor-pointer hover:border-purple-400/80 hover:shadow-xs transition-all group border border-slate-200/60 dark:border-slate-800/80"
                        role="button"
                        tabIndex={0}
                      >
                        <div className="flex items-center justify-between gap-3">
                          {/* Creative Category Symbol */}
                          <div className="flex items-center gap-3 min-w-0 flex-1">
                            <CategorySymbol category={cat.name} size="md" />

                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-bold text-slate-800 dark:text-slate-100 group-hover:text-purple-600 transition-colors truncate">
                                  {cat.name}
                                </span>
                                {cat.name === 'Car' && (
                                  <span className="text-[9px] font-semibold px-1.5 py-0.2 rounded-md bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 border border-blue-200/50">
                                    Fuel · Maint · Clean
                                  </span>
                                )}
                              </div>
                              <p className="text-[10px] text-slate-400">
                                {cat.count} expense{cat.count === 1 ? '' : 's'} · {cat.percentage.toFixed(1)}% of total
                              </p>
                            </div>
                          </div>

                          {/* Amount & Arrow */}
                          <div className="flex items-center gap-2 text-right shrink-0">
                            <div>
                              <p className="text-xs font-bold text-slate-900 dark:text-white tabular-nums">
                                {formatCurrency(cat.totalSAR, settings.displayCurrency, settings.exchangeRateSARtoINR)}
                              </p>
                              <span className="text-[10px] text-slate-400 tabular-nums block">
                                {formatSecondaryEquivalent(cat.totalSAR, settings.displayCurrency, settings.exchangeRateSARtoINR)}
                              </span>
                            </div>
                            <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-purple-600 group-hover:translate-x-0.5 transition-all" />
                          </div>
                        </div>

                        {/* Visual Progress Bar */}
                        <div className="mt-2.5 w-full h-1.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full transition-all duration-300"
                            style={{ width: `${Math.min(100, Math.max(cat.totalSAR > 0 ? 3 : 0, cat.percentage))}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ================= SUB-TAB 2: ALL TRANSACTIONS ================= */}
      {activeSubTab === 'transactions' && (
        <div className="space-y-3">
          {/* Action & Filter Bar */}
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1 overflow-x-auto no-scrollbar py-0.5">
              {(['all', 'income', 'expense', 'transfer'] as const).map((type) => (
                <button
                  key={type}
                  onClick={() => setTxTypeFilter(type)}
                  className={`px-3 py-1 rounded-xl text-xs capitalize transition-colors ${
                    txTypeFilter === type
                      ? 'bg-purple-600 text-white font-semibold shadow-xs'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              <button
                onClick={openAIBulkExpenses}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white text-xs font-semibold shadow-xs transition-colors"
                title="AI Bulk Expenses (Multiple Entries)"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>AI Bulk</span>
              </button>

              <button
                onClick={() => openEditModal('transaction')}
                className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold shadow-xs transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Record</span>
              </button>
            </div>
          </div>

          {/* Transactions List */}
          <div className="space-y-2">
            {filteredTransactions.map((tx) => {
              const account = accounts.find((a) => a.id === tx.accountId);
              const toAccount = tx.toAccountId ? accounts.find((a) => a.id === tx.toAccountId) : null;

              return (
                <div
                  key={tx.id}
                  className="glass-card rounded-2xl p-3 flex items-center justify-between gap-3 hover:border-purple-300 transition-colors"
                >
                  {/* Left Creative Emblem */}
                  <CategorySymbol
                    category={tx.category}
                    subCategory={tx.subCategory}
                    size="md"
                  />

                  {/* Details */}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-xs font-semibold text-slate-800 dark:text-slate-100 truncate">
                        {tx.note || tx.category}
                      </span>
                      {tx.subCategory && (
                        <span className="text-[10px] font-medium px-1.5 py-0.2 rounded-md bg-purple-50 dark:bg-purple-950/50 text-purple-600 dark:text-purple-300 border border-purple-200/50">
                          {tx.subCategory}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5 text-[10px] text-slate-400 mt-0.5">
                      <span className="tabular-nums font-mono">{tx.date}</span>
                      {account && (
                        <span>
                          · {account.name}
                          {toAccount ? ` → ${toAccount.name}` : ''}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Amount & Actions */}
                  <div className="text-right shrink-0 flex items-center gap-2">
                    <div>
                      <p
                        className={`text-xs font-bold tabular-nums ${
                          tx.type === 'income'
                            ? 'text-emerald-600 dark:text-emerald-400'
                            : tx.type === 'expense'
                            ? 'text-rose-600 dark:text-rose-400'
                            : 'text-blue-600 dark:text-blue-400'
                        }`}
                      >
                        {tx.type === 'income' ? '+' : tx.type === 'expense' ? '-' : ''}
                        {formatCurrency(tx.amountSAR, settings.displayCurrency, settings.exchangeRateSARtoINR)}
                      </p>
                      <span className="text-[10px] text-slate-400 tabular-nums block">
                        {formatSecondaryEquivalent(tx.amountSAR, settings.displayCurrency, settings.exchangeRateSARtoINR)}
                      </span>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => openEditModal('transaction', tx.id, tx)}
                        className="w-6 h-6 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                        title="Edit transaction"
                      >
                        <Edit2 className="w-3 h-3" />
                      </button>
                      <button
                        onClick={() => deleteTransaction(tx.id)}
                        className="w-6 h-6 rounded-lg flex items-center justify-center text-slate-400 hover:text-rose-500"
                        title="Delete transaction"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}

            {filteredTransactions.length === 0 && (
              <div className="text-center py-8 glass-card rounded-3xl text-slate-400 text-xs">
                No transactions found. Tap Record to add one!
              </div>
            )}
          </div>
        </div>
      )}

      {/* ================= SUB-TAB 3: ACCOUNTS MANAGEMENT ================= */}
      {activeSubTab === 'accounts' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-semibold text-slate-600 dark:text-slate-300">
              Configured Accounts & Balances
            </h3>
            <button
              onClick={() => openEditModal('account')}
              className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>New Account</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {accounts.map((acc) => {
              const Icon = getAccountIcon(acc.type);
              return (
                <div
                  key={acc.id}
                  className="glass-card rounded-3xl p-4 border border-slate-200/60 dark:border-slate-800/80 hover:border-purple-300 transition-colors"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-8 h-8 rounded-2xl flex items-center justify-center text-white text-xs shadow-xs"
                        style={{ backgroundColor: acc.color || '#8b5cf6' }}
                      >
                        <Icon className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-slate-800 dark:text-slate-100">
                          {acc.name}
                        </h4>
                        <span className="text-[10px] text-slate-400 capitalize">
                          {acc.type.replace('_', ' ')}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => openEditModal('account', acc.id, acc)}
                        className="w-6 h-6 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-600"
                        title="Edit account"
                      >
                        <Edit2 className="w-3 h-3" />
                      </button>
                      <button
                        onClick={() => deleteAccount(acc.id)}
                        className="w-6 h-6 rounded-lg flex items-center justify-center text-slate-400 hover:text-rose-500"
                        title="Delete account"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>

                  <div className="space-y-1 pt-1 border-t border-slate-200/40 dark:border-slate-800/60">
                    <div className="flex justify-between items-center text-[11px]">
                      <span className="text-slate-400">Opening Balance:</span>
                      <span className="font-semibold text-slate-600 dark:text-slate-300 tabular-nums">
                        {formatCurrency(acc.openingBalanceSAR, settings.displayCurrency, settings.exchangeRateSARtoINR)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-medium text-slate-600 dark:text-slate-400">Current Balance:</span>
                      <span className="font-bold text-slate-900 dark:text-white tabular-nums">
                        {formatCurrency(acc.currentBalanceSAR, settings.displayCurrency, settings.exchangeRateSARtoINR)}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ================= SUB-TAB 4: LOANS SUB-SECTION ================= */}
      {activeSubTab === 'loans' && <LoansView />}
    </div>
  );
};

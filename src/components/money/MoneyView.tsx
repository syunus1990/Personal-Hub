import React, { useState, useEffect, useMemo } from 'react';
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
  ArrowDownLeft,
  ArrowUpRight,
  CheckCircle2,
  Search,
  X,
  Eye,
  EyeOff,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { SummaryCard } from '../common/SummaryCard';
import { formatCurrency, formatSecondaryEquivalent } from '../../utils/currency';
import { LoansView } from '../loans/LoansView';
import { CategorySymbol, TransactionTypeSymbol, CurrencyBadge } from '../common/CustomSymbol';

export const MoneyView: React.FC = () => {
  const [isAmountsHidden, setIsAmountsHidden] = useState<boolean>(() => {
    return localStorage.getItem('phub_hide_amounts') === 'true';
  });

  const toggleHideAmounts = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setIsAmountsHidden((prev) => {
      const next = !prev;
      localStorage.setItem('phub_hide_amounts', String(next));
      return next;
    });
  };
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
    selectedAccountId,
    setSelectedAccountId,
  } = useApp();

  const [activeSubTab, setActiveSubTab] = useState<'summary' | 'transactions' | 'accounts' | 'loans'>('summary');
  const [txTypeFilter, setTxTypeFilter] = useState<'all' | 'income' | 'expense' | 'transfer'>('all');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedSubCategoryFilter, setSelectedSubCategoryFilter] = useState<string>('all');

  // Account Detail In/Out Transactions State
  const [accountTxFilter, setAccountTxFilter] = useState<'all' | 'income' | 'expense' | 'transfer'>('all');
  const [accountSearchQuery, setAccountSearchQuery] = useState<string>('');

  // Automatically switch subtab to 'accounts' if an account is selected from anywhere in the app
  useEffect(() => {
    if (selectedAccountId) {
      setActiveSubTab('accounts');
    }
  }, [selectedAccountId]);

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

  // Helper to safely match account by id or name
  const isMatchAccount = (txAccId?: string, targetId?: string, targetName?: string) => {
    if (!txAccId || !targetId) return false;
    if (txAccId === targetId) return true;
    if (targetName && txAccId.trim().toLowerCase() === targetName.trim().toLowerCase()) return true;
    return false;
  };

  // Helper to compute stats for any account
  const getAccountActivity = (accId: string) => {
    const targetAcc = accounts.find((a) => a.id === accId);
    const targetName = targetAcc?.name;

    const accTxs = transactions.filter((t) => {
      const matchSource = isMatchAccount(t.accountId, accId, targetName);
      const matchDest = isMatchAccount(t.toAccountId, accId, targetName);
      return matchSource || matchDest;
    });

    const incomeTxs = accTxs.filter(
      (t) =>
        (t.type === 'income' && isMatchAccount(t.accountId, accId, targetName)) ||
        (t.type === 'transfer' && isMatchAccount(t.toAccountId, accId, targetName))
    );

    const expenseTxs = accTxs.filter(
      (t) =>
        (t.type === 'expense' && isMatchAccount(t.accountId, accId, targetName)) ||
        (t.type === 'transfer' && isMatchAccount(t.accountId, accId, targetName))
    );

    const transferTxs = accTxs.filter((t) => t.type === 'transfer');

    const totalIn = incomeTxs.reduce((sum, t) => sum + t.amountSAR, 0);
    const totalOut = expenseTxs.reduce((sum, t) => sum + t.amountSAR, 0);

    return {
      count: accTxs.length,
      inCount: incomeTxs.length,
      outCount: expenseTxs.length,
      transferCount: transferTxs.length,
      totalIn,
      totalOut,
      transactions: accTxs,
    };
  };

  const getSoberIcon = (type: string) => {
    if (type === "income") {
      return (
        <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-200/60 dark:border-emerald-800/50">
          <ArrowDownLeft className="w-4 h-4" />
        </div>
      );
    }
    if (type === "transfer") {
      return (
        <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0 border border-blue-200/60 dark:border-blue-800/50">
          <ArrowRightLeft className="w-4 h-4" />
        </div>
      );
    }
    return (
      <div className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-800 text-rose-500 dark:text-rose-400 flex items-center justify-center shrink-0 border border-slate-200/60 dark:border-slate-700/60">
        <ArrowUpRight className="w-4 h-4" />
      </div>
    );
  };

  const selectedAccount = accounts.find((a) => a.id === selectedAccountId);
  const selectedAccountActivity = selectedAccountId ? getAccountActivity(selectedAccountId) : null;

  // Filtered transactions for the currently viewed account
  const selectedAccountFilteredTransactions = useMemo(() => {
    if (!selectedAccountId || !selectedAccountActivity) return [];
    const targetAcc = accounts.find((a) => a.id === selectedAccountId);
    const targetName = targetAcc?.name;

    return selectedAccountActivity.transactions.filter((tx) => {
      // 1. Type filter
      if (accountTxFilter === 'income') {
        const isInc =
          (tx.type === 'income' && isMatchAccount(tx.accountId, selectedAccountId, targetName)) ||
          (tx.type === 'transfer' && isMatchAccount(tx.toAccountId, selectedAccountId, targetName));
        if (!isInc) return false;
      } else if (accountTxFilter === 'expense') {
        const isExp =
          (tx.type === 'expense' && isMatchAccount(tx.accountId, selectedAccountId, targetName)) ||
          (tx.type === 'transfer' && isMatchAccount(tx.accountId, selectedAccountId, targetName));
        if (!isExp) return false;
      } else if (accountTxFilter === 'transfer') {
        if (tx.type !== 'transfer') return false;
      }

      // 2. Search query filter
      if (accountSearchQuery.trim()) {
        const q = accountSearchQuery.toLowerCase();
        const matchNote = (tx.note || '').toLowerCase().includes(q);
        const matchCat = (tx.category || '').toLowerCase().includes(q);
        const matchSub = (tx.subCategory || '').toLowerCase().includes(q);
        const matchAmt = tx.amountSAR.toString().includes(q);
        const matchDate = (tx.date || '').includes(q);
        return matchNote || matchCat || matchSub || matchAmt || matchDate;
      }

      return true;
    });
  }, [selectedAccountId, selectedAccountActivity, accountTxFilter, accountSearchQuery, accounts]);

  return (
    <div className="space-y-4 pb-24">
      {/* 1. Money Top Summary Card */}
      <SummaryCard
        title="Money & Financial Balance"
        badge="Opening · Updated · Remaining"
        primaryLabel="Total Current Balance"
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
            label: 'Total Inflow (Income)',
            value: isAmountsHidden ? '••••••' : formatCurrency(totalIncomeSAR, settings.displayCurrency, settings.exchangeRateSARtoINR),
            accentClass: 'text-emerald-600 dark:text-emerald-400',
          },
          {
            label: 'Total Outflow (Expense)',
            value: isAmountsHidden ? '••••••' : formatCurrency(totalExpenseSAR, settings.displayCurrency, settings.exchangeRateSARtoINR),
            accentClass: 'text-rose-600 dark:text-rose-400',
          },
          {
            label: 'Opening Capital',
            value: isAmountsHidden ? '••••••' : formatCurrency(totalOpeningBalanceSAR, settings.displayCurrency, settings.exchangeRateSARtoINR),
            accentClass: 'text-slate-700 dark:text-slate-300',
          },
        ]}
        gradientFrom="from-emerald-500/10"
        gradientTo="to-teal-500/10"
      />

      {/* 2. Sub-tab navigation bar */}
      <div className="flex items-center p-1 rounded-2xl bg-slate-100 dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 text-xs font-semibold">
        <button
          onClick={() => {
            setActiveSubTab('summary');
            setSelectedCategory(null);
          }}
          className={`flex-1 py-1.5 px-2 rounded-xl transition-all ${
            activeSubTab === 'summary'
              ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs font-bold border border-slate-200/60 dark:border-transparent'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          Summary
        </button>
        <button
          onClick={() => setActiveSubTab('transactions')}
          className={`flex-1 py-1.5 px-2 rounded-xl transition-all ${
            activeSubTab === 'transactions'
              ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs font-bold border border-slate-200/60 dark:border-transparent'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          Transactions
        </button>
        <button
          onClick={() => {
            setActiveSubTab('accounts');
            // preserve selectedAccountId if already selected, or user can click back
          }}
          className={`flex-1 py-1.5 px-2 rounded-xl transition-all ${
            activeSubTab === 'accounts'
              ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs font-bold border border-slate-200/60 dark:border-transparent'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          Accounts ({accounts.length})
        </button>
        <button
          onClick={() => setActiveSubTab('loans')}
          className={`flex-1 py-1.5 px-2 rounded-xl transition-all ${
            activeSubTab === 'loans'
              ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs font-bold border border-slate-200/60 dark:border-transparent'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
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
              <div className="glass-card rounded-3xl p-4 border border-purple-200/70 dark:border-purple-900/40 space-y-3">
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
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 tabular-nums">
                      {formatSecondaryEquivalent(
                        categoryExpenses.reduce((sum, t) => sum + t.amountSAR, 0),
                        settings.displayCurrency,
                        settings.exchangeRateSARtoINR
                      )}
                    </p>
                  </div>
                </div>

                {/* Sub-category filter pills for this category */}
                {selectedCategoryObj && selectedCategoryObj.subCategories.length > 0 && (
                  <div className="pt-2 border-t border-slate-200/70 dark:border-slate-800/60">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                        Sub-category Filter:
                      </span>
                      {selectedSubCategoryFilter !== 'all' && (
                        <button
                          onClick={() => setSelectedSubCategoryFilter('all')}
                          className="text-[10px] text-purple-600 dark:text-purple-400 font-semibold"
                        >
                          Clear filter
                        </button>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
                      <button
                        onClick={() => setSelectedSubCategoryFilter('all')}
                        className={`px-2.5 py-1 rounded-xl text-xs font-semibold transition-colors shrink-0 ${
                          selectedSubCategoryFilter === 'all'
                            ? 'bg-purple-600 text-white shadow-xs'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                        }`}
                      >
                        All ({categoryExpenses.length})
                      </button>
                      {selectedCategoryObj.subCategories.map((sub) => {
                        const count = transactions.filter(
                          (t) =>
                            t.type === 'expense' &&
                            t.category.toLowerCase() === selectedCategory.toLowerCase() &&
                            (t.subCategory || '').toLowerCase() === sub.name.toLowerCase()
                        ).length;

                        return (
                          <button
                            key={sub.id}
                            onClick={() => setSelectedSubCategoryFilter(sub.name)}
                            className={`px-2.5 py-1 rounded-xl text-xs font-semibold transition-colors shrink-0 flex items-center gap-1.5 ${
                              selectedSubCategoryFilter.toLowerCase() === sub.name.toLowerCase()
                                ? 'bg-purple-600 text-white shadow-xs'
                                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                            }`}
                          >
                            <span>{sub.name}</span>
                            <span className="text-[10px] opacity-75 font-mono">({count})</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* List of expenses for this category */}
              <div className="space-y-2">
                {categoryExpenses.map((tx) => {
                  const account = accounts.find((a) => a.id === tx.accountId);
                  return (
                    <div
                      key={tx.id}
                      className="glass-card rounded-2xl p-3 flex items-center justify-between gap-3 hover:border-purple-300 transition-colors"
                    >
                      {getSoberIcon(tx.type)}

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
                        <div className="flex items-center gap-1.5 text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
                          <span className="tabular-nums font-mono">{tx.date}</span>
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

                {categoryExpenses.length === 0 && (
                  <div className="text-center py-8 glass-card rounded-3xl text-slate-400 text-xs">
                    No expense records found for this category filter.
                  </div>
                )}
              </div>
            </div>
          ) : (
            /* Main Income vs Expense Summary View */
            <div className="space-y-4">
              {/* Income vs Expense Balance Comparison Box */}
              <div className="glass-card rounded-3xl p-4 border border-slate-200/80 dark:border-slate-800/80 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center">
                      <PieChart className="w-4 h-4" />
                    </div>
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-200">
                      Income vs. Expense Overview
                    </h3>
                  </div>

                  <span className="text-[11px] font-bold text-slate-600 dark:text-slate-400">
                    Net: {formatCurrency(totalIncomeSAR - totalExpenseSAR, settings.displayCurrency, settings.exchangeRateSARtoINR)}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-1">
                  <div className="p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200/80 dark:border-emerald-800/40">
                    <div className="flex items-center gap-1.5 text-emerald-800 dark:text-emerald-300 text-[11px] font-bold">
                      <TrendingUp className="w-3.5 h-3.5" />
                      <span>Total Inflow</span>
                    </div>
                    <p className="text-base font-bold text-emerald-700 dark:text-emerald-400 tabular-nums mt-1">
                      +{formatCurrency(totalIncomeSAR, settings.displayCurrency, settings.exchangeRateSARtoINR)}
                    </p>
                    <span className="text-[10px] text-emerald-600/90 dark:text-emerald-400/80 tabular-nums font-medium">
                      {formatSecondaryEquivalent(totalIncomeSAR, settings.displayCurrency, settings.exchangeRateSARtoINR)}
                    </span>
                  </div>

                  <div className="p-3 rounded-2xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200/80 dark:border-rose-800/40">
                    <div className="flex items-center gap-1.5 text-rose-800 dark:text-rose-300 text-[11px] font-bold">
                      <TrendingDown className="w-3.5 h-3.5" />
                      <span>Total Outflow</span>
                    </div>
                    <p className="text-base font-bold text-rose-700 dark:text-rose-400 tabular-nums mt-1">
                      -{formatCurrency(totalExpenseSAR, settings.displayCurrency, settings.exchangeRateSARtoINR)}
                    </p>
                    <span className="text-[10px] text-rose-600/90 dark:text-rose-400/80 tabular-nums font-medium">
                      {formatSecondaryEquivalent(totalExpenseSAR, settings.displayCurrency, settings.exchangeRateSARtoINR)}
                    </span>
                  </div>
                </div>

                {/* Progress Bar comparison */}
                <div className="space-y-1.5 pt-1">
                  <div className="flex justify-between text-[10px] font-bold text-slate-500 dark:text-slate-400">
                    <span>Cashflow Distribution</span>
                    <span>
                      {totalExpenseSAR > 0
                        ? `${Math.round((totalExpenseSAR / (totalIncomeSAR || totalExpenseSAR || 1)) * 100)}% Spent`
                        : '0% Spent'}
                    </span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200/50 dark:border-slate-700/50 overflow-hidden flex">
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
              <div className="p-3.5 rounded-2xl bg-gradient-to-r from-purple-50 via-pink-50/70 to-purple-50 dark:from-purple-950/30 dark:via-pink-950/20 dark:to-purple-950/30 border border-purple-200/80 dark:border-purple-800/40 flex items-center justify-between gap-2 shadow-xs">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-purple-600 to-pink-500 text-white flex items-center justify-center shrink-0 shadow-xs">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <div className="truncate">
                    <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate">
                      AI Bulk Expenses
                    </h4>
                    <p className="text-[10px] text-slate-600 dark:text-slate-400 truncate">
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
                    <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100">
                      Expenses by Category
                    </h4>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400">
                      Click any category to display expenses & sub-category breakdown
                    </p>
                  </div>
                  <span className="text-[10px] font-bold text-purple-600 dark:text-purple-400">
                    {categoryStats.filter((c) => c.totalSAR > 0).length} active
                  </span>
                </div>

                <div className="space-y-2">
                  {categoryStats.map((cat) => {
                    return (
                      <div
                        key={cat.name}
                        onClick={() => setSelectedCategory(cat.name)}
                        className="glass-card rounded-2xl p-3.5 cursor-pointer hover:border-purple-400/80 hover:shadow-xs transition-all group border border-slate-200/80 dark:border-slate-800/80"
                        role="button"
                        tabIndex={0}
                      >
                        <div className="flex items-center justify-between gap-3">
                          <div className="flex items-center gap-3 min-w-0 flex-1">
                            <CategorySymbol category={cat.name} size="md" />

                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-bold text-slate-900 dark:text-slate-100 group-hover:text-purple-600 transition-colors truncate">
                                  {cat.name}
                                </span>
                                {cat.name === 'Car' && (
                                  <span className="text-[9px] font-bold px-1.5 py-0.2 rounded-md bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 border border-blue-200/60 dark:border-blue-900/40">
                                    Fuel · Maint · Clean
                                  </span>
                                )}
                              </div>
                              <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">
                                {cat.count} expense{cat.count === 1 ? '' : 's'} · {cat.percentage.toFixed(1)}% of total
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 text-right shrink-0">
                            <div>
                              <p className="text-xs font-bold text-slate-900 dark:text-white tabular-nums">
                                {formatCurrency(cat.totalSAR, settings.displayCurrency, settings.exchangeRateSARtoINR)}
                              </p>
                              <span className="text-[10px] text-slate-400 tabular-nums block font-medium">
                                {formatSecondaryEquivalent(cat.totalSAR, settings.displayCurrency, settings.exchangeRateSARtoINR)}
                              </span>
                            </div>
                            <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-purple-600 group-hover:translate-x-0.5 transition-all" />
                          </div>
                        </div>

                        {/* Visual Progress Bar */}
                        <div className="mt-2.5 w-full h-1.5 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200/40 dark:border-slate-700/40 overflow-hidden">
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
            <div className="flex items-center gap-1 p-1 rounded-2xl bg-slate-100 dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 overflow-x-auto no-scrollbar">
              {(['all', 'income', 'expense', 'transfer'] as const).map((type) => (
                <button
                  key={type}
                  onClick={() => setTxTypeFilter(type)}
                  className={`px-3 py-1 rounded-xl text-xs capitalize transition-colors font-semibold ${
                    txTypeFilter === type
                      ? 'bg-white dark:bg-slate-800 text-purple-700 dark:text-purple-300 shadow-xs border border-slate-200/60 dark:border-transparent'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              <button
                onClick={openAIBulkExpenses}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white text-xs font-bold shadow-xs transition-colors"
                title="AI Bulk Expenses (Multiple Entries)"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>AI Bulk</span>
              </button>

              <button
                onClick={() => openEditModal('transaction')}
                className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold shadow-xs transition-colors"
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
                  className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-3 flex items-center justify-between gap-3 hover:border-slate-300 dark:hover:border-slate-700 transition-colors shadow-2xs"
                >
                  {getSoberIcon(tx.type)}

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate">
                        {tx.note || tx.category}
                      </span>
                      {tx.subCategory && (
                        <span className="text-[10px] font-semibold px-1.5 py-0.2 rounded-md bg-purple-50 dark:bg-purple-950/50 text-purple-700 dark:text-purple-300 border border-purple-200/60 dark:border-purple-800/50">
                          {tx.subCategory}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5 text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 font-medium">
                      <span className="tabular-nums font-mono">{tx.date}</span>
                      {account && (
                        <span>
                          · {account.name}
                          {toAccount ? ` → ${toAccount.name}` : ''}
                        </span>
                      )}
                    </div>
                  </div>

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
                      <span className="text-[10px] text-slate-400 tabular-nums block font-medium">
                        {formatSecondaryEquivalent(tx.amountSAR, settings.displayCurrency, settings.exchangeRateSARtoINR)}
                      </span>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => openEditModal('transaction', tx.id, tx)}
                        className="w-6 h-6 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
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

      {/* ================= SUB-TAB 3: ACCOUNTS MANAGEMENT & IN/OUT DETAIL ================= */}
      {activeSubTab === 'accounts' && (
        <div className="space-y-4">
          {/* If an Account is clicked, show its comprehensive In/Out Transactions Ledger */}
          {selectedAccount ? (
            <div className="space-y-3 animate-in fade-in duration-200">
              {/* Top Navigation & Quick Account Switcher */}
              <div className="flex flex-col gap-2.5">
                <div className="flex items-center justify-between">
                  <button
                    onClick={() => {
                      setSelectedAccountId(null);
                      setAccountTxFilter('all');
                      setAccountSearchQuery('');
                    }}
                    className="flex items-center gap-1.5 text-xs font-bold text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 transition-colors"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    <span>Back to All Accounts</span>
                  </button>

                  <span className="text-[11px] text-slate-500 dark:text-slate-400 font-semibold">
                    Viewing Account Ledger
                  </span>
                </div>

                {/* 1-Tap Account Switcher Carousel */}
                <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
                  {accounts.map((acc) => {
                    const isCurrent = acc.id === selectedAccount.id;
                    return (
                      <button
                        key={acc.id}
                        onClick={() => {
                          setSelectedAccountId(acc.id);
                          setAccountTxFilter('all');
                          setAccountSearchQuery('');
                        }}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 flex items-center gap-1.5 shadow-2xs ${
                          isCurrent
                            ? 'bg-purple-600 text-white shadow-xs scale-102 ring-2 ring-purple-500/20'
                            : 'bg-white hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200/90 dark:border-slate-700'
                        }`}
                      >
                        <span
                          className="w-2.5 h-2.5 rounded-full shrink-0 shadow-xs"
                          style={{ backgroundColor: acc.color || '#8b5cf6' }}
                        />
                        <span>{acc.name}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Account Overview Header Card */}
              <div className="glass-card rounded-3xl p-4 sm:p-5 border border-purple-200/90 dark:border-slate-800 space-y-4 shadow-sm bg-white dark:bg-slate-900/90">
                {/* Account Identity and Big Balance */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className="w-12 h-12 rounded-2xl flex items-center justify-center text-white text-base shadow-sm shrink-0"
                      style={{ backgroundColor: selectedAccount.color || '#8b5cf6' }}
                    >
                      {React.createElement(getAccountIcon(selectedAccount.type), { className: 'w-6 h-6' })}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-lg font-bold text-slate-900 dark:text-white truncate">
                          {selectedAccount.name}
                        </h3>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 capitalize border border-slate-200 dark:border-slate-700">
                          {selectedAccount.type.replace('_', ' ')}
                        </span>
                        {selectedAccount.accountNumberMask && (
                          <span className="text-[10px] font-mono font-medium text-slate-500 dark:text-slate-400">
                            {selectedAccount.accountNumberMask}
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-600 dark:text-slate-400 font-medium mt-0.5">
                        {selectedAccountActivity?.count || 0} total in/out transactions linked to this account
                      </p>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400 block tracking-wider">
                      Current Balance
                    </span>
                    <div className="flex items-center justify-end gap-1.5 mt-0.5">
                      <p className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tabular-nums font-heading">
                        {isAmountsHidden ? '••••••' : formatCurrency(selectedAccount.currentBalanceSAR, settings.displayCurrency, settings.exchangeRateSARtoINR)}
                      </p>
                      <button
                        onClick={toggleHideAmounts}
                        className="p-1 text-slate-400 hover:text-purple-600 transition-colors"
                        title={isAmountsHidden ? 'Show amount' : 'Hide amount'}
                      >
                        {isAmountsHidden ? <EyeOff className="w-3.5 h-3.5 text-purple-600" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 tabular-nums block font-medium">
                      {isAmountsHidden ? '•••• SAR' : formatSecondaryEquivalent(selectedAccount.currentBalanceSAR, settings.displayCurrency, settings.exchangeRateSARtoINR)}
                    </span>
                  </div>
                </div>

                {/* 4-Stat Metric Row: Opening, Inflow, Outflow, Net */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-3 border-t border-slate-200/90 dark:border-slate-800/80">
                  <div className="p-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60">
                    <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 truncate">
                      Opening Capital
                    </span>
                    <p className="text-xs font-bold text-slate-800 dark:text-slate-200 tabular-nums mt-0.5 truncate">
                      {formatCurrency(selectedAccount.openingBalanceSAR, settings.displayCurrency, settings.exchangeRateSARtoINR)}
                    </p>
                  </div>

                  <div className="p-2.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200/90 dark:border-emerald-800/50">
                    <span className="block text-[10px] font-bold uppercase tracking-wider text-emerald-800 dark:text-emerald-300 truncate flex items-center gap-1">
                      <ArrowDownLeft className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                      <span>Total In ({selectedAccountActivity?.inCount || 0})</span>
                    </span>
                    <p className="text-xs font-bold text-emerald-700 dark:text-emerald-400 tabular-nums mt-0.5 truncate">
                      +{formatCurrency(selectedAccountActivity?.totalIn || 0, settings.displayCurrency, settings.exchangeRateSARtoINR)}
                    </p>
                  </div>

                  <div className="p-2.5 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200/90 dark:border-rose-800/50">
                    <span className="block text-[10px] font-bold uppercase tracking-wider text-rose-800 dark:text-rose-300 truncate flex items-center gap-1">
                      <ArrowUpRight className="w-3 h-3 text-rose-600 dark:text-rose-400" />
                      <span>Total Out ({selectedAccountActivity?.outCount || 0})</span>
                    </span>
                    <p className="text-xs font-bold text-rose-700 dark:text-rose-400 tabular-nums mt-0.5 truncate">
                      -{formatCurrency(selectedAccountActivity?.totalOut || 0, settings.displayCurrency, settings.exchangeRateSARtoINR)}
                    </p>
                  </div>

                  <div className="p-2.5 rounded-2xl bg-purple-50 dark:bg-purple-950/40 border border-purple-200/90 dark:border-purple-800/50">
                    <span className="block text-[10px] font-bold uppercase tracking-wider text-purple-800 dark:text-purple-300 truncate flex items-center gap-1">
                      <ArrowRightLeft className="w-3 h-3 text-purple-600 dark:text-purple-400" />
                      <span>Net Flow</span>
                    </span>
                    <p
                      className={`text-xs font-bold tabular-nums mt-0.5 truncate ${
                        (selectedAccountActivity?.totalIn || 0) - (selectedAccountActivity?.totalOut || 0) >= 0
                          ? 'text-purple-700 dark:text-purple-300'
                          : 'text-rose-700 dark:text-rose-400'
                      }`}
                    >
                      {(selectedAccountActivity?.totalIn || 0) - (selectedAccountActivity?.totalOut || 0) >= 0 ? '+' : ''}
                      {formatCurrency(
                        (selectedAccountActivity?.totalIn || 0) - (selectedAccountActivity?.totalOut || 0),
                        settings.displayCurrency,
                        settings.exchangeRateSARtoINR
                      )}
                    </p>
                  </div>
                </div>

                {/* Quick Action Bar for Account */}
                <div className="flex items-center gap-2 pt-1 border-t border-slate-200/80 dark:border-slate-800/80 flex-wrap">
                  <button
                    onClick={() => openEditModal('transaction', undefined, { accountId: selectedAccount.id })}
                    className="flex-1 py-1.5 px-3 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold shadow-xs transition-colors flex items-center justify-center gap-1.5"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Record Entry for {selectedAccount.name}</span>
                  </button>

                  <button
                    onClick={() =>
                      openEditModal('transaction', undefined, {
                        type: 'transfer',
                        accountId: selectedAccount.id,
                      })
                    }
                    className="py-1.5 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-semibold border border-slate-200 dark:border-slate-700 transition-colors flex items-center gap-1.5"
                  >
                    <ArrowRightLeft className="w-3.5 h-3.5" />
                    <span>Transfer</span>
                  </button>

                  <button
                    onClick={() => openEditModal('account', selectedAccount.id, selectedAccount)}
                    className="py-1.5 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold border border-slate-200 dark:border-slate-700 transition-colors flex items-center gap-1.5"
                    title="Edit account name, opening balance, or color"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                    <span>Edit</span>
                  </button>
                </div>
              </div>

              {/* Search & Filter Controls for Account Transactions */}
              <div className="space-y-2">
                {/* Search in this account */}
                <div className="relative">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={accountSearchQuery}
                    onChange={(e) => setAccountSearchQuery(e.target.value)}
                    placeholder={`Search in ${selectedAccount.name} transactions (note, category, amount)...`}
                    className="w-full pl-9 pr-8 py-2 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-400 shadow-2xs"
                  />
                  {accountSearchQuery && (
                    <button
                      onClick={() => setAccountSearchQuery('')}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {/* Filter Tabs within Account View */}
                <div className="flex items-center gap-1 p-1 rounded-2xl bg-slate-200/70 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/60 text-xs font-semibold overflow-x-auto no-scrollbar">
                  <button
                    onClick={() => setAccountTxFilter('all')}
                    className={`flex-1 py-1 px-2.5 rounded-xl transition-all whitespace-nowrap ${
                      accountTxFilter === 'all'
                        ? 'bg-white dark:bg-slate-700 text-purple-700 dark:text-purple-300 shadow-xs font-bold'
                        : 'text-slate-700 dark:text-slate-300 hover:text-slate-900 font-semibold'
                    }`}
                  >
                    All ({selectedAccountActivity?.count || 0})
                  </button>
                  <button
                    onClick={() => setAccountTxFilter('income')}
                    className={`flex-1 py-1 px-2.5 rounded-xl transition-all whitespace-nowrap ${
                      accountTxFilter === 'income'
                        ? 'bg-white dark:bg-slate-700 text-emerald-700 dark:text-emerald-300 shadow-xs font-bold'
                        : 'text-slate-700 dark:text-slate-300 hover:text-slate-900 font-semibold'
                    }`}
                  >
                    Money In ({selectedAccountActivity?.inCount || 0})
                  </button>
                  <button
                    onClick={() => setAccountTxFilter('expense')}
                    className={`flex-1 py-1 px-2.5 rounded-xl transition-all whitespace-nowrap ${
                      accountTxFilter === 'expense'
                        ? 'bg-white dark:bg-slate-700 text-rose-700 dark:text-rose-300 shadow-xs font-bold'
                        : 'text-slate-700 dark:text-slate-300 hover:text-slate-900 font-semibold'
                    }`}
                  >
                    Money Out ({selectedAccountActivity?.outCount || 0})
                  </button>
                  <button
                    onClick={() => setAccountTxFilter('transfer')}
                    className={`flex-1 py-1 px-2.5 rounded-xl transition-all whitespace-nowrap ${
                      accountTxFilter === 'transfer'
                        ? 'bg-white dark:bg-slate-700 text-blue-700 dark:text-blue-300 shadow-xs font-bold'
                        : 'text-slate-700 dark:text-slate-300 hover:text-slate-900 font-semibold'
                    }`}
                  >
                    Transfers ({selectedAccountActivity?.transferCount || 0})
                  </button>
                </div>
              </div>

              {/* Transactions List for This Specific Account */}
              <div className="space-y-2">
                <div className="flex items-center justify-between px-1">
                  <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200">
                    Activity Ledger ({selectedAccountFilteredTransactions.length})
                  </h4>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold">
                    {accountTxFilter === 'all'
                      ? 'In/Out Chronological Order'
                      : `Filtered by ${accountTxFilter}`}
                  </span>
                </div>

                {selectedAccountFilteredTransactions.map((tx) => {
                  const targetAcc = accounts.find((a) => a.id === selectedAccount.id);
                  const targetName = targetAcc?.name;

                  const isDirectIncome = tx.type === 'income' && isMatchAccount(tx.accountId, selectedAccount.id, targetName);
                  const isDirectExpense = tx.type === 'expense' && isMatchAccount(tx.accountId, selectedAccount.id, targetName);
                  const isTransferIn = tx.type === 'transfer' && isMatchAccount(tx.toAccountId, selectedAccount.id, targetName);
                  const isTransferOut = tx.type === 'transfer' && isMatchAccount(tx.accountId, selectedAccount.id, targetName);

                  const otherAccount = isTransferIn
                    ? accounts.find((a) => isMatchAccount(a.id, tx.accountId, a.name))
                    : isTransferOut
                    ? accounts.find((a) => isMatchAccount(a.id, tx.toAccountId, a.name))
                    : null;

                  return (
                    <div
                      key={tx.id}
                      className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-3 flex items-center justify-between gap-3 hover:border-slate-300 dark:hover:border-slate-700 transition-colors shadow-2xs"
                    >
                      {getSoberIcon(tx.type)}

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate">
                            {tx.note || tx.category}
                          </span>
                          {tx.subCategory && (
                            <span className="text-[10px] font-semibold px-1.5 py-0.2 rounded-md bg-purple-50 dark:bg-purple-950/50 text-purple-700 dark:text-purple-300 border border-purple-200/60 dark:border-purple-800/50">
                              {tx.subCategory}
                            </span>
                          )}
                          {isDirectIncome && (
                            <span className="text-[9px] font-bold px-1.5 py-0.2 rounded-md bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200/80 dark:border-emerald-800/50">
                              Money In
                            </span>
                          )}
                          {isDirectExpense && (
                            <span className="text-[9px] font-bold px-1.5 py-0.2 rounded-md bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-200/80 dark:border-rose-800/50">
                              Money Out
                            </span>
                          )}
                          {isTransferIn && (
                            <span className="text-[9px] font-bold px-1.5 py-0.2 rounded-md bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200/80 dark:border-blue-800/50">
                              Transfer In
                            </span>
                          )}
                          {isTransferOut && (
                            <span className="text-[9px] font-bold px-1.5 py-0.2 rounded-md bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200/80 dark:border-amber-800/50">
                              Transfer Out
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-1.5 text-[10px] text-slate-500 dark:text-slate-400 mt-1 font-medium">
                          <span className="tabular-nums font-mono">{tx.date}</span>
                          {otherAccount && (
                            <span>
                              · {isTransferIn ? `From: ${otherAccount.name}` : `To: ${otherAccount.name}`}
                            </span>
                          )}
                          <span>· Category: {tx.category}</span>
                        </div>
                      </div>

                      <div className="text-right shrink-0 flex items-center gap-2">
                        <div>
                          <p
                            className={`text-xs font-bold tabular-nums ${
                              isDirectIncome || isTransferIn
                                ? 'text-emerald-600 dark:text-emerald-400'
                                : 'text-rose-600 dark:text-rose-400'
                            }`}
                          >
                            {isDirectIncome || isTransferIn ? '+' : '-'}
                            {formatCurrency(tx.amountSAR, settings.displayCurrency, settings.exchangeRateSARtoINR)}
                          </p>
                          <span className="text-[10px] text-slate-500 dark:text-slate-400 tabular-nums block font-medium">
                            {formatSecondaryEquivalent(tx.amountSAR, settings.displayCurrency, settings.exchangeRateSARtoINR)}
                          </span>
                        </div>

                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => openEditModal('transaction', tx.id, tx)}
                            className="w-6 h-6 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                            title="Edit transaction"
                          >
                            <Edit2 className="w-3 h-3" />
                          </button>
                          <button
                            onClick={() => deleteTransaction(tx.id)}
                            className="w-6 h-6 rounded-lg flex items-center justify-center text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                            title="Delete transaction"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}

                {selectedAccountFilteredTransactions.length === 0 && (
                  <div className="text-center py-10 glass-card rounded-3xl text-slate-500 dark:text-slate-400 text-xs border border-slate-200/80 dark:border-slate-800/80 space-y-2 bg-white dark:bg-slate-900/80">
                    <p className="font-semibold text-slate-700 dark:text-slate-300">
                      No transactions found for this account filter.
                    </p>
                    <p className="text-[11px] text-slate-400">
                      Record a transaction or transfer to track activity under {selectedAccount.name}.
                    </p>
                    <button
                      onClick={() => openEditModal('transaction', undefined, { accountId: selectedAccount.id })}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold shadow-xs transition-colors mt-1"
                    >
                      <Plus className="w-3 h-3" />
                      <span>Record Entry for {selectedAccount.name}</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          ) : (
            /* Main Accounts Grid (When no single account is drilled down) */
            <div className="space-y-3">
              <div className="flex items-center justify-between px-1">
                <div>
                  <h3 className="text-xs font-bold text-slate-900 dark:text-slate-100">
                    Configured Accounts & Balances
                  </h3>
                  <p className="text-[10px] text-slate-600 dark:text-slate-400 font-medium">
                    Click any account to inspect in/out transactions
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={toggleHideAmounts}
                    className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:text-purple-600 text-xs font-semibold shadow-2xs transition-colors"
                    title={isAmountsHidden ? 'Show amounts' : 'Hide amounts (Privacy Mode)'}
                  >
                    {isAmountsHidden ? <EyeOff className="w-3.5 h-3.5 text-purple-600" /> : <Eye className="w-3.5 h-3.5" />}
                    <span className="text-[11px]">{isAmountsHidden ? 'Hidden' : 'Visible'}</span>
                  </button>
                  <button
                    onClick={() => openEditModal('account')}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold shadow-xs transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>New Account</span>
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {accounts.map((acc) => {
                  const Icon = getAccountIcon(acc.type);
                  const activity = getAccountActivity(acc.id);

                  return (
                    <div
                      key={acc.id}
                      onClick={() => {
                        setSelectedAccountId(acc.id);
                        setAccountTxFilter('all');
                        setAccountSearchQuery('');
                      }}
                      className="glass-card rounded-3xl p-4 border border-slate-200/90 dark:border-slate-800 hover:border-purple-400 cursor-pointer transition-all hover:shadow-xs group bg-white dark:bg-slate-900/80 shadow-2xs"
                      role="button"
                      tabIndex={0}
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div
                            className="w-10 h-10 rounded-2xl flex items-center justify-center text-white text-sm shadow-xs shrink-0"
                            style={{ backgroundColor: acc.color || '#8b5cf6' }}
                          >
                            <Icon className="w-5 h-5" />
                          </div>
                          <div className="min-w-0">
                            <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100 group-hover:text-purple-600 transition-colors truncate">
                              {acc.name}
                            </h4>
                            <div className="flex items-center gap-1.5 mt-0.5">
                              <span className="text-[10px] text-slate-600 dark:text-slate-400 capitalize font-medium">
                                {acc.type.replace('_', ' ')}
                              </span>
                              {acc.accountNumberMask && (
                                <span className="text-[10px] text-slate-400 font-mono">
                                  · {acc.accountNumberMask}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              openEditModal('account', acc.id, acc);
                            }}
                            className="w-6 h-6 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                            title="Edit account"
                          >
                            <Edit2 className="w-3 h-3" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteAccount(acc.id);
                            }}
                            className="w-6 h-6 rounded-lg flex items-center justify-center text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                            title="Delete account"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </div>

                      {/* Balances Breakdown */}
                      <div className="space-y-1.5 pt-2.5 border-t border-slate-200/80 dark:border-slate-800/60">
                        <div className="flex justify-between items-center text-[11px]">
                          <span className="text-slate-600 dark:text-slate-400 font-medium">Opening Balance:</span>
                          <span className="font-semibold text-slate-700 dark:text-slate-300 tabular-nums">
                            {formatCurrency(acc.openingBalanceSAR, settings.displayCurrency, settings.exchangeRateSARtoINR)}
                          </span>
                        </div>
                        <div className="flex justify-between items-center text-xs">
                          <span className="font-bold text-slate-800 dark:text-slate-200">Current Balance:</span>
                          <span className="font-bold text-slate-900 dark:text-white tabular-nums">
                            {isAmountsHidden ? '••••••' : formatCurrency(acc.currentBalanceSAR, settings.displayCurrency, settings.exchangeRateSARtoINR)}
                          </span>
                        </div>

                        {/* In/Out Activity mini pill row */}
                        <div className="flex items-center justify-between pt-1 text-[10px]">
                          <span className="text-emerald-700 dark:text-emerald-400 font-semibold flex items-center gap-0.5">
                            <ArrowDownLeft className="w-2.5 h-2.5" />
                            <span>In: +{formatCurrency(activity.totalIn, settings.displayCurrency, settings.exchangeRateSARtoINR)}</span>
                          </span>
                          <span className="text-rose-700 dark:text-rose-400 font-semibold flex items-center gap-0.5">
                            <ArrowUpRight className="w-2.5 h-2.5" />
                            <span>Out: -{formatCurrency(activity.totalOut, settings.displayCurrency, settings.exchangeRateSARtoINR)}</span>
                          </span>
                        </div>
                      </div>

                      {/* Prominent Action Button: View Transactions */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedAccountId(acc.id);
                          setAccountTxFilter('all');
                          setAccountSearchQuery('');
                        }}
                        className="w-full mt-3 py-2 px-3 rounded-2xl bg-purple-50 hover:bg-purple-100 dark:bg-purple-950/50 dark:hover:bg-purple-900/60 text-purple-700 dark:text-purple-300 font-bold text-xs flex items-center justify-between border border-purple-200/80 dark:border-purple-800/50 transition-colors shadow-2xs group-hover:border-purple-300"
                      >
                        <span className="flex items-center gap-1.5">
                          <Layers className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
                          <span>View In/Out Transactions ({activity.count})</span>
                        </span>
                        <div className="flex items-center gap-1 text-[11px]">
                          <span>Open Ledger</span>
                          <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                        </div>
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ================= SUB-TAB 4: LOANS SUB-SECTION ================= */}
      {activeSubTab === 'loans' && <LoansView />}
    </div>
  );
};

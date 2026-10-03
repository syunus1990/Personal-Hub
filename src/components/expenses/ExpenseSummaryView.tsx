import React, { useMemo } from 'react';
import { Wallet, TrendingDown, Calendar, DollarSign, PieChart } from 'lucide-react';
import { MoneyAccount, ExpenseCategory, Transaction } from '../../types';
import { getTodayString } from '../../utils/dateUtils';
import { formatSAR } from '../../utils/currencyFormatter';

interface ExpenseSummaryViewProps {
  accounts: MoneyAccount[];
  categories: ExpenseCategory[];
  transactions: Transaction[];
}

export const ExpenseSummaryView: React.FC<ExpenseSummaryViewProps> = ({
  accounts,
  categories,
  transactions,
}) => {
  const todayStr = getTodayString();

  // Total Money Across Accounts
  const totalMoney = accounts.reduce((sum, a) => sum + (Number(a.currentBalance) || 0), 0);

  // Today's spending
  const todaySpending = useMemo(() => {
    return transactions
      .filter((tx) => tx.type === 'Expense' && tx.date === todayStr)
      .reduce((sum, tx) => sum + (Number(tx.amount) || 0), 0);
  }, [transactions, todayStr]);

  // This week's spending
  const weekSpending = useMemo(() => {
    const now = new Date();
    const startOfWeek = new Date(now);
    const day = now.getDay();
    const diff = now.getDate() - day + (day === 0 ? -6 : 1);
    startOfWeek.setDate(diff);
    startOfWeek.setHours(0, 0, 0, 0);
    const startOfWeekStr = startOfWeek.toISOString().slice(0, 10);

    return transactions
      .filter((tx) => tx.type === 'Expense' && tx.date >= startOfWeekStr && tx.date <= todayStr)
      .reduce((sum, tx) => sum + (Number(tx.amount) || 0), 0);
  }, [transactions, todayStr]);

  // Current month's spending
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = String(now.getMonth() + 1).padStart(2, '0');
  const monthPrefix = `${currentYear}-${currentMonth}`;

  const monthSpending = useMemo(() => {
    return transactions
      .filter((tx) => tx.type === 'Expense' && tx.date.startsWith(monthPrefix))
      .reduce((sum, tx) => sum + (Number(tx.amount) || 0), 0);
  }, [transactions, monthPrefix]);

  // Category breakdown for current month
  const categoryBreakdown = useMemo(() => {
    const expenseTx = transactions.filter((tx) => tx.type === 'Expense' && tx.date.startsWith(monthPrefix));
    const totalMonthExp = expenseTx.reduce((sum, tx) => sum + (Number(tx.amount) || 0), 0);

    const map: Record<string, { name: string; amount: number; color: string }> = {};

    expenseTx.forEach((tx) => {
      const cat = categories.find((c) => c.id === tx.categoryId);
      const catId = cat ? cat.id : 'uncategorized';
      const catName = cat ? cat.name : 'Uncategorized';
      const catColor = cat?.color || '#94a3b8';

      if (!map[catId]) {
        map[catId] = { name: catName, amount: 0, color: catColor };
      }
      map[catId].amount += Number(tx.amount) || 0;
    });

    const list = Object.entries(map).map(([id, data]) => ({
      id,
      name: data.name,
      amount: data.amount,
      color: data.color,
      percentage: totalMonthExp > 0 ? (data.amount / totalMonthExp) * 100 : 0,
    }));

    return list.sort((a, b) => b.amount - a.amount);
  }, [transactions, categories, monthPrefix]);

  return (
    <div className="space-y-4">
      {/* 4 Quick Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {/* Total Money */}
        <div className="p-4 sm:p-5 rounded-3xl bg-emerald-950/30 border border-emerald-500/20 backdrop-blur-xl">
          <div className="flex items-center gap-2 text-emerald-400 mb-1">
            <Wallet className="w-4 h-4 shrink-0" />
            <span className="text-[10px] font-bold uppercase tracking-wider">
              Total Money
            </span>
          </div>
          <span className="text-xl sm:text-2xl font-black text-white block">
            {formatSAR(totalMoney)}
          </span>
          <span className="text-[11px] text-slate-400 block mt-1">
            Across {accounts.length} active accounts
          </span>
        </div>

        {/* Current Month Spending */}
        <div className="p-4 sm:p-5 rounded-3xl bg-rose-950/30 border border-rose-500/20 backdrop-blur-xl">
          <div className="flex items-center gap-2 text-rose-400 mb-1">
            <TrendingDown className="w-4 h-4 shrink-0" />
            <span className="text-[10px] font-bold uppercase tracking-wider">
              Month Spending
            </span>
          </div>
          <span className="text-xl sm:text-2xl font-black text-white block">
            {formatSAR(monthSpending)}
          </span>
          <span className="text-[11px] text-slate-400 block mt-1">
            Current calendar month
          </span>
        </div>

        {/* Today's Spending */}
        <div className="p-4 rounded-3xl bg-white/5 border border-white/10 backdrop-blur-xl">
          <div className="flex items-center gap-2 text-amber-400 mb-1">
            <Calendar className="w-4 h-4 shrink-0" />
            <span className="text-[10px] font-bold uppercase tracking-wider">
              Today&apos;s Spending
            </span>
          </div>
          <span className="text-lg sm:text-xl font-black text-amber-300 block">
            {formatSAR(todaySpending)}
          </span>
          <span className="text-[11px] text-slate-400 block mt-1">
            Recorded today
          </span>
        </div>

        {/* This Week's Spending */}
        <div className="p-4 rounded-3xl bg-white/5 border border-white/10 backdrop-blur-xl">
          <div className="flex items-center gap-2 text-violet-400 mb-1">
            <DollarSign className="w-4 h-4 shrink-0" />
            <span className="text-[10px] font-bold uppercase tracking-wider">
              This Week
            </span>
          </div>
          <span className="text-lg sm:text-xl font-black text-violet-300 block">
            {formatSAR(weekSpending)}
          </span>
          <span className="text-[11px] text-slate-400 block mt-1">
            Monday to today
          </span>
        </div>
      </div>

      {/* Spending Breakdown by Category */}
      <div className="p-4 sm:p-5 rounded-3xl bg-white/5 border border-white/10 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <PieChart className="w-4 h-4 text-purple-400 shrink-0" />
            <h3 className="text-xs sm:text-sm font-bold text-white uppercase tracking-wider">
              Month Spending by Category
            </h3>
          </div>
          <span className="text-xs font-bold text-slate-400">
            {formatSAR(monthSpending)} Total
          </span>
        </div>

        {categoryBreakdown.length === 0 ? (
          <p className="text-xs text-slate-400 py-4 text-center">
            No expenses recorded for this month yet.
          </p>
        ) : (
          <div className="space-y-3 pt-1">
            {categoryBreakdown.map((cat) => (
              <div key={cat.id} className="space-y-1.5">
                <div className="flex items-center justify-between text-xs sm:text-sm gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <span
                      className="w-2.5 h-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: cat.color }}
                    />
                    <span className="font-semibold text-slate-200 truncate">{cat.name}</span>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-slate-400 text-[11px]">
                      {cat.percentage.toFixed(0)}%
                    </span>
                    <span className="font-bold text-white whitespace-nowrap">
                      {formatSAR(cat.amount)}
                    </span>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="w-full h-2 bg-black/40 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${Math.min(100, Math.max(2, cat.percentage))}%`,
                      backgroundColor: cat.color,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Account Balances Breakdown */}
      <div className="p-4 sm:p-5 rounded-3xl bg-white/5 border border-white/10 space-y-3">
        <h3 className="text-xs sm:text-sm font-bold text-white uppercase tracking-wider">
          Accounts Balance Breakdown
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {accounts.map((acc) => (
            <div
              key={acc.id}
              className="p-3.5 rounded-2xl bg-black/30 border border-white/5 flex items-center justify-between gap-2"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div
                  className="w-3 h-3 rounded-full shrink-0"
                  style={{ backgroundColor: acc.color || '#8b5cf6' }}
                />
                <span className="text-xs sm:text-sm font-bold text-slate-200 truncate">{acc.name}</span>
              </div>
              <span className="text-xs sm:text-sm font-black text-emerald-300 whitespace-nowrap">
                {formatSAR(Number(acc.currentBalance))}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

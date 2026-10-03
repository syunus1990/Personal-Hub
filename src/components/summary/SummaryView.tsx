import React from 'react';
import {
  BarChart3,
  CheckSquare,
  Wallet,
  FileText,
  Calendar,
  ArrowRight,
  Landmark,
} from 'lucide-react';
import { Task, MoneyAccount, ExpenseCategory, Transaction, Note, Loan, LoanPayment, ExchangeRateRecord } from '../../types';
import { isDateOverdue, isDateToday } from '../../utils/dateUtils';
import { calculateLoanDetails } from '../../utils/exchangeRate';
import { formatSAR } from '../../utils/currencyFormatter';

interface SummaryViewProps {
  tasks: Task[];
  accounts: MoneyAccount[];
  categories: ExpenseCategory[];
  transactions: Transaction[];
  notes: Note[];
  loans: Loan[];
  loanPayments: LoanPayment[];
  exchangeRate: ExchangeRateRecord;
  onNavigateToFollowUp: (tab?: string) => void;
  onNavigateToExpenses: () => void;
  onNavigateToLoans: () => void;
  onNavigateToWishlist: () => void;
  onNavigateToNotes: () => void;
  onNavigateToCalendar: () => void;
}

export const SummaryView: React.FC<SummaryViewProps> = ({
  tasks,
  accounts,
  transactions,
  notes,
  loans,
  loanPayments,
  exchangeRate,
  onNavigateToFollowUp,
  onNavigateToExpenses,
  onNavigateToLoans,
  onNavigateToNotes,
  onNavigateToCalendar,
}) => {
  // Tasks stats
  const pendingTasks = tasks.filter((t) => t.status === 'Pending' && t.completionPercentage < 100).length;
  const inProgressTasks = tasks.filter((t) => t.status === 'In Progress' && t.completionPercentage < 100).length;
  const completedTasks = tasks.filter((t) => t.status === 'Completed' || t.completionPercentage >= 100).length;
  const dueTodayTasks = tasks.filter(
    (t) => t.status !== 'Completed' && t.completionPercentage < 100 && isDateToday(t.followUpDate)
  ).length;
  const overdueTasks = tasks.filter(
    (t) => t.status !== 'Completed' && t.completionPercentage < 100 && isDateOverdue(t.followUpDate)
  ).length;
  const wishlistTasks = tasks.filter((t) => t.category === 'Wishlist' && t.status !== 'Completed').length;

  // Money stats
  const totalMoney = accounts.reduce((sum, a) => sum + (Number(a.currentBalance) || 0), 0);

  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = String(now.getMonth() + 1).padStart(2, '0');
  const monthPrefix = `${currentYear}-${currentMonth}`;

  const currentMonthExpenses = transactions
    .filter((tx) => tx.type === 'Expense' && tx.date.startsWith(monthPrefix))
    .reduce((sum, tx) => sum + (Number(tx.amount) || 0), 0);

  // Loans stats
  let totalOutstandingLoansSar = 0;
  let totalPaidLoansSar = 0;
  let activeLoansCount = 0;
  loans.forEach((loan) => {
    const stats = calculateLoanDetails(loan, loanPayments, exchangeRate.rateInrToSar);
    if (!stats.isCompleted) {
      totalOutstandingLoansSar += stats.currentRemainingInSar;
      activeLoansCount += 1;
    }
    totalPaidLoansSar += stats.totalPaidInSar;
  });

  return (
    <div className="p-4 sm:p-5 space-y-4 pb-24 max-w-5xl mx-auto animate-fade-in">
      {/* Header card */}
      <div className="p-4 sm:p-5 rounded-3xl bg-purple-950/30 border border-purple-500/20 backdrop-blur-xl flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-purple-600/30 border border-purple-500/40 text-purple-300 flex items-center justify-center shadow-lg shadow-purple-950/50 shrink-0">
            <BarChart3 className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-bold text-white tracking-tight">
              Personal Hub Summary
            </h2>
            <p className="text-xs text-slate-300">
              Live overview of all productivity, finances & loan obligations
            </p>
          </div>
        </div>
      </div>

      {/* 1. FollowUp & Tasks Overview */}
      <div className="p-4 sm:p-5 rounded-3xl bg-white/5 border border-white/10 backdrop-blur-xl space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <CheckSquare className="w-4 h-4 text-violet-400 shrink-0" />
            <h3 className="text-xs sm:text-sm font-bold text-white uppercase tracking-wider">
              FollowUp & Tasks
            </h3>
          </div>
          <button
            type="button"
            onClick={() => onNavigateToFollowUp('Dashboard')}
            className="text-xs font-bold text-violet-300 hover:text-white flex items-center gap-1 cursor-pointer min-h-[32px] px-2 py-1 rounded-xl hover:bg-white/5"
          >
            <span>Open Tasks</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
          <div className="p-3 sm:p-3.5 rounded-2xl bg-black/40 border border-white/5">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              Pending
            </span>
            <span className="text-lg sm:text-xl font-black text-amber-300">{pendingTasks}</span>
          </div>

          <div className="p-3 sm:p-3.5 rounded-2xl bg-black/40 border border-white/5">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              In Progress
            </span>
            <span className="text-lg sm:text-xl font-black text-violet-300">{inProgressTasks}</span>
          </div>

          <div className="p-3 sm:p-3.5 rounded-2xl bg-black/40 border border-white/5">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              Completed
            </span>
            <span className="text-lg sm:text-xl font-black text-emerald-300">{completedTasks}</span>
          </div>

          <div className="p-3 sm:p-3.5 rounded-2xl bg-black/40 border border-white/5">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              Due Today
            </span>
            <span className="text-lg sm:text-xl font-black text-blue-300">{dueTodayTasks}</span>
          </div>

          <div className="p-3 sm:p-3.5 rounded-2xl bg-black/40 border border-white/5">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              Overdue
            </span>
            <span className="text-lg sm:text-xl font-black text-rose-300">{overdueTasks}</span>
          </div>

          <div className="p-3 sm:p-3.5 rounded-2xl bg-black/40 border border-white/5">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              Wishlist Items
            </span>
            <span className="text-lg sm:text-xl font-black text-amber-400">{wishlistTasks}</span>
          </div>
        </div>
      </div>

      {/* 2. Loans & Liabilities Overview */}
      <div className="p-4 sm:p-5 rounded-3xl bg-white/5 border border-white/10 backdrop-blur-xl space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Landmark className="w-4 h-4 text-amber-400 shrink-0" />
            <h3 className="text-xs sm:text-sm font-bold text-white uppercase tracking-wider">
              Loans (INR & ⃁)
            </h3>
          </div>
          <button
            type="button"
            onClick={onNavigateToLoans}
            className="text-xs font-bold text-amber-300 hover:text-white flex items-center gap-1 cursor-pointer min-h-[32px] px-2 py-1 rounded-xl hover:bg-white/5"
          >
            <span>Open Loans</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="p-3.5 sm:p-4 rounded-2xl bg-amber-950/30 border border-amber-500/20">
            <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider block">
              Total Outstanding Balance
            </span>
            <span className="text-lg sm:text-xl font-black text-white block">
              {formatSAR(totalOutstandingLoansSar)}
            </span>
            <span className="text-[11px] text-slate-400 block mt-0.5">
              {activeLoansCount} active personal loans
            </span>
          </div>

          <div className="p-3.5 sm:p-4 rounded-2xl bg-emerald-950/30 border border-emerald-500/20">
            <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider block">
              Total Repaid in ⃁
            </span>
            <span className="text-lg sm:text-xl font-black text-emerald-300 block">
              {formatSAR(totalPaidLoansSar)}
            </span>
            <span className="text-[11px] text-slate-400 block mt-0.5">
              Cumulative historical payments
            </span>
          </div>

          <div className="p-3.5 sm:p-4 rounded-2xl bg-indigo-950/30 border border-indigo-500/20">
            <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider block">
              Exchange Rate
            </span>
            <span className="text-base sm:text-lg font-black text-white block">
              1 SAR = ₹{exchangeRate.rateSarToInr} INR
            </span>
            <span className="text-[11px] text-slate-400 block mt-0.5">
              (1 INR ≈ {exchangeRate.rateInrToSar} SAR)
            </span>
          </div>
        </div>
      </div>

      {/* 3. Expenses & Accounts Overview */}
      <div className="p-4 sm:p-5 rounded-3xl bg-white/5 border border-white/10 backdrop-blur-xl space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Wallet className="w-4 h-4 text-emerald-400 shrink-0" />
            <h3 className="text-xs sm:text-sm font-bold text-white uppercase tracking-wider">
              Expenses & Accounts
            </h3>
          </div>
          <button
            type="button"
            onClick={onNavigateToExpenses}
            className="text-xs font-bold text-emerald-300 hover:text-white flex items-center gap-1 cursor-pointer min-h-[32px] px-2 py-1 rounded-xl hover:bg-white/5"
          >
            <span>Open Expenses</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="p-3.5 sm:p-4 rounded-2xl bg-emerald-950/30 border border-emerald-500/20">
            <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider block">
              Total Money Across Accounts
            </span>
            <span className="text-lg sm:text-xl font-black text-white block">
              {formatSAR(totalMoney)}
            </span>
            <span className="text-[11px] text-slate-400 block mt-0.5">
              {accounts.length} active accounts
            </span>
          </div>

          <div className="p-3.5 sm:p-4 rounded-2xl bg-rose-950/30 border border-rose-500/20">
            <span className="text-[10px] font-bold text-rose-400 uppercase tracking-wider block">
              Current Month Expenses
            </span>
            <span className="text-lg sm:text-xl font-black text-white block">
              {formatSAR(currentMonthExpenses)}
            </span>
            <span className="text-[11px] text-slate-400 block mt-0.5">
              Calendar month spending
            </span>
          </div>
        </div>

        {/* Mini accounts preview */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
          {accounts.map((acc) => (
            <div
              key={acc.id}
              className="p-3 rounded-xl bg-black/30 border border-white/5 flex items-center justify-between text-xs gap-2"
            >
              <div className="flex items-center gap-2 min-w-0">
                <span
                  className="w-2.5 h-2.5 rounded-full shrink-0"
                  style={{ backgroundColor: acc.color || '#8b5cf6' }}
                />
                <span className="font-semibold text-slate-200 truncate">{acc.name}</span>
              </div>
              <span className="font-bold text-emerald-300 whitespace-nowrap">
                {formatSAR(Number(acc.currentBalance))}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* 4. Notes & Calendar Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {/* Notes */}
        <div
          onClick={onNavigateToNotes}
          className="p-4 sm:p-5 rounded-3xl bg-white/5 hover:bg-white/10 border border-white/10 backdrop-blur-xl transition-all cursor-pointer space-y-2"
        >
          <div className="flex items-center justify-between text-blue-400">
            <FileText className="w-4 h-4" />
            <ArrowRight className="w-3.5 h-3.5" />
          </div>
          <div>
            <span className="text-xl font-black text-white">{notes.length}</span>
            <span className="text-xs font-bold text-slate-300 block">
              Saved Notes
            </span>
            <p className="text-[11px] text-slate-400 mt-1">
              Private memos & thoughts
            </p>
          </div>
        </div>

        {/* Calendar */}
        <div
          onClick={onNavigateToCalendar}
          className="p-4 sm:p-5 rounded-3xl bg-white/5 hover:bg-white/10 border border-white/10 backdrop-blur-xl transition-all cursor-pointer space-y-2"
        >
          <div className="flex items-center justify-between text-cyan-400">
            <Calendar className="w-4 h-4" />
            <ArrowRight className="w-3.5 h-3.5" />
          </div>
          <div>
            <span className="text-xl font-black text-white">
              {dueTodayTasks + overdueTasks}
            </span>
            <span className="text-xs font-bold text-slate-300 block">
              Active Agenda
            </span>
            <p className="text-[11px] text-slate-400 mt-1">
              Follow-ups needing attention
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

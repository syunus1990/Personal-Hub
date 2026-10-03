import React from 'react';
import {
  CheckSquare,
  Wallet,
  FileText,
  BarChart3,
  AlertCircle,
  Clock,
  ArrowUpRight,
  PlusCircle,
  Edit3,
  CreditCard,
  Zap,
} from 'lucide-react';
import {
  Task,
  MoneyAccount,
  Transaction,
  Note,
  Loan,
  LoanPayment,
  ExchangeRateRecord,
} from '../../types';
import { isDateOverdue, isDateToday } from '../../utils/dateUtils';
import { calculateLoanDetails } from '../../utils/exchangeRate';
import { formatSAR } from '../../utils/currencyFormatter';
import { SarSymbol } from '../common/SarSymbol';

interface HomeScreenProps {
  tasks: Task[];
  accounts: MoneyAccount[];
  transactions: Transaction[];
  notes: Note[];
  loans: Loan[];
  loanPayments: LoanPayment[];
  exchangeRate: ExchangeRateRecord;
  onNavigateToFollowUp: (tab?: string) => void;
  onNavigateToMoney: (subTab?: 'expenses' | 'accounts' | 'loans') => void;
  onNavigateToNotes: () => void;
  onNavigateToSummary: () => void;
  onQuickNewTask: () => void;
  onQuickNewExpense: () => void;
  onQuickNewNote: () => void;
  onQuickLoanPayment: () => void;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({
  tasks,
  accounts,
  transactions,
  notes,
  loans,
  loanPayments,
  exchangeRate,
  onNavigateToFollowUp,
  onNavigateToMoney,
  onNavigateToNotes,
  onNavigateToSummary,
  onQuickNewTask,
  onQuickNewExpense,
  onQuickNewNote,
  onQuickLoanPayment,
}) => {
  // 1. FollowUp & Wishlist statistics
  let activeChasingCount = 0;
  let dueTodayCount = 0;
  let overdueCount = 0;
  let wishlistCount = 0;

  tasks.forEach((t) => {
    const isCompleted = t.status === 'Completed' || t.completionPercentage === 100;
    if (t.category === 'Wishlist') {
      if (!isCompleted) wishlistCount += 1;
    } else {
      if (!isCompleted) {
        activeChasingCount += 1;
        if (isDateToday(t.followUpDate)) dueTodayCount += 1;
        if (isDateOverdue(t.followUpDate)) overdueCount += 1;
      }
    }
  });

  // 2. Money statistics
  const totalMoneySar = accounts.reduce((sum, acc) => sum + (Number(acc.currentBalance) || 0), 0);

  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = String(now.getMonth() + 1).padStart(2, '0');
  const monthPrefix = `${currentYear}-${currentMonth}`;

  const currentMonthSpendingSar = transactions
    .filter((tx) => tx.type === 'Expense' && tx.date.startsWith(monthPrefix))
    .reduce((sum, tx) => sum + (Number(tx.amount) || 0), 0);

  // 3. Loans statistics
  let totalOutstandingLoansSar = 0;
  loans.forEach((loan) => {
    const stats = calculateLoanDetails(loan, loanPayments, exchangeRate.rateInrToSar);
    if (!stats.isCompleted) {
      totalOutstandingLoansSar += stats.currentRemainingInSar;
    }
  });

  return (
    <div id="home-screen" className="p-3.5 sm:p-4 space-y-4 pb-24 max-w-4xl mx-auto">
      {/* 1. PERSONAL HUB BANNER */}
      <div className="p-5 sm:p-6 rounded-[2rem] bg-gradient-to-br from-violet-950/40 via-[#13151c]/90 to-[#0d0e12] border border-white/15 backdrop-blur-2xl relative overflow-hidden shadow-2xl">
        <div className="absolute top-0 right-0 w-44 h-44 bg-violet-600/15 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 space-y-4">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-widest text-violet-300 block mb-1">
              Personal Dashboard
            </span>
            <h2 className="text-2xl font-black text-white tracking-tight">
              Personal Hub
            </h2>
            <p className="text-xs text-slate-300 mt-1">
              Private tasks, expenses, loans & notes in one place
            </p>
          </div>

          {/* Quick Actions Strip */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-white/10">
            <button
              type="button"
              id="btn-quick-new-task"
              onClick={onQuickNewTask}
              className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-2xl bg-white/10 hover:bg-white/15 border border-white/15 text-slate-100 text-xs font-bold cursor-pointer transition-all active:scale-[0.97] shadow-sm min-h-[44px]"
            >
              <PlusCircle className="w-4 h-4 text-violet-400 shrink-0" />
              <span className="whitespace-nowrap">+ New Task</span>
            </button>

            <button
              type="button"
              id="btn-quick-new-expense"
              onClick={onQuickNewExpense}
              className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-2xl bg-white/10 hover:bg-white/15 border border-white/15 text-slate-100 text-xs font-bold cursor-pointer transition-all active:scale-[0.97] shadow-sm min-h-[44px]"
            >
              <SarSymbol className="text-emerald-400 text-sm" />
              <span className="whitespace-nowrap">+ Expense</span>
            </button>

            <button
              type="button"
              id="btn-quick-new-note"
              onClick={onQuickNewNote}
              className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-2xl bg-white/10 hover:bg-white/15 border border-white/15 text-slate-100 text-xs font-bold cursor-pointer transition-all active:scale-[0.97] shadow-sm min-h-[44px]"
            >
              <Edit3 className="w-4 h-4 text-blue-400 shrink-0" />
              <span className="whitespace-nowrap">+ Quick Note</span>
            </button>

            <button
              type="button"
              id="btn-quick-loan-payment"
              onClick={onQuickLoanPayment}
              className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-2xl bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 text-amber-200 text-xs font-bold cursor-pointer transition-all active:scale-[0.97] shadow-sm min-h-[44px]"
            >
              <CreditCard className="w-4 h-4 text-amber-400 shrink-0" />
              <span className="whitespace-nowrap">+ Loan Pay</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2-COLUMN RESPONSIVE PRIMARY MODULE CARDS - CLEAN WITHOUT SUMMARY PER USER REQUIREMENT */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
        {/* CARD 1: FOLLOW UP & WISHLIST */}
        <div
          id="card-launcher-followup-wishlist"
          onClick={() => onNavigateToFollowUp('Active')}
          className="group p-5 rounded-[2rem] bg-white/5 hover:bg-white/10 border border-white/15 hover:border-violet-500/40 backdrop-blur-2xl transition-all cursor-pointer shadow-xl active:scale-[0.98] flex flex-col justify-between min-h-[140px]"
        >
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-violet-600/30 text-violet-300 border border-violet-500/40 flex items-center justify-center shadow-lg shadow-violet-950/40 shrink-0">
                <CheckSquare className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white tracking-tight group-hover:text-violet-300 transition-colors">
                  FOLLOW UP & WISHLIST
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Things I need to chase, do or remember
                </p>
              </div>
            </div>
            <div className="w-8 h-8 rounded-full bg-white/10 border border-white/10 flex items-center justify-center text-slate-300 group-hover:text-white group-hover:bg-violet-600/40 transition-colors shrink-0">
              <ArrowUpRight className="w-4 h-4" />
            </div>
          </div>

          <div className="mt-4 flex items-center justify-between text-xs text-violet-300 font-semibold pt-3 border-t border-white/10">
            <span>Open Follow Up & Wishlist</span>
            <span className="text-[11px] text-slate-400 group-hover:translate-x-1 transition-transform">Tap to enter →</span>
          </div>
        </div>

        {/* CARD 2: MONEY */}
        <div
          id="card-launcher-money"
          onClick={() => onNavigateToMoney('expenses')}
          className="group p-5 rounded-[2rem] bg-white/5 hover:bg-white/10 border border-white/15 hover:border-emerald-500/40 backdrop-blur-2xl transition-all cursor-pointer shadow-xl active:scale-[0.98] flex flex-col justify-between min-h-[140px]"
        >
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-emerald-600/30 text-emerald-300 border border-emerald-500/40 flex items-center justify-center shadow-lg shadow-emerald-950/40 shrink-0">
                <Wallet className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white tracking-tight group-hover:text-emerald-300 transition-colors">
                  MONEY
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Accounts, daily expenses & loans
                </p>
              </div>
            </div>
            <div className="w-8 h-8 rounded-full bg-white/10 border border-white/10 flex items-center justify-center text-slate-300 group-hover:text-white group-hover:bg-emerald-600/40 transition-colors shrink-0">
              <ArrowUpRight className="w-4 h-4" />
            </div>
          </div>

          <div className="mt-4 flex items-center justify-between text-xs text-emerald-300 font-semibold pt-3 border-t border-white/10">
            <span>Open Money Hub</span>
            <span className="text-[11px] text-slate-400 group-hover:translate-x-1 transition-transform">Tap to enter →</span>
          </div>
        </div>

        {/* CARD 3: NOTES */}
        <div
          id="card-launcher-notes"
          onClick={onNavigateToNotes}
          className="group p-5 rounded-[2rem] bg-white/5 hover:bg-white/10 border border-white/15 hover:border-blue-500/40 backdrop-blur-2xl transition-all cursor-pointer shadow-xl active:scale-[0.98] flex flex-col justify-between min-h-[140px]"
        >
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-blue-600/30 text-blue-300 border border-blue-500/40 flex items-center justify-center shadow-lg shadow-blue-950/40 shrink-0">
                <FileText className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white tracking-tight group-hover:text-blue-300 transition-colors">
                  PERSONAL NOTES
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Quick notes, memos & personal information
                </p>
              </div>
            </div>
            <div className="w-8 h-8 rounded-full bg-white/10 border border-white/10 flex items-center justify-center text-slate-300 group-hover:text-white group-hover:bg-blue-600/40 transition-colors shrink-0">
              <ArrowUpRight className="w-4 h-4" />
            </div>
          </div>

          <div className="mt-4 flex items-center justify-between text-xs text-blue-300 font-semibold pt-3 border-t border-white/10">
            <span>Open Personal Notes</span>
            <span className="text-[11px] text-slate-400 group-hover:translate-x-1 transition-transform">Tap to enter →</span>
          </div>
        </div>

        {/* CARD 4: SUMMARY & ANALYTICS */}
        <div
          id="card-launcher-summary"
          onClick={onNavigateToSummary}
          className="group p-5 rounded-[2rem] bg-white/5 hover:bg-white/10 border border-white/15 hover:border-purple-500/40 backdrop-blur-2xl transition-all cursor-pointer shadow-xl active:scale-[0.98] flex flex-col justify-between min-h-[140px]"
        >
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-purple-600/30 text-purple-300 border border-purple-500/40 flex items-center justify-center shadow-lg shadow-purple-950/40 shrink-0">
                <BarChart3 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white tracking-tight group-hover:text-purple-300 transition-colors">
                  OVERVIEW REPORT
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Complete personal summary & balances
                </p>
              </div>
            </div>
            <div className="w-8 h-8 rounded-full bg-white/10 border border-white/10 flex items-center justify-center text-slate-300 group-hover:text-white group-hover:bg-purple-600/40 transition-colors shrink-0">
              <ArrowUpRight className="w-4 h-4" />
            </div>
          </div>

          <div className="mt-4 flex items-center justify-between text-xs text-purple-300 font-semibold pt-3 border-t border-white/10">
            <span>View Full Summary</span>
            <span className="text-[11px] text-slate-400 group-hover:translate-x-1 transition-transform">Tap to enter →</span>
          </div>
        </div>
      </div>
    </div>
  );
};

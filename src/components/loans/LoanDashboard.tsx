import React, { useState } from 'react';
import {
  Landmark,
  Plus,
  RefreshCw,
  Search,
  CreditCard,
  TrendingDown,
  Users,
  ChevronRight,
  Sparkles,
  CheckCircle2,
  Clock,
} from 'lucide-react';
import { Loan, LoanPayment, Contributor, ExchangeRateRecord, MoneyAccount } from '../../types';
import { calculateLoanDetails } from '../../utils/exchangeRate';
import { formatDate } from '../../utils/dateUtils';
import { formatSAR, formatINR, formatSmartNumber } from '../../utils/currencyFormatter';

interface LoanDashboardProps {
  loans: Loan[];
  payments: LoanPayment[];
  contributors: Contributor[];
  accounts: MoneyAccount[];
  exchangeRate: ExchangeRateRecord;
  isRefreshingRate: boolean;
  onRefreshExchangeRate: () => void;
  onOpenCreateLoan: () => void;
  onOpenAddPayment: (loanId?: string) => void;
  onOpenManageContributors: () => void;
  onSelectLoan: (loan: Loan) => void;
}

type LoanFilter = 'all' | 'active' | 'completed' | 'inr' | 'sar';

export const LoanDashboard: React.FC<LoanDashboardProps> = ({
  loans,
  payments,
  contributors,
  exchangeRate,
  isRefreshingRate,
  onRefreshExchangeRate,
  onOpenCreateLoan,
  onOpenAddPayment,
  onOpenManageContributors,
  onSelectLoan,
}) => {
  const [filter, setFilter] = useState<LoanFilter>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Calculate totals across all active loans
  let totalOutstandingSar = 0;
  let totalPaidSarAll = 0;
  let activeLoansCount = 0;
  let completedLoansCount = 0;

  const loansWithStats = loans.map((loan) => {
    const stats = calculateLoanDetails(loan, payments, exchangeRate.rateInrToSar);
    if (!stats.isCompleted) {
      totalOutstandingSar += stats.currentRemainingInSar;
      activeLoansCount += 1;
    } else {
      completedLoansCount += 1;
    }
    totalPaidSarAll += stats.totalPaidInSar;
    return {
      loan,
      stats,
    };
  });

  // Filter loans
  const filteredLoans = loansWithStats.filter(({ loan, stats }) => {
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = loan.name.toLowerCase().includes(q);
      const matchLender = loan.lenderName?.toLowerCase().includes(q) || false;
      const matchRemark = loan.remark?.toLowerCase().includes(q) || false;
      if (!matchName && !matchLender && !matchRemark) return false;
    }

    if (filter === 'active') return !stats.isCompleted;
    if (filter === 'completed') return stats.isCompleted;
    if (filter === 'inr') return loan.originalCurrency === 'INR';
    if (filter === 'sar') return loan.originalCurrency === 'SAR';
    return true;
  });

  return (
    <div id="loan-dashboard" className="space-y-4 sm:space-y-6 animate-fade-in max-w-5xl mx-auto pb-12">
      {/* Header & Main Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3.5">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2 flex-wrap">
            <span>Loans</span>
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800/40">
              INR & SAR Tracker
            </span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Track personal loans with live ⃁ conversion & contributor logging
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            id="manage-contributors-btn"
            onClick={onOpenManageContributors}
            className="flex items-center gap-1.5 px-3 py-2 rounded-2xl bg-white/80 dark:bg-slate-800/80 border border-slate-200/60 dark:border-slate-700/60 text-slate-700 dark:text-slate-200 text-xs sm:text-sm font-semibold hover:bg-white dark:hover:bg-slate-800 transition-all shadow-sm min-h-[40px]"
          >
            <Users className="w-4 h-4 text-indigo-500 shrink-0" />
            <span>Contributors ({contributors.length})</span>
          </button>
          <button
            id="dashboard-record-payment-btn"
            onClick={() => onOpenAddPayment()}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm font-bold transition-all shadow-md shadow-emerald-600/20 min-h-[40px]"
          >
            <CreditCard className="w-4 h-4 shrink-0" />
            <span>Record Payment</span>
          </button>
          <button
            id="create-loan-btn"
            onClick={onOpenCreateLoan}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-2xl bg-amber-600 hover:bg-amber-700 text-white text-xs sm:text-sm font-bold transition-all shadow-md shadow-amber-600/20 min-h-[40px]"
          >
            <Plus className="w-4 h-4 shrink-0" />
            <span>New Loan</span>
          </button>
        </div>
      </div>

      {/* Exchange Rate Live Banner */}
      <div
        id="exchange-rate-banner"
        className="p-3.5 sm:p-4 rounded-3xl bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-indigo-500/10 dark:from-amber-950/40 dark:via-slate-900/40 dark:to-indigo-950/40 border border-amber-500/20 dark:border-amber-500/20 backdrop-blur-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-sm"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-amber-500/20 text-amber-700 dark:text-amber-300 flex items-center justify-center font-black text-sm shrink-0">
            ₹⇄⃁
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs sm:text-sm font-extrabold text-slate-900 dark:text-white">
                1 SAR = ₹{exchangeRate.rateSarToInr} INR
              </span>
              <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                (1 INR ≈ {exchangeRate.rateInrToSar} SAR)
              </span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
              Source: {exchangeRate.source}
            </p>
          </div>
        </div>

        <button
          id="refresh-rate-btn"
          onClick={onRefreshExchangeRate}
          disabled={isRefreshingRate}
          className="self-end sm:self-center flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-600/10 hover:bg-amber-600/20 text-amber-800 dark:text-amber-300 text-xs font-bold transition-all disabled:opacity-50 min-h-[34px]"
        >
          <RefreshCw
            className={`w-3.5 h-3.5 ${isRefreshingRate ? 'animate-spin text-amber-600' : ''}`}
          />
          <span>{isRefreshingRate ? 'Updating...' : 'Refresh Rate'}</span>
        </button>
      </div>

      {/* Summary KPI Cards - Responsive 1-col on mobile, 3-col on desktop */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
        {/* Total Outstanding SAR */}
        <div className="p-4 sm:p-5 rounded-3xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-white/60 dark:border-slate-800/80 shadow-md">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-semibold uppercase tracking-wider">
            <span>Total Outstanding</span>
            <TrendingDown className="w-4 h-4 text-rose-500" />
          </div>
          <div className="mt-2 text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
            {formatSAR(totalOutstandingSar)}
          </div>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            Across {activeLoansCount} active personal {activeLoansCount === 1 ? 'loan' : 'loans'}
          </p>
        </div>

        {/* Active & Completed Count */}
        <div className="p-4 sm:p-5 rounded-3xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-white/60 dark:border-slate-800/80 shadow-md">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-semibold uppercase tracking-wider">
            <span>Status Overview</span>
            <Landmark className="w-4 h-4 text-amber-500" />
          </div>
          <div className="mt-2 flex items-baseline gap-2 flex-wrap">
            <span className="text-xl sm:text-2xl font-black text-amber-600 dark:text-amber-400">
              {activeLoansCount} Active
            </span>
            <span className="text-xs text-slate-500 dark:text-slate-400">
              / {completedLoansCount} Paid Off
            </span>
          </div>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            {loans.length} total tracked loan accounts
          </p>
        </div>

        {/* Total Repaid */}
        <div className="p-4 sm:p-5 rounded-3xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-white/60 dark:border-slate-800/80 shadow-md">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-semibold uppercase tracking-wider">
            <span>Total Repaid Value</span>
            <Sparkles className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="mt-2 text-xl sm:text-2xl font-black text-emerald-600 dark:text-emerald-400 tracking-tight">
            {formatSAR(totalPaidSarAll)}
          </div>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            Cumulative repayments recorded
          </p>
        </div>
      </div>

      {/* Controls Bar: Search & Filter Tabs */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Filter Tabs */}
        <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-slate-200/60 dark:bg-slate-800/60 border border-slate-300/40 dark:border-slate-700/40 overflow-x-auto">
          {[
            { id: 'all', label: 'All' },
            { id: 'active', label: `Active (${activeLoansCount})` },
            { id: 'completed', label: `Paid Off (${completedLoansCount})` },
            { id: 'inr', label: 'INR (₹)' },
            { id: 'sar', label: 'SAR (⃁)' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilter(tab.id as LoanFilter)}
              className={`px-3 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all min-h-[36px] ${
                filter === tab.id
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search input */}
        <div className="relative min-w-[200px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            id="search-loans-input"
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search loans, lenders..."
            className="w-full pl-9 pr-4 py-2.5 rounded-2xl bg-white/80 dark:bg-slate-800/80 border border-slate-200/60 dark:border-slate-700/60 text-slate-900 dark:text-white text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/40 shadow-sm min-h-[40px]"
          />
        </div>
      </div>

      {/* Loans Cards Grid */}
      {filteredLoans.length === 0 ? (
        <div className="p-10 text-center rounded-3xl bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl border border-dashed border-slate-300 dark:border-slate-700">
          <Landmark className="w-12 h-12 mx-auto text-slate-400 mb-3" />
          <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">
            No loans match your criteria
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
            {loans.length === 0
              ? 'Start by creating your first personal loan in INR or SAR.'
              : 'Try clearing the search or switching filter tabs.'}
          </p>
          {loans.length === 0 && (
            <button
              onClick={onOpenCreateLoan}
              className="mt-4 px-5 py-2.5 rounded-2xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold transition-all shadow-md shadow-amber-600/20"
            >
              + Create First Loan
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredLoans.map(({ loan, stats }) => {
            const lastPayment = payments
              .filter((p) => p.loanId === loan.id)
              .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];

            return (
              <div
                key={loan.id}
                id={`loan-card-${loan.id}`}
                onClick={() => onSelectLoan(loan)}
                className="p-4 sm:p-5 rounded-3xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-white/60 dark:border-slate-800/80 shadow-md hover:shadow-xl hover:border-amber-300 dark:hover:border-amber-600/50 transition-all cursor-pointer group flex flex-col justify-between"
              >
                <div>
                  {/* Top tags & status */}
                  <div className="flex items-center justify-between gap-2 mb-2.5">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider ${
                          loan.originalCurrency === 'INR'
                            ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                            : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                        }`}
                      >
                        {loan.originalCurrency === 'INR' ? '₹ INR Loan' : '⃁ SAR Loan'}
                      </span>
                      {stats.isCompleted ? (
                        <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-teal-100 text-teal-800 dark:bg-teal-950/60 dark:text-teal-300 flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>Paid Off</span>
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-indigo-50 text-indigo-700 dark:bg-indigo-950/50 dark:text-indigo-300 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          <span>Active</span>
                        </span>
                      )}
                    </div>

                    <span className="text-xs text-slate-400 group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors flex items-center gap-0.5">
                      <span>Details</span>
                      <ChevronRight className="w-4 h-4" />
                    </span>
                  </div>

                  {/* Title & Lender */}
                  <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
                    {loan.name}
                  </h3>
                  {loan.lenderName && (
                    <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1 mt-0.5">
                      <Landmark className="w-3.5 h-3.5 shrink-0" />
                      <span>{loan.lenderName}</span>
                    </p>
                  )}

                  {/* Remaining Amount & SAR equivalent */}
                  <div className="mt-3.5 p-3 rounded-2xl bg-slate-50/90 dark:bg-slate-800/50 border border-slate-200/50 dark:border-slate-700/50 space-y-1.5">
                    <div className="flex items-baseline justify-between gap-2">
                      <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                        Remaining
                      </span>
                      <span className="text-base sm:text-lg font-black text-slate-900 dark:text-white">
                        {loan.originalCurrency === 'INR'
                          ? formatINR(stats.remainingInOriginalCurrency)
                          : formatSAR(stats.remainingInOriginalCurrency)}
                      </span>
                    </div>

                    {loan.originalCurrency === 'INR' && (
                      <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-200/40 dark:border-slate-700/40">
                        <span className="text-amber-700 dark:text-amber-400 font-medium">
                          Current ⃁ Value:
                        </span>
                        <span className="font-bold text-amber-800 dark:text-amber-300">
                          {formatSAR(stats.currentRemainingInSar, { showApprox: true })}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Progress bar and footer */}
                <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/80 space-y-2">
                  <div className="flex items-center justify-between text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                    <span>
                      Original:{' '}
                      {loan.originalCurrency === 'INR'
                        ? formatINR(loan.originalAmount)
                        : formatSAR(loan.originalAmount)}
                    </span>
                    <span className="text-indigo-600 dark:text-indigo-400 font-bold">
                      {stats.paymentProgressPercentage}% Paid
                    </span>
                  </div>

                  <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${
                        stats.isCompleted
                          ? 'bg-emerald-500'
                          : 'bg-gradient-to-r from-amber-500 to-indigo-500'
                      }`}
                      style={{ width: `${stats.paymentProgressPercentage}%` }}
                    />
                  </div>

                  {lastPayment && (
                    <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center justify-between pt-1">
                      <span>Last: {formatDate(lastPayment.date)}</span>
                      <span>Paid by {lastPayment.paidBy}</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

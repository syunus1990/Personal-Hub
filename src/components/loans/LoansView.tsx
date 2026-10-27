import React, { useState } from 'react';
import {
  HandCoins,
  Plus,
  ArrowUpRight,
  ArrowDownLeft,
  Calendar,
  Phone,
  CheckCircle2,
  AlertCircle,
  Trash2,
  Edit2,
  CreditCard,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { SummaryCard } from '../common/SummaryCard';
import { formatCurrency, formatSecondaryEquivalent } from '../../utils/currency';
import { LoanType } from '../../types';

interface LoansViewProps {
  isEmbeddedSubSection?: boolean;
}

export const LoansView: React.FC<LoansViewProps> = ({ isEmbeddedSubSection = false }) => {
  const {
    loans,
    settings,
    openEditModal,
    deleteLoan,
    searchQuery,
  } = useApp();

  const [filterType, setFilterType] = useState<'all' | 'lent' | 'borrowed'>('all');

  const totalLentSAR = loans
    .filter((l) => l.type === 'lent')
    .reduce((acc, l) => acc + (l.amountSAR - l.repaidAmountSAR), 0);

  const totalBorrowedSAR = loans
    .filter((l) => l.type === 'borrowed')
    .reduce((acc, l) => acc + (l.amountSAR - l.repaidAmountSAR), 0);

  const netLoanPositionSAR = totalLentSAR - totalBorrowedSAR;

  const filteredLoans = loans.filter((l) => {
    if (filterType !== 'all' && l.type !== filterType) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = l.counterpartyName.toLowerCase().includes(q);
      const matchNotes = l.notes?.toLowerCase().includes(q) || false;
      return matchName || matchNotes;
    }
    return true;
  });

  return (
    <div className="space-y-4">
      {/* Summary Card (only if not embedded or as top compact widget) */}
      <SummaryCard
        title="Loans & Debt Ledger"
        badge="Lent (Receivable) vs Borrowed (Payable)"
        primaryLabel="Net Position (Lent - Borrowed)"
        primaryValue={formatCurrency(netLoanPositionSAR, settings.displayCurrency, settings.exchangeRateSARtoINR)}
        primarySubValue={formatSecondaryEquivalent(netLoanPositionSAR, settings.displayCurrency, settings.exchangeRateSARtoINR)}
        metrics={[
          {
            label: 'Total I Lent (Receivable)',
            value: formatCurrency(totalLentSAR, settings.displayCurrency, settings.exchangeRateSARtoINR),
            accentClass: 'text-emerald-600 dark:text-emerald-400',
          },
          {
            label: 'Total I Borrowed (Payable)',
            value: formatCurrency(totalBorrowedSAR, settings.displayCurrency, settings.exchangeRateSARtoINR),
            accentClass: 'text-rose-600 dark:text-rose-400',
          },
          {
            label: 'Active Records',
            value: `${loans.filter((l) => l.status === 'active').length} Active`,
            accentClass: 'text-blue-600 dark:text-blue-400',
          },
        ]}
        gradientFrom="from-blue-500/10"
        gradientTo="to-indigo-500/10"
      />

      {/* Control Bar */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-slate-100 dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 text-xs font-semibold">
          <button
            onClick={() => setFilterType('all')}
            className={`py-1 px-3 rounded-xl transition-all ${
              filterType === 'all'
                ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs font-bold border border-slate-200/60 dark:border-transparent'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            All ({loans.length})
          </button>
          <button
            onClick={() => setFilterType('lent')}
            className={`py-1 px-3 rounded-xl transition-all ${
              filterType === 'lent'
                ? 'bg-emerald-600 text-white shadow-xs font-bold'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            I Lent
          </button>
          <button
            onClick={() => setFilterType('borrowed')}
            className={`py-1 px-3 rounded-xl transition-all ${
              filterType === 'borrowed'
                ? 'bg-rose-600 text-white shadow-xs font-bold'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            I Borrowed
          </button>
        </div>

        <button
          onClick={() => openEditModal('loan')}
          className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs transition-colors shrink-0"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>New Loan</span>
        </button>
      </div>

      {/* Loan Cards List */}
      <div className="space-y-3">
        {filteredLoans.map((loan) => {
          const remaining = loan.amountSAR - loan.repaidAmountSAR;
          const progressPct = Math.min(100, Math.round((loan.repaidAmountSAR / loan.amountSAR) * 100));
          const isLent = loan.type === 'lent';

          return (
            <div
              key={loan.id}
              className="glass-card rounded-3xl p-4 border border-slate-200/80 dark:border-slate-800/80 hover:border-blue-400/80 transition-colors"
            >
              {/* Top Row: Counterparty & Type */}
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <div
                    className={`w-9 h-9 rounded-2xl flex items-center justify-center shrink-0 ${
                      isLent
                        ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400'
                        : 'bg-rose-100 text-rose-600 dark:bg-rose-950/60 dark:text-rose-400'
                    }`}
                  >
                    {isLent ? (
                      <ArrowUpRight className="w-4 h-4" />
                    ) : (
                      <ArrowDownLeft className="w-4 h-4" />
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <h4 className="text-xs font-bold text-slate-800 dark:text-slate-100">
                        {loan.counterpartyName}
                      </h4>
                      <span
                        className={`text-[10px] font-semibold px-2 py-0.5 rounded-md ${
                          isLent
                            ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300'
                            : 'bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300'
                        }`}
                      >
                        {isLent ? 'I Lent' : 'I Borrowed'}
                      </span>
                    </div>
                    {loan.counterpartyPhone && (
                      <div className="flex items-center gap-1 text-[10px] text-slate-400 mt-0.5">
                        <Phone className="w-3 h-3" />
                        <span>{loan.counterpartyPhone}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => openEditModal('loan', loan.id, loan)}
                    className="w-6 h-6 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                    title="Edit loan"
                  >
                    <Edit2 className="w-3 h-3" />
                  </button>
                  <button
                    onClick={() => deleteLoan(loan.id)}
                    className="w-6 h-6 rounded-lg flex items-center justify-center text-slate-400 hover:text-rose-500"
                    title="Delete loan"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              </div>

              {/* Progress & Balances */}
              <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800/80">
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <span className="text-slate-500 dark:text-slate-400">
                    Remaining: <strong className="text-slate-800 dark:text-slate-100 tabular-nums">{formatCurrency(remaining, settings.displayCurrency, settings.exchangeRateSARtoINR)}</strong>
                  </span>
                  <span className="text-[11px] text-slate-400 tabular-nums">
                    Total: {formatCurrency(loan.amountSAR, settings.displayCurrency, settings.exchangeRateSARtoINR)}
                  </span>
                </div>

                <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-300 ${
                      loan.status === 'repaid'
                        ? 'bg-emerald-500'
                        : isLent
                        ? 'bg-emerald-500'
                        : 'bg-rose-500'
                    }`}
                    style={{ width: `${progressPct}%` }}
                  />
                </div>

                <div className="flex items-center justify-between text-[11px] text-slate-400 mt-2">
                  <div className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    <span>Due: {loan.dueDate}</span>
                  </div>
                  <span>{progressPct}% Repaid</span>
                </div>

                {loan.notes && (
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 italic mt-2 bg-slate-50/50 dark:bg-slate-800/30 p-2 rounded-xl">
                    "{loan.notes}"
                  </p>
                )}

                {/* Actions: Record Repayment */}
                {loan.status !== 'repaid' && (
                  <div className="mt-3 flex items-center justify-end">
                    <button
                      onClick={() => openEditModal('repayment', loan.id, { loanId: loan.id, maxAmount: remaining })}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-purple-50 hover:bg-purple-100 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 text-xs font-semibold transition-colors"
                    >
                      <CreditCard className="w-3.5 h-3.5" />
                      <span>Record Repayment</span>
                    </button>
                  </div>
                )}
                {loan.status === 'repaid' && (
                  <div className="mt-2 flex items-center gap-1.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Fully Cleared & Settled</span>
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {filteredLoans.length === 0 && (
          <div className="text-center py-8 glass-card rounded-3xl text-slate-400 text-xs">
            No loan records found. Tap New Loan to track borrowed or lent funds.
          </div>
        )}
      </div>
    </div>
  );
};

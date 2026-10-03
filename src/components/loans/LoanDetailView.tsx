import React, { useState } from 'react';
import {
  ArrowLeft,
  Plus,
  Edit2,
  Trash2,
  Calendar,
  Landmark,
  User,
  Clock,
  TrendingDown,
  CheckCircle2,
  CreditCard,
  Percent,
} from 'lucide-react';
import { Loan, LoanPayment, ExchangeRateRecord, MoneyAccount, Contributor } from '../../types';
import { calculateLoanDetails } from '../../utils/exchangeRate';
import { formatDate } from '../../utils/dateUtils';
import { formatSAR, formatINR } from '../../utils/currencyFormatter';

interface LoanDetailViewProps {
  loan: Loan;
  payments: LoanPayment[];
  accounts: MoneyAccount[];
  contributors?: Contributor[];
  exchangeRate: ExchangeRateRecord;
  onBack: () => void;
  onOpenAddPayment: (loanId: string) => void;
  onOpenEditLoan?: (loan: Loan) => void;
  onDeleteLoan: (loanId: string) => void;
  onDeletePayment: (paymentId: string) => void;
}

export const LoanDetailView: React.FC<LoanDetailViewProps> = ({
  loan,
  payments,
  accounts,
  exchangeRate,
  onBack,
  onOpenAddPayment,
  onOpenEditLoan,
  onDeleteLoan,
  onDeletePayment,
}) => {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [paymentToDelete, setPaymentToDelete] = useState<string | null>(null);

  const loanPayments = payments
    .filter((p) => p.loanId === loan.id)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const stats = calculateLoanDetails(loan, payments, exchangeRate.rateInrToSar);

  return (
    <div id="loan-detail-view" className="space-y-4 sm:space-y-6 animate-fade-in max-w-4xl mx-auto pb-12">
      {/* Top Bar Navigation & Actions */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <button
          id="back-to-loans-btn"
          onClick={onBack}
          className="flex items-center gap-2 px-3.5 py-2 rounded-2xl bg-white/70 dark:bg-slate-800/70 border border-slate-200/60 dark:border-slate-700/60 text-slate-700 dark:text-slate-200 text-xs sm:text-sm font-semibold hover:bg-white dark:hover:bg-slate-800 transition-all shadow-sm min-h-[40px]"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Loans</span>
        </button>

        <div className="flex items-center gap-2">
          {onOpenEditLoan && (
            <button
              id="edit-loan-btn"
              onClick={() => onOpenEditLoan(loan)}
              className="p-2.5 rounded-2xl bg-white/70 dark:bg-slate-800/70 border border-slate-200/60 dark:border-slate-700/60 text-slate-600 dark:text-slate-300 hover:text-indigo-600 hover:bg-white dark:hover:bg-slate-800 transition-all shadow-sm min-h-[40px] min-w-[40px] flex items-center justify-center"
              title="Edit Loan"
            >
              <Edit2 className="w-4 h-4" />
            </button>
          )}
          <button
            id="delete-loan-btn"
            onClick={() => setShowDeleteConfirm(true)}
            className="p-2.5 rounded-2xl bg-white/70 dark:bg-slate-800/70 border border-slate-200/60 dark:border-slate-700/60 text-slate-600 dark:text-slate-300 hover:text-rose-600 hover:bg-white dark:hover:bg-slate-800 transition-all shadow-sm min-h-[40px] min-w-[40px] flex items-center justify-center"
            title="Delete Loan"
          >
            <Trash2 className="w-4 h-4" />
          </button>
          <button
            id="record-payment-top-btn"
            onClick={() => onOpenAddPayment(loan.id)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm font-semibold transition-all shadow-md shadow-emerald-600/20 min-h-[40px]"
          >
            <Plus className="w-4 h-4" />
            <span>Record Payment</span>
          </button>
        </div>
      </div>

      {/* Delete Loan Confirmation */}
      {showDeleteConfirm && (
        <div className="p-4 rounded-3xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/60 flex flex-col sm:flex-row items-center justify-between gap-3 animate-fade-in">
          <div className="text-center sm:text-left">
            <p className="text-sm font-bold text-rose-900 dark:text-rose-200">
              Delete &quot;{loan.name}&quot;?
            </p>
            <p className="text-xs text-rose-700 dark:text-rose-400 mt-0.5">
              This will also remove all associated payment logs for this loan.
            </p>
          </div>
          <div className="flex gap-2 shrink-0">
            <button
              onClick={() => setShowDeleteConfirm(false)}
              className="px-3.5 py-1.5 rounded-xl bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold"
            >
              Cancel
            </button>
            <button
              id="confirm-delete-loan-btn"
              onClick={() => onDeleteLoan(loan.id)}
              className="px-3.5 py-1.5 rounded-xl bg-rose-600 text-white text-xs font-semibold hover:bg-rose-700"
            >
              Confirm Delete
            </button>
          </div>
        </div>
      )}

      {/* Main Loan Header Card */}
      <div className="p-4 sm:p-6 rounded-3xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-white/60 dark:border-slate-800/80 shadow-lg relative overflow-hidden space-y-4">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 flex-wrap">
              <span
                className={`px-2.5 py-1 rounded-xl text-xs font-bold uppercase tracking-wider ${
                  loan.originalCurrency === 'INR'
                    ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                    : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                }`}
              >
                {loan.originalCurrency === 'INR' ? '₹ INR Loan' : '⃁ SAR Loan'}
              </span>
              <span
                className={`px-2.5 py-1 rounded-xl text-xs font-bold flex items-center gap-1 ${
                  stats.isCompleted
                    ? 'bg-teal-100 text-teal-800 dark:bg-teal-950/60 dark:text-teal-300'
                    : 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950/60 dark:text-indigo-300'
                }`}
              >
                {stats.isCompleted ? (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Completed</span>
                  </>
                ) : (
                  <>
                    <Clock className="w-3.5 h-3.5" />
                    <span>Active</span>
                  </>
                )}
              </span>
            </div>

            <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              {loan.name}
            </h1>

            <div className="flex flex-wrap items-center gap-3.5 text-xs text-slate-500 dark:text-slate-400 pt-1">
              {loan.lenderName && (
                <span className="flex items-center gap-1.5">
                  <Landmark className="w-4 h-4 text-slate-400 shrink-0" />
                  <span>{loan.lenderName}</span>
                </span>
              )}
              <span className="flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-slate-400 shrink-0" />
                <span>Started {formatDate(loan.startDate)}</span>
              </span>
            </div>

            {loan.remark && (
              <p className="text-xs text-slate-600 dark:text-slate-300 pt-1 italic">
                &quot;{loan.remark}&quot;
              </p>
            )}
          </div>

          {/* Quick Rate info for INR loans */}
          {loan.originalCurrency === 'INR' && (
            <div className="p-3 rounded-2xl bg-amber-500/10 dark:bg-amber-950/30 border border-amber-500/20 text-left sm:text-right">
              <span className="text-[11px] text-amber-700 dark:text-amber-400 font-medium block">
                Current Exchange Rate
              </span>
              <span className="text-xs sm:text-sm font-bold text-amber-900 dark:text-amber-200">
                1 SAR = ₹{exchangeRate.rateSarToInr} INR
              </span>
              <span className="text-[10px] text-slate-500 dark:text-slate-400 block mt-0.5">
                (1 INR ≈ {exchangeRate.rateInrToSar} SAR)
              </span>
            </div>
          )}
        </div>

        {/* Metric Cards Grid - Responsive 1-col on mobile, 3-col on desktop */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 pt-2">
          {/* Outstanding Remaining */}
          <div className="p-4 rounded-2xl bg-slate-50/80 dark:bg-slate-800/60 border border-slate-200/50 dark:border-slate-700/50">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
              <TrendingDown className="w-3.5 h-3.5 text-rose-500" />
              <span>Remaining Balance</span>
            </span>
            <div className="mt-1 text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
              {loan.originalCurrency === 'INR'
                ? formatINR(stats.remainingInOriginalCurrency)
                : formatSAR(stats.remainingInOriginalCurrency)}
            </div>
            {loan.originalCurrency === 'INR' && (
              <div className="mt-1 text-xs font-bold text-amber-600 dark:text-amber-400">
                {formatSAR(stats.currentRemainingInSar, { showApprox: true })}
              </div>
            )}
          </div>

          {/* Original Principal */}
          <div className="p-4 rounded-2xl bg-slate-50/80 dark:bg-slate-800/60 border border-slate-200/50 dark:border-slate-700/50">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
              <Landmark className="w-3.5 h-3.5 text-slate-400" />
              <span>Original Loan</span>
            </span>
            <div className="mt-1 text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
              {loan.originalCurrency === 'INR'
                ? formatINR(stats.originalAmount)
                : formatSAR(stats.originalAmount)}
            </div>
            {loan.originalCurrency === 'INR' && (
              <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                Original ⃁: {formatSAR(stats.originalSarEquivalent)}
              </div>
            )}
          </div>

          {/* Total Paid */}
          <div className="p-4 rounded-2xl bg-slate-50/80 dark:bg-slate-800/60 border border-slate-200/50 dark:border-slate-700/50">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
              <Percent className="w-3.5 h-3.5 text-emerald-500" />
              <span>Total Paid ({stats.paymentsCount})</span>
            </span>
            <div className="mt-1 text-xl sm:text-2xl font-black text-emerald-600 dark:text-emerald-400">
              {loan.originalCurrency === 'INR'
                ? formatINR(stats.totalPaidInOriginalCurrency)
                : formatSAR(stats.totalPaidInOriginalCurrency)}
            </div>
            <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              Total ⃁: {formatSAR(stats.totalPaidInSar)}
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="pt-2 space-y-1.5">
          <div className="flex items-center justify-between text-xs font-semibold">
            <span className="text-slate-600 dark:text-slate-300">
              Repayment Progress
            </span>
            <span className="text-indigo-600 dark:text-indigo-400 font-bold">
              {stats.paymentProgressPercentage}% Paid
            </span>
          </div>
          <div className="w-full h-3 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
            <div
              className={`h-full transition-all duration-500 rounded-full ${
                stats.isCompleted
                  ? 'bg-emerald-500'
                  : 'bg-gradient-to-r from-amber-500 via-indigo-500 to-emerald-500'
              }`}
              style={{ width: `${stats.paymentProgressPercentage}%` }}
            />
          </div>
        </div>
      </div>

      {/* Payment History Section */}
      <div className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
              Payment & Contribution History
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Historical installments preserve original exchange rate
            </p>
          </div>
          <button
            id="record-payment-section-btn"
            onClick={() => onOpenAddPayment(loan.id)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-sm min-h-[38px]"
          >
            <Plus className="w-4 h-4" />
            <span>Add Payment</span>
          </button>
        </div>

        {loanPayments.length === 0 ? (
          <div className="p-8 text-center rounded-3xl bg-white/60 dark:bg-slate-900/60 border border-dashed border-slate-300 dark:border-slate-700">
            <CreditCard className="w-10 h-10 mx-auto text-slate-400 mb-2" />
            <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
              No payments recorded yet
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Tap &quot;Record Payment&quot; to log an installment and update remaining balance.
            </p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {loanPayments.map((payment) => {
              const paymentRate = payment.exchangeRateUsed || exchangeRate.rateInrToSar || 0.045;
              const paymentSar =
                payment.currency === 'SAR'
                  ? payment.amount
                  : payment.amount * paymentRate;
              const paymentInr =
                payment.currency === 'INR'
                  ? payment.amount
                  : paymentRate > 0
                  ? payment.amount / paymentRate
                  : payment.amount * 22.22;

              const linkedAccount = accounts.find((a) => a.id === payment.accountId);

              return (
                <div
                  key={payment.id}
                  id={`loan-payment-row-${payment.id}`}
                  className="p-4 rounded-3xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-white/60 dark:border-slate-800/80 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 hover:border-emerald-300 dark:hover:border-emerald-700/50 transition-all"
                >
                  <div className="space-y-1.5 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
                        {payment.currency === 'INR'
                          ? formatINR(payment.amount)
                          : formatSAR(payment.amount)}
                      </span>
                      {payment.currency === 'INR' && (
                        <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-950/60 px-2 py-0.5 rounded-full">
                          {formatSAR(paymentSar, { showApprox: true })}
                        </span>
                      )}
                      {payment.currency === 'SAR' && loan.originalCurrency === 'INR' && (
                        <span className="text-xs font-semibold text-amber-700 dark:text-amber-300 bg-amber-100 dark:bg-amber-950/60 px-2 py-0.5 rounded-full">
                          {formatINR(paymentInr, { showApprox: true })}
                        </span>
                      )}

                      {/* Contributor Badge */}
                      <span className="text-xs font-medium text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200/60 dark:border-indigo-800/40 px-2 py-0.5 rounded-full flex items-center gap-1">
                        <User className="w-3 h-3 shrink-0" />
                        <span>Paid by: {payment.paidBy}</span>
                      </span>

                      {/* Linked Account Badge */}
                      {linkedAccount && (
                        <span className="text-xs font-medium text-teal-700 dark:text-teal-300 bg-teal-50 dark:bg-teal-950/40 border border-teal-200/60 dark:border-teal-800/40 px-2 py-0.5 rounded-full flex items-center gap-1">
                          <CreditCard className="w-3 h-3 shrink-0" />
                          <span>{linkedAccount.name}</span>
                        </span>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
                      <span>{formatDate(payment.date)}</span>
                      {payment.currency === 'INR' && (
                        <span>Rate: 1 SAR = ₹{paymentRate > 0 ? (1 / paymentRate).toFixed(2) : '22.22'}</span>
                      )}
                      {payment.remark && <span>• &quot;{payment.remark}&quot;</span>}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-center">
                    {paymentToDelete === payment.id ? (
                      <div className="flex items-center gap-1 bg-rose-50 dark:bg-rose-950/50 p-1.5 rounded-2xl border border-rose-200 dark:border-rose-800/50 animate-fade-in">
                        <span className="text-[11px] text-rose-700 dark:text-rose-300 font-bold px-1">
                          Delete?
                        </span>
                        <button
                          onClick={() => {
                            onDeletePayment(payment.id);
                            setPaymentToDelete(null);
                          }}
                          className="px-2.5 py-1 bg-rose-600 text-white rounded-xl text-[11px] font-bold hover:bg-rose-700"
                        >
                          Yes
                        </button>
                        <button
                          onClick={() => setPaymentToDelete(null)}
                          className="px-2.5 py-1 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-[11px]"
                        >
                          No
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setPaymentToDelete(payment.id)}
                        className="p-2 rounded-2xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors"
                        title="Delete Payment"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

import React, { useState, useEffect } from 'react';
import { X, CreditCard, UserPlus, Calculator, Info } from 'lucide-react';
import {
  Loan,
  LoanPayment,
  LoanCurrency,
  Contributor,
  MoneyAccount,
  ExchangeRateRecord,
} from '../../types';
import { getTodayString } from '../../utils/dateUtils';
import { calculateLoanDetails } from '../../utils/exchangeRate';
import { formatSAR, formatINR, SAR_UNICODE } from '../../utils/currencyFormatter';

interface AddLoanPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  loans: Loan[];
  payments: LoanPayment[];
  contributors: Contributor[];
  accounts: MoneyAccount[];
  exchangeRate: ExchangeRateRecord;
  preselectedLoanId?: string;
  onSavePayment?: (
    paymentData: Omit<LoanPayment, 'id' | 'createdAt'>,
    linkToAccount: boolean
  ) => void;
  onAddPayment?: (
    paymentData: Omit<LoanPayment, 'id' | 'createdAt'>,
    deductFromAccountId?: string
  ) => void;
  onOpenManageContributors: () => void;
}

export const AddLoanPaymentModal: React.FC<AddLoanPaymentModalProps> = ({
  isOpen,
  onClose,
  loans,
  payments,
  contributors,
  accounts,
  exchangeRate,
  preselectedLoanId,
  onSavePayment,
  onAddPayment,
  onOpenManageContributors,
}) => {
  const [selectedLoanId, setSelectedLoanId] = useState<string>(preselectedLoanId || '');
  const [amount, setAmount] = useState<string>('');
  const [currency, setCurrency] = useState<LoanCurrency>('SAR');
  const [rateSarToInr, setRateSarToInr] = useState<number>(exchangeRate.rateSarToInr || 22.22);
  const [date, setDate] = useState<string>(getTodayString());
  const [paidBy, setPaidBy] = useState<string>('Me');
  const [accountId, setAccountId] = useState<string>('');
  const [remark, setRemark] = useState<string>('');
  const [error, setError] = useState<string>('');

  useEffect(() => {
    if (preselectedLoanId) {
      setSelectedLoanId(preselectedLoanId);
      const targetLoan = loans.find((l) => l.id === preselectedLoanId);
      if (targetLoan) {
        setCurrency(targetLoan.originalCurrency);
      }
    } else if (loans.length > 0 && !selectedLoanId) {
      setSelectedLoanId(loans[0].id);
      setCurrency(loans[0].originalCurrency);
    }
  }, [preselectedLoanId, loans, isOpen]);

  useEffect(() => {
    setRateSarToInr(exchangeRate.rateSarToInr || 22.22);
  }, [exchangeRate]);

  useEffect(() => {
    if (!paidBy && contributors.length > 0) {
      const defaultContrib = contributors.find((c) => c.isDefault) || contributors[0];
      setPaidBy(defaultContrib.name);
    }
  }, [contributors]);

  if (!isOpen) return null;

  const targetLoan = loans.find((l) => l.id === selectedLoanId);
  const numAmount = parseFloat(amount) || 0;

  // Calculate current loan remaining status
  const loanStats = targetLoan
    ? calculateLoanDetails(targetLoan, payments, exchangeRate.rateInrToSar)
    : null;

  // Calculate SAR and INR values of this payment
  let paymentSarValue = 0;
  let paymentInrValue = 0;

  if (currency === 'INR') {
    paymentInrValue = numAmount;
    paymentSarValue = rateSarToInr > 0 ? numAmount / rateSarToInr : numAmount * 0.045;
  } else {
    paymentSarValue = numAmount;
    paymentInrValue = numAmount * (rateSarToInr || 22.22);
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLoanId) {
      setError('Please select a loan');
      return;
    }
    if (isNaN(numAmount) || numAmount <= 0) {
      setError('Please enter a valid payment amount greater than 0');
      return;
    }
    if (!paidBy) {
      setError('Please select or specify who made this payment');
      return;
    }

    const exchangeRateUsed = rateSarToInr > 0 ? Number((1 / rateSarToInr).toFixed(6)) : 0.045;

    const payload = {
      loanId: selectedLoanId,
      amount: numAmount,
      currency,
      exchangeRateUsed,
      date: date || getTodayString(),
      paidBy: paidBy.trim(),
      accountId: accountId || undefined,
      remark: remark.trim() || undefined,
    };

    if (onAddPayment) {
      onAddPayment(payload, accountId || undefined);
    } else if (onSavePayment) {
      onSavePayment(payload, !!accountId);
    }

    setAmount('');
    setRemark('');
    onClose();
  };

  return (
    <div
      id="add-payment-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-3.5 sm:p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        id="add-payment-modal"
        className="w-full max-w-lg bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border border-white/40 dark:border-slate-800/80 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 sm:px-6 py-4 border-b border-slate-200/60 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
              <CreditCard className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                Record Loan Payment
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Log installment with contributor & ⃁ live conversion
              </p>
            </div>
          </div>
          <button
            id="close-payment-modal-btn"
            onClick={onClose}
            className="p-2 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-5 sm:p-6 overflow-y-auto space-y-4 flex-1">
          {error && (
            <div className="p-3 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/50 text-rose-700 dark:text-rose-300 text-xs font-medium">
              {error}
            </div>
          )}

          {/* Select Loan */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1.5">
              Select Loan *
            </label>
            <select
              id="select-loan-dropdown"
              value={selectedLoanId}
              onChange={(e) => {
                const newLoanId = e.target.value;
                setSelectedLoanId(newLoanId);
                const l = loans.find((item) => item.id === newLoanId);
                if (l) setCurrency(l.originalCurrency);
              }}
              className="w-full px-4 py-2.5 rounded-2xl bg-slate-100/80 dark:bg-slate-800/80 border border-slate-200/60 dark:border-slate-700/60 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/40 min-h-[44px]"
            >
              {loans.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.name} ({l.originalCurrency === 'INR' ? `₹${l.originalAmount}` : `⃁ ${l.originalAmount}`})
                </option>
              ))}
            </select>

            {loanStats && (
              <div className="mt-2 text-xs flex flex-wrap justify-between gap-1 text-slate-500 dark:text-slate-400 px-1">
                <span>
                  Remaining Balance:{' '}
                  <strong className="text-slate-800 dark:text-slate-200">
                    {targetLoan?.originalCurrency === 'INR'
                      ? formatINR(loanStats.remainingInOriginalCurrency)
                      : formatSAR(loanStats.remainingInOriginalCurrency)}
                  </strong>
                </span>
                {targetLoan?.originalCurrency === 'INR' && (
                  <span>
                    ⃁ Equivalent:{' '}
                    <strong className="text-slate-800 dark:text-slate-200">
                      {formatSAR(loanStats.currentRemainingInSar, { showApprox: true })}
                    </strong>
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Payment Currency & Amount */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300">
                Payment Amount & Currency *
              </label>
              <div className="flex gap-1.5">
                <button
                  type="button"
                  onClick={() => setCurrency('INR')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all min-h-[32px] ${
                    currency === 'INR'
                      ? 'bg-amber-500 text-white shadow-sm'
                      : 'bg-slate-200/70 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                  }`}
                >
                  ₹ INR
                </button>
                <button
                  type="button"
                  onClick={() => setCurrency('SAR')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all min-h-[32px] ${
                    currency === 'SAR'
                      ? 'bg-emerald-500 text-white shadow-sm'
                      : 'bg-slate-200/70 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                  }`}
                >
                  {SAR_UNICODE} SAR
                </button>
              </div>
            </div>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 font-bold text-slate-400">
                {currency === 'INR' ? '₹' : SAR_UNICODE}
              </span>
              <input
                id="payment-amount-input"
                type="number"
                step="any"
                required
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                className="w-full pl-12 pr-4 py-2.5 rounded-2xl bg-slate-100/80 dark:bg-slate-800/80 border border-slate-200/60 dark:border-slate-700/60 text-slate-900 dark:text-white text-base font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500/40 min-h-[44px]"
              />
            </div>

            {/* Calculated Conversion Snapshot */}
            {numAmount > 0 && (
              <div className="mt-2 p-2.5 rounded-2xl bg-emerald-500/10 dark:bg-emerald-950/30 border border-emerald-500/20 flex items-center justify-between text-xs text-emerald-800 dark:text-emerald-300">
                <div className="flex items-center gap-1.5">
                  <Calculator className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  <span>Applied Equivalent Value:</span>
                </div>
                <span className="font-bold whitespace-nowrap">
                  {currency === 'INR'
                    ? formatSAR(paymentSarValue, { showApprox: true })
                    : formatINR(paymentInrValue, { showApprox: true })}
                </span>
              </div>
            )}
          </div>

          {/* Paid By (Contributor) */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300">
                Paid By (Contributor) *
              </label>
              <button
                type="button"
                onClick={onOpenManageContributors}
                className="text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>+ Custom Contributor</span>
              </button>
            </div>
            <select
              id="paid-by-dropdown"
              value={paidBy}
              onChange={(e) => setPaidBy(e.target.value)}
              className="w-full px-4 py-2.5 rounded-2xl bg-slate-100/80 dark:bg-slate-800/80 border border-slate-200/60 dark:border-slate-700/60 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/40 min-h-[44px]"
            >
              {contributors.map((c) => (
                <option key={c.id} value={c.name}>
                  {c.name} {c.isDefault ? '(Me)' : ''}
                </option>
              ))}
            </select>
          </div>

          {/* Payment Date & Exchange Rate in Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1.5">
                Payment Date
              </label>
              <input
                id="payment-date-input"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-4 py-2.5 rounded-2xl bg-slate-100/80 dark:bg-slate-800/80 border border-slate-200/60 dark:border-slate-700/60 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/40 min-h-[44px]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1.5">
                Exchange Rate (1 SAR = ₹ INR)
              </label>
              <input
                id="payment-rate-input"
                type="number"
                step="0.01"
                value={rateSarToInr}
                onChange={(e) => setRateSarToInr(parseFloat(e.target.value) || 22.22)}
                className="w-full px-4 py-2.5 rounded-2xl bg-slate-100/80 dark:bg-slate-800/80 border border-slate-200/60 dark:border-slate-700/60 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/40 min-h-[44px]"
              />
            </div>
          </div>

          {/* Linked Account (Optional) */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1.5">
              Deduct from Account (Optional)
            </label>
            <select
              id="payment-account-dropdown"
              value={accountId}
              onChange={(e) => setAccountId(e.target.value)}
              className="w-full px-4 py-2.5 rounded-2xl bg-slate-100/80 dark:bg-slate-800/80 border border-slate-200/60 dark:border-slate-700/60 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/40 min-h-[44px]"
            >
              <option value="">None / External Cash / Third-Party Contributor</option>
              {accounts.map((acc) => (
                <option key={acc.id} value={acc.id}>
                  {acc.name} (Balance: {formatSAR(acc.currentBalance)})
                </option>
              ))}
            </select>
            {accountId && (
              <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
                Will reduce {accounts.find((a) => a.id === accountId)?.name} by {formatSAR(paymentSarValue)} as a loan payment.
              </p>
            )}
          </div>

          {/* Remarks */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1.5">
              Remark / Note (Optional)
            </label>
            <input
              id="payment-remark-input"
              type="text"
              value={remark}
              onChange={(e) => setRemark(e.target.value)}
              placeholder="e.g. Month 4 installment, partial transfer..."
              className="w-full px-4 py-2.5 rounded-2xl bg-slate-100/80 dark:bg-slate-800/80 border border-slate-200/60 dark:border-slate-700/60 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/40 min-h-[44px]"
            />
          </div>

          <div className="flex items-start gap-2 p-3 rounded-2xl bg-slate-100/70 dark:bg-slate-800/40 text-[11px] text-slate-500 dark:text-slate-400">
            <Info className="w-4 h-4 shrink-0 text-slate-400 mt-0.5" />
            <span>
              Historical payments lock the exchange rate used on their payment date. The loan balance updates instantly.
            </span>
          </div>

          {/* Footer Buttons */}
          <div className="pt-3 flex gap-3 justify-end border-t border-slate-200/60 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-2xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-sm font-semibold transition-colors min-h-[44px]"
            >
              Cancel
            </button>
            <button
              id="submit-payment-btn"
              type="submit"
              className="px-6 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm transition-all shadow-md shadow-emerald-600/20 min-h-[44px]"
            >
              Record Payment
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

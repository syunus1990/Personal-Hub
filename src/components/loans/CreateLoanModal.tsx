import React, { useState, useEffect } from 'react';
import { X, Landmark, Calculator } from 'lucide-react';
import { Loan, LoanCurrency, ExchangeRateRecord } from '../../types';
import { getTodayString } from '../../utils/dateUtils';
import { formatSAR, SAR_UNICODE } from '../../utils/currencyFormatter';

interface CreateLoanModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveLoan?: (loanData: Omit<Loan, 'id' | 'createdAt'>) => void;
  onCreateLoan?: (loanData: Omit<Loan, 'id' | 'createdAt'>) => void;
  onUpdateLoan?: (loan: Loan) => void;
  editingLoan?: Loan | null;
  exchangeRate: ExchangeRateRecord;
}

export const CreateLoanModal: React.FC<CreateLoanModalProps> = ({
  isOpen,
  onClose,
  onSaveLoan,
  onCreateLoan,
  onUpdateLoan,
  editingLoan,
  exchangeRate,
}) => {
  const [name, setName] = useState('');
  const [originalCurrency, setOriginalCurrency] = useState<LoanCurrency>('INR');
  const [originalAmount, setOriginalAmount] = useState<string>('');
  const [startDate, setStartDate] = useState(getTodayString());
  const [lenderName, setLenderName] = useState('');
  const [remark, setRemark] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (editingLoan) {
      setName(editingLoan.name);
      setOriginalCurrency(editingLoan.originalCurrency);
      setOriginalAmount(String(editingLoan.originalAmount));
      setStartDate(editingLoan.startDate);
      setLenderName(editingLoan.lenderName || '');
      setRemark(editingLoan.remark || '');
    } else {
      setName('');
      setOriginalCurrency('INR');
      setOriginalAmount('');
      setStartDate(getTodayString());
      setLenderName('');
      setRemark('');
    }
    setError('');
  }, [editingLoan, isOpen]);

  if (!isOpen) return null;

  const numAmount = parseFloat(originalAmount) || 0;
  const calculatedSarEquivalent =
    originalCurrency === 'INR'
      ? numAmount * exchangeRate.rateInrToSar
      : numAmount;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Please enter a loan name');
      return;
    }
    if (isNaN(numAmount) || numAmount <= 0) {
      setError('Please enter a valid loan amount greater than 0');
      return;
    }

    const loanPayload = {
      name: name.trim(),
      originalCurrency,
      originalAmount: numAmount,
      startDate: startDate || getTodayString(),
      lenderName: lenderName.trim() || undefined,
      remark: remark.trim() || undefined,
    };

    if (editingLoan && onUpdateLoan) {
      onUpdateLoan({
        ...editingLoan,
        ...loanPayload,
      });
    } else if (onSaveLoan) {
      onSaveLoan(loanPayload);
    } else if (onCreateLoan) {
      onCreateLoan(loanPayload);
    }
    onClose();
  };

  return (
    <div
      id="create-loan-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-3.5 sm:p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        id="create-loan-modal"
        className="w-full max-w-lg bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border border-white/40 dark:border-slate-800/80 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 sm:px-6 py-4 border-b border-slate-200/60 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
              <Landmark className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                {editingLoan ? 'Edit Loan' : 'Create Personal Loan'}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Track personal loans in INR & ⃁ with live balance
              </p>
            </div>
          </div>
          <button
            id="close-loan-modal-btn"
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

          {/* Loan Name */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1.5">
              Loan Name *
            </label>
            <input
              id="loan-name-input"
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. India SBI Home Loan, Car Finance"
              className="w-full px-4 py-2.5 rounded-2xl bg-slate-100/80 dark:bg-slate-800/80 border border-slate-200/60 dark:border-slate-700/60 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/40 min-h-[44px]"
            />
          </div>

          {/* Original Currency Selection */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1.5">
              Original Currency *
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                id="select-inr-btn"
                onClick={() => setOriginalCurrency('INR')}
                className={`py-3 px-4 rounded-2xl border flex items-center justify-center gap-2 font-semibold text-sm transition-all min-h-[44px] ${
                  originalCurrency === 'INR'
                    ? 'bg-amber-500/15 border-amber-500 text-amber-700 dark:text-amber-300 shadow-sm'
                    : 'bg-slate-100/60 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700/60 text-slate-600 dark:text-slate-400 hover:bg-slate-100'
                }`}
              >
                <span className="text-base font-bold">₹</span>
                <span>INR (Indian Rupee)</span>
              </button>
              <button
                type="button"
                id="select-sar-btn"
                onClick={() => setOriginalCurrency('SAR')}
                className={`py-3 px-4 rounded-2xl border flex items-center justify-center gap-2 font-semibold text-sm transition-all min-h-[44px] ${
                  originalCurrency === 'SAR'
                    ? 'bg-emerald-500/15 border-emerald-500 text-emerald-700 dark:text-emerald-300 shadow-sm'
                    : 'bg-slate-100/60 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700/60 text-slate-600 dark:text-slate-400 hover:bg-slate-100'
                }`}
              >
                <span className="text-base font-bold">{SAR_UNICODE}</span>
                <span>SAR (Saudi Riyal)</span>
              </button>
            </div>
          </div>

          {/* Original Amount & Live Conversion Preview */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1.5">
              Original Loan Amount ({originalCurrency === 'INR' ? '₹' : '⃁'}) *
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 font-bold text-slate-400">
                {originalCurrency === 'INR' ? '₹' : SAR_UNICODE}
              </span>
              <input
                id="loan-amount-input"
                type="number"
                step="any"
                required
                value={originalAmount}
                onChange={(e) => setOriginalAmount(e.target.value)}
                placeholder="0.00"
                className="w-full pl-12 pr-4 py-2.5 rounded-2xl bg-slate-100/80 dark:bg-slate-800/80 border border-slate-200/60 dark:border-slate-700/60 text-slate-900 dark:text-white text-base font-bold focus:outline-none focus:ring-2 focus:ring-amber-500/40 min-h-[44px]"
              />
            </div>

            {/* Conversion calculation card */}
            {originalCurrency === 'INR' && numAmount > 0 && (
              <div className="mt-2.5 p-3 rounded-2xl bg-amber-500/10 dark:bg-amber-950/30 border border-amber-500/20 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2 text-amber-800 dark:text-amber-300">
                  <Calculator className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
                  <span>
                    SAR Equivalent (1 SAR = ₹{exchangeRate.rateSarToInr}):
                  </span>
                </div>
                <div className="font-bold text-sm text-amber-900 dark:text-amber-200 whitespace-nowrap">
                  {formatSAR(calculatedSarEquivalent)}
                </div>
              </div>
            )}
          </div>

          {/* Start Date & Lender Name in Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1.5">
                Start Date
              </label>
              <input
                id="loan-start-date-input"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-4 py-2.5 rounded-2xl bg-slate-100/80 dark:bg-slate-800/80 border border-slate-200/60 dark:border-slate-700/60 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/40 min-h-[44px]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1.5">
                Lender / Bank (Optional)
              </label>
              <input
                id="loan-lender-input"
                type="text"
                value={lenderName}
                onChange={(e) => setLenderName(e.target.value)}
                placeholder="e.g. SBI Bank, Al Rajhi"
                className="w-full px-4 py-2.5 rounded-2xl bg-slate-100/80 dark:bg-slate-800/80 border border-slate-200/60 dark:border-slate-700/60 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/40 min-h-[44px]"
              />
            </div>
          </div>

          {/* Remark */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1.5">
              Remark / Notes (Optional)
            </label>
            <textarea
              id="loan-remark-input"
              rows={2}
              value={remark}
              onChange={(e) => setRemark(e.target.value)}
              placeholder="e.g. 5-year tenure, monthly interest rate, repayment plan..."
              className="w-full px-4 py-2.5 rounded-2xl bg-slate-100/80 dark:bg-slate-800/80 border border-slate-200/60 dark:border-slate-700/60 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/40 resize-none"
            />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200/60 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-sm font-semibold hover:bg-slate-200 dark:hover:bg-slate-700 transition-all min-h-[44px]"
            >
              Cancel
            </button>
            <button
              type="submit"
              id="save-loan-btn"
              className="px-6 py-2.5 rounded-2xl bg-amber-600 hover:bg-amber-700 text-white text-sm font-bold transition-all shadow-md shadow-amber-600/20 min-h-[44px]"
            >
              {editingLoan ? 'Save Changes' : 'Create Loan'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

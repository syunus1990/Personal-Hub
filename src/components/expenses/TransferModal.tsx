import React, { useState } from 'react';
import { X, ArrowRightLeft, Calendar, CreditCard, AlignLeft, AlertCircle } from 'lucide-react';
import { MoneyAccount, Transaction } from '../../types';
import { getTodayString } from '../../utils/dateUtils';
import { motion, AnimatePresence } from 'motion/react';

interface TransferModalProps {
  isOpen: boolean;
  onClose: () => void;
  accounts: MoneyAccount[];
  onTransfer: (transaction: Omit<Transaction, 'id' | 'createdAt'>) => void;
  defaultFromAccountId?: string;
}

export const TransferModal: React.FC<TransferModalProps> = ({
  isOpen,
  onClose,
  accounts,
  onTransfer,
  defaultFromAccountId,
}) => {
  const [fromAccountId, setFromAccountId] = useState(
    defaultFromAccountId || (accounts[0]?.id ?? '')
  );
  const [toAccountId, setToAccountId] = useState(
    accounts.find((a) => a.id !== (defaultFromAccountId || accounts[0]?.id))?.id ||
      (accounts[1]?.id ?? '')
  );
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(getTodayString());
  const [remark, setRemark] = useState('');

  React.useEffect(() => {
    if (isOpen) {
      const from = defaultFromAccountId || (accounts[0]?.id ?? '');
      setFromAccountId(from);
      const to = accounts.find((a) => a.id !== from)?.id || (accounts[1]?.id ?? '');
      setToAccountId(to);
      setDate(getTodayString());
      setAmount('');
      setRemark('');
    }
  }, [isOpen, defaultFromAccountId, accounts]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      alert('Please enter a valid transfer amount greater than 0.');
      return;
    }
    if (!fromAccountId || !toAccountId) {
      alert('Please select both source and destination accounts.');
      return;
    }
    if (fromAccountId === toAccountId) {
      alert('Source and destination accounts must be different.');
      return;
    }

    const sourceAcc = accounts.find((a) => a.id === fromAccountId);
    if (sourceAcc && numAmount > sourceAcc.currentBalance) {
      if (
        !window.confirm(
          `The transfer amount (SAR ${numAmount.toLocaleString()}) is higher than the current balance of ${
            sourceAcc.name
          } (SAR ${sourceAcc.currentBalance.toLocaleString()}). Proceed anyway?`
        )
      ) {
        return;
      }
    }

    onTransfer({
      type: 'Transfer',
      amount: numAmount,
      accountId: fromAccountId,
      toAccountId: toAccountId,
      date: date || getTodayString(),
      remark: remark.trim() || undefined,
    });

    onClose();
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/70 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0"
          onClick={onClose}
        />

        <motion.div
          initial={{ y: '100%' }}
          animate={{ y: 0 }}
          exit={{ y: '100%' }}
          transition={{ type: 'spring', damping: 28, stiffness: 300 }}
          className="relative w-full max-w-lg bg-[#13151c]/95 backdrop-blur-2xl rounded-t-3xl sm:rounded-3xl shadow-2xl shadow-cyan-950/40 border border-white/15 max-h-[90vh] overflow-y-auto flex flex-col z-10 text-slate-200"
        >
          {/* Top handle */}
          <div className="flex justify-center pt-3 pb-1 sm:hidden">
            <div className="w-10 h-1.5 bg-white/20 rounded-full" />
          </div>

          {/* Header */}
          <div className="px-5 py-4 border-b border-white/10 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-cyan-600/30 border border-cyan-500/40 text-cyan-300 flex items-center justify-center shadow-lg shadow-cyan-600/30">
                <ArrowRightLeft className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-base font-bold text-white tracking-tight">
                  Transfer Money
                </h2>
                <p className="text-[11px] text-slate-400">
                  Move funds between your own accounts
                </p>
              </div>
            </div>

            <button
              type="button"
              id="btn-close-transfer"
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-xl hover:bg-white/10 cursor-pointer transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-5 space-y-4">
            {/* Amount */}
            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-widest mb-1.5">
                Amount (SAR) <span className="text-cyan-400">*</span>
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-bold text-slate-400">
                  SAR
                </span>
                <input
                  type="number"
                  step="any"
                  id="input-transfer-amount"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.00"
                  className="w-full pl-14 pr-3.5 py-3 bg-white/5 border border-white/15 rounded-2xl text-xl font-black text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/40 focus:border-cyan-500"
                  autoFocus
                  required
                />
              </div>
            </div>

            {/* From Account */}
            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-widest mb-1.5">
                From Account (Source) <span className="text-cyan-400">*</span>
              </label>
              <select
                id="select-transfer-from"
                value={fromAccountId}
                onChange={(e) => setFromAccountId(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-white/5 border border-white/15 rounded-2xl text-xs font-semibold text-white focus:outline-none cursor-pointer"
              >
                {accounts.map((acc) => (
                  <option key={acc.id} value={acc.id} className="bg-zinc-900 text-white">
                    {acc.name} (SAR {Number(acc.currentBalance).toLocaleString()})
                  </option>
                ))}
              </select>
            </div>

            {/* To Account */}
            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-widest mb-1.5">
                To Account (Destination) <span className="text-cyan-400">*</span>
              </label>
              <select
                id="select-transfer-to"
                value={toAccountId}
                onChange={(e) => setToAccountId(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-white/5 border border-white/15 rounded-2xl text-xs font-semibold text-white focus:outline-none cursor-pointer"
              >
                {accounts.map((acc) => (
                  <option key={acc.id} value={acc.id} disabled={acc.id === fromAccountId} className="bg-zinc-900 text-white">
                    {acc.name} (SAR {Number(acc.currentBalance).toLocaleString()})
                  </option>
                ))}
              </select>
            </div>

            {fromAccountId === toAccountId && (
              <div className="flex items-center gap-2 p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>Source and destination accounts must be different.</span>
              </div>
            )}

            {/* Date */}
            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-widest mb-1.5 flex items-center gap-1">
                <Calendar className="w-3 h-3 text-slate-400" />
                Date
              </label>
              <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-2xl px-3.5 py-2.5">
                <input
                  type="date"
                  id="input-transfer-date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full bg-transparent text-xs text-white focus:outline-none cursor-pointer"
                  required
                />
              </div>
            </div>

            {/* Remark */}
            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-widest mb-1.5 flex items-center gap-1">
                <AlignLeft className="w-3 h-3 text-slate-400" />
                Remark (e.g. ATM withdrawal, Credit card settlement)
              </label>
              <input
                type="text"
                id="input-transfer-remark"
                value={remark}
                onChange={(e) => setRemark(e.target.value)}
                placeholder="e.g. ATM Cash Withdrawal, Account to Account"
                className="w-full px-3.5 py-2.5 bg-white/5 border border-white/15 rounded-2xl text-xs text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500/40"
              />
            </div>

            {/* Transfer Note */}
            <div className="p-3 rounded-2xl bg-white/5 border border-white/10 text-[11px] text-slate-300">
              ⚡ <strong>Internal Transfer:</strong> Transfers move money between your accounts without counting as an expense or increasing monthly spending.
            </div>

            {/* Actions */}
            <div className="flex gap-2.5 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-3 px-4 rounded-2xl border border-white/15 text-slate-300 text-xs font-bold hover:bg-white/10 cursor-pointer transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                id="btn-submit-transfer"
                disabled={!amount || parseFloat(amount) <= 0 || !fromAccountId || !toAccountId || fromAccountId === toAccountId}
                className="flex-2 py-3 px-4 rounded-2xl bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white text-xs font-bold shadow-lg shadow-cyan-600/30 flex items-center justify-center gap-1.5 active:scale-98 transition-all cursor-pointer"
              >
                <ArrowRightLeft className="w-4 h-4" />
                <span>Confirm Transfer</span>
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

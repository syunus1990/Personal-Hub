import React, { useState } from 'react';
import { X, PlusCircle, Calendar, CreditCard, AlignLeft } from 'lucide-react';
import { MoneyAccount, Transaction } from '../../types';
import { getTodayString } from '../../utils/dateUtils';
import { motion, AnimatePresence } from 'motion/react';

interface AddMoneyModalProps {
  isOpen: boolean;
  onClose: () => void;
  accounts: MoneyAccount[];
  onAddMoney: (transaction: Omit<Transaction, 'id' | 'createdAt'>) => void;
  defaultAccountId?: string;
}

export const AddMoneyModal: React.FC<AddMoneyModalProps> = ({
  isOpen,
  onClose,
  accounts,
  onAddMoney,
  defaultAccountId,
}) => {
  const [amount, setAmount] = useState('');
  const [accountId, setAccountId] = useState(defaultAccountId || (accounts[0]?.id ?? ''));
  const [date, setDate] = useState(getTodayString());
  const [remark, setRemark] = useState('');

  React.useEffect(() => {
    if (isOpen) {
      setAccountId(defaultAccountId || (accounts[0]?.id ?? ''));
      setDate(getTodayString());
      setAmount('');
      setRemark('');
    }
  }, [isOpen, defaultAccountId, accounts]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      alert('Please enter a valid amount greater than 0.');
      return;
    }
    if (!accountId) {
      alert('Please select an account to deposit money into.');
      return;
    }

    onAddMoney({
      type: 'Money Added',
      amount: numAmount,
      accountId,
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
          className="relative w-full max-w-lg bg-[#13151c]/95 backdrop-blur-2xl rounded-t-3xl sm:rounded-3xl shadow-2xl shadow-emerald-950/40 border border-white/15 max-h-[90vh] overflow-y-auto flex flex-col z-10 text-slate-200"
        >
          {/* Top handle */}
          <div className="flex justify-center pt-3 pb-1 sm:hidden">
            <div className="w-10 h-1.5 bg-white/20 rounded-full" />
          </div>

          {/* Header */}
          <div className="px-5 py-4 border-b border-white/10 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-emerald-600/30 border border-emerald-500/40 text-emerald-300 flex items-center justify-center shadow-lg shadow-emerald-600/30">
                <PlusCircle className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-base font-bold text-white tracking-tight">
                  Add Money / Income
                </h2>
                <p className="text-[11px] text-slate-400">
                  Deposit funds to your account
                </p>
              </div>
            </div>

            <button
              type="button"
              id="btn-close-add-money"
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
                Amount (SAR) <span className="text-emerald-400">*</span>
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-bold text-slate-400">
                  SAR
                </span>
                <input
                  type="number"
                  step="any"
                  id="input-money-amount"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.00"
                  className="w-full pl-14 pr-3.5 py-3 bg-white/5 border border-white/15 rounded-2xl text-xl font-black text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500"
                  autoFocus
                  required
                />
              </div>
            </div>

            {/* Target Account */}
            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-widest mb-1.5">
                Target Account <span className="text-emerald-400">*</span>
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {accounts.map((acc) => {
                  const isSelected = accountId === acc.id;
                  return (
                    <button
                      key={acc.id}
                      type="button"
                      id={`btn-addmoney-acc-${acc.id}`}
                      onClick={() => setAccountId(acc.id)}
                      className={`p-2.5 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                        isSelected
                          ? 'bg-emerald-600/30 border-emerald-500 text-white shadow-lg shadow-emerald-950/40'
                          : 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10'
                      }`}
                    >
                      <div className="flex items-center gap-1.5">
                        <CreditCard className="w-3.5 h-3.5 opacity-70" />
                        <span className="text-xs font-bold truncate">{acc.name}</span>
                      </div>
                      <span className="text-[11px] font-semibold text-slate-400 mt-1">
                        SAR {Number(acc.currentBalance).toLocaleString()}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Date */}
            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-widest mb-1.5 flex items-center gap-1">
                <Calendar className="w-3 h-3 text-slate-400" />
                Date
              </label>
              <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-2xl px-3.5 py-2.5">
                <input
                  type="date"
                  id="input-money-date"
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
                Remark / Source (e.g. Salary, Refund, Freelance)
              </label>
              <input
                type="text"
                id="input-money-remark"
                value={remark}
                onChange={(e) => setRemark(e.target.value)}
                placeholder="e.g. Salary, Investment return, Cash deposit"
                className="w-full px-3.5 py-2.5 bg-white/5 border border-white/15 rounded-2xl text-xs text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
              />
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
                id="btn-submit-save-money"
                disabled={!amount || parseFloat(amount) <= 0 || !accountId}
                className="flex-2 py-3 px-4 rounded-2xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-bold shadow-lg shadow-emerald-600/30 flex items-center justify-center gap-1.5 active:scale-98 transition-all cursor-pointer"
              >
                <PlusCircle className="w-4 h-4" />
                <span>Save Money</span>
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

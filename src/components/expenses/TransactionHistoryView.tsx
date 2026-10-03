import React, { useState, useMemo } from 'react';
import {
  Search,
  Trash2,
  Edit2,
  ArrowRightLeft,
  MinusCircle,
  PlusCircle,
  X,
} from 'lucide-react';
import { MoneyAccount, ExpenseCategory, Transaction } from '../../types';
import { formatDate } from '../../utils/dateUtils';
import { formatSAR, SAR_UNICODE } from '../../utils/currencyFormatter';

interface TransactionHistoryViewProps {
  transactions: Transaction[];
  accounts: MoneyAccount[];
  categories: ExpenseCategory[];
  onUpdateTransaction: (updatedTx: Transaction) => void;
  onDeleteTransaction: (txId: string) => void;
}

export const TransactionHistoryView: React.FC<TransactionHistoryViewProps> = ({
  transactions,
  accounts,
  categories,
  onUpdateTransaction,
  onDeleteTransaction,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<string>('All');
  const [selectedAccount, setSelectedAccount] = useState<string>('All');
  const [editingTx, setEditingTx] = useState<Transaction | null>(null);

  // Edit form state
  const [editAmount, setEditAmount] = useState('');
  const [editDate, setEditDate] = useState('');
  const [editAccountId, setEditAccountId] = useState('');
  const [editToAccountId, setEditToAccountId] = useState('');
  const [editCategoryId, setEditCategoryId] = useState('');
  const [editRemark, setEditRemark] = useState('');

  const handleStartEdit = (tx: Transaction) => {
    window.scrollTo({ top: 0, behavior: 'instant' });
    setEditingTx(tx);
    setEditAmount(String(tx.amount));
    setEditDate(tx.date);
    setEditAccountId(tx.accountId);
    setEditToAccountId(tx.toAccountId || '');
    setEditCategoryId(tx.categoryId || '');
    setEditRemark(tx.remark || '');
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTx) return;
    const amountNum = parseFloat(editAmount);
    if (isNaN(amountNum) || amountNum <= 0) {
      alert('Please enter a valid amount.');
      return;
    }
    if (!editAccountId) {
      alert('Please select an account.');
      return;
    }

    const updated: Transaction = {
      ...editingTx,
      amount: amountNum,
      date: editDate,
      accountId: editAccountId,
      toAccountId: editingTx.type === 'Transfer' ? editToAccountId : undefined,
      categoryId: editingTx.type === 'Expense' ? (editCategoryId || undefined) : undefined,
      remark: editRemark.trim() || undefined,
    };

    onUpdateTransaction(updated);
    setEditingTx(null);
  };

  const handleDelete = (tx: Transaction) => {
    if (window.confirm(`Delete this transaction (${tx.type} of ${formatSAR(tx.amount)})? Account balances will be recalculated automatically.`)) {
      onDeleteTransaction(tx.id);
    }
  };

  // Filtered transactions
  const filtered = useMemo(() => {
    return transactions.filter((tx) => {
      // Type match
      if (selectedType !== 'All' && tx.type !== selectedType) {
        return false;
      }
      // Account match
      if (selectedAccount !== 'All' && tx.accountId !== selectedAccount && tx.toAccountId !== selectedAccount) {
        return false;
      }
      // Search text (remark, account name, category name)
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const accName = accounts.find((a) => a.id === tx.accountId)?.name?.toLowerCase() || '';
        const toAccName = accounts.find((a) => a.id === tx.toAccountId)?.name?.toLowerCase() || '';
        const catName = categories.find((c) => c.id === tx.categoryId)?.name?.toLowerCase() || '';
        const remark = (tx.remark || '').toLowerCase();
        const dateStr = (tx.date || '').toLowerCase();

        return (
          accName.includes(query) ||
          toAccName.includes(query) ||
          catName.includes(query) ||
          remark.includes(query) ||
          dateStr.includes(query)
        );
      }
      return true;
    });
  }, [transactions, selectedType, selectedAccount, searchQuery, accounts, categories]);

  return (
    <div className="space-y-4">
      {/* Search and Filters Bar */}
      <div className="space-y-2.5">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            id="input-search-transactions"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search remark, account, or category..."
            className="w-full pl-10 pr-4 py-2.5 bg-white/5 border border-white/10 rounded-2xl text-xs text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 min-h-[44px]"
          />
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest pl-1 shrink-0">
            Type:
          </span>
          {(['All', 'Expense', 'Money Added', 'Transfer'] as const).map((type) => (
            <button
              key={type}
              type="button"
              id={`btn-filter-tx-${type.toLowerCase().replace(' ', '-')}`}
              onClick={() => setSelectedType(type)}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap border transition-all cursor-pointer min-h-[32px] ${
                selectedType === type
                  ? 'bg-emerald-600 text-white border-emerald-400 shadow-sm'
                  : 'bg-white/5 border-white/10 text-slate-400 hover:text-white'
              }`}
            >
              {type}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest pl-1 shrink-0">
            Account:
          </span>
          <button
            type="button"
            onClick={() => setSelectedAccount('All')}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap border transition-all cursor-pointer min-h-[32px] ${
              selectedAccount === 'All'
                ? 'bg-violet-600 text-white border-violet-400 shadow-sm'
                : 'bg-white/5 border-white/10 text-slate-400 hover:text-white'
            }`}
          >
            All Accounts
          </button>
          {accounts.map((acc) => (
            <button
              key={acc.id}
              type="button"
              onClick={() => setSelectedAccount(acc.id)}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap border transition-all cursor-pointer min-h-[32px] ${
                selectedAccount === acc.id
                  ? 'bg-violet-600 text-white border-violet-400 shadow-sm'
                  : 'bg-white/5 border-white/10 text-slate-400 hover:text-white'
              }`}
            >
              {acc.name}
            </button>
          ))}
        </div>
      </div>

      {/* Transaction List */}
      <div className="space-y-2">
        <div className="flex flex-wrap items-center justify-between gap-1 text-xs text-slate-400 font-semibold px-1">
          <span>{filtered.length} Transactions</span>
          <span>Automatic Balance Recalculation</span>
        </div>

        {filtered.length === 0 ? (
          <div className="p-8 text-center rounded-3xl bg-white/5 border border-white/10 text-slate-400">
            <p className="text-sm font-semibold">No transactions found</p>
            <p className="text-xs mt-1">Try changing filters or search terms</p>
          </div>
        ) : (
          filtered.map((tx) => {
            const sourceAcc = accounts.find((a) => a.id === tx.accountId);
            const targetAcc = tx.toAccountId ? accounts.find((a) => a.id === tx.toAccountId) : null;
            const category = categories.find((c) => c.id === tx.categoryId);

            const isExpense = tx.type === 'Expense';
            const isIncome = tx.type === 'Money Added';
            const isTransfer = tx.type === 'Transfer';

            return (
              <div
                key={tx.id}
                className="p-3.5 sm:p-4 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors flex items-center justify-between gap-3"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className={`w-9 h-9 rounded-2xl flex items-center justify-center shrink-0 border ${
                      isExpense
                        ? 'bg-rose-500/20 text-rose-300 border-rose-500/30'
                        : isIncome
                        ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                        : 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30'
                    }`}
                  >
                    {isExpense ? (
                      <MinusCircle className="w-4 h-4" />
                    ) : isIncome ? (
                      <PlusCircle className="w-4 h-4" />
                    ) : (
                      <ArrowRightLeft className="w-4 h-4" />
                    )}
                  </div>

                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="text-xs sm:text-sm font-bold text-white truncate max-w-[180px] sm:max-w-none">
                        {isTransfer
                          ? `${sourceAcc?.name ?? 'Unknown'} → ${targetAcc?.name ?? 'Unknown'}`
                          : sourceAcc?.name ?? 'Unknown Account'}
                      </span>
                      {category && (
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-white/10 text-slate-300 shrink-0">
                          {category.name}
                        </span>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-400 mt-0.5">
                      <span>{formatDate(tx.date)}</span>
                      {tx.remark && (
                        <>
                          <span>•</span>
                          <span className="truncate max-w-[140px] sm:max-w-[200px]">{tx.remark}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <div className="text-right">
                    <span
                      className={`text-xs sm:text-sm font-black block whitespace-nowrap ${
                        isExpense
                          ? 'text-rose-300'
                          : isIncome
                          ? 'text-emerald-300'
                          : 'text-cyan-300'
                      }`}
                    >
                      {isExpense ? '- ' : isIncome ? '+ ' : ''}{formatSAR(tx.amount)}
                    </span>
                    <span className="text-[10px] text-slate-400 block font-medium">
                      {tx.type}
                    </span>
                  </div>

                  <div className="flex items-center gap-0.5">
                    <button
                      type="button"
                      onClick={() => handleStartEdit(tx)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 cursor-pointer min-h-[32px] min-w-[32px] flex items-center justify-center"
                      title="Edit"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(tx)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 cursor-pointer min-h-[32px] min-w-[32px] flex items-center justify-center"
                      title="Delete"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Edit Transaction Modal */}
      {editingTx && (
        <div className="fixed inset-0 z-50 flex items-start sm:items-center justify-center p-3 sm:p-4 pt-6 sm:pt-4 bg-black/80 backdrop-blur-2xl overflow-y-auto">
          <div className="bg-[#13151c]/95 backdrop-blur-2xl border border-white/20 rounded-[2rem] p-5 sm:p-6 max-w-sm w-full space-y-4 shadow-2xl shadow-black/80 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-1 border-b border-white/10">
              <h3 className="text-base font-bold text-white">Edit Transaction</h3>
              <button
                type="button"
                onClick={() => setEditingTx(null)}
                className="p-1.5 text-slate-400 hover:text-white cursor-pointer rounded-xl hover:bg-white/10"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-3.5">
              <div>
                <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-widest mb-1">
                  Amount ({SAR_UNICODE})
                </label>
                <input
                  type="number"
                  step="any"
                  autoFocus
                  value={editAmount}
                  onChange={(e) => setEditAmount(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-white/5 border border-white/20 rounded-2xl text-base font-black text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50 min-h-[44px]"
                  required
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-300 mb-1">
                  Account
                </label>
                <select
                  value={editAccountId}
                  onChange={(e) => setEditAccountId(e.target.value)}
                  className="w-full px-3 py-2 bg-white/5 border border-white/15 rounded-xl text-xs text-white focus:outline-none min-h-[44px]"
                >
                  {accounts.map((acc) => (
                    <option key={acc.id} value={acc.id} className="bg-zinc-900 text-white">
                      {acc.name}
                    </option>
                  ))}
                </select>
              </div>

              {editingTx.type === 'Transfer' && (
                <div>
                  <label className="block text-[11px] font-bold text-slate-300 mb-1">
                    To Destination Account
                  </label>
                  <select
                    value={editToAccountId}
                    onChange={(e) => setEditToAccountId(e.target.value)}
                    className="w-full px-3 py-2 bg-white/5 border border-white/15 rounded-xl text-xs text-white focus:outline-none min-h-[44px]"
                  >
                    {accounts.map((acc) => (
                      <option key={acc.id} value={acc.id} disabled={acc.id === editAccountId} className="bg-zinc-900 text-white">
                        {acc.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {editingTx.type === 'Expense' && (
                <div>
                  <label className="block text-[11px] font-bold text-slate-300 mb-1">
                    Category (Optional)
                  </label>
                  <select
                    value={editCategoryId}
                    onChange={(e) => setEditCategoryId(e.target.value)}
                    className="w-full px-3 py-2 bg-white/5 border border-white/15 rounded-xl text-xs text-white focus:outline-none min-h-[44px]"
                  >
                    <option value="" className="bg-zinc-900 text-white">None / Uncategorized</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id} className="bg-zinc-900 text-white">
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="block text-[11px] font-bold text-slate-300 mb-1">
                  Date
                </label>
                <input
                  type="date"
                  value={editDate}
                  onChange={(e) => setEditDate(e.target.value)}
                  className="w-full px-3 py-2 bg-white/5 border border-white/15 rounded-xl text-xs text-white focus:outline-none min-h-[44px]"
                  required
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-300 mb-1">
                  Remark / Note
                </label>
                <input
                  type="text"
                  value={editRemark}
                  onChange={(e) => setEditRemark(e.target.value)}
                  className="w-full px-3 py-2 bg-white/5 border border-white/15 rounded-xl text-xs text-white focus:outline-none min-h-[44px]"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingTx(null)}
                  className="flex-1 py-2.5 rounded-xl border border-white/15 text-slate-300 text-xs font-bold min-h-[40px]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-2 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold cursor-pointer shadow-md min-h-[40px]"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

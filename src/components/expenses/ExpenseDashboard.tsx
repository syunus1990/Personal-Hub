import React, { useState } from 'react';
import {
  Wallet,
  TrendingDown,
  CreditCard,
  PlusCircle,
  MinusCircle,
  ArrowRightLeft,
  Settings,
  History,
  BarChart3,
  Tag,
  ChevronRight,
  Edit2,
  Trash2,
  X,
} from 'lucide-react';
import { MoneyAccount, ExpenseCategory, Transaction } from '../../types';
import { AddExpenseModal } from './AddExpenseModal';
import { AddMoneyModal } from './AddMoneyModal';
import { TransferModal } from './TransferModal';
import { ManageAccountsModal } from './ManageAccountsModal';
import { ManageCategoriesModal } from './ManageCategoriesModal';
import { TransactionHistoryView } from './TransactionHistoryView';
import { ExpenseSummaryView } from './ExpenseSummaryView';
import { formatDate } from '../../utils/dateUtils';

interface ExpenseDashboardProps {
  accounts: MoneyAccount[];
  categories: ExpenseCategory[];
  transactions: Transaction[];
  onAddExpense: (transaction: Omit<Transaction, 'id' | 'createdAt'>) => void;
  onAddMoney: (transaction: Omit<Transaction, 'id' | 'createdAt'>) => void;
  onTransfer: (transaction: Omit<Transaction, 'id' | 'createdAt'>) => void;
  onUpdateTransaction: (updatedTx: Transaction) => void;
  onDeleteTransaction: (txId: string) => void;
  onAddAccount: (name: string, openingBalance: number, color?: string) => void;
  onUpdateAccount: (account: MoneyAccount) => void;
  onDeleteAccount: (accountId: string) => void;
  onAddCategory: (name: string, color?: string) => void;
  onRenameCategory: (categoryId: string, newName: string) => void;
  onDeleteCategory: (categoryId: string) => void;
  onReorderCategories: (newCategories: ExpenseCategory[]) => void;
}

type ExpenseTab = 'overview' | 'history' | 'summary';

export const ExpenseDashboard: React.FC<ExpenseDashboardProps> = ({
  accounts,
  categories,
  transactions,
  onAddExpense,
  onAddMoney,
  onTransfer,
  onUpdateTransaction,
  onDeleteTransaction,
  onAddAccount,
  onUpdateAccount,
  onDeleteAccount,
  onAddCategory,
  onRenameCategory,
  onDeleteCategory,
  onReorderCategories,
}) => {
  const [activeTab, setActiveTab] = useState<ExpenseTab>('overview');

  // Modals state
  const [showAddExpense, setShowAddExpense] = useState(false);
  const [showAddMoney, setShowAddMoney] = useState(false);
  const [showTransfer, setShowTransfer] = useState(false);
  const [showAccountsModal, setShowAccountsModal] = useState(false);
  const [showCategoriesModal, setShowCategoriesModal] = useState(false);
  const [selectedAccountId, setSelectedAccountId] = useState<string | undefined>();
  const [editingTx, setEditingTx] = useState<Transaction | null>(null);
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

  // Total Money
  const totalMoney = accounts.reduce((sum, a) => sum + (Number(a.currentBalance) || 0), 0);

  // Month Spending
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = String(now.getMonth() + 1).padStart(2, '0');
  const monthPrefix = `${currentYear}-${currentMonth}`;

  const currentMonthExpenses = transactions
    .filter((tx) => tx.type === 'Expense' && tx.date.startsWith(monthPrefix))
    .reduce((sum, tx) => sum + (Number(tx.amount) || 0), 0);

  // Recent 6 transactions
  const recentTransactions = transactions.slice(0, 6);

  return (
    <div className="p-4 space-y-4 pb-20">
      {/* Sub Navigation Bar */}
      <div className="flex items-center gap-1.5 p-1 bg-white/5 border border-white/10 rounded-2xl">
        <button
          type="button"
          id="tab-expense-overview"
          onClick={() => setActiveTab('overview')}
          className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
            activeTab === 'overview'
              ? 'bg-emerald-600 text-white shadow-md shadow-emerald-950/40'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Wallet className="w-3.5 h-3.5" />
          <span>Overview</span>
        </button>

        <button
          type="button"
          id="tab-expense-history"
          onClick={() => setActiveTab('history')}
          className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
            activeTab === 'history'
              ? 'bg-emerald-600 text-white shadow-md shadow-emerald-950/40'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <History className="w-3.5 h-3.5" />
          <span>Transactions</span>
        </button>

        <button
          type="button"
          id="tab-expense-summary"
          onClick={() => setActiveTab('summary')}
          className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
            activeTab === 'summary'
              ? 'bg-emerald-600 text-white shadow-md shadow-emerald-950/40'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <BarChart3 className="w-3.5 h-3.5" />
          <span>Summary</span>
        </button>
      </div>

      {/* Main Views */}
      {activeTab === 'overview' && (
        <div className="space-y-4">
          {/* Top Money Cards */}
          <div className="grid grid-cols-2 gap-3">
            {/* TOTAL MONEY */}
            <div className="p-4 rounded-3xl bg-gradient-to-br from-emerald-950/40 to-teal-950/40 border border-emerald-500/25 backdrop-blur-xl relative overflow-hidden">
              <div className="flex items-center justify-between text-emerald-400 mb-1">
                <span className="text-[10px] font-bold uppercase tracking-wider">
                  Total Money
                </span>
                <Wallet className="w-4 h-4" />
              </div>
              <div className="text-xl font-black text-white tracking-tight">
                SAR {totalMoney.toLocaleString()}
              </div>
              <p className="text-[11px] text-emerald-300/80 font-medium mt-0.5">
                Across {accounts.length} accounts
              </p>
            </div>

            {/* MONTH SPENDING */}
            <div className="p-4 rounded-3xl bg-gradient-to-br from-rose-950/40 to-red-950/40 border border-rose-500/25 backdrop-blur-xl relative overflow-hidden">
              <div className="flex items-center justify-between text-rose-400 mb-1">
                <span className="text-[10px] font-bold uppercase tracking-wider">
                  Month Spending
                </span>
                <TrendingDown className="w-4 h-4" />
              </div>
              <div className="text-xl font-black text-white tracking-tight">
                SAR {currentMonthExpenses.toLocaleString()}
              </div>
              <p className="text-[11px] text-rose-300/80 font-medium mt-0.5">
                Current month
              </p>
            </div>
          </div>

          {/* Quick Action Buttons */}
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              id="btn-add-expense-quick"
              onClick={() => setShowAddExpense(true)}
              className="py-3 px-2 rounded-2xl bg-rose-600/30 hover:bg-rose-600/40 border border-rose-500/40 text-rose-200 text-xs font-bold flex flex-col items-center justify-center gap-1.5 cursor-pointer shadow-lg active:scale-98 transition-all"
            >
              <MinusCircle className="w-5 h-5 text-rose-300" />
              <span>Add Expense</span>
            </button>

            <button
              type="button"
              id="btn-add-money-quick"
              onClick={() => setShowAddMoney(true)}
              className="py-3 px-2 rounded-2xl bg-emerald-600/30 hover:bg-emerald-600/40 border border-emerald-500/40 text-emerald-200 text-xs font-bold flex flex-col items-center justify-center gap-1.5 cursor-pointer shadow-lg active:scale-98 transition-all"
            >
              <PlusCircle className="w-5 h-5 text-emerald-300" />
              <span>Add Money</span>
            </button>

            <button
              type="button"
              id="btn-transfer-quick"
              onClick={() => setShowTransfer(true)}
              className="py-3 px-2 rounded-2xl bg-cyan-600/30 hover:bg-cyan-600/40 border border-cyan-500/40 text-cyan-200 text-xs font-bold flex flex-col items-center justify-center gap-1.5 cursor-pointer shadow-lg active:scale-98 transition-all"
            >
              <ArrowRightLeft className="w-5 h-5 text-cyan-300" />
              <span>Transfer</span>
            </button>
          </div>

          {/* My Accounts Section */}
          <div className="p-4 rounded-3xl bg-white/5 border border-white/10 space-y-3 backdrop-blur-xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-violet-400" />
                <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                  My Accounts ({accounts.length})
                </h3>
              </div>
              <button
                type="button"
                id="btn-manage-accounts"
                onClick={() => setShowAccountsModal(true)}
                className="text-xs font-bold text-violet-300 hover:text-white flex items-center gap-1 cursor-pointer transition-colors"
              >
                <Settings className="w-3.5 h-3.5" />
                <span>Manage</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {accounts.map((acc) => (
                <div
                  key={acc.id}
                  className="p-3.5 rounded-2xl bg-black/40 border border-white/10 flex items-center justify-between group hover:border-violet-500/30 transition-colors"
                >
                  <div className="flex items-center gap-2.5">
                    <div
                      className="w-3.5 h-3.5 rounded-full shrink-0 shadow-sm"
                      style={{ backgroundColor: acc.color || '#8b5cf6' }}
                    />
                    <div>
                      <h4 className="text-xs font-bold text-white">{acc.name}</h4>
                      <span className="text-[10px] text-slate-400">
                        Opening: SAR {Number(acc.openingBalance ?? 0).toLocaleString()}
                      </span>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-sm font-black text-emerald-300 block">
                      SAR {Number(acc.currentBalance).toLocaleString()}
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedAccountId(acc.id);
                        setShowAddExpense(true);
                      }}
                      className="text-[10px] font-semibold text-rose-300 hover:underline cursor-pointer"
                    >
                      + Spend
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Manage Categories Shortcut */}
          <div className="p-3 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Tag className="w-4 h-4 text-purple-400" />
              <span className="text-xs font-bold text-white">Expense Categories</span>
              <span className="text-[10px] text-slate-400">({categories.length} custom)</span>
            </div>
            <button
              type="button"
              id="btn-manage-categories"
              onClick={() => setShowCategoriesModal(true)}
              className="text-xs font-bold text-purple-300 hover:text-white flex items-center gap-1 cursor-pointer"
            >
              <span>Manage Categories</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Recent Transactions preview */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between px-1">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                Recent Transactions
              </span>
              <button
                type="button"
                onClick={() => setActiveTab('history')}
                className="text-xs font-bold text-emerald-300 hover:underline cursor-pointer flex items-center gap-0.5"
              >
                <span>View All ({transactions.length})</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {recentTransactions.length === 0 ? (
              <div className="p-6 text-center rounded-2xl bg-white/5 border border-white/10 text-slate-400 text-xs">
                No transactions recorded yet. Tap &apos;Add Expense&apos; or &apos;Add Money&apos; above.
              </div>
            ) : (
              <div className="space-y-2">
                {recentTransactions.map((tx) => {
                  const sourceAcc = accounts.find((a) => a.id === tx.accountId);
                  const targetAcc = tx.toAccountId ? accounts.find((a) => a.id === tx.toAccountId) : null;
                  const cat = categories.find((c) => c.id === tx.categoryId);
                  const isExpense = tx.type === 'Expense';
                  const isIncome = tx.type === 'Money Added';

                  return (
                    <div
                      key={tx.id}
                      className="p-3 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-between"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div
                          className={`w-7 h-7 rounded-xl flex items-center justify-center text-xs shrink-0 border ${
                            isExpense
                              ? 'bg-rose-500/20 text-rose-300 border-rose-500/30'
                              : isIncome
                              ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                              : 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30'
                          }`}
                        >
                          {isExpense ? '-' : isIncome ? '+' : '⇄'}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs font-bold text-white truncate">
                              {tx.type === 'Transfer'
                                ? `${sourceAcc?.name} → ${targetAcc?.name}`
                                : sourceAcc?.name}
                            </span>
                            {cat && (
                              <span className="text-[9px] font-semibold px-1.5 py-0.2 rounded bg-white/10 text-slate-300 truncate">
                                {cat.name}
                              </span>
                            )}
                          </div>
                          <div className="text-[10px] text-slate-400 truncate">
                            {formatDate(tx.date)} {tx.remark ? `• ${tx.remark}` : ''}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <div className="text-right">
                          <span
                            className={`text-xs font-black block ${
                              isExpense
                                ? 'text-rose-300'
                                : isIncome
                                ? 'text-emerald-300'
                                : 'text-cyan-300'
                            }`}
                          >
                            {isExpense ? '- ' : isIncome ? '+ ' : ''}SAR {Number(tx.amount).toLocaleString()}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleStartEdit(tx)}
                          className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 cursor-pointer min-h-[36px] min-w-[36px] flex items-center justify-center transition-colors"
                          title="Edit Transaction"
                        >
                          <Edit2 className="w-3.5 h-3.5 text-slate-300 hover:text-emerald-400" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'history' && (
        <TransactionHistoryView
          transactions={transactions}
          accounts={accounts}
          categories={categories}
          onUpdateTransaction={onUpdateTransaction}
          onDeleteTransaction={onDeleteTransaction}
        />
      )}

      {activeTab === 'summary' && (
        <ExpenseSummaryView
          accounts={accounts}
          categories={categories}
          transactions={transactions}
        />
      )}

      {/* Modals */}
      <AddExpenseModal
        isOpen={showAddExpense}
        onClose={() => {
          setShowAddExpense(false);
          setSelectedAccountId(undefined);
        }}
        accounts={accounts}
        categories={categories}
        onAddExpense={onAddExpense}
        defaultAccountId={selectedAccountId}
      />

      <AddMoneyModal
        isOpen={showAddMoney}
        onClose={() => {
          setShowAddMoney(false);
          setSelectedAccountId(undefined);
        }}
        accounts={accounts}
        onAddMoney={onAddMoney}
        defaultAccountId={selectedAccountId}
      />

      <TransferModal
        isOpen={showTransfer}
        onClose={() => {
          setShowTransfer(false);
          setSelectedAccountId(undefined);
        }}
        accounts={accounts}
        onTransfer={onTransfer}
        defaultFromAccountId={selectedAccountId}
      />

      <ManageAccountsModal
        isOpen={showAccountsModal}
        onClose={() => setShowAccountsModal(false)}
        accounts={accounts}
        onAddAccount={onAddAccount}
        onUpdateAccount={onUpdateAccount}
        onDeleteAccount={onDeleteAccount}
      />

      <ManageCategoriesModal
        isOpen={showCategoriesModal}
        onClose={() => setShowCategoriesModal(false)}
        categories={categories}
        onAddCategory={onAddCategory}
        onRenameCategory={onRenameCategory}
        onDeleteCategory={onDeleteCategory}
        onReorderCategories={onReorderCategories}
      />

      {/* Quick Edit Transaction Modal on Overview */}
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
                  Amount (SAR)
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
                <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-widest mb-1">
                  Account
                </label>
                <select
                  value={editAccountId}
                  onChange={(e) => setEditAccountId(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-[#1a1d26] border border-white/20 rounded-2xl text-xs text-white focus:outline-none min-h-[44px]"
                >
                  {accounts.map((acc) => (
                    <option key={acc.id} value={acc.id} className="bg-zinc-900 text-white">
                      {acc.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-widest mb-1">
                  Date
                </label>
                <input
                  type="date"
                  value={editDate}
                  onChange={(e) => setEditDate(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-white/5 border border-white/20 rounded-2xl text-xs text-white focus:outline-none min-h-[44px]"
                  required
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-widest mb-1">
                  Remark / Note
                </label>
                <input
                  type="text"
                  value={editRemark}
                  onChange={(e) => setEditRemark(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-white/5 border border-white/20 rounded-2xl text-xs text-white focus:outline-none min-h-[44px]"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingTx(null)}
                  className="flex-1 py-2.5 rounded-2xl border border-white/15 text-slate-300 text-xs font-bold min-h-[44px]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-2 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold cursor-pointer shadow-lg min-h-[44px]"
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

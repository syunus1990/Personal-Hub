import React, { useState } from 'react';
import {
  Wallet,
  CreditCard,
  Landmark,
  PlusCircle,
  MinusCircle,
  ArrowRightLeft,
  Settings,
  Tag,
  ChevronRight,
} from 'lucide-react';
import {
  MoneyAccount,
  ExpenseCategory,
  Transaction,
  Loan,
  LoanPayment,
  Contributor,
  ExchangeRateRecord,
} from '../../types';
import { calculateLoanDetails } from '../../utils/exchangeRate';
import { formatDate } from '../../utils/dateUtils';
import { formatSAR } from '../../utils/currencyFormatter';
import { AddExpenseModal } from '../expenses/AddExpenseModal';
import { AddMoneyModal } from '../expenses/AddMoneyModal';
import { TransferModal } from '../expenses/TransferModal';
import { ManageAccountsModal } from '../expenses/ManageAccountsModal';
import { ManageCategoriesModal } from '../expenses/ManageCategoriesModal';
import { TransactionHistoryView } from '../expenses/TransactionHistoryView';
import { ExpenseSummaryView } from '../expenses/ExpenseSummaryView';
import { LoanDashboard } from '../loans/LoanDashboard';
import { LoanDetailView } from '../loans/LoanDetailView';
import { CreateLoanModal } from '../loans/CreateLoanModal';
import { AddLoanPaymentModal } from '../loans/AddLoanPaymentModal';
import { ManageContributorsModal } from '../loans/ManageContributorsModal';

interface MoneyModuleProps {
  accounts: MoneyAccount[];
  categories: ExpenseCategory[];
  transactions: Transaction[];
  loans: Loan[];
  loanPayments: LoanPayment[];
  contributors: Contributor[];
  exchangeRate: ExchangeRateRecord;
  isRefreshingRate: boolean;
  initialTab?: 'expenses' | 'accounts' | 'loans';
  initialLoanIdToPay?: string;
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
  onRefreshExchangeRate: () => void;
  onCreateLoan: (loan: Omit<Loan, 'id' | 'createdAt'>) => void;
  onUpdateLoan: (loan: Loan) => void;
  onDeleteLoan: (loanId: string) => void;
  onAddLoanPayment: (payment: Omit<LoanPayment, 'id' | 'createdAt'>, deductFromAccountId?: string) => void;
  onDeleteLoanPayment: (paymentId: string) => void;
  onAddContributor: (name: string) => void;
  onDeleteContributor: (id: string) => void;
}

type MoneySubTab = 'expenses' | 'accounts' | 'loans';

export const MoneyModule: React.FC<MoneyModuleProps> = ({
  accounts,
  categories,
  transactions,
  loans,
  loanPayments,
  contributors,
  exchangeRate,
  isRefreshingRate,
  initialTab = 'expenses',
  initialLoanIdToPay,
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
  onRefreshExchangeRate,
  onCreateLoan,
  onUpdateLoan,
  onDeleteLoan,
  onAddLoanPayment,
  onDeleteLoanPayment,
  onAddContributor,
  onDeleteContributor,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<MoneySubTab>(initialTab);
  const [expenseSubView, setExpenseSubView] = useState<'overview' | 'history' | 'summary'>('overview');

  // Modals state
  const [showAddExpense, setShowAddExpense] = useState(false);
  const [showAddMoney, setShowAddMoney] = useState(false);
  const [showTransfer, setShowTransfer] = useState(false);
  const [showAccountsModal, setShowAccountsModal] = useState(false);
  const [showCategoriesModal, setShowCategoriesModal] = useState(false);
  const [selectedAccountId, setSelectedAccountId] = useState<string | undefined>();

  // Loans modal state
  const [showCreateLoan, setShowCreateLoan] = useState(false);
  const [loanForEdit, setLoanForEdit] = useState<Loan | null>(null);
  const [showAddPayment, setShowAddPayment] = useState(!!initialLoanIdToPay);
  const [showContributorsModal, setShowContributorsModal] = useState(false);
  const [selectedLoanForPaymentId, setSelectedLoanForPaymentId] = useState<string | undefined>(initialLoanIdToPay);
  const [selectedLoanForDetail, setSelectedLoanForDetail] = useState<Loan | null>(null);

  // 1. Total available money in SAR
  const totalMoney = accounts.reduce((sum, a) => sum + (Number(a.currentBalance) || 0), 0);

  // 2. Current month spending in SAR
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = String(now.getMonth() + 1).padStart(2, '0');
  const monthPrefix = `${currentYear}-${currentMonth}`;

  const currentMonthExpenses = transactions
    .filter((tx) => tx.type === 'Expense' && tx.date.startsWith(monthPrefix))
    .reduce((sum, tx) => sum + (Number(tx.amount) || 0), 0);

  // 3. Loans outstanding in SAR
  let totalOutstandingLoansSar = 0;
  loans.forEach((loan) => {
    const stats = calculateLoanDetails(loan, loanPayments, exchangeRate.rateInrToSar);
    if (!stats.isCompleted) {
      totalOutstandingLoansSar += stats.currentRemainingInSar;
    }
  });

  return (
    <div id="money-module" className="space-y-4 pb-24 pt-1 max-w-4xl mx-auto">
      {/* 1. MONEY OVERVIEW: Responsive Stacked/3-col Card with official symbol */}
      <div className="p-4 sm:p-5 rounded-3xl bg-gradient-to-br from-emerald-950/40 via-teal-950/30 to-indigo-950/40 border border-emerald-500/25 backdrop-blur-xl shadow-xl space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="text-[11px] font-bold text-emerald-400 uppercase tracking-widest">
            Money Overview
          </span>
          <span className="text-xs text-slate-300 font-medium bg-white/5 px-2.5 py-0.5 rounded-full border border-white/10">
            1 SAR = ₹{exchangeRate.rateSarToInr} INR
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 py-1">
          {/* Total Available */}
          <div className="p-2.5 rounded-2xl bg-black/20 border border-white/5">
            <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-semibold">
              Total Available
            </span>
            <span className="text-lg sm:text-xl font-black text-emerald-300 tracking-tight block mt-0.5">
              {formatSAR(totalMoney)}
            </span>
            <span className="text-[10px] text-slate-400 mt-0.5 block">{accounts.length} active accounts</span>
          </div>

          {/* This Month */}
          <div className="p-2.5 rounded-2xl bg-black/20 border border-white/5">
            <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-semibold">
              This Month Spending
            </span>
            <span className="text-lg sm:text-xl font-black text-rose-300 tracking-tight block mt-0.5">
              {formatSAR(currentMonthExpenses)}
            </span>
            <span className="text-[10px] text-slate-400 mt-0.5 block">Spent in {now.toLocaleString('default', { month: 'short' })}</span>
          </div>

          {/* Loans Outstanding */}
          <div className="p-2.5 rounded-2xl bg-black/20 border border-white/5">
            <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-semibold">
              Loan Liability
            </span>
            <span className="text-lg sm:text-xl font-black text-amber-300 tracking-tight block mt-0.5">
              {formatSAR(totalOutstandingLoansSar)}
            </span>
            <span className="text-[10px] text-slate-400 mt-0.5 block">{loans.length} tracked loans</span>
          </div>
        </div>
      </div>

      {/* Segmented Sub-Tabs: [ EXPENSES ] [ ACCOUNTS ] [ LOANS ] */}
      <div className="flex items-center gap-1.5 p-1 bg-white/5 border border-white/10 rounded-2xl">
        <button
          type="button"
          id="tab-money-expenses"
          onClick={() => {
            setActiveSubTab('expenses');
            setSelectedLoanForDetail(null);
          }}
          className={`flex-1 py-2.5 px-3 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 min-h-[44px] ${
            activeSubTab === 'expenses'
              ? 'bg-emerald-600 text-white shadow-md shadow-emerald-950/40'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Wallet className="w-4 h-4 shrink-0" />
          <span>Expenses</span>
        </button>

        <button
          type="button"
          id="tab-money-accounts"
          onClick={() => {
            setActiveSubTab('accounts');
            setSelectedLoanForDetail(null);
          }}
          className={`flex-1 py-2.5 px-3 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 min-h-[44px] ${
            activeSubTab === 'accounts'
              ? 'bg-emerald-600 text-white shadow-md shadow-emerald-950/40'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <CreditCard className="w-4 h-4 shrink-0" />
          <span>Accounts ({accounts.length})</span>
        </button>

        <button
          type="button"
          id="tab-money-loans"
          onClick={() => setActiveSubTab('loans')}
          className={`flex-1 py-2.5 px-3 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 min-h-[44px] ${
            activeSubTab === 'loans'
              ? 'bg-amber-600 text-white shadow-md shadow-amber-950/40'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Landmark className="w-4 h-4 shrink-0" />
          <span>Loans ({loans.length})</span>
        </button>
      </div>

      {/* 1. EXPENSES TAB */}
      {activeSubTab === 'expenses' && (
        <div className="space-y-4">
          {/* Sub Navigation Bar for Expenses */}
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-1 p-1 bg-white/5 border border-white/10 rounded-2xl">
              <button
                type="button"
                id="btn-expense-sub-overview"
                onClick={() => setExpenseSubView('overview')}
                className={`py-1.5 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer min-h-[36px] ${
                  expenseSubView === 'overview'
                    ? 'bg-white/20 text-white'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Overview
              </button>
              <button
                type="button"
                id="btn-expense-sub-history"
                onClick={() => setExpenseSubView('history')}
                className={`py-1.5 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer min-h-[36px] ${
                  expenseSubView === 'history'
                    ? 'bg-white/20 text-white'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Transactions ({transactions.length})
              </button>
              <button
                type="button"
                id="btn-expense-sub-summary"
                onClick={() => setExpenseSubView('summary')}
                className={`py-1.5 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer min-h-[36px] ${
                  expenseSubView === 'summary'
                    ? 'bg-white/20 text-white'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Breakdown
              </button>
            </div>

            <button
              type="button"
              id="btn-add-expense-modal-open"
              onClick={() => setShowAddExpense(true)}
              className="flex items-center gap-1.5 py-2 px-3.5 rounded-2xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold shadow-lg shadow-rose-600/30 transition-all cursor-pointer active:scale-95 shrink-0 min-h-[38px]"
            >
              <MinusCircle className="w-4 h-4" />
              <span>+ Expense</span>
            </button>
          </div>

          {expenseSubView === 'overview' && (
            <div className="space-y-4">
              {/* Quick Actions Strip */}
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  id="btn-add-expense-quick"
                  onClick={() => setShowAddExpense(true)}
                  className="py-3 px-2 rounded-2xl bg-rose-600/20 hover:bg-rose-600/30 border border-rose-500/40 text-rose-200 text-xs font-bold flex flex-col items-center justify-center gap-1 cursor-pointer shadow-md active:scale-98 transition-all min-h-[56px]"
                >
                  <MinusCircle className="w-4 h-4 text-rose-300" />
                  <span>+ Expense</span>
                </button>

                <button
                  type="button"
                  id="btn-add-money-quick"
                  onClick={() => setShowAddMoney(true)}
                  className="py-3 px-2 rounded-2xl bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/40 text-emerald-200 text-xs font-bold flex flex-col items-center justify-center gap-1 cursor-pointer shadow-md active:scale-98 transition-all min-h-[56px]"
                >
                  <PlusCircle className="w-4 h-4 text-emerald-300" />
                  <span>+ Add Money</span>
                </button>

                <button
                  type="button"
                  id="btn-transfer-quick"
                  onClick={() => setShowTransfer(true)}
                  className="py-3 px-2 rounded-2xl bg-cyan-600/20 hover:bg-cyan-600/30 border border-cyan-500/40 text-cyan-200 text-xs font-bold flex flex-col items-center justify-center gap-1 cursor-pointer shadow-md active:scale-98 transition-all min-h-[56px]"
                >
                  <ArrowRightLeft className="w-4 h-4 text-cyan-300" />
                  <span>Transfer</span>
                </button>
              </div>

              {/* Manage Categories Shortcut */}
              <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Tag className="w-4 h-4 text-purple-400 shrink-0" />
                  <span className="text-xs sm:text-sm font-bold text-white">Categories</span>
                  <span className="text-[11px] text-slate-400">({categories.length} custom)</span>
                </div>
                <button
                  type="button"
                  id="btn-manage-categories"
                  onClick={() => setShowCategoriesModal(true)}
                  className="text-xs font-bold text-purple-300 hover:text-white flex items-center gap-1 cursor-pointer py-1 px-2 rounded-lg bg-white/5 hover:bg-white/10"
                >
                  <span>Manage</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Recent Transactions List */}
              <div className="space-y-2.5">
                <div className="flex items-center justify-between px-1">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                    Recent Activity
                  </span>
                  <button
                    type="button"
                    onClick={() => setExpenseSubView('history')}
                    className="text-xs font-bold text-emerald-300 hover:underline cursor-pointer flex items-center gap-0.5"
                  >
                    <span>View All</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                {transactions.length === 0 ? (
                  <div className="p-6 text-center rounded-2xl bg-white/5 border border-white/10 text-slate-400 text-xs">
                    No transactions recorded yet. Tap &apos;+ Expense&apos; or &apos;+ Add Money&apos; above.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {transactions.slice(0, 8).map((tx) => {
                      const sourceAcc = accounts.find((a) => a.id === tx.accountId);
                      const targetAcc = tx.toAccountId ? accounts.find((a) => a.id === tx.toAccountId) : null;
                      const cat = categories.find((c) => c.id === tx.categoryId);
                      const isExpense = tx.type === 'Expense';
                      const isIncome = tx.type === 'Money Added';

                      return (
                        <div
                          key={tx.id}
                          className="p-3.5 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-between gap-2.5"
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div
                              className={`w-8 h-8 rounded-xl flex items-center justify-center text-xs font-black shrink-0 border ${
                                isExpense
                                  ? 'bg-rose-500/20 text-rose-300 border-rose-500/30'
                                  : isIncome
                                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                                  : 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30'
                              }`}
                            >
                              {isExpense ? '-' : isIncome ? '+' : '⇄'}
                            </div>
                            <div className="min-w-0 space-y-0.5">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="text-xs sm:text-sm font-bold text-white">
                                  {tx.type === 'Transfer'
                                    ? `${sourceAcc?.name || 'Account'} → ${targetAcc?.name || 'Account'}`
                                    : sourceAcc?.name || 'Account'}
                                </span>
                                {cat && (
                                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-white/10 text-slate-300">
                                    {cat.name}
                                  </span>
                                )}
                              </div>
                              <div className="text-[11px] text-slate-400 truncate">
                                {formatDate(tx.date)} {tx.remark ? `• ${tx.remark}` : ''}
                              </div>
                            </div>
                          </div>

                          <div className="text-right shrink-0 pl-2">
                            <span
                              className={`text-xs sm:text-sm font-black block whitespace-nowrap ${
                                isExpense
                                  ? 'text-rose-300'
                                  : isIncome
                                  ? 'text-emerald-300'
                                  : 'text-cyan-300'
                              }`}
                            >
                              {isExpense ? '- ' : isIncome ? '+ ' : ''}{formatSAR(Number(tx.amount))}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}

          {expenseSubView === 'history' && (
            <TransactionHistoryView
              transactions={transactions}
              accounts={accounts}
              categories={categories}
              onUpdateTransaction={onUpdateTransaction}
              onDeleteTransaction={onDeleteTransaction}
            />
          )}

          {expenseSubView === 'summary' && (
            <ExpenseSummaryView
              accounts={accounts}
              categories={categories}
              transactions={transactions}
            />
          )}
        </div>
      )}

      {/* 2. ACCOUNTS TAB */}
      {activeSubTab === 'accounts' && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h3 className="text-base font-bold text-white">My Money Accounts</h3>
              <p className="text-xs text-slate-400">Balances, cash, and bank accounts</p>
            </div>
            <button
              type="button"
              id="btn-manage-accounts-open"
              onClick={() => setShowAccountsModal(true)}
              className="flex items-center gap-1.5 py-2 px-3.5 rounded-2xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-bold transition-all shadow-md cursor-pointer min-h-[38px]"
            >
              <Settings className="w-4 h-4" />
              <span>Manage Accounts</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {accounts.map((acc) => (
              <div
                key={acc.id}
                className="p-4 rounded-3xl bg-white/5 border border-white/10 space-y-3.5 backdrop-blur-xl shadow-lg"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <div
                      className="w-4 h-4 rounded-full shrink-0 shadow-sm"
                      style={{ backgroundColor: acc.color || '#8b5cf6' }}
                    />
                    <div>
                      <h4 className="text-sm sm:text-base font-bold text-white">{acc.name}</h4>
                      <span className="text-[11px] text-slate-400 block">
                        Opening: {formatSAR(Number(acc.openingBalance ?? 0))}
                      </span>
                    </div>
                  </div>

                  <span className="text-base sm:text-lg font-black text-emerald-300 whitespace-nowrap">
                    {formatSAR(Number(acc.currentBalance))}
                  </span>
                </div>

                {/* Quick actions for this specific account */}
                <div className="grid grid-cols-3 gap-2 pt-2 border-t border-white/10">
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedAccountId(acc.id);
                      setShowAddExpense(true);
                    }}
                    className="py-2 px-2 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 text-rose-200 text-xs font-bold text-center cursor-pointer transition-all min-h-[36px]"
                  >
                    - Spend
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedAccountId(acc.id);
                      setShowAddMoney(true);
                    }}
                    className="py-2 px-2 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-200 text-xs font-bold text-center cursor-pointer transition-all min-h-[36px]"
                  >
                    + Add
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedAccountId(acc.id);
                      setShowTransfer(true);
                    }}
                    className="py-2 px-2 rounded-xl bg-cyan-500/15 hover:bg-cyan-500/25 text-cyan-200 text-xs font-bold text-center cursor-pointer transition-all min-h-[36px]"
                  >
                    ⇄ Transfer
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 3. LOANS TAB */}
      {activeSubTab === 'loans' && (
        <div className="space-y-4">
          {selectedLoanForDetail ? (
            <LoanDetailView
              loan={selectedLoanForDetail}
              payments={loanPayments.filter((p) => p.loanId === selectedLoanForDetail.id)}
              contributors={contributors}
              accounts={accounts}
              exchangeRate={exchangeRate}
              onBack={() => setSelectedLoanForDetail(null)}
              onOpenEditLoan={(loan) => {
                setLoanForEdit(loan);
                setShowCreateLoan(true);
              }}
              onDeleteLoan={(loanId) => {
                onDeleteLoan(loanId);
                setSelectedLoanForDetail(null);
              }}
              onOpenAddPayment={(loanId) => {
                setSelectedLoanForPaymentId(loanId);
                setShowAddPayment(true);
              }}
              onDeletePayment={onDeleteLoanPayment}
            />
          ) : (
            <LoanDashboard
              loans={loans}
              payments={loanPayments}
              contributors={contributors}
              accounts={accounts}
              exchangeRate={exchangeRate}
              isRefreshingRate={isRefreshingRate}
              onRefreshExchangeRate={onRefreshExchangeRate}
              onOpenCreateLoan={() => {
                setLoanForEdit(null);
                setShowCreateLoan(true);
              }}
              onOpenAddPayment={(loanId) => {
                setSelectedLoanForPaymentId(loanId);
                setShowAddPayment(true);
              }}
              onOpenManageContributors={() => setShowContributorsModal(true)}
              onSelectLoan={(loan) => setSelectedLoanForDetail(loan)}
            />
          )}
        </div>
      )}

      {/* Modals for Expenses & Accounts */}
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

      {/* Modals for Loans */}
      <CreateLoanModal
        isOpen={showCreateLoan}
        onClose={() => {
          setShowCreateLoan(false);
          setLoanForEdit(null);
        }}
        onSaveLoan={(loanData) => {
          if (loanForEdit) {
            const updatedLoan: Loan = {
              ...loanForEdit,
              ...loanData,
            };
            onUpdateLoan(updatedLoan);
            if (selectedLoanForDetail && selectedLoanForDetail.id === updatedLoan.id) {
              setSelectedLoanForDetail(updatedLoan);
            }
          } else {
            onCreateLoan(loanData);
          }
          setLoanForEdit(null);
        }}
        editingLoan={loanForEdit}
        exchangeRate={exchangeRate}
      />

      <AddLoanPaymentModal
        isOpen={showAddPayment}
        onClose={() => {
          setShowAddPayment(false);
          setSelectedLoanForPaymentId(undefined);
        }}
        loans={loans}
        contributors={contributors}
        accounts={accounts}
        exchangeRate={exchangeRate}
        preselectedLoanId={selectedLoanForPaymentId}
        onAddPayment={onAddLoanPayment}
        onOpenManageContributors={() => setShowContributorsModal(true)}
      />

      <ManageContributorsModal
        isOpen={showContributorsModal}
        onClose={() => setShowContributorsModal(false)}
        contributors={contributors}
        onAddContributor={onAddContributor}
        onDeleteContributor={onDeleteContributor}
      />
    </div>
  );
};

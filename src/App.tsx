import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Task,
  FilterTab,
  FollowUpHistoryEntry,
  ActiveModule,
  MoneyAccount,
  ExpenseCategory,
  Transaction,
  Note,
  Loan,
  LoanPayment,
  Contributor,
  ExchangeRateRecord,
  SecuritySettings,
} from './types';
import {
  loadTasksFromStorage,
  saveTasksToStorage,
  resetTasksToDefault,
  loadAccountsFromStorage,
  saveAccountsToStorage,
  loadCategoriesFromStorage,
  saveCategoriesToStorage,
  loadTransactionsFromStorage,
  saveTransactionsToStorage,
  recalculateAccountBalances,
  loadNotesFromStorage,
  saveNotesToStorage,
  loadLoansFromStorage,
  saveLoansToStorage,
  loadLoanPaymentsFromStorage,
  saveLoanPaymentsToStorage,
  loadContributorsFromStorage,
  saveContributorsToStorage,
  loadSecuritySettings,
  saveSecuritySettings,
} from './utils/storage';
import {
  INITIAL_SAMPLE_ACCOUNTS,
  INITIAL_SAMPLE_CATEGORIES,
  INITIAL_SAMPLE_TRANSACTIONS,
  INITIAL_SAMPLE_NOTES,
  INITIAL_SAMPLE_LOANS,
  INITIAL_SAMPLE_LOAN_PAYMENTS,
  INITIAL_SAMPLE_CONTRIBUTORS,
  DEFAULT_SECURITY_SETTINGS,
} from './data/sampleData';
import { loadStoredExchangeRate, saveStoredExchangeRate, fetchLiveExchangeRate } from './utils/exchangeRate';
import { isDateOverdue, isDateToday } from './utils/dateUtils';
import { HubHeader } from './components/HubHeader';
import { HomeScreen } from './components/home/HomeScreen';
import { ExpenseDashboard } from './components/expenses/ExpenseDashboard';
import { AddExpenseModal } from './components/expenses/AddExpenseModal';
import { NotesView } from './components/notes/NotesView';
import { CalendarView } from './components/calendar/CalendarView';
import { SummaryView } from './components/summary/SummaryView';
import { LoanDashboard } from './components/loans/LoanDashboard';
import { LoanDetailView } from './components/loans/LoanDetailView';
import { CreateLoanModal } from './components/loans/CreateLoanModal';
import { AddLoanPaymentModal } from './components/loans/AddLoanPaymentModal';
import { ManageContributorsModal } from './components/loans/ManageContributorsModal';
import { LockScreen } from './components/security/LockScreen';
import { SecuritySettingsModal } from './components/security/SecuritySettingsModal';
import { BackupRestoreModal } from './components/backup/BackupRestoreModal';
import { OfflineIndicator } from './components/OfflineIndicator';
import { BottomNavBar } from './components/BottomNavBar';
import { DashboardView } from './components/DashboardView';
import { TaskListView } from './components/TaskListView';
import { TaskDetailView } from './components/TaskDetailView';
import { CreateTaskModal } from './components/CreateTaskModal';
import { QuickFollowUpSheet } from './components/QuickFollowUpSheet';
import { FollowUpWishlistModule } from './components/followup/FollowUpWishlistModule';
import { MoneyModule } from './components/money/MoneyModule';
import { Smartphone, Monitor } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function App() {
  // Navigation State
  const [activeModule, setActiveModule] = useState<ActiveModule>('home');
  const [activeTab, setActiveTab] = useState<FilterTab>('Dashboard');
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);

  // Modals & Sheets
  const [quickFollowUpTask, setQuickFollowUpTask] = useState<Task | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isQuickExpenseOpen, setIsQuickExpenseOpen] = useState(false);
  const [isFrameMode, setIsFrameMode] = useState(true); // Desktop Phone Frame toggle

  // 1. FollowUp Tasks State (100% PRESERVED)
  const [tasks, setTasks] = useState<Task[]>([]);

  // 2. Money Accounts State
  const [accounts, setAccounts] = useState<MoneyAccount[]>([]);

  // 3. Expense Categories State
  const [categories, setCategories] = useState<ExpenseCategory[]>([]);

  // 4. Transactions State
  const [transactions, setTransactions] = useState<Transaction[]>([]);

  // 5. Notes State
  const [notes, setNotes] = useState<Note[]>([]);

  // 6. Loans State
  const [loans, setLoans] = useState<Loan[]>([]);
  const [loanPayments, setLoanPayments] = useState<LoanPayment[]>([]);
  const [contributors, setContributors] = useState<Contributor[]>([]);
  const [exchangeRate, setExchangeRate] = useState<ExchangeRateRecord>(() => loadStoredExchangeRate());
  const [isRefreshingRate, setIsRefreshingRate] = useState(false);
  const [selectedLoanForDetail, setSelectedLoanForDetail] = useState<Loan | null>(null);

  // Loan Modals State
  const [isCreateLoanOpen, setIsCreateLoanOpen] = useState(false);
  const [loanForEdit, setLoanForEdit] = useState<Loan | null>(null);
  const [isAddLoanPaymentOpen, setIsAddLoanPaymentOpen] = useState(false);
  const [loanIdForPayment, setLoanIdForPayment] = useState<string | undefined>(undefined);
  const [isManageContributorsOpen, setIsManageContributorsOpen] = useState(false);

  // 7. Security & App Lock State
  const [securitySettings, setSecuritySettings] = useState<SecuritySettings>(() => loadSecuritySettings());
  const [isLocked, setIsLocked] = useState<boolean>(() => {
    const settings = loadSecuritySettings();
    return settings.isPinEnabled;
  });
  const [isSecurityModalOpen, setIsSecurityModalOpen] = useState(false);
  const [isBackupModalOpen, setIsBackupModalOpen] = useState(false);

  const lastActivityRef = useRef<number>(Date.now());

  // Load all data on mount
  const loadAllDataFromStorage = useCallback(() => {
    const loadedTasks = loadTasksFromStorage();
    const rawAccounts = loadAccountsFromStorage();
    const loadedCategories = loadCategoriesFromStorage();
    const loadedTransactions = loadTransactionsFromStorage();
    const loadedNotes = loadNotesFromStorage();
    const loadedLoans = loadLoansFromStorage();
    const loadedLoanPayments = loadLoanPaymentsFromStorage();
    const loadedContributors = loadContributorsFromStorage();
    const loadedRate = loadStoredExchangeRate();
    const loadedSecurity = loadSecuritySettings();

    // Recalculate account balances dynamically
    const recalculatedAccounts = recalculateAccountBalances(rawAccounts, loadedTransactions);

    setTasks(loadedTasks);
    setAccounts(recalculatedAccounts);
    setCategories(loadedCategories);
    setTransactions(loadedTransactions);
    setNotes(loadedNotes);
    setLoans(loadedLoans);
    setLoanPayments(loadedLoanPayments);
    setContributors(loadedContributors);
    setExchangeRate(loadedRate);
    setSecuritySettings(loadedSecurity);
  }, []);

  useEffect(() => {
    loadAllDataFromStorage();

    // Auto-fetch exchange rate in background
    fetchLiveExchangeRate().then(({ record }) => {
      setExchangeRate(record);
    });
  }, [loadAllDataFromStorage]);

  // Handle Auto-Lock Timer & Visibility change
  useEffect(() => {
    const handleActivity = () => {
      lastActivityRef.current = Date.now();
    };

    window.addEventListener('mousemove', handleActivity);
    window.addEventListener('keydown', handleActivity);
    window.addEventListener('touchstart', handleActivity);

    const handleVisibilityChange = () => {
      if (document.hidden && securitySettings.isPinEnabled) {
        if (securitySettings.autoLockTimeout === 'immediately') {
          setIsLocked(true);
        }
      } else if (!document.hidden && securitySettings.isPinEnabled) {
        const elapsed = Date.now() - lastActivityRef.current;
        let timeoutMs = 5 * 60 * 1000;
        if (securitySettings.autoLockTimeout === 'immediately') timeoutMs = 0;
        else if (securitySettings.autoLockTimeout === '1m') timeoutMs = 1 * 60 * 1000;
        else if (securitySettings.autoLockTimeout === '5m') timeoutMs = 5 * 60 * 1000;
        else if (securitySettings.autoLockTimeout === '15m') timeoutMs = 15 * 60 * 1000;

        if (elapsed > timeoutMs) {
          setIsLocked(true);
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('mousemove', handleActivity);
      window.removeEventListener('keydown', handleActivity);
      window.removeEventListener('touchstart', handleActivity);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [securitySettings]);

  // ==========================================
  // FOLLOWUP TASKS HANDLERS (PRESERVED)
  // ==========================================
  const updateTasksState = (newTasks: Task[]) => {
    setTasks(newTasks);
    saveTasksToStorage(newTasks);
  };

  const handleCreateTask = (newTask: Task) => {
    const updated = [newTask, ...tasks];
    updateTasksState(updated);
  };

  const handleUpdateTask = (updatedTask: Task) => {
    const updated = tasks.map((t) => (t.id === updatedTask.id ? updatedTask : t));
    updateTasksState(updated);
    if (selectedTask && selectedTask.id === updatedTask.id) {
      setSelectedTask(updatedTask);
    }
  };

  const handleSaveFollowUp = (updatedTask: Task, _newEntry: FollowUpHistoryEntry) => {
    handleUpdateTask(updatedTask);
  };

  const handleDeleteTask = (taskId: string) => {
    const updated = tasks.filter((t) => t.id !== taskId);
    updateTasksState(updated);
    setSelectedTask(null);
  };

  const handleConvertToTask = (wishlistTask: Task) => {
    const todayStr = new Date().toISOString().slice(0, 10);
    const updatedTask: Task = {
      ...wishlistTask,
      category: 'Personal',
      followUpDate: wishlistTask.followUpDate || todayStr,
      status: 'Pending',
      completionPercentage: wishlistTask.completionPercentage || 0,
      remarks: wishlistTask.remarks ? `${wishlistTask.remarks} (Converted from Wishlist)` : 'Converted from Wishlist',
      history: [
        ...(wishlistTask.history || []),
        {
          id: `hist_${Date.now()}`,
          date: todayStr,
          remark: 'Converted from Wishlist to Active Follow-Up Task',
          completionPercentage: 0,
          createdAt: new Date().toISOString(),
        },
      ],
    };
    handleUpdateTask(updatedTask);
  };

  // ==========================================
  // EXPENSES & TRANSACTIONS HANDLERS
  // ==========================================
  const updateTransactionsAndRecalculate = (newTxList: Transaction[], currentAccs = accounts) => {
    setTransactions(newTxList);
    saveTransactionsToStorage(newTxList);

    const recomputedAccounts = recalculateAccountBalances(currentAccs, newTxList);
    setAccounts(recomputedAccounts);
    saveAccountsToStorage(recomputedAccounts);
  };

  const handleAddExpense = (txData: Omit<Transaction, 'id' | 'createdAt'>) => {
    const newTx: Transaction = {
      ...txData,
      id: `tx_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      createdAt: new Date().toISOString(),
    };
    const updated = [newTx, ...transactions];
    updateTransactionsAndRecalculate(updated);
  };

  const handleAddMoney = (txData: Omit<Transaction, 'id' | 'createdAt'>) => {
    const newTx: Transaction = {
      ...txData,
      id: `tx_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      createdAt: new Date().toISOString(),
    };
    const updated = [newTx, ...transactions];
    updateTransactionsAndRecalculate(updated);
  };

  const handleTransfer = (txData: Omit<Transaction, 'id' | 'createdAt'>) => {
    const newTx: Transaction = {
      ...txData,
      id: `tx_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      createdAt: new Date().toISOString(),
    };
    const updated = [newTx, ...transactions];
    updateTransactionsAndRecalculate(updated);
  };

  const handleUpdateTransaction = (updatedTx: Transaction) => {
    const updated = transactions.map((tx) => (tx.id === updatedTx.id ? updatedTx : tx));
    updateTransactionsAndRecalculate(updated);
  };

  const handleDeleteTransaction = (txId: string) => {
    const updated = transactions.filter((tx) => tx.id !== txId);
    updateTransactionsAndRecalculate(updated);
  };

  // Accounts Management
  const handleAddAccount = (name: string, openingBalance: number, color?: string) => {
    const newAcc: MoneyAccount = {
      id: `acc_${Date.now()}`,
      name,
      openingBalance,
      currentBalance: openingBalance,
      color: color || '#8b5cf6',
      createdAt: new Date().toISOString(),
    };
    const newAccs = [...accounts, newAcc];
    const recomputed = recalculateAccountBalances(newAccs, transactions);
    setAccounts(recomputed);
    saveAccountsToStorage(recomputed);
  };

  const handleUpdateAccount = (updatedAcc: MoneyAccount) => {
    const newAccs = accounts.map((a) => (a.id === updatedAcc.id ? updatedAcc : a));
    const recomputed = recalculateAccountBalances(newAccs, transactions);
    setAccounts(recomputed);
    saveAccountsToStorage(recomputed);
  };

  const handleDeleteAccount = (accId: string) => {
    const newAccs = accounts.filter((a) => a.id !== accId);
    const recomputed = recalculateAccountBalances(newAccs, transactions);
    setAccounts(recomputed);
    saveAccountsToStorage(recomputed);
  };

  // Categories Management
  const handleAddCategory = (name: string, color?: string) => {
    const newCat: ExpenseCategory = {
      id: `cat_${Date.now()}`,
      name,
      color: color || '#a855f7',
      order: categories.length + 1,
    };
    const updated = [...categories, newCat];
    setCategories(updated);
    saveCategoriesToStorage(updated);
  };

  const handleRenameCategory = (categoryId: string, newName: string) => {
    const updated = categories.map((c) => (c.id === categoryId ? { ...c, name: newName } : c));
    setCategories(updated);
    saveCategoriesToStorage(updated);
  };

  const handleDeleteCategory = (categoryId: string) => {
    const updated = categories.filter((c) => c.id !== categoryId);
    setCategories(updated);
    saveCategoriesToStorage(updated);
  };

  const handleReorderCategories = (newCategories: ExpenseCategory[]) => {
    setCategories(newCategories);
    saveCategoriesToStorage(newCategories);
  };

  // ==========================================
  // NOTES HANDLERS
  // ==========================================
  const updateNotesState = (newNotes: Note[]) => {
    setNotes(newNotes);
    saveNotesToStorage(newNotes);
  };

  const handleAddNote = (noteData: Omit<Note, 'id' | 'createdDate' | 'modifiedDate'>) => {
    const newNote: Note = {
      ...noteData,
      id: `note_${Date.now()}`,
      createdDate: new Date().toISOString().split('T')[0],
      modifiedDate: new Date().toISOString().split('T')[0],
    };
    const updated = [newNote, ...notes];
    updateNotesState(updated);
  };

  const handleUpdateNote = (updatedNote: Note) => {
    const updated = notes.map((n) => (n.id === updatedNote.id ? updatedNote : n));
    updateNotesState(updated);
  };

  const handleDeleteNote = (noteId: string) => {
    const updated = notes.filter((n) => n.id !== noteId);
    updateNotesState(updated);
  };

  // ==========================================
  // LOANS HANDLERS
  // ==========================================
  const handleCreateLoan = (loanData: Omit<Loan, 'id' | 'createdAt'>) => {
    const newLoan: Loan = {
      ...loanData,
      id: `loan_${Date.now()}_${Math.random().toString(36).substring(2, 5)}`,
      createdAt: new Date().toISOString(),
    };
    const updated = [newLoan, ...loans];
    setLoans(updated);
    saveLoansToStorage(updated);
  };

  const handleUpdateLoan = (updatedLoan: Loan) => {
    const updated = loans.map((l) => (l.id === updatedLoan.id ? updatedLoan : l));
    setLoans(updated);
    saveLoansToStorage(updated);
    if (selectedLoanForDetail && selectedLoanForDetail.id === updatedLoan.id) {
      setSelectedLoanForDetail(updatedLoan);
    }
  };

  const handleDeleteLoan = (loanId: string) => {
    const updatedLoans = loans.filter((l) => l.id !== loanId);
    setLoans(updatedLoans);
    saveLoansToStorage(updatedLoans);

    // Also remove associated payments
    const updatedPayments = loanPayments.filter((p) => p.loanId !== loanId);
    setLoanPayments(updatedPayments);
    saveLoanPaymentsToStorage(updatedPayments);

    if (selectedLoanForDetail && selectedLoanForDetail.id === loanId) {
      setSelectedLoanForDetail(null);
    }
  };

  const handleAddLoanPayment = (
    paymentData: Omit<LoanPayment, 'id' | 'createdAt' | 'exchangeRateUsed'>
  ) => {
    // Lock in the exchange rate active on the payment date
    const rateToUse =
      paymentData.currency === 'INR'
        ? exchangeRate.rateInrToSar
        : 1;

    const newPayment: LoanPayment = {
      ...paymentData,
      id: `lp_${Date.now()}_${Math.random().toString(36).substring(2, 5)}`,
      exchangeRateUsed: rateToUse,
      createdAt: new Date().toISOString(),
    };

    const updatedPayments = [newPayment, ...loanPayments];
    setLoanPayments(updatedPayments);
    saveLoanPaymentsToStorage(updatedPayments);

    // If an account was chosen and paid by "Me", record a linked expense transaction
    if (paymentData.accountId && paymentData.paidBy === 'Me') {
      const loanObj = loans.find((l) => l.id === paymentData.loanId);
      const loanName = loanObj ? loanObj.name : 'Loan';

      const linkedTx: Transaction = {
        id: `tx_loan_${newPayment.id}`,
        type: 'Expense',
        amount: paymentData.amount,
        accountId: paymentData.accountId,
        categoryId: 'cat-bills',
        date: paymentData.date,
        remark: `Loan EMI Payment: ${loanName} (${paymentData.currency} ${paymentData.amount})`,
        createdAt: new Date().toISOString(),
      };

      const updatedTxs = [linkedTx, ...transactions];
      updateTransactionsAndRecalculate(updatedTxs);
    }
  };

  const handleDeleteLoanPayment = (paymentId: string) => {
    const payment = loanPayments.find((p) => p.id === paymentId);
    const updatedPayments = loanPayments.filter((p) => p.id !== paymentId);
    setLoanPayments(updatedPayments);
    saveLoanPaymentsToStorage(updatedPayments);

    // Also remove linked transaction if exists
    if (payment) {
      const linkedTxId = `tx_loan_${paymentId}`;
      const updatedTxs = transactions.filter((t) => t.id !== linkedTxId);
      if (updatedTxs.length !== transactions.length) {
        updateTransactionsAndRecalculate(updatedTxs);
      }
    }
  };

  // Contributors Management
  const handleAddContributor = (name: string) => {
    const newContrib: Contributor = {
      id: `contrib_${Date.now()}`,
      name,
    };
    const updated = [...contributors, newContrib];
    setContributors(updated);
    saveContributorsToStorage(updated);
  };

  const handleUpdateContributor = (id: string, name: string) => {
    const updated = contributors.map((c) => (c.id === id ? { ...c, name } : c));
    setContributors(updated);
    saveContributorsToStorage(updated);
  };

  const handleDeleteContributor = (id: string) => {
    const updated = contributors.filter((c) => c.id !== id);
    setContributors(updated);
    saveContributorsToStorage(updated);
  };

  const handleRefreshExchangeRate = async () => {
    setIsRefreshingRate(true);
    try {
      const { record } = await fetchLiveExchangeRate();
      setExchangeRate(record);
    } finally {
      setIsRefreshingRate(false);
    }
  };

  // ==========================================
  // SECURITY & BACKUP HANDLERS
  // ==========================================
  const handleUpdateSecuritySettings = (newSettings: SecuritySettings) => {
    setSecuritySettings(newSettings);
    saveSecuritySettings(newSettings);
  };

  const handleLockNow = () => {
    setIsLocked(true);
  };

  const handleUnlock = () => {
    setIsLocked(false);
    lastActivityRef.current = Date.now();
  };

  const handleDataRestored = () => {
    loadAllDataFromStorage();
    setSelectedTask(null);
    setSelectedLoanForDetail(null);
    setActiveModule('home');
  };

  const handleResetAllData = () => {
    const resetTasks = resetTasksToDefault();
    const rawAccs = INITIAL_SAMPLE_ACCOUNTS;
    const cats = INITIAL_SAMPLE_CATEGORIES;
    const txs = INITIAL_SAMPLE_TRANSACTIONS;
    const nts = INITIAL_SAMPLE_NOTES;
    const sampleLoans = INITIAL_SAMPLE_LOANS;
    const samplePayments = INITIAL_SAMPLE_LOAN_PAYMENTS;
    const sampleContributors = INITIAL_SAMPLE_CONTRIBUTORS;

    const recomputedAccs = recalculateAccountBalances(rawAccs, txs);

    setTasks(resetTasks);
    setAccounts(recomputedAccs);
    setCategories(cats);
    setTransactions(txs);
    setNotes(nts);
    setLoans(sampleLoans);
    setLoanPayments(samplePayments);
    setContributors(sampleContributors);

    saveAccountsToStorage(recomputedAccs);
    saveCategoriesToStorage(cats);
    saveTransactionsToStorage(txs);
    saveNotesToStorage(nts);
    saveLoansToStorage(sampleLoans);
    saveLoanPaymentsToStorage(samplePayments);
    saveContributorsToStorage(sampleContributors);

    setSelectedTask(null);
    setSelectedLoanForDetail(null);
  };

  const handleClearAllData = () => {
    setTasks([]);
    setAccounts([]);
    setTransactions([]);
    setNotes([]);
    setLoans([]);
    setLoanPayments([]);
    setContributors([]);

    saveTasksToStorage([]);
    saveAccountsToStorage([]);
    saveTransactionsToStorage([]);
    saveNotesToStorage([]);
    saveLoansToStorage([]);
    saveLoanPaymentsToStorage([]);
    saveContributorsToStorage([]);

    setSelectedTask(null);
    setSelectedLoanForDetail(null);
    setActiveModule('home');
  };

  // Mobile Back Button Navigation listener using HTML5 History API
  useEffect(() => {
    const handlePopState = () => {
      // 1. Modals first
      if (isCreateModalOpen) {
        setIsCreateModalOpen(false);
        return;
      }
      if (isBackupModalOpen) {
        setIsBackupModalOpen(false);
        return;
      }
      if (isSecurityModalOpen) {
        setIsSecurityModalOpen(false);
        return;
      }
      if (quickFollowUpTask) {
        setQuickFollowUpTask(null);
        return;
      }
      if (isQuickExpenseOpen) {
        setIsQuickExpenseOpen(false);
        return;
      }
      if (isCreateLoanOpen) {
        setIsCreateLoanOpen(false);
        return;
      }
      if (isAddLoanPaymentOpen) {
        setIsAddLoanPaymentOpen(false);
        return;
      }
      if (isManageContributorsOpen) {
        setIsManageContributorsOpen(false);
        return;
      }

      // 2. Task detail
      if (selectedTask) {
        setSelectedTask(null);
        return;
      }

      // 3. Loan detail
      if (selectedLoanForDetail) {
        setSelectedLoanForDetail(null);
        return;
      }

      // 4. Sub-modules back to home
      if (activeModule !== 'home') {
        setActiveModule('home');
        return;
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [
    isCreateModalOpen,
    isBackupModalOpen,
    isSecurityModalOpen,
    quickFollowUpTask,
    isQuickExpenseOpen,
    isCreateLoanOpen,
    isAddLoanPaymentOpen,
    isManageContributorsOpen,
    selectedTask,
    selectedLoanForDetail,
    activeModule,
  ]);

  // Count calculations for bottom bar badge indicators
  const overdueCount = tasks.filter(
    (t) => t.status !== 'Completed' && t.completionPercentage < 100 && isDateOverdue(t.followUpDate)
  ).length;

  const todayCount = tasks.filter(
    (t) => t.status !== 'Completed' && t.completionPercentage < 100 && isDateToday(t.followUpDate)
  ).length;

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-start sm:py-6 selection:bg-violet-500 selection:text-white text-slate-200 font-sans relative"
      style={{ background: 'radial-gradient(circle at 0% 0%, #1e1b4b 0%, #0d0e12 100%)' }}
    >
      {/* App Lock Screen (Full Shield) */}
      {isLocked && (
        <LockScreen
          securitySettings={securitySettings}
          onUnlock={handleUnlock}
        />
      )}

      {/* Desktop Helper Toggle for Android Frame */}
      <div className="hidden sm:flex items-center justify-between w-full max-w-md px-4 mb-2 text-xs text-slate-400">
        <span className="font-medium flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-violet-500 shadow-[0_0_8px_rgba(139,92,246,0.8)]"></span>
          Frosted Glass • Personal Hub
        </span>
        <button
          type="button"
          onClick={() => setIsFrameMode(!isFrameMode)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/15 text-slate-200 hover:bg-white/20 transition-all cursor-pointer shadow-lg"
        >
          {isFrameMode ? <Monitor className="w-3.5 h-3.5" /> : <Smartphone className="w-3.5 h-3.5" />}
          <span>{isFrameMode ? 'Full Width' : 'Phone Frame'}</span>
        </button>
      </div>

      {/* Main Container - Android Mockup on Desktop, 100% Fluid on Mobile */}
      <main
        id="app-viewport-container"
        className={`w-full bg-[#0d0e12]/85 backdrop-blur-2xl overflow-hidden flex flex-col transition-all relative text-slate-200 ${
          isFrameMode
            ? 'sm:max-w-md sm:rounded-[2.5rem] sm:shadow-2xl sm:shadow-violet-950/40 sm:border sm:border-white/15 sm:min-h-[840px] sm:max-h-[92vh] sm:overflow-y-auto'
            : 'max-w-2xl min-h-screen sm:border sm:border-white/15 sm:rounded-3xl'
        }`}
      >
        {/* Unified Hub Header */}
        {!selectedTask && !selectedLoanForDetail && (
          <HubHeader
            activeModule={activeModule}
            onNavigateHome={() => {
              setActiveModule('home');
              setSelectedTask(null);
              setSelectedLoanForDetail(null);
            }}
            onBack={() => {
              if (selectedTask) {
                setSelectedTask(null);
              } else if (selectedLoanForDetail) {
                setSelectedLoanForDetail(null);
              } else if (activeModule !== 'home') {
                setActiveModule('home');
              }
            }}
            onResetAllData={handleResetAllData}
            onClearAllData={handleClearAllData}
            onOpenBackupModal={() => {
              window.history.pushState({ modal: 'backup' }, '');
              setIsBackupModalOpen(true);
            }}
            onOpenSecurityModal={() => {
              window.history.pushState({ modal: 'security' }, '');
              setIsSecurityModalOpen(true);
            }}
            onLockNow={handleLockNow}
            isPinEnabled={securitySettings.isPinEnabled}
          />
        )}

        {/* View Switcher across Modules */}
        <div className="flex-1 overflow-y-auto relative">
          <AnimatePresence mode="wait">
            {/* 1. TASK DETAIL VIEW (IF TASK SELECTED) */}
            {selectedTask ? (
              <motion.div
                key={`detail-${selectedTask.id}`}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
              >
                <TaskDetailView
                  task={selectedTask}
                  onBack={() => setSelectedTask(null)}
                  onUpdateTask={handleUpdateTask}
                  onDeleteTask={handleDeleteTask}
                  onOpenQuickFollowUp={(t) => setQuickFollowUpTask(t)}
                />
              </motion.div>
            ) : activeModule === 'home' ? (
              /* 2. HOME SCREEN (PERSONAL HUB 4-MODULE ARCHITECTURE) */
              <motion.div
                key="hub-home-view"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.15 }}
              >
                <HomeScreen
                  tasks={tasks}
                  accounts={accounts}
                  transactions={transactions}
                  notes={notes}
                  loans={loans}
                  loanPayments={loanPayments}
                  exchangeRate={exchangeRate}
                  onNavigateToFollowUp={(tab) => {
                    window.history.pushState({ module: 'followup', tab }, '');
                    setActiveTab((tab as FilterTab) || 'Active');
                    setActiveModule('followup');
                  }}
                  onNavigateToMoney={(subTab) => {
                    window.history.pushState({ module: 'money', subTab }, '');
                    setActiveModule('money');
                  }}
                  onNavigateToNotes={() => {
                    window.history.pushState({ module: 'notes' }, '');
                    setActiveModule('notes');
                  }}
                  onNavigateToSummary={() => {
                    window.history.pushState({ module: 'summary' }, '');
                    setActiveModule('summary');
                  }}
                  onQuickNewTask={() => {
                    window.history.pushState({ modal: 'createTask' }, '');
                    setIsCreateModalOpen(true);
                  }}
                  onQuickNewExpense={() => {
                    window.history.pushState({ modal: 'quickExpense' }, '');
                    setIsQuickExpenseOpen(true);
                  }}
                  onQuickNewNote={() => {
                    window.history.pushState({ module: 'notes' }, '');
                    setActiveModule('notes');
                  }}
                  onQuickLoanPayment={() => {
                    window.history.pushState({ modal: 'loanPayment' }, '');
                    setLoanIdForPayment(undefined);
                    setIsAddLoanPaymentOpen(true);
                  }}
                />
              </motion.div>
            ) : activeModule === 'followup' ? (
              /* 3. FOLLOW UP & WISHLIST MODULE */
              <motion.div
                key="hub-followup-view"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.15 }}
                className="p-4"
              >
                <FollowUpWishlistModule
                  tasks={tasks}
                  initialTab={activeTab === 'Wishlist' ? 'Wishlist' : activeTab === 'Today' ? 'Today' : 'Active'}
                  onSelectTask={(task) => {
                    window.history.pushState({ task: task.id }, '');
                    setSelectedTask(task);
                  }}
                  onQuickFollowUp={(task, e) => {
                    e.stopPropagation();
                    setQuickFollowUpTask(task);
                  }}
                  onOpenCreate={(initialCat) => {
                    if (initialCat === 'Wishlist') {
                      setActiveTab('Wishlist');
                    }
                    setIsCreateModalOpen(true);
                  }}
                  onConvertToTask={handleConvertToTask}
                />
              </motion.div>
            ) : activeModule === 'money' || activeModule === 'expenses' || activeModule === 'loans' ? (
              /* 4. MONEY MODULE (EXPENSES, ACCOUNTS & LOANS) */
              <motion.div
                key="hub-money-view"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.15 }}
                className="p-4"
              >
                <MoneyModule
                  accounts={accounts}
                  categories={categories}
                  transactions={transactions}
                  loans={loans}
                  loanPayments={loanPayments}
                  contributors={contributors}
                  exchangeRate={exchangeRate}
                  isRefreshingRate={isRefreshingRate}
                  initialTab={activeModule === 'loans' ? 'loans' : 'expenses'}
                  onAddExpense={handleAddExpense}
                  onAddMoney={handleAddMoney}
                  onTransfer={handleTransfer}
                  onUpdateTransaction={handleUpdateTransaction}
                  onDeleteTransaction={handleDeleteTransaction}
                  onAddAccount={handleAddAccount}
                  onUpdateAccount={handleUpdateAccount}
                  onDeleteAccount={handleDeleteAccount}
                  onAddCategory={handleAddCategory}
                  onRenameCategory={handleRenameCategory}
                  onDeleteCategory={handleDeleteCategory}
                  onReorderCategories={handleReorderCategories}
                  onRefreshExchangeRate={handleRefreshExchangeRate}
                  onCreateLoan={handleCreateLoan}
                  onUpdateLoan={handleUpdateLoan}
                  onDeleteLoan={handleDeleteLoan}
                  onAddLoanPayment={handleAddLoanPayment}
                  onDeleteLoanPayment={handleDeleteLoanPayment}
                  onAddContributor={handleAddContributor}
                  onDeleteContributor={handleDeleteContributor}
                />
              </motion.div>
            ) : activeModule === 'notes' ? (
              /* 5. NOTES MODULE */
              <motion.div
                key="hub-notes-view"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.15 }}
              >
                <NotesView
                  notes={notes}
                  onAddNote={handleAddNote}
                  onUpdateNote={handleUpdateNote}
                  onDeleteNote={handleDeleteNote}
                />
              </motion.div>
            ) : activeModule === 'calendar' ? (
              /* 6. CALENDAR MODULE */
              <motion.div
                key="hub-calendar-view"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.15 }}
              >
                <CalendarView
                  tasks={tasks}
                  onSelectTask={(task) => setSelectedTask(task)}
                  onNavigateToFollowUp={(tab) => {
                    setActiveTab((tab as FilterTab) || 'Today');
                    setActiveModule('followup');
                  }}
                />
              </motion.div>
            ) : (
              /* 7. SUMMARY MODULE */
              <motion.div
                key="hub-summary-view"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.15 }}
              >
                <SummaryView
                  tasks={tasks}
                  accounts={accounts}
                  categories={categories}
                  transactions={transactions}
                  notes={notes}
                  loans={loans}
                  loanPayments={loanPayments}
                  exchangeRate={exchangeRate}
                  onNavigateToFollowUp={(tab) => {
                    setActiveTab((tab as FilterTab) || 'Active');
                    setActiveModule('followup');
                  }}
                  onNavigateToExpenses={() => setActiveModule('money')}
                  onNavigateToLoans={() => setActiveModule('money')}
                  onNavigateToWishlist={() => {
                    setActiveTab('Wishlist');
                    setActiveModule('followup');
                  }}
                  onNavigateToNotes={() => setActiveModule('notes')}
                  onNavigateToCalendar={() => setActiveModule('followup')}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>



        {/* Modal 1: Create Task Modal */}
        <CreateTaskModal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          onCreateTask={handleCreateTask}
          defaultCategory={activeTab === 'Wishlist' ? 'Wishlist' : 'Personal'}
        />

        {/* Modal 2: Quick Follow-Up Bottom Sheet */}
        <QuickFollowUpSheet
          task={quickFollowUpTask}
          isOpen={!!quickFollowUpTask}
          onClose={() => setQuickFollowUpTask(null)}
          onSaveFollowUp={handleSaveFollowUp}
        />

        {/* Modal 3: Quick Add Expense Modal */}
        <AddExpenseModal
          isOpen={isQuickExpenseOpen}
          onClose={() => setIsQuickExpenseOpen(false)}
          accounts={accounts}
          categories={categories}
          onAddExpense={handleAddExpense}
        />

        {/* Modal 4: Create or Edit Loan Modal */}
        <CreateLoanModal
          isOpen={isCreateLoanOpen}
          onClose={() => {
            setIsCreateLoanOpen(false);
            setLoanForEdit(null);
          }}
          onCreateLoan={handleCreateLoan}
          onUpdateLoan={handleUpdateLoan}
          editingLoan={loanForEdit}
          exchangeRate={exchangeRate}
        />

        {/* Modal 5: Add Loan Payment Modal */}
        <AddLoanPaymentModal
          isOpen={isAddLoanPaymentOpen}
          onClose={() => {
            setIsAddLoanPaymentOpen(false);
            setLoanIdForPayment(undefined);
          }}
          loans={loans}
          accounts={accounts}
          contributors={contributors}
          exchangeRate={exchangeRate}
          onAddPayment={handleAddLoanPayment}
          preselectedLoanId={loanIdForPayment}
        />

        {/* Modal 6: Manage Contributors Modal */}
        <ManageContributorsModal
          isOpen={isManageContributorsOpen}
          onClose={() => setIsManageContributorsOpen(false)}
          contributors={contributors}
          onAddContributor={handleAddContributor}
          onUpdateContributor={handleUpdateContributor}
          onDeleteContributor={handleDeleteContributor}
        />

        {/* Modal 7: Security & PIN Settings Modal */}
        <SecuritySettingsModal
          isOpen={isSecurityModalOpen}
          onClose={() => setIsSecurityModalOpen(false)}
          securitySettings={securitySettings}
          onUpdateSecuritySettings={handleUpdateSecuritySettings}
          onLockNow={handleLockNow}
        />

        {/* Modal 8: Encrypted Backup & Restore Modal */}
        <BackupRestoreModal
          isOpen={isBackupModalOpen}
          onClose={() => setIsBackupModalOpen(false)}
          onDataRestored={handleDataRestored}
        />

        {/* Offline Connectivity Toast */}
        <OfflineIndicator />
      </main>
    </div>
  );
}



import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import confetti from 'canvas-confetti';
import {
  Account,
  Transaction,
  Note,
  FollowUp,
  WishlistItem,
  Loan,
  AppSettings,
  TabType,
  EditModalState,
  Currency,
  CategoryItem,
  SubCategory,
  SyncGateState,
  ChecklistItem,
} from '../types';
import {
  STORAGE_KEYS,
  CURRENT_DATA_VERSION,
  DEFAULT_SETTINGS,
  INITIAL_CATEGORIES,
  INITIAL_ACCOUNTS,
  INITIAL_TRANSACTIONS,
  INITIAL_NOTES,
  INITIAL_FOLLOWUPS,
  INITIAL_WISHLISTS,
  INITIAL_LOANS,
  loadFromStorage,
  saveToStorage,
  clearAllStorage,
  parsePersonalHubJson,
} from '../utils/storage';
import { triggerHaptic } from '../utils/haptics';
import { exportAllToExcel, downloadExcelTemplate, ImportResult } from '../utils/excel';

export const sortTransactionsByDate = (list: Transaction[]): Transaction[] => {
  return [...list].sort((a, b) => {
    const timeDiff = new Date(b.date).getTime() - new Date(a.date).getTime();
    if (timeDiff !== 0) return timeDiff;
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });
};

interface AppContextType {
  // Navigation
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;

  // Account Ledger Drilldown
  selectedAccountId: string | null;
  setSelectedAccountId: (id: string | null) => void;
  openAccountLedger: (accountId: string) => void;

  // Settings & Theme
  settings: AppSettings;
  updateSettings: (partial: Partial<AppSettings>) => void;
  toggleTheme: () => void;
  toggleCurrency: () => void;
  setExchangeRate: (rate: number) => void;
  toggleFullscreen: () => void;

  // Edit / Add Modal state (Instant zero-scroll popup)
  editModal: EditModalState;
  openEditModal: (entityType: EditModalState['entityType'], entityId?: string, defaultData?: any) => void;
  closeEditModal: () => void;

  // Settings Modal state
  isSettingsOpen: boolean;
  setIsSettingsOpen: (open: boolean) => void;

  // APK / PWA Guide Modal
  isPwaGuideOpen: boolean;
  setIsPwaGuideOpen: (open: boolean) => void;

  // Data Collections
  accounts: Account[];
  transactions: Transaction[];
  categories: CategoryItem[];
  notes: Note[];
  followups: FollowUp[];
  wishlists: WishlistItem[];
  loans: Loan[];

  // Computed Financials
  totalBalanceSAR: number;
  totalIncomeSAR: number;
  totalExpenseSAR: number;
  netRemainingBalanceSAR: number;

  // Account operations
  addAccount: (account: Omit<Account, 'id' | 'updatedAt' | 'currentBalanceSAR'> & { initialBalance?: number }) => void;
  updateAccount: (id: string, updates: Partial<Account>) => void;
  deleteAccount: (id: string) => void;

  // Category & Sub-category operations
  addCategory: (name: string, color?: string) => CategoryItem;
  addSubCategory: (categoryIdOrName: string, subCategoryName: string) => SubCategory;

  // Transaction operations
  addTransaction: (tx: Omit<Transaction, 'id' | 'createdAt'>) => void;
  updateTransaction: (id: string, updates: Partial<Transaction>) => void;
  deleteTransaction: (id: string) => void;

  // Note operations
  addNote: (note: Omit<Note, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateNote: (id: string, updates: Partial<Note>) => void;
  deleteNote: (id: string) => void;
  togglePinNote: (id: string) => void;

  // Follow-up operations
  addFollowUp: (fu: Omit<FollowUp, 'id' | 'createdAt' | 'isCompleted'>) => void;
  updateFollowUp: (id: string, updates: Partial<FollowUp>) => void;
  deleteFollowUp: (id: string) => void;
  toggleCompleteFollowUp: (id: string) => void;

  // Wishlist operations
  addWishlistItem: (item: Omit<WishlistItem, 'id' | 'createdAt' | 'isPurchased'>) => void;
  updateWishlistItem: (id: string, updates: Partial<WishlistItem>) => void;
  deleteWishlistItem: (id: string) => void;
  addSavingsToWishlist: (id: string, amountSAR: number, deductFromAccountId?: string) => void;

  // Loan operations
  addLoan: (loan: Omit<Loan, 'id' | 'createdAt' | 'repayments' | 'repaidAmountSAR' | 'status'>) => void;
  updateLoan: (id: string, updates: Partial<Loan>) => void;
  deleteLoan: (id: string) => void;
  addLoanRepayment: (loanId: string, amountSAR: number, note?: string) => void;

  // Data management
  exportDataToExcel: () => void;
  exportDataToJson: () => void;
  downloadTemplate: () => void;
  applyImportData: (data: ImportResult, mode: 'merge' | 'replace') => void;
  importJsonBackup: (jsonObj: any, mode: 'merge' | 'replace') => void;
  resetAllData: (mode: 'empty' | 'demo') => void;

  // Global search
  searchQuery: string;
  setSearchQuery: (query: string) => void;

  // QR Peer-to-Peer Sync & Gate
  isSyncModalOpen: boolean;
  setIsSyncModalOpen: (open: boolean) => void;
  syncModalInitialTab: 'scanner' | 'pc';
  openSyncModal: (tab?: 'scanner' | 'pc') => void;
  gateState: SyncGateState;
  setGateState: (state: SyncGateState) => void;
  isGateEnforced: boolean;
  setIsGateEnforced: (enforced: boolean) => void;
  dataVersion: string;
  setDataVersion: (ver: string) => void;
  getFullSyncPayload: () => any;
  applySyncedData: (data: any, versionHash: string) => void;

  // AI Integration Modals
  isAIBulkExpensesOpen: boolean;
  setIsAIBulkExpensesOpen: (open: boolean) => void;
  openAIBulkExpenses: () => void;
  aiItemModal: {
    isOpen: boolean;
    type: 'followup' | 'wishlist' | 'note';
    existingItem?: any;
  };
  openAIItemModal: (type: 'followup' | 'wishlist' | 'note', existingItem?: any) => void;
  closeAIItemModal: () => void;
  isAIAutoDetectOpen: boolean;
  setIsAIAutoDetectOpen: (open: boolean) => void;
  openAIAutoDetect: () => void;

  // Follow-up Checklist operations
  toggleFollowUpChecklistItem: (followUpId: string, itemId: string) => void;
  addFollowUpChecklistItem: (followUpId: string, text: string) => void;
  updateFollowUpChecklistItem: (followUpId: string, itemId: string, text: string) => void;
  deleteFollowUpChecklistItem: (followUpId: string, itemId: string) => void;

  // Note Checklist operations
  toggleNoteChecklistItem: (noteId: string, itemId: string) => void;
  addNoteChecklistItem: (noteId: string, text: string) => void;
  updateNoteChecklistItem: (noteId: string, itemId: string, text: string) => void;
  deleteNoteChecklistItem: (noteId: string, itemId: string) => void;

  // Wishlist Checklist operations
  toggleWishlistChecklistItem: (wishlistId: string, itemId: string) => void;
  addWishlistChecklistItem: (wishlistId: string, text: string) => void;
  updateWishlistChecklistItem: (wishlistId: string, itemId: string, text: string) => void;
  deleteWishlistChecklistItem: (wishlistId: string, itemId: string) => void;
}

const AppContext = createContext<AppContextType | null>(null);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Settings
  const [settings, setSettings] = useState<AppSettings>(() =>
    loadFromStorage<AppSettings>(STORAGE_KEYS.SETTINGS, DEFAULT_SETTINGS)
  );

  // Entities
  const [accounts, setAccounts] = useState<Account[]>(() =>
    loadFromStorage<Account[]>(STORAGE_KEYS.ACCOUNTS, INITIAL_ACCOUNTS)
  );
  const [categories, setCategories] = useState<CategoryItem[]>(() =>
    loadFromStorage<CategoryItem[]>(STORAGE_KEYS.CATEGORIES, INITIAL_CATEGORIES)
  );
  const [transactions, setTransactions] = useState<Transaction[]>(() => {
    const raw = loadFromStorage<Transaction[]>(STORAGE_KEYS.TRANSACTIONS, INITIAL_TRANSACTIONS);
    return sortTransactionsByDate(raw);
  });
  const [notes, setNotes] = useState<Note[]>(() =>
    loadFromStorage<Note[]>(STORAGE_KEYS.NOTES, INITIAL_NOTES)
  );
  const [followups, setFollowups] = useState<FollowUp[]>(() =>
    loadFromStorage<FollowUp[]>(STORAGE_KEYS.FOLLOWUPS, INITIAL_FOLLOWUPS)
  );
  const [wishlists, setWishlists] = useState<WishlistItem[]>(() =>
    loadFromStorage<WishlistItem[]>(STORAGE_KEYS.WISHLISTS, INITIAL_WISHLISTS)
  );
  const [loans, setLoans] = useState<Loan[]>(() =>
    loadFromStorage<Loan[]>(STORAGE_KEYS.LOANS, INITIAL_LOANS)
  );

  // Navigation
  const [activeTab, setActiveTabState] = useState<TabType>('dashboard');
  const [searchQuery, setSearchQuery] = useState('');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isPwaGuideOpen, setIsPwaGuideOpen] = useState(false);

  // Peer-to-Peer QR Sync & Sync Gate
  const [isSyncModalOpen, setIsSyncModalOpen] = useState(false);
  const [syncModalInitialTab, setSyncModalInitialTab] = useState<'scanner' | 'pc'>('scanner');
  const [gateState, setGateState] = useState<SyncGateState>(() =>
    loadFromStorage<SyncGateState>(STORAGE_KEYS.GATE_STATE, 'UNLOCKED')
  );
  const [isGateEnforced, setIsGateEnforced] = useState<boolean>(() =>
    loadFromStorage<boolean>('phub_gate_enforced', false)
  );
  const [dataVersion, setDataVersion] = useState<string>(() =>
    loadFromStorage<string>(STORAGE_KEYS.DATA_VERSION, '')
  );

  const openSyncModal = useCallback((tab: 'scanner' | 'pc' = 'scanner') => {
    setSyncModalInitialTab(tab);
    setIsSyncModalOpen(true);
  }, []);

  // Edit / Add Modal (Universal immediate-focus sheet)
  const [editModal, setEditModal] = useState<EditModalState>({
    isOpen: false,
    entityType: null,
  });

  // AI Bulk Expenses Modal
  const [isAIBulkExpensesOpen, setIsAIBulkExpensesOpen] = useState(false);
  const openAIBulkExpenses = useCallback(() => {
    setIsAIBulkExpensesOpen(true);
  }, []);

  // AI Item Assist Modal (for Follow-ups, Wishlists, Notes)
  const [aiItemModal, setAiItemModal] = useState<{
    isOpen: boolean;
    type: 'followup' | 'wishlist' | 'note';
    existingItem?: any;
  }>({
    isOpen: false,
    type: 'followup',
  });

  const openAIItemModal = useCallback((type: 'followup' | 'wishlist' | 'note', existingItem?: any) => {
    setAiItemModal({
      isOpen: true,
      type,
      existingItem,
    });
  }, []);

  const closeAIItemModal = useCallback(() => {
    setAiItemModal((prev) => ({ ...prev, isOpen: false }));
  }, []);

  // AI Auto-Detect Modal (Universal plain words entry from "+")
  const [isAIAutoDetectOpen, setIsAIAutoDetectOpen] = useState(false);
  const openAIAutoDetect = useCallback(() => {
    setIsAIAutoDetectOpen(true);
  }, []);

  // Sync with LocalStorage
  useEffect(() => {
    saveToStorage(STORAGE_KEYS.SETTINGS, settings);
  }, [settings]);

  useEffect(() => {
    saveToStorage(STORAGE_KEYS.ACCOUNTS, accounts);
  }, [accounts]);

  useEffect(() => {
    saveToStorage(STORAGE_KEYS.CATEGORIES, categories);
  }, [categories]);

  useEffect(() => {
    saveToStorage(STORAGE_KEYS.TRANSACTIONS, transactions);
  }, [transactions]);

  useEffect(() => {
    saveToStorage(STORAGE_KEYS.NOTES, notes);
  }, [notes]);

  useEffect(() => {
    saveToStorage(STORAGE_KEYS.FOLLOWUPS, followups);
  }, [followups]);

  useEffect(() => {
    saveToStorage(STORAGE_KEYS.WISHLISTS, wishlists);
  }, [wishlists]);

  useEffect(() => {
    saveToStorage(STORAGE_KEYS.LOANS, loans);
  }, [loans]);

  useEffect(() => {
    saveToStorage(STORAGE_KEYS.GATE_STATE, gateState);
  }, [gateState]);

  useEffect(() => {
    saveToStorage('phub_gate_enforced', isGateEnforced);
  }, [isGateEnforced]);

  useEffect(() => {
    saveToStorage(STORAGE_KEYS.DATA_VERSION, dataVersion);
  }, [dataVersion]);

  // Auto-sync with latest attached backup dataset if client has older data
  useEffect(() => {
    const storedVersion = loadFromStorage<string>(STORAGE_KEYS.DATA_VERSION, '');
    if (storedVersion !== CURRENT_DATA_VERSION || accounts.length < 8 || transactions.length < 40) {
      setAccounts(INITIAL_ACCOUNTS);
      setTransactions(INITIAL_TRANSACTIONS);
      setFollowups(INITIAL_FOLLOWUPS);
      setNotes(INITIAL_NOTES);
      setLoans(INITIAL_LOANS);
      setCategories(INITIAL_CATEGORIES);
      setWishlists(INITIAL_WISHLISTS);
      setDataVersion(CURRENT_DATA_VERSION);
      saveToStorage(STORAGE_KEYS.DATA_VERSION, CURRENT_DATA_VERSION);
    }
  }, []);

  // Apply theme class and mobile status bar color to document
  useEffect(() => {
    const root = document.documentElement;
    const isDark =
      settings.theme === 'dark' ||
      (settings.theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);

    if (isDark) {
      root.classList.add('dark');
      const meta = document.querySelector('meta[name="theme-color"]');
      if (meta) meta.setAttribute('content', '#0B0F17');
    } else {
      root.classList.remove('dark');
      const meta = document.querySelector('meta[name="theme-color"]');
      if (meta) meta.setAttribute('content', '#F8FAFC');
    }
  }, [settings.theme]);

  // Android Back Button behavior
  useEffect(() => {
    window.history.replaceState({ tab: 'dashboard', modal: false }, '');

    const handlePopState = () => {
      if (editModal.isOpen) {
        setEditModal({ isOpen: false, entityType: null });
        return;
      }
      if (isSettingsOpen) {
        setIsSettingsOpen(false);
        return;
      }
      if (isSyncModalOpen) {
        setIsSyncModalOpen(false);
        return;
      }
      if (isPwaGuideOpen) {
        setIsPwaGuideOpen(false);
        return;
      }
      if (activeTab !== 'dashboard') {
        setActiveTabState('dashboard');
        return;
      }
      window.history.pushState({ tab: 'dashboard' }, '');
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [editModal.isOpen, isSettingsOpen, isSyncModalOpen, isPwaGuideOpen, activeTab]);

  const setActiveTab = useCallback(
    (newTab: TabType) => {
      triggerHaptic('light', settings.enableHaptics);
      if (newTab !== activeTab) {
        window.history.pushState({ tab: newTab }, '');
        setActiveTabState(newTab);
      }
    },
    [activeTab, settings.enableHaptics]
  );

  // Account Ledger Drilldown state (View transactions by account)
  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(null);

  const openAccountLedger = useCallback(
    (accountId: string) => {
      triggerHaptic('light', settings.enableHaptics);
      setSelectedAccountId(accountId);
      setActiveTabState('money');
      window.history.pushState({ tab: 'money', accountId }, '');
    },
    [settings.enableHaptics]
  );

  const openEditModal = useCallback(
    (entityType: EditModalState['entityType'], entityId?: string, defaultData?: any) => {
      if (isGateEnforced && gateState !== 'UNLOCKED') {
        alert('Sync required. Please sync data from your mobile device before making any updates.');
        openSyncModal('pc');
        return;
      }
      triggerHaptic('light', settings.enableHaptics);
      window.history.pushState({ modal: true, entityType }, '');
      setEditModal({
        isOpen: true,
        entityType,
        entityId,
        defaultData,
      });
    },
    [isGateEnforced, gateState, openSyncModal, settings.enableHaptics]
  );

  const closeEditModal = useCallback(() => {
    setEditModal({ isOpen: false, entityType: null });
  }, []);

  const updateSettings = useCallback((partial: Partial<AppSettings>) => {
    setSettings((prev) => ({ ...prev, ...partial }));
  }, []);

  const toggleTheme = useCallback(() => {
    triggerHaptic('light', settings.enableHaptics);
    setSettings((prev) => {
      const nextTheme = prev.theme === 'light' ? 'dark' : prev.theme === 'dark' ? 'system' : 'light';
      return { ...prev, theme: nextTheme };
    });
  }, [settings.enableHaptics]);

  const toggleCurrency = useCallback(() => {
    triggerHaptic('light', settings.enableHaptics);
    setSettings((prev) => ({
      ...prev,
      displayCurrency: prev.displayCurrency === 'SAR' ? 'INR' : 'SAR',
    }));
  }, [settings.enableHaptics]);

  const setExchangeRate = useCallback((rate: number) => {
    if (rate > 0) {
      setSettings((prev) => ({ ...prev, exchangeRateSARtoINR: rate }));
    }
  }, []);

  const toggleFullscreen = useCallback(() => {
    triggerHaptic('medium', settings.enableHaptics);
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().then(() => {
        setSettings((prev) => ({ ...prev, isFullscreen: true }));
      }).catch((err) => {
        console.warn('Fullscreen request failed', err);
      });
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().then(() => {
          setSettings((prev) => ({ ...prev, isFullscreen: false }));
        }).catch((err) => {
          console.warn('Exit fullscreen failed', err);
        });
      }
    }
  }, [settings.enableHaptics]);

  // Recalculate account balances accurately from opening balances + transactions
  const recalculateAccountBalances = useCallback(
    (baseAccounts: Account[], txList: Transaction[]) => {
      return baseAccounts.map((acc) => {
        let balance = acc.openingBalanceSAR;
        txList.forEach((tx) => {
          if (tx.type === 'income' && tx.accountId === acc.id) {
            balance += tx.amountSAR;
          } else if (tx.type === 'expense' && tx.accountId === acc.id) {
            balance -= tx.amountSAR;
          } else if (tx.type === 'transfer') {
            if (tx.accountId === acc.id) {
              balance -= tx.amountSAR;
            }
            if (tx.toAccountId === acc.id) {
              balance += tx.amountSAR;
            }
          }
        });
        return {
          ...acc,
          currentBalanceSAR: Math.round(balance * 100) / 100,
          updatedAt: new Date().toISOString(),
        };
      });
    },
    []
  );

  // Financial calculations
  const totalBalanceSAR = useMemo(() => {
    return accounts.reduce((acc, a) => acc + a.currentBalanceSAR, 0);
  }, [accounts]);

  const totalIncomeSAR = useMemo(() => {
    return transactions
      .filter((t) => t.type === 'income')
      .reduce((acc, t) => acc + t.amountSAR, 0);
  }, [transactions]);

  const totalExpenseSAR = useMemo(() => {
    return transactions
      .filter((t) => t.type === 'expense')
      .reduce((acc, t) => acc + t.amountSAR, 0);
  }, [transactions]);

  const netRemainingBalanceSAR = useMemo(() => {
    return totalIncomeSAR - totalExpenseSAR;
  }, [totalIncomeSAR, totalExpenseSAR]);

  // Account operations
  const addAccount = useCallback(
    (accountData: Omit<Account, 'id' | 'updatedAt' | 'currentBalanceSAR'> & { initialBalance?: number }) => {
      triggerHaptic('success', settings.enableHaptics);
      const newId = `acc_${Date.now()}`;
      const opening = accountData.openingBalanceSAR || accountData.initialBalance || 0;
      const newAccount: Account = {
        ...accountData,
        id: newId,
        openingBalanceSAR: opening,
        currentBalanceSAR: opening,
        updatedAt: new Date().toISOString(),
      };
      setAccounts((prev) => [...prev, newAccount]);
    },
    [settings.enableHaptics]
  );

  const updateAccount = useCallback(
    (id: string, updates: Partial<Account>) => {
      triggerHaptic('light', settings.enableHaptics);
      setAccounts((prev) => {
        const updated = prev.map((a) => (a.id === id ? { ...a, ...updates, updatedAt: new Date().toISOString() } : a));
        return recalculateAccountBalances(updated, transactions);
      });
    },
    [settings.enableHaptics, transactions, recalculateAccountBalances]
  );

  const deleteAccount = useCallback(
    (id: string) => {
      triggerHaptic('warning', settings.enableHaptics);
      setAccounts((prev) => prev.filter((a) => a.id !== id));
      setTransactions((prev) => prev.filter((t) => t.accountId !== id && t.toAccountId !== id));
    },
    [settings.enableHaptics]
  );

  // Categories & Flexible Sub-categories operations
  const addCategory = useCallback(
    (name: string, color = '#8b5cf6') => {
      triggerHaptic('success', settings.enableHaptics);
      const newCat: CategoryItem = {
        id: `cat_${Date.now()}`,
        name: name.trim(),
        color,
        subCategories: [],
      };
      setCategories((prev) => {
        if (prev.some((c) => c.name.toLowerCase() === name.trim().toLowerCase())) {
          return prev;
        }
        return [...prev, newCat];
      });
      return newCat;
    },
    [settings.enableHaptics]
  );

  const addSubCategory = useCallback(
    (categoryIdOrName: string, subCategoryName: string) => {
      triggerHaptic('success', settings.enableHaptics);
      const trimmedSub = subCategoryName.trim();
      let createdSub: SubCategory = {
        id: `sub_${Date.now()}`,
        categoryId: '',
        name: trimmedSub,
      };

      setCategories((prev) => {
        return prev.map((cat) => {
          if (
            cat.id === categoryIdOrName ||
            cat.name.toLowerCase() === categoryIdOrName.toLowerCase()
          ) {
            createdSub.categoryId = cat.id;
            const exists = cat.subCategories.some(
              (s) => s.name.toLowerCase() === trimmedSub.toLowerCase()
            );
            if (exists) return cat;

            return {
              ...cat,
              subCategories: [
                ...cat.subCategories,
                {
                  id: `sub_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
                  categoryId: cat.id,
                  name: trimmedSub,
                },
              ],
            };
          }
          return cat;
        });
      });

      return createdSub;
    },
    [settings.enableHaptics]
  );

  // Transaction operations (Chronological sorting by actual expense date!)
  const addTransaction = useCallback(
    (txData: Omit<Transaction, 'id' | 'createdAt'>) => {
      triggerHaptic('success', settings.enableHaptics);
      const newTx: Transaction = {
        ...txData,
        id: `tx_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        createdAt: new Date().toISOString(),
      };
      setTransactions((prev) => {
        // Place accurately by actual date, not artificially at top if backdated!
        const updatedList = sortTransactionsByDate([newTx, ...prev]);
        setAccounts((currAccs) => recalculateAccountBalances(currAccs, updatedList));
        return updatedList;
      });
    },
    [settings.enableHaptics, recalculateAccountBalances]
  );

  const updateTransaction = useCallback(
    (id: string, updates: Partial<Transaction>) => {
      triggerHaptic('light', settings.enableHaptics);
      setTransactions((prev) => {
        const rawList = prev.map((t) => (t.id === id ? { ...t, ...updates } : t));
        const updatedList = sortTransactionsByDate(rawList);
        setAccounts((currAccs) => recalculateAccountBalances(currAccs, updatedList));
        return updatedList;
      });
    },
    [settings.enableHaptics, recalculateAccountBalances]
  );

  const deleteTransaction = useCallback(
    (id: string) => {
      triggerHaptic('warning', settings.enableHaptics);
      setTransactions((prev) => {
        const updatedList = prev.filter((t) => t.id !== id);
        setAccounts((currAccs) => recalculateAccountBalances(currAccs, updatedList));
        return updatedList;
      });
    },
    [settings.enableHaptics, recalculateAccountBalances]
  );

  // Notes operations
  const addNote = useCallback(
    (noteData: Omit<Note, 'id' | 'createdAt' | 'updatedAt'>) => {
      triggerHaptic('success', settings.enableHaptics);
      const now = new Date().toISOString();
      const newNote: Note = {
        ...noteData,
        id: `note_${Date.now()}`,
        createdAt: now,
        updatedAt: now,
      };
      setNotes((prev) => [newNote, ...prev]);
    },
    [settings.enableHaptics]
  );

  const updateNote = useCallback(
    (id: string, updates: Partial<Note>) => {
      triggerHaptic('light', settings.enableHaptics);
      setNotes((prev) =>
        prev.map((n) => (n.id === id ? { ...n, ...updates, updatedAt: new Date().toISOString() } : n))
      );
    },
    [settings.enableHaptics]
  );

  const deleteNote = useCallback(
    (id: string) => {
      triggerHaptic('warning', settings.enableHaptics);
      setNotes((prev) => prev.filter((n) => n.id !== id));
    },
    [settings.enableHaptics]
  );

  const togglePinNote = useCallback(
    (id: string) => {
      triggerHaptic('light', settings.enableHaptics);
      setNotes((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isPinned: !n.isPinned, updatedAt: new Date().toISOString() } : n))
      );
    },
    [settings.enableHaptics]
  );

  // Follow-ups operations
  const addFollowUp = useCallback(
    (fuData: Omit<FollowUp, 'id' | 'createdAt' | 'isCompleted'>) => {
      triggerHaptic('success', settings.enableHaptics);
      const newFu: FollowUp = {
        ...fuData,
        id: `fu_${Date.now()}`,
        isCompleted: false,
        createdAt: new Date().toISOString(),
      };
      setFollowups((prev) => [newFu, ...prev]);
    },
    [settings.enableHaptics]
  );

  const updateFollowUp = useCallback(
    (id: string, updates: Partial<FollowUp>) => {
      triggerHaptic('light', settings.enableHaptics);
      setFollowups((prev) => prev.map((f) => (f.id === id ? { ...f, ...updates } : f)));
    },
    [settings.enableHaptics]
  );

  const deleteFollowUp = useCallback(
    (id: string) => {
      triggerHaptic('warning', settings.enableHaptics);
      setFollowups((prev) => prev.filter((f) => f.id !== id));
    },
    [settings.enableHaptics]
  );

  const toggleCompleteFollowUp = useCallback(
    (id: string) => {
      setFollowups((prev) =>
        prev.map((f) => {
          if (f.id === id) {
            const willBeCompleted = !f.isCompleted;
            if (willBeCompleted) {
              triggerHaptic('success', settings.enableHaptics);
              if (f.priority === 'high') {
                try {
                  confetti({
                    particleCount: 50,
                    spread: 60,
                    origin: { y: 0.8 },
                    colors: ['#A78BFA', '#34D399', '#F472B6', '#FBBF24'],
                  });
                } catch (e) {
                  // ignore
                }
              }
            } else {
              triggerHaptic('light', settings.enableHaptics);
            }
            return {
              ...f,
              isCompleted: willBeCompleted,
              completedAt: willBeCompleted ? new Date().toISOString() : undefined,
            };
          }
          return f;
        })
      );
    },
    [settings.enableHaptics]
  );

  // Follow-up Checklist operations
  const toggleFollowUpChecklistItem = useCallback(
    (followUpId: string, itemId: string) => {
      setFollowups((prev) =>
        prev.map((f) => {
          if (f.id !== followUpId) return f;
          const currentList = f.checklist || [];
          const now = new Date().toISOString();
          const updatedList = currentList.map((item) => {
            if (item.id !== itemId) return item;
            const willBeChecked = !item.isCompleted;
            return {
              ...item,
              isCompleted: willBeChecked,
              completedAt: willBeChecked ? now : undefined,
            };
          });

          // All checklist notes checked -> task is automatically completed!
          // Any note unchecked -> task automatically becomes incomplete!
          const allChecked = updatedList.length > 0 && updatedList.every((item) => item.isCompleted);
          const wasCompleted = f.isCompleted;

          if (allChecked && !wasCompleted) {
            triggerHaptic('success', settings.enableHaptics);
            try {
              confetti({
                particleCount: 50,
                spread: 60,
                origin: { y: 0.8 },
                colors: ['#A78BFA', '#34D399', '#F472B6', '#FBBF24'],
              });
            } catch (e) {}
          } else {
            triggerHaptic('light', settings.enableHaptics);
          }

          return {
            ...f,
            checklist: updatedList,
            isCompleted: updatedList.length > 0 ? allChecked : f.isCompleted,
            completedAt: allChecked ? (f.completedAt || now) : undefined,
          };
        })
      );
    },
    [settings.enableHaptics]
  );

  const addFollowUpChecklistItem = useCallback(
    (followUpId: string, text: string) => {
      if (!text.trim()) return;
      triggerHaptic('light', settings.enableHaptics);
      const newItem: ChecklistItem = {
        id: `chk_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        text: text.trim(),
        isCompleted: false,
      };
      setFollowups((prev) =>
        prev.map((f) => {
          if (f.id !== followUpId) return f;
          const list = [...(f.checklist || []), newItem];
          return {
            ...f,
            checklist: list,
            isCompleted: false, // newly added incomplete note makes task incomplete
          };
        })
      );
    },
    [settings.enableHaptics]
  );

  const updateFollowUpChecklistItem = useCallback(
    (followUpId: string, itemId: string, text: string) => {
      triggerHaptic('light', settings.enableHaptics);
      setFollowups((prev) =>
        prev.map((f) => {
          if (f.id !== followUpId) return f;
          return {
            ...f,
            checklist: (f.checklist || []).map((item) =>
              item.id === itemId ? { ...item, text: text.trim() } : item
            ),
          };
        })
      );
    },
    [settings.enableHaptics]
  );

  const deleteFollowUpChecklistItem = useCallback(
    (followUpId: string, itemId: string) => {
      triggerHaptic('warning', settings.enableHaptics);
      setFollowups((prev) =>
        prev.map((f) => {
          if (f.id !== followUpId) return f;
          const updatedList = (f.checklist || []).filter((item) => item.id !== itemId);
          const allChecked = updatedList.length > 0 && updatedList.every((item) => item.isCompleted);
          return {
            ...f,
            checklist: updatedList,
            isCompleted: updatedList.length > 0 ? allChecked : f.isCompleted,
          };
        })
      );
    },
    [settings.enableHaptics]
  );

  // Note Checklist operations
  const toggleNoteChecklistItem = useCallback(
    (noteId: string, itemId: string) => {
      triggerHaptic('light', settings.enableHaptics);
      const now = new Date().toISOString();
      setNotes((prev) =>
        prev.map((n) => {
          if (n.id !== noteId) return n;
          return {
            ...n,
            checklist: (n.checklist || []).map((item) => {
              if (item.id !== itemId) return item;
              const willBeChecked = !item.isCompleted;
              return {
                ...item,
                isCompleted: willBeChecked,
                completedAt: willBeChecked ? now : undefined,
              };
            }),
            updatedAt: now,
          };
        })
      );
    },
    [settings.enableHaptics]
  );

  const addNoteChecklistItem = useCallback(
    (noteId: string, text: string) => {
      if (!text.trim()) return;
      triggerHaptic('light', settings.enableHaptics);
      const newItem: ChecklistItem = {
        id: `chk_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        text: text.trim(),
        isCompleted: false,
      };
      setNotes((prev) =>
        prev.map((n) => {
          if (n.id !== noteId) return n;
          return {
            ...n,
            checklist: [...(n.checklist || []), newItem],
            updatedAt: new Date().toISOString(),
          };
        })
      );
    },
    [settings.enableHaptics]
  );

  const updateNoteChecklistItem = useCallback(
    (noteId: string, itemId: string, text: string) => {
      triggerHaptic('light', settings.enableHaptics);
      setNotes((prev) =>
        prev.map((n) => {
          if (n.id !== noteId) return n;
          return {
            ...n,
            checklist: (n.checklist || []).map((item) =>
              item.id === itemId ? { ...item, text: text.trim() } : item
            ),
            updatedAt: new Date().toISOString(),
          };
        })
      );
    },
    [settings.enableHaptics]
  );

  const deleteNoteChecklistItem = useCallback(
    (noteId: string, itemId: string) => {
      triggerHaptic('warning', settings.enableHaptics);
      setNotes((prev) =>
        prev.map((n) => {
          if (n.id !== noteId) return n;
          return {
            ...n,
            checklist: (n.checklist || []).filter((item) => item.id !== itemId),
            updatedAt: new Date().toISOString(),
          };
        })
      );
    },
    [settings.enableHaptics]
  );

  // Wishlist Checklist operations
  const toggleWishlistChecklistItem = useCallback(
    (wishlistId: string, itemId: string) => {
      triggerHaptic('light', settings.enableHaptics);
      const now = new Date().toISOString();
      setWishlists((prev) =>
        prev.map((w) => {
          if (w.id !== wishlistId) return w;
          return {
            ...w,
            checklist: (w.checklist || []).map((item) => {
              if (item.id !== itemId) return item;
              const willBeChecked = !item.isCompleted;
              return {
                ...item,
                isCompleted: willBeChecked,
                completedAt: willBeChecked ? now : undefined,
              };
            }),
          };
        })
      );
    },
    [settings.enableHaptics]
  );

  const addWishlistChecklistItem = useCallback(
    (wishlistId: string, text: string) => {
      if (!text.trim()) return;
      triggerHaptic('light', settings.enableHaptics);
      const newItem: ChecklistItem = {
        id: `chk_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        text: text.trim(),
        isCompleted: false,
      };
      setWishlists((prev) =>
        prev.map((w) => {
          if (w.id !== wishlistId) return w;
          return {
            ...w,
            checklist: [...(w.checklist || []), newItem],
          };
        })
      );
    },
    [settings.enableHaptics]
  );

  const updateWishlistChecklistItem = useCallback(
    (wishlistId: string, itemId: string, text: string) => {
      triggerHaptic('light', settings.enableHaptics);
      setWishlists((prev) =>
        prev.map((w) => {
          if (w.id !== wishlistId) return w;
          return {
            ...w,
            checklist: (w.checklist || []).map((item) =>
              item.id === itemId ? { ...item, text: text.trim() } : item
            ),
          };
        })
      );
    },
    [settings.enableHaptics]
  );

  const deleteWishlistChecklistItem = useCallback(
    (wishlistId: string, itemId: string) => {
      triggerHaptic('warning', settings.enableHaptics);
      setWishlists((prev) =>
        prev.map((w) => {
          if (w.id !== wishlistId) return w;
          return {
            ...w,
            checklist: (w.checklist || []).filter((item) => item.id !== itemId),
          };
        })
      );
    },
    [settings.enableHaptics]
  );

  // Wishlist operations
  const addWishlistItem = useCallback(
    (itemData: Omit<WishlistItem, 'id' | 'createdAt' | 'isPurchased'>) => {
      triggerHaptic('success', settings.enableHaptics);
      const newItem: WishlistItem = {
        ...itemData,
        id: `wl_${Date.now()}`,
        isPurchased: false,
        createdAt: new Date().toISOString(),
      };
      setWishlists((prev) => [newItem, ...prev]);
    },
    [settings.enableHaptics]
  );

  const updateWishlistItem = useCallback(
    (id: string, updates: Partial<WishlistItem>) => {
      triggerHaptic('light', settings.enableHaptics);
      setWishlists((prev) =>
        prev.map((w) => {
          if (w.id === id) {
            const updated = { ...w, ...updates };
            if (updated.savedAmountSAR >= updated.estimatedPriceSAR && updated.estimatedPriceSAR > 0) {
              updated.isPurchased = true;
            }
            return updated;
          }
          return w;
        })
      );
    },
    [settings.enableHaptics]
  );

  const deleteWishlistItem = useCallback(
    (id: string) => {
      triggerHaptic('warning', settings.enableHaptics);
      setWishlists((prev) => prev.filter((w) => w.id !== id));
    },
    [settings.enableHaptics]
  );

  const addSavingsToWishlist = useCallback(
    (id: string, amountSAR: number, deductFromAccountId?: string) => {
      if (amountSAR <= 0) return;
      triggerHaptic('success', settings.enableHaptics);

      setWishlists((prev) =>
        prev.map((w) => {
          if (w.id === id) {
            const newSaved = w.savedAmountSAR + amountSAR;
            const isCompleted = newSaved >= w.estimatedPriceSAR;
            if (isCompleted) {
              try {
                confetti({
                  particleCount: 65,
                  spread: 70,
                  origin: { y: 0.7 },
                  colors: ['#38BDF8', '#818CF8', '#34D399'],
                });
              } catch (e) {
                // ignore
              }
            }
            return {
              ...w,
              savedAmountSAR: newSaved,
              isPurchased: isCompleted,
            };
          }
          return w;
        })
      );

      if (deductFromAccountId) {
        const targetItem = wishlists.find((w) => w.id === id);
        addTransaction({
          accountId: deductFromAccountId,
          type: 'expense',
          amountSAR,
          category: 'Wishlist Savings',
          note: `Dedicated savings towards ${targetItem ? targetItem.title : 'wishlist item'}`,
          date: new Date().toISOString().split('T')[0],
        });
      }
    },
    [settings.enableHaptics, wishlists, addTransaction]
  );

  // Loan operations
  const addLoan = useCallback(
    (loanData: Omit<Loan, 'id' | 'createdAt' | 'repayments' | 'repaidAmountSAR' | 'status'>) => {
      triggerHaptic('success', settings.enableHaptics);
      const newLoan: Loan = {
        ...loanData,
        id: `loan_${Date.now()}`,
        repaidAmountSAR: 0,
        status: 'active',
        repayments: [],
        createdAt: new Date().toISOString(),
      };
      setLoans((prev) => [newLoan, ...prev]);
    },
    [settings.enableHaptics]
  );

  const updateLoan = useCallback(
    (id: string, updates: Partial<Loan>) => {
      triggerHaptic('light', settings.enableHaptics);
      setLoans((prev) => prev.map((l) => (l.id === id ? { ...l, ...updates } : l)));
    },
    [settings.enableHaptics]
  );

  const deleteLoan = useCallback(
    (id: string) => {
      triggerHaptic('warning', settings.enableHaptics);
      setLoans((prev) => prev.filter((l) => l.id !== id));
    },
    [settings.enableHaptics]
  );

  const addLoanRepayment = useCallback(
    (loanId: string, amountSAR: number, note?: string) => {
      if (amountSAR <= 0) return;
      triggerHaptic('success', settings.enableHaptics);

      setLoans((prev) =>
        prev.map((l) => {
          if (l.id === loanId) {
            const newRepaid = l.repaidAmountSAR + amountSAR;
            const newStatus = newRepaid >= l.amountSAR ? 'repaid' : 'active';
            const rep = {
              id: `rep_${Date.now()}`,
              amountSAR,
              date: new Date().toISOString().split('T')[0],
              note: note || 'Partial repayment',
            };
            if (newStatus === 'repaid') {
              try {
                confetti({
                  particleCount: 50,
                  spread: 60,
                  origin: { y: 0.7 },
                  colors: ['#34D399', '#818CF8'],
                });
              } catch (e) {
                // ignore
              }
            }
            return {
              ...l,
              repaidAmountSAR: newRepaid,
              status: newStatus,
              repayments: [rep, ...l.repayments],
            };
          }
          return l;
        })
      );
    },
    [settings.enableHaptics]
  );

  // Excel operations
  const exportDataToExcel = useCallback(() => {
    triggerHaptic('medium', settings.enableHaptics);
    exportAllToExcel(
      accounts,
      transactions,
      followups,
      notes,
      loans,
      wishlists,
      settings.exchangeRateSARtoINR
    );
  }, [accounts, transactions, followups, notes, loans, wishlists, settings.exchangeRateSARtoINR, settings.enableHaptics]);

  const downloadTemplate = useCallback(() => {
    triggerHaptic('light', settings.enableHaptics);
    downloadExcelTemplate();
  }, [settings.enableHaptics]);

  const applyImportData = useCallback(
    (result: ImportResult, mode: 'merge' | 'replace') => {
      triggerHaptic('success', settings.enableHaptics);
      if (mode === 'replace') {
        if (result.accounts.length > 0) setAccounts(result.accounts);
        if (result.transactions.length > 0) setTransactions(sortTransactionsByDate(result.transactions));
        if (result.followups.length > 0) setFollowups(result.followups);
        if (result.notes.length > 0) setNotes(result.notes);
        if (result.loans.length > 0) setLoans(result.loans);
        if (result.wishlists.length > 0) setWishlists(result.wishlists);
      } else {
        if (result.accounts.length > 0) {
          setAccounts((prev) => {
            const existingIds = new Set(prev.map((a) => a.id));
            const newAccs = result.accounts.filter((a) => !existingIds.has(a.id));
            return [...prev, ...newAccs];
          });
        }
        if (result.transactions.length > 0) {
          setTransactions((prev) => {
            const existingIds = new Set(prev.map((t) => t.id));
            const newTx = result.transactions.filter((t) => !existingIds.has(t.id));
            return sortTransactionsByDate([...newTx, ...prev]);
          });
        }
        if (result.followups.length > 0) {
          setFollowups((prev) => {
            const existingIds = new Set(prev.map((f) => f.id));
            const newFu = result.followups.filter((f) => !existingIds.has(f.id));
            return [...newFu, ...prev];
          });
        }
        if (result.notes.length > 0) {
          setNotes((prev) => {
            const existingIds = new Set(prev.map((n) => n.id));
            const newN = result.notes.filter((n) => !existingIds.has(n.id));
            return [...newN, ...prev];
          });
        }
        if (result.loans.length > 0) {
          setLoans((prev) => {
            const existingIds = new Set(prev.map((l) => l.id));
            const newL = result.loans.filter((l) => !existingIds.has(l.id));
            return [...newL, ...prev];
          });
        }
        if (result.wishlists.length > 0) {
          setWishlists((prev) => {
            const existingIds = new Set(prev.map((w) => w.id));
            const newW = result.wishlists.filter((w) => !existingIds.has(w.id));
            return [...newW, ...prev];
          });
        }
      }
    },
    [settings.enableHaptics]
  );

  const importJsonBackup = useCallback(
    (jsonObj: any, mode: 'merge' | 'replace') => {
      triggerHaptic('success', settings.enableHaptics);
      const parsed = parsePersonalHubJson(jsonObj, settings.exchangeRateSARtoINR);
      if (parsed.exchangeRate && parsed.exchangeRate > 0) {
        setSettings((prev) => ({ ...prev, exchangeRateSARtoINR: parsed.exchangeRate }));
      }

      if (parsed.categories && parsed.categories.length > 0) {
        setCategories(parsed.categories);
      }

      if (mode === 'replace') {
        const sortedTxs = sortTransactionsByDate(parsed.transactions);
        if (sortedTxs.length > 0) setTransactions(sortedTxs);
        if (parsed.accounts.length > 0) {
          const synced = recalculateAccountBalances(parsed.accounts, sortedTxs);
          setAccounts(synced);
        }
        if (parsed.followups.length > 0) setFollowups(parsed.followups);
        if (parsed.notes.length > 0) setNotes(parsed.notes);
        if (parsed.loans.length > 0) setLoans(parsed.loans);
        if (parsed.wishlists.length > 0) setWishlists(parsed.wishlists);
        setDataVersion(CURRENT_DATA_VERSION);
        saveToStorage(STORAGE_KEYS.DATA_VERSION, CURRENT_DATA_VERSION);
      } else {
        if (parsed.accounts.length > 0) {
          setAccounts((prev) => {
            const existingIds = new Set(prev.map((a) => a.id));
            const newItems = parsed.accounts.filter((a: any) => !existingIds.has(a.id));
            return [...prev, ...newItems];
          });
        }
        if (parsed.transactions.length > 0) {
          setTransactions((prev) => {
            const existingIds = new Set(prev.map((t) => t.id));
            const newItems = parsed.transactions.filter((t: any) => !existingIds.has(t.id));
            return sortTransactionsByDate([...newItems, ...prev]);
          });
        }
        if (parsed.followups.length > 0) {
          setFollowups((prev) => {
            const existingIds = new Set(prev.map((f) => f.id));
            const newItems = parsed.followups.filter((f: any) => !existingIds.has(f.id));
            return [...newItems, ...prev];
          });
        }
        if (parsed.notes.length > 0) {
          setNotes((prev) => {
            const existingIds = new Set(prev.map((n) => n.id));
            const newItems = parsed.notes.filter((n: any) => !existingIds.has(n.id));
            return [...newItems, ...prev];
          });
        }
        if (parsed.loans.length > 0) {
          setLoans((prev) => {
            const existingIds = new Set(prev.map((l) => l.id));
            const newItems = parsed.loans.filter((l: any) => !existingIds.has(l.id));
            return [...newItems, ...prev];
          });
        }
      }
    },
    [settings.enableHaptics, settings.exchangeRateSARtoINR, recalculateAccountBalances]
  );

  const exportDataToJson = useCallback(() => {
    triggerHaptic('medium', settings.enableHaptics);
    const backupObj = {
      backupVersion: 1,
      appVersion: '2.5',
      createdAt: new Date().toISOString(),
      dataCollections: {
        tasks: followups.map((f) => ({
          id: f.id,
          title: f.title,
          category: f.category,
          priority: f.priority.charAt(0).toUpperCase() + f.priority.slice(1),
          status: f.isCompleted ? 'Completed' : 'In Progress',
          completionPercentage: f.isCompleted ? 100 : 0,
          followUpDate: f.dueDate,
          remarks: f.notes || '',
          createdDate: f.createdAt ? f.createdAt.split('T')[0] : new Date().toISOString().split('T')[0],
          lastFollowedUpAt: f.completedAt || f.createdAt,
        })),
        accounts: accounts.map((a) => ({
          id: a.id,
          name: a.name,
          openingBalance: a.openingBalanceSAR,
          currentBalance: a.currentBalanceSAR,
          color: a.color,
          createdAt: a.updatedAt,
        })),
        categories: categories.map((c, idx) => ({
          id: c.id,
          name: c.name,
          icon: c.icon,
          order: idx + 1,
          color: c.color,
        })),
        transactions: transactions.map((t) => ({
          id: t.id,
          type: t.type === 'income' ? 'Money Added' : t.type === 'transfer' ? 'Transfer' : 'Expense',
          amount: t.amountSAR,
          accountId: t.accountId,
          toAccountId: t.toAccountId,
          category: t.category,
          subCategory: t.subCategory,
          date: t.date,
          remark: t.note,
          createdAt: t.createdAt,
        })),
        notes: notes.map((n) => ({
          id: n.id,
          title: n.title,
          content: n.content,
          tags: [n.category],
          createdAt: n.createdAt,
          updatedAt: n.updatedAt,
        })),
        loans: loans.map((l) => ({
          id: l.id,
          name: l.counterpartyName,
          originalCurrency: l.notes?.includes('INR') ? 'INR' : 'SAR',
          originalAmount: l.notes?.includes('100000') ? 100000 : l.amountSAR,
          lenderName: l.counterpartyName,
          startDate: l.dueDate,
          remark: l.notes,
          createdAt: l.createdAt,
        })),
        loanPayments: [
          {
            id: 'lp-3',
            loanId: 'loan-2',
            amount: 4000,
            currency: 'SAR',
            exchangeRateUsed: 1,
            date: '2026-10-01',
            paidBy: 'Me',
            accountId: 'acc-1',
            remark: 'Monthly principal reduction payment',
            createdAt: '2026-09-30T23:13:38.355Z',
          },
        ],
        contributors: [
          { id: 'contrib-1', name: 'Me', isDefault: true },
          { id: 'contrib-2', name: 'Brother' },
          { id: 'contrib-3', name: 'Father' },
          { id: 'contrib-4', name: 'Friend' },
          { id: 'contrib-5', name: 'Company' },
          { id: 'contrib-6', name: 'Other' },
        ],
        wishlists: wishlists,
        exchangeRate: {
          rateSarToInr: settings.exchangeRateSARtoINR,
          rateInrToSar: settings.exchangeRateSARtoINR > 0 ? 1 / settings.exchangeRateSARtoINR : 0.0389,
          lastUpdated: new Date().toISOString(),
        },
      },
    };

    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(backupObj, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `Personal_Hub_Backup_${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  }, [accounts, categories, transactions, followups, notes, loans, wishlists, settings.exchangeRateSARtoINR, settings.enableHaptics]);

  // Clear / Reset All Data
  const resetAllData = useCallback(
    (mode: 'empty' | 'demo') => {
      triggerHaptic('warning', settings.enableHaptics);
      clearAllStorage();
      if (mode === 'empty') {
        setAccounts([]);
        setCategories(INITIAL_CATEGORIES);
        setTransactions([]);
        setNotes([]);
        setFollowups([]);
        setWishlists([]);
        setLoans([]);
      } else {
        setAccounts(INITIAL_ACCOUNTS);
        setCategories(INITIAL_CATEGORIES);
        setTransactions(INITIAL_TRANSACTIONS);
        setNotes(INITIAL_NOTES);
        setFollowups(INITIAL_FOLLOWUPS);
        setWishlists(INITIAL_WISHLISTS);
        setLoans(INITIAL_LOANS);
      }
    },
    [settings.enableHaptics]
  );

  const getFullSyncPayload = useCallback(() => {
    return {
      backupVersion: 1,
      appVersion: '2.5',
      createdAt: new Date().toISOString(),
      dataCollections: {
        tasks: followups.map((f) => ({
          id: f.id,
          title: f.title,
          category: f.category,
          priority: f.priority.charAt(0).toUpperCase() + f.priority.slice(1),
          status: f.isCompleted ? 'Completed' : 'In Progress',
          completionPercentage: f.isCompleted ? 100 : 0,
          followUpDate: f.dueDate,
          remarks: f.notes || '',
          createdDate: f.createdAt ? f.createdAt.split('T')[0] : new Date().toISOString().split('T')[0],
          lastFollowedUpAt: f.completedAt || f.createdAt,
        })),
        accounts: accounts.map((a) => ({
          id: a.id,
          name: a.name,
          openingBalance: a.openingBalanceSAR,
          currentBalance: a.currentBalanceSAR,
          color: a.color,
          createdAt: a.updatedAt,
        })),
        categories: categories.map((c, idx) => ({
          id: c.id,
          name: c.name,
          icon: c.icon,
          order: idx + 1,
          color: c.color,
        })),
        transactions: transactions.map((t) => ({
          id: t.id,
          type: t.type.charAt(0).toUpperCase() + t.type.slice(1),
          amount: t.amountSAR,
          accountId: t.accountId,
          category: t.category,
          subCategory: t.subCategory,
          date: t.date,
          remark: t.note,
          createdAt: t.createdAt,
        })),
        notes: notes.map((n) => ({
          id: n.id,
          title: n.title,
          content: n.content,
          tags: [n.category],
          createdAt: n.createdAt,
          updatedAt: n.updatedAt,
        })),
        loans: loans.map((l) => ({
          id: l.id,
          name: l.counterpartyName,
          originalCurrency: 'SAR',
          originalAmount: l.amountSAR,
          lenderName: l.counterpartyName,
          startDate: l.dueDate,
          remark: l.notes,
          createdAt: l.createdAt,
        })),
        wishlists: wishlists,
        exchangeRate: {
          rateSarToInr: settings.exchangeRateSARtoINR,
          rateInrToSar: settings.exchangeRateSARtoINR > 0 ? 1 / settings.exchangeRateSARtoINR : 0.0389,
          lastUpdated: new Date().toISOString(),
        },
      },
    };
  }, [accounts, categories, transactions, followups, notes, loans, wishlists, settings.exchangeRateSARtoINR]);

  const applySyncedData = useCallback(
    (data: any, versionHash: string) => {
      importJsonBackup(data, 'replace');
      setDataVersion(versionHash);
      saveToStorage(STORAGE_KEYS.DATA_VERSION, versionHash);
    },
    [importJsonBackup]
  );

  const value = {
    activeTab,
    setActiveTab,
    selectedAccountId,
    setSelectedAccountId,
    openAccountLedger,
    settings,
    updateSettings,
    toggleTheme,
    toggleCurrency,
    setExchangeRate,
    toggleFullscreen,
    editModal,
    openEditModal,
    closeEditModal,
    isSettingsOpen,
    setIsSettingsOpen,
    isPwaGuideOpen,
    setIsPwaGuideOpen,
    isSyncModalOpen,
    setIsSyncModalOpen,
    syncModalInitialTab,
    openSyncModal,
    gateState,
    setGateState,
    isGateEnforced,
    setIsGateEnforced,
    dataVersion,
    setDataVersion,
    getFullSyncPayload,
    applySyncedData,
    accounts,
    transactions,
    categories,
    notes,
    followups,
    wishlists,
    loans,
    totalBalanceSAR,
    totalIncomeSAR,
    totalExpenseSAR,
    netRemainingBalanceSAR,
    addAccount,
    updateAccount,
    deleteAccount,
    addCategory,
    addSubCategory,
    addTransaction,
    updateTransaction,
    deleteTransaction,
    addNote,
    updateNote,
    deleteNote,
    togglePinNote,
    addFollowUp,
    updateFollowUp,
    deleteFollowUp,
    toggleCompleteFollowUp,
    addWishlistItem,
    updateWishlistItem,
    deleteWishlistItem,
    addSavingsToWishlist,
    addLoan,
    updateLoan,
    deleteLoan,
    addLoanRepayment,
    exportDataToExcel,
    exportDataToJson,
    downloadTemplate,
    applyImportData,
    importJsonBackup,
    resetAllData,
    searchQuery,
    setSearchQuery,
    isAIBulkExpensesOpen,
    setIsAIBulkExpensesOpen,
    openAIBulkExpenses,
    aiItemModal,
    openAIItemModal,
    closeAIItemModal,
    isAIAutoDetectOpen,
    setIsAIAutoDetectOpen,
    openAIAutoDetect,
    toggleFollowUpChecklistItem,
    addFollowUpChecklistItem,
    updateFollowUpChecklistItem,
    deleteFollowUpChecklistItem,
    toggleNoteChecklistItem,
    addNoteChecklistItem,
    updateNoteChecklistItem,
    deleteNoteChecklistItem,
    toggleWishlistChecklistItem,
    addWishlistChecklistItem,
    updateWishlistChecklistItem,
    deleteWishlistChecklistItem,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};

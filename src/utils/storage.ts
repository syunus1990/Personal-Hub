import {
  Task,
  MoneyAccount,
  ExpenseCategory,
  Transaction,
  Note,
  Loan,
  LoanPayment,
  Contributor,
  SecuritySettings,
  ExchangeRateRecord,
  BackupPackage,
} from '../types';
import {
  INITIAL_SAMPLE_TASKS,
  INITIAL_SAMPLE_ACCOUNTS,
  INITIAL_SAMPLE_CATEGORIES,
  INITIAL_SAMPLE_TRANSACTIONS,
  INITIAL_SAMPLE_NOTES,
  INITIAL_SAMPLE_LOANS,
  INITIAL_SAMPLE_LOAN_PAYMENTS,
  INITIAL_SAMPLE_CONTRIBUTORS,
  DEFAULT_SECURITY_SETTINGS,
} from '../data/sampleData';
import { loadStoredExchangeRate } from './exchangeRate';
import { encryptData, decryptData } from './cryptoUtils';

const TASKS_STORAGE_KEY = 'followup_app_tasks_v1';
const ACCOUNTS_STORAGE_KEY = 'hub_money_accounts_v1';
const CATEGORIES_STORAGE_KEY = 'hub_expense_categories_v1';
const TRANSACTIONS_STORAGE_KEY = 'hub_transactions_v1';
const NOTES_STORAGE_KEY = 'hub_notes_v1';
const LOANS_STORAGE_KEY = 'hub_loans_v1';
const LOAN_PAYMENTS_STORAGE_KEY = 'hub_loan_payments_v1';
const CONTRIBUTORS_STORAGE_KEY = 'hub_contributors_v1';
const SECURITY_STORAGE_KEY = 'hub_security_settings_v1';
const SAFETY_BACKUP_KEY = 'hub_safety_backup_pre_restore_v1';

// ==========================================
// TASKS STORAGE (PRESERVED)
// ==========================================

export function loadTasksFromStorage(): Task[] {
  try {
    const raw = localStorage.getItem(TASKS_STORAGE_KEY);
    if (!raw) {
      saveTasksToStorage(INITIAL_SAMPLE_TASKS);
      return INITIAL_SAMPLE_TASKS;
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed;
    }
    return INITIAL_SAMPLE_TASKS;
  } catch (err) {
    console.error('Failed to parse tasks from localStorage:', err);
    return INITIAL_SAMPLE_TASKS;
  }
}

export function saveTasksToStorage(tasks: Task[]): void {
  try {
    localStorage.setItem(TASKS_STORAGE_KEY, JSON.stringify(tasks));
  } catch (err) {
    console.error('Failed to save tasks to localStorage:', err);
  }
}

export function resetTasksToDefault(): Task[] {
  saveTasksToStorage(INITIAL_SAMPLE_TASKS);
  return INITIAL_SAMPLE_TASKS;
}

// ==========================================
// MONEY ACCOUNTS STORAGE & BALANCES
// ==========================================

export function loadAccountsFromStorage(): MoneyAccount[] {
  try {
    const raw = localStorage.getItem(ACCOUNTS_STORAGE_KEY);
    if (!raw) {
      saveAccountsToStorage(INITIAL_SAMPLE_ACCOUNTS);
      return INITIAL_SAMPLE_ACCOUNTS;
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed;
    }
    return INITIAL_SAMPLE_ACCOUNTS;
  } catch (err) {
    console.error('Failed to parse accounts from localStorage:', err);
    return INITIAL_SAMPLE_ACCOUNTS;
  }
}

export function saveAccountsToStorage(accounts: MoneyAccount[]): void {
  try {
    localStorage.setItem(ACCOUNTS_STORAGE_KEY, JSON.stringify(accounts));
  } catch (err) {
    console.error('Failed to save accounts to localStorage:', err);
  }
}

// ==========================================
// EXPENSE CATEGORIES STORAGE
// ==========================================

export function loadCategoriesFromStorage(): ExpenseCategory[] {
  try {
    const raw = localStorage.getItem(CATEGORIES_STORAGE_KEY);
    if (!raw) {
      saveCategoriesToStorage(INITIAL_SAMPLE_CATEGORIES);
      return INITIAL_SAMPLE_CATEGORIES;
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed;
    }
    return INITIAL_SAMPLE_CATEGORIES;
  } catch (err) {
    console.error('Failed to parse categories from localStorage:', err);
    return INITIAL_SAMPLE_CATEGORIES;
  }
}

export function saveCategoriesToStorage(categories: ExpenseCategory[]): void {
  try {
    localStorage.setItem(CATEGORIES_STORAGE_KEY, JSON.stringify(categories));
  } catch (err) {
    console.error('Failed to save categories to localStorage:', err);
  }
}

// ==========================================
// TRANSACTIONS STORAGE & BALANCE RECALCULATION
// ==========================================

export function loadTransactionsFromStorage(): Transaction[] {
  try {
    const raw = localStorage.getItem(TRANSACTIONS_STORAGE_KEY);
    if (!raw) {
      saveTransactionsToStorage(INITIAL_SAMPLE_TRANSACTIONS);
      return INITIAL_SAMPLE_TRANSACTIONS;
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed;
    }
    return INITIAL_SAMPLE_TRANSACTIONS;
  } catch (err) {
    console.error('Failed to parse transactions from localStorage:', err);
    return INITIAL_SAMPLE_TRANSACTIONS;
  }
}

export function saveTransactionsToStorage(transactions: Transaction[]): void {
  try {
    localStorage.setItem(TRANSACTIONS_STORAGE_KEY, JSON.stringify(transactions));
  } catch (err) {
    console.error('Failed to save transactions to localStorage:', err);
  }
}

/**
 * Accurately recalculates all account balances from opening balance + transactions history
 */
export function recalculateAccountBalances(
  accounts: MoneyAccount[],
  transactions: Transaction[]
): MoneyAccount[] {
  return accounts.map((acc) => {
    let balance = Number(acc.openingBalance) || 0;

    transactions.forEach((tx) => {
      const amount = Number(tx.amount) || 0;
      if (tx.type === 'Money Added' && tx.accountId === acc.id) {
        balance += amount;
      } else if (tx.type === 'Expense' && tx.accountId === acc.id) {
        balance -= amount;
      } else if (tx.type === 'Loan Payment' && tx.accountId === acc.id) {
        balance -= amount; // Loan payments from this account decrease balance
      } else if (tx.type === 'Transfer') {
        if (tx.accountId === acc.id) {
          balance -= amount; // Source account decreases
        }
        if (tx.toAccountId === acc.id) {
          balance += amount; // Destination account increases
        }
      }
    });

    return {
      ...acc,
      currentBalance: balance,
    };
  });
}

// ==========================================
// NOTES STORAGE
// ==========================================

export function loadNotesFromStorage(): Note[] {
  try {
    const raw = localStorage.getItem(NOTES_STORAGE_KEY);
    if (!raw) {
      saveNotesToStorage(INITIAL_SAMPLE_NOTES);
      return INITIAL_SAMPLE_NOTES;
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed;
    }
    return INITIAL_SAMPLE_NOTES;
  } catch (err) {
    console.error('Failed to parse notes from localStorage:', err);
    return INITIAL_SAMPLE_NOTES;
  }
}

export function saveNotesToStorage(notes: Note[]): void {
  try {
    localStorage.setItem(NOTES_STORAGE_KEY, JSON.stringify(notes));
  } catch (err) {
    console.error('Failed to save notes to localStorage:', err);
  }
}

// ==========================================
// LOANS STORAGE
// ==========================================

export function loadLoansFromStorage(): Loan[] {
  try {
    const raw = localStorage.getItem(LOANS_STORAGE_KEY);
    if (!raw) {
      saveLoansToStorage(INITIAL_SAMPLE_LOANS);
      return INITIAL_SAMPLE_LOANS;
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed;
    }
    return INITIAL_SAMPLE_LOANS;
  } catch (err) {
    console.error('Failed to parse loans from localStorage:', err);
    return INITIAL_SAMPLE_LOANS;
  }
}

export function saveLoansToStorage(loans: Loan[]): void {
  try {
    localStorage.setItem(LOANS_STORAGE_KEY, JSON.stringify(loans));
  } catch (err) {
    console.error('Failed to save loans to localStorage:', err);
  }
}

// ==========================================
// LOAN PAYMENTS STORAGE
// ==========================================

export function loadLoanPaymentsFromStorage(): LoanPayment[] {
  try {
    const raw = localStorage.getItem(LOAN_PAYMENTS_STORAGE_KEY);
    if (!raw) {
      saveLoanPaymentsToStorage(INITIAL_SAMPLE_LOAN_PAYMENTS);
      return INITIAL_SAMPLE_LOAN_PAYMENTS;
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed;
    }
    return INITIAL_SAMPLE_LOAN_PAYMENTS;
  } catch (err) {
    console.error('Failed to parse loan payments from localStorage:', err);
    return INITIAL_SAMPLE_LOAN_PAYMENTS;
  }
}

export function saveLoanPaymentsToStorage(payments: LoanPayment[]): void {
  try {
    localStorage.setItem(LOAN_PAYMENTS_STORAGE_KEY, JSON.stringify(payments));
  } catch (err) {
    console.error('Failed to save loan payments to localStorage:', err);
  }
}

// ==========================================
// CONTRIBUTORS STORAGE
// ==========================================

export function loadContributorsFromStorage(): Contributor[] {
  try {
    const raw = localStorage.getItem(CONTRIBUTORS_STORAGE_KEY);
    if (!raw) {
      saveContributorsToStorage(INITIAL_SAMPLE_CONTRIBUTORS);
      return INITIAL_SAMPLE_CONTRIBUTORS;
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed;
    }
    return INITIAL_SAMPLE_CONTRIBUTORS;
  } catch (err) {
    console.error('Failed to parse contributors from localStorage:', err);
    return INITIAL_SAMPLE_CONTRIBUTORS;
  }
}

export function saveContributorsToStorage(contributors: Contributor[]): void {
  try {
    localStorage.setItem(CONTRIBUTORS_STORAGE_KEY, JSON.stringify(contributors));
  } catch (err) {
    console.error('Failed to save contributors to localStorage:', err);
  }
}

// ==========================================
// SECURITY SETTINGS STORAGE
// ==========================================

export function loadSecuritySettings(): SecuritySettings {
  try {
    const raw = localStorage.getItem(SECURITY_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed.isPinEnabled === 'boolean') {
        return { ...DEFAULT_SECURITY_SETTINGS, ...parsed };
      }
    }
  } catch (err) {
    console.error('Failed to parse security settings:', err);
  }
  return DEFAULT_SECURITY_SETTINGS;
}

export function saveSecuritySettings(settings: SecuritySettings): void {
  try {
    localStorage.setItem(SECURITY_STORAGE_KEY, JSON.stringify(settings));
  } catch (err) {
    console.error('Failed to save security settings:', err);
  }
}

// ==========================================
// BACKUP & ENCRYPTED EXPORT/IMPORT
// ==========================================

export interface AppStateData {
  tasks: Task[];
  accounts: MoneyAccount[];
  categories: ExpenseCategory[];
  transactions: Transaction[];
  notes: Note[];
  loans: Loan[];
  loanPayments: LoanPayment[];
  contributors: Contributor[];
  exchangeRate: ExchangeRateRecord;
  securitySettings?: SecuritySettings;
}

export interface StructuredBackupFile {
  backupVersion: number;
  appVersion: string;
  createdAt: string;
  dataCollections: {
    tasks: Task[];
    accounts: MoneyAccount[];
    categories: ExpenseCategory[];
    transactions: Transaction[];
    notes: Note[];
    loans: Loan[];
    loanPayments: LoanPayment[];
    contributors: Contributor[];
    exchangeRate: ExchangeRateRecord;
  };
}

export function createStructuredBackup(data: AppStateData): StructuredBackupFile {
  return {
    backupVersion: 1,
    appVersion: '1.0',
    createdAt: new Date().toISOString(),
    dataCollections: {
      tasks: data.tasks,
      accounts: data.accounts,
      categories: data.categories,
      transactions: data.transactions,
      notes: data.notes,
      loans: data.loans,
      loanPayments: data.loanPayments,
      contributors: data.contributors,
      exchangeRate: data.exchangeRate,
    },
  };
}

export function loadSafetyBackup(): AppStateData | null {
  try {
    const raw = localStorage.getItem(SAFETY_BACKUP_KEY);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (e) {
    console.error('Failed to load safety backup:', e);
  }
  return null;
}

export function collectCurrentAppState(): AppStateData {
  return {
    tasks: loadTasksFromStorage(),
    accounts: loadAccountsFromStorage(),
    categories: loadCategoriesFromStorage(),
    transactions: loadTransactionsFromStorage(),
    notes: loadNotesFromStorage(),
    loans: loadLoansFromStorage(),
    loanPayments: loadLoanPaymentsFromStorage(),
    contributors: loadContributorsFromStorage(),
    exchangeRate: loadStoredExchangeRate(),
    securitySettings: loadSecuritySettings(),
  };
}

/**
 * Creates an unencrypted or encrypted backup package ready for file download or Drive upload
 */
export async function createBackupPackage(
  data: AppStateData,
  encryptionPassword?: string
): Promise<BackupPackage> {
  const summary = {
    tasksCount: data.tasks.length,
    accountsCount: data.accounts.length,
    transactionsCount: data.transactions.length,
    notesCount: data.notes.length,
    loansCount: data.loans.length,
    paymentsCount: data.loanPayments.length,
  };

  const basePackage: BackupPackage = {
    appVersion: '2.0',
    dataVersion: '2026.04',
    backupDate: new Date().toISOString(),
    isEncrypted: !!encryptionPassword,
    summary,
  };

  if (encryptionPassword && encryptionPassword.trim().length > 0) {
    const encrypted = await encryptData(data, encryptionPassword);
    basePackage.encryptedData = encrypted.encryptedData;
    basePackage.iv = encrypted.iv;
    basePackage.salt = encrypted.salt;
  } else {
    basePackage.payload = data;
  }

  return basePackage;
}

/**
 * Parse and decrypt a backup package
 */
export async function extractBackupPayload(
  pkg: BackupPackage,
  decryptionPassword?: string
): Promise<AppStateData> {
  if (!pkg.isEncrypted && pkg.payload) {
    return pkg.payload as AppStateData;
  }

  if (pkg.isEncrypted) {
    if (!decryptionPassword) {
      throw new Error('This backup is encrypted. Please provide the backup password.');
    }
    if (!pkg.encryptedData || !pkg.iv || !pkg.salt) {
      throw new Error('Malformed encrypted backup package.');
    }

    try {
      const decrypted = await decryptData(
        pkg.encryptedData,
        pkg.iv,
        pkg.salt,
        decryptionPassword
      );
      return decrypted as AppStateData;
    } catch (e: any) {
      throw new Error('Incorrect password or corrupted backup file.');
    }
  }

  throw new Error('Invalid backup file format.');
}

/**
 * Apply restored AppStateData with a safety backup created first
 */
export function applyRestoredAppState(data: AppStateData): void {
  // 1. Create a safety snapshot of the existing state before replacing
  const currentState = collectCurrentAppState();
  try {
    localStorage.setItem(SAFETY_BACKUP_KEY, JSON.stringify(currentState));
  } catch (e) {
    console.warn('Could not create pre-restore safety snapshot:', e);
  }

  // 2. Safely apply each data slice if valid
  if (Array.isArray(data.tasks)) saveTasksToStorage(data.tasks);
  if (Array.isArray(data.accounts)) saveAccountsToStorage(data.accounts);
  if (Array.isArray(data.categories)) saveCategoriesToStorage(data.categories);
  if (Array.isArray(data.transactions)) saveTransactionsToStorage(data.transactions);
  if (Array.isArray(data.notes)) saveNotesToStorage(data.notes);
  if (Array.isArray(data.loans)) saveLoansToStorage(data.loans);
  if (Array.isArray(data.loanPayments)) saveLoanPaymentsToStorage(data.loanPayments);
  if (Array.isArray(data.contributors)) saveContributorsToStorage(data.contributors);
}

export function exportAllDataAsJSON(
  tasks: Task[],
  accounts: MoneyAccount[],
  categories: ExpenseCategory[],
  transactions: Transaction[],
  notes: Note[]
): void {
  const fullBackup = {
    version: '2.0',
    exportedAt: new Date().toISOString(),
    tasks,
    accounts,
    categories,
    transactions,
    notes,
    loans: loadLoansFromStorage(),
    loanPayments: loadLoanPaymentsFromStorage(),
    contributors: loadContributorsFromStorage(),
  };
  const jsonStr = JSON.stringify(fullBackup, null, 2);
  const blob = new Blob([jsonStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `personal_hub_backup_${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

export function exportTasksAsJSON(tasks: Task[]): void {
  const jsonStr = JSON.stringify(tasks, null, 2);
  const blob = new Blob([jsonStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `followup_tasks_backup_${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
}



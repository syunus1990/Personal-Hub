export type Priority = 'Low' | 'Medium' | 'High';

export type Status = 'Pending' | 'In Progress' | 'Completed' | 'On Hold';

export type Category = 
  | 'Personal'
  | 'Work'
  | 'Finance'
  | 'Car'
  | 'Home'
  | 'Shopping'
  | 'Documents'
  | 'Ideas'
  | 'Wishlist'
  | 'Other';

export interface FollowUpHistoryEntry {
  id: string;
  date: string; // ISO string or YYYY-MM-DD
  completionPercentage: number;
  remark: string;
  createdAt: string;
}

export interface Task {
  id: string;
  title: string;
  category: Category;
  priority: Priority;
  status: Status;
  completionPercentage: number; // 0 to 100
  followUpDate: string; // YYYY-MM-DD
  remarks: string; // latest/active remark
  createdDate: string; // YYYY-MM-DD
  lastFollowedUpAt?: string; // ISO date string
  history: FollowUpHistoryEntry[];
}

export type FilterTab = 
  | 'Dashboard'
  | 'All'
  | 'Today'
  | 'Overdue'
  | 'In Progress'
  | 'Pending'
  | 'Wishlist'
  | 'Completed';

export type SortField = 'followUpDate' | 'priority' | 'completionPercentage' | 'createdDate' | 'title';
export type SortOrder = 'asc' | 'desc';

// ==========================================
// PERSONAL HUB & MODULE TYPES
// ==========================================

export type ActiveModule = 
  | 'home'
  | 'followup'
  | 'money'
  | 'expenses'
  | 'loans'
  | 'notes'
  | 'calendar'
  | 'summary';

// Money Accounts
export interface MoneyAccount {
  id: string;
  name: string;
  openingBalance: number;
  currentBalance: number;
  color?: string;
  createdAt: string;
}

// User-Managed Expense Categories
export interface ExpenseCategory {
  id: string;
  name: string;
  icon?: string;
  order: number;
  color?: string;
}

// Transactions
export type TransactionType = 'Expense' | 'Money Added' | 'Transfer' | 'Loan Payment';

export interface Transaction {
  id: string;
  type: TransactionType;
  amount: number;
  accountId: string; // From account or target account for Money Added
  toAccountId?: string; // For Transfer only
  categoryId?: string; // Optional for Expense
  date: string; // YYYY-MM-DD
  remark?: string; // Optional
  loanPaymentId?: string; // Linked loan payment ID if applicable
  createdAt: string; // ISO string
}

// Personal Notes
export interface Note {
  id: string;
  title: string;
  content: string;
  tags?: string[];
  createdDate: string; // YYYY-MM-DD or ISO
  modifiedDate: string; // YYYY-MM-DD or ISO
  updatedAt?: string;
  createdAt?: string;
  color?: string;
}

// ==========================================
// LOANS & CONVERSION TYPES
// ==========================================

export type LoanCurrency = 'INR' | 'SAR';

export interface Loan {
  id: string;
  name: string;
  originalCurrency: LoanCurrency;
  originalAmount: number;
  startDate: string; // YYYY-MM-DD
  lenderName?: string; // Optional
  remark?: string; // Optional
  createdAt: string; // ISO string
}

export interface LoanPayment {
  id: string;
  loanId: string;
  amount: number;
  currency: LoanCurrency;
  exchangeRateUsed: number; // 1 INR = X SAR rate at time of payment (e.g. 0.045)
  date: string; // YYYY-MM-DD
  paidBy: string; // Contributor name, e.g. "Me", "Brother", etc.
  accountId?: string; // Optional linked money account
  remark?: string;
  createdAt: string; // ISO string
}

export interface Contributor {
  id: string;
  name: string;
  isDefault?: boolean;
}

export interface ExchangeRateRecord {
  rateInrToSar: number; // 1 INR = X SAR (e.g., 0.045)
  rateSarToInr: number; // 1 SAR = X INR (e.g., 22.22)
  lastUpdated: string; // ISO string or human date
  source: string;
}

// ==========================================
// SECURITY & LOCK TYPES
// ==========================================

export type AutoLockTimeout = 'immediately' | '1m' | '5m' | '15m';

export interface SecuritySettings {
  isPinEnabled: boolean;
  pinHash?: string; // SHA-256 hashed PIN
  pinSalt?: string;
  isBiometricEnabled: boolean;
  autoLockTimeout: AutoLockTimeout;
}

// ==========================================
// BACKUP & GOOGLE DRIVE TYPES
// ==========================================

export interface BackupPackage {
  appVersion: string;
  dataVersion: string;
  backupDate: string;
  isEncrypted: boolean;
  encryptedData?: string;
  iv?: string;
  salt?: string;
  summary: {
    tasksCount: number;
    accountsCount: number;
    transactionsCount: number;
    notesCount: number;
    loansCount: number;
    paymentsCount: number;
  };
  payload?: {
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
  };
}



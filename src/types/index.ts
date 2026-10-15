export type Currency =
  | 'SAR' // Saudi Riyal
  | 'AED' // UAE Dirham
  | 'QAR' // Qatari Riyal
  | 'KWD' // Kuwaiti Dinar
  | 'BHD' // Bahraini Dinar
  | 'OMR' // Omani Rial
  | 'INR' // Indian Rupee
  | 'PKR' // Pakistani Rupee
  | 'BDT' // Bangladeshi Taka
  | 'PHP' // Philippine Peso
  | 'IDR' // Indonesian Rupiah
  | 'USD'; // US Dollar

export type AccountType = 'bank' | 'cash' | 'wallet' | 'savings' | 'credit_card';

export interface Account {
  id: string;
  name: string;
  type: AccountType;
  openingBalanceSAR: number;
  currentBalanceSAR: number;
  color: string; // pastel color identifier
  iconName?: string;
  accountNumberMask?: string;
  updatedAt: string;
}

export type TransactionType = 'income' | 'expense' | 'transfer';

export interface SubCategory {
  id: string;
  categoryId: string;
  name: string;
  color?: string;
}

export interface CategoryItem {
  id: string;
  name: string;
  color: string;
  icon?: string;
  subCategories: SubCategory[];
}

export interface Transaction {
  id: string;
  accountId: string; // source account (or destination if income)
  toAccountId?: string; // for transfers
  type: TransactionType;
  amountSAR: number;
  category: string;
  subCategory?: string; // e.g. "Fuel", "Maintenance", "Cleaning"
  note: string;
  date: string; // YYYY-MM-DD
  createdAt: string;
}

export type NoteColor = 'lavender' | 'mint' | 'peach' | 'sky' | 'butter' | 'slate';

export interface ChecklistItem {
  id: string;
  text: string;
  isCompleted: boolean;
  completedAt?: string; // Date and time when checked (e.g. ISO string)
}

export interface Note {
  id: string;
  title: string;
  content: string;
  category: string;
  color: NoteColor;
  checklist?: ChecklistItem[]; // Sub-points / checklist notes
  isPinned: boolean;
  createdAt: string;
  updatedAt: string;
}

export type Priority = 'low' | 'medium' | 'high';

export interface FollowUp {
  id: string;
  title: string;
  category: string;
  dueDate: string; // YYYY-MM-DD
  dueTime?: string; // HH:mm
  priority: Priority;
  isCompleted: boolean;
  completedAt?: string;
  notes?: string;
  checklist?: ChecklistItem[]; // Sub-tasks checklist with completion timestamps
  createdAt: string;
}

export interface WishlistItem {
  id: string;
  title: string;
  estimatedPriceSAR: number;
  savedAmountSAR: number;
  priority: Priority;
  category: string;
  targetDate?: string;
  productUrl?: string;
  notes?: string;
  checklist?: ChecklistItem[]; // Sub-points / purchase milestones
  isPurchased: boolean;
  createdAt: string;
}

export type LoanType = 'lent' | 'borrowed'; // 'lent' = I lent to someone (receivable), 'borrowed' = I borrowed from someone (payable)
export type LoanStatus = 'active' | 'repaid' | 'overdue';

export interface LoanRepayment {
  id: string;
  amountSAR: number;
  date: string;
  note?: string;
}

export interface Loan {
  id: string;
  type: LoanType;
  counterpartyName: string;
  counterpartyPhone?: string;
  amountSAR: number;
  repaidAmountSAR: number;
  dueDate: string;
  status: LoanStatus;
  notes?: string;
  repayments: LoanRepayment[];
  createdAt: string;
}

export type SyncGateState = 'LOCKED' | 'WAITING_FOR_MOBILE' | 'SYNCING' | 'VERIFYING' | 'UNLOCKED';

export interface AppSettings {
  theme: 'light' | 'dark' | 'system';
  exchangeRateSARtoINR: number; // 1 SAR = X INR (e.g. 25.7)
  displayCurrency: Currency; // default display currency toggle
  enableExchangeRate: boolean; // if false, disable exchange rate and show all in primary currency
  enableHaptics: boolean;
  isFullscreen: boolean;
  brandingLabel?: string; // e.g. "Daily Pulse", "Horizon Studio", etc.
  syncGateEnabled?: boolean; // If true on PC, enforce mandatory mobile sync gate
}

export type TabType = 'dashboard' | 'money' | 'notes' | 'followups' | 'wishlists' | 'loans';

export interface EditModalState {
  isOpen: boolean;
  entityType: 'transaction' | 'account' | 'note' | 'followup' | 'wishlist' | 'loan' | 'repayment' | null;
  entityId?: string;
  defaultData?: any;
}


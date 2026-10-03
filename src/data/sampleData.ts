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
} from '../types';
import { getTodayString, addDaysToDate } from '../utils/dateUtils';

const today = getTodayString();
const yesterday = addDaysToDate(today, -1);
const threeDaysAgo = addDaysToDate(today, -3);
const sixDaysAgo = addDaysToDate(today, -6);
const tomorrow = addDaysToDate(today, 1);
const nextWeek = addDaysToDate(today, 7);

export const INITIAL_SAMPLE_TASKS: Task[] = [
  {
    id: 'task-1',
    title: 'Laptop repair',
    category: 'Work',
    priority: 'High',
    status: 'In Progress',
    completionPercentage: 60,
    followUpDate: today,
    remarks: 'Service center checked the laptop. Motherboard IC replaced, awaiting screen calibration.',
    createdDate: sixDaysAgo,
    lastFollowedUpAt: new Date().toISOString(),
    history: [
      {
        id: 'hist-1-1',
        date: today,
        completionPercentage: 60,
        remark: 'Service center checked the laptop. Parts arrived, technician running thermal diagnostics.',
        createdAt: new Date().toISOString(),
      },
      {
        id: 'hist-1-2',
        date: threeDaysAgo,
        completionPercentage: 40,
        remark: 'Laptop submitted for checking. Diagnosis confirmed faulty power management chip.',
        createdAt: new Date(Date.now() - 3 * 86400000).toISOString(),
      },
      {
        id: 'hist-1-3',
        date: sixDaysAgo,
        completionPercentage: 10,
        remark: 'Initial ticket raised at authorized service store. Estimated turnaround: 7 days.',
        createdAt: new Date(Date.now() - 6 * 86400000).toISOString(),
      },
    ],
  },
  {
    id: 'task-2',
    title: 'Insurance claim',
    category: 'Finance',
    priority: 'High',
    status: 'Pending',
    completionPercentage: 40,
    followUpDate: tomorrow,
    remarks: 'Sent medical bills and incident summary to claims adjuster. Awaiting confirmation number.',
    createdDate: threeDaysAgo,
    lastFollowedUpAt: new Date(Date.now() - 86400000).toISOString(),
    history: [
      {
        id: 'hist-2-1',
        date: yesterday,
        completionPercentage: 40,
        remark: 'Sent medical bills and incident summary to claims adjuster.',
        createdAt: new Date(Date.now() - 86400000).toISOString(),
      },
      {
        id: 'hist-2-2',
        date: threeDaysAgo,
        completionPercentage: 15,
        remark: 'Initiated claim inquiry on portal. Downloaded settlement checklist.',
        createdAt: new Date(Date.now() - 3 * 86400000).toISOString(),
      },
    ],
  },
  {
    id: 'task-3',
    title: 'Buy external SSD',
    category: 'Wishlist',
    priority: 'Low',
    status: 'Pending',
    completionPercentage: 0,
    followUpDate: nextWeek,
    remarks: 'Shortlisted 2TB NVMe rugged drive. Waiting for weekend lightning deal on electronics site.',
    createdDate: yesterday,
    history: [
      {
        id: 'hist-3-1',
        date: yesterday,
        completionPercentage: 0,
        remark: 'Added to price tracker. Target price is under $130.',
        createdAt: new Date(Date.now() - 86400000).toISOString(),
      },
    ],
  },
  {
    id: 'task-4',
    title: 'Call service center',
    category: 'Home',
    priority: 'Medium',
    status: 'In Progress',
    completionPercentage: 80,
    followUpDate: today,
    remarks: 'Replacement filter delivered. Need to schedule technician installation visit.',
    createdDate: fourDaysAgo(),
    lastFollowedUpAt: new Date().toISOString(),
    history: [
      {
        id: 'hist-4-1',
        date: yesterday,
        completionPercentage: 80,
        remark: 'Courier delivered the spare water purifier filter cartridge.',
        createdAt: new Date(Date.now() - 86400000).toISOString(),
      },
      {
        id: 'hist-4-2',
        date: fourDaysAgo(),
        completionPercentage: 50,
        remark: 'Called central customer care, placed replacement order #AC-8821.',
        createdAt: new Date(Date.now() - 4 * 86400000).toISOString(),
      },
    ],
  },
  {
    id: 'task-5',
    title: 'Car annual maintenance & oil change',
    category: 'Car',
    priority: 'Medium',
    status: 'In Progress',
    completionPercentage: 30,
    followUpDate: yesterday, // Overdue by 1 day to showcase overdue section
    remarks: 'Mechanic quoted synthetic oil and brake pads check. Need to confirm booking date.',
    createdDate: sixDaysAgo,
    history: [
      {
        id: 'hist-5-1',
        date: threeDaysAgo,
        completionPercentage: 30,
        remark: 'Got price estimate from local auto shop. Comparing with dealership.',
        createdAt: new Date(Date.now() - 3 * 86400000).toISOString(),
      },
    ],
  },
  {
    id: 'task-6',
    title: 'Renew passport documents',
    category: 'Documents',
    priority: 'High',
    status: 'Pending',
    completionPercentage: 20,
    followUpDate: addDaysToDate(today, 3),
    remarks: 'Application submitted online. Need to print photo and gather utility proof before appointment.',
    createdDate: yesterday,
    history: [
      {
        id: 'hist-6-1',
        date: yesterday,
        completionPercentage: 20,
        remark: 'Completed online application form and booked verification appointment slot.',
        createdAt: new Date(Date.now() - 86400000).toISOString(),
      },
    ],
  },
];

function fourDaysAgo(): string {
  return addDaysToDate(today, -4);
}

// Initial Sample Money Accounts
export const INITIAL_SAMPLE_ACCOUNTS: MoneyAccount[] = [
  {
    id: 'acc-1',
    name: 'Al Rajhi',
    openingBalance: 4155,
    currentBalance: 8500,
    color: '#8b5cf6',
    createdAt: new Date(Date.now() - 30 * 86400000).toISOString(),
  },
  {
    id: 'acc-2',
    name: 'SNB',
    openingBalance: 3200,
    currentBalance: 3200,
    color: '#06b6d4',
    createdAt: new Date(Date.now() - 30 * 86400000).toISOString(),
  },
  {
    id: 'acc-3',
    name: 'Cash',
    openingBalance: 250,
    currentBalance: 750,
    color: '#10b981',
    createdAt: new Date(Date.now() - 30 * 86400000).toISOString(),
  },
];

// Initial User-Managed Expense Categories
export const INITIAL_SAMPLE_CATEGORIES: ExpenseCategory[] = [
  { id: 'cat-food', name: 'Food', icon: 'Utensils', order: 1, color: '#f59e0b' },
  { id: 'cat-fuel', name: 'Fuel', icon: 'Fuel', order: 2, color: '#ef4444' },
  { id: 'cat-shopping', name: 'Shopping', icon: 'ShoppingBag', order: 3, color: '#ec4899' },
  { id: 'cat-bills', name: 'Bills', icon: 'Receipt', order: 4, color: '#6366f1' },
  { id: 'cat-car', name: 'Car', icon: 'Car', order: 5, color: '#3b82f6' },
  { id: 'cat-family', name: 'Family', icon: 'Users', order: 6, color: '#14b8a6' },
  { id: 'cat-personal', name: 'Personal', icon: 'User', order: 7, color: '#8b5cf6' },
  { id: 'cat-other', name: 'Other', icon: 'Tag', order: 8, color: '#64748b' },
];

// Initial Sample Transactions
export const INITIAL_SAMPLE_TRANSACTIONS: Transaction[] = [
  {
    id: 'tx-1',
    type: 'Expense',
    amount: 35,
    accountId: 'acc-1',
    categoryId: 'cat-food',
    date: today,
    remark: 'Lunch',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'tx-2',
    type: 'Expense',
    amount: 120,
    accountId: 'acc-1',
    categoryId: 'cat-fuel',
    date: today,
    remark: 'Fuel',
    createdAt: new Date(Date.now() - 3600000).toISOString(),
  },
  {
    id: 'tx-3',
    type: 'Money Added',
    amount: 5000,
    accountId: 'acc-1',
    date: yesterday,
    remark: 'Salary',
    createdAt: new Date(Date.now() - 86400000).toISOString(),
  },
  {
    id: 'tx-4',
    type: 'Transfer',
    amount: 500,
    accountId: 'acc-1',
    toAccountId: 'acc-3',
    date: yesterday,
    remark: 'ATM Cash Withdrawal',
    createdAt: new Date(Date.now() - 90000000).toISOString(),
  },
  {
    id: 'tx-5',
    type: 'Expense',
    amount: 2185,
    accountId: 'acc-1',
    categoryId: 'cat-bills',
    date: threeDaysAgo,
    remark: 'Monthly utilities & electricity',
    createdAt: new Date(Date.now() - 3 * 86400000).toISOString(),
  },
];

// Initial Sample Notes
export const INITIAL_SAMPLE_NOTES: Note[] = [
  {
    id: 'note-1',
    title: 'Passport renewal documents list',
    content: '1. Original old passport\n2. Two 4x6cm white background photos\n3. National ID copy\n4. Appointment confirmation barcode printout\n5. Payment receipt from portal.',
    tags: ['official', 'travel', 'documents'],
    createdDate: yesterday,
    modifiedDate: today,
    updatedAt: new Date(Date.now() - 3600000).toISOString(),
  },
  {
    id: 'note-2',
    title: 'Car service recommendations',
    content: 'Mechanic recommended checking spark plugs and brake pad thickness at 40,000 km mark. Keep receipt for warranty book stamp.',
    tags: ['car', 'maintenance'],
    createdDate: threeDaysAgo,
    modifiedDate: threeDaysAgo,
    updatedAt: new Date(Date.now() - 3 * 86400000).toISOString(),
  },
  {
    id: 'note-3',
    title: 'Home office desk ideas',
    content: 'Looking for a solid oak tabletop (160x80cm) with dual-motor standing desk legs. Cable tray management underneath.',
    tags: ['office', 'wishlist'],
    createdDate: sixDaysAgo,
    modifiedDate: sixDaysAgo,
    updatedAt: new Date(Date.now() - 6 * 86400000).toISOString(),
  },
];

// Initial Sample Loans
export const INITIAL_SAMPLE_LOANS: Loan[] = [
  {
    id: 'loan-1',
    name: 'India Personal Loan',
    originalCurrency: 'INR',
    originalAmount: 200000,
    startDate: '2026-01-10',
    lenderName: 'SBI Personal Loan',
    remark: 'Home interior and furniture refurbishment',
    createdAt: new Date(Date.now() - 60 * 86400000).toISOString(),
  },
  {
    id: 'loan-2',
    name: 'Saudi Auto Financing',
    originalCurrency: 'SAR',
    originalAmount: 15000,
    startDate: '2026-02-15',
    lenderName: 'Al Rajhi Finance',
    remark: 'Car balloon payment balance',
    createdAt: new Date(Date.now() - 40 * 86400000).toISOString(),
  },
];

// Initial Sample Loan Payments
export const INITIAL_SAMPLE_LOAN_PAYMENTS: LoanPayment[] = [
  {
    id: 'lp-1',
    loanId: 'loan-1',
    amount: 20000,
    currency: 'INR',
    exchangeRateUsed: 0.045,
    date: threeDaysAgo,
    paidBy: 'Me',
    accountId: 'acc-1',
    remark: 'February EMI installment',
    createdAt: new Date(Date.now() - 3 * 86400000).toISOString(),
  },
  {
    id: 'lp-2',
    loanId: 'loan-1',
    amount: 10000,
    currency: 'INR',
    exchangeRateUsed: 0.045,
    date: yesterday,
    paidBy: 'Brother',
    remark: 'Partial family contribution transfer',
    createdAt: new Date(Date.now() - 86400000).toISOString(),
  },
  {
    id: 'lp-3',
    loanId: 'loan-2',
    amount: 4000,
    currency: 'SAR',
    exchangeRateUsed: 1,
    date: yesterday,
    paidBy: 'Me',
    accountId: 'acc-1',
    remark: 'Monthly principal reduction payment',
    createdAt: new Date(Date.now() - 86400000).toISOString(),
  },
];

// Initial Custom Contributors
export const INITIAL_SAMPLE_CONTRIBUTORS: Contributor[] = [
  { id: 'contrib-1', name: 'Me', isDefault: true },
  { id: 'contrib-2', name: 'Brother' },
  { id: 'contrib-3', name: 'Father' },
  { id: 'contrib-4', name: 'Friend' },
  { id: 'contrib-5', name: 'Company' },
  { id: 'contrib-6', name: 'Other' },
];

// Default Security Settings
export const DEFAULT_SECURITY_SETTINGS: SecuritySettings = {
  isPinEnabled: false,
  isBiometricEnabled: false,
  autoLockTimeout: '5m',
};



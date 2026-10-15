import {
  Account,
  Transaction,
  Note,
  FollowUp,
  WishlistItem,
  Loan,
  AppSettings,
  CategoryItem,
  SubCategory,
} from '../types';

const STORAGE_KEYS = {
  ACCOUNTS: 'phub_accounts_v8',
  TRANSACTIONS: 'phub_transactions_v8',
  CATEGORIES: 'phub_categories_v8',
  NOTES: 'phub_notes_v8',
  FOLLOWUPS: 'phub_followups_v8',
  WISHLISTS: 'phub_wishlists_v8',
  LOANS: 'phub_loans_v8',
  SETTINGS: 'phub_settings_v8',
  DATA_VERSION: 'dataVersion',
  GATE_STATE: 'syncGateState',
};

export const CURRENT_DATA_VERSION = '2026-10-15T06:50:10.681Z';

export const DEFAULT_SETTINGS: AppSettings = {
  theme: 'dark', // Dark mode by default
  exchangeRateSARtoINR: 25.7,
  displayCurrency: 'SAR',
  enableExchangeRate: true,
  enableHaptics: true,
  isFullscreen: false,
  brandingLabel: 'Prime Edition',
};

// Initial Categories with Car Sub-categories (Fuel, Maintenance, Cleaning) and Flexible sub-categories
export const INITIAL_CATEGORIES: CategoryItem[] = [
  {
    id: 'cat-car',
    name: 'Car',
    color: '#3b82f6',
    icon: 'CarFront',
    subCategories: [
      { id: 'sub-car-fuel', categoryId: 'cat-car', name: 'Fuel', color: '#6366f1' },
      { id: 'sub-car-maintenance', categoryId: 'cat-car', name: 'Maintenance', color: '#ef4444' },
      { id: 'sub-car-cleaning', categoryId: 'cat-car', name: 'Cleaning', color: '#f59e0b' },
    ],
  },
  {
    id: 'cat-food',
    name: 'Food',
    color: '#f59e0b',
    icon: 'UtensilsCrossed',
    subCategories: [
      { id: 'sub-food-dining', categoryId: 'cat-food', name: 'Dining' },
      { id: 'sub-food-groceries', categoryId: 'cat-food', name: 'Groceries' },
      { id: 'sub-food-coffee', categoryId: 'cat-food', name: 'Coffee & Snacks' },
    ],
  },
  {
    id: 'cat-fuel',
    name: 'Fuel',
    color: '#ef4444',
    icon: 'Fuel',
    subCategories: [],
  },
  {
    id: 'cat-shopping',
    name: 'Shopping',
    color: '#ec4899',
    icon: 'ShoppingBag',
    subCategories: [
      { id: 'sub-shop-clothing', categoryId: 'cat-shopping', name: 'Clothing' },
      { id: 'sub-shop-accessories', categoryId: 'cat-shopping', name: 'Accessories' },
      { id: 'sub-shop-electronics', categoryId: 'cat-shopping', name: 'Electronics' },
    ],
  },
  {
    id: 'cat-bills',
    name: 'Bills',
    color: '#6366f1',
    icon: 'Receipt',
    subCategories: [
      { id: 'sub-bill-mobile', categoryId: 'cat-bills', name: 'Mobile Recharge' },
      { id: 'sub-bill-utilities', categoryId: 'cat-bills', name: 'Utilities' },
    ],
  },
  {
    id: 'cat-family',
    name: 'Family',
    color: '#14b8a6',
    icon: 'Heart',
    subCategories: [
      { id: 'sub-fam-home', categoryId: 'cat-family', name: 'Home' },
      { id: 'sub-fam-sadaqa', categoryId: 'cat-family', name: 'Sadaqa' },
    ],
  },
  {
    id: 'cat-personal',
    name: 'Personal',
    color: '#8b5cf6',
    icon: 'Fingerprint',
    subCategories: [
      { id: 'sub-per-invest', categoryId: 'cat-personal', name: 'Investment' },
      { id: 'sub-per-rent', categoryId: 'cat-personal', name: 'Rent & Living' },
      { id: 'sub-per-health', categoryId: 'cat-personal', name: 'Health & Medicine' },
    ],
  },
  {
    id: 'cat-other',
    name: 'Other',
    color: '#64748b',
    icon: 'Tag',
    subCategories: [],
  },
];

// All 8 Real Accounts from Attached Backup JSON
export const INITIAL_ACCOUNTS: Account[] = [
  {
    id: 'acc-1',
    name: 'SNB',
    type: 'bank',
    openingBalanceSAR: 8100,
    currentBalanceSAR: -1.85,
    color: '#8b5cf6',
    accountNumberMask: '•••• SNB',
    updatedAt: '2026-09-01T11:41:56.413Z',
  },
  {
    id: 'acc-2',
    name: 'D360',
    type: 'wallet',
    openingBalanceSAR: 0,
    currentBalanceSAR: 0,
    color: '#06b6d4',
    accountNumberMask: 'D360 Digital',
    updatedAt: '2026-09-01T11:41:56.413Z',
  },
  {
    id: 'acc-3',
    name: 'STC',
    type: 'wallet',
    openingBalanceSAR: 1250,
    currentBalanceSAR: 1038,
    color: '#10b981',
    accountNumberMask: 'STC Pay',
    updatedAt: '2026-10-09T21:18:10.304Z',
  },
  {
    id: 'acc_1790855039108',
    name: 'Alinma',
    type: 'bank',
    openingBalanceSAR: 1500,
    currentBalanceSAR: 435.25,
    color: '#8b5cf6',
    accountNumberMask: '•••• Alinma',
    updatedAt: '2026-10-01T11:43:59.108Z',
  },
  {
    id: 'acc_1790951200102',
    name: 'Tiqmo',
    type: 'wallet',
    openingBalanceSAR: 150,
    currentBalanceSAR: 150,
    color: '#64748b',
    accountNumberMask: 'Tiqmo Wallet',
    updatedAt: '2026-10-02T14:26:40.102Z',
  },
  {
    id: 'acc_1791355409897',
    name: 'CASH',
    type: 'cash',
    openingBalanceSAR: 0,
    currentBalanceSAR: 3.5,
    color: '#10b981',
    accountNumberMask: 'Cash Wallet',
    updatedAt: '2026-10-07T06:43:29.897Z',
  },
  {
    id: 'acc_1791497983529',
    name: 'Rozzy',
    type: 'wallet',
    openingBalanceSAR: 50,
    currentBalanceSAR: 0,
    color: '#06b6d4',
    accountNumberMask: 'Rozzy Wallet',
    updatedAt: '2026-10-08T22:19:43.529Z',
  },
  {
    id: 'acc_1791498669839',
    name: 'Isalesawab',
    type: 'savings',
    openingBalanceSAR: 0,
    currentBalanceSAR: 97.5,
    color: '#3b82f6',
    accountNumberMask: 'Isalesawab Account',
    updatedAt: '2026-10-08T22:31:09.839Z',
  },
];

// All 40 Real Transactions from Backup sorted strictly chronologically (newest first)
export const INITIAL_TRANSACTIONS: Transaction[] = [
  {
    id: 'tx_1792046864468_0ntj',
    type: 'expense',
    amountSAR: 4,
    accountId: 'acc-1',
    category: 'Food',
    subCategory: 'Groceries',
    date: '2026-10-14',
    note: 'Water refill',
    createdAt: '2026-10-15T06:47:44.468Z',
  },
  {
    id: 'tx_1791922105975_fiiv',
    type: 'expense',
    amountSAR: 78,
    accountId: 'acc-1',
    category: 'Food',
    subCategory: 'Groceries',
    date: '2026-10-13',
    note: 'Mutton',
    createdAt: '2026-10-13T20:08:25.975Z',
  },
  {
    id: 'tx_1792046973707_pngu',
    type: 'expense',
    amountSAR: 10,
    accountId: 'acc_1791355409897',
    category: 'Food',
    subCategory: 'Coffee & Snacks',
    date: '2026-10-13',
    note: 'Juice',
    createdAt: '2026-10-15T06:49:33.707Z',
  },
  {
    id: 'tx_1792046831363_1twy',
    type: 'expense',
    amountSAR: 23.45,
    accountId: 'acc-1',
    category: 'Personal',
    subCategory: 'Health & Medicine',
    date: '2026-10-12',
    note: 'Medicine',
    createdAt: '2026-10-15T06:47:11.363Z',
  },
  {
    id: 'tx_1791816514337_yom3',
    type: 'expense',
    amountSAR: 94.75,
    accountId: 'acc_1790855039108',
    category: 'Bills',
    subCategory: 'Mobile Recharge',
    date: '2026-10-11',
    note: 'Recharge STC',
    createdAt: '2026-10-12T14:48:34.337Z',
  },
  {
    id: 'tx_1791815477939_me4n',
    type: 'expense',
    amountSAR: 169.5,
    accountId: 'acc_1791497983529',
    category: 'Shopping',
    subCategory: 'Electronics',
    date: '2026-10-11',
    note: 'Lulu grocery and acer keyboard mouse',
    createdAt: '2026-10-12T14:31:17.939Z',
  },
  {
    id: 'tx_1791815437399_7jvc',
    type: 'income',
    amountSAR: 169.5,
    accountId: 'acc_1791497983529',
    category: 'Income',
    date: '2026-10-11',
    note: 'Available cash',
    createdAt: '2026-10-12T14:30:37.399Z',
  },
  {
    id: 'tx_1791580690304_lmt2',
    type: 'expense',
    amountSAR: 103,
    accountId: 'acc-3',
    category: 'Car',
    subCategory: 'Fuel',
    date: '2026-10-09',
    note: 'Fuel',
    createdAt: '2026-10-09T21:18:10.304Z',
  },
  {
    id: 'tx_1791579367910_35lp',
    type: 'transfer',
    amountSAR: 42.5,
    accountId: 'acc-1',
    toAccountId: 'acc_1791355409897',
    category: 'Transfer',
    date: '2026-10-09',
    note: 'Atm withdraw',
    createdAt: '2026-10-09T20:56:07.910Z',
  },
  {
    id: 'tx_1791579175748_avho',
    type: 'expense',
    amountSAR: 4,
    accountId: 'acc_1791355409897',
    category: 'Food',
    subCategory: 'Groceries',
    date: '2026-10-09',
    note: 'Water refill',
    createdAt: '2026-10-09T20:52:55.748Z',
  },
  {
    id: 'tx_1791579128510_f2y6',
    type: 'expense',
    amountSAR: 40,
    accountId: 'acc_1791498669839',
    category: 'Family',
    subCategory: 'Sadaqa',
    date: '2026-10-09',
    note: 'Water',
    createdAt: '2026-10-09T20:52:08.510Z',
  },
  {
    id: 'tx_1791578825248_2wrm',
    type: 'expense',
    amountSAR: 13.5,
    accountId: 'acc-1',
    category: 'Food',
    subCategory: 'Dining',
    date: '2026-10-09',
    note: 'Al baik',
    createdAt: '2026-10-09T20:47:05.248Z',
  },
  {
    id: 'tx_1791499222079_y4rb',
    type: 'income',
    amountSAR: 1500,
    accountId: 'acc_1791497983529',
    category: 'Income',
    date: '2026-10-09',
    note: 'Added funds',
    createdAt: '2026-10-08T22:40:22.079Z',
  },
  {
    id: 'tx_1791498399356_2dsq',
    type: 'expense',
    amountSAR: 280,
    accountId: 'acc_1790855039108',
    category: 'Car',
    subCategory: 'Maintenance',
    date: '2026-10-09',
    note: 'Battery Installation',
    createdAt: '2026-10-08T22:26:39.356Z',
  },
  {
    id: 'tx_1791567992145_7gk3',
    type: 'expense',
    amountSAR: 5,
    accountId: 'acc_1791355409897',
    category: 'Food',
    subCategory: 'Coffee & Snacks',
    date: '2026-10-08',
    note: 'Papaya juice',
    createdAt: '2026-10-09T17:46:32.145Z',
  },
  {
    id: 'tx_1791498728041_ip4c',
    type: 'transfer',
    amountSAR: 137.5,
    accountId: 'acc-1',
    toAccountId: 'acc_1791498669839',
    category: 'Transfer',
    date: '2026-10-08',
    note: 'Isalesawab Money',
    createdAt: '2026-10-08T22:32:08.041Z',
  },
  {
    id: 'tx_1791498591041_jnt8',
    type: 'expense',
    amountSAR: 4,
    accountId: 'acc_1791355409897',
    category: 'Food',
    subCategory: 'Dining',
    date: '2026-10-08',
    note: 'Rice bhukhari',
    createdAt: '2026-10-08T22:29:51.041Z',
  },
  {
    id: 'tx_1791498530035_dohd',
    type: 'expense',
    amountSAR: 24.4,
    accountId: 'acc-1',
    category: 'Personal',
    subCategory: 'Health & Medicine',
    date: '2026-10-08',
    note: 'Medicine duphalac',
    createdAt: '2026-10-08T22:28:50.035Z',
  },
  {
    id: 'tx_1791498494025_gcvq',
    type: 'expense',
    amountSAR: 74.75,
    accountId: 'acc-1',
    category: 'Shopping',
    subCategory: 'Groceries',
    date: '2026-10-08',
    note: 'Khamza market',
    createdAt: '2026-10-08T22:28:14.025Z',
  },
  {
    id: 'tx_1791498453639_60fv',
    type: 'expense',
    amountSAR: 690,
    accountId: 'acc_1790855039108',
    category: 'Car',
    subCategory: 'Maintenance',
    date: '2026-10-08',
    note: 'Car Insurance',
    createdAt: '2026-10-08T22:27:33.639Z',
  },
  {
    id: 'tx_1791561201922_vmyl',
    type: 'expense',
    amountSAR: 16,
    accountId: 'acc-1',
    category: 'Food',
    subCategory: 'Coffee & Snacks',
    date: '2026-10-07',
    note: 'Barns coffee',
    createdAt: '2026-10-09T15:53:21.922Z',
  },
  {
    id: 'tx_1791561183197_xv1z',
    type: 'expense',
    amountSAR: 69,
    accountId: 'acc-1',
    category: 'Shopping',
    subCategory: 'Clothing',
    date: '2026-10-07',
    note: 'Abaya',
    createdAt: '2026-10-09T15:53:03.197Z',
  },
  {
    id: 'tx_1791355493264_h3w3',
    type: 'expense',
    amountSAR: 50,
    accountId: 'acc_1791497983529',
    category: 'Car',
    subCategory: 'Cleaning',
    date: '2026-10-07',
    note: 'Car cleaning monthly',
    createdAt: '2026-10-07T06:44:53.264Z',
  },
  {
    id: 'tx_1791355463885_xei6',
    type: 'expense',
    amountSAR: 1,
    accountId: 'acc_1791355409897',
    category: 'Food',
    subCategory: 'Groceries',
    date: '2026-10-06',
    note: 'Khubz',
    createdAt: '2026-10-07T06:44:23.885Z',
  },
  {
    id: 'tx_1791355432931_kjxv',
    type: 'expense',
    amountSAR: 15,
    accountId: 'acc_1791355409897',
    category: 'Food',
    subCategory: 'Coffee & Snacks',
    date: '2026-10-06',
    note: 'Juice',
    createdAt: '2026-10-07T06:43:52.931Z',
  },
  {
    id: 'tx_1791236242826_mf40',
    type: 'expense',
    amountSAR: 48,
    accountId: 'acc-1',
    category: 'Food',
    subCategory: 'Dining',
    date: '2026-10-05',
    note: 'Umar visit and food',
    createdAt: '2026-10-05T21:37:22.826Z',
  },
  {
    id: 'tx_1791204198676_0l04',
    type: 'expense',
    amountSAR: 58,
    accountId: 'acc-1',
    category: 'Food',
    subCategory: 'Dining',
    date: '2026-10-05',
    note: 'Umar Home',
    createdAt: '2026-10-05T12:43:18.676Z',
  },
  {
    id: 'tx_1791189561163_im4k',
    type: 'expense',
    amountSAR: 21.87,
    accountId: 'acc-1',
    category: 'Personal',
    subCategory: 'Accessories',
    date: '2026-10-04',
    note: 'Hand gloves',
    createdAt: '2026-10-05T08:39:21.163Z',
  },
  {
    id: 'tx_1791062097156_ej61',
    type: 'expense',
    amountSAR: 73,
    accountId: 'acc-1',
    category: 'Food',
    subCategory: 'Dining',
    date: '2026-10-04',
    note: '1947 indian kitchen',
    createdAt: '2026-10-03T21:14:57.156Z',
  },
  {
    id: 'tx_1791062064696_l5ir',
    type: 'expense',
    amountSAR: 216.88,
    accountId: 'acc-1',
    category: 'Shopping',
    subCategory: 'Accessories',
    date: '2026-10-04',
    note: 'Purse and Socks',
    createdAt: '2026-10-03T21:14:24.696Z',
  },
  {
    id: 'tx_1790957398394_83oo',
    type: 'expense',
    amountSAR: 2,
    accountId: 'acc-1',
    category: 'Food',
    subCategory: 'Coffee & Snacks',
    date: '2026-10-02',
    note: 'Tea',
    createdAt: '2026-10-02T16:09:58.394Z',
  },
  {
    id: 'tx_1790937271192_3u56',
    type: 'expense',
    amountSAR: 31,
    accountId: 'acc-1',
    category: 'Food',
    subCategory: 'Dining',
    date: '2026-10-02',
    note: 'Grove breakfast',
    createdAt: '2026-10-02T10:34:31.192Z',
  },
  {
    id: 'tx_1790896790098_jqtz',
    type: 'expense',
    amountSAR: 500,
    accountId: 'acc-1',
    category: 'Personal',
    subCategory: 'Investment',
    date: '2026-10-01',
    note: 'Investment',
    createdAt: '2026-10-01T23:19:50.098Z',
  },
  {
    id: 'tx_1790893691410_3sls',
    type: 'expense',
    amountSAR: 5405,
    accountId: 'acc-1',
    category: 'Personal',
    subCategory: 'Rent & Living',
    date: '2026-10-01',
    note: 'Rent, groceries, rozzy pocket money, saving',
    createdAt: '2026-10-01T22:28:11.410Z',
  },
  {
    id: 'tx_1790893437316_gitw',
    type: 'expense',
    amountSAR: 175,
    accountId: 'acc-1',
    category: 'Shopping',
    subCategory: 'Accessories',
    date: '2026-10-01',
    note: 'Silver Ring',
    createdAt: '2026-10-01T22:23:57.316Z',
  },
  {
    id: 'tx_1790893412710_u87k',
    type: 'expense',
    amountSAR: 13,
    accountId: 'acc-1',
    category: 'Food',
    subCategory: 'Dining',
    date: '2026-10-01',
    note: 'Mall of Arabia Food',
    createdAt: '2026-10-01T22:23:32.710Z',
  },
  {
    id: 'tx_1790893365953_jzam',
    type: 'expense',
    amountSAR: 17.5,
    accountId: 'acc-1',
    category: 'Bills',
    subCategory: 'Mobile Recharge',
    date: '2026-10-01',
    note: 'Mobily Recharge',
    createdAt: '2026-10-01T22:22:45.953Z',
  },
  {
    id: 'tx_1790855565538_a5q9',
    type: 'expense',
    amountSAR: 1057.5,
    accountId: 'acc-1',
    category: 'Family',
    subCategory: 'Home',
    date: '2026-09-30',
    note: 'Home 800, Mummy 120, Sadaqa 137.5',
    createdAt: '2026-10-01T11:52:45.538Z',
  },
  {
    id: 'tx_1790855511019_kxvt',
    type: 'expense',
    amountSAR: 109,
    accountId: 'acc-3',
    category: 'Car',
    subCategory: 'Fuel',
    date: '2026-09-30',
    note: 'Petrol',
    createdAt: '2026-10-01T11:51:51.019Z',
  },
  {
    id: 'tx_1791499573771_0k85',
    type: 'expense',
    amountSAR: 1500,
    accountId: 'acc_1791497983529',
    category: 'Car',
    subCategory: 'Maintenance',
    date: '2026-08-18',
    note: 'Gear box Maintenance, oil change, Fuel injector',
    createdAt: '2026-10-08T22:46:13.771Z',
  },
];

// All 10 Real Tasks from Attached Backup JSON
export const INITIAL_FOLLOWUPS: FollowUp[] = [
  {
    id: 'task-1791576743400-tjx5',
    title: 'Car ts10 glass cover',
    category: 'Car',
    dueDate: '2026-10-12',
    dueTime: '10:00',
    priority: 'medium',
    isCompleted: false,
    notes: 'Task created. (Progress: 85%)',
    createdAt: '2026-10-09T20:12:23.400Z',
  },
  {
    id: 'task-1791269374849-6j3x',
    title: 'Room change',
    category: 'Personal',
    dueDate: '2026-11-15',
    dueTime: '10:00',
    priority: 'medium',
    isCompleted: false,
    notes: 'Next follow-up changed to 15 Nov 2026. (Progress: 0%)',
    createdAt: '2026-10-06T06:49:34.849Z',
  },
  {
    id: 'task-1791269353564-ppjo',
    title: 'Washing machine repair',
    category: 'Personal',
    dueDate: '2026-10-06',
    dueTime: '10:00',
    priority: 'medium',
    isCompleted: false,
    notes: 'Task created. (Progress: 0%)',
    createdAt: '2026-10-06T06:49:13.563Z',
  },
  {
    id: 'task-1791117775412-6cqd',
    title: 'Car cleaning before installing seat cover',
    category: 'Car',
    dueDate: '2026-10-07',
    dueTime: '10:00',
    priority: 'medium',
    isCompleted: false,
    notes: 'Task created. (Progress: 0%)',
    createdAt: '2026-10-04T12:42:55.411Z',
  },
  {
    id: 'task-1791049116447-3drz',
    title: 'Mudassir studies or job',
    category: 'Personal',
    dueDate: '2026-10-06',
    dueTime: '10:00',
    priority: 'high',
    isCompleted: false,
    notes: 'Next follow-up rescheduled to 3 days (6 Oct 2026). (Progress: 0%)',
    createdAt: '2026-10-03T17:38:36.447Z',
  },
  {
    id: 'task-1791042236479-wv7u',
    title: 'Car accessories order Ali Express',
    category: 'Car',
    dueDate: '2026-10-06',
    dueTime: '10:00',
    priority: 'low',
    isCompleted: false,
    notes: 'Task created. (Progress: 0%)',
    createdAt: '2026-10-03T15:43:56.479Z',
  },
  {
    id: 'task-1790937103392-wt1f',
    title: 'Umrah rate',
    category: 'Personal',
    dueDate: '2026-10-07',
    dueTime: '10:00',
    priority: 'medium',
    isCompleted: true,
    completedAt: '2026-10-10T12:25:45.324Z',
    notes: 'Progress updated to 100%. Task completed.',
    createdAt: '2026-10-02T10:31:43.392Z',
  },
  {
    id: 'task-1790936951887-qhcx',
    title: 'Car seat cover Quotation',
    category: 'Car',
    dueDate: '2026-10-07',
    dueTime: '10:00',
    priority: 'medium',
    isCompleted: false,
    notes: 'Quotation for indian brand fabro and flooring 500\nSaudi made and flooring 550 with steering gear',
    createdAt: '2026-10-02T10:29:11.887Z',
  },
  {
    id: 'task-1790856374014-1hpo',
    title: 'Maharashtra bank FATCA',
    category: 'Finance',
    dueDate: '2026-10-01',
    dueTime: '10:00',
    priority: 'high',
    isCompleted: true,
    completedAt: '2026-10-04T08:09:44.573Z',
    notes: 'Send email. Marked task as Completed.',
    createdAt: '2026-10-01T12:06:14.014Z',
  },
  {
    id: 'task-2',
    title: 'Insurance Renew',
    category: 'Car',
    dueDate: '2026-10-08',
    dueTime: '10:00',
    priority: 'high',
    isCompleted: true,
    completedAt: '2026-10-10T12:25:18.854Z',
    notes: 'Car insurance renewed. Marked task as Completed.',
    createdAt: '2026-09-28T11:41:56.413Z',
  },
];

// All 2 Real Notes from Backup JSON
export const INITIAL_NOTES: Note[] = [
  {
    id: 'note_1791390008008',
    title: 'Bugs tweaks',
    content: 'Log entry not able to adit\nAi integration',
    category: 'Personal',
    color: 'peach',
    isPinned: true,
    createdAt: '2026-10-07T16:20:08.008Z',
    updatedAt: '2026-10-09T21:19:45.845Z',
  },
  {
    id: 'note_1791114700376',
    title: 'Items to buy',
    content: '1. Booster cable \n2. Torque wrench\n3. Electric car jack\n4. Water cooler\n5. Ugreen K331 MK006 LP669 4000 DPI mouse',
    category: 'Car',
    color: 'lavender',
    isPinned: true,
    createdAt: '2026-10-04T11:51:40.376Z',
    updatedAt: '2026-10-05T09:21:22.813Z',
  },
];

// All 2 Real Loans from Backup JSON
export const INITIAL_LOANS: Loan[] = [
  {
    id: 'loan_1790855268078_t4p',
    type: 'borrowed',
    counterpartyName: 'Haris',
    counterpartyPhone: '',
    amountSAR: 3891.05, // 100,000 INR @ 25.7
    repaidAmountSAR: 0,
    dueDate: '2026-10-01',
    status: 'active',
    notes: 'For increase investment (Original: 100000 INR)',
    repayments: [],
    createdAt: '2026-10-01T11:47:48.078Z',
  },
  {
    id: 'loan-1',
    type: 'borrowed',
    counterpartyName: 'Shahid Mamu',
    counterpartyPhone: '',
    amountSAR: 3891.05, // 100,000 INR @ 25.7
    repaidAmountSAR: 0,
    dueDate: '2026-01-10',
    status: 'active',
    notes: 'Opening for Shop (Original: 100000 INR)',
    repayments: [],
    createdAt: '2026-08-02T11:41:56.413Z',
  },
];

export const INITIAL_WISHLISTS: WishlistItem[] = [
  {
    id: 'wl-1',
    title: 'Booster Cable & Electric Car Jack',
    estimatedPriceSAR: 280,
    savedAmountSAR: 120,
    priority: 'high',
    category: 'Car',
    targetDate: '2026-10-15',
    notes: 'Essential roadside gear for emergency safety',
    isPurchased: false,
    createdAt: '2026-10-04T12:00:00.000Z',
  },
  {
    id: 'wl-2',
    title: 'Car Seat Cover & Flooring (Saudi Made)',
    estimatedPriceSAR: 550,
    savedAmountSAR: 200,
    priority: 'medium',
    category: 'Car',
    targetDate: '2026-10-25',
    notes: 'With steering gear cover as per workshop quotation',
    isPurchased: false,
    createdAt: '2026-10-04T12:30:00.000Z',
  },
  {
    id: 'wl-3',
    title: 'Ugreen K331 4000 DPI Mouse & Tech Pack',
    estimatedPriceSAR: 85,
    savedAmountSAR: 85,
    priority: 'low',
    category: 'Personal',
    targetDate: '2026-10-10',
    notes: 'Ready to order on Ali Express / Amazon',
    isPurchased: false,
    createdAt: '2026-10-04T13:00:00.000Z',
  },
];

// Helper Storage functions
export function loadFromStorage<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback;
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch (e) {
    console.warn(`Failed to read from localStorage [${key}]`, e);
    return fallback;
  }
}

export function saveToStorage<T>(key: string, data: T): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (e) {
    console.warn(`Failed to write to localStorage [${key}]`, e);
  }
}

export function clearAllStorage(): void {
  if (typeof window === 'undefined') return;
  Object.values(STORAGE_KEYS).forEach((k) => localStorage.removeItem(k));
}

/**
 * Universal JSON Backup Parser supporting Personal Hub JSON structure
 */
export function parsePersonalHubJson(jsonObj: any, currentExchangeRate = 25.7) {
  const result = {
    accounts: [] as Account[],
    transactions: [] as Transaction[],
    categories: [] as CategoryItem[],
    followups: [] as FollowUp[],
    notes: [] as Note[],
    loans: [] as Loan[],
    wishlists: [] as WishlistItem[],
    exchangeRate: currentExchangeRate,
  };

  const collections = jsonObj.dataCollections || jsonObj;

  if (collections.exchangeRate?.rateSarToInr) {
    result.exchangeRate = collections.exchangeRate.rateSarToInr;
  }

  // Categories map for mapping categoryId to { category, subCategory }
  const catMap = new Map<string, { category: string; subCategory?: string }>();

  // Map known IDs and names directly
  catMap.set('cat-food', { category: 'Food' });
  catMap.set('cat-fuel', { category: 'Car', subCategory: 'Fuel' });
  catMap.set('cat-shopping', { category: 'Shopping' });
  catMap.set('cat-bills', { category: 'Bills' });
  catMap.set('cat-car', { category: 'Car' });
  catMap.set('cat-family', { category: 'Family' });
  catMap.set('cat-personal', { category: 'Personal' });
  catMap.set('cat-other', { category: 'Other' });
  catMap.set('cat_1791355599659', { category: 'Car', subCategory: 'Maintenance' });
  catMap.set('cat_1791355642311', { category: 'Car', subCategory: 'Cleaning' });
  catMap.set('cat_1791355658579', { category: 'Car', subCategory: 'Fuel' });

  // Build clean Categories tree
  const grouped = new Map<string, CategoryItem>();

  // Seed with standard INITIAL_CATEGORIES
  INITIAL_CATEGORIES.forEach((c) => {
    grouped.set(c.name, {
      ...c,
      subCategories: [...c.subCategories],
    });
  });

  if (Array.isArray(collections.categories)) {
    collections.categories.forEach((c: any) => {
      const rawName = c.name || '';
      let mainName = rawName;
      let subName: string | undefined = undefined;

      if (rawName.includes('Car Sub category - Maintenance') || c.id === 'cat_1791355599659') {
        mainName = 'Car';
        subName = 'Maintenance';
      } else if (rawName.includes('Car Sub category - Cleaning') || c.id === 'cat_1791355642311') {
        mainName = 'Car';
        subName = 'Cleaning';
      } else if (rawName.includes('Car Sub category - Fuel') || c.id === 'cat_1791355658579' || c.id === 'cat-fuel' || rawName.toLowerCase() === 'fuel') {
        mainName = 'Car';
        subName = 'Fuel';
      }

      if (subName) {
        catMap.set(c.id, { category: mainName, subCategory: subName });
        const parentCat = grouped.get(mainName);
        if (parentCat && !parentCat.subCategories.some((s) => s.name.toLowerCase() === subName!.toLowerCase())) {
          parentCat.subCategories.push({
            id: `sub_${c.id}`,
            categoryId: parentCat.id,
            name: subName,
            color: c.color,
          });
        }
      } else {
        if (!grouped.has(mainName)) {
          grouped.set(mainName, {
            id: c.id || `cat_${mainName.toLowerCase()}`,
            name: mainName,
            color: c.color || '#8b5cf6',
            icon: c.icon || 'Tag',
            subCategories: [],
          });
        }
        catMap.set(c.id, { category: mainName });
      }
    });
  }

  result.categories = Array.from(grouped.values());

  // Accounts
  if (Array.isArray(collections.accounts)) {
    result.accounts = collections.accounts.map((a: any) => {
      let type: Account['type'] = 'bank';
      const lower = (a.name || '').toLowerCase();
      if (lower.includes('cash')) type = 'cash';
      else if (lower.includes('stc') || lower.includes('d360') || lower.includes('tiqmo') || lower.includes('rozzy')) type = 'wallet';
      else if (lower.includes('isalesawab')) type = 'savings';

      const opening = a.openingBalance !== undefined ? a.openingBalance : 0;
      const current = a.currentBalance !== undefined ? Math.round(a.currentBalance * 100) / 100 : opening;

      return {
        id: a.id,
        name: a.name,
        type,
        openingBalanceSAR: opening,
        currentBalanceSAR: current,
        color: a.color || '#8b5cf6',
        accountNumberMask: a.name,
        updatedAt: a.createdAt || new Date().toISOString(),
      };
    });
  }

  // Transactions
  if (Array.isArray(collections.transactions)) {
    result.transactions = collections.transactions.map((t: any) => {
      const rawType = (t.type || 'expense').toLowerCase();
      let txType: Transaction['type'] = 'expense';
      if (rawType.includes('income') || rawType.includes('money added')) {
        txType = 'income';
      } else if (rawType.includes('transfer')) {
        txType = 'transfer';
      }

      let catName = txType === 'income' ? 'Income' : txType === 'transfer' ? 'Transfer' : 'General';
      let subCategory: string | undefined = undefined;

      if (t.categoryId && catMap.has(t.categoryId)) {
        const mapped = catMap.get(t.categoryId)!;
        catName = mapped.category;
        subCategory = mapped.subCategory;
      } else if (t.category) {
        catName = t.category;
        subCategory = t.subCategory;
      }

      const noteLower = (t.remark || t.note || '').toLowerCase();

      // Smart classification overrides for entries with missing or generic category
      if (catName === 'General' || catName === 'Other') {
        if (noteLower.includes('juice') || noteLower.includes('tea') || noteLower.includes('coffee') || noteLower.includes('water refill') || noteLower.includes('food') || noteLower.includes('mutton') || noteLower.includes('khubz') || noteLower.includes('breakfast') || noteLower.includes('al baik') || noteLower.includes('rice')) {
          catName = 'Food';
          if (noteLower.includes('juice') || noteLower.includes('tea') || noteLower.includes('coffee')) {
            subCategory = 'Coffee & Snacks';
          } else if (noteLower.includes('water') || noteLower.includes('mutton') || noteLower.includes('khubz')) {
            subCategory = 'Groceries';
          } else {
            subCategory = 'Dining';
          }
        } else if (noteLower.includes('medicine') || noteLower.includes('duphalac')) {
          catName = 'Personal';
          subCategory = 'Health & Medicine';
        } else if (noteLower.includes('rent') || noteLower.includes('pocket money') || noteLower.includes('saving')) {
          catName = 'Personal';
          subCategory = 'Rent & Living';
        } else if (noteLower.includes('investment')) {
          catName = 'Personal';
          subCategory = 'Investment';
        } else if (noteLower.includes('petrol') || noteLower.includes('fuel')) {
          catName = 'Car';
          subCategory = 'Fuel';
        } else if (noteLower.includes('recharge') || noteLower.includes('bill')) {
          catName = 'Bills';
          subCategory = 'Mobile Recharge';
        } else if (noteLower.includes('purse') || noteLower.includes('socks') || noteLower.includes('ring') || noteLower.includes('abaya') || noteLower.includes('keyboard')) {
          catName = 'Shopping';
          subCategory = noteLower.includes('abaya') ? 'Clothing' : noteLower.includes('keyboard') ? 'Electronics' : 'Accessories';
        }
      }

      // Explicit check for Gear Box / Maintenance vs Fuel:
      if (noteLower.includes('gear box') || noteLower.includes('battery installation')) {
        catName = 'Car';
        subCategory = 'Maintenance';
      } else if (noteLower.includes('car cleaning')) {
        catName = 'Car';
        subCategory = 'Cleaning';
      }

      return {
        id: t.id,
        accountId: t.accountId,
        toAccountId: t.toAccountId,
        type: txType,
        amountSAR: t.amount || 0,
        category: catName,
        subCategory,
        note: t.remark || t.note || '',
        date: t.date || new Date().toISOString().split('T')[0],
        createdAt: t.createdAt || new Date().toISOString(),
      };
    });

    // Chronological order: strictly descending by date, secondary by createdAt
    result.transactions.sort((a, b) => {
      const diff = b.date.localeCompare(a.date);
      if (diff !== 0) return diff;
      return b.createdAt.localeCompare(a.createdAt);
    });
  }

  // Tasks -> Follow-ups
  if (Array.isArray(collections.tasks)) {
    result.followups = collections.tasks.map((task: any) => {
      let cat = task.category || 'General';
      const titleLower = (task.title || '').toLowerCase();
      if (titleLower.includes('car') || titleLower.includes('seat cover') || titleLower.includes('insurance')) {
        cat = 'Car';
      } else if (titleLower.includes('bank') || titleLower.includes('fatca')) {
        cat = 'Finance';
      }

      const isDone = task.status === 'Completed' || task.completionPercentage === 100;
      return {
        id: task.id,
        title: task.title,
        category: cat,
        dueDate: task.followUpDate || task.dueDate || new Date().toISOString().split('T')[0],
        dueTime: '10:00',
        priority: (task.priority || 'medium').toLowerCase() as any,
        isCompleted: isDone,
        completedAt: isDone ? (task.lastFollowedUpAt || task.createdDate) : undefined,
        notes: task.remarks || task.notes || '',
        createdAt: task.createdDate || task.lastFollowedUpAt || new Date().toISOString(),
      };
    });
  }

  // Notes
  if (Array.isArray(collections.notes)) {
    result.notes = collections.notes.map((n: any, idx: number) => ({
      id: n.id || `note_${idx}`,
      title: n.title,
      content: n.content || '',
      category: n.tags?.[0] || 'Personal',
      color: idx === 0 ? 'peach' : 'lavender',
      isPinned: true,
      createdAt: n.createdAt || n.createdDate || new Date().toISOString(),
      updatedAt: n.updatedAt || n.modifiedDate || new Date().toISOString(),
    }));
  }

  // Loans
  if (Array.isArray(collections.loans)) {
    const payments = Array.isArray(collections.loanPayments) ? collections.loanPayments : [];
    result.loans = collections.loans.map((l: any) => {
      const origAmt = l.originalAmount || l.amount || 0;
      const isINR = l.originalCurrency === 'INR';
      const rate = result.exchangeRate || 25.7;
      const amountSAR = isINR ? Math.round((origAmt / rate) * 100) / 100 : origAmt;

      const matchedPayments = payments.filter((p: any) => p.loanId === l.id);
      const repaidSAR = matchedPayments.reduce((acc: number, p: any) => {
        const pAmt = p.amount || 0;
        return acc + (isINR ? pAmt / rate : pAmt);
      }, 0);

      return {
        id: l.id,
        type: 'borrowed',
        counterpartyName: l.lenderName || l.name,
        counterpartyPhone: '',
        amountSAR,
        repaidAmountSAR: Math.round(repaidSAR * 100) / 100,
        dueDate: l.startDate || '2026-12-31',
        status: repaidSAR >= amountSAR ? 'repaid' : 'active',
        notes: `${l.remark || ''} (Original: ${origAmt} ${l.originalCurrency || 'SAR'})`,
        repayments: matchedPayments.map((p: any) => ({
          id: p.id,
          amountSAR: Math.round((isINR ? p.amount / rate : p.amount) * 100) / 100,
          date: p.date,
          note: p.remark,
        })),
        createdAt: l.createdAt || new Date().toISOString(),
      };
    });
  }

  return result;
}

export { STORAGE_KEYS };

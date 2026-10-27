const fs = require('fs');

// 1. Update src/types/index.ts: add optional originalCurrency, originalAmount to Loan
let types = fs.readFileSync('src/types/index.ts', 'utf8');
if (!types.includes('originalCurrency?: string;')) {
  types = types.replace(
    'repaidAmountSAR: number;',
    'repaidAmountSAR: number;\n  originalCurrency?: string;\n  originalAmount?: number;'
  );
  fs.writeFileSync('src/types/index.ts', types);
  console.log('Updated types/index.ts Loan interface');
}

// 2. Update src/utils/storage.ts
let storage = fs.readFileSync('src/utils/storage.ts', 'utf8');

// Fix DEFAULT_SETTINGS enableCloudSync
storage = storage.replace(/enableCloudSync:\s*false,?\s*\n/, '');

// Fix STORAGE_KEYS: add GATE_STATE
if (!storage.includes('GATE_STATE:')) {
  storage = storage.replace(
    "SETTINGS: 'phub_settings_v2',",
    "SETTINGS: 'phub_settings_v2',\n  GATE_STATE: 'phub_gate_state_v2',"
  );
}

// Remove old parsePersonalHubJson
storage = storage.replace(/export function parsePersonalHubJson[\s\S]*$/, '');

const extraParser = `
export function parsePersonalHubJson(jsonObj: any, exchangeRate: number = 25.7) {
  if (!jsonObj) {
    return {
      accounts: [],
      transactions: [],
      categories: [],
      followups: [],
      notes: [],
      loans: [],
      wishlists: [],
      exchangeRate: 25.7,
    };
  }
  const cols = jsonObj.dataCollections || jsonObj;
  const rawAccounts = cols.accounts || [];
  const rawTxs = cols.transactions || [];
  const rawTasks = cols.tasks || cols.followups || [];
  const rawNotes = cols.notes || [];
  const rawLoans = cols.loans || [];
  const rawWishlists = cols.wishlists || [];
  const exRate = cols.exchangeRate?.rateSarToInr || exchangeRate;

  const accounts: Account[] = rawAccounts.map((a: any) => ({
    id: a.id || 'acc_' + Date.now(),
    name: a.name || 'Account',
    type: a.type || 'bank',
    openingBalanceSAR: Number(a.openingBalance || a.openingBalanceSAR || 0),
    currentBalanceSAR: Number(a.currentBalance || a.currentBalanceSAR || 0),
    color: a.color || '#8b5cf6',
    accountNumberMask: a.accountNumberMask || (a.name === 'SNB' ? '•••• SNB' : a.name),
    updatedAt: a.createdAt || new Date().toISOString(),
  }));

  const transactions: Transaction[] = rawTxs.map((t: any) => {
    let normalizedType: 'income' | 'expense' | 'transfer' = 'expense';
    const rawType = String(t.type || '').toLowerCase();
    if (rawType.includes('income') || rawType.includes('money added')) normalizedType = 'income';
    else if (rawType.includes('transfer')) normalizedType = 'transfer';
    return {
      id: t.id || 'tx_' + Date.now(),
      type: normalizedType,
      amountSAR: Number(t.amount || t.amountSAR || 0),
      accountId: t.accountId || 'acc-1',
      toAccountId: t.toAccountId || undefined,
      category: t.category || 'Other',
      subCategory: t.subCategory || undefined,
      date: t.date || new Date().toISOString().split('T')[0],
      note: t.remark || t.note || '',
      createdAt: t.createdAt || new Date().toISOString(),
    };
  });

  const followups: FollowUp[] = rawTasks.map((t: any) => ({
    id: t.id || 'task_' + Date.now(),
    title: t.title || 'Task',
    category: t.category || 'Personal',
    priority: ((t.priority || 'medium').toLowerCase() as any),
    dueDate: t.followUpDate || t.dueDate || '2026-10-15',
    notes: t.remarks || t.notes || '',
    isCompleted: t.status === 'Completed' || t.isCompleted || t.completionPercentage === 100,
    completedAt: t.completedAt || undefined,
    createdAt: t.createdDate ? (t.createdDate + 'T00:00:00.000Z') : new Date().toISOString(),
    checklist: t.checklist || [],
  }));

  const notes: Note[] = rawNotes.map((n: any) => ({
    id: n.id || 'note_' + Date.now(),
    title: n.title || 'Note',
    content: n.content || '',
    category: (n.tags && n.tags[0]) || n.category || 'Personal',
    color: n.color || 'lavender',
    isPinned: !!n.isPinned,
    createdAt: n.createdAt || new Date().toISOString(),
    updatedAt: n.updatedAt || new Date().toISOString(),
    checklist: n.checklist || [],
  }));

  const loans: Loan[] = rawLoans.map((l: any) => ({
    id: l.id || 'loan_' + Date.now(),
    counterpartyName: l.lenderName || l.counterpartyName || l.name || 'Friend',
    type: l.type || 'borrowed',
    amountSAR: Number(l.amountSAR || (l.originalAmount ? l.originalAmount / exRate : 1000)),
    repaidAmountSAR: Number(l.repaidAmountSAR || 0),
    originalCurrency: l.originalCurrency,
    originalAmount: l.originalAmount,
    dueDate: l.dueDate || '2027-01-01',
    notes: l.remark || l.notes || '',
    status: l.status || 'active',
    repayments: l.repayments || [],
    createdAt: l.createdAt || new Date().toISOString(),
  }));

  const wishlists: WishlistItem[] = rawWishlists.map((w: any) => ({
    id: w.id || 'wl_' + Date.now(),
    title: w.title || 'Wishlist Goal',
    estimatedPriceSAR: Number(w.estimatedPriceSAR || 500),
    savedAmountSAR: Number(w.savedAmountSAR || 0),
    priority: w.priority || 'medium',
    category: w.category || 'Car',
    targetDate: w.targetDate || '2026-11-01',
    notes: w.notes || '',
    isPurchased: !!w.isPurchased,
    createdAt: w.createdAt || new Date().toISOString(),
    productUrl: w.productUrl || '',
    checklist: w.checklist || [],
  }));

  return {
    accounts,
    transactions,
    categories: cols.categories || [],
    followups,
    notes,
    loans,
    wishlists,
    exchangeRate: exRate,
  };
}
`;

storage += extraParser;
fs.writeFileSync('src/utils/storage.ts', storage);
console.log('Updated storage.ts with clean parser');

// 3. Update SettingsModal.tsx
let sm = fs.readFileSync('src/components/settings/SettingsModal.tsx', 'utf8');
sm = sm.replace('exportJsonBackup,', 'getFullSyncPayload,');

sm = sm.replace(
  "const [activeSection, setActiveSection] = useState<string>('sync');",
  `const [activeSection, setActiveSection] = useState<string>('sync');

  const handleExportJson = () => {
    try {
      const payload = getFullSyncPayload();
      const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'Personal_Hub_Backup_' + new Date().toISOString().split('T')[0] + '.json';
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Export failed:', err);
    }
  };`
);

sm = sm.replace(/exportJsonBackup/g, 'handleExportJson');
sm = sm.replace(/importJsonBackup\(json\);/g, "importJsonBackup(json, 'replace');");

fs.writeFileSync('src/components/settings/SettingsModal.tsx', sm);
console.log('Updated SettingsModal.tsx successfully');

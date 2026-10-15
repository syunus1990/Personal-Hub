import * as XLSX from 'xlsx';
import {
  Account,
  Transaction,
  FollowUp,
  Note,
  Loan,
  WishlistItem,
} from '../types';
import { convertSARtoINR } from './currency';

export function exportAllToExcel(
  accounts: Account[],
  transactions: Transaction[],
  followups: FollowUp[],
  notes: Note[],
  loans: Loan[],
  wishlists: WishlistItem[],
  rate: number
) {
  const wb = XLSX.utils.book_new();

  // 1. Money Accounts Sheet
  const accountsData = accounts.map((acc) => ({
    'Account ID': acc.id,
    'Account Name': acc.name,
    'Type': acc.type,
    'Opening Balance (SAR)': acc.openingBalanceSAR,
    'Current Balance (SAR)': acc.currentBalanceSAR,
    'Equivalent Balance (INR)': Math.round(convertSARtoINR(acc.currentBalanceSAR, rate)),
    'Account Mask': acc.accountNumberMask || '',
    'Last Updated': acc.updatedAt,
  }));
  const wsAccounts = XLSX.utils.json_to_sheet(accountsData);
  XLSX.utils.book_append_sheet(wb, wsAccounts, 'Money_Accounts');

  // 2. Money Transactions Sheet
  const transactionsData = transactions.map((tx) => {
    const fromAcc = accounts.find((a) => a.id === tx.accountId)?.name || tx.accountId;
    const toAcc = tx.toAccountId
      ? accounts.find((a) => a.id === tx.toAccountId)?.name || tx.toAccountId
      : '';
    return {
      'Date': tx.date,
      'Type': tx.type.toUpperCase(),
      'Source Account': fromAcc,
      'Destination Account (Transfer)': toAcc,
      'Category': tx.category,
      'Amount (SAR)': tx.amountSAR,
      'Equivalent (INR)': Math.round(convertSARtoINR(tx.amountSAR, rate)),
      'Note / Description': tx.note,
      'ID': tx.id,
    };
  });
  const wsTransactions = XLSX.utils.json_to_sheet(transactionsData);
  XLSX.utils.book_append_sheet(wb, wsTransactions, 'Money_Transactions');

  // 3. Follow-Ups Sheet
  const followupsData = followups.map((fu) => ({
    'Title': fu.title,
    'Category': fu.category,
    'Due Date (YYYY-MM-DD)': fu.dueDate,
    'Due Time': fu.dueTime || '',
    'Priority (high/medium/low)': fu.priority,
    'Status': fu.isCompleted ? 'Completed' : 'Pending',
    'Notes': fu.notes || '',
    'ID': fu.id,
  }));
  const wsFollowups = XLSX.utils.json_to_sheet(followupsData);
  XLSX.utils.book_append_sheet(wb, wsFollowups, 'Follow_Ups');

  // 4. Notes Sheet
  const notesData = notes.map((n) => ({
    'Title': n.title,
    'Category': n.category,
    'Color (lavender/mint/peach/sky/butter)': n.color,
    'Pinned (yes/no)': n.isPinned ? 'yes' : 'no',
    'Content': n.content,
    'Last Updated': n.updatedAt,
    'ID': n.id,
  }));
  const wsNotes = XLSX.utils.json_to_sheet(notesData);
  XLSX.utils.book_append_sheet(wb, wsNotes, 'Notes');

  // 5. Loans Sheet
  const loansData = loans.map((l) => ({
    'Counterparty Name': l.counterpartyName,
    'Type': l.type === 'lent' ? 'I Lent (Receivable)' : 'I Borrowed (Payable)',
    'Amount (SAR)': l.amountSAR,
    'Repaid (SAR)': l.repaidAmountSAR,
    'Remaining Balance (SAR)': l.amountSAR - l.repaidAmountSAR,
    'Due Date': l.dueDate,
    'Status': l.status,
    'Phone': l.counterpartyPhone || '',
    'Notes': l.notes || '',
    'ID': l.id,
  }));
  const wsLoans = XLSX.utils.json_to_sheet(loansData);
  XLSX.utils.book_append_sheet(wb, wsLoans, 'Loans');

  // 6. Wishlists Sheet
  const wishlistsData = wishlists.map((w) => ({
    'Item Title': w.title,
    'Category': w.category,
    'Estimated Price (SAR)': w.estimatedPriceSAR,
    'Saved Amount (SAR)': w.savedAmountSAR,
    'Funding Progress (%)': Math.min(100, Math.round((w.savedAmountSAR / (w.estimatedPriceSAR || 1)) * 100)),
    'Priority': w.priority,
    'Target Date': w.targetDate || '',
    'Status': w.isPurchased ? 'Purchased' : 'Active',
    'Link': w.productUrl || '',
    'Notes': w.notes || '',
    'ID': w.id,
  }));
  const wsWishlists = XLSX.utils.json_to_sheet(wishlistsData);
  XLSX.utils.book_append_sheet(wb, wsWishlists, 'Wishlists');

  // Save workbook
  const filename = `Personal_Hub_Export_${new Date().toISOString().split('T')[0]}.xlsx`;
  XLSX.writeFile(wb, filename);
}

/**
 * Generates and triggers download of clean template with instructions and sample rows
 */
export function downloadExcelTemplate() {
  const wb = XLSX.utils.book_new();

  // Template Money Accounts
  const tmplAccounts = [
    {
      'Account Name': 'Main Bank Account',
      'Type': 'bank', // bank, cash, wallet, savings, credit_card
      'Opening Balance (SAR)': 5000,
      'Account Mask': '•••• 1234',
    },
    {
      'Account Name': 'Cash in Wallet',
      'Type': 'cash',
      'Opening Balance (SAR)': 500,
      'Account Mask': 'Cash',
    },
  ];
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(tmplAccounts), 'Money_Accounts');

  // Template Transactions
  const tmplTransactions = [
    {
      'Date': new Date().toISOString().split('T')[0],
      'Type': 'expense', // income, expense, transfer
      'Source Account': 'Main Bank Account',
      'Destination Account (Transfer)': '',
      'Category': 'Groceries',
      'Amount (SAR)': 250,
      'Note / Description': 'Weekly supermarket groceries',
    },
    {
      'Date': new Date().toISOString().split('T')[0],
      'Type': 'income',
      'Source Account': 'Main Bank Account',
      'Destination Account (Transfer)': '',
      'Category': 'Salary',
      'Amount (SAR)': 12000,
      'Note / Description': 'Monthly company payout',
    },
  ];
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(tmplTransactions), 'Money_Transactions');

  // Template Follow-ups
  const tmplFollowups = [
    {
      'Title': 'Schedule doctor health checkup',
      'Category': 'Health',
      'Due Date (YYYY-MM-DD)': new Date(Date.now() + 86400000).toISOString().split('T')[0],
      'Due Time': '10:00',
      'Priority (high/medium/low)': 'medium',
      'Notes': 'Bring prescription records',
    },
  ];
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(tmplFollowups), 'Follow_Ups');

  // Template Notes
  const tmplNotes = [
    {
      'Title': 'Project Launch Checklist',
      'Category': 'Work',
      'Color (lavender/mint/peach/sky/butter)': 'lavender',
      'Pinned (yes/no)': 'yes',
      'Content': '1. Deploy PWA build\n2. Verify backup exports\n3. Configure currency rate',
    },
  ];
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(tmplNotes), 'Notes');

  // Template Loans
  const tmplLoans = [
    {
      'Counterparty Name': 'Ahmed Al-Subaie',
      'Type': 'lent', // lent or borrowed
      'Amount (SAR)': 2000,
      'Repaid (SAR)': 500,
      'Due Date': new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
      'Phone': '+966 50 000 0000',
      'Notes': 'Short-term loan',
    },
  ];
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(tmplLoans), 'Loans');

  // Template Wishlists
  const tmplWishlists = [
    {
      'Item Title': 'Noise Cancelling Headphones',
      'Category': 'Tech',
      'Estimated Price (SAR)': 900,
      'Saved Amount (SAR)': 300,
      'Priority': 'medium', // high, medium, low
      'Target Date': new Date(Date.now() + 60 * 86400000).toISOString().split('T')[0],
      'Link': '',
      'Notes': 'Comfortable over-ear design',
    },
  ];
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(tmplWishlists), 'Wishlists');

  XLSX.writeFile(wb, 'Personal_Hub_Template.xlsx');
}

export interface ImportResult {
  accounts: Account[];
  transactions: Transaction[];
  followups: FollowUp[];
  notes: Note[];
  loans: Loan[];
  wishlists: WishlistItem[];
  counts: {
    accounts: number;
    transactions: number;
    followups: number;
    notes: number;
    loans: number;
    wishlists: number;
  };
}

export async function parseExcelImport(file: File): Promise<ImportResult> {
  const data = await file.arrayBuffer();
  const wb = XLSX.read(data, { type: 'array' });

  const result: ImportResult = {
    accounts: [],
    transactions: [],
    followups: [],
    notes: [],
    loans: [],
    wishlists: [],
    counts: {
      accounts: 0,
      transactions: 0,
      followups: 0,
      notes: 0,
      loans: 0,
      wishlists: 0,
    },
  };

  // Helper to find sheet matching case-insensitively
  const findSheet = (name: string) => {
    return wb.SheetNames.find(
      (n) => n.toLowerCase().replace(/[\s_-]/g, '') === name.toLowerCase().replace(/[\s_-]/g, '')
    );
  };

  // 1. Accounts
  const accSheetName = findSheet('Money_Accounts') || findSheet('Accounts');
  if (accSheetName && wb.Sheets[accSheetName]) {
    const raw: any[] = XLSX.utils.sheet_to_json(wb.Sheets[accSheetName]);
    raw.forEach((r, idx) => {
      const name = r['Account Name'] || r['Name'] || `Account ${idx + 1}`;
      const type = (r['Type'] || 'bank').toLowerCase();
      const opening = parseFloat(r['Opening Balance (SAR)'] || r['Opening Balance'] || '0') || 0;
      const current = parseFloat(r['Current Balance (SAR)'] || r['Current Balance'] || opening) || opening;
      const id = r['Account ID'] || `acc_imp_${Date.now()}_${idx}`;
      result.accounts.push({
        id,
        name,
        type: ['bank', 'cash', 'wallet', 'savings', 'credit_card'].includes(type) ? type : 'bank',
        openingBalanceSAR: opening,
        currentBalanceSAR: current,
        color: ['#818CF8', '#34D399', '#38BDF8', '#FBBF24', '#F472B6'][idx % 5],
        accountNumberMask: r['Account Mask'] || '',
        updatedAt: new Date().toISOString(),
      });
    });
    result.counts.accounts = result.accounts.length;
  }

  // 2. Transactions
  const txSheetName = findSheet('Money_Transactions') || findSheet('Transactions');
  if (txSheetName && wb.Sheets[txSheetName]) {
    const raw: any[] = XLSX.utils.sheet_to_json(wb.Sheets[txSheetName]);
    raw.forEach((r, idx) => {
      const typeStr = (r['Type'] || 'expense').toLowerCase();
      const type = ['income', 'expense', 'transfer'].includes(typeStr) ? typeStr : 'expense';
      const amount = parseFloat(r['Amount (SAR)'] || r['Amount'] || '0') || 0;
      const date = r['Date'] ? String(r['Date']).trim() : new Date().toISOString().split('T')[0];

      // Map account name to id if available
      const sourceAccName = r['Source Account'] || r['Account'];
      const matchedSource = result.accounts.find((a) => a.name === sourceAccName)?.id || result.accounts[0]?.id || 'acc_1';

      result.transactions.push({
        id: r['ID'] || `tx_imp_${Date.now()}_${idx}`,
        accountId: matchedSource,
        type: type as any,
        amountSAR: amount,
        category: r['Category'] || 'General',
        note: r['Note / Description'] || r['Note'] || '',
        date,
        createdAt: new Date().toISOString(),
      });
    });
    result.counts.transactions = result.transactions.length;
  }

  // 3. Follow-ups
  const fuSheetName = findSheet('Follow_Ups') || findSheet('Followups') || findSheet('Tasks');
  if (fuSheetName && wb.Sheets[fuSheetName]) {
    const raw: any[] = XLSX.utils.sheet_to_json(wb.Sheets[fuSheetName]);
    raw.forEach((r, idx) => {
      const title = r['Title'] || `Task ${idx + 1}`;
      const prio = (r['Priority (high/medium/low)'] || r['Priority'] || 'medium').toLowerCase();
      const status = (r['Status'] || '').toLowerCase();
      result.followups.push({
        id: r['ID'] || `fu_imp_${Date.now()}_${idx}`,
        title,
        category: r['Category'] || 'General',
        dueDate: r['Due Date (YYYY-MM-DD)'] || r['Due Date'] || new Date().toISOString().split('T')[0],
        dueTime: r['Due Time'] || '',
        priority: ['high', 'medium', 'low'].includes(prio) ? prio : 'medium',
        isCompleted: status.includes('complete') || status === 'yes' || status === 'done',
        notes: r['Notes'] || '',
        createdAt: new Date().toISOString(),
      });
    });
    result.counts.followups = result.followups.length;
  }

  // 4. Notes
  const notesSheetName = findSheet('Notes');
  if (notesSheetName && wb.Sheets[notesSheetName]) {
    const raw: any[] = XLSX.utils.sheet_to_json(wb.Sheets[notesSheetName]);
    raw.forEach((r, idx) => {
      const title = r['Title'] || `Note ${idx + 1}`;
      const color = (r['Color (lavender/mint/peach/sky/butter)'] || r['Color'] || 'lavender').toLowerCase();
      const pinned = (r['Pinned (yes/no)'] || '').toLowerCase();
      result.notes.push({
        id: r['ID'] || `note_imp_${Date.now()}_${idx}`,
        title,
        content: r['Content'] || '',
        category: r['Category'] || 'General',
        color: ['lavender', 'mint', 'peach', 'sky', 'butter', 'slate'].includes(color) ? color : 'lavender',
        isPinned: pinned === 'yes' || pinned === 'true',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    });
    result.counts.notes = result.notes.length;
  }

  // 5. Loans
  const loansSheetName = findSheet('Loans');
  if (loansSheetName && wb.Sheets[loansSheetName]) {
    const raw: any[] = XLSX.utils.sheet_to_json(wb.Sheets[loansSheetName]);
    raw.forEach((r, idx) => {
      const counterparty = r['Counterparty Name'] || r['Name'] || `Contact ${idx + 1}`;
      const typeStr = (r['Type'] || '').toLowerCase();
      const type = typeStr.includes('lent') ? 'lent' : 'borrowed';
      const amount = parseFloat(r['Amount (SAR)'] || r['Amount'] || '0') || 0;
      const repaid = parseFloat(r['Repaid (SAR)'] || r['Repaid'] || '0') || 0;
      result.loans.push({
        id: r['ID'] || `loan_imp_${Date.now()}_${idx}`,
        counterpartyName: counterparty,
        counterpartyPhone: r['Phone'] || '',
        type,
        amountSAR: amount,
        repaidAmountSAR: repaid,
        dueDate: r['Due Date'] || new Date().toISOString().split('T')[0],
        status: repaid >= amount ? 'repaid' : 'active',
        notes: r['Notes'] || '',
        repayments: repaid > 0 ? [{ id: `rep_init_${idx}`, amountSAR: repaid, date: new Date().toISOString().split('T')[0], note: 'Initial imported repayment' }] : [],
        createdAt: new Date().toISOString(),
      });
    });
    result.counts.loans = result.loans.length;
  }

  // 6. Wishlists
  const wishSheetName = findSheet('Wishlists') || findSheet('Wishlist');
  if (wishSheetName && wb.Sheets[wishSheetName]) {
    const raw: any[] = XLSX.utils.sheet_to_json(wb.Sheets[wishSheetName]);
    raw.forEach((r, idx) => {
      const title = r['Item Title'] || r['Title'] || `Wishlist Item ${idx + 1}`;
      const price = parseFloat(r['Estimated Price (SAR)'] || r['Price'] || '0') || 0;
      const saved = parseFloat(r['Saved Amount (SAR)'] || r['Saved'] || '0') || 0;
      result.wishlists.push({
        id: r['ID'] || `wl_imp_${Date.now()}_${idx}`,
        title,
        estimatedPriceSAR: price,
        savedAmountSAR: saved,
        priority: 'medium',
        category: r['Category'] || 'General',
        targetDate: r['Target Date'] || '',
        productUrl: r['Link'] || '',
        notes: r['Notes'] || '',
        isPurchased: saved >= price && price > 0,
        createdAt: new Date().toISOString(),
      });
    });
    result.counts.wishlists = result.wishlists.length;
  }

  return result;
}

export { parseExcelImport as parseExcelFile };

import * as XLSX from 'xlsx';
import {
  MoneyAccount,
  Transaction,
  Loan,
  LoanPayment,
  Task,
  Note,
  ExpenseCategory,
} from '../types';
import {
  AppStateData,
  collectCurrentAppState,
  applyRestoredAppState,
  recalculateAccountBalances,
} from './storage';
import { calculateLoanDetails } from './exchangeRate';

/**
 * Generate full Excel (.xlsx) workbook containing all app data in structured sheets.
 */
export function generateExcelWorkbook(appState: AppStateData, isEmptyTemplate = false): Blob {
  const wb = XLSX.utils.book_new();

  // ==========================================
  // SHEET 1: MONEY & ACCOUNTS (Per User Structure)
  // ==========================================
  const moneyRows: any[][] = [];

  moneyRows.push(['PERSONAL HUB - MONEY & ACCOUNTS']);
  moneyRows.push([isEmptyTemplate ? 'TEMPLATE - Fill in your accounts and transactions below' : `Exported on ${new Date().toLocaleString()}`]);
  moneyRows.push([]); // Row 3 blank

  // 1. Account Summary Block (Row 4)
  moneyRows.push(['Account ID', 'Account Name', 'Opening Balance (SAR)', 'Current Balance (SAR)']);

  // Provide up to 10 accounts
  const sampleTemplateAccounts = [
    { id: 'acc-1', name: 'Al Rajhi Bank', openingBalance: 5000, currentBalance: 5000 },
    { id: 'acc-2', name: 'SNB (National Bank)', openingBalance: 3000, currentBalance: 3000 },
    { id: 'acc-3', name: 'Cash in Hand (Wallet)', openingBalance: 800, currentBalance: 800 },
    { id: 'acc-4', name: 'Credit Card / Visa', openingBalance: 0, currentBalance: 0 },
    { id: 'acc-5', name: 'Savings Account', openingBalance: 10000, currentBalance: 10000 },
    { id: 'acc-6', name: 'Travel Card', openingBalance: 500, currentBalance: 500 },
    { id: 'acc-7', name: 'Secondary Bank', openingBalance: 0, currentBalance: 0 },
    { id: 'acc-8', name: 'Emergency Reserve', openingBalance: 2000, currentBalance: 2000 },
    { id: 'acc-9', name: 'Petty Cash', openingBalance: 200, currentBalance: 200 },
    { id: 'acc-10', name: 'Other Account', openingBalance: 0, currentBalance: 0 },
  ];

  const accountsToExport = isEmptyTemplate
    ? sampleTemplateAccounts
    : appState.accounts.length > 0
    ? appState.accounts
    : sampleTemplateAccounts;

  let totalOpening = 0;
  let totalCurrent = 0;

  accountsToExport.forEach((acc) => {
    const openBal = Number(acc.openingBalance) || 0;
    const currBal = Number(acc.currentBalance) || 0;
    totalOpening += openBal;
    totalCurrent += currBal;
    moneyRows.push([acc.id, acc.name, openBal, currBal]);
  });

  // Total summary row
  moneyRows.push(['TOTAL', 'All Combined Accounts', totalOpening, totalCurrent]);
  moneyRows.push([]); // blank row

  // 2. Transaction Ledger Block (Header around Row 16)
  moneyRows.push(['TRANSACTION LEDGER']);
  moneyRows.push([
    'Date (YYYY-MM-DD)',
    'Description / Remark',
    'Account Name',
    'Category / Destination',
    'Transaction Type (Expense / Money Added / Transfer)',
    'Amount (SAR)',
  ]);

  if (!isEmptyTemplate && appState.transactions.length > 0) {
    appState.transactions.forEach((tx) => {
      const sourceAcc = accountsToExport.find((a) => a.id === tx.accountId)?.name || tx.accountId;
      let targetDesc = '';
      if (tx.type === 'Transfer' && tx.toAccountId) {
        targetDesc = accountsToExport.find((a) => a.id === tx.toAccountId)?.name || tx.toAccountId;
      } else if (tx.categoryId) {
        targetDesc = appState.categories?.find((c) => c.id === tx.categoryId)?.name || tx.categoryId;
      }

      moneyRows.push([
        tx.date,
        tx.remark || '',
        sourceAcc,
        targetDesc,
        tx.type,
        Number(tx.amount) || 0,
      ]);
    });
  } else if (isEmptyTemplate) {
    // Add sample template rows
    moneyRows.push(['2026-10-01', 'Monthly Salary Deposit', 'Al Rajhi Bank', 'Income', 'Money Added', 8500]);
    moneyRows.push(['2026-10-02', 'Supermarket Groceries', 'Al Rajhi Bank', 'Food & Dining', 'Expense', 320]);
    moneyRows.push(['2026-10-03', 'ATM Cash Withdrawal', 'Al Rajhi Bank', 'Cash in Hand (Wallet)', 'Transfer', 500]);
    moneyRows.push(['2026-10-04', 'Electricity & Water Bill', 'SNB (National Bank)', 'Bills & Utilities', 'Expense', 450]);
  }

  const wsMoney = XLSX.utils.aoa_to_sheet(moneyRows);
  wsMoney['!cols'] = [{ wch: 18 }, { wch: 32 }, { wch: 24 }, { wch: 24 }, { wch: 25 }, { wch: 18 }];
  XLSX.utils.book_append_sheet(wb, wsMoney, 'Money & Accounts');

  // ==========================================
  // SHEET 2: LOANS
  // ==========================================
  const loanRows: any[][] = [];
  loanRows.push(['PERSONAL HUB - MULTI-CURRENCY LOANS (INR & SAR)']);
  loanRows.push([]);

  loanRows.push([
    'Loan ID',
    'Loan Name / Person',
    'Type (Given / Taken)',
    'Original Currency (INR / SAR)',
    'Original Amount',
    'Remaining Balance (Original)',
    'Current Remaining (SAR)',
    'Current Remaining (INR)',
    'Total Paid',
    'Status',
    'Start Date',
  ]);

  const loans = isEmptyTemplate
    ? [
        {
          id: 'loan-sample-1',
          name: 'Friend / Family Loan',
          type: 'Given',
          originalCurrency: 'INR',
          originalAmount: 50000,
          remaining: 35000,
          remainingSar: 1575,
          remainingInr: 35000,
          totalPaid: 15000,
          status: 'Active',
          startDate: '2026-09-01',
        },
      ]
    : appState.loans;

  if (loans.length > 0) {
    loans.forEach((l: any) => {
      if (isEmptyTemplate) {
        loanRows.push([
          l.id,
          l.name,
          l.type,
          l.originalCurrency,
          l.originalAmount,
          l.remaining,
          l.remainingSar,
          l.remainingInr,
          l.totalPaid,
          l.status,
          l.startDate,
        ]);
      } else {
        const stats = calculateLoanDetails(
          l,
          appState.loanPayments,
          appState.exchangeRate?.rateInrToSar || 0.045
        );
        const remainingInInr =
          l.originalCurrency === 'INR'
            ? stats.remainingInOriginalCurrency
            : Number((stats.currentRemainingInSar * (appState.exchangeRate?.rateSarToInr || 22.22)).toFixed(2));

        loanRows.push([
          l.id,
          l.name,
          l.type,
          l.originalCurrency,
          l.originalAmount,
          stats.remainingInOriginalCurrency,
          stats.currentRemainingInSar,
          remainingInInr,
          stats.totalPaidInOriginalCurrency,
          stats.isCompleted ? 'Completed' : 'Active',
          l.startDate,
        ]);
      }
    });
  }

  // Payments History Block
  loanRows.push([]);
  loanRows.push(['LOAN REPAYMENT RECORDS']);
  loanRows.push(['Payment ID', 'Loan Name', 'Date', 'Amount', 'Currency', 'Paid By', 'Remark']);

  if (!isEmptyTemplate && appState.loanPayments.length > 0) {
    appState.loanPayments.forEach((p) => {
      const loanName = appState.loans.find((l) => l.id === p.loanId)?.name || p.loanId;
      loanRows.push([p.id, loanName, p.date, p.amount, p.currency, p.paidBy, p.remark || '']);
    });
  } else if (isEmptyTemplate) {
    loanRows.push(['pay-1', 'Friend / Family Loan', '2026-09-15', 500, 'SAR', 'Me', 'Partial cash return']);
  }

  const wsLoans = XLSX.utils.aoa_to_sheet(loanRows);
  wsLoans['!cols'] = [
    { wch: 16 },
    { wch: 25 },
    { wch: 14 },
    { wch: 16 },
    { wch: 16 },
    { wch: 20 },
    { wch: 22 },
    { wch: 22 },
    { wch: 14 },
    { wch: 14 },
    { wch: 14 },
  ];
  XLSX.utils.book_append_sheet(wb, wsLoans, 'Loans');

  // ==========================================
  // SHEET 3: FOLLOW UP & WISHLISTS
  // ==========================================
  const taskRows: any[][] = [];
  taskRows.push(['PERSONAL HUB - FOLLOW UP & WISHLISTS']);
  taskRows.push([]);

  taskRows.push([
    'Title / Task Description',
    'Category (Personal / Work / Wishlist / Documents / Calls)',
    'Priority (High / Medium / Low)',
    'Status (Pending / In Progress / Completed / On Hold)',
    'Follow-Up Date (YYYY-MM-DD)',
    'Completion %',
    'Latest Remarks',
  ]);

  const tasks = isEmptyTemplate
    ? [
        {
          title: 'Car insurance renewal follow up',
          category: 'Personal',
          priority: 'High',
          status: 'Pending',
          followUpDate: '2026-10-05',
          completionPercentage: 20,
          remarks: 'Get quote comparisons from portal.',
        },
        {
          title: 'Buy ergonomic desk chair',
          category: 'Wishlist',
          priority: 'Medium',
          status: 'On Hold',
          followUpDate: '2026-11-01',
          completionPercentage: 0,
          remarks: 'Wait for holiday sale discount.',
        },
      ]
    : appState.tasks;

  tasks.forEach((t) => {
    taskRows.push([
      t.title,
      t.category,
      t.priority,
      t.status,
      t.followUpDate || '',
      t.completionPercentage || 0,
      t.remarks || '',
    ]);
  });

  const wsTasks = XLSX.utils.aoa_to_sheet(taskRows);
  wsTasks['!cols'] = [
    { wch: 35 },
    { wch: 18 },
    { wch: 12 },
    { wch: 14 },
    { wch: 16 },
    { wch: 14 },
    { wch: 35 },
  ];
  XLSX.utils.book_append_sheet(wb, wsTasks, 'Follow Up & Wishlists');

  // ==========================================
  // SHEET 4: PERSONAL NOTES
  // ==========================================
  const notesRows: any[][] = [];
  notesRows.push(['PERSONAL HUB - PERSONAL NOTES']);
  notesRows.push([]);

  notesRows.push(['Note Title', 'Tags (Comma Separated)', 'Note Content', 'Last Modified Date']);

  const notes = isEmptyTemplate
    ? [
        {
          title: 'Important document numbers checklist',
          tags: 'official, docs',
          content: 'Passport copy, National ID number, Driving license renewal date.',
          modifiedDate: '2026-10-01',
        },
      ]
    : appState.notes;

  notes.forEach((n) => {
    const tagsStr = Array.isArray(n.tags) ? n.tags.join(', ') : '';
    const dateStr = n.modifiedDate || n.updatedAt || n.createdDate || '';
    notesRows.push([n.title, tagsStr, n.content, dateStr]);
  });

  const wsNotes = XLSX.utils.aoa_to_sheet(notesRows);
  wsNotes['!cols'] = [{ wch: 30 }, { wch: 20 }, { wch: 60 }, { wch: 16 }];
  XLSX.utils.book_append_sheet(wb, wsNotes, 'Personal Notes');

  // Generate binary XLSX array
  const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
  return new Blob([wbout], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
}

/**
 * Trigger download of current app data as an Excel file.
 */
export function downloadExcelBackup(appState: AppStateData): void {
  const blob = generateExcelWorkbook(appState, false);
  const now = new Date();
  const dateStr = now.toISOString().slice(0, 10);
  const hours = String(now.getHours()).padStart(2, '0');
  const mins = String(now.getMinutes()).padStart(2, '0');

  const filename = `PersonalHub_Data_${dateStr}_${hours}-${mins}.xlsx`;
  saveBlobToFile(blob, filename);
}

/**
 * Trigger download of empty template Excel file.
 */
export function downloadEmptyExcelTemplate(): void {
  const emptyState: AppStateData = {
    tasks: [],
    accounts: [],
    transactions: [],
    categories: [],
    notes: [],
    loans: [],
    loanPayments: [],
    contributors: [],
    securitySettings: { isPinEnabled: false, isBiometricEnabled: false, autoLockTimeout: '5m' },
    exchangeRate: {
      rateInrToSar: 0.045,
      rateSarToInr: 22.22,
      lastUpdated: new Date().toISOString(),
      source: 'Standard Rate',
    },
  };
  const blob = generateExcelWorkbook(emptyState, true);
  saveBlobToFile(blob, 'PersonalHub_Empty_Template.xlsx');
}

/**
 * Parse an uploaded Excel (.xlsx) file and import into AppStateData.
 */
export async function parseExcelImport(file: File, currentState: AppStateData): Promise<AppStateData> {
  const data = await file.arrayBuffer();
  const workbook = XLSX.read(data, { type: 'array' });

  const importedState: AppStateData = { ...currentState };

  // 1. Process Money & Accounts Sheet
  const moneySheet = workbook.Sheets['Money & Accounts'] || workbook.Sheets['Money'] || workbook.Sheets['Accounts'];
  if (moneySheet) {
    const rawRows: any[][] = XLSX.utils.sheet_to_json(moneySheet, { header: 1 });
    
    // Find where accounts start (header with 'Account Name' or 'Account ID')
    const accountHeaderIdx = rawRows.findIndex(
      (r) => r && r.some((c: any) => String(c).toLowerCase().includes('account name') || String(c).toLowerCase().includes('account id'))
    );

    // Find where transactions start (header with 'Date' or 'Description')
    const txHeaderIdx = rawRows.findIndex(
      (r, idx) => idx > accountHeaderIdx && r && r.some((c: any) => String(c).toLowerCase().includes('transaction') || String(c).toLowerCase().includes('ledger') || String(c).toLowerCase().includes('date (yyyy-mm-dd)'))
    );

    const parsedAccounts: MoneyAccount[] = [];
    const accountMapByName = new Map<string, string>(); // name -> id

    if (accountHeaderIdx !== -1) {
      const endOfAccountsIdx = txHeaderIdx !== -1 ? txHeaderIdx : rawRows.length;
      for (let i = accountHeaderIdx + 1; i < endOfAccountsIdx; i++) {
        const row = rawRows[i];
        if (!row || row.length === 0) continue;
        const col0 = String(row[0] || '').trim();
        const col1 = String(row[1] || '').trim();
        
        // Stop if total or blank or reached ledger
        if (col0.toUpperCase() === 'TOTAL' || col0.toUpperCase().includes('TRANSACTION')) break;
        
        const accountName = col1 || col0;
        if (!accountName || accountName.toUpperCase() === 'TOTAL') continue;

        const openingBal = Number(row[2]) || Number(row[1]) || 0;
        const currentBal = Number(row[3]) || openingBal;
        const id = col0.startsWith('acc-') ? col0 : `acc_${Date.now()}_${i}`;

        accountMapByName.set(accountName.toLowerCase(), id);
        parsedAccounts.push({
          id,
          name: accountName,
          openingBalance: openingBal,
          currentBalance: currentBal,
          createdAt: new Date().toISOString(),
        });
      }
    }

    // Now parse transactions if ledger section exists
    const parsedTransactions: Transaction[] = [];
    if (txHeaderIdx !== -1) {
      // The header row with columns like Date, Description, Account Name, etc.
      let dataStartIdx = txHeaderIdx + 1;
      // If the row right after header is 'Date (YYYY-MM-DD)', skip it
      if (rawRows[dataStartIdx] && rawRows[dataStartIdx].some((c: any) => String(c).toLowerCase().includes('date'))) {
        dataStartIdx++;
      }

      for (let i = dataStartIdx; i < rawRows.length; i++) {
        const row = rawRows[i];
        if (!row || row.length === 0) continue;
        const dateStr = String(row[0] || '').trim();
        const remark = String(row[1] || '').trim();
        const accName = String(row[2] || '').trim().toLowerCase();
        const catOrDest = String(row[3] || '').trim();
        const typeStr = String(row[4] || 'Expense').trim();
        const amount = Number(row[5]) || 0;

        if (!dateStr && !amount) continue;

        // Resolve accountId
        const accountId = accountMapByName.get(accName) || (parsedAccounts[0]?.id ?? 'acc-1');
        
        let txType: 'Expense' | 'Money Added' | 'Transfer' = 'Expense';
        if (typeStr.toLowerCase().includes('added') || typeStr.toLowerCase().includes('income')) {
          txType = 'Money Added';
        } else if (typeStr.toLowerCase().includes('transfer')) {
          txType = 'Transfer';
        }

        let toAccountId: string | undefined = undefined;
        let categoryId: string | undefined = undefined;

        if (txType === 'Transfer') {
          toAccountId = accountMapByName.get(catOrDest.toLowerCase()) || undefined;
        } else if (catOrDest) {
          const matchCat = importedState.categories?.find((c) => c.name.toLowerCase() === catOrDest.toLowerCase());
          categoryId = matchCat?.id || undefined;
        }

        parsedTransactions.push({
          id: `tx_imp_${Date.now()}_${i}`,
          type: txType,
          amount,
          accountId,
          toAccountId,
          categoryId,
          date: dateStr || new Date().toISOString().slice(0, 10),
          remark: remark || undefined,
          createdAt: new Date().toISOString(),
        });
      }
    }

    if (parsedAccounts.length > 0) {
      const recalculated = recalculateAccountBalances(parsedAccounts, parsedTransactions);
      importedState.accounts = recalculated;
    }
    if (parsedTransactions.length > 0) {
      importedState.transactions = parsedTransactions;
    }
  }

  // 2. Process Loans Sheet
  const loansSheet = workbook.Sheets['Loans'] || workbook.Sheets['Loan'];
  if (loansSheet) {
    const rawRows: any[][] = XLSX.utils.sheet_to_json(loansSheet, { header: 1 });
    const headerIdx = rawRows.findIndex(
      (r) => r && r.some((c: any) => String(c).toLowerCase().includes('loan name') || String(c).toLowerCase().includes('loan id'))
    );
    const repaymentsHeaderIdx = rawRows.findIndex(
      (r, idx) => idx > headerIdx && r && r.some((c: any) => String(c).toLowerCase().includes('repayment') || String(c).toLowerCase().includes('payment id'))
    );

    const parsedLoans: Loan[] = [];
    const loanMapByName = new Map<string, string>();

    if (headerIdx !== -1) {
      const endIdx = repaymentsHeaderIdx !== -1 ? repaymentsHeaderIdx : rawRows.length;
      for (let i = headerIdx + 1; i < endIdx; i++) {
        const row = rawRows[i];
        if (!row || row.length === 0) continue;
        const col0 = String(row[0] || '').trim();
        const col1 = String(row[1] || '').trim();
        if (col0.toUpperCase().includes('REPAYMENT') || col0.toUpperCase().includes('TOTAL')) break;

        const loanName = col1 || col0;
        if (!loanName) continue;

        const typeStr = String(row[2] || 'Given').trim();
        const currStr = String(row[3] || 'SAR').trim().toUpperCase();
        const origAmt = Number(row[4]) || 1000;
        const startDate = String(row[10] || '').trim() || new Date().toISOString().slice(0, 10);
        const id = col0.startsWith('loan-') ? col0 : `loan_${Date.now()}_${i}`;

        loanMapByName.set(loanName.toLowerCase(), id);
        parsedLoans.push({
          id,
          name: loanName,
          originalAmount: origAmt,
          originalCurrency: currStr === 'INR' ? 'INR' : 'SAR',
          startDate,
          lenderName: typeStr || undefined,
          createdAt: new Date().toISOString(),
        });
      }
    }

    const parsedPayments: LoanPayment[] = [];
    if (repaymentsHeaderIdx !== -1) {
      let dataStart = repaymentsHeaderIdx + 1;
      if (rawRows[dataStart] && rawRows[dataStart].some((c: any) => String(c).toLowerCase().includes('payment id'))) {
        dataStart++;
      }
      for (let i = dataStart; i < rawRows.length; i++) {
        const row = rawRows[i];
        if (!row || row.length === 0) continue;
        const loanName = String(row[1] || '').trim().toLowerCase();
        const dateStr = String(row[2] || '').trim();
        const amt = Number(row[3]) || 0;
        const curr = String(row[4] || 'SAR').trim().toUpperCase() as 'INR' | 'SAR';
        const paidBy = String(row[5] || 'Me').trim();
        const remark = String(row[6] || '').trim();

        if (!loanName && !amt) continue;

        const targetLoanId = loanMapByName.get(loanName) || (parsedLoans[0]?.id ?? 'loan-1');
        parsedPayments.push({
          id: `pay_imp_${Date.now()}_${i}`,
          loanId: targetLoanId,
          amount: amt,
          currency: curr === 'INR' ? 'INR' : 'SAR',
          exchangeRateUsed: curr === 'INR' ? (currentState.exchangeRate?.rateInrToSar || 0.045) : 1,
          date: dateStr || new Date().toISOString().slice(0, 10),
          paidBy,
          remark: remark || undefined,
          createdAt: new Date().toISOString(),
        });
      }
    }

    if (parsedLoans.length > 0) {
      importedState.loans = parsedLoans;
    }
    if (parsedPayments.length > 0) {
      importedState.loanPayments = parsedPayments;
    }
  }

  // 3. Process Follow Up & Wishlists Sheet
  const tasksSheet = workbook.Sheets['Follow Up & Wishlists'] || workbook.Sheets['Tasks'];
  if (tasksSheet) {
    const rawRows: any[][] = XLSX.utils.sheet_to_json(tasksSheet, { header: 1 });
    // Find header row with 'Title'
    const headerIdx = rawRows.findIndex(
      (r) => r && r.some((c: any) => String(c).toLowerCase().includes('title'))
    );
    if (headerIdx !== -1) {
      const dataRows = rawRows.slice(headerIdx + 1);
      const parsedTasks: Task[] = [];
      dataRows.forEach((r, idx) => {
        const title = String(r[0] || '').trim();
        if (!title) return;
        const category = String(r[1] || 'Personal').trim();
        const priority = String(r[2] || 'Medium').trim() as any;
        const status = String(r[3] || 'Pending').trim() as any;
        const followUpDate = String(r[4] || '').trim();
        const completionPercentage = Number(r[5]) || (status === 'Completed' ? 100 : 0);
        const remarks = String(r[6] || '').trim();

        parsedTasks.push({
          id: `task_imp_${Date.now()}_${idx}`,
          title,
          category: (['Personal', 'Work', 'Finance', 'Wishlist', 'Documents', 'Calls', 'Health', 'Other'].includes(category) ? category : 'Personal') as any,
          priority: (['High', 'Medium', 'Low'].includes(priority) ? priority : 'Medium'),
          status: (['Pending', 'In Progress', 'Completed', 'On Hold'].includes(status) ? status : 'Pending'),
          followUpDate: followUpDate || new Date().toISOString().slice(0, 10),
          completionPercentage,
          remarks: remarks || undefined,
          createdDate: new Date().toISOString().slice(0, 10),
          history: [],
        });
      });
      if (parsedTasks.length > 0) {
        importedState.tasks = parsedTasks;
      }
    }
  }

  // 2. Process Personal Notes Sheet
  const notesSheet = workbook.Sheets['Personal Notes'] || workbook.Sheets['Notes'];
  if (notesSheet) {
    const rawRows: any[][] = XLSX.utils.sheet_to_json(notesSheet, { header: 1 });
    const headerIdx = rawRows.findIndex(
      (r) => r && r.some((c: any) => String(c).toLowerCase().includes('title') || String(c).toLowerCase().includes('note'))
    );
    if (headerIdx !== -1) {
      const dataRows = rawRows.slice(headerIdx + 1);
      const parsedNotes: Note[] = [];
      dataRows.forEach((r, idx) => {
        const title = String(r[0] || '').trim();
        const tagsStr = String(r[1] || '').trim();
        const content = String(r[2] || '').trim();
        if (!title && !content) return;

        const tags = tagsStr
          ? tagsStr.split(',').map((t) => t.trim()).filter(Boolean)
          : undefined;

        parsedNotes.push({
          id: `note_imp_${Date.now()}_${idx}`,
          title: title || 'Untitled Note',
          content,
          tags,
          createdDate: new Date().toISOString().slice(0, 10),
          modifiedDate: new Date().toISOString().slice(0, 10),
          updatedAt: new Date().toISOString(),
        });
      });
      if (parsedNotes.length > 0) {
        importedState.notes = parsedNotes;
      }
    }
  }

  return importedState;
}

function saveBlobToFile(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

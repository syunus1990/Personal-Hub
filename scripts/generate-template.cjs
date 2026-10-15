const fs = require('fs');
const XLSX = require('xlsx');

const wb = XLSX.utils.book_new();

// 1. Money Accounts
const tmplAccounts = [
  {
    'Account Name': 'SNB',
    'Type': 'bank',
    'Opening Balance (SAR)': 8100,
    'Account Mask': '•••• SNB',
  },
  {
    'Account Name': 'D360',
    'Type': 'wallet',
    'Opening Balance (SAR)': 0,
    'Account Mask': 'D360 Digital',
  },
  {
    'Account Name': 'STC',
    'Type': 'wallet',
    'Opening Balance (SAR)': 1250,
    'Account Mask': 'STC Pay',
  },
  {
    'Account Name': 'Alinma',
    'Type': 'bank',
    'Opening Balance (SAR)': 1500,
    'Account Mask': '•••• Alinma',
  },
  {
    'Account Name': 'Tiqmo',
    'Type': 'wallet',
    'Opening Balance (SAR)': 150,
    'Account Mask': 'Tiqmo Wallet',
  },
];
XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(tmplAccounts), 'Money_Accounts');

// 2. Transactions
const tmplTransactions = [
  {
    'Date': '2026-10-05',
    'Type': 'expense',
    'Source Account': 'SNB',
    'Destination Account (Transfer)': '',
    'Category': 'Food',
    'Amount (SAR)': 58,
    'Note / Description': 'Umar Home',
  },
  {
    'Date': '2026-10-04',
    'Type': 'expense',
    'Source Account': 'SNB',
    'Destination Account (Transfer)': '',
    'Category': 'Shopping',
    'Amount (SAR)': 216.88,
    'Note / Description': 'Purse and Socks',
  },
  {
    'Date': '2026-09-30',
    'Type': 'expense',
    'Source Account': 'STC',
    'Destination Account (Transfer)': '',
    'Category': 'Fuel',
    'Amount (SAR)': 109,
    'Note / Description': 'Petrol',
  },
];
XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(tmplTransactions), 'Money_Transactions');

// 3. Follow-ups
const tmplFollowups = [
  {
    'Title': 'Car cleaning before installing seat cover',
    'Category': 'Car',
    'Due Date (YYYY-MM-DD)': '2026-10-07',
    'Due Time': '10:00',
    'Priority (high/medium/low)': 'medium',
    'Notes': 'Task created.',
  },
  {
    'Title': 'Mudassir studies or job',
    'Category': 'Personal',
    'Due Date (YYYY-MM-DD)': '2026-10-06',
    'Due Time': '12:00',
    'Priority (high/medium/low)': 'high',
    'Notes': 'Follow up on education or job options.',
  },
  {
    'Title': 'Insurance Renew',
    'Category': 'Finance',
    'Due Date (YYYY-MM-DD)': '2026-10-07',
    'Due Time': '14:00',
    'Priority (high/medium/low)': 'high',
    'Notes': 'Sent medical bills and incident summary to claims adjuster.',
  },
];
XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(tmplFollowups), 'Follow_Ups');

// 4. Notes
const tmplNotes = [
  {
    'Title': 'Items to buy',
    'Category': 'Car',
    'Color (lavender/mint/peach/sky/butter)': 'lavender',
    'Pinned (yes/no)': 'yes',
    'Content': '1. Booster cable \n2. Torque wrench\n3. Electric car jack\n4. Water cooler\n5. Ugreen K331 MK006 LP669 4000 DPI mouse',
  },
];
XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(tmplNotes), 'Notes');

// 5. Loans
const tmplLoans = [
  {
    'Counterparty Name': 'Haris',
    'Type': 'borrowed',
    'Amount (SAR)': 3891.05,
    'Repaid (SAR)': 0,
    'Due Date': '2026-11-01',
    'Phone': '',
    'Notes': 'For increase investment (Original: ₹100,000 INR)',
  },
  {
    'Counterparty Name': 'Shahid Mamu (India Personal Loan)',
    'Type': 'borrowed',
    'Amount (SAR)': 3891.05,
    'Repaid (SAR)': 155.64,
    'Due Date': '2026-12-31',
    'Phone': '',
    'Notes': 'Opening for Shop (Original: ₹100,000 INR). Paid monthly principal reduction.',
  },
];
XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(tmplLoans), 'Loans');

// 6. Wishlists
const tmplWishlists = [
  {
    'Item Title': 'Car seat cover (Indian Fabro & Flooring)',
    'Category': 'Car',
    'Estimated Price (SAR)': 500,
    'Saved Amount (SAR)': 0,
    'Priority': 'high',
    'Target Date': '2026-10-15',
    'Link': '',
    'Notes': 'Quotation: Indian brand Fabro and flooring 500 SAR',
  },
  {
    'Item Title': 'Booster cable',
    'Category': 'Car',
    'Estimated Price (SAR)': 120,
    'Saved Amount (SAR)': 0,
    'Priority': 'medium',
    'Target Date': '2026-10-20',
    'Link': '',
    'Notes': 'From Items to buy list',
  },
];
XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(tmplWishlists), 'Wishlists');

fs.mkdirSync('./public', { recursive: true });
XLSX.writeFile(wb, './public/Personal_Hub_Template.xlsx');
console.log('Template updated successfully with user backup data in /public/Personal_Hub_Template.xlsx');

import { splitEntries, classifyEntry, extractFields, parseAll } from './parser.js';

console.log('====================================================');
console.log('Personal Hub Offline Entry Parser Test Suite');
console.log('====================================================\n');

let passedTests = 0;
let totalTests = 0;

function assert(condition, message) {
  totalTests++;
  if (condition) {
    console.log(`  [PASS] ${message}`);
    passedTests++;
  } else {
    console.error(`  [FAIL] ${message}`);
  }
}

// ----------------------------------------------------
// Test A: Single Expense
// ----------------------------------------------------
console.log('Test A: Single Expense');
const inputA = "Paid 150 SAR for car fuel from Cash today";
const resA = parseAll(inputA);
console.log('Result A:', JSON.stringify(resA, null, 2));
assert(resA.length === 1, 'Test A: Splits into exactly 1 entry');
assert(resA[0]?.type === 'expense', 'Test A: Classifies as expense');
assert(resA[0]?.amount === 150, 'Test A: Extracts amount 150');
assert(resA[0]?.currency === 'SAR', 'Test A: Extracts currency SAR');
assert(resA[0]?.account === 'Cash', 'Test A: Extracts account Cash');
assert(resA[0]?.item?.includes('car fuel'), 'Test A: Extracts item "car fuel"');
console.log('');

// ----------------------------------------------------
// Test B: Single Loan Out
// ----------------------------------------------------
console.log('Test B: Single Loan Out');
const inputB = "Lent 500 SAR to Ahmed for car repair return next month";
const resB = parseAll(inputB);
console.log('Result B:', JSON.stringify(resB, null, 2));
assert(resB.length === 1, 'Test B: Splits into exactly 1 entry');
assert(resB[0]?.type === 'loan_out', 'Test B: Classifies as loan_out');
assert(resB[0]?.amount === 500, 'Test B: Extracts amount 500');
assert(resB[0]?.person === 'Ahmed', 'Test B: Extracts person Ahmed');
assert(resB[0]?.dueDate?.toLowerCase().includes('next month'), 'Test B: Extracts due date "next month"');
console.log('');

// ----------------------------------------------------
// Test C: Single Diagnose
// ----------------------------------------------------
console.log('Test C: Single Diagnose');
const inputC = "Diagnose washing machine error code E20 check drain filter";
const resC = parseAll(inputC);
console.log('Result C:', JSON.stringify(resC, null, 2));
assert(resC.length === 1, 'Test C: Splits into exactly 1 entry');
assert(resC[0]?.type === 'diagnose', 'Test C: Classifies as diagnose');
assert(resC[0]?.target?.includes('washing machine'), 'Test C: Extracts target "washing machine"');
assert(resC[0]?.notes?.includes('error code E20') || resC[0]?.notes?.includes('filter'), 'Test C: Extracts notes with error code and filter');
console.log('');

// ----------------------------------------------------
// Test D: Single Wishlist
// ----------------------------------------------------
console.log('Test D: Single Wishlist');
const inputD = "Wishlist buy iPhone 16 Pro Max around 4500 SAR";
const resD = parseAll(inputD);
console.log('Result D:', JSON.stringify(resD, null, 2));
assert(resD.length === 1, 'Test D: Splits into exactly 1 entry');
assert(resD[0]?.type === 'wishlist', 'Test D: Classifies as wishlist');
assert(resD[0]?.item?.includes('iPhone 16 Pro Max'), 'Test D: Extracts item "iPhone 16 Pro Max"');
assert(resD[0]?.amount === 4500, 'Test D: Extracts estimated price 4500');
console.log('');

// ----------------------------------------------------
// Test E: Long Multi-Entry Sentence (8 entries)
// ----------------------------------------------------
console.log('Test E: Multi-entry sentence (8 entries expected)');
const inputE = "Paid 150 SAR for car fuel from Cash today, and diagnose washing machine error code E20 check drain filter, also Lent 500 SAR to Ahmed for car repair return next month, wishlist buy iPhone 16 Pro Max around 4500 SAR, and Lent 1000 SAR to brother return by end of Ramadan, plus Paid 89.50 SAR for groceries from Salary account yesterday, also Wishlist buy custom car seat cover around 300 SAR, and Diagnose AC not cooling check gas pressure and filter.";
const resE = parseAll(inputE);
console.log(`Parsed ${resE.length} entries:`);
resE.forEach((e, idx) => {
  console.log(`  ${idx + 1}. [${e.type.toUpperCase()}] ${e.amount ? e.amount + ' ' + e.currency : '—'} | Target: ${e.item || e.target || '—'} | Acc/Person: ${e.account || e.person || '—'}`);
});
assert(resE.length === 8, 'Test E: Splits into exactly 8 separate entries');
assert(resE[0]?.type === 'expense' && resE[0]?.amount === 150, 'Entry 1 is Expense 150 SAR');
assert(resE[1]?.type === 'diagnose' && resE[1]?.target?.includes('washing machine'), 'Entry 2 is Diagnose washing machine');
assert(resE[2]?.type === 'loan_out' && resE[2]?.person === 'Ahmed' && resE[2]?.amount === 500, 'Entry 3 is Loan 500 to Ahmed');
assert(resE[3]?.type === 'wishlist' && resE[3]?.item?.includes('iPhone') && resE[3]?.amount === 4500, 'Entry 4 is Wishlist iPhone 16 Pro Max');
assert(resE[4]?.type === 'loan_out' && resE[4]?.person === 'brother' && resE[4]?.amount === 1000, 'Entry 5 is Loan 1000 to brother');
assert(resE[5]?.type === 'expense' && resE[5]?.amount === 89.50, 'Entry 6 is Expense 89.50 groceries');
assert(resE[6]?.type === 'wishlist' && resE[6]?.amount === 300, 'Entry 7 is Wishlist custom car seat cover');
assert(resE[7]?.type === 'diagnose' && resE[7]?.target?.includes('AC'), 'Entry 8 is Diagnose AC');
console.log('');

// ----------------------------------------------------
// Test F: Mixed Short Separated by Commas
// ----------------------------------------------------
console.log('Test F: Mixed Short (3 entries)');
const inputF = "Paid 45 SAR coffee from Cash, Lent 750 SAR to Sara, Wishlist gaming chair 900 SAR";
const resF = parseAll(inputF);
console.log('Result F:', JSON.stringify(resF, null, 2));
assert(resF.length === 3, 'Test F: Splits into exactly 3 entries');
assert(resF[0]?.type === 'expense' && resF[0]?.amount === 45, 'Test F Entry 1: Expense 45');
assert(resF[1]?.type === 'loan_out' && resF[1]?.amount === 750 && resF[1]?.person === 'Sara', 'Test F Entry 2: Loan 750 to Sara');
assert(resF[2]?.type === 'wishlist' && resF[2]?.amount === 900 && resF[2]?.item?.includes('gaming chair'), 'Test F Entry 3: Wishlist gaming chair 900');
console.log('');

console.log('====================================================');
console.log(`Test Summary: ${passedTests} / ${totalTests} assertions passed`);
console.log('====================================================');

if (passedTests !== totalTests) {
  process.exit(1);
}

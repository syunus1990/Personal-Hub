/**
 * Personal Hub Universal Entry Parser
 * >>> REPLACE YOUR OLD PARSER HERE <<<
 *
 * Supports 5 entry types:
 * - expense
 * - loan_out
 * - loan_in
 * - diagnose
 * - wishlist
 *
 * Handles multi-entry splitting by commas, conjunctions, semicolons, and newlines.
 */

// Trigger keyword definitions (English + Arabic)
export const TRIGGER_KEYWORDS = {
  expense: [
    'paid', 'pay', 'spent', 'bought', 'purchase',
    'دفع', 'دفعت', 'صرف', 'اشتريت', 'شراء'
  ],
  loan_out: [
    'lent', 'loaned', 'gave loan', 'أقرضت', 'سلفت', 'اعطيت سلف'
  ],
  loan_in: [
    'borrowed', 'took loan', 'استلفت', 'اقترضت', 'اخذت سلف'
  ],
  diagnose: [
    'diagnose', 'check', 'error code', 'troubleshoot', 'fix',
    'شخّص', 'شخص', 'تحقق', 'فحص', 'افحص', 'تصليح'
  ],
  wishlist: [
    'wishlist', 'want to buy', 'plan to buy', 'wish list',
    'أريد شراء', 'اريد شراء', 'قائمة الرغبات', 'نفسي اشتري'
  ]
};

export type EntryType = 'expense' | 'loan_out' | 'loan_in' | 'diagnose' | 'wishlist';

export interface ParsedEntry {
  raw: string;
  type: EntryType;
  amount?: number;
  currency: string;
  account?: string;
  person?: string;
  dueDate?: string;
  item?: string;
  target?: string;
  notes?: string;
  date: string;
  priority?: 'high' | 'medium' | 'low';
}

/**
 * Normalizes and helper dates
 */
function getDateOffset(daysOffset: number): string {
  const d = new Date();
  d.setDate(d.getDate() + daysOffset);
  return d.toISOString().split('T')[0];
}

/**
 * Checks if a string contains any trigger keyword for an entry type
 */
function hasAnyTrigger(text: string): boolean {
  const lower = text.toLowerCase();
  for (const list of Object.values(TRIGGER_KEYWORDS)) {
    for (const kw of list) {
      const escaped = kw.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const regex = new RegExp(`(?:^|[^a-zA-Z0-9\u0600-\u06FF])${escaped}(?:$|[^a-zA-Z0-9\u0600-\u06FF])`, 'i');
      if (regex.test(lower)) return true;
    }
  }
  return false;
}

/**
 * 1. Split a single multi-entry sentence into separate entry candidate strings
 * Handles:
 * - commas ( , )
 * - semicolons ( ; )
 * - newlines ( \n )
 * - "and" / "also" / "plus" / "then" / "بعدها" / "وأيضا" / "ثم"
 *
 * Intelligently preserves sub-clauses (e.g. "gas pressure and filter")
 * by only breaking at conjunctions when the next phrase contains an entry trigger.
 */
export function splitEntries(text: string): string[] {
  if (!text || !text.trim()) return [];

  // Match separators:
  // 1. Newlines or semicolons
  // 2. Commas optionally followed by conjunctions
  // 3. Standalone conjunctions when followed by a keyword
  const rawSegments = text
    .split(/(?:\r?\n+|;+|(?:,\s*(?:and|also|plus|then|بعدها|وأيضا|ثم)\s*)|(?:,\s*)|(?:\s+(?:also|plus|then|بعدها|وأيضا|ثم)\s+)|(?:\s+and\s+))/i)
    .map((s) => s.trim())
    .filter(Boolean);

  const entries: string[] = [];
  let currentAccumulator = '';

  for (let i = 0; i < rawSegments.length; i++) {
    let seg = rawSegments[i];
    // Remove leading conjunction words from the segment
    seg = seg.replace(/^(?:and|also|plus|then|بعدها|وأيضا|ثم)\s+/i, '').trim();
    if (!seg) continue;

    // Does this segment start or contain an entry trigger?
    if (hasAnyTrigger(seg)) {
      if (currentAccumulator) {
        entries.push(currentAccumulator.trim());
      }
      currentAccumulator = seg;
    } else {
      // If it has no trigger keyword, it's a continuation of the previous entry (e.g. "and filter")
      if (currentAccumulator) {
        currentAccumulator += ` and ${seg}`;
      } else {
        currentAccumulator = seg;
      }
    }
  }

  if (currentAccumulator && currentAccumulator.trim()) {
    entries.push(currentAccumulator.trim());
  }

  return entries;
}

/**
 * 2. Classify an entry string into one of the 5 types:
 * expense, loan_out, loan_in, diagnose, wishlist
 */
export function classifyEntry(text: string): EntryType {
  const lower = text.toLowerCase();

  // 1. Wishlist
  for (const kw of TRIGGER_KEYWORDS.wishlist) {
    if (lower.includes(kw)) return 'wishlist';
  }

  // 2. Loan out
  for (const kw of TRIGGER_KEYWORDS.loan_out) {
    if (lower.includes(kw)) return 'loan_out';
  }

  // 3. Loan in
  for (const kw of TRIGGER_KEYWORDS.loan_in) {
    if (lower.includes(kw)) return 'loan_in';
  }

  // 4. Diagnose
  // Check for diagnose / troubleshooting / error code
  if (
    lower.includes('diagnose') ||
    lower.includes('troubleshoot') ||
    lower.includes('error code') ||
    lower.includes('fix') ||
    lower.includes('شخّص') ||
    lower.includes('شخص') ||
    lower.includes('تحقق')
  ) {
    return 'diagnose';
  }
  // 'check' can also be diagnose if not banking check
  if (lower.includes('check') && !lower.includes('check payment') && !lower.includes('cheque')) {
    return 'diagnose';
  }

  // 5. Expense
  for (const kw of TRIGGER_KEYWORDS.expense) {
    if (lower.includes(kw)) return 'expense';
  }

  // Fallback heuristic based on amount and keywords
  if (lower.includes('lent') || lower.includes('loan')) return 'loan_out';
  if (lower.includes('borrow')) return 'loan_in';
  if (lower.includes('want') || lower.includes('buy')) return 'wishlist';
  if (lower.includes('repair') || lower.includes('error') || lower.includes('broken')) return 'diagnose';

  return 'expense';
}

/**
 * 3. Extract structured fields from a single entry string
 */
export function extractFields(text: string, type: EntryType): ParsedEntry {
  const today = getDateOffset(0);
  const yesterday = getDateOffset(-1);
  const lower = text.toLowerCase();

  // Date detection
  let date = today;
  if (lower.includes('yesterday') || lower.includes('أمس') || lower.includes('امس')) {
    date = yesterday;
  } else {
    const dateMatch = text.match(/\b(\d{4}-\d{2}-\d{2})\b/);
    if (dateMatch) date = dateMatch[1];
  }

  // Currency detection
  let currency = 'SAR';
  if (/\b(?:USD|\$)\b/i.test(text)) currency = 'USD';
  else if (/\bAED\b/i.test(text)) currency = 'AED';
  else if (/\bEUR\b/i.test(text)) currency = 'EUR';
  else if (/\bINR\b/i.test(text)) currency = 'INR';
  else if (/ريال/i.test(text)) currency = 'SAR';

  // Amount extraction
  let amount: number | undefined = undefined;
  // Match around / ~ / approx
  const amountMatch = text.match(/(?:around|~|approx(?:\.)?|about)?\s*(\d+(?:\.\d+)?)\s*(?:SAR|USD|AED|EUR|INR|ريال)?/i);
  // Also look for explicit numbers with decimals or integers
  const allNums = [...text.matchAll(/(?:SAR|USD|AED|EUR|INR|ريال)?\s*(\d+(?:\.\d+)?)\s*(?:SAR|USD|AED|EUR|INR|ريال)?/gi)];
  for (const m of allNums) {
    const val = parseFloat(m[1]);
    if (!isNaN(val)) {
      // Don't treat error codes like E20 as amount
      const prefix = text.slice(Math.max(0, (m.index || 0) - 5), m.index || 0);
      if (!/error\s*code\s*e?/i.test(prefix) && !/e\s*$/i.test(prefix)) {
        amount = val;
        break;
      }
    }
  }

  // Account extraction
  let account: string | undefined = undefined;
  const accMatch = text.match(/\bfrom\s+([A-Za-z0-9\s]+?)(?:\s+(?:today|yesterday|for|to|with)\b|$|,|;)/i);
  if (accMatch) {
    const rawAcc = accMatch[1].trim();
    if (/salary(?:\s+account)?/i.test(rawAcc)) account = 'Salary account';
    else if (/cash/i.test(rawAcc)) account = 'Cash';
    else if (/bank/i.test(rawAcc)) account = 'Bank';
    else account = rawAcc;
  } else if (/\bcash\b/i.test(text)) {
    account = 'Cash';
  } else if (/salary\s*account/i.test(text)) {
    account = 'Salary account';
  }

  // Person extraction (for loans)
  let person: string | undefined = undefined;
  if (type === 'loan_out' || type === 'loan_in') {
    const personMatch = text.match(/\b(?:to|from)\s+([A-Za-z\u0600-\u06FF]+)(?:\s+(?:for|return|due|by|in|yesterday|today)\b|$|,|;)/i);
    if (personMatch) {
      person = personMatch[1].trim();
    }
  }

  // Due date extraction (for loans)
  let dueDate: string | undefined = undefined;
  if (type === 'loan_out' || type === 'loan_in') {
    const dueMatch = text.match(/\b(?:return|due)(?:\s+by|\s+in|\s+on)?\s+([A-Za-z0-9\s\u0600-\u06FF]+?)(?:$|,|;|\.|\band\b|\balso\b)/i);
    if (dueMatch) {
      dueDate = dueMatch[1].trim();
    }
  }

  // Item / Target extraction per type
  let item: string | undefined = undefined;
  let target: string | undefined = undefined;
  let notes: string | undefined = undefined;

  if (type === 'expense') {
    // "Paid 150 SAR for car fuel from Cash today" -> "car fuel"
    const forMatch = text.match(/\bfor\s+([A-Za-z0-9\s]+?)(?:\s+from|\s+today|\s+yesterday|$|,|;)/i);
    if (forMatch) {
      item = forMatch[1].trim();
    } else {
      // "Paid 45 SAR coffee from Cash" -> "coffee"
      const coffeeMatch = text.match(/(?:paid|spent|bought)\s+(?:\d+(?:\.\d+)?)\s*(?:SAR|USD|AED|EUR|INR|ريال)?\s+([A-Za-z0-9\s]+?)(?:\s+from|\s+today|\s+yesterday|$|,|;)/i);
      if (coffeeMatch) {
        item = coffeeMatch[1].trim();
      } else {
        item = text.replace(/^(?:paid|pay|spent|bought|purchase|دفع|دفعت|صرف)\s*/i, '').trim();
      }
    }
  } else if (type === 'diagnose') {
    // "Diagnose washing machine error code E20 check drain filter" -> target: "washing machine", notes: "error code E20, drain filter"
    // "Diagnose AC not cooling check gas pressure and filter" -> target: "AC", notes: "not cooling, gas pressure and filter"
    const diagMatch = text.match(/(?:diagnose|check|troubleshoot|fix|شخّص|تحقق)\s+([A-Za-z0-9\s]+?)(?:\s+(?:error\s*code|check|test|replace|not\s+cooling|broken|leak|issue)\b|$|,|;)/i);
    if (diagMatch) {
      target = diagMatch[1].trim();
      // Notes is the remainder
      const remainder = text.slice(text.indexOf(diagMatch[1]) + diagMatch[1].length).trim();
      notes = remainder.replace(/^[:,]\s*/, '').trim();
    } else {
      target = text.replace(/^(?:diagnose|check|troubleshoot|fix|شخّص|تحقق)\s*/i, '').trim();
    }
  } else if (type === 'wishlist') {
    // "Wishlist buy iPhone 16 Pro Max around 4500 SAR" -> "iPhone 16 Pro Max"
    // "Wishlist buy custom car seat cover around 300 SAR" -> "custom car seat cover"
    // "Wishlist gaming chair 900 SAR" -> "gaming chair"
    let cleaned = text
      .replace(/^(?:wishlist|want to buy|plan to buy|أريد شراء|اريد شراء|قائمة الرغبات)\s*(?:buy\s+)?/i, '')
      .trim();
    // Strip trailing price expression, preserving product names with numbers (e.g. iPhone 16 Pro Max)
    cleaned = cleaned
      .replace(/(?:,\s*)?(?:around|approx|about|~|for)?\s*\d+(?:\.\d+)?\s*(?:SAR|USD|AED|EUR|INR|ريال)[\w\s]*$/i, '')
      .replace(/(?:,\s*)?(?:around|approx|about|~)\s*\d+(?:\.\d+)?[\w\s]*$/i, '')
      .trim();
    item = cleaned;
  } else if (type === 'loan_out' || type === 'loan_in') {
    // Notes for loans: e.g. "for car repair"
    const loanForMatch = text.match(/\bfor\s+([A-Za-z0-9\s]+?)(?:\s+(?:return|due)\b|$|,|;)/i);
    if (loanForMatch) {
      notes = loanForMatch[1].trim();
    }
  }

  return {
    raw: text,
    type,
    amount,
    currency,
    account: account || (type === 'expense' ? 'Cash' : undefined),
    person,
    dueDate,
    item: item || target,
    target: target || item,
    notes,
    date,
    priority: 'medium',
  };
}

/**
 * 4. parseAll: Full pipeline
 * Splits input text, classifies each entry, and extracts structured fields
 */
export function parseAll(text: string): ParsedEntry[] {
  const rawEntries = splitEntries(text);
  return rawEntries.map((raw) => {
    const type = classifyEntry(raw);
    return extractFields(raw, type);
  });
}

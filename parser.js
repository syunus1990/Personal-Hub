// >>> REPLACE YOUR OLD PARSER HERE <<<
/**
 * Personal Hub Universal Offline Entry Parser
 *
 * Automatically splits multi-entry sentences and classifies into 5 types:
 * 1. Expense: paid, pay, spent, bought, purchase, دفع, دفعت, صرف
 * 2. Loan (out): lent, loaned, gave loan, أقرضت, سلفت
 * 3. Loan (in): borrowed, took loan, استلفت, اقترضت
 * 4. Diagnose: diagnose, check, error code, troubleshoot, fix, شخّص, تحقق
 * 5. Wishlist: wishlist, want to buy, plan to buy, أريد شراء, قائمة الرغبات
 */

const TRIGGER_KEYWORDS = {
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

function hasAnyTrigger(text) {
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
 * 1. Multi-entry splitting
 * Splits sentence by commas, conjunctions, semicolons, and newlines.
 * Does not prematurely break sub-clauses like "gas pressure and filter".
 */
export function splitEntries(text) {
  if (!text || !text.trim()) return [];

  const rawSegments = text
    .split(/(?:\r?\n+|;+|(?:,\s*(?:and|also|plus|then|بعدها|وأيضا|ثم)\s*)|(?:,\s*)|(?:\s+(?:also|plus|then|بعدها|وأيضا|ثم)\s+)|(?:\s+and\s+))/i)
    .map((s) => s.trim())
    .filter(Boolean);

  const entries = [];
  let currentAccumulator = '';

  for (let i = 0; i < rawSegments.length; i++) {
    let seg = rawSegments[i];
    seg = seg.replace(/^(?:and|also|plus|then|بعدها|وأيضا|ثم)\s+/i, '').trim();
    if (!seg) continue;

    if (hasAnyTrigger(seg)) {
      if (currentAccumulator) {
        entries.push(currentAccumulator.trim());
      }
      currentAccumulator = seg;
    } else {
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
 * 2. Classify an entry into one of the 5 types
 */
export function classifyEntry(text) {
  const lower = text.toLowerCase();

  // Wishlist
  for (const kw of TRIGGER_KEYWORDS.wishlist) {
    if (lower.includes(kw)) return 'wishlist';
  }

  // Loan out
  for (const kw of TRIGGER_KEYWORDS.loan_out) {
    if (lower.includes(kw)) return 'loan_out';
  }

  // Loan in
  for (const kw of TRIGGER_KEYWORDS.loan_in) {
    if (lower.includes(kw)) return 'loan_in';
  }

  // Diagnose
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
  if (lower.includes('check') && !lower.includes('cheque')) {
    return 'diagnose';
  }

  // Expense
  for (const kw of TRIGGER_KEYWORDS.expense) {
    if (lower.includes(kw)) return 'expense';
  }

  return 'expense';
}

/**
 * 3. Field extraction per entry
 */
export function extractFields(text, type) {
  const today = new Date().toISOString().split('T')[0];
  const yesterdayDate = new Date();
  yesterdayDate.setDate(yesterdayDate.getDate() - 1);
  const yesterday = yesterdayDate.toISOString().split('T')[0];
  const lower = text.toLowerCase();

  // Date
  let date = today;
  if (lower.includes('yesterday') || lower.includes('أمس') || lower.includes('امس')) {
    date = yesterday;
  }

  // Currency
  let currency = 'SAR';
  if (/\b(?:USD|\$)\b/i.test(text)) currency = 'USD';
  else if (/\bAED\b/i.test(text)) currency = 'AED';
  else if (/\bEUR\b/i.test(text)) currency = 'EUR';
  else if (/\bINR\b/i.test(text)) currency = 'INR';

  // Amount
  let amount = undefined;
  const allNums = [...text.matchAll(/(?:SAR|USD|AED|EUR|INR|ريال)?\s*(\d+(?:\.\d+)?)\s*(?:SAR|USD|AED|EUR|INR|ريال)?/gi)];
  for (const m of allNums) {
    const val = parseFloat(m[1]);
    if (!isNaN(val)) {
      const prefix = text.slice(Math.max(0, (m.index || 0) - 5), m.index || 0);
      if (!/error\s*code\s*e?/i.test(prefix) && !/e\s*$/i.test(prefix)) {
        amount = val;
        break;
      }
    }
  }

  // Account
  let account = undefined;
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

  // Person (loans)
  let person = undefined;
  if (type === 'loan_out' || type === 'loan_in') {
    const personMatch = text.match(/\b(?:to|from)\s+([A-Za-z\u0600-\u06FF]+)(?:\s+(?:for|return|due|by|in|yesterday|today)\b|$|,|;)/i);
    if (personMatch) {
      person = personMatch[1].trim();
    }
  }

  // Due Date (loans)
  let dueDate = undefined;
  if (type === 'loan_out' || type === 'loan_in') {
    const dueMatch = text.match(/\b(?:return|due)(?:\s+by|\s+in|\s+on)?\s+([A-Za-z0-9\s\u0600-\u06FF]+?)(?:$|,|;|\.|\band\b|\balso\b)/i);
    if (dueMatch) {
      dueDate = dueMatch[1].trim();
    }
  }

  // Item / Target
  let item = undefined;
  let target = undefined;
  let notes = undefined;

  if (type === 'expense') {
    const forMatch = text.match(/\bfor\s+([A-Za-z0-9\s]+?)(?:\s+from|\s+today|\s+yesterday|$|,|;)/i);
    if (forMatch) {
      item = forMatch[1].trim();
    } else {
      const coffeeMatch = text.match(/(?:paid|spent|bought)\s+(?:\d+(?:\.\d+)?)\s*(?:SAR|USD|AED|EUR|INR|ريال)?\s+([A-Za-z0-9\s]+?)(?:\s+from|\s+today|\s+yesterday|$|,|;)/i);
      if (coffeeMatch) {
        item = coffeeMatch[1].trim();
      } else {
        item = text.replace(/^(?:paid|pay|spent|bought|purchase|دفع|دفعت|صرف)\s*/i, '').trim();
      }
    }
  } else if (type === 'diagnose') {
    const diagMatch = text.match(/(?:diagnose|check|troubleshoot|fix|شخّص|تحقق)\s+([A-Za-z0-9\s]+?)(?:\s+(?:error\s*code|check|test|replace|not\s+cooling|broken|leak|issue)\b|$|,|;)/i);
    if (diagMatch) {
      target = diagMatch[1].trim();
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
  };
}

/**
 * 4. Parse all entries from text
 */
export function parseAll(text) {
  const rawEntries = splitEntries(text);
  return rawEntries.map((raw) => {
    const type = classifyEntry(raw);
    return extractFields(raw, type);
  });
}

import { CategoryItem, Account, ChecklistItem } from '../types';
import { predictCategoryFromDescription } from '../utils/aiCategorizer';
import { parseAll, extractFields, classifyEntry } from '../utils/parser';

export interface RawBulkExpenseInput {
  id: string;
  forText: string;
  amount: string;
  accountId: string;
  date: string;
}

export interface ProcessedExpenseEntry {
  id: string;
  originalText: string;
  rephrasedTitle: string;
  amount: number;
  accountId: string;
  accountName: string;
  category: string;
  subCategory?: string;
  date: string;
  explanation?: string;
}

export interface RephraseResult {
  rephrasedTitle: string;
  checklistItems?: string[];
  rephrasedNotes?: string;
  suggestedCategory?: string;
  suggestedPriority?: 'high' | 'medium' | 'low';
  suggestedDueDate?: string;
  explanation?: string;
}

export interface AutoDetectResult {
  detectedType: 'transaction' | 'followup' | 'wishlist' | 'note' | 'loan' | 'account';
  transactionType?: 'expense' | 'income' | 'transfer';
  title: string;
  amount?: number;
  accountName?: string;
  accountId?: string;
  category?: string;
  subCategory?: string;
  date?: string;
  priority?: 'high' | 'medium' | 'low';
  counterpartyName?: string;
  loanType?: 'lent' | 'borrowed';
  checklistItems?: string[];
  explanation?: string;
}

export interface SuggestItemResult {
  rephrasedTitle: string;
  suggestedPrice?: number;
  suggestedPriority?: 'high' | 'medium' | 'low';
  suggestedCategory?: string;
  suggestedSubCategory?: string;
  suggestedDueDate?: string;
  suggestedColor?: string;
  suggestedAccountType?: string;
  suggestedLoanType?: string;
  suggestedCounterparty?: string;
  rephrasedNotes?: string;
  checklistItems?: string[];
  explanation?: string;
}

/**
 * Clean up title heuristically if offline or fallback
 */
function localCleanTitle(text: string): string {
  if (!text) return '';
  let cleaned = text.trim();

  // Normalize multiple spaces
  cleaned = cleaned.replace(/\s+/g, ' ');

  // Quick domain improvements
  const lower = cleaned.toLowerCase();
  if (lower.includes('fuel') || lower.includes('petrol') || lower.includes('gas')) {
    if (!lower.includes('refill') && !lower.includes('car')) {
      cleaned = `Car Fuel Refill (${cleaned})`;
    }
  } else if (lower.includes('oil change')) {
    cleaned = 'Car Engine Oil Change';
  } else if (lower.includes('car wash') || lower.includes('car cleaning')) {
    cleaned = 'Car Cleaning & Wash';
  }

  // Capitalize first character
  return cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
}

/**
 * Process bulk expenses with server Gemini API or local heuristic fallback
 */
export async function processBulkExpenses(
  entries: RawBulkExpenseInput[],
  categories: CategoryItem[],
  accounts: Account[]
): Promise<ProcessedExpenseEntry[]> {
  const accountMap = new Map<string, Account>();
  accounts.forEach((a) => accountMap.set(a.id, a));

  const entriesPayload = entries.map((e) => {
    const acc = accountMap.get(e.accountId);
    return {
      id: e.id,
      forText: e.forText,
      amount: parseFloat(e.amount) || 0,
      accountName: acc?.name || 'Cash',
      date: e.date,
    };
  });

  try {
    const res = await fetch('/api/ai/bulk-expenses', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        entries: entriesPayload,
        categories,
        accounts,
      }),
    });

    if (res.ok) {
      const json = await res.json();
      if (json.success && Array.isArray(json.data) && json.data.length > 0) {
        return json.data.map((item: any, idx: number) => {
          const original = entries[idx] || entries[0];
          // Match account back
          const matchedAcc =
            accounts.find(
              (a) => a.name.toLowerCase() === (item.accountName || '').toLowerCase()
            ) ||
            accountMap.get(original.accountId) ||
            accounts[0];

          // Match category and sub-category
          const matchedCat =
            categories.find(
              (c) => c.name.toLowerCase() === (item.category || '').toLowerCase()
            ) || categories[0];

          let matchedSub = item.subCategory || '';
          if (matchedCat && matchedSub) {
            const subExists = matchedCat.subCategories.find(
              (s) => s.name.toLowerCase() === matchedSub.toLowerCase()
            );
            if (subExists) matchedSub = subExists.name;
          }

          return {
            id: original?.id || `processed-${Date.now()}-${idx}`,
            originalText: original?.forText || item.rephrasedTitle,
            rephrasedTitle: item.rephrasedTitle || original.forText,
            amount: typeof item.amount === 'number' ? Math.abs(item.amount) : parseFloat(original.amount) || 0,
            accountId: matchedAcc?.id || accounts[0]?.id || '',
            accountName: matchedAcc?.name || 'Cash',
            category: matchedCat?.name || 'Personal',
            subCategory: matchedSub || undefined,
            date: item.date || original.date || new Date().toISOString().split('T')[0],
            explanation: item.explanation || 'Cleaned and auto-categorized by AI',
          };
        });
      }
    }
  } catch (err) {
    console.warn('Network call to /api/ai/bulk-expenses failed, using smart local categorizer fallback:', err);
  }

  // Fallback: Local rule-based categorizer and text cleaner
  return entries.map((entry) => {
    const pred = predictCategoryFromDescription(entry.forText, categories);
    const acc = accountMap.get(entry.accountId) || accounts[0];

    return {
      id: entry.id,
      originalText: entry.forText,
      rephrasedTitle: localCleanTitle(entry.forText),
      amount: parseFloat(entry.amount) || 0,
      accountId: acc?.id || '',
      accountName: acc?.name || 'Cash',
      category: pred?.category || 'Personal',
      subCategory: pred?.subCategory,
      date: entry.date || new Date().toISOString().split('T')[0],
      explanation: pred?.explanation || 'Local intelligent rule match',
    };
  });
}

/**
 * Rephrase follow-up, wishlist, or note with AI or local engine (including checklist extraction)
 */
export async function rephraseItemWithAI(params: {
  text: string;
  type: 'followup' | 'wishlist' | 'note';
  notes?: string;
  category?: string;
  priority?: string;
  dueDate?: string;
  categoriesList?: string[];
}): Promise<RephraseResult> {
  const { text, type, notes, category, priority, dueDate, categoriesList } = params;

  try {
    const res = await fetch('/api/ai/rephrase', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text,
        type,
        notes,
        category,
        priority,
        dueDate,
        categoriesList,
      }),
    });

    if (res.ok) {
      const json = await res.json();
      if (json.success && json.data && json.data.rephrasedTitle) {
        return {
          rephrasedTitle: json.data.rephrasedTitle,
          checklistItems: Array.isArray(json.data.checklistItems) ? json.data.checklistItems : undefined,
          rephrasedNotes: json.data.rephrasedNotes || notes,
          suggestedCategory: json.data.suggestedCategory || category,
          suggestedPriority: (json.data.suggestedPriority as any) || priority,
          suggestedDueDate: json.data.suggestedDueDate || dueDate,
          explanation: json.data.explanation || 'Enhanced with Gemini AI',
        };
      }
    }
  } catch (err) {
    console.warn('Network call to /api/ai/rephrase failed, using local engine:', err);
  }

  // Local rule-based fallback
  let cleanedTitle = text.trim();
  cleanedTitle = cleanedTitle.charAt(0).toUpperCase() + cleanedTitle.slice(1);

  // Suggest priority if obvious
  let sugPriority: 'high' | 'medium' | 'low' = (priority as any) || 'medium';
  const lower = text.toLowerCase();
  if (lower.includes('urgent') || lower.includes('asap') || lower.includes('important')) {
    sugPriority = 'high';
  } else if (lower.includes('low') || lower.includes('later') || lower.includes('eventually')) {
    sugPriority = 'low';
  }

  // Check if sentences or bullet points exist to create checklist items
  let fallbackChecklist: string[] | undefined = undefined;
  const sentenceParts = text
    .split(/(?:\. |\n|; |First |Then |After |If )/)
    .map((s) => s.trim())
    .filter((s) => s.length > 5);
  if (sentenceParts.length > 1) {
    fallbackChecklist = sentenceParts.map((s) => s.charAt(0).toUpperCase() + s.slice(1));
  }

  return {
    rephrasedTitle: cleanedTitle,
    checklistItems: fallbackChecklist,
    rephrasedNotes: notes,
    suggestedCategory: category || 'Personal',
    suggestedPriority: sugPriority,
    suggestedDueDate: dueDate,
    explanation: 'Grammar and phrasing cleaned up',
  };
}

/**
 * AI Auto-Detect for the "+" Button: plain natural language to any module
 */
export async function autoDetectEntryWithAI(
  input: string,
  categories: CategoryItem[],
  accounts: Account[]
): Promise<AutoDetectResult> {
  try {
    const res = await fetch('/api/ai/auto-detect', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ input, categories, accounts }),
    });

    if (res.ok) {
      const json = await res.json();
      if (json.success && json.data && json.data.detectedType) {
        const d = json.data;
        // Match account ID
        const matchedAcc = accounts.find(
          (a) => a.name.toLowerCase() === (d.accountName || '').toLowerCase()
        ) || accounts[0];

        return {
          detectedType: d.detectedType,
          transactionType: d.transactionType || 'expense',
          title: d.title || input,
          amount: typeof d.amount === 'number' ? Math.abs(d.amount) : undefined,
          accountName: matchedAcc?.name || 'Cash',
          accountId: matchedAcc?.id,
          category: d.category || 'Personal',
          subCategory: d.subCategory || undefined,
          date: d.date || new Date().toISOString().split('T')[0],
          priority: d.priority || 'medium',
          counterpartyName: d.counterpartyName,
          loanType: d.loanType || 'lent',
          checklistItems: Array.isArray(d.checklistItems) ? d.checklistItems : undefined,
          explanation: d.explanation || 'Auto-detected by AI',
        };
      }
    }
  } catch (err) {
    console.warn('Network call to /api/ai/auto-detect failed, using smart local categorizer fallback:', err);
  }

  // >>> REPLACE YOUR OLD PARSER HERE <<<
  // Universal offline classifier & multi-entry extractor
  const parsed = extractFields(input, classifyEntry(input));
  const today = parsed.date || new Date().toISOString().split('T')[0];

  // Match account
  const matchedAcc =
    accounts.find((a) =>
      parsed.account ? a.name.toLowerCase().includes(parsed.account.toLowerCase()) : false
    ) || accounts[0];

  // Predict category
  const pred = predictCategoryFromDescription(input, categories);

  if (parsed.type === 'loan_out' || parsed.type === 'loan_in') {
    return {
      detectedType: 'loan',
      loanType: parsed.type === 'loan_in' ? 'borrowed' : 'lent',
      title: parsed.notes || input,
      amount: parsed.amount || 100,
      counterpartyName: parsed.person || 'Friend / Contact',
      date: today,
      explanation: `Detected loan (${parsed.type === 'loan_in' ? 'borrowed' : 'lent'}) for ${parsed.person || 'contact'}`,
    };
  }

  if (parsed.type === 'expense') {
    return {
      detectedType: 'transaction',
      transactionType: 'expense',
      title: parsed.item || localCleanTitle(input),
      amount: parsed.amount || 0,
      accountName: matchedAcc?.name || 'Cash',
      accountId: matchedAcc?.id,
      category: pred?.category || 'Car',
      subCategory: pred?.subCategory || 'Fuel',
      date: today,
      explanation: 'Detected expense payment',
    };
  }

  if (parsed.type === 'wishlist') {
    return {
      detectedType: 'wishlist',
      title: parsed.item || localCleanTitle(input),
      amount: parsed.amount || 500,
      category: pred?.category || 'Personal',
      priority: parsed.priority || 'medium',
      date: today,
      explanation: 'Detected wishlist goal',
    };
  }

  if (parsed.type === 'diagnose') {
    return {
      detectedType: 'followup',
      title: parsed.target ? `Diagnose ${parsed.target}` : localCleanTitle(input),
      category: 'Personal',
      date: today,
      priority: 'high',
      checklistItems: parsed.notes ? [parsed.notes] : undefined,
      explanation: 'Detected equipment / appliance diagnostic check',
    };
  }

  // Default to follow-up task
  return {
    detectedType: 'followup',
    title: localCleanTitle(input),
    category: pred?.category || 'Personal',
    date: today,
    priority: input.toLowerCase().includes('urgent') ? 'high' : 'medium',
    explanation: 'Detected action task / reminder',
  };
}

/**
 * AI Suggestion inside forms (e.g. Wishlist Goal form: Title, Realistic Price, Priority, Category)
 */
export async function suggestItemWithAI(params: {
  type: string;
  title: string;
  currentPrice?: number;
  currentPriority?: string;
  currentCategory?: string;
  notes?: string;
  categories: CategoryItem[];
}): Promise<SuggestItemResult> {
  try {
    const res = await fetch('/api/ai/suggest-item', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });

    if (res.ok) {
      const json = await res.json();
      if (json.success && json.data && json.data.rephrasedTitle) {
        return json.data;
      }
    }
  } catch (err) {
    console.warn('Network call to /api/ai/suggest-item failed, using local heuristics:', err);
  }

  // Local fallback
  const pred = predictCategoryFromDescription(params.title, params.categories);
  const cleanTitle = localCleanTitle(params.title);

  // Realistic price benchmark estimation in SAR if missing
  let estimated = params.currentPrice || 0;
  if (!estimated) {
    const l = params.title.toLowerCase();
    if (l.includes('car seat') || l.includes('seat cover')) estimated = 320;
    else if (l.includes('tyre') || l.includes('tire')) estimated = 450;
    else if (l.includes('dashcam') || l.includes('camera')) estimated = 350;
    else if (l.includes('washing machine')) estimated = 1900;
    else if (l.includes('phone') || l.includes('iphone')) estimated = 3800;
    else if (l.includes('laptop')) estimated = 3200;
    else estimated = 250;
  }

  return {
    rephrasedTitle: cleanTitle,
    suggestedPrice: estimated,
    suggestedPriority: (params.currentPriority as any) || 'medium',
    suggestedCategory: pred?.category || params.currentCategory || 'Car',
    suggestedSubCategory: pred?.subCategory,
    explanation: 'Suggested realistic pricing and cleaned title',
  };
}

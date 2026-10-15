import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Sparkles,
  Check,
  CheckCircle2,
  Calendar,
  Wallet,
  HandCoins,
  CheckSquare,
  Gift,
  FileText,
  AlertCircle,
  Plus,
  Trash2,
  Wrench,
  Edit2,
  CornerDownRight,
  Info,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { triggerHaptic } from '../../utils/haptics';
import { parseAll, ParsedEntry, EntryType } from '../../utils/parser';
import { saveWishlistToIDB, idbPut, STORES } from '../../utils/indexedDB';
import confetti from 'canvas-confetti';

interface AIAutoDetectModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AIAutoDetectModal: React.FC<AIAutoDetectModalProps> = ({
  isOpen,
  onClose,
}) => {
  const {
    accounts,
    categories,
    settings,
    addTransaction,
    addFollowUp,
    addWishlistItem,
    addLoan,
  } = useApp();

  const [inputText, setInputText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [parsedEntries, setParsedEntries] = useState<ParsedEntry[]>([]);
  const [isConfirming, setIsConfirming] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (isOpen) {
      setInputText('');
      setParsedEntries([]);
      setIsConfirming(false);
      setIsEditMode(false);
      setErrorMessage(null);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Run parser
  const handleParse = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const text = inputText.trim();
    if (!text) {
      setErrorMessage('Please type or paste what you would like to record.');
      return;
    }

    setIsProcessing(true);
    setErrorMessage(null);
    triggerHaptic('medium', settings.enableHaptics);

    try {
      const results = parseAll(text);
      if (results.length === 0) {
        setErrorMessage('Could not detect any entries. Please try with trigger words like Paid, Lent, Diagnose, or Wishlist.');
        setIsProcessing(false);
        return;
      }

      setParsedEntries(results);
      setIsConfirming(true);
      setIsEditMode(false);
      triggerHaptic('success', settings.enableHaptics);
    } catch (err: any) {
      setErrorMessage('Parser error: ' + (err?.message || 'Unable to parse input'));
    } finally {
      setIsProcessing(false);
    }
  };

  // Entry counts for summary prompt
  const expenseCount = parsedEntries.filter((e) => e.type === 'expense').length;
  const loanCount = parsedEntries.filter((e) => e.type === 'loan_out' || e.type === 'loan_in').length;
  const diagnoseCount = parsedEntries.filter((e) => e.type === 'diagnose').length;
  const wishlistCount = parsedEntries.filter((e) => e.type === 'wishlist').length;

  // Edit single field in parsed list
  const updateEntryField = (index: number, field: keyof ParsedEntry, value: any) => {
    setParsedEntries((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      return next;
    });
  };

  // Remove single entry from preview list
  const removeEntry = (index: number) => {
    setParsedEntries((prev) => prev.filter((_, i) => i !== index));
    triggerHaptic('light', settings.enableHaptics);
  };

  // Save all confirmed entries to IndexedDB & AppContext
  const handleConfirmSaveAll = async () => {
    if (parsedEntries.length === 0) {
      setErrorMessage('No entries left to save.');
      return;
    }

    setIsProcessing(true);
    triggerHaptic('medium', settings.enableHaptics);

    try {
      for (const entry of parsedEntries) {
        const amt = entry.amount || 0;
        const curDate = entry.date || new Date().toISOString().split('T')[0];

        // 1. Expense
        if (entry.type === 'expense') {
          const matchedAcc =
            accounts.find((a) =>
              entry.account ? a.name.toLowerCase().includes(entry.account.toLowerCase()) : false
            ) || accounts[0];

          const isFuel = entry.raw.toLowerCase().includes('fuel') || entry.raw.toLowerCase().includes('car');
          const txCategory = isFuel ? 'Car' : 'Personal';
          const txSubCategory = isFuel ? 'Fuel' : undefined;

          addTransaction({
            type: 'expense',
            amountSAR: amt,
            category: txCategory,
            subCategory: txSubCategory,
            accountId: matchedAcc?.id || '',
            note: entry.item || entry.raw,
            date: curDate,
          });

          // Save to IndexedDB
          await idbPut(STORES.TRANSACTIONS, {
            id: `tx_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
            type: 'expense',
            amount: amt,
            currency: entry.currency || 'SAR',
            account: matchedAcc?.name || 'Cash',
            item: entry.item || entry.raw,
            category: txCategory,
            date: curDate,
            createdAt: new Date().toISOString(),
          });
        }

        // 2. Loans (out / in)
        else if (entry.type === 'loan_out' || entry.type === 'loan_in') {
          const loanType = entry.type === 'loan_in' ? 'borrowed' : 'lent';
          const person = entry.person || 'Contact';

          addLoan({
            type: loanType,
            counterpartyName: person,
            amountSAR: amt || 100,
            dueDate: entry.dueDate || curDate,
            notes: entry.notes || entry.raw,
          });

          // Save to IndexedDB
          await idbPut(STORES.LOANS, {
            id: `loan_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
            type: loanType,
            person,
            amount: amt || 100,
            currency: entry.currency || 'SAR',
            dueDate: entry.dueDate,
            notes: entry.notes || entry.raw,
            date: curDate,
            createdAt: new Date().toISOString(),
          });
        }

        // 3. Diagnose (Equipment, Appliance, Car Diagnostics)
        else if (entry.type === 'diagnose') {
          const diagTitle = entry.target ? `Diagnose ${entry.target}` : 'Diagnostics Task';
          const notesText = entry.notes || entry.raw;

          addFollowUp({
            title: diagTitle,
            category: 'Personal',
            dueDate: curDate,
            priority: 'high',
            notes: notesText,
          });

          // Save to IndexedDB
          await idbPut(STORES.DIAGNOSTICS, {
            id: `diag_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
            target: entry.target || 'General Equipment',
            notes: notesText,
            status: 'pending',
            date: curDate,
            createdAt: new Date().toISOString(),
          });
        }

        // 4. Wishlist Goal
        else if (entry.type === 'wishlist') {
          const itemName = entry.item || 'Wishlist Item';

          addWishlistItem({
            title: itemName,
            estimatedPriceSAR: amt,
            savedAmountSAR: 0,
            category: 'Personal',
            priority: entry.priority || 'medium',
            notes: entry.notes,
          });

          // Save to IndexedDB wishlist store
          await saveWishlistToIDB({
            id: `wl_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
            itemName,
            estimatedPrice: amt,
            currency: entry.currency || 'SAR',
            notes: entry.notes,
            priority: entry.priority || 'medium',
            isPurchased: false,
            createdAt: new Date().toISOString(),
          });
        }
      }

      triggerHaptic('success', settings.enableHaptics);
      confetti({
        particleCount: 60,
        spread: 70,
        origin: { y: 0.7 },
      });

      onClose();
    } catch (err: any) {
      console.error('Error saving parsed entries:', err);
      setErrorMessage('Failed to save entries to database: ' + err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const getTypeBadge = (type: EntryType) => {
    switch (type) {
      case 'expense':
        return {
          label: 'Expense',
          icon: '💸',
          color: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border-emerald-300',
        };
      case 'loan_out':
        return {
          label: 'Loan (Out)',
          icon: '🤝',
          color: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300 border-indigo-300',
        };
      case 'loan_in':
        return {
          label: 'Loan (In)',
          icon: '📥',
          color: 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 border-blue-300',
        };
      case 'diagnose':
        return {
          label: 'Diagnose',
          icon: '🔧',
          color: 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 border-rose-300',
        };
      case 'wishlist':
        return {
          label: 'Wishlist',
          icon: '⭐',
          color: 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border-amber-300',
        };
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
    >
      <div className="w-full max-w-lg glass-panel rounded-3xl shadow-2xl border border-white/60 dark:border-white/10 flex flex-col max-h-[92vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-slate-200/50 dark:border-slate-800/50 bg-white/40 dark:bg-slate-900/40">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-purple-600 via-indigo-600 to-amber-500 text-white flex items-center justify-center shadow-md shadow-purple-500/20">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-800 dark:text-slate-100">
                Quick Record & Natural Input
              </h2>
              <p className="text-[11px] text-purple-600 dark:text-purple-400 font-medium">
                Multi-Entry Parser · Offline-First Engine
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-4 flex-1">
          {errorMessage && (
            <div className="p-3 rounded-2xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900/60 flex items-center gap-2 text-rose-700 dark:text-rose-300 text-xs">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {!isConfirming ? (
            /* Phase 1: Input Box with textarea */
            <div className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  What would you like to record?
                </label>
                <textarea
                  ref={inputRef}
                  rows={5}
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder={`Paid 150 SAR for car fuel from salary account today\nDiagnose washing machine error code E20 check drain filter\nLent 500 SAR to Ahmed for car repair return next month\nWishlist buy iPhone 16 Pro Max around 4500 SAR`}
                  className="w-full p-3.5 text-xs rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-purple-500/30 text-slate-900 dark:text-white leading-relaxed font-sans placeholder:text-slate-400"
                />
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1.5 flex items-center gap-1">
                  <Info className="w-3.5 h-3.5 text-purple-500 shrink-0" />
                  <span>You can add multiple entries in one line — separate them with commas or 'and'.</span>
                </p>
              </div>

              {/* Quick Inspiration Chips */}
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1.5">
                  Tap Examples to Test Parser:
                </span>
                <div className="flex flex-col gap-1.5">
                  {[
                    {
                      label: 'Multi-entry (8 items: Expense, Loan, Diagnose, Wishlist)',
                      text: 'Paid 150 SAR for car fuel from Cash today, and diagnose washing machine error code E20 check drain filter, also Lent 500 SAR to Ahmed for car repair return next month, wishlist buy iPhone 16 Pro Max around 4500 SAR, and Lent 1000 SAR to brother return by end of Ramadan, plus Paid 89.50 SAR for groceries from Salary account yesterday, also Wishlist buy custom car seat cover around 300 SAR, and Diagnose AC not cooling check gas pressure and filter.',
                    },
                    {
                      label: 'Mixed short (3 items)',
                      text: 'Paid 45 SAR coffee from Cash, Lent 750 SAR to Sara, Wishlist gaming chair 900 SAR',
                    },
                    {
                      label: 'Diagnose washing machine error code E20',
                      text: 'Diagnose washing machine error code E20 check drain filter',
                    },
                    {
                      label: 'Wishlist buy iPhone 16 Pro Max around 4500 SAR',
                      text: 'Wishlist buy iPhone 16 Pro Max around 4500 SAR',
                    },
                  ].map((example, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setInputText(example.text)}
                      className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800/70 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 text-[11px] text-left transition-colors flex items-start gap-2 border border-slate-200/50 dark:border-slate-700/50"
                    >
                      <CornerDownRight className="w-3.5 h-3.5 text-purple-500 shrink-0 mt-0.5" />
                      <div>
                        <strong className="block text-slate-800 dark:text-slate-200 font-semibold">{example.label}</strong>
                        <span className="text-[10px] text-slate-500 dark:text-slate-400 line-clamp-1">{example.text}</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            /* Phase 2: Confirmation Prompt BEFORE Saving */
            <div className="space-y-4 animate-in fade-in duration-200">
              {/* Summary Prompt Header */}
              <div className="p-4 rounded-2xl bg-gradient-to-r from-purple-500/10 via-indigo-500/10 to-amber-500/10 border border-purple-200 dark:border-purple-800">
                <h3 className="text-xs font-bold text-slate-800 dark:text-slate-100 mb-2">
                  I found {parsedEntries.length} {parsedEntries.length === 1 ? 'entry' : 'entries'}:
                </h3>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="flex items-center gap-1.5 text-emerald-700 dark:text-emerald-300 font-medium">
                    <span>💸 Expenses:</span>
                    <strong className="tabular-nums">{expenseCount}</strong>
                  </div>
                  <div className="flex items-center gap-1.5 text-indigo-700 dark:text-indigo-300 font-medium">
                    <span>🤝 Loans:</span>
                    <strong className="tabular-nums">{loanCount}</strong>
                  </div>
                  <div className="flex items-center gap-1.5 text-rose-700 dark:text-rose-300 font-medium">
                    <span>🔧 Diagnostics:</span>
                    <strong className="tabular-nums">{diagnoseCount}</strong>
                  </div>
                  <div className="flex items-center gap-1.5 text-amber-700 dark:text-amber-300 font-medium">
                    <span>⭐ Wishlist:</span>
                    <strong className="tabular-nums">{wishlistCount}</strong>
                  </div>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-2.5">
                  Save all to your offline hub? You can confirm directly, edit individual details, or cancel.
                </p>
              </div>

              {/* Parsed Entries List */}
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    Review Extracted Items ({parsedEntries.length})
                  </span>
                  <button
                    type="button"
                    onClick={() => setIsEditMode(!isEditMode)}
                    className="text-[11px] font-semibold text-purple-600 dark:text-purple-400 flex items-center gap-1 hover:underline"
                  >
                    <Edit2 className="w-3 h-3" />
                    <span>{isEditMode ? 'Done Editing' : 'Edit Entries'}</span>
                  </button>
                </div>

                {parsedEntries.map((entry, idx) => {
                  const badge = getTypeBadge(entry.type);

                  return (
                    <div
                      key={idx}
                      className="p-3 rounded-2xl bg-white dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/80 shadow-xs space-y-2"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span
                            className={`px-2 py-0.5 rounded-lg text-[10px] font-bold border flex items-center gap-1 ${badge.color}`}
                          >
                            <span>{badge.icon}</span>
                            <span>{badge.label}</span>
                          </span>

                          {entry.amount !== undefined && (
                            <span className="text-xs font-bold text-slate-900 dark:text-white tabular-nums">
                              {entry.amount} {entry.currency}
                            </span>
                          )}

                          {entry.account && (
                            <span className="text-[10px] px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                              From: {entry.account}
                            </span>
                          )}

                          {entry.person && (
                            <span className="text-[10px] px-2 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 font-medium">
                              Person: {entry.person}
                            </span>
                          )}
                        </div>

                        <button
                          type="button"
                          onClick={() => removeEntry(idx)}
                          className="text-slate-400 hover:text-rose-500 p-1"
                          title="Remove this entry"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {/* Display item / target / notes */}
                      {!isEditMode ? (
                        <div className="text-xs text-slate-700 dark:text-slate-300 space-y-1">
                          {(entry.item || entry.target) && (
                            <p>
                              <strong className="text-slate-900 dark:text-white">
                                {entry.item || entry.target}
                              </strong>
                            </p>
                          )}
                          {entry.notes && (
                            <p className="text-[11px] text-slate-500 dark:text-slate-400">
                              Notes: {entry.notes}
                            </p>
                          )}
                          {entry.dueDate && (
                            <p className="text-[11px] text-indigo-600 dark:text-indigo-400 font-medium">
                              Due: {entry.dueDate}
                            </p>
                          )}
                          <p className="text-[10px] text-slate-400">
                            Date: {entry.date}
                          </p>
                        </div>
                      ) : (
                        /* Inline Edit Fields */
                        <div className="space-y-2 pt-1 border-t border-slate-100 dark:border-slate-700/50 text-xs">
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <label className="text-[10px] text-slate-400 block mb-0.5">Title / Target</label>
                              <input
                                type="text"
                                value={entry.item || entry.target || ''}
                                onChange={(e) => updateEntryField(idx, 'item', e.target.value)}
                                className="w-full px-2 py-1 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs"
                              />
                            </div>
                            <div>
                              <label className="text-[10px] text-slate-400 block mb-0.5">Amount ({entry.currency})</label>
                              <input
                                type="number"
                                value={entry.amount !== undefined ? entry.amount : ''}
                                onChange={(e) => updateEntryField(idx, 'amount', parseFloat(e.target.value) || 0)}
                                className="w-full px-2 py-1 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs"
                              />
                            </div>
                          </div>

                          <div>
                            <label className="text-[10px] text-slate-400 block mb-0.5">Notes / Details</label>
                            <input
                              type="text"
                              value={entry.notes || ''}
                              onChange={(e) => updateEntryField(idx, 'notes', e.target.value)}
                              className="w-full px-2 py-1 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs"
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 sm:p-5 border-t border-slate-200/50 dark:border-slate-800/50 bg-white/40 dark:bg-slate-900/40 flex items-center justify-between gap-3">
          {!isConfirming ? (
            <>
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 text-xs font-semibold hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleParse}
                disabled={isProcessing || !inputText.trim()}
                className="flex-1 max-w-xs py-2.5 px-4 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white text-xs font-semibold shadow-md shadow-purple-600/20 flex items-center justify-center gap-2 active:scale-98 transition-all disabled:opacity-50"
              >
                {isProcessing ? (
                  <span>Processing...</span>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>Parse & Detect Entries</span>
                  </>
                )}
              </button>
            </>
          ) : (
            /* Confirmation prompt buttons: Save all? [Yes] [Edit] [Cancel] */
            <div className="w-full flex items-center justify-between gap-2">
              <button
                type="button"
                onClick={() => setIsConfirming(false)}
                className="px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 text-xs font-semibold hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                Cancel
              </button>

              <div className="flex items-center gap-2 flex-1 justify-end">
                <button
                  type="button"
                  onClick={() => setIsEditMode(!isEditMode)}
                  className="px-3.5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors flex items-center gap-1.5"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                  <span>{isEditMode ? 'Done' : 'Edit'}</span>
                </button>

                <button
                  type="button"
                  onClick={handleConfirmSaveAll}
                  disabled={isProcessing || parsedEntries.length === 0}
                  className="py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-md shadow-emerald-600/20 flex items-center justify-center gap-1.5 active:scale-98 transition-all disabled:opacity-50"
                >
                  <Check className="w-4 h-4" />
                  <span>Yes, Save All ({parsedEntries.length})</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

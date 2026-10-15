import React, { useState, useRef, useEffect } from 'react';
import {
  X,
  Sparkles,
  Plus,
  Trash2,
  CheckCircle2,
  Calendar,
  Wallet,
  ArrowRight,
  Layers,
  AlertCircle,
  Edit2,
  FileText,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import {
  RawBulkExpenseInput,
  ProcessedExpenseEntry,
  processBulkExpenses,
} from '../../services/aiService';
import { triggerHaptic } from '../../utils/haptics';
import { formatCurrency } from '../../utils/currency';
import confetti from 'canvas-confetti';

interface AIBulkExpensesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AIBulkExpensesModal: React.FC<AIBulkExpensesModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { accounts, categories, settings, addTransaction } = useApp();

  const [step, setStep] = useState<'input' | 'preview'>('input');
  const [inputMode, setInputMode] = useState<'stepper' | 'text'>('stepper');

  // Staged entries for batch processing
  const [stagedEntries, setStagedEntries] = useState<RawBulkExpenseInput[]>([]);

  // Current single entry fields
  const [currentForText, setCurrentForText] = useState('');
  const [currentAmount, setCurrentAmount] = useState('');
  const [currentAccountId, setCurrentAccountId] = useState(accounts[0]?.id || '');
  const [currentDate, setCurrentDate] = useState(
    new Date().toISOString().split('T')[0]
  );

  // Multi-line text input fallback
  const [rawTextBlock, setRawTextBlock] = useState('');

  // Processing state
  const [isProcessing, setIsProcessing] = useState(false);
  const [processedEntries, setProcessedEntries] = useState<ProcessedExpenseEntry[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const forInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setStep('input');
      setErrorMessage(null);
      if (accounts[0] && !currentAccountId) {
        setCurrentAccountId(accounts[0].id);
      }
      setTimeout(() => forInputRef.current?.focus(), 100);
    }
  }, [isOpen, accounts]);

  if (!isOpen) return null;

  const todayStr = new Date().toISOString().split('T')[0];
  const yesterdayStr = new Date(Date.now() - 86400000).toISOString().split('T')[0];

  // Add the current typed entry to staged list and reset fields for the next one
  const handleAddCurrentEntry = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!currentForText.trim()) {
      setErrorMessage('Please type what the expense is for.');
      return;
    }
    const amtNum = parseFloat(currentAmount);
    if (isNaN(amtNum) || amtNum <= 0) {
      setErrorMessage('Please enter a valid expense amount.');
      return;
    }

    const newEntry: RawBulkExpenseInput = {
      id: `bulk-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      forText: currentForText.trim(),
      amount: currentAmount.trim(),
      accountId: currentAccountId || accounts[0]?.id || '',
      date: currentDate || todayStr,
    };

    setStagedEntries((prev) => [...prev, newEntry]);
    setCurrentForText('');
    setCurrentAmount('');
    setErrorMessage(null);
    triggerHaptic('light', settings.enableHaptics);

    // Keep focus ready for next entry
    setTimeout(() => forInputRef.current?.focus(), 50);
  };

  const handleRemoveStaged = (id: string) => {
    setStagedEntries((prev) => prev.filter((e) => e.id !== id));
    triggerHaptic('light', settings.enableHaptics);
  };

  // Parse multi-line text if user used text mode
  const handleParseTextMode = () => {
    if (!rawTextBlock.trim()) return;
    const lines = rawTextBlock
      .split('\n')
      .map((l) => l.trim())
      .filter((l) => l.length > 0);

    const parsed: RawBulkExpenseInput[] = [];

    lines.forEach((line, idx) => {
      // Split by comma or semicolon
      const parts = line.split(/[,;]/).map((p) => p.trim());
      const forVal = parts[0] || 'Expense';
      let amtVal = '0';
      let accVal = currentAccountId || accounts[0]?.id || '';
      let dateVal = todayStr;

      if (parts[1]) {
        const numMatch = parts[1].match(/[\d.]+/);
        if (numMatch) amtVal = numMatch[0];
      }
      if (parts[2]) {
        const foundAcc = accounts.find((a) =>
          a.name.toLowerCase().includes(parts[2].toLowerCase())
        );
        if (foundAcc) accVal = foundAcc.id;
      }
      if (parts[3]) {
        if (parts[3].toLowerCase() === 'yesterday') dateVal = yesterdayStr;
        else if (parts[3].match(/^\d{4}-\d{2}-\d{2}$/)) dateVal = parts[3];
      }

      parsed.push({
        id: `text-${Date.now()}-${idx}`,
        forText: forVal,
        amount: amtVal,
        accountId: accVal,
        date: dateVal,
      });
    });

    setStagedEntries((prev) => [...prev, ...parsed]);
    setRawTextBlock('');
    setInputMode('stepper');
  };

  // Run AI processing
  const handleProcessWithAI = async () => {
    // If user currently has un-added text in the inputs, add it first!
    let allEntries = [...stagedEntries];
    if (currentForText.trim() && parseFloat(currentAmount) > 0) {
      allEntries.push({
        id: `bulk-${Date.now()}-last`,
        forText: currentForText.trim(),
        amount: currentAmount.trim(),
        accountId: currentAccountId || accounts[0]?.id || '',
        date: currentDate || todayStr,
      });
      setStagedEntries(allEntries);
      setCurrentForText('');
      setCurrentAmount('');
    }

    if (allEntries.length === 0) {
      setErrorMessage('Add at least one expense entry before processing.');
      return;
    }

    setIsProcessing(true);
    setErrorMessage(null);
    triggerHaptic('medium', settings.enableHaptics);

    try {
      const results = await processBulkExpenses(allEntries, categories, accounts);
      setProcessedEntries(results);
      setStep('preview');
      triggerHaptic('success', settings.enableHaptics);
    } catch (err: any) {
      setErrorMessage('AI processing failed. You can still review and save below.');
    } finally {
      setIsProcessing(false);
    }
  };

  // Update a single item in the preview list
  const handleUpdatePreviewItem = (
    id: string,
    field: keyof ProcessedExpenseEntry,
    value: any
  ) => {
    setProcessedEntries((prev) =>
      prev.map((item) => {
        if (item.id !== id) return item;

        if (field === 'accountId') {
          const acc = accounts.find((a) => a.id === value);
          return { ...item, accountId: value, accountName: acc?.name || 'Cash' };
        }
        if (field === 'category') {
          return { ...item, category: value, subCategory: undefined };
        }
        return { ...item, [field]: value };
      })
    );
  };

  // Confirm and save all processed entries
  const handleConfirmSaveAll = () => {
    if (processedEntries.length === 0) return;

    processedEntries.forEach((entry) => {
      addTransaction({
        type: 'expense',
        amountSAR: entry.amount,
        category: entry.category,
        subCategory: entry.subCategory,
        accountId: entry.accountId,
        note: entry.rephrasedTitle,
        date: entry.date,
      });
    });

    triggerHaptic('success', settings.enableHaptics);
    confetti({
      particleCount: 50,
      spread: 60,
      origin: { y: 0.8 },
    });

    onClose();
  };

  const totalPreviewSAR = processedEntries.reduce((sum, e) => sum + (e.amount || 0), 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 w-full max-w-xl rounded-3xl shadow-2xl border border-slate-200/80 dark:border-slate-800 flex flex-col max-h-[92vh] overflow-hidden">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between shrink-0 bg-gradient-to-r from-purple-500/10 via-pink-500/5 to-transparent">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-purple-600 to-pink-500 text-white flex items-center justify-center shadow-xs">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <span>AI Bulk Expenses</span>
                <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300">
                  Multiple Entries
                </span>
              </h2>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                {step === 'input'
                  ? 'Type each expense, let AI rephrase and auto-categorize'
                  : 'Review & confirm rephrased entries before saving'}
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

          {/* ================= STEP 1: INPUT PHASE ================= */}
          {step === 'input' && (
            <div className="space-y-4">
              {/* Mode switch */}
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                  Entry Method
                </span>
                <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl text-xs">
                  <button
                    type="button"
                    onClick={() => setInputMode('stepper')}
                    className={`px-2.5 py-1 rounded-lg font-medium transition-colors ${
                      inputMode === 'stepper'
                        ? 'bg-white dark:bg-slate-700 text-purple-600 dark:text-purple-300 shadow-2xs font-semibold'
                        : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    Entry by Entry
                  </button>
                  <button
                    type="button"
                    onClick={() => setInputMode('text')}
                    className={`px-2.5 py-1 rounded-lg font-medium transition-colors ${
                      inputMode === 'text'
                        ? 'bg-white dark:bg-slate-700 text-purple-600 dark:text-purple-300 shadow-2xs font-semibold'
                        : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    Quick Text / Paste
                  </button>
                </div>
              </div>

              {inputMode === 'stepper' ? (
                /* Interactive Entry Box */
                <form
                  onSubmit={handleAddCurrentEntry}
                  className="glass-card rounded-2xl p-4 border border-purple-200/70 dark:border-purple-800/50 space-y-3 bg-purple-500/5"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-purple-700 dark:text-purple-300">
                      New Expense Entry
                    </span>
                    <span className="text-[10px] text-slate-400">
                      Press Enter or tap Add & Next
                    </span>
                  </div>

                  {/* 1. What expense is for */}
                  <div>
                    <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-300 mb-1">
                      1. What was the expense for?
                    </label>
                    <input
                      ref={forInputRef}
                      type="text"
                      value={currentForText}
                      onChange={(e) => setCurrentForText(e.target.value)}
                      placeholder="e.g. Car fuel 91, Panda groceries, Oil change..."
                      className="w-full px-3 py-2 text-xs rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-purple-500/30 text-slate-900 dark:text-white"
                    />
                  </div>

                  {/* 2. Amount & Account */}
                  <div className="grid grid-cols-2 gap-2.5">
                    <div>
                      <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-300 mb-1">
                        2. How much? (SAR)
                      </label>
                      <input
                        type="number"
                        step="any"
                        value={currentAmount}
                        onChange={(e) => setCurrentAmount(e.target.value)}
                        placeholder="e.g. 120"
                        className="w-full px-3 py-2 text-xs rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-purple-500/30 text-slate-900 dark:text-white font-semibold"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-300 mb-1">
                        3. From Account
                      </label>
                      <select
                        value={currentAccountId}
                        onChange={(e) => setCurrentAccountId(e.target.value)}
                        className="w-full px-3 py-2 text-xs rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-purple-500/30 text-slate-900 dark:text-white"
                      >
                        {accounts.map((acc) => (
                          <option key={acc.id} value={acc.id}>
                            {acc.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* 4. Date */}
                  <div>
                    <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-300 mb-1">
                      4. Date
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="date"
                        value={currentDate}
                        onChange={(e) => setCurrentDate(e.target.value)}
                        className="flex-1 px-3 py-2 text-xs rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-purple-500/30 text-slate-900 dark:text-white"
                      />
                      <button
                        type="button"
                        onClick={() => setCurrentDate(todayStr)}
                        className={`px-2.5 py-1.5 rounded-xl text-[10px] font-semibold border ${
                          currentDate === todayStr
                            ? 'bg-purple-100 text-purple-700 border-purple-300 dark:bg-purple-900 dark:text-purple-200'
                            : 'bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-400'
                        }`}
                      >
                        Today
                      </button>
                      <button
                        type="button"
                        onClick={() => setCurrentDate(yesterdayStr)}
                        className={`px-2.5 py-1.5 rounded-xl text-[10px] font-semibold border ${
                          currentDate === yesterdayStr
                            ? 'bg-purple-100 text-purple-700 border-purple-300 dark:bg-purple-900 dark:text-purple-200'
                            : 'bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-400'
                        }`}
                      >
                        Yesterday
                      </button>
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-xs transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Add Entry & Next</span>
                  </button>
                </form>
              ) : (
                /* Multi-line Quick Paste Box */
                <div className="space-y-2">
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Type or paste one expense per line. Format:{' '}
                    <code className="text-purple-600 dark:text-purple-400">
                      What it is, Amount, Account, Date
                    </code>
                  </p>
                  <textarea
                    rows={4}
                    value={rawTextBlock}
                    onChange={(e) => setRawTextBlock(e.target.value)}
                    placeholder="Car fuel 91, 110, Cash, today&#10;Room wifi bill, 250, SNB, yesterday&#10;Car oil change, 180, Cash, 2026-10-08"
                    className="w-full p-3 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-purple-500/30 text-slate-900 dark:text-white font-mono"
                  />
                  <button
                    type="button"
                    onClick={handleParseTextMode}
                    className="py-1.5 px-3 rounded-xl bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 text-slate-800 dark:text-white text-xs font-semibold"
                  >
                    Load into Staged List
                  </button>
                </div>
              )}

              {/* List of Staged Entries Ready to Process */}
              <div className="space-y-2 pt-2">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                    <span>Staged Entries</span>
                    <span className="px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-[10px] font-semibold text-slate-600 dark:text-slate-400">
                      {stagedEntries.length} ready
                    </span>
                  </h3>
                  {stagedEntries.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setStagedEntries([])}
                      className="text-[11px] text-rose-500 hover:underline"
                    >
                      Clear All
                    </button>
                  )}
                </div>

                {stagedEntries.length === 0 ? (
                  <div className="p-6 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 text-center text-xs text-slate-400">
                    No entries added yet. Fill in the form above and tap "Add Entry & Next".
                  </div>
                ) : (
                  <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
                    {stagedEntries.map((item, index) => {
                      const acc = accounts.find((a) => a.id === item.accountId);
                      return (
                        <div
                          key={item.id}
                          className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60 flex items-center justify-between gap-3 text-xs"
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <span className="w-5 h-5 rounded-full bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300 font-bold text-[10px] flex items-center justify-center shrink-0">
                              {index + 1}
                            </span>
                            <div className="min-w-0">
                              <p className="font-semibold text-slate-800 dark:text-slate-100 truncate">
                                {item.forText}
                              </p>
                              <div className="flex items-center gap-2 text-[10px] text-slate-400 mt-0.5">
                                <span>{acc?.name || 'Cash'}</span>
                                <span>·</span>
                                <span>{item.date}</span>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            <span className="font-bold text-slate-900 dark:text-white tabular-nums">
                              {item.amount} SAR
                            </span>
                            <button
                              type="button"
                              onClick={() => handleRemoveStaged(item.id)}
                              className="w-6 h-6 rounded-lg flex items-center justify-center text-slate-400 hover:text-rose-500"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ================= STEP 2: PREVIEW & CONFIRMATION PHASE ================= */}
          {step === 'preview' && (
            <div className="space-y-4">
              {/* Summary Bar */}
              <div className="p-3.5 rounded-2xl bg-gradient-to-r from-emerald-500/10 to-teal-500/10 border border-emerald-500/20 flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 dark:text-emerald-300">
                    AI Categorization Preview
                  </span>
                  <p className="text-xs text-slate-600 dark:text-slate-300">
                    Review and confirm before adding to accounts & categories.
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-emerald-700 dark:text-emerald-300 tabular-nums">
                    {formatCurrency(totalPreviewSAR, settings.displayCurrency, settings.exchangeRateSARtoINR)}
                  </p>
                  <span className="text-[10px] text-slate-400">
                    {processedEntries.length} entries
                  </span>
                </div>
              </div>

              {/* Clean Preview List */}
              <div className="space-y-3 max-h-[50vh] overflow-y-auto pr-1">
                {processedEntries.map((item, idx) => {
                  const currentCat = categories.find(
                    (c) => c.name.toLowerCase() === item.category.toLowerCase()
                  );
                  const availableSubs = currentCat?.subCategories || [];

                  return (
                    <div
                      key={item.id}
                      className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 space-y-2.5 transition-all"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          {/* Rephrased Title Editable */}
                          <div className="flex items-center gap-1.5">
                            <span className="w-4 h-4 rounded-full bg-purple-500 text-white text-[10px] font-bold flex items-center justify-center shrink-0">
                              {idx + 1}
                            </span>
                            <input
                              type="text"
                              value={item.rephrasedTitle}
                              onChange={(e) =>
                                handleUpdatePreviewItem(item.id, 'rephrasedTitle', e.target.value)
                              }
                              className="font-bold text-xs text-slate-900 dark:text-white bg-transparent border-b border-transparent hover:border-slate-300 focus:border-purple-500 focus:outline-none w-full"
                            />
                          </div>

                          {/* Original raw text comparison */}
                          {item.originalText && item.originalText !== item.rephrasedTitle && (
                            <p className="text-[10px] text-slate-400 ml-5 mt-0.5 line-through">
                              Original: {item.originalText}
                            </p>
                          )}
                        </div>

                        {/* Amount */}
                        <div className="shrink-0 flex items-center gap-1">
                          <input
                            type="number"
                            step="any"
                            value={item.amount}
                            onChange={(e) =>
                              handleUpdatePreviewItem(
                                item.id,
                                'amount',
                                parseFloat(e.target.value) || 0
                              )
                            }
                            className="w-16 px-1.5 py-0.5 text-xs font-bold text-right text-rose-600 dark:text-rose-400 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none"
                          />
                          <span className="text-[11px] font-semibold text-slate-500">
                            SAR
                          </span>
                        </div>
                      </div>

                      {/* Category & Sub-category Auto-selected selectors */}
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1 border-t border-slate-200/50 dark:border-slate-700/50 text-xs">
                        {/* Category */}
                        <div>
                          <label className="block text-[10px] font-semibold text-slate-400 mb-0.5">
                            Category
                          </label>
                          <select
                            value={item.category}
                            onChange={(e) =>
                              handleUpdatePreviewItem(item.id, 'category', e.target.value)
                            }
                            className="w-full px-2 py-1 text-[11px] font-medium rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 focus:outline-none"
                          >
                            {categories.map((c) => (
                              <option key={c.name} value={c.name}>
                                {c.name}
                              </option>
                            ))}
                          </select>
                        </div>

                        {/* Sub-Category (if available, e.g. Car -> Fuel, Maintenance, Cleaning) */}
                        <div>
                          <label className="block text-[10px] font-semibold text-slate-400 mb-0.5">
                            Sub-Category
                          </label>
                          <select
                            value={item.subCategory || ''}
                            onChange={(e) =>
                              handleUpdatePreviewItem(item.id, 'subCategory', e.target.value || undefined)
                            }
                            className="w-full px-2 py-1 text-[11px] font-medium rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 focus:outline-none"
                          >
                            <option value="">(None)</option>
                            {availableSubs.map((s) => (
                              <option key={s.name} value={s.name}>
                                {s.name}
                              </option>
                            ))}
                          </select>
                        </div>

                        {/* Account */}
                        <div>
                          <label className="block text-[10px] font-semibold text-slate-400 mb-0.5">
                            Account & Date
                          </label>
                          <div className="flex items-center gap-1">
                            <select
                              value={item.accountId}
                              onChange={(e) =>
                                handleUpdatePreviewItem(item.id, 'accountId', e.target.value)
                              }
                              className="flex-1 px-1.5 py-1 text-[11px] font-medium rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 focus:outline-none"
                            >
                              {accounts.map((acc) => (
                                <option key={acc.id} value={acc.id}>
                                  {acc.name}
                                </option>
                              ))}
                            </select>
                            <input
                              type="date"
                              value={item.date}
                              onChange={(e) =>
                                handleUpdatePreviewItem(item.id, 'date', e.target.value)
                              }
                              className="w-24 px-1 py-1 text-[10px] font-medium rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 focus:outline-none"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 sm:p-5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3 bg-slate-50/50 dark:bg-slate-900/50 shrink-0">
          {step === 'input' ? (
            <>
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleProcessWithAI}
                disabled={isProcessing || (stagedEntries.length === 0 && !currentForText.trim())}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white text-xs font-bold flex items-center gap-2 shadow-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isProcessing ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Processing with AI...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>Process & Preview ({stagedEntries.length + (currentForText.trim() ? 1 : 0)})</span>
                  </>
                )}
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={() => setStep('input')}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                Back / Add More
              </button>

              <button
                type="button"
                onClick={handleConfirmSaveAll}
                className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-2 shadow-sm transition-all"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Confirm & Add All ({processedEntries.length})</span>
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

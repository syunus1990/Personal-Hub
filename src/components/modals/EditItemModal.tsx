import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Check,
  Calendar,
  DollarSign,
  Layers,
  ArrowRightLeft,
  ArrowDownLeft,
  ArrowUpRight,
  PiggyBank,
  Sparkles,
  Plus,
  Tag,
  Wrench,
  Fuel,
  Droplets,
  CarFront,
  CheckSquare,
  CheckCircle2,
  Trash2,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import {
  NoteColor,
  Priority,
  AccountType,
  TransactionType,
  LoanType,
  ChecklistItem,
} from '../../types';
import { predictCategoryFromDescription, AICategorizationResult } from '../../utils/aiCategorizer';
import { suggestItemWithAI, SuggestItemResult } from '../../services/aiService';
import { ChecklistSection } from '../common/ChecklistSection';
import { triggerHaptic } from '../../utils/haptics';
import confetti from 'canvas-confetti';

export const EditItemModal: React.FC = () => {
  const {
    editModal,
    closeEditModal,
    accounts,
    categories,
    settings,
    addAccount,
    updateAccount,
    addCategory,
    addSubCategory,
    addTransaction,
    updateTransaction,
    addNote,
    updateNote,
    addFollowUp,
    updateFollowUp,
    addWishlistItem,
    updateWishlistItem,
    addSavingsToWishlist,
    addLoan,
    updateLoan,
    addLoanRepayment,
  } = useApp();

  const { isOpen, entityType, entityId, defaultData } = editModal;
  const primaryInputRef = useRef<HTMLInputElement | HTMLTextAreaElement | null>(null);

  // Auto-focus immediately without scrolling
  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => {
        if (primaryInputRef.current) {
          primaryInputRef.current.focus({ preventScroll: true });
        }
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [isOpen, entityType]);

  // Form states
  // 1. Transaction Form
  const [txType, setTxType] = useState<TransactionType>('expense');
  const [txAmount, setTxAmount] = useState<string>('');
  const [txCategory, setTxCategory] = useState<string>('Food');
  const [txSubCategory, setTxSubCategory] = useState<string>('');
  const [txAccountId, setTxAccountId] = useState<string>('');
  const [txToAccountId, setTxToAccountId] = useState<string>('');
  const [txNote, setTxNote] = useState<string>('');
  const [txDate, setTxDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [aiResult, setAiResult] = useState<AICategorizationResult | null>(null);

  // Flexible inline main category & sub-category creation state
  const [isAddingCategory, setIsAddingCategory] = useState(false);
  const [newCatInput, setNewCatInput] = useState('');
  const [isAddingSub, setIsAddingSub] = useState(false);
  const [newSubInput, setNewSubInput] = useState('');

  const handleCreateMainCategory = () => {
    if (!newCatInput.trim()) return;
    const created = addCategory(newCatInput.trim());
    setTxCategory(created.name);
    setTxSubCategory('');
    setNewCatInput('');
    setIsAddingCategory(false);
  };

  // 2. Account Form
  const [accName, setAccName] = useState<string>('');
  const [accType, setAccType] = useState<AccountType>('bank');
  const [accOpening, setAccOpening] = useState<string>('');
  const [accColor, setAccColor] = useState<string>('#8b5cf6');
  const [accMask, setAccMask] = useState<string>('');

  // 3. Note Form
  const [noteTitle, setNoteTitle] = useState<string>('');
  const [noteContent, setNoteContent] = useState<string>('');
  const [noteCategory, setNoteCategory] = useState<string>('Personal');
  const [noteColor, setNoteColor] = useState<NoteColor>('lavender');
  const [notePinned, setNotePinned] = useState<boolean>(false);

  // 4. Follow-up Form
  const [fuTitle, setFuTitle] = useState<string>('');
  const [fuCategory, setFuCategory] = useState<string>('Personal');
  const [fuDueDate, setFuDueDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [fuDueTime, setFuDueTime] = useState<string>('');
  const [fuPriority, setFuPriority] = useState<Priority>('medium');
  const [fuNotes, setFuNotes] = useState<string>('');

  // 5. Wishlist Form
  const [wlTitle, setWlTitle] = useState<string>('');
  const [wlPrice, setWlPrice] = useState<string>('');
  const [wlSaved, setWlSaved] = useState<string>('0');
  const [wlPriority, setWlPriority] = useState<Priority>('medium');
  const [wlCategory, setWlCategory] = useState<string>('Car');
  const [wlDate, setWlDate] = useState<string>('');
  const [wlUrl, setWlUrl] = useState<string>('');
  const [wlNotes, setWlNotes] = useState<string>('');

  // 6. Add Savings Form
  const [savingsAmount, setSavingsAmount] = useState<string>('');
  const [deductAccount, setDeductAccount] = useState<string>('');

  // 7. Loan Form
  const [loanCounterparty, setLoanCounterparty] = useState<string>('');
  const [loanPhone, setLoanPhone] = useState<string>('');
  const [loanType, setLoanType] = useState<LoanType>('borrowed');
  const [loanAmount, setLoanAmount] = useState<string>('');
  const [loanDueDate, setLoanDueDate] = useState<string>(
    new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0]
  );
  const [loanNotes, setLoanNotes] = useState<string>('');

  // 8. Loan Repayment Form
  const [repAmount, setRepAmount] = useState<string>('');
  const [repNote, setRepNote] = useState<string>('Installment payment');

  // 9. Checklist states for lists with sub-tasks
  const [fuChecklist, setFuChecklist] = useState<ChecklistItem[]>([]);
  const [wlChecklist, setWlChecklist] = useState<ChecklistItem[]>([]);
  const [noteChecklist, setNoteChecklist] = useState<ChecklistItem[]>([]);

  // 10. AI Suggestions & Preview States
  const [isAiSuggesting, setIsAiSuggesting] = useState<boolean>(false);
  const [aiSuggestionPreview, setAiSuggestionPreview] = useState<SuggestItemResult | null>(null);
  const [aiPreviewChecklist, setAiPreviewChecklist] = useState<ChecklistItem[]>([]);
  const [aiTipMessage, setAiTipMessage] = useState<string | null>(null);

  // Populate data when editing an existing item
  useEffect(() => {
    setAiSuggestionPreview(null);
    setAiTipMessage(null);
    if (defaultData) {
      if (entityType === 'transaction') {
        setTxType(defaultData.type || 'expense');
        setTxAmount(defaultData.amountSAR ? String(defaultData.amountSAR) : '');
        setTxCategory(defaultData.category || 'Food');
        setTxSubCategory(defaultData.subCategory || '');
        setTxAccountId(defaultData.accountId || accounts[0]?.id || '');
        setTxToAccountId(defaultData.toAccountId || accounts[1]?.id || '');
        setTxNote(defaultData.note || '');
        setTxDate(defaultData.date || new Date().toISOString().split('T')[0]);
        setAiResult(null);
      } else if (entityType === 'account') {
        setAccName(defaultData.name || '');
        setAccType(defaultData.type || 'bank');
        setAccOpening(defaultData.openingBalanceSAR !== undefined ? String(defaultData.openingBalanceSAR) : '');
        setAccColor(defaultData.color || '#8b5cf6');
        setAccMask(defaultData.accountNumberMask || '');
      } else if (entityType === 'note') {
        setNoteTitle(defaultData.title || '');
        setNoteContent(defaultData.content || '');
        setNoteCategory(defaultData.category || 'Personal');
        setNoteColor(defaultData.color || 'lavender');
        setNotePinned(defaultData.isPinned || false);
        setNoteChecklist(defaultData.checklist || []);
      } else if (entityType === 'followup') {
        setFuTitle(defaultData.title || '');
        setFuCategory(defaultData.category || 'Personal');
        setFuDueDate(defaultData.dueDate || new Date().toISOString().split('T')[0]);
        setFuDueTime(defaultData.dueTime || '');
        setFuPriority(defaultData.priority || 'medium');
        setFuNotes(defaultData.notes || '');
        setFuChecklist(defaultData.checklist || []);
      } else if (entityType === 'wishlist') {
        if (defaultData.isAddSavingsOnly) {
          setSavingsAmount('');
          setDeductAccount(accounts[0]?.id || '');
        } else {
          setWlTitle(defaultData.title || '');
          setWlPrice(defaultData.estimatedPriceSAR ? String(defaultData.estimatedPriceSAR) : '');
          setWlSaved(defaultData.savedAmountSAR !== undefined ? String(defaultData.savedAmountSAR) : '0');
          setWlPriority(defaultData.priority || 'medium');
          setWlCategory(defaultData.category || 'Car');
          setWlDate(defaultData.targetDate || '');
          setWlUrl(defaultData.productUrl || '');
          setWlNotes(defaultData.notes || '');
          setWlChecklist(defaultData.checklist || []);
        }
      } else if (entityType === 'loan') {
        setLoanCounterparty(defaultData.counterpartyName || '');
        setLoanPhone(defaultData.counterpartyPhone || '');
        setLoanType(defaultData.type || 'borrowed');
        setLoanAmount(defaultData.amountSAR ? String(defaultData.amountSAR) : '');
        setLoanDueDate(defaultData.dueDate || new Date().toISOString().split('T')[0]);
        setLoanNotes(defaultData.notes || '');
      } else if (entityType === 'repayment') {
        setRepAmount(defaultData.maxAmount ? String(defaultData.maxAmount) : '');
        setRepNote('Installment payment');
      }
    } else {
      setTxAccountId(accounts[0]?.id || '');
      setTxToAccountId(accounts[1]?.id || '');
      setTxAmount('');
      setTxNote('');
      setTxCategory('Food');
      setTxSubCategory('');
      setAiResult(null);
      setAccName('');
      setAccOpening('');
      setNoteTitle('');
      setNoteContent('');
      setNoteChecklist([]);
      setFuTitle('');
      setFuNotes('');
      setFuChecklist([]);
      setWlTitle('');
      setWlPrice('');
      setWlChecklist([]);
      setLoanCounterparty('');
      setLoanAmount('');
    }
  }, [defaultData, entityType, accounts]);

  // Handle typing what expense is for with automatic lightweight AI categorization!
  const handleNoteChange = (text: string) => {
    setTxNote(text);

    if (txType === 'expense' && text.trim().length >= 2) {
      const pred = predictCategoryFromDescription(text, categories);
      if (pred) {
        setAiResult(pred);
        setTxCategory(pred.category);
        if (pred.subCategory) {
          setTxSubCategory(pred.subCategory);
        }
      }
    }
  };

  // Handle adding an instant sub-category flexibly
  const handleCreateSubCategory = () => {
    if (!newSubInput.trim()) return;
    const created = addSubCategory(txCategory, newSubInput.trim());
    setTxSubCategory(created.name);
    setNewSubInput('');
    setIsAddingSub(false);
  };

  // Checklist handlers for modal lists
  const handleToggleModalChecklist = (listType: 'fu' | 'wl' | 'note', itemId: string) => {
    triggerHaptic('light', settings?.enableHaptics);
    const now = new Date().toISOString();
    const updater = (prev: ChecklistItem[]) =>
      prev.map((item) => {
        if (item.id !== itemId) return item;
        const willBeChecked = !item.isCompleted;
        return {
          ...item,
          isCompleted: willBeChecked,
          completedAt: willBeChecked ? now : undefined,
        };
      });

    if (listType === 'fu') setFuChecklist(updater);
    else if (listType === 'wl') setWlChecklist(updater);
    else if (listType === 'note') setNoteChecklist(updater);
  };

  const handleAddModalChecklist = (listType: 'fu' | 'wl' | 'note', text: string) => {
    if (!text.trim()) return;
    triggerHaptic('light', settings?.enableHaptics);
    const newItem: ChecklistItem = {
      id: `chk_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      text: text.trim(),
      isCompleted: false,
    };
    if (listType === 'fu') setFuChecklist((prev) => [...prev, newItem]);
    else if (listType === 'wl') setWlChecklist((prev) => [...prev, newItem]);
    else if (listType === 'note') setNoteChecklist((prev) => [...prev, newItem]);
  };

  const handleUpdateModalChecklist = (listType: 'fu' | 'wl' | 'note', itemId: string, text: string) => {
    const updater = (prev: ChecklistItem[]) =>
      prev.map((item) => (item.id === itemId ? { ...item, text: text.trim() } : item));
    if (listType === 'fu') setFuChecklist(updater);
    else if (listType === 'wl') setWlChecklist(updater);
    else if (listType === 'note') setNoteChecklist(updater);
  };

  const handleDeleteModalChecklist = (listType: 'fu' | 'wl' | 'note', itemId: string) => {
    triggerHaptic('warning', settings?.enableHaptics);
    const updater = (prev: ChecklistItem[]) => prev.filter((item) => item.id !== itemId);
    if (listType === 'fu') setFuChecklist(updater);
    else if (listType === 'wl') setWlChecklist(updater);
    else if (listType === 'note') setNoteChecklist(updater);
  };

  // AI Suggestion Trigger & Handlers across all forms
  const handleTriggerAiSuggest = async () => {
    setAiTipMessage(null);
    let titleToEvaluate = '';
    let currentPriceVal = 0;
    let priorityVal = 'medium';
    let categoryVal = '';
    let notesVal = '';

    if (entityType === 'wishlist') {
      titleToEvaluate = wlTitle;
      currentPriceVal = parseFloat(wlPrice) || 0;
      priorityVal = wlPriority;
      categoryVal = wlCategory;
      notesVal = wlNotes;
    } else if (entityType === 'followup') {
      titleToEvaluate = fuTitle;
      priorityVal = fuPriority;
      categoryVal = fuCategory;
      notesVal = fuNotes;
    } else if (entityType === 'note') {
      titleToEvaluate = noteTitle;
      categoryVal = noteCategory;
      notesVal = noteContent;
    } else if (entityType === 'transaction') {
      titleToEvaluate = txNote;
      currentPriceVal = parseFloat(txAmount) || 0;
      categoryVal = txCategory;
    } else if (entityType === 'loan') {
      titleToEvaluate = loanCounterparty;
      currentPriceVal = parseFloat(loanAmount) || 0;
      notesVal = loanNotes;
    } else if (entityType === 'account') {
      titleToEvaluate = accName;
      currentPriceVal = parseFloat(accOpening) || 0;
    }

    if (!titleToEvaluate.trim()) {
      setAiTipMessage('Please enter a title or description first (e.g. item name, repair note, or idea) so AI can assist.');
      return;
    }

    setIsAiSuggesting(true);
    triggerHaptic('medium', settings?.enableHaptics);

    try {
      const res = await suggestItemWithAI({
        type: entityType || 'wishlist',
        title: titleToEvaluate.trim(),
        currentPrice: currentPriceVal,
        currentPriority: priorityVal,
        currentCategory: categoryVal,
        notes: notesVal,
        categories,
      });

      setAiSuggestionPreview(res);
      if (Array.isArray(res.checklistItems) && res.checklistItems.length > 0) {
        setAiPreviewChecklist(
          res.checklistItems.map((text, idx) => ({
            id: `ai_chk_${Date.now()}_${idx}`,
            text,
            isCompleted: false,
          }))
        );
      } else {
        setAiPreviewChecklist([]);
      }
      triggerHaptic('success', settings?.enableHaptics);
    } catch {
      setAiTipMessage('AI suggestions unavailable right now. You can continue filling out the form manually.');
    } finally {
      setIsAiSuggesting(false);
    }
  };

  const executeDirectSave = (s: SuggestItemResult) => {
    if (entityType === 'wishlist') {
      const finalTitle = s.rephrasedTitle || wlTitle;
      const finalPrice = s.suggestedPrice || parseFloat(wlPrice) || 0;
      const finalPriority = (s.suggestedPriority as Priority) || wlPriority;
      const finalCategory = s.suggestedCategory || wlCategory;
      const finalChecklist = aiPreviewChecklist.length > 0 ? aiPreviewChecklist : wlChecklist;

      if (entityId) {
        updateWishlistItem(entityId, {
          title: finalTitle,
          estimatedPriceSAR: finalPrice,
          savedAmountSAR: parseFloat(wlSaved) || 0,
          priority: finalPriority,
          category: finalCategory,
          targetDate: wlDate,
          productUrl: wlUrl,
          notes: wlNotes,
          checklist: finalChecklist.length > 0 ? finalChecklist : undefined,
        });
      } else {
        addWishlistItem({
          title: finalTitle,
          estimatedPriceSAR: finalPrice,
          savedAmountSAR: 0,
          priority: finalPriority,
          category: finalCategory,
          targetDate: wlDate,
          productUrl: wlUrl,
          notes: wlNotes,
          checklist: finalChecklist.length > 0 ? finalChecklist : undefined,
        });
      }
    } else if (entityType === 'followup') {
      const finalTitle = s.rephrasedTitle || fuTitle;
      const finalPriority = (s.suggestedPriority as Priority) || fuPriority;
      const finalCategory = s.suggestedCategory || fuCategory;
      const finalDueDate = s.suggestedDueDate || fuDueDate;
      const finalNotes = s.rephrasedNotes || fuNotes;
      const finalChecklist = aiPreviewChecklist.length > 0 ? aiPreviewChecklist : fuChecklist;
      const allChecked = finalChecklist.length > 0 && finalChecklist.every((c) => c.isCompleted);
      const now = new Date().toISOString();

      if (entityId) {
        updateFollowUp(entityId, {
          title: finalTitle,
          priority: finalPriority,
          category: finalCategory,
          dueDate: finalDueDate,
          dueTime: fuDueTime,
          notes: finalNotes,
          checklist: finalChecklist.length > 0 ? finalChecklist : undefined,
          isCompleted: finalChecklist.length > 0 ? allChecked : undefined,
          completedAt: allChecked ? now : undefined,
        });
      } else {
        addFollowUp({
          title: finalTitle,
          priority: finalPriority,
          category: finalCategory,
          dueDate: finalDueDate,
          dueTime: fuDueTime,
          notes: finalNotes,
          checklist: finalChecklist.length > 0 ? finalChecklist : undefined,
        });
      }
    } else if (entityType === 'note') {
      const finalTitle = s.rephrasedTitle || noteTitle;
      const finalContent = s.rephrasedNotes || noteContent;
      const finalCategory = s.suggestedCategory || noteCategory;
      const finalColor = (s.suggestedColor as NoteColor) || noteColor;
      const finalChecklist = aiPreviewChecklist.length > 0 ? aiPreviewChecklist : noteChecklist;

      if (entityId) {
        updateNote(entityId, {
          title: finalTitle,
          content: finalContent,
          category: finalCategory,
          color: finalColor,
          isPinned: notePinned,
          checklist: finalChecklist.length > 0 ? finalChecklist : undefined,
        });
      } else {
        addNote({
          title: finalTitle,
          content: finalContent,
          category: finalCategory,
          color: finalColor,
          isPinned: notePinned,
          checklist: finalChecklist.length > 0 ? finalChecklist : undefined,
        });
      }
    } else if (entityType === 'transaction') {
      const finalNote = s.rephrasedTitle || txNote;
      const finalAmount = s.suggestedPrice || parseFloat(txAmount) || 0;
      const finalCat = s.suggestedCategory || txCategory;
      const finalSub = s.suggestedSubCategory || txSubCategory;
      if (finalAmount > 0) {
        if (entityId) {
          updateTransaction(entityId, {
            type: txType,
            amountSAR: finalAmount,
            category: finalCat,
            subCategory: finalSub || undefined,
            accountId: txAccountId || accounts[0]?.id || '',
            note: finalNote,
            date: txDate,
          });
        } else {
          addTransaction({
            type: txType,
            amountSAR: finalAmount,
            category: finalCat,
            subCategory: finalSub || undefined,
            accountId: txAccountId || accounts[0]?.id || '',
            note: finalNote,
            date: txDate,
          });
        }
      }
    } else if (entityType === 'loan') {
      const finalCounterparty = s.suggestedCounterparty || s.rephrasedTitle || loanCounterparty;
      const finalAmount = parseFloat(loanAmount) || 0;
      const finalType = (s.suggestedLoanType as LoanType) || loanType;
      const finalDueDate = s.suggestedDueDate || loanDueDate;
      const finalNotes = s.rephrasedNotes || loanNotes;
      if (finalAmount > 0 && finalCounterparty) {
        if (entityId) {
          updateLoan(entityId, {
            counterpartyName: finalCounterparty,
            counterpartyPhone: loanPhone,
            type: finalType,
            amountSAR: finalAmount,
            dueDate: finalDueDate,
            notes: finalNotes,
          });
        } else {
          addLoan({
            counterpartyName: finalCounterparty,
            counterpartyPhone: loanPhone,
            type: finalType,
            amountSAR: finalAmount,
            dueDate: finalDueDate,
            notes: finalNotes,
          });
        }
      }
    } else if (entityType === 'account') {
      const finalName = s.rephrasedTitle || accName;
      const finalOpening = parseFloat(accOpening) || 0;
      const finalType = (s.suggestedAccountType as AccountType) || accType;
      const finalColor = s.suggestedColor || accColor;
      if (finalName) {
        if (entityId) {
          updateAccount(entityId, {
            name: finalName,
            type: finalType,
            openingBalanceSAR: finalOpening,
            color: finalColor,
            accountNumberMask: accMask,
          });
        } else {
          addAccount({
            name: finalName,
            type: finalType,
            openingBalanceSAR: finalOpening,
            color: finalColor,
            accountNumberMask: accMask,
          });
        }
      }
    }

    try {
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.8 },
      });
    } catch {}

    setAiSuggestionPreview(null);
    closeEditModal();
  };

  const handleApplyAiSuggestion = (saveDirectly = false) => {
    if (!aiSuggestionPreview) return;
    const s = aiSuggestionPreview;

    if (entityType === 'wishlist') {
      if (s.rephrasedTitle) setWlTitle(s.rephrasedTitle);
      if (s.suggestedPrice) setWlPrice(String(s.suggestedPrice));
      if (s.suggestedPriority) setWlPriority(s.suggestedPriority as Priority);
      if (s.suggestedCategory) setWlCategory(s.suggestedCategory);
      if (aiPreviewChecklist.length > 0) setWlChecklist(aiPreviewChecklist);
    } else if (entityType === 'followup') {
      if (s.rephrasedTitle) setFuTitle(s.rephrasedTitle);
      if (s.suggestedPriority) setFuPriority(s.suggestedPriority as Priority);
      if (s.suggestedCategory) setFuCategory(s.suggestedCategory);
      if (s.suggestedDueDate) setFuDueDate(s.suggestedDueDate);
      if (s.rephrasedNotes) setFuNotes(s.rephrasedNotes);
      if (aiPreviewChecklist.length > 0) setFuChecklist(aiPreviewChecklist);
    } else if (entityType === 'note') {
      if (s.rephrasedTitle) setNoteTitle(s.rephrasedTitle);
      if (s.rephrasedNotes) setNoteContent(s.rephrasedNotes);
      if (s.suggestedCategory) setNoteCategory(s.suggestedCategory);
      if (s.suggestedColor) setNoteColor(s.suggestedColor as NoteColor);
      if (aiPreviewChecklist.length > 0) setNoteChecklist(aiPreviewChecklist);
    } else if (entityType === 'transaction') {
      if (s.rephrasedTitle) setTxNote(s.rephrasedTitle);
      if (s.suggestedPrice) setTxAmount(String(s.suggestedPrice));
      if (s.suggestedCategory) setTxCategory(s.suggestedCategory);
      if (s.suggestedSubCategory) setTxSubCategory(s.suggestedSubCategory);
    } else if (entityType === 'loan') {
      if (s.suggestedCounterparty || s.rephrasedTitle) {
        setLoanCounterparty(s.suggestedCounterparty || s.rephrasedTitle);
      }
      if (s.suggestedLoanType) setLoanType(s.suggestedLoanType as LoanType);
      if (s.suggestedDueDate) setLoanDueDate(s.suggestedDueDate);
      if (s.rephrasedNotes) setLoanNotes(s.rephrasedNotes);
    } else if (entityType === 'account') {
      if (s.rephrasedTitle) setAccName(s.rephrasedTitle);
      if (s.suggestedAccountType) setAccType(s.suggestedAccountType as AccountType);
      if (s.suggestedColor) setAccColor(s.suggestedColor);
    }

    triggerHaptic('success', settings?.enableHaptics);

    if (saveDirectly) {
      executeDirectSave(s);
    } else {
      setAiSuggestionPreview(null);
    }
  };

  if (!isOpen || !entityType) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (entityType === 'transaction') {
      const amount = parseFloat(txAmount) || 0;
      if (amount <= 0) return;
      if (entityId) {
        updateTransaction(entityId, {
          type: txType,
          amountSAR: amount,
          category: txCategory,
          subCategory: txSubCategory || undefined,
          accountId: txAccountId || accounts[0]?.id || '',
          toAccountId: txType === 'transfer' ? txToAccountId : undefined,
          note: txNote,
          date: txDate,
        });
      } else {
        addTransaction({
          type: txType,
          amountSAR: amount,
          category: txCategory,
          subCategory: txSubCategory || undefined,
          accountId: txAccountId || accounts[0]?.id || '',
          toAccountId: txType === 'transfer' ? txToAccountId : undefined,
          note: txNote,
          date: txDate,
        });
      }
    } else if (entityType === 'account') {
      const opening = parseFloat(accOpening) || 0;
      if (!accName.trim()) return;
      if (entityId) {
        updateAccount(entityId, {
          name: accName,
          type: accType,
          openingBalanceSAR: opening,
          color: accColor,
          accountNumberMask: accMask,
        });
      } else {
        addAccount({
          name: accName,
          type: accType,
          openingBalanceSAR: opening,
          color: accColor,
          accountNumberMask: accMask,
        });
      }
    } else if (entityType === 'note') {
      if (!noteTitle.trim()) return;
      if (entityId) {
        updateNote(entityId, {
          title: noteTitle,
          content: noteContent,
          category: noteCategory,
          color: noteColor,
          isPinned: notePinned,
          checklist: noteChecklist.length > 0 ? noteChecklist : undefined,
        });
      } else {
        addNote({
          title: noteTitle,
          content: noteContent,
          category: noteCategory,
          color: noteColor,
          isPinned: notePinned,
          checklist: noteChecklist.length > 0 ? noteChecklist : undefined,
        });
      }
    } else if (entityType === 'followup') {
      if (!fuTitle.trim()) return;
      const allChecked = fuChecklist.length > 0 && fuChecklist.every((c) => c.isCompleted);
      const now = new Date().toISOString();
      if (entityId) {
        updateFollowUp(entityId, {
          title: fuTitle,
          category: fuCategory,
          dueDate: fuDueDate,
          dueTime: fuDueTime,
          priority: fuPriority,
          notes: fuNotes,
          checklist: fuChecklist.length > 0 ? fuChecklist : undefined,
          isCompleted: fuChecklist.length > 0 ? allChecked : undefined,
          completedAt: allChecked ? now : undefined,
        });
      } else {
        addFollowUp({
          title: fuTitle,
          category: fuCategory,
          dueDate: fuDueDate,
          dueTime: fuDueTime,
          priority: fuPriority,
          notes: fuNotes,
          checklist: fuChecklist.length > 0 ? fuChecklist : undefined,
        });
      }
    } else if (entityType === 'wishlist') {
      if (defaultData?.isAddSavingsOnly) {
        const amt = parseFloat(savingsAmount) || 0;
        if (amt > 0 && entityId) {
          addSavingsToWishlist(entityId, amt, deductAccount || undefined);
        }
      } else {
        if (!wlTitle.trim()) return;
        const price = parseFloat(wlPrice) || 0;
        const saved = parseFloat(wlSaved) || 0;
        if (entityId) {
          updateWishlistItem(entityId, {
            title: wlTitle,
            estimatedPriceSAR: price,
            savedAmountSAR: saved,
            priority: wlPriority,
            category: wlCategory,
            targetDate: wlDate,
            productUrl: wlUrl,
            notes: wlNotes,
            checklist: wlChecklist.length > 0 ? wlChecklist : undefined,
          });
        } else {
          addWishlistItem({
            title: wlTitle,
            estimatedPriceSAR: price,
            savedAmountSAR: saved,
            priority: wlPriority,
            category: wlCategory,
            targetDate: wlDate,
            productUrl: wlUrl,
            notes: wlNotes,
            checklist: wlChecklist.length > 0 ? wlChecklist : undefined,
          });
        }
      }
    } else if (entityType === 'loan') {
      if (!loanCounterparty.trim()) return;
      const amount = parseFloat(loanAmount) || 0;
      if (amount <= 0) return;
      if (entityId) {
        updateLoan(entityId, {
          counterpartyName: loanCounterparty,
          counterpartyPhone: loanPhone,
          type: loanType,
          amountSAR: amount,
          dueDate: loanDueDate,
          notes: loanNotes,
        });
      } else {
        addLoan({
          counterpartyName: loanCounterparty,
          counterpartyPhone: loanPhone,
          type: loanType,
          amountSAR: amount,
          dueDate: loanDueDate,
          notes: loanNotes,
        });
      }
    } else if (entityType === 'repayment') {
      const amt = parseFloat(repAmount) || 0;
      if (amt > 0 && entityId) {
        addLoanRepayment(entityId, amt, repNote);
      }
    }

    closeEditModal();
  };

  const currentCategoryObj = categories.find(
    (c) => c.name.toLowerCase() === txCategory.toLowerCase()
  );

  const getModalTitle = () => {
    const isEdit = !!entityId && !defaultData?.isAddSavingsOnly;
    switch (entityType) {
      case 'transaction':
        return isEdit ? 'Edit Transaction' : 'Record Transaction';
      case 'account':
        return isEdit ? 'Edit Account' : 'New Financial Account';
      case 'note':
        return isEdit ? 'Edit Note' : 'Create Note';
      case 'followup':
        return isEdit ? 'Edit Follow-up' : 'New Follow-up Task';
      case 'wishlist':
        if (defaultData?.isAddSavingsOnly) return `Add Savings: ${defaultData?.itemTitle || ''}`;
        return isEdit ? 'Edit Wishlist Goal' : 'New Wishlist Goal';
      case 'loan':
        return isEdit ? 'Edit Loan Record' : 'Record New Loan';
      case 'repayment':
        return 'Record Loan Repayment';
      default:
        return 'Item Details';
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
    >
      <div
        className="w-full max-w-lg glass-panel rounded-t-3xl sm:rounded-3xl p-5 shadow-2xl border border-white/60 dark:border-white/10 max-h-[92vh] overflow-y-auto no-scrollbar"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Bar */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-200/60 dark:border-slate-800/80 mb-3">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-bold text-slate-800 dark:text-slate-100">
              {getModalTitle()}
            </h2>
            {entityType === 'transaction' && txType === 'expense' && (
              <span className="hidden sm:flex items-center gap-1 text-[10px] font-semibold text-purple-600 dark:text-purple-300 bg-purple-50 dark:bg-purple-950/50 px-2 py-0.5 rounded-full border border-purple-200/50">
                <Sparkles className="w-3 h-3 text-purple-500 animate-pulse" />
                <span>AI Categorizer</span>
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            {entityType && entityType !== 'repayment' && !defaultData?.isAddSavingsOnly && (
              <button
                type="button"
                onClick={handleTriggerAiSuggest}
                disabled={isAiSuggesting}
                className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-purple-50 hover:bg-purple-100 dark:bg-purple-950/60 dark:hover:bg-purple-900/60 text-purple-700 dark:text-purple-300 border border-purple-200/80 dark:border-purple-800 text-xs font-semibold shadow-2xs transition-all active:scale-95 disabled:opacity-50"
                title="AI Assist: Rephrase, clean up, suggest price, priority & sub-points with preview"
              >
                {isAiSuggesting ? (
                  <div className="w-3 h-3 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Sparkles className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
                )}
                <span>AI Assist</span>
              </button>
            )}

            <button
              onClick={closeEditModal}
              className="w-7 h-7 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* AI Tip / Guidance Message */}
        {aiTipMessage && (
          <div className="mb-3 p-3 rounded-2xl bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-900/60 flex items-center justify-between gap-2 text-amber-800 dark:text-amber-300 text-xs animate-in fade-in">
            <span className="flex-1">{aiTipMessage}</span>
            <button
              type="button"
              onClick={() => setAiTipMessage(null)}
              className="text-amber-500 hover:text-amber-700 font-bold text-xs"
            >
              ✕
            </button>
          </div>
        )}

        {/* ================= MASTER AI SUGGESTION PREVIEW PANEL ================= */}
        {aiSuggestionPreview && (
          <div className="mb-4 p-4 rounded-3xl bg-gradient-to-br from-purple-500/10 via-pink-500/5 to-indigo-500/10 border-2 border-purple-500/40 shadow-xl space-y-3 animate-in fade-in duration-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-xl bg-purple-600 text-white flex items-center justify-center shadow-xs">
                  <Sparkles className="w-4 h-4 text-yellow-300" />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                    <span>AI Suggestions Preview</span>
                    <span className="text-[9px] font-semibold uppercase px-2 py-0.5 rounded-full bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300">
                      Confirm before saving
                    </span>
                  </h3>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400">
                    Nothing is saved automatically without your confirmation.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setAiSuggestionPreview(null)}
                className="w-6 h-6 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Suggested Values Preview */}
            <div className="space-y-2 text-xs">
              <div className="p-2.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800">
                <span className="text-[10px] font-bold text-purple-600 dark:text-purple-400 uppercase tracking-wider block mb-0.5">
                  Rephrased Title:
                </span>
                <p className="font-bold text-slate-900 dark:text-white text-xs">
                  {aiSuggestionPreview.rephrasedTitle}
                </p>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {aiSuggestionPreview.suggestedPrice !== undefined && (
                  <div className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800">
                    <span className="text-[9px] font-semibold text-slate-400 block">
                      {entityType === 'wishlist' ? 'Est. Market Price' : 'Suggested Amount'}
                    </span>
                    <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">
                      SAR {aiSuggestionPreview.suggestedPrice}
                    </span>
                  </div>
                )}

                {aiSuggestionPreview.suggestedPriority && (
                  <div className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800">
                    <span className="text-[9px] font-semibold text-slate-400 block">Priority</span>
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200 capitalize">
                      {aiSuggestionPreview.suggestedPriority}
                    </span>
                  </div>
                )}

                {aiSuggestionPreview.suggestedCategory && (
                  <div className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800">
                    <span className="text-[9px] font-semibold text-slate-400 block">Category</span>
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                      {aiSuggestionPreview.suggestedCategory}
                      {aiSuggestionPreview.suggestedSubCategory
                        ? ` › ${aiSuggestionPreview.suggestedSubCategory}`
                        : ''}
                    </span>
                  </div>
                )}

                {aiSuggestionPreview.suggestedDueDate && (
                  <div className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800">
                    <span className="text-[9px] font-semibold text-slate-400 block">Suggested Due Date</span>
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                      {aiSuggestionPreview.suggestedDueDate}
                    </span>
                  </div>
                )}
              </div>

              {/* Sub-tasks / Checklist items generated by AI */}
              {aiPreviewChecklist.length > 0 && (
                <div className="p-2.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800">
                  <ChecklistSection
                    items={aiPreviewChecklist}
                    title="Extracted Checklist Sub-points"
                    accentColor="purple"
                    onToggle={(chkId) => {
                      setAiPreviewChecklist((prev) =>
                        prev.map((c) => (c.id === chkId ? { ...c, isCompleted: !c.isCompleted } : c))
                      );
                    }}
                    onAdd={(text) => {
                      setAiPreviewChecklist((prev) => [
                        ...prev,
                        { id: `chk_${Date.now()}`, text, isCompleted: false },
                      ]);
                    }}
                    onDelete={(chkId) => {
                      setAiPreviewChecklist((prev) => prev.filter((c) => c.id !== chkId));
                    }}
                    allowAdd={true}
                  />
                </div>
              )}

              {aiSuggestionPreview.explanation && (
                <p className="text-[10px] text-purple-700 dark:text-purple-300 italic px-1">
                  💡 {aiSuggestionPreview.explanation}
                </p>
              )}
            </div>

            {/* Actions: Apply to Form OR Confirm & Save Now */}
            <div className="pt-2 flex flex-wrap items-center justify-between gap-2 border-t border-purple-200/60 dark:border-purple-800/60">
              <button
                type="button"
                onClick={() => setAiSuggestionPreview(null)}
                className="px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
              >
                Keep Original
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleApplyAiSuggestion(false)}
                  className="px-3 py-1.5 rounded-xl bg-purple-100 hover:bg-purple-200 dark:bg-purple-950/80 text-purple-800 dark:text-purple-200 text-xs font-bold transition-colors"
                  title="Apply suggestions to the form fields to review & edit further"
                >
                  Apply to Form
                </button>

                <button
                  type="button"
                  onClick={() => handleApplyAiSuggestion(true)}
                  className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs flex items-center gap-1.5 transition-all"
                  title="Confirm suggestions and save item immediately"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Confirm & Save Now</span>
                </button>
              </div>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* ================= TRANSACTION FORM ================= */}
          {entityType === 'transaction' && (
            <>
              {/* Type Switcher */}
              <div className="flex items-center p-1 rounded-2xl bg-slate-100 dark:bg-slate-800 text-xs font-semibold">
                <button
                  type="button"
                  onClick={() => setTxType('expense')}
                  className={`flex-1 py-1.5 rounded-xl transition-all ${
                    txType === 'expense'
                      ? 'bg-rose-600 text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-400'
                  }`}
                >
                  Expense
                </button>
                <button
                  type="button"
                  onClick={() => setTxType('income')}
                  className={`flex-1 py-1.5 rounded-xl transition-all ${
                    txType === 'income'
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-400'
                  }`}
                >
                  Income
                </button>
                <button
                  type="button"
                  onClick={() => setTxType('transfer')}
                  className={`flex-1 py-1.5 rounded-xl transition-all ${
                    txType === 'transfer'
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-400'
                  }`}
                >
                  Transfer
                </button>
              </div>

              {/* FLOW STEP 1: What is this expense for? (Immediate AI Categorization!) */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                    <span>What is this for? (Description)</span>
                    <Sparkles className="w-3 h-3 text-purple-500" />
                  </label>
                  {aiResult && (
                    <span className="text-[10px] text-purple-600 dark:text-purple-300 font-medium animate-in fade-in">
                      ✨ Auto-selected: <strong>{aiResult.category}</strong>
                      {aiResult.subCategory ? ` › ${aiResult.subCategory}` : ''}
                    </span>
                  )}
                </div>
                <input
                  ref={primaryInputRef as any}
                  type="text"
                  required
                  value={txNote}
                  onChange={(e) => handleNoteChange(e.target.value)}
                  placeholder="e.g. Fuel, Oil change, Car wash, Al baik, Barns coffee, Purse..."
                  className="w-full px-3.5 py-2.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-sm font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-400 shadow-2xs"
                />
              </div>

              {/* FLOW STEP 2: Amount in SAR (With live INR converted preview) */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                    Amount in SAR (﷼) *
                  </label>
                  {txAmount && parseFloat(txAmount) > 0 && (
                    <span className="text-[10px] text-purple-600 dark:text-purple-300 font-semibold tabular-nums">
                      ≈ ₹{(parseFloat(txAmount) * 25.7).toLocaleString('en-IN', { maximumFractionDigits: 2 })} INR
                    </span>
                  )}
                </div>
                <div className="relative flex items-center">
                  <span className="absolute left-3.5 text-slate-400 font-bold text-xs flex items-center gap-1">
                    <span>SAR</span>
                    <span className="text-amber-500 font-serif">﷼</span>
                  </span>
                  <input
                    type="number"
                    step="any"
                    required
                    value={txAmount}
                    onChange={(e) => setTxAmount(e.target.value)}
                    placeholder="0.00"
                    className="w-full pl-16 pr-4 py-2.5 rounded-2xl bg-slate-100/80 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-bold text-lg tabular-nums focus:outline-none focus:ring-2 focus:ring-emerald-400"
                  />
                </div>
              </div>

              {/* FLOW STEP 3: Category & Sub-category (With instant flexible sub-categories) */}
              <div className="p-3 rounded-2xl bg-slate-50/80 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-700/60 space-y-2.5">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider">
                      Category
                    </label>
                    <button
                      type="button"
                      onClick={() => setIsAddingCategory(!isAddingCategory)}
                      className="text-[11px] font-semibold text-purple-600 dark:text-purple-400 hover:underline flex items-center gap-1"
                    >
                      <Plus className="w-3 h-3" />
                      <span>+ Add Category</span>
                    </button>
                  </div>

                  {/* Inline New Category input */}
                  {isAddingCategory && (
                    <div className="flex items-center gap-2 mb-2 p-2 rounded-xl bg-white dark:bg-slate-900 border border-purple-300 dark:border-purple-700 animate-in fade-in duration-150">
                      <input
                        type="text"
                        value={newCatInput}
                        onChange={(e) => setNewCatInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleCreateMainCategory();
                          }
                        }}
                        placeholder="New category name..."
                        className="flex-1 text-xs bg-transparent focus:outline-none text-slate-800 dark:text-slate-100"
                        autoFocus
                      />
                      <button
                        type="button"
                        onClick={handleCreateMainCategory}
                        className="px-2.5 py-1 rounded-lg bg-purple-600 hover:bg-purple-700 text-white text-[11px] font-semibold shadow-xs"
                      >
                        Save
                      </button>
                      <button
                        type="button"
                        onClick={() => setIsAddingCategory(false)}
                        className="text-slate-400 text-xs hover:text-slate-600"
                      >
                        ✕
                      </button>
                    </div>
                  )}

                  <select
                    value={txCategory}
                    onChange={(e) => {
                      setTxCategory(e.target.value);
                      setTxSubCategory('');
                    }}
                    className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-800 dark:text-slate-100"
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.name}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Sub-category selector & Flexible addition */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider">
                      Sub-category {txCategory === 'Car' ? '(Fuel, Maintenance, Cleaning)' : ''}
                    </label>
                    <button
                      type="button"
                      onClick={() => setIsAddingSub(!isAddingSub)}
                      className="text-[11px] font-semibold text-purple-600 dark:text-purple-400 hover:underline flex items-center gap-1"
                    >
                      <Plus className="w-3 h-3" />
                      <span>+ Add Sub-category</span>
                    </button>
                  </div>

                  {/* Inline New Sub-category input */}
                  {isAddingSub && (
                    <div className="flex items-center gap-2 mb-2 p-2 rounded-xl bg-white dark:bg-slate-900 border border-purple-300 dark:border-purple-700">
                      <input
                        type="text"
                        value={newSubInput}
                        onChange={(e) => setNewSubInput(e.target.value)}
                        placeholder={`New sub-category for ${txCategory}...`}
                        className="flex-1 text-xs bg-transparent focus:outline-none text-slate-800 dark:text-slate-100"
                      />
                      <button
                        type="button"
                        onClick={handleCreateSubCategory}
                        className="px-2.5 py-1 rounded-lg bg-purple-600 text-white text-[11px] font-semibold"
                      >
                        Save
                      </button>
                      <button
                        type="button"
                        onClick={() => setIsAddingSub(false)}
                        className="text-slate-400 text-xs hover:text-slate-600"
                      >
                        ✕
                      </button>
                    </div>
                  )}

                  {/* Sub-category quick selection chips */}
                  {currentCategoryObj && currentCategoryObj.subCategories.length > 0 ? (
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <button
                        type="button"
                        onClick={() => setTxSubCategory('')}
                        className={`px-2.5 py-1 rounded-xl text-xs font-medium transition-colors ${
                          !txSubCategory
                            ? 'bg-slate-800 text-white dark:bg-slate-200 dark:text-slate-900 shadow-2xs font-semibold'
                            : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                        }`}
                      >
                        None
                      </button>
                      {currentCategoryObj.subCategories.map((sub) => {
                        const isSelected = txSubCategory.toLowerCase() === sub.name.toLowerCase();
                        return (
                          <button
                            type="button"
                            key={sub.id}
                            onClick={() => setTxSubCategory(sub.name)}
                            className={`flex items-center gap-1 px-3 py-1 rounded-xl text-xs font-medium transition-all ${
                              isSelected
                                ? 'bg-purple-600 text-white shadow-xs font-semibold scale-102'
                                : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-purple-300'
                            }`}
                          >
                            {sub.name === 'Fuel' && <Fuel className="w-3 h-3 text-indigo-400" />}
                            {sub.name === 'Maintenance' && <Wrench className="w-3 h-3 text-rose-400" />}
                            {sub.name === 'Cleaning' && <Droplets className="w-3 h-3 text-amber-400" />}
                            <span>{sub.name}</span>
                          </button>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="text-[11px] text-slate-400 italic">
                      No sub-categories yet for {txCategory}. Tap "+ Add Sub-category" to create one instantly!
                    </div>
                  )}
                </div>
              </div>

              {/* Account Selection */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
                    {txType === 'transfer' ? 'From Account' : 'Account'}
                  </label>
                  <select
                    value={txAccountId}
                    onChange={(e) => setTxAccountId(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-800 dark:text-slate-100"
                  >
                    {accounts.map((acc) => (
                      <option key={acc.id} value={acc.id}>
                        {acc.name} ({acc.currentBalanceSAR} SAR)
                      </option>
                    ))}
                  </select>
                </div>

                {txType === 'transfer' && (
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
                      To Destination Account
                    </label>
                    <select
                      value={txToAccountId}
                      onChange={(e) => setTxToAccountId(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-800 dark:text-slate-100"
                    >
                      {accounts.map((acc) => (
                        <option key={acc.id} value={acc.id}>
                          {acc.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <div>
                  <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
                    Date (Backdated support)
                  </label>
                  <input
                    type="date"
                    value={txDate}
                    onChange={(e) => setTxDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-800 dark:text-slate-100"
                  />
                  <span className="text-[10px] text-slate-400 mt-0.5 block">
                    Will be placed chronologically on this date
                  </span>
                </div>
              </div>
            </>
          )}

          {/* ================= ACCOUNT FORM ================= */}
          {entityType === 'account' && (
            <>
              <div>
                <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
                  Account Name *
                </label>
                <input
                  ref={primaryInputRef as any}
                  type="text"
                  required
                  value={accName}
                  onChange={(e) => setAccName(e.target.value)}
                  placeholder="e.g. SNB, STC Pay, CASH, Rozzy"
                  className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm font-semibold text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
                    Account Type
                  </label>
                  <select
                    value={accType}
                    onChange={(e) => setAccType(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-800 dark:text-slate-100"
                  >
                    <option value="bank">Bank Account</option>
                    <option value="cash">Physical Cash</option>
                    <option value="wallet">Digital Wallet</option>
                    <option value="savings">Savings Fund</option>
                    <option value="credit_card">Credit Card</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
                    Opening Balance (SAR)
                  </label>
                  <input
                    type="number"
                    step="any"
                    value={accOpening}
                    onChange={(e) => setAccOpening(e.target.value)}
                    placeholder="0"
                    className="w-full px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-800 dark:text-slate-100 tabular-nums"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
                    Card / Mask (Optional)
                  </label>
                  <input
                    type="text"
                    value={accMask}
                    onChange={(e) => setAccMask(e.target.value)}
                    placeholder="•••• 1234"
                    className="w-full px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-800 dark:text-slate-100"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
                    Color Accent
                  </label>
                  <div className="flex items-center gap-2 pt-1">
                    {['#8b5cf6', '#06b6d4', '#10b981', '#3b82f6', '#f59e0b', '#ec4899', '#64748b'].map((color) => (
                      <button
                        type="button"
                        key={color}
                        onClick={() => setAccColor(color)}
                        className={`w-6 h-6 rounded-full transition-transform ${
                          accColor === color ? 'scale-125 ring-2 ring-indigo-500 ring-offset-2' : ''
                        }`}
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </>
          )}

          {/* ================= NOTE FORM ================= */}
          {entityType === 'note' && (
            <>
              <div>
                <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
                  Title *
                </label>
                <input
                  ref={primaryInputRef as any}
                  type="text"
                  required
                  value={noteTitle}
                  onChange={(e) => setNoteTitle(e.target.value)}
                  placeholder="Note title..."
                  className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm font-semibold text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-purple-400"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
                  Content / Notes
                </label>
                <textarea
                  rows={4}
                  value={noteContent}
                  onChange={(e) => setNoteContent(e.target.value)}
                  placeholder="Write your note, thoughts, ideas, or checklist..."
                  className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-purple-400"
                />
              </div>

              {/* Note Checklist / Action Points */}
              <div className="p-3 rounded-2xl bg-purple-50/50 dark:bg-purple-950/20 border border-purple-200/60 dark:border-purple-800/40">
                <ChecklistSection
                  items={noteChecklist}
                  title="Checklist / Action Points"
                  accentColor="purple"
                  onToggle={(subId) => handleToggleModalChecklist('note', subId)}
                  onAdd={(text) => handleAddModalChecklist('note', text)}
                  onUpdate={(subId, text) => handleUpdateModalChecklist('note', subId, text)}
                  onDelete={(subId) => handleDeleteModalChecklist('note', subId)}
                  allowAdd={true}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
                    Category / Tag
                  </label>
                  <input
                    type="text"
                    value={noteCategory}
                    onChange={(e) => setNoteCategory(e.target.value)}
                    placeholder="Car, Personal, Ideas"
                    className="w-full px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-800 dark:text-slate-100"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
                    Pastel Color
                  </label>
                  <select
                    value={noteColor}
                    onChange={(e) => setNoteColor(e.target.value as NoteColor)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-800 dark:text-slate-100 capitalize"
                  >
                    <option value="lavender">Soft Lavender</option>
                    <option value="mint">Soft Mint</option>
                    <option value="peach">Soft Peach</option>
                    <option value="sky">Soft Sky</option>
                    <option value="butter">Soft Butter</option>
                    <option value="slate">Soft Slate</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="notePinnedCheck"
                  checked={notePinned}
                  onChange={(e) => setNotePinned(e.target.checked)}
                  className="rounded text-purple-600 focus:ring-purple-500"
                />
                <label htmlFor="notePinnedCheck" className="text-xs text-slate-700 dark:text-slate-300">
                  Pin this note to the top of the notebook
                </label>
              </div>
            </>
          )}

          {/* ================= FOLLOW-UP FORM ================= */}
          {entityType === 'followup' && (
            <>
              <div>
                <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
                  Task / Follow-up *
                </label>
                <input
                  ref={primaryInputRef as any}
                  type="text"
                  required
                  value={fuTitle}
                  onChange={(e) => setFuTitle(e.target.value)}
                  placeholder="e.g. Car ts10 glass cover, Room change..."
                  className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm font-semibold text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-rose-400"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
                    Due Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={fuDueDate}
                    onChange={(e) => setFuDueDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-800 dark:text-slate-100"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
                    Reminder Time (Optional)
                  </label>
                  <input
                    type="time"
                    value={fuDueTime}
                    onChange={(e) => setFuDueTime(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-800 dark:text-slate-100"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
                    Priority
                  </label>
                  <select
                    value={fuPriority}
                    onChange={(e) => setFuPriority(e.target.value as Priority)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-800 dark:text-slate-100 capitalize"
                  >
                    <option value="high">High (Urgent)</option>
                    <option value="medium">Medium</option>
                    <option value="low">Low</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
                    Category
                  </label>
                  <input
                    type="text"
                    value={fuCategory}
                    onChange={(e) => setFuCategory(e.target.value)}
                    placeholder="Personal, Car, Finance"
                    className="w-full px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-800 dark:text-slate-100"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
                  Additional Notes
                </label>
                <textarea
                  rows={2}
                  value={fuNotes}
                  onChange={(e) => setFuNotes(e.target.value)}
                  placeholder="Extra context or details..."
                  className="w-full px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-800 dark:text-slate-100"
                />
              </div>

              {/* Follow-up Checklist & Sub-tasks */}
              <div className="p-3 rounded-2xl bg-rose-50/50 dark:bg-rose-950/20 border border-rose-200/60 dark:border-rose-800/40">
                <ChecklistSection
                  items={fuChecklist}
                  title="Sub-tasks & Checklist (with checkboxes)"
                  accentColor="rose"
                  onToggle={(subId) => handleToggleModalChecklist('fu', subId)}
                  onAdd={(text) => handleAddModalChecklist('fu', text)}
                  onUpdate={(subId, text) => handleUpdateModalChecklist('fu', subId, text)}
                  onDelete={(subId) => handleDeleteModalChecklist('fu', subId)}
                  allowAdd={true}
                />
              </div>
            </>
          )}

          {/* ================= WISHLIST / ADD SAVINGS FORM ================= */}
          {entityType === 'wishlist' && defaultData?.isAddSavingsOnly && (
            <>
              <div>
                <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
                  Allocate Savings Amount (SAR) *
                </label>
                <input
                  ref={primaryInputRef as any}
                  type="number"
                  step="any"
                  required
                  value={savingsAmount}
                  onChange={(e) => setSavingsAmount(e.target.value)}
                  placeholder={`Remaining needed: ${defaultData?.remaining || 0} SAR`}
                  className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm font-semibold text-slate-800 dark:text-slate-100 tabular-nums focus:outline-none focus:ring-2 focus:ring-amber-400"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
                  Deduct from Account (Optional)
                </label>
                <select
                  value={deductAccount}
                  onChange={(e) => setDeductAccount(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-800 dark:text-slate-100"
                >
                  <option value="">Don't record transaction (virtual allocation)</option>
                  {accounts.map((acc) => (
                    <option key={acc.id} value={acc.id}>
                      {acc.name} ({acc.currentBalanceSAR} SAR)
                    </option>
                  ))}
                </select>
              </div>
            </>
          )}

          {entityType === 'wishlist' && !defaultData?.isAddSavingsOnly && (
            <>
              <div>
                <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
                  Item Title *
                </label>
                <input
                  ref={primaryInputRef as any}
                  type="text"
                  required
                  value={wlTitle}
                  onChange={(e) => setWlTitle(e.target.value)}
                  placeholder="e.g. Car seat cover, Booster cable"
                  className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm font-semibold text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-amber-400"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
                    Estimated Price (SAR) *
                  </label>
                  <input
                    type="number"
                    step="any"
                    required
                    value={wlPrice}
                    onChange={(e) => setWlPrice(e.target.value)}
                    placeholder="0.00"
                    className="w-full px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-800 dark:text-slate-100 tabular-nums"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
                    Already Saved (SAR)
                  </label>
                  <input
                    type="number"
                    step="any"
                    value={wlSaved}
                    onChange={(e) => setWlSaved(e.target.value)}
                    placeholder="0.00"
                    className="w-full px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-800 dark:text-slate-100 tabular-nums"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
                    Priority
                  </label>
                  <select
                    value={wlPriority}
                    onChange={(e) => setWlPriority(e.target.value as Priority)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-800 dark:text-slate-100 capitalize"
                  >
                    <option value="high">High (Must Have)</option>
                    <option value="medium">Medium (Nice to Have)</option>
                    <option value="low">Low (Dream / Long-term)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
                    Category
                  </label>
                  <input
                    type="text"
                    value={wlCategory}
                    onChange={(e) => setWlCategory(e.target.value)}
                    placeholder="Car, Tech, Home"
                    className="w-full px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-800 dark:text-slate-100"
                  />
                </div>
              </div>

              {/* Wishlist Sub-points & Purchase Milestones */}
              <div className="p-3 rounded-2xl bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200/60 dark:border-amber-800/40">
                <ChecklistSection
                  items={wlChecklist}
                  title="Sub-points & Purchase Milestones (with checkboxes)"
                  accentColor="amber"
                  onToggle={(subId) => handleToggleModalChecklist('wl', subId)}
                  onAdd={(text) => handleAddModalChecklist('wl', text)}
                  onUpdate={(subId, text) => handleUpdateModalChecklist('wl', subId, text)}
                  onDelete={(subId) => handleDeleteModalChecklist('wl', subId)}
                  allowAdd={true}
                />
              </div>
            </>
          )}

          {/* ================= LOAN FORM ================= */}
          {entityType === 'loan' && (
            <>
              <div className="flex items-center p-1 rounded-2xl bg-slate-100 dark:bg-slate-800 text-xs font-semibold">
                <button
                  type="button"
                  onClick={() => setLoanType('borrowed')}
                  className={`flex-1 py-1.5 rounded-xl transition-all ${
                    loanType === 'borrowed'
                      ? 'bg-rose-600 text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-400'
                  }`}
                >
                  I Borrowed (Payable)
                </button>
                <button
                  type="button"
                  onClick={() => setLoanType('lent')}
                  className={`flex-1 py-1.5 rounded-xl transition-all ${
                    loanType === 'lent'
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-400'
                  }`}
                >
                  I Lent (Receivable)
                </button>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
                  Person / Counterparty *
                </label>
                <input
                  ref={primaryInputRef as any}
                  type="text"
                  required
                  value={loanCounterparty}
                  onChange={(e) => setLoanCounterparty(e.target.value)}
                  placeholder="e.g. Haris, Shahid Mamu"
                  className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm font-semibold text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-400"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
                    Amount (SAR) *
                  </label>
                  <input
                    type="number"
                    step="any"
                    required
                    value={loanAmount}
                    onChange={(e) => setLoanAmount(e.target.value)}
                    placeholder="0.00"
                    className="w-full px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-800 dark:text-slate-100 tabular-nums"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
                    Due Date
                  </label>
                  <input
                    type="date"
                    required
                    value={loanDueDate}
                    onChange={(e) => setLoanDueDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-800 dark:text-slate-100"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
                  Notes
                </label>
                <input
                  type="text"
                  value={loanNotes}
                  onChange={(e) => setLoanNotes(e.target.value)}
                  placeholder="e.g. For increase investment, Opening for Shop"
                  className="w-full px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-800 dark:text-slate-100"
                />
              </div>
            </>
          )}

          {/* ================= REPAYMENT FORM ================= */}
          {entityType === 'repayment' && (
            <>
              <div>
                <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
                  Repayment Amount in SAR *
                </label>
                <input
                  ref={primaryInputRef as any}
                  type="number"
                  step="any"
                  required
                  value={repAmount}
                  onChange={(e) => setRepAmount(e.target.value)}
                  placeholder="0.00"
                  className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm font-semibold text-slate-800 dark:text-slate-100 tabular-nums focus:outline-none focus:ring-2 focus:ring-purple-400"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
                  Payment Note / Reference
                </label>
                <input
                  type="text"
                  value={repNote}
                  onChange={(e) => setRepNote(e.target.value)}
                  placeholder="e.g. Monthly principal reduction payment"
                  className="w-full px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-800 dark:text-slate-100"
                />
              </div>
            </>
          )}

          {/* Submit Actions */}
          <div className="pt-3 border-t border-slate-200/60 dark:border-slate-800/80 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={closeEditModal}
              className="px-4 py-2.5 rounded-2xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 rounded-2xl bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 hover:from-indigo-700 hover:to-pink-700 text-white text-xs font-semibold shadow-md shadow-purple-600/20 active:scale-98 transition-all"
            >
              Save Details
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Sparkles,
  Check,
  Calendar,
  AlertCircle,
  Clock,
  ArrowRight,
  CheckCircle2,
  FileText,
  Gift,
  CheckSquare,
  DollarSign,
  Plus,
  Trash2,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { rephraseItemWithAI, RephraseResult, suggestItemWithAI } from '../../services/aiService';
import { ChecklistItem } from '../../types';
import { triggerHaptic } from '../../utils/haptics';
import { ChecklistSection } from '../common/ChecklistSection';
import confetti from 'canvas-confetti';

interface AIItemAssistModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: 'followup' | 'wishlist' | 'note';
  existingItem?: {
    id: string;
    title: string;
    notes?: string;
    category?: string;
    priority?: string;
    dueDate?: string;
    estimatedPriceSAR?: number;
    checklist?: ChecklistItem[];
  };
}

export const AIItemAssistModal: React.FC<AIItemAssistModalProps> = ({
  isOpen,
  onClose,
  type,
  existingItem,
}) => {
  const {
    settings,
    categories,
    addFollowUp,
    updateFollowUp,
    addWishlistItem,
    updateWishlistItem,
    addNote,
    updateNote,
  } = useApp();

  const [inputText, setInputText] = useState('');
  const [inputNotes, setInputNotes] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [previewData, setPreviewData] = useState<RephraseResult | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Editable fields in preview mode
  const [editTitle, setEditTitle] = useState('');
  const [editNotes, setEditNotes] = useState('');
  const [editCategory, setEditCategory] = useState('Personal');
  const [editPriority, setEditPriority] = useState<'high' | 'medium' | 'low'>('medium');
  const [editDueDate, setEditDueDate] = useState(new Date().toISOString().split('T')[0]);
  const [editPrice, setEditPrice] = useState<string>('');
  const [previewChecklist, setPreviewChecklist] = useState<ChecklistItem[]>([]);

  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (isOpen) {
      setErrorMessage(null);
      setPreviewData(null);
      if (existingItem) {
        setInputText(existingItem.title || '');
        setInputNotes(existingItem.notes || '');
        setEditCategory(existingItem.category || (type === 'wishlist' ? 'Car' : 'Personal'));
        setEditPriority((existingItem.priority as any) || 'medium');
        setEditDueDate(existingItem.dueDate || new Date().toISOString().split('T')[0]);
        setEditPrice(existingItem.estimatedPriceSAR ? String(existingItem.estimatedPriceSAR) : '');
        setPreviewChecklist(existingItem.checklist || []);
      } else {
        setInputText('');
        setInputNotes('');
        setEditCategory(type === 'wishlist' ? 'Car' : 'Personal');
        setEditPriority('medium');
        setEditDueDate(new Date().toISOString().split('T')[0]);
        setEditPrice('');
        setPreviewChecklist([]);
      }
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen, existingItem, type]);

  if (!isOpen) return null;

  const isEditing = Boolean(existingItem);

  const getTypeName = () => {
    switch (type) {
      case 'followup':
        return 'Follow-up';
      case 'wishlist':
        return 'Wishlist';
      case 'note':
        return 'Note';
    }
  };

  const getTypeIcon = () => {
    switch (type) {
      case 'followup':
        return <CheckSquare className="w-4 h-4 text-rose-500" />;
      case 'wishlist':
        return <Gift className="w-4 h-4 text-amber-500" />;
      case 'note':
        return <FileText className="w-4 h-4 text-purple-500" />;
    }
  };

  const handleRephrase = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputText.trim()) {
      setErrorMessage('Please type what you want to add or improve.');
      return;
    }

    setIsProcessing(true);
    setErrorMessage(null);
    triggerHaptic('medium', settings.enableHaptics);

    try {
      if (type === 'wishlist') {
        // Suggest wishlist item with pricing, priority, category, and checklist
        const res = await suggestItemWithAI({
          type: 'wishlist',
          title: inputText.trim(),
          currentPrice: parseFloat(editPrice) || 0,
          currentPriority: editPriority,
          currentCategory: editCategory,
          notes: inputNotes.trim(),
          categories,
        });

        const chkList: ChecklistItem[] = (res.checklistItems || []).map((text, idx) => ({
          id: `ai_chk_${Date.now()}_${idx}`,
          text,
          isCompleted: false,
        }));

        setPreviewData({
          rephrasedTitle: res.rephrasedTitle,
          checklistItems: res.checklistItems,
          rephrasedNotes: inputNotes,
          suggestedCategory: res.suggestedCategory,
          suggestedPriority: res.suggestedPriority,
          explanation: res.explanation || 'Cleaned title and suggested realistic market price in SAR',
        });

        setEditTitle(res.rephrasedTitle);
        if (res.suggestedPrice) setEditPrice(String(res.suggestedPrice));
        if (res.suggestedCategory) setEditCategory(res.suggestedCategory);
        if (res.suggestedPriority) setEditPriority(res.suggestedPriority);
        setPreviewChecklist(chkList);
      } else {
        const res = await rephraseItemWithAI({
          text: inputText.trim(),
          type,
          notes: inputNotes.trim(),
          category: editCategory,
          priority: editPriority,
          dueDate: editDueDate,
          categoriesList: categories.map((c) => c.name),
        });

        setPreviewData(res);
        setEditTitle(res.rephrasedTitle);
        setEditNotes(res.rephrasedNotes || inputNotes);
        if (res.suggestedCategory) setEditCategory(res.suggestedCategory);
        if (res.suggestedPriority) setEditPriority(res.suggestedPriority);
        if (res.suggestedDueDate) setEditDueDate(res.suggestedDueDate);

        // Convert extracted checklist sub-points into ChecklistItem objects with checkboxes
        if (Array.isArray(res.checklistItems) && res.checklistItems.length > 0) {
          const chkList: ChecklistItem[] = res.checklistItems.map((text, idx) => ({
            id: `ai_chk_${Date.now()}_${idx}`,
            text,
            isCompleted: false,
          }));
          setPreviewChecklist(chkList);
        } else if (existingItem?.checklist) {
          setPreviewChecklist(existingItem.checklist);
        } else {
          setPreviewChecklist([]);
        }
      }

      triggerHaptic('success', settings.enableHaptics);
    } catch {
      setErrorMessage('Failed to rephrase. You can confirm your original text below.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleToggleCheckItem = (itemId: string) => {
    triggerHaptic('light', settings.enableHaptics);
    const now = new Date().toISOString();
    setPreviewChecklist((prev) =>
      prev.map((item) => {
        if (item.id !== itemId) return item;
        const willBeChecked = !item.isCompleted;
        return {
          ...item,
          isCompleted: willBeChecked,
          completedAt: willBeChecked ? now : undefined,
        };
      })
    );
  };

  const handleAddCheckItem = (text: string) => {
    if (!text.trim()) return;
    triggerHaptic('light', settings.enableHaptics);
    const newItem: ChecklistItem = {
      id: `chk_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      text: text.trim(),
      isCompleted: false,
    };
    setPreviewChecklist((prev) => [...prev, newItem]);
  };

  const handleUpdateCheckItem = (itemId: string, text: string) => {
    setPreviewChecklist((prev) =>
      prev.map((item) => (item.id === itemId ? { ...item, text: text.trim() } : item))
    );
  };

  const handleDeleteCheckItem = (itemId: string) => {
    triggerHaptic('warning', settings.enableHaptics);
    setPreviewChecklist((prev) => prev.filter((item) => item.id !== itemId));
  };

  const handleConfirmSave = () => {
    const finalTitle = editTitle.trim() || inputText.trim();
    const finalNotes = editNotes.trim();

    if (!finalTitle) {
      setErrorMessage('Title cannot be empty.');
      return;
    }

    // Check if all checklist items are completed -> whole task is complete
    const allChecked =
      previewChecklist.length > 0 && previewChecklist.every((item) => item.isCompleted);
    const now = new Date().toISOString();

    if (type === 'followup') {
      if (isEditing && existingItem) {
        updateFollowUp(existingItem.id, {
          title: finalTitle,
          notes: finalNotes,
          category: editCategory,
          priority: editPriority,
          dueDate: editDueDate,
          checklist: previewChecklist.length > 0 ? previewChecklist : undefined,
          isCompleted: previewChecklist.length > 0 ? allChecked : undefined,
          completedAt: allChecked ? now : undefined,
        });
      } else {
        addFollowUp({
          title: finalTitle,
          notes: finalNotes,
          category: editCategory,
          priority: editPriority,
          dueDate: editDueDate,
          checklist: previewChecklist.length > 0 ? previewChecklist : undefined,
        });
      }
    } else if (type === 'wishlist') {
      const price = parseFloat(editPrice) || 0;
      if (isEditing && existingItem) {
        updateWishlistItem(existingItem.id, {
          title: finalTitle,
          notes: finalNotes,
          category: editCategory,
          priority: editPriority,
          estimatedPriceSAR: price,
          checklist: previewChecklist.length > 0 ? previewChecklist : undefined,
        });
      } else {
        addWishlistItem({
          title: finalTitle,
          notes: finalNotes,
          estimatedPriceSAR: price,
          savedAmountSAR: 0,
          category: editCategory,
          priority: editPriority,
          checklist: previewChecklist.length > 0 ? previewChecklist : undefined,
        });
      }
    } else if (type === 'note') {
      if (isEditing && existingItem) {
        updateNote(existingItem.id, {
          title: finalTitle,
          content: finalNotes || finalTitle,
          category: editCategory,
          checklist: previewChecklist.length > 0 ? previewChecklist : undefined,
        });
      } else {
        addNote({
          title: finalTitle,
          content: finalNotes || finalTitle,
          category: editCategory,
          color: 'lavender',
          isPinned: false,
          checklist: previewChecklist.length > 0 ? previewChecklist : undefined,
        });
      }
    }

    triggerHaptic('success', settings.enableHaptics);
    confetti({
      particleCount: 40,
      spread: 50,
      origin: { y: 0.8 },
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-3xl shadow-2xl border border-slate-200/80 dark:border-slate-800 flex flex-col max-h-[90vh] overflow-hidden">
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between shrink-0 bg-gradient-to-r from-purple-500/10 via-indigo-500/5 to-transparent">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-purple-600 text-white flex items-center justify-center shadow-xs">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                <span>AI {getTypeName()} Assistant</span>
                <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300">
                  {isEditing ? 'Improve Existing' : 'New Entry'}
                </span>
              </h2>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Rephrases & organizes sub-points · Confirm with OK before saving
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

          {/* Form / Input */}
          {!previewData ? (
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  {isEditing
                    ? `Current ${getTypeName()} text:`
                    : `Type what you need to ${
                        type === 'followup'
                          ? 'follow up on'
                          : type === 'wishlist'
                          ? 'add to wishlist'
                          : 'note down'
                      }:`}
                </label>
                <textarea
                  ref={inputRef}
                  rows={3}
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder={
                    type === 'followup'
                      ? 'e.g. I want to repair my washing machine. First I need to confirm the fault, either programming or internal part. After confirming programming, I can proceed with repairing internal parts. If the issue is huge, I will go for a purchase of a new one.'
                      : type === 'wishlist'
                      ? 'e.g. Android screen head unit for car with wireless carplay'
                      : 'e.g. Room change moving checklist: box packing, wifi transfer, keys handover'
                  }
                  className="w-full p-3 text-xs rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-purple-500/30 text-slate-900 dark:text-white"
                />
              </div>

              {type === 'wishlist' && (
                <div>
                  <label className="block text-[11px] font-medium text-slate-500 dark:text-slate-400 mb-1">
                    Estimated Price in SAR (optional — AI will suggest if empty):
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-2.5 text-xs font-bold text-slate-400">SAR</span>
                    <input
                      type="number"
                      step="any"
                      value={editPrice}
                      onChange={(e) => setEditPrice(e.target.value)}
                      placeholder="e.g. 350 (or leave empty for AI suggestion)"
                      className="w-full pl-12 pr-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-[11px] font-medium text-slate-500 dark:text-slate-400 mb-1">
                  Additional notes or details (optional):
                </label>
                <textarea
                  rows={2}
                  value={inputNotes}
                  onChange={(e) => setInputNotes(e.target.value)}
                  placeholder="Any extra context or requirements..."
                  className="w-full p-2.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-purple-500/30 text-slate-900 dark:text-white"
                />
              </div>

              <div className="p-3 rounded-2xl bg-purple-50/50 dark:bg-purple-950/20 border border-purple-200/50 dark:border-purple-800/30 flex items-center gap-2 text-[11px] text-purple-700 dark:text-purple-300">
                <Sparkles className="w-3.5 h-3.5 shrink-0" />
                <span>
                  The AI rephrases cleanly, breaks multiple steps into an actionable checklist, and shows a preview before saving.
                </span>
              </div>
            </div>
          ) : (
            /* ================= PREVIEW & CONFIRMATION (OK) ================= */
            <div className="space-y-3.5 animate-in fade-in duration-200">
              <div className="p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/60 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2 text-emerald-800 dark:text-emerald-300">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span className="font-semibold">AI Preview Generated</span>
                </div>
                <span className="text-[10px] text-emerald-600 dark:text-emerald-400">
                  Review & confirm below
                </span>
              </div>

              {/* Before vs After comparison */}
              <div className="space-y-2">
                <div className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-700/60 text-xs">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-0.5">
                    Original input:
                  </span>
                  <p className="text-slate-600 dark:text-slate-400 italic">
                    {inputText}
                  </p>
                </div>

                <div className="p-3.5 rounded-2xl bg-purple-500/5 border border-purple-300/80 dark:border-purple-800/60 space-y-2">
                  <span className="text-[10px] font-bold text-purple-700 dark:text-purple-300 uppercase tracking-wider flex items-center gap-1">
                    <Sparkles className="w-3 h-3" />
                    Rephrased Title (Editable):
                  </span>
                  <input
                    type="text"
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    className="w-full p-2 text-xs font-bold rounded-xl bg-white dark:bg-slate-900 border border-purple-200 dark:border-purple-800 focus:outline-none focus:ring-2 focus:ring-purple-500/30 text-slate-900 dark:text-white"
                  />

                  {editNotes && (
                    <div>
                      <span className="text-[10px] text-slate-400 block mb-0.5">
                        Cleaned Notes:
                      </span>
                      <textarea
                        rows={2}
                        value={editNotes}
                        onChange={(e) => setEditNotes(e.target.value)}
                        className="w-full p-2 text-xs rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 focus:outline-none text-slate-800 dark:text-slate-200"
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* Checklist / Sub-points Section */}
              <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-700/60">
                <ChecklistSection
                  items={previewChecklist}
                  title="Checklist / Sub-tasks (with checkboxes)"
                  accentColor="purple"
                  onToggle={handleToggleCheckItem}
                  onAdd={handleAddCheckItem}
                  onUpdate={handleUpdateCheckItem}
                  onDelete={handleDeleteCheckItem}
                  allowAdd={true}
                />
              </div>

              {/* Suggested Metadata */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
                <div>
                  <label className="block text-[10px] font-semibold text-slate-400 mb-0.5">
                    Category
                  </label>
                  <select
                    value={editCategory}
                    onChange={(e) => setEditCategory(e.target.value)}
                    className="w-full px-2 py-1.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 focus:outline-none"
                  >
                    {categories.map((c) => (
                      <option key={c.name} value={c.name}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-semibold text-slate-400 mb-0.5">
                    Priority
                  </label>
                  <select
                    value={editPriority}
                    onChange={(e) => setEditPriority(e.target.value as any)}
                    className="w-full px-2 py-1.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 focus:outline-none"
                  >
                    <option value="high">High</option>
                    <option value="medium">Medium</option>
                    <option value="low">Low</option>
                  </select>
                </div>

                {type === 'wishlist' ? (
                  <div>
                    <label className="block text-[10px] font-semibold text-slate-400 mb-0.5">
                      Estimated Price (SAR)
                    </label>
                    <input
                      type="number"
                      step="any"
                      value={editPrice}
                      onChange={(e) => setEditPrice(e.target.value)}
                      placeholder="SAR 0"
                      className="w-full px-2 py-1.5 text-xs font-bold rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 focus:outline-none"
                    />
                  </div>
                ) : type === 'followup' ? (
                  <div>
                    <label className="block text-[10px] font-semibold text-slate-400 mb-0.5">
                      Due Date
                    </label>
                    <input
                      type="date"
                      value={editDueDate}
                      onChange={(e) => setEditDueDate(e.target.value)}
                      className="w-full px-2 py-1.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 focus:outline-none"
                    />
                  </div>
                ) : null}
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 sm:p-5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3 bg-slate-50/50 dark:bg-slate-900/50 shrink-0">
          {!previewData ? (
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
                onClick={handleRephrase}
                disabled={isProcessing || !inputText.trim()}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white text-xs font-bold flex items-center gap-2 shadow-sm transition-all disabled:opacity-50"
              >
                {isProcessing ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Polishing with AI...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>Rephrase & Preview</span>
                  </>
                )}
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={() => setPreviewData(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                Back to Edit
              </button>

              <button
                type="button"
                onClick={handleConfirmSave}
                className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-2 shadow-sm transition-all"
              >
                <Check className="w-4 h-4" />
                <span>OK (Confirm & Save)</span>
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

import React, { useState } from 'react';
import { X, Tag, Plus, Edit2, Trash2, ArrowUp, ArrowDown } from 'lucide-react';
import { ExpenseCategory } from '../../types';
import { motion, AnimatePresence } from 'motion/react';

interface ManageCategoriesModalProps {
  isOpen: boolean;
  onClose: () => void;
  categories: ExpenseCategory[];
  onAddCategory: (name: string, color?: string) => void;
  onRenameCategory: (categoryId: string, newName: string) => void;
  onDeleteCategory: (categoryId: string) => void;
  onReorderCategories: (newCategories: ExpenseCategory[]) => void;
}

const CATEGORY_COLORS = [
  '#f59e0b',
  '#ef4444',
  '#ec4899',
  '#6366f1',
  '#3b82f6',
  '#14b8a6',
  '#8b5cf6',
  '#10b981',
  '#64748b',
];

export const ManageCategoriesModal: React.FC<ManageCategoriesModalProps> = ({
  isOpen,
  onClose,
  categories,
  onAddCategory,
  onRenameCategory,
  onDeleteCategory,
  onReorderCategories,
}) => {
  const [newCatName, setNewCatName] = useState('');
  const [editingCatId, setEditingCatId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');

  if (!isOpen) return null;

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName.trim()) return;
    const randomColor = CATEGORY_COLORS[Math.floor(Math.random() * CATEGORY_COLORS.length)];
    onAddCategory(newCatName.trim(), randomColor);
    setNewCatName('');
  };

  const handleStartRename = (cat: ExpenseCategory) => {
    setEditingCatId(cat.id);
    setEditingName(cat.name);
  };

  const handleSaveRename = (catId: string) => {
    if (!editingName.trim()) return;
    onRenameCategory(catId, editingName.trim());
    setEditingCatId(null);
  };

  const handleMove = (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= categories.length) return;

    const updated = [...categories];
    const temp = updated[index];
    updated[index] = updated[targetIndex];
    updated[targetIndex] = temp;

    // reassign orders
    const reordered = updated.map((cat, idx) => ({ ...cat, order: idx + 1 }));
    onReorderCategories(reordered);
  };

  const handleDelete = (cat: ExpenseCategory) => {
    if (
      window.confirm(
        `Delete "${cat.name}" category? Historical transactions with this category will be preserved as Uncategorized.`
      )
    ) {
      onDeleteCategory(cat.id);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/70 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0"
          onClick={onClose}
        />

        <motion.div
          initial={{ y: '100%' }}
          animate={{ y: 0 }}
          exit={{ y: '100%' }}
          transition={{ type: 'spring', damping: 28, stiffness: 300 }}
          className="relative w-full max-w-lg bg-[#13151c]/95 backdrop-blur-2xl rounded-t-3xl sm:rounded-3xl shadow-2xl shadow-purple-950/50 border border-white/15 max-h-[90vh] overflow-y-auto flex flex-col z-10 text-slate-200"
        >
          {/* Top handle */}
          <div className="flex justify-center pt-3 pb-1 sm:hidden">
            <div className="w-10 h-1.5 bg-white/20 rounded-full" />
          </div>

          {/* Header */}
          <div className="px-5 py-4 border-b border-white/10 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-purple-600/30 border border-purple-500/40 text-purple-300 flex items-center justify-center shadow-lg shadow-purple-600/30">
                <Tag className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-base font-bold text-white tracking-tight">
                  Expense Categories
                </h2>
                <p className="text-[11px] text-slate-400">
                  Customizable category tags
                </p>
              </div>
            </div>

            <button
              type="button"
              id="btn-close-manage-categories"
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-xl hover:bg-white/10 cursor-pointer transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="p-5 space-y-4">
            {/* Add Category Form */}
            <form onSubmit={handleAdd} className="flex gap-2">
              <input
                type="text"
                id="input-new-category-name"
                value={newCatName}
                onChange={(e) => setNewCatName(e.target.value)}
                placeholder="New category (e.g. Gym, Travel, Books)"
                className="flex-1 px-3.5 py-2.5 bg-white/5 border border-white/15 rounded-2xl text-xs text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500/40"
              />
              <button
                type="submit"
                id="btn-add-category"
                disabled={!newCatName.trim()}
                className="py-2.5 px-4 rounded-2xl bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-md shadow-purple-600/30 transition-all active:scale-98"
              >
                <Plus className="w-4 h-4" />
                <span>Add</span>
              </button>
            </form>

            {/* Explanatory note */}
            <div className="p-3 rounded-2xl bg-white/5 border border-white/10 text-[11px] text-slate-300">
              💡 Categories are optional. Renaming a category updates all past expenses. Deleting a category keeps the historical transaction as Uncategorized.
            </div>

            {/* Categories List */}
            <div className="space-y-2">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-widest block">
                User Categories ({categories.length})
              </span>

              {categories.map((cat, index) => {
                const isEditing = editingCatId === cat.id;

                if (isEditing) {
                  return (
                    <div
                      key={cat.id}
                      className="p-2.5 rounded-2xl bg-white/10 border border-purple-500/40 flex items-center gap-2"
                    >
                      <input
                        type="text"
                        value={editingName}
                        onChange={(e) => setEditingName(e.target.value)}
                        className="flex-1 px-3 py-1.5 bg-white/5 border border-white/15 rounded-xl text-xs text-white focus:outline-none"
                        autoFocus
                      />
                      <button
                        type="button"
                        onClick={() => handleSaveRename(cat.id)}
                        className="px-3 py-1.5 bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold rounded-xl cursor-pointer"
                      >
                        Save
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditingCatId(null)}
                        className="px-2 py-1.5 text-slate-400 hover:text-white text-xs cursor-pointer"
                      >
                        Cancel
                      </button>
                    </div>
                  );
                }

                return (
                  <div
                    key={cat.id}
                    className="p-3 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-between hover:bg-white/10 transition-colors"
                  >
                    <div className="flex items-center gap-2.5">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: cat.color || '#a855f7' }}
                      />
                      <span className="text-xs font-bold text-white">{cat.name}</span>
                    </div>

                    <div className="flex items-center gap-1">
                      {/* Reorder Buttons */}
                      <button
                        type="button"
                        onClick={() => handleMove(index, 'up')}
                        disabled={index === 0}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-white disabled:opacity-30 cursor-pointer"
                        title="Move Up"
                      >
                        <ArrowUp className="w-3.5 h-3.5" />
                      </button>

                      <button
                        type="button"
                        onClick={() => handleMove(index, 'down')}
                        disabled={index === categories.length - 1}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-white disabled:opacity-30 cursor-pointer"
                        title="Move Down"
                      >
                        <ArrowDown className="w-3.5 h-3.5" />
                      </button>

                      <button
                        type="button"
                        onClick={() => handleStartRename(cat)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-white cursor-pointer"
                        title="Rename"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDelete(cat)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 cursor-pointer"
                        title="Delete Category"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

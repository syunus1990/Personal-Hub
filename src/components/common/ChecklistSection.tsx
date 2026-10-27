import React, { useState } from 'react';
import {
  CheckSquare,
  Square,
  Plus,
  Trash2,
  Edit2,
  Check,
  X,
  Clock,
  Sparkles,
} from 'lucide-react';
import { ChecklistItem } from '../../types';

export function formatChecklistTimestamp(dateStr?: string): string {
  if (!dateStr) return '';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    const now = new Date();
    const isToday = d.toDateString() === now.toDateString();
    const timeStr = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    if (isToday) {
      return `Today, ${timeStr}`;
    }
    const datePart = d.toLocaleDateString([], { month: 'short', day: 'numeric' });
    return `${datePart}, ${timeStr}`;
  } catch {
    return dateStr;
  }
}

interface ChecklistSectionProps {
  items?: ChecklistItem[];
  title?: string;
  onToggle: (itemId: string) => void;
  onAdd?: (text: string) => void;
  onUpdate?: (itemId: string, text: string) => void;
  onDelete?: (itemId: string) => void;
  allowAdd?: boolean;
  accentColor?: 'purple' | 'rose' | 'amber' | 'emerald' | 'blue';
  compact?: boolean;
}

export const ChecklistSection: React.FC<ChecklistSectionProps> = ({
  items = [],
  title = 'Checklist & Sub-points',
  onToggle,
  onAdd,
  onUpdate,
  onDelete,
  allowAdd = true,
  accentColor = 'rose',
  compact = false,
}) => {
  const [newText, setNewText] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState('');

  const completedCount = items.filter((i) => i.isCompleted).length;
  const totalCount = items.length;
  const allCompleted = totalCount > 0 && completedCount === totalCount;

  const handleAddAction = (e?: React.SyntheticEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    if (!newText.trim() || !onAdd) return;
    onAdd(newText.trim());
    setNewText('');
  };

  const handleStartEdit = (item: ChecklistItem, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingItemId(item.id);
    setEditingText(item.text);
  };

  const handleSaveEdit = (itemId: string, e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!editingText.trim() || !onUpdate) {
      setEditingItemId(null);
      return;
    }
    onUpdate(itemId, editingText.trim());
    setEditingItemId(null);
  };

  const colorStyles = {
    rose: {
      checkActive: 'bg-rose-500 border-rose-500 text-white',
      badge: 'bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 border-rose-200/60',
      btn: 'text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40',
    },
    purple: {
      checkActive: 'bg-purple-600 border-purple-600 text-white',
      badge: 'bg-purple-50 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300 border-purple-200/60',
      btn: 'text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-950/40',
    },
    amber: {
      checkActive: 'bg-amber-500 border-amber-500 text-white',
      badge: 'bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border-amber-200/60',
      btn: 'text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/40',
    },
    emerald: {
      checkActive: 'bg-emerald-500 border-emerald-500 text-white',
      badge: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-200/60',
      btn: 'text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/40',
    },
    blue: {
      checkActive: 'bg-blue-500 border-blue-500 text-white',
      badge: 'bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border-blue-200/60',
      btn: 'text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/40',
    },
  }[accentColor];

  if (items.length === 0 && !allowAdd) {
    return null;
  }

  return (
    <div
      className={`mt-2.5 pt-2.5 border-t border-slate-100 dark:border-slate-800/80 space-y-2 ${
        compact ? 'text-xs' : ''
      }`}
      onClick={(e) => e.stopPropagation()}
    >
      {/* Header bar */}
      <div className="flex items-center justify-between text-[11px]">
        <div className="flex items-center gap-1.5 font-semibold text-slate-700 dark:text-slate-300">
          <CheckSquare className="w-3.5 h-3.5 text-slate-400" />
          <span>{title}</span>
          {totalCount > 0 && (
            <span
              className={`px-1.5 py-0.2 rounded-md text-[10px] font-bold border ${
                allCompleted
                  ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300 border-emerald-200'
                  : colorStyles.badge
              }`}
            >
              {completedCount}/{totalCount}
            </span>
          )}
        </div>

        {allowAdd && onAdd && !isAdding && (
          <button
            type="button"
            onClick={() => setIsAdding(true)}
            className={`flex items-center gap-0.5 text-[10px] font-semibold transition-colors px-1.5 py-0.5 rounded-lg ${colorStyles.btn}`}
          >
            <Plus className="w-3 h-3" />
            <span>Add Note</span>
          </button>
        )}
      </div>

      {/* Checklist items */}
      {items.length > 0 && (
        <div className="space-y-1.5">
          {items.map((item) => {
            const isEditingThis = editingItemId === item.id;

            return (
              <div
                key={item.id}
                className={`group flex items-start justify-between gap-2 p-1.5 rounded-xl transition-colors ${
                  item.isCompleted
                    ? 'bg-slate-50/60 dark:bg-slate-900/30 text-slate-400'
                    : 'bg-white/60 dark:bg-slate-800/40 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200'
                } border border-slate-200/50 dark:border-slate-800/60`}
              >
                {/* Checkbox */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggle(item.id);
                  }}
                  className={`w-4 h-4 rounded-md border flex items-center justify-center shrink-0 mt-0.5 transition-all duration-150 ${
                    item.isCompleted
                      ? colorStyles.checkActive
                      : 'border-slate-300 dark:border-slate-600 hover:border-slate-400 bg-white dark:bg-slate-900'
                  }`}
                  title={item.isCompleted ? 'Uncheck note' : 'Check note off'}
                >
                  {item.isCompleted && (
                    <span className="text-[10px] font-bold leading-none">✓</span>
                  )}
                </button>

                {/* Text or Edit Input */}
                <div className="flex-1 min-w-0">
                  {isEditingThis ? (
                    <div
                      className="flex items-center gap-1"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <input
                        type="text"
                        autoFocus
                        value={editingText}
                        onChange={(e) => setEditingText(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            e.stopPropagation();
                            handleSaveEdit(item.id, e);
                          } else if (e.key === 'Escape') {
                            setEditingItemId(null);
                          }
                        }}
                        className="w-full text-xs px-2 py-0.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={(e) => handleSaveEdit(item.id, e)}
                        className="w-5 h-5 rounded flex items-center justify-center text-emerald-600 hover:bg-emerald-50"
                      >
                        <Check className="w-3 h-3" />
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditingItemId(null);
                        }}
                        className="w-5 h-5 rounded flex items-center justify-center text-slate-400 hover:bg-slate-100"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ) : (
                    <div>
                      <p
                        className={`text-xs leading-relaxed select-text ${
                          item.isCompleted
                            ? 'line-through text-slate-400 dark:text-slate-500'
                            : 'font-medium'
                        }`}
                      >
                        {item.text}
                      </p>
                      {item.isCompleted && item.completedAt && (
                        <span className="flex items-center gap-1 text-[9px] text-slate-400 dark:text-slate-500 mt-0.5">
                          <Clock className="w-2.5 h-2.5" />
                          <span>Checked: {formatChecklistTimestamp(item.completedAt)}</span>
                        </span>
                      )}
                    </div>
                  )}
                </div>

                {/* Edit / Delete actions */}
                {!isEditingThis && (
                  <div className="flex items-center gap-0.5 opacity-80 group-hover:opacity-100 transition-opacity shrink-0">
                    {onUpdate && (
                      <button
                        type="button"
                        onClick={(e) => handleStartEdit(item, e)}
                        className="w-5 h-5 rounded flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                        title="Edit note"
                      >
                        <Edit2 className="w-2.5 h-2.5" />
                      </button>
                    )}
                    {onDelete && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onDelete(item.id);
                        }}
                        className="w-5 h-5 rounded flex items-center justify-center text-slate-400 hover:text-rose-500"
                        title="Delete note"
                      >
                        <Trash2 className="w-2.5 h-2.5" />
                      </button>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Inline add form */}
      {isAdding && (
        <div
          className="flex items-center gap-1 pt-1"
          onClick={(e) => e.stopPropagation()}
        >
          <input
            type="text"
            autoFocus
            value={newText}
            onChange={(e) => setNewText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                e.stopPropagation();
                handleAddAction(e);
              } else if (e.key === 'Escape') {
                setIsAdding(false);
                setNewText('');
              }
            }}
            placeholder="Add sub-task / note (e.g. check programming)..."
            className="flex-1 text-xs px-2.5 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-purple-400"
          />
          <button
            type="button"
            onClick={(e) => handleAddAction(e)}
            disabled={!newText.trim()}
            className="px-2.5 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold disabled:opacity-40 transition-opacity"
          >
            Add
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setIsAdding(false);
              setNewText('');
            }}
            className="w-7 h-7 rounded-xl flex items-center justify-center text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </div>
  );
};

import React, { useState } from 'react';
import {
  FileText,
  Plus,
  Pin,
  Trash2,
  Edit3,
  Calendar,
  Sparkles,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { SummaryCard } from '../common/SummaryCard';
import { ChecklistSection } from '../common/ChecklistSection';
import { Note, NoteColor } from '../../types';

export const NotesView: React.FC = () => {
  const {
    notes,
    openEditModal,
    openAIItemModal,
    deleteNote,
    togglePinNote,
    toggleNoteChecklistItem,
    addNoteChecklistItem,
    updateNoteChecklistItem,
    deleteNoteChecklistItem,
    searchQuery,
  } = useApp();

  const [selectedCategory, setSelectedCategory] = useState<string>('All');

  // Extract unique categories
  const categories = ['All', ...Array.from(new Set(notes.map((n) => n.category)))];

  const filteredNotes = notes.filter((note) => {
    if (selectedCategory !== 'All' && note.category !== selectedCategory) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        note.title.toLowerCase().includes(q) ||
        note.content.toLowerCase().includes(q) ||
        note.category.toLowerCase().includes(q)
      );
    }
    return true;
  });

  // Sort pinned first, then updated recently
  const sortedNotes = [...filteredNotes].sort((a, b) => {
    if (a.isPinned && !b.isPinned) return -1;
    if (!a.isPinned && b.isPinned) return 1;
    return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
  });

  const getPastelColorStyles = (color: NoteColor) => {
    switch (color) {
      case 'lavender':
        return 'bg-purple-50/80 dark:bg-purple-950/30 border-purple-200/70 dark:border-purple-800/40 text-purple-950 dark:text-purple-100';
      case 'mint':
        return 'bg-emerald-50/80 dark:bg-emerald-950/30 border-emerald-200/70 dark:border-emerald-800/40 text-emerald-950 dark:text-emerald-100';
      case 'peach':
        return 'bg-rose-50/80 dark:bg-rose-950/30 border-rose-200/70 dark:border-rose-800/40 text-rose-950 dark:text-rose-100';
      case 'sky':
        return 'bg-sky-50/80 dark:bg-sky-950/30 border-sky-200/70 dark:border-sky-800/40 text-sky-950 dark:text-sky-100';
      case 'butter':
        return 'bg-amber-50/80 dark:bg-amber-950/30 border-amber-200/70 dark:border-amber-800/40 text-amber-950 dark:text-amber-100';
      case 'slate':
      default:
        return 'bg-slate-50/80 dark:bg-slate-900/50 border-slate-200/70 dark:border-slate-800/50 text-slate-900 dark:text-slate-100';
    }
  };

  return (
    <div className="space-y-4 pb-24">
      {/* 1. Summary Widget */}
      <SummaryCard
        title="Notes & Memos"
        badge="Prime Codex"
        primaryLabel="Total Written Notes"
        primaryValue={`${notes.length} Notes`}
        metrics={[
          {
            label: 'Pinned to Top',
            value: `${notes.filter((n) => n.isPinned).length}`,
            accentClass: 'text-purple-600 dark:text-purple-400',
          },
          {
            label: 'Categories',
            value: `${categories.length - 1}`,
            accentClass: 'text-slate-700 dark:text-slate-300',
          },
          {
            label: 'Filter Active',
            value: selectedCategory,
            accentClass: 'text-indigo-600 dark:text-indigo-400',
          },
        ]}
        gradientFrom="from-purple-500/10"
        gradientTo="to-pink-500/10"
      />

      {/* Category Pills & Add Button */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1 rounded-xl text-xs font-medium transition-colors shrink-0 ${
                selectedCategory === cat
                  ? 'bg-purple-600 text-white shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <button
            onClick={() => openAIItemModal('note')}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-purple-100 hover:bg-purple-200 dark:bg-purple-950/60 dark:hover:bg-purple-900/60 text-purple-700 dark:text-purple-300 border border-purple-300 dark:border-purple-800 text-xs font-semibold shadow-2xs transition-colors"
            title="AI Quick Add Note (Rephrase & Clean with preview)"
          >
            <Sparkles className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
            <span>AI Add</span>
          </button>

          <button
            onClick={() => openEditModal('note')}
            className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold shadow-xs transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Note</span>
          </button>
        </div>
      </div>

      {/* Notes Grid (Masonry or clean card stack) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {sortedNotes.map((note) => {
          const colorStyles = getPastelColorStyles(note.color);

          return (
            <div
              key={note.id}
              onClick={() => openEditModal('note', note.id, note)}
              className={`rounded-3xl p-4 border transition-all duration-200 cursor-pointer shadow-xs hover:shadow-md hover:scale-[1.01] flex flex-col justify-between ${colorStyles}`}
            >
              <div>
                {/* Note Header */}
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500/80 dark:text-slate-400">
                      {note.category}
                    </span>
                    {note.isPinned && (
                      <span className="flex items-center gap-0.5 text-[10px] font-semibold text-purple-600 dark:text-purple-400">
                        · <Pin className="w-2.5 h-2.5 fill-current" />
                      </span>
                    )}
                  </div>

                  <div
                    className="flex items-center gap-1 shrink-0"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <button
                      onClick={() => openAIItemModal('note', note)}
                      className="w-6 h-6 rounded-lg flex items-center justify-center text-purple-600 dark:text-purple-300 hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
                      title="Improve & rephrase note with AI"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => togglePinNote(note.id)}
                      className={`w-6 h-6 rounded-lg flex items-center justify-center transition-colors ${
                        note.isPinned
                          ? 'text-purple-600 dark:text-purple-300'
                          : 'text-slate-400 hover:text-slate-600'
                      }`}
                      title={note.isPinned ? 'Unpin note' : 'Pin note to top'}
                    >
                      <Pin className={`w-3.5 h-3.5 ${note.isPinned ? 'fill-current' : ''}`} />
                    </button>
                    <button
                      onClick={() => deleteNote(note.id)}
                      className="w-6 h-6 rounded-lg flex items-center justify-center text-slate-400 hover:text-rose-500 transition-colors"
                      title="Delete note"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Note Title */}
                <h3 className="text-sm font-bold tracking-tight mb-1.5 line-clamp-2">
                  {note.title}
                </h3>

                {/* Note Body */}
                <p className="text-xs opacity-85 whitespace-pre-line line-clamp-4 font-normal leading-relaxed">
                  {note.content}
                </p>

                {/* Checklist notes / sub-points */}
                <ChecklistSection
                  items={note.checklist || []}
                  title="Checklist / Action Points"
                  accentColor="purple"
                  onToggle={(subId) => toggleNoteChecklistItem(note.id, subId)}
                  onAdd={(text) => addNoteChecklistItem(note.id, text)}
                  onUpdate={(subId, text) => updateNoteChecklistItem(note.id, subId, text)}
                  onDelete={(subId) => deleteNoteChecklistItem(note.id, subId)}
                  allowAdd={true}
                  compact={true}
                />
              </div>

              {/* Note Footer */}
              <div className="mt-3 pt-2.5 border-t border-black/5 dark:border-white/5 flex items-center justify-between text-[10px] opacity-60">
                <span>
                  {new Date(note.updatedAt).toLocaleDateString(undefined, {
                    month: 'short',
                    day: 'numeric',
                  })}
                </span>
                <span className="flex items-center gap-1">
                  <Edit3 className="w-2.5 h-2.5" /> Tap to Edit
                </span>
              </div>
            </div>
          );
        })}

        {sortedNotes.length === 0 && (
          <div className="col-span-full text-center py-10 glass-card rounded-3xl text-slate-400 text-xs">
            No notes found. Tap New Note to write down ideas, thoughts, or checklists!
          </div>
        )}
      </div>
    </div>
  );
};

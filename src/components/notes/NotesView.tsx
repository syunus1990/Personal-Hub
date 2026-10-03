import React, { useState, useMemo } from 'react';
import {
  FileText,
  Search,
  Plus,
  Trash2,
  Edit2,
  Calendar,
  Tag,
  X,
  Check,
  AlignLeft,
} from 'lucide-react';
import { Note } from '../../types';
import { formatDate } from '../../utils/dateUtils';
import { motion, AnimatePresence } from 'motion/react';

interface NotesViewProps {
  notes: Note[];
  onAddNote: (note: Omit<Note, 'id' | 'createdDate' | 'modifiedDate'>) => void;
  onUpdateNote: (note: Note) => void;
  onDeleteNote: (noteId: string) => void;
}

export const NotesView: React.FC<NotesViewProps> = ({
  notes,
  onAddNote,
  onUpdateNote,
  onDeleteNote,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTag, setSelectedTag] = useState<string>('All');
  const [editingNote, setEditingNote] = useState<Note | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  // Form states
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [tagsInput, setTagsInput] = useState('');

  // Extract all unique tags
  const allTags = useMemo(() => {
    const set = new Set<string>();
    notes.forEach((n) => {
      n.tags?.forEach((t) => set.add(t));
    });
    return Array.from(set);
  }, [notes]);

  const filteredNotes = useMemo(() => {
    return notes.filter((n) => {
      if (selectedTag !== 'All') {
        if (!n.tags || !n.tags.includes(selectedTag)) return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchTitle = n.title.toLowerCase().includes(q);
        const matchContent = n.content.toLowerCase().includes(q);
        const matchTags = n.tags?.some((t) => t.toLowerCase().includes(q)) ?? false;
        return matchTitle || matchContent || matchTags;
      }
      return true;
    });
  }, [notes, selectedTag, searchQuery]);

  const handleStartCreate = () => {
    window.scrollTo({ top: 0, behavior: 'instant' });
    setIsCreating(true);
    setEditingNote(null);
    setTitle('');
    setContent('');
    setTagsInput('');
  };

  const handleStartEdit = (note: Note) => {
    window.scrollTo({ top: 0, behavior: 'instant' });
    setEditingNote(note);
    setIsCreating(false);
    setTitle(note.title);
    setContent(note.content);
    setTagsInput(note.tags ? note.tags.join(', ') : '');
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() && !content.trim()) {
      alert('Please enter a title or note content.');
      return;
    }

    const parsedTags = tagsInput
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);

    const todayDate = new Date().toISOString().slice(0, 10);
    const nowIso = new Date().toISOString();

    if (isCreating) {
      onAddNote({
        title: title.trim() || 'Untitled Note',
        content: content.trim(),
        tags: parsedTags.length > 0 ? parsedTags : undefined,
        createdDate: todayDate,
        modifiedDate: todayDate,
        createdAt: nowIso,
        updatedAt: nowIso,
      } as any);
      setIsCreating(false);
    } else if (editingNote) {
      onUpdateNote({
        ...editingNote,
        title: title.trim() || 'Untitled Note',
        content: content.trim(),
        tags: parsedTags.length > 0 ? parsedTags : undefined,
        modifiedDate: todayDate,
        updatedAt: nowIso,
      });
      setEditingNote(null);
    }
  };

  const handleDelete = (note: Note) => {
    if (window.confirm(`Delete note "${note.title}"?`)) {
      onDeleteNote(note.id);
      if (editingNote?.id === note.id) {
        setEditingNote(null);
      }
    }
  };

  return (
    <div className="p-4 space-y-4 pb-20">
      {/* Top action & Search */}
      <div className="space-y-2.5">
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              id="input-search-notes"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search notes, tags, or content..."
              className="w-full pl-10 pr-4 py-2.5 bg-white/5 border border-white/10 rounded-2xl text-xs text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
            />
          </div>

          <button
            type="button"
            id="btn-create-new-note"
            onClick={handleStartCreate}
            className="py-2.5 px-4 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-lg shadow-blue-950/50 active:scale-98 transition-all shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>New Note</span>
          </button>
        </div>

        {/* Tag Filters */}
        {allTags.length > 0 && (
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest pl-1 shrink-0">
              Tags:
            </span>
            <button
              type="button"
              onClick={() => setSelectedTag('All')}
              className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap border transition-all cursor-pointer ${
                selectedTag === 'All'
                  ? 'bg-blue-600 text-white border-blue-400 shadow-sm'
                  : 'bg-white/5 border-white/10 text-slate-400 hover:text-white'
              }`}
            >
              All
            </button>
            {allTags.map((tag) => (
              <button
                key={tag}
                type="button"
                onClick={() => setSelectedTag(tag)}
                className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap border transition-all cursor-pointer ${
                  selectedTag === tag
                    ? 'bg-blue-600 text-white border-blue-400 shadow-sm'
                    : 'bg-white/5 border-white/10 text-slate-400 hover:text-white'
                }`}
              >
                #{tag}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Notes Grid */}
      <div className="space-y-3">
        <div className="flex items-center justify-between text-xs text-slate-400 font-semibold px-1">
          <span>{filteredNotes.length} Saved Notes</span>
          <span>100% Private & Local</span>
        </div>

        {filteredNotes.length === 0 ? (
          <div className="p-8 text-center rounded-[2rem] bg-white/5 border border-white/10 text-slate-400 space-y-3 backdrop-blur-xl">
            <div className="w-12 h-12 rounded-2xl bg-blue-500/20 text-blue-300 border border-blue-500/30 flex items-center justify-center mx-auto shadow-lg shadow-blue-950/40">
              <FileText className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-bold text-white">No Notes Saved Yet</p>
              <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto">
                Write down quick thoughts, passport numbers, checklists, or personal memos stored 100% offline.
              </p>
            </div>
            <button
              type="button"
              onClick={handleStartCreate}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-2xl cursor-pointer shadow-lg shadow-blue-600/30 active:scale-97 transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>+ Create First Note</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {filteredNotes.map((note) => (
              <div
                key={note.id}
                onClick={() => handleStartEdit(note)}
                className="p-4 rounded-3xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-blue-500/40 backdrop-blur-xl transition-all cursor-pointer flex flex-col justify-between space-y-3 group"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="text-sm font-bold text-white group-hover:text-blue-300 transition-colors">
                      {note.title}
                    </h3>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(note);
                        }}
                        className="p-1 rounded-lg text-slate-400 hover:text-rose-400 cursor-pointer"
                        title="Delete Note"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <p className="text-xs text-slate-300 line-clamp-3 mt-1.5 whitespace-pre-wrap leading-relaxed">
                    {note.content}
                  </p>
                </div>

                <div className="space-y-2 pt-2 border-t border-white/5">
                  {note.tags && note.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {note.tags.map((t) => (
                        <span
                          key={t}
                          className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-blue-500/10 text-blue-300 border border-blue-500/20"
                        >
                          #{t}
                        </span>
                      ))}
                    </div>
                  )}

                  <div className="text-[10px] text-slate-400 font-medium">
                    Updated {(() => {
                      const d = note.updatedAt || note.modifiedDate || note.createdDate;
                      return d ? formatDate(d.slice(0, 10)) : 'Recently';
                    })()}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create / Edit Note Modal */}
      {(isCreating || editingNote) && (
        <div className="fixed inset-0 z-50 flex items-start sm:items-center justify-center p-3 sm:p-4 pt-6 sm:pt-4 bg-black/80 backdrop-blur-2xl overflow-y-auto">
          <div className="bg-[#13151c]/95 backdrop-blur-2xl border border-white/20 rounded-[2rem] p-5 sm:p-6 max-w-lg w-full space-y-4 shadow-2xl shadow-blue-950/60 max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-white">
                {isCreating ? 'Create Note' : 'Edit Note'}
              </h3>
              <button
                type="button"
                onClick={() => {
                  setIsCreating(false);
                  setEditingNote(null);
                }}
                className="p-1.5 text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-widest mb-1">
                  Title
                </label>
                <input
                  type="text"
                  id="input-note-title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Note Title"
                  className="w-full px-3.5 py-2.5 bg-white/5 border border-white/15 rounded-2xl text-sm font-bold text-white focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-widest mb-1">
                  Content
                </label>
                <textarea
                  rows={7}
                  id="input-note-content"
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Write your note, list, or memo here..."
                  className="w-full px-3.5 py-2.5 bg-white/5 border border-white/15 rounded-2xl text-xs text-white focus:outline-none focus:ring-2 focus:ring-blue-500/40 leading-relaxed resize-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-widest mb-1 flex items-center gap-1">
                  <Tag className="w-3 h-3 text-slate-400" />
                  Tags (comma separated)
                </label>
                <input
                  type="text"
                  id="input-note-tags"
                  value={tagsInput}
                  onChange={(e) => setTagsInput(e.target.value)}
                  placeholder="e.g. personal, urgent, gym, car"
                  className="w-full px-3.5 py-2 bg-white/5 border border-white/15 rounded-2xl text-xs text-white focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                />
              </div>

              <div className="flex gap-2.5 pt-2">
                {editingNote && (
                  <button
                    type="button"
                    onClick={() => handleDelete(editingNote)}
                    className="p-3 rounded-2xl border border-rose-500/30 text-rose-300 hover:bg-rose-500/10 cursor-pointer"
                    title="Delete Note"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => {
                    setIsCreating(false);
                    setEditingNote(null);
                  }}
                  className="flex-1 py-3 rounded-2xl border border-white/15 text-slate-300 text-xs font-bold hover:bg-white/10 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  id="btn-save-note"
                  className="flex-2 py-3 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-lg shadow-blue-600/30 cursor-pointer active:scale-98 transition-all"
                >
                  {isCreating ? 'Create Note' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

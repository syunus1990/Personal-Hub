import React, { useState } from 'react';
import { X, Plus, Trash2, Edit2, Check, User, Users } from 'lucide-react';
import { Contributor } from '../../types';

interface ManageContributorsModalProps {
  isOpen: boolean;
  onClose: () => void;
  contributors: Contributor[];
  onAddContributor: (name: string) => void;
  onUpdateContributor: (id: string, name: string) => void;
  onDeleteContributor: (id: string) => void;
}

export const ManageContributorsModal: React.FC<ManageContributorsModalProps> = ({
  isOpen,
  onClose,
  contributors,
  onAddContributor,
  onUpdateContributor,
  onDeleteContributor,
}) => {
  const [newName, setNewName] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newName.trim();
    if (!trimmed) {
      setError('Please enter a contributor name');
      return;
    }
    if (contributors.some((c) => c.name.toLowerCase() === trimmed.toLowerCase())) {
      setError('A contributor with this name already exists');
      return;
    }

    onAddContributor(trimmed);
    setNewName('');
    setError('');
  };

  const handleStartEdit = (contrib: Contributor) => {
    setEditingId(contrib.id);
    setEditingName(contrib.name);
  };

  const handleSaveEdit = (id: string) => {
    const trimmed = editingName.trim();
    if (!trimmed) return;
    onUpdateContributor(id, trimmed);
    setEditingId(null);
    setEditingName('');
  };

  return (
    <div
      id="manage-contributors-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        id="manage-contributors-modal"
        className="w-full max-w-md bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border border-white/40 dark:border-slate-800/80 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200/60 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                Manage Contributors
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Track who pays for each loan installment
              </p>
            </div>
          </div>
          <button
            id="close-contributors-btn"
            onClick={onClose}
            className="p-2 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1">
          {/* Add Form */}
          <form onSubmit={handleAdd} className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Add New Contributor
            </label>
            <div className="flex gap-2">
              <input
                id="new-contributor-input"
                type="text"
                value={newName}
                onChange={(e) => {
                  setNewName(e.target.value);
                  if (error) setError('');
                }}
                placeholder="e.g. Sister, Business Partner"
                className="flex-1 px-4 py-2.5 rounded-2xl bg-slate-100/80 dark:bg-slate-800/80 border border-slate-200/60 dark:border-slate-700/60 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
              />
              <button
                id="add-contributor-btn"
                type="submit"
                className="px-4 py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-sm flex items-center gap-1.5 transition-colors shadow-sm"
              >
                <Plus className="w-4 h-4" />
                <span>Add</span>
              </button>
            </div>
            {error && <p className="text-xs text-rose-500 font-medium pl-1">{error}</p>}
          </form>

          {/* List */}
          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Active Contributors ({contributors.length})
            </label>
            <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
              {contributors.map((contrib) => (
                <div
                  key={contrib.id}
                  id={`contributor-row-${contrib.id}`}
                  className="flex items-center justify-between p-3 rounded-2xl bg-slate-50/90 dark:bg-slate-800/50 border border-slate-200/50 dark:border-slate-800/60 group hover:border-indigo-300 dark:hover:border-indigo-700/50 transition-colors"
                >
                  {editingId === contrib.id ? (
                    <div className="flex items-center gap-2 flex-1 mr-2">
                      <input
                        type="text"
                        value={editingName}
                        onChange={(e) => setEditingName(e.target.value)}
                        className="flex-1 px-3 py-1.5 rounded-xl bg-white dark:bg-slate-700 border border-indigo-400 text-slate-900 dark:text-white text-sm focus:outline-none"
                        autoFocus
                      />
                      <button
                        onClick={() => handleSaveEdit(contrib.id)}
                        className="p-1.5 rounded-xl bg-emerald-500 text-white hover:bg-emerald-600"
                        title="Save"
                      >
                        <Check className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-xl bg-slate-200/70 dark:bg-slate-700 flex items-center justify-center text-slate-600 dark:text-slate-300">
                        <User className="w-4 h-4" />
                      </div>
                      <span className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                        {contrib.name}
                      </span>
                      {contrib.isDefault && (
                        <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300">
                          Default
                        </span>
                      )}
                    </div>
                  )}

                  {editingId !== contrib.id && (
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleStartEdit(contrib)}
                        className="p-1.5 rounded-xl text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/30 transition-colors"
                        title="Rename"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      {!contrib.isDefault && (
                        <button
                          onClick={() => onDeleteContributor(contrib.id)}
                          className="p-1.5 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200/60 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-2xl bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-sm font-semibold transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};

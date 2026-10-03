import React, { useState } from 'react';
import { X, CreditCard, Plus, Edit2, Trash2, Check, AlertCircle } from 'lucide-react';
import { MoneyAccount } from '../../types';
import { motion, AnimatePresence } from 'motion/react';

interface ManageAccountsModalProps {
  isOpen: boolean;
  onClose: () => void;
  accounts: MoneyAccount[];
  onAddAccount: (name: string, openingBalance: number, color?: string) => void;
  onUpdateAccount: (account: MoneyAccount) => void;
  onDeleteAccount: (accountId: string) => void;
}

const COLOR_OPTIONS = [
  '#8b5cf6', // Violet
  '#06b6d4', // Cyan
  '#10b981', // Emerald
  '#f59e0b', // Amber
  '#ec4899', // Pink
  '#3b82f6', // Blue
  '#f97316', // Orange
  '#64748b', // Slate
];

export const ManageAccountsModal: React.FC<ManageAccountsModalProps> = ({
  isOpen,
  onClose,
  accounts,
  onAddAccount,
  onUpdateAccount,
  onDeleteAccount,
}) => {
  const [isAdding, setIsAdding] = useState(false);
  const [editingAccountId, setEditingAccountId] = useState<string | null>(null);

  // New account state
  const [newName, setNewName] = useState('');
  const [newOpeningBalance, setNewOpeningBalance] = useState('');
  const [newColor, setNewColor] = useState(COLOR_OPTIONS[0]);

  // Edit account state
  const [editName, setEditName] = useState('');
  const [editOpeningBalance, setEditOpeningBalance] = useState('');
  const [editColor, setEditColor] = useState(COLOR_OPTIONS[0]);

  if (!isOpen) return null;

  const handleStartAdd = () => {
    setIsAdding(true);
    setNewName('');
    setNewOpeningBalance('');
    setNewColor(COLOR_OPTIONS[Math.floor(Math.random() * COLOR_OPTIONS.length)]);
    setEditingAccountId(null);
  };

  const handleSaveAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) {
      alert('Please enter an account name.');
      return;
    }
    const balance = parseFloat(newOpeningBalance) || 0;
    onAddAccount(newName.trim(), balance, newColor);
    setIsAdding(false);
    setNewName('');
    setNewOpeningBalance('');
  };

  const handleStartEdit = (acc: MoneyAccount) => {
    setEditingAccountId(acc.id);
    setEditName(acc.name);
    setEditOpeningBalance(String(acc.openingBalance ?? 0));
    setEditColor(acc.color || COLOR_OPTIONS[0]);
    setIsAdding(false);
  };

  const handleSaveEdit = (acc: MoneyAccount) => {
    if (!editName.trim()) {
      alert('Please enter an account name.');
      return;
    }
    const balance = parseFloat(editOpeningBalance) || 0;
    onUpdateAccount({
      ...acc,
      name: editName.trim(),
      openingBalance: balance,
      color: editColor,
    });
    setEditingAccountId(null);
  };

  const handleDelete = (acc: MoneyAccount) => {
    if (accounts.length <= 1) {
      alert('You must keep at least one account for recording transactions.');
      return;
    }
    if (
      window.confirm(
        `Are you sure you want to delete "${acc.name}"? Transactions associated with this account will remain in history.`
      )
    ) {
      onDeleteAccount(acc.id);
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
          className="relative w-full max-w-lg bg-[#13151c]/95 backdrop-blur-2xl rounded-t-3xl sm:rounded-3xl shadow-2xl shadow-violet-950/50 border border-white/15 max-h-[90vh] overflow-y-auto flex flex-col z-10 text-slate-200"
        >
          {/* Top handle */}
          <div className="flex justify-center pt-3 pb-1 sm:hidden">
            <div className="w-10 h-1.5 bg-white/20 rounded-full" />
          </div>

          {/* Header */}
          <div className="px-5 py-4 border-b border-white/10 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-violet-600/30 border border-violet-500/40 text-violet-300 flex items-center justify-center shadow-lg shadow-violet-600/30">
                <CreditCard className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-base font-bold text-white tracking-tight">
                  Money Accounts
                </h2>
                <p className="text-[11px] text-slate-400">
                  Manage bank accounts, cards & cash
                </p>
              </div>
            </div>

            <button
              type="button"
              id="btn-close-manage-accounts"
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-xl hover:bg-white/10 cursor-pointer transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="p-5 space-y-4">
            {/* Add New Account Button / Form */}
            {!isAdding ? (
              <button
                type="button"
                id="btn-start-add-account"
                onClick={handleStartAdd}
                className="w-full py-3 px-4 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-200 text-xs font-bold flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-98 shadow-md"
              >
                <Plus className="w-4 h-4 text-violet-400" />
                <span>Add Custom Account</span>
              </button>
            ) : (
              <form onSubmit={handleSaveAdd} className="p-4 rounded-2xl bg-white/5 border border-violet-500/30 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-violet-300 uppercase tracking-widest">
                    New Account
                  </span>
                  <button
                    type="button"
                    onClick={() => setIsAdding(false)}
                    className="text-xs text-slate-400 hover:text-white cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-300 mb-1">
                    Account Name (e.g. Al Rajhi, SNB, Cash, Vault)
                  </label>
                  <input
                    type="text"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    placeholder="Account Name"
                    className="w-full px-3 py-2 bg-white/5 border border-white/15 rounded-xl text-xs text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-500/40"
                    autoFocus
                    required
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-300 mb-1">
                    Opening Balance (SAR)
                  </label>
                  <input
                    type="number"
                    step="any"
                    value={newOpeningBalance}
                    onChange={(e) => setNewOpeningBalance(e.target.value)}
                    placeholder="0.00"
                    className="w-full px-3 py-2 bg-white/5 border border-white/15 rounded-xl text-xs text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-500/40"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-300 mb-1">
                    Color Accent
                  </label>
                  <div className="flex items-center gap-2">
                    {COLOR_OPTIONS.map((c) => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => setNewColor(c)}
                        className={`w-6 h-6 rounded-full transition-transform cursor-pointer ${
                          newColor === c ? 'scale-125 ring-2 ring-white' : 'opacity-70 hover:opacity-100'
                        }`}
                        style={{ backgroundColor: c }}
                      />
                    ))}
                  </div>
                </div>

                <button
                  type="submit"
                  id="btn-save-new-account"
                  className="w-full py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-bold cursor-pointer transition-all shadow-md shadow-violet-600/30"
                >
                  Save Account
                </button>
              </form>
            )}

            {/* Existing Accounts List */}
            <div className="space-y-2.5">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-widest block">
                Active Accounts ({accounts.length})
              </span>

              {accounts.map((acc) => {
                const isEditing = editingAccountId === acc.id;

                if (isEditing) {
                  return (
                    <div
                      key={acc.id}
                      className="p-4 rounded-2xl bg-white/10 border border-violet-500/40 space-y-3"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-violet-300">
                          Edit {acc.name}
                        </span>
                        <button
                          type="button"
                          onClick={() => setEditingAccountId(null)}
                          className="text-xs text-slate-400 hover:text-white cursor-pointer"
                        >
                          Cancel
                        </button>
                      </div>

                      <div>
                        <label className="block text-[11px] text-slate-300 mb-1">
                          Account Name
                        </label>
                        <input
                          type="text"
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          className="w-full px-3 py-2 bg-white/5 border border-white/15 rounded-xl text-xs text-white focus:outline-none"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] text-slate-300 mb-1">
                          Opening Balance (SAR)
                        </label>
                        <input
                          type="number"
                          step="any"
                          value={editOpeningBalance}
                          onChange={(e) => setEditOpeningBalance(e.target.value)}
                          className="w-full px-3 py-2 bg-white/5 border border-white/15 rounded-xl text-xs text-white focus:outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] text-slate-300 mb-1">
                          Color
                        </label>
                        <div className="flex items-center gap-2">
                          {COLOR_OPTIONS.map((c) => (
                            <button
                              key={c}
                              type="button"
                              onClick={() => setEditColor(c)}
                              className={`w-6 h-6 rounded-full transition-transform cursor-pointer ${
                                editColor === c ? 'scale-125 ring-2 ring-white' : 'opacity-70 hover:opacity-100'
                              }`}
                              style={{ backgroundColor: c }}
                            />
                          ))}
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => handleSaveEdit(acc)}
                          className="flex-1 py-2 bg-violet-600 hover:bg-violet-500 text-white text-xs font-bold rounded-xl cursor-pointer shadow-md"
                        >
                          Update Account
                        </button>
                      </div>
                    </div>
                  );
                }

                return (
                  <div
                    key={acc.id}
                    className="p-3.5 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-between hover:bg-white/10 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="w-3.5 h-3.5 rounded-full shadow-sm"
                        style={{ backgroundColor: acc.color || '#8b5cf6' }}
                      />
                      <div>
                        <h4 className="text-sm font-bold text-white">{acc.name}</h4>
                        <div className="flex items-center gap-2 text-[11px] text-slate-400">
                          <span>Opening: SAR {Number(acc.openingBalance ?? 0).toLocaleString()}</span>
                          <span>•</span>
                          <span className="text-emerald-300 font-semibold">
                            Current: SAR {Number(acc.currentBalance).toLocaleString()}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        id={`btn-edit-account-${acc.id}`}
                        onClick={() => handleStartEdit(acc)}
                        className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                        title="Edit Account"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>

                      <button
                        type="button"
                        id={`btn-delete-account-${acc.id}`}
                        onClick={() => handleDelete(acc)}
                        className="p-2 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer"
                        title="Delete Account"
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

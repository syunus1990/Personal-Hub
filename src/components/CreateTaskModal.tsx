import React, { useState } from 'react';
import { Task, Category, Priority, Status, FollowUpHistoryEntry } from '../types';
import { CATEGORIES, CATEGORY_META } from '../utils/categoryMeta';
import { getTodayString, addDaysToDate, formatDate } from '../utils/dateUtils';
import { X, Plus, Calendar, Sparkles, Check, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface CreateTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateTask: (newTask: Task) => void;
  defaultCategory?: Category;
}

export const CreateTaskModal: React.FC<CreateTaskModalProps> = ({
  isOpen,
  onClose,
  onCreateTask,
  defaultCategory,
}) => {
  const todayStr = getTodayString();
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<Category>(defaultCategory || 'Personal');
  const [priority, setPriority] = useState<Priority>('Medium');
  const [status, setStatus] = useState<Status>('In Progress');
  const [completionPercentage, setCompletionPercentage] = useState<number>(0);
  const [followUpDate, setFollowUpDate] = useState<string>(todayStr);
  const [activeDatePreset, setActiveDatePreset] = useState<string>('today');
  const [remarks, setRemarks] = useState('');

  if (!isOpen) return null;

  const handleSetPresetDate = (days: number, presetKey: string) => {
    const nextDate = addDaysToDate(todayStr, days);
    setFollowUpDate(nextDate);
    setActiveDatePreset(presetKey);
  };

  const handlePercentageChange = (val: number) => {
    setCompletionPercentage(val);
    if (val === 100) {
      setStatus('Completed');
    } else if (val > 0 && status === 'Pending') {
      setStatus('In Progress');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const timestamp = new Date().toISOString();
    const taskId = `task-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;

    const initialHistory: FollowUpHistoryEntry[] = [];
    if (remarks.trim()) {
      initialHistory.push({
        id: `hist-${Date.now()}`,
        date: todayStr,
        completionPercentage,
        remark: remarks.trim(),
        createdAt: timestamp,
      });
    } else {
      initialHistory.push({
        id: `hist-${Date.now()}`,
        date: todayStr,
        completionPercentage,
        remark: 'Task created and added to tracker.',
        createdAt: timestamp,
      });
    }

    const newTask: Task = {
      id: taskId,
      title: title.trim(),
      category,
      priority,
      status: completionPercentage === 100 ? 'Completed' : status,
      completionPercentage,
      followUpDate: followUpDate || todayStr,
      remarks: remarks.trim() || 'Task created.',
      createdDate: todayStr,
      lastFollowedUpAt: timestamp,
      history: initialHistory,
    };

    onCreateTask(newTask);
    onClose();
    // reset form
    setTitle('');
    setCategory('Personal');
    setPriority('Medium');
    setStatus('In Progress');
    setCompletionPercentage(0);
    setFollowUpDate(todayStr);
    setRemarks('');
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/70 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0"
          onClick={onClose}
        />

        <motion.div
          id="create-task-modal"
          initial={{ y: '100%' }}
          animate={{ y: 0 }}
          exit={{ y: '100%' }}
          transition={{ type: 'spring', damping: 28, stiffness: 300 }}
          className="relative w-full max-w-lg bg-[#13151c]/95 backdrop-blur-2xl rounded-t-3xl sm:rounded-3xl shadow-2xl shadow-violet-950/50 border border-white/15 max-h-[90vh] overflow-y-auto flex flex-col z-10 text-slate-200"
        >
          {/* Top Sheet Handle */}
          <div className="flex justify-center pt-3 pb-1 sm:hidden">
            <div className="w-10 h-1.5 bg-white/20 rounded-full" />
          </div>

          {/* Header */}
          <div className="px-5 py-4 border-b border-white/10 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-violet-600 text-white flex items-center justify-center shadow-lg shadow-violet-600/40">
                <Plus className="w-4 h-4" />
              </div>
              <h2 className="text-base font-bold text-white tracking-tight">
                New Task & Follow-Up
              </h2>
            </div>

            <button
              id="btn-close-create-modal"
              type="button"
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-xl hover:bg-white/10 cursor-pointer transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-5 space-y-4">
            {/* Title Input */}
            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-widest mb-1.5">
                Task Title <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                id="input-task-title"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Laptop repair, Insurance claim, Car service"
                className="w-full px-3.5 py-2.5 bg-white/5 border border-white/15 rounded-2xl text-sm text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-500/40 focus:border-violet-500"
                autoFocus
              />
            </div>

            {/* Category Selector */}
            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-widest mb-1.5">
                Category
              </label>
              <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto p-1 no-scrollbar">
                {CATEGORIES.map((cat) => {
                  const meta = CATEGORY_META[cat];
                  const Icon = meta.icon;
                  const isSelected = category === cat;
                  return (
                    <button
                      key={cat}
                      type="button"
                      id={`btn-select-category-${cat.toLowerCase()}`}
                      onClick={() => setCategory(cat)}
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-violet-600 text-white border-violet-400 shadow-lg shadow-violet-600/30'
                          : `${meta.bgColor} ${meta.borderColor} hover:bg-white/10`
                      }`}
                    >
                      <Icon className="w-3 h-3" />
                      <span>{cat}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Priority & Status Row */}
            <div className="grid grid-cols-2 gap-3">
              {/* Priority */}
              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-widest mb-1.5">
                  Priority
                </label>
                <div className="grid grid-cols-3 gap-1 bg-white/5 border border-white/10 p-1 rounded-2xl">
                  {(['Low', 'Medium', 'High'] as Priority[]).map((p) => (
                    <button
                      key={p}
                      type="button"
                      id={`btn-select-priority-${p.toLowerCase()}`}
                      onClick={() => setPriority(p)}
                      className={`py-1.5 text-xs font-semibold rounded-xl transition-all cursor-pointer ${
                        priority === p
                          ? 'bg-violet-600 text-white shadow-md shadow-violet-600/30 font-bold'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>

              {/* Status */}
              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-widest mb-1.5">
                  Status
                </label>
                <select
                  id="select-task-status"
                  value={status}
                  onChange={(e) => setStatus(e.target.value as Status)}
                  className="w-full px-3 py-2 bg-white/5 border border-white/15 rounded-2xl text-xs font-semibold text-white focus:outline-none cursor-pointer"
                >
                  <option value="Pending" className="bg-zinc-900 text-white">Pending</option>
                  <option value="In Progress" className="bg-zinc-900 text-white">In Progress</option>
                  <option value="Completed" className="bg-zinc-900 text-white">Completed</option>
                  <option value="On Hold" className="bg-zinc-900 text-white">On Hold</option>
                </select>
              </div>
            </div>

            {/* Completion Percentage */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-bold text-slate-300 uppercase tracking-widest">
                  Initial Progress
                </label>
                <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-violet-500/20 text-violet-300 border border-violet-500/30">
                  {completionPercentage}%
                </span>
              </div>
              <input
                type="range"
                id="input-create-percentage"
                min="0"
                max="100"
                step="5"
                value={completionPercentage}
                onChange={(e) => handlePercentageChange(Number(e.target.value))}
                className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer accent-violet-500"
              />
              <div className="flex justify-between items-center mt-1.5 gap-1">
                {[0, 25, 50, 75, 100].map((val) => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => handlePercentageChange(val)}
                    className={`flex-1 py-1 text-[10px] rounded-xl border font-bold cursor-pointer transition-colors ${
                      completionPercentage === val
                        ? 'bg-violet-600/30 border-violet-500 text-violet-200'
                        : 'bg-white/5 border-white/10 text-slate-400 hover:bg-white/10'
                    }`}
                  >
                    {val}%
                  </button>
                ))}
              </div>
            </div>

            {/* Follow-up Date */}
            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-widest mb-1.5">
                First Follow-Up Date
              </label>
              <div className="grid grid-cols-4 gap-1.5 mb-2">
                <button
                  type="button"
                  id="btn-create-preset-today"
                  onClick={() => handleSetPresetDate(0, 'today')}
                  className={`py-1.5 text-xs font-bold rounded-xl border transition-all cursor-pointer ${
                    activeDatePreset === 'today'
                      ? 'bg-violet-600 text-white border-violet-400 shadow-lg shadow-violet-600/30'
                      : 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10'
                  }`}
                >
                  Today
                </button>
                <button
                  type="button"
                  id="btn-create-preset-tomorrow"
                  onClick={() => handleSetPresetDate(1, 'tomorrow')}
                  className={`py-1.5 text-xs font-bold rounded-xl border transition-all cursor-pointer ${
                    activeDatePreset === 'tomorrow'
                      ? 'bg-violet-600 text-white border-violet-400 shadow-lg shadow-violet-600/30'
                      : 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10'
                  }`}
                >
                  Tomorrow
                </button>
                <button
                  type="button"
                  id="btn-create-preset-3days"
                  onClick={() => handleSetPresetDate(3, '3days')}
                  className={`py-1.5 text-xs font-bold rounded-xl border transition-all cursor-pointer ${
                    activeDatePreset === '3days'
                      ? 'bg-violet-600 text-white border-violet-400 shadow-lg shadow-violet-600/30'
                      : 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10'
                  }`}
                >
                  +3 Days
                </button>
                <button
                  type="button"
                  id="btn-create-preset-1week"
                  onClick={() => handleSetPresetDate(7, '1week')}
                  className={`py-1.5 text-xs font-bold rounded-xl border transition-all cursor-pointer ${
                    activeDatePreset === '1week'
                      ? 'bg-violet-600 text-white border-violet-400 shadow-lg shadow-violet-600/30'
                      : 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10'
                  }`}
                >
                  +1 Week
                </button>
              </div>

              <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-2xl px-3.5 py-2.5">
                <Calendar className="w-4 h-4 text-slate-400 shrink-0" />
                <input
                  type="date"
                  id="input-create-custom-date"
                  value={followUpDate}
                  onChange={(e) => {
                    setFollowUpDate(e.target.value);
                    setActiveDatePreset('custom');
                  }}
                  className="w-full bg-transparent text-xs text-white focus:outline-none cursor-pointer"
                />
              </div>
            </div>

            {/* Remarks / Initial Notes */}
            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-widest mb-1.5">
                Initial Remarks / Note
              </label>
              <textarea
                id="input-create-remarks"
                rows={2}
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                placeholder="e.g. Laptop submitted for checking, awaiting invoice."
                className="w-full px-3.5 py-2 bg-white/5 border border-white/15 rounded-2xl text-xs text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-500/40 resize-none"
              />
            </div>

            {/* Submit Buttons */}
            <div className="pt-2 flex gap-3">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-3 px-4 rounded-2xl border border-white/15 text-slate-300 text-xs font-bold hover:bg-white/10 cursor-pointer transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                id="btn-submit-create-task"
                disabled={!title.trim()}
                className="flex-2 py-3 px-4 rounded-2xl bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white text-xs font-bold shadow-lg shadow-violet-600/30 flex items-center justify-center gap-1.5 active:scale-98 transition-all cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Save Task</span>
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

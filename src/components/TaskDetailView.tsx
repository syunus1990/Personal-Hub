import React, { useState } from 'react';
import { Task, FollowUpHistoryEntry, Status, Priority, Category } from '../types';
import { CATEGORY_META, PRIORITY_META, STATUS_META, CATEGORIES } from '../utils/categoryMeta';
import { getRelativeFollowUpLabel, formatDate, getTodayString, addDaysToDate } from '../utils/dateUtils';
import {
  ArrowLeft,
  Calendar,
  CheckCircle2,
  Clock,
  Edit2,
  Trash2,
  Plus,
  History,
  MessageSquare,
  Sparkles,
  AlertTriangle,
  RotateCcw,
  Tag,
  Flag,
  Share2,
  Check,
  ChevronDown
} from 'lucide-react';
import { motion } from 'motion/react';

interface TaskDetailViewProps {
  task: Task;
  onBack: () => void;
  onUpdateTask: (updatedTask: Task) => void;
  onDeleteTask: (taskId: string) => void;
  onOpenQuickFollowUp: (task: Task) => void;
}

export const TaskDetailView: React.FC<TaskDetailViewProps> = ({
  task,
  onBack,
  onUpdateTask,
  onDeleteTask,
  onOpenQuickFollowUp,
}) => {
  const todayStr = getTodayString();
  const categoryMeta = CATEGORY_META[task.category] || CATEGORY_META.Other;
  const CategoryIcon = categoryMeta.icon;
  const priorityMeta = PRIORITY_META[task.priority] || PRIORITY_META.Medium;
  const isCompleted = task.status === 'Completed' || task.completionPercentage === 100;
  const relativeDate = getRelativeFollowUpLabel(task.followUpDate, isCompleted);

  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editedTitle, setEditedTitle] = useState(task.title);

  const [showAddRemarkBox, setShowAddRemarkBox] = useState(false);
  const [newRemarkText, setNewRemarkText] = useState('');
  const [newRemarkPercentage, setNewRemarkPercentage] = useState(task.completionPercentage);

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showCategoryPicker, setShowCategoryPicker] = useState(false);
  const [showStatusPicker, setShowStatusPicker] = useState(false);

  // Quick Action: Follow Up Today
  const handleFollowUpToday = () => {
    const timestamp = new Date().toISOString();
    const historyEntry: FollowUpHistoryEntry = {
      id: `hist-${Date.now()}`,
      date: todayStr,
      completionPercentage: task.completionPercentage,
      remark: 'Follow-up date moved to Today.',
      createdAt: timestamp,
    };

    const updated: Task = {
      ...task,
      followUpDate: todayStr,
      lastFollowedUpAt: timestamp,
      history: [historyEntry, ...(task.history || [])],
    };
    onUpdateTask(updated);
  };

  // Quick Action: Reschedule Date preset
  const handleRescheduleDate = (days: number) => {
    const targetDate = addDaysToDate(todayStr, days);
    const label = days === 0 ? 'Today' : days === 1 ? 'Tomorrow' : days === 3 ? '3 days' : '1 week';
    const timestamp = new Date().toISOString();

    const historyEntry: FollowUpHistoryEntry = {
      id: `hist-${Date.now()}`,
      date: todayStr,
      completionPercentage: task.completionPercentage,
      remark: `Next follow-up rescheduled to ${label} (${formatDate(targetDate)}).`,
      createdAt: timestamp,
    };

    const updated: Task = {
      ...task,
      followUpDate: targetDate,
      lastFollowedUpAt: timestamp,
      history: [historyEntry, ...(task.history || [])],
    };
    onUpdateTask(updated);
  };

  // Custom Date Change
  const handleCustomDateChange = (newDate: string) => {
    if (!newDate) return;
    const timestamp = new Date().toISOString();
    const historyEntry: FollowUpHistoryEntry = {
      id: `hist-${Date.now()}`,
      date: todayStr,
      completionPercentage: task.completionPercentage,
      remark: `Next follow-up changed to ${formatDate(newDate)}.`,
      createdAt: timestamp,
    };

    const updated: Task = {
      ...task,
      followUpDate: newDate,
      lastFollowedUpAt: timestamp,
      history: [historyEntry, ...(task.history || [])],
    };
    onUpdateTask(updated);
  };

  // Quick Action: Toggle / Mark Completed
  const handleToggleComplete = () => {
    const willBeCompleted = !isCompleted;
    const newPercentage = willBeCompleted ? 100 : Math.min(task.completionPercentage, 90);
    const newStatus: Status = willBeCompleted ? 'Completed' : 'In Progress';
    const timestamp = new Date().toISOString();

    const historyEntry: FollowUpHistoryEntry = {
      id: `hist-${Date.now()}`,
      date: todayStr,
      completionPercentage: newPercentage,
      remark: willBeCompleted ? 'Marked task as Completed.' : 'Reopened task for tracking.',
      createdAt: timestamp,
    };

    const updated: Task = {
      ...task,
      status: newStatus,
      completionPercentage: newPercentage,
      lastFollowedUpAt: timestamp,
      history: [historyEntry, ...(task.history || [])],
    };
    onUpdateTask(updated);
  };

  // Change Percentage directly
  const handlePercentageChange = (newPercentage: number) => {
    const newStatus: Status = newPercentage === 100 ? 'Completed' : (task.status === 'Completed' ? 'In Progress' : task.status);
    const timestamp = new Date().toISOString();

    const historyEntry: FollowUpHistoryEntry = {
      id: `hist-${Date.now()}`,
      date: todayStr,
      completionPercentage: newPercentage,
      remark: `Progress updated to ${newPercentage}%.`,
      createdAt: timestamp,
    };

    const updated: Task = {
      ...task,
      completionPercentage: newPercentage,
      status: newStatus,
      lastFollowedUpAt: timestamp,
      history: [historyEntry, ...(task.history || [])],
    };
    onUpdateTask(updated);
  };

  // Save Title edit
  const handleSaveTitle = () => {
    if (editedTitle.trim()) {
      onUpdateTask({
        ...task,
        title: editedTitle.trim(),
      });
    }
    setIsEditingTitle(false);
  };

  // Add Remark / Follow-Up Entry
  const handleAddRemarkSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRemarkText.trim()) return;

    const timestamp = new Date().toISOString();
    const newEntry: FollowUpHistoryEntry = {
      id: `hist-${Date.now()}`,
      date: todayStr,
      completionPercentage: newRemarkPercentage,
      remark: newRemarkText.trim(),
      createdAt: timestamp,
    };

    const updated: Task = {
      ...task,
      remarks: newRemarkText.trim(),
      completionPercentage: newRemarkPercentage,
      status: newRemarkPercentage === 100 ? 'Completed' : task.status,
      lastFollowedUpAt: timestamp,
      history: [newEntry, ...(task.history || [])],
    };

    onUpdateTask(updated);
    setNewRemarkText('');
    setShowAddRemarkBox(false);
  };

  return (
    <div id="task-detail-view" className="flex flex-col min-h-full pb-24 text-slate-200">
      {/* Top Android Material 3 App Bar with Frosted Glass */}
      <div className="sticky top-0 z-20 bg-[#0d0e12]/80 backdrop-blur-xl border-b border-white/10 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            id="btn-back-from-detail"
            type="button"
            onClick={onBack}
            className="p-2 -ml-1 rounded-xl text-slate-300 hover:bg-white/10 transition-colors cursor-pointer"
            aria-label="Back"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <span className="text-sm font-bold text-white">
            Task & Chase Details
          </span>
        </div>

        <div className="flex items-center gap-1">
          <button
            id="btn-delete-task"
            type="button"
            onClick={() => setShowDeleteConfirm(true)}
            className="p-2 text-slate-400 hover:text-rose-400 rounded-xl hover:bg-rose-500/10 transition-colors cursor-pointer"
            title="Delete task"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Delete Confirmation Alert */}
      {showDeleteConfirm && (
        <div className="mx-4 mt-3 p-4 bg-rose-500/15 backdrop-blur-xl border border-rose-500/30 rounded-3xl shadow-xl shadow-rose-950/40">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
            <div className="flex-1">
              <h4 className="text-xs font-bold text-rose-300 uppercase tracking-widest">
                Delete This Task?
              </h4>
              <p className="text-xs text-rose-200/90 mt-0.5">
                This will permanently delete this task and its entire follow-up history.
              </p>
              <div className="flex gap-2 mt-3">
                <button
                  type="button"
                  onClick={() => setShowDeleteConfirm(false)}
                  className="px-3 py-1.5 rounded-xl border border-white/15 text-xs font-semibold text-slate-300 bg-white/5 hover:bg-white/10 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  id="btn-confirm-delete-task"
                  onClick={() => onDeleteTask(task.id)}
                  className="px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold shadow-lg shadow-rose-600/30 cursor-pointer"
                >
                  Confirm Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="p-4 sm:p-5 space-y-4 max-w-2xl mx-auto w-full">
        {/* Category & Status Badges Strip */}
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-2">
            {/* Category Chip with dropdown */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowCategoryPicker(!showCategoryPicker)}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border ${categoryMeta.bgColor} ${categoryMeta.borderColor} cursor-pointer`}
              >
                <CategoryIcon className="w-3.5 h-3.5" />
                <span>{task.category}</span>
                <ChevronDown className="w-3 h-3 opacity-60" />
              </button>

              {showCategoryPicker && (
                <div className="absolute left-0 mt-2 w-48 bg-[#13151c]/95 backdrop-blur-2xl border border-white/15 rounded-2xl shadow-2xl p-1.5 z-30 space-y-0.5">
                  {CATEGORIES.map((cat) => {
                    const cMeta = CATEGORY_META[cat];
                    const Icon = cMeta.icon;
                    return (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => {
                          onUpdateTask({ ...task, category: cat });
                          setShowCategoryPicker(false);
                        }}
                        className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-xl text-xs text-left transition-colors cursor-pointer ${
                          task.category === cat
                            ? 'bg-violet-600/30 text-violet-200 border border-violet-500/30 font-bold'
                            : 'text-slate-300 hover:bg-white/10'
                        }`}
                      >
                        <Icon className="w-3.5 h-3.5" />
                        <span>{cat}</span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Priority Chip */}
            <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${priorityMeta.badge}`}>
              {task.priority} Priority
            </span>
          </div>

          {/* Status Chip */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowStatusPicker(!showStatusPicker)}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border ${STATUS_META[task.status].color} cursor-pointer`}
            >
              <span className={`w-2 h-2 rounded-full ${STATUS_META[task.status].dotColor}`} />
              <span>{task.status}</span>
              <ChevronDown className="w-3 h-3 opacity-60" />
            </button>

            {showStatusPicker && (
              <div className="absolute right-0 mt-2 w-40 bg-[#13151c]/95 backdrop-blur-2xl border border-white/15 rounded-2xl shadow-2xl p-1.5 z-30 space-y-0.5">
                {(['Pending', 'In Progress', 'Completed', 'On Hold'] as Status[]).map((st) => (
                  <button
                    key={st}
                    type="button"
                    onClick={() => {
                      const willComplete = st === 'Completed';
                      onUpdateTask({
                        ...task,
                        status: st,
                        completionPercentage: willComplete ? 100 : task.completionPercentage,
                      });
                      setShowStatusPicker(false);
                    }}
                    className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-xl text-xs text-left transition-colors cursor-pointer ${
                      task.status === st
                        ? 'bg-violet-600/30 text-violet-200 border border-violet-500/30 font-bold'
                        : 'text-slate-300 hover:bg-white/10'
                    }`}
                  >
                    <span className={`w-2 h-2 rounded-full ${STATUS_META[st].dotColor}`} />
                    <span>{st}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Task Title Header Card */}
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-5 shadow-xl shadow-black/20">
          {isEditingTitle ? (
            <div className="space-y-3">
              <input
                type="text"
                id="input-edit-task-title"
                value={editedTitle}
                onChange={(e) => setEditedTitle(e.target.value)}
                className="w-full text-lg font-bold text-white bg-white/10 border border-violet-500 rounded-2xl px-3.5 py-2 focus:outline-none"
                autoFocus
              />
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handleSaveTitle}
                  className="px-3.5 py-1.5 bg-violet-600 text-white text-xs font-bold rounded-xl shadow-lg shadow-violet-600/30 hover:bg-violet-500 cursor-pointer"
                >
                  Save Title
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setEditedTitle(task.title);
                    setIsEditingTitle(false);
                  }}
                  className="px-3.5 py-1.5 bg-white/10 text-slate-300 text-xs font-medium rounded-xl hover:bg-white/15 cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div className="flex items-start justify-between gap-3">
              <div>
                <h1
                  id="task-detail-title"
                  className={`text-xl font-bold tracking-tight text-white ${
                    isCompleted ? 'line-through text-slate-500' : ''
                  }`}
                >
                  {task.title}
                </h1>
                <p className="text-xs text-slate-400 mt-1">
                  Created on {formatDate(task.createdDate)}
                </p>
              </div>

              <button
                type="button"
                onClick={() => setIsEditingTitle(true)}
                className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-white/10 transition-colors cursor-pointer"
                title="Edit title"
              >
                <Edit2 className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Active Remark / Notes */}
          {task.remarks && (
            <div className="mt-4 p-4 bg-white/5 backdrop-blur-md rounded-2xl border border-white/10">
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-1.5 text-xs font-bold text-violet-300 uppercase tracking-widest">
                  <MessageSquare className="w-3.5 h-3.5 text-violet-400" />
                  <span>Current Remark</span>
                </div>
                <button
                  type="button"
                  onClick={() => setShowAddRemarkBox(true)}
                  className="text-[11px] font-bold text-violet-400 hover:text-violet-300 cursor-pointer"
                >
                  + Update Remark
                </button>
              </div>
              <p className="text-sm text-slate-200 leading-relaxed">
                {task.remarks}
              </p>
            </div>
          )}

          {/* Quick Primary Actions Strip Right at Top */}
          <div className="grid grid-cols-3 gap-2 mt-4 pt-3 border-t border-white/10">
            <button
              type="button"
              id="btn-top-add-remark"
              onClick={() => {
                setShowAddRemarkBox(true);
                window.scrollTo({ top: 0, behavior: 'instant' });
              }}
              className="py-2.5 px-2 rounded-xl bg-violet-500/15 border border-violet-500/30 text-violet-300 text-xs font-bold flex items-center justify-center gap-1.5 hover:bg-violet-500/25 active:scale-97 cursor-pointer"
            >
              <MessageSquare className="w-3.5 h-3.5 text-violet-400 shrink-0" />
              <span>+ Remark</span>
            </button>

            <button
              type="button"
              id="btn-top-followup-today"
              onClick={handleFollowUpToday}
              className="py-2.5 px-2 rounded-xl bg-blue-500/15 border border-blue-500/30 text-blue-300 text-xs font-bold flex items-center justify-center gap-1.5 hover:bg-blue-500/25 active:scale-97 cursor-pointer"
            >
              <Clock className="w-3.5 h-3.5 text-blue-400 shrink-0" />
              <span>Due Today</span>
            </button>

            <button
              type="button"
              id="btn-top-toggle-complete"
              onClick={handleToggleComplete}
              className={`py-2.5 px-2 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 active:scale-97 cursor-pointer ${
                isCompleted
                  ? 'bg-white/10 border-white/15 text-slate-300'
                  : 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/25'
              }`}
            >
              <CheckCircle2 className={`w-3.5 h-3.5 ${isCompleted ? 'text-slate-400' : 'text-emerald-400'} shrink-0`} />
              <span>{isCompleted ? 'Reopen' : 'Done'}</span>
            </button>
          </div>
        </div>

        {/* Add Remark Form (Rendered Right at Top when open) */}
        {showAddRemarkBox && (
          <form
            onSubmit={handleAddRemarkSubmit}
            className="bg-[#13151c]/95 backdrop-blur-2xl border border-violet-500/40 rounded-[2rem] p-5 shadow-2xl shadow-violet-950/50 space-y-3"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-widest text-violet-300">
                Log New Follow-Up Remark
              </h3>
              <button
                type="button"
                onClick={() => setShowAddRemarkBox(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div>
              <textarea
                value={newRemarkText}
                onChange={(e) => setNewRemarkText(e.target.value)}
                placeholder="What did you chase? What is the outcome or next step?"
                rows={3}
                autoFocus
                className="w-full px-3.5 py-2.5 bg-white/5 border border-white/15 rounded-2xl text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500/40"
              />
            </div>

            <div className="flex items-center justify-between gap-3 pt-1">
              <div className="flex items-center gap-2">
                <span className="text-[11px] text-slate-400">Progress:</span>
                <select
                  value={newRemarkPercentage}
                  onChange={(e) => setNewRemarkPercentage(Number(e.target.value))}
                  className="px-2.5 py-1.5 bg-white/5 border border-white/15 rounded-xl text-xs font-bold text-white focus:outline-none"
                >
                  {[0, 25, 50, 75, 90, 100].map((pct) => (
                    <option key={pct} value={pct} className="bg-zinc-900 text-white">
                      {pct}%
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddRemarkBox(false)}
                  className="px-3 py-1.5 rounded-xl border border-white/10 text-xs font-medium text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-3.5 py-1.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-bold shadow-md shadow-violet-600/30"
                >
                  Save Remark
                </button>
              </div>
            </div>
          </form>
        )}

        {/* Progress & Percentage Interactive Controller */}
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-5 shadow-xl shadow-black/20 space-y-3.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-300 uppercase tracking-widest">
              Completion Percentage
            </span>
            <span className="text-sm font-black px-3 py-0.5 rounded-full bg-violet-500/20 text-violet-300 border border-violet-500/30">
              {task.completionPercentage}%
            </span>
          </div>

          {/* Visual Progress Bar */}
          <div className="w-full h-3 bg-white/10 rounded-full overflow-hidden">
            <motion.div
              className={`h-full rounded-full transition-all duration-300 ${
                isCompleted
                  ? 'bg-gradient-to-r from-violet-500 to-emerald-400'
                  : task.completionPercentage >= 70
                  ? 'bg-gradient-to-r from-violet-500 to-indigo-400'
                  : task.completionPercentage >= 30
                  ? 'bg-gradient-to-r from-amber-500 to-orange-400'
                  : 'bg-slate-600'
              }`}
              style={{ width: `${task.completionPercentage}%` }}
            />
          </div>

          {/* Interactive Range Slider */}
          <div className="pt-1">
            <input
              type="range"
              id="detail-percentage-slider"
              min="0"
              max="100"
              step="5"
              value={task.completionPercentage}
              onChange={(e) => handlePercentageChange(Number(e.target.value))}
              className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer accent-violet-500"
            />
          </div>

          {/* Stepped Percentage Buttons */}
          <div className="grid grid-cols-5 gap-1.5 pt-1">
            {[0, 25, 50, 75, 100].map((val) => (
              <button
                key={val}
                type="button"
                id={`btn-percent-${val}`}
                onClick={() => handlePercentageChange(val)}
                className={`py-1.5 text-xs rounded-xl border font-bold transition-all cursor-pointer ${
                  task.completionPercentage === val
                    ? 'bg-violet-600 border-violet-400 text-white shadow-lg shadow-violet-600/40'
                    : 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10'
                }`}
              >
                {val}%
              </button>
            ))}
          </div>
        </div>

        {/* Next Follow-Up Rescheduling Section */}
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-5 shadow-xl shadow-black/20 space-y-3.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-violet-400" />
              <span className="text-xs font-bold text-slate-300 uppercase tracking-widest">
                Next Follow-Up Date
              </span>
            </div>

            <span
              className={`text-xs px-2.5 py-1 rounded-full font-bold border backdrop-blur-md ${
                relativeDate.badgeType === 'overdue'
                  ? 'bg-rose-500/15 text-rose-300 border-rose-500/30'
                  : relativeDate.badgeType === 'today'
                  ? 'bg-blue-500/15 text-blue-300 border-blue-500/30'
                  : 'bg-white/10 text-slate-300 border-white/15'
              }`}
            >
              {relativeDate.label} ({formatDate(task.followUpDate)})
            </span>
          </div>

          {/* Quick Rescheduling Chips (Today, Tomorrow, 3 days, 1 week, Custom Date) */}
          <div className="space-y-2.5">
            <p className="text-[11px] font-medium text-slate-400">
              Move follow-up date without creating a duplicate task:
            </p>

            <div className="grid grid-cols-4 gap-2">
              <button
                type="button"
                id="btn-move-today"
                onClick={() => handleRescheduleDate(0)}
                className={`py-2 px-2 text-xs font-bold rounded-xl border transition-all cursor-pointer ${
                  task.followUpDate === todayStr
                    ? 'bg-violet-600 text-white border-violet-400 shadow-lg shadow-violet-600/30'
                    : 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10'
                }`}
              >
                Today
              </button>

              <button
                type="button"
                id="btn-move-tomorrow"
                onClick={() => handleRescheduleDate(1)}
                className={`py-2 px-2 text-xs font-bold rounded-xl border transition-all cursor-pointer ${
                  task.followUpDate === addDaysToDate(todayStr, 1)
                    ? 'bg-violet-600 text-white border-violet-400 shadow-lg shadow-violet-600/30'
                    : 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10'
                }`}
              >
                Tomorrow
              </button>

              <button
                type="button"
                id="btn-move-3days"
                onClick={() => handleRescheduleDate(3)}
                className={`py-2 px-2 text-xs font-bold rounded-xl border transition-all cursor-pointer ${
                  task.followUpDate === addDaysToDate(todayStr, 3)
                    ? 'bg-violet-600 text-white border-violet-400 shadow-lg shadow-violet-600/30'
                    : 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10'
                }`}
              >
                3 Days
              </button>

              <button
                type="button"
                id="btn-move-1week"
                onClick={() => handleRescheduleDate(7)}
                className={`py-2 px-2 text-xs font-bold rounded-xl border transition-all cursor-pointer ${
                  task.followUpDate === addDaysToDate(todayStr, 7)
                    ? 'bg-violet-600 text-white border-violet-400 shadow-lg shadow-violet-600/30'
                    : 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10'
                }`}
              >
                1 Week
              </button>
            </div>

            {/* Custom Date Input */}
            <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-2xl px-3.5 py-2.5 backdrop-blur-md">
              <Calendar className="w-4 h-4 text-slate-400 shrink-0" />
              <span className="text-xs text-slate-400 shrink-0">Custom date:</span>
              <input
                type="date"
                id="input-detail-custom-date"
                value={task.followUpDate}
                onChange={(e) => handleCustomDateChange(e.target.value)}
                className="w-full bg-transparent text-xs text-white focus:outline-none cursor-pointer"
              />
            </div>
          </div>
        </div>

        {/* Follow-Up History Timeline */}
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-5 shadow-xl shadow-black/20 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <History className="w-4 h-4 text-violet-400" />
              <h3 className="text-xs font-bold text-slate-300 uppercase tracking-widest">
                Follow-Up History ({task.history ? task.history.length : 0})
              </h3>
            </div>

            <button
              type="button"
              onClick={() => setShowAddRemarkBox(true)}
              className="inline-flex items-center gap-1 text-xs font-bold text-violet-300 hover:text-violet-200 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Log Entry</span>
            </button>
          </div>

          {/* Timeline Stream */}
          <div className="space-y-4 relative before:absolute before:inset-0 before:left-3.5 before:w-0.5 before:bg-white/10">
            {task.history && task.history.length > 0 ? (
              task.history.map((entry, idx) => (
                <div key={entry.id || idx} className="relative flex items-start gap-3.5 pl-1">
                  {/* Timeline node icon */}
                  <div className="w-6 h-6 rounded-full bg-[#13151c] border-2 border-violet-500 text-violet-400 flex items-center justify-center shrink-0 z-10 shadow-lg shadow-violet-950/40">
                    <span className="w-1.5 h-1.5 rounded-full bg-violet-400" />
                  </div>

                  {/* History Content Box */}
                  <div className="flex-1 bg-white/5 border border-white/10 rounded-2xl p-3 text-xs space-y-1 backdrop-blur-md">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-bold text-white">
                        {formatDate(entry.date)}
                      </span>
                      <span className="px-2 py-0.5 rounded-full bg-violet-500/20 text-violet-300 font-bold text-[11px] border border-violet-500/30">
                        {entry.completionPercentage}%
                      </span>
                    </div>

                    <p className="text-slate-300 leading-relaxed pt-0.5">
                      {entry.remark}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <div className="pl-6 py-2 text-xs text-slate-400 italic">
                No follow-up updates recorded yet. Tap &apos;Log Entry&apos; to add your first follow-up note.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

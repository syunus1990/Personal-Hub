import React from 'react';
import { Task } from '../types';
import { CATEGORY_META, PRIORITY_META } from '../utils/categoryMeta';
import { getRelativeFollowUpLabel } from '../utils/dateUtils';
import { Calendar, CheckCircle2, ChevronRight, Clock, MessageSquare, AlertCircle, ArrowUpRight } from 'lucide-react';
import { motion } from 'motion/react';

interface TaskCardProps {
  task: Task;
  onSelect: (task: Task) => void;
  onQuickFollowUp: (task: Task, e: React.MouseEvent) => void;
  onToggleComplete?: (task: Task, e: React.MouseEvent) => void;
}

export const TaskCard: React.FC<TaskCardProps> = ({
  task,
  onSelect,
  onQuickFollowUp,
}) => {
  const categoryMeta = CATEGORY_META[task.category] || CATEGORY_META.Other;
  const CategoryIcon = categoryMeta.icon;
  const priorityMeta = PRIORITY_META[task.priority] || PRIORITY_META.Medium;
  const isCompleted = task.status === 'Completed' || task.completionPercentage === 100;
  const relativeDate = getRelativeFollowUpLabel(task.followUpDate, isCompleted);

  const getFollowUpBadgeStyle = () => {
    switch (relativeDate.badgeType) {
      case 'overdue':
        return 'bg-rose-500/15 text-rose-300 border-rose-500/30 backdrop-blur-md';
      case 'today':
        return 'bg-blue-500/15 text-blue-300 border-blue-500/30 font-semibold backdrop-blur-md';
      case 'tomorrow':
        return 'bg-amber-500/15 text-amber-300 border-amber-500/30 backdrop-blur-md';
      case 'completed':
        return 'bg-violet-500/15 text-violet-300 border-violet-500/30 backdrop-blur-md';
      default:
        return 'bg-white/10 text-slate-400 border-white/15 backdrop-blur-md';
    }
  };

  const getProgressBarColor = () => {
    if (isCompleted) return 'bg-gradient-to-r from-violet-500 to-emerald-400';
    if (task.completionPercentage >= 70) return 'bg-gradient-to-r from-violet-500 to-indigo-400';
    if (task.completionPercentage >= 30) return 'bg-gradient-to-r from-amber-500 to-orange-400';
    return 'bg-slate-600';
  };

  return (
    <motion.div
      id={`task-card-${task.id}`}
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      whileTap={{ scale: 0.985 }}
      onClick={() => onSelect(task)}
      className={`group relative rounded-3xl border transition-all duration-200 cursor-pointer overflow-hidden p-4 select-none backdrop-blur-xl ${
        isCompleted
          ? 'bg-white/5 border-white/10 opacity-75'
          : relativeDate.badgeType === 'overdue'
          ? 'bg-rose-500/5 border-rose-500/30 shadow-lg shadow-rose-950/20 hover:border-rose-500/50'
          : relativeDate.badgeType === 'today'
          ? 'bg-blue-500/5 border-blue-500/30 shadow-lg shadow-blue-950/20 hover:border-blue-500/50'
          : 'bg-white/5 border-white/10 shadow-xl shadow-black/20 hover:border-white/20 hover:bg-white/10'
      }`}
    >
      {/* Top Header Row: Category Badge + Priority + Follow-Up Status */}
      <div className="flex items-center justify-between gap-2 mb-2.5">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span
            id={`task-category-${task.id}`}
            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium border ${categoryMeta.bgColor} ${categoryMeta.borderColor}`}
          >
            <CategoryIcon className="w-3 h-3" />
            {task.category}
          </span>

          <span
            id={`task-priority-${task.id}`}
            className={`px-2 py-0.5 rounded-full text-[11px] font-semibold ${priorityMeta.badge}`}
          >
            {task.priority}
          </span>
        </div>

        {/* Relative Follow Up Pill */}
        <div
          id={`task-followup-badge-${task.id}`}
          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs border shrink-0 ${getFollowUpBadgeStyle()}`}
        >
          {relativeDate.badgeType === 'overdue' ? (
            <AlertCircle className="w-3 h-3 text-rose-400 shrink-0" />
          ) : relativeDate.badgeType === 'completed' ? (
            <CheckCircle2 className="w-3 h-3 text-violet-400 shrink-0" />
          ) : (
            <Clock className="w-3 h-3 text-slate-400 shrink-0" />
          )}
          <span>{relativeDate.label}</span>
        </div>
      </div>

      {/* Title */}
      <div className="mb-2">
        <h3
          id={`task-title-${task.id}`}
          className={`text-base font-bold tracking-tight text-white group-hover:text-violet-300 transition-colors ${
            isCompleted ? 'line-through text-slate-500' : ''
          }`}
        >
          {task.title}
        </h3>
      </div>

      {/* Latest Remark Snippet */}
      {task.remarks && (
        <div
          id={`task-remarks-snippet-${task.id}`}
          className="flex items-start gap-1.5 text-xs text-slate-300 mb-3 line-clamp-2 bg-white/5 border border-white/10 p-2.5 rounded-2xl backdrop-blur-md"
        >
          <MessageSquare className="w-3.5 h-3.5 mt-0.5 text-slate-400 shrink-0" />
          <p className="italic leading-relaxed">{task.remarks}</p>
        </div>
      )}

      {/* Progress Bar & Follow-up History Count */}
      <div className="space-y-1.5 pt-1">
        <div className="flex items-center justify-between text-xs font-medium">
          <div className="flex items-center gap-1.5 text-slate-400">
            <span>Progress</span>
            <span className="font-bold text-white">
              {task.completionPercentage}%
            </span>
          </div>

          {task.history && task.history.length > 0 && (
            <span className="text-[11px] text-slate-400 flex items-center gap-1">
              <span>{task.history.length} {task.history.length === 1 ? 'update' : 'updates'}</span>
            </span>
          )}
        </div>

        {/* Progress Track */}
        <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
          <motion.div
            className={`h-full rounded-full transition-all duration-300 ${getProgressBarColor()}`}
            initial={{ width: 0 }}
            animate={{ width: `${task.completionPercentage}%` }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
          />
        </div>
      </div>

      {/* Bottom Action Strip */}
      <div className="mt-3.5 pt-2.5 border-t border-white/10 flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-xs text-slate-400">
          <Calendar className="w-3 h-3 text-slate-400" />
          <span>Follow-up: {task.followUpDate || 'None'}</span>
        </div>

        <button
          id={`btn-quick-followup-${task.id}`}
          type="button"
          onClick={(e) => onQuickFollowUp(task, e)}
          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold bg-violet-600/20 text-violet-300 hover:bg-violet-600/30 hover:text-white border border-violet-500/30 active:scale-95 transition-all cursor-pointer shadow-xs"
        >
          <span>Follow Up</span>
          <ArrowUpRight className="w-3 h-3" />
        </button>
      </div>
    </motion.div>
  );
};

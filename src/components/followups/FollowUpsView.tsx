import React, { useState } from 'react';
import {
  CheckSquare,
  Plus,
  Calendar,
  Clock,
  AlertCircle,
  CheckCircle2,
  Trash2,
  Edit2,
  Filter,
  Sparkles,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { SummaryCard } from '../common/SummaryCard';
import { ChecklistSection } from '../common/ChecklistSection';
import { FollowUp, Priority } from '../../types';

export const FollowUpsView: React.FC = () => {
  const {
    followups,
    openEditModal,
    openAIItemModal,
    deleteFollowUp,
    toggleCompleteFollowUp,
    toggleFollowUpChecklistItem,
    addFollowUpChecklistItem,
    updateFollowUpChecklistItem,
    deleteFollowUpChecklistItem,
    searchQuery,
  } = useApp();

  const [activeFilter, setActiveFilter] = useState<'all' | 'today' | 'upcoming' | 'high' | 'completed'>('all');

  const todayStr = new Date().toISOString().split('T')[0];

  const pending = followups.filter((f) => !f.isCompleted);
  const completed = followups.filter((f) => f.isCompleted);
  const dueToday = pending.filter((f) => f.dueDate === todayStr);
  const overdue = pending.filter((f) => f.dueDate < todayStr);
  const highPriority = pending.filter((f) => f.priority === 'high');

  const filteredFollowups = followups.filter((item) => {
    if (activeFilter === 'today') {
      if (item.isCompleted || item.dueDate !== todayStr) return false;
    } else if (activeFilter === 'upcoming') {
      if (item.isCompleted || item.dueDate <= todayStr) return false;
    } else if (activeFilter === 'high') {
      if (item.isCompleted || item.priority !== 'high') return false;
    } else if (activeFilter === 'completed') {
      if (!item.isCompleted) return false;
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        item.title.toLowerCase().includes(q) ||
        item.category.toLowerCase().includes(q) ||
        (item.notes && item.notes.toLowerCase().includes(q))
      );
    }
    return true;
  });

  // Sort: Overdue first, then today, then upcoming, completed last
  const sortedFollowups = [...filteredFollowups].sort((a, b) => {
    if (a.isCompleted !== b.isCompleted) {
      return a.isCompleted ? 1 : -1;
    }
    return a.dueDate.localeCompare(b.dueDate);
  });

  const getDueDateLabel = (dateStr: string, isCompleted: boolean) => {
    if (isCompleted) return 'Completed';
    if (dateStr < todayStr) return 'Overdue';
    if (dateStr === todayStr) return 'Due Today';

    const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];
    if (dateStr === tomorrow) return 'Tomorrow';
    return dateStr;
  };

  const getPriorityStyle = (priority: Priority) => {
    switch (priority) {
      case 'high':
        return 'text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/50 border-rose-200 dark:border-rose-900/60';
      case 'medium':
        return 'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/50 border-amber-200 dark:border-amber-900/60';
      case 'low':
      default:
        return 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 border-emerald-200 dark:border-emerald-900/60';
    }
  };

  return (
    <div className="space-y-4 pb-24">
      {/* 1. Summary Card */}
      <SummaryCard
        title="Follow-ups & Action Items"
        badge="Action Matrix"
        primaryLabel="Pending Follow-ups"
        primaryValue={`${pending.length} Tasks`}
        primarySubValue={overdue.length > 0 ? `(${overdue.length} overdue)` : undefined}
        metrics={[
          {
            label: 'Due Today',
            value: `${dueToday.length}`,
            accentClass: 'text-amber-600 dark:text-amber-400',
          },
          {
            label: 'High Priority',
            value: `${highPriority.length}`,
            accentClass: 'text-rose-600 dark:text-rose-400',
          },
          {
            label: 'Completed',
            value: `${completed.length}`,
            accentClass: 'text-emerald-600 dark:text-emerald-400',
          },
        ]}
        gradientFrom="from-rose-500/10"
        gradientTo="to-orange-500/10"
      />

      {/* Filter Tabs & Add Button */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
          {(
            [
              { id: 'all', label: `All (${followups.length})` },
              { id: 'today', label: `Today (${dueToday.length})` },
              { id: 'upcoming', label: 'Upcoming' },
              { id: 'high', label: 'Urgent' },
              { id: 'completed', label: 'Done' },
            ] as const
          ).map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveFilter(tab.id)}
              className={`px-3 py-1 rounded-xl text-xs font-medium transition-colors shrink-0 ${
                activeFilter === tab.id
                  ? 'bg-rose-600 text-white shadow-xs font-semibold'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <button
            onClick={() => openAIItemModal('followup')}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-purple-50 hover:bg-purple-100 dark:bg-purple-950/60 dark:hover:bg-purple-900/60 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800 text-xs font-semibold shadow-2xs transition-colors"
            title="AI Quick Add Follow-up (Rephrase & Clean with preview)"
          >
            <Sparkles className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
            <span>AI Add</span>
          </button>

          <button
            onClick={() => openEditModal('followup')}
            className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold shadow-xs transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Task</span>
          </button>
        </div>
      </div>

      {/* Task List */}
      <div className="space-y-2.5">
        {sortedFollowups.map((item) => {
          const dateLabel = getDueDateLabel(item.dueDate, item.isCompleted);
          const isOverdue = !item.isCompleted && item.dueDate < todayStr;
          const isToday = !item.isCompleted && item.dueDate === todayStr;

          return (
            <div
              key={item.id}
              onClick={() => openEditModal('followup', item.id, item)}
              className={`glass-card rounded-2xl p-3.5 flex items-start gap-3 transition-all cursor-pointer hover:border-slate-300 dark:hover:border-slate-700 ${
                item.isCompleted ? 'opacity-60 bg-slate-50/50 dark:bg-slate-900/30' : ''
              }`}
            >
              {/* Checkbox */}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  toggleCompleteFollowUp(item.id);
                }}
                className={`w-5 h-5 rounded-lg border flex items-center justify-center shrink-0 mt-0.5 transition-all duration-200 ${
                  item.isCompleted
                    ? 'bg-rose-500 border-rose-500 text-white shadow-xs'
                    : 'border-slate-300 dark:border-slate-600 hover:border-rose-400 dark:hover:border-rose-400'
                }`}
              >
                {item.isCompleted && <span className="text-xs font-bold leading-none">✓</span>}
              </button>

              {/* Task Details */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span
                    className={`text-[10px] font-semibold uppercase px-2 py-0.5 rounded-md border ${getPriorityStyle(
                      item.priority
                    )}`}
                  >
                    {item.priority}
                  </span>
                  <span className="text-[10px] text-slate-400">
                    {item.category}
                  </span>
                </div>

                <h4
                  className={`text-xs font-semibold text-slate-800 dark:text-slate-100 ${
                    item.isCompleted ? 'line-through text-slate-400 dark:text-slate-500' : ''
                  }`}
                >
                  {item.title}
                </h4>

                {item.notes && (
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">
                    {item.notes}
                  </p>
                )}

                {/* Checklist & Sub-points */}
                <ChecklistSection
                  items={item.checklist || []}
                  title="Checklist / Sub-tasks"
                  accentColor="rose"
                  onToggle={(subId) => toggleFollowUpChecklistItem(item.id, subId)}
                  onAdd={(text) => addFollowUpChecklistItem(item.id, text)}
                  onUpdate={(subId, text) => updateFollowUpChecklistItem(item.id, subId, text)}
                  onDelete={(subId) => deleteFollowUpChecklistItem(item.id, subId)}
                  allowAdd={true}
                />

                {/* Date & Time pills */}
                <div className="flex items-center gap-2 mt-2 text-[10px]">
                  <span
                    className={`flex items-center gap-1 font-medium ${
                      isOverdue
                        ? 'text-rose-600 dark:text-rose-400 font-semibold'
                        : isToday
                        ? 'text-amber-600 dark:text-amber-400 font-semibold'
                        : 'text-slate-400'
                    }`}
                  >
                    <Calendar className="w-3 h-3" />
                    {dateLabel}
                  </span>
                  {item.dueTime && (
                    <span className="flex items-center gap-0.5 text-slate-400">
                      <Clock className="w-3 h-3" />
                      {item.dueTime}
                    </span>
                  )}
                  {item.completedAt && item.isCompleted && (
                    <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">
                      Completed: {item.completedAt.split('T')[0]}
                    </span>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div
                className="flex items-center gap-1 shrink-0"
                onClick={(e) => e.stopPropagation()}
              >
                <button
                  onClick={() => openAIItemModal('followup', item)}
                  className="w-6 h-6 rounded-lg flex items-center justify-center text-purple-500 hover:text-purple-700 hover:bg-purple-50 dark:hover:bg-purple-950/60 transition-colors"
                  title="Improve & rephrase with AI"
                >
                  <Sparkles className="w-3 h-3" />
                </button>
                <button
                  onClick={() => openEditModal('followup', item.id, item)}
                  className="w-6 h-6 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                  title="Edit task"
                >
                  <Edit2 className="w-3 h-3" />
                </button>
                <button
                  onClick={() => deleteFollowUp(item.id)}
                  className="w-6 h-6 rounded-lg flex items-center justify-center text-slate-400 hover:text-rose-500"
                  title="Delete task"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            </div>
          );
        })}

        {sortedFollowups.length === 0 && (
          <div className="text-center py-10 glass-card rounded-3xl text-slate-400 text-xs">
            No follow-ups in this view. Tap New Task to set up reminders!
          </div>
        )}
      </div>
    </div>
  );
};

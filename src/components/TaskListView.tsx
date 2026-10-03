import React, { useState, useMemo } from 'react';
import { Task, FilterTab, Category, SortField } from '../types';
import { TaskCard } from './TaskCard';
import { CATEGORIES, CATEGORY_META } from '../utils/categoryMeta';
import { isDateOverdue, isDateToday } from '../utils/dateUtils';
import { Search, SlidersHorizontal, X, Plus, Filter, ArrowUpDown } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface TaskListViewProps {
  tasks: Task[];
  activeFilter: FilterTab;
  onFilterChange: (filter: FilterTab) => void;
  onSelectTask: (task: Task) => void;
  onQuickFollowUp: (task: Task, e: React.MouseEvent) => void;
  onOpenCreate: () => void;
}

const FILTER_TABS: FilterTab[] = [
  'All',
  'Today',
  'Overdue',
  'In Progress',
  'Pending',
  'Wishlist',
  'Completed',
];

export const TaskListView: React.FC<TaskListViewProps> = ({
  tasks,
  activeFilter,
  onFilterChange,
  onSelectTask,
  onQuickFollowUp,
  onOpenCreate,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<Category | 'All'>('All');
  const [sortBy, setSortBy] = useState<SortField>('followUpDate');
  const [sortAscending, setSortAscending] = useState(true);
  const [showSortMenu, setShowSortMenu] = useState(false);

  // Filter tasks
  const filteredTasks = useMemo(() => {
    return tasks.filter((task) => {
      // 1. Tab status filter
      const isCompleted = task.status === 'Completed' || task.completionPercentage === 100;
      if (activeFilter === 'Today') {
        if (!isDateToday(task.followUpDate) || isCompleted) return false;
      } else if (activeFilter === 'Overdue') {
        if (!isDateOverdue(task.followUpDate) || isCompleted) return false;
      } else if (activeFilter === 'In Progress') {
        if (task.status !== 'In Progress' && task.completionPercentage === 0) return false;
        if (isCompleted) return false;
      } else if (activeFilter === 'Pending') {
        if (task.status !== 'Pending' || isCompleted) return false;
      } else if (activeFilter === 'Wishlist') {
        if (task.category !== 'Wishlist' && task.status !== 'On Hold') return false;
      } else if (activeFilter === 'Completed') {
        if (!isCompleted) return false;
      }

      // 2. Category filter
      if (selectedCategory !== 'All' && task.category !== selectedCategory) {
        return false;
      }

      // 3. Search query (title or remarks or history text)
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesTitle = task.title.toLowerCase().includes(q);
        const matchesRemark = task.remarks.toLowerCase().includes(q);
        const matchesCategory = task.category.toLowerCase().includes(q);
        const matchesHistory = task.history?.some((h) => h.remark.toLowerCase().includes(q));
        if (!matchesTitle && !matchesRemark && !matchesCategory && !matchesHistory) {
          return false;
        }
      }

      return true;
    });
  }, [tasks, activeFilter, selectedCategory, searchQuery]);

  // Sort tasks
  const sortedTasks = useMemo(() => {
    return [...filteredTasks].sort((a, b) => {
      let comparison = 0;
      if (sortBy === 'followUpDate') {
        comparison = (a.followUpDate || '').localeCompare(b.followUpDate || '');
      } else if (sortBy === 'priority') {
        const priorityWeight = { High: 3, Medium: 2, Low: 1 };
        comparison = priorityWeight[b.priority] - priorityWeight[a.priority];
      } else if (sortBy === 'completionPercentage') {
        comparison = b.completionPercentage - a.completionPercentage;
      } else if (sortBy === 'createdDate') {
        comparison = (b.createdDate || '').localeCompare(a.createdDate || '');
      } else if (sortBy === 'title') {
        comparison = a.title.localeCompare(b.title);
      }
      return sortAscending ? comparison : -comparison;
    });
  }, [filteredTasks, sortBy, sortAscending]);

  return (
    <div id="task-list-view" className="space-y-3 pb-28 pt-1">
      {/* Search Input Bar */}
      <div className="px-4 pt-1">
        <div className="relative flex items-center">
          <Search className="absolute left-3.5 w-4 h-4 text-slate-400 pointer-events-none" />
          <input
            type="text"
            id="input-search-tasks"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by title, remarks, or category..."
            className="w-full pl-10 pr-10 py-2.5 bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl text-xs sm:text-sm text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-500/50 shadow-inner transition-all"
          />
          {searchQuery && (
            <button
              type="button"
              id="btn-clear-search"
              onClick={() => setSearchQuery('')}
              className="absolute right-3 p-1 text-slate-400 hover:text-white rounded-full transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Filter Tabs Scroll Strip */}
      <div className="px-4">
        <div className="flex items-center gap-1.5 overflow-x-auto py-1 no-scrollbar">
          {FILTER_TABS.map((tab) => {
            const count = tasks.filter((t) => {
              const isComp = t.status === 'Completed' || t.completionPercentage === 100;
              if (tab === 'All') return true;
              if (tab === 'Today') return isDateToday(t.followUpDate) && !isComp;
              if (tab === 'Overdue') return isDateOverdue(t.followUpDate) && !isComp;
              if (tab === 'In Progress') return t.status === 'In Progress' && !isComp;
              if (tab === 'Pending') return t.status === 'Pending' && !isComp;
              if (tab === 'Wishlist') return t.category === 'Wishlist' || t.status === 'On Hold';
              if (tab === 'Completed') return isComp;
              return true;
            }).length;

            const isSelected = activeFilter === tab;

            return (
              <button
                key={tab}
                type="button"
                id={`filter-tab-${tab.toLowerCase().replace(/\s+/g, '-')}`}
                onClick={() => onFilterChange(tab)}
                className={`px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 shrink-0 ${
                  isSelected
                    ? 'bg-violet-600 text-white shadow-lg shadow-violet-600/30 border border-violet-400/40'
                    : 'bg-white/5 backdrop-blur-md border border-white/10 text-slate-400 hover:text-slate-200 hover:bg-white/10'
                }`}
              >
                <span>{tab}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full font-black ${
                    isSelected
                      ? 'bg-violet-800 text-white'
                      : 'bg-white/10 text-slate-300'
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Category Chips Scroll Strip & Sort Button */}
      <div className="px-4 flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 overflow-x-auto py-1 no-scrollbar flex-1">
          <button
            type="button"
            onClick={() => setSelectedCategory('All')}
            className={`px-2.5 py-1 rounded-xl text-[11px] font-semibold whitespace-nowrap border transition-all cursor-pointer ${
              selectedCategory === 'All'
                ? 'bg-white/20 text-white border-white/30 backdrop-blur-md shadow-sm'
                : 'bg-white/5 text-slate-400 border-white/10 hover:bg-white/10 hover:text-slate-200'
            }`}
          >
            All Categories
          </button>

          {CATEGORIES.map((cat) => {
            const isSelected = selectedCategory === cat;
            const meta = CATEGORY_META[cat];
            const Icon = meta.icon;
            return (
              <button
                key={cat}
                type="button"
                id={`chip-cat-${cat.toLowerCase()}`}
                onClick={() => setSelectedCategory(isSelected ? 'All' : cat)}
                className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-[11px] font-semibold whitespace-nowrap border transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-violet-600/30 text-violet-200 border-violet-500/40 shadow-sm backdrop-blur-md'
                    : 'bg-white/5 text-slate-400 border-white/10 hover:bg-white/10 hover:text-slate-200'
                }`}
              >
                <Icon className="w-3 h-3" />
                <span>{cat}</span>
              </button>
            );
          })}
        </div>

        {/* Sort Trigger */}
        <div className="relative shrink-0">
          <button
            type="button"
            id="btn-toggle-sort"
            onClick={() => setShowSortMenu(!showSortMenu)}
            className="p-2 rounded-xl border border-white/10 text-slate-300 bg-white/5 hover:bg-white/10 backdrop-blur-md cursor-pointer transition-colors"
            title="Sort tasks"
          >
            <ArrowUpDown className="w-3.5 h-3.5" />
          </button>

          {showSortMenu && (
            <div className="absolute right-0 mt-2 w-48 bg-[#13151c]/95 backdrop-blur-2xl border border-white/15 rounded-2xl shadow-2xl p-2 z-30 space-y-1">
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-2 py-1">
                Sort By
              </div>

              {[
                { id: 'followUpDate', label: 'Follow-Up Date' },
                { id: 'priority', label: 'Priority' },
                { id: 'completionPercentage', label: 'Progress %' },
                { id: 'createdDate', label: 'Created Date' },
                { id: 'title', label: 'Title (A-Z)' },
              ].map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => {
                    if (sortBy === opt.id) {
                      setSortAscending(!sortAscending);
                    } else {
                      setSortBy(opt.id as SortField);
                      setSortAscending(true);
                    }
                    setShowSortMenu(false);
                  }}
                  className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-xl text-xs text-left cursor-pointer transition-colors ${
                    sortBy === opt.id
                      ? 'bg-violet-600/30 text-violet-200 font-bold border border-violet-500/30'
                      : 'text-slate-300 hover:bg-white/10'
                  }`}
                >
                  <span>{opt.label}</span>
                  {sortBy === opt.id && (
                    <span className="text-[10px] text-violet-300">
                      {sortAscending ? '↑ Asc' : '↓ Desc'}
                    </span>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Task List Count Summary */}
      <div className="px-4 flex items-center justify-between text-xs text-slate-400">
        <span>
          Showing {sortedTasks.length} {sortedTasks.length === 1 ? 'task' : 'tasks'}
        </span>
        {selectedCategory !== 'All' && (
          <span className="font-bold text-violet-300">
            Category: {selectedCategory}
          </span>
        )}
      </div>

      {/* Tasks List */}
      <div className="px-4 space-y-3">
        <AnimatePresence mode="popLayout">
          {sortedTasks.length > 0 ? (
            sortedTasks.map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                onSelect={onSelectTask}
                onQuickFollowUp={onQuickFollowUp}
              />
            ))
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="p-8 rounded-3xl bg-white/5 backdrop-blur-xl border border-white/10 text-center space-y-3 my-4 shadow-xl"
            >
              <div className="w-12 h-12 rounded-2xl bg-white/10 text-slate-400 flex items-center justify-center mx-auto border border-white/10">
                <Filter className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-white">
                  No tasks found
                </h3>
                <p className="text-xs text-slate-400 max-w-xs mx-auto">
                  {searchQuery
                    ? `No tasks matched your search "${searchQuery}".`
                    : `No tasks in ${activeFilter} filter.`}
                </p>
              </div>
              <button
                type="button"
                onClick={onOpenCreate}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-2xl bg-violet-600 text-white text-xs font-bold shadow-lg shadow-violet-600/30 hover:bg-violet-500 cursor-pointer transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Create New Task</span>
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

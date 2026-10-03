import React, { useState, useMemo } from 'react';
import {
  Task,
  FilterTab,
  Category,
  SortField,
} from '../../types';
import { TaskCard } from '../TaskCard';
import { CATEGORIES, CATEGORY_META } from '../../utils/categoryMeta';
import { isDateOverdue, isDateToday, formatDate } from '../../utils/dateUtils';
import {
  Search,
  X,
  Plus,
  Filter,
  ArrowUpDown,
  List,
  Calendar as CalendarIcon,
  Clock,
  CheckCircle2,
  AlertCircle,
  ChevronRight,
  Heart,
  ArrowRight,
  Sparkles,
  Zap,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface FollowUpWishlistModuleProps {
  tasks: Task[];
  initialTab?: string;
  onSelectTask: (task: Task) => void;
  onQuickFollowUp: (task: Task, e: React.MouseEvent) => void;
  onOpenCreate: (initialCategory?: Category) => void;
  onConvertToTask?: (task: Task) => void;
}

type ViewMode = 'list' | 'calendar' | 'timeline';
type PrimaryTab = 'Active' | 'Today' | 'Overdue' | 'Wishlist' | 'Completed';

const PRIMARY_TABS: { id: PrimaryTab; label: string }[] = [
  { id: 'Active', label: 'Active' },
  { id: 'Today', label: 'Today' },
  { id: 'Overdue', label: 'Overdue' },
  { id: 'Wishlist', label: 'Wishlist' },
  { id: 'Completed', label: 'Completed' },
];

export const FollowUpWishlistModule: React.FC<FollowUpWishlistModuleProps> = ({
  tasks,
  initialTab,
  onSelectTask,
  onQuickFollowUp,
  onOpenCreate,
  onConvertToTask,
}) => {
  // Map initialTab to PrimaryTab if provided
  const getInitialPrimaryTab = (): PrimaryTab => {
    if (initialTab === 'Wishlist') return 'Wishlist';
    if (initialTab === 'Today') return 'Today';
    if (initialTab === 'Overdue') return 'Overdue';
    if (initialTab === 'Completed') return 'Completed';
    return 'Active';
  };

  const [activeTab, setActiveTab] = useState<PrimaryTab>(getInitialPrimaryTab);
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<Category | 'All'>('All');
  const [sortBy, setSortBy] = useState<SortField>('followUpDate');
  const [sortAscending, setSortAscending] = useState(true);
  const [showSortMenu, setShowSortMenu] = useState(false);

  // Tab counts
  const counts = useMemo(() => {
    let active = 0;
    let today = 0;
    let overdue = 0;
    let wishlist = 0;
    let completed = 0;

    tasks.forEach((t) => {
      const isComp = t.status === 'Completed' || t.completionPercentage === 100;
      const isWish = t.category === 'Wishlist';

      if (isComp) {
        completed += 1;
      } else if (isWish) {
        wishlist += 1;
        active += 1;
      } else {
        active += 1;
        if (isDateToday(t.followUpDate)) today += 1;
        if (isDateOverdue(t.followUpDate)) overdue += 1;
      }
    });

    return { active, today, overdue, wishlist, completed };
  }, [tasks]);

  // Filter tasks for List View
  const filteredTasks = useMemo(() => {
    return tasks.filter((task) => {
      const isCompleted = task.status === 'Completed' || task.completionPercentage === 100;
      const isWishlist = task.category === 'Wishlist';

      // 1. Primary Tab filter
      if (activeTab === 'Active') {
        if (isCompleted) return false;
      } else if (activeTab === 'Today') {
        if (!isDateToday(task.followUpDate) || isCompleted) return false;
      } else if (activeTab === 'Overdue') {
        if (!isDateOverdue(task.followUpDate) || isCompleted) return false;
      } else if (activeTab === 'Wishlist') {
        if (!isWishlist || isCompleted) return false;
      } else if (activeTab === 'Completed') {
        if (!isCompleted) return false;
      }

      // 2. Category filter
      if (selectedCategory !== 'All' && task.category !== selectedCategory) {
        return false;
      }

      // 3. Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesTitle = task.title.toLowerCase().includes(q);
        const matchesRemark = task.remarks?.toLowerCase().includes(q) || false;
        const matchesCategory = task.category.toLowerCase().includes(q);
        const matchesHistory = task.history?.some((h) => h.remark.toLowerCase().includes(q)) || false;
        if (!matchesTitle && !matchesRemark && !matchesCategory && !matchesHistory) {
          return false;
        }
      }

      return true;
    });
  }, [tasks, activeTab, selectedCategory, searchQuery]);

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

  // Calendar grouping for active items
  const nonCompletedTasks = useMemo(() => {
    return tasks.filter((t) => t.status !== 'Completed' && t.completionPercentage < 100);
  }, [tasks]);

  const overdueCalendarTasks = useMemo(
    () => nonCompletedTasks.filter((t) => isDateOverdue(t.followUpDate)),
    [nonCompletedTasks]
  );

  const todayCalendarTasks = useMemo(
    () => nonCompletedTasks.filter((t) => isDateToday(t.followUpDate)),
    [nonCompletedTasks]
  );

  const upcomingCalendarGrouped = useMemo(() => {
    const upcoming = nonCompletedTasks
      .filter((t) => !isDateOverdue(t.followUpDate) && !isDateToday(t.followUpDate) && t.followUpDate)
      .sort((a, b) => a.followUpDate.localeCompare(b.followUpDate));

    const map: Record<string, Task[]> = {};
    upcoming.forEach((t) => {
      if (!map[t.followUpDate]) {
        map[t.followUpDate] = [];
      }
      map[t.followUpDate].push(t);
    });
    return map;
  }, [nonCompletedTasks]);

  // Timeline events: history updates & upcoming milestones
  const timelineEvents = useMemo(() => {
    interface TimelineItem {
      id: string;
      date: string;
      type: 'update' | 'milestone' | 'due';
      task: Task;
      remark?: string;
      percentage?: number;
    }

    const list: TimelineItem[] = [];

    tasks.forEach((t) => {
      // Add updates from history
      if (t.history && t.history.length > 0) {
        t.history.forEach((h) => {
          list.push({
            id: `hist_${h.id}`,
            date: h.date || h.createdAt.slice(0, 10),
            type: 'update',
            task: t,
            remark: h.remark,
            percentage: h.completionPercentage,
          });
        });
      }

      // Add due milestone
      if (t.followUpDate && t.status !== 'Completed') {
        list.push({
          id: `due_${t.id}`,
          date: t.followUpDate,
          type: 'due',
          task: t,
          percentage: t.completionPercentage,
        });
      }
    });

    return list.sort((a, b) => b.date.localeCompare(a.date));
  }, [tasks]);

  return (
    <div id="followup-wishlist-module" className="space-y-3.5 pb-24 pt-1">
      {/* Top View Mode Switcher + New Action */}
      <div className="flex items-center justify-between gap-2 px-1">
        <div className="flex items-center gap-1 p-1 bg-white/5 border border-white/10 rounded-2xl">
          <button
            type="button"
            id="view-mode-list"
            onClick={() => setViewMode('list')}
            className={`py-1.5 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              viewMode === 'list'
                ? 'bg-violet-600 text-white shadow-md shadow-violet-950/40'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <List className="w-3.5 h-3.5" />
            <span>List</span>
          </button>

          <button
            type="button"
            id="view-mode-calendar"
            onClick={() => setViewMode('calendar')}
            className={`py-1.5 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              viewMode === 'calendar'
                ? 'bg-violet-600 text-white shadow-md shadow-violet-950/40'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <CalendarIcon className="w-3.5 h-3.5" />
            <span>Calendar</span>
          </button>

          <button
            type="button"
            id="view-mode-timeline"
            onClick={() => setViewMode('timeline')}
            className={`py-1.5 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              viewMode === 'timeline'
                ? 'bg-violet-600 text-white shadow-md shadow-violet-950/40'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Timeline</span>
          </button>
        </div>

        <button
          type="button"
          id="btn-add-item-followup"
          onClick={() => onOpenCreate(activeTab === 'Wishlist' ? 'Wishlist' : undefined)}
          className="flex items-center gap-1.5 py-2 px-3.5 rounded-2xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-bold shadow-lg shadow-violet-600/30 transition-all cursor-pointer active:scale-95"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>{activeTab === 'Wishlist' ? 'Add Wish' : 'New Task'}</span>
        </button>
      </div>

      {/* 1. LIST VIEW */}
      {viewMode === 'list' && (
        <div className="space-y-3">
          {/* Segmented Status Tabs: [ ACTIVE ] [ TODAY ] [ OVERDUE ] [ WISHLIST ] [ COMPLETED ] */}
          <div className="flex items-center gap-1.5 overflow-x-auto py-1 no-scrollbar">
            {PRIMARY_TABS.map((tab) => {
              const isSelected = activeTab === tab.id;
              const count =
                tab.id === 'Active'
                  ? counts.active
                  : tab.id === 'Today'
                  ? counts.today
                  : tab.id === 'Overdue'
                  ? counts.overdue
                  : tab.id === 'Wishlist'
                  ? counts.wishlist
                  : counts.completed;

              return (
                <button
                  key={tab.id}
                  type="button"
                  id={`tab-primary-${tab.id.toLowerCase()}`}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 shrink-0 ${
                    isSelected
                      ? 'bg-violet-600 text-white shadow-lg shadow-violet-600/30 border border-violet-400/40'
                      : 'bg-white/5 backdrop-blur-md border border-white/10 text-slate-400 hover:text-slate-200 hover:bg-white/10'
                  }`}
                >
                  <span>{tab.label}</span>
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded-full font-black ${
                      isSelected ? 'bg-violet-800 text-white' : 'bg-white/10 text-slate-300'
                    }`}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Search Input Bar */}
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

          {/* Category Chips Scroll Strip & Sort Trigger */}
          <div className="flex items-center justify-between gap-2">
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

            {/* Sort Trigger Menu */}
            <div className="relative shrink-0">
              <button
                type="button"
                id="btn-toggle-sort"
                onClick={() => setShowSortMenu(!showSortMenu)}
                className="p-2 rounded-xl border border-white/10 text-slate-300 bg-white/5 hover:bg-white/10 backdrop-blur-md cursor-pointer transition-colors"
                title="Sort items"
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

          {/* List Items Summary */}
          <div className="flex items-center justify-between text-xs text-slate-400 px-1">
            <span>
              Showing {sortedTasks.length} {sortedTasks.length === 1 ? 'item' : 'items'}
            </span>
            {selectedCategory !== 'All' && (
              <span className="font-bold text-violet-300">Category: {selectedCategory}</span>
            )}
          </div>

          {/* Tasks & Wishlist Cards */}
          <div className="space-y-3">
            <AnimatePresence mode="popLayout">
              {sortedTasks.length > 0 ? (
                sortedTasks.map((task) => {
                  const isWishlist = task.category === 'Wishlist';

                  // If it's a simple Wishlist item in Wishlist tab or active view
                  if (isWishlist && activeTab === 'Wishlist') {
                    return (
                      <motion.div
                        key={task.id}
                        layout
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        whileTap={{ scale: 0.985 }}
                        onClick={() => onSelectTask(task)}
                        className="p-4 rounded-3xl bg-pink-950/20 hover:bg-pink-950/30 border border-pink-500/25 backdrop-blur-xl transition-all cursor-pointer space-y-2.5 group"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-pink-500/20 text-pink-300 border border-pink-500/30 flex items-center gap-1">
                                <Heart className="w-3 h-3" />
                                <span>Wishlist</span>
                              </span>
                              {task.priority && (
                                <span className="text-[10px] text-slate-400 font-medium">
                                  {task.priority} Priority
                                </span>
                              )}
                            </div>
                            <h3 className="text-base font-bold text-white group-hover:text-pink-300 transition-colors mt-1">
                              {task.title}
                            </h3>
                          </div>

                          {onConvertToTask && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                onConvertToTask(task);
                              }}
                              className="px-3 py-1.5 rounded-xl bg-violet-600/30 hover:bg-violet-600/50 text-violet-200 border border-violet-500/40 text-xs font-bold flex items-center gap-1 cursor-pointer transition-all active:scale-95 shrink-0"
                              title="Convert to an active follow-up task"
                            >
                              <Zap className="w-3 h-3 text-amber-300" />
                              <span>Make Active</span>
                            </button>
                          )}
                        </div>

                        {task.remarks && (
                          <p className="text-xs text-slate-300 italic bg-white/5 border border-white/5 p-2.5 rounded-2xl">
                            {task.remarks}
                          </p>
                        )}

                        <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
                          <span>
                            {task.followUpDate ? `Target: ${formatDate(task.followUpDate)}` : 'No target date'}
                          </span>
                          <span className="text-pink-300 font-medium flex items-center gap-0.5">
                            <span>Details</span>
                            <ChevronRight className="w-3.5 h-3.5" />
                          </span>
                        </div>
                      </motion.div>
                    );
                  }

                  return (
                    <TaskCard
                      key={task.id}
                      task={task}
                      onSelect={onSelectTask}
                      onQuickFollowUp={onQuickFollowUp}
                    />
                  );
                })
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
                    <h3 className="text-sm font-bold text-white">No items found</h3>
                    <p className="text-xs text-slate-400 max-w-xs mx-auto">
                      {searchQuery
                        ? `No items matched "${searchQuery}".`
                        : `No items currently in ${activeTab} tab.`}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => onOpenCreate(activeTab === 'Wishlist' ? 'Wishlist' : undefined)}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-2xl bg-violet-600 text-white text-xs font-bold shadow-lg shadow-violet-600/30 hover:bg-violet-500 cursor-pointer transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>{activeTab === 'Wishlist' ? 'Add Wishlist Item' : 'Create New Task'}</span>
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      )}

      {/* 2. CALENDAR VIEW */}
      {viewMode === 'calendar' && (
        <div className="space-y-4">
          {/* Overdue Items */}
          {overdueCalendarTasks.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-rose-400 px-1">
                <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider">
                  <AlertCircle className="w-4 h-4" />
                  <span>Overdue ({overdueCalendarTasks.length})</span>
                </div>
                <span className="text-[11px] font-semibold text-rose-300">Action Required</span>
              </div>

              <div className="space-y-2">
                {overdueCalendarTasks.map((t) => (
                  <div
                    key={t.id}
                    onClick={() => onSelectTask(t)}
                    className="p-3.5 rounded-2xl bg-rose-950/25 border border-rose-500/30 hover:bg-rose-950/40 backdrop-blur-xl transition-all cursor-pointer flex items-center justify-between group"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-white group-hover:text-rose-300 transition-colors truncate">
                          {t.title}
                        </span>
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30">
                          {t.category}
                        </span>
                      </div>
                      <div className="text-[11px] text-rose-400 font-medium mt-1">
                        Was due: {formatDate(t.followUpDate)} {t.remarks ? `• ${t.remarks}` : ''}
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-white shrink-0" />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Due Today Items */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-amber-400 px-1">
              <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider">
                <Clock className="w-4 h-4" />
                <span>Due Today ({todayCalendarTasks.length})</span>
              </div>
              <span className="text-[11px] font-semibold text-amber-300">Today&apos;s Follow-Ups</span>
            </div>

            {todayCalendarTasks.length === 0 ? (
              <div className="p-4 rounded-2xl bg-white/5 border border-white/10 text-slate-400 text-xs text-center">
                No follow-ups due today. You&apos;re all caught up!
              </div>
            ) : (
              <div className="space-y-2">
                {todayCalendarTasks.map((t) => (
                  <div
                    key={t.id}
                    onClick={() => onSelectTask(t)}
                    className="p-3.5 rounded-2xl bg-amber-950/25 border border-amber-500/30 hover:bg-amber-950/40 backdrop-blur-xl transition-all cursor-pointer flex items-center justify-between group"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-white group-hover:text-amber-300 transition-colors truncate">
                          {t.title}
                        </span>
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                          {t.category}
                        </span>
                      </div>
                      <div className="text-[11px] text-amber-300 font-medium mt-1">
                        Due Today {t.remarks ? `• ${t.remarks}` : ''}
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-white shrink-0" />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Upcoming Schedule */}
          <div className="space-y-3">
            <div className="flex items-center justify-between text-cyan-400 px-1">
              <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider">
                <CalendarIcon className="w-4 h-4" />
                <span>Upcoming Follow-Ups</span>
              </div>
              <span className="text-[11px] text-slate-400">Chronological</span>
            </div>

            {Object.keys(upcomingCalendarGrouped).length === 0 ? (
              <div className="p-4 rounded-2xl bg-white/5 border border-white/10 text-slate-400 text-xs text-center">
                No upcoming follow-ups scheduled.
              </div>
            ) : (
              (Object.entries(upcomingCalendarGrouped) as [string, Task[]][]).map(([dateStr, dateTasks]) => (
                <div key={dateStr} className="space-y-1.5">
                  <div className="text-[11px] font-bold text-cyan-300/90 pl-1">
                    📅 {formatDate(dateStr)} ({dateTasks.length} {dateTasks.length === 1 ? 'task' : 'tasks'})
                  </div>

                  <div className="space-y-1.5">
                    {dateTasks.map((t) => (
                      <div
                        key={t.id}
                        onClick={() => onSelectTask(t)}
                        className="p-3 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-cyan-500/40 backdrop-blur-xl transition-all cursor-pointer flex items-center justify-between group"
                      >
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-white group-hover:text-cyan-300 transition-colors truncate">
                              {t.title}
                            </span>
                            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-white/10 text-slate-300">
                              {t.category}
                            </span>
                          </div>
                          {t.remarks && (
                            <p className="text-[11px] text-slate-400 truncate mt-0.5">{t.remarks}</p>
                          )}
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <span className="text-[11px] font-semibold text-slate-400">
                            {t.completionPercentage}%
                          </span>
                          <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-white" />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* 3. TIMELINE VIEW */}
      {viewMode === 'timeline' && (
        <div className="space-y-3">
          <div className="text-xs font-bold text-slate-400 uppercase tracking-widest px-1">
            Activity & Follow-Up Timeline
          </div>

          {timelineEvents.length === 0 ? (
            <div className="p-8 text-center rounded-2xl bg-white/5 border border-white/10 text-slate-400 text-xs">
              No timeline history recorded yet.
            </div>
          ) : (
            <div className="relative pl-6 space-y-4 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-white/10">
              {timelineEvents.slice(0, 30).map((event) => (
                <div key={event.id} className="relative group">
                  <div
                    className={`absolute -left-6 top-1.5 w-3.5 h-3.5 rounded-full border-2 border-[#0d0e12] ${
                      event.type === 'due'
                        ? 'bg-cyan-400 shadow-sm shadow-cyan-400/50'
                        : 'bg-violet-400 shadow-sm shadow-violet-400/50'
                    }`}
                  />
                  <div
                    onClick={() => onSelectTask(event.task)}
                    className="p-3 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 backdrop-blur-xl transition-all cursor-pointer"
                  >
                    <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1">
                      <span className="font-semibold text-slate-300">{formatDate(event.date)}</span>
                      <span
                        className={`font-bold px-2 py-0.2 rounded-full ${
                          event.type === 'due'
                            ? 'bg-cyan-500/20 text-cyan-300'
                            : 'bg-violet-500/20 text-violet-300'
                        }`}
                      >
                        {event.type === 'due' ? 'Scheduled Due' : 'Follow-Up Update'}
                      </span>
                    </div>

                    <h4 className="text-xs font-bold text-white group-hover:text-violet-300 transition-colors">
                      {event.task.title}
                    </h4>

                    {event.remark && (
                      <p className="text-xs text-slate-300 italic mt-1 bg-white/5 p-2 rounded-xl">
                        &quot;{event.remark}&quot;
                      </p>
                    )}

                    <div className="flex items-center justify-between text-[10px] text-slate-400 mt-1.5">
                      <span>Category: {event.task.category}</span>
                      <span>Progress: {event.percentage ?? event.task.completionPercentage}%</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

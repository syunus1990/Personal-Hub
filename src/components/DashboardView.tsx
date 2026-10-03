import React from 'react';
import { Task, FilterTab } from '../types';
import { TaskCard } from './TaskCard';
import { isDateOverdue, isDateToday } from '../utils/dateUtils';
import {
  AlertCircle,
  Calendar,
  Clock,
  Heart,
  Hourglass,
  ArrowRight,
  TrendingUp,
  Sparkles,
  Plus,
  CheckCircle2
} from 'lucide-react';
import { motion } from 'motion/react';

interface DashboardViewProps {
  tasks: Task[];
  onSelectTask: (task: Task) => void;
  onQuickFollowUp: (task: Task, e: React.MouseEvent) => void;
  onNavigateTab: (tab: FilterTab) => void;
  onOpenCreate: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  tasks,
  onSelectTask,
  onQuickFollowUp,
  onNavigateTab,
  onOpenCreate,
}) => {
  // Filter subsets
  const overdueTasks = tasks.filter(
    (t) => t.status !== 'Completed' && t.completionPercentage < 100 && isDateOverdue(t.followUpDate)
  );

  const todayTasks = tasks.filter(
    (t) => t.status !== 'Completed' && t.completionPercentage < 100 && isDateToday(t.followUpDate)
  );

  const inProgressTasks = tasks.filter(
    (t) => (t.status === 'In Progress' || (t.completionPercentage > 0 && t.completionPercentage < 100)) && t.status !== 'Completed'
  );

  const wishlistTasks = tasks.filter(
    (t) => t.category === 'Wishlist' || t.status === 'On Hold'
  );

  const recentPendingTasks = tasks.filter(
    (t) => t.status === 'Pending' && t.category !== 'Wishlist' && t.completionPercentage < 100
  );

  const completedTasks = tasks.filter(
    (t) => t.status === 'Completed' || t.completionPercentage === 100
  );

  return (
    <div id="dashboard-view" className="space-y-6 pb-28 pt-3">
      {/* Top Quick Status Metric Cards - Frosted Glass Aesthetic */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 px-4">
        {/* Overdue Metric */}
        <button
          type="button"
          id="stat-card-overdue"
          onClick={() => onNavigateTab('Overdue')}
          className={`p-4 rounded-3xl border text-left transition-all cursor-pointer backdrop-blur-md ${
            overdueTasks.length > 0
              ? 'bg-rose-500/15 border-rose-500/30 text-rose-300 shadow-lg shadow-rose-950/30'
              : 'bg-white/5 border-white/10 text-slate-400 hover:bg-white/10'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-widest text-rose-400">
              Overdue
            </span>
            <AlertCircle className={`w-4 h-4 ${overdueTasks.length > 0 ? 'text-rose-400 animate-pulse' : 'text-slate-500'}`} />
          </div>
          <p className="text-3xl font-bold text-white mt-1">
            {overdueTasks.length}
          </p>
          <span className="text-[10px] text-rose-300/80 font-medium">Needs attention</span>
        </button>

        {/* Due Today Metric */}
        <button
          type="button"
          id="stat-card-today"
          onClick={() => onNavigateTab('Today')}
          className="p-4 rounded-3xl bg-blue-500/15 backdrop-blur-md border border-blue-500/30 text-left transition-all cursor-pointer shadow-lg shadow-blue-950/30 hover:bg-blue-500/20"
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-widest text-blue-400">
              Due Today
            </span>
            <Clock className="w-4 h-4 text-blue-400" />
          </div>
          <p className="text-3xl font-bold text-white mt-1">
            {todayTasks.length}
          </p>
          <span className="text-[10px] text-blue-300/80 font-medium">Follow-up due</span>
        </button>

        {/* In Progress Metric */}
        <button
          type="button"
          id="stat-card-in-progress"
          onClick={() => onNavigateTab('In Progress')}
          className="p-4 rounded-3xl bg-emerald-500/15 backdrop-blur-md border border-emerald-500/30 text-left transition-all cursor-pointer shadow-lg shadow-emerald-950/30 hover:bg-emerald-500/20"
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-400">
              In Progress
            </span>
            <TrendingUp className="w-4 h-4 text-emerald-400" />
          </div>
          <p className="text-3xl font-bold text-white mt-1">
            {inProgressTasks.length}
          </p>
          <span className="text-[10px] text-emerald-300/80 font-medium">Active chases</span>
        </button>

        {/* Wishlist Metric */}
        <button
          type="button"
          id="stat-card-wishlist"
          onClick={() => onNavigateTab('Wishlist')}
          className="p-4 rounded-3xl bg-amber-500/15 backdrop-blur-md border border-amber-500/30 text-left transition-all cursor-pointer shadow-lg shadow-amber-950/30 hover:bg-amber-500/20"
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-widest text-amber-400">
              Wishlist
            </span>
            <Heart className="w-4 h-4 text-amber-400" />
          </div>
          <p className="text-3xl font-bold text-white mt-1">
            {wishlistTasks.length}
          </p>
          <span className="text-[10px] text-amber-300/80 font-medium">Things for later</span>
        </button>
      </div>

      {/* 1. OVERDUE TASKS SECTION */}
      {overdueTasks.length > 0 && (
        <section id="section-overdue-tasks" className="px-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.8)] animate-pulse" />
              <h2 className="text-sm font-bold text-white tracking-tight flex items-center gap-2">
                <span>Overdue Follow-ups</span>
                <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30">
                  {overdueTasks.length}
                </span>
              </h2>
            </div>

            <button
              type="button"
              onClick={() => onNavigateTab('Overdue')}
              className="text-xs font-medium text-rose-400 hover:text-rose-300 flex items-center gap-1 cursor-pointer transition-colors"
            >
              <span>View all</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-3">
            {overdueTasks.map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                onSelect={onSelectTask}
                onQuickFollowUp={onQuickFollowUp}
              />
            ))}
          </div>
        </section>
      )}

      {/* 2. DUE TODAY SECTION */}
      <section id="section-due-today-tasks" className="px-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-blue-400" />
            <h2 className="text-sm font-bold text-white tracking-tight flex items-center gap-2">
              <span>Follow-ups Due Today</span>
              <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-blue-500/20 text-blue-300 border border-blue-500/30">
                {todayTasks.length}
              </span>
            </h2>
          </div>

          {todayTasks.length > 0 && (
            <button
              type="button"
              onClick={() => onNavigateTab('Today')}
              className="text-xs font-medium text-blue-400 hover:text-blue-300 flex items-center gap-1 cursor-pointer transition-colors"
            >
              <span>View all</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {todayTasks.length > 0 ? (
          <div className="space-y-3">
            {todayTasks.map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                onSelect={onSelectTask}
                onQuickFollowUp={onQuickFollowUp}
              />
            ))}
          </div>
        ) : (
          <div className="p-4 rounded-2xl bg-white/5 backdrop-blur-md border border-white/10 text-center text-xs text-slate-400">
            No follow-ups scheduled for today. Great job!
          </div>
        )}
      </section>

      {/* 3. IN PROGRESS CHASES SECTION */}
      <section id="section-in-progress-tasks" className="px-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-emerald-400" />
            <h2 className="text-sm font-bold text-white tracking-tight flex items-center gap-2">
              <span>In Progress & Chasing</span>
              <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                {inProgressTasks.length}
              </span>
            </h2>
          </div>

          {inProgressTasks.length > 0 && (
            <button
              type="button"
              onClick={() => onNavigateTab('In Progress')}
              className="text-xs font-medium text-emerald-400 hover:text-emerald-300 flex items-center gap-1 cursor-pointer transition-colors"
            >
              <span>View all</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {inProgressTasks.length > 0 ? (
          <div className="space-y-3">
            {inProgressTasks.slice(0, 3).map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                onSelect={onSelectTask}
                onQuickFollowUp={onQuickFollowUp}
              />
            ))}
          </div>
        ) : (
          <div className="p-4 rounded-2xl bg-white/5 backdrop-blur-md border border-white/10 text-center text-xs text-slate-400">
            No tasks currently in progress.
          </div>
        )}
      </section>

      {/* 4. RECENT PENDING TASKS SECTION */}
      <section id="section-recent-pending-tasks" className="px-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Hourglass className="w-4 h-4 text-amber-400" />
            <h2 className="text-sm font-bold text-white tracking-tight flex items-center gap-2">
              <span>Pending Tasks</span>
              <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                {recentPendingTasks.length}
              </span>
            </h2>
          </div>

          {recentPendingTasks.length > 0 && (
            <button
              type="button"
              onClick={() => onNavigateTab('Pending')}
              className="text-xs font-medium text-amber-400 hover:text-amber-300 flex items-center gap-1 cursor-pointer transition-colors"
            >
              <span>View all</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {recentPendingTasks.length > 0 ? (
          <div className="space-y-3">
            {recentPendingTasks.slice(0, 3).map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                onSelect={onSelectTask}
                onQuickFollowUp={onQuickFollowUp}
              />
            ))}
          </div>
        ) : (
          <div className="p-4 rounded-2xl bg-white/5 backdrop-blur-md border border-white/10 text-center text-xs text-slate-400">
            No pending tasks.
          </div>
        )}
      </section>

      {/* 5. WISHLIST SECTION */}
      <section id="section-wishlist-tasks" className="px-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Heart className="w-4 h-4 text-purple-400" />
            <h2 className="text-sm font-bold text-white tracking-tight flex items-center gap-2">
              <span>Wishlist & Someday</span>
              <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30">
                {wishlistTasks.length}
              </span>
            </h2>
          </div>

          {wishlistTasks.length > 0 && (
            <button
              type="button"
              onClick={() => onNavigateTab('Wishlist')}
              className="text-xs font-medium text-purple-400 hover:text-purple-300 flex items-center gap-1 cursor-pointer transition-colors"
            >
              <span>View all</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {wishlistTasks.length > 0 ? (
          <div className="space-y-3">
            {wishlistTasks.slice(0, 3).map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                onSelect={onSelectTask}
                onQuickFollowUp={onQuickFollowUp}
              />
            ))}
          </div>
        ) : (
          <div className="p-4 rounded-2xl bg-white/5 backdrop-blur-md border border-white/10 text-center text-xs text-slate-400">
            Wishlist is empty. Add ideas or things to purchase later!
          </div>
        )}
      </section>
    </div>
  );
};

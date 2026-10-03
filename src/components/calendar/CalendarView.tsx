import React, { useState, useMemo } from 'react';
import {
  Calendar as CalendarIcon,
  AlertCircle,
  Clock,
  CheckCircle2,
  ChevronRight,
  ArrowRight,
  Filter,
} from 'lucide-react';
import { Task } from '../../types';
import { formatDate, isDateOverdue, isDateToday } from '../../utils/dateUtils';

interface CalendarViewProps {
  tasks: Task[];
  onSelectTask: (task: Task) => void;
  onNavigateToFollowUp: (tab?: string) => void;
}

export const CalendarView: React.FC<CalendarViewProps> = ({
  tasks,
  onSelectTask,
  onNavigateToFollowUp,
}) => {
  const [filterCategory, setFilterCategory] = useState<string>('All');

  // Non-completed tasks
  const activeTasks = useMemo(() => {
    return tasks.filter((t) => {
      if (t.status === 'Completed' || t.completionPercentage >= 100) return false;
      if (filterCategory !== 'All' && t.category !== filterCategory) return false;
      return true;
    });
  }, [tasks, filterCategory]);

  // Group into Overdue, Today, Upcoming, and Later
  const overdueTasks = useMemo(
    () => activeTasks.filter((t) => isDateOverdue(t.followUpDate)),
    [activeTasks]
  );

  const todayTasks = useMemo(
    () => activeTasks.filter((t) => isDateToday(t.followUpDate)),
    [activeTasks]
  );

  const upcomingTasks = useMemo(() => {
    return activeTasks
      .filter((t) => !isDateOverdue(t.followUpDate) && !isDateToday(t.followUpDate))
      .sort((a, b) => a.followUpDate.localeCompare(b.followUpDate));
  }, [activeTasks]);

  // Group upcoming by date
  const upcomingGrouped = useMemo(() => {
    const map: Record<string, Task[]> = {};
    upcomingTasks.forEach((t) => {
      if (!map[t.followUpDate]) {
        map[t.followUpDate] = [];
      }
      map[t.followUpDate].push(t);
    });
    return map;
  }, [upcomingTasks]);

  // Categories list
  const categories = useMemo(() => {
    const set = new Set<string>();
    tasks.forEach((t) => set.add(t.category));
    return ['All', ...Array.from(set)];
  }, [tasks]);

  return (
    <div className="p-4 space-y-4 pb-20">
      {/* Calendar Header Card */}
      <div className="p-4 rounded-3xl bg-cyan-950/30 border border-cyan-500/20 backdrop-blur-xl flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-cyan-600/30 border border-cyan-500/40 text-cyan-300 flex items-center justify-center shadow-lg shadow-cyan-950/50">
            <CalendarIcon className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white tracking-tight">
              Follow-Up Agenda
            </h2>
            <p className="text-xs text-slate-300">
              Synced directly with your FollowUp tasks
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => onNavigateToFollowUp('Follow-Ups Today')}
          className="text-xs font-bold text-cyan-300 hover:text-white flex items-center gap-1 cursor-pointer"
        >
          <span>Open Tasks</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Category Filter Pills */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest pl-1 shrink-0">
          Category:
        </span>
        {categories.map((cat) => (
          <button
            key={cat}
            type="button"
            onClick={() => setFilterCategory(cat)}
            className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap border transition-all cursor-pointer ${
              filterCategory === cat
                ? 'bg-cyan-600 text-white border-cyan-400 shadow-sm'
                : 'bg-white/5 border-white/10 text-slate-400 hover:text-white'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* 1. OVERDUE SECTION */}
      {overdueTasks.length > 0 && (
        <div className="space-y-2.5">
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-2 text-rose-400">
              <AlertCircle className="w-4 h-4" />
              <h3 className="text-xs font-bold uppercase tracking-wider">
                Overdue Follow-Ups ({overdueTasks.length})
              </h3>
            </div>
            <span className="text-[11px] text-rose-300 font-semibold">
              Action Needed
            </span>
          </div>

          <div className="space-y-2">
            {overdueTasks.map((task) => (
              <div
                key={task.id}
                onClick={() => onSelectTask(task)}
                className="p-3.5 rounded-2xl bg-rose-950/20 border border-rose-500/30 hover:bg-rose-950/30 backdrop-blur-xl transition-all cursor-pointer flex items-center justify-between group"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-white group-hover:text-rose-300 transition-colors truncate">
                      {task.title}
                    </span>
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30">
                      {task.category}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-1">
                    <span className="text-rose-400 font-medium">
                      Was due: {formatDate(task.followUpDate)}
                    </span>
                    {task.remarks && (
                      <>
                        <span>•</span>
                        <span className="truncate max-w-[160px]">{task.remarks}</span>
                      </>
                    )}
                  </div>
                </div>

                <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-white shrink-0" />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 2. TODAY SECTION */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-2 text-amber-400">
            <Clock className="w-4 h-4" />
            <h3 className="text-xs font-bold uppercase tracking-wider">
              Due Today ({todayTasks.length})
            </h3>
          </div>
          <span className="text-[11px] text-amber-300 font-semibold">
            Today&apos;s Follow-Ups
          </span>
        </div>

        {todayTasks.length === 0 ? (
          <div className="p-4 rounded-2xl bg-white/5 border border-white/10 text-slate-400 text-xs text-center">
            No follow-ups due today. You&apos;re caught up!
          </div>
        ) : (
          <div className="space-y-2">
            {todayTasks.map((task) => (
              <div
                key={task.id}
                onClick={() => onSelectTask(task)}
                className="p-3.5 rounded-2xl bg-amber-950/20 border border-amber-500/30 hover:bg-amber-950/30 backdrop-blur-xl transition-all cursor-pointer flex items-center justify-between group"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-white group-hover:text-amber-300 transition-colors truncate">
                      {task.title}
                    </span>
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                      {task.category}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-1">
                    <span className="text-amber-300 font-medium">Due Today</span>
                    {task.remarks && (
                      <>
                        <span>•</span>
                        <span className="truncate max-w-[160px]">{task.remarks}</span>
                      </>
                    )}
                  </div>
                </div>

                <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-white shrink-0" />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 3. UPCOMING SCHEDULE SECTION */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-2 text-cyan-400">
            <CalendarIcon className="w-4 h-4" />
            <h3 className="text-xs font-bold uppercase tracking-wider">
              Upcoming Schedule ({upcomingTasks.length})
            </h3>
          </div>
          <span className="text-[11px] text-slate-400">Chronological</span>
        </div>

        {upcomingTasks.length === 0 ? (
          <div className="p-4 rounded-2xl bg-white/5 border border-white/10 text-slate-400 text-xs text-center">
            No upcoming follow-ups scheduled.
          </div>
        ) : (
          (Object.entries(upcomingGrouped) as [string, Task[]][]).map(([dateStr, dateTasks]) => (
            <div key={dateStr} className="space-y-1.5">
              <div className="text-[11px] font-bold text-cyan-300/90 pl-1">
                📅 {formatDate(dateStr)} ({dateTasks.length} tasks)
              </div>

              <div className="space-y-1.5">
                {dateTasks.map((task) => (
                  <div
                    key={task.id}
                    onClick={() => onSelectTask(task)}
                    className="p-3 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-cyan-500/40 backdrop-blur-xl transition-all cursor-pointer flex items-center justify-between group"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-white group-hover:text-cyan-300 transition-colors truncate">
                          {task.title}
                        </span>
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-white/10 text-slate-300">
                          {task.category}
                        </span>
                      </div>
                      {task.remarks && (
                        <p className="text-[11px] text-slate-400 truncate mt-0.5">
                          {task.remarks}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-[11px] font-semibold text-slate-400">
                        {task.completionPercentage}%
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
  );
};

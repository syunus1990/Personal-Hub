import React, { useState } from 'react';
import { Task, FollowUpHistoryEntry, Status } from '../types';
import { getTodayString, addDaysToDate, formatDate } from '../utils/dateUtils';
import { X, Calendar, CheckCircle2, Clock, Sparkles, Send } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface QuickFollowUpSheetProps {
  task: Task | null;
  isOpen: boolean;
  onClose: () => void;
  onSaveFollowUp: (updatedTask: Task, newHistoryEntry: FollowUpHistoryEntry) => void;
}

export const QuickFollowUpSheet: React.FC<QuickFollowUpSheetProps> = ({
  task,
  isOpen,
  onClose,
  onSaveFollowUp,
}) => {
  if (!task || !isOpen) return null;

  const todayStr = getTodayString();
  const [remarkText, setRemarkText] = useState('');
  const [percentage, setPercentage] = useState<number>(task.completionPercentage);
  const [selectedDate, setSelectedDate] = useState<string>(task.followUpDate || todayStr);
  const [activeDatePreset, setActiveDatePreset] = useState<string>('custom');
  const [status, setStatus] = useState<Status>(task.status);

  const setPresetDate = (days: number, presetKey: string) => {
    const nextDate = addDaysToDate(todayStr, days);
    setSelectedDate(nextDate);
    setActiveDatePreset(presetKey);
  };

  const handlePercentageChange = (newVal: number) => {
    setPercentage(newVal);
    if (newVal === 100) {
      setStatus('Completed');
    } else if (newVal > 0 && status === 'Pending') {
      setStatus('In Progress');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const timestamp = new Date().toISOString();
    const finalRemark = remarkText.trim() || `Followed up: Progress at ${percentage}%.`;

    const newHistoryEntry: FollowUpHistoryEntry = {
      id: `hist-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      date: todayStr,
      completionPercentage: percentage,
      remark: finalRemark,
      createdAt: timestamp,
    };

    const updatedTask: Task = {
      ...task,
      completionPercentage: percentage,
      followUpDate: selectedDate,
      remarks: finalRemark,
      status: percentage === 100 ? 'Completed' : status,
      lastFollowedUpAt: timestamp,
      history: [newHistoryEntry, ...(task.history || [])],
    };

    onSaveFollowUp(updatedTask, newHistoryEntry);
    onClose();
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/70 backdrop-blur-md">
        {/* Backdrop click to dismiss */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0"
          onClick={onClose}
        />

        {/* Modal / Bottom Sheet Panel */}
        <motion.div
          id="quick-followup-sheet"
          initial={{ y: '100%' }}
          animate={{ y: 0 }}
          exit={{ y: '100%' }}
          transition={{ type: 'spring', damping: 28, stiffness: 300 }}
          className="relative w-full max-w-lg bg-[#13151c]/95 backdrop-blur-2xl rounded-t-3xl sm:rounded-3xl shadow-2xl shadow-violet-950/50 border border-white/15 max-h-[92vh] overflow-y-auto flex flex-col z-10 text-slate-200"
        >
          {/* Top Handle for Android bottom-sheet feel */}
          <div className="flex justify-center pt-3 pb-1 sm:hidden">
            <div className="w-10 h-1.5 bg-white/20 rounded-full" />
          </div>

          {/* Header */}
          <div className="px-5 py-4 border-b border-white/10 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-violet-500/20 border border-violet-500/30 text-violet-300 flex items-center justify-center">
                <Clock className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-base font-bold text-white tracking-tight">
                  Log Follow-Up
                </h2>
                <p className="text-xs text-slate-400 line-clamp-1 max-w-[240px]">
                  {task.title}
                </p>
              </div>
            </div>

            <button
              id="btn-close-followup-sheet"
              type="button"
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-xl hover:bg-white/10 cursor-pointer transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Form Content */}
          <form onSubmit={handleSubmit} className="p-5 space-y-5">
            {/* Reschedule Next Follow-Up Date */}
            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-widest mb-2">
                Next Follow-Up Date
              </label>

              {/* Quick Preset Buttons (Today, Tomorrow, 3 days, 1 week) */}
              <div className="grid grid-cols-4 gap-2 mb-3">
                <button
                  type="button"
                  id="btn-preset-today"
                  onClick={() => setPresetDate(0, 'today')}
                  className={`py-2 px-2 text-xs font-bold rounded-xl border transition-all cursor-pointer ${
                    activeDatePreset === 'today' || selectedDate === todayStr
                      ? 'bg-violet-600 text-white border-violet-400 shadow-lg shadow-violet-600/30'
                      : 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10'
                  }`}
                >
                  Today
                </button>

                <button
                  type="button"
                  id="btn-preset-tomorrow"
                  onClick={() => setPresetDate(1, 'tomorrow')}
                  className={`py-2 px-2 text-xs font-bold rounded-xl border transition-all cursor-pointer ${
                    activeDatePreset === 'tomorrow'
                      ? 'bg-violet-600 text-white border-violet-400 shadow-lg shadow-violet-600/30'
                      : 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10'
                  }`}
                >
                  Tomorrow
                </button>

                <button
                  type="button"
                  id="btn-preset-3days"
                  onClick={() => setPresetDate(3, '3days')}
                  className={`py-2 px-2 text-xs font-bold rounded-xl border transition-all cursor-pointer ${
                    activeDatePreset === '3days'
                      ? 'bg-violet-600 text-white border-violet-400 shadow-lg shadow-violet-600/30'
                      : 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10'
                  }`}
                >
                  +3 Days
                </button>

                <button
                  type="button"
                  id="btn-preset-1week"
                  onClick={() => setPresetDate(7, '1week')}
                  className={`py-2 px-2 text-xs font-bold rounded-xl border transition-all cursor-pointer ${
                    activeDatePreset === '1week'
                      ? 'bg-violet-600 text-white border-violet-400 shadow-lg shadow-violet-600/30'
                      : 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10'
                  }`}
                >
                  +1 Week
                </button>
              </div>

              {/* Custom Date Picker */}
              <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-2xl px-3.5 py-2.5">
                <Calendar className="w-4 h-4 text-slate-400 shrink-0" />
                <span className="text-xs text-slate-400 shrink-0">Custom date:</span>
                <input
                  type="date"
                  id="input-followup-date"
                  value={selectedDate}
                  onChange={(e) => {
                    setSelectedDate(e.target.value);
                    setActiveDatePreset('custom');
                  }}
                  className="w-full bg-transparent text-xs text-white focus:outline-none cursor-pointer"
                />
              </div>
              <p className="text-[11px] text-slate-400 mt-1 pl-1">
                Selected: {formatDate(selectedDate)}
              </p>
            </div>

            {/* Completion Percentage Adjustment */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold text-slate-300 uppercase tracking-widest">
                  Completion Progress
                </label>
                <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-violet-500/20 text-violet-300 border border-violet-500/30">
                  {percentage}%
                </span>
              </div>

              {/* Slider */}
              <input
                type="range"
                id="input-percentage-slider"
                min="0"
                max="100"
                step="5"
                value={percentage}
                onChange={(e) => handlePercentageChange(Number(e.target.value))}
                className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer accent-violet-500"
              />

              {/* Preset progress chips */}
              <div className="flex justify-between items-center mt-2 gap-1.5">
                {[0, 25, 50, 75, 100].map((val) => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => handlePercentageChange(val)}
                    className={`flex-1 py-1 text-[11px] rounded-xl border font-bold transition-all cursor-pointer ${
                      percentage === val
                        ? 'bg-violet-600/30 border-violet-500 text-violet-200 shadow-sm'
                        : 'bg-white/5 border-white/10 text-slate-400 hover:bg-white/10'
                    }`}
                  >
                    {val}%
                  </button>
                ))}
              </div>
            </div>

            {/* New Follow-up Remark / Update Note */}
            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-widest mb-2">
                Follow-Up Note / Remark
              </label>
              <textarea
                id="input-followup-remark"
                rows={3}
                value={remarkText}
                onChange={(e) => setRemarkText(e.target.value)}
                placeholder="e.g. Spoke with technician, parts dispatched. Waiting for screening test."
                className="w-full px-3.5 py-2.5 bg-white/5 border border-white/15 rounded-2xl text-xs sm:text-sm text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-500/40 resize-none"
              />
            </div>

            {/* Action Buttons */}
            <div className="pt-2 flex gap-3">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-3 px-4 rounded-2xl border border-white/15 text-slate-300 text-sm font-bold hover:bg-white/10 cursor-pointer transition-colors"
              >
                Cancel
              </button>

              <button
                type="submit"
                id="btn-submit-followup"
                className="flex-2 py-3 px-4 rounded-2xl bg-violet-600 hover:bg-violet-500 text-white text-sm font-bold shadow-lg shadow-violet-600/30 flex items-center justify-center gap-2 cursor-pointer active:scale-98 transition-all"
              >
                <Send className="w-4 h-4" />
                <span>Save Follow-Up</span>
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

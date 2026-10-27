import React from 'react';

interface MetricItem {
  label: string;
  value: string;
  subValue?: string;
  accentClass?: string;
}

interface SummaryCardProps {
  title: string;
  badge?: string;
  subtitle?: string;
  primaryValue: string;
  primaryLabel: string;
  primarySubValue?: string;
  metrics?: MetricItem[];
  actions?: React.ReactNode;
  gradientFrom?: string;
  gradientTo?: string;
}

export const SummaryCard: React.FC<SummaryCardProps> = ({
  title,
  badge,
  subtitle,
  primaryValue,
  primaryLabel,
  primarySubValue,
  metrics,
  actions,
  gradientFrom = 'from-purple-500/10',
  gradientTo = 'to-indigo-500/10',
}) => {
  return (
    <div
      className={`relative overflow-hidden rounded-3xl p-4 sm:p-5 glass-card bg-gradient-to-br ${gradientFrom} ${gradientTo} border border-slate-200/90 dark:border-white/10 shadow-xs mb-4`}
    >
      {/* Header Row */}
      <div className="flex items-center justify-between gap-2 mb-3">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
              {title}
            </h2>
            {badge && (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-50 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300 border border-purple-200/80 dark:border-purple-800/50">
                {badge}
              </span>
            )}
          </div>
          {subtitle && (
            <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-0.5 font-medium">
              {subtitle}
            </p>
          )}
        </div>
        {actions && <div className="shrink-0">{actions}</div>}
      </div>

      {/* Primary Value (Big Metric Style) */}
      <div className="mb-3">
        <p className="text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wide">
          {primaryLabel}
        </p>
        <div className="flex items-baseline gap-2 mt-0.5">
          <p className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white tabular-nums font-heading">
            {primaryValue}
          </p>
          {primarySubValue && (
            <span className="text-xs font-semibold text-slate-600 dark:text-slate-400 tabular-nums">
              {primarySubValue}
            </span>
          )}
        </div>
      </div>

      {/* Secondary Metrics Row */}
      {metrics && metrics.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 pt-3 border-t border-slate-200/90 dark:border-slate-800/80">
          {metrics.map((m, idx) => (
            <div key={idx} className="min-w-0">
              <span className="block text-[10px] uppercase font-bold tracking-wider text-slate-600 dark:text-slate-400 truncate">
                {m.label}
              </span>
              <div className="flex items-baseline gap-1 mt-0.5">
                <span
                  className={`text-sm font-bold tabular-nums truncate ${
                    m.accentClass || 'text-slate-900 dark:text-slate-100'
                  }`}
                >
                  {m.value}
                </span>
                {m.subValue && (
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 tabular-nums truncate font-medium">
                    {m.subValue}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

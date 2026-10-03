/**
 * Utility functions for date calculations, formatting and relative descriptions
 */

export function getTodayString(): string {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function formatDate(dateString: string): string {
  if (!dateString) return '';
  try {
    const parts = dateString.split('-');
    if (parts.length === 3) {
      const year = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1;
      const day = parseInt(parts[2], 10);
      const d = new Date(year, month, day);
      return d.toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      }); // e.g. "18 Aug 2026"
    }
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return dateString;
    return d.toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return dateString;
  }
}

export function formatDateTime(isoString: string): string {
  if (!isoString) return '';
  try {
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return isoString;
    return d.toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return isoString;
  }
}

export function addDaysToDate(baseDateStr: string, days: number): string {
  let base: Date;
  if (baseDateStr && baseDateStr.includes('-')) {
    const parts = baseDateStr.split('-');
    base = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
  } else {
    base = new Date();
  }
  base.setDate(base.getDate() + days);
  const year = base.getFullYear();
  const month = String(base.getMonth() + 1).padStart(2, '0');
  const day = String(base.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function isDateToday(dateString: string): boolean {
  if (!dateString) return false;
  return dateString === getTodayString();
}

export function isDateOverdue(dateString: string): boolean {
  if (!dateString) return false;
  const today = getTodayString();
  return dateString < today;
}

export function isDateUpcoming(dateString: string): boolean {
  if (!dateString) return false;
  const today = getTodayString();
  return dateString > today;
}

export function getDaysDifference(dateString: string): number {
  if (!dateString) return 0;
  const todayParts = getTodayString().split('-').map(Number);
  const targetParts = dateString.split('-').map(Number);

  const today = new Date(todayParts[0], todayParts[1] - 1, todayParts[2]);
  const target = new Date(targetParts[0], targetParts[1] - 1, targetParts[2]);

  const diffTime = target.getTime() - today.getTime();
  return Math.round(diffTime / (1000 * 60 * 60 * 24));
}

export function getRelativeFollowUpLabel(dateString: string, isCompleted: boolean = false): {
  label: string;
  badgeType: 'overdue' | 'today' | 'tomorrow' | 'upcoming' | 'completed' | 'none';
} {
  if (isCompleted) {
    return { label: 'Completed', badgeType: 'completed' };
  }
  if (!dateString) {
    return { label: 'No follow-up set', badgeType: 'none' };
  }

  const diff = getDaysDifference(dateString);

  if (diff < 0) {
    const days = Math.abs(diff);
    return {
      label: days === 1 ? 'Overdue by 1 day' : `Overdue by ${days} days`,
      badgeType: 'overdue',
    };
  }
  if (diff === 0) {
    return { label: 'Due Today', badgeType: 'today' };
  }
  if (diff === 1) {
    return { label: 'Due Tomorrow', badgeType: 'tomorrow' };
  }
  if (diff <= 7) {
    return { label: `In ${diff} days`, badgeType: 'upcoming' };
  }

  return { label: formatDate(dateString), badgeType: 'upcoming' };
}

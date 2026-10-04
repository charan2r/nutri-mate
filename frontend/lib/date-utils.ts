/**
 * Date and Plan Active Day Utility functions.
 * Handles timezone-safe calendar day calculations.
 */

/**
 * Safely parses YYYY-MM-DD string into local year, month (0-indexed), date numbers.
 */
export function parseYMD(dateStr?: string | null): { year: number; month: number; date: number } | null {
  if (!dateStr) return null;
  try {
    const cleanStr = String(dateStr).split('T')[0].trim();
    const parts = cleanStr.split('-').map(Number);
    if (parts.length >= 3 && !isNaN(parts[0]) && !isNaN(parts[1]) && !isNaN(parts[2])) {
      return { year: parts[0], month: parts[1] - 1, date: parts[2] };
    }
  } catch (err) {
    console.log('Error parsing date string:', dateStr, err);
  }
  return null;
}

/**
 * Returns the day number of the plan matching today's local date.
 * Returns null if today is before the plan starts or after the plan ends.
 */
export function getActivePlanDay(startDateStr?: string | null, totalDays: number = 3): number | null {
  if (!startDateStr) return null;
  const start = parseYMD(startDateStr);
  if (!start) return null;

  const now = new Date();
  
  const startUtc = Date.UTC(start.year, start.month, start.date);
  const todayUtc = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate());

  const diffDays = Math.round((todayUtc - startUtc) / (1000 * 60 * 60 * 24));
  const activeDay = diffDays + 1; 

  if (activeDay >= 1 && activeDay <= totalDays) {
    return activeDay;
  }
  return null; // Expired or future plan
}

/**
 * Checks if a plan is currently active today.
 */
export function isPlanActiveToday(startDateStr?: string | null, totalDays: number = 3): boolean {
  return getActivePlanDay(startDateStr, totalDays) !== null;
}

/**
 * Formats the calendar date for a specific day in the plan (e.g. "Aug 23").
 */
export function getPlanDayDateString(startDateStr?: string | null, dayNumber: number = 1): string {
  if (!startDateStr) return '';
  const start = parseYMD(startDateStr);
  if (!start) return '';
  const targetDate = new Date(start.year, start.month, start.date + (dayNumber - 1));
  return targetDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

/**
 * Returns formatted start to end date range (e.g. "Aug 22 - Aug 24").
 */
export function getPlanDateRangeString(startDateStr?: string | null, totalDays: number = 3): string {
  if (!startDateStr) return '';
  const start = getPlanDayDateString(startDateStr, 1);
  const end = getPlanDayDateString(startDateStr, totalDays);
  if (start && end) {
    return `${start} - ${end}`;
  }
  return start || '';
}

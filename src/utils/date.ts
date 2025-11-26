/**
 * Date utility functions for payment system
 */

/**
 * Convert Date or string to YYYY-MM-DD format
 */
export const toYYYYMMDD = (d: Date | string | undefined | null): string => {
  if (!d) {
    // Return today's date if no date provided
    return new Date().toISOString().slice(0, 10);
  }
  
  if (typeof d === 'string') {
    return d.slice(0, 10);
  }
  
  if (d instanceof Date) {
    return d.toISOString().slice(0, 10);
  }
  
  // Fallback for any other case
  return new Date().toISOString().slice(0, 10);
};

/**
 * Get first day of month in YYYY-MM-DD format
 */
export const firstOfMonth = (dateStr: string | undefined | null): string => {
  if (!dateStr) {
    // Return first day of current month if no date provided
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    return `${year}-${month}-01`;
  }
  return dateStr.slice(0, 7) + '-01';
};

/**
 * Get first day of month from Date object
 */
export const firstOfMonthFromDate = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}-01`;
};

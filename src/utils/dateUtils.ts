import { format, addMonths } from 'date-fns';
import { az } from 'date-fns/locale';

/**
 * Format date in Azerbaijani locale with dd.mm.yyyy format
 * @param date - Date to format
 * @param formatString - Format string (default: 'dd.MM.yyyy')
 * @returns Formatted date string
 */
export const formatDateAz = (date: Date, formatString: string = 'dd.MM.yyyy'): string => {
  return format(date, formatString, { locale: az });
};

/**
 * Format date for display in tables and cards (dd.mm.yyyy format)
 * @param date - Date to format (can be Date object or date string)
 * @returns Formatted date string
 */
export const formatDisplayDate = (date: Date | string): string => {
  try {
    const dateObj = date instanceof Date ? date : new Date(date);
    if (!dateObj || isNaN(dateObj.getTime())) {
      return 'Invalid Date';
    }
    return formatDateAz(dateObj, 'dd.MM.yyyy');
  } catch (error) {
    console.error('Error formatting date:', error, 'Date value:', date);
    return 'Invalid Date';
  }
};

/**
 * Format date for month/year display
 * @param date - Date to format
 * @returns Formatted date string
 */
export const formatMonthYear = (date: Date): string => {
  if (!date || isNaN(date.getTime())) {
    return 'Invalid Date';
  }
  return formatDateAz(date, 'MM.yyyy');
};

/**
 * Format date range for display
 * @param startDate - Start date
 * @param endDate - End date
 * @returns Formatted date range string
 */
export const formatDateRange = (startDate: Date, endDate: Date): string => {
  if (!startDate || !endDate || isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
    return 'Invalid Date Range';
  }
  return `${formatDisplayDate(startDate)} - ${formatDisplayDate(endDate)}`;
};

/**
 * Format date for HTML date input (yyyy-MM-dd format)
 * @param date - Date to format
 * @returns Formatted date string for date input
 */
export const formatDateForInput = (date: Date | string): string => {
  try {
    const dateObj = date instanceof Date ? date : new Date(date);
    if (!dateObj || isNaN(dateObj.getTime())) {
      return '';
    }
    return format(dateObj, 'yyyy-MM-dd');
  } catch (error) {
    console.error('Error formatting date for input:', error, 'Date value:', date);
    return '';
  }
};

/**
 * Parse date from dd.mm.yyyy format
 * @param dateString - Date string in dd.mm.yyyy format
 * @returns Date object or null if invalid
 */
export const parseDateFromDisplay = (dateString: string): Date | null => {
  try {
    const [day, month, year] = dateString.split('.');
    const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
    if (isNaN(date.getTime())) {
      return null;
    }
    return date;
  } catch (error) {
    console.error('Error parsing date from display format:', error);
    return null;
  }
};

/**
 * Format date for payment schedule display (dd MMM yyyy format)
 * @param date - Date to format
 * @returns Formatted date string
 */
export const formatPaymentDate = (date: Date): string => {
  return formatDateAz(date, 'dd MMM yyyy');
};

/**
 * Add months to a date
 * @param date - Date to add months to
 * @param months - Number of months to add
 * @returns New date with months added
 */
export const addMonthsToDate = (date: Date, months: number): Date => {
  return addMonths(date, months);
};

/**
 * Safely formats a date value, returning 'N/A' for invalid dates
 * @param dateValue - The date value to format (can be Date, string, or any other date-like value)
 * @param formatString - The format string to use (e.g., 'MMM dd, yyyy')
 * @returns Formatted date string or 'N/A' if invalid
 */
export const safeFormatDate = (dateValue: any, formatString: string): string => {
  if (!dateValue) return 'N/A';
  
  try {
    const date = new Date(dateValue);
    if (isNaN(date.getTime())) {
      return 'N/A';
    }
    return format(date, formatString);
  } catch (error) {
    console.warn('Invalid date value:', dateValue, error);
    return 'N/A';
  }
};

/**
 * Safely creates a Date object from a date value, returning null for invalid dates
 * @param dateValue - The date value to convert
 * @returns Date object or null if invalid
 */
export const safeCreateDate = (dateValue: any): Date | null => {
  if (!dateValue) return null;
  
  try {
    const date = new Date(dateValue);
    if (isNaN(date.getTime())) {
      console.warn('Invalid date value:', dateValue);
      return null;
    }
    return date;
  } catch (error) {
    console.warn('Error creating date from value:', dateValue, error);
    return null;
  }
};

/**
 * Checks if a date value is valid
 * @param dateValue - The date value to check
 * @returns true if the date is valid, false otherwise
 */
export const isValidDate = (dateValue: any): boolean => {
  if (!dateValue) return false;
  
  try {
    const date = new Date(dateValue);
    return !isNaN(date.getTime());
  } catch (error) {
    return false;
  }
};


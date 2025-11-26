import { PaymentInterval } from '../types';
import { addDays, addWeeks, addMonths, addQuarters, addYears, differenceInDays, isBefore, isAfter, isSameDay } from 'date-fns';

/**
 * Calculate the next due date based on payment interval
 */
export const calculateNextDueDate = (
  currentDueDate: Date,
  paymentInterval: PaymentInterval
): Date => {
  switch (paymentInterval) {
    case PaymentInterval.WEEKLY:
      return addWeeks(currentDueDate, 1);
    case PaymentInterval.BI_WEEKLY:
      return addWeeks(currentDueDate, 2);
    case PaymentInterval.MONTHLY:
      return addMonths(currentDueDate, 1);
    case PaymentInterval.QUARTERLY:
      return addQuarters(currentDueDate, 1);
    case PaymentInterval.SEMI_ANNUALLY:
      return addMonths(currentDueDate, 6);
    case PaymentInterval.ANNUALLY:
      return addYears(currentDueDate, 1);
    default:
      return addMonths(currentDueDate, 1); // Default to monthly
  }
};

/**
 * Calculate the initial due date based on contract start date and payment interval
 */
export const calculateInitialDueDate = (
  contractStartDate: Date,
  paymentStartDate: Date,
  paymentInterval: PaymentInterval
): Date => {
  // If payment start date is provided, use it
  if (paymentStartDate) {
    return paymentStartDate;
  }
  
  // Otherwise, calculate based on contract start date and interval
  return calculateNextDueDate(contractStartDate, paymentInterval);
};

/**
 * Calculate overdue days based on payment date and due date
 */
export const calculateOverdueDays = (paymentDate: Date, dueDate: Date): number => {
  if (isBefore(paymentDate, dueDate) || isSameDay(paymentDate, dueDate)) {
    return 0; // Payment is on time or early
  }
  return differenceInDays(paymentDate, dueDate);
};

/**
 * Check if payment is overdue
 */
export const isPaymentOverdue = (paymentDate: Date, dueDate: Date): boolean => {
  return isAfter(paymentDate, dueDate);
};

/**
 * Get payment interval display text
 */
export const getPaymentIntervalDisplay = (interval: PaymentInterval): string => {
  switch (interval) {
    case PaymentInterval.WEEKLY:
      return 'Weekly';
    case PaymentInterval.BI_WEEKLY:
      return 'Bi-weekly';
    case PaymentInterval.MONTHLY:
      return 'Monthly';
    case PaymentInterval.QUARTERLY:
      return 'Quarterly';
    case PaymentInterval.SEMI_ANNUALLY:
      return 'Semi-annually';
    case PaymentInterval.ANNUALLY:
      return 'Annually';
    default:
      return 'Monthly';
  }
};

/**
 * Calculate the expected payment amount based on payment interval
 * This adjusts the base monthly payment to match the interval
 */
export const calculateExpectedPaymentAmount = (
  monthlyPayment: number,
  paymentInterval: PaymentInterval
): number => {
  let amount: number;
  switch (paymentInterval) {
    case PaymentInterval.WEEKLY:
      amount = monthlyPayment / 4; // Weekly payment is 1/4 of monthly
      break;
    case PaymentInterval.BI_WEEKLY:
      amount = monthlyPayment / 2; // Bi-weekly payment is 1/2 of monthly
      break;
    case PaymentInterval.MONTHLY:
      amount = monthlyPayment; // Monthly payment stays the same
      break;
    case PaymentInterval.QUARTERLY:
      amount = monthlyPayment * 3; // Quarterly payment is 3x monthly
      break;
    case PaymentInterval.SEMI_ANNUALLY:
      amount = monthlyPayment * 6; // Semi-annual payment is 6x monthly
      break;
    case PaymentInterval.ANNUALLY:
      amount = monthlyPayment * 12; // Annual payment is 12x monthly
      break;
    default:
      amount = monthlyPayment;
  }
  
  // Round to 2 decimal places for precision (don't round to whole number)
  return Math.round(amount * 100) / 100;
};

/**
 * Adjust payment date to handle special cases (Sundays, 31st day, February)
 */
export const adjustPaymentDate = (date: Date): Date => {
  const adjustedDate = new Date(date);
  
  // Get the current day of the month
  const day = adjustedDate.getDate();
  const month = adjustedDate.getMonth();
  const year = adjustedDate.getFullYear();
  
  // Check if it's February and handle special cases
  if (month === 1) { // February (0-indexed)
    const isLeapYear = (year % 4 === 0 && year % 100 !== 0) || (year % 400 === 0);
    const lastDayOfFebruary = isLeapYear ? 29 : 28;
    
    // If day is 29, 30, or 31, move to last day of February
    if (day > lastDayOfFebruary) {
      adjustedDate.setDate(lastDayOfFebruary);
    }
  } else {
    // For other months, check if the day is 31 and month doesn't have 31 days
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    if (day === 31 && daysInMonth < 31) {
      adjustedDate.setDate(30);
    }
  }
  
  // Check if the date falls on Sunday (0 = Sunday, 1 = Monday, ..., 6 = Saturday)
  const dayOfWeek = adjustedDate.getDay();
  if (dayOfWeek === 0) { // Sunday
    // Move to Monday
    adjustedDate.setDate(adjustedDate.getDate() + 1);
  }
  
  return adjustedDate;
};

/**
 * Calculate the next due date based on payment start date and payments count
 * This ensures the interval is always calculated from the payment_start_date
 * Applies date adjustment rules for Sundays, 31st day, and February special cases
 */
export const calculateNextDueDateFromStartDate = (
  paymentStartDate: Date,
  paymentsCount: number,
  paymentInterval: PaymentInterval
): Date => {
  // If no payments have been made yet, the next due date should be the payment start date
  if (paymentsCount === 0) {
    return adjustDateForSundays(new Date(paymentStartDate));
  }
  
  // Get the original day of the month from the payment start date
  const originalDay = paymentStartDate.getDate();
  
  // Start with the payment start date
  let nextDate = new Date(paymentStartDate);
  
  // Add intervals for each payment that has been made
  // For paymentsCount = 1, we want 1 interval after start date
  // For paymentsCount = 2, we want 2 intervals after start date
  for (let i = 0; i < paymentsCount; i++) {
    nextDate = calculateNextDueDateWithDayPreservation(nextDate, paymentInterval, originalDay);
  }
  
  // Only apply Sunday adjustment if needed
  return adjustDateForSundays(nextDate);
};

/**
 * Calculate the next due date based on contract start date + 1 month
 * This is a new function that uses contract start date + 1 month for calculation
 * while preserving the existing system
 */
export const calculateNextDueDateFromContractStartDate = (
  contractStartDate: Date,
  paymentsCount: number,
  paymentInterval: PaymentInterval
): Date => {
  // If no payments have been made yet, the next due date should be contract start date + 1 month
  if (paymentsCount === 0) {
    const firstPaymentDate = addMonths(contractStartDate, 1);
    return adjustDateForSundays(new Date(firstPaymentDate));
  }
  
  // Use the original day from contract start date to maintain consistency
  const originalDay = contractStartDate.getDate();
  
  // Calculate the next due date as: contractStartDate + (paymentsCount + 1) * interval
  // This ensures we always calculate from the contract start date, not from the first payment date
  let nextDate = new Date(contractStartDate);
  
  // Add (paymentsCount + 1) intervals from contract start date
  // For paymentsCount = 0, we want 1 interval after contract start (first payment)
  // For paymentsCount = 1, we want 2 intervals after contract start (second payment)
  // For paymentsCount = 7, we want 8 intervals after contract start (8th payment)
  
  // Special debug for the specific contract mentioned
  if (contractStartDate.toISOString().split('T')[0] === '2024-03-12' && paymentsCount === 16) {
    console.log('🔧 SPECIAL DATE CALCULATION DEBUG:', {
      contractStartDate: contractStartDate.toISOString().split('T')[0],
      paymentsCount,
      originalDay,
      paymentInterval,
      expectedResult: 'Should be 2025-08-12 for 17th payment'
    });
  }
  
  for (let i = 0; i < paymentsCount + 1; i++) {
    nextDate = calculateNextDueDateWithDayPreservation(nextDate, paymentInterval, originalDay);
    
    // Debug for specific contract
    if (contractStartDate.toISOString().split('T')[0] === '2024-03-12' && paymentsCount === 16) {
      console.log(`🔧 Date calculation step ${i + 1}:`, {
        step: i + 1,
        currentDate: nextDate.toISOString().split('T')[0],
        expectedFor17thPayment: i === 16 ? '2025-08-12' : 'N/A'
      });
    }
  }
  
  // Only apply Sunday adjustment if needed
  return adjustDateForSundays(nextDate);
};

/**
 * Adjust date to handle Sundays only (month-end handling is done by date-fns addMonths)
 */
const adjustDateForSundays = (date: Date): Date => {
  const adjustedDate = new Date(date);
  
  // Check if the date falls on Sunday (0 = Sunday, 1 = Monday, ..., 6 = Saturday)
  const dayOfWeek = adjustedDate.getDay();
  if (dayOfWeek === 0) { // Sunday
    // Move to Monday
    adjustedDate.setDate(adjustedDate.getDate() + 1);
  }
  
  return adjustedDate;
};

/**
 * Calculate next due date with day preservation for payment schedules
 * This ensures that after month-end adjustments, we try to return to the original day
 */
const calculateNextDueDateWithDayPreservation = (
  currentDate: Date,
  paymentInterval: PaymentInterval,
  originalDay: number
): Date => {
  // First, add the interval using date-fns
  let nextDate = calculateNextDueDate(currentDate, paymentInterval);
  
  // If the original day exists in the target month, use it
  const targetMonth = nextDate.getMonth();
  const targetYear = nextDate.getFullYear();
  const lastDayOfTargetMonth = new Date(targetYear, targetMonth + 1, 0).getDate();
  
  if (originalDay <= lastDayOfTargetMonth) {
    // The original day exists in the target month, use it
    nextDate.setDate(originalDay);
  }
  // If the original day doesn't exist (like 30th in February), keep the adjusted date
  
  return nextDate;
};

/**
 * Calculate the next due date after a payment is made
 * Updated to use payment_start_date as the base for interval calculation
 */
export const calculateNextDueDateAfterPayment = (
  paymentDate: Date,
  currentDueDate: Date,
  paymentInterval: PaymentInterval,
  paymentStartDate: Date,
  paymentsCount: number
): Date => {
  // After a payment is made, the payments_count will be incremented by 1
  // So we calculate the next due date for the current payments_count
  return calculateNextDueDateFromStartDate(paymentStartDate, paymentsCount, paymentInterval);
};

/**
 * Get payment status based on payment date and due date
 */
export const getPaymentStatus = (paymentDate: Date, dueDate: Date): 'on_time' | 'early' | 'overdue' => {
  if (isBefore(paymentDate, dueDate)) {
    return 'early';
  } else if (isSameDay(paymentDate, dueDate)) {
    return 'on_time';
  } else {
    return 'overdue';
  }
};

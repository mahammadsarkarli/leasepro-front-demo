import { PaymentInterval, Contract } from '../types';
import { addMonths } from 'date-fns';
import { calculateNextDueDateFromStartDate, calculateNextDueDateFromContractStartDate } from './paymentIntervalUtils';

/**
 * Calculate monthly payment using standard loan payment formula
 * @param principal - Loan amount (down payment)
 * @param yearlyInterestRate - Yearly interest rate as percentage
 * @param termMonths - Loan term in months
 * @returns Monthly payment amount
 */
export const calculateMonthlyPayment = (
  principal: number,
  yearlyInterestRate: number,
  termMonths: number
): number => {
  if (principal <= 0 || termMonths <= 0) {
    return 0;
  }

  if (yearlyInterestRate <= 0) {
    // If interest rate is 0, simple division
    return Math.round((principal / termMonths) * 100) / 100;
  }

  const monthlyRate = yearlyInterestRate / 100 / 12;
  
  // Standard loan payment formula: P = L[c(1 + c)^n]/[(1 + c)^n - 1]
  // Where P = payment, L = loan amount, c = monthly interest rate, n = number of payments
  const monthlyPayment = principal * (monthlyRate * Math.pow(1 + monthlyRate, termMonths)) / 
                        (Math.pow(1 + monthlyRate, termMonths) - 1);
  
  return Math.round(monthlyPayment * 100) / 100;
};

/**
 * Calculate total payable amount
 * @param monthlyPayment - Monthly payment amount
 * @param termMonths - Loan term in months
 * @returns Total payable amount
 */
export const calculateTotalPayable = (
  monthlyPayment: number,
  termMonths: number
): number => {
  if (monthlyPayment <= 0 || termMonths <= 0) {
    return 0;
  }
  
  const totalPayable = monthlyPayment * termMonths;
  return Math.round(totalPayable * 100) / 100;
};

/**
 * Calculate remaining balance
 * @param totalPayable - Total payable amount
 * @param totalPaid - Total amount paid so far
 * @param downPayment - Down payment amount (optional)
 * @param standardPurchasePrice - Standard purchase price (optional)
 * @returns Remaining balance
 */
export const calculateRemainingBalance = (
  totalPayable: number,
  totalPaid: number = 0,
  downPayment?: number,
  standardPurchasePrice?: number
): number => {
  // Check if this is a 100% down payment contract
  if (downPayment && standardPurchasePrice && downPayment >= standardPurchasePrice) {
    // For 100% down payment contracts: remaining balance = down_payment - principal_paid
    // For 100% down payment contracts, all payments are principal payments
    const principalPaid = totalPaid; // All payments are principal in 100% down payment contracts
    const remainingBalance = Math.max(0, downPayment - principalPaid);
    return Math.round(remainingBalance * 100) / 100;
  }
  
  // For regular contracts: remaining balance = total_payable - total_paid
  const remainingBalance = Math.max(0, totalPayable - totalPaid);
  return Math.round(remainingBalance * 100) / 100;
};

/**
 * Enhanced contract calculation with comprehensive error handling
 * @param downPayment - Down payment amount
 * @param yearlyInterestRate - Yearly interest rate as percentage
 * @param termMonths - Loan term in months
 * @param totalPaid - Total amount paid so far (optional)
 * @returns Comprehensive contract calculation object
 */
export const calculateContractDetails = (
  downPayment: number,
  yearlyInterestRate: number,
  termMonths: number,
  totalPaid: number = 0
) => {
  try {
    // Validate inputs
    if (downPayment < 0) {
      throw new Error('Down payment cannot be negative');
    }
    
    if (yearlyInterestRate < 0 || yearlyInterestRate > 100) {
      throw new Error('Yearly interest rate must be between 0 and 100');
    }
    
    if (termMonths <= 0) {
      throw new Error('Term months must be greater than 0');
    }
    
    if (totalPaid < 0) {
      throw new Error('Total paid cannot be negative');
    }

    const monthlyPayment = calculateMonthlyPayment(downPayment, yearlyInterestRate, termMonths);
    const totalPayable = calculateTotalPayable(monthlyPayment, termMonths);
    
    // The down payment is considered the first payment, so it should be included in totalPaid
    // when calculating remaining balance for a new contract
    const totalPaidIncludingDownPayment = totalPaid + downPayment;
    const remainingBalance = calculateRemainingBalance(totalPayable, totalPaidIncludingDownPayment);
    const totalInterest = totalPayable - downPayment;

    return {
      monthlyPayment,
      totalPayable,
      remainingBalance,
      totalInterest: Math.round(totalInterest * 100) / 100,
      calculationBreakdown: {
        principal: downPayment,
        monthlyRate: yearlyInterestRate / 100 / 12,
        termMonths,
        formula: yearlyInterestRate > 0 
          ? `P = ${downPayment} × [${(yearlyInterestRate / 100 / 12).toFixed(4)} × (1 + ${(yearlyInterestRate / 100 / 12).toFixed(4)})^${termMonths}] / [(1 + ${(yearlyInterestRate / 100 / 12).toFixed(4)})^${termMonths} - 1]`
          : `P = ${downPayment} / ${termMonths}`
      }
    };
  } catch (error) {
    console.error('Error in contract calculation:', error);
    return {
      monthlyPayment: 0,
      totalPayable: 0,
      remainingBalance: 0,
      totalInterest: 0,
      calculationBreakdown: {
        principal: 0,
        monthlyRate: 0,
        termMonths: 0,
        formula: ''
      }
    };
  }
};

/**
 * Calculate next due date based on payment interval
 * @param paymentStartDate - Payment start date
 * @param paymentInterval - Payment interval
 * @returns Next due date
 */
export const calculateNextDueDate = (
  paymentStartDate: Date,
  paymentInterval: PaymentInterval
): Date => {
  let nextDueDate = new Date(paymentStartDate);
  
  switch (paymentInterval) {
    case PaymentInterval.WEEKLY:
      nextDueDate.setDate(nextDueDate.getDate() + 7);
      break;
    case PaymentInterval.BI_WEEKLY:
      nextDueDate.setDate(nextDueDate.getDate() + 14);
      break;
    case PaymentInterval.MONTHLY:
      // Use date-fns addMonths to handle month-end dates correctly
      nextDueDate = addMonths(nextDueDate, 1);
      break;
    case PaymentInterval.QUARTERLY:
      nextDueDate = addMonths(nextDueDate, 3);
      break;
    case PaymentInterval.SEMI_ANNUALLY:
      nextDueDate = addMonths(nextDueDate, 6);
      break;
    case PaymentInterval.ANNUALLY:
      nextDueDate.setFullYear(nextDueDate.getFullYear() + 1);
      break;
    default:
      // Default to monthly
      nextDueDate = addMonths(nextDueDate, 1);
  }
  
  // Apply date adjustment to handle Sundays
  return adjustDateForSundays(nextDueDate);
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
 * Calculate contract end date
 * @param paymentStartDate - Payment start date (first payment date)
 * @param termMonths - Contract term in months
 * @returns Contract end date
 */
export const calculateContractEndDate = (
  paymentStartDate: Date,
  termMonths: number
): Date => {
  // Add termMonths - 1 because the payment start date is month 1
  // For 12 months starting 25.10.2024, it should end on 25.09.2025 (11 months later)
  const endDate = addMonths(paymentStartDate, termMonths - 1);
  
  // Apply Sunday adjustment to ensure consistency with other date calculations
  return adjustDateForSundays(endDate);
};

/**
 * Validate contract calculation inputs
 * @param downPayment - Down payment amount
 * @param yearlyInterestRate - Yearly interest rate
 * @param termMonths - Term in months
 * @returns Validation result with errors if any
 */
export const validateContractCalculation = (
  downPayment: number,
  yearlyInterestRate: number,
  termMonths: number
) => {
  const errors: string[] = [];
  
  if (downPayment <= 0) {
    errors.push('Down payment must be greater than 0');
  }
  
  if (yearlyInterestRate < 0) {
    errors.push('Yearly interest rate cannot be negative');
  }
  
  if (yearlyInterestRate > 100) {
    errors.push('Yearly interest rate cannot exceed 100%');
  }
  
  if (termMonths <= 0) {
    errors.push('Term months must be greater than 0');
  }
  
  if (termMonths > 600) { // 50 years max
    errors.push('Term months cannot exceed 600 (50 years)');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * Get payment interval display text
 * @param interval - Payment interval
 * @returns Display text for payment interval
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
 * Calculate payment schedule for a contract
 * @param contract - Contract object
 * @param startDate - Start date for payments
 * @returns Array of payment schedule entries
 */
export const calculatePaymentSchedule = (
  contract: any,
  startDate: Date
) => {
  const schedule = [];
  let currentDate = new Date(startDate);
  let remainingBalance = contract.remaining_balance || contract.total_payable;
  
  // Use adjusted monthly payment if available, otherwise use regular monthly payment
  const monthlyPayment = contract.adjusted_monthly_payment || contract.monthly_payment;
  
  console.log('Payment schedule calculation:', {
    contractId: contract.id,
    monthlyPayment,
    adjustedMonthlyPayment: contract.adjusted_monthly_payment,
    remainingBalance,
    termMonths: contract.term_months
  });
  
  for (let i = 1; i <= contract.term_months; i++) {
    const paymentAmount = Math.min(monthlyPayment, remainingBalance);
    remainingBalance -= paymentAmount;
    
    schedule.push({
      paymentNumber: i,
      dueDate: new Date(currentDate),
      amount: Math.round(paymentAmount * 100) / 100,
      remainingBalance: Math.round(remainingBalance * 100) / 100
    });
    
    // Move to next payment date
    currentDate = calculateNextDueDate(currentDate, contract.payment_interval);
  }
  
  return schedule;
};

/**
 * Calculate the correct next due date for display purposes
 * This ensures the next due date is always calculated correctly based on contract start date
 * @param contract - Contract object
 * @param useContractStartDate - Whether to use contract start date instead of payment start date
 * @returns Correctly calculated next due date
 */
export const calculateCorrectNextDueDate = (contract: Contract, useContractStartDate: boolean = false): Date => {
  // If using contract start date, use the new function
  if (useContractStartDate && contract.start_date) {
    const result = calculateNextDueDateFromContractStartDate(
      new Date(contract.start_date),
      contract.payments_count || 0,
      contract.payment_interval || 'monthly'
    );
    
    console.log('🔍 Using contract start date for calculation:', {
      contractId: contract.id,
      contractStartDate: contract.start_date,
      paymentStartDate: contract.payment_start_date,
      paymentsCount: contract.payments_count,
      calculatedDate: result.toISOString(),
      today: new Date().toISOString().split('T')[0],
      isOverdue: result <= new Date()
    });
    
    return result;
  }
  
  // Fallback to original logic using start_date
  if (!contract.start_date) {
    return contract.next_due_date || new Date();
  }
  
  const result = calculateNextDueDateFromStartDate(
    new Date(contract.start_date),
    contract.payments_count || 0,
    contract.payment_interval || 'monthly'
  );
  
  // DEBUG: Log problematic calculations (only for debugging, can be removed in production)
  // const today = new Date();
  // const daysDiff = Math.ceil((result.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  // if (daysDiff === 0 || Math.abs(daysDiff) > 365) {
  //   console.log('DEBUG: calculateCorrectNextDueDate unusual result', {
  //     contractId: contract.id,
  //     paymentStartDate: contract.payment_start_date,
  //     paymentsCount: contract.payments_count,
  //     paymentInterval: contract.payment_interval,
  //     calculatedDate: result.toISOString(),
  //     today: today.toISOString(),
  //     daysDiff
  //   });
  // }
  
  return result;
};

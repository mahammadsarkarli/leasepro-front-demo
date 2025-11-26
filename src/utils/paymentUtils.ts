import { PaymentMethod } from '../types';
import { calculateNextDueDateFromStartDate, adjustPaymentDate } from './paymentIntervalUtils';
import { getDisplayMonthlyPayment } from './paymentCalculationUtils';

/**
 * Calculate overdue penalty based on company's daily interest rate
 * @param monthlyPayment - The monthly payment amount
 * @param overdueDays - Number of days the payment is overdue
 * @param dailyInterestRate - Company's daily interest rate as percentage (e.g., 1 for 1%)
 * @returns Calculated overdue penalty amount
 */
export const calculateOverduePenalty = (
  monthlyPayment: number, 
  overdueDays: number, 
  dailyInterestRate: number
): number => {
  if (overdueDays <= 0 || dailyInterestRate <= 0) return 0;
  
  const dailyRate = dailyInterestRate / 100; // Convert percentage to decimal
  const penalty = monthlyPayment * dailyRate * overdueDays;
  
  // Round to 2 decimal places
  return Math.round(penalty * 100) / 100;
};

/**
 * Calculate total payment amount including overdue penalty
 * @param monthlyPayment - The monthly payment amount
 * @param overdueDays - Number of days the payment is overdue
 * @param dailyInterestRate - Company's daily interest rate as percentage
 * @param treatAsOnTime - Whether to treat the payment as on-time (ignore penalties)
 * @returns Total amount including penalty
 */
export const calculateTotalPaymentAmount = (
  monthlyPayment: number,
  overdueDays: number,
  dailyInterestRate: number,
  treatAsOnTime: boolean = false
): number => {
  if (treatAsOnTime || overdueDays <= 0) {
    return Math.round(monthlyPayment);
  }
  
  const penalty = calculateOverduePenalty(monthlyPayment, overdueDays, dailyInterestRate);
  return Math.round(monthlyPayment + penalty);
};

/**
 * Calculate remaining amount for current payment period after partial payments
 * @param contract - Contract object
 * @param payments - Array of payments for the contract
 * @param currentDueDate - Current due date for the payment period
 * @returns Remaining amount for the current payment period
 */
export const calculateRemainingAmountForPeriod = (
  contract: any,
  payments: any[],
  currentDueDate: Date
): number => {
  // Get the expected amount for this payment period
  // Use adjusted monthly payment if available (after extra payments), otherwise use original
  const monthlyPayment = contract.adjusted_monthly_payment || contract.monthly_payment || 0;
  const expectedAmount = calculateExpectedPaymentAmount(
    monthlyPayment,
    contract.payment_interval || 'monthly'
  );
  
  // Find all partial payments for the current payment period
  // Use local date components for comparison
  const currentPeriodPayments = payments.filter(payment => {
    if (!payment.is_partial) return false;
    
    const paymentDueDate = new Date(payment.due_date);
    const dueDateOnly = new Date(currentDueDate.getFullYear(), currentDueDate.getMonth(), currentDueDate.getDate());
    const paymentDueDateOnly = new Date(paymentDueDate.getFullYear(), paymentDueDate.getMonth(), paymentDueDate.getDate());
    
    // Check if the payment is for the current payment period (same month/year and reasonable date range)
    const isSamePeriod = dueDateOnly.getFullYear() === paymentDueDateOnly.getFullYear() && 
                        dueDateOnly.getMonth() === paymentDueDateOnly.getMonth() &&
                        Math.abs(dueDateOnly.getDate() - paymentDueDateOnly.getDate()) <= 3; // Allow 3-day tolerance
    
    return isSamePeriod;
  });
  
  // Calculate total amount already paid for this period
  const totalPaidForPeriod = currentPeriodPayments.reduce((sum, payment) => sum + payment.amount, 0);
  
  // Return remaining amount (rounded to whole number)
  return Math.round(Math.max(0, expectedAmount - totalPaidForPeriod));
};

/**
 * Calculate overdue partial payment breakdown with interest priority, considering previous payments
 * @param monthlyPayment - The monthly payment amount
 * @param partialAmount - The partial payment amount being made
 * @param overdueDays - Number of days overdue
 * @param dailyInterestRate - Daily interest rate as percentage
 * @param alreadyPaidInterest - Interest already paid in previous partial payments (default: 0)
 * @param existingPartialPayments - Array of existing partial payments for better tracking (optional)
 * @returns Breakdown of how the partial payment is allocated
 */
export const calculateOverduePartialPaymentBreakdown = (
  monthlyPayment: number,
  partialAmount: number,
  overdueDays: number,
  dailyInterestRate: number,
  alreadyPaidInterest: number = 0,
  existingPartialPayments: any[] = []
) => {
  // CRITICAL FIX: Calculate interest on the remaining amount after partial payments
  // First, calculate how much principal was already paid by existing partial payments
  let totalPrincipalFromPartials = 0;
  let totalInterestFromPartials = 0;
  
  if (existingPartialPayments.length > 0) {
    // Calculate interest and principal from existing partial payments using interest-first allocation
    let remainingInterestToAllocate = monthlyPayment * (dailyInterestRate / 100) * overdueDays;
    
    existingPartialPayments.forEach(payment => {
      const interestFromThisPayment = Math.min(payment.amount, remainingInterestToAllocate);
      const principalFromThisPayment = Math.max(0, payment.amount - interestFromThisPayment);
      
      totalInterestFromPartials += interestFromThisPayment;
      totalPrincipalFromPartials += principalFromThisPayment;
      remainingInterestToAllocate = Math.max(0, remainingInterestToAllocate - interestFromThisPayment);
    });
  }
  
  // Calculate remaining principal after existing partial payments
  const remainingPrincipal = Math.max(0, monthlyPayment - totalPrincipalFromPartials);
  
  // CRITICAL FIX: Calculate interest on the REMAINING principal, not the full monthly payment
  const totalOriginalOverdueInterest = calculateOverduePenalty(remainingPrincipal, overdueDays, dailyInterestRate);
  
  // Calculate already paid interest from existing partial payments
  const actualAlreadyPaidInterest = totalInterestFromPartials;
  
  // Calculate remaining overdue interest after previous partial payments
  const remainingOverdueInterest = Math.max(0, totalOriginalOverdueInterest - actualAlreadyPaidInterest);
  
  // Allocate partial payment: remaining interest first, then principal
  const interestPaid = Math.min(partialAmount, remainingOverdueInterest);
  const principalPaid = Math.max(0, partialAmount - interestPaid);
  
  // Calculate remaining amounts after this payment
  const stillRemainingInterest = Math.max(0, remainingOverdueInterest - interestPaid);
  
  // FIXED: Calculate remaining principal correctly
  const totalPrincipalPaid = totalPrincipalFromPartials + principalPaid;
  const finalRemainingPrincipal = Math.max(0, remainingPrincipal - principalPaid);
  const remainingBalance = finalRemainingPrincipal + stillRemainingInterest;
  
  return {
    totalOriginalOverdueInterest: Math.round(totalOriginalOverdueInterest * 100) / 100,
    alreadyPaidInterest: Math.round(actualAlreadyPaidInterest * 100) / 100,
    remainingOverdueInterest: Math.round(remainingOverdueInterest * 100) / 100,
    interestPaid: Math.round(interestPaid * 100) / 100,
    principalPaid: Math.round(principalPaid * 100) / 100,
    remainingInterest: Math.round(stillRemainingInterest * 100) / 100,
    remainingPrincipal: Math.round(finalRemainingPrincipal * 100) / 100,
    remainingBalance: Math.round(remainingBalance * 100) / 100,
    totalPrincipalFromPartials: Math.round(totalPrincipalFromPartials * 100) / 100,
    totalPrincipalPaid: Math.round(totalPrincipalPaid * 100) / 100,
    isFullyPaid: remainingBalance <= 0,
    calculationDebug: {
      monthlyPayment,
      remainingPrincipal,
      totalOriginalOverdueInterest,
      existingPartialsCount: existingPartialPayments.length,
      actualAlreadyPaidInterest,
      totalPrincipalFromPartials,
      totalInterestFromPartials
    }
  };
};

/**
 * Calculate future payment amount after partial payment with daily interest accumulation
 * @param remainingPrincipal - The remaining principal amount after partial payment
 * @param daysSincePartialPayment - Number of days since the partial payment was made
 * @param dailyInterestRate - Daily interest rate as percentage
 * @param partialPaymentDate - Date when the partial payment was made (optional, for better tracking)
 * @param currentDate - Current date for calculation (optional, defaults to today)
 * @returns Total amount due including accumulated interest
 */
export const calculateFuturePaymentAfterPartial = (
  remainingPrincipal: number,
  daysSincePartialPayment: number,
  dailyInterestRate: number,
  partialPaymentDate?: Date,
  currentDate?: Date
) => {
  if (daysSincePartialPayment <= 0 || remainingPrincipal <= 0) {
    return {
      remainingPrincipal: Math.round(remainingPrincipal * 100) / 100,
      accumulatedInterest: 0,
      totalDue: Math.round(remainingPrincipal * 100) / 100,
      daysCalculated: daysSincePartialPayment,
      calculationFrom: partialPaymentDate ? partialPaymentDate.toISOString().split('T')[0] : 'unknown',
      calculationTo: currentDate ? currentDate.toISOString().split('T')[0] : 'today'
    };
  }
  
  // FIXED: Calculate days more accurately if dates are provided
  let actualDays = daysSincePartialPayment;
  if (partialPaymentDate && currentDate) {
    const partialDateOnly = new Date(partialPaymentDate.getFullYear(), partialPaymentDate.getMonth(), partialPaymentDate.getDate());
    const currentDateOnly = new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate());
    actualDays = Math.max(0, Math.floor((currentDateOnly.getTime() - partialDateOnly.getTime()) / (1000 * 60 * 60 * 24)));
  }
  
  // Calculate interest accumulated on the remaining principal
  const dailyRate = dailyInterestRate / 100;
  const accumulatedInterest = remainingPrincipal * dailyRate * actualDays;
  const totalDue = remainingPrincipal + accumulatedInterest;
  
  return {
    remainingPrincipal: Math.round(remainingPrincipal * 100) / 100,
    accumulatedInterest: Math.round(accumulatedInterest * 100) / 100,
    totalDue: Math.round(totalDue * 100) / 100,
    daysCalculated: actualDays,
    calculationFrom: partialPaymentDate ? partialPaymentDate.toISOString().split('T')[0] : 'unknown',
    calculationTo: currentDate ? currentDate.toISOString().split('T')[0] : 'today',
    calculation: `${remainingPrincipal} + (${remainingPrincipal} × ${dailyInterestRate}% × ${actualDays} days) = ${totalDue.toFixed(2)}`
  };
};

/**
 * Calculate payment details with proper handling of existing partial payments
 * This function correctly calculates interest from the last partial payment date, not the original due date
 * @param contract - Contract object
 * @param paymentDate - Current payment date
 * @param company - Company object with interest rate
 * @param treatAsOnTime - Whether to treat as on-time payment
 * @param excludeOverduePenalty - Whether to exclude overdue penalty
 * @param payments - Array of existing payments for the contract
 * @returns Comprehensive payment calculation object with correct interest calculation
 */
export const calculatePaymentDetailsWithPartialPayments = (
  contract: any,
  paymentDate: Date,
  company: any,
  treatAsOnTime: boolean = false,
  excludeOverduePenalty: boolean = false,
  payments: any[] = []
) => {
  try {
    // Validate inputs
    if (!contract || !paymentDate || !company) {
      throw new Error('Missing required parameters for payment calculation');
    }

    // Get company interest rate with fallback
    const dailyInterestRate = company?.interest_rate || 1; // Default to 1% if not found
    
    // Determine the correct due date for this payment
    // Use start_date + (payments_count + 1) to get the next payment's due date
    const dueDate = calculateNextDueDateFromStartDate(
      new Date(contract.start_date),
      contract.payments_count + 1,
      contract.payment_interval || 'monthly'
    );
    
    // Calculate expected payment amount based on payment interval
    const displayMonthlyPayment = getDisplayMonthlyPayment(contract);
    const fullExpectedAmount = calculateExpectedPaymentAmount(
      displayMonthlyPayment || 0,
      contract.payment_interval || 'monthly'
    );
    
    // Find existing partial payments for this payment period
    // Use local date components for comparison
    const currentPeriodPayments = payments.filter(payment => {
      if (!payment.is_partial) return false;
      
      const paymentDueDate = new Date(payment.due_date);
      const dueDateOnly = new Date(dueDate.getFullYear(), dueDate.getMonth(), dueDate.getDate());
      const paymentDueDateOnly = new Date(paymentDueDate.getFullYear(), paymentDueDate.getMonth(), paymentDueDate.getDate());
      
      // Check if the payment is for the current payment period (same month/year)
      const isSamePeriod = dueDateOnly.getFullYear() === paymentDueDateOnly.getFullYear() && 
                          dueDateOnly.getMonth() === paymentDueDateOnly.getMonth();
      
      return isSamePeriod;
    });
    
    const totalPartialPayments = currentPeriodPayments.reduce((sum, payment) => sum + payment.amount, 0);
    
    // Debug: Only log once per calculation
    if (Math.random() < 0.1) { // Only log 10% of the time to avoid spam
      console.log('🔍 Current Period Payments Debug:', {
        contractId: contract.id,
        currentDueDate: dueDate.toISOString().split('T')[0],
        currentPeriodPayments: currentPeriodPayments.length,
        totalPartialPayments
      });
    }
    const remainingAmount = Math.max(0, fullExpectedAmount - totalPartialPayments);
    
    // Calculate overdue days from the original due date
    // Create date-only objects without timezone conversion
    const dueDateOnly = new Date(dueDate.getFullYear(), dueDate.getMonth(), dueDate.getDate());
    const paymentDateOnly = new Date(paymentDate.getFullYear(), paymentDate.getMonth(), paymentDate.getDate());
    const totalOverdueDays = Math.max(0, Math.floor((paymentDateOnly.getTime() - dueDateOnly.getTime()) / (1000 * 60 * 60 * 24)));
    
    // Debug: Show date comparison (reduced logging)
    if (Math.random() < 0.1) { // Only log 10% of the time
      console.log('📅 Date Debug:', {
        paymentDate: paymentDate.toISOString().split('T')[0],
        dueDate: dueDate.toISOString().split('T')[0],
        totalOverdueDays
      });
    }
    
    // FIXED: Enhanced overdue calculation for partial payments
    let actualOverdueDays = totalOverdueDays;
    let overduePenalty = 0;
    let isOverdue = totalOverdueDays > 0 && !treatAsOnTime;
    
    // Define this variable in the proper scope
    const isPartialPaymentForCurrentPeriod = currentPeriodPayments.length > 0;
    
    console.log('🔧 PaymentCreate Overdue Calculation:', {
      totalOverdueDays,
      currentPeriodPayments: currentPeriodPayments.length,
      isPartialPaymentForCurrentPeriod,
      treatAsOnTime,
      isOverdue,
      remainingAmount
    });
    
    // CRITICAL FIX: When partial payments exist, calculate interest from the remaining amount
    // after partial payments, not from the original amount
    if (totalPartialPayments > 0 && isOverdue) {
      // Find the date of the last partial payment to calculate effective overdue days
      const lastPartialPaymentDate = currentPeriodPayments.length > 0 
        ? new Date(Math.max(...currentPeriodPayments.map(p => new Date(p.payment_date).getTime())))
        : dueDateOnly;
      
      // Calculate days since the last partial payment for ongoing interest
      const lastPartialDateOnly = new Date(lastPartialPaymentDate.getFullYear(), lastPartialPaymentDate.getMonth(), lastPartialPaymentDate.getDate());
      const daysSinceLastPartial = Math.max(0, Math.floor((paymentDateOnly.getTime() - lastPartialDateOnly.getTime()) / (1000 * 60 * 60 * 24)));
      
      // CRITICAL FIX: Calculate interest from the remaining amount after partial payments
      // This ensures that if 300₼ was paid from 664₼, interest is calculated from 364₼
      if (isPartialPaymentForCurrentPeriod) {
        // Use days since last partial payment for interest calculation
        actualOverdueDays = Math.min(daysSinceLastPartial, totalOverdueDays);
        
        console.log('🔧 CRITICAL FIX: Calculating interest from remaining amount after partial payment:', {
          originalAmount: fullExpectedAmount,
          partialPayments: totalPartialPayments,
          remainingAmount,
          daysSinceLastPartial,
          actualOverdueDays
        });
      } else {
        // For different payment periods, use normal overdue calculation
        actualOverdueDays = totalOverdueDays;
      }
    } else if (isOverdue) {
      // No partial payments, use standard calculation
      actualOverdueDays = totalOverdueDays;
      
      console.log('🔧 No partial payments for current period - using normal overdue calculation:', {
        totalOverdueDays,
        actualOverdueDays: totalOverdueDays
      });
    }
    
    // CRITICAL FIX: Always calculate interest from the remaining amount after partial payments
    // This ensures that if 300₼ was paid from 664₼, interest is calculated from 364₼
    if (isOverdue) {
      console.log('🔧 CRITICAL FIX: Calculating interest from remaining amount after partial payment:', {
        originalAmount: fullExpectedAmount,
        partialPayments: totalPartialPayments,
        remainingAmount,
        actualOverdueDays,
        dailyInterestRate
      });
      
      // Calculate interest directly from the remaining amount
      overduePenalty = calculateOverduePenalty(
        remainingAmount, // Use remaining amount (364₼) instead of original amount (664₼)
        actualOverdueDays,
        dailyInterestRate
      );
      
      console.log('✅ FIXED: Interest calculated from remaining amount:', {
        remainingAmount,
        actualOverdueDays,
        dailyInterestRate,
        overduePenalty
      });
    } else {
      // No overdue, no penalty
      overduePenalty = 0;
    }
    
    // Calculate total amount
    const totalAmount = treatAsOnTime || excludeOverduePenalty 
      ? remainingAmount 
      : remainingAmount + overduePenalty;
    
    // Calculate breakdown for display
    let partialPaymentBreakdown = null;
    let sophisticatedBreakdown = null;
    
    if (isOverdue) {
      sophisticatedBreakdown = calculateSophisticatedPartialPayment(
        fullExpectedAmount,
        remainingAmount,
        totalOverdueDays,
        dailyInterestRate
      );
      
      partialPaymentBreakdown = calculateOverduePartialPaymentBreakdown(
        fullExpectedAmount,
        remainingAmount,
        totalOverdueDays,
        dailyInterestRate
      );
    }
    
    console.log('🔧 PaymentCreate Final Result:', {
      actualOverdueDays,
      totalOverdueDays,
      overduePenalty: Math.round(overduePenalty),
      totalAmount: Math.round(totalAmount),
      isOverdue,
      calculation: `${remainingAmount} × ${dailyInterestRate}% × ${actualOverdueDays} days = ${Math.round(overduePenalty)}`,
      hasPartialPayments: totalPartialPayments > 0
    });
    
    return {
      baseAmount: Math.round(remainingAmount),
      overdueDays: actualOverdueDays, // Use the corrected overdue days that account for partial payments
      overduePenalty: Math.round(overduePenalty),
      totalAmount: Math.round(totalAmount),
      isOverdue,
      dailyInterestRate,
      dueDate,
      paymentDate,
      partialPaymentBreakdown,
      sophisticatedBreakdown,
      calculationBreakdown: {
        expectedAmount: remainingAmount,
        fullExpectedAmount,
        totalPartialPayments,
        actualOverdueDays,
        originalOverdueDays: totalOverdueDays, // Keep track of original for debugging
        dailyInterestRate,
        treatAsOnTime,
        excludeOverduePenalty
      }
    };
  } catch (error) {
    console.error('Error in enhanced payment calculation:', error);
    throw error;
  }
};

/**
 * Enhanced partial payment calculation with sophisticated interest handling
 * @param monthlyPayment - The full monthly payment amount
 * @param partialAmount - The partial payment amount being made
 * @param overdueDays - Number of days overdue
 * @param dailyInterestRate - Daily interest rate as percentage
 * @param daysSincePartialPayment - Number of days since partial payment (for future calculations)
 * @returns Comprehensive breakdown of partial payment and future calculations
 */
export const calculateSophisticatedPartialPayment = (
  monthlyPayment: number,
  partialAmount: number,
  overdueDays: number,
  dailyInterestRate: number,
  daysSincePartialPayment: number = 0
) => {
  // Step 1: Calculate total overdue interest on full monthly payment
  const totalOverdueInterest = calculateOverduePenalty(monthlyPayment, overdueDays, dailyInterestRate);
  
  // Step 2: Allocate partial payment - interest first, then principal
  const interestPaid = Math.min(partialAmount, totalOverdueInterest);
  const principalPaid = Math.max(0, partialAmount - interestPaid);
  
  // Step 3: Calculate remaining amounts after partial payment
  const remainingInterest = Math.max(0, totalOverdueInterest - interestPaid);
  const remainingPrincipal = Math.max(0, monthlyPayment - principalPaid);
  const remainingBalance = remainingPrincipal + remainingInterest;
  
  // Step 4: Calculate future payment if days have passed since partial payment
  let futurePayment = null;
  if (daysSincePartialPayment > 0 && remainingPrincipal > 0) {
    futurePayment = calculateFuturePaymentAfterPartial(
      remainingPrincipal,
      daysSincePartialPayment,
      dailyInterestRate
    );
  }
  
  return {
    // Original breakdown
    totalOverdueInterest: Math.round(totalOverdueInterest),
    interestPaid: Math.round(interestPaid),
    principalPaid: Math.round(principalPaid),
    remainingInterest: Math.round(remainingInterest),
    remainingPrincipal: Math.round(remainingPrincipal),
    remainingBalance: Math.round(remainingBalance),
    isFullyPaid: remainingBalance <= 0,
    
    // Future calculation (if applicable)
    futurePayment,
    
    // Summary for display
    summary: {
      originalMonthlyPayment: Math.round(monthlyPayment),
      partialPaymentMade: Math.round(partialAmount),
      interestPaidFirst: Math.round(interestPaid),
      principalPaidSecond: Math.round(principalPaid),
      remainingForFuture: Math.round(remainingPrincipal),
      daysOverdue: overdueDays,
      dailyInterestRate: dailyInterestRate
    }
  };
};

/**
 * Enhanced payment calculation with comprehensive error handling
 * @param contract - Contract object with payment details
 * @param paymentDate - Date when payment is being made
 * @param company - Company object with interest rate
 * @param treatAsOnTime - Whether to treat as on-time payment
 * @param excludeOverduePenalty - Whether to exclude overdue penalty
 * @param payments - Array of existing payments for the contract (optional)
 * @returns Comprehensive payment calculation object
 */
export const calculatePaymentDetails = (
  contract: any,
  paymentDate: Date,
  company: any,
  treatAsOnTime: boolean = false,
  excludeOverduePenalty: boolean = false,
  payments: any[] = []
) => {
  try {
    // Validate inputs
    if (!contract || !paymentDate || !company) {
      throw new Error('Missing required parameters for payment calculation');
    }

    // Get company interest rate with fallback
    const dailyInterestRate = company?.interest_rate || 1; // Default to 1% if not found
    
    // Determine the correct due date for this payment
    // Use start_date + (payments_count + 1) to get the next payment's due date
    const dueDate = calculateNextDueDateFromStartDate(
      new Date(contract.start_date),
      contract.payments_count + 1,
      contract.payment_interval || 'monthly'
    );
    
    // Calculate expected payment amount based on payment interval
    // Use the display monthly payment (which includes adjusted amount if available)
    const displayMonthlyPayment = getDisplayMonthlyPayment(contract);
    const fullExpectedAmount = calculateExpectedPaymentAmount(
      displayMonthlyPayment || 0,
      contract.payment_interval || 'monthly'
    );
    
    
    // Calculate remaining amount for this payment period after partial payments
    const expectedAmount = calculateRemainingAmountForPeriod(
      contract,
      payments,
      dueDate
    );
    
    // Calculate overdue days - use local date components
    const dueDateOnly = new Date(dueDate.getFullYear(), dueDate.getMonth(), dueDate.getDate());
    const paymentDateOnly = new Date(paymentDate.getFullYear(), paymentDate.getMonth(), paymentDate.getDate());
    const overdueDays = Math.max(0, Math.floor((paymentDateOnly.getTime() - dueDateOnly.getTime()) / (1000 * 60 * 60 * 24)));
    
    // Determine if payment is overdue
    const isOverdue = overdueDays > 0 && !treatAsOnTime;
    
    // Calculate overdue penalty
    const overduePenalty = calculateOverduePenalty(
      expectedAmount,
      overdueDays,
      dailyInterestRate
    );
    
    // Calculate total amount
    const totalAmount = calculateTotalPaymentAmount(
      expectedAmount,
      overdueDays,
      dailyInterestRate,
      treatAsOnTime || excludeOverduePenalty
    );
    
    // For partial payments, calculate the breakdown
    let partialPaymentBreakdown = null;
    let sophisticatedBreakdown = null;
    
    // Always calculate breakdown for overdue payments (whether partial or full)
    if (isOverdue) {
      // Use the sophisticated partial payment calculation for overdue payments
      sophisticatedBreakdown = calculateSophisticatedPartialPayment(
        fullExpectedAmount,
        expectedAmount,
        overdueDays,
        dailyInterestRate
      );
      
      // Keep the original breakdown for backward compatibility
      partialPaymentBreakdown = calculateOverduePartialPaymentBreakdown(
        fullExpectedAmount,
        expectedAmount,
        overdueDays,
        dailyInterestRate
      );
    }
    
    return {
      baseAmount: Math.round(expectedAmount),
      overdueDays,
      overduePenalty: Math.round(overduePenalty),
      totalAmount: Math.round(totalAmount),
      isOverdue,
      dailyInterestRate,
      dueDate,
      paymentDate,
      partialPaymentBreakdown,
      sophisticatedBreakdown,
      calculationBreakdown: {
        expectedAmount,
        dailyRate: dailyInterestRate / 100,
        penaltyCalculation: `${expectedAmount} × ${dailyInterestRate}% × ${overdueDays} days`,
        totalCalculation: `${expectedAmount} + ${overduePenalty}`
      }
    };
  } catch (error) {
    console.error('Error in payment calculation:', error);
    return {
      baseAmount: 0,
      overdueDays: 0,
      overduePenalty: 0,
      totalAmount: 0,
      isOverdue: false,
      dailyInterestRate: 0,
      dueDate: new Date(),
      paymentDate: new Date(),
      calculationBreakdown: {
        expectedAmount: 0,
        dailyRate: 0,
        penaltyCalculation: '',
        totalCalculation: ''
      }
    };
  }
};

/**
 * Calculate expected payment amount based on payment interval
 * @param monthlyPayment - Base monthly payment amount
 * @param paymentInterval - Payment interval (weekly, monthly, etc.)
 * @returns Expected payment amount for the interval
 */
export const calculateExpectedPaymentAmount = (
  monthlyPayment: number,
  paymentInterval: string
): number => {
  switch (paymentInterval) {
    case 'weekly':
      return Math.round((monthlyPayment / 4) * 100) / 100;
    case 'bi_weekly':
      return Math.round((monthlyPayment / 2) * 100) / 100;
    case 'monthly':
      return Math.round(monthlyPayment * 100) / 100;
    case 'quarterly':
      return Math.round((monthlyPayment * 3) * 100) / 100;
    case 'semi_annually':
      return Math.round((monthlyPayment * 6) * 100) / 100;
    case 'annually':
      return Math.round((monthlyPayment * 12) * 100) / 100;
    default:
      return Math.round(monthlyPayment * 100) / 100;
  }
};

/**
 * Get formatted interest rate display text
 * @param dailyInterestRate - Company's daily interest rate as percentage
 * @param isDefault - Whether this is a default rate
 * @returns Formatted interest rate string
 */
export const getInterestRateDisplay = (dailyInterestRate: number, isDefault: boolean = false): string => {
  if (isDefault) {
    return `${dailyInterestRate}% (default)`;
  }
  return `${dailyInterestRate}%`;
};

/**
 * Calculate penalty breakdown for detailed display
 * @param monthlyPayment - The monthly payment amount
 * @param overdueDays - Number of days the payment is overdue
 * @param dailyInterestRate - Company's daily interest rate as percentage
 * @returns Object with penalty breakdown details
 */
export const getPenaltyBreakdown = (
  monthlyPayment: number,
  overdueDays: number,
  dailyInterestRate: number
) => {
  const dailyRate = dailyInterestRate / 100;
  const dailyPenalty = monthlyPayment * dailyRate;
  const totalPenalty = calculateOverduePenalty(monthlyPayment, overdueDays, dailyInterestRate);
  
  return {
    dailyRate,
    dailyPenalty: Math.round(dailyPenalty * 100) / 100,
    totalPenalty,
    calculation: `${monthlyPayment} × ${dailyInterestRate}% × ${overdueDays} days`
  };
};

/**
 * Validate payment calculation inputs
 * @param contract - Contract object
 * @param paymentDate - Payment date
 * @param company - Company object
 * @returns Validation result with errors if any
 */
export const validatePaymentCalculation = (
  contract: any,
  paymentDate: Date,
  company: any
) => {
  const errors: string[] = [];
  
  if (!contract) {
    errors.push('Contract is required');
  }
  
  if (!paymentDate || isNaN(paymentDate.getTime())) {
    errors.push('Valid payment date is required');
  }
  
  if (!company) {
    errors.push('Company information is required');
  }
  
  if (contract && (!contract.monthly_payment || contract.monthly_payment <= 0)) {
    errors.push('Contract must have a valid monthly payment amount');
  }
  
  if (contract && !contract.next_due_date) {
    errors.push('Contract must have a next due date');
  }
  
  if (company && (company.interest_rate < 0 || company.interest_rate > 100)) {
    errors.push('Company interest rate must be between 0 and 100');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * Get translated payment method label
 * @param method - Payment method enum value
 * @param t - Translation function
 * @returns Translated payment method label
 */
export const getPaymentMethodLabel = (method: PaymentMethod, t: (key: string) => string): string => {
  switch (method) {
    case PaymentMethod.CASH:
      return t('common.cash');
    case PaymentMethod.BANK_TRANSFER:
      return t('common.bankTransfer');
    case PaymentMethod.CARD_TO_CARD:
      return t('common.cardToCard');
    case PaymentMethod.AUTOMATIC:
      return t('common.automatic');
    case PaymentMethod.MANUAL:
      return t('common.manual');
    default:
      return method;
  }
};

/**
 * Get payment method icon component name
 * @param method - Payment method enum value
 * @returns Icon component name
 */
export const getPaymentMethodIcon = (method: PaymentMethod): string => {
  switch (method) {
    case PaymentMethod.CASH:
      return 'DollarSign';
    case PaymentMethod.BANK_TRANSFER:
    case PaymentMethod.CARD_TO_CARD:
      return 'CreditCard';
    case PaymentMethod.AUTOMATIC:
      return 'Zap';
    case PaymentMethod.MANUAL:
      return 'Hand';
    default:
      return 'CreditCard';
  }
};

/**
 * Get payment method color classes
 * @param method - Payment method enum value
 * @returns Tailwind CSS color classes
 */
export const getPaymentMethodColor = (method: PaymentMethod): string => {
  switch (method) {
    case PaymentMethod.CASH:
      return 'bg-green-100 text-green-800';
    case PaymentMethod.BANK_TRANSFER:
      return 'bg-blue-100 text-blue-800';
    case PaymentMethod.CARD_TO_CARD:
      return 'bg-purple-100 text-purple-800';
    case PaymentMethod.AUTOMATIC:
      return 'bg-yellow-100 text-yellow-800';
    case PaymentMethod.MANUAL:
      return 'bg-gray-100 text-gray-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

/**
 * Add one month to a given date
 * @param date - The input date (can be string or Date object)
 * @returns Date string in YYYY-MM-DD format with one month added
 */
export const addOneMonthToDate = (date: string | Date): string => {
  const inputDate = typeof date === 'string' ? new Date(date) : date;
  
  // Create a new date to avoid mutating the original
  const newDate = new Date(inputDate);
  const originalDay = newDate.getDate();
  
  // Add one month
  newDate.setMonth(newDate.getMonth() + 1);
  
  // Handle edge case where the day doesn't exist in the new month
  // (e.g., Jan 31 -> Feb 31 becomes Mar 3, we want Feb 28/29)
  if (newDate.getDate() !== originalDay) {
    // Go back to the last day of the previous month
    newDate.setDate(0);
  }
  
  // Return in YYYY-MM-DD format
  return newDate.toISOString().split('T')[0];
};

/**
 * Calculate multi-month overdue amount for payments overdue by more than one month
 * This handles the case where a payment is overdue for multiple months and needs to include:
 * 1. Original month amount + interest for that month
 * 2. Additional month amounts + interest for those months
 * @param contract - Contract object
 * @param currentDate - Current date for calculation
 * @param company - Company object with interest rate
 * @param payments - Array of existing payments for the contract
 * @returns Multi-month overdue calculation breakdown
 */
export const calculateMultiMonthOverdueAmount = (
  contract: any,
  currentDate: Date,
  company: any,
  payments: any[] = []
) => {
  console.log('🔧 MULTI-MONTH FUNCTION START:', {
    contractId: contract.id,
    paymentsCount: payments.length,
    currentDate: currentDate.toISOString().split('T')[0],
    payments: payments.map(p => ({
      id: p.id,
      amount: p.amount,
      payment_date: p.payment_date,
      is_partial: p.is_partial,
      due_date: p.due_date,
      payment_period: p.payment_period
    }))
  });
  
  // Special debug for the specific contract mentioned
  if (contract.id === 'b15ee69d-70cf-4ed0-b705-44b71f251c5a') {
    console.log('🔧 SPECIAL DEBUG for contract b15ee69d-70cf-4ed0-b705-44b71f251c5a:', {
      contractId: contract.id,
      startDate: contract.start_date,
      paymentStartDate: contract.payment_start_date,
      paymentsCount: contract.payments_count,
      lastPaymentDate: contract.last_payment_date,
      currentDate: currentDate.toISOString().split('T')[0],
      partialPayments: payments.filter(p => p.is_partial),
      allPayments: payments.length
    });
  }
  try {
    const dailyInterestRate = company?.interest_rate || 1; // Default to 1% if not found
    const displayMonthlyPayment = getDisplayMonthlyPayment(contract);
    
    // Calculate the original due date for the current payment period
    // Use start_date instead of payment_start_date
    const startDate = new Date(contract.start_date);
    const paymentsCount = contract.payments_count || 0;
    
    // Get the due date for the current payment period
    const getConsistentPaymentDate = (baseDate: Date, monthOffset: number): Date => {
      const targetDate = new Date(baseDate);
      targetDate.setMonth(targetDate.getMonth() + monthOffset);
      const originalDay = baseDate.getDate();
      const targetDay = targetDate.getDate();

      // If the day changed due to month length differences, adjust to maintain consistency
      if (targetDay !== originalDay) {
        const lastDayOfMonth = new Date(
          targetDate.getFullYear(),
          targetDate.getMonth() + 1,
          0
        ).getDate();
        const adjustedDay = Math.min(originalDay, lastDayOfMonth);
        targetDate.setDate(adjustedDay);
      }

      // Apply Sunday-to-Monday adjustment and other date adjustments
      return adjustPaymentDate(targetDate);
    };

    const originalDueDate = getConsistentPaymentDate(startDate, paymentsCount + 1);
    
    // Calculate total days overdue - use local date components
    const currentDateOnly = new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate());
    const originalDueDateOnly = new Date(originalDueDate.getFullYear(), originalDueDate.getMonth(), originalDueDate.getDate());
    const totalDaysOverdue = Math.max(0, Math.floor((currentDateOnly.getTime() - originalDueDateOnly.getTime()) / (1000 * 60 * 60 * 24)));
    
    // Check if this is a multi-month overdue (more than 30 days)
    console.log('🔧 Multi-month check:', {
      totalDaysOverdue,
      isMultiMonth: totalDaysOverdue > 30,
      originalDueDate: originalDueDateOnly.toISOString().split('T')[0],
      currentDate: currentDateOnly.toISOString().split('T')[0]
    });
    
    if (totalDaysOverdue <= 30) {
      // Use standard single-month calculation
      console.log('🔧 Using single-month calculation (≤30 days)');
      return null;
    }
    
    // Find existing partial payments for this payment period
    const currentPeriodPayments = payments.filter(payment => {
      if (!payment.is_partial) return false;
      
      const paymentDueDate = new Date(payment.due_date);
      const dueDateOnly = new Date(originalDueDate.getFullYear(), originalDueDate.getMonth(), originalDueDate.getDate());
      const paymentDueDateOnly = new Date(paymentDueDate.getFullYear(), paymentDueDate.getMonth(), paymentDueDate.getDate());
      
      // Check if the payment is for the current payment period (same month/year)
      const isSamePeriod = dueDateOnly.getFullYear() === paymentDueDateOnly.getFullYear() && 
                          dueDateOnly.getMonth() === paymentDueDateOnly.getMonth();
      
      return isSamePeriod;
    });
    
    const totalPartialPayments = currentPeriodPayments.reduce((sum, payment) => sum + payment.amount, 0);
    const remainingAmount = Math.max(0, displayMonthlyPayment - totalPartialPayments);
    
    // Calculate the breakdown for multi-month overdue
    // Show ALL months from due date until today, with interest calculated from last partial payment date
    const monthlyBreakdown = [];
    let totalAmount = 0;
    let totalInterest = 0;
    
    // Find the last partial payment date for this payment period
    let lastPartialPaymentDate = null;
    if (currentPeriodPayments.length > 0) {
      // Sort payments by payment_date and get the most recent one
      const sortedPayments = [...currentPeriodPayments].sort((a, b) => 
        new Date(b.payment_date).getTime() - new Date(a.payment_date).getTime()
      );
      lastPartialPaymentDate = new Date(sortedPayments[0].payment_date);
      console.log('🔧 Found partial payment date:', {
        lastPartialPaymentDate: lastPartialPaymentDate.toISOString().split('T')[0],
        currentPeriodPayments: currentPeriodPayments.length
      });
    } else {
      console.log('🔧 No partial payments found for current period');
    }
    
    // Calculate how many months we need to show
    // We need to show all months from the original due date until the current month
    // (originalDueDateOnly and currentDateOnly are already declared above)
    
    // Calculate the number of months between original due date and current date
    const monthsDifference = (currentDateOnly.getFullYear() - originalDueDateOnly.getFullYear()) * 12 + 
                           (currentDateOnly.getMonth() - originalDueDateOnly.getMonth());
    
    // First month (original due date month) - calculate interest from last partial payment date or original due date
    const firstMonthAmount = remainingAmount;
    
    // Determine the start date for interest calculation for the first month
    let firstMonthInterestStartDate = originalDueDateOnly;
    if (lastPartialPaymentDate && lastPartialPaymentDate > originalDueDateOnly) {
      firstMonthInterestStartDate = new Date(lastPartialPaymentDate.getFullYear(), lastPartialPaymentDate.getMonth(), lastPartialPaymentDate.getDate());
    }
    
    // Calculate days from the interest start date until today for the first month
    const firstMonthDays = Math.max(0, Math.floor((currentDateOnly.getTime() - firstMonthInterestStartDate.getTime()) / (1000 * 60 * 60 * 24)));
    const firstMonthInterest = calculateOverduePenalty(firstMonthAmount, firstMonthDays, dailyInterestRate);
    
    // Get month name in current locale
    const getMonthName = (date: Date): string => {
      const monthNames = {
        'january': 'Yanvar',
        'february': 'Fevral',
        'march': 'Mart',
        'april': 'Aprel',
        'may': 'May',
        'june': 'İyun',
        'july': 'İyul',
        'august': 'Avqust',
        'september': 'Sentyabr',
        'october': 'Oktyabr',
        'november': 'Noyabr',
        'december': 'Dekabr'
      };
      
      const monthKey = date.toLocaleDateString('en-US', { month: 'long' }).toLowerCase();
      const year = date.getFullYear();
      return `${monthNames[monthKey as keyof typeof monthNames]} ${year}`;
    };

    monthlyBreakdown.push({
      month: 1,
      monthName: getMonthName(originalDueDate),
      amount: firstMonthAmount,
      days: firstMonthDays,
      interest: firstMonthInterest,
      total: firstMonthAmount + firstMonthInterest
    });
    
    totalAmount += firstMonthAmount;
    totalInterest += firstMonthInterest;
    
    // Add all subsequent months that have passed
    // Each month should show the days that were overdue for that specific month
    for (let monthOffset = 1; monthOffset <= monthsDifference; monthOffset++) {
      const monthAmount = displayMonthlyPayment;
      
      // Calculate the due date for this specific month
      const monthDueDate = new Date(originalDueDate);
      monthDueDate.setMonth(monthDueDate.getMonth() + monthOffset);
      
      // Calculate days overdue for this specific month
      // If the month's due date is in the future, it's not overdue yet
      const monthDueDateOnly = new Date(monthDueDate.getFullYear(), monthDueDate.getMonth(), monthDueDate.getDate());
      
      // Only show this month if its due date has passed
      if (monthDueDateOnly <= currentDateOnly) {
        // Determine the start date for interest calculation for this month
        let monthInterestStartDate = monthDueDateOnly;
        
        // FIXED: Find partial payments specifically for THIS month, not just current period
        // Look for partial payments that were made for this specific month's due date
        const partialPaymentsForThisMonth = payments.filter(payment => {
          if (!payment.is_partial) return false;
          
          const paymentDueDate = new Date(payment.due_date);
          const paymentDueDateOnly = new Date(paymentDueDate.getFullYear(), paymentDueDate.getMonth(), paymentDueDate.getDate());
          
          // Check if the payment is for this specific month
          const isForThisMonth = paymentDueDateOnly.getFullYear() === monthDueDateOnly.getFullYear() && 
                                paymentDueDateOnly.getMonth() === monthDueDateOnly.getMonth();
          
          return isForThisMonth;
        });
        
        // Find the most recent partial payment for this specific month
        let lastPartialPaymentForThisMonth = null;
        if (partialPaymentsForThisMonth.length > 0) {
          const sortedPayments = [...partialPaymentsForThisMonth].sort((a, b) => 
            new Date(b.payment_date).getTime() - new Date(a.payment_date).getTime()
          );
          lastPartialPaymentForThisMonth = new Date(sortedPayments[0].payment_date);
        }
        
        console.log('🔧 Multi-Month Debug:', {
          monthName: monthDueDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
          monthDueDate: monthDueDateOnly.toISOString().split('T')[0],
          partialPaymentsForThisMonth: partialPaymentsForThisMonth.length,
          lastPartialPaymentForThisMonth: lastPartialPaymentForThisMonth ? lastPartialPaymentForThisMonth.toISOString().split('T')[0] : 'null',
          originalMonthInterestStartDate: monthDueDateOnly.toISOString().split('T')[0]
        });
        
        if (lastPartialPaymentForThisMonth) {
          // Only apply partial payment date if it was made for this specific month
          monthInterestStartDate = new Date(lastPartialPaymentForThisMonth.getFullYear(), lastPartialPaymentForThisMonth.getMonth(), lastPartialPaymentForThisMonth.getDate());
          console.log('🔧 Applied partial payment date for this month:', monthInterestStartDate.toISOString().split('T')[0]);
        } else {
          console.log('🔧 Using original due date for this month:', monthInterestStartDate.toISOString().split('T')[0]);
        }
        
        // Calculate days from the interest start date until today for this month
        const monthDays = Math.max(0, Math.floor((currentDateOnly.getTime() - monthInterestStartDate.getTime()) / (1000 * 60 * 60 * 24)));
        
        const monthInterest = calculateOverduePenalty(monthAmount, monthDays, dailyInterestRate);
        
        console.log('🔧 Final Month Calculation:', {
          monthName: monthDueDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
          monthDays,
          monthInterest,
          monthAmount
        });
        
        monthlyBreakdown.push({
          month: monthOffset + 1,
          monthName: getMonthName(monthDueDate),
          amount: monthAmount,
          days: monthDays,
          interest: monthInterest,
          total: monthAmount + monthInterest
        });
        
        totalAmount += monthAmount;
        totalInterest += monthInterest;
      }
    }
    
    return {
      isMultiMonthOverdue: true,
      totalDaysOverdue,
      monthsOverdue: monthsDifference + 1, // +1 because we include the original month
      totalAmount: Math.round(totalAmount),
      totalInterest: Math.round(totalInterest),
      totalDue: Math.round(totalAmount + totalInterest),
      monthlyBreakdown,
      calculation: {
        originalDueDate: originalDueDateOnly.toISOString().split('T')[0],
        currentDate: currentDateOnly.toISOString().split('T')[0],
        lastPartialPaymentDate: lastPartialPaymentDate ? lastPartialPaymentDate.toISOString().split('T')[0] : null,
        dailyInterestRate,
        displayMonthlyPayment,
        totalPartialPayments,
        remainingAmount
      }
    };
    
  } catch (error) {
    console.error('Error in multi-month overdue calculation:', error);
    return null;
  }
};

/**
 * Calculate what a customer owes after making a partial payment
 * @param contract - Contract object
 * @param partialPaymentDate - Date when the partial payment was made
 * @param partialPaymentAmount - Amount of the partial payment
 * @param currentDate - Current date for calculation
 * @param company - Company object with interest rate
 * @returns Detailed calculation of what the customer owes now
 */
export const calculateCustomerOwedAfterPartialPayment = (
  contract: any,
  partialPaymentDate: Date,
  partialPaymentAmount: number,
  currentDate: Date,
  company: any
) => {
  try {
    const dailyInterestRate = company?.interest_rate || 1;
    const monthlyPayment = contract.monthly_payment || 0;
    
    // Calculate days overdue at the time of partial payment
    const dueDate = calculateNextDueDateFromStartDate(
      new Date(contract.start_date),
      contract.payments_count,
      contract.payment_interval || 'monthly'
    );
    
    const dueDateOnly = new Date(dueDate.getFullYear(), dueDate.getMonth(), dueDate.getDate());
    const partialPaymentDateOnly = new Date(partialPaymentDate.getFullYear(), partialPaymentDate.getMonth(), partialPaymentDate.getDate());
    const overdueDaysAtPartialPayment = Math.max(0, Math.floor((partialPaymentDateOnly.getTime() - dueDateOnly.getTime()) / (1000 * 60 * 60 * 24)));
    
    // Calculate the sophisticated breakdown for the partial payment
    const partialPaymentBreakdown = calculateSophisticatedPartialPayment(
      monthlyPayment,
      partialPaymentAmount,
      overdueDaysAtPartialPayment,
      dailyInterestRate
    );
    
    // Calculate days since partial payment
    const currentDateOnly = new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate());
    const daysSincePartialPayment = Math.max(0, Math.floor((currentDateOnly.getTime() - partialPaymentDateOnly.getTime()) / (1000 * 60 * 60 * 24)));
    
    // Calculate future payment with accumulated interest
    const futurePayment = calculateFuturePaymentAfterPartial(
      partialPaymentBreakdown.remainingPrincipal,
      daysSincePartialPayment,
      dailyInterestRate
    );
    
    return {
      // Original partial payment details
      originalMonthlyPayment: Math.round(monthlyPayment),
      partialPaymentMade: Math.round(partialPaymentAmount),
      partialPaymentDate: partialPaymentDate,
      
      // Breakdown of partial payment
      partialPaymentBreakdown,
      
      // Current calculation
      daysSincePartialPayment,
      currentDate: currentDate,
      futurePayment,
      
      // Summary
      summary: {
        totalOwedNow: futurePayment.totalDue,
        remainingPrincipal: futurePayment.remainingPrincipal,
        accumulatedInterest: futurePayment.accumulatedInterest,
        calculation: futurePayment.calculation
      }
    };
  } catch (error) {
    console.error('Error calculating customer owed amount:', error);
    return {
      originalMonthlyPayment: 0,
      partialPaymentMade: 0,
      partialPaymentDate: new Date(),
      partialPaymentBreakdown: null,
      daysSincePartialPayment: 0,
      currentDate: new Date(),
      futurePayment: null,
      summary: {
        totalOwedNow: 0,
        remainingPrincipal: 0,
        accumulatedInterest: 0,
        calculation: 'Error in calculation'
      }
    };
  }
};


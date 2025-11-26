/**
 * Data validation utilities for dashboard and reports
 * These functions help ensure data integrity and proper calculations
 */

/**
 * Validate payment data for calculations
 */
export function isValidPayment(payment: any): boolean {
  return (
    payment &&
    typeof payment.amount === 'number' &&
    payment.amount > 0 &&
    payment.payment_date &&
    payment.contract_id
  );
}

/**
 * Validate contract data for calculations
 */
export function isValidContract(contract: any): boolean {
  return (
    contract &&
    typeof contract.remaining_balance === 'number' &&
    typeof contract.total_payable === 'number' &&
    contract.status
  );
}

/**
 * Safely parse payment date from various formats
 */
export function parsePaymentDate(paymentDate: any): Date | null {
  if (!paymentDate) return null;
  
  if (paymentDate instanceof Date) {
    return isNaN(paymentDate.getTime()) ? null : paymentDate;
  }
  
  if (typeof paymentDate === 'string') {
    const date = new Date(paymentDate);
    return isNaN(date.getTime()) ? null : date;
  }
  
  return null;
}

/**
 * Safely parse contract date from various formats
 */
export function parseContractDate(contractDate: any): Date | null {
  if (!contractDate) return null;
  
  if (contractDate instanceof Date) {
    return isNaN(contractDate.getTime()) ? null : contractDate;
  }
  
  if (typeof contractDate === 'string') {
    const date = new Date(contractDate);
    return isNaN(date.getTime()) ? null : date;
  }
  
  return null;
}

/**
 * Filter valid payments for calculations
 */
export function filterValidPayments(payments: any[]): any[] {
  return payments.filter(payment => {
    if (!isValidPayment(payment)) return false;
    
    const paymentDate = parsePaymentDate(payment.payment_date);
    return paymentDate !== null;
  });
}

/**
 * Filter valid contracts for calculations
 */
export function filterValidContracts(contracts: any[]): any[] {
  return contracts.filter(contract => {
    if (!isValidContract(contract)) return false;
    
    const startDate = parseContractDate(contract.start_date);
    return startDate !== null;
  });
}

/**
 * Calculate safe sum with fallback for null/undefined values
 */
export function safeSum(values: (number | null | undefined)[]): number {
  return values.reduce((sum, value) => {
    if (typeof value === 'number' && !isNaN(value)) {
      return sum + value;
    }
    return sum;
  }, 0);
}

/**
 * Calculate safe average with fallback for null/undefined values
 */
export function safeAverage(values: (number | null | undefined)[]): number {
  const validValues = values.filter(value => typeof value === 'number' && !isNaN(value));
  return validValues.length > 0 ? validValues.reduce((sum, value) => sum + value, 0) / validValues.length : 0;
}

/**
 * Debug logging for data validation issues
 */
export function logDataValidationIssues(
  component: string,
  totalItems: number,
  validItems: number,
  issues: string[] = []
): void {
  if (validItems < totalItems || issues.length > 0) {
    console.warn(`⚠️ ${component} data validation issues:`, {
      totalItems,
      validItems,
      invalidItems: totalItems - validItems,
      issues
    });
  }
}

/**
 * Test suite for partial payments and overdue date calculations
 * This file contains comprehensive tests to verify the fixed behavior
 */

import {
  calculateOverduePartialPaymentBreakdown,
  calculateFuturePaymentAfterPartial,
  calculateRemainingAmountForPeriod,
  calculatePaymentDetailsWithPartialPayments
} from './paymentUtils';

// Mock data for testing
const mockContract = {
  id: 'test-contract-1',
  monthly_payment: 1000,
  adjusted_monthly_payment: null,
  payment_interval: 'monthly',
  payment_start_date: '2024-01-01',
  payments_count: 2,
  yearly_interest_rate: 12,
  down_payment: 50000,
  total_payable: 60000
};

const mockCompany = {
  id: 'test-company-1',
  interest_rate: 1.0 // 1% daily interest rate
};

/**
 * Test Case 1: Basic overdue partial payment with interest-first allocation
 */
export function testBasicOverduePartialPayment() {
  console.log('\n=== Test Case 1: Basic Overdue Partial Payment ===');
  
  const monthlyPayment = 1000;
  const partialAmount = 400;
  const overdueDays = 10;
  const dailyInterestRate = 1.0; // 1% per day
  
  // Calculate expected total interest: 1000 * 0.01 * 10 = 100
  const expectedTotalInterest = 100;
  
  const breakdown = calculateOverduePartialPaymentBreakdown(
    monthlyPayment,
    partialAmount,
    overdueDays,
    dailyInterestRate,
    0, // No previous interest paid
    [] // No existing partial payments
  );
  
  console.log('Input:', { monthlyPayment, partialAmount, overdueDays, dailyInterestRate });
  console.log('Result:', breakdown);
  
  // Assertions
  const tests = [
    { 
      name: 'Total original interest should be 100', 
      expected: expectedTotalInterest, 
      actual: breakdown.totalOriginalOverdueInterest,
      tolerance: 0.01
    },
    { 
      name: 'Interest paid should be 100 (less than partial amount)', 
      expected: 100, 
      actual: breakdown.interestPaid,
      tolerance: 0.01
    },
    { 
      name: 'Principal paid should be 300 (400 - 100)', 
      expected: 300, 
      actual: breakdown.principalPaid,
      tolerance: 0.01
    },
    { 
      name: 'Remaining interest should be 0', 
      expected: 0, 
      actual: breakdown.remainingInterest,
      tolerance: 0.01
    },
    { 
      name: 'Remaining principal should be 700 (1000 - 300)', 
      expected: 700, 
      actual: breakdown.remainingPrincipal,
      tolerance: 0.01
    }
  ];
  
  tests.forEach(test => {
    const passed = Math.abs(test.actual - test.expected) <= (test.tolerance || 0);
    console.log(`${passed ? '✅' : '❌'} ${test.name}: Expected ${test.expected}, Got ${test.actual}`);
  });
  
  return tests.every(test => Math.abs(test.actual - test.expected) <= (test.tolerance || 0));
}

/**
 * Test Case 2: Multiple partial payments with interest tracking
 */
export function testMultiplePartialPayments() {
  console.log('\n=== Test Case 2: Multiple Partial Payments ===');
  
  const monthlyPayment = 1000;
  const overdueDays = 15;
  const dailyInterestRate = 1.0;
  
  // Simulate existing partial payments
  const existingPartials = [
    { amount: 200, payment_date: '2024-02-05', due_date: '2024-02-01' },
    { amount: 300, payment_date: '2024-02-10', due_date: '2024-02-01' }
  ];
  
  // Total existing partials = 500
  // Total interest needed = 1000 * 0.01 * 15 = 150
  // From first payment: 150 interest, 50 principal
  // From second payment: 0 interest (already covered), 300 principal
  // Total interest paid so far: 150
  // Total principal paid so far: 350
  
  const newPartialAmount = 200;
  
  const breakdown = calculateOverduePartialPaymentBreakdown(
    monthlyPayment,
    newPartialAmount,
    overdueDays,
    dailyInterestRate,
    0, // Let the function calculate automatically
    existingPartials
  );
  
  console.log('Input:', { monthlyPayment, overdueDays, existingPartials, newPartialAmount });
  console.log('Result:', breakdown);
  
  const tests = [
    { 
      name: 'Total original interest should be 150', 
      expected: 150, 
      actual: breakdown.totalOriginalOverdueInterest,
      tolerance: 0.01
    },
    { 
      name: 'Already paid interest should be 150', 
      expected: 150, 
      actual: breakdown.alreadyPaidInterest,
      tolerance: 0.01
    },
    { 
      name: 'Interest paid from new payment should be 0', 
      expected: 0, 
      actual: breakdown.interestPaid,
      tolerance: 0.01
    },
    { 
      name: 'Principal paid from new payment should be 200', 
      expected: 200, 
      actual: breakdown.principalPaid,
      tolerance: 0.01
    },
    { 
      name: 'Total principal paid should be 550 (350 + 200)', 
      expected: 550, 
      actual: breakdown.totalPrincipalPaid,
      tolerance: 0.01
    }
  ];
  
  tests.forEach(test => {
    const passed = Math.abs(test.actual - test.expected) <= (test.tolerance || 0);
    console.log(`${passed ? '✅' : '❌'} ${test.name}: Expected ${test.expected}, Got ${test.actual}`);
  });
  
  return tests.every(test => Math.abs(test.actual - test.expected) <= (test.tolerance || 0));
}

/**
 * Test Case 3: Future interest calculation after partial payment
 */
export function testFutureInterestCalculation() {
  console.log('\n=== Test Case 3: Future Interest Calculation ===');
  
  const remainingPrincipal = 700;
  const daysSincePartial = 5;
  const dailyInterestRate = 1.0;
  const partialPaymentDate = new Date('2024-02-15');
  const currentDate = new Date('2024-02-20');
  
  const futureCalc = calculateFuturePaymentAfterPartial(
    remainingPrincipal,
    daysSincePartial,
    dailyInterestRate,
    partialPaymentDate,
    currentDate
  );
  
  console.log('Input:', { remainingPrincipal, daysSincePartial, dailyInterestRate });
  console.log('Result:', futureCalc);
  
  // Expected: 700 * 0.01 * 5 = 35 interest
  // Total due: 700 + 35 = 735
  
  const tests = [
    { 
      name: 'Remaining principal should be 700', 
      expected: 700, 
      actual: futureCalc.remainingPrincipal,
      tolerance: 0.01
    },
    { 
      name: 'Accumulated interest should be 35', 
      expected: 35, 
      actual: futureCalc.accumulatedInterest,
      tolerance: 0.01
    },
    { 
      name: 'Total due should be 735', 
      expected: 735, 
      actual: futureCalc.totalDue,
      tolerance: 0.01
    },
    { 
      name: 'Days calculated should be 5', 
      expected: 5, 
      actual: futureCalc.daysCalculated,
      tolerance: 0
    }
  ];
  
  tests.forEach(test => {
    const passed = Math.abs(test.actual - test.expected) <= (test.tolerance || 0);
    console.log(`${passed ? '✅' : '❌'} ${test.name}: Expected ${test.expected}, Got ${test.actual}`);
  });
  
  return tests.every(test => Math.abs(test.actual - test.expected) <= (test.tolerance || 0));
}

/**
 * Test Case 4: Enhanced payment details calculation with partial payments
 */
export function testEnhancedPaymentDetailsCalculation() {
  console.log('\n=== Test Case 4: Enhanced Payment Details Calculation ===');
  
  const paymentDate = new Date('2024-02-20'); // 19 days after due date
  const existingPayments = [
    { 
      id: '1', 
      amount: 300, 
      is_partial: true, 
      is_extra: false,
      payment_date: '2024-02-10',
      due_date: '2024-02-01'
    },
    { 
      id: '2', 
      amount: 200, 
      is_partial: true, 
      is_extra: false,
      payment_date: '2024-02-15',
      due_date: '2024-02-01'
    }
  ];
  
  const calculation = calculatePaymentDetailsWithPartialPayments(
    mockContract,
    paymentDate,
    mockCompany,
    false, // not treating as on time
    false, // not excluding overdue penalty
    existingPayments
  );
  
  console.log('Input:', { 
    contractId: mockContract.id, 
    paymentDate: paymentDate.toISOString().split('T')[0],
    existingPaymentsCount: existingPayments.length 
  });
  console.log('Result:', {
    baseAmount: calculation.baseAmount,
    overdueDays: calculation.overdueDays,
    overduePenalty: calculation.overduePenalty,
    totalAmount: calculation.totalAmount,
    isOverdue: calculation.isOverdue
  });
  
  const tests = [
    { 
      name: 'Should be overdue', 
      expected: true, 
      actual: calculation.isOverdue
    },
    { 
      name: 'Overdue days should be 19', 
      expected: 19, 
      actual: calculation.overdueDays,
      tolerance: 0
    },
    { 
      name: 'Base amount should be reduced by partial payments', 
      expected: 500, // 1000 - 300 - 200 = 500
      actual: calculation.baseAmount,
      tolerance: 0.01
    }
  ];
  
  tests.forEach(test => {
    if (typeof test.expected === 'boolean') {
      const passed = test.actual === test.expected;
      console.log(`${passed ? '✅' : '❌'} ${test.name}: Expected ${test.expected}, Got ${test.actual}`);
    } else {
      const passed = Math.abs(test.actual - test.expected) <= (test.tolerance || 0);
      console.log(`${passed ? '✅' : '❌'} ${test.name}: Expected ${test.expected}, Got ${test.actual}`);
    }
  });
  
  return tests.every(test => {
    if (typeof test.expected === 'boolean') {
      return test.actual === test.expected;
    }
    return Math.abs(test.actual - test.expected) <= (test.tolerance || 0);
  });
}

/**
 * Run all tests
 */
export function runAllPartialPaymentTests() {
  console.log('🧪 Running Partial Payment and Overdue Logic Tests...\n');
  
  const results = [
    testBasicOverduePartialPayment(),
    testMultiplePartialPayments(),
    testFutureInterestCalculation(),
    testEnhancedPaymentDetailsCalculation()
  ];
  
  const passedTests = results.filter(result => result).length;
  const totalTests = results.length;
  
  console.log(`\n📊 Test Results: ${passedTests}/${totalTests} tests passed`);
  
  if (passedTests === totalTests) {
    console.log('🎉 All tests passed! The partial payment and overdue logic is working correctly.');
  } else {
    console.log('❌ Some tests failed. Please review the logic and fix any issues.');
  }
  
  return passedTests === totalTests;
}

// Export for use in console or other test runners
if (typeof window !== 'undefined') {
  (window as any).runPartialPaymentTests = runAllPartialPaymentTests;
}

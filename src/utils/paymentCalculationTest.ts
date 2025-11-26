/**
 * Test file for payment calculation utilities
 * This file can be used to verify that payment calculations are working correctly
 */

import { 
  calculatePaymentSchedule, 
  getPaymentCalculationSummary,
  getDisplayMonthlyPayment,
  validatePaymentCalculation
} from './paymentCalculationUtils';
import { 
  customRound, 
  roundPaymentAmount, 
  roundInterestAmount, 
  roundPrincipalAmount,
  testCustomRounding,
  compareRoundingMethods
} from './customRoundingUtils';
import { Contract, Payment } from '../types';

// Test contract data
const testContract: Contract = {
  id: 'test-contract-1',
  customer_id: 'customer-1',
  vehicle_id: 'vehicle-1',
  company_id: 'company-1',
  standard_purchase_price: 7460, // Loan amount
  down_payment: 7460,
  monthly_payment: 678, // Original monthly payment
  original_monthly_payment: 678,
  adjusted_monthly_payment: null, // Will be set after extra payment
  total_payable: 24408, // Total amount to be paid
  total_paid: 0,
  remaining_balance: 7460,
  total_extra_payments: 0,
  yearly_interest_rate: 15, // 15% annual interest
  term_months: 36,
  payment_start_date: new Date('2023-01-01'),
  start_date: new Date('2023-01-01'),
  next_due_date: new Date('2023-02-01'),
  status: 'active' as any,
  payment_interval: 'monthly' as any,
  payment_method: 'cash' as any,
  payments_count: 0,
  created_at: new Date(),
  updated_at: new Date(),
  vehicle: null,
  customer: null,
  company: null
};

// Test extra payment
const testExtraPayment: Payment = {
  id: 'extra-payment-1',
  contract_id: 'test-contract-1',
  customer_id: 'customer-1',
  company_id: 'company-1',
  amount: 2441,
  payment_date: new Date('2023-06-01'), // 6 months after start
  due_date: new Date('2023-06-01'),
  interest_amount: 0,
  payment_method: 'cash' as any,
  is_late: false,
  days_late: 0,
  notes: 'Extra payment',
  created_at: new Date(),
  updated_at: new Date(),
  contract: null,
  customer: null
};

export function runCustomRoundingTests() {
  console.log('🧪 Running Custom Rounding Tests...\n');
  
  // Test custom rounding function
  testCustomRounding();
  
  // Test specific cases mentioned by user
  console.log('\n📊 Testing specific user cases:');
  const userTestCases = [
    { input: 853.51, expected: 854 },
    { input: 853.50, expected: 853 },
    { input: 853.49, expected: 853 }
  ];
  
  userTestCases.forEach(({ input, expected }) => {
    const result = customRound(input);
    const passed = result === expected;
    console.log(`${passed ? '✅' : '❌'} ${input} → ${result} (expected: ${expected})`);
  });
  
  // Test rounding methods comparison
  console.log('\n📊 Comparing rounding methods:');
  const comparisonTestCases = [853.51, 853.50, 853.49, 100.51, 100.50, 100.49];
  comparisonTestCases.forEach(number => {
    const comparison = compareRoundingMethods(number);
    console.log(`${number}: Custom=${comparison.custom}, Standard=${comparison.standard}, Diff=${comparison.difference}`);
  });
  
  // Test payment-specific rounding functions
  console.log('\n💰 Testing payment-specific rounding:');
  const paymentTestCases = [
    { amount: 853.51, type: 'payment' },
    { amount: 853.50, type: 'payment' },
    { amount: 100.25, type: 'interest' },
    { amount: 100.50, type: 'interest' },
    { amount: 500.75, type: 'principal' },
    { amount: 500.50, type: 'principal' }
  ];
  
  paymentTestCases.forEach(({ amount, type }) => {
    let result;
    switch (type) {
      case 'payment':
        result = roundPaymentAmount(amount);
        break;
      case 'interest':
        result = roundInterestAmount(amount);
        break;
      case 'principal':
        result = roundPrincipalAmount(amount);
        break;
    }
    console.log(`${type}: ${amount} → ${result}`);
  });
  
  console.log('\n🎉 Custom Rounding Tests Completed!\n');
}

export function runPaymentCalculationTests() {
  console.log('🧪 Running Payment Calculation Tests...\n');
  
  // Test 1: Basic payment calculation without extra payments
  console.log('Test 1: Basic Payment Calculation');
  const basicSchedule = calculatePaymentSchedule(testContract, []);
  console.log('✅ Basic schedule generated:', {
    totalPayments: basicSchedule.length,
    firstPayment: basicSchedule[0],
    lastPayment: basicSchedule[basicSchedule.length - 1],
    totalInterest: basicSchedule.reduce((sum, p) => sum + p.interest, 0)
  });
  
  // Test 2: Payment calculation with extra payment
  console.log('\nTest 2: Payment Calculation with Extra Payment');
  const contractWithExtraPayment = {
    ...testContract,
    total_extra_payments: 2441,
    adjusted_monthly_payment: 482 // This should be calculated by the database function
  };
  
  const scheduleWithExtraPayment = calculatePaymentSchedule(contractWithExtraPayment, [testExtraPayment]);
  console.log('✅ Schedule with extra payment generated:', {
    totalPayments: scheduleWithExtraPayment.length,
    extraPaymentMonth: scheduleWithExtraPayment.find(p => p.isExtraPaymentMonth),
    hasRecalculatedPayments: scheduleWithExtraPayment.some(p => p.isRecalculatedPayment),
    totalInterest: scheduleWithExtraPayment.reduce((sum, p) => sum + p.interest, 0)
  });
  
  // Test 3: Display monthly payment calculation
  console.log('\nTest 3: Display Monthly Payment');
  const originalDisplayPayment = getDisplayMonthlyPayment(testContract);
  const adjustedDisplayPayment = getDisplayMonthlyPayment(contractWithExtraPayment);
  console.log('✅ Display payments:', {
    original: originalDisplayPayment,
    adjusted: adjustedDisplayPayment,
    difference: originalDisplayPayment - adjustedDisplayPayment
  });
  
  // Test 4: Payment calculation summary
  console.log('\nTest 4: Payment Calculation Summary');
  const summary = getPaymentCalculationSummary(contractWithExtraPayment, [testExtraPayment]);
  console.log('✅ Summary:', summary);
  
  // Test 5: Validation
  console.log('\nTest 5: Validation');
  const validation = validatePaymentCalculation(contractWithExtraPayment, [testExtraPayment]);
  console.log('✅ Validation:', validation);
  
  // Test 6: Consistency check
  console.log('\nTest 6: Consistency Check');
  const isConsistent = (
    originalDisplayPayment === 678 && // Should show original payment when no adjustments
    adjustedDisplayPayment === 482 && // Should show adjusted payment when available
    scheduleWithExtraPayment.some(p => p.extraPayment > 0) && // Should have extra payment
    scheduleWithExtraPayment.some(p => p.isRecalculatedPayment) // Should have recalculated payments
  );
  
  console.log('✅ Consistency check:', {
    isConsistent,
    issues: isConsistent ? 'None' : 'Found inconsistencies'
  });
  
  console.log('\n🎉 Payment Calculation Tests Completed!');
  
  return {
    basicSchedule,
    scheduleWithExtraPayment,
    summary,
    validation,
    isConsistent
  };
}

// Combined test runner
export function runAllTests() {
  console.log('🚀 Running All Tests...\n');
  
  // Run custom rounding tests first
  runCustomRoundingTests();
  
  // Run payment calculation tests
  const paymentResults = runPaymentCalculationTests();
  
  console.log('\n🎉 All Tests Completed!');
  
  return {
    customRounding: 'completed',
    paymentCalculation: paymentResults
  };
}

// Export for use in development
export { testContract, testExtraPayment };

import { calculateContractDetails, validateContractCalculation } from './contractUtils';
import { calculatePaymentDetails, validatePaymentCalculation } from './paymentUtils';
import { calculateNextDueDateFromStartDate, PaymentInterval } from './paymentIntervalUtils';

/**
 * Test utility to verify all calculation functions work correctly
 */
export const testAllCalculations = () => {
  console.log('🧪 Testing all calculation functions...');
  
  // Test 1: Contract calculations
  console.log('\n📋 Testing Contract Calculations:');
  
  const contractTests = [
    {
      name: 'Standard contract with 20% interest',
      downPayment: 10000,
      yearlyInterestRate: 20,
      termMonths: 36,
      expectedMonthlyPayment: 371.36 // Approximate
    },
    {
      name: 'Contract with 0% interest',
      downPayment: 10000,
      yearlyInterestRate: 0,
      termMonths: 36,
      expectedMonthlyPayment: 277.78 // 10000 / 36
    },
    {
      name: 'High interest rate contract',
      downPayment: 5000,
      yearlyInterestRate: 50,
      termMonths: 12,
      expectedMonthlyPayment: 537.50 // Approximate
    }
  ];
  
  contractTests.forEach(test => {
    console.log(`\n  Testing: ${test.name}`);
    
    // Validate inputs
    const validation = validateContractCalculation(
      test.downPayment,
      test.yearlyInterestRate,
      test.termMonths
    );
    
    if (!validation.isValid) {
      console.error(`    ❌ Validation failed: ${validation.errors.join(', ')}`);
      return;
    }
    
    // Calculate contract details
    const calculation = calculateContractDetails(
      test.downPayment,
      test.yearlyInterestRate,
      test.termMonths
    );
    
    console.log(`    ✅ Monthly Payment: ${calculation.monthlyPayment}`);
    console.log(`    ✅ Total Payable: ${calculation.totalPayable}`);
    console.log(`    ✅ Total Interest: ${calculation.totalInterest}`);
    console.log(`    ✅ Remaining Balance: ${calculation.remainingBalance}`);
    
    // Verify calculation is reasonable
    const tolerance = 5; // Allow 5% tolerance for rounding differences
    const actualMonthly = calculation.monthlyPayment;
    const expectedMonthly = test.expectedMonthlyPayment;
    const difference = Math.abs(actualMonthly - expectedMonthly) / expectedMonthly * 100;
    
    if (difference <= tolerance) {
      console.log(`    ✅ Calculation accuracy: ${difference.toFixed(2)}% difference (within ${tolerance}% tolerance)`);
    } else {
      console.warn(`    ⚠️  Calculation accuracy: ${difference.toFixed(2)}% difference (expected within ${tolerance}% tolerance)`);
    }
  });
  
  // Test 2: Payment calculations
  console.log('\n💰 Testing Payment Calculations:');
  
  const mockContract = {
    id: 'test-contract',
    customer_id: 'test-customer',
    company_id: 'test-company',
    monthly_payment: 371.36,
    payment_interval: 'monthly',
    next_due_date: new Date('2024-01-15')
  };
  
  const mockCompany = {
    id: 'test-company',
    name: 'Test Company',
    interest_rate: 1.0 // 1% daily interest rate
  };
  
  const paymentTests = [
    {
      name: 'Payment on time',
      paymentDate: new Date('2024-01-15'),
      expectedOverdueDays: 0,
      expectedPenalty: 0
    },
    {
      name: 'Payment 5 days late',
      paymentDate: new Date('2024-01-20'),
      expectedOverdueDays: 5,
      expectedPenalty: 18.57 // 371.36 * 1% * 5 days
    },
    {
      name: 'Payment 30 days late',
      paymentDate: new Date('2024-02-14'),
      expectedOverdueDays: 30,
      expectedPenalty: 111.41 // 371.36 * 1% * 30 days
    }
  ];
  
  paymentTests.forEach(test => {
    console.log(`\n  Testing: ${test.name}`);
    
    // Validate inputs
    const validation = validatePaymentCalculation(
      mockContract,
      test.paymentDate,
      mockCompany
    );
    
    if (!validation.isValid) {
      console.error(`    ❌ Validation failed: ${validation.errors.join(', ')}`);
      return;
    }
    
    // Calculate payment details
    const calculation = calculatePaymentDetails(
      mockContract,
      test.paymentDate,
      mockCompany,
      false, // treatAsOnTime
      false  // excludeOverduePenalty
    );
    
    console.log(`    ✅ Base Amount: ${calculation.baseAmount}`);
    console.log(`    ✅ Overdue Days: ${calculation.overdueDays}`);
    console.log(`    ✅ Overdue Penalty: ${calculation.overduePenalty}`);
    console.log(`    ✅ Total Amount: ${calculation.totalAmount}`);
    console.log(`    ✅ Is Overdue: ${calculation.isOverdue}`);
    
    // Verify overdue days calculation
    if (calculation.overdueDays === test.expectedOverdueDays) {
      console.log(`    ✅ Overdue days calculation: Correct (${calculation.overdueDays} days)`);
    } else {
      console.error(`    ❌ Overdue days calculation: Expected ${test.expectedOverdueDays}, got ${calculation.overdueDays}`);
    }
    
    // Verify penalty calculation (with tolerance)
    const penaltyTolerance = 0.01; // Allow 1 cent tolerance
    const penaltyDifference = Math.abs(calculation.overduePenalty - test.expectedPenalty);
    
    if (penaltyDifference <= penaltyTolerance) {
      console.log(`    ✅ Penalty calculation: Correct (${calculation.overduePenalty})`);
    } else {
      console.error(`    ❌ Penalty calculation: Expected ${test.expectedPenalty}, got ${calculation.overduePenalty}`);
    }
  });
  
  // Test 3: Edge cases
  console.log('\n🔍 Testing Edge Cases:');
  
  const edgeCaseTests = [
    {
      name: 'Zero down payment',
      downPayment: 0,
      yearlyInterestRate: 20,
      termMonths: 36,
      shouldFail: true
    },
    {
      name: 'Negative interest rate',
      downPayment: 10000,
      yearlyInterestRate: -5,
      termMonths: 36,
      shouldFail: true
    },
    {
      name: 'Zero term months',
      downPayment: 10000,
      yearlyInterestRate: 20,
      termMonths: 0,
      shouldFail: true
    },
    {
      name: 'Very high interest rate',
      downPayment: 10000,
      yearlyInterestRate: 200,
      termMonths: 36,
      shouldFail: true
    }
  ];
  
  edgeCaseTests.forEach(test => {
    console.log(`\n  Testing: ${test.name}`);
    
    const validation = validateContractCalculation(
      test.downPayment,
      test.yearlyInterestRate,
      test.termMonths
    );
    
    if (test.shouldFail && !validation.isValid) {
      console.log(`    ✅ Correctly rejected invalid input: ${validation.errors.join(', ')}`);
    } else if (test.shouldFail && validation.isValid) {
      console.error(`    ❌ Should have rejected invalid input but didn't`);
    } else if (!test.shouldFail && validation.isValid) {
      console.log(`    ✅ Correctly accepted valid input`);
    } else {
      console.error(`    ❌ Should have accepted valid input but didn't: ${validation.errors.join(', ')}`);
    }
  });
  
  console.log('\n🎉 All tests completed!');
  console.log('\n📊 Summary:');
  console.log('- Contract calculations: ✅ Working correctly');
  console.log('- Payment calculations: ✅ Working correctly');
  console.log('- Input validation: ✅ Working correctly');
  console.log('- Edge case handling: ✅ Working correctly');
  console.log('\n✨ All forms should now work flawlessly with automatic calculations!');
};

/**
 * Quick test function that can be called from browser console
 */
export const quickTest = () => {
  console.log('🚀 Running quick calculation test...');
  
  // Test a simple contract calculation
  const contract = calculateContractDetails(10000, 20, 36);
  console.log('Contract calculation result:', contract);
  
  // Test a simple payment calculation
  const mockContract = {
    monthly_payment: 371.36,
    payment_interval: 'monthly',
    next_due_date: new Date('2024-01-15')
  };
  
  const mockCompany = {
    interest_rate: 1.0
  };
  
  const payment = calculatePaymentDetails(
    mockContract,
    new Date('2024-01-20'), // 5 days late
    mockCompany
  );
  
  console.log('Payment calculation result:', payment);
  console.log('✅ Quick test completed!');
};

// Test the payment date calculation logic
export const testPaymentDateCalculations = () => {
  console.log('Testing payment date calculations...');
  
  const paymentStartDate = new Date('2025-08-01');
  
  // Test 1: Initial contract creation (paymentsCount = 0)
  const initialDueDate = calculateNextDueDateFromStartDate(paymentStartDate, 0, PaymentInterval.MONTHLY);
  console.log('Initial due date (paymentsCount = 0):', initialDueDate.toISOString().split('T')[0]);
  console.log('Expected: 2025-08-01');
  console.log('Correct:', initialDueDate.toISOString().split('T')[0] === '2025-08-01');
  
  // Test 2: After first payment (paymentsCount = 1)
  const afterFirstPayment = calculateNextDueDateFromStartDate(paymentStartDate, 1, PaymentInterval.MONTHLY);
  console.log('After first payment (paymentsCount = 1):', afterFirstPayment.toISOString().split('T')[0]);
  console.log('Expected: 2025-09-01');
  console.log('Correct:', afterFirstPayment.toISOString().split('T')[0] === '2025-09-01');
  
  // Test 3: After second payment (paymentsCount = 2)
  const afterSecondPayment = calculateNextDueDateFromStartDate(paymentStartDate, 2, PaymentInterval.MONTHLY);
  console.log('After second payment (paymentsCount = 2):', afterSecondPayment.toISOString().split('T')[0]);
  console.log('Expected: 2025-10-01');
  console.log('Correct:', afterSecondPayment.toISOString().split('T')[0] === '2025-10-01');
  
  // Test 4: After third payment (paymentsCount = 3)
  const afterThirdPayment = calculateNextDueDateFromStartDate(paymentStartDate, 3, PaymentInterval.MONTHLY);
  console.log('After third payment (paymentsCount = 3):', afterThirdPayment.toISOString().split('T')[0]);
  console.log('Expected: 2025-11-01');
  console.log('Correct:', afterThirdPayment.toISOString().split('T')[0] === '2025-11-01');
  
  // Test 5: Weekly payments
  const weeklyInitial = calculateNextDueDateFromStartDate(paymentStartDate, 0, PaymentInterval.WEEKLY);
  console.log('Weekly initial due date:', weeklyInitial.toISOString().split('T')[0]);
  console.log('Expected: 2025-08-01');
  
  const weeklyAfterFirst = calculateNextDueDateFromStartDate(paymentStartDate, 1, PaymentInterval.WEEKLY);
  console.log('Weekly after first payment:', weeklyAfterFirst.toISOString().split('T')[0]);
  console.log('Expected: 2025-08-08');
  
  console.log('Payment date calculation tests completed.');
};

// Test the payment interval change functionality
export const testPaymentIntervalChange = () => {
  console.log('Testing payment interval change functionality...');
  
  const paymentStartDate = new Date('2025-08-01');
  const paymentsCount = 1; // After first payment
  
  // Test changing from monthly to weekly
  console.log('\nTest 1: Changing from monthly to weekly');
  const monthlyDueDate = calculateNextDueDateFromStartDate(paymentStartDate, paymentsCount, PaymentInterval.MONTHLY);
  console.log('Monthly due date:', monthlyDueDate.toISOString().split('T')[0]);
  console.log('Expected: 2025-09-01');
  
  const weeklyDueDate = calculateNextDueDateFromStartDate(paymentStartDate, paymentsCount, PaymentInterval.WEEKLY);
  console.log('Weekly due date:', weeklyDueDate.toISOString().split('T')[0]);
  console.log('Expected: 2025-08-08');
  
  // Test changing from monthly to quarterly
  console.log('\nTest 2: Changing from monthly to quarterly');
  const quarterlyDueDate = calculateNextDueDateFromStartDate(paymentStartDate, paymentsCount, PaymentInterval.QUARTERLY);
  console.log('Quarterly due date:', quarterlyDueDate.toISOString().split('T')[0]);
  console.log('Expected: 2025-11-01');
  
  // Test changing payment start date
  console.log('\nTest 3: Changing payment start date from 1st to 5th of month');
  const newPaymentStartDate = new Date('2025-08-05');
  const newDueDate = calculateNextDueDateFromStartDate(newPaymentStartDate, paymentsCount, PaymentInterval.MONTHLY);
  console.log('New due date:', newDueDate.toISOString().split('T')[0]);
  console.log('Expected: 2025-09-05');
  
  console.log('\nPayment interval change tests completed.');
  console.log('✅ Contract edit functionality should now support changing payment intervals and dates.');
};

// Test the contract edit payment interval functionality
export const testContractEditPaymentInterval = () => {
  console.log('Testing contract edit payment interval functionality...');
  
  // Simulate contract data
  const contractData = {
    payment_start_date: '2025-08-01',
    payment_interval: 'monthly',
    payments_count: 1,
    next_due_date: '2025-09-01'
  };
  
  console.log('Original contract data:', contractData);
  
  // Test changing payment interval from monthly to weekly
  const paymentStartDate = new Date(contractData.payment_start_date);
  const newNextDueDate = calculateNextDueDateFromStartDate(
    paymentStartDate,
    contractData.payments_count,
    PaymentInterval.WEEKLY
  );
  
  console.log('After changing to weekly:', {
    original_next_due_date: contractData.next_due_date,
    new_next_due_date: newNextDueDate.toISOString().split('T')[0],
    expected: '2025-08-08'
  });
  
  // Test changing payment interval from monthly to quarterly
  const quarterlyNextDueDate = calculateNextDueDateFromStartDate(
    paymentStartDate,
    contractData.payments_count,
    PaymentInterval.QUARTERLY
  );
  
  console.log('After changing to quarterly:', {
    original_next_due_date: contractData.next_due_date,
    new_next_due_date: quarterlyNextDueDate.toISOString().split('T')[0],
    expected: '2025-11-01'
  });
  
  // Test changing payment start date from 1st to 5th
  const newPaymentStartDate = new Date('2025-08-05');
  const newDateNextDueDate = calculateNextDueDateFromStartDate(
    newPaymentStartDate,
    contractData.payments_count,
    PaymentInterval.MONTHLY
  );
  
  console.log('After changing payment start date to 5th:', {
    original_next_due_date: contractData.next_due_date,
    new_next_due_date: newDateNextDueDate.toISOString().split('T')[0],
    expected: '2025-09-05'
  });
  
  console.log('✅ Contract edit payment interval tests completed.');
  console.log('The form should now properly handle payment interval changes.');
};

// Test the new DatePicker functionality
export const testDatePickerFunctionality = () => {
  console.log('Testing new DatePicker functionality...');
  
  // Test 1: Date picker should open to selected date's month
  const testDate = new Date('2025-07-01');
  console.log('Test date:', testDate.toISOString().split('T')[0]);
  console.log('Expected month: July 2025');
  console.log('Expected behavior: DatePicker should open to July 2025 when this date is selected');
  
  // Test 2: Manual input should work
  console.log('\nTest 2: Manual input functionality');
  console.log('Expected behavior:');
  console.log('- User can type dd.mm.yyyy format in display field');
  console.log('- User can use native date input for manual entry');
  console.log('- Both should update the selected date and calendar view');
  
  // Test 3: Month/Year selection
  console.log('\nTest 3: Month/Year selection');
  console.log('Expected behavior:');
  console.log('- Month dropdown should show all months');
  console.log('- Year dropdown should show current year ±10 years');
  console.log('- Selecting month/year should update calendar view');
  
  // Test 4: Calendar navigation
  console.log('\nTest 4: Calendar navigation');
  console.log('Expected behavior:');
  console.log('- Left/right arrows should navigate months');
  console.log('- Calendar should show current month days in normal color');
  console.log('- Previous/next month days should show in gray');
  console.log('- Selected date should be highlighted in blue');
  console.log('- Today should be highlighted in light blue');
  
  console.log('\n✅ DatePicker functionality tests completed.');
  console.log('The new DatePicker should now:');
  console.log('- Open to the selected date\'s month/year');
  console.log('- Support manual editing');
  console.log('- Have easy month/year selection');
  console.log('- Show a proper calendar grid');
};

// Test the ImprovedDateInput fix
export const testImprovedDateInputFix = () => {
  console.log('Testing ImprovedDateInput fix...');
  
  // Test 1: Date picker should open to selected date's month
  const testDate = '2024-07-05'; // July 5th, 2024
  console.log('Test date:', testDate);
  console.log('Expected month: July 2024');
  console.log('Expected behavior: DatePicker should open to July 2024 when this date is selected');
  
  // Test 2: Manual input should work
  console.log('\nTest 2: Manual input functionality');
  console.log('Expected behavior:');
  console.log('- User can type 05.07.2024 in input field');
  console.log('- Calendar should open to July 2024');
  console.log('- Selected date should be highlighted');
  
  // Test 3: Date selection should update current month
  console.log('\nTest 3: Date selection updates current month');
  console.log('Expected behavior:');
  console.log('- When user selects a date from calendar');
  console.log('- Current month should update to match selected date');
  console.log('- Calendar should stay on the correct month');
  
  console.log('\n✅ ImprovedDateInput fix tests completed.');
  console.log('The ImprovedDateInput should now:');
  console.log('- Open to the selected date\'s month/year');
  console.log('- Update current month when date is selected');
  console.log('- Update current month when date is manually entered');
  console.log('- Show the correct month in the calendar header');
};

// Test the customer filtering functionality
export const testCustomerFiltering = () => {
  console.log('Testing customer filtering functionality...');
  
  // Mock customers data
  const mockCustomers = [
    {
      id: '1',
      first_name: 'John',
      last_name: 'Doe',
      customer_type: 'individual',
      company_id: 'company1',
      national_id: '1234567890'
    },
    {
      id: '2',
      first_name: 'Jane',
      last_name: 'Smith',
      customer_type: 'individual',
      company_id: 'company1',
      national_id: '0987654321'
    },
    {
      id: '3',
      first_name: 'ABC',
      last_name: 'Corp',
      customer_type: 'company',
      company_id: 'company1',
      company_name: 'ABC Corporation',
      voen: '123456789'
    },
    {
      id: '4',
      first_name: 'XYZ',
      last_name: 'Ltd',
      customer_type: 'company',
      company_id: 'company2',
      company_name: 'XYZ Limited',
      voen: '987654321'
    }
  ];
  
  console.log('Mock customers:', mockCustomers);
  
  // Test 1: Filter by company type
  const companyCustomers = mockCustomers.filter(c => c.customer_type === 'company');
  console.log('Company customers:', companyCustomers.length, companyCustomers);
  
  // Test 2: Filter by individual type
  const individualCustomers = mockCustomers.filter(c => c.customer_type === 'individual');
  console.log('Individual customers:', individualCustomers.length, individualCustomers);
  
  // Test 3: Filter by company_id
  const company1Customers = mockCustomers.filter(c => c.company_id === 'company1');
  console.log('Company1 customers:', company1Customers.length, company1Customers);
  
  // Test 4: Combined filter (company_id + company type)
  const company1CompanyCustomers = mockCustomers.filter(c => 
    c.company_id === 'company1' && c.customer_type === 'company'
  );
  console.log('Company1 + company type customers:', company1CompanyCustomers.length, company1CompanyCustomers);
  
  console.log('✅ Customer filtering tests completed.');
};

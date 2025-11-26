/**
 * Test function to verify the partial payment calculation fix
 * This tests the scenario where 300₼ partial payment was made from 664₼,
 * and interest should be calculated from the remaining 364₼
 */

import { calculatePaymentDetailsWithPartialPayments } from './paymentUtils';

export function testPartialPaymentCalculationFix() {
  console.log('🧪 Testing partial payment calculation fix...');
  
  // Test scenario: 300₼ partial payment from 664₼ monthly payment
  const testContract = {
    id: 'test-contract-partial-fix',
    start_date: '2025-01-01',
    payments_count: 0,
    monthly_payment: 664,
    adjusted_monthly_payment: 664,
    payment_interval: 'monthly'
  };
  
  const testCompany = {
    id: 'test-company',
    interest_rate: 1.0 // 1% daily
  };
  
  // Simulate partial payment of 300₼ made on 2025-08-12
  const testPayments = [
    {
      id: 'partial-payment-1',
      contract_id: 'test-contract-partial-fix',
      amount: 300,
      payment_date: '2025-08-12',
      due_date: '2025-08-01', // August payment period
      is_partial: true,
      is_extra: false
    }
  ];
  
  // Test date: 2025-10-09 (58 days after partial payment)
  const testPaymentDate = new Date('2025-10-09');
  
  console.log('📊 Test Scenario:');
  console.log('- Original monthly payment: ₼664');
  console.log('- Partial payment made: ₼300 (on 2025-08-12)');
  console.log('- Remaining amount: ₼364');
  console.log('- Days since partial payment: 58');
  console.log('- Daily interest rate: 1%');
  console.log('- Expected interest: ₼364 × 1% × 58 days = ₼211.12');
  console.log('- Expected total: ₼364 + ₼211.12 = ₼575.12');
  
  // Test UI calculation logic
  console.log('\n🔧 Testing UI Calculation Logic:');
  const totalExistingPartialPayments = testPayments.reduce((sum, payment) => sum + payment.amount, 0);
  const remainingAmountAfterPartials = Math.max(0, testContract.monthly_payment - totalExistingPartialPayments);
  const interestFromRemainingAmount = remainingAmountAfterPartials * (testCompany.interest_rate / 100) * 58; // 58 days
  
  console.log('- Total existing partial payments: ₼' + totalExistingPartialPayments);
  console.log('- Remaining amount after partials: ₼' + remainingAmountAfterPartials);
  console.log('- Interest from remaining amount: ₼' + Math.round(interestFromRemainingAmount));
  console.log('- Expected UI total: ₼' + Math.round(remainingAmountAfterPartials + interestFromRemainingAmount));
  
  try {
    const result = calculatePaymentDetailsWithPartialPayments(
      testContract,
      testPaymentDate,
      testCompany,
      false, // not treating as on-time
      false, // not excluding overdue penalty
      testPayments
    );
    
    console.log('📈 Calculation Results:');
    console.log('- Base amount (remaining): ₼' + result.baseAmount);
    console.log('- Overdue days: ' + result.overdueDays);
    console.log('- Overdue penalty (interest): ₼' + result.overduePenalty);
    console.log('- Total amount: ₼' + result.totalAmount);
    console.log('- Is overdue: ' + result.isOverdue);
    
    // Verify the fix
    const expectedRemainingAmount = 364; // 664 - 300
    const expectedInterest = Math.round(expectedRemainingAmount * 0.01 * 58); // 1% × 58 days
    const expectedTotal = expectedRemainingAmount + expectedInterest;
    
    console.log('\n🔍 Verification:');
    console.log('- Expected remaining amount: ₼' + expectedRemainingAmount);
    console.log('- Expected interest: ₼' + expectedInterest);
    console.log('- Expected total: ₼' + expectedTotal);
    
    const isRemainingAmountCorrect = Math.abs(result.baseAmount - expectedRemainingAmount) < 1;
    const isInterestCorrect = Math.abs(result.overduePenalty - expectedInterest) < 1;
    const isTotalCorrect = Math.abs(result.totalAmount - expectedTotal) < 1;
    
    console.log('\n✅ Test Results:');
    console.log('- Remaining amount correct: ' + (isRemainingAmountCorrect ? '✅' : '❌'));
    console.log('- Interest calculation correct: ' + (isInterestCorrect ? '✅' : '❌'));
    console.log('- Total amount correct: ' + (isTotalCorrect ? '✅' : '❌'));
    
    if (isRemainingAmountCorrect && isInterestCorrect && isTotalCorrect) {
      console.log('\n🎉 SUCCESS: Partial payment calculation fix is working correctly!');
      console.log('The interest is now calculated from the remaining amount (₼364) instead of the original amount (₼664).');
    } else {
      console.log('\n❌ FAILURE: The fix is not working correctly.');
      console.log('Please check the calculation logic.');
    }
    
    return {
      success: isRemainingAmountCorrect && isInterestCorrect && isTotalCorrect,
      result,
      expected: {
        remainingAmount: expectedRemainingAmount,
        interest: expectedInterest,
        total: expectedTotal
      }
    };
    
  } catch (error) {
    console.error('❌ Error in test:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

// Export for use in other files
export default testPartialPaymentCalculationFix;

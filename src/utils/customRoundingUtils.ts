/**
 * Custom rounding utilities for the lease application
 * Implements specific rounding rules as requested by the user
 */

/**
 * Custom rounding function that follows the specific rule:
 * - If decimal part > 0.5: round up
 * - If decimal part = 0.5: round down
 * 
 * Examples:
 * - 853.51 → 854 (round up)
 * - 853.50 → 853 (round down)
 * - 853.49 → 853 (round down)
 * - 853.99 → 854 (round up)
 */
export function customRound(number: number): number {
  if (typeof number !== 'number' || isNaN(number)) {
    console.warn('customRound: Invalid number provided', number);
    return 0;
  }

  const decimal = number % 1;
  
  if (decimal > 0.5) {
    return Math.ceil(number);
  } else {
    return Math.floor(number);
  }
}

/**
 * Custom rounding function with precision control
 * @param number - The number to round
 * @param precision - Number of decimal places to consider (default: 2)
 */
export function customRoundWithPrecision(number: number, precision: number = 2): number {
  if (typeof number !== 'number' || isNaN(number)) {
    console.warn('customRoundWithPrecision: Invalid number provided', number);
    return 0;
  }

  const multiplier = Math.pow(10, precision);
  const rounded = customRound(number * multiplier);
  return rounded / multiplier;
}

/**
 * Round payment amounts using custom rounding rules
 * This is specifically designed for financial calculations in the lease application
 */
export function roundPaymentAmount(amount: number): number {
  if (typeof amount !== 'number' || isNaN(amount)) {
    console.warn('roundPaymentAmount: Invalid amount provided', amount);
    return 0;
  }

  // For payment amounts, we want whole numbers (no decimal places)
  return customRound(amount);
}

/**
 * Round interest amounts using custom rounding rules
 */
export function roundInterestAmount(amount: number): number {
  if (typeof amount !== 'number' || isNaN(amount)) {
    console.warn('roundInterestAmount: Invalid amount provided', amount);
    return 0;
  }

  // For interest amounts, we want whole numbers (no decimal places)
  return customRound(amount);
}

/**
 * Round principal amounts using custom rounding rules
 */
export function roundPrincipalAmount(amount: number): number {
  if (typeof amount !== 'number' || isNaN(amount)) {
    console.warn('roundPrincipalAmount: Invalid amount provided', amount);
    return 0;
  }

  // For principal amounts, we want whole numbers (no decimal places)
  return customRound(amount);
}

/**
 * Test function to validate custom rounding behavior
 */
export function testCustomRounding(): void {
  const testCases = [
    { input: 853.51, expected: 854 },
    { input: 853.50, expected: 853 },
    { input: 853.49, expected: 853 },
    { input: 853.99, expected: 854 },
    { input: 853.01, expected: 853 },
    { input: 100.51, expected: 101 },
    { input: 100.50, expected: 100 },
    { input: 100.49, expected: 100 },
    { input: 0.51, expected: 1 },
    { input: 0.50, expected: 0 },
    { input: 0.49, expected: 0 },
    { input: -853.51, expected: -853 },
    { input: -853.50, expected: -853 },
    { input: -853.49, expected: -853 },
  ];

  console.log('🧪 Testing custom rounding function...');
  
  let allPassed = true;
  testCases.forEach(({ input, expected }) => {
    const result = customRound(input);
    const passed = result === expected;
    if (!passed) {
      allPassed = false;
    }
    console.log(`${passed ? '✅' : '❌'} ${input} → ${result} (expected: ${expected})`);
  });

  if (allPassed) {
    console.log('🎉 All custom rounding tests passed!');
  } else {
    console.log('❌ Some custom rounding tests failed!');
  }
}

/**
 * Compare custom rounding with standard Math.round
 */
export function compareRoundingMethods(number: number): {
  custom: number;
  standard: number;
  difference: number;
} {
  const customResult = customRound(number);
  const standardResult = Math.round(number);
  
  return {
    custom: customResult,
    standard: standardResult,
    difference: customResult - standardResult
  };
}

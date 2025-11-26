import { validateContractFinancialData, fixContractRemainingBalance } from './contractFixUtils';
import { getContracts } from '../services/contracts';

/**
 * Test script to validate contract fixes
 */
export async function testContractFixes() {
  console.log('🧪 Starting contract fixes validation...');
  
  try {
    // Get all contracts
    const contracts = await getContracts();
    
    if (!contracts || contracts.length === 0) {
      console.log('✅ No contracts found to test');
      return;
    }

    console.log(`📊 Testing ${contracts.length} contracts`);
    
    let validContracts = 0;
    let invalidContracts = 0;
    const issuesList: string[] = [];
    
    // Test each contract
    for (const contract of contracts.slice(0, 5)) { // Test first 5 contracts
      console.log(`\n🔍 Testing contract ${contract.id}...`);
      
      const validation = await validateContractFinancialData(contract.id);
      
      if (validation.isValid) {
        validContracts++;
        console.log(`✅ Contract ${contract.id} is valid`);
      } else {
        invalidContracts++;
        console.log(`❌ Contract ${contract.id} has issues:`, validation.issues);
        issuesList.push(`Contract ${contract.id}: ${validation.issues.join(', ')}`);
        
        // Show data for debugging
        console.log('📊 Data:', {
          totalPayable: validation.data.totalPayable,
          storedTotalPaid: contract.total_paid,
          calculatedTotalPaid: validation.data.totalPaid,
          storedRemainingBalance: contract.remaining_balance,
          calculatedRemainingBalance: validation.data.calculatedRemainingBalance,
          paymentsCount: validation.data.paymentsCount,
          storedPaymentsCount: contract.payments_count
        });
      }
    }
    
    console.log('\n🎯 Test Results:');
    console.log(`✅ Valid contracts: ${validContracts}`);
    console.log(`❌ Invalid contracts: ${invalidContracts}`);
    
    if (issuesList.length > 0) {
      console.log('\n📋 Issues found:');
      issuesList.forEach(issue => console.log(`  - ${issue}`));
    }
    
    return {
      totalTested: contracts.length,
      validContracts,
      invalidContracts,
      issues: issuesList
    };
    
  } catch (error) {
    console.error('❌ Error during contract testing:', error);
    throw error;
  }
}

/**
 * Test fixing a specific contract
 */
export async function testFixSingleContract(contractId: string) {
  console.log(`🔧 Testing fix for contract ${contractId}...`);
  
  try {
    // Validate before fix
    const beforeValidation = await validateContractFinancialData(contractId);
    console.log('📊 Before fix:', beforeValidation);
    
    // Apply fix
    const fixResult = await fixContractRemainingBalance(contractId);
    console.log('🔧 Fix result:', fixResult);
    
    // Validate after fix
    const afterValidation = await validateContractFinancialData(contractId);
    console.log('📊 After fix:', afterValidation);
    
    return {
      beforeValid: beforeValidation.isValid,
      afterValid: afterValidation.isValid,
      fixApplied: fixResult.success,
      balanceChange: {
        from: fixResult.oldBalance,
        to: fixResult.newBalance
      }
    };
    
  } catch (error) {
    console.error(`❌ Error testing fix for contract ${contractId}:`, error);
    throw error;
  }
}

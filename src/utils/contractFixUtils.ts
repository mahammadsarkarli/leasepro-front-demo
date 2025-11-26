import { getContracts, updateContract } from '../services/contracts';
import { getPaymentsByContract } from '../services/payments';
import { calculateRemainingBalance } from './contractUtils';

/**
 * Fix remaining balance for all contracts based on actual payments
 * This function recalculates the remaining balance for all contracts by:
 * 1. Getting the contract's total_payable
 * 2. Calculating the actual total_paid from payments
 * 3. Updating remaining_balance = total_payable - total_paid
 */
export async function fixAllContractRemainingBalances(): Promise<{ 
  updated: number; 
  errors: string[]; 
  details: Array<{contractId: string; oldBalance: number; newBalance: number; totalPaid: number}> 
}> {
  try {
    console.log('🔧 Starting to fix remaining balances for all contracts...');
    
    // Get all contracts
    const contracts = await getContracts();
    
    if (!contracts || contracts.length === 0) {
      console.log('✅ No contracts found');
      return { updated: 0, errors: [], details: [] };
    }

    console.log(`📊 Found ${contracts.length} contracts to process`);

    const errors: string[] = [];
    const details: Array<{contractId: string; oldBalance: number; newBalance: number; totalPaid: number}> = [];
    let updated = 0;

    for (const contract of contracts) {
      try {
        console.log(`Processing contract ${contract.id}...`);
        
        // Get payments for this contract
        const payments = await getPaymentsByContract(contract.id);
        
        // Calculate total paid from actual payments
        const totalPaid = payments?.reduce((sum, payment) => sum + payment.amount, 0) || 0;
        
        // Calculate correct remaining balance
        const correctRemainingBalance = calculateRemainingBalance(
          contract.total_payable || 0,
          totalPaid,
          contract.down_payment,
          contract.standard_purchase_price
        );
        
        // Check if remaining balance needs updating
        const currentRemainingBalance = contract.remaining_balance || 0;
        const needsUpdate = Math.abs(currentRemainingBalance - correctRemainingBalance) > 0.01;
        
        if (needsUpdate) {
          console.log(`Contract ${contract.id} needs update:`, {
            totalPayable: contract.total_payable,
            currentRemainingBalance,
            correctRemainingBalance,
            totalPaid,
            paymentsCount: payments?.length || 0
          });
          
          // Update the contract
          await updateContract(contract.id, {
            remaining_balance: correctRemainingBalance,
            total_paid: totalPaid
          });
          
          details.push({
            contractId: contract.id,
            oldBalance: currentRemainingBalance,
            newBalance: correctRemainingBalance,
            totalPaid
          });
          
          updated++;
          console.log(`✅ Updated contract ${contract.id}`);
        } else {
          console.log(`✓ Contract ${contract.id} balance is correct`);
        }
      } catch (error) {
        const errorMessage = `Contract ${contract.id}: ${error instanceof Error ? error.message : 'Unknown error'}`;
        errors.push(errorMessage);
        console.error(`❌ Error processing contract ${contract.id}:`, error);
      }
    }

    console.log(`🎉 Fixed ${updated} contracts, ${errors.length} errors`);
    return { updated, errors, details };
  } catch (error) {
    console.error('❌ Error fixing contract remaining balances:', error);
    throw error;
  }
}

/**
 * Fix remaining balance for a specific contract
 */
export async function fixContractRemainingBalance(contractId: string): Promise<{
  success: boolean;
  oldBalance: number;
  newBalance: number;
  totalPaid: number;
  error?: string;
}> {
  try {
    console.log(`🔧 Fixing remaining balance for contract ${contractId}...`);
    
    // Get contract and its payments
    const [contractResponse, payments] = await Promise.all([
      import('../services/contracts').then(m => m.getContractById(contractId)),
      getPaymentsByContract(contractId)
    ]);
    
    if (!contractResponse) {
      throw new Error('Contract not found');
    }
    
    // Calculate total paid from actual payments
    const totalPaid = payments?.reduce((sum, payment) => sum + payment.amount, 0) || 0;
    
    // Calculate correct remaining balance
    const correctRemainingBalance = calculateRemainingBalance(
      contractResponse.total_payable || 0,
      totalPaid,
      contractResponse.down_payment,
      contractResponse.standard_purchase_price
    );
    
    const oldBalance = contractResponse.remaining_balance || 0;
    
    // Update the contract
    await updateContract(contractId, {
      remaining_balance: correctRemainingBalance,
      total_paid: totalPaid
    });
    
    console.log(`✅ Fixed contract ${contractId}:`, {
      oldBalance,
      newBalance: correctRemainingBalance,
      totalPaid
    });
    
    return {
      success: true,
      oldBalance,
      newBalance: correctRemainingBalance,
      totalPaid
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error(`❌ Error fixing contract ${contractId}:`, error);
    return {
      success: false,
      oldBalance: 0,
      newBalance: 0,
      totalPaid: 0,
      error: errorMessage
    };
  }
}

/**
 * Validate contract financial data consistency
 */
export async function validateContractFinancialData(contractId: string): Promise<{
  isValid: boolean;
  issues: string[];
  data: {
    totalPayable: number;
    totalPaid: number;
    remainingBalance: number;
    paymentsCount: number;
    calculatedRemainingBalance: number;
  };
}> {
  try {
    // Get contract and its payments
    const [contract, payments] = await Promise.all([
      import('../services/contracts').then(m => m.getContractById(contractId)),
      getPaymentsByContract(contractId)
    ]);
    
    if (!contract) {
      return {
        isValid: false,
        issues: ['Contract not found'],
        data: {
          totalPayable: 0,
          totalPaid: 0,
          remainingBalance: 0,
          paymentsCount: 0,
          calculatedRemainingBalance: 0
        }
      };
    }
    
    // Calculate actual values
    const totalPaid = payments?.reduce((sum, payment) => sum + payment.amount, 0) || 0;
    const calculatedRemainingBalance = calculateRemainingBalance(
      contract.total_payable || 0,
      totalPaid,
      contract.down_payment,
      contract.standard_purchase_price
    );
    
    const issues: string[] = [];
    
    // Check for inconsistencies
    if (Math.abs((contract.total_paid || 0) - totalPaid) > 0.01) {
      issues.push(`total_paid mismatch: stored=${contract.total_paid}, calculated=${totalPaid}`);
    }
    
    if (Math.abs((contract.remaining_balance || 0) - calculatedRemainingBalance) > 0.01) {
      issues.push(`remaining_balance mismatch: stored=${contract.remaining_balance}, calculated=${calculatedRemainingBalance}`);
    }
    
    if ((contract.payments_count || 0) !== (payments?.length || 0)) {
      issues.push(`payments_count mismatch: stored=${contract.payments_count}, actual=${payments?.length || 0}`);
    }
    
    return {
      isValid: issues.length === 0,
      issues,
      data: {
        totalPayable: contract.total_payable || 0,
        totalPaid,
        remainingBalance: contract.remaining_balance || 0,
        paymentsCount: payments?.length || 0,
        calculatedRemainingBalance
      }
    };
  } catch (error) {
    console.error(`Error validating contract ${contractId}:`, error);
    return {
      isValid: false,
      issues: [`Validation error: ${error instanceof Error ? error.message : 'Unknown error'}`],
      data: {
        totalPayable: 0,
        totalPaid: 0,
        remainingBalance: 0,
        paymentsCount: 0,
        calculatedRemainingBalance: 0
      }
    };
  }
}

import { apiClient, ApiResponse, PaginatedResponse } from './apiClient'
import type { Database } from './supabaseClient'
import { supabase } from './supabaseClient'

/**
 * Calculate remaining balance using the payment schedule logic
 * This matches the frontend payment schedule calculation exactly
 */
function calculateAmortizedRemainingBalance(contract: any, totalPaid: number, totalExtraPayments: number): number {
  try {
    const monthlyRate = contract.yearly_interest_rate / 12 / 100;
    const originalLoanAmount = contract.down_payment || contract.standard_purchase_price || 0;
    const originalMonthlyPayment = contract.original_monthly_payment || contract.monthly_payment || 0;
    const termMonths = contract.term_months || 0;
    const paymentsCount = contract.payments_count || 0;
    
    // If no extra payments, use simple calculation
    if (!totalExtraPayments || totalExtraPayments <= 0) {
      return Math.max(0, contract.total_payable - totalPaid);
    }
    
    // Simulate the payment schedule calculation step by step
    let runningBalance = originalLoanAmount;
    
    // Simulate regular payments up to the current payment count
    for (let i = 1; i <= paymentsCount; i++) {
      const interestAmount = runningBalance * monthlyRate;
      const principalFromRegular = originalMonthlyPayment - interestAmount;
      runningBalance -= principalFromRegular;
      
      if (runningBalance < 0) runningBalance = 0;
    }
    
    // Apply extra payments to the current balance
    runningBalance = Math.max(0, runningBalance - totalExtraPayments);
    
    return Math.round(runningBalance * 100) / 100;
    
  } catch (error) {
    console.error('Error calculating amortized remaining balance:', error);
    // Fallback to simple calculation
    return Math.max(0, contract.total_payable - totalPaid);
  }
}

type Contract = Database['public']['Tables']['contracts']['Row']
type ContractInsert = Database['public']['Tables']['contracts']['Insert']
type ContractUpdate = Database['public']['Tables']['contracts']['Update']

export interface ContractWithRelations extends Contract {
  customer?: Customer
  vehicle?: Vehicle
  payments?: Payment[]
  permission_document?: PermissionDocument
}

export interface Customer {
  id: string
  first_name: string | null
  last_name: string | null
  company_name: string | null
  phone: string
  customer_type: 'individual' | 'company'
}

export interface Vehicle {
  id: string
  license_plate: string
  make: string
  model: string
  year: number
  color: string
}

export interface Payment {
  id: string
  amount: number
  payment_date: string
  due_date: string
  payment_method: 'automatic' | 'manual' | 'cash' | 'bank_transfer' | 'card_to_card'
  is_late: boolean
  days_late: number
  interest_amount: number
}

export interface PermissionDocument {
  id: string
  contract_id: string
  begin_date: string
  end_date: string
  notes: string | null
  drivers?: Driver[]
}

export interface Driver {
  id: string
  name: string
  license_number: string
  phone: string | null
  address: string | null
}

export interface PaymentScheduleItem {
  payment_id: string
  contract_id: string
  customer_id: string
  company_id: string
  amount: number
  due_date: string
  payment_method: 'automatic' | 'manual' | 'cash' | 'bank_transfer' | 'card_to_card'
}

export interface ContractSearchParams {
  status?: 'active' | 'completed' | 'defaulted' | 'open' | 'imtina_edilmis' | 'alqi_satqi' | 'tamamlanmis' | 'completed_early' | 'defaulted_closed'
  customer_id?: string
  vehicle_id?: string
  start_date_from?: string
  start_date_to?: string
  limit?: number
  offset?: number
  excludeClosed?: boolean // Only exclude closed contracts if explicitly requested
}

// Get all contracts using API
export async function getContracts(params?: ContractSearchParams): Promise<Contract[]> {
  try {
    const response = await apiClient.get('/contracts', { params });
    
    if (response.success && response.data) {
      return response.data.contracts || response.data;
    }
    
    throw new Error(response.error || 'Failed to fetch contracts');
  } catch (error) {
    console.error('Error in getContracts:', error);
    throw error;
  }
}

// Get all contracts including closed ones using API
export async function getAllContracts(params?: ContractSearchParams): Promise<Contract[]> {
  try {
    const response = await apiClient.get('/contracts/all', { params });
    
    if (response.success && response.data) {
      return response.data.contracts || response.data;
    }
    
    throw new Error(response.error || 'Failed to fetch all contracts');
  } catch (error) {
    console.error('Error in getAllContracts:', error);
    throw error;
  }
}

// Get only active contracts (for payment creation, vehicle availability, etc.)
export async function getActiveContracts(params?: ContractSearchParams): Promise<Contract[]> {
  try {
    const response = await apiClient.get('/contracts/active', { params });
    
    if (response.success && response.data) {
      return response.data.contracts || response.data;
    }
    
    throw new Error(response.error || 'Failed to fetch active contracts');
  } catch (error) {
    console.error('Error in getActiveContracts:', error);
    throw error;
  }
}

// Get contract by ID with relations
export async function getContractById(id: string): Promise<ContractWithRelations | null> {
  try {
    const response = await apiClient.get(`/contracts/${id}`);
    
    if (response.success && response.data) {
      const contract = response.data.contract || response.data;
      
      // Add default values for fields that might not exist in the database
      return {
        ...contract,
        original_monthly_payment: contract.original_monthly_payment || contract.monthly_payment,
        total_principal_paid: contract.total_principal_paid || 0,
        total_extra_payments: contract.total_extra_payments || 0,
        last_extra_payment_date: contract.last_extra_payment_date || null,
        closeDate: contract.closeDate || null,
        closeNotes: contract.closeNotes || null,
        adjusted_monthly_payment: contract.adjusted_monthly_payment || contract.monthly_payment,
        permission_document: contract.permission_document || null,
      };
    }
    
    if (response.status === 404) {
      return null; // Not found
    }
    
    throw new Error(response.error || 'Failed to fetch contract');
  } catch (error) {
    console.error('Error in getContractById:', error);
    throw error;
  }
}

// Create new contract using API
export async function createContract(contractData: ContractInsert): Promise<Contract> {
  try {
    // Calculate monthly payment if missing
    let processedData = { ...contractData };
    
    if (!processedData.monthly_payment || processedData.monthly_payment === 0) {
      const loanAmount = processedData.standard_purchase_price || processedData.down_payment;
      const monthlyRate = (processedData.yearly_interest_rate || 0) / 12 / 100;
      const totalMonths = processedData.term_months || 0;
      
      if (loanAmount && loanAmount > 0 && monthlyRate > 0 && totalMonths > 0) {
        const calculatedPayment = loanAmount * (monthlyRate * Math.pow(1 + monthlyRate, totalMonths)) / (Math.pow(1 + monthlyRate, totalMonths) - 1);
        processedData.monthly_payment = Math.round(calculatedPayment * 100) / 100;
        processedData.original_monthly_payment = processedData.monthly_payment;
        
        console.log('Calculated monthly payment for new contract:', {
          loanAmount,
          monthlyRate,
          totalMonths,
          calculatedPayment: processedData.monthly_payment
        });
      }
    }
    
    const response = await apiClient.post('/api/contracts', processedData);
    
    if (response.success && response.data) {
      return response.data.contract || response.data;
    }
    
    throw new Error(response.error || 'Failed to create contract');
  } catch (error) {
    console.error('Error in createContract:', error);
    throw error;
  }
}

// Fix missing monthly payments for existing contracts
// Synchronize payment counts and totals with actual payment records
export async function synchronizePaymentTracking(): Promise<{ updated: number; errors: string[] }> {
  try {
    console.log('🔄 Starting payment synchronization...');
    
    // Get all active contracts
    const { data: contracts, error: fetchError } = await supabase
      .from('contracts')
      .select('id, payments_count, total_paid, remaining_balance, total_payable')
      .eq('status', 'active');

    if (fetchError) {
      throw fetchError;
    }

    if (!contracts || contracts.length === 0) {
      console.log('✅ No active contracts found');
      return { updated: 0, errors: [] };
    }

    console.log(`📊 Found ${contracts.length} active contracts to synchronize`);

    const errors: string[] = [];
    let updated = 0;

    // CRITICAL FIX: Get all payments in a single request instead of individual requests
    const contractIds = contracts.map(c => c.id);
    console.log(`🔍 Loading payments for ${contractIds.length} contracts in a single request...`);
    
    const { data: allPayments, error: paymentsError } = await supabase
      .from('payments')
      .select('id, amount, contract_id, notes')
      .in('contract_id', contractIds);

    if (paymentsError) {
      console.error('❌ Error loading payments for synchronization:', paymentsError);
      return { updated: 0, errors: [`Failed to load payments: ${paymentsError.message}`] };
    }

    // Group payments by contract_id
    const paymentsByContract = new Map<string, any[]>();
    (allPayments || []).forEach(payment => {
      if (!paymentsByContract.has(payment.contract_id)) {
        paymentsByContract.set(payment.contract_id, []);
      }
      paymentsByContract.get(payment.contract_id)!.push(payment);
    });

    console.log(`📊 Loaded ${allPayments?.length || 0} payments for ${paymentsByContract.size} contracts`);

    // CRITICAL FIX: Batch all updates instead of individual requests
    const contractsToUpdate: Array<{ id: string; updates: any; contract: any }> = [];
    
    for (const contract of contracts) {
      try {
        // Get payments for this contract from the grouped data
        const payments = paymentsByContract.get(contract.id) || [];
        
        // CRITICAL FIX: Filter out extra payments when counting monthly payments
        const isExtraPayment = (payment: any) => {
          return payment.notes && (
            payment.notes.includes('Extra Payment') || 
            payment.notes.includes('Əlavə Ödəniş') ||
            payment.notes.includes('extra payment') ||
            payment.notes.includes('əlavə ödəniş')
          );
        };
        
        const monthlyPayments = payments.filter(p => !isExtraPayment(p));
        const extraPayments = payments.filter(p => isExtraPayment(p));
        
        const actualPaymentCount = monthlyPayments.length; // Only count monthly payments
        const actualTotalPaid = payments.reduce((sum, p) => sum + (p.amount || 0), 0); // Total includes all payments
        const actualTotalExtraPayments = extraPayments.reduce((sum, p) => sum + (p.amount || 0), 0);
        
        // FIXED: Calculate remaining balance using amortization schedule instead of simple subtraction
        const calculatedRemainingBalance = calculateAmortizedRemainingBalance(contract, actualTotalPaid, actualTotalExtraPayments);

        // Check if synchronization is needed
        const needsUpdate = 
          contract.payments_count !== actualPaymentCount ||
          Math.abs((contract.total_paid || 0) - actualTotalPaid) > 0.01 ||
          Math.abs((contract.remaining_balance || 0) - calculatedRemainingBalance) > 0.01;

        if (needsUpdate) {
          const updates: any = {
            payments_count: actualPaymentCount,
            total_paid: actualTotalPaid,
            remaining_balance: calculatedRemainingBalance
          };

          contractsToUpdate.push({ id: contract.id, updates, contract: { ...contract, extraPayments, actualPaymentCount, actualTotalPaid } });
        }
      } catch (error) {
        errors.push(`Contract ${contract.id}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    // CRITICAL FIX: Batch update all contracts that need updating
    if (contractsToUpdate.length > 0) {
      console.log(`🔄 Batch updating ${contractsToUpdate.length} contracts...`);
      
      // Process updates in batches to avoid overwhelming the database
      const batchSize = 10;
      for (let i = 0; i < contractsToUpdate.length; i += batchSize) {
        const batch = contractsToUpdate.slice(i, i + batchSize);
        
        // Use Promise.all to update multiple contracts in parallel
        const updatePromises = batch.map(async ({ id, updates, contract }) => {
          try {
            const { error: updateError } = await supabase
              .from('contracts')
              .update(updates)
              .eq('id', id);

            if (updateError) {
              errors.push(`Contract ${id}: ${updateError.message}`);
              return false;
            } else {
              console.log(`✅ Synchronized contract ${id}: ${contract.payments_count} → ${contract.actualPaymentCount} monthly payments (${contract.extraPayments.length} extra payments), ₼${contract.total_paid || 0} → ₼${contract.actualTotalPaid} total paid`);
              return true;
            }
          } catch (error) {
            errors.push(`Contract ${id}: ${error instanceof Error ? error.message : 'Unknown error'}`);
            return false;
          }
        });

        const results = await Promise.all(updatePromises);
        updated += results.filter(r => r).length;
      }
    }

    console.log(`🎯 Payment synchronization completed: ${updated} contracts updated, ${errors.length} errors`);
    return { updated, errors };
  } catch (error) {
    console.error('❌ Error synchronizing payments:', error);
    throw error;
  }
}

export async function fixMissingMonthlyPayments(): Promise<{ updated: number; errors: string[] }> {
  try {
    console.log('🔧 Starting to fix missing monthly payments...');
    
    // Get ALL contracts to check for incorrect monthly payments
    const { data: contracts, error: fetchError } = await supabase
      .from('contracts')
      .select('id, standard_purchase_price, down_payment, monthly_payment, original_monthly_payment, yearly_interest_rate, term_months')
      .not('standard_purchase_price', 'is', null)
      .not('yearly_interest_rate', 'is', null)
      .not('term_months', 'is', null)
      .gt('standard_purchase_price', 0)
      .gt('yearly_interest_rate', 0)
      .gt('term_months', 0);

    if (fetchError) {
      throw fetchError;
    }

    if (!contracts || contracts.length === 0) {
      console.log('✅ No contracts need monthly payment fixes');
      return { updated: 0, errors: [] };
    }

    console.log(`📊 Found ${contracts.length} contracts with missing monthly payments`);

    const errors: string[] = [];
    let updated = 0;

    for (const contract of contracts) {
      try {
        const loanAmount = contract.standard_purchase_price || contract.down_payment;
        const monthlyRate = (contract.yearly_interest_rate || 0) / 12 / 100;
        const totalMonths = contract.term_months || 0;

        if (loanAmount && loanAmount > 0 && monthlyRate > 0 && totalMonths > 0) {
          const calculatedPayment = loanAmount * (monthlyRate * Math.pow(1 + monthlyRate, totalMonths)) / (Math.pow(1 + monthlyRate, totalMonths) - 1);
          const roundedPayment = Math.round(calculatedPayment * 100) / 100;

          const updates: any = {};
          
          // Check if monthly_payment needs fixing (missing, too small, too large, or significantly wrong)
          const currentMonthlyPayment = contract.monthly_payment || 0;
          const isMonthlyPaymentWrong = !currentMonthlyPayment || 
                                       currentMonthlyPayment < 1 || 
                                       currentMonthlyPayment > 50000 ||
                                       Math.abs(currentMonthlyPayment - roundedPayment) > 50; // More aggressive threshold
          
          if (isMonthlyPaymentWrong) {
            updates.monthly_payment = roundedPayment;
            console.log(`🔧 Fixing monthly_payment for contract ${contract.id}: ${currentMonthlyPayment} → ${roundedPayment} (diff: ${Math.abs(currentMonthlyPayment - roundedPayment).toFixed(2)})`);
          }
          
          // Check if original_monthly_payment needs fixing
          const currentOriginalPayment = contract.original_monthly_payment || 0;
          const isOriginalPaymentWrong = !currentOriginalPayment || 
                                        currentOriginalPayment < 1 || 
                                        currentOriginalPayment > 50000 ||
                                        Math.abs(currentOriginalPayment - roundedPayment) > 50; // More aggressive threshold
          
          if (isOriginalPaymentWrong) {
            updates.original_monthly_payment = roundedPayment;
            console.log(`🔧 Fixing original_monthly_payment for contract ${contract.id}: ${currentOriginalPayment} → ${roundedPayment} (diff: ${Math.abs(currentOriginalPayment - roundedPayment).toFixed(2)})`);
          }

          if (Object.keys(updates).length > 0) {
            const { error: updateError } = await supabase
              .from('contracts')
              .update(updates)
              .eq('id', contract.id);

            if (updateError) {
              errors.push(`Contract ${contract.id}: ${updateError.message}`);
            } else {
              updated++;
              console.log(`✅ Fixed contract ${contract.id}: ₼${roundedPayment}`);
            }
          }
        } else {
          errors.push(`Contract ${contract.id}: Missing required data (loan: ${loanAmount}, rate: ${monthlyRate}, months: ${totalMonths})`);
        }
      } catch (error) {
        errors.push(`Contract ${contract.id}: ${error.message}`);
      }
    }

    console.log(`🎉 Fixed ${updated} contracts, ${errors.length} errors`);
    return { updated, errors };
  } catch (error) {
    console.error('❌ Error fixing missing monthly payments:', error);
    throw error;
  }
}

// Fix contracts that are incorrectly marked as completed
export async function fixIncorrectlyCompletedContracts(): Promise<{ updated: number; errors: string[] }> {
  try {
    console.log('🔧 Starting to fix incorrectly completed contracts...');
    
    // Get contracts marked as completed but still have remaining balance
    const { data: contracts, error: fetchError } = await supabase
      .from('contracts')
      .select('id, status, total_payable, total_paid, remaining_balance, payments_count, term_months')
      .eq('status', 'completed')
      .gt('remaining_balance', 0.01); // Still has significant remaining balance

    if (fetchError) {
      throw fetchError;
    }

    if (!contracts || contracts.length === 0) {
      console.log('✅ No incorrectly completed contracts found');
      return { updated: 0, errors: [] };
    }

    console.log(`📊 Found ${contracts.length} incorrectly completed contracts`);

    const errors: string[] = [];
    let updated = 0;

    // CRITICAL FIX: Batch all updates instead of individual requests
    const contractsToUpdate: Array<{ id: string; updates: any; contract: any }> = [];
    
    for (const contract of contracts) {
      try {
        // Check if this contract should actually be active
        const shouldBeActive = contract.remaining_balance > 0.01 && 
                              contract.payments_count < contract.term_months;

        if (shouldBeActive) {
          const updates = {
            status: 'active' as const,
            close_date: null,
            close_notes: null
          };

          contractsToUpdate.push({ id: contract.id, updates, contract });
        }
      } catch (error) {
        errors.push(`Contract ${contract.id}: ${error.message}`);
      }
    }

    // CRITICAL FIX: Batch update all contracts that need updating
    if (contractsToUpdate.length > 0) {
      console.log(`🔄 Batch updating ${contractsToUpdate.length} incorrectly completed contracts...`);
      
      // Process updates in batches to avoid overwhelming the database
      const batchSize = 10;
      for (let i = 0; i < contractsToUpdate.length; i += batchSize) {
        const batch = contractsToUpdate.slice(i, i + batchSize);
        
        // Use Promise.all to update multiple contracts in parallel
        const updatePromises = batch.map(async ({ id, updates, contract }) => {
          try {
            const { error: updateError } = await supabase
              .from('contracts')
              .update(updates)
              .eq('id', id);

            if (updateError) {
              errors.push(`Contract ${id}: ${updateError.message}`);
              return false;
            } else {
              console.log(`✅ Fixed contract ${id}: completed → active (₼${contract.remaining_balance} remaining)`);
              return true;
            }
          } catch (error) {
            errors.push(`Contract ${id}: ${error.message}`);
            return false;
          }
        });

        const results = await Promise.all(updatePromises);
        updated += results.filter(r => r).length;
      }
    }

    console.log(`🎉 Fixed ${updated} incorrectly completed contracts, ${errors.length} errors`);
    return { updated, errors };
  } catch (error) {
    console.error('❌ Error fixing incorrectly completed contracts:', error);
    throw error;
  }
}

// Fix contracts with incorrect payments_count due to extra payments being counted
export async function fixIncorrectPaymentCounts(): Promise<{ updated: number; errors: string[] }> {
  try {
    console.log('🔧 Starting to fix incorrect payment counts...');
    
    // Get all active contracts
    const { data: contracts, error: fetchError } = await supabase
      .from('contracts')
      .select('id, payments_count, status')
      .eq('status', 'active');

    if (fetchError) {
      throw fetchError;
    }

    if (!contracts || contracts.length === 0) {
      console.log('✅ No active contracts found');
      return { updated: 0, errors: [] };
    }

    console.log(`📊 Found ${contracts.length} active contracts to check`);

    const errors: string[] = [];
    let updated = 0;

    // Get all payments for these contracts
    const contractIds = contracts.map(c => c.id);
    const { data: allPayments, error: paymentsError } = await supabase
      .from('payments')
      .select('id, amount, contract_id, notes')
      .in('contract_id', contractIds);

    if (paymentsError) {
      throw paymentsError;
    }

    // Group payments by contract_id
    const paymentsByContract = new Map<string, any[]>();
    (allPayments || []).forEach(payment => {
      if (!paymentsByContract.has(payment.contract_id)) {
        paymentsByContract.set(payment.contract_id, []);
      }
      paymentsByContract.get(payment.contract_id)!.push(payment);
    });

    // CRITICAL FIX: Batch all updates instead of individual requests
    const contractsToUpdate: Array<{ id: string; updates: any; contract: any }> = [];
    
    for (const contract of contracts) {
      try {
        const payments = paymentsByContract.get(contract.id) || [];
        
        // Filter out extra payments when counting monthly payments
        const isExtraPayment = (payment: any) => {
          return payment.notes && (
            payment.notes.includes('Extra Payment') || 
            payment.notes.includes('Əlavə Ödəniş') ||
            payment.notes.includes('extra payment') ||
            payment.notes.includes('əlavə ödəniş')
          );
        };
        
        const monthlyPayments = payments.filter(p => !isExtraPayment(p));
        const correctPaymentCount = monthlyPayments.length;
        
        // Check if payment count needs fixing
        if (contract.payments_count !== correctPaymentCount) {
          const updates = { payments_count: correctPaymentCount };
          contractsToUpdate.push({ 
            id: contract.id, 
            updates, 
            contract: { ...contract, payments, monthlyPayments, correctPaymentCount } 
          });
        }
      } catch (error) {
        errors.push(`Contract ${contract.id}: ${error.message}`);
      }
    }

    // CRITICAL FIX: Batch update all contracts that need updating
    if (contractsToUpdate.length > 0) {
      console.log(`🔄 Batch updating ${contractsToUpdate.length} contracts with incorrect payment counts...`);
      
      // Process updates in batches to avoid overwhelming the database
      const batchSize = 10;
      for (let i = 0; i < contractsToUpdate.length; i += batchSize) {
        const batch = contractsToUpdate.slice(i, i + batchSize);
        
        // Use Promise.all to update multiple contracts in parallel
        const updatePromises = batch.map(async ({ id, updates, contract }) => {
          try {
            const { error: updateError } = await supabase
              .from('contracts')
              .update(updates)
              .eq('id', id);

            if (updateError) {
              errors.push(`Contract ${id}: ${updateError.message}`);
              return false;
            } else {
              console.log(`✅ Fixed contract ${id}: payments_count ${contract.payments_count} → ${contract.correctPaymentCount} (${contract.payments.length - contract.monthlyPayments.length} extra payments excluded)`);
              return true;
            }
          } catch (error) {
            errors.push(`Contract ${id}: ${error.message}`);
            return false;
          }
        });

        const results = await Promise.all(updatePromises);
        updated += results.filter(r => r).length;
      }
    }

    console.log(`🎉 Fixed ${updated} contracts with incorrect payment counts, ${errors.length} errors`);
    return { updated, errors };
  } catch (error) {
    console.error('❌ Error fixing incorrect payment counts:', error);
    throw error;
  }
}

// Update contract
export async function updateContract(id: string, updates: ContractUpdate): Promise<Contract> {
  try {
    const response = await apiClient.put(`/api/contracts/${id}`, updates);
    
    if (response.success && response.data) {
      return response.data.contract || response.data;
    }
    
    throw new Error(response.error || 'Failed to update contract');
  } catch (error) {
    console.error('Error in updateContract:', error);
    throw error;
  }
}

// Delete contract using API
export async function deleteContract(id: string): Promise<void> {
  try {
    const response = await apiClient.delete(`/api/contracts/${id}`);
    
    if (!response.success) {
      throw new Error(response.error || 'Failed to delete contract');
    }
  } catch (error) {
    console.error('Error in deleteContract:', error);
    throw error;
  }
}

// Get contracts by customer using API
export async function getContractsByCustomer(customerId: string): Promise<Contract[]> {
  try {
    const response = await apiClient.get('/contracts', { 
      params: { customer_id: customerId } 
    });
    
    if (response.success && response.data) {
      return (response.data as any).contracts || response.data || [];
    }
    
    throw new Error(response.error || 'Failed to fetch contracts by customer');
  } catch (error) {
    console.error('Error fetching contracts by customer:', error);
    throw error;
  }
}

// Get contracts by company using API
export async function getContractsByCompany(companyId: string): Promise<Contract[]> {
  try {
    const response = await apiClient.get('/contracts', { 
      params: { company_id: companyId } 
    });
    
    if (response.success && response.data) {
      return (response.data as any).contracts || response.data || [];
    }
    
    throw new Error(response.error || 'Failed to fetch contracts by company');
  } catch (error) {
    console.error('Error fetching contracts by company:', error);
    throw error;
  }
}

// Check if vehicle is in active contract using API
export async function isVehicleInActiveContract(vehicleId: string): Promise<boolean> {
  try {
    const response = await apiClient.get('/contracts', { 
      params: { vehicle_id: vehicleId, status: 'active,open' } 
    });
    
    if (response.success && response.data) {
      const contracts = (response.data as any).contracts || response.data || [];
      return contracts.length > 0;
    }
    
    return false; // If we can't check, assume it's not in a contract
  } catch (error) {
    console.error('Error checking vehicle contract status:', error);
    throw error;
  }
}

// Get active contract for vehicle using API
export async function getActiveContractForVehicle(vehicleId: string): Promise<Contract | null> {
  try {
    const response = await apiClient.get('/contracts', { 
      params: { vehicle_id: vehicleId, status: 'active,open' } 
    });
    
    if (response.success && response.data) {
      const contracts = (response.data as any).contracts || response.data || [];
      // Return the first active/open contract for this vehicle
      return contracts.length > 0 ? contracts[0] : null;
    }
    
    return null;
  } catch (error) {
    console.error('Error fetching active contract for vehicle:', error);
    throw error;
  }
}

// Get active contract for customer using API
export async function getActiveContractForCustomer(customerId: string): Promise<Contract | null> {
  try {
    const response = await apiClient.get('/contracts', { 
      params: { customer_id: customerId, status: 'active,open' } 
    });
    
    if (response.success && response.data) {
      const contracts = (response.data as any).contracts || response.data || [];
      return contracts.length > 0 ? contracts[0] : null;
    }
    
    return null;
  } catch (error) {
    console.error('Error fetching active contract for customer:', error);
    return null;
  }
}

// Generate payment schedule for contract
export async function generatePaymentSchedule(contractId: string): Promise<PaymentScheduleItem[]> {
  try {
    const { data, error } = await supabase.rpc('generate_payment_schedule', {
      lease_id: contractId
    })

    if (error) {
      throw error
    }

    return data || []
  } catch (error) {
    console.error('Error generating payment schedule:', error)
    throw error
  }
}

// Update contract status based on payments
export async function updateContractStatus(contractId: string): Promise<Contract> {
  try {
    // Get contract and its payments
    const { data: contract, error: contractError } = await supabase
      .from('contracts')
      .select('*, payments(*)')
      .eq('id', contractId)
      .single()

    if (contractError) {
      throw contractError
    }

    if (!contract) {
      throw new Error('Contract not found')
    }

    const payments = contract.payments || []
    const fullPayments = payments.filter(p => !p.is_partial) // Only count full payments
    const totalPayments = fullPayments.length
    const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0)
    const remainingBalance = Math.max(0, contract.total_payable - totalPaid)

    // Determine new status
    let newStatus = contract.status
    if (remainingBalance <= 0) {
      newStatus = 'completed'
    } else if (payments.some(p => p.is_late && p.days_late > 30)) {
      newStatus = 'defaulted'
    } else if (totalPayments > 0) {
      newStatus = 'active'
    }

    // Update contract
    const { data, error } = await supabase
      .from('contracts')
      .update({
        status: newStatus,
        total_paid: totalPaid,
        payments_count: totalPayments,
        remaining_balance: remainingBalance,
        last_payment_date: payments.length > 0 ? payments[payments.length - 1].payment_date : null
      })
      .eq('id', contractId)
      .select()
      .single()

    if (error) {
      throw error
    }

    return data
  } catch (error) {
    console.error('Error updating contract status:', error)
    throw error
  }
}

// Create permission document
export async function createPermissionDocument(documentData: Omit<PermissionDocument, 'id'>): Promise<PermissionDocument> {
  try {
    const { data, error } = await supabase
      .from('permission_documents')
      .insert(documentData)
      .select()
      .single()

    if (error) {
      throw error
    }

    return data
  } catch (error) {
    console.error('Error creating permission document:', error)
    throw error
  }
}

// Update permission document
export async function updatePermissionDocument(id: string, updates: Partial<PermissionDocument>): Promise<PermissionDocument> {
  try {
    const { data, error } = await supabase
      .from('permission_documents')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      throw error
    }

    return data
  } catch (error) {
    console.error('Error updating permission document:', error)
    throw error
  }
}

// Get contract statistics using API
export async function getContractStats(companyId?: string): Promise<{
  total: number
  active: number
  completed: number
  defaulted: number
  open: number
  total_value: number
  total_paid: number
  total_remaining: number
}> {
  try {
    const params: any = { limit: 1000 };
    if (companyId) {
      params.company_id = companyId;
    }

    const response = await apiClient.get('/contracts', { params });
    
    if (response.success && response.data) {
      const contracts = (response.data as any).contracts || response.data || [];
      
      const stats = {
        total: contracts.length,
        active: contracts.filter((c: any) => c.status === 'active').length,
        completed: contracts.filter((c: any) => c.status === 'completed').length,
        defaulted: contracts.filter((c: any) => c.status === 'defaulted').length,
        open: contracts.filter((c: any) => c.status === 'open').length,
        total_value: contracts.reduce((sum: number, c: any) => sum + (c.total_payable || 0), 0),
        total_paid: contracts.reduce((sum: number, c: any) => sum + (c.total_paid || 0), 0),
        total_remaining: contracts.reduce((sum: number, c: any) => sum + (c.remaining_balance || 0), 0)
      };

      return stats;
    }
    
    throw new Error(response.error || 'Failed to fetch contract stats');
  } catch (error) {
    console.error('Error fetching contract stats:', error);
    throw error;
  }
}

// Search contracts using API
export async function searchContracts(searchTerm: string, companyId?: string): Promise<Contract[]> {
  try {
    const params: any = { search: searchTerm };
    if (companyId) {
      params.company_id = companyId;
    }

    const response = await apiClient.get('/contracts', { params });
    
    if (response.success && response.data) {
      return (response.data as any).contracts || response.data || [];
    }
    
    throw new Error(response.error || 'Failed to search contracts');
  } catch (error) {
    console.error('Error searching contracts:', error);
    throw error;
  }
}

// Update contract's next due date after payment using the new systematic approach
export async function updateContractNextDueDate(contractId: string, paymentDate: Date): Promise<Contract> {
  try {
    // Use the new database function for systematic payment processing
    const { data: result, error } = await supabase
      .rpc('update_contract_next_due_date_after_payment', {
        p_contract_id: contractId,
        p_payment_date: paymentDate.toISOString().split('T')[0]
      })

    if (error) {
      throw error
    }

    // Get the updated contract
    const { data: updatedContract, error: fetchError } = await supabase
      .from('contracts')
      .select('*')
      .eq('id', contractId)
      .single()

    if (fetchError) {
      throw fetchError
    }

    return updatedContract
  } catch (error) {
    console.error('Error updating contract next due date:', error)
    throw error
  }
}

// Recalculate payment schedule after extra payment using cursor-based function
export async function recalculatePaymentSchedule(contractId: string): Promise<{ success: boolean; message: string }> {
  try {
    console.log('🔄 Recalculating payment schedule for contract:', contractId);
    
    const { data: result, error } = await supabase
      .rpc('recalc_schedule_with_cursor', {
        p_lease_id: contractId
      });

    if (error) {
      console.error('❌ Error recalculating payment schedule:', error);
      throw error;
    }

    console.log('✅ Payment schedule recalculated successfully');
    return {
      success: true,
      message: 'Payment schedule recalculated successfully'
    };
  } catch (error) {
    console.error('❌ Error recalculating payment schedule:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
}

// Recalculate all contracts with extra payments
export async function recalculateAllContractsSchedule(): Promise<{ success: boolean; results: any[] }> {
  try {
    console.log('🔄 Recalculating payment schedules for all contracts with extra payments');
    
    const { data: results, error } = await supabase
      .rpc('recalc_all_contracts_schedule');

    if (error) {
      console.error('❌ Error recalculating all contracts:', error);
      throw error;
    }

    console.log('✅ All contracts recalculated successfully:', results);
    return {
      success: true,
      results: results || []
    };
  } catch (error) {
    console.error('❌ Error recalculating all contracts:', error);
    return {
      success: false,
      results: []
    };
  }
}

// Get overdue days for a contract using the systematic approach
export async function getContractOverdueDays(contractId: string, paymentDate?: Date): Promise<number> {
  try {
    const { data: result, error } = await supabase
      .rpc('get_overdue_days', {
        p_contract_id: contractId,
        p_payment_date: paymentDate ? paymentDate.toISOString().split('T')[0] : undefined
      })

    if (error) {
      throw error
    }

    return result || 0
  } catch (error) {
    console.error('Error getting contract overdue days:', error)
    return 0
  }
}

// Check if a contract payment is overdue using the systematic approach
export async function isContractPaymentOverdue(contractId: string, paymentDate?: Date): Promise<boolean> {
  try {
    const { data: result, error } = await supabase
      .rpc('is_payment_overdue', {
        p_contract_id: contractId,
        p_payment_date: paymentDate ? paymentDate.toISOString().split('T')[0] : undefined
      })

    if (error) {
      throw error
    }

    return result || false
  } catch (error) {
    console.error('Error checking if contract payment is overdue:', error)
    return false
  }
}

// Get payment schedule for a contract
export async function getPaymentSchedule(contractId: string): Promise<{
  contract: Contract
  schedule: Array<{
    paymentNumber: number
    dueDate: string
    amount: number
    status: 'paid' | 'overdue' | 'upcoming'
  }>
}> {
  try {
    // Get the contract
    const { data: contract, error: contractError } = await supabase
      .from('contracts')
      .select('*')
      .eq('id', contractId)
      .single()

    if (contractError) {
      throw contractError
    }

    if (!contract) {
      throw new Error('Contract not found')
    }

    // Get all payments for this contract
    const { data: payments, error: paymentsError } = await supabase
      .from('payments')
      .select('*')
      .eq('contract_id', contractId)
      .order('due_date', { ascending: true })

    if (paymentsError) {
      throw paymentsError
    }

    // Generate payment schedule
    const schedule = []
    const startDate = new Date(contract.start_date)
    const today = new Date()

    for (let i = 0; i < contract.term_months; i++) {
      const dueDate = new Date(startDate)
      
      // Calculate due date based on payment interval
      // First payment should be 1 month after start date
      // Subsequent payments should be on the same day of the month as start date
      switch (contract.payment_interval) {
        case 'weekly':
          if (i === 0) {
            dueDate.setDate(dueDate.getDate() + 7) // First payment: 1 week after start
          } else {
            dueDate.setDate(dueDate.getDate() + ((i + 1) * 7)) // Subsequent: same day pattern
          }
          break
        case 'bi_weekly':
          if (i === 0) {
            dueDate.setDate(dueDate.getDate() + 14) // First payment: 2 weeks after start
          } else {
            dueDate.setDate(dueDate.getDate() + ((i + 1) * 14)) // Subsequent: same day pattern
          }
          break
        case 'monthly':
          if (i === 0) {
            dueDate.setMonth(dueDate.getMonth() + 1) // First payment: 1 month after start
          } else {
            dueDate.setMonth(dueDate.getMonth() + (i + 1)) // Subsequent: same day of month
          }
          break
        case 'quarterly':
          if (i === 0) {
            dueDate.setMonth(dueDate.getMonth() + 3) // First payment: 3 months after start
          } else {
            dueDate.setMonth(dueDate.getMonth() + ((i + 1) * 3)) // Subsequent: same day pattern
          }
          break
        case 'semi_annually':
          if (i === 0) {
            dueDate.setMonth(dueDate.getMonth() + 6) // First payment: 6 months after start
          } else {
            dueDate.setMonth(dueDate.getMonth() + ((i + 1) * 6)) // Subsequent: same day pattern
          }
          break
        case 'annually':
          if (i === 0) {
            dueDate.setFullYear(dueDate.getFullYear() + 1) // First payment: 1 year after start
          } else {
            dueDate.setFullYear(dueDate.getFullYear() + (i + 1)) // Subsequent: same day pattern
          }
          break
        default:
          if (i === 0) {
            dueDate.setMonth(dueDate.getMonth() + 1) // First payment: 1 month after start
          } else {
            dueDate.setMonth(dueDate.getMonth() + (i + 1)) // Subsequent: same day of month
          }
      }

      const dueDateStr = dueDate.toISOString().split('T')[0]
      const payment = payments?.find(p => p.due_date === dueDateStr)
      
      let status: 'paid' | 'overdue' | 'upcoming'
      if (payment) {
        status = 'paid'
      } else if (dueDate < today) {
        status = 'overdue'
      } else {
        status = 'upcoming'
      }

      // Determine the correct monthly payment amount
      let monthlyPaymentAmount = contract.monthly_payment; // Default to original
      
      // If there are extra payments and we're past the extra payment point
      if (contract.total_extra_payments > 0 && contract.adjusted_monthly_payment) {
        // Check if this payment is after the extra payment was applied
        // Based on the payment schedule, extra payment is applied at payment 20
        if (i + 1 > 20) {
          monthlyPaymentAmount = contract.adjusted_monthly_payment;
        }
      }
      
      // Special handling for payment 20 (extra payment month)
      if (i + 1 === 20 && contract.total_extra_payments > 0) {
        // Payment 20 shows the original monthly payment + extra payment
        monthlyPaymentAmount = contract.monthly_payment + contract.total_extra_payments;
      }

      schedule.push({
        paymentNumber: i + 1,
        dueDate: dueDateStr,
        amount: monthlyPaymentAmount,
        status
      })
    }

    return {
      contract,
      schedule
    }
  } catch (error) {
    console.error('Error getting payment schedule:', error)
    throw error
  }
}

// Update contract after extra payment and return new monthly payment
export async function updateMonthlyPaymentAfterExtraPayment(contractId: string, extraAmount: number): Promise<number> {
  try {
    console.log('🔧 updateMonthlyPaymentAfterExtraPayment called with:', {
      contractId,
      extraAmount
    });
    
    // Validate inputs
    if (!contractId) {
      throw new Error('Contract ID is required');
    }
    
    // If extraAmount is 0, this means we want to recalculate existing extra payments
    if (extraAmount === 0) {
      console.log('🔄 Recalculating monthly payment for existing extra payments...');
      
      // Get the contract to check if it has extra payments
      const contract = await getContractById(contractId);
      if (!contract) {
        throw new Error('Contract not found');
      }
      
      if (!contract.total_extra_payments || contract.total_extra_payments <= 0) {
        // No extra payments, return original monthly payment
        return contract.original_monthly_payment || contract.monthly_payment;
      }
      
      // Recalculate with existing extra payments
      const originalLoanAmount = contract.standard_purchase_price - contract.down_payment;
      const remainingBalance = originalLoanAmount - contract.total_extra_payments;
      const remainingMonths = contract.term_months - contract.payments_count;
      const monthlyRate = contract.yearly_interest_rate / 12 / 100;
      
      if (remainingMonths > 0 && monthlyRate > 0 && remainingBalance > 0) {
        const newMonthlyPayment = remainingBalance * (monthlyRate * Math.pow(1 + monthlyRate, remainingMonths)) / (Math.pow(1 + monthlyRate, remainingMonths) - 1);
        return Math.round(newMonthlyPayment * 100) / 100;
      } else {
        return contract.original_monthly_payment || contract.monthly_payment;
      }
    }
    
    if (extraAmount < 0) {
      throw new Error('Extra payment amount must be greater than or equal to zero');
    }

    console.log('📡 Calling Supabase RPC function...');
    
    // Call the database function to update extra payment tracking and get new monthly payment
    const { data, error } = await supabase
      .rpc('update_monthly_payment_after_extra_payment', {
        p_contract_id: contractId,
        p_extra_amount: extraAmount
      })

    console.log('📡 Supabase RPC response:', {
      data,
      error,
      hasError: !!error
    });

    if (error) {
      console.error('❌ Database function error:', error);
      throw new Error(`Failed to update extra payment: ${error.message}`);
    }

    console.log('✅ Database function successful, returning:', data);
    
    // Return the new monthly payment
    return data || 0;
  } catch (error) {
    console.error('❌ Error updating extra payment:', error);
    console.error('❌ Error stack:', error.stack);
    throw error
  }
}

// Reset monthly payment to original (for testing/debugging)
export async function resetMonthlyPaymentToOriginal(contractId: string): Promise<void> {
  try {
    const { error } = await supabase
      .rpc('reset_monthly_payment_to_original', {
        p_contract_id: contractId
      })

    if (error) {
      throw error
    }
  } catch (error) {
    console.error('Error resetting monthly payment to original:', error)
    throw error
  }
}

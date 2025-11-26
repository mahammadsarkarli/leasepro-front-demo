import { apiClient } from "./apiClient";
import type { Database } from "./supabaseClient";
import { supabase } from "./supabaseClient";

type Payment = Database["public"]["Tables"]["payments"]["Row"];
type PaymentInsert = Database["public"]["Tables"]["payments"]["Insert"];
type PaymentUpdate = Database["public"]["Tables"]["payments"]["Update"];

export interface PaymentWithRelations extends Payment {
  contract?: Contract;
  customer?: Customer;
}

export interface Contract {
  id: string;
  customer_id: string;
  vehicle_id: string;
  monthly_payment: number;
  total_payable: number;
  remaining_balance: number;
  status: "active" | "completed" | "defaulted" | "open";
}

export interface Customer {
  id: string;
  first_name: string | null;
  last_name: string | null;
  company_name: string | null;
  phone: string;
}

export interface PaymentSearchParams {
  contract_id?: string;
  customer_id?: string;
  payment_method?:
    | "automatic"
    | "manual"
    | "cash"
    | "bank_transfer"
    | "card_to_card";
  is_late?: boolean;
  due_date_from?: string;
  due_date_to?: string;
  payment_date_from?: string;
  payment_date_to?: string;
  limit?: number;
  offset?: number;
}

// Get all payments using API
export async function getPayments(
  params?: PaymentSearchParams
): Promise<Payment[]> {
  try {
    // Convert params to API query parameters
    const queryParams: Record<string, any> = {};
    
    if (params?.contract_id) queryParams.contract_id = params.contract_id;
    if (params?.customer_id) queryParams.customer_id = params.customer_id;
    if (params?.payment_method) queryParams.payment_method = params.payment_method;
    if (params?.is_late !== undefined) queryParams.is_late = params.is_late;
    if (params?.due_date_from) queryParams.start_date = params.due_date_from;
    if (params?.due_date_to) queryParams.end_date = params.due_date_to;
    if (params?.payment_date_from) queryParams.payment_date_from = params.payment_date_from;
    if (params?.payment_date_to) queryParams.payment_date_to = params.payment_date_to;
    if (params?.limit) queryParams.limit = params.limit;
    if (params?.offset) queryParams.page = Math.floor(params.offset / (params.limit || 10)) + 1;

    console.log("🔍 API Request - PaymentSearchParams:", params);
    console.log("🔍 API Request - QueryParams:", queryParams);

    const response = await apiClient.get<{ payments: Payment[] }>('/payments', queryParams);

    if (!response.success) {
      throw new Error(response.error || 'Failed to fetch payments');
    }

    const payments = response.data?.payments || [];

    return payments;
  } catch (error) {
    console.error("Error fetching payments:", error);
    throw error;
  }
}

// Get payment by ID with relations using API
export async function getPaymentById(
  id: string
): Promise<PaymentWithRelations | null> {
  try {
    const response = await apiClient.get<{ payment: PaymentWithRelations }>(`/payments/${id}`);

    if (!response.success) {
      if (response.error?.includes('not found')) {
        return null;
      }
      throw new Error(response.error || 'Failed to fetch payment');
    }

    return response.data?.payment || null;
  } catch (error) {
    console.error("Error fetching payment:", error);
    throw error;
  }
}

// Create new payment with enhanced error handling and minimal snake_case payload
type PaymentMethod = "cash" | "card" | "transfer"; // adjust to your DB enum if different

function isISODate(s: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(s);
}

/** Map UI selection to DB enum. Keep labels in sync with your UI. */
export function mapUiMethodToEnum(ui: string): PaymentMethod {
  const x = ui.trim().toLowerCase();
  if (x === "nağd" || x === "nagd" || x === "cash") return "cash";
  if (x === "kart" || x === "card") return "card";
  if (x === "köçürmə" || x === "kocurme" || x === "transfer") return "transfer";
  // Default to 'cash' to avoid enum errors if UI sends unexpected text.
  return "cash";
}

export async function createPayment(opts: {
  contractId: string; // contract uuid
  customerId: string; // customer uuid
  companyId: string; // company uuid
  amount: number; // > 0
  dateISO: string; // 'YYYY-MM-DD'
  methodUI: string; // UI label; will be mapped to enum
  isExtra?: boolean; // true for extra payments
  isPartial?: boolean; // true for partial payments
  notes?: string | null;
  dueDate?: string; // due date (defaults to payment date)
  expectedAmount?: number; // expected payment amount
  paymentPeriod?: number; // payment period number
  treatAsOnTime?: boolean; // whether to treat payment as on-time (ignore interest)
  interestAmount?: number; // calculated interest amount
  isLate?: boolean; // whether payment is late
  daysLate?: number; // number of days late
}) {
  const { 
    contractId, 
    customerId, 
    companyId, 
    amount, 
    dateISO, 
    methodUI, 
    isExtra = false, 
    isPartial = false, 
    notes,
    dueDate = dateISO,
    expectedAmount,
    paymentPeriod = 1,
    treatAsOnTime = false,
    interestAmount = 0,
    isLate = false,
    daysLate = 0
  } = opts;

  // Build API payload
  const method = mapUiMethodToEnum(methodUI);
  const payload = {
    contract_id: contractId,
    customer_id: customerId,
    company_id: companyId,
    amount: Number(amount),
    payment_date: dateISO,
    due_date: dueDate,
    payment_method: method,
    notes: notes ?? null,
    is_partial: isPartial,
    is_extra: isExtra,
    interest_amount: treatAsOnTime ? 0 : Number(interestAmount),
    is_late: treatAsOnTime ? false : isLate,
    days_late: treatAsOnTime ? 0 : Number(daysLate),
    expected_amount: expectedAmount,
    payment_period: paymentPeriod,
  };

  // Validate required fields
  const missing: string[] = [];
  if (!payload.contract_id) missing.push("contract_id");
  if (!payload.customer_id) missing.push("customer_id");
  if (!payload.company_id) missing.push("company_id");
  if (!(payload.amount > 0)) missing.push("amount");
  if (!payload.payment_date || !isISODate(payload.payment_date))
    missing.push("payment_date");
  if (!payload.due_date || !isISODate(payload.due_date))
    missing.push("due_date");
  if (!payload.payment_method) missing.push("payment_method");

  if (missing.length)
    throw new Error(`Required fields missing/invalid: ${missing.join(", ")}`);

  console.debug("[createPayment] API payload →", payload);
  console.log('🔍 createPayment Debug - isPartial parameter:', isPartial, 'payload.is_partial:', payload.is_partial);

  // Create payment via API
  const response = await apiClient.post<{ payment: Payment }>('/api/payments', payload);

  if (!response.success) {
    throw new Error(response.error || 'Failed to create payment');
  }

  if (!response.data?.payment) {
    throw new Error('Payment creation succeeded but no payment data returned');
  }
  return response.data.payment;
}

// Legacy function for backward compatibility
export async function createPaymentLegacy(opts: {
  contractId: string; // contract uuid
  customerId: string; // customer uuid
  companyId: string; // company uuid
  amount: number; // > 0
  dateISO: string; // 'YYYY-MM-DD'
  methodUI: string; // UI label; will be mapped to enum
  isExtra: boolean; // true only for extra payments
  notes?: string | null;
}) {
  const { contractId, customerId, companyId, amount, dateISO, methodUI, isExtra, notes } = opts;

  const payment = await createPayment({
    contractId,
    customerId,
    companyId,
    amount,
    dateISO,
    methodUI,
    isExtra,
    isPartial: false,
    notes
  });
  return payment;
}

// Update payment using API
export async function updatePayment(
  id: string,
  updates: PaymentUpdate
): Promise<Payment> {
  try {
    const response = await apiClient.put<{ payment: Payment }>(`/api/payments/${id}`, updates);

    if (!response.success) {
      throw new Error(response.error || 'Failed to update payment');
    }

    if (!response.data?.payment) {
      throw new Error('Payment update succeeded but no payment data returned');
    }
    return response.data.payment;
  } catch (error) {
    console.error("Error updating payment:", error);
    throw error;
  }
}

// Delete payment using API
export async function deletePayment(id: string): Promise<void> {
  try {
    const response = await apiClient.delete(`/api/payments/${id}`);

    if (!response.success) {
      throw new Error(response.error || 'Failed to delete payment');
    }
  } catch (error) {
    console.error("Error deleting payment:", error);
    throw error;
  }
}

// Get payments by contract using API
export async function getPaymentsByContract(
  contractId: string
): Promise<Payment[]> {
  try {
    const response = await apiClient.get<{ payments: Payment[] }>(`/contracts/${contractId}/payments`);

    if (!response.success) {
      throw new Error(response.error || 'Failed to fetch contract payments');
    }

    return response.data?.payments || [];
  } catch (error) {
    console.error("Error fetching payments by contract:", error);
    throw error;
  }
}

// Get enriched payments for a contract using API
export async function getPaymentsEnrichedPublic(
  contractId: string
): Promise<any[]> {
  try {
    // Use the regular getPaymentsByContract function since API provides enriched data
    const payments = await getPaymentsByContract(contractId);
    return payments;
  } catch (error) {
    console.error("Error fetching enriched payments:", error);
    throw error;
  }
}

// Get contract month progress using API
export async function getContractMonthProgress(
  contractId: string
): Promise<any> {
  try {
    // For now, return basic contract info since we removed the RPC function
    // This can be enhanced later with API endpoint if needed
    const response = await apiClient.get<{ contract: any }>(`/contracts/${contractId}`);
    
    if (!response.success) {
      throw new Error(response.error || 'Failed to fetch contract');
    }

    // Return basic contract data as month progress
    return {
      contract_id: contractId,
      monthly_payment: response.data?.contract?.monthly_payment || 0,
      remaining_balance: response.data?.contract?.remaining_balance || 0,
      payments_count: response.data?.contract?.payments_count || 0,
    };
  } catch (error) {
    console.error("Error fetching contract month progress:", error);
    throw error;
  }
}

// Get payments by customer using API
export async function getPaymentsByCustomer(
  customerId: string
): Promise<Payment[]> {
  try {
    const response = await apiClient.get('/payments', { 
      params: { customer_id: customerId } 
    });

    if (response.success && response.data) {
      return (response.data as any).payments || response.data || [];
    }

    throw new Error(response.error || 'Failed to fetch payments by customer');
  } catch (error) {
    console.error("Error fetching payments by customer:", error);
    throw error;
  }
}

// Get payments by company using API
export async function getPaymentsByCompany(
  companyId: string
): Promise<Payment[]> {
  try {
    const response = await apiClient.get('/payments', { 
      params: { company_id: companyId } 
    });

    if (response.success && response.data) {
      return (response.data as any).payments || response.data || [];
    }

    throw new Error(response.error || 'Failed to fetch payments by company');
  } catch (error) {
    console.error("Error fetching payments by company:", error);
    throw error;
  }
}

// Mark payment as paid using API
export async function markPaymentAsPaid(
  paymentId: string,
  paidAt?: string
): Promise<boolean> {
  try {
    const response = await apiClient.put<{ payment: Payment }>(`/api/payments/${paymentId}`, {
      status: 'completed',
      payment_date: paidAt || new Date().toISOString(),
    });

    if (!response.success) {
      throw new Error(response.error || 'Failed to mark payment as paid');
    }

    return true;
  } catch (error) {
    console.error("Error marking payment as paid:", error);
    throw error;
  }
}

// Get overdue payments using API
export async function getOverduePayments(
  companyId?: string
): Promise<Payment[]> {
  try {
    const queryParams: Record<string, any> = {};
    if (companyId) queryParams.company_id = companyId;

    const response = await apiClient.get<{ overdueContracts: any[] }>('/payments/overdue', queryParams);

    if (!response.success) {
      throw new Error(response.error || 'Failed to fetch overdue payments');
    }

    // Extract payments from overdue contracts
    const overduePayments: Payment[] = [];
    response.data?.overdueContracts?.forEach((contract: any) => {
      if (contract.payments) {
        overduePayments.push(...contract.payments);
      }
    });

    return overduePayments;
  } catch (error) {
    console.error("Error fetching overdue payments:", error);
    throw error;
  }
}

// Get payments due today using API
export async function getPaymentsDueToday(
  companyId?: string
): Promise<Payment[]> {
  try {
    const today = new Date().toISOString().split("T")[0];
    const params: any = { due_date: today };
    
    if (companyId) {
      params.company_id = companyId;
    }

    const response = await apiClient.get('/payments', { params });

    if (response.success && response.data) {
      return (response.data as any).payments || response.data || [];
    }

    throw new Error(response.error || 'Failed to fetch payments due today');
  } catch (error) {
    console.error("Error fetching payments due today:", error);
    throw error;
  }
}

// Get upcoming payments (due in next 7 days) using API
export async function getUpcomingPayments(
  companyId?: string
): Promise<Payment[]> {
  try {
    const today = new Date();
    const nextWeek = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
    const todayStr = today.toISOString().split("T")[0];
    const nextWeekStr = nextWeek.toISOString().split("T")[0];

    const params: any = { 
      start_date: todayStr,
      end_date: nextWeekStr
    };
    
    if (companyId) {
      params.company_id = companyId;
    }

    const response = await apiClient.get('/payments', { params });

    if (response.success && response.data) {
      return (response.data as any).payments || response.data || [];
    }

    throw new Error(response.error || 'Failed to fetch upcoming payments');
  } catch (error) {
    console.error("Error fetching upcoming payments:", error);
    throw error;
  }
}

// Calculate interest for late payment
export async function calculateLatePaymentInterest(
  paymentId: string,
  dailyInterestRate: number
): Promise<number> {
  try {
    const { data: payment, error } = await supabase
      .from("payments")
      .select("amount, days_late")
      .eq("id", paymentId)
      .single();

    if (error) {
      throw error;
    }

    if (!payment) {
      throw new Error("Payment not found");
    }

    const interest =
      ((payment.amount * dailyInterestRate) / 100) * payment.days_late;
    return Math.round(interest * 100) / 100; // Round to 2 decimal places
  } catch (error) {
    console.error("Error calculating late payment interest:", error);
    throw error;
  }
}

// Update payment interest amount
export async function updatePaymentInterest(
  paymentId: string,
  interestAmount: number
): Promise<Payment> {
  try {
    const { data, error } = await supabase
      .from("payments")
      .update({ interest_amount: interestAmount })
      .eq("id", paymentId)
      .select()
      .single();

    if (error) {
      throw error;
    }

    return data;
  } catch (error) {
    console.error("Error updating payment interest:", error);
    throw error;
  }
}

// Get payment statistics using API
export async function getPaymentStats(companyId?: string): Promise<{
  total: number;
  total_amount: number;
  total_interest: number;
  on_time: number;
  late: number;
  by_method: Record<string, number>;
  by_month: Record<string, number>;
}> {
  try {
    const queryParams: Record<string, any> = {};
    if (companyId) queryParams.company_id = companyId;

    const response = await apiClient.get<{ stats: any }>('/payments/stats', queryParams);

    if (!response.success) {
      throw new Error(response.error || 'Failed to fetch payment statistics');
    }

    const stats = response.data?.stats || {
      totalAmount: 0,
      totalCount: 0,
      byType: {},
      byStatus: {},
      monthlyAmount: {}
    };

    return {
      total: stats.totalCount || 0,
      total_amount: stats.totalAmount || 0,
      total_interest: 0, // Not available in current API
      on_time: stats.byStatus?.completed || 0,
      late: stats.byStatus?.overdue || 0,
      by_method: stats.byType || {},
      by_month: stats.monthlyAmount || {},
    };
  } catch (error) {
    console.error("Error fetching payment stats:", error);
    throw error;
  }
}

// Search payments
export async function searchPayments(
  searchTerm: string,
  companyId?: string
): Promise<Payment[]> {
  try {
    // For complex searches across related tables, we'll use a simpler approach
    let query = supabase
      .from("payments")
      .select(
        `
        *,
        contract:contracts (
          id
        ),
        customer:customers (
          first_name,
          last_name,
          company_name
        )
      `
      )
      .order("created_at", { ascending: false });

    if (companyId) {
      query = query.eq("company_id", companyId);
    }

    const { data, error } = await query;

    if (error) {
      throw error;
    }

    if (!data) return [];

    // Filter the results in JavaScript for better search across related fields
    const searchLower = searchTerm.toLowerCase();
    const searchNumber = parseFloat(searchTerm);

    return data.filter((payment) => {
      const customer = payment.customer;

      return (
        (customer?.first_name &&
          customer.first_name.toLowerCase().includes(searchLower)) ||
        (customer?.last_name &&
          customer.last_name.toLowerCase().includes(searchLower)) ||
        (customer?.company_name &&
          customer.company_name.toLowerCase().includes(searchLower)) ||
        (searchNumber && payment.amount === searchNumber)
      );
    });
  } catch (error) {
    console.error("Error searching payments:", error);
    throw error;
  }
}

// Bulk create payments (for payment schedule)
export async function bulkCreatePayments(
  payments: PaymentInsert[]
): Promise<Payment[]> {
  try {
    const { data, error } = await supabase
      .from("payments")
      .insert(payments)
      .select();

    if (error) {
      throw error;
    }

    return data || [];
  } catch (error) {
    console.error("Error bulk creating payments:", error);
    throw error;
  }
}

// Create regular monthly payment
export async function createMonthlyPayment(opts: {
  contractId: string;
  customerId: string;
  companyId: string;
  amount: number;
  dateISO: string;
  methodUI: string;
  notes?: string | null;
  dueDate?: string;
  expectedAmount?: number;
  paymentPeriod?: number;
}): Promise<Payment> {
  const payment = await createPayment({
    ...opts,
    isExtra: false,
    isPartial: false
  });
  return payment;
}

// Create extra payment
export async function createExtraPayment(opts: {
  contractId: string;
  customerId: string;
  companyId: string;
  amount: number;
  dateISO: string;
  methodUI: string;
  notes?: string | null;
  dueDate?: string;
}): Promise<Payment> {
  const payment = await createPayment({
    ...opts,
    isExtra: true,
    isPartial: false
  });
  return payment;
}

// Create partial payment
export async function createPartialPayment(opts: {
  contractId: string;
  customerId: string;
  companyId: string;
  amount: number;
  dateISO: string;
  methodUI: string;
  notes?: string | null;
  dueDate?: string;
  expectedAmount?: number;
  paymentPeriod?: number;
}): Promise<Payment> {
  const payment = await createPayment({
    ...opts,
    isExtra: false,
    isPartial: true
  });
  return payment;
}

// Get partial payments for a contract in a specific month
export async function getPartialPaymentsForMonth(
  contractId: string,
  year: number,
  month: number
): Promise<Payment[]> {
  try {
    const startDate = new Date(year, month - 1, 1).toISOString().split('T')[0];
    const endDate = new Date(year, month, 0).toISOString().split('T')[0];

    const response = await apiClient.get<{ payments: Payment[] }>('/payments', {
      contract_id: contractId,
      is_partial: true,
      is_extra: false,
      start_date: startDate,
      end_date: endDate
    });

    if (!response.success) {
      throw new Error(response.error || 'Failed to fetch partial payments');
    }

    return response.data?.payments || [];
  } catch (error) {
    console.error("Error fetching partial payments:", error);
    throw error;
  }
}

// Calculate total partial payments for a contract in a specific month
export async function getTotalPartialPaymentsForMonth(
  contractId: string,
  year: number,
  month: number
): Promise<number> {
  try {
    const partialPayments = await getPartialPaymentsForMonth(contractId, year, month);
    return partialPayments.reduce((sum, payment) => sum + payment.amount, 0);
  } catch (error) {
    console.error("Error calculating total partial payments:", error);
    return 0;
  }
}

// Fix principal paid calculations for all contracts
export const fixPrincipalPaid = async (): Promise<{
  success: boolean;
  message: string;
  updated: number;
  errors?: string[];
}> => {
  try {
    const response = await apiClient.post('/api/payments/fix-principal-paid');
    return response as any;
  } catch (error) {
    console.error('Error fixing principal paid calculations:', error);
    throw error;
  }
};

// Fix all remaining balances for all contracts
export const fixAllRemainingBalances = async (): Promise<{
  success: boolean;
  message: string;
  updated: number;
  errors?: string[];
}> => {
  try {
    const response = await apiClient.post('/api/payments/fix-all-remaining-balances');
    
    console.log('🔍 Backend response:', response);
    
    // The backend returns the data directly, not wrapped in a data property
    // So we return the response itself
    return response as any;
  } catch (error) {
    console.error('Error fixing remaining balances:', error);
    throw error;
  }
};
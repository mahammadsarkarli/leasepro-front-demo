import { supabase } from './supabaseClient'
import type { Database } from './supabaseClient'

type Payment = Database['public']['Tables']['payments']['Row']
type PaymentInsert = Database['public']['Tables']['payments']['Insert']
type PaymentUpdate = Database['public']['Tables']['payments']['Update']

export interface PaymentWithRelations extends Payment {
  contract?: Contract
  customer?: Customer
}

export interface Contract {
  id: string
  customer_id: string
  vehicle_id: string
  monthly_payment: number
  total_payable: number
  remaining_balance: number
  status: 'active' | 'completed' | 'defaulted' | 'open'
}

export interface Customer {
  id: string
  first_name: string | null
  last_name: string | null
  company_name: string | null
  phone: string
}

export interface PaymentSearchParams {
  contract_id?: string
  customer_id?: string
  payment_method?: 'automatic' | 'manual' | 'cash' | 'bank_transfer' | 'card_to_card'
  is_late?: boolean
  due_date_from?: string
  due_date_to?: string
  payment_date_from?: string
  payment_date_to?: string
  limit?: number
  offset?: number
}

// Get all payments (filtered by user's company)
export async function getPayments(params?: PaymentSearchParams): Promise<Payment[]> {
  try {
    let query = supabase
      .from('payments')
      .select('*')
      .order('created_at', { ascending: false })

    // Apply filters
    if (params?.contract_id) {
      query = query.eq('contract_id', params.contract_id)
    }

    if (params?.customer_id) {
      query = query.eq('customer_id', params.customer_id)
    }

    if (params?.payment_method) {
      query = query.eq('payment_method', params.payment_method)
    }

    if (params?.is_late !== undefined) {
      query = query.eq('is_late', params.is_late)
    }

    if (params?.due_date_from) {
      query = query.gte('due_date', params.due_date_from)
    }

    if (params?.due_date_to) {
      query = query.lte('due_date', params.due_date_to)
    }

    if (params?.payment_date_from) {
      console.log("🔍 Backend - Filtering payments from date:", params.payment_date_from);
      query = query.gte('payment_date', params.payment_date_from)
    }

    if (params?.payment_date_to) {
      console.log("🔍 Backend - Filtering payments to date:", params.payment_date_to);
      query = query.lte('payment_date', params.payment_date_to)
    }

    if (params?.limit) {
      query = query.limit(params.limit)
    }

    if (params?.offset) {
      query = query.range(params.offset, params.offset + (params.limit || 50) - 1)
    }

    const { data, error } = await query

    if (error) {
      throw error
    }

    console.log("🔍 Backend - Final payment count:", data?.length || 0);
    console.log("🔍 Backend - Date filters applied:", {
      from: params?.payment_date_from,
      to: params?.payment_date_to
    });

    return data || []
  } catch (error) {
    console.error('Error fetching payments:', error)
    throw error
  }
}

// Get payment by ID with relations
export async function getPaymentById(id: string): Promise<PaymentWithRelations | null> {
  try {
    const { data, error } = await supabase
      .from('payments')
      .select(`
        *,
        contract:contracts (
          id,
          customer_id,
          vehicle_id,
          monthly_payment,
          total_payable,
          remaining_balance,
          status
        ),
        customer:customers (
          id,
          first_name,
          last_name,
          company_name,
          phone
        )
      `)
      .eq('id', id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return null // Not found
      }
      throw error
    }

    return data
  } catch (error) {
    console.error('Error fetching payment:', error)
    throw error
  }
}

// Create new payment
export async function createPayment(paymentData: PaymentInsert): Promise<Payment> {
  try {
    const { data, error } = await supabase
      .from('payments')
      .insert(paymentData)
      .select()
      .single()

    if (error) {
      throw error
    }

    return data
  } catch (error) {
    console.error('Error creating payment:', error)
    throw error
  }
}

// Update payment
export async function updatePayment(id: string, updates: PaymentUpdate): Promise<Payment> {
  try {
    const { data, error } = await supabase
      .from('payments')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      throw error
    }

    return data
  } catch (error) {
    console.error('Error updating payment:', error)
    throw error
  }
}

// Delete payment
export async function deletePayment(id: string): Promise<void> {
  try {
    const { error } = await supabase
      .from('payments')
      .delete()
      .eq('id', id)

    if (error) {
      throw error
    }
  } catch (error) {
    console.error('Error deleting payment:', error)
    throw error
  }
}

// Get payments by contract
export async function getPaymentsByContract(contractId: string): Promise<Payment[]> {
  try {
    const { data, error } = await supabase
      .from('payments')
      .select('*')
      .eq('contract_id', contractId)
      .order('due_date', { ascending: true })

    if (error) {
      throw error
    }

    return data || []
  } catch (error) {
    console.error('Error fetching payments by contract:', error)
    throw error
  }
}

// Get payments by customer
export async function getPaymentsByCustomer(customerId: string): Promise<Payment[]> {
  try {
    const { data, error } = await supabase
      .from('payments')
      .select('*')
      .eq('customer_id', customerId)
      .order('created_at', { ascending: false })

    if (error) {
      throw error
    }

    return data || []
  } catch (error) {
    console.error('Error fetching payments by customer:', error)
    throw error
  }
}

// Get payments by company
export async function getPaymentsByCompany(companyId: string): Promise<Payment[]> {
  try {
    const { data, error } = await supabase
      .from('payments')
      .select('*')
      .eq('company_id', companyId)
      .order('created_at', { ascending: false })

    if (error) {
      throw error
    }

    return data || []
  } catch (error) {
    console.error('Error fetching payments by company:', error)
    throw error
  }
}

// Mark payment as paid using RPC function
export async function markPaymentAsPaid(paymentId: string, paidAt?: string): Promise<boolean> {
  try {
    const { data, error } = await supabase.rpc('mark_payment_paid', {
      payment_id: paymentId,
      paid_at: paidAt || new Date().toISOString()
    })

    if (error) {
      throw error
    }

    return data
  } catch (error) {
    console.error('Error marking payment as paid:', error)
    throw error
  }
}

// Get overdue payments
export async function getOverduePayments(companyId?: string): Promise<Payment[]> {
  try {
    let query = supabase
      .from('payments')
      .select('*')
      .eq('is_late', true)
      .order('days_late', { ascending: false })

    if (companyId) {
      query = query.eq('company_id', companyId)
    }

    const { data, error } = await query

    if (error) {
      throw error
    }

    return data || []
  } catch (error) {
    console.error('Error fetching overdue payments:', error)
    throw error
  }
}

// Get payments due today
export async function getPaymentsDueToday(companyId?: string): Promise<Payment[]> {
  try {
    const today = new Date().toISOString().split('T')[0]
    
    let query = supabase
      .from('payments')
      .select('*')
      .eq('due_date', today)
      .order('amount', { ascending: false })

    if (companyId) {
      query = query.eq('company_id', companyId)
    }

    const { data, error } = await query

    if (error) {
      throw error
    }

    return data || []
  } catch (error) {
    console.error('Error fetching payments due today:', error)
    throw error
  }
}

// Get upcoming payments (due in next 7 days)
export async function getUpcomingPayments(companyId?: string): Promise<Payment[]> {
  try {
    const today = new Date()
    const nextWeek = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000)
    const todayStr = today.toISOString().split('T')[0]
    const nextWeekStr = nextWeek.toISOString().split('T')[0]
    
    let query = supabase
      .from('payments')
      .select('*')
      .gte('due_date', todayStr)
      .lte('due_date', nextWeekStr)
      .order('due_date', { ascending: true })

    if (companyId) {
      query = query.eq('company_id', companyId)
    }

    const { data, error } = await query

    if (error) {
      throw error
    }

    return data || []
  } catch (error) {
    console.error('Error fetching upcoming payments:', error)
    throw error
  }
}

// Calculate interest for late payment
export async function calculateLatePaymentInterest(
  paymentId: string,
  dailyInterestRate: number
): Promise<number> {
  try {
    const { data: payment, error } = await supabase
      .from('payments')
      .select('amount, days_late')
      .eq('id', paymentId)
      .single()

    if (error) {
      throw error
    }

    if (!payment) {
      throw new Error('Payment not found')
    }

    const interest = (payment.amount * dailyInterestRate / 100) * payment.days_late
    return Math.round(interest * 100) / 100 // Round to 2 decimal places
  } catch (error) {
    console.error('Error calculating late payment interest:', error)
    throw error
  }
}

// Update payment interest amount
export async function updatePaymentInterest(paymentId: string, interestAmount: number): Promise<Payment> {
  try {
    const { data, error } = await supabase
      .from('payments')
      .update({ interest_amount: interestAmount })
      .eq('id', paymentId)
      .select()
      .single()

    if (error) {
      throw error
    }

    return data
  } catch (error) {
    console.error('Error updating payment interest:', error)
    throw error
  }
}

// Get payment statistics
export async function getPaymentStats(companyId?: string): Promise<{
  total: number
  total_amount: number
  total_interest: number
  on_time: number
  late: number
  by_method: Record<string, number>
  by_month: Record<string, number>
}> {
  try {
    let query = supabase
      .from('payments')
      .select('amount, interest_amount, is_late, payment_method, payment_date')

    if (companyId) {
      query = query.eq('company_id', companyId)
    }

    const { data, error } = await query

    if (error) {
      throw error
    }

    const payments = data || []
    
    const stats = {
      total: payments.length,
      total_amount: payments.reduce((sum, p) => sum + p.amount, 0),
      total_interest: payments.reduce((sum, p) => sum + p.interest_amount, 0),
      on_time: payments.filter(p => !p.is_late).length,
      late: payments.filter(p => p.is_late).length,
      by_method: {} as Record<string, number>,
      by_month: {} as Record<string, number>
    }

    // Group by payment method
    payments.forEach(p => {
      stats.by_method[p.payment_method] = (stats.by_method[p.payment_method] || 0) + 1
    })

    // Group by month
    payments.forEach(p => {
      const month = p.payment_date.substring(0, 7) // YYYY-MM
      stats.by_month[month] = (stats.by_month[month] || 0) + p.amount
    })

    return stats
  } catch (error) {
    console.error('Error fetching payment stats:', error)
    throw error
  }
}

// Search payments
export async function searchPayments(searchTerm: string, companyId?: string): Promise<Payment[]> {
  try {
    let query = supabase
      .from('payments')
      .select(`
        *,
        contract:contracts (
          id
        ),
        customer:customers (
          first_name,
          last_name,
          company_name
        )
      `)
      .or(`customer.first_name.ilike.%${searchTerm}%,customer.last_name.ilike.%${searchTerm}%,customer.company_name.ilike.%${searchTerm}%,amount.eq.${searchTerm}`)
      .order('created_at', { ascending: false })

    if (companyId) {
      query = query.eq('company_id', companyId)
    }

    const { data, error } = await query

    if (error) {
      throw error
    }

    return data || []
  } catch (error) {
    console.error('Error searching payments:', error)
    throw error
  }
}

// Bulk create payments (for payment schedule)
export async function bulkCreatePayments(payments: PaymentInsert[]): Promise<Payment[]> {
  try {
    const { data, error } = await supabase
      .from('payments')
      .insert(payments)
      .select()

    if (error) {
      throw error
    }

    return data || []
  } catch (error) {
    console.error('Error bulk creating payments:', error)
    throw error
  }
}

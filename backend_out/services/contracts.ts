import { supabase } from './supabaseClient'
import type { Database } from './supabaseClient'

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
  vin: string
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
  status?: 'active' | 'completed' | 'defaulted' | 'open'
  customer_id?: string
  vehicle_id?: string
  start_date_from?: string
  start_date_to?: string
  limit?: number
  offset?: number
}

// Get all contracts (filtered by user's company)
export async function getContracts(params?: ContractSearchParams): Promise<Contract[]> {
  try {
    let query = supabase
      .from('contracts')
      .select('*')
      .order('created_at', { ascending: false })

    // Apply filters
    if (params?.status) {
      query = query.eq('status', params.status)
    }

    if (params?.customer_id) {
      query = query.eq('customer_id', params.customer_id)
    }

    if (params?.vehicle_id) {
      query = query.eq('vehicle_id', params.vehicle_id)
    }

    if (params?.start_date_from) {
      query = query.gte('start_date', params.start_date_from)
    }

    if (params?.start_date_to) {
      query = query.lte('start_date', params.start_date_to)
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

    return data || []
  } catch (error) {
    console.error('Error fetching contracts:', error)
    throw error
  }
}

// Get contract by ID with relations
export async function getContractById(id: string): Promise<ContractWithRelations | null> {
  try {
    const { data, error } = await supabase
      .from('contracts')
      .select(`
        *,
        customer:customers (
          id,
          first_name,
          last_name,
          company_name,
          phone,
          customer_type
        ),
        vehicle:vehicles (
          id,
          license_plate,
          make,
          model,
          year,
          color,
          vin
        ),
        payments (
          id,
          amount,
          payment_date,
          due_date,
          payment_method,
          is_late,
          days_late,
          interest_amount
        ),
        permission_document:permission_documents (
          id,
          contract_id,
          begin_date,
          end_date,
          notes,
          drivers (
            id,
            name,
            license_number,
            phone,
            address
          )
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
    console.error('Error fetching contract:', error)
    throw error
  }
}

// Create new contract
export async function createContract(contractData: ContractInsert): Promise<Contract> {
  try {
    const { data, error } = await supabase
      .from('contracts')
      .insert(contractData)
      .select()
      .single()

    if (error) {
      throw error
    }

    return data
  } catch (error) {
    console.error('Error creating contract:', error)
    throw error
  }
}

// Update contract
export async function updateContract(id: string, updates: ContractUpdate): Promise<Contract> {
  try {
    const { data, error } = await supabase
      .from('contracts')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      throw error
    }

    return data
  } catch (error) {
    console.error('Error updating contract:', error)
    throw error
  }
}

// Delete contract
export async function deleteContract(id: string): Promise<void> {
  try {
    const { error } = await supabase
      .from('contracts')
      .delete()
      .eq('id', id)

    if (error) {
      throw error
    }
  } catch (error) {
    console.error('Error deleting contract:', error)
    throw error
  }
}

// Get contracts by customer
export async function getContractsByCustomer(customerId: string): Promise<Contract[]> {
  try {
    const { data, error } = await supabase
      .from('contracts')
      .select('*')
      .eq('customer_id', customerId)
      .order('created_at', { ascending: false })

    if (error) {
      throw error
    }

    return data || []
  } catch (error) {
    console.error('Error fetching contracts by customer:', error)
    throw error
  }
}

// Get contracts by company
export async function getContractsByCompany(companyId: string): Promise<Contract[]> {
  try {
    const { data, error } = await supabase
      .from('contracts')
      .select('*')
      .eq('company_id', companyId)
      .order('created_at', { ascending: false })

    if (error) {
      throw error
    }

    return data || []
  } catch (error) {
    console.error('Error fetching contracts by company:', error)
    throw error
  }
}

// Check if vehicle is in active contract
export async function isVehicleInActiveContract(vehicleId: string): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from('contracts')
      .select('id')
      .eq('vehicle_id', vehicleId)
      .eq('status', 'active')
      .limit(1)

    if (error) {
      throw error
    }

    return data.length > 0
  } catch (error) {
    console.error('Error checking vehicle contract status:', error)
    throw error
  }
}

// Get active contract for vehicle
export async function getActiveContractForVehicle(vehicleId: string): Promise<Contract | null> {
  try {
    const { data, error } = await supabase
      .from('contracts')
      .select('*')
      .eq('vehicle_id', vehicleId)
      .eq('status', 'active')
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return null // Not found
      }
      throw error
    }

    return data
  } catch (error) {
    console.error('Error fetching active contract for vehicle:', error)
    throw error
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
    const totalPayments = payments.length
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

// Get contract statistics
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
    let query = supabase
      .from('contracts')
      .select('status, total_payable, total_paid, remaining_balance')

    if (companyId) {
      query = query.eq('company_id', companyId)
    }

    const { data, error } = await query

    if (error) {
      throw error
    }

    const contracts = data || []
    
    const stats = {
      total: contracts.length,
      active: contracts.filter(c => c.status === 'active').length,
      completed: contracts.filter(c => c.status === 'completed').length,
      defaulted: contracts.filter(c => c.status === 'defaulted').length,
      open: contracts.filter(c => c.status === 'open').length,
      total_value: contracts.reduce((sum, c) => sum + c.total_payable, 0),
      total_paid: contracts.reduce((sum, c) => sum + c.total_paid, 0),
      total_remaining: contracts.reduce((sum, c) => sum + c.remaining_balance, 0)
    }

    return stats
  } catch (error) {
    console.error('Error fetching contract stats:', error)
    throw error
  }
}

// Search contracts
export async function searchContracts(searchTerm: string, companyId?: string): Promise<Contract[]> {
  try {
    let query = supabase
      .from('contracts')
      .select(`
        *,
        customer:customers (
          first_name,
          last_name,
          company_name
        ),
        vehicle:vehicles (
          license_plate,
          make,
          model
        )
      `)
      .or(`customer.first_name.ilike.%${searchTerm}%,customer.last_name.ilike.%${searchTerm}%,customer.company_name.ilike.%${searchTerm}%,vehicle.license_plate.ilike.%${searchTerm}%,vehicle.make.ilike.%${searchTerm}%,vehicle.model.ilike.%${searchTerm}%`)
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
    console.error('Error searching contracts:', error)
    throw error
  }
}

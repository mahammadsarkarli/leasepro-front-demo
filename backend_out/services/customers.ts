import { supabase } from './supabaseClient'
import type { Database } from './supabaseClient'

type Customer = Database['public']['Tables']['customers']['Row']
type CustomerInsert = Database['public']['Tables']['customers']['Insert']
type CustomerUpdate = Database['public']['Tables']['customers']['Update']

export interface CustomerWithRelations extends Customer {
  contact_info?: ContactInfo[]
  customer_score?: CustomerScore
  customer_photos?: CustomerPhoto[]
}

export interface ContactInfo {
  id: string
  customer_id: string
  first_name: string
  last_name: string
  relationship: string
  phone: string
}

export interface CustomerScore {
  customer_id: string
  score: number
  total_payments: number
  on_time_payments: number
  late_payments: number
  overdue_days: number
  completed_contracts: number
  total_contracts: number
  payment_completion_rate: number
  last_updated: string
}

export interface CustomerPhoto {
  id: string
  customer_id: string
  file_name: string
  file_type: string
  file_size: number
  data: string
}

export interface CustomerSearchParams {
  q?: string
  customer_type?: 'individual' | 'company'
  is_active?: boolean
  limit?: number
  offset?: number
}

export interface CustomerSearchResult {
  id: string
  company_id: string
  customer_type: 'individual' | 'company'
  first_name: string | null
  last_name: string | null
  company_name: string | null
  phone: string
  address: string
  created_at: string
}

// Get all customers (filtered by user's company)
export async function getCustomers(params?: CustomerSearchParams): Promise<Customer[]> {
  try {
    let query = supabase
      .from('customers')
      .select('*')
      .order('created_at', { ascending: false })

    // Apply filters
    if (params?.customer_type) {
      query = query.eq('customer_type', params.customer_type)
    }

    if (params?.is_active !== undefined) {
      query = query.eq('is_active', params.is_active)
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
    console.error('Error fetching customers:', error)
    throw error
  }
}

// Get customer by ID with relations
export async function getCustomerById(id: string): Promise<CustomerWithRelations | null> {
  try {
    const { data, error } = await supabase
      .from('customers')
      .select(`
        *,
        contact_info (*),
        customer_score (*),
        customer_photos (*)
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
    console.error('Error fetching customer:', error)
    throw error
  }
}

// Search customers using RPC function
export async function searchCustomers(
  q: string = '',
  limit: number = 20,
  offset: number = 0
): Promise<CustomerSearchResult[]> {
  try {
    const { data, error } = await supabase.rpc('search_customers', {
      q,
      limit_count: limit,
      offset_count: offset
    })

    if (error) {
      throw error
    }

    return data || []
  } catch (error) {
    console.error('Error searching customers:', error)
    throw error
  }
}

// Create new customer
export async function createCustomer(customerData: CustomerInsert): Promise<Customer> {
  try {
    const { data, error } = await supabase
      .from('customers')
      .insert(customerData)
      .select()
      .single()

    if (error) {
      throw error
    }

    return data
  } catch (error) {
    console.error('Error creating customer:', error)
    throw error
  }
}

// Update customer
export async function updateCustomer(id: string, updates: CustomerUpdate): Promise<Customer> {
  try {
    const { data, error } = await supabase
      .from('customers')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      throw error
    }

    return data
  } catch (error) {
    console.error('Error updating customer:', error)
    throw error
  }
}

// Delete customer
export async function deleteCustomer(id: string): Promise<void> {
  try {
    const { error } = await supabase
      .from('customers')
      .delete()
      .eq('id', id)

    if (error) {
      throw error
    }
  } catch (error) {
    console.error('Error deleting customer:', error)
    throw error
  }
}

// Get customers by company
export async function getCustomersByCompany(companyId: string): Promise<Customer[]> {
  try {
    const { data, error } = await supabase
      .from('customers')
      .select('*')
      .eq('company_id', companyId)
      .order('created_at', { ascending: false })

    if (error) {
      throw error
    }

    return data || []
  } catch (error) {
    console.error('Error fetching customers by company:', error)
    throw error
  }
}

// Create contact info
export async function createContactInfo(contactData: Omit<ContactInfo, 'id'>): Promise<ContactInfo> {
  try {
    const { data, error } = await supabase
      .from('contact_info')
      .insert(contactData)
      .select()
      .single()

    if (error) {
      throw error
    }

    return data
  } catch (error) {
    console.error('Error creating contact info:', error)
    throw error
  }
}

// Update contact info
export async function updateContactInfo(id: string, updates: Partial<ContactInfo>): Promise<ContactInfo> {
  try {
    const { data, error } = await supabase
      .from('contact_info')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      throw error
    }

    return data
  } catch (error) {
    console.error('Error updating contact info:', error)
    throw error
  }
}

// Delete contact info
export async function deleteContactInfo(id: string): Promise<void> {
  try {
    const { error } = await supabase
      .from('contact_info')
      .delete()
      .eq('id', id)

    if (error) {
      throw error
    }
  } catch (error) {
    console.error('Error deleting contact info:', error)
    throw error
  }
}

// Create customer photo
export async function createCustomerPhoto(photoData: Omit<CustomerPhoto, 'id'>): Promise<CustomerPhoto> {
  try {
    const { data, error } = await supabase
      .from('customer_photos')
      .insert(photoData)
      .select()
      .single()

    if (error) {
      throw error
    }

    return data
  } catch (error) {
    console.error('Error creating customer photo:', error)
    throw error
  }
}

// Delete customer photo
export async function deleteCustomerPhoto(id: string): Promise<void> {
  try {
    const { error } = await supabase
      .from('customer_photos')
      .delete()
      .eq('id', id)

    if (error) {
      throw error
    }
  } catch (error) {
    console.error('Error deleting customer photo:', error)
    throw error
  }
}

// Update customer score
export async function updateCustomerScore(customerId: string, scoreData: Partial<CustomerScore>): Promise<CustomerScore> {
  try {
    const { data, error } = await supabase
      .from('customer_scores')
      .upsert({
        customer_id: customerId,
        ...scoreData,
        last_updated: new Date().toISOString()
      })
      .select()
      .single()

    if (error) {
      throw error
    }

    return data
  } catch (error) {
    console.error('Error updating customer score:', error)
    throw error
  }
}

// Get customer statistics
export async function getCustomerStats(companyId?: string): Promise<{
  total: number
  individual: number
  company: number
  active: number
  inactive: number
}> {
  try {
    let query = supabase
      .from('customers')
      .select('customer_type, is_active')

    if (companyId) {
      query = query.eq('company_id', companyId)
    }

    const { data, error } = await query

    if (error) {
      throw error
    }

    const customers = data || []
    
    return {
      total: customers.length,
      individual: customers.filter(c => c.customer_type === 'individual').length,
      company: customers.filter(c => c.customer_type === 'company').length,
      active: customers.filter(c => c.is_active).length,
      inactive: customers.filter(c => !c.is_active).length
    }
  } catch (error) {
    console.error('Error fetching customer stats:', error)
    throw error
  }
}

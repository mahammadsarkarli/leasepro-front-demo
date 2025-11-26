import { supabase } from './supabaseClient'
import type { Database } from './supabaseClient'

type Vehicle = Database['public']['Tables']['vehicles']['Row']
type VehicleInsert = Database['public']['Tables']['vehicles']['Insert']
type VehicleUpdate = Database['public']['Tables']['vehicles']['Update']

export interface VehicleWithContract extends Vehicle {
  contracts?: Contract[]
}

export interface Contract {
  id: string
  customer_id: string
  company_id: string
  vehicle_id: string
  status: 'active' | 'completed' | 'defaulted' | 'open'
  start_date: string
  end_date?: string
}

export interface VehicleSearchParams {
  make?: string
  model?: string
  year?: number
  color?: string
  license_plate?: string
  vin?: string
  available_only?: boolean
  limit?: number
  offset?: number
}

// Get all vehicles (filtered by user's company)
export async function getVehicles(params?: VehicleSearchParams): Promise<Vehicle[]> {
  try {
    let query = supabase
      .from('vehicles')
      .select('*')
      .order('created_at', { ascending: false })

    // Apply filters
    if (params?.make) {
      query = query.ilike('make', `%${params.make}%`)
    }

    if (params?.model) {
      query = query.ilike('model', `%${params.model}%`)
    }

    if (params?.year) {
      query = query.eq('year', params.year)
    }

    if (params?.color) {
      query = query.ilike('color', `%${params.color}%`)
    }

    if (params?.license_plate) {
      query = query.ilike('license_plate', `%${params.license_plate}%`)
    }

    if (params?.vin) {
      query = query.ilike('vin', `%${params.vin}%`)
    }

    if (params?.available_only) {
      // Get vehicles that are not in active contracts
      query = query.not('id', 'in', `(
        SELECT vehicle_id FROM contracts WHERE status = 'active'
      )`)
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
    console.error('Error fetching vehicles:', error)
    throw error
  }
}

// Get vehicle by ID
export async function getVehicleById(id: string): Promise<Vehicle | null> {
  try {
    const { data, error } = await supabase
      .from('vehicles')
      .select('*')
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
    console.error('Error fetching vehicle:', error)
    throw error
  }
}

// Get vehicle by ID with contract information
export async function getVehicleWithContracts(id: string): Promise<VehicleWithContract | null> {
  try {
    const { data, error } = await supabase
      .from('vehicles')
      .select(`
        *,
        contracts (
          id,
          customer_id,
          company_id,
          vehicle_id,
          status,
          start_date,
          next_due_date
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
    console.error('Error fetching vehicle with contracts:', error)
    throw error
  }
}

// Create new vehicle
export async function createVehicle(vehicleData: VehicleInsert): Promise<Vehicle> {
  try {
    const { data, error } = await supabase
      .from('vehicles')
      .insert(vehicleData)
      .select()
      .single()

    if (error) {
      throw error
    }

    return data
  } catch (error) {
    console.error('Error creating vehicle:', error)
    throw error
  }
}

// Update vehicle
export async function updateVehicle(id: string, updates: VehicleUpdate): Promise<Vehicle> {
  try {
    const { data, error } = await supabase
      .from('vehicles')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      throw error
    }

    return data
  } catch (error) {
    console.error('Error updating vehicle:', error)
    throw error
  }
}

// Delete vehicle
export async function deleteVehicle(id: string): Promise<void> {
  try {
    const { error } = await supabase
      .from('vehicles')
      .delete()
      .eq('id', id)

    if (error) {
      throw error
    }
  } catch (error) {
    console.error('Error deleting vehicle:', error)
    throw error
  }
}

// Get vehicles by company
export async function getVehiclesByCompany(companyId: string): Promise<Vehicle[]> {
  try {
    const { data, error } = await supabase
      .from('vehicles')
      .select('*')
      .eq('company_id', companyId)
      .order('created_at', { ascending: false })

    if (error) {
      throw error
    }

    return data || []
  } catch (error) {
    console.error('Error fetching vehicles by company:', error)
    throw error
  }
}

// Get available vehicles (not in active contracts)
export async function getAvailableVehicles(companyId?: string): Promise<Vehicle[]> {
  try {
    let query = supabase
      .from('vehicles')
      .select('*')
      .not('id', 'in', `(
        SELECT vehicle_id FROM contracts WHERE status = 'active'
      )`)
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
    console.error('Error fetching available vehicles:', error)
    throw error
  }
}

// Check if vehicle is available
export async function isVehicleAvailable(vehicleId: string): Promise<boolean> {
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

    return data.length === 0
  } catch (error) {
    console.error('Error checking vehicle availability:', error)
    throw error
  }
}

// Get vehicle by VIN
export async function getVehicleByVin(vin: string): Promise<Vehicle | null> {
  try {
    const { data, error } = await supabase
      .from('vehicles')
      .select('*')
      .eq('vin', vin)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return null // Not found
      }
      throw error
    }

    return data
  } catch (error) {
    console.error('Error fetching vehicle by VIN:', error)
    throw error
  }
}

// Get vehicle by license plate
export async function getVehicleByLicensePlate(licensePlate: string): Promise<Vehicle | null> {
  try {
    const { data, error } = await supabase
      .from('vehicles')
      .select('*')
      .eq('license_plate', licensePlate)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return null // Not found
      }
      throw error
    }

    return data
  } catch (error) {
    console.error('Error fetching vehicle by license plate:', error)
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

// Get vehicle statistics
export async function getVehicleStats(companyId?: string): Promise<{
  total: number
  available: number
  leased: number
  by_make: Record<string, number>
  by_year: Record<number, number>
}> {
  try {
    let query = supabase
      .from('vehicles')
      .select('id, make, year')

    if (companyId) {
      query = query.eq('company_id', companyId)
    }

    const { data, error } = await query

    if (error) {
      throw error
    }

    const vehicles = data || []
    
    // Get leased vehicles count
    const { data: leasedData, error: leasedError } = await supabase
      .from('contracts')
      .select('vehicle_id')
      .eq('status', 'active')

    if (leasedError) {
      throw leasedError
    }

    const leasedVehicleIds = new Set(leasedData.map(c => c.vehicle_id))
    const leased = vehicles.filter(v => leasedVehicleIds.has(v.id)).length
    const available = vehicles.length - leased

    // Group by make
    const byMake: Record<string, number> = {}
    vehicles.forEach(v => {
      byMake[v.make] = (byMake[v.make] || 0) + 1
    })

    // Group by year
    const byYear: Record<number, number> = {}
    vehicles.forEach(v => {
      byYear[v.year] = (byYear[v.year] || 0) + 1
    })

    return {
      total: vehicles.length,
      available,
      leased,
      by_make: byMake,
      by_year: byYear
    }
  } catch (error) {
    console.error('Error fetching vehicle stats:', error)
    throw error
  }
}

// Search vehicles
export async function searchVehicles(searchTerm: string, companyId?: string): Promise<Vehicle[]> {
  try {
    let query = supabase
      .from('vehicles')
      .select('*')
      .or(`make.ilike.%${searchTerm}%,model.ilike.%${searchTerm}%,license_plate.ilike.%${searchTerm}%,vin.ilike.%${searchTerm}%`)
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
    console.error('Error searching vehicles:', error)
    throw error
  }
}

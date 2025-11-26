import { apiClient } from './apiClient'
import type { Database } from './supabaseClient'
import { supabase } from './supabaseClient'

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
  available_only?: boolean
  limit?: number
  offset?: number
}

// Test database connection
export async function testDatabaseConnection(): Promise<boolean> {
  try {
    // Add timeout to prevent hanging
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Database connection timeout')), 10000); // 10 second timeout
    });
    
    const connectionPromise = supabase
      .from('vehicles')
      .select('count')
      .limit(1);
    
    const { error } = await Promise.race([connectionPromise, timeoutPromise]) as any;
    
    if (error) {
      console.error('Database connection test failed:', error);
      return false;
    }
    
    console.log('Database connection test successful');
    return true;
  } catch (error) {
    console.error('Database connection test error:', error);
    return false;
  }
}

// Get all vehicles using API
export async function getVehicles(params?: VehicleSearchParams): Promise<Vehicle[]> {
  try {
    const response = await apiClient.get('/vehicles', { params });
    
    if (response.success && response.data) {
      return (response.data as any).vehicles || response.data;
    }
    
    throw new Error(response.error || 'Failed to fetch vehicles');
  } catch (error) {
    console.error('Error in getVehicles:', error);
    throw error;
  }
}

// Get vehicle by ID using API
export async function getVehicleById(id: string): Promise<Vehicle | null> {
  try {
    const response = await apiClient.get(`/vehicles/${id}`);
    
    if (response.success && response.data) {
      return (response.data as any).vehicle || response.data;
    }
    
    if ((response as any).status === 404) {
      return null; // Not found
    }
    
    throw new Error(response.error || 'Failed to fetch vehicle');
  } catch (error) {
    console.error('Error in getVehicleById:', error);
    throw error;
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
    const response = await apiClient.post('/api/vehicles', vehicleData);
    
    if (response.success && response.data) {
      return (response.data as any).vehicle || response.data;
    }
    
    throw new Error(response.error || 'Failed to create vehicle');
  } catch (error) {
    console.error('Error in createVehicle:', error);
    throw error;
  }
}

// Update vehicle using API
export async function updateVehicle(id: string, updates: VehicleUpdate): Promise<Vehicle> {
  try {
    const response = await apiClient.put(`/api/vehicles/${id}`, updates);
    
    if (response.success && response.data) {
      return (response.data as any).vehicle || response.data;
    }
    
    throw new Error(response.error || 'Failed to update vehicle');
  } catch (error) {
    console.error('Error in updateVehicle:', error);
    throw error;
  }
}

// Delete vehicle using API
export async function deleteVehicle(id: string): Promise<void> {
  try {
    const response = await apiClient.delete(`/api/vehicles/${id}`);
    
    if (!response.success) {
      throw new Error(response.error || 'Failed to delete vehicle');
    }
  } catch (error) {
    console.error('Error in deleteVehicle:', error);
    throw error;
  }
}

// Get vehicles by company using API
export async function getVehiclesByCompany(companyId: string): Promise<Vehicle[]> {
  try {
    const response = await apiClient.get('/vehicles', { 
      params: { company_id: companyId } 
    });
    
    if (response.success && response.data) {
      const vehicles = (response.data as any).vehicles || response.data;
      return Array.isArray(vehicles) ? vehicles : [];
    }
    
    throw new Error(response.error || 'Failed to fetch vehicles by company');
  } catch (error) {
    console.error('Error fetching vehicles by company:', error);
    throw error;
  }
}

// Get available vehicles (not in active contracts) using API
export async function getAvailableVehicles(companyId?: string): Promise<Vehicle[]> {
  try {
    const params: any = {};
    if (companyId) {
      params.company_id = companyId;
    }

    const response = await apiClient.get('/vehicles', { params });
    
    if (response.success && response.data) {
      const vehicles = (response.data as any).vehicles || response.data || [];
      
      // Get active contracts to filter out vehicles that are in use
      const contractsResponse = await apiClient.get('/contracts', { 
        params: { status: 'active,open' } 
      });
      
      let activeVehicleIds: string[] = [];
      if (contractsResponse.success && contractsResponse.data) {
        const contracts = (contractsResponse.data as any).contracts || contractsResponse.data || [];
        activeVehicleIds = contracts.map((contract: any) => contract.vehicle_id).filter(Boolean);
      }
      
      // Filter out vehicles that are in active contracts
      return vehicles.filter((vehicle: any) => !activeVehicleIds.includes(vehicle.id));
    }
    
    return [];
  } catch (error) {
    console.error('Error fetching available vehicles:', error);
    throw error;
  }
}

// Check if vehicle is available using API
export async function isVehicleAvailable(vehicleId: string): Promise<boolean> {
  try {
    const response = await apiClient.get('/contracts', { 
      params: { vehicle_id: vehicleId, status: 'active,open' } 
    });
    
    if (response.success && response.data) {
      const contracts = (response.data as any).contracts || response.data || [];
      return contracts.length === 0;
    }
    
    return true; // If we can't check, assume it's available
  } catch (error) {
    console.error('Error checking vehicle availability:', error);
    throw error;
  }
}



// Get vehicle by license plate using API
export async function getVehicleByLicensePlate(licensePlate: string): Promise<Vehicle | null> {
  try {
    const response = await apiClient.get('/vehicles', { 
      params: { search: licensePlate } 
    });
    
    if (response.success && response.data) {
      const vehicles = (response.data as any).vehicles || response.data || [];
      // Find vehicle with exact license plate match
      const vehicle = vehicles.find((v: any) => 
        v.license_plate.toLowerCase() === licensePlate.toLowerCase()
      );
      return vehicle || null;
    }
    
    return null;
  } catch (error) {
    console.error('Error fetching vehicle by license plate:', error);
    throw error;
  }
}

// Get active contract for vehicle using API
export async function getActiveContractForVehicle(vehicleId: string): Promise<Contract | null> {
  try {
    const response = await apiClient.get('/contracts', { 
      params: { vehicle_id: vehicleId, status: 'active' } 
    });
    
    if (response.success && response.data) {
      const contracts = (response.data as any).contracts || response.data || [];
      return contracts.length > 0 ? contracts[0] : null;
    }
    
    return null;
  } catch (error) {
    console.error('Error fetching active contract for vehicle:', error);
    throw error;
  }
}

// Get vehicle statistics using API
export async function getVehicleStats(companyId?: string): Promise<{
  total: number
  available: number
  leased: number
  by_make: Record<string, number>
  by_year: Record<number, number>
}> {
  try {
    const params: any = { limit: 1000 };
    if (companyId) {
      params.company_id = companyId;
    }

    // Get vehicles
    const vehiclesResponse = await apiClient.get('/vehicles', { params });
    const vehicles = vehiclesResponse.success ? 
      ((vehiclesResponse.data as any).vehicles || vehiclesResponse.data || []) : [];

    // Get active contracts to determine leased vehicles
    const contractsResponse = await apiClient.get('/contracts', { 
      params: { status: 'active', limit: 1000 } 
    });
    
    let leasedVehicleIds = new Set<string>();
    if (contractsResponse.success && contractsResponse.data) {
      const contracts = (contractsResponse.data as any).contracts || contractsResponse.data || [];
      leasedVehicleIds = new Set(contracts.map((c: any) => c.vehicle_id).filter(Boolean));
    }

    const leased = vehicles.filter((v: any) => leasedVehicleIds.has(v.id)).length;
    const available = vehicles.length - leased;

    // Group by make
    const byMake: Record<string, number> = {};
    vehicles.forEach((v: any) => {
      byMake[v.make] = (byMake[v.make] || 0) + 1;
    });

    // Group by year
    const byYear: Record<number, number> = {};
    vehicles.forEach((v: any) => {
      byYear[v.year] = (byYear[v.year] || 0) + 1;
    });

    return {
      total: vehicles.length,
      available,
      leased,
      by_make: byMake,
      by_year: byYear
    };
  } catch (error) {
    console.error('Error fetching vehicle stats:', error);
    throw error;
  }
}

// Search vehicles using API
export async function searchVehicles(searchTerm: string, companyId?: string): Promise<Vehicle[]> {
  try {
    const params: any = { search: searchTerm };
    if (companyId) {
      params.company_id = companyId;
    }

    const response = await apiClient.get('/vehicles', { params });
    
    if (response.success && response.data) {
      return (response.data as any).vehicles || response.data || [];
    }
    
    throw new Error(response.error || 'Failed to search vehicles');
  } catch (error) {
    console.error('Error searching vehicles:', error);
    throw error;
  }
}

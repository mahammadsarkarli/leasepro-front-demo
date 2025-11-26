import { apiClient } from "./apiClient";
import type { Database } from "./supabaseClient";

type Company = Database["public"]["Tables"]["companies"]["Row"];
type CompanyInsert = Database["public"]["Tables"]["companies"]["Insert"];
type CompanyUpdate = Database["public"]["Tables"]["companies"]["Update"];

export interface CompanySearchParams {
  name?: string;
  is_active?: boolean;
  limit?: number;
  offset?: number;
}

// Get all companies using API
export async function getCompanies(
  params?: CompanySearchParams
): Promise<Company[]> {
  try {
    const response = await apiClient.get("/companies", { params });

    if (response.success && response.data) {
      return (response.data as any).companies || response.data;
    }

    throw new Error(response.error || "Failed to fetch companies");
  } catch (error) {
    console.error("Error in getCompanies:", error);
    throw error;
  }
}

// Get company by ID using API
export async function getCompanyById(id: string): Promise<Company | null> {
  try {
    const response = await apiClient.get(`/companies/${id}`);
    
    if (response.success && response.data) {
      return (response.data as any).company || response.data;
    }
    
    if (response.error && response.error.includes('not found')) {
      return null; // Not found
    }
    
    throw new Error(response.error || 'Failed to fetch company');
  } catch (error) {
    console.error('Error in getCompanyById:', error);
    throw error;
  }
}

// Create new company using API
export async function createCompany(
  companyData: Omit<CompanyInsert, "id" | "created_at">
): Promise<Company> {
  try {
    const response = await apiClient.post('/api/companies', companyData);
    
    if (response.success && response.data) {
      return (response.data as any).company || response.data;
    }
    
    throw new Error(response.error || 'Failed to create company');
  } catch (error) {
    console.error('Error in createCompany:', error);
    throw error;
  }
}

// Update company using API
export async function updateCompany(
  id: string,
  updates: CompanyUpdate
): Promise<Company | null> {
  try {
    const response = await apiClient.put(`/api/companies/${id}`, updates);
    
    if (response.success && response.data) {
      return (response.data as any).company || response.data;
    }
    
    if (response.error && response.error.includes('not found')) {
      return null; // Not found
    }
    
    throw new Error(response.error || 'Failed to update company');
  } catch (error) {
    console.error('Error in updateCompany:', error);
    throw error;
  }
}

// Delete company using API
export async function deleteCompany(id: string): Promise<boolean> {
  try {
    const response = await apiClient.delete(`/api/companies/${id}`);
    
    if (response.success) {
      return true;
    }
    
    throw new Error(response.error || 'Failed to delete company');
  } catch (error) {
    console.error('Error in deleteCompany:', error);
    throw error;
  }
}

// Get company statistics using API
// OPTIMIZED: Use context data instead of making 4 separate API calls
export async function getCompanyStats(companyId: string): Promise<{
  totalCustomers: number;
  totalVehicles: number;
  totalContracts: number;
  totalPayments: number;
  activeContracts: number;
  totalRevenue: number;
}> {
  try {
    // PERFORMANCE NOTE: This function should ideally use DataContext data
    // instead of making separate API calls. Consider using context data directly.
    
    // For backward compatibility, making parallel API calls
    // TODO: Create a dedicated /companies/:id/stats endpoint in backend
    const [customersResponse, vehiclesResponse, contractsResponse, paymentsResponse] = await Promise.all([
      apiClient.get('/customers', { params: { company_id: companyId, limit: 1000 } }),
      apiClient.get('/vehicles', { params: { company_id: companyId, limit: 1000 } }),
      apiClient.get('/contracts', { params: { company_id: companyId, limit: 1000 } }),
      apiClient.get('/payments', { params: { company_id: companyId, limit: 1000 } })
    ]);

    const customers = customersResponse.success ? ((customersResponse.data as any).customers || customersResponse.data || []) : [];
    const vehicles = vehiclesResponse.success ? ((vehiclesResponse.data as any).vehicles || vehiclesResponse.data || []) : [];
    const contracts = contractsResponse.success ? ((contractsResponse.data as any).contracts || contractsResponse.data || []) : [];
    const payments = paymentsResponse.success ? ((paymentsResponse.data as any).payments || paymentsResponse.data || []) : [];

    const activeContracts = contracts.filter((contract: any) => contract.status === 'active');
    const totalRevenue = payments.reduce((sum: number, payment: any) => sum + (payment.amount || 0), 0);

    return {
      totalCustomers: customers.length,
      totalVehicles: vehicles.length,
      totalContracts: contracts.length,
      totalPayments: payments.length,
      activeContracts: activeContracts.length,
      totalRevenue,
    };
  } catch (error) {
    console.error("Error fetching company stats:", error);
    throw error;
  }
}

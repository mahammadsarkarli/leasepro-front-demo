import { apiClient } from './apiClient';

export interface Driver {
  id?: string;
  name: string;
  licenseNumber: string;
  license_category?: string;
  license_given_date?: Date;
  phone?: string;
  address?: string;
}

export interface PermissionDocument {
  id?: string;
  contract_id: string;
  begin_date: string;
  end_date: string;
  notes?: string;
  drivers: Driver[];
}

// Create or update permission document with drivers using API
export async function upsertPermissionDocument(permissionDoc: PermissionDocument): Promise<PermissionDocument> {
  try {
    const { drivers, ...permissionData } = permissionDoc;
    
    console.log('upsertPermissionDocument called with:', {
      permissionData,
      driversCount: drivers.length,
      drivers: drivers
    });
    
    const requestData = {
      ...permissionData,
      drivers: drivers.map(driver => ({
        id: driver.id,
        name: driver.name,
        licenseNumber: driver.licenseNumber,
        license_category: driver.license_category,
        license_given_date: driver.license_given_date,
        phone: driver.phone,
        address: driver.address
      }))
    };
    
    console.log('Sending request to API:', requestData);
    
    const response = await apiClient.post('/api/permission-documents', requestData);
    
    console.log('API response:', response);

    if (response.success && response.data) {
      console.log('Permission document upserted successfully:', response.data);
      return response.data;
    }

    console.error('API response indicates failure:', response);
    throw new Error(response.error || 'Failed to upsert permission document');
  } catch (error) {
    console.error('Error upserting permission document:', error);
    throw error;
  }
}

// Get permission document by ID with drivers using API
export async function getPermissionDocumentById(id: string): Promise<PermissionDocument | null> {
  try {
    // Note: This function might need to be updated based on available API endpoints
    // For now, we'll use a generic approach
    const response = await apiClient.get(`/permission-documents/${id}`);
    
    if (response.success && response.data) {
      return response.data;
    }
    
    return null;
  } catch (error) {
    console.error('Error fetching permission document:', error);
    throw error;
  }
}

// Get permission document by contract ID using API
export async function getPermissionDocumentByContractId(contractId: string): Promise<PermissionDocument | null> {
  try {
    const response = await apiClient.get(`/permission-documents/contract/${contractId}`);
    
    if (response.success && response.data) {
      return response.data;
    }
    
    return null;
  } catch (error) {
    console.error('Error fetching permission document by contract ID:', error);
    throw error;
  }
}

// Delete permission document and its drivers using API
export async function deletePermissionDocument(id: string): Promise<void> {
  try {
    const response = await apiClient.delete(`/api/permission-documents/${id}`);
    
    if (!response.success) {
      throw new Error(response.error || 'Failed to delete permission document');
    }
  } catch (error) {
    console.error('Error deleting permission document:', error);
    throw error;
  }
}



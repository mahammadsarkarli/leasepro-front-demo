import { apiClient } from './apiClient'
import type { Database } from './supabaseClient'

type Customer = Database['public']['Tables']['customers']['Row']
type CustomerInsert = Database['public']['Tables']['customers']['Insert']
type CustomerUpdate = Database['public']['Tables']['customers']['Update']



export interface ContactInfo {
  id: string
  customer_id: string
  first_name: string
  last_name: string
  relationship: string
  phone: string
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

// Get all customers using API
export async function getCustomers(params?: CustomerSearchParams): Promise<Customer[]> {
  try {
    const response = await apiClient.get('/customers', { params });
    
    if (response.success && response.data) {
      const customers = (response.data as any).customers || response.data;
      // Transform the data to handle contacts array
      return customers.map((customer: any) => ({
        ...customer,
        contacts: customer.contacts || []
      }));
    }
    
    throw new Error(response.error || 'Failed to fetch customers');
  } catch (error) {
    console.error('Error in getCustomers:', error);
    throw error;
  }
}

// Get customer by ID using API
export async function getCustomerById(id: string): Promise<Customer | null> {
  try {
    const response = await apiClient.get(`/customers/${id}`);
    
    if (response.success && response.data) {
      const customer = (response.data as any).customer || response.data;
      // Transform the data to handle contacts array
      return {
        ...customer,
        contacts: customer.contacts || []
      };
    }
    
    if ((response as any).status === 404) {
      return null; // Not found
    }
    
    throw new Error(response.error || 'Failed to fetch customer');
  } catch (error) {
    console.error('Error in getCustomerById:', error);
    throw error;
  }
}

// Search customers using API
export async function searchCustomers(
  q: string = '',
  limit: number = 20,
  offset: number = 0
): Promise<CustomerSearchResult[]> {
  try {
    const response = await apiClient.get('/customers/search', {
      params: { q, limit, offset }
    });

    if (response.success && response.data) {
      return (response.data as any).customers || response.data;
    }

    throw new Error(response.error || 'Failed to search customers');
  } catch (error) {
    console.error('Error in searchCustomers:', error);
    throw error;
  }
}

// Create new customer using API
export async function createCustomer(customerData: CustomerInsert): Promise<Customer> {
  try {
    const response = await apiClient.post('/api/customers', customerData);
    
    if (response.success && response.data) {
      return (response.data as any).customer || response.data;
    }
    
    throw new Error(response.error || 'Failed to create customer');
  } catch (error) {
    console.error('Error in createCustomer:', error);
    throw error;
  }
}

// Update customer using API
export async function updateCustomer(id: string, updates: CustomerUpdate): Promise<Customer> {
  try {
    const response = await apiClient.put(`/api/customers/${id}`, updates);
    
    if (response.success && response.data) {
      return (response.data as any).customer || response.data;
    }
    
    throw new Error(response.error || 'Failed to update customer');
  } catch (error) {
    console.error('Error in updateCustomer:', error);
    throw error;
  }
}

// Update customer with contact info using API
export async function updateCustomerWithContacts(
  id: string, 
  customerUpdates: CustomerUpdate, 
  contactInfo: ContactInfo[]
): Promise<Customer> {
  try {
    // Prepare contacts data for JSON storage
    const contactsForStorage = contactInfo.map(contact => ({
      id: contact.id,
      first_name: contact.first_name,
      last_name: contact.last_name,
      relationship: contact.relationship,
      phone: contact.phone
    }))

    // Update customer with contacts included
    const response = await apiClient.put(`/api/customers/${id}`, {
      ...customerUpdates,
      contacts: contactsForStorage
    });

    if (response.success && response.data) {
      const customer = (response.data as any).customer || response.data;
      // Transform the data to handle contacts array
      return {
        ...customer,
        contacts: customer.contacts || []
      };
    }

    throw new Error(response.error || 'Failed to update customer with contacts');
  } catch (error) {
    console.error('Error in updateCustomerWithContacts:', error);
    throw error;
  }
}

// Delete customer using API
export async function deleteCustomer(id: string): Promise<void> {
  try {
    const response = await apiClient.delete(`/api/customers/${id}`);
    
    if (!response.success) {
      throw new Error(response.error || 'Failed to delete customer');
    }
  } catch (error) {
    console.error('Error in deleteCustomer:', error);
    throw error;
  }
}

// Get customers by company using API
export async function getCustomersByCompany(companyId: string): Promise<Customer[]> {
  try {
    const response = await apiClient.get('/customers', { 
      params: { company_id: companyId } 
    });
    
    if (response.success && response.data) {
      const customers = (response.data as any).customers || response.data;
      return Array.isArray(customers) ? customers : [];
    }
    
    throw new Error(response.error || 'Failed to fetch customers by company');
  } catch (error) {
    console.error('Error fetching customers by company:', error);
    throw error;
  }
}

// Create contact info - Note: This function uses direct Supabase calls
// TODO: Create API endpoint for contact info operations or handle through customer updates
export async function createContactInfo(contactData: Omit<ContactInfo, 'id'>): Promise<ContactInfo> {
  try {
    // This function still uses direct Supabase calls as there's no API endpoint for contact info
    // You may need to create an API endpoint for contact info operations
    throw new Error('Contact info operations not yet implemented in API. Please use customer update with contacts.');
  } catch (error) {
    console.error('Error creating contact info:', error)
    throw error
  }
}

// Update contact info - Note: This function uses direct Supabase calls
// TODO: Create API endpoint for contact info operations or handle through customer updates
export async function updateContactInfo(id: string, updates: Partial<ContactInfo>): Promise<ContactInfo> {
  try {
    // This function still uses direct Supabase calls as there's no API endpoint for contact info
    // You may need to create an API endpoint for contact info operations
    throw new Error('Contact info operations not yet implemented in API. Please use customer update with contacts.');
  } catch (error) {
    console.error('Error updating contact info:', error)
    throw error
  }
}

// Delete contact info - Note: This function uses direct Supabase calls
// TODO: Create API endpoint for contact info operations or handle through customer updates
export async function deleteContactInfo(id: string): Promise<void> {
  try {
    // This function still uses direct Supabase calls as there's no API endpoint for contact info
    // You may need to create an API endpoint for contact info operations
    throw new Error('Contact info operations not yet implemented in API. Please use customer update with contacts.');
  } catch (error) {
    console.error('Error deleting contact info:', error)
    throw error
  }
}

// Create customer photo - Note: This function uses direct Supabase calls
// TODO: Create API endpoint for customer photo operations
export async function createCustomerPhoto(photoData: Omit<CustomerPhoto, 'id'>): Promise<CustomerPhoto> {
  try {
    // This function still uses direct Supabase calls as there's no API endpoint for customer photos
    // You may need to create an API endpoint for customer photo operations
    throw new Error('Customer photo operations not yet implemented in API.');
  } catch (error) {
    console.error('Error creating customer photo:', error)
    throw error
  }
}

// Delete customer photo - Note: This function uses direct Supabase calls
// TODO: Create API endpoint for customer photo operations
export async function deleteCustomerPhoto(id: string): Promise<void> {
  try {
    // This function still uses direct Supabase calls as there's no API endpoint for customer photos
    // You may need to create an API endpoint for customer photo operations
    throw new Error('Customer photo operations not yet implemented in API.');
  } catch (error) {
    console.error('Error deleting customer photo:', error)
    throw error
  }
}



// Get customer statistics using API
export async function getCustomerStats(companyId?: string): Promise<{
  total: number
  individual: number
  company: number
  active: number
  inactive: number
}> {
  try {
    const params: any = { limit: 1000 };
    if (companyId) {
      params.company_id = companyId;
    }

    const response = await apiClient.get('/customers', { params });
    
    if (response.success && response.data) {
      const customers = (response.data as any).customers || response.data || [];
      
      return {
        total: customers.length,
        individual: customers.filter((c: any) => c.customer_type === 'individual').length,
        company: customers.filter((c: any) => c.customer_type === 'company').length,
        active: customers.filter((c: any) => c.is_active).length,
        inactive: customers.filter((c: any) => !c.is_active).length
      };
    }
    
    throw new Error(response.error || 'Failed to fetch customer stats');
  } catch (error) {
    console.error('Error fetching customer stats:', error);
    throw error;
  }
}

// Create customer with contact info using API
export async function createCustomerWithContacts(
  customerData: CustomerInsert, 
  contactInfo: ContactInfo[]
): Promise<Customer> {
  try {
    // Prepare contacts data for JSON storage
    const contactsForStorage = contactInfo.map(contact => ({
      id: contact.id,
      first_name: contact.first_name,
      last_name: contact.last_name,
      relationship: contact.relationship,
      phone: contact.phone
    }))

    // Create customer with contacts using API
    const response = await apiClient.post('/api/customers', {
      ...customerData,
      contacts: contactsForStorage
    });
    
    if (response.success && response.data) {
      return (response.data as any).customer || response.data;
    }
    
    throw new Error(response.error || 'Failed to create customer with contacts');
  } catch (error) {
    console.error('Error creating customer with contacts:', error);
    throw error;
  }
}

// Update customer contacts using API
export async function updateCustomerContacts(
  customerId: string, 
  newContacts: Omit<ContactInfo, 'id' | 'customer_id'>[]
): Promise<void> {
  try {
    // Get existing customer to access current contacts
    const existingResponse = await apiClient.get(`/customers/${customerId}`);
    
    if (!existingResponse.success || !existingResponse.data) {
      throw new Error('Failed to fetch existing customer');
    }

    const existingCustomer = (existingResponse.data as any).customer || existingResponse.data;

    // Prepare new contacts data for JSON storage
    const newContactsForStorage = newContacts.map(contact => ({
      id: crypto.randomUUID(), // Generate new ID for each contact
      first_name: contact.first_name,
      last_name: contact.last_name,
      relationship: contact.relationship,
      phone: contact.phone
    }))

    // Merge existing contacts with new contacts
    const existingContacts = existingCustomer.contacts || []
    const updatedContacts = [...existingContacts, ...newContactsForStorage]

    // Update the customer with merged contacts using API
    const response = await apiClient.put(`/api/customers/${customerId}`, { 
      contacts: updatedContacts 
    });

    if (!response.success) {
      throw new Error(response.error || 'Failed to update customer contacts');
    }
  } catch (error) {
    console.error('Error updating customer contacts:', error);
    throw error;
  }
}

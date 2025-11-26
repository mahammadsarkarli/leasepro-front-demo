import { createCustomerWithContacts, getCustomersByCompany, updateCustomer, updateCustomerContacts } from './customers'
import { ContactInfo, CustomerType } from '../types'

export interface CustomerImportData {
  customer_name: string; // Full name like "ƏBİLOV SAHİN RAFİL"
  customer_phone: string; // Main customer phone
  additional_contacts: string; // Complex string like "0554734903-Rövşən 0514619946-Anası 0558525251-Vüsal 0503941328-Samir"
  company_name?: string; // Company name if detected in customer data
}

export interface ExcelAnalysisResult {
  customers: CustomerImportData[];
  detectedCompanies: string[];
  suggestedCompanyId?: string;
  companyMatchConfidence: number;
}

export interface CustomerComparisonResult {
  newCustomers: CustomerImportData[];
  existingCustomers: Array<{
    importData: CustomerImportData;
    existingCustomer: any;
    needsUpdate: boolean;
    missingFields: string[];
  }>;
  summary: {
    total: number;
    new: number;
    existing: number;
    needsUpdate: number;
  };
}

/**
 * Detect company names from customer data
 * Looks for patterns like "Hövsan Taksi", "Company Name", etc.
 */
function detectCompanyFromCustomerData(customerName: string, additionalContacts: string): string | null {
  // Common company indicators in Azerbaijani
  const companyIndicators = [
    'taksi', 'taxi', 'şirkəti', 'şirketi', 'company', 'müəssisə', 'müessise',
    'avtobaza', 'avtobaza', 'servis', 'service', 'center', 'mərkəz', 'merkez'
  ];
  
  // Check if customer name contains company indicators
  const normalizedName = customerName.toLowerCase();
  for (const indicator of companyIndicators) {
    if (normalizedName.includes(indicator)) {
      return customerName; // This customer name is actually a company name
    }
  }
  
  // Check additional contacts for company names
  if (additionalContacts) {
    const normalizedContacts = additionalContacts.toLowerCase();
    for (const indicator of companyIndicators) {
      if (normalizedContacts.includes(indicator)) {
        // Extract the company name from contacts
        const contactParts = additionalContacts.split(' ');
        for (const part of contactParts) {
          if (part.toLowerCase().includes(indicator)) {
            return part;
          }
        }
      }
    }
  }
  
  return null;
}

/**
 * Find best matching company from existing companies
 */
function findBestCompanyMatch(
  detectedCompanies: string[], 
  existingCompanies: Array<{ id: string; name: string }>
): { companyId: string; confidence: number } | null {
  if (detectedCompanies.length === 0 || existingCompanies.length === 0) {
    return null;
  }
  
  let bestMatch: { companyId: string; confidence: number } | null = null;
  
  for (const detectedCompany of detectedCompanies) {
    for (const existingCompany of existingCompanies) {
      const confidence = calculateCompanyNameSimilarity(detectedCompany, existingCompany.name);
      
      if (confidence > 0.7 && (!bestMatch || confidence > bestMatch.confidence)) {
        bestMatch = {
          companyId: existingCompany.id,
          confidence: confidence
        };
      }
    }
  }
  
  return bestMatch;
}

/**
 * Calculate similarity between two company names
 */
function calculateCompanyNameSimilarity(name1: string, name2: string): number {
  const normalizeName = (name: string) => 
    name.toLowerCase()
      .replace(/[ğ]/g, 'g')
      .replace(/[ü]/g, 'u')
      .replace(/[ş]/g, 's')
      .replace(/[ı]/g, 'i')
      .replace(/[ö]/g, 'o')
      .replace(/[ç]/g, 'c')
      .trim();
  
  const normalized1 = normalizeName(name1);
  const normalized2 = normalizeName(name2);
  
  // Exact match
  if (normalized1 === normalized2) return 1.0;
  
  // Check if one contains the other
  if (normalized1.includes(normalized2) || normalized2.includes(normalized1)) {
    return 0.9;
  }
  
  // Check word similarity
  const words1 = normalized1.split(' ').filter(w => w.length > 2);
  const words2 = normalized2.split(' ').filter(w => w.length > 2);
  
  if (words1.length === 0 || words2.length === 0) return 0.0;
  
  const commonWords = words1.filter(word => words2.includes(word));
  const totalWords = Math.max(words1.length, words2.length);
  
  return commonWords.length / totalWords;
}

/**
 * Analyze Excel data and detect company information
 */
export async function analyzeExcelData(
  customersData: CustomerImportData[],
  existingCompanies: Array<{ id: string; name: string }>
): Promise<ExcelAnalysisResult> {
  const detectedCompanies: string[] = [];
  
  // Analyze each customer for company names
  for (const customer of customersData) {
    const companyName = detectCompanyFromCustomerData(customer.customer_name, customer.additional_contacts);
    if (companyName) {
      customer.company_name = companyName;
      if (!detectedCompanies.includes(companyName)) {
        detectedCompanies.push(companyName);
      }
    }
  }
  
  // Find best company match
  const companyMatch = findBestCompanyMatch(detectedCompanies, existingCompanies);
  
  return {
    customers: customersData,
    detectedCompanies: detectedCompanies,
    suggestedCompanyId: companyMatch?.companyId,
    companyMatchConfidence: companyMatch?.confidence || 0
  };
}

/**
 * Parse customer name into first_name, last_name, father_name
 * Format: "ƏBİLOV SAHİN RAFİL" -> first_name: "SAHİN", last_name: "ƏBİLOV", father_name: "RAFİL"
 */
function parseCustomerName(fullName: string): { first_name: string; last_name: string; father_name: string } {
  const parts = fullName.trim().split(' ').filter(part => part.length > 0);
  
  if (parts.length === 1) {
    return {
      first_name: parts[0],
      last_name: '',
      father_name: ''
    };
  } else if (parts.length === 2) {
    return {
      first_name: parts[1],
      last_name: parts[0],
      father_name: ''
    };
  } else if (parts.length >= 3) {
    return {
      first_name: parts[1],
      last_name: parts[0],
      father_name: parts[2]
    };
  }
  
  return {
    first_name: '',
    last_name: '',
    father_name: ''
  };
}

/**
 * Parse additional contacts from the complex string format
 * Format: "0554734903-Rövşən 0514619946-Anası 0558525251-Vüsal 0503941328-Samir"
 */
function parseAdditionalContacts(contactsString: string): Array<{ name: string; phone: string; relationship: string }> {
  if (!contactsString || contactsString.trim() === '') {
    return [];
  }

  // Split by spaces to get individual contact entries
  const contactEntries = contactsString.trim().split(' ').filter(entry => entry.trim() !== '');
  
  return contactEntries.map(entry => {
    // Each entry is in format: "phone-name" or "phone-relationship"
    const parts = entry.split('-');
    if (parts.length >= 2) {
      const phone = parts[0];
      const nameOrRelationship = parts.slice(1).join('-'); // In case name has hyphens
      
      return {
        name: nameOrRelationship,
        phone: phone,
        relationship: nameOrRelationship
      };
    }
    
    // Fallback if format is unexpected
    return {
      name: entry,
      phone: '',
      relationship: entry
    };
  });
}

/**
 * Transform import data to customer format
 */
function transformImportData(
  importData: CustomerImportData,
  companyId: string
): { customer: any; contacts: any[] } {
  const { first_name, last_name, father_name } = parseCustomerName(importData.customer_name);
  
  // Create primary contact (customer's own phone)
  const primaryContact = {
    first_name: first_name,
    last_name: last_name,
    relationship: 'Özü',
    phone: importData.customer_phone
  };
  
  // Parse additional contacts from the string format
  const additionalContacts = parseAdditionalContacts(importData.additional_contacts);
  
  return {
    customer: {
      company_id: companyId,
      customer_type: CustomerType.INDIVIDUAL,
      first_name,
      last_name,
      father_name,
      phone: importData.customer_phone,
      address: '', // Will need to be filled manually
      is_active: true
    },
    contacts: [primaryContact, ...additionalContacts]
  };
}

/**
 * Compare customer names for similarity (handles different name formats)
 */
function compareCustomerNames(name1: string, name2: string): boolean {
  const normalizeName = (name: string) => 
    name.toLowerCase()
      .replace(/[ğ]/g, 'g')
      .replace(/[ü]/g, 'u')
      .replace(/[ş]/g, 's')
      .replace(/[ı]/g, 'i')
      .replace(/[ö]/g, 'o')
      .replace(/[ç]/g, 'c')
      .trim();
  
  const normalized1 = normalizeName(name1);
  const normalized2 = normalizeName(name2);
  
  // Exact match
  if (normalized1 === normalized2) return true;
  
  // Check if one name contains the other (for partial matches)
  if (normalized1.includes(normalized2) || normalized2.includes(normalized1)) return true;
  
  // Check if they share significant parts (for name variations)
  const parts1 = normalized1.split(' ').filter(p => p.length > 2);
  const parts2 = normalized2.split(' ').filter(p => p.length > 2);
  
  const commonParts = parts1.filter(part => parts2.includes(part));
  return commonParts.length >= 2; // At least 2 significant parts match
}

/**
 * Compare Excel data with existing customers to identify new vs existing
 */
export async function compareWithExistingCustomers(
  customersData: CustomerImportData[],
  companyId: string
): Promise<CustomerComparisonResult> {
  try {
    // Get existing customers for this company
    const existingCustomers = await getCustomersByCompany(companyId);
    console.log(`Found ${existingCustomers.length} existing customers for company ${companyId}`);
    
    const result: CustomerComparisonResult = {
      newCustomers: [],
      existingCustomers: [],
      summary: {
        total: customersData.length,
        new: 0,
        existing: 0,
        needsUpdate: 0
      }
    };
    
    for (const importData of customersData) {
      // Try to find matching existing customer
      const existingCustomer = existingCustomers.find(existing => 
        compareCustomerNames(existing.first_name + ' ' + existing.last_name + ' ' + (existing.father_name || ''), importData.customer_name) ||
        existing.phone === importData.customer_phone
      );
      
      if (existingCustomer) {
        // Customer exists - check if update is needed
        const missingFields: string[] = [];
        
        // Check if additional contacts are missing
        if (importData.additional_contacts && importData.additional_contacts.trim() !== '') {
          const existingContacts = existingCustomer.contacts || [];
          const additionalContacts = parseAdditionalContacts(importData.additional_contacts);
          
          // Check if any new contacts need to be added
          const newContacts = additionalContacts.filter(newContact => 
            !existingContacts.some(existing => 
              existing.phone === newContact.phone || 
              existing.relationship === newContact.relationship
            )
          );
          
          if (newContacts.length > 0) {
            missingFields.push(`Missing ${newContacts.length} additional contacts`);
          }
        }
        
        // Check if phone number is missing
        if (!existingCustomer.phone && importData.customer_phone) {
          missingFields.push('Missing phone number');
        }
        
        result.existingCustomers.push({
          importData,
          existingCustomer,
          needsUpdate: missingFields.length > 0,
          missingFields
        });
        
        result.summary.existing++;
        if (missingFields.length > 0) {
          result.summary.needsUpdate++;
        }
      } else {
        // New customer
        result.newCustomers.push(importData);
        result.summary.new++;
      }
    }
    
    return result;
  } catch (error) {
    console.error('Error comparing with existing customers:', error);
    throw error;
  }
}

/**
 * Update existing customer with missing information
 */
export async function updateExistingCustomer(
  existingCustomer: any,
  importData: CustomerImportData
): Promise<void> {
  try {
    const updates: any = {};
    
    // Update phone if missing
    if (!existingCustomer.phone && importData.customer_phone) {
      updates.phone = importData.customer_phone;
    }
    
    // Update customer if needed
    if (Object.keys(updates).length > 0) {
      await updateCustomer(existingCustomer.id, updates);
    }
    
    // Add missing contacts
    if (importData.additional_contacts && importData.additional_contacts.trim() !== '') {
      const existingContacts = existingCustomer.contacts || [];
      const additionalContacts = parseAdditionalContacts(importData.additional_contacts);
      
      // Filter out contacts that already exist
      const newContacts = additionalContacts.filter(newContact => 
        !existingContacts.some(existing => 
          existing.phone === newContact.phone || 
          existing.relationship === newContact.relationship
        )
      );
      
      if (newContacts.length > 0) {
        // Transform contacts to the format expected by updateCustomerContacts
        const contactsToAdd = newContacts.map(contact => ({
          customer_id: existingCustomer.id,
          first_name: contact.name.split(' ')[0] || contact.name,
          last_name: contact.name.split(' ').slice(1).join(' ') || '',
          relationship: contact.relationship,
          phone: contact.phone
        }));
        
        await updateCustomerContacts(existingCustomer.id, contactsToAdd);
      }
    }
  } catch (error) {
    console.error('Error updating existing customer:', error);
    throw error;
  }
}

/**
 * Import a single customer with contacts
 */
export async function importCustomer(
  importData: CustomerImportData,
  companyId: string
): Promise<string> {
  try {
    const transformedData = transformImportData(importData, companyId);
    const customer = await createCustomerWithContacts(
      transformedData.customer,
      transformedData.contacts
    );
    return customer.id;
  } catch (error) {
    console.error('Error importing customer:', error);
    throw new Error(`Failed to import customer ${importData.customer_name}: ${error}`);
  }
}

/**
 * Smart import that handles both new customers and updates to existing ones
 */
export async function smartImportCustomers(
  customersData: CustomerImportData[],
  companyId: string
): Promise<{ success: number; failed: number; updated: number; errors: string[] }> {
  try {
    // First, compare with existing customers
    const comparison = await compareWithExistingCustomers(customersData, companyId);
    
    const results = {
      success: 0,
      failed: 0,
      updated: 0,
      errors: [] as string[]
    };
    
    // Import new customers
    for (const customerData of comparison.newCustomers) {
      try {
        await importCustomer(customerData, companyId);
        results.success++;
      } catch (error) {
        results.failed++;
        results.errors.push(`New customer ${customerData.customer_name}: ${error}`);
      }
    }
    
    // Update existing customers
    for (const existingData of comparison.existingCustomers) {
      if (existingData.needsUpdate) {
        try {
          await updateExistingCustomer(existingData.existingCustomer, existingData.importData);
          results.updated++;
        } catch (error) {
          results.failed++;
          results.errors.push(`Update customer ${existingData.importData.customer_name}: ${error}`);
        }
      }
    }
    
    return results;
  } catch (error) {
    console.error('Error in smart import:', error);
    throw error;
  }
}

/**
 * Import multiple customers (legacy function - kept for backward compatibility)
 */
export async function importCustomers(
  customersData: CustomerImportData[],
  companyId: string
): Promise<{ success: number; failed: number; errors: string[] }> {
  const results = {
    success: 0,
    failed: 0,
    errors: [] as string[]
  };
  
  for (const customerData of customersData) {
    try {
      await importCustomer(customerData, companyId);
      results.success++;
    } catch (error) {
      results.failed++;
      results.errors.push(`${customerData.customer_name}: ${error}`);
    }
  }
  
  return results;
}

import { Company, Customer, Contract, Payment, Vehicle, ContractStatus, CustomerType } from '../types';
import { addMonths } from 'date-fns';

// Storage keys
const STORAGE_KEYS = {
  COMPANIES: 'lease_companies',
  CUSTOMERS: 'lease_customers',
  CONTRACTS: 'lease_contracts',
  PAYMENTS: 'lease_payments',
  VEHICLES: 'lease_vehicles',
};

// Helper functions
const getFromStorage = <T>(key: string): T[] => {
  try {
    const item = localStorage.getItem(key);
    if (!item) return [];
    const data = JSON.parse(item);
    // Convert date strings back to Date objects
    return data.map((item: any) => {
      const convertedItem = { ...item };
      
      // Only convert dates if they exist and are valid
      if (item.createdAt) {
        const createdAt = new Date(item.createdAt);
        convertedItem.createdAt = isNaN(createdAt.getTime()) ? new Date() : createdAt;
      }
      if (item.startDate) {
        const startDate = new Date(item.startDate);
        convertedItem.startDate = isNaN(startDate.getTime()) ? new Date() : startDate;
      }
      if (item.nextDueDate) {
        const nextDueDate = new Date(item.nextDueDate);
        convertedItem.nextDueDate = isNaN(nextDueDate.getTime()) ? new Date() : nextDueDate;
      }
      if (item.paymentDate) {
        const paymentDate = new Date(item.paymentDate);
        convertedItem.paymentDate = isNaN(paymentDate.getTime()) ? new Date() : paymentDate;
      }
      if (item.date) {
        const date = new Date(item.date);
        convertedItem.date = isNaN(date.getTime()) ? new Date() : date;
      }
      if (item.dueDate) {
        const dueDate = new Date(item.dueDate);
        convertedItem.dueDate = isNaN(dueDate.getTime()) ? new Date() : dueDate;
      }
      if (item.updatedAt) {
        const updatedAt = new Date(item.updatedAt);
        convertedItem.updatedAt = isNaN(updatedAt.getTime()) ? new Date() : updatedAt;
      }
      
      return convertedItem;
    });
  } catch (error) {
    console.error(`Error reading from localStorage (${key}):`, error);
    return [];
  }
};

const saveToStorage = <T>(key: string, data: T[]): void => {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (error) {
    console.error(`Error saving to localStorage (${key}):`, error);
  }
};

// Generate unique ID
const generateId = (): string => {
  return `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

// Company operations
export const companyService = {
  getAll: (): Company[] => getFromStorage<Company>(STORAGE_KEYS.COMPANIES),
  
  getById: (id: string): Company | undefined => {
    const companies = getFromStorage<Company>(STORAGE_KEYS.COMPANIES);
    return companies.find(company => company.id === id);
  },
  
  create: (companyData: Omit<Company, 'id' | 'createdAt'>): Company => {
    const companies = getFromStorage<Company>(STORAGE_KEYS.COMPANIES);
    const newCompany: Company = {
      ...companyData,
      id: generateId(),
      createdAt: new Date()
    };
    companies.push(newCompany);
    saveToStorage(STORAGE_KEYS.COMPANIES, companies);
    return newCompany;
  },
  
  update: (id: string, updates: Partial<Company>): Company | null => {
    const companies = getFromStorage<Company>(STORAGE_KEYS.COMPANIES);
    const index = companies.findIndex(company => company.id === id);
    if (index === -1) return null;
    
    companies[index] = { ...companies[index], ...updates };
    saveToStorage(STORAGE_KEYS.COMPANIES, companies);
    return companies[index];
  },
  
  delete: (id: string): boolean => {
    const companies = getFromStorage<Company>(STORAGE_KEYS.COMPANIES);
    const filteredCompanies = companies.filter(company => company.id !== id);
    if (filteredCompanies.length === companies.length) return false;
    
    saveToStorage(STORAGE_KEYS.COMPANIES, filteredCompanies);
    return true;
  }
};

// Customer operations
export const customerService = {
  getAll: (): Customer[] => getFromStorage<Customer>(STORAGE_KEYS.CUSTOMERS),
  
  getById: (id: string): Customer | undefined => {
    const customers = getFromStorage<Customer>(STORAGE_KEYS.CUSTOMERS);
    return customers.find(customer => customer.id === id);
  },
  
  getByCompany: (companyId: string): Customer[] => {
    const customers = getFromStorage<Customer>(STORAGE_KEYS.CUSTOMERS);
    return customers.filter(customer => customer.companyId === companyId);
  },
  
  create: (customerData: Omit<Customer, 'id' | 'createdAt'>): Customer => {
    const customers = getFromStorage<Customer>(STORAGE_KEYS.CUSTOMERS);
    const newCustomer: Customer = {
      ...customerData,
      contacts: customerData.contacts || [],
      id: generateId(),
      createdAt: new Date()
    };
    customers.push(newCustomer);
    saveToStorage(STORAGE_KEYS.CUSTOMERS, customers);
    return newCustomer;
  },
  
  update: (id: string, updates: Partial<Customer>): Customer | null => {
    const customers = getFromStorage<Customer>(STORAGE_KEYS.CUSTOMERS);
    const index = customers.findIndex(customer => customer.id === id);
    if (index === -1) return null;
    
    customers[index] = { ...customers[index], ...updates };
    saveToStorage(STORAGE_KEYS.CUSTOMERS, customers);
    return customers[index];
  },
  
  delete: (id: string): boolean => {
    const customers = getFromStorage<Customer>(STORAGE_KEYS.CUSTOMERS);
    const filteredCustomers = customers.filter(customer => customer.id !== id);
    if (filteredCustomers.length === customers.length) return false;
    
    saveToStorage(STORAGE_KEYS.CUSTOMERS, filteredCustomers);
    return true;
  }
};

// Vehicle operations
export const vehicleService = {
  getAll: (): Vehicle[] => getFromStorage<Vehicle>(STORAGE_KEYS.VEHICLES),
  
  getById: (id: string): Vehicle | undefined => {
    const vehicles = getFromStorage<Vehicle>(STORAGE_KEYS.VEHICLES);
    return vehicles.find(vehicle => vehicle.id === id);
  },
  
  create: (vehicleData: Omit<Vehicle, 'id'>): Vehicle => {
    const vehicles = getFromStorage<Vehicle>(STORAGE_KEYS.VEHICLES);
    const newVehicle: Vehicle = {
      ...vehicleData,
      id: generateId()
    };
    vehicles.push(newVehicle);
    saveToStorage(STORAGE_KEYS.VEHICLES, vehicles);
    return newVehicle;
  },
  
  update: (id: string, updates: Partial<Vehicle>): Vehicle | null => {
    const vehicles = getFromStorage<Vehicle>(STORAGE_KEYS.VEHICLES);
    const index = vehicles.findIndex(vehicle => vehicle.id === id);
    if (index === -1) return null;
    
    vehicles[index] = { ...vehicles[index], ...updates };
    saveToStorage(STORAGE_KEYS.VEHICLES, vehicles);
    return vehicles[index];
  },
  
  delete: (id: string): boolean => {
    const vehicles = getFromStorage<Vehicle>(STORAGE_KEYS.VEHICLES);
    const filteredVehicles = vehicles.filter(vehicle => vehicle.id !== id);
    if (filteredVehicles.length === vehicles.length) return false;
    
    saveToStorage(STORAGE_KEYS.VEHICLES, filteredVehicles);
    return true;
  },

  getByCompany: (companyId: string): Vehicle[] => {
    const vehicles = getFromStorage<Vehicle>(STORAGE_KEYS.VEHICLES);
    return vehicles.filter(vehicle => vehicle.companyId === companyId);
  },

  getAvailableByCompany: (companyId: string): Vehicle[] => {
    const vehicles = getFromStorage<Vehicle>(STORAGE_KEYS.VEHICLES);
    const contracts = getFromStorage<Contract>(STORAGE_KEYS.CONTRACTS);
    
    return vehicles.filter(vehicle => {
      // Filter by company
      if (vehicle.companyId !== companyId) {
        return false;
      }
      
      // Check if vehicle is in an active contract
      const isInActiveContract = contracts.some(contract => 
        contract.status === ContractStatus.ACTIVE && 
        contract.vehicle.id === vehicle.id
      );
      
      return !isInActiveContract;
    });
  }
};

// Contract operations
export const contractService = {
  getAll: (): Contract[] => getFromStorage<Contract>(STORAGE_KEYS.CONTRACTS),
  
  getById: (id: string): Contract | undefined => {
    const contracts = getFromStorage<Contract>(STORAGE_KEYS.CONTRACTS);
    return contracts.find(contract => contract.id === id);
  },
  
  getByCustomer: (customerId: string): Contract[] => {
    const contracts = getFromStorage<Contract>(STORAGE_KEYS.CONTRACTS);
    return contracts.filter(contract => contract.customerId === customerId);
  },
  
  getByCompany: (companyId: string): Contract[] => {
    const contracts = getFromStorage<Contract>(STORAGE_KEYS.CONTRACTS);
    return contracts.filter(contract => contract.companyId === companyId);
  },

  // Check if vehicle is already in an active contract
  isVehicleInActiveContract: (vehicleId: string, excludeContractId?: string): boolean => {
    const contracts = getFromStorage<Contract>(STORAGE_KEYS.CONTRACTS);
    return contracts.some(contract => 
      contract.status === ContractStatus.ACTIVE && 
      contract.vehicle.id === vehicleId &&
      contract.id !== excludeContractId
    );
  },

  // Get active contract for a vehicle
  getActiveContractForVehicle: (vehicleId: string): Contract | undefined => {
    const contracts = getFromStorage<Contract>(STORAGE_KEYS.CONTRACTS);
    return contracts.find(contract => 
      contract.status === ContractStatus.ACTIVE && 
      contract.vehicle.id === vehicleId
    );
  },
  
  create: (contractData: Omit<Contract, 'id'>): Contract => {
    const contracts = getFromStorage<Contract>(STORAGE_KEYS.CONTRACTS);
    
    // Check if vehicle is already in an active contract
    if (contractService.isVehicleInActiveContract(contractData.vehicle.id)) {
      throw new Error('Vehicle is already in an active contract');
    }
    
    const newContract: Contract = {
      ...contractData,
      id: generateId(),
      remainingBalance: contractData.remainingBalance ?? contractData.totalPayable,
      totalPaid: contractData.totalPaid ?? 0,
      paymentsCount: contractData.paymentsCount ?? 0,
      lastPaymentDate: contractData.lastPaymentDate
    };
    contracts.push(newContract);
    saveToStorage(STORAGE_KEYS.CONTRACTS, contracts);
    return newContract;
  },
  
  update: (id: string, updates: Partial<Contract>): Contract => {
    const contracts = getFromStorage<Contract>(STORAGE_KEYS.CONTRACTS);
    const index = contracts.findIndex(c => c.id === id);
    if (index === -1) {
      throw new Error('Contract not found');
    }
    
    // If vehicle is being changed, check if new vehicle is already in an active contract
    if (updates.vehicle && updates.vehicle.id !== contracts[index].vehicle.id) {
      if (contractService.isVehicleInActiveContract(updates.vehicle.id, id)) {
        throw new Error('Vehicle is already in an active contract');
      }
    }
    
    contracts[index] = { ...contracts[index], ...updates };
    saveToStorage(STORAGE_KEYS.CONTRACTS, contracts);
    return contracts[index];
  },
  
  delete: (contract: Contract): boolean => {
    const contracts = getFromStorage<Contract>(STORAGE_KEYS.CONTRACTS);
    const filteredContracts = contracts.filter(c => c.id !== contract.id);
    if (filteredContracts.length === contracts.length) return false;
    
    saveToStorage(STORAGE_KEYS.CONTRACTS, filteredContracts);
    return true;
  },

  // Update permission document for a contract
  updatePermissionDocument: (contractId: string, permissionDocument: any): Contract => {
    const contracts = getFromStorage<Contract>(STORAGE_KEYS.CONTRACTS);
    const index = contracts.findIndex(c => c.id === contractId);
    if (index === -1) {
      throw new Error('Contract not found');
    }
    
    contracts[index] = { 
      ...contracts[index], 
      permissionDocument: {
        ...permissionDocument,
        beginDate: new Date(permissionDocument.beginDate),
        endDate: new Date(permissionDocument.endDate),
        createdAt: permissionDocument.createdAt ? new Date(permissionDocument.createdAt) : new Date(),
        updatedAt: new Date()
      }
    };
    saveToStorage(STORAGE_KEYS.CONTRACTS, contracts);
    return contracts[index];
  },

  // Close contract with specified status and handle vehicle reclamation
  closeContract: (contractId: string, closeReason: 'completed_early' | 'defaulted_closed' | 'imtina_edilmis' | 'alqi_satqi' | 'tamamlanmis', closeDate: Date, notes?: string): Contract => {
    const contracts = getFromStorage<Contract>(STORAGE_KEYS.CONTRACTS);
    const index = contracts.findIndex(c => c.id === contractId);
    if (index === -1) {
      throw new Error('Contract not found');
    }

    const contract = contracts[index];
    
    // Validate contract can be closed
    if (contract.status !== ContractStatus.ACTIVE && contract.status !== ContractStatus.OPEN) {
      throw new Error('Only active or open contracts can be closed');
    }

    // Update contract status based on close reason
    let newStatus: ContractStatus;
    let newRemainingBalance = contract.remaining_balance;
    
    switch (closeReason) {
      case 'completed_early':
        newStatus = ContractStatus.COMPLETED_EARLY;
        break;
      case 'defaulted_closed':
        newStatus = ContractStatus.DEFAULTED_CLOSED;
        newRemainingBalance = 0; // Vehicle reclaimed
        break;
      case 'imtina_edilmis':
        newStatus = ContractStatus.IMTINA_EDILMIS;
        newRemainingBalance = 0; // Vehicle reclaimed
        break;
      case 'alqi_satqi':
        newStatus = ContractStatus.ALQI_SATQI;
        newRemainingBalance = 0; // Vehicle transferred
        break;
      case 'tamamlanmis':
        newStatus = ContractStatus.TAMAMLANMIS;
        newRemainingBalance = 0; // Fully paid
        break;
      default:
        newStatus = ContractStatus.COMPLETED_EARLY;
    }
    
    contracts[index] = {
      ...contract,
      status: newStatus,
      // Add close date and notes to contract
      closeDate: closeDate,
      closeNotes: notes,
      remaining_balance: newRemainingBalance
    };

    saveToStorage(STORAGE_KEYS.CONTRACTS, contracts);

    // If defaulted, imtina edilmis, alqi satqi, or tamamlanmis, the vehicle is reclaimed/transferred
    // The vehicle will become available for new contracts
    // This is handled automatically by the isVehicleInActiveContract function
    // since the contract status is no longer ACTIVE

    return contracts[index];
  }
};

// Payment operations
export const paymentService = {
  getAll: (): Payment[] => getFromStorage<Payment>(STORAGE_KEYS.PAYMENTS),
  
  getById: (id: string): Payment | undefined => {
    const payments = getFromStorage<Payment>(STORAGE_KEYS.PAYMENTS);
    return payments.find(payment => payment.id === id);
  },
  
  getByContract: (contractId: string): Payment[] => {
    const payments = getFromStorage<Payment>(STORAGE_KEYS.PAYMENTS);
    return payments.filter(payment => payment.contractId === contractId);
  },
  
  getByCustomer: (customerId: string): Payment[] => {
    const payments = getFromStorage<Payment>(STORAGE_KEYS.PAYMENTS);
    return payments.filter(payment => payment.customerId === customerId);
  },
  
  getByCompany: (companyId: string): Payment[] => {
    const payments = getFromStorage<Payment>(STORAGE_KEYS.PAYMENTS);
    return payments.filter(payment => payment.companyId === companyId);
  },
  
  create: (paymentData: Omit<Payment, 'id' | 'createdAt' | 'updatedAt'>): Payment => {
    const payments = getFromStorage<Payment>(STORAGE_KEYS.PAYMENTS);
    const now = new Date();
    const newPayment: Payment = {
      ...paymentData,
      id: generateId(),
      createdAt: now,
      updatedAt: now
    };
    payments.push(newPayment);
    saveToStorage(STORAGE_KEYS.PAYMENTS, payments);
    return newPayment;
  },
  
  update: (id: string, updates: Partial<Payment>): Payment | null => {
    const payments = getFromStorage<Payment>(STORAGE_KEYS.PAYMENTS);
    const index = payments.findIndex(payment => payment.id === id);
    if (index === -1) return null;
    
    payments[index] = { 
      ...payments[index], 
      ...updates,
      updatedAt: new Date()
    };
    saveToStorage(STORAGE_KEYS.PAYMENTS, payments);
    return payments[index];
  },
  
  delete: (id: string): boolean => {
    const payments = getFromStorage<Payment>(STORAGE_KEYS.PAYMENTS);
    const filteredPayments = payments.filter(payment => payment.id !== id);
    if (filteredPayments.length === payments.length) return false;
    
    saveToStorage(STORAGE_KEYS.PAYMENTS, filteredPayments);
    return true;
  }
};

// Superadmin data management operations
export const superadminService = {
  // Get all companies
  getAllCompanies: (): Company[] => getFromStorage<Company>(STORAGE_KEYS.COMPANIES),

  // Delete all data for a specific company
  // Delete all data for a specific company
  deleteCompanyData: (companyId: string): boolean => {
    try {
      // Delete company
      const companies = getFromStorage<Company>(STORAGE_KEYS.COMPANIES);
      const filteredCompanies = companies.filter(company => company.id !== companyId);
      saveToStorage(STORAGE_KEYS.COMPANIES, filteredCompanies);

      // Delete customers
      const customers = getFromStorage<Customer>(STORAGE_KEYS.CUSTOMERS);
      const filteredCustomers = customers.filter(customer => customer.companyId !== companyId);
      saveToStorage(STORAGE_KEYS.CUSTOMERS, filteredCustomers);

      // Delete vehicles
      const vehicles = getFromStorage<Vehicle>(STORAGE_KEYS.VEHICLES);
      const filteredVehicles = vehicles.filter(vehicle => vehicle.companyId !== companyId);
      saveToStorage(STORAGE_KEYS.VEHICLES, filteredVehicles);

      // Delete contracts
      const contracts = getFromStorage<Contract>(STORAGE_KEYS.CONTRACTS);
      const filteredContracts = contracts.filter(contract => contract.companyId !== companyId);
      saveToStorage(STORAGE_KEYS.CONTRACTS, filteredContracts);

      // Delete payments
      const payments = getFromStorage<Payment>(STORAGE_KEYS.PAYMENTS);
      const filteredPayments = payments.filter(payment => payment.companyId !== companyId);
      saveToStorage(STORAGE_KEYS.PAYMENTS, filteredPayments);

      return true;
    } catch (error) {
      console.error('Error deleting company data:', error);
      return false;
    }
  },

  // Delete all data in the system
  deleteAllData: (): boolean => {
    try {
      // Clear all storage keys
      Object.values(STORAGE_KEYS).forEach(key => {
        localStorage.removeItem(key);
      });
      return true;
    } catch (error) {
      console.error('Error deleting all data:', error);
      return false;
    }
  },

  // Get system statistics
  getSystemStats: () => {
    const companies = getFromStorage<Company>(STORAGE_KEYS.COMPANIES);
    const customers = getFromStorage<Customer>(STORAGE_KEYS.CUSTOMERS);
    const contracts = getFromStorage<Contract>(STORAGE_KEYS.CONTRACTS);
    const payments = getFromStorage<Payment>(STORAGE_KEYS.PAYMENTS);
    const vehicles = getFromStorage<Vehicle>(STORAGE_KEYS.VEHICLES);
    return {
      totalCompanies: companies.length,
      totalCustomers: customers.length,
      totalContracts: contracts.length,
      totalPayments: payments.length,
      totalVehicles: vehicles.length,
      activeContracts: contracts.filter(c => c.status === 'active').length,
      completedContracts: contracts.filter(c => c.status === 'completed').length,
      defaultedContracts: contracts.filter(c => c.status === 'defaulted').length,
      totalRevenue: payments.reduce((sum, p) => sum + p.amount, 0),
      totalInterest: payments.reduce((sum, p) => sum + p.interestAmount, 0)
    };
  },

  // Export all data as JSON
  exportAllData: (): string => {
    const data = {
      companies: getFromStorage<Company>(STORAGE_KEYS.COMPANIES),
      customers: getFromStorage<Customer>(STORAGE_KEYS.CUSTOMERS),
      contracts: getFromStorage<Contract>(STORAGE_KEYS.CONTRACTS),
      payments: getFromStorage<Payment>(STORAGE_KEYS.PAYMENTS),
      vehicles: getFromStorage<Vehicle>(STORAGE_KEYS.VEHICLES),
      exportDate: new Date().toISOString()
    };
    return JSON.stringify(data, null, 2);
  },

  // Import data from JSON
  importData: (jsonData: string): boolean => {
    try {
      const data = JSON.parse(jsonData);
      
      if (data.companies) saveToStorage(STORAGE_KEYS.COMPANIES, data.companies);
      if (data.customers) saveToStorage(STORAGE_KEYS.CUSTOMERS, data.customers);
      if (data.contracts) saveToStorage(STORAGE_KEYS.CONTRACTS, data.contracts);
      if (data.payments) saveToStorage(STORAGE_KEYS.PAYMENTS, data.payments);
      if (data.vehicles) saveToStorage(STORAGE_KEYS.VEHICLES, data.vehicles);
      
      return true;
    } catch (error) {
      console.error('Error importing data:', error);
      return false;
    }
  },

  // Reset to sample data
  resetToSampleData: (): boolean => {
    try {
      // Clear all data
      superadminService.deleteAllData();
      // Initialize sample data
      initializeSampleData();
      return true;
    } catch (error) {
      console.error('Error resetting to sample data:', error);
      return false;
    }
  }
};


// Initialize with sample data if storage is empty
export const initializeSampleData = () => {
  const companies = getFromStorage<Company>(STORAGE_KEYS.COMPANIES);
  
  // Update all existing companies to have 1% interest rate
  if (companies.length > 0) {
    const updatedCompanies = companies.map(company => ({
      ...company,
      interestRate: 1.0
    }));
    saveToStorage(STORAGE_KEYS.COMPANIES, updatedCompanies);
  }
  
  if (companies.length === 0) {
    const sampleCompanies: Company[] = [
      {
        id: 'comp1',
        name: 'Premium Auto Leasing',
        logo: '🚗',
        interestRate: 1.0,
        createdAt: new Date('2022-01-15'),
        isActive: true
      },
      {
        id: 'comp2',
        name: 'City Car Rentals',
        logo: '🏙️',
        interestRate: 1.0,
        createdAt: new Date('2022-03-20'),
        isActive: true
      },
      {
        id: 'comp3',
        name: 'Luxury Motors',
        logo: '💎',
        interestRate: 1.0,
        createdAt: new Date('2022-06-10'),
        isActive: true
      },
      {
        id: 'comp4',
        name: 'Budget Wheels',
        logo: '💰',
        interestRate: 1.0,
        createdAt: new Date('2022-09-05'),
        isActive: true
      }
    ];
    saveToStorage(STORAGE_KEYS.COMPANIES, sampleCompanies);
  }

  const customers = getFromStorage<Customer>(STORAGE_KEYS.CUSTOMERS);
  if (customers.length === 0) {
    const sampleCustomers: Customer[] = [
      // Premium Auto Leasing customers
                     {
          id: 'cust1',
          companyId: 'comp1',
          customerType: CustomerType.INDIVIDUAL,
          firstName: 'Faiq',
          lastName: 'Agayev',
          fatherName: 'Ali',
          phone: '+994-50-123-4567',
          address: '123 Main St, Baku, Azerbaijan',
          nationalId: 'AZE123456789',
          contacts: [],
          createdAt: new Date('2022-02-15'),
          isActive: true
        },
                           {
          id: 'cust2',
          companyId: 'comp1',
          customerType: CustomerType.INDIVIDUAL,
          firstName: 'Aysu',
          lastName: 'Kaya',
          fatherName: 'Mehmet',
          phone: '+994-51-234-5678',
          address: '456 Oak Ave, Baku, Azerbaijan',
          nationalId: 'AZE234567890',
          contacts: [],
          createdAt: new Date('2022-04-20'),
          isActive: true
        },
                           {
          id: 'cust3',
          companyId: 'comp1',
          customerType: CustomerType.INDIVIDUAL,
          firstName: 'Mehmet',
          lastName: 'Yilmaz',
          fatherName: 'Ahmet',
          phone: '+994-52-345-6789',
          address: '789 Pine Rd, Baku, Azerbaijan',
          nationalId: 'AZE345678901',
          contacts: [],
          createdAt: new Date('2022-07-10'),
          isActive: true
        },
        // City Car Rentals customers
        {
          id: 'cust4',
          companyId: 'comp2',
          customerType: CustomerType.INDIVIDUAL,
          firstName: 'Elif',
          lastName: 'Demir',
          fatherName: 'Hasan',
          phone: '+994-53-456-7890',
          address: '321 Elm St, Baku, Azerbaijan',
          nationalId: 'AZE456789012',
          contacts: [],
          createdAt: new Date('2022-05-12'),
          isActive: true
        },
        {
          id: 'cust5',
          companyId: 'comp2',
          customerType: CustomerType.INDIVIDUAL,
          firstName: 'Ahmet',
          lastName: 'Ozturk',
          fatherName: 'Mustafa',
          phone: '+994-54-567-8901',
          address: '654 Maple Dr, Baku, Azerbaijan',
          nationalId: 'AZE567890123',
          contacts: [],
          createdAt: new Date('2022-08-25'),
          isActive: true
        },
        {
          id: 'cust6',
          companyId: 'comp2',
          customerType: CustomerType.INDIVIDUAL,
          firstName: 'Zeynep',
          lastName: 'Arslan',
          fatherName: 'Kemal',
          phone: '+994-55-678-9012',
          address: '987 Cedar Ln, Baku, Azerbaijan',
          nationalId: 'AZE678901234',
          contacts: [],
          createdAt: new Date('2022-11-03'),
          isActive: true
        },
        // Luxury Motors customers
        {
          id: 'cust7',
          companyId: 'comp3',
          customerType: CustomerType.INDIVIDUAL,
          firstName: 'Burak',
          lastName: 'Koc',
          fatherName: 'Murat',
          phone: '+994-56-789-0123',
          address: '147 Birch Way, Baku, Azerbaijan',
          nationalId: 'AZE789012345',
          contacts: [],
          createdAt: new Date('2022-07-18'),
          isActive: true
        },
        {
          id: 'cust8',
          companyId: 'comp3',
          customerType: CustomerType.INDIVIDUAL,
          firstName: 'Selin',
          lastName: 'Sahin',
          fatherName: 'Emre',
          phone: '+994-57-890-1234',
          address: '258 Spruce Ct, Baku, Azerbaijan',
          nationalId: 'AZE890123456',
          contacts: [],
          createdAt: new Date('2022-10-30'),
          isActive: true
        },
        // Budget Wheels customers
        {
          id: 'cust9',
          companyId: 'comp4',
          customerType: CustomerType.INDIVIDUAL,
          firstName: 'Can',
          lastName: 'Celik',
          fatherName: 'Omer',
          phone: '+994-58-901-2345',
          address: '369 Willow Pl, Baku, Azerbaijan',
          nationalId: 'AZE901234567',
          contacts: [],
          createdAt: new Date('2022-09-15'),
          isActive: true
        },
        {
          id: 'cust10',
          companyId: 'comp4',
          customerType: CustomerType.INDIVIDUAL,
          firstName: 'Deniz',
          lastName: 'Yildiz',
          fatherName: 'Serkan',
          phone: '+994-59-012-3456',
          address: '741 Aspen Blvd, Baku, Azerbaijan',
          nationalId: 'AZE012345678',
          contacts: [],
          createdAt: new Date('2022-12-08'),
          isActive: true
        }
    ];
    saveToStorage(STORAGE_KEYS.CUSTOMERS, sampleCustomers);
  }

  const contracts = getFromStorage<Contract>(STORAGE_KEYS.CONTRACTS);
  if (contracts.length === 0) {
    const sampleContracts: Contract[] = [
      // Premium Auto Leasing contracts
      {
        id: 'cont1',
        customerId: 'cust1',
        companyId: 'comp1',
                 vehicle: {
           id: 'veh1',
           licensePlate: '10-AA-123',
           make: 'BMW',
           model: 'X5',
           year: 2021,
           color: 'Black',

           bodyNumber: 'BMW123456789',
           registrationCertificateNumber: 'RC123456',
           engine: '3.0L Turbo'
         },
        standardPurchasePrice: 85000,
        downPayment: 17000,
        termMonths: 36,
        monthlyPayment: 2200,
        totalPayable: 79200,
        startDate: new Date('2022-03-01'),
        nextDueDate: new Date('2022-04-01'),
        status: ContractStatus.ACTIVE,
        remainingBalance: 26400,
        totalPaid: 0,
        paymentsCount: 0
      },
      {
        id: 'cont2',
        customerId: 'cust2',
        companyId: 'comp1',
                 vehicle: {
           id: 'veh2',
           licensePlate: '10-BB-456',
           make: 'Mercedes',
           model: 'C-Class',
           year: 2022,
           color: 'White',

           bodyNumber: 'MBZ234567890',
           registrationCertificateNumber: 'RC234567',
           engine: '2.0L Turbo'
         },
        standardPurchasePrice: 65000,
        downPayment: 13000,
        termMonths: 48,
        monthlyPayment: 1500,
        totalPayable: 72000,
        startDate: new Date('2022-05-15'),
        nextDueDate: new Date('2022-06-15'),
        status: ContractStatus.ACTIVE,
        remainingBalance: 18000,
        totalPaid: 0,
        paymentsCount: 0
      },
      {
        id: 'cont3',
        customerId: 'cust3',
        companyId: 'comp1',
                 vehicle: {
           id: 'veh3',
           licensePlate: '10-CC-789',
           make: 'Audi',
           model: 'A6',
           year: 2021,
           color: 'Silver',

           bodyNumber: 'AUD345678901',
           registrationCertificateNumber: 'RC345678',
           engine: '2.0L TDI'
         },
        standardPurchasePrice: 72000,
        downPayment: 14400,
        termMonths: 42,
        monthlyPayment: 1800,
        totalPayable: 75600,
        startDate: new Date('2022-08-01'),
        nextDueDate: new Date('2022-09-01'),
        status: ContractStatus.ACTIVE,
        remainingBalance: 21600,
        totalPaid: 0,
        paymentsCount: 0
      },
      // City Car Rentals contracts
      {
        id: 'cont4',
        customerId: 'cust4',
        companyId: 'comp2',
                 vehicle: {
           id: 'veh4',
           licensePlate: '20-DD-123',
           make: 'Toyota',
           model: 'Camry',
           year: 2022,
           color: 'Blue',

           bodyNumber: 'TOY456789012',
           registrationCertificateNumber: 'RC456789',
           engine: '2.5L Hybrid'
         },
        standardPurchasePrice: 35000,
        downPayment: 7000,
        termMonths: 36,
        monthlyPayment: 900,
        totalPayable: 32400,
        startDate: new Date('2022-06-01'),
        nextDueDate: new Date('2022-07-01'),
        status: ContractStatus.ACTIVE,
        remainingBalance: 10800,
        totalPaid: 0,
        paymentsCount: 0
      },
      {
        id: 'cont5',
        customerId: 'cust5',
        companyId: 'comp2',
                 vehicle: {
           id: 'veh5',
           licensePlate: '20-EE-456',
           make: 'Honda',
           model: 'Civic',
           year: 2023,
           color: 'Red',

           bodyNumber: 'HON567890123',
           engine: '1.5L Turbo'
         },
        standardPurchasePrice: 28000,
        downPayment: 5600,
        termMonths: 48,
        monthlyPayment: 650,
        totalPayable: 31200,
        startDate: new Date('2022-09-15'),
        nextDueDate: new Date('2022-10-15'),
        status: ContractStatus.ACTIVE,
        remainingBalance: 7800,
        totalPaid: 0,
        paymentsCount: 0
      },
      {
        id: 'cont6',
        customerId: 'cust6',
        companyId: 'comp2',
                 vehicle: {
           id: 'veh6',
           licensePlate: '20-FF-789',
           make: 'Nissan',
           model: 'Altima',
           year: 2022,
           color: 'Gray',

           bodyNumber: 'NIS678901234',
           engine: '2.5L CVT'
         },
        standardPurchasePrice: 32000,
        downPayment: 6400,
        termMonths: 42,
        monthlyPayment: 750,
        totalPayable: 31500,
        startDate: new Date('2022-12-01'),
        nextDueDate: new Date('2023-01-01'),
        status: ContractStatus.ACTIVE,
        remainingBalance: 9000,
        totalPaid: 0,
        paymentsCount: 0
      },
      // Luxury Motors contracts
      {
        id: 'cont7',
        customerId: 'cust7',
        companyId: 'comp3',
                 vehicle: {
           id: 'veh7',
           licensePlate: '30-GG-123',
           make: 'Porsche',
           model: '911',
           year: 2022,
           color: 'Yellow',

           bodyNumber: 'POR789012345',
           engine: '3.0L Twin-Turbo'
         },
        standardPurchasePrice: 120000,
        downPayment: 24000,
        termMonths: 60,
        monthlyPayment: 2800,
        totalPayable: 168000,
        startDate: new Date('2022-08-15'),
        nextDueDate: new Date('2022-09-15'),
        status: ContractStatus.ACTIVE,
        remainingBalance: 56000,
        totalPaid: 0,
        paymentsCount: 0
      },
      {
        id: 'cont8',
        customerId: 'cust8',
        companyId: 'comp3',
                 vehicle: {
           id: 'veh8',
           licensePlate: '30-HH-456',
           make: 'Ferrari',
           model: 'F8',
           year: 2023,
           color: 'Red',

           bodyNumber: 'FER890123456',
           engine: '3.9L Twin-Turbo V8'
         },
        standardPurchasePrice: 250000,
        downPayment: 50000,
        termMonths: 72,
        monthlyPayment: 4500,
        totalPayable: 324000,
        startDate: new Date('2022-11-01'),
        nextDueDate: new Date('2022-12-01'),
        status: ContractStatus.ACTIVE,
        remainingBalance: 90000,
        totalPaid: 0,
        paymentsCount: 0
      },
      // Budget Wheels contracts
      {
        id: 'cont9',
        customerId: 'cust9',
        companyId: 'comp4',
                 vehicle: {
           id: 'veh9',
           licensePlate: '40-II-123',
           make: 'Hyundai',
           model: 'Elantra',
           year: 2022,
           color: 'White',

           bodyNumber: 'HYU901234567',
           engine: '2.0L CVT'
         },
        standardPurchasePrice: 22000,
        downPayment: 4400,
        termMonths: 36,
        monthlyPayment: 550,
        totalPayable: 19800,
        startDate: new Date('2022-10-01'),
        nextDueDate: new Date('2022-11-01'),
        status: ContractStatus.ACTIVE,
        remainingBalance: 6600,
        totalPaid: 0,
        paymentsCount: 0
      },
      {
        id: 'cont10',
        customerId: 'cust10',
        companyId: 'comp4',
                 vehicle: {
           id: 'veh10',
           licensePlate: '40-JJ-456',
           make: 'Kia',
           model: 'Forte',
           year: 2023,
           color: 'Blue',

           bodyNumber: 'KIA012345678',
           engine: '2.0L CVT'
         },
        standardPurchasePrice: 18000,
        downPayment: 3600,
        termMonths: 48,
        monthlyPayment: 450,
        totalPayable: 21600,
        startDate: new Date('2022-12-15'),
        nextDueDate: new Date('2023-01-15'),
        status: ContractStatus.ACTIVE,
        remainingBalance: 5400,
        totalPaid: 0,
        paymentsCount: 0
      }
    ];
    saveToStorage(STORAGE_KEYS.CONTRACTS, sampleContracts);
  }

     const vehicles = getFromStorage<Vehicle>(STORAGE_KEYS.VEHICLES);
   if (vehicles.length === 0) {
     const sampleVehicles: Vehicle[] = [
       {
         id: 'veh1',
         companyId: 'comp1',
         licensePlate: '10-AA-123',
         make: 'BMW',
         model: 'X5',
         year: 2021,
         color: 'Black',
         
         bodyNumber: 'BMW123456789',
         registration_certificate_number: 'RC001',
         engine: '3.0L Turbo'
       },
       {
         id: 'veh2',
         companyId: 'comp1',
         licensePlate: '10-BB-456',
         make: 'Mercedes',
         model: 'C-Class',
         year: 2022,
         color: 'White',
         
         bodyNumber: 'MBZ234567890',
         registration_certificate_number: 'RC002',
         engine: '2.0L Turbo'
       },
       {
         id: 'veh3',
         companyId: 'comp1',
         licensePlate: '10-CC-789',
         make: 'Audi',
         model: 'A6',
         year: 2021,
         color: 'Silver',
         
         bodyNumber: 'AUD345678901',
         registration_certificate_number: 'RC003',
         engine: '2.0L TDI'
       },
       {
         id: 'veh4',
         companyId: 'comp1',
         licensePlate: '20-DD-123',
         make: 'Toyota',
         model: 'Camry',
         year: 2022,
         color: 'Blue',
         
         bodyNumber: 'TOY456789012',
         registration_certificate_number: 'RC004',
         engine: '2.5L Hybrid'
       },
       {
         id: 'veh5',
         companyId: 'comp2',
         licensePlate: '20-EE-456',
         make: 'Honda',
         model: 'Civic',
         year: 2023,
         color: 'Red',
         
         bodyNumber: 'HON567890123',
         engine: '1.5L Turbo'
       },
       {
         id: 'veh6',
         companyId: 'comp2',
         licensePlate: '20-FF-789',
         make: 'Nissan',
         model: 'Altima',
         year: 2022,
         color: 'Gray',
         
         bodyNumber: 'NIS678901234',
         engine: '2.5L CVT'
       },
       {
         id: 'veh7',
         companyId: 'comp3',
         licensePlate: '30-GG-123',
         make: 'Porsche',
         model: '911',
         year: 2022,
         color: 'Yellow',
         
         bodyNumber: 'POR789012345',
         engine: '3.0L Twin-Turbo'
       },
       {
         id: 'veh8',
         companyId: 'comp3',
         licensePlate: '30-HH-456',
         make: 'Ferrari',
         model: 'F8',
         year: 2023,
         color: 'Red',
         
         bodyNumber: 'FER890123456',
         engine: '3.9L Twin-Turbo V8'
       },
       {
         id: 'veh9',
         companyId: 'comp4',
         licensePlate: '40-II-123',
         make: 'Hyundai',
         model: 'Elantra',
         year: 2022,
         color: 'White',
         
         bodyNumber: 'HYU901234567',
         engine: '2.0L CVT'
       },
       {
         id: 'veh10',
         companyId: 'comp4',
         licensePlate: '40-JJ-456',
         make: 'Kia',
         model: 'Forte',
         year: 2023,
         color: 'Blue',
         
         bodyNumber: 'KIA012345678',
         engine: '2.0L CVT'
       }
     ];
     saveToStorage(STORAGE_KEYS.VEHICLES, sampleVehicles);
   }

   const payments = getFromStorage<Payment>(STORAGE_KEYS.PAYMENTS);
   if (payments.length === 0) {
    const generatePayments = () => {
      const allPayments: Payment[] = [];
      const contracts = getFromStorage<Contract>(STORAGE_KEYS.CONTRACTS);
      
      contracts.forEach(contract => {
        const startDate = new Date(contract.startDate);
        const monthlyPayment = contract.monthlyPayment;
        const totalMonths = Math.min(36, Math.floor((new Date().getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24 * 30)));
        
        for (let i = 0; i < totalMonths; i++) {
          // Use addMonths from date-fns to handle month calculations correctly
          const paymentDate = addMonths(new Date(startDate), i);
          
          // Add some variation to payment dates (some early, some late)
          const daysVariation = Math.floor(Math.random() * 10) - 5; // -5 to +5 days
          paymentDate.setDate(paymentDate.getDate() + daysVariation);
          
          // Skip future payments
          if (paymentDate > new Date()) continue;
          
          const isLate = daysVariation > 0;
          const daysLate = isLate ? daysVariation : 0;
          // Get company interest rate
          const companies = getFromStorage<Company>(STORAGE_KEYS.COMPANIES);
          const company = companies.find(c => c.id === contract.companyId);
          const interestRate = company?.interestRate || 1.5; // Default to 1.5% if company not found
          const interestAmount = isLate ? Math.round((monthlyPayment * (interestRate / 100) * daysLate) * 100) / 100 : 0;
          
          // Vary payment methods
          const paymentMethods = ['automatic', 'manual', 'cash', 'bank_transfer', 'card_to_card'];
          const paymentMethod = paymentMethods[Math.floor(Math.random() * paymentMethods.length)] as any;
          
          allPayments.push({
            id: `pay_${contract.id}_${i}`,
            contractId: contract.id,
            customerId: contract.customerId,
            companyId: contract.companyId,
            amount: monthlyPayment,
            paymentDate: paymentDate,
            dueDate: new Date(startDate.getTime() + (i * 30 * 24 * 60 * 60 * 1000)),
            interestAmount: interestAmount,
            paymentMethod: paymentMethod,
            isLate: isLate,
            daysLate: daysLate,
            notes: isLate ? `Late payment - ${daysLate} days overdue` : undefined
          });
        }
      });
      
      return allPayments;
    };
    
    const samplePayments = generatePayments();
    saveToStorage(STORAGE_KEYS.PAYMENTS, samplePayments);
  }

};



import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
  useRef,
} from "react";
import {
  Company,
  Customer,
  Contract,
  Payment,
  NotificationItem,
  ContractStatus,
  Vehicle,
  PaymentMethod,
  PaymentInterval,
} from "../types";
import { toYYYYMMDD } from "../utils/date";
import { isToday, isPast, differenceInDays } from "date-fns";
import { calculateCorrectNextDueDate } from "../utils/contractUtils";
import { getCompanies, deleteCompany as deleteCompanyService } from "../services/companies";
import { getCustomers } from "../services/customers";
import {
  getContracts,
  getContractById,
  updateContract as updateContractService,
  updateMonthlyPaymentAfterExtraPayment,
  fixMissingMonthlyPayments as fixMissingMonthlyPaymentsService,
  synchronizePaymentTracking as synchronizePaymentTrackingService,
  fixIncorrectlyCompletedContracts as fixIncorrectlyCompletedContractsService,
  fixIncorrectPaymentCounts as fixIncorrectPaymentCountsService,
  recalculatePaymentSchedule,
  recalculateAllContractsSchedule,
} from "../services/contracts";
import {
  getPayments,
  getPaymentsByContract,
  getContractMonthProgress as getContractMonthProgressService,
  createPayment as createPaymentService,
  updatePayment as updatePaymentService,
  deletePayment as deletePaymentService,
  PaymentSearchParams,
} from "../services/payments";
import { getVehicles } from "../services/vehicles";
import { supabase } from "../services/supabaseClient";
import { apiClient } from "../services/apiClient";

import { calculateNextDueDateFromStartDate } from "../utils/paymentIntervalUtils";

interface DataContextType {
  companies: Company[];
  customers: Customer[];
  contracts: Contract[];
  payments: Payment[];
  vehicles: Vehicle[];
  notifications: NotificationItem[];
  selectedCompany: string | null;
  setSelectedCompany: (companyId: string | null) => void;
  addPayment: ({
    contractId,
    amount,
    dateISO,
    methodUI,
    isExtra,
    isPartial,
    notes,
    expectedAmount,
    paymentPeriod,
    treatAsOnTime,
    interestAmount,
    isLate,
    daysLate,
  }: {
    contractId: string;
    amount: number;
    dateISO: string; // 'YYYY-MM-DD'
    methodUI: string; // UI value; mapped inside createPayment
    isExtra: boolean;
    isPartial?: boolean; // true for partial payments
    notes?: string | null;
    expectedAmount?: number; // expected payment amount
    paymentPeriod?: number; // payment period number
    treatAsOnTime?: boolean; // whether to treat payment as on-time (ignore interest)
    interestAmount?: number; // calculated interest amount
    isLate?: boolean; // whether payment is late
    daysLate?: number; // number of days late
  }) => Promise<Payment>;
  addExtraPayment: (
    payment: Omit<Payment, "id" | "created_at" | "updated_at">
  ) => Promise<Payment>;
  updatePayment: (
    paymentId: string,
    updates: Partial<Payment>
  ) => Promise<Payment>;
  deletePayment: (paymentId: string) => Promise<boolean>;
  deleteCompany: (companyId: string) => Promise<boolean>;
  updateContract: (
    contractId: string,
    updates: Partial<Contract>
  ) => Promise<Contract>;
  getCustomerContracts: (customerId: string) => Contract[];
  getCustomerPayments: (customerId: string) => Payment[];
  calculateInterest: (
    amount: number,
    daysLate: number,
    interestRate: number
  ) => number;
  refreshContractData: (contractId: string) => Promise<Contract | null>;
  refetchContract: (contractId: string) => Promise<void>;
  getContractMonthProgress: (
    contractId: string,
    paymentDate?: Date
  ) => Promise<any>;
  createPaymentWithCleanPayload: (paymentData: {
    contract_id: string;
    amount: number;
    payment_date: string;
    due_date: string;
    payment_method: any;
    is_extra: boolean;
    notes: string | null;
    partial_month?: string;
    receipt_url?: string;
  }) => Promise<Payment>;

  refreshData: () => void;
  loading: boolean;
  error: string | null;
  // New methods for lazy loading
  loadCompanies: () => Promise<void>;
  loadCustomers: () => Promise<void>;
  loadContracts: () => Promise<void>;
  loadContractsWithoutPermissions: () => Promise<void>; // Load contracts without permission documents
  loadAllContracts: () => Promise<void>; // Load all contracts including closed ones
  loadPayments: (params?: PaymentSearchParams) => Promise<void>;
  loadVehicles: () => Promise<void>;
  fixMissingMonthlyPayments: () => Promise<{
    updated: number;
    errors: string[];
  }>;
  synchronizePaymentTracking: () => Promise<{
    updated: number;
    errors: string[];
  }>;
  fixIncorrectlyCompletedContracts: () => Promise<{
    updated: number;
    errors: string[];
  }>;
  fixIncorrectPaymentCounts: () => Promise<{
    updated: number;
    errors: string[];
  }>;
  debugPaymentLoading: (contractId: string) => Promise<void>;
  recalculatePaymentSchedule: (
    contractId: string
  ) => Promise<{ success: boolean; message: string }>;
  recalculateAllContractsSchedule: () => Promise<{
    success: boolean;
    results: any[];
  }>;
  // Loading states for individual data types
  companiesLoading: boolean;
  customersLoading: boolean;
  contractsLoading: boolean;
  paymentsLoading: boolean;
  vehiclesLoading: boolean;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export const useData = () => {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error("useData must be used within a DataProvider");
  }
  return context;
};

export const DataProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [selectedCompany, setSelectedCompany] = useState<string | null>(null);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Individual loading states
  const [companiesLoading, setCompaniesLoading] = useState(false);
  const [customersLoading, setCustomersLoading] = useState(false);
  const [contractsLoading, setContractsLoading] = useState(false);
  const [paymentsLoading, setPaymentsLoading] = useState(false);
  const [vehiclesLoading, setVehiclesLoading] = useState(false);

  // Flag to prevent multiple initializations
  const [isInitialized, setIsInitialized] = useState(false);

  // Request deduplication cache - using useRef to persist across renders
  const requestCache = useRef(new Map());

  // Helper function to deduplicate requests - using useRef to avoid recreation
  const deduplicateRequest = useRef(
    (key: string, requestFn: () => Promise<any>): Promise<any> => {
      if (requestCache.current.has(key)) {
        return requestCache.current.get(key);
      }

      const promise = requestFn();
      requestCache.current.set(key, promise);

      // Remove from cache after completion
      promise.finally(() => {
        requestCache.current.delete(key);
      });

      return promise;
    }
  ).current; // No dependencies since requestCache.current is stable

  // Lazy loading functions with deduplication
  const loadCompanies = useCallback(async () => {
    // Prevent multiple simultaneous requests
    if (companiesLoading) {
      return;
    }

    setCompaniesLoading(true);
    try {
      const data = await deduplicateRequest("companies", getCompanies);
      setCompanies(data);
    } catch (err) {
      console.error("Error loading companies:", err);
      setError("Failed to load companies");
    } finally {
      setCompaniesLoading(false);
    }
  }, []); // Remove deduplicateRequest dependency since it's stable

  const loadCustomers = useCallback(async () => {
    // Prevent multiple simultaneous requests
    if (customersLoading) {
      return;
    }

    setCustomersLoading(true);
    try {
      const data = await deduplicateRequest("customers", getCustomers);
      setCustomers(data);
    } catch (err) {
      console.error("Error loading customers:", err);
      setError("Failed to load customers");
    } finally {
      setCustomersLoading(false);
    }
  }, []); // Remove deduplicateRequest dependency since it's stable

  const loadContracts = useCallback(async () => {
    // Prevent multiple simultaneous requests
    if (contractsLoading) {
      return;
    }

    setContractsLoading(true);
    try {
      // Load all contracts by default (including closed contracts)
      // Users can filter by status using the status filter dropdown
      const data = await deduplicateRequest("contracts", getContracts);
      
      // Load permission documents for all contracts
      try {
        const { data: permissionDocs, error: permError } = await supabase
          .from('permission_documents')
          .select(`
            *,
            drivers (
              id,
              name,
              license_number,
              license_category,
              license_given_date,
              phone,
              address
            )
          `);
        
        if (!permError && permissionDocs) {
          // Create a map of contract_id to permission document
          const permDocsMap = new Map();
          permissionDocs.forEach(doc => {
            permDocsMap.set(doc.contract_id, doc);
          });
          
          // Attach permission documents to contracts
          const contractsWithPermissions = data.map(contract => ({
            ...contract,
            permission_document: permDocsMap.get(contract.id) || null
          }));
          
          setContracts(contractsWithPermissions);
        } else {
          // If permission docs fail to load, just set contracts without them
          setContracts(data);
        }
      } catch (permError) {
        console.warn("Failed to load permission documents:", permError);
        // Continue with contracts without permission documents
        setContracts(data);
      }
    } catch (err) {
      console.error("Error loading contracts:", err);
      setError("Failed to load contracts");
    } finally {
      setContractsLoading(false);
    }
  }, []); // Remove deduplicateRequest dependency since it's stable

  // OPTIMIZED: Load contracts without permission documents for pages that don't need them
  const loadContractsWithoutPermissions = useCallback(async () => {
    // Always load contracts without permissions, even if contracts are already loaded
    // This ensures we get clean contract data without permission_documents
    try {
      // Use a different cache key to avoid conflicts with permission-loaded contracts
      const data = await deduplicateRequest("contracts-basic-only", getContracts);
      setContracts(data);
    } catch (err) {
      console.error("Error loading contracts:", err);
      setError("Failed to load contracts");
    }
  }, []);

  const loadAllContracts = useCallback(async () => {
    // Prevent multiple simultaneous requests
    if (contractsLoading) {
      return;
    }

    setContractsLoading(true);
    try {
      // Load all contracts including closed ones
      const data = await deduplicateRequest("contracts", getContracts);
      
      // Load permission documents for all contracts
      try {
        const { data: permissionDocs, error: permError } = await supabase
          .from('permission_documents')
          .select(`
            *,
            drivers (
              id,
              name,
              license_number,
              license_category,
              license_given_date,
              phone,
              address
            )
          `);
        
        if (!permError && permissionDocs) {
          // Create a map of contract_id to permission document
          const permDocsMap = new Map();
          permissionDocs.forEach(doc => {
            permDocsMap.set(doc.contract_id, doc);
          });
          
          // Attach permission documents to contracts
          const contractsWithPermissions = data.map(contract => ({
            ...contract,
            permission_document: permDocsMap.get(contract.id) || null
          }));
          
          setContracts(contractsWithPermissions);
        } else {
          // If permission docs fail to load, just set contracts without them
          setContracts(data);
        }
      } catch (permError) {
        console.warn("Failed to load permission documents:", permError);
        // Continue with contracts without permission documents
        setContracts(data);
      }
    } catch (err) {
      console.error("Error loading all contracts:", err);
      setError("Failed to load all contracts");
    } finally {
      setContractsLoading(false);
    }
  }, []); // Remove deduplicateRequest dependency since it's stable

  const loadPayments = useCallback(async (params?: PaymentSearchParams) => {
    // Prevent multiple simultaneous requests
    if (paymentsLoading) {
      return;
    }

    setPaymentsLoading(true);
    try {
      const data = await deduplicateRequest("payments", () => getPayments(params));
      setPayments(data);
    } catch (err) {
      console.error("Error loading payments:", err);
      setError("Failed to load payments");
    } finally {
      setPaymentsLoading(false);
    }
  }, []); // Remove deduplicateRequest dependency since it's stable

  const loadVehicles = useCallback(async () => {
    // Prevent multiple simultaneous requests
    if (vehiclesLoading) {
      return;
    }

    setVehiclesLoading(true);
    try {
      const data = await deduplicateRequest("vehicles", getVehicles);
      setVehicles(data);
    } catch (err) {
      console.error("Error loading vehicles:", err);
      setError("Failed to load vehicles");
    } finally {
      setVehiclesLoading(false);
    }
  }, []); // Remove deduplicateRequest dependency since it's stable

  const fixMissingMonthlyPayments = useCallback(async () => {
    try {
      const result = await fixMissingMonthlyPaymentsService();

      return result;
    } catch (error) {
      console.error("❌ Error fixing missing monthly payments:", error);
      throw error;
    }
  }, []);

  const synchronizePaymentTracking = useCallback(async () => {
    try {
      const result = await synchronizePaymentTrackingService();

      return result;
    } catch (error) {
      console.error("❌ Error synchronizing payment tracking:", error);
      throw error;
    }
  }, []); // Removed loadContracts and loadPayments from dependencies to prevent infinite loop

  const fixIncorrectlyCompletedContracts = useCallback(async () => {
    try {
      const result = await fixIncorrectlyCompletedContractsService();

      return result;
    } catch (error) {
      console.error("❌ Error fixing incorrectly completed contracts:", error);
      throw error;
    }
  }, []);

  const fixIncorrectPaymentCounts = useCallback(async () => {
    try {
      const result = await fixIncorrectPaymentCountsService();

      return result;
    } catch (error) {
      console.error("❌ Error fixing incorrect payment counts:", error);
      throw error;
    }
  }, []);

  const debugPaymentLoading = useCallback(
    async (contractId: string) => {
      try {
        // Check contract data
        const contract = contracts.find((c) => c.id === contractId);
        if (!contract) {
          console.error(
            `❌ Contract ${contractId} not found in loaded contracts`
          );
          return;
        }

        // Check payments in context
        const contextPayments = payments.filter(
          (p) => p.contract_id === contractId
        );
        contextPayments.forEach((payment, index) => {});

        // Try to load payments directly from database
        const directPayments = await getPaymentsByContract(contractId);

        // Compare results
        if (contextPayments.length !== directPayments.length) {
          // Check for differences
          const contextIds = new Set(contextPayments.map((p) => p.id));
          const directIds = new Set(directPayments.map((p) => p.id));

          const missingInContext = directPayments.filter(
            (p) => !contextIds.has(p.id)
          );
          const extraInContext = contextPayments.filter(
            (p) => !directIds.has(p.id)
          );

          if (missingInContext.length > 0) {
          }
          if (extraInContext.length > 0) {
          }
        } else {
        }
      } catch (error) {
        console.error("❌ Error debugging payment loading:", error);
      }
    },
    [contracts, payments]
  );

  const refreshData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Clear existing data to force reload
      setCompanies([]);
      setCustomers([]);
      setContracts([]);
      setPayments([]);
      setVehicles([]);

      // Load all data in parallel with deduplication
      await Promise.all([
        loadCompanies(),
        loadCustomers(),
        loadContracts(),
        // loadPayments() - Removed: Payments should be loaded with specific filters
        loadVehicles(),
      ]);
    } catch (err) {
      console.error("Error refreshing data:", err);
      setError("Failed to load data. Please try again.");
    } finally {
      setLoading(false);
    }
  }, []); // Empty dependency array to prevent infinite loops

  // Initialize all data on component mount
  useEffect(() => {
    // Only load once on mount, never again
    if (!isInitialized) {
      setIsInitialized(true);
      // Load all essential data by default
      Promise.all([
        loadCompanies(),
        loadCustomers(),
        loadContracts(),
        // loadPayments() - Removed: Payments should be loaded with specific filters
        loadVehicles(),
      ]).catch((err) => {
        console.error("Error loading initial data:", err);
        setError("Failed to load initial data. Please refresh the page.");
      });
    }
  }, []); // Empty dependency array to prevent infinite loops

  // Memoized notifications calculation to prevent unnecessary recalculations
  const calculatedNotifications = useMemo(() => {
    if (contracts.length === 0 || customers.length === 0) {
      return [];
    }

    const notifications: NotificationItem[] = [];

    contracts
      .filter((contract) => contract.status === ContractStatus.ACTIVE)
      .forEach((contract) => {
        const customer = customers.find((c) => c.id === contract.customer_id);
        const today = new Date();

        // Use the correct due date calculation instead of stored next_due_date
        const correctDueDate = calculateCorrectNextDueDate(contract, true); // Use contract start date

        const isDue = isToday(correctDueDate);
        const isOverdue = isPast(correctDueDate) && !isToday(correctDueDate);
        const daysOverdue = isOverdue
          ? differenceInDays(today, correctDueDate)
          : 0;

        // Show both overdue and due today notifications in sidebar
        if (isDue || isOverdue) {
          notifications.push({
            id: `notif-${contract.id}`,
            customerId: contract.customer_id,
            customerName: customer
              ? `${customer.first_name} ${customer.last_name}`
              : "Unknown Customer",
            contractId: contract.id,
            vehicleInfo: contract.vehicle
              ? `${contract.vehicle.license_plate} – ${contract.vehicle.make} ${contract.vehicle.model}`
              : "Unknown Vehicle",
            dueDate: correctDueDate,
            amount: contract.monthly_payment,
            type: "overdue",
            ...(daysOverdue > 0 && { daysOverdue }),
          });
        }
      });

    return notifications;
  }, [contracts, customers]);

  // Update notifications when calculated notifications change
  useEffect(() => {
    setNotifications(calculatedNotifications);
  }, [calculatedNotifications]);

  const deleteCompany = async (companyId: string): Promise<boolean> => {
    try {
      // Delete from database first
      await deleteCompanyService(companyId);

      // Remove company from local state immediately for better UX
      setCompanies((prev) =>
        prev.filter((company) => company.id !== companyId)
      );

      // Also remove related data
      setCustomers((prev) =>
        prev.filter((customer) => customer.company_id !== companyId)
      );
      setContracts((prev) =>
        prev.filter((contract) => contract.company_id !== companyId)
      );
      setPayments((prev) =>
        prev.filter((payment) => payment.company_id !== companyId)
      );
      setVehicles((prev) =>
        prev.filter((vehicle) => vehicle.company_id !== companyId)
      );

      return true;
    } catch (error: any) {
      console.error("Error deleting company:", error);
      
      // Preserve the original error for proper handling in UI
      // Don't reload companies immediately to avoid race conditions
      
      // Re-throw the error with proper structure
      if (error?.response?.data) {
        throw new Error(error.response.data.error || 'Company deletion failed');
      } else if (error?.message) {
        throw new Error(error.message);
      } else {
        throw new Error('Company deletion failed');
      }
    }
  };

  const updatePayment = async (
    paymentId: string,
    updates: Partial<Payment>
  ): Promise<Payment> => {
    try {
      // Convert dates to strings for database and handle type conversions
      const updatesForDB: any = {
        ...updates,
        payment_date: updates.payment_date
          ? new Date(updates.payment_date).toISOString()
          : undefined,
        due_date: updates.due_date
          ? new Date(updates.due_date).toISOString()
          : undefined,
        payment_method: updates.payment_method as any,
        updated_at: new Date().toISOString(),
      };

      // Remove fields that shouldn't be updated
      delete updatesForDB.id;
      delete updatesForDB.created_at;

      // Update payment in database
      const updatedPayment = await updatePaymentService(
        paymentId,
        updatesForDB
      );

      // Convert updated payment back to application type
      const paymentWithDates: Payment = {
        ...updatedPayment,
        payment_date: new Date(updatedPayment.payment_date),
        due_date: new Date(updatedPayment.due_date),
        payment_method: updatedPayment.payment_method as PaymentMethod,
        notes: updatedPayment.notes || undefined,
      };

      // Update local state
      setPayments((prev) =>
        prev.map((p) => (p.id === paymentId ? paymentWithDates : p))
      );

      return paymentWithDates;
    } catch (error) {
      console.error("Error updating payment:", error);
      throw error;
    }
  };

  // Helper function to refetch contract data from database
  const refetchContract = async (contractId: string): Promise<void> => {
    try {
      // Get updated contract data with vehicle information using API client
      const response = await apiClient.get(`/contracts/${contractId}`);
      
      if (!response.success || !response.data) {
        console.error("Error fetching contract data:", response.error);
        return;
      }

      const contractData = response.data.contract || response.data;

      if (contractData) {
        // Convert to application type
        const contractWithDates: Contract = {
          ...contractData,
          start_date: new Date(contractData.start_date),
          payment_start_date: new Date(contractData.payment_start_date),
          next_due_date: contractData.next_due_date
            ? new Date(contractData.next_due_date)
            : undefined,
          last_payment_date: contractData.last_payment_date
            ? new Date(contractData.last_payment_date)
            : undefined,
          payment_interval: contractData.payment_interval as PaymentInterval,
          status: contractData.status as ContractStatus,
          created_at: new Date(contractData.created_at),
          updated_at: new Date(contractData.updated_at),
          vehicle: contractData.vehicle,
        };

        // Update local state
        setContracts((prev) =>
          prev.map((c) => (c.id === contractId ? contractWithDates : c))
        );
      }
    } catch (error) {
      console.error("Error refetching contract:", error);
    }
  };

  // Helper function to get contract month progress using new public RPC
  const getContractMonthProgress = async (contractId: string) => {
    try {
      return await getContractMonthProgressService(contractId);
    } catch (error) {
      console.error("Error fetching contract month progress:", error);
      return null;
    }
  };

  const deletePayment = async (paymentId: string): Promise<boolean> => {
    try {
      // First, get the payment to find its contract
      const paymentToDelete = payments.find((p) => p.id === paymentId);
      if (!paymentToDelete) {
        throw new Error("Payment not found");
      }

      // Delete the payment
      await deletePaymentService(paymentId);

      // Remove payment from local state
      setPayments((prev) => prev.filter((p) => p.id !== paymentId));

      // Update the contract's payments_count and next_due_date only if it's not a partial payment
      const contract = contracts.find(
        (c) => c.id === paymentToDelete.contract_id
      );
      if (contract) {
        // Only decrease payment count if the deleted payment is not a partial payment
        const isPartialPayment = paymentToDelete.is_partial || false;
        let newPaymentCount = contract.payments_count || 0;
        let newNextDueDate = new Date(contract.next_due_date);

        // Check if this is an extra payment (amount > original monthly payment)
        const isExtraPayment =
          paymentToDelete.amount >
          (contract.original_monthly_payment || contract.monthly_payment);

        if (!isPartialPayment) {
          // Only decrease payment count for full payments
          newPaymentCount = Math.max(0, newPaymentCount - 1);

          // Calculate new next due date based on the reduced payment count
          const paymentStartDate = new Date(contract.payment_start_date);
          newNextDueDate = calculateNextDueDateFromStartDate(
            paymentStartDate,
            newPaymentCount,
            contract.payment_interval || "monthly"
          );
        }

        const contractUpdates: any = {
          payments_count: newPaymentCount,
          next_due_date: newNextDueDate.toISOString(),
        };

        // If this is an extra payment, update extra payment tracking
        if (isExtraPayment) {
          const extraPaymentAmount = paymentToDelete.amount;
          const newTotalExtraPayments = Math.max(
            0,
            (contract.total_extra_payments || 0) - extraPaymentAmount
          );
          const newRemainingBalance =
            (contract.remaining_balance || 0) + extraPaymentAmount;

          contractUpdates.total_extra_payments = newTotalExtraPayments;
          contractUpdates.remaining_balance = newRemainingBalance;

          // If no more extra payments, revert to original monthly payment
          if (newTotalExtraPayments <= 0) {
            contractUpdates.adjusted_monthly_payment =
              contract.original_monthly_payment || contract.monthly_payment;
            contractUpdates.last_extra_payment_date = null;
          } else {
            // Recalculate adjusted monthly payment with remaining extra payments
            try {
              const recalculatedMonthlyPayment =
                await updateMonthlyPaymentAfterExtraPayment(contract.id, 0); // 0 means recalculate existing
              contractUpdates.adjusted_monthly_payment =
                recalculatedMonthlyPayment;
            } catch (error) {
              console.error(
                "Error recalculating monthly payment after extra payment deletion:",
                error
              );
              // Fallback: revert to original monthly payment
              contractUpdates.adjusted_monthly_payment =
                contract.original_monthly_payment || contract.monthly_payment;
            }
          }
        }

        // Update the contract
        const updatedContract = await updateContractService(
          contract.id,
          contractUpdates
        );

        // Update local contract state
        setContracts((prev) =>
          prev.map((c) =>
            c.id === contract.id
              ? {
                  ...c,
                  ...updatedContract,
                  payments_count: newPaymentCount,
                  next_due_date: newNextDueDate,
                  start_date: new Date(updatedContract.start_date),
                  payment_start_date: new Date(
                    updatedContract.payment_start_date
                  ),
                  last_payment_date: updatedContract.last_payment_date
                    ? new Date(updatedContract.last_payment_date)
                    : undefined,
                  payment_interval:
                    updatedContract.payment_interval as PaymentInterval,
                  status: updatedContract.status as ContractStatus,
                }
              : c
          )
        );
      }

      return true;
    } catch (error) {
      console.error("Error deleting payment:", error);
      throw error;
    }
  };

  // Create payment with clean payload (for new payment system)
  const createPaymentWithCleanPayload = async (paymentData: {
    contract_id: string;
    amount: number;
    payment_date: string;
    payment_method: "cash" | "card" | "transfer";
    is_extra: boolean;
    notes?: string | null;
    partial_month?: string;
  }): Promise<Payment> => {
    // Get contract to extract customer_id and company_id
    const contract = contracts.find((c) => c.id === paymentData.contract_id);
    if (!contract) {
      throw new Error("Contract not found");
    }

    const row = await createPaymentService({
      contractId: paymentData.contract_id,
      customerId: contract.customer_id,
      companyId: contract.company_id,
      amount: paymentData.amount,
      dateISO: paymentData.payment_date,
      methodUI: paymentData.payment_method,
      isExtra: paymentData.is_extra,
      isPartial: false, // Default to false for regular payments
      notes: paymentData.notes ?? null,
    });

    // Convert saved payment back to application type (with Date objects)
    const paymentWithDates: Payment = {
      ...row,
      payment_date: new Date(row.payment_date),
      due_date: new Date(row.due_date),
      payment_method: row.payment_method as PaymentMethod,
      notes: row.notes || undefined,
    };

    // Add to local state
    setPayments((prev) => [...prev, paymentWithDates]);

    // Refetch contract data to get updated state from DB triggers
    await refetchContract(paymentData.contract_id);

    return paymentWithDates;
  };

  const addPayment = async ({
    contractId,
    amount,
    dateISO,
    methodUI,
    isExtra,
    isPartial = false,
    notes,
    expectedAmount,
    paymentPeriod,
    treatAsOnTime = false,
    interestAmount = 0,
    isLate = false,
    daysLate = 0,
  }: {
    contractId: string;
    amount: number;
    dateISO: string; // 'YYYY-MM-DD'
    methodUI: string; // UI value; mapped inside createPayment
    isExtra: boolean;
    isPartial?: boolean; // true for partial payments
    notes?: string | null;
    expectedAmount?: number; // expected payment amount
    paymentPeriod?: number; // payment period number
    treatAsOnTime?: boolean; // whether to treat payment as on-time (ignore interest)
    interestAmount?: number; // calculated interest amount
    isLate?: boolean; // whether payment is late
    daysLate?: number; // number of days late
  }) => {
    // Get contract to extract customer_id and company_id
    const contract = contracts.find((c) => c.id === contractId);
    if (!contract) {
      throw new Error("Contract not found");
    }

    // Calculate the correct due date for this payment period
    let dueDate = dateISO; // Default to payment date
    
    if (isPartial) {
      // For partial payments, use the current due date (not the next due date)
      // This ensures all partial payments for the same period have the same due date
      // Use the same calculation function as the payment calculation logic
      const currentDueDate = calculateNextDueDateFromStartDate(
        new Date(contract.payment_start_date),
        contract.payments_count || 0,
        contract.payment_interval || 'monthly'
      );
      dueDate = currentDueDate.toISOString().split('T')[0];
    } else if (!isExtra) {
      // For regular payments (not partial, not extra), use the next due date
      const { calculateCorrectNextDueDate } = await import("../utils/contractUtils");
      const correctDueDate = calculateCorrectNextDueDate(contract, true); // Use contract start date
      dueDate = correctDueDate.toISOString().split('T')[0];
    }

    const row = await createPaymentService({
      contractId,
      customerId: contract.customer_id,
      companyId: contract.company_id,
      amount,
      dateISO,
      methodUI,
      isExtra,
      isPartial,
      notes: notes ?? null,
      dueDate, // Pass the calculated due date
      expectedAmount, // Pass the expected amount
      paymentPeriod, // Pass the payment period
      treatAsOnTime, // Pass the treat as on-time flag
      interestAmount, // Pass the calculated interest amount
      isLate, // Pass the late flag
      daysLate, // Pass the days late
    });

    // Convert saved payment back to application type (with Date objects)
    const paymentWithDates: Payment = {
      ...row,
      payment_date: new Date(row.payment_date),
      due_date: new Date(row.due_date),
      payment_method: row.payment_method as PaymentMethod,
      notes: row.notes || undefined,
    };

    // Add to local state
    setPayments((prev) => [...prev, paymentWithDates]);

    // Debug: Log contract state before refetch
    const contractBeforeRefetch = contracts.find((c) => c.id === contractId);

    // Refetch contract data to get updated state from DB triggers
    await refetchContract(contractId);

    // Debug: Log contract state after refetch
    const contractAfterRefetch = contracts.find((c) => c.id === contractId);
    return paymentWithDates;
  };

  const addExtraPayment = async (
    payment: Omit<Payment, "id" | "created_at" | "updated_at">
  ): Promise<Payment> => {
    // Get contract to extract customer_id and company_id
    const contract = contracts.find((c) => c.id === payment.contract_id);
    if (!contract) {
      throw new Error("Contract not found");
    }

    const row = await createPaymentService({
      contractId: payment.contract_id,
      customerId: contract.customer_id,
      companyId: contract.company_id,
      amount: payment.amount,
      dateISO: toYYYYMMDD(payment.payment_date),
      methodUI: payment.payment_method,
      isExtra: true, // This is an extra payment
      isPartial: false,
      notes: payment.notes || "Extra Payment - Əlavə Ödəniş",
    });

    // Convert saved payment back to application type (with Date objects)
    const paymentWithDates: Payment = {
      ...row,
      payment_date: new Date(row.payment_date),
      due_date: new Date(row.due_date),
      payment_method: row.payment_method as PaymentMethod,
      notes: row.notes || undefined,
    };

    // Add to local state
    setPayments((prev) => [...prev, paymentWithDates]);

    // Refetch contract data to get updated state from DB triggers
    await refetchContract(payment.contract_id);

    return paymentWithDates;
  };

  const updateContract = async (
    contractId: string,
    updates: Partial<Contract>
  ) => {
    try {
      // Get the current contract to check if we need to auto-close
      const currentContract = contracts.find((c) => c.id === contractId);

      // Check if this update should trigger auto-close and calculate correct end date
      let finalUpdates = { ...updates };
      if (currentContract) {
        // Calculate correct end date if payment_start_date or term_months are being updated
        if (updates.payment_start_date || updates.term_months) {
          const paymentStartDate = updates.payment_start_date
            ? new Date(updates.payment_start_date)
            : new Date(currentContract.payment_start_date);
          const termMonths = updates.term_months || currentContract.term_months;

          // Calculate correct end date (termMonths - 1 because payment start date is month 1)
          const endDate = new Date(paymentStartDate);
          endDate.setMonth(endDate.getMonth() + (termMonths - 1));

          // Note: end_date is not part of the Contract interface, so we skip it
          // The server will handle end date calculation

         
        }

        // Check if this update should trigger auto-close
        if (updates.payments_count !== undefined) {
          const newPaymentsCount = updates.payments_count;
          const isLastPayment =
            newPaymentsCount >=
            (updates.term_months || currentContract.term_months);

          if (
            isLastPayment &&
            currentContract.status !== ContractStatus.COMPLETED
          ) {
            finalUpdates = {
              ...finalUpdates,
              status: ContractStatus.COMPLETED,
              remaining_balance: Math.max(
                0,
                (updates.total_payable || currentContract.total_payable) -
                  (updates.total_paid || currentContract.total_paid || 0)
              ),
            };
          }
        }
      }

      // Convert Date objects to strings for the service call
      const updatesForService = {
        ...finalUpdates,
        start_date: finalUpdates.start_date
          ? finalUpdates.start_date.toISOString()
          : undefined,
        payment_start_date: finalUpdates.payment_start_date
          ? finalUpdates.payment_start_date.toISOString()
          : undefined,
        next_due_date: finalUpdates.next_due_date
          ? finalUpdates.next_due_date.toISOString()
          : undefined,
        last_payment_date: finalUpdates.last_payment_date
          ? finalUpdates.last_payment_date.toISOString()
          : undefined,
        payment_interval: finalUpdates.payment_interval as
          | "monthly"
          | "quarterly"
          | "yearly"
          | undefined,
        status: finalUpdates.status as
          | "active"
          | "completed"
          | "defaulted"
          | "cancelled"
          | undefined,
      };

      const updatedContract = await updateContractService(
        contractId,
        updatesForService
      );

      // Convert updated contract back to application type
      const originalContract = contracts.find((c) => c.id === contractId);
      
      // Debug: Log the updated contract data
      console.log('🔍 DataContext - Updated contract from API:', {
        id: updatedContract.id,
        monthly_payment: updatedContract.monthly_payment,
        original_monthly_payment: (updatedContract as any).original_monthly_payment,
        adjusted_monthly_payment: (updatedContract as any).adjusted_monthly_payment,
        total_extra_payments: (updatedContract as any).total_extra_payments,
        total_principal_paid: (updatedContract as any).total_principal_paid,
        remaining_balance: updatedContract.remaining_balance
      });
      
      const contractWithDates: Contract = {
        ...updatedContract,
        start_date: new Date(updatedContract.start_date),
        payment_start_date: new Date(updatedContract.payment_start_date),
        next_due_date: updatedContract.next_due_date
          ? new Date(updatedContract.next_due_date)
          : new Date(),
        last_payment_date: updatedContract.last_payment_date
          ? new Date(updatedContract.last_payment_date)
          : undefined,
        payment_interval: updatedContract.payment_interval as PaymentInterval,
        status: updatedContract.status as ContractStatus,
        vehicle: originalContract?.vehicle || ({} as Vehicle), // Preserve the vehicle object
        original_monthly_payment:
          (updatedContract as any).original_monthly_payment ||
          updatedContract.monthly_payment,
        adjusted_monthly_payment: (updatedContract as any).adjusted_monthly_payment || null,
        total_principal_paid:
          (updatedContract as any).total_principal_paid || 0,
        total_extra_payments:
          (updatedContract as any).total_extra_payments || 0,
      };
      
      // Debug: Log the final contract data
      console.log('🔍 DataContext - Final contract data:', {
        id: contractWithDates.id,
        monthly_payment: contractWithDates.monthly_payment,
        original_monthly_payment: contractWithDates.original_monthly_payment,
        adjusted_monthly_payment: contractWithDates.adjusted_monthly_payment,
        total_extra_payments: contractWithDates.total_extra_payments,
        total_principal_paid: contractWithDates.total_principal_paid,
        remaining_balance: contractWithDates.remaining_balance
      });

      // Update local state immediately with the updated contract
      setContracts((prev) =>
        prev.map((c) => (c.id === contractId ? contractWithDates : c))
      );

      // Force a fresh reload of contracts to ensure we have the latest data from API
      // Clear the cache by setting loading state and fetching fresh data
      setContractsLoading(true);
      try {
        // Clear the cache for contracts to force fresh data
        requestCache.current.delete("contracts");

        // Small delay to ensure database update is committed
        await new Promise((resolve) => setTimeout(resolve, 100));

        const freshData = await getContracts();
        
        // Debug: Log fresh contract data for the specific contract
        const freshContract = freshData.find(c => c.id === contractId);
        if (freshContract) {
          console.log('🔍 DataContext - Fresh contract data from API:', {
            id: freshContract.id,
            monthly_payment: freshContract.monthly_payment,
            original_monthly_payment: (freshContract as any).original_monthly_payment,
            adjusted_monthly_payment: (freshContract as any).adjusted_monthly_payment,
            total_extra_payments: (freshContract as any).total_extra_payments,
            total_principal_paid: (freshContract as any).total_principal_paid,
            remaining_balance: freshContract.remaining_balance
          });
        }
        
        // Convert the fresh data to application types
        const contractsWithDates = freshData.map((contract) => ({
          ...contract,
          start_date: new Date(contract.start_date),
          payment_start_date: new Date(contract.payment_start_date),
          next_due_date: contract.next_due_date
            ? new Date(contract.next_due_date)
            : new Date(),
          last_payment_date: contract.last_payment_date
            ? new Date(contract.last_payment_date)
            : undefined,
          payment_interval: contract.payment_interval as PaymentInterval,
          status: contract.status as ContractStatus,
          vehicle: (contract as any).vehicle || ({} as Vehicle),
          original_monthly_payment:
            (contract as any).original_monthly_payment ||
            contract.monthly_payment,
          adjusted_monthly_payment: (contract as any).adjusted_monthly_payment || null,
          total_principal_paid: (contract as any).total_principal_paid || 0,
          total_extra_payments: (contract as any).total_extra_payments || 0,
        }));
        setContracts(contractsWithDates);
      } catch (err) {
        console.error("Error reloading contracts after update:", err);
        // If reload fails, we still have the updated contract in state
      } finally {
        setContractsLoading(false);
      }

      return contractWithDates;
    } catch (error) {
      console.error("Error updating contract:", error);
      throw error;
    }
  };

  const getCustomerContracts = (customerId: string) => {
    return contracts.filter((contract) => contract.customer_id === customerId);
  };

  // Force refresh contract data from database
  const refreshContractData = async (
    contractId: string
  ): Promise<Contract | null> => {
    try {
      const updatedContract = await getContractById(contractId);

      if (updatedContract) {
        // Convert the updated contract to application type
        const originalContract = contracts.find((c) => c.id === contractId);
        const contractWithDates: Contract = {
          ...updatedContract,
          start_date: new Date(updatedContract.start_date),
          payment_start_date: new Date(updatedContract.payment_start_date),
          next_due_date: updatedContract.next_due_date
            ? new Date(updatedContract.next_due_date)
            : new Date(),
          last_payment_date: updatedContract.last_payment_date
            ? new Date(updatedContract.last_payment_date)
            : undefined,
          payment_interval: updatedContract.payment_interval as PaymentInterval,
          status: updatedContract.status as ContractStatus,
          vehicle: originalContract?.vehicle || ({} as Vehicle), // Preserve the vehicle object
          original_monthly_payment:
            (updatedContract as any).original_monthly_payment ||
            updatedContract.monthly_payment,
          total_principal_paid:
            (updatedContract as any).total_principal_paid || 0,
          total_extra_payments:
            (updatedContract as any).total_extra_payments || 0,
          permission_document: originalContract?.permission_document, // Preserve the original permission document
        };

        // Update local contract state
        setContracts((prev) =>
          prev.map((c) => (c.id === contractId ? contractWithDates : c))
        );


        return contractWithDates;
      }

      return null;
    } catch (error) {
      console.error("Error refreshing contract data:", error);
      return null;
    }
  };

  // Recalculate payment schedule for a specific contract
  const recalculatePaymentScheduleForContract = async (
    contractId: string
  ): Promise<{ success: boolean; message: string }> => {
    try {
      const result = await recalculatePaymentSchedule(contractId);

      if (result.success) {
        // Refresh the contract data after recalculation
        await refreshContractData(contractId);
      }

      return result;
    } catch (error) {
      console.error("❌ Error recalculating payment schedule:", error);
      return {
        success: false,
        message:
          error instanceof Error ? error.message : "Unknown error occurred",
      };
    }
  };

  // Recalculate payment schedules for all contracts with extra payments
  const recalculateAllContractsScheduleForAll = async (): Promise<{
    success: boolean;
    results: any[];
  }> => {
    try {
      const result = await recalculateAllContractsSchedule();

      if (result.success) {
        // Refresh all contract data after recalculation
        await loadAllContracts();
      }

      return result;
    } catch (error) {
      console.error("❌ Error recalculating all contracts:", error);
      return {
        success: false,
        results: [],
      };
    }
  };

  const getCustomerPayments = (customerId: string) => {
    return payments.filter((payment) => payment.customer_id === customerId);
  };

  const calculateInterest = (
    amount: number,
    daysLate: number,
    interestRate: number
  ) => {
    const interest = amount * (interestRate / 100) * daysLate;
    return Math.round(interest * 100) / 100; // Round to 2 decimal places
  };

  return (
    <DataContext.Provider
      value={{
        companies,
        customers,
        contracts,
        payments,
        vehicles,
        notifications,
        selectedCompany,
        setSelectedCompany,
        addPayment,
        addExtraPayment,
        updatePayment,
        deletePayment,
        deleteCompany,
        updateContract,
        getCustomerContracts,
        getCustomerPayments,
        calculateInterest,
        refreshContractData,
        refetchContract,
        getContractMonthProgress,
        createPaymentWithCleanPayload,

        refreshData,
        loading,
        error,
        // Lazy loading functions
        loadCompanies,
        loadCustomers,
        loadContracts,
        loadContractsWithoutPermissions,
        loadAllContracts,
        loadPayments,
        loadVehicles,
        fixMissingMonthlyPayments,
        synchronizePaymentTracking,
        fixIncorrectlyCompletedContracts,
        fixIncorrectPaymentCounts,
        debugPaymentLoading,
        recalculatePaymentSchedule: recalculatePaymentScheduleForContract,
        recalculateAllContractsSchedule: recalculateAllContractsScheduleForAll,
        // Loading states
        companiesLoading,
        customersLoading,
        contractsLoading,
        paymentsLoading,
        vehiclesLoading,
      }}
    >
      {children}
    </DataContext.Provider>
  );
};

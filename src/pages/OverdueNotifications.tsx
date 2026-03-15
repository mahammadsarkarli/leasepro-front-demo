import React, { useState, useMemo, useEffect } from "react";
import { useTranslation } from "../i18n";
import { useNavigate } from "react-router-dom";
import {
  Bell,
  Phone,
  Car,
  Calendar,
  DollarSign,
  User,
  Building2,
  AlertTriangle,
  Search,
  Filter,
  Eye,
  Plus,
  Grid3X3,
  List,
} from "lucide-react";
import { useData } from "../contexts/DataContext";
import { useAuth } from "../contexts/AuthContext";
import { formatDisplayDate } from "../utils/dateUtils";
import { getDisplayMonthlyPayment } from "../utils/paymentCalculationUtils";
import { calculateCorrectNextDueDate } from "../utils/contractUtils";
import {
  calculateOverduePenalty,
  calculatePaymentDetailsWithPartialPayments,
  calculateMultiMonthOverdueAmount,
} from "../utils/paymentUtils";
import {
  adjustPaymentDate,
} from "../utils/paymentIntervalUtils";
import { addMonths } from "date-fns";

// Helper function to safely handle number calculations and prevent NaN
const safeNumber = (
  value: number | undefined | null,
  defaultValue: number = 0
): number => {
  if (
    value === null ||
    value === undefined ||
    isNaN(value) ||
    !isFinite(value)
  ) {
    return defaultValue;
  }
  return value;
};

// Helper function to safely format numbers for display
const safeFormatNumber = (
  value: number | undefined | null,
  defaultValue: number = 0
): string => {
  const safeValue = safeNumber(value, defaultValue);
  return Math.round(safeValue).toLocaleString();
};

// Helper function to calculate interest from a specific date until today
const calculateInterestFromDate = (
  principalAmount: number,
  fromDate: Date,
  dailyInterestRate: number
): number => {
  const today = new Date();
  // Use local date components without timezone conversion
  const todayOnly = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const fromDateOnly = new Date(fromDate.getFullYear(), fromDate.getMonth(), fromDate.getDate());
  const daysSince = Math.max(0, Math.floor((todayOnly.getTime() - fromDateOnly.getTime()) / (1000 * 60 * 60 * 24)));
  return safeNumber(calculateOverduePenalty(principalAmount, daysSince, dailyInterestRate));
};

interface OverdueNotification {
  id: string;
  customerId: string;
  customerName: string;
  customerPhone: string;
  contractId: string;
  vehicleInfo: string;
  vehicleLicensePlate: string;
  vehicleMake: string;
  vehicleModel: string;
  companyName: string;
  dueDate: Date;
  amount: number;
  daysOverdue: number;
  totalOverdueAmount: number;
  lateFees: number;
  // Enhanced partial payment information
  hasPartialPayments: boolean;
  totalPartialPayments: number;
  remainingAmount: number;
  remainingInterest: number;
  remainingPrincipal: number;
  originalMonthlyPayment: number;
  dailyInterestRate: number;
  // Enhanced partial payment details
  partialPaymentDetails: {
    totalPaid: number;
    remainingToPay: number;
    interestFromPartials: number;
    lastPartialPaymentDate: Date | undefined;
    daysSinceLastPartial: number;
  };
  // Multi-month overdue calculation
  isMultiMonthOverdue: boolean;
  multiMonthCalculation?: {
    totalDaysOverdue: number;
    monthsOverdue: number;
    totalAmount: number;
    totalInterest: number;
    totalDue: number;
    monthlyBreakdown: Array<{
      month: number;
      monthName: string;
      amount: number;
      days: number;
      interest: number;
      total: number;
    }>;
  };
}

const OverdueNotifications: React.FC = () => {
  const { t } = useTranslation();
  const {
    contracts,
    customers,
    companies,
    payments,
    loadCustomers,
    loadCompanies,
    loadContracts,
    loadPayments,
    customersLoading,
    companiesLoading,
    contractsLoading,
  } = useData();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [searchTerm, setSearchTerm] = useState("");
  const [filterByCompany, setFilterByCompany] = useState<string>("all");
  const [sortBy, setSortBy] = useState<
    "daysOverdue" | "amount" | "customerName"
  >("daysOverdue");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [viewMode, setViewMode] = useState<"cards" | "table">(() => {
    // Default to table view on desktop, card view on mobile
    if (typeof window !== 'undefined') {
      return window.innerWidth >= 768 ? "table" : "cards";
    }
    return "table";
  });

  // Load data when component mounts
  useEffect(() => {
    const loadData = async () => {
      await Promise.all([
        loadCustomers(),
        loadCompanies(),
        loadContracts(),
        loadPayments(),
      ]);
    };

    loadData();
  }, []); // Remove function dependencies to prevent repeated calls

  // Set default company filter based on user role
  useEffect(() => {
    // Note: User type doesn't have companyId property, so this functionality is disabled
    // if (user?.role === "user" && user.companyId && filterByCompany === "all") {
    //   setFilterByCompany(user.companyId);
    // }
  }, [user, filterByCompany]);

  const overdueNotifications = useMemo((): OverdueNotification[] => {
    // Calculate overdue and due today contracts using consistent logic
    const today = new Date();
    
    const overdueContracts = contracts.filter((contract) => {
      if (contract.status !== "active") {
        return false;
      }

      // Use the same calculation as other pages for consistency
      const correctDueDate = calculateCorrectNextDueDate(contract, true); // Use contract start date
      
      // Compare dates without time components
      const todayDate = new Date(today.getFullYear(), today.getMonth(), today.getDate());
      const dueDate = new Date(correctDueDate.getFullYear(), correctDueDate.getMonth(), correctDueDate.getDate());
      
      const isOverdue = dueDate <= todayDate;
      
      // Include both overdue (past due) and due today contracts
      return isOverdue;
    });

    return overdueContracts
      .map((contract): OverdueNotification | null => {
      const customer = customers.find((c) => c.id === contract.customer_id);
      const company = companies.find((c) => c.id === contract.company_id);

      // Skip contracts with missing customer data
      if (!customer) {
        return null;
      }

      // Create fallback company if not found (similar to PaymentCreate.tsx)
      let companyToUse = company;
      if (!company) {
        companyToUse = {
          id: contract.company_id,
          name: 'Unknown Company',
          interest_rate: 1.0, // Default daily interest rate of 1%
          voen: '',
          director: '',
          address: '',
          phone_numbers: [],
          email: '',
          created_at: new Date(),
          is_active: true
        };
      }

      // Calculate the due date using contract start date logic
      // This ensures consistency with the updated calculation method
      const contractStartDate = new Date(contract.start_date);
      const paymentsCount = contract.payments_count || 0;

      // Use contract start date as base, then add months for each payment
      const getConsistentPaymentDate = (
        baseDate: Date,
        monthOffset: number
      ): Date => {
        // Start with contract start date
        const targetDate = new Date(baseDate);
        
        // Add months for each payment using date-fns addMonths for better handling
        const targetDateWithMonths = addMonths(targetDate, monthOffset);
        
        // Use the original day from contract start date
        const originalDay = baseDate.getDate();
        const targetDay = targetDateWithMonths.getDate();

        // If the day changed due to month length differences, adjust to maintain consistency
        if (targetDay !== originalDay) {
          const lastDayOfMonth = new Date(
            targetDateWithMonths.getFullYear(),
            targetDateWithMonths.getMonth() + 1,
            0
          ).getDate();
          const adjustedDay = Math.min(originalDay, lastDayOfMonth);
          targetDateWithMonths.setDate(adjustedDay);
        }

        // Apply Sunday-to-Monday adjustment and other date adjustments
        return adjustPaymentDate(targetDateWithMonths);
      };

      // FIXED: Calculate the due date for the CURRENT payment period (not the next one)
      // If 7 payments made, we want the 8th payment's due date (next due date)
      // This should be start_date + (paymentsCount + 1) months
      const correctDueDate = getConsistentPaymentDate(contractStartDate, paymentsCount + 1);

      // Normalize dates to remove time components for consistent calculation
      // Use local date components without timezone conversion
      const todayOnly = new Date(today.getFullYear(), today.getMonth(), today.getDate());
      const correctDueDateOnly = new Date(correctDueDate.getFullYear(), correctDueDate.getMonth(), correctDueDate.getDate());
      
      const daysOverdue = Math.max(
        0,
        Math.floor(
          (todayOnly.getTime() - correctDueDateOnly.getTime()) / (1000 * 60 * 60 * 24)
        )
      );

      // Calculate remaining balance after partial payments for this specific due date
      const contractPayments = payments.filter(
        (p) => p.contract_id === contract.id
      );

      // Use the display monthly payment (which includes adjusted amount if available)
      const displayMonthlyPayment = getDisplayMonthlyPayment(contract);

      // Use company's interest rate for late fees calculation
      // The interest_rate in company is a daily rate (e.g., 1.0 for 1% per day)
      const dailyInterestRate = companyToUse?.interest_rate || 1.0; // Default to 1% per day if not found

        // Calculate late fees using the proper function
        // const lateFees = safeNumber(
        //   calculateOverduePenalty(
        //     displayMonthlyPayment,
        //     daysOverdue,
        //     dailyInterestRate
        //   )
        // );

      // Find partial payments for this specific due date
      const partialPaymentsForThisDate = contractPayments.filter((payment) => {
        const paymentDueDate = new Date(payment.due_date);
        return (
          paymentDueDate.getTime() === correctDueDate.getTime() &&
          payment.is_partial
        );
      });

      // Calculate total partial payments made for this due date
      const totalPartialPayments = safeNumber(
        partialPaymentsForThisDate.reduce(
          (sum, payment) => sum + safeNumber(payment.amount),
          0
        )
      );

      // Check if this is a multi-month overdue (more than 30 days)
      const multiMonthCalculation = calculateMultiMonthOverdueAmount(
        contract,
        today,
        companyToUse,
        contractPayments
      );

      let actualRemainingAmount = 0;
      let remainingInterestAfterPartials = 0;
      let totalAmountDue = 0;
      let totalOverdueAmount = 0;
      let actualLateFees = 0;

      if (multiMonthCalculation) {
        // Use multi-month calculation for overdue > 30 days
        actualRemainingAmount = safeNumber(multiMonthCalculation.totalAmount);
        remainingInterestAfterPartials = safeNumber(multiMonthCalculation.totalInterest);
        totalAmountDue = safeNumber(multiMonthCalculation.totalDue);
        totalOverdueAmount = Math.ceil(safeNumber(totalAmountDue));
        actualLateFees = safeNumber(remainingInterestAfterPartials);
      } else {
        // Use standard calculation for overdue <= 30 days
        const paymentCalculation = calculatePaymentDetailsWithPartialPayments(
          contract,
          today,
          companyToUse,
          false, // treatAsOnTime
          false, // excludeOverduePenalty
          contractPayments
        );

        actualRemainingAmount = safeNumber(paymentCalculation.baseAmount);
        remainingInterestAfterPartials = safeNumber(paymentCalculation.overduePenalty);
        totalAmountDue = safeNumber(paymentCalculation.totalAmount);
        totalOverdueAmount = Math.ceil(safeNumber(totalAmountDue));
        actualLateFees = safeNumber(remainingInterestAfterPartials);
      }

      // Calculate enhanced partial payment details
      const lastPartialPayment = partialPaymentsForThisDate.length > 0 
        ? partialPaymentsForThisDate.sort((a, b) => new Date(b.payment_date).getTime() - new Date(a.payment_date).getTime())[0]
        : null;
      
      const lastPartialPaymentDate = lastPartialPayment ? new Date(lastPartialPayment.payment_date) : undefined;
      const daysSinceLastPartial = lastPartialPaymentDate 
        ? Math.max(0, Math.floor((today.getTime() - lastPartialPaymentDate.getTime()) / (1000 * 60 * 60 * 24)))
        : 0;
      
      // Calculate interest on remaining amount from last partial payment date
      const interestFromPartials = lastPartialPaymentDate && actualRemainingAmount > 0
        ? calculateInterestFromDate(actualRemainingAmount, lastPartialPaymentDate, dailyInterestRate)
        : 0;

      const partialPaymentDetails = {
        totalPaid: safeNumber(totalPartialPayments),
        remainingToPay: safeNumber(actualRemainingAmount),
        interestFromPartials: safeNumber(interestFromPartials),
        lastPartialPaymentDate,
        daysSinceLastPartial: safeNumber(daysSinceLastPartial)
      };

      return {
        id: `overdue-${contract.id}`,
        customerId: contract.customer_id,
        customerName: customer
          ? (customer.customer_type === 'company' 
              ? customer.company_name || t("common.unknownCustomer")
              : `${customer.first_name} ${customer.last_name}`)
          : t("common.unknownCustomer"),
        customerPhone: customer?.phone || "",
        contractId: contract.id,
        vehicleInfo: contract.vehicle
          ? `${contract.vehicle.license_plate} – ${contract.vehicle.make} ${contract.vehicle.model}`
          : t("pages.overdueNotifications.unknownVehicle"),
        vehicleLicensePlate: contract.vehicle?.license_plate || "",
        vehicleMake: contract.vehicle?.make || "",
        vehicleModel: contract.vehicle?.model || "",
        companyName: companyToUse?.name || t("common.unknownCompany"),
        dueDate: correctDueDate,
        amount: safeNumber(Math.max(0, actualRemainingAmount)),
        daysOverdue: safeNumber(daysOverdue),
        totalOverdueAmount: safeNumber(totalOverdueAmount),
        lateFees: safeNumber(actualLateFees),
        // Enhanced partial payment information
        hasPartialPayments: totalPartialPayments > 0,
        totalPartialPayments: safeNumber(totalPartialPayments),
        remainingAmount: safeNumber(Math.max(0, actualRemainingAmount)),
        remainingInterest: safeNumber(
          Math.max(0, remainingInterestAfterPartials)
        ),
        remainingPrincipal: safeNumber(Math.max(0, actualRemainingAmount)),
        originalMonthlyPayment: safeNumber(displayMonthlyPayment),
        dailyInterestRate: safeNumber(dailyInterestRate),
        partialPaymentDetails,
        // Multi-month overdue calculation
        isMultiMonthOverdue: !!multiMonthCalculation,
        multiMonthCalculation: multiMonthCalculation || undefined,
      };
      })
      .filter((notification): notification is OverdueNotification => notification !== null);
  }, [contracts, customers, companies, payments, t]);

  // Filter and sort notifications
  const filteredNotifications = useMemo(() => {
    let filtered = overdueNotifications;

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(
        (notification) =>
          notification.customerName
            .toLowerCase()
            .includes(searchTerm.toLowerCase()) ||
          notification.vehicleLicensePlate
            .toLowerCase()
            .includes(searchTerm.toLowerCase()) ||
          notification.customerPhone.includes(searchTerm)
      );
    }

    // Filter by company
    if (filterByCompany !== "all") {
      filtered = filtered.filter((notification) => {
        const contract = contracts.find(
          (c) => c.id === notification.contractId
        );
        return contract?.company_id === filterByCompany;
      });
    }

    // Sort
    filtered.sort((a, b) => {
      let comparison = 0;
      switch (sortBy) {
        case "daysOverdue":
          comparison = a.daysOverdue - b.daysOverdue;
          break;
        case "amount":
          comparison = a.totalOverdueAmount - b.totalOverdueAmount;
          break;
        case "customerName":
          comparison = a.customerName.localeCompare(b.customerName);
          break;
      }
      return sortOrder === "asc" ? comparison : -comparison;
    });

    return filtered;
  }, [
    overdueNotifications,
    searchTerm,
    filterByCompany,
    sortBy,
    sortOrder,
    contracts,
  ]);

  const totalOverdueAmount = filteredNotifications.reduce(
    (sum, notification) => sum + notification.totalOverdueAmount,
    0
  );
  const totalLateFees = filteredNotifications.reduce(
    (sum, notification) => sum + notification.lateFees,
    0
  );

  const handleSort = (field: typeof sortBy) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(field);
      setSortOrder("desc");
    }
  };

  const handleViewContract = (contractId: string) => {
    navigate(`/contracts/${contractId}`);
  };

  const handleRecordPayment = (contractId: string) => {
    navigate(`/payments/create?contractId=${contractId}`);
  };


  // Show loading state while data is being fetched
  if (customersLoading || companiesLoading || contractsLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">{t("common.loading")}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
            <AlertTriangle className="w-6 h-6 text-red-600" />
          </div>
          <div data-guide-id="overdue-header">
            <h1 className="text-2xl font-bold text-gray-900">
              {t("pages.overdueNotifications.title")}
            </h1>
            <p className="text-gray-600">
              {t("pages.overdueNotifications.subtitle")}
            </p>
          </div>
        </div>
        {/* <button
          onClick={exportToCSV}
          className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
        >
          <Download className="w-4 h-4 mr-2" />
          {t("pages.overdueNotifications.exportCSV")}
        </button> */}
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center">
              <AlertTriangle className="w-4 h-4 text-red-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">
                {t("pages.overdueNotifications.totalOverdue")}
              </p>
              <p className="text-2xl font-bold text-gray-900">
                {filteredNotifications.length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="w-8 h-8 bg-amber-100 rounded-lg flex items-center justify-center">
              <DollarSign className="w-4 h-4 text-amber-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">
                {t("pages.overdueNotifications.totalAmount")}
              </p>
              <p className="text-2xl font-bold text-gray-900">
                ₼{safeFormatNumber(totalOverdueAmount)}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center">
              <DollarSign className="w-4 h-4 text-orange-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">
                {t("pages.overdueNotifications.totalLateFees")}
              </p>
              <p className="text-2xl font-bold text-gray-900">
                ₼{safeFormatNumber(totalLateFees)}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
              <Calendar className="w-4 h-4 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">
                {t("pages.overdueNotifications.avgDaysOverdue")}
              </p>
              <p className="text-2xl font-bold text-gray-900">
                {filteredNotifications.length > 0
                  ? Math.round(
                      filteredNotifications.reduce(
                        (sum, n) => sum + n.daysOverdue,
                        0
                      ) / filteredNotifications.length
                    )
                  : 0}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <label
              htmlFor="search-input"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              {t("pages.overdueNotifications.search")}
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                id="search-input"
                type="text"
                placeholder={t("pages.overdueNotifications.searchPlaceholder")}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          <div className="sm:w-48">
            <label
              htmlFor="company-filter"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              {t("pages.overdueNotifications.filterByCompany")}
            </label>
            <select
              id="company-filter"
              value={filterByCompany}
              onChange={(e) => setFilterByCompany(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">
                {t("pages.overdueNotifications.allCompanies")}
              </option>
              {companies.map((company) => (
                <option key={company.id} value={company.id}>
                  {company.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-end space-x-2">
            <div className="flex items-center border border-gray-300 rounded-md" data-guide-id="view-mode-toggle">
              <button
                onClick={() => setViewMode("cards")}
                className={`px-3 py-2 text-sm font-medium transition-colors duration-200 ${
                  viewMode === "cards"
                    ? "bg-blue-600 text-white"
                    : "bg-white text-gray-700 hover:bg-gray-50"
                }`}
                title={t("common.cards")}
              >
                <Grid3X3 className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode("table")}
                className={`px-3 py-2 text-sm font-medium transition-colors duration-200 ${
                  viewMode === "table"
                    ? "bg-blue-600 text-white"
                    : "bg-white text-gray-700 hover:bg-gray-50"
                }`}
                title={t("common.table")}
              >
                <List className="w-4 h-4" />
              </button>
            </div>
            <button
              onClick={() => {
                setSearchTerm("");
                setFilterByCompany("all");
              }}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {t("pages.overdueNotifications.clearFilters")}
            </button>
          </div>
        </div>
      </div>

      {/* Cards/Table View */}
      {viewMode === "cards" ? (
        /* Notification Cards */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" data-guide-id="notification-list">
          {filteredNotifications.length === 0 ? (
            <div className="col-span-full">
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
                <Bell className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <p className="text-lg font-medium text-gray-500">
                  {t("pages.overdueNotifications.noOverdueFound")}
                </p>
                <p className="text-sm text-gray-400 mt-2">
                  {t("pages.overdueNotifications.noOverdueSubtext")}
                </p>
              </div>
            </div>
          ) : (
            filteredNotifications.map((notification) => {
              const customer = customers.find(c => c.id === notification.customerId);
              const isCompany = customer?.customer_type === 'company';
              
              return (
                <div
                  key={notification.id}
                  className="bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow"
                >
                  <div className="p-6">
                    {/* Header */}
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2 mb-2">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                            isCompany ? 'bg-blue-100' : 'bg-gray-300'
                          }`}>
                            {isCompany ? (
                              <Building2 className="w-5 h-5 text-blue-600" />
                            ) : (
                              <User className="w-5 h-5 text-gray-600" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="text-lg font-semibold text-gray-900 text-overflow-safe">
                              {notification.customerName}
                            </h3>
                            <div className="flex items-center text-sm text-gray-500 mt-1">
                              <Phone className="w-3 h-3 mr-1 text-gray-400" />
                              <a
                                href={`tel:${notification.customerPhone}`}
                                className="hover:text-blue-600 hover:underline text-overflow-safe"
                              >
                                {notification.customerPhone}
                              </a>
                            </div>
                          </div>
                        </div>
                      </div>
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium flex-shrink-0 ml-2 ${
                          notification.daysOverdue <= 7
                            ? "bg-yellow-100 text-yellow-800"
                            : notification.daysOverdue <= 30
                            ? "bg-orange-100 text-orange-800"
                            : "bg-red-100 text-red-800"
                        }`}
                      >
                        {notification.daysOverdue}{" "}
                        {notification.daysOverdue === 1
                          ? t("pages.overdueNotifications.day")
                          : t("pages.overdueNotifications.days")}
                      </span>
                    </div>

                    {/* Vehicle Info */}
                    <div className="flex items-center mb-4 pb-4 border-b border-gray-200">
                      <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                        <Car className="w-4 h-4 text-blue-600" />
                      </div>
                      <div className="ml-3 flex-1 min-w-0">
                        <div className="text-sm font-medium text-gray-900 text-overflow-safe">
                          {notification.vehicleMake} {notification.vehicleModel}
                        </div>
                        <div className="text-sm text-gray-500">
                          {notification.vehicleLicensePlate}
                        </div>
                      </div>
                    </div>

                    {/* Company Info */}
                    <div className="flex items-center mb-4 pb-4 border-b border-gray-200">
                      <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                        <Building2 className="w-4 h-4 text-green-600" />
                      </div>
                      <div className="ml-3 flex-1 min-w-0">
                        <div className="text-sm font-medium text-gray-900 text-overflow-safe">
                          {notification.companyName}
                        </div>
                      </div>
                    </div>

                    {/* Amount Info */}
                    <div className="mb-4">
                      <div className="text-2xl font-bold text-gray-900 mb-2">
                        ₼{safeFormatNumber(notification.totalOverdueAmount)}
                      </div>
                      <div className="space-y-1 text-xs">
                        <div className="flex justify-between">
                          <span className="text-gray-600">
                            {t("pages.overdueNotifications.baseAmount")}:
                          </span>
                          <span className="text-blue-600 font-medium">
                            ₼{safeFormatNumber(notification.amount)}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">
                            {t("pages.overdueNotifications.newInterest")}:
                          </span>
                          <span className="text-red-600 font-medium">
                            ₼{safeFormatNumber(notification.lateFees)}
                          </span>
                        </div>
                        <div className="text-gray-500 mt-1">
                          {t('notifications.due')}: {formatDisplayDate(notification.dueDate)}
                        </div>
                      </div>
                    </div>

                    {/* Partial Payments Info (Simplified for Card) */}
                    {notification.hasPartialPayments && (
                      <div
                        className={`mb-4 p-3 rounded border ${
                          notification.remainingAmount <= 0
                            ? "bg-green-50 border-green-200"
                            : "bg-blue-50 border-blue-200"
                        }`}
                      >
                        <div className="text-xs font-medium mb-2">
                          {notification.remainingAmount <= 0
                            ? "✅ " + t("pages.overdueNotifications.partialPaymentStatus") + " (Sufficient)"
                            : t("pages.overdueNotifications.partialPaymentStatus")}
                        </div>
                        <div className="space-y-1 text-xs">
                          <div className="flex justify-between">
                            <span className="text-gray-600">{t("pages.overdueNotifications.paid")}:</span>
                            <span className="font-medium text-green-700">
                              ₼{safeFormatNumber(notification.partialPaymentDetails.totalPaid)}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">{t("pages.overdueNotifications.remaining")}:</span>
                            <span className="font-medium text-blue-700">
                              ₼{safeFormatNumber(notification.partialPaymentDetails.remainingToPay)}
                            </span>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex space-x-2 pt-4 border-t border-gray-200">
                      <button
                        onClick={() => handleViewContract(notification.contractId)}
                        className="flex-1 inline-flex items-center justify-center px-4 py-2 border border-blue-300 rounded-lg text-sm font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 transition-colors"
                      >
                        <Eye className="w-4 h-4 mr-2" />
                        {t("pages.overdueNotifications.viewDetails")}
                      </button>
                      <button
                        onClick={() => handleRecordPayment(notification.contractId)}
                        className="flex-1 inline-flex items-center justify-center px-4 py-2 border border-green-300 rounded-lg text-sm font-medium text-green-700 bg-green-50 hover:bg-green-100 transition-colors"
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        {t("pages.overdueNotifications.recordPayment")}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      ) : (
        /* Table View */
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t("pages.overdueNotifications.customer")}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t("pages.overdueNotifications.vehicle")}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t("pages.overdueNotifications.company")}
                  </th>
                  <th
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort("daysOverdue")}
                  >
                    <div className="flex items-center">
                      {t("pages.overdueNotifications.daysOverdue")}
                      <Filter className="w-3 h-3 ml-1" />
                    </div>
                  </th>
                  <th
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort("amount")}
                  >
                    <div className="flex items-center">
                      {t("pages.overdueNotifications.amount")}
                      <Filter className="w-3 h-3 ml-1" />
                    </div>
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t("pages.overdueNotifications.actions")}
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200" data-guide-id="notification-list">
                {filteredNotifications.length === 0 ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-6 py-12 text-center text-gray-500"
                    >
                      <div className="flex flex-col items-center">
                        <Bell className="w-12 h-12 text-gray-300 mb-4" />
                        <p className="text-lg font-medium">
                          {t("pages.overdueNotifications.noOverdueFound")}
                        </p>
                        <p className="text-sm">
                          {t("pages.overdueNotifications.noOverdueSubtext")}
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredNotifications.map((notification) => {
                    const customer = customers.find(c => c.id === notification.customerId);
                    const isCompany = customer?.customer_type === 'company';
                    
                    return (
                    <tr key={notification.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                            isCompany ? 'bg-blue-100' : 'bg-gray-300'
                          }`}>
                            {isCompany ? (
                              <Building2 className="w-4 h-4 text-blue-600" />
                            ) : (
                              <User className="w-4 h-4 text-gray-600" />
                            )}
                          </div>
                          <div className="ml-3">
                            <div className="text-sm font-medium text-gray-900">
                              {notification.customerName}
                            </div>
                            <div className="flex items-center text-sm text-gray-500">
                              <Phone className="w-3 h-3 mr-2 text-gray-400" />
                              <a
                                href={`tel:${notification.customerPhone}`}
                                className="hover:text-blue-600 hover:underline"
                              >
                                {notification.customerPhone}
                              </a>
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                            <Car className="w-4 h-4 text-blue-600" />
                          </div>
                          <div className="ml-3">
                            <div className="text-sm font-medium text-gray-900">
                              {notification.vehicleMake}{" "}
                              {notification.vehicleModel}
                            </div>
                            <div className="text-sm text-gray-500">
                              {notification.vehicleLicensePlate}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                            <Building2 className="w-4 h-4 text-green-600" />
                          </div>
                          <div className="ml-3">
                            <div className="text-sm font-medium text-gray-900">
                              {notification.companyName}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              notification.daysOverdue <= 7
                                ? "bg-yellow-100 text-yellow-800"
                                : notification.daysOverdue <= 30
                                ? "bg-orange-100 text-orange-800"
                                : "bg-red-100 text-red-800"
                            }`}
                          >
                            {notification.daysOverdue}{" "}
                            {notification.daysOverdue === 1
                              ? t("pages.overdueNotifications.day")
                              : t("pages.overdueNotifications.days")}
                          </span>
                        </div>
                        <div className="text-sm text-gray-500">
                          {t('notifications.due')}: {formatDisplayDate(notification.dueDate)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          <div className="font-medium">
                            ₼{safeFormatNumber(notification.totalOverdueAmount)}
                          </div>
                          <div className="text-xs text-blue-600">
                            {t("pages.overdueNotifications.baseAmount")}: ₼
                            {safeFormatNumber(notification.amount)}
                          </div>
                          <div className="text-xs text-red-600">
                            {t("pages.overdueNotifications.newInterest")}: ₼
                            {safeFormatNumber(notification.lateFees)}
                          </div>
                          {notification.daysOverdue > 0 &&
                            notification.lateFees > 0 && (
                              <div className="text-xs text-gray-500">
                                {t(
                                  "pages.payments.createPayment.dailyInterestRate"
                                )}
                                : {safeNumber(notification.dailyInterestRate)}
                                {t("pages.payments.createPayment.perDay")}
                              </div>
                            )}
                          
                          {/* Multi-month overdue breakdown */}
                          {notification.isMultiMonthOverdue && notification.multiMonthCalculation && (
                            <div className="mt-3 p-3 bg-orange-50 border border-orange-200 rounded">
                              <div className="text-xs font-medium text-orange-800 mb-2">
                                📅 {t("pages.overdueNotifications.multiMonthOverdueBreakdown")} ({notification.multiMonthCalculation.monthsOverdue} {t("pages.overdueNotifications.months")})
                              </div>
                              
                              {/* Show interest calculation info if there was a last partial payment */}
                              {notification.partialPaymentDetails.lastPartialPaymentDate && (
                                <div className="text-xs text-blue-700 mb-2 p-2 bg-blue-50 rounded">
                                  💡 {t("pages.overdueNotifications.interestCalculatedFrom")}: {formatDisplayDate(notification.partialPaymentDetails.lastPartialPaymentDate)}
                                </div>
                              )}
                              
                              <div className="space-y-2">
                                {notification.multiMonthCalculation.monthlyBreakdown.map((month, index) => (
                                  <div key={index} className="p-2 bg-white rounded border border-orange-200">
                                    <div className="flex justify-between items-center mb-1">
                                      <span className="text-sm font-medium text-gray-800">
                                        {month.monthName}
                                      </span>
                                      <span className="text-xs text-gray-500">
                                        {month.days} {t("pages.overdueNotifications.daysOverdue")}
                                      </span>
                                    </div>
                                    <div className="grid grid-cols-2 gap-2 text-xs">
                                      <div className="text-gray-600">
                                        {t("pages.overdueNotifications.baseAmount")}:
                                      </div>
                                      <div className="text-right font-medium">
                                        ₼{safeFormatNumber(month.amount)}
                                      </div>
                                      <div className="text-gray-600">
                                        {t("pages.overdueNotifications.interest")}:
                                      </div>
                                      <div className="text-right text-red-600 font-medium">
                                        ₼{safeFormatNumber(month.interest)}
                                      </div>
                                      <div className="text-gray-600 font-medium">
                                        {t("pages.overdueNotifications.total")}:
                                      </div>
                                      <div className="text-right text-orange-700 font-bold">
                                        ₼{safeFormatNumber(month.total)}
                                      </div>
                                    </div>
                                  </div>
                                ))}
                                <div className="border-t border-orange-300 pt-2 mt-2">
                                  <div className="flex justify-between text-sm font-bold">
                                    <span className="text-orange-800">{t("pages.overdueNotifications.totalMultiMonth")}:</span>
                                    <span className="text-orange-800">
                                      ₼{safeFormatNumber(notification.multiMonthCalculation.totalDue)}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          )}
                          {notification.hasPartialPayments && (
                            <div
                              className={`mt-2 p-3 rounded border ${
                                notification.remainingAmount <= 0
                                  ? "bg-green-50 border-green-200"
                                  : "bg-blue-50 border-blue-200"
                              }`}
                            >
                              <div
                                className={`text-xs font-medium mb-2 ${
                                  notification.remainingAmount <= 0
                                    ? "text-green-800"
                                    : "text-blue-800"
                                }`}
                              >
                                {notification.remainingAmount <= 0
                                  ? "✅ " +
                                    t(
                                      "pages.overdueNotifications.partialPaymentStatus"
                                    ) +
                                    " (Sufficient)"
                                  : t(
                                      "pages.overdueNotifications.partialPaymentStatus"
                                    )}
                              </div>
                              
                              {/* Enhanced partial payment details */}
                              <div className="space-y-1">
                                <div className="flex justify-between text-xs">
                                  <span className="text-gray-600">
                                    {t("pages.overdueNotifications.paid")}:
                                  </span>
                                  <span className="font-medium text-green-700">
                                    ₼{safeFormatNumber(notification.partialPaymentDetails.totalPaid)}
                                  </span>
                                </div>
                                
                                <div className="flex justify-between text-xs">
                                  <span className="text-gray-600">
                                    {t("pages.overdueNotifications.remaining")}:
                                  </span>
                                  <span className="font-medium text-blue-700">
                                    ₼{safeFormatNumber(notification.partialPaymentDetails.remainingToPay)}
                                  </span>
                                </div>
                                
                                {notification.partialPaymentDetails.lastPartialPaymentDate && (
                                  <div className="flex justify-between text-xs">
                                    <span className="text-gray-600">
                                      {t("pages.overdueNotifications.lastPayment")}:
                                    </span>
                                    <span className="text-gray-700">
                                      {formatDisplayDate(notification.partialPaymentDetails.lastPartialPaymentDate)}
                                    </span>
                                  </div>
                                )}
                                
                                {notification.partialPaymentDetails.daysSinceLastPartial > 0 && (
                                  <div className="flex justify-between text-xs">
                                    <span className="text-gray-600">
                                      {t("pages.overdueNotifications.daysSinceLastPayment")}:
                                    </span>
                                    <span className="text-gray-700">
                                      {notification.partialPaymentDetails.daysSinceLastPartial} {t("common.days")}
                                    </span>
                                  </div>
                                )}
                                
                          
                                
                                {notification.partialPaymentDetails.interestFromPartials > 0 && (
                                  <div className="text-xs text-gray-500 italic mt-1">
                                    {t("pages.overdueNotifications.interestCalculation")}: 
                                    ₼{safeFormatNumber(notification.partialPaymentDetails.remainingToPay)} × 
                                    {safeNumber(notification.dailyInterestRate)}% × 
                                    {notification.partialPaymentDetails.daysSinceLastPartial} {t("common.days")}
                                  </div>
                                )}
                              </div>
                              
                              {notification.remainingAmount <= 0 && (
                                <div className="text-xs text-green-700 font-medium mt-2">
                                  {t(
                                    "pages.overdueNotifications.paymentCompletedForPeriod"
                                  )}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          <button
                            onClick={() =>
                              handleViewContract(notification.contractId)
                            }
                            className="text-blue-600 hover:text-blue-900 flex items-center text-xs"
                          >
                            <Eye className="w-3 h-3 mr-1" />
                            {t("pages.overdueNotifications.viewDetails")}
                          </button>
                          <button
                            onClick={() =>
                              handleRecordPayment(notification.contractId)
                            }
                            className="text-green-600 hover:text-green-900 flex items-center text-xs"
                          >
                            <Plus className="w-3 h-3 mr-1" />
                            {t("pages.overdueNotifications.recordPayment")}
                          </button>
                        </div>
                      </td>
                    </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default OverdueNotifications;

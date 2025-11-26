import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useTranslation } from "../i18n";
import {
  Search,
  Calendar,
  CreditCard,
  CheckCircle,
  Clock,
  Plus,
  Eye,
  Edit,
  Trash2,
  X,
  FileText,
} from "lucide-react";
import ImprovedDateInput from "../components/ui/ImprovedDateInput";
import { useData } from "../contexts/DataContext";
import { useAuth } from "../contexts/AuthContext";
import { getDisplayMonthlyPayment } from "../utils/paymentCalculationUtils";
import { roundPaymentAmount, roundInterestAmount } from "../utils/customRoundingUtils";
import { useNotifications } from "../hooks/useNotifications";
// import { startOfMonth, endOfMonth, isWithinInterval } from "date-fns";
import { formatDisplayDate } from "../utils/dateUtils";
import DeleteConfirmationDialog from "../components/DeleteConfirmationDialog";
import EnhancedExtraPaymentModal from "../components/EnhancedExtraPaymentModal";
import { deletePayment } from "../services/payments";

const Payments: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { t } = useTranslation();
  const [searchTerm, setSearchTerm] = useState("");
  const [paymentMethodFilter, setPaymentMethodFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<"all" | "on_time" | "late">(
    "all"
  );
  const [contractFilter, setContractFilter] = useState<string>("");
  // Set default date to today
  const getTodayDateString = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const [startDate, setStartDate] = useState<string>(getTodayDateString());
  const [endDate, setEndDate] = useState<string>(getTodayDateString());
  const [selectedCompanyFilter, setSelectedCompanyFilter] = useState<string>("all");

  const {
    customers,
    contracts,
    companies,
    payments,
    selectedCompany,
    loadPayments,
    loadContractsWithoutPermissions,
    contractsLoading,
    // paymentsLoading,
  } = useData();
  const { user, canEdit, canCreate, canDelete } = useAuth();
  const { successMessages, errorMessages } = useNotifications();

  const [deleteDialog, setDeleteDialog] = useState<{
    isOpen: boolean;
    paymentId: string | null;
    paymentInfo: string;
    isLoading: boolean;
  }>({
    isOpen: false,
    paymentId: null,
    paymentInfo: "",
    isLoading: false,
  });

  // Load payments and contracts from DataContext
  useEffect(() => {
    const loadData = async () => {
      try {
        const contractIdFromUrl = searchParams.get("contractId");
        
        const paymentParams: any = { limit: 1000 };
        
        if (contractIdFromUrl) {
          // If contract ID in URL, load all payments for that contract (no date filter)
          paymentParams.contract_id = contractIdFromUrl;
          console.log("🔍 Initial load - Loading ALL payments for contract:", contractIdFromUrl);
        } else {
          // If no contract ID, load today's payments with date filter
          const today = getTodayDateString();
          paymentParams.payment_date_from = today;
          paymentParams.payment_date_to = today;
          console.log("🔍 Initial load - Loading ONLY today's payments:", today);
        }
        
        const promises = [];
        
        // Always load payments with the specified params
        promises.push(loadPayments(paymentParams));
        
        // Always load contracts without permissions for payments page
        promises.push(loadContractsWithoutPermissions());
        
        await Promise.all(promises);
      } catch (err) {
        console.error("Error loading data:", err);
      }
    };

    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]); // Only depend on searchParams to reload when URL changes

  // Handle contractId from URL parameters
  useEffect(() => {
    const contractIdFromUrl = searchParams.get("contractId");
    if (contractIdFromUrl) {
      setContractFilter(contractIdFromUrl);
    } else {
      setContractFilter("");
    }
  }, [searchParams]);

  // Load payments when contract filter changes (only if not from URL)
  useEffect(() => {
    const loadFilteredPayments = async () => {
      try {
        const params: any = { limit: 1000 };
        
        if (contractFilter) {
          // Load payments for specific contract with date filtering
          params.contract_id = contractFilter;
          if (startDate && endDate) {
            params.payment_date_from = startDate;
            params.payment_date_to = endDate;
          } else {
            const today = getTodayDateString();
            params.payment_date_from = today;
            params.payment_date_to = today;
          }
        } else {
          // Load payments with date filtering
          if (startDate && endDate) {
            params.payment_date_from = startDate;
            params.payment_date_to = endDate;
          } else {
            const today = getTodayDateString();
            params.payment_date_from = today;
            params.payment_date_to = today;
          }
        }
        
        await loadPayments(params);
      } catch (err) {
        console.error("Error loading filtered payments:", err);
      }
    };

    // Only reload if contract filter changed and it's not from URL params
    const contractIdFromUrl = searchParams.get("contractId");
    if (contractFilter !== contractIdFromUrl) {
      loadFilteredPayments();
    }
  }, [contractFilter, loadPayments, searchParams, startDate, endDate]);

  // Load payments when date filter changes
  useEffect(() => {
    const loadPaymentsByDate = async () => {
      try {
        const contractIdFromUrl = searchParams.get("contractId");
        const params: any = { limit: 1000 };
        
        if (contractIdFromUrl) {
          // If contract ID in URL, load all payments for that contract (no date filter)
          params.contract_id = contractIdFromUrl;
          console.log("🔍 Loading ALL payments for contract:", contractIdFromUrl);
        } else if (startDate && endDate) {
          // If no contract ID, apply date filter
          params.payment_date_from = startDate;
          params.payment_date_to = endDate;
          console.log("🔍 Loading payments with date range:", { startDate, endDate });
        } else {
          // If no date range, load today's payments by default
          const today = getTodayDateString();
          params.payment_date_from = today;
          params.payment_date_to = today;
          console.log("🔍 Loading today's payments:", today);
        }
        
        await loadPayments(params);
      } catch (err) {
        console.error("Error loading payments by date:", err);
      }
    };

    loadPaymentsByDate();
  }, [startDate, endDate, loadPayments, searchParams]);

  // Filter payments - show ALL payments regardless of company or user role
  // Sort payments by date (newest first)
  const getFilteredPayments = () => {
    let filteredPayments = [...payments].sort((a, b) => {
      const dateA = new Date(a.payment_date + "T12:00:00");
      const dateB = new Date(b.payment_date + "T12:00:00");
      return dateB.getTime() - dateA.getTime(); // Newest first
    });

    // Date filtering is now handled by API, no client-side filtering needed

    if (searchTerm) {
      filteredPayments = filteredPayments.filter((payment) => {
        const customer = customers.find((c) => c.id === payment.customer_id);
        const contract = contracts.find((c) => c.id === payment.contract_id);
        return (
          (customer &&
            `${customer.first_name} ${customer.last_name}`
              .toLowerCase()
              .includes(searchTerm.toLowerCase())) ||
          (contract &&
            contract.vehicle?.license_plate
              ?.toLowerCase()
              .includes(searchTerm.toLowerCase())) ||
          payment.amount.toString().includes(searchTerm)
        );
      });
    }

    if (paymentMethodFilter !== "all") {
      filteredPayments = filteredPayments.filter(
        (p) => p.payment_method === paymentMethodFilter
      );
    }

    if (statusFilter !== "all") {
      filteredPayments = filteredPayments.filter((p) =>
        statusFilter === "late" ? p.is_late : !p.is_late
      );
    }

    // Filter by contract if specified
    if (contractFilter) {
      filteredPayments = filteredPayments.filter(
        (p) => p.contract_id === contractFilter
      );
    }

    // Filter by company if specified
    if (selectedCompanyFilter !== "all") {
      filteredPayments = filteredPayments.filter(
        (p) => p.company_id === selectedCompanyFilter
      );
    }

    // Return filtered payments (sorting is handled by API)
    return filteredPayments;
  };

  const filteredPayments = getFilteredPayments();

  // Calculate statistics for filtered payments (always show stats)
  const contractIdFromUrl = searchParams.get("contractId");
  const isViewingSpecificContract = contractIdFromUrl || contractFilter;
  
  const stats = {
    totalCount: filteredPayments.length,
    totalAmount: filteredPayments.reduce((sum, payment) => sum + payment.amount, 0),
    averageAmount: filteredPayments.length > 0 
      ? filteredPayments.reduce((sum, payment) => sum + payment.amount, 0) / filteredPayments.length 
      : 0,
    latePayments: filteredPayments.filter(p => p.is_late).length,
    onTimePayments: filteredPayments.filter(p => !p.is_late).length,
    isContractView: isViewingSpecificContract,
    selectedCompanyName: selectedCompanyFilter !== "all" 
      ? companies.find(c => c.id === selectedCompanyFilter)?.name || t("common.unknownCompany")
      : t("common.allCompanies"),
  };

  // Debug logging for payments display
  
  console.log("🔍 Payments page - final filtered payments:", {
    totalPayments: payments.length,
    filteredPayments: filteredPayments.length,
    searchTerm,
    paymentMethodFilter,
    statusFilter,
    contractFilter,
    startDate: startDate || "No start date filter",
    endDate: endDate || "No end date filter",
    selectedCompany,
    userRole: user?.role,
    filteringMethod: searchParams.get("contractId") 
      ? "Contract filtering (all payments for specific contract)" 
      : "API date filtering + client-side sorting (newest first)",
    apiLimit: "1000 records max",
    showStats: "Always show payment statistics",
    defaultBehavior: searchParams.get("contractId") 
      ? "All payments for specific contract (no date filter)" 
      : "API filtered payments + sorted by date (newest first)",
    todayDateString: getTodayDateString(),
    dateFilterActive: (!!startDate && !!endDate),
    stats,
  });

  const handleDeleteClick = (paymentId: string, paymentInfo: string) => {
    setDeleteDialog({
      isOpen: true,
      paymentId,
      paymentInfo,
      isLoading: false,
    });
  };

  const handleDeleteConfirm = async () => {
    if (!deleteDialog.paymentId) return;

    setDeleteDialog((prev) => ({ ...prev, isLoading: true }));

    try {
      await deletePayment(deleteDialog.paymentId);
      
      // Reload payments with current filters (contract ID and/or date filter)
      const contractIdFromUrl = searchParams.get("contractId");
      const today = getTodayDateString();
      const params: any = { limit: 1000 };
      
      if (contractIdFromUrl) {
        // If contract ID in URL, load all payments for that contract (no date filter)
        params.contract_id = contractIdFromUrl;
        console.log("🔍 After delete - Reloading ALL payments for contract:", contractIdFromUrl);
      } else if (contractFilter) {
        // If contract filter is set (but not from URL), load payments for specific contract with date filtering
        params.contract_id = contractFilter;
        if (startDate && endDate) {
          params.payment_date_from = startDate;
          params.payment_date_to = endDate;
        } else {
          params.payment_date_from = today;
          params.payment_date_to = today;
        }
        console.log("🔍 After delete - Reloading payments for contract with date filter:", contractFilter);
      } else {
        // If no contract filter, apply date filter only
        if (startDate && endDate) {
          params.payment_date_from = startDate;
          params.payment_date_to = endDate;
        } else {
          params.payment_date_from = today;
          params.payment_date_to = today;
        }
        console.log("🔍 After delete - Reloading payments with date filter only");
      }
      
      await loadPayments(params);
      setDeleteDialog({
        isOpen: false,
        paymentId: null,
        paymentInfo: "",
        isLoading: false,
      });
      successMessages.deleted(t("common.payment"));
    } catch (error) {
      errorMessages.show(t("pages.payments.deleteFailed"));
    } finally {
      setDeleteDialog((prev) => ({ ...prev, isLoading: false }));
    }
  };

  const handleDeleteCancel = () => {
    setDeleteDialog({
      isOpen: false,
      paymentId: null,
      paymentInfo: "",
      isLoading: false,
    });
  };

  // Calculate stats
  // const currentMonth = new Date();
  // const monthStart = startOfMonth(currentMonth);
  // const monthEnd = endOfMonth(currentMonth);

  // const thisMonthPayments = filteredPayments.filter((payment) =>
  //   isWithinInterval(new Date(payment.payment_date), {
  //     start: monthStart,
  //     end: monthEnd,
  //   })
  // );

  // const stats = {
  //   totalPayments: filteredPayments.length,
  //   thisMonthTotal: thisMonthPayments.reduce((sum, p) => sum + p.amount, 0),
  //   latePayments: filteredPayments.filter((p) => p.is_late).length,
  //   averagePayment:
  //     filteredPayments.length > 0
  //       ? filteredPayments.reduce((sum, p) => sum + p.amount, 0) /
  //         filteredPayments.length
  //       : 0,
  // };

  // // Calculate last payment and total information
  // const lastPayment = filteredPayments.length > 0 ? filteredPayments[0] : null; // First payment is the latest due to API sorting
  // const totalAmount = filteredPayments.reduce((sum, p) => sum + p.amount, 0);

  // const getLastPaymentInfo = () => {
  //   if (!lastPayment) return null;

  //   const contract = contracts.find((c) => c.id === lastPayment.contract_id);
  //   const customer = customers.find((c) => c.id === lastPayment.customer_id);

  //   return {
  //     amount: lastPayment.amount,
  //     date: lastPayment.payment_date,
  //     method: lastPayment.payment_method,
  //     customer: customer
  //       ? `${customer.first_name} ${customer.last_name}`
  //       : t("common.unknownCustomer"),
  //     vehicle: contract?.vehicle?.license_plate || t("common.unknownVehicle"),
  //     isLate: lastPayment.is_late,
  //   };
  // };

  // const lastPaymentInfo = getLastPaymentInfo();

  const [showExtraPaymentModal, setShowExtraPaymentModal] = useState(false);
  const [selectedContractId, setSelectedContractId] = useState("");

  // Contract search state
  const [contractSearchTerm, setContractSearchTerm] = useState("");
  const [filteredContracts, setFilteredContracts] = useState<any[]>([]);

  // Filter contracts for extra payment modal
  useEffect(() => {
    let availableContracts = contracts.filter((contract) => {
      // Filter by active status
      if (!["active", "open"].includes(contract.status)) return false;

      // Filter based on user role and company
      if (selectedCompany) {
        return contract.company_id === selectedCompany;
      }
      return true; // Admin can see all contracts
    });

    // Debug logging for contracts with extra payments
    const contractsWithExtraPayments = availableContracts.filter(
      (c) => c.total_extra_payments > 0
    );
    if (contractsWithExtraPayments.length > 0) {
      console.log(
        "🔍 Payments - Contracts with extra payments:",
        contractsWithExtraPayments.map((c) => ({
          id: c.id,
          monthly_payment: c.monthly_payment,
          original_monthly_payment: c.original_monthly_payment,
          adjusted_monthly_payment: c.adjusted_monthly_payment,
          total_extra_payments: c.total_extra_payments,
          hasAdjustedPayment: !!c.adjusted_monthly_payment,
        }))
      );
    }

    // Apply search filter
    if (contractSearchTerm.trim()) {
      const term = contractSearchTerm.toLowerCase();
      availableContracts = availableContracts.filter((contract) => {
        const customer = customers.find((c) => c.id === contract.customer_id);
        const customerName = customer
          ? `${customer.first_name} ${customer.last_name}`.toLowerCase()
          : "";
        const licensePlate =
          contract.vehicle?.license_plate?.toLowerCase() || "";
        const vehicleInfo = contract.vehicle
          ? `${contract.vehicle.make} ${contract.vehicle.model}`.toLowerCase()
          : "";

        return (
          customerName.includes(term) ||
          licensePlate.includes(term) ||
          vehicleInfo.includes(term)
        );
      });
    }

    setFilteredContracts(availableContracts);
  }, [contracts, customers, contractSearchTerm, user, selectedCompany]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="mobile-flex-col flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {t("pages.payments.title")}
          </h1>
          <p className="text-gray-600">{t("pages.payments.subtitle")}</p>
        </div>
        <div className="flex space-x-3">
          {canCreate("payments") && (
            <button
              onClick={() => navigate("/payments/create")}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
            >
              <Plus className="w-4 h-4 mr-2" />
              {t("common.createPayment")}
            </button>
          )}
        </div>
      </div>

      {/* Contract Filter Indicator */}
      {contractFilter && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                <FileText className="w-4 h-4 text-blue-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-blue-900">
                  {t("pages.payments.filteredByContract")}
                </p>
                <p className="text-xs text-blue-700">
                  {(() => {
                    const contract = contracts.find(
                      (c) => c.id === contractFilter
                    );
                    const customer = contract
                      ? customers.find((c) => c.id === contract.customer_id)
                      : null;
                    return contract && customer
                      ? `${customer.first_name} ${customer.last_name} - ${
                          contract.vehicle?.license_plate || "N/A"
                        }`
                      : t("pages.payments.contractNotFound");
                  })()}
                </p>
              </div>
            </div>
            <button
              onClick={() => {
                setContractFilter("");
                // Remove contractId from URL
                const newSearchParams = new URLSearchParams(searchParams);
                newSearchParams.delete("contractId");
                navigate(`/payments?${newSearchParams.toString()}`, {
                  replace: true,
                });
              }}
              className="text-blue-600 hover:text-blue-800 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Stats Cards - Always show payment statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {/* Company Info */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="flex items-center">
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                <div className="w-5 h-5 text-purple-600 font-bold">🏢</div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">{t("common.selectedCompany")}</p>
                <p className="text-lg font-bold text-gray-900">{stats.selectedCompanyName}</p>
              </div>
            </div>
          </div>

          {/* Total Payments Count */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="flex items-center">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <CreditCard className="w-5 h-5 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">{t("common.totalPayments")}</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalCount}</p>
              </div>
            </div>
          </div>

          {/* Total Amount (Earnings) */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="flex items-center">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <div className="w-5 h-5 text-green-600 font-bold">₼</div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">{t("common.totalEarnings")}</p>
                <p className="text-2xl font-bold text-gray-900">₼{roundPaymentAmount(stats.totalAmount)}</p>
              </div>
            </div>
          </div>

          {/* Payment Status Breakdown */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="flex items-center">
              <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                <CheckCircle className="w-5 h-5 text-orange-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">{t("common.paymentStatus")}</p>
                <div className="flex space-x-2 text-sm">
                  <span className="text-green-600 font-medium">{stats.onTimePayments} {t("common.onTime")}</span>
                  <span className="text-red-600 font-medium">{stats.latePayments} {t("common.late")}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

      {/* Search and Filters */}
      <div className="flex flex-col space-y-4">
        {/* First row: Search, Date filters and Company filter */}
        <div className="flex flex-col xl:flex-row space-y-4 xl:space-y-0 xl:space-x-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder={t("pages.payments.searchPlaceholder")}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div className="flex flex-col lg:flex-row space-y-4 lg:space-y-0 lg:space-x-4">
            <div className="w-full lg:w-60 relative">
              <ImprovedDateInput
                value={startDate}
                onChange={setStartDate}
                placeholder={t("common.startDate")}
                className="w-full"
              />
            </div>

            <div className="w-full lg:w-60 relative">
              <ImprovedDateInput
                value={endDate}
                onChange={setEndDate}
                placeholder={t("common.endDate")}
                className="w-full"
              />
            </div>
          </div>

          <div className="w-full xl:w-80">
            <select
              value={selectedCompanyFilter}
              onChange={(e) => setSelectedCompanyFilter(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">{t("common.allCompanies")}</option>
              {companies.map((company) => (
                <option key={company.id} value={company.id}>
                  {company.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Second row: Status and Payment method filters */}
        <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">{t("common.allPayments")}</option>
            <option value="on_time">{t("common.onTime")}</option>
            <option value="late">{t("common.latePayments")}</option>
          </select>

          <select
            value={paymentMethodFilter}
            onChange={(e) => setPaymentMethodFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">{t("common.allMethods")}</option>
            <option value="automatic">{t("common.automatic")}</option>
            <option value="manual">{t("common.manual")}</option>
            <option value="cash">{t("common.cash")}</option>
            <option value="bank_transfer">{t("common.bankTransfer")}</option>
            <option value="card_to_card">{t("common.cardToCard")}</option>
          </select>
        </div>
      </div>

      {/* Payment count indicator */}
         
        

      {/* Payments Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="mobile-table overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t("common.paymentDate")}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t("common.customerAndVehicle")}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t("common.amount")}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t("common.dueDate")}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t("common.method")}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t("common.status")}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t("common.company")}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t("common.createdBy")}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t("common.actions")}
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredPayments.map((payment) => {
                const customer = customers.find(
                  (c) => c.id === payment.customer_id
                );
                const contract = contracts.find(
                  (c) => c.id === payment.contract_id
                );
                const company = companies.find(
                  (c) => c.id === payment.company_id
                );

                return (
                  <tr key={payment.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
                          <Calendar className="w-4 h-4 text-blue-600" />
                        </div>
                        <div className="text-sm font-medium text-gray-900">
                          {payment.payment_date
                            ? formatDisplayDate(
                                new Date(payment.payment_date + "T12:00:00")
                              )
                            : "Invalid Date"}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {customer
                            ? `${customer.first_name} ${customer.last_name}`
                            : t("pages.payments.unknownCustomer")}
                        </div>

                        {contract && (
                          <div>
                            <div className="text-sm text-gray-600">
                              {contract.vehicle?.make} {contract.vehicle?.model}
                            </div>
                            <div className="text-xs text-gray-500 font-mono">
                              {contract.vehicle?.license_plate}
                            </div>
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          ₼{roundPaymentAmount(payment.amount)}
                        </div>
                        {payment.interest_amount > 0 && (
                          <div className="text-xs text-red-600">
                            +₼{roundInterestAmount(payment.interest_amount)}{" "}
                            {t("common.interest")}
                          </div>
                        )}
                        {payment.expected_amount_calc && (
                          <div className="text-xs text-blue-600 mt-1">
                            Expected: ₼
                            {roundPaymentAmount(payment.expected_amount_calc)}
                          </div>
                        )}
                        {payment.paid_regular_upto_row !== undefined && (
                          <div className="text-xs text-green-600">
                            Paid (regular): ₼
                            {roundPaymentAmount(payment.paid_regular_upto_row)}
                          </div>
                        )}
                        {payment.remaining_for_month_calc !== undefined && (
                          <div className="text-xs text-orange-600">
                            Remaining: ₼
                            {roundPaymentAmount(payment.remaining_for_month_calc)}
                          </div>
                        )}
                        {payment.is_extra && (
                          <div className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800 mt-1">
                            Extra
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {payment.due_date
                          ? formatDisplayDate(
                              new Date(payment.due_date + "T12:00:00")
                            )
                          : "Invalid Date"}
                      </div>
                      {payment.is_late && payment.days_late > 0 && (
                        <div className="text-xs text-red-600">
                          {payment.days_late} {t("common.daysLate")}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 capitalize">
                        {payment.payment_method === 'cash' ? t('common.cash') :
                         payment.payment_method === 'automatic' ? t('common.automatic') :
                         payment.payment_method === 'manual' ? t('common.manual') :
                         payment.payment_method === 'bank_transfer' ? t('common.bankTransfer') :
                         payment.payment_method === 'card_to_card' ? t('common.cardToCard') :
                         payment.payment_method || t("common.unknown")}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {payment.is_late ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                          <Clock className="w-3 h-3 mr-1" />
                          {t("common.late")}
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          <CheckCircle className="w-3 h-3 mr-1" />
                          {t("common.onTime")}
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {company?.name || t("common.unknown")}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {payment.whoCreated || t("common.unknown")}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => navigate(`/payments/${payment.id}`)}
                          className="text-blue-600 hover:text-blue-900"
                          title={t("common.viewDetails")}
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        {canEdit("payments") && (
                          <button
                            onClick={() =>
                              navigate(`/payments/${payment.id}/edit`)
                            }
                            className="text-gray-600 hover:text-gray-900"
                            title={t("common.edit")}
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                        )}
                        {canDelete("payments") && (
                          <button
                            onClick={() =>
                              handleDeleteClick(
                                payment.id,
                                `₼${roundPaymentAmount(payment.amount)} - ${
                                  customer
                                    ? `${customer.first_name} ${customer.last_name}`
                                    : t("common.unknownCustomer")
                                }`
                              )
                            }
                            className="text-red-600 hover:text-red-900"
                            title={t("common.delete")}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {filteredPayments.length === 0 && (
          <div className="text-center py-12">
            <CreditCard className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {t("pages.payments.noPayments")}
            </h3>
            <p className="text-gray-500 mb-4">
              {searchTerm
                ? t("pages.payments.tryAdjustingSearch")
                : t("pages.payments.noPaymentsMessage")}
            </p>
            {!searchTerm && canCreate("payments") && (
              <button
                onClick={() => navigate("/payments/create")}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
              >
                <Plus className="w-4 h-4 mr-2" />
                {t("common.createPayment")}
              </button>
            )}
          </div>
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      <DeleteConfirmationDialog
        isOpen={deleteDialog.isOpen}
        onClose={handleDeleteCancel}
        onConfirm={handleDeleteConfirm}
        title={t("pages.payments.detail.deletePayment")}
        message={t("pages.payments.detail.deleteConfirmation")}
        itemName={deleteDialog.paymentInfo}
        isLoading={deleteDialog.isLoading}
      />

      {/* Enhanced Extra Payment Modal */}
      {showExtraPaymentModal && selectedContractId && (
        <EnhancedExtraPaymentModal
          isOpen={showExtraPaymentModal}
          onClose={() => {
            setShowExtraPaymentModal(false);
            setSelectedContractId("");
          }}
          contractId={selectedContractId}
          contract={contracts.find((c) => c.id === selectedContractId)}
        />
      )}

      {/* Contract Selection Modal */}
      {showExtraPaymentModal && !selectedContractId && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-hidden">
            <div className="bg-gradient-to-r from-green-600 to-emerald-600 px-6 py-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-white">
                {t("common.selectContractForExtraPayment")}
              </h3>
              <button
                onClick={() => {
                  setShowExtraPaymentModal(false);
                  setContractSearchTerm("");
                }}
                className="text-white hover:text-gray-200 transition-colors duration-200"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6">
              {/* Search Input */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t("common.chooseContract")}
                </label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="text"
                    placeholder={t("common.searchContracts")}
                    value={contractSearchTerm}
                    onChange={(e) => setContractSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  />
                </div>
              </div>

              {/* Contract List */}
              <div className="space-y-2 max-h-64 overflow-y-auto border border-gray-200 rounded-lg p-2">
                {contractsLoading ? (
                  <div className="text-center py-8 text-gray-500">
                    <div className="animate-spin w-8 h-8 border-2 border-green-500 border-t-transparent rounded-full mx-auto mb-2"></div>
                    {t("common.loadingContracts")}
                  </div>
                ) : filteredContracts.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <FileText className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                    <p className="text-sm">
                      {contractSearchTerm
                        ? t("common.noContractsFound")
                        : t("common.noActiveContracts")}
                    </p>
                  </div>
                ) : (
                  filteredContracts.map((contract) => {
                    const customer = customers.find(
                      (c) => c.id === contract.customer_id
                    );
                    const isSelected = selectedContractId === contract.id;

                    return (
                      <div
                        key={contract.id}
                        onClick={() => setSelectedContractId(contract.id)}
                        className={`p-3 rounded-lg border cursor-pointer transition-all duration-200 ${
                          isSelected
                            ? "border-green-500 bg-green-50 ring-2 ring-green-200"
                            : "border-gray-200 hover:border-green-300 hover:bg-gray-50"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <div
                              className={`p-2 rounded-lg ${
                                isSelected ? "bg-green-100" : "bg-gray-100"
                              }`}
                            >
                              <FileText
                                className={`w-4 h-4 ${
                                  isSelected
                                    ? "text-green-600"
                                    : "text-gray-600"
                                }`}
                              />
                            </div>
                            <div>
                              <div className="text-sm font-medium text-gray-900">
                                {customer
                                  ? `${customer.first_name} ${customer.last_name}`
                                  : t("common.unknownCustomer")}
                              </div>
                              <div className="text-xs text-gray-500">
                                {contract.vehicle
                                  ? `${contract.vehicle.make} ${contract.vehicle.model}`
                                  : t("common.unknownVehicle")}
                              </div>
                              <div className="text-xs font-mono text-gray-600">
                                {contract.vehicle?.license_plate ||
                                  t("common.noLicense")}
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-sm font-medium text-gray-900">
                              ₼{roundPaymentAmount(getDisplayMonthlyPayment(contract))}
                            </div>
                            <div className="text-xs text-gray-500">
                              {contract.adjusted_monthly_payment &&
                              contract.adjusted_monthly_payment !==
                                contract.monthly_payment
                                ? t("common.newMonthlyPayment")
                                : t("common.monthlyPayment")}
                            </div>
                            {contract.adjusted_monthly_payment &&
                              contract.adjusted_monthly_payment !==
                                contract.monthly_payment && (
                                <div className="text-xs text-green-600 font-medium">
                                  {t("common.adjustedAfterExtraPayment")}
                                </div>
                              )}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Features Info */}
              <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="text-sm text-blue-800">
                  <p className="font-medium mb-2">
                    {t("common.enhancedExtraPaymentFeatures")}:
                  </p>
                  <ul className="list-disc list-inside space-y-1 text-xs">
                    <li>{t("common.targetSpecificPaymentPeriods")}</li>
                    <li>{t("common.setCustomPaymentDates")}</li>
                    <li>{t("common.choosePaymentMethods")}</li>
                    <li>{t("common.addDetailedNotes")}</li>
                  </ul>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex space-x-3 mt-6">
                <button
                  type="button"
                  onClick={() => {
                    setShowExtraPaymentModal(false);
                    setContractSearchTerm("");
                    setSelectedContractId("");
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  {t("common.cancel")}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (selectedContractId) {
                      setContractSearchTerm(""); // Clear search when proceeding
                    }
                  }}
                  disabled={!selectedContractId}
                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {t("common.continue")}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Payments;

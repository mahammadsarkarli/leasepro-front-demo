import React, { useState, useMemo, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "../i18n";
import {
  Plus,
  Search,
  Filter,
  User,
  Car,
  Eye,
  Edit,
  Calendar,
  DollarSign,
  Trash2,
  RefreshCw,
  Download,
  Grid3X3,
  List,
} from "lucide-react";
import { differenceInDays } from "date-fns";
import { useAuth } from "../contexts/AuthContext";
import { ContractStatus } from "../types";
import DeleteConfirmationDialog from "../components/DeleteConfirmationDialog";
import { deleteContract } from "../services/contracts";
import { useData } from "../contexts/DataContext";
import {
  fixAllRemainingBalances,
  fixPrincipalPaid,
} from "../services/payments";
import {
  calculateCorrectNextDueDate,
  calculateContractEndDate,
} from "../utils/contractUtils";
import { getDisplayMonthlyPayment } from "../utils/paymentCalculationUtils";
import {
  roundPaymentAmount,
  roundInterestAmount,
  roundPrincipalAmount,
} from "../utils/customRoundingUtils";
import {
  exportFilteredContractsToExcel,
  exportContractsGroupedByCompany,
} from "../utils/contractsExcelExport";

// Helper function to format date as dd.mm.yyyy
const formatDate = (date: Date): string => {
  const day = date.getDate().toString().padStart(2, "0");
  const month = (date.getMonth() + 1).toString().padStart(2, "0");
  const year = date.getFullYear();
  return `${day}.${month}.${year}`;
};

const Contracts: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { user, canDelete, canEdit, canCreate } = useAuth();
  const {
    contracts,
    customers,
    companies,
    selectedCompany,
    setSelectedCompany,
    // loadContracts, // Temporarily disabled
    loadAllContracts,
    loadCustomers,
    loadVehicles,
    loadCompanies,
    fixMissingMonthlyPayments,
    synchronizePaymentTracking,
    // fixIncorrectlyCompletedContracts, // Temporarily disabled
    // fixIncorrectPaymentCounts, // Temporarily disabled
    contractsLoading,
    customersLoading,
    vehiclesLoading,
    companiesLoading,
  } = useData();

  // CRITICAL FIX: Auto-fix monthly payments and synchronize payment tracking on component mount
  const hasRunDataFixRef = useRef(false);

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<
    ContractStatus | "all" | "overdue"
  >("all");
  const [viewMode, setViewMode] = useState<"card" | "table">(() => {
    // Default to table view on desktop, card view on mobile
    if (typeof window !== 'undefined') {
      return window.innerWidth >= 768 ? "table" : "card";
    }
    return "table";
  });
  const [isFixingPayments, setIsFixingPayments] = useState(false);
  const [isSynchronizingPayments, setIsSynchronizingPayments] = useState(false);
  const [isFixingBalances, setIsFixingBalances] = useState(false);
  const [isFixingPrincipal, setIsFixingPrincipal] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState<{
    isOpen: boolean;
    contractId: string | null;
    contractInfo: string;
    isLoading: boolean;
  }>({
    isOpen: false,
    contractId: null,
    contractInfo: "",
    isLoading: false,
  });

  const today = new Date();

  // Load data when component mounts - only once
  useEffect(() => {
    const loadData = async () => {
      const promises = [];
      
      // Only load if data is missing and not currently loading
      if (contracts.length === 0 && !contractsLoading) {
        promises.push(loadAllContracts()); // Load all contracts including closed ones for admin view
      }
      if (customers.length === 0 && !customersLoading) {
        promises.push(loadCustomers());
      }
      if (!vehiclesLoading) {
        promises.push(loadVehicles());
      }
      if (companies.length === 0 && !companiesLoading) {
        promises.push(loadCompanies());
      }
      
      if (promises.length > 0) {
        await Promise.all(promises);
      }

      // Run auto-fix after data is loaded
      if (!hasRunDataFixRef.current) {
        const fixDataIssues = async () => {
          try {
            console.log(
              "🔧 Auto-fix DISABLED to prevent excessive network requests (1,700+ requests)..."
            );
            // TEMPORARILY DISABLED: Auto-fix functions were causing 1,700+ individual contract requests
            // Each fix function was making individual .eq('id', contract.id) requests for each contract
            // TODO: Implement proper batch updates or make fixes more selective

            // const monthlyResult = await fixMissingMonthlyPayments();
            // const syncResult = await synchronizePaymentTracking();
            // const fixCompletedResult = await fixIncorrectlyCompletedContracts();
            // const fixPaymentCountResult = await fixIncorrectPaymentCounts();

            console.log("✅ Auto-fix skipped to prevent network overload");

            // Mark as completed to prevent re-running
            hasRunDataFixRef.current = true;
          } catch (error) {
            console.error("❌ Error in auto-fix (disabled):", error);
            hasRunDataFixRef.current = true; // Mark as completed even on error to prevent infinite retries
          }
        };

        fixDataIssues();
      }
    };

    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Run only once on mount

  // Close export menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (showExportMenu && !target.closest(".relative")) {
        setShowExportMenu(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showExportMenu]);

  // Calculate statistics - moved before conditional return
  const stats = useMemo(() => {
    const filteredContracts = selectedCompany
      ? contracts.filter((c) => c.company_id === selectedCompany)
      : contracts;

    const total = filteredContracts.length;
    const active = filteredContracts.filter(
      (c) => c.status === ContractStatus.ACTIVE
    ).length;

    // Calculate overdue contracts based on correct due dates
    // Only count ACTIVE contracts as overdue, not OPEN contracts
    // Overdue means the due date has passed (not today, but before today)
    const overdue = filteredContracts.filter((c) => {
      if (c.status !== ContractStatus.ACTIVE) return false;

      const correctNextDueDate = calculateCorrectNextDueDate(c, true); // Use contract start date

      // Compare dates without time components
      const todayDate = new Date(
        today.getFullYear(),
        today.getMonth(),
        today.getDate()
      );
      const dueDate = new Date(
        correctNextDueDate.getFullYear(),
        correctNextDueDate.getMonth(),
        correctNextDueDate.getDate()
      );

      // Only count as overdue if due date is BEFORE today (not today)
      return dueDate < todayDate;
    }).length;

    const completed = filteredContracts.filter(
      (c) => c.status === ContractStatus.COMPLETED
    ).length;
    const open = filteredContracts.filter(
      (c) => c.status === ContractStatus.OPEN
    ).length;

    const dueToday = filteredContracts.filter((c) => {
      if (c.status !== ContractStatus.ACTIVE) return false;

      // Use the same calculation as the rest of the app
      const correctNextDueDate = calculateCorrectNextDueDate(c, true); // Use contract start date

      // Compare dates without time components
      const todayDate = new Date(
        today.getFullYear(),
        today.getMonth(),
        today.getDate()
      );
      const dueDate = new Date(
        correctNextDueDate.getFullYear(),
        correctNextDueDate.getMonth(),
        correctNextDueDate.getDate()
      );

      return dueDate.getTime() === todayDate.getTime();
    }).length;

    return { total, active, overdue, completed, open, dueToday };
  }, [contracts, selectedCompany, today]);

  // Filter contracts - moved before conditional return
  const filteredContracts = useMemo(() => {
    console.log(
      "Filtering contracts with searchTerm:",
      searchTerm,
      "selectedCompany:",
      selectedCompany
    );
    return contracts.filter((contract) => {
      const customer = customers.find((c) => c.id === contract.customer_id);
      const vehicle = contract.vehicle;

      const matchesSearch =
        !searchTerm ||
        (customer &&
          ((customer.customer_type === "company" &&
            customer.company_name &&
            customer.company_name
              .toLowerCase()
              .includes(searchTerm.toLowerCase())) ||
            (customer.customer_type === "individual" &&
              ((customer.first_name &&
                customer.first_name
                  .toLowerCase()
                  .includes(searchTerm.toLowerCase())) ||
                (customer.last_name &&
                  customer.last_name
                    .toLowerCase()
                    .includes(searchTerm.toLowerCase())))) ||
            (customer.company_name &&
              customer.company_name
                .toLowerCase()
                .includes(searchTerm.toLowerCase())))) ||
        (vehicle &&
          (vehicle.license_plate
            .toLowerCase()
            .includes(searchTerm.toLowerCase()) ||
            vehicle.make.toLowerCase().includes(searchTerm.toLowerCase()) ||
            vehicle.model.toLowerCase().includes(searchTerm.toLowerCase()))) ||
        contract.id.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "active" &&
          contract.status === ContractStatus.ACTIVE) ||
        (statusFilter === "open" && contract.status === ContractStatus.OPEN) ||
        (statusFilter === "overdue" &&
          (contract.status === ContractStatus.ACTIVE ||
            contract.status === ContractStatus.OPEN) &&
          contract.start_date &&
          (() => {
            // start_date is the first due date, so we add months based on payments made
            const paymentBeginDate = new Date(contract.start_date);
            const paymentsMade = contract.payments_count || 0;
            const actualDueDate = new Date(paymentBeginDate);
            actualDueDate.setMonth(actualDueDate.getMonth() + paymentsMade);
            return actualDueDate < today;
          })()) ||
        (statusFilter === "completed" &&
          contract.status === ContractStatus.COMPLETED) ||
        (statusFilter === ContractStatus.TAMAMLANMIS &&
          contract.status === ContractStatus.TAMAMLANMIS) ||
        (statusFilter === ContractStatus.ALQI_SATQI &&
          contract.status === ContractStatus.ALQI_SATQI) ||
        (statusFilter === ContractStatus.IMTINA_EDILMIS &&
          contract.status === ContractStatus.IMTINA_EDILMIS);

      const matchesCompany =
        !selectedCompany || contract.company_id === selectedCompany;

      const result = matchesSearch && matchesStatus && matchesCompany;
      if (searchTerm && result) {
        console.log(
          "Contract matches search:",
          contract.id,
          "customer:",
          customer?.first_name,
          customer?.last_name,
          "vehicle:",
          vehicle?.license_plate
        );
      }
      return result;
    });
  }, [
    contracts,
    customers,
    companies,
    searchTerm,
    statusFilter,
    selectedCompany,
    today,
  ]);

  // Show loading state while data is being fetched
  if (
    contractsLoading ||
    customersLoading ||
    vehiclesLoading ||
    companiesLoading
  ) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">{t("common.loading")}</p>
        </div>
      </div>
    );
  }

  const getStatusBadge = (contract: any) => {
    if (!contract.start_date) {
      return (
        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
          {t("common.noDueDate")}
        </span>
      );
    }

    // Use the same calculation as the main table for consistency
    const actualDueDate = calculateCorrectNextDueDate(contract, true); // Use contract start date

    // CRITICAL FIX: Use more reliable date comparison
    const actualDueDateStr = actualDueDate.toDateString();
    const todayStr = today.toDateString();

    // CRITICAL FIX: Check if payment is due today first, then determine if overdue
    const isDueToday =
      (contract.status === ContractStatus.ACTIVE ||
        contract.status === ContractStatus.OPEN) &&
      actualDueDateStr === todayStr;

    const isOverdue =
      (contract.status === ContractStatus.ACTIVE ||
        contract.status === ContractStatus.OPEN) &&
      !isDueToday &&
      actualDueDate < today;

    const daysUntilDue = isDueToday
      ? 0
      : differenceInDays(actualDueDate, today);

    if (contract.status === ContractStatus.COMPLETED) {
      return (
        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
          {t("common.completed")}
        </span>
      );
    }

    if (contract.status === ContractStatus.TAMAMLANMIS) {
      return (
        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
          {t("common.tamamlanmis")}
        </span>
      );
    }

    if (contract.status === ContractStatus.ALQI_SATQI) {
      return (
        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
          {t("common.alqi_satqi")}
        </span>
      );
    }

    if (contract.status === ContractStatus.IMTINA_EDILMIS) {
      return (
        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
          {t("common.imtina_edilmis")}
        </span>
      );
    }

    if (contract.status === ContractStatus.OPEN) {
      return (
        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
          {t("common.open")}
        </span>
      );
    }

    if (isOverdue) {
      return (
        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
          {t("common.overdue")} ({Math.abs(daysUntilDue)}{" "}
          {t("common.overdueDays")})
        </span>
      );
    }

    if (isDueToday) {
      return (
        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
          {t("common.dueToday")}
        </span>
      );
    }

    return (
      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
        {t("common.active")}
      </span>
    );
  };

  const handleDeleteClick = (contractId: string, contractInfo: string) => {
    setDeleteDialog({
      isOpen: true,
      contractId,
      contractInfo,
      isLoading: false,
    });
  };

  const handleDeleteConfirm = async () => {
    if (!deleteDialog.contractId) return;

    setDeleteDialog((prev) => ({ ...prev, isLoading: true }));

    try {
      const contract = contracts.find((c) => c.id === deleteDialog.contractId);
      if (contract) {
        await deleteContract(contract.id);
        // Reload data after deletion
        await loadAllContracts();
        setDeleteDialog({
          isOpen: false,
          contractId: null,
          contractInfo: "",
          isLoading: false,
        });
      }
    } catch (error) {
      console.error("Failed to delete contract:", error);
    } finally {
      setDeleteDialog((prev) => ({ ...prev, isLoading: false }));
    }
  };

  const handleDeleteCancel = () => {
    setDeleteDialog({
      isOpen: false,
      contractId: null,
      contractInfo: "",
      isLoading: false,
    });
  };

  const handleFixPrincipalPaid = async () => {
    setIsFixingPrincipal(true);
    try {
      console.log(
        "🔧 Starting to fix principal paid calculations for all contracts..."
      );
      const result = await fixPrincipalPaid();

      if (result.success && result.updated > 0) {
        alert(
          `✅ Successfully fixed principal paid calculations for ${result.updated} contracts!\n\n${result.message}`
        );
        // Reload contracts to reflect changes
        await loadAllContracts();
      } else if (result.success && result.updated === 0) {
        alert("✅ No contracts needed principal paid fixes.");
      } else {
        alert(
          `❌ Failed to fix principal paid calculations: ${result.message}`
        );
      }

      if (result.errors && result.errors.length > 0) {
        console.error("❌ Errors during principal paid fixing:", result.errors);
        alert(
          `⚠️ Fixed ${result.updated} contracts, but ${
            result.errors.length
          } had errors:\n${result.errors.join("\n")}`
        );
      }
    } catch (error) {
      console.error("❌ Error fixing principal paid calculations:", error);
      alert(
        `❌ Error fixing principal paid calculations: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    } finally {
      setIsFixingPrincipal(false);
    }
  };

  const handleFixRemainingBalances = async () => {
    setIsFixingBalances(true);
    try {
      console.log("🔧 Starting to fix remaining balances for all contracts...");
      const result = await fixAllRemainingBalances();

      if (result.success && result.updated > 0) {
        alert(
          `✅ Successfully fixed remaining balances for ${result.updated} contracts!\n\n${result.message}`
        );
        // Reload contracts to reflect changes
        await loadAllContracts();
      } else if (result.success && result.updated === 0) {
        alert("✅ No contracts needed balance fixes.");
      } else {
        alert(`❌ Failed to fix remaining balances: ${result.message}`);
      }

      if (result.errors && result.errors.length > 0) {
        console.error("❌ Errors during balance fixing:", result.errors);
        alert(
          `⚠️ Fixed ${result.updated} contracts, but ${
            result.errors.length
          } had errors:\n${result.errors.join("\n")}`
        );
      }
    } catch (error) {
      console.error("❌ Error fixing remaining balances:", error);
      alert(
        `❌ Error fixing remaining balances: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    } finally {
      setIsFixingBalances(false);
    }
  };

  const handleFixMonthlyPayments = async () => {
    setIsFixingPayments(true);
    try {
      console.log("🔧 Starting to fix missing monthly payments...");
      const result = await fixMissingMonthlyPayments();

      if (result.updated > 0) {
        const { showSuccess } = require('../services/notifications');
        showSuccess(`Successfully fixed ${result.updated} contracts!`);
        // Reload contracts to show the updated data
        await loadAllContracts();
      } else {
        const { showInfo } = require('../services/notifications');
        showInfo("No contracts needed fixing.");
      }

      if (result.errors.length > 0) {
        console.warn("⚠️ Some contracts could not be fixed:", result.errors);
        const { showWarning } = require('../services/notifications');
        showWarning(
          `${result.errors.length} contracts could not be fixed. Check console for details.`
        );
      }
    } catch (error) {
      console.error("❌ Error fixing monthly payments:", error);
      const { showError } = require('../services/notifications');
      showError("Error fixing monthly payments. Check console for details.");
    } finally {
      setIsFixingPayments(false);
    }
  };

  const handleSynchronizePayments = async () => {
    setIsSynchronizingPayments(true);
    try {
      console.log("🔄 Starting payment synchronization...");
      const result = await synchronizePaymentTracking();

      if (result.updated > 0) {
        alert(
          `✅ Successfully synchronized ${result.updated} contracts! Payment counts and totals are now accurate.`
        );
        // Reload contracts to show the updated data
        await loadAllContracts();
      } else {
        alert("ℹ️ All contracts are already synchronized.");
      }

      if (result.errors.length > 0) {
        console.warn(
          "⚠️ Some contracts could not be synchronized:",
          result.errors
        );
        alert(
          `⚠️ ${result.errors.length} contracts could not be synchronized. Check console for details.`
        );
      }
    } catch (error) {
      console.error("❌ Error synchronizing payments:", error);
      alert("❌ Error synchronizing payments. Check console for details.");
    } finally {
      setIsSynchronizingPayments(false);
    }
  };

  const handleExportToExcel = () => {
    try {
      console.log("📊 Exporting filtered contracts to Excel...");

      // Generate filename with current date
      const today = new Date();
      const dateStr = `${today.getDate().toString().padStart(2, "0")}.${(
        today.getMonth() + 1
      )
        .toString()
        .padStart(2, "0")}.${today.getFullYear()}`;
      const filename = `Kontratlar_${dateStr}.xlsx`;

      // Export filtered contracts
      exportFilteredContractsToExcel(
        filteredContracts,
        customers,
        companies,
        filename
      );

      setShowExportMenu(false);

      // Count completed contracts that were excluded
      const completedCount = filteredContracts.filter(
        (c) =>
          c.status.toLowerCase() === "completed" ||
          c.status.toLowerCase() === "tamamlanmis"
      ).length;
      const exportedCount = filteredContracts.length - completedCount;

      if (completedCount > 0) {
        alert(
          `✅ ${exportedCount} kontrakt Excel faylına ixrac edildi!\n(${completedCount} tamamlanmış kontrakt çıxarıldı)`
        );
      } else {
        alert(`✅ ${exportedCount} kontrakt Excel faylına ixrac edildi!`);
      }
    } catch (error) {
      console.error("❌ Error exporting contracts:", error);
      alert(
        "❌ Excel faylı yaradılarkən xəta baş verdi. Zəhmət olmasa yenidən cəhd edin."
      );
    }
  };

  const handleExportGroupedByCompany = () => {
    try {
      console.log("📊 Exporting contracts grouped by company...");

      // Generate filename with current date
      const today = new Date();
      const dateStr = `${today.getDate().toString().padStart(2, "0")}.${(
        today.getMonth() + 1
      )
        .toString()
        .padStart(2, "0")}.${today.getFullYear()}`;
      const filename = `Kontratlar_Şirkətlərə_Görə_${dateStr}.xlsx`;

      // Export contracts grouped by company
      exportContractsGroupedByCompany(
        filteredContracts,
        customers,
        companies,
        filename
      );

      setShowExportMenu(false);

      // Count completed contracts that were excluded
      const completedCount = filteredContracts.filter(
        (c) =>
          c.status.toLowerCase() === "completed" ||
          c.status.toLowerCase() === "tamamlanmis"
      ).length;
      const exportedCount = filteredContracts.length - completedCount;

      if (completedCount > 0) {
        alert(
          `✅ ${exportedCount} kontrakt şirkətlərə görə qruplaşdırılmış Excel faylına ixrac edildi!\n(${completedCount} tamamlanmış kontrakt çıxarıldı)`
        );
      } else {
        alert(
          `✅ ${exportedCount} kontrakt şirkətlərə görə qruplaşdırılmış Excel faylına ixrac edildi!`
        );
      }
    } catch (error) {
      console.error("❌ Error exporting grouped contracts:", error);
      alert(
        "❌ Şirkətlərə görə qruplaşdırılmış Excel faylı yaradılarkən xəta baş verdi."
      );
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="mobile-flex-col flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {t("contracts.title")}
          </h1>
          <p className="text-gray-600">{t("pages.contracts.subtitle")}</p>
        </div>
        <div className="flex space-x-3">
          {/* <button
            onClick={handleFixPrincipalPaid}
            disabled={isFixingPrincipal}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${isFixingPrincipal ? 'animate-spin' : ''}`} />
            {isFixingPrincipal ? 'Fixing Principal...' : 'Fix Principal Paid'}
          </button>
          <button
            onClick={handleFixRemainingBalances}
            disabled={isFixingBalances}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${isFixingBalances ? 'animate-spin' : ''}`} />
            {isFixingBalances ? 'Fixing Balances...' : 'Fix Remaining Balances'}
          </button> */}
          <div className="relative">
            <button
              onClick={() => setShowExportMenu(!showExportMenu)}
              disabled={filteredContracts.length === 0}
              className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              title={
                filteredContracts.length === 0
                  ? t("pages.contracts.noContractsToExport")
                  : t("pages.contracts.exportContractsToExcel")
              }
            >
              <Download className="w-4 h-4 mr-2" />
              {t("pages.contracts.excelExport")}
            </button>

            {/* Export Dropdown Menu */}
            {showExportMenu && filteredContracts.length > 0 && (
              <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
                <div className="py-1">
                  <button
                    onClick={handleExportToExcel}
                    className="w-full text-left px-4 py-3 text-sm text-gray-700 hover:bg-gray-100 flex items-start"
                  >
                    <Download className="w-4 h-4 mr-3 mt-0.5 flex-shrink-0" />
                    <div>
                      <div className="font-medium">{t("pages.contracts.simpleExport")}</div>
                      <div className="text-xs text-gray-500 mt-1">
                        {t("pages.contracts.simpleExportDesc")}
                      </div>
                    </div>
                  </button>
                  <button
                    onClick={handleExportGroupedByCompany}
                    className="w-full text-left px-4 py-3 text-sm text-gray-700 hover:bg-gray-100 flex items-start border-t border-gray-100"
                  >
                    <Download className="w-4 h-4 mr-3 mt-0.5 flex-shrink-0" />
                    <div>
                      <div className="font-medium">{t("pages.contracts.groupedByCompany")}</div>
                      <div className="text-xs text-gray-500 mt-1">
                        {t("pages.contracts.groupedByCompanyDesc")}
                      </div>
                    </div>
                  </button>
                </div>
              </div>
            )}
          </div>
          {canCreate("contracts") && (
            <button
              onClick={() => navigate("/contracts/create")}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <Plus className="w-4 h-4 mr-2" />
              {t("pages.contracts.newContract")}
            </button>
          )}
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <Calendar className="w-6 h-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">
                {t("pages.contracts.stats.total")}
              </p>
              <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <Calendar className="w-6 h-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">
                {t("pages.contracts.stats.active")}
              </p>
              <p className="text-2xl font-bold text-gray-900">{stats.active}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
              <Calendar className="w-6 h-6 text-red-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">
                {t("pages.contracts.stats.overdue")}
              </p>
              <p className="text-2xl font-bold text-gray-900">
                {stats.overdue}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
              <Calendar className="w-6 h-6 text-yellow-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">
                {t("pages.contracts.stats.dueToday")}
              </p>
              <p className="text-2xl font-bold text-gray-900">
                {stats.dueToday}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="mobile-search-filters flex flex-col space-y-4">
        {/* Search and Status Filter Row */}
        <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder={t("pages.contracts.searchPlaceholder")}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">{t("common.allStatus")}</option>
            <option value={ContractStatus.ACTIVE}>{t("common.active")}</option>
            <option value={ContractStatus.OPEN}>{t("common.open")}</option>
            <option value="overdue">{t("common.overdue")}</option>
            <option value={ContractStatus.COMPLETED}>
              {t("common.completed")}
            </option>
            <option value={ContractStatus.DEFAULTED}>
              {t("common.defaulted")}
            </option>
            <option value={ContractStatus.IMTINA_EDILMIS}>
              {t("common.imtina_edilmis")}
            </option>
            <option value={ContractStatus.ALQI_SATQI}>
              {t("common.alqi_satqi")}
            </option>
            <option value={ContractStatus.TAMAMLANMIS}>
              {t("common.tamamlanmis")}
            </option>
          </select>
          
          {/* View Toggle */}
          <div className="flex items-center space-x-2">
            <div className="flex border border-gray-300 rounded-lg">
              <button
                onClick={() => setViewMode("card")}
                className={`px-3 py-2 text-sm font-medium transition-colors duration-200 ${
                  viewMode === "card"
                    ? "bg-blue-600 text-white"
                    : "bg-white text-gray-700 hover:bg-gray-50"
                }`}
                title={t("common.cardView")}
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
                title={t("common.tableView")}
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Company Filter Row */}
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <Filter className="w-4 h-4 text-gray-400" />
            <span className="text-sm font-medium text-gray-700">
              {t("common.filterByCompany")}:
            </span>
          </div>
          <div className="flex-1 max-w-xs">
            <select
              value={selectedCompany || ""}
              onChange={(e) => setSelectedCompany(e.target.value || null)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">{t("common.allCompanies")}</option>
              {companies.map((company) => (
                <option key={company.id} value={company.id}>
                  {company.name}
                </option>
              ))}
            </select>
          </div>
          {selectedCompany && (
            <button
              onClick={() => setSelectedCompany(null)}
              className="px-3 py-2 text-sm text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors duration-200"
            >
              {t("common.clearFilter")}
            </button>
          )}
        </div>
      </div>

      {/* Contracts List */}
      {viewMode === "card" ? (
        /* Contract Cards */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredContracts.map((contract) => {
            const customer = customers.find(
              (c) => c.id === contract.customer_id
            );
            const company = companies.find(
              (c) => c.id === contract.company_id
            );

            const paymentBeginDate = new Date(contract.start_date);
            const endDate = calculateContractEndDate(
              paymentBeginDate,
              contract.term_months + 1
            );
            const nextPaymentDate = calculateCorrectNextDueDate(contract, true);
            
            const todayDate = new Date(
              today.getFullYear(),
              today.getMonth(),
              today.getDate()
            );
            const paymentDate = new Date(
              nextPaymentDate.getFullYear(),
              nextPaymentDate.getMonth(),
              nextPaymentDate.getDate()
            );

            let displayDate: Date;
            let daysUntilDue: number;
            let isDueToday: boolean;
            let isOverdue: boolean;

            if (
              contract.status === ContractStatus.COMPLETED ||
              contract.status === ContractStatus.TAMAMLANMIS
            ) {
              displayDate = contract.last_payment_date
                ? new Date(contract.last_payment_date)
                : paymentDate;
              isOverdue = false;
              isDueToday = false;
              daysUntilDue = 0;
            } else {
              const paymentDateStr = paymentDate.toDateString();
              const todayDateStr = todayDate.toDateString();

              if (paymentDateStr === todayDateStr) {
                isOverdue = false;
                isDueToday = true;
                daysUntilDue = 0;
                displayDate = new Date(paymentDate);
              } else if (paymentDate < todayDate) {
                isOverdue = true;
                isDueToday = false;
                daysUntilDue = differenceInDays(todayDate, paymentDate);
                displayDate = new Date(paymentDate);
              } else {
                isOverdue = false;
                isDueToday = false;
                daysUntilDue = differenceInDays(paymentDate, todayDate);
                displayDate = new Date(paymentDate);
              }
            }

            return (
              <div
                key={contract.id}
                className="bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow"
              >
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg font-semibold text-gray-900 mb-1">
                        {company?.name || t("common.unknownCompany")}
                      </h3>
                      <div className="flex items-center space-x-2">
                        {getStatusBadge(contract)}
                      </div>
                    </div>
                    <div className="flex-shrink-0 flex items-center space-x-2">
                      <button
                        onClick={() => navigate(`/contracts/${contract.id}`)}
                        className="p-2 text-gray-400 hover:text-blue-600 rounded-lg hover:bg-gray-50"
                        title={t("common.viewDetails")}
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      {canEdit("contracts") && (
                        <button
                          onClick={() =>
                            navigate(`/contracts/${contract.id}/edit`)
                          }
                          className="p-2 text-gray-400 hover:text-blue-600 rounded-lg hover:bg-gray-50"
                          title={t("common.edit")}
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center text-sm text-gray-600">
                      <User className="w-4 h-4 mr-2 text-gray-400" />
                      {customer
                        ? customer.customer_type === "company" &&
                          customer.company_name
                          ? customer.company_name
                          : `${customer.first_name || ""} ${
                              customer.last_name || ""
                            }`.trim() || t("common.unknownCustomer")
                        : t("common.unknownCustomer")}
                    </div>
                    <div className="flex items-center text-sm text-gray-600">
                      <Car className="w-4 h-4 mr-2 text-gray-400" />
                      {contract.vehicle?.make} {contract.vehicle?.model}
                      <span className="ml-2 text-gray-400">
                        {contract.vehicle?.license_plate}
                      </span>
                    </div>
                    <div className="flex items-center text-sm text-gray-600">
                      <DollarSign className="w-4 h-4 mr-2 text-gray-400" />
                      ₼{roundPaymentAmount(getDisplayMonthlyPayment(contract))}
                    </div>
                    <div className="flex items-center text-sm text-gray-600">
                      <Calendar className="w-4 h-4 mr-2 text-gray-400" />
                      {t("contracts.nextPaymentDate")}: {formatDate(displayDate)}
                    </div>
                  </div>

                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">{t("contracts.endDate")}:</span>
                      <span className="font-semibold text-gray-900">
                        {formatDate(endDate)}
                      </span>
                    </div>
                    <div
                      className={`mt-2 text-sm ${
                        isOverdue
                          ? "text-red-600 font-medium"
                          : isDueToday
                          ? "text-yellow-600 font-medium"
                          : "text-gray-500"
                      }`}
                    >
                      {isOverdue
                        ? `${daysUntilDue} ${t("common.overdueDays")}`
                        : isDueToday
                        ? t("common.dueToday")
                        : `${daysUntilDue} ${t("common.daysLeft")}`}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Contract Table */
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="mobile-table overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t("contracts.contractNumber")}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t("contracts.customer")}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t("contracts.vehicle")}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t("contracts.monthlyPayment")}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t("contracts.endDate")}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t("contracts.nextPaymentDate")}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t("common.status")}
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
              {filteredContracts.map((contract) => {
                const customer = customers.find(
                  (c) => c.id === contract.customer_id
                );
                const company = companies.find(
                  (c) => c.id === contract.company_id
                );

                // Calculate end date using the utility function
                const paymentBeginDate = new Date(contract.start_date);
                const endDate = calculateContractEndDate(
                  paymentBeginDate,
                  contract.term_months + 1
                );

                // Calculate next payment date using the utility function
                const nextPaymentDate = calculateCorrectNextDueDate(
                  contract,
                  true
                ); // Use contract start date

                // Calculate if payment is due today by comparing dates without time
                const todayDate = new Date(
                  today.getFullYear(),
                  today.getMonth(),
                  today.getDate()
                );
                const paymentDate = new Date(
                  nextPaymentDate.getFullYear(),
                  nextPaymentDate.getMonth(),
                  nextPaymentDate.getDate()
                );

                // DEBUG: Log problematic contracts (only for debugging, can be removed in production)
                // if (contract.status === ContractStatus.ACTIVE) {
                //   const daysDiff = differenceInDays(paymentDate, todayDate);
                //   if (daysDiff === 0 || Math.abs(daysDiff) > 365) {
                //     console.log('DEBUG: Contract with unusual days calculation', {
                //       contractId: contract.id,
                //       status: contract.status,
                //       paymentsCount: contract.payments_count,
                //       paymentStartDate: contract.payment_start_date,
                //       nextPaymentDate: nextPaymentDate.toISOString(),
                //       todayDate: todayDate.toISOString(),
                //       paymentDate: paymentDate.toISOString(),
                //       daysDiff,
                //       customerName: customer ? `${customer.first_name} ${customer.last_name}` : 'Unknown'
                //     });
                //   }
                // }

                // CRITICAL FIX: Handle completed contracts first
                let displayDate: Date;
                let daysUntilDue: number;
                let isDueToday: boolean;
                let isOverdue: boolean;

                if (
                  contract.status === ContractStatus.COMPLETED ||
                  contract.status === ContractStatus.TAMAMLANMIS
                ) {
                  // For completed contracts, show the last payment date or end date
                  displayDate = contract.last_payment_date
                    ? new Date(contract.last_payment_date)
                    : paymentDate;
                  isOverdue = false;
                  isDueToday = false;
                  daysUntilDue = 0;
                } else {
                  // For active contracts, calculate proper due date logic
                  // CRITICAL FIX: Check if payment is due today first
                  const paymentDateStr = paymentDate.toDateString();
                  const todayDateStr = todayDate.toDateString();

                  if (paymentDateStr === todayDateStr) {
                    // Payment is due today - not overdue
                    isOverdue = false;
                    isDueToday = true;
                    daysUntilDue = 0;
                    displayDate = new Date(paymentDate);
                  } else if (paymentDate < todayDate) {
                    // Payment is overdue
                    isOverdue = true;
                    isDueToday = false;
                    daysUntilDue = differenceInDays(todayDate, paymentDate);
                    displayDate = new Date(paymentDate);
                  } else {
                    // Payment is in the future
                    isOverdue = false;
                    isDueToday = false;
                    daysUntilDue = differenceInDays(paymentDate, todayDate);
                    displayDate = new Date(paymentDate);
                  }
                }

                return (
                  <tr key={contract.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {company?.name || t("common.unknownCompany")}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                          <User className="w-4 h-4 text-blue-600" />
                        </div>
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {customer
                              ? customer.customer_type === "company" &&
                                customer.company_name
                                ? customer.company_name
                                : `${customer.first_name || ""} ${
                                    customer.last_name || ""
                                  }`.trim() || t("common.unknownCustomer")
                              : t("common.unknownCustomer")}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center mr-3">
                          <Car className="w-4 h-4 text-gray-600" />
                        </div>
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {contract.vehicle?.make} {contract.vehicle?.model}
                          </div>
                          <div className="text-sm text-gray-500">
                            {contract.vehicle?.license_plate}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        ₼
                        {roundPaymentAmount(getDisplayMonthlyPayment(contract))}
                      </div>
                      <div className="text-sm text-gray-500">
                        {t("contracts.monthlyPayment")}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {formatDate(endDate)}
                      </div>
                      <div className="text-sm text-gray-500">
                        {t("contracts.endDate")}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {formatDate(displayDate)}
                      </div>
                      <div
                        className={`text-sm ${
                          isOverdue
                            ? "text-red-600 font-medium"
                            : isDueToday
                            ? "text-yellow-600 font-medium"
                            : "text-gray-500"
                        }`}
                      >
                        {isOverdue
                          ? `${daysUntilDue} ${t("common.overdueDays")}`
                          : isDueToday
                          ? t("common.dueToday") // Show "due today" if is due today
                          : `${daysUntilDue} ${t("common.daysLeft")}`}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(contract)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {contract.whoCreated || t("common.unknown")}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => navigate(`/contracts/${contract.id}`)}
                          className="text-blue-600 hover:text-blue-900"
                          title={t("common.viewDetails")}
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        {canEdit("contracts") && (
                          <button
                            onClick={() =>
                              navigate(`/contracts/${contract.id}/edit`)
                            }
                            className="text-gray-600 hover:text-gray-900"
                            title={t("common.edit")}
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                        )}
                        {canDelete("contracts") && (
                          <button
                            onClick={() =>
                              handleDeleteClick(
                                contract.id,
                                `${contract.vehicle?.make} ${
                                  contract.vehicle?.model
                                } - ${
                                  customer
                                    ? customer.customer_type === "company" &&
                                      customer.company_name
                                      ? customer.company_name
                                      : `${customer.first_name || ""} ${
                                          customer.last_name || ""
                                        }`.trim() || t("common.unknownCustomer")
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

        {filteredContracts.length === 0 && (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Calendar className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {t("contracts.noContracts")}
            </h3>
            <p className="text-gray-500 mb-6">
              {t("pages.contracts.noContracts")}
            </p>
            {canCreate("contracts") && (
              <button
                onClick={() => navigate("/contracts/create")}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
              >
                <Plus className="w-4 h-4 mr-2" />
                {t("pages.contracts.newContract")}
              </button>
            )}
          </div>
        )}
      </div>
      )}

      {filteredContracts.length === 0 && viewMode === "card" && (
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Calendar className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {t("contracts.noContracts")}
          </h3>
          <p className="text-gray-500 mb-6">
            {t("pages.contracts.noContracts")}
          </p>
          {canCreate("contracts") && (
            <button
              onClick={() => navigate("/contracts/create")}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
            >
              <Plus className="w-4 h-4 mr-2" />
              {t("pages.contracts.newContract")}
            </button>
          )}
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <DeleteConfirmationDialog
        isOpen={deleteDialog.isOpen}
        onClose={handleDeleteCancel}
        onConfirm={handleDeleteConfirm}
        title={t("pages.contracts.deleteContract")}
        message={t("pages.contracts.deleteConfirmation")}
        itemName={deleteDialog.contractInfo}
        isLoading={deleteDialog.isLoading}
      />
    </div>
  );
};

export default Contracts;

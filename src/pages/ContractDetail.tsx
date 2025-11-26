import React, { useState, useEffect, useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "../i18n";
import { useData } from "../contexts/DataContext";
import { useAuth } from "../contexts/AuthContext";
import { deleteContract } from "../services/contracts";
import { useNotifications } from "../hooks/useNotifications";
import { ContractStatus, Contract, Payment } from "../types";

// Extended contract interface that includes payments from API
interface ContractWithPayments extends Contract {
  payments?: Payment[];
  whoCreated?: string;
}
import { formatDisplayDate } from "../utils/dateUtils";
import { getPaymentMethodLabel } from "../utils/paymentUtils";
import { calculateCorrectNextDueDate } from "../utils/contractUtils";
import { getDisplayMonthlyPayment } from "../utils/paymentCalculationUtils";
import { roundPaymentAmount, roundInterestAmount, roundPrincipalAmount } from "../utils/customRoundingUtils";
import AuthorizationDialog from "../components/AuthorizationDialog";
import CloseContractModal from "../components/CloseContractModal";
import ContractOutput from "../components/ContractOutput";
import TehvilTeslimOutput from "../components/TehvilTeslimOutput";
import XitamOutput from "../components/XitamOutput";
import IltizamOutput from "../components/IltizamOutput";
import AlqiSatqiOutput from "../components/AlqiSatqiOutput";
import ErizeOutput from "../components/ErizeOutput";
import { Edit, FileText, Trash2 } from "lucide-react";

const ContractDetail: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { t } = useTranslation();
  const {
    contracts,
    customers,
    companies,
    payments,
    loadContracts,
    loadCustomers,
    loadCompanies,
    loadPayments,
    getContractMonthProgress,
    contractsLoading,
    customersLoading,
    companiesLoading,
  } = useData();
  const { canEdit, canDelete } = useAuth();
  const { successMessages, errorMessages } = useNotifications();
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showAuthorizationDialog, setShowAuthorizationDialog] = useState(false);
  const [showCloseContractModal, setShowCloseContractModal] = useState(false);
  const [isClosingContract, setIsClosingContract] = useState(false);
  const [monthProgress, setMonthProgress] = useState<any>(null);
  
  // Use monthProgress to prevent linter warning
  if (monthProgress) {
    console.log("Month progress available:", monthProgress);
  }

  // Load data only once on mount
  useEffect(() => {
    const loadData = async () => {
      const promises = [];
      
      // Only load if data is missing and not currently loading
      if (contracts.length === 0 && !contractsLoading) {
        promises.push(loadContracts());
      }
      if (customers.length === 0 && !customersLoading) {
        promises.push(loadCustomers());
      }
      if (companies.length === 0 && !companiesLoading) {
        promises.push(loadCompanies());
      }
      
      if (promises.length > 0) {
        try {
          await Promise.all(promises);
        } catch (error) {
          console.error("Error loading data:", error);
        }
      }
    };

    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Run only once on mount

  // Load payments when contract ID is available - only once
  useEffect(() => {
    const loadContractPayments = async () => {
      if (id) {
        try {
          await loadPayments({ contract_id: id });
        } catch (error) {
          console.error("Error loading payments:", error);
        }
      }
    };

    loadContractPayments();
  }, [id, loadPayments])

  // Find contract and related data from context
  const contract = useMemo((): ContractWithPayments | null => {
    const foundContract = contracts.find((c) => c.id === id) || null;
    if (foundContract) {
      console.log("🔍 ContractDetail - Contract data:", {
        id: foundContract.id,
        monthly_payment: foundContract.monthly_payment,
        original_monthly_payment: foundContract.original_monthly_payment,
        adjusted_monthly_payment: foundContract.adjusted_monthly_payment,
        total_extra_payments: foundContract.total_extra_payments,
        total_principal_paid: foundContract.total_principal_paid,
        remaining_balance: foundContract.remaining_balance,
        hasAdjustedPayment: !!foundContract.adjusted_monthly_payment,
        adjustedValue: foundContract.adjusted_monthly_payment,
        payments: (foundContract as any).payments?.length || 0,
        displayMonthlyPayment: getDisplayMonthlyPayment(foundContract)
      });
    }
    return foundContract as ContractWithPayments;
  }, [contracts, id]);

  const customer = useMemo(() => {
    if (!contract?.customer_id) return null;
    return customers.find((c) => c.id === contract.customer_id) || null;
  }, [customers, contract]);

  const company = useMemo(() => {
    if (!contract?.company_id) return null;
    return companies.find((c) => c.id === contract.company_id) || null;
  }, [companies, contract]);

  const contractPayments = useMemo(() => {
    if (!contract?.id) return [];

    // Use payments from contract data if available, otherwise fall back to context payments
    const contractPaymentsFromAPI = contract.payments || [];
    const contextPayments = payments.filter(
      (p) => p.contract_id === contract.id
    );

    // Prefer API payments as they are more complete and up-to-date
    const finalPayments =
      contractPaymentsFromAPI.length > 0
        ? contractPaymentsFromAPI
        : contextPayments;

    console.log(`🔍 ContractDetail - Contract ${contract.id} payments:`, {
      totalContextPayments: payments.length,
      contractPaymentsFromAPI: contractPaymentsFromAPI.length,
      contextPayments: contextPayments.length,
      finalPayments: finalPayments.length,
      payments: finalPayments.map((p: Payment) => ({
        id: p.id,
        amount: p.amount,
        payment_date: p.payment_date,
        company_id: p.company_id,
      })),
    });
    return finalPayments;
  }, [payments, contract]);

  // Fetch month progress data when contract is available - only once
  useEffect(() => {
    const fetchMonthProgress = async () => {
      if (contract?.id && getContractMonthProgress) {
        try {
          const progress = await getContractMonthProgress(contract.id);
          console.log("Month progress data:", progress);
          setMonthProgress(progress);
        } catch (error) {
          console.error("Error fetching month progress:", error);
        }
      }
    };

    fetchMonthProgress();
  }, [contract?.id, getContractMonthProgress]);

  const handleDelete = async () => {
    if (!contract) return;

    try {
      await deleteContract(contract.id);
      successMessages.deleted(t("common.contract"));
      navigate("/contracts");
    } catch (error) {
      errorMessages.show(t("pages.contractDetail.deleteFailed"));
    }
  };

  const handleCloseContract = async (
    closeReason:
      | "completed_early"
      | "defaulted_closed"
      | "imtina_edilmis"
      | "alqi_satqi"
      | "tamamlanmis",
    closeDate: Date,
    notes: string
  ) => {
    if (!contract) return;

    try {
      setIsClosingContract(true);

      // Import the contract service to use the closeContract function
      const { contractService } = await import(
        "../services/localStorageService"
      );

      await contractService.closeContract(
        contract.id,
        closeReason,
        closeDate,
        notes
      );

      // Reload contracts to get updated data
      await loadContracts();

      successMessages.show(
        closeReason === "completed_early"
          ? t("contracts.closeContract.completedEarlySuccess")
          : t("contracts.closeContract.defaultedClosedSuccess")
      );

      setShowCloseContractModal(false);
    } catch (error) {
      console.error("Failed to close contract:", error);
      errorMessages.show(t("contracts.closeContract.closeFailed"));
    } finally {
      setIsClosingContract(false);
    }
  };

  // Show loading only if data is being loaded and we don't have the contract yet
  const isLoading = (contractsLoading || customersLoading || companiesLoading) && !contract;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="relative">
            <div className="animate-spin rounded-full h-20 w-20 border-4 border-blue-600 border-t-transparent mx-auto"></div>
            <div className="absolute inset-0 rounded-full border-4 border-blue-200 opacity-30"></div>
          </div>
          <p className="mt-6 text-xl text-gray-700 font-medium">
            {t("pages.contractDetail.loadingTitle")}
          </p>
          <p className="mt-2 text-gray-500">
            {t("pages.contractDetail.loadingSubtitle")}
          </p>
        </div>
      </div>
    );
  }

  if (!contract) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto">
          <div className="bg-white rounded-xl shadow-lg p-8 border border-gray-200">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg
                className="w-8 h-8 text-red-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
                />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              {t("pages.contractDetail.notFoundTitle")}
            </h3>
            <p className="text-gray-600 mb-6">
              {t("pages.contractDetail.notFoundSubtitle")}
            </p>
            <button
              onClick={() => navigate("/contracts")}
              className="w-full px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors duration-200"
            >
              {t("pages.contractDetail.backToContracts")}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Use contract's stored total_paid if available and payments match, otherwise calculate from payments
  const calculatedTotalPaid = contractPayments.reduce(
    (sum: number, payment: Payment) => sum + payment.amount,
    0
  );

  // Prefer contract's stored total_paid if it's available and reasonable
  const totalPaid = roundPaymentAmount(
    contract.total_paid && contract.total_paid > 0
      ? contract.total_paid
      : calculatedTotalPaid
  );

  // Always calculate remaining balance from total_payable minus total paid
  // This ensures accuracy regardless of stored remaining_balance value
  const remainingBalance = roundPaymentAmount(Math.max(0, contract.total_payable - totalPaid));
  const paymentProgress = (totalPaid / contract.total_payable) * 100;

  // Calculate total interest
  const originalLoanAmount = Math.abs(contract.down_payment || 0);
  let remainingBalanceForInterest = originalLoanAmount;
  const monthlyRate = contract.yearly_interest_rate / 12 / 100;
  const totalPayments = contract.term_months || 36;
  let totalInterest = 0;

  for (let i = 1; i <= totalPayments; i++) {
    const interestAmount = remainingBalanceForInterest * monthlyRate;
    const principalAmount =
      Math.abs(contract.monthly_payment || 0) - interestAmount;
    totalInterest += interestAmount;
    remainingBalanceForInterest -= principalAmount;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8">
      <div className="w-full px-4 sm:px-6 lg:px-8">
        {/* Header Section */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                {t("pages.contractDetail.title")}
              </h1>
              <p className="text-lg text-gray-600">
                {t("pages.contractDetail.subtitle")}
              </p>
            </div>
            {/* Action Buttons */}
            <div className="flex flex-wrap gap-3 mt-6">
              {canEdit("contracts") && (
                <button
                  onClick={() => navigate(`/contracts/${id}/edit`)}
                  className="inline-flex items-center px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors duration-200 shadow-lg"
                >
                  <Edit className="w-4 h-4 mr-2" />
                  {t("pages.contractDetail.editContract")}
                </button>
              )}

              <button
                onClick={() => setShowAuthorizationDialog(true)}
                className="inline-flex items-center px-4 py-2 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 transition-colors duration-200 shadow-lg"
              >
                <FileText className="w-4 h-4 mr-2" />
                {t("common.createAuthorization")}
              </button>


              {canDelete("contracts") && (
                <button
                  onClick={() => setShowDeleteModal(true)}
                  className="inline-flex items-center px-4 py-2 bg-red-600 text-white font-medium rounded-lg hover:bg-red-700 transition-colors duration-200 shadow-lg"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  {t("pages.contractDetail.delete")}
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
          {/* Main Content - Contract Information */}
          <div className="xl:col-span-2 space-y-8">
            {/* Financial Overview Card */}
            <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
              <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-4">
                <h2 className="text-xl font-semibold text-white">
                  {t("pages.contractDetail.financialOverview")}
                </h2>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">
                      ₼{roundPaymentAmount(contract.down_payment || 0)}
                    </div>
                    <div className="text-sm text-gray-600 mt-1">
                      {t("common.downPayment")}
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">
                      ₼{roundPaymentAmount(contract.total_payable || 0)}
                    </div>
                    <div className="text-sm text-gray-600 mt-1">
                      {t("pages.contractDetail.totalPayable")}
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-600">
                      ₼{roundPaymentAmount(getDisplayMonthlyPayment(contract))}
                    </div>
                    <div className="text-sm text-gray-600 mt-1">
                      {contract.adjusted_monthly_payment &&
                      contract.adjusted_monthly_payment !==
                        contract.monthly_payment
                        ? t("pages.contractDetail.newMonthlyPayment")
                        : t("pages.contractDetail.monthlyPayment")}
                    </div>
                    {contract.adjusted_monthly_payment &&
                      contract.adjusted_monthly_payment !==
                        contract.monthly_payment && (
                        <div className="text-xs text-green-600 font-medium mt-1">
                          {t("common.adjustedAfterExtraPayment")}
                        </div>
                      )}
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-orange-600">
                      ₼{roundInterestAmount(totalInterest)}
                    </div>
                    <div className="text-sm text-gray-600 mt-1">
                      {t("common.totalInterest")}
                    </div>
                  </div>
                </div>

                {/* Payment Progress */}
                <div className="mt-8">
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-sm font-medium text-gray-700">
                      {t("pages.contractDetail.paymentProgress")}
                    </span>
                    <span className="text-sm font-semibold text-gray-900">
                      {(paymentProgress || 0).toFixed(1)}%{" "}
                      {t("pages.contractDetail.complete")}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3 relative">
                    <div
                      className="bg-gradient-to-r from-green-500 to-blue-500 h-3 rounded-full transition-all duration-500 relative"
                      style={{
                        width: `${Math.min(paymentProgress || 0, 100)}%`,
                      }}
                    >
                      <div className="absolute right-0 top-0 w-3 h-3 bg-white rounded-full shadow-sm transform translate-x-1/2 -translate-y-1/2"></div>
                    </div>
                  </div>
                  <div className="flex justify-between mt-3 text-sm">
                    <div className="text-center">
                      <div className="font-semibold text-green-600">
                        ₼{roundPaymentAmount(totalPaid || 0)}
                      </div>
                      <div className="text-gray-500">
                        {t("pages.contractDetail.paid")}
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="font-semibold text-red-600">
                        ₼{roundPaymentAmount(remainingBalance || 0)}
                      </div>
                      <div className="text-gray-500">
                        {t("pages.contractDetail.remaining")}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Contract Details Card */}
            <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
              <div className="bg-gradient-to-r from-gray-600 to-gray-700 px-6 py-4">
                <h2 className="text-xl font-semibold text-white">
                  {t("pages.contractDetail.contractDetails")}
                </h2>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                      <svg
                        className="w-5 h-5 mr-2 text-blue-600"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                        />
                      </svg>
                      {t("pages.contractDetail.termsConditions")}
                    </h3>
                    <dl className="space-y-4">
                      <div className="flex justify-between items-center py-2 border-b border-gray-100">
                        <dt className="text-sm font-medium text-gray-600">
                          {t("pages.contractDetail.contractTerm")}
                        </dt>
                        <dd className="text-sm font-semibold text-gray-900">
                          {contract.term_months || 0}{" "}
                          {t("pages.contractDetail.months")}
                        </dd>
                      </div>
                      <div className="flex justify-between items-center py-2 border-b border-gray-100">
                        <dt className="text-sm font-medium text-gray-600">
                          {t("common.yearlyInterestRate")}
                        </dt>
                        <dd className="text-sm font-semibold text-gray-900">
                          {(contract.yearly_interest_rate || 0).toFixed(2)}%
                        </dd>
                      </div>
                      <div className="flex justify-between items-center py-2 border-b border-gray-100">
                        <dt className="text-sm font-medium text-gray-600">
                          {t("pages.contractDetail.startDate")}
                        </dt>
                        <dd className="text-sm font-semibold text-gray-900">
                          {formatDisplayDate(contract.start_date)}
                        </dd>
                      </div>
                      <div className="flex justify-between items-center py-2 border-b border-gray-100">
                        <dt className="text-sm font-medium text-gray-600">
                          {t("pages.contractDetail.nextPaymentDue")}
                        </dt>
                        <dd className="text-sm font-semibold text-gray-900">
                          {formatDisplayDate(
                            calculateCorrectNextDueDate(contract, true) // Use contract start date
                          )}
                        </dd>
                      </div>
                      <div className="flex justify-between items-center py-2 border-b border-gray-100">
                        <dt className="text-sm font-medium text-gray-600">
                          {t("common.paymentInterval")}
                        </dt>
                        <dd className="text-sm font-semibold text-gray-900">
                          {t("common.monthly")}
                        </dd>
                      </div>
                      <div className="flex justify-between items-center py-2 border-b border-gray-100">
                        <dt className="text-sm font-medium text-gray-600">
                          {t("common.status")}
                        </dt>
                        <dd>
                          <span
                            className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${
                              contract.status === ContractStatus.ACTIVE
                                ? "bg-green-100 text-green-800"
                                : contract.status === ContractStatus.COMPLETED
                                ? "bg-blue-100 text-blue-800"
                                : contract.status === ContractStatus.OPEN
                                ? "bg-yellow-100 text-yellow-800"
                                : contract.status === ContractStatus.TAMAMLANMIS
                                ? "bg-green-100 text-green-800"
                                : contract.status === ContractStatus.ALQI_SATQI
                                ? "bg-orange-100 text-orange-800"
                                : contract.status ===
                                  ContractStatus.IMTINA_EDILMIS
                                ? "bg-red-100 text-red-800"
                                : contract.status ===
                                  ContractStatus.DEFAULTED_CLOSED
                                ? "bg-red-100 text-red-800"
                                : "bg-gray-100 text-gray-800"
                            }`}
                          >
                            {t(`common.${contract.status}`)}
                          </span>
                        </dd>
                      </div>
                      <div className="flex justify-between items-center py-2">
                        <dt className="text-sm font-medium text-gray-600">
                          {t("common.createdBy")}
                        </dt>
                        <dd className="text-sm font-semibold text-gray-900">
                          {contract.whoCreated || t("common.unknown")}
                        </dd>
                      </div>
                    </dl>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                      <svg
                        className="w-5 h-5 mr-2 text-green-600"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"
                        />
                      </svg>
                      {t("pages.contractDetail.paymentSummary")}
                    </h3>
                    <dl className="space-y-4">
                      <div className="flex justify-between items-center py-2 border-b border-gray-100">
                        <dt className="text-sm font-medium text-gray-600">
                          {t("pages.contractDetail.totalPaid")}
                        </dt>
                        <dd className="text-lg font-bold text-green-600">
                          ₼{roundPaymentAmount(totalPaid)}
                        </dd>
                      </div>
                      <div className="flex justify-between items-center py-2 border-b border-gray-100">
                        <dt className="text-sm font-medium text-gray-600">
                          {t("pages.contractDetail.remainingBalance")}
                        </dt>
                        <dd className="text-lg font-bold text-red-600">
                          ₼{roundPaymentAmount(remainingBalance)}
                        </dd>
                      </div>
                      <div className="flex justify-between items-center py-2 border-b border-gray-100">
                        <dt className="text-sm font-medium text-gray-600">
                          {t("pages.contractDetail.paymentsMade")}
                        </dt>
                        <dd className="text-sm font-semibold text-gray-900">
                          {contract.payments_count || contractPayments.length}
                        </dd>
                      </div>
                      <div className="flex justify-between items-center py-2">
                        <dt className="text-sm font-medium text-gray-600">
                          {t("pages.contractDetail.completion")}
                        </dt>
                        <dd className="text-sm font-semibold text-gray-900">
                          {paymentProgress.toFixed(1)}%
                        </dd>
                      </div>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            {/* Vehicle Information Card */}
            <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
              <div className="bg-gradient-to-r from-purple-600 to-pink-600 px-6 py-4">
                <h2 className="text-xl font-semibold text-white flex items-center">
                  <svg
                    className="w-6 h-6 mr-2"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4"
                    />
                  </svg>
                  {t("pages.contractDetail.vehicleInformation")}
                </h2>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg p-4 border border-blue-100">
                    <div className="text-sm font-medium text-blue-600 mb-1 flex items-center">
                      <svg
                        className="w-4 h-4 mr-1"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                        />
                      </svg>
                      {t("pages.contractDetail.licensePlate")}
                    </div>
                    <div className="text-xl font-bold text-gray-900 bg-white px-3 py-2 rounded border shadow-sm">
                      {contract.vehicle?.license_plate || t("common.unknown")}
                    </div>
                  </div>
                  <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg p-4 border border-green-100">
                    <div className="text-sm font-medium text-green-600 mb-1 flex items-center">
                      <svg
                        className="w-4 h-4 mr-1"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                        />
                      </svg>
                      {t("pages.contractDetail.makeModel")}
                    </div>
                    <div className="text-lg font-semibold text-gray-900">
                      {contract.vehicle?.make || t("common.unknown")}{" "}
                      {contract.vehicle?.model || t("common.unknown")}
                    </div>
                  </div>
                  <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-lg p-4 border border-purple-100">
                    <div className="text-sm font-medium text-purple-600 mb-1 flex items-center">
                      <svg
                        className="w-4 h-4 mr-1"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                        />
                      </svg>
                      {t("pages.contractDetail.year")}
                    </div>
                    <div className="text-lg font-semibold text-gray-900">
                      {contract.vehicle?.year || t("common.unknown")}
                    </div>
                  </div>
                  <div className="bg-gradient-to-br from-orange-50 to-red-50 rounded-lg p-4 border border-orange-100">
                    <div className="text-sm font-medium text-orange-600 mb-1 flex items-center">
                      <svg
                        className="w-4 h-4 mr-1"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zM21 5a2 2 0 00-2-2h-4a2 2 0 00-2 2v12a4 4 0 004 4h4a2 2 0 002-2V5z"
                        />
                      </svg>
                      {t("pages.contractDetail.color")}
                    </div>
                    <div className="text-lg font-semibold text-gray-900">
                      {contract.vehicle?.color || t("common.unknown")}
                    </div>
                  </div>

                  {contract.vehicle?.body_number && (
                    <div className="bg-gradient-to-br from-indigo-50 to-blue-50 rounded-lg p-4 border border-indigo-100">
                      <div className="text-sm font-medium text-indigo-600 mb-1 flex items-center">
                        <svg
                          className="w-4 h-4 mr-1"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                          />
                        </svg>
                        {t("common.bodyNumber")}
                      </div>
                      <div className="text-lg font-semibold text-gray-900">
                        {contract.vehicle?.body_number || "N/A"}
                      </div>
                    </div>
                  )}

                  {contract.vehicle?.registration_certificate_number && (
                    <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg p-4 border border-green-100">
                      <div className="text-sm font-medium text-green-600 mb-1 flex items-center">
                        <svg
                          className="w-4 h-4 mr-1"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                          />
                        </svg>
                        {t("common.registrationCertificateNumber")}
                      </div>
                      <div className="text-lg font-semibold text-gray-900">
                        {contract.vehicle?.registration_certificate_number ||
                          "N/A"}
                      </div>
                    </div>
                  )}
                  {contract.vehicle?.engine && (
                    <div className="bg-gradient-to-br from-yellow-50 to-amber-50 rounded-lg p-4 border border-yellow-100">
                      <div className="text-sm font-medium text-yellow-600 mb-1 flex items-center">
                        <svg
                          className="w-4 h-4 mr-1"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M13 10V3L4 14h7v7l9-11h-7z"
                          />
                        </svg>
                        {t("common.engine")}
                      </div>
                      <div className="text-lg font-semibold text-gray-900">
                        {contract.vehicle?.engine || "N/A"}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Driver Information Card */}
            {contract.permission_document &&
              contract.permission_document.drivers &&
              contract.permission_document.drivers.length > 0 && (
                <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
                  <div className="bg-gradient-to-r from-green-600 to-emerald-600 px-6 py-4">
                    <h2 className="text-xl font-semibold text-white flex items-center">
                      <svg
                        className="w-6 h-6 mr-2"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z"
                        />
                      </svg>
                      {t("common.drivers")} (
                      {contract.permission_document.drivers.length})
                    </h2>
                  </div>
                  <div className="p-6">
                    <div className="space-y-4">
                      {contract.permission_document.drivers.map(
                        (driver, index) => (
                          <div
                            key={driver.id || index}
                            className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg p-4 border border-green-100"
                          >
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center space-x-3 mb-3">
                                  <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                                    <svg
                                      className="w-5 h-5 text-green-600"
                                      fill="none"
                                      stroke="currentColor"
                                      viewBox="0 0 24 24"
                                    >
                                      <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                                      />
                                    </svg>
                                  </div>
                                  <div>
                                    <h3 className="text-lg font-semibold text-gray-900">
                                      {driver.name}
                                    </h3>
                                    <p className="text-sm text-gray-600">
                                      {t("common.licenseNumber")}:{" "}
                                      {driver.licenseNumber}
                                    </p>
                                  </div>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                  {driver.license_category && (
                                    <div>
                                      <span className="text-sm font-medium text-gray-500">
                                        {t("common.licenseCategory")}:
                                      </span>
                                      <p className="text-sm text-gray-900">
                                        {driver.license_category}
                                      </p>
                                    </div>
                                  )}
                                  {driver.license_given_date && (
                                    <div>
                                      <span className="text-sm font-medium text-gray-500">
                                        {t("common.licenseGivenDate")}:
                                      </span>
                                      <p className="text-sm text-gray-900">
                                        {formatDisplayDate(
                                          driver.license_given_date
                                        )}
                                      </p>
                                    </div>
                                  )}
                                  {driver.phone && (
                                    <div>
                                      <span className="text-sm font-medium text-gray-500">
                                        {t("common.phone")}:
                                      </span>
                                      <p className="text-sm text-gray-900">
                                        {driver.phone}
                                      </p>
                                    </div>
                                  )}
                                  {driver.address && (
                                    <div>
                                      <span className="text-sm font-medium text-gray-500">
                                        {t("common.address")}:
                                      </span>
                                      <p className="text-sm text-gray-900">
                                        {driver.address}
                                      </p>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        )
                      )}
                    </div>
                  </div>
                </div>
              )}

            {/* Quick Actions Card */}
            <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
              <div className="bg-gradient-to-r from-teal-600 to-cyan-600 px-6 py-4">
                <h2 className="text-xl font-semibold text-white flex items-center">
                  <svg
                    className="w-6 h-6 mr-2"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13 10V3L4 14h7v7l9-11h-7z"
                    />
                  </svg>
                  {t("pages.contractDetail.quickActions")}
                </h2>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <button
                    onClick={() =>
                      navigate(`/payments/create?contractId=${contract.id}`)
                    }
                    className="flex items-center justify-center p-4 bg-green-50 border border-green-200 rounded-lg hover:bg-green-100 transition-colors duration-200 group"
                  >
                    <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center mr-3 group-hover:bg-green-200">
                      <svg
                        className="w-5 h-5 text-green-600"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                        />
                      </svg>
                    </div>
                    <div className="text-left">
                      <div className="font-semibold text-gray-900">
                        {t("pages.contractDetail.recordPayment")}
                      </div>
                    </div>
                  </button>

                  {canEdit("contracts") && (
                    <button
                      onClick={() => navigate(`/contracts/${contract.id}/edit`)}
                      className="flex items-center justify-center p-4 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors duration-200 group"
                    >
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center mr-3 group-hover:bg-blue-200">
                        <svg
                          className="w-5 h-5 text-blue-600"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                          />
                        </svg>
                      </div>
                      <div className="text-left">
                        <div className="font-semibold text-gray-900">
                          {t("pages.contractDetail.editContractDetails")}
                        </div>
                      </div>
                    </button>
                  )}

                  <button
                    onClick={() => navigate(`/customers/${customer?.id}`)}
                    className="flex items-center justify-center p-4 bg-purple-50 border border-purple-200 rounded-lg hover:bg-purple-100 transition-colors duration-200 group"
                  >
                    <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center mr-3 group-hover:bg-purple-200">
                      <svg
                        className="w-5 h-5 text-purple-600"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                        />
                      </svg>
                    </div>
                    <div className="text-left">
                      <div className="font-semibold text-gray-900">
                        {t("pages.contractDetail.viewCustomer")}
                      </div>
                    </div>
                  </button>

                  <button
                    onClick={() =>
                      navigate(`/payments?contractId=${contract.id}`)
                    }
                    className="flex items-center justify-center p-4 bg-orange-50 border border-orange-200 rounded-lg hover:bg-orange-100 transition-colors duration-200 group"
                  >
                    <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center mr-3 group-hover:bg-orange-200">
                      <svg
                        className="w-5 h-5 text-orange-600"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                        />
                      </svg>
                    </div>
                    <div className="text-left">
                      <div className="font-semibold text-gray-900">
                        {t("pages.contractDetail.allPayments")}
                      </div>
                    </div>
                  </button>

                  <button
                    onClick={() => navigate(`/contracts/${contract.id}/schedule`)}
                    className="flex items-center justify-center p-4 bg-indigo-50 border border-indigo-200 rounded-lg hover:bg-indigo-100 transition-colors duration-200 group"
                  >
                    <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center mr-3 group-hover:bg-indigo-200">
                      <svg
                        className="w-5 h-5 text-indigo-600"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                        />
                      </svg>
                    </div>
                    <div className="text-left">
                      <div className="font-semibold text-gray-900">
                        {t("common.paymentSchedule")}
                      </div>
                    </div>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar - Related Information */}
          <div className="space-y-6">
            {/* Customer Information */}
            {customer && (
              <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
                <div className="bg-gradient-to-r from-green-600 to-emerald-600 px-6 py-4">
                  <h3 className="text-lg font-semibold text-white flex items-center">
                    <svg
                      className="w-5 h-5 mr-2"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                      />
                    </svg>
                    {t("pages.contractDetail.customerDetails")}
                  </h3>
                </div>
                <div className="p-6">
                  <div className="text-center mb-6">
                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                      {customer.customer_type === 'company' ? (
                        <svg
                          className="w-8 h-8 text-green-600"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                          />
                        </svg>
                      ) : (
                        <span className="text-2xl font-bold text-green-600">
                          {customer?.first_name?.charAt(0) || ""}
                          {customer?.last_name?.charAt(0) || ""}
                        </span>
                      )}
                    </div>
                    <h4 className="text-lg font-semibold text-gray-900">
                      {customer.customer_type === 'company' 
                        ? customer.company_name 
                        : `${customer.first_name} ${customer.last_name}`}
                    </h4>
                    <span
                      className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full mt-2 ${
                        customer.is_active === true
                          ? "bg-green-100 text-green-800"
                          : "bg-red-100 text-red-800"
                      }`}
                    >
                      {customer.is_active === true
                        ? t("common.active")
                        : t("common.inactive")}
                    </span>
                  </div>

                  {/* Personal/Company Information */}
                  <div className="mb-6">
                    <h5 className="text-sm font-semibold text-gray-700 mb-3 flex items-center">
                      <svg
                        className="w-4 h-4 mr-2 text-blue-600"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d={customer.customer_type === 'company' 
                            ? "M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                            : "M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"}
                        />
                      </svg>
                      {customer.customer_type === 'company' 
                        ? t("common.companyInformation") 
                        : t("common.personalInformation")}
                    </h5>
                    <dl className="space-y-3">
                      {customer.customer_type === 'company' ? (
                        <>
                          <div className="flex justify-between items-center py-2 border-b border-gray-100">
                            <dt className="text-sm font-medium text-gray-600">
                              {t("common.companyName")}
                            </dt>
                            <dd className="text-sm font-semibold text-gray-900">
                              {customer.company_name || t("common.unknown")}
                            </dd>
                          </div>
                          <div className="flex justify-between items-center py-2 border-b border-gray-100">
                            <dt className="text-sm font-medium text-gray-600">
                              {t("common.voen")}
                            </dt>
                            <dd className="text-sm font-semibold text-gray-900">
                              {customer.voen || t("common.unknown")}
                            </dd>
                          </div>
                          <div className="flex justify-between items-center py-2 border-b border-gray-100">
                            <dt className="text-sm font-medium text-gray-600">
                              {t("common.phone")}
                            </dt>
                            <dd className="text-sm font-semibold text-gray-900">
                              {customer.phone || t("common.unknown")}
                            </dd>
                          </div>
                          <div className="flex justify-between items-start py-2">
                            <dt className="text-sm font-medium text-gray-600">
                              {t("common.address")}
                            </dt>
                            <dd className="text-sm font-semibold text-gray-900 text-right max-w-xs">
                              {customer.address || t("common.unknown")}
                            </dd>
                          </div>
                        </>
                      ) : (
                        <>
                          <div className="flex justify-between items-center py-2 border-b border-gray-100">
                            <dt className="text-sm font-medium text-gray-600">
                              {t("common.fatherName")}
                            </dt>
                            <dd className="text-sm font-semibold text-gray-900">
                              {customer.father_name || t("common.unknown")}
                            </dd>
                          </div>
                          <div className="flex justify-between items-center py-2 border-b border-gray-100">
                            <dt className="text-sm font-medium text-gray-600">
                              {t("common.nationalId")}
                            </dt>
                            <dd className="text-sm font-semibold text-gray-900">
                              {customer.national_id || t("common.unknown")}
                            </dd>
                          </div>
                          <div className="flex justify-between items-center py-2 border-b border-gray-100">
                            <dt className="text-sm font-medium text-gray-600">
                              {t("common.phone")}
                            </dt>
                            <dd className="text-sm font-semibold text-gray-900">
                              {customer.phone || t("common.unknown")}
                            </dd>
                          </div>
                          <div className="flex justify-between items-start py-2">
                            <dt className="text-sm font-medium text-gray-600">
                              {t("common.address")}
                            </dt>
                            <dd className="text-sm font-semibold text-gray-900 text-right max-w-xs">
                              {customer.address || t("common.unknown")}
                            </dd>
                          </div>
                        </>
                      )}
                    </dl>
                  </div>

                  {/* Contact Information */}
                  {customer.contacts && customer.contacts.length > 0 && (
                    <div className="mb-6">
                      <h5 className="text-sm font-semibold text-gray-700 mb-3 flex items-center">
                        <svg
                          className="w-4 h-4 mr-2 text-purple-600"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                          />
                        </svg>
                        {t("common.contactInformation")}
                      </h5>
                      <div className="space-y-3">
                        {customer.contacts.map((contact, index) => (
                          <div
                            key={contact.id}
                            className="bg-gray-50 rounded-lg p-3 border border-gray-200"
                          >
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-xs font-medium text-gray-500">
                                {t("common.contact")} {index + 1}
                              </span>
                            </div>
                            <div className="space-y-2">
                              <div className="flex justify-between items-center">
                                <dt className="text-xs font-medium text-gray-600">
                                  {t("common.name")}
                                </dt>
                                <dd className="text-xs font-semibold text-gray-900">
                                  {contact.first_name} {contact.last_name}
                                </dd>
                              </div>
                              <div className="flex justify-between items-center">
                                <dt className="text-xs font-medium text-gray-600">
                                  {t("common.relationship")}
                                </dt>
                                <dd className="text-xs font-semibold text-gray-900">
                                  {contact.relationship}
                                </dd>
                              </div>
                              <div className="flex justify-between items-center">
                                <dt className="text-xs font-medium text-gray-600">
                                  {t("common.phone")}
                                </dt>
                                <dd className="text-xs font-semibold text-gray-900">
                                  {contact.phone}
                                </dd>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Customer Details */}
                  <div>
                    <h5 className="text-sm font-semibold text-gray-700 mb-3 flex items-center">
                      <svg
                        className="w-4 h-4 mr-2 text-gray-600"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                        />
                      </svg>
                      {t("common.customerDetails")}
                    </h5>
                    <dl className="space-y-3">
                      <div className="flex justify-between items-center py-2 border-b border-gray-100">
                        <dt className="text-sm font-medium text-gray-600">
                          {t("common.createdAt")}
                        </dt>
                        <dd className="text-sm font-semibold text-gray-900">
                          {customer.created_at
                            ? formatDisplayDate(customer.created_at)
                            : t("common.unknown")}
                        </dd>
                      </div>
                      <div className="flex justify-between items-center py-2">
                        <dt className="text-sm font-medium text-gray-600">
                          {t("common.status")}
                        </dt>
                        <dd>
                          <span
                            className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                              customer.is_active === true
                                ? "bg-green-100 text-green-800"
                                : "bg-red-100 text-red-800"
                            }`}
                          >
                            {customer.is_active === true
                              ? t("common.active")
                              : t("common.inactive")}
                          </span>
                        </dd>
                      </div>
                    </dl>
                  </div>
                </div>
              </div>
            )}

            {/* Company Information */}
            {company && (
              <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
                <div className="bg-gradient-to-r from-orange-600 to-red-600 px-6 py-4">
                  <h3 className="text-lg font-semibold text-white flex items-center">
                    <svg
                      className="w-5 h-5 mr-2"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                      />
                    </svg>
                    {t("pages.contractDetail.companyDetails")}
                  </h3>
                </div>
                <div className="p-6">
                  <h4 className="text-lg font-semibold text-gray-900 mb-3">
                    {company.name}
                  </h4>
                  <dl className="space-y-3">
                    <div>
                      <dt className="text-sm font-medium text-gray-600">
                        {t("common.interestRate")}
                      </dt>
                      <dd className="text-lg font-bold text-blue-600">
                        {company.interest_rate}%
                      </dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-600">
                        {t("common.status")}
                      </dt>
                      <dd>
                        <span
                          className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${
                            company.is_active
                              ? "bg-green-100 text-green-800"
                              : "bg-red-100 text-red-800"
                          }`}
                        >
                          {company.is_active
                            ? t("common.active")
                            : t("common.inactive")}
                        </span>
                      </dd>
                    </div>
                  </dl>
                </div>
              </div>
            )}

            {/* Recent Payments */}
            <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
              <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-4">
                <h3 className="text-lg font-semibold text-white flex items-center">
                  <svg
                    className="w-5 h-5 mr-2"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                    />
                  </svg>
                  {t("pages.contractDetail.recentPayments")}
                </h3>
              </div>
              <div className="p-6">
                {contractPayments.length > 0 ? (
                  <div className="space-y-4">
                    {contractPayments.slice(0, 5).map((payment: Payment) => (
                      <div
                        key={payment.id}
                        className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                      >
                        <div>
                          <div className="font-semibold text-gray-900">
                            ₼{Math.round(payment.amount)}
                          </div>
                          <div className="text-sm text-gray-600">
                            {formatDisplayDate(payment.payment_date)}
                          </div>
                        </div>
                        <span className="text-xs font-medium text-gray-500 bg-white px-2 py-1 rounded">
                          {getPaymentMethodLabel(payment.payment_method, t)}
                        </span>
                      </div>
                    ))}
                    {contractPayments.length > 5 && (
                      <div className="text-center pt-2">
                        <span className="text-sm text-gray-500">
                          +{contractPayments.length - 5}{" "}
                          {t("pages.contractDetail.morePayments")}
                        </span>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <svg
                      className="w-12 h-12 text-gray-400 mx-auto mb-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                      />
                    </svg>
                    <p className="text-gray-500">
                      {t("pages.contractDetail.noPaymentsRecordedYet")}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Delete Confirmation Modal */}
        {showDeleteModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl max-w-md w-full">
              <div className="p-6">
                <div className="flex items-center mb-4">
                  <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mr-4">
                    <svg
                      className="w-6 h-6 text-red-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
                      />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      {t("pages.contractDetail.deleteConfirmation")}
                    </h3>
                    <p className="text-sm text-gray-600">
                      {t("pages.contractDetail.deleteSubtitle")}
                    </p>
                  </div>
                </div>
                <p className="text-gray-700 mb-6">
                  {t("pages.contractDetail.deleteMessage")}
                </p>
                <div className="flex space-x-3">
                  <button
                    onClick={() => setShowDeleteModal(false)}
                    className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-lg hover:bg-gray-200 transition-colors duration-200"
                  >
                    {t("pages.contractDetail.cancel")}
                  </button>
                  <button
                    onClick={handleDelete}
                    className="flex-1 px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-lg hover:bg-red-700 transition-colors duration-200"
                  >
                    {t("pages.contractDetail.delete")}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Authorization Dialog */}
        {showAuthorizationDialog && contract && customer && company && (
          <AuthorizationDialog
            isOpen={showAuthorizationDialog}
            onClose={() => setShowAuthorizationDialog(false)}
            contract={contract}
            customer={customer}
            company={company}
          />
        )}


        {/* Close Contract Modal */}
        {showCloseContractModal && contract && (
          <CloseContractModal
            isOpen={showCloseContractModal}
            onClose={() => setShowCloseContractModal(false)}
            contract={contract}
            onConfirm={handleCloseContract}
            isLoading={isClosingContract}
          />
        )}

        {/* Print Buttons Section */}
        {contract && customer && company && contract.vehicle && (
          <div className="mt-8 bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
            <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-4">
              <h2 className="text-xl font-semibold text-white flex items-center">
                <FileText className="w-6 h-6 mr-2" />
                {t("pages.contractDetail.printDocuments")}
              </h2>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                <ContractOutput
                  contract={contract}
                  customer={customer}
                  company={company}
                  vehicle={contract.vehicle}
                />
                <TehvilTeslimOutput
                  contract={contract}
                  customer={customer}
                  company={company}
                  vehicle={contract.vehicle}
                />
                <XitamOutput
                  contract={contract}
                  customer={customer}
                  company={company}
                  vehicle={contract.vehicle}
                />
                <IltizamOutput
                  contract={contract}
                  customer={customer}
                  company={company}
                  vehicle={contract.vehicle}
                />
                <AlqiSatqiOutput
                  contract={contract}
                  customer={customer}
                  company={company}
                  vehicle={contract.vehicle}
                />
                <ErizeOutput
                  contract={contract}
                  customer={customer}
                  company={company}
                  vehicle={contract.vehicle}
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ContractDetail;

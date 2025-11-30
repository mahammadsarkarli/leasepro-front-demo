import React, { useState, useEffect, useMemo } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { useTranslation } from "../i18n";
import { useData } from "../contexts/DataContext";
import { useAuth } from "../contexts/AuthContext";
import { deleteCustomer } from "../services/customers";
import { Customer, ContractStatus, CustomerType, PaymentMethod } from "../types";
import { formatDisplayDate } from "../utils/dateUtils";
import { calculateCorrectNextDueDate } from "../utils/contractUtils";
import { getDisplayMonthlyPayment } from "../utils/paymentCalculationUtils";
import { getPaymentMethodLabel } from "../utils/paymentUtils";
import { differenceInDays } from "date-fns";
import AuthorizationDialog from "../components/AuthorizationDialog";
import {
  ArrowLeft,
  Edit,
  Trash2,
  User,
  Phone,
  MapPin,
  Calendar,
  Building,
  Car,
  DollarSign,
  FileText,
  Clock,
  CheckCircle,
  AlertCircle,
  Star,
  Mail,
  Briefcase,
  AlertTriangle,
  CreditCard,
  Eye,
} from "lucide-react";

const CustomerDetail: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { t } = useTranslation();
  const {
    customers,
    contracts,
    payments,
    companies,
    loadCustomers,
    loadContractsWithoutPermissions,
    loadPayments,
    loadCompanies,
    addPayment,
    calculateInterest,
  } = useData();
  const { canEdit, canDelete } = useAuth();
  const [loading, setLoading] = useState(true);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showAuthorizationDialog, setShowAuthorizationDialog] = useState(false);
  const [showAddPaymentModal, setShowAddPaymentModal] = useState(false);
  const [selectedContract, setSelectedContract] = useState("");
  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("manual");

  // Load data if not already loaded
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        await Promise.all([
          loadCustomers(),
          loadContractsWithoutPermissions(),
          loadPayments(),
          loadCompanies(),
        ]);
      } catch (error) {
        console.error("Error loading data:", error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []); // Remove function dependencies to prevent repeated calls

  // Find customer and related data from context
  const customer = useMemo(() => {
    return customers.find((c) => c.id === id) || null;
  }, [customers, id]) as Customer | null;

  const company = useMemo(() => {
    if (!customer?.company_id) return null;
    return companies.find((c) => c.id === customer.company_id) || null;
  }, [companies, customer]);

  const customerContracts = useMemo(() => {
    if (!customer?.id) return [];
    return contracts.filter((c) => c.customer_id === customer.id);
  }, [contracts, customer]);

  const customerPayments = useMemo(() => {
    if (!customer?.id) return [];
    return payments.filter((p) => {
      const contract = contracts.find((c) => c.id === p.contract_id);
      return contract?.customer_id === customer.id;
    });
  }, [payments, contracts, customer]);

  // Helper function to format dates in Azerbaijani
  const formatDate = (date: Date | string) => {
    try {
      const dateObj = date instanceof Date ? date : new Date(date);
      if (!dateObj || isNaN(dateObj.getTime())) {
        return "Invalid Date";
      }
      return formatDisplayDate(dateObj);
    } catch (error) {
      console.error("Error formatting date:", error, "Date value:", date);
      return "Invalid Date";
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading customer data...</p>
        </div>
      </div>
    );
  }

  if (!customer) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8 text-red-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            {t("common.customerNotFound")}
          </h3>
          <p className="text-gray-600 mb-6">
            {t("pages.customerDetail.customerNotFoundMessage")}
          </p>
          <button
            onClick={() => navigate("/customers")}
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            {t("common.backToCustomers")}
          </button>
        </div>
      </div>
    );
  }

  const totalPaid = customerPayments.reduce(
    (sum, payment) => sum + payment.amount,
    0
  );
  const totalOwed = customerContracts
    .filter((c) => c.status === ContractStatus.ACTIVE)
    .reduce((sum, contract) => sum + contract.remaining_balance, 0);

  const overduePayments = customerContracts.filter((contract) => {
    const today = new Date();
    const correctNextDueDate = calculateCorrectNextDueDate(contract, true); // Use contract start date
    return (
      contract.status === ContractStatus.ACTIVE && correctNextDueDate < today
    );
  });

  // Calculate total overdue days across all contracts
  const totalOverdueDays = customerContracts.reduce((total, contract) => {
    const today = new Date();
    const correctNextDueDate = calculateCorrectNextDueDate(contract, true); // Use contract start date
    if (
      contract.status === ContractStatus.ACTIVE &&
      correctNextDueDate < today
    ) {
      return total + differenceInDays(today, correctNextDueDate);
    }
    return total;
  }, 0);

  const activeContracts = customerContracts.filter(
    (c) => c.status === ContractStatus.ACTIVE
  ).length;
  const completedContracts = customerContracts.filter(
    (c) => c.status === ContractStatus.COMPLETED
  ).length;

  const handleAddPayment = () => {
    if (!selectedContract || !paymentAmount) return;

    const contract = customerContracts.find((c) => c.id === selectedContract);
    if (!contract) return;

    const amount = parseFloat(paymentAmount);
    const today = new Date();
    const dueDate = calculateCorrectNextDueDate(contract, true); // Use contract start date
    const daysLate = Math.max(0, differenceInDays(today, dueDate));
    const interestAmount =
      daysLate > 0 && company
        ? calculateInterest(amount, daysLate, company.interest_rate)
        : 0;

    addPayment({
      contract_id: selectedContract,
      amount: Math.round((amount + interestAmount) * 100) / 100,
      payment_date: today,
      payment_method: paymentMethod as PaymentMethod,
      notes: `${t("common.manualEntry")} - ${paymentMethod}`,
    });

    // Reset form
    setSelectedContract("");
    setPaymentAmount("");
    setPaymentMethod("manual");
    setShowAddPaymentModal(false);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200" data-guide-id="customer-detail-header">
        <div className="w-full px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-6">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate("/customers")}
                className="p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  {customer.customer_type === "individual"
                    ? `${customer.first_name} ${customer.last_name}`
                    : customer.company_name}
                </h1>
                <div className="flex items-center space-x-2 mt-1">
                  <span
                    className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                      customer.customer_type === "individual"
                        ? "bg-blue-100 text-blue-800"
                        : "bg-green-100 text-green-800"
                    }`}
                  >
                    {customer.customer_type === "individual"
                      ? t("common.individual")
                      : t("common.company")}
                  </span>
                </div>
                <p className="text-gray-600">
                  {t("pages.customerDetail.customerDetails")}
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              {canEdit("payments") &&
                customerContracts.filter(
                  (c) => c.status === ContractStatus.ACTIVE
                ).length > 0 && (
                  <button
                    onClick={() => setShowAddPaymentModal(true)}
                    className="inline-flex items-center px-4 py-2 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 transition-colors duration-200 shadow-lg"
                  >
                    <DollarSign className="w-4 h-4 mr-2" />
                    {t("common.addPayment")}
                  </button>
                )}
            </div>
          </div>
        </div>
      </div>

      <div className="w-full px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Overview */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-4 gap-4 lg:gap-6 mb-8">
          {/* Total Paid */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
            <div className="text-center">
              <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                <DollarSign className="w-6 h-6 text-green-600" />
              </div>
              <h3 className="text-sm font-medium text-gray-600 mb-2">
                {t("common.totalPaid")}
              </h3>
              <div className="mb-2">
                <span className="text-2xl lg:text-3xl font-bold text-green-600">
                  ₼{Math.round(totalPaid || 0)}
                </span>
              </div>
              <p className="text-xs text-gray-500">
                {t("pages.customerDetail.lifetimeTotal")}
              </p>
            </div>
          </div>

          {/* Outstanding Balance */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
            <div className="text-center">
              <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                <DollarSign className="w-6 h-6 text-amber-600" />
              </div>
              <h3 className="text-sm font-medium text-gray-600 mb-2">
                {t("common.outstandingBalance")}
              </h3>
              <div className="mb-2">
                <span className="text-2xl lg:text-3xl font-bold text-amber-600">
                  ₼{Math.round(totalOwed || 0)}
                </span>
              </div>
              <p className="text-xs text-gray-500">
                {t("pages.customerDetail.currentBalance")}
              </p>
            </div>
          </div>

          {/* Overdue Days */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
            <div className="text-center">
              <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                <AlertTriangle className="w-6 h-6 text-red-600" />
              </div>
              <h3 className="text-sm font-medium text-gray-600 mb-2">
                {t("common.overdueContracts")}
              </h3>
              <div className="mb-2">
                <span className="text-2xl lg:text-3xl font-bold text-red-600">
                  {totalOverdueDays}
                </span>
              </div>
              <p className="text-xs text-gray-500">
                {t("pages.customerDetail.requiresAttention")}
              </p>
            </div>
          </div>

          {/* Total Contracts */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
            <div className="text-center">
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                <FileText className="w-6 h-6 text-blue-600" />
              </div>
              <h3 className="text-sm font-medium text-gray-600 mb-2">
                {t("pages.customerDetail.totalContracts")}
              </h3>
              <div className="mb-2">
                <span className="text-2xl lg:text-3xl font-bold text-blue-600">
                  {customerContracts.length}
                </span>
              </div>
              <p className="text-xs text-gray-500">
                {activeContracts} {t("common.active")}, {completedContracts}{" "}
                {t("common.completed")}
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Customer Information */}
          <div className="lg:col-span-1" data-guide-id="customer-info-section">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200">
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-gray-900">
                    {t("common.customerInformation")}
                  </h2>
                  {canEdit("customers") && (
                    <Link
                      to={`/customers/${customer.id}/edit`}
                      className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <Edit className="w-4 h-4" />
                    </Link>
                  )}
                </div>
              </div>
              <div className="p-6">
                <div className="space-y-6">
                  {/* Personal Information */}
                  <div>
                    <h3 className="text-sm font-medium text-gray-900 mb-3">
                      {customer.customer_type === "individual"
                        ? t("common.personalInformation")
                        : t("common.companyInformation")}
                    </h3>
                    <div className="space-y-3">
                      <div className="flex items-center text-sm">
                        <User className="w-4 h-4 mr-3 text-gray-400" />
                        <div>
                          <p className="text-gray-900 font-medium">
                            {customer.customer_type === "individual"
                              ? `${customer.first_name} ${customer.last_name}`
                              : customer.company_name}
                          </p>
                          <p className="text-gray-500">
                            {customer.customer_type === "individual"
                              ? t("pages.customerDetail.customerName")
                              : t("common.companyName")}
                          </p>
                        </div>
                      </div>
                      {customer.customer_type === "individual" ? (
                        <>
                          <div className="flex items-center text-sm">
                            <User className="w-4 h-4 mr-3 text-gray-400" />
                            <div>
                              <p className="text-gray-900">
                                {customer.father_name}
                              </p>
                              <p className="text-gray-500">
                                {t("common.fatherName")}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center text-sm">
                            <CreditCard className="w-4 h-4 mr-3 text-gray-400" />
                            <div>
                              <p className="text-gray-900">
                                {customer.national_id}
                              </p>
                              <p className="text-gray-500">
                                {t("common.nationalId")}
                              </p>
                            </div>
                          </div>
                        </>
                      ) : (
                        <div className="flex items-center text-sm">
                          <CreditCard className="w-4 h-4 mr-3 text-gray-400" />
                          <div>
                            <p className="text-gray-900">{customer.voen}</p>
                            <p className="text-gray-500">{t("common.voen")}</p>
                          </div>
                        </div>
                      )}
                      <div className="flex items-center text-sm">
                        <Phone className="w-4 h-4 mr-3 text-gray-400" />
                        <div>
                          <p className="text-gray-900">{customer.phone}</p>
                          <p className="text-gray-500">{t("common.phone")}</p>
                        </div>
                      </div>
                      <div className="flex items-start text-sm">
                        <MapPin className="w-4 h-4 mr-3 text-gray-400 mt-0.5" />
                        <div>
                          <p className="text-gray-900">{customer.address}</p>
                          <p className="text-gray-500">{t("common.address")}</p>
                        </div>
                      </div>

                      {/* License Information */}
                      {(customer.license_number ||
                        customer.license_category ||
                        customer.license_given_date) && (
                        <div className="pt-4 border-t border-gray-200">
                          <h3 className="text-sm font-medium text-gray-900 mb-3">
                            {t("common.licenseInformation")}
                          </h3>
                          <div className="space-y-3">
                            {customer.license_number && (
                              <div className="flex items-center text-sm">
                                <FileText className="w-4 h-4 mr-3 text-gray-400" />
                                <div>
                                  <p className="text-gray-900">
                                    {customer.license_number}
                                  </p>
                                  <p className="text-gray-500">
                                    {t("common.licenseNumber")}
                                  </p>
                                </div>
                              </div>
                            )}
                            {customer.license_category && (
                              <div className="flex items-center text-sm">
                                <Briefcase className="w-4 h-4 mr-3 text-gray-400" />
                                <div>
                                  <p className="text-gray-900">
                                    {customer.license_category}
                                  </p>
                                  <p className="text-gray-500">
                                    {t("common.licenseCategory")}
                                  </p>
                                </div>
                              </div>
                            )}
                            {customer.license_given_date && (
                              <div className="flex items-center text-sm">
                                <Calendar className="w-4 h-4 mr-3 text-gray-400" />
                                <div>
                                  <p className="text-gray-900">
                                    {formatDate(customer.license_given_date)}
                                  </p>
                                  <p className="text-gray-500">
                                    {t("common.licenseGivenDate")}
                                  </p>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Contact Information */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-semibold text-gray-900">
                        {t("common.contactInformation")}
                      </h3>
                      <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                        <User className="w-4 h-4 text-blue-600" />
                      </div>
                    </div>

                    {/* Additional Contacts */}
                    {customer.contacts && customer.contacts.length > 0 ? (
                      <div className="space-y-4">
                        {customer.contacts.map((contact, index) => (
                          <div
                            key={contact.id || index}
                            className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow"
                          >
                            <div className="flex items-center justify-between mb-4">
                              <div className="flex items-center space-x-4">
                                <div className="w-12 h-12 bg-gradient-to-br from-blue-100 to-blue-200 rounded-full flex items-center justify-center">
                                  <User className="w-6 h-6 text-blue-600" />
                                </div>
                                <div>
                                  <h5 className="font-semibold text-gray-900 text-lg">
                                    {contact.first_name} {contact.last_name}
                                  </h5>
                                  <span className="text-sm text-blue-600 bg-blue-50 px-3 py-1 rounded-full font-medium">
                                    {contact.relationship}
                                  </span>
                                </div>
                              </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                                <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                                  <User className="w-4 h-4 text-blue-600" />
                                </div>
                                <div className="flex-1">
                                  <p className="text-xs text-gray-500 font-medium">
                                    {t("common.relationship")}
                                  </p>
                                  <p className="text-sm font-semibold text-gray-900">
                                    {contact.relationship}
                                  </p>
                                </div>
                              </div>

                              <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                                <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                                  <Phone className="w-4 h-4 text-green-600" />
                                </div>
                                <div className="flex-1">
                                  <p className="text-xs text-gray-500 font-medium">
                                    {t("common.phone")}
                                  </p>
                                  <p className="text-sm font-semibold text-gray-900">
                                    {contact.phone}
                                  </p>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8 border-2 border-dashed border-gray-300 rounded-xl">
                        <User className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                        <p className="text-gray-500">
                          {t("common.noAdditionalContacts")}
                        </p>
                        <p className="text-sm text-gray-400 mt-1">
                          {t("common.addContactsInEdit")}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Customer Details */}
                  <div>
                    <h3 className="text-sm font-medium text-gray-900 mb-3">
                      {t("common.customerDetails")}
                    </h3>
                    <div className="space-y-3">
                      <div className="flex items-center text-sm">
                        <Calendar className="w-4 h-4 mr-3 text-gray-400" />
                        <div>
                          <p className="text-gray-900">
                            {formatDate(customer.created_at)}
                          </p>
                          <p className="text-gray-500">
                            {t("common.createdAt")}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center text-sm">
                        <div className="w-4 h-4 mr-3 flex items-center justify-center">
                          <div
                            className={`w-2 h-2 rounded-full ${
                              customer.is_active ? "bg-green-500" : "bg-red-500"
                            }`}
                          ></div>
                        </div>
                        <div>
                          <p className="text-gray-900">
                            {customer.is_active
                              ? t("common.active")
                              : t("common.inactive")}
                          </p>
                          <p className="text-gray-500">{t("common.status")}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Company Information */}
                  {company && (
                    <div className="pt-4 border-t border-gray-200">
                      <h3 className="text-sm font-medium text-gray-900 mb-3">
                        {t("common.companyInformation")}
                      </h3>
                      <div className="flex items-center text-sm">
                        <Building className="w-4 h-4 mr-3 text-gray-400" />
                        <div>
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                            {company.name}
                          </span>
                          <p className="text-gray-500 mt-1">
                            {t("common.company")}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Contracts & Payments */}
          <div className="lg:col-span-2 space-y-6">
            {/* Contracts */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200" data-guide-id="customer-contracts-section">
              <div className="p-6 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">
                  {t("common.vehicleContracts")}
                </h3>
              </div>
              <div className="p-6">
                {customerContracts.length === 0 ? (
                  <div className="text-center py-8">
                    <Car className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">
                      {t("common.noContractsFound")}
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {customerContracts.map((contract) => {
                      const correctNextDueDate =
                        calculateCorrectNextDueDate(contract, true); // Use contract start date
                      const isOverdue =
                        contract.status === "active" &&
                        correctNextDueDate < new Date();
                      const daysOverdue = isOverdue
                        ? differenceInDays(new Date(), correctNextDueDate)
                        : 0;

                      return (
                        <div
                          key={contract.id}
                          className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                        >
                          <div className="flex items-start justify-between mb-3">
                            <div>
                              <h4 className="font-semibold text-gray-900">
                                {contract.vehicle.make} {contract.vehicle.model}{" "}
                                ({contract.vehicle.year})
                              </h4>
                              <p className="text-sm text-gray-600 font-mono">
                                {contract.vehicle.license_plate}
                              </p>
                            </div>
                            <span
                              className={`px-3 py-1 rounded-full text-sm font-medium ${
                                contract.status === ContractStatus.ACTIVE
                                  ? "bg-green-100 text-green-800"
                                  : contract.status === ContractStatus.COMPLETED
                                  ? "bg-blue-100 text-blue-800"
                                  : contract.status === ContractStatus.OPEN
                                  ? "bg-yellow-100 text-yellow-800"
                                  : contract.status ===
                                    ContractStatus.TAMAMLANMIS
                                  ? "bg-green-100 text-green-800"
                                  : contract.status ===
                                    ContractStatus.ALQI_SATQI
                                  ? "bg-orange-100 text-orange-800"
                                  : contract.status ===
                                    ContractStatus.IMTINA_EDILMIS
                                  ? "bg-red-100 text-red-800"
                                  : "bg-red-100 text-red-800"
                              }`}
                            >
                              {t(`common.${contract.status}`)}
                            </span>
                          </div>

                          <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                              <span className="text-gray-600">
                                {t("common.monthlyPayment")}:
                              </span>
                              <span className="font-medium">
                                ₼
                                {Math.round(getDisplayMonthlyPayment(contract))}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600">
                                {t("common.remainingBalance")}:
                              </span>
                              <span className="font-medium">
                                ₼{Math.round(contract.remaining_balance || 0)}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600">
                                {t("common.nextPayment")}:
                              </span>
                              <span
                                className={`font-medium ${
                                  isOverdue ? "text-red-600" : ""
                                }`}
                              >
                                {formatDate(
                                  calculateCorrectNextDueDate(contract, true) // Use contract start date
                                )}
                                {isOverdue &&
                                  ` (${daysOverdue} ${t("common.daysLate")})`}
                              </span>
                            </div>
                          </div>

                          {isOverdue && (
                            <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                              <div className="flex items-center space-x-2">
                                <AlertTriangle className="w-4 h-4 text-red-500" />
                                <p className="text-sm text-red-700">
                                  {t("common.paymentOverdueBy").replace(
                                    "{days}",
                                    String(daysOverdue)
                                  )}
                                </p>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Payment History */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200">
              <div className="p-6 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">
                  {t("common.paymentHistory")}
                </h3>
              </div>
              <div className="overflow-x-auto">
                {customerPayments.length === 0 ? (
                  <div className="p-6 text-center">
                    <DollarSign className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">
                      {t("common.noPaymentsRecorded")}
                    </p>
                  </div>
                ) : (
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          {t("common.date")}
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          {t("common.vehicle")}
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          {t("common.amount")}
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          {t("common.method")}
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          {t("common.status")}
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          {t("common.notes")}
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {customerPayments.map((payment) => {
                        const contract = customerContracts.find(
                          (c) => c.id === payment.contract_id
                        );

                        return (
                          <tr key={payment.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {formatDate(payment.payment_date)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {contract ? (
                                <div>
                                  <p className="font-medium">
                                    {contract.vehicle.make}{" "}
                                    {contract.vehicle.model}
                                  </p>
                                  <p className="text-gray-500 font-mono text-xs">
                                    {contract.vehicle.license_plate}
                                  </p>
                                </div>
                              ) : (
                                t("common.unknownVehicle")
                              )}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              <div>
                                <p className="font-medium">
                                  ₼{Math.round(payment.amount || 0)}
                                </p>
                                {(payment.interest_amount || 0) > 0 && (
                                  <p className="text-xs text-red-600">
                                    +₼{Math.round(payment.interest_amount || 0)}{" "}
                                    {t("common.interest")}
                                  </p>
                                )}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 capitalize">
                              {getPaymentMethodLabel(payment.payment_method, t)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              {payment.is_late ? (
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                  <Clock className="w-3 h-3 mr-1" />
                                  {payment.days_late} {t("common.daysLate")}
                                </span>
                              ) : (
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                  <CheckCircle className="w-3 h-3 mr-1" />
                                  {t("common.onTime")}
                                </span>
                              )}
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-600">
                              {payment.notes || "-"}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* Add Payment Modal */}
      {showAddPaymentModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg max-w-md w-full mx-4">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">
                {t("common.addPayment")}
              </h3>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t("common.selectContract")}
                </label>
                <select
                  value={selectedContract}
                  onChange={(e) => setSelectedContract(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">{t("common.selectAContract")}</option>
                  {customerContracts
                    .filter((c) => c.status === "active")
                    .map((contract) => (
                      <option key={contract.id} value={contract.id}>
                        {contract.vehicle.license_plate} -{" "}
                        {contract.vehicle.make} {contract.vehicle.model}
                      </option>
                    ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t("common.paymentAmount")}
                </label>
                <input
                  type="number"
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                  placeholder={t("common.enterAmount")}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t("common.paymentMethod")}
                </label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value as any)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="manual">{t("common.manualEntry")}</option>
                  <option value="cash">{t("common.cash")}</option>
                  <option value="bank_transfer">
                    {t("common.bankTransfer")}
                  </option>
                </select>
              </div>
            </div>

            <div className="p-6 border-t border-gray-200 flex space-x-3">
              <button
                onClick={() => setShowAddPaymentModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
              >
                {t("common.cancel")}
              </button>
              <button
                onClick={handleAddPayment}
                disabled={!selectedContract || !paymentAmount}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {t("common.addPayment")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomerDetail;

import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "../i18n";
import {
  Search,
  Plus,
  Eye,
  Edit,
  Trash2,
  Phone,
  MapPin,
  CreditCard,
  Calendar,
  User,
  Grid3X3,
  List,
  Filter,
  Upload,
} from "lucide-react";
import { useData } from "../contexts/DataContext";
import { useAuth } from "../contexts/AuthContext";
import { formatDisplayDate } from "../utils/dateUtils";
import DeleteConfirmationDialog from "../components/DeleteConfirmationDialog";
import { getCustomers, deleteCustomer } from "../services/customers";
import { useNotifications } from "../hooks/useNotifications";
import { canDelete, canEdit, canCreate } from "../utils/permissions";

import { ContractStatus } from "../types";
import { Customer } from "../types";

const Customers: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { user } = useAuth();

  const {
    customers,
    companies,
    selectedCompany,
    setSelectedCompany,
    getCustomerContracts,
    loadCustomers,
    loadCompanies,
    loadContractsWithoutPermissions,
    customersLoading,
    companiesLoading,
    contractsLoading,
  } = useData();
  const { successMessages, errorMessages } = useNotifications();

  const [searchTerm, setSearchTerm] = useState("");
  const [viewMode, setViewMode] = useState<"cards" | "table">("cards");
  const [sortField, setSortField] = useState<keyof Customer>("created_at");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");
  const [deleteDialog, setDeleteDialog] = useState<{
    isOpen: boolean;
    customerId: string | null;
    customerName: string;
    isLoading: boolean;
  }>({
    isOpen: false,
    customerId: null,
    customerName: "",
    isLoading: false,
  });

  // Load data when component mounts - only once
  useEffect(() => {
    const loadData = async () => {
      const promises = [];
      
      // Only load if data is missing and not currently loading
      if (customers.length === 0 && !customersLoading) {
        promises.push(loadCustomers());
      }
      if (companies.length === 0 && !companiesLoading) {
        promises.push(loadCompanies());
      }
      // Always load contracts without permissions for customers page
      // This ensures we don't get permission_documents data
      promises.push(loadContractsWithoutPermissions());
      
      if (promises.length > 0) {
        await Promise.all(promises);
      }
    };

    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Run only once on mount

  // Show loading state while data is being fetched
  if (customersLoading || companiesLoading || contractsLoading) {
    return (
      <div className="space-y-6">
        <div className="text-center py-8">
          <p className="text-gray-600">{t("common.loading")}</p>
        </div>
      </div>
    );
  }

  const getFilteredCustomers = () => {
    let filteredCustomers = customers;

    // Filter by selected company if one is selected
    if (selectedCompany) {
      // For admin users, also include customers with contracts from other companies
      if (user?.role === "admin") {
        const customersWithContracts = customers.filter((c) => {
          const customerContracts = getCustomerContracts(c.id);
          return customerContracts.length > 0;
        });

        const selectedCompanyCustomers = customers.filter(
          (c) => c.company_id === selectedCompany
        );

        // Combine selected company customers with customers that have contracts
        const allRelevantCustomers = [...selectedCompanyCustomers];
        customersWithContracts.forEach((customer) => {
          if (!allRelevantCustomers.find((c) => c.id === customer.id)) {
            allRelevantCustomers.push(customer);
          }
        });

        filteredCustomers = allRelevantCustomers;
      } else {
        filteredCustomers = customers.filter(
          (c) => c.company_id === selectedCompany
        );
      }
    } else if (user?.role === "user" && user.companyId) {
      // For company managers, only show their company's customers
      filteredCustomers = customers.filter(
        (c) => c.company_id === user.companyId
      );
    }

    if (searchTerm) {
      filteredCustomers = filteredCustomers.filter(
        (customer) =>
          (customer.first_name &&
            customer.first_name
              .toLowerCase()
              .includes(searchTerm.toLowerCase())) ||
          (customer.last_name &&
            customer.last_name
              .toLowerCase()
              .includes(searchTerm.toLowerCase())) ||
          (customer.father_name &&
            customer.father_name
              .toLowerCase()
              .includes(searchTerm.toLowerCase())) ||
          (customer.company_name &&
            customer.company_name &&
            customer.company_name
              .toLowerCase()
              .includes(searchTerm.toLowerCase())) ||
          (customer.voen &&
            customer.voen &&
            customer.voen.toLowerCase().includes(searchTerm.toLowerCase())) ||
          (customer.address &&
            customer.address
              .toLowerCase()
              .includes(searchTerm.toLowerCase())) ||
          (customer.phone && customer.phone.includes(searchTerm))
      );
    }

    return filteredCustomers;
  };

  const filteredCustomers = getFilteredCustomers();

  const getCompanyName = (companyId: string) => {
    const company = companies.find((c) => c.id === companyId);
    return company ? company.name : t("pages.customers.unknownCompany");
  };

  const getActiveContractsCount = (customerId: string) => {
    const customerContracts = getCustomerContracts(customerId);
    const activeContracts = customerContracts.filter(
      (c) => c.status === "active"
    );

    // Debug logging for the specific customer
    if (customerId === "0b9144ee-9c7e-4530-aaf9-322e25087558") {
      console.log("Customer contracts:", customerContracts);
      console.log("Active contracts:", activeContracts);
      console.log(
        "All contracts statuses:",
        customerContracts.map((c) => ({ id: c.id, status: c.status }))
      );
    }

    return activeContracts.length;
  };

  const getContractBeginDate = (customerId: string) => {
    const customerContracts = getCustomerContracts(customerId);
    if (customerContracts.length === 0) {
      return null;
    }
    // Find the earliest contract start_date
    const earliestContract = customerContracts.reduce((earliest, contract) => {
      if (!earliest) return contract;
      return contract.start_date < earliest.start_date ? contract : earliest;
    }, customerContracts[0]);
    return earliestContract.start_date;
  };

  const getFirstContract = (customerId: string) => {
    const customerContracts = getCustomerContracts(customerId);
    if (customerContracts.length === 0) {
      return null;
    }
    // First try to find active contract
    const activeContract = customerContracts.find(
      (c) => c.status === ContractStatus.ACTIVE || c.status === ContractStatus.OPEN
    );
    if (activeContract) {
      return activeContract;
    }
    // If no active contract, return the most recent one
    return customerContracts.reduce((latest, contract) => {
      if (!latest) return contract;
      return contract.start_date > latest.start_date ? contract : latest;
    }, customerContracts[0]);
  };

  const handleDeleteClick = (customerId: string, customerName: string) => {
    setDeleteDialog({
      isOpen: true,
      customerId,
      customerName,
      isLoading: false,
    });
  };

  const handleDeleteConfirm = async () => {
    if (!deleteDialog.customerId) return;

    setDeleteDialog((prev) => ({ ...prev, isLoading: true }));

    try {
      // Check if customer has active contracts
      const customerContracts = getCustomerContracts(deleteDialog.customerId);
      const activeContracts = customerContracts.filter(
        (c) => c.status === "active"
      );

      if (activeContracts.length > 0) {
        errorMessages.show(
          t("pages.customers.cannotDeleteWithActiveContracts")
        );
        return;
      }

      await deleteCustomer(deleteDialog.customerId);
      await loadCustomers(); // Reload customers from database
      setDeleteDialog({
        isOpen: false,
        customerId: null,
        customerName: "",
        isLoading: false,
      });
      successMessages.deleted(t("common.customer"));
    } catch (error: any) {
      // Check if it's a foreign key constraint error
      if (error?.code === "23503" && error?.message?.includes("contracts")) {
        errorMessages.show(
          t("pages.customers.cannotDeleteWithActiveContracts")
        );
      } else {
        errorMessages.show(t("pages.customers.deleteFailed"));
      }
    } finally {
      setDeleteDialog((prev) => ({ ...prev, isLoading: false }));
    }
  };

  const handleDeleteCancel = () => {
    setDeleteDialog({
      isOpen: false,
      customerId: null,
      customerName: "",
      isLoading: false,
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {t("pages.customers.title")}
          </h1>
          <p className="text-gray-600">{t("pages.customers.subtitle")}</p>
        </div>
        {(user?.role === "admin" ||
          user?.role === "superadmin" ||
          user?.role === "user") && (
          <div className="flex space-x-3">
            <button
              onClick={() => navigate("/customers/create")}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
            >
              <Plus className="w-4 h-4 mr-2" />
              {t("pages.customers.addCustomer")}
            </button>
          </div>
        )}
      </div>

      {/* Company Filter Info */}
      {user?.role === "admin" && selectedCompany && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                <span className="text-blue-600 text-sm font-medium">ℹ</span>
              </div>
            </div>
            <div className="ml-3">
              <p className="text-sm text-blue-800">
                <span className="font-medium">Showing:</span> Customers from{" "}
                {getCompanyName(selectedCompany)}
                <span className="text-blue-600">
                  {" "}
                  + customers with contracts from other companies
                </span>
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Search, Filters and View Toggle */}
      <div className="mobile-search-filters flex flex-col space-y-4 sm:space-y-0 sm:flex-row sm:items-center sm:justify-between">
        {/* Search and View Toggle Row */}
        <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder={t("pages.customers.searchPlaceholder")}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div className="flex items-center space-x-2">
            <div className="flex border border-gray-300 rounded-lg">
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
          </div>
        </div>

        {/* Company Filter Row */}
        {(user?.role === "admin" || user?.role === "superadmin") && (
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
        )}
      </div>

      {/* Customer Cards/Table */}
      {viewMode === "cards" ? (
        /* Customer Cards */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCustomers.map((customer) => {
            const customerContracts = getCustomerContracts(customer.id);
            const activeContracts = getActiveContractsCount(customer.id);

            return (
              <div
                key={customer.id}
                className="bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow"
              >
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg font-semibold text-gray-900 mb-1 text-overflow-safe">
                        {customer.customer_type === "individual"
                          ? `${customer.first_name} ${customer.last_name}`
                          : customer.company_name}
                      </h3>
                      <div className="flex items-center space-x-2">
                        <span
                          className={`flex-shrink-0 inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                            customer.customer_type === "individual"
                              ? "bg-blue-100 text-blue-800"
                              : "bg-green-100 text-green-800"
                          }`}
                        >
                          {customer.customer_type === "individual"
                            ? t("common.individual")
                            : t("common.company")}
                        </span>
                        {/* Show company indicator for admin users when company is selected */}
                        {user?.role === "admin" &&
                          selectedCompany &&
                          customer.company_id !== selectedCompany && (
                            <span className="flex-shrink-0 inline-flex px-2 py-1 text-xs font-medium rounded-full bg-orange-100 text-orange-800">
                              {getCompanyName(customer.company_id)}
                            </span>
                          )}
                      </div>
                    </div>
                    <div className="flex-shrink-0 flex items-center space-x-2">
                      <button
                        onClick={() => {
                          const firstContract = getFirstContract(customer.id);
                          if (firstContract) {
                            navigate(`/contracts/${firstContract.id}`);
                          } else {
                            navigate(`/customers/${customer.id}`);
                          }
                        }}
                        className="p-2 text-gray-400 hover:text-blue-600 rounded-lg hover:bg-gray-50"
                        title={t("common.viewDetails")}
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      {(user?.role === "admin" ||
                        user?.role === "superadmin" ||
                        user?.role === "user") && (
                        <button
                          onClick={() =>
                            navigate(`/customers/${customer.id}/edit`)
                          }
                          className="p-2 text-gray-400 hover:text-blue-600 rounded-lg hover:bg-gray-50"
                          title={t("common.editCustomer")}
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center text-sm text-gray-600">
                      <Phone className="w-4 h-4 mr-2 text-gray-400" />
                      {customer.phone}
                    </div>
                    {customer.customer_type === "individual" ? (
                      <div className="flex items-center text-sm text-gray-600">
                        <User className="w-4 h-4 mr-2 text-gray-400" />
                        {t("common.fatherName")}: {customer.father_name}
                      </div>
                    ) : (
                      <div className="flex items-center text-sm text-gray-600">
                        <User className="w-4 h-4 mr-2 text-gray-400" />
                        {t("common.voen")}: {customer.voen}
                      </div>
                    )}
                    <div className="flex items-start text-sm text-gray-600">
                      <MapPin className="flex-shrink-0 w-4 h-4 mr-2 text-gray-400 mt-0.5" />
                      <span className="flex-1 text-overflow-wrap">
                        {customer.address}
                      </span>
                    </div>

                    {/* Contact Information */}
                    {customer.contacts && customer.contacts.length > 0 && (
                      <div className="pt-2 border-t border-gray-100">
                        <p className="text-xs font-medium text-gray-500 mb-2">
                          {t("common.contactInformation")}
                        </p>
                        {customer.contacts
                          .slice(0, 2)
                          .map((contact: any, index: number) => (
                            <div
                              key={contact.id || index}
                              className="text-xs text-gray-600 mb-1 text-overflow-safe"
                            >
                              <span className="font-medium">
                                {contact.first_name} {contact.last_name}
                              </span>
                              <span className="text-gray-400 mx-1">•</span>
                              <span>{contact.relationship}</span>
                              <span className="text-gray-400 mx-1">•</span>
                              <span>{contact.phone}</span>
                            </div>
                          ))}
                        {customer.contacts.length > 2 && (
                          <p className="text-xs text-gray-400">
                            +{customer.contacts.length - 2}{" "}
                            {t("common.moreContacts")}
                          </p>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center text-sm text-gray-600">
                        <CreditCard className="w-4 h-4 mr-2 text-gray-400" />
                        {activeContracts}{" "}
                        {t("common.activeContracts").toLowerCase()}
                      </div>
                      {getContractBeginDate(customer.id) && (
                        <span className="text-xs text-gray-500">
                          {t("common.contractBeginDate")}{" "}
                          {formatDisplayDate(getContractBeginDate(customer.id)!)}
                        </span>
                      )}
                    </div>
                  </div>

                  {customerContracts.length > 0 && (
                    <div className="mt-4 space-y-2">
                      <p className="text-sm font-medium text-gray-700">
                        {t("common.recentVehicles")}
                      </p>
                      {customerContracts.slice(0, 2).map((contract) => (
                        <div
                          key={contract.id}
                          className="flex items-center text-sm text-gray-600 bg-gray-50 rounded-lg p-2"
                        >
                          <span className="font-mono text-xs bg-gray-200 px-2 py-1 rounded mr-2">
                            {contract.vehicle.license_plate}
                          </span>
                          <span>
                            {contract.vehicle.make} {contract.vehicle.model}
                          </span>
                          <span
                            className={`ml-auto px-2 py-1 rounded-full text-xs font-medium ${
                              contract.status === ContractStatus.ACTIVE
                                ? "bg-green-100 text-green-800"
                                : contract.status === ContractStatus.COMPLETED
                                ? "bg-blue-100 text-blue-800"
                                : contract.status === ContractStatus.OPEN
                                ? "bg-yellow-100 text-yellow-800"
                                : "bg-red-100 text-red-800"
                            }`}
                          >
                            {t(`common.${contract.status}`)}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Quick Actions */}
                  <div className="mt-4 flex space-x-2">
                    <button
                      onClick={() => {
                        const firstContract = getFirstContract(customer.id);
                        if (firstContract) {
                          navigate(`/contracts/${firstContract.id}`);
                        } else {
                          navigate(`/customers/${customer.id}`);
                        }
                      }}
                      className="flex-1 px-3 py-2 text-sm text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors duration-200"
                    >
                      {t("common.viewDetails")}
                    </button>
                    {canEdit(user, "customers") && (
                      <>
                        <button
                          onClick={() =>
                            navigate(`/customers/${customer.id}/edit`)
                          }
                          className="flex-1 px-3 py-2 text-sm text-gray-600 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors duration-200"
                        >
                          {t("common.edit")}
                        </button>
                        {canDelete(user, "customers") && (
                          <button
                            onClick={() =>
                              handleDeleteClick(
                                customer.id,
                                customer.customer_type === "individual"
                                  ? `${customer.first_name} ${customer.last_name}`
                                  : customer.company_name ||
                                      t("common.unknownCompany")
                              )
                            }
                            className="px-3 py-2 text-sm text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition-colors duration-200"
                            title={t("common.delete")}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Customer Table */
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="mobile-table overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t("common.customer")}
                  </th>
                  <th className="hidden sm:table-cell px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t("common.address")}
                  </th>
                  <th className="hidden md:table-cell px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t("common.contact")}
                  </th>
                  <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t("common.contracts")}
                  </th>
                  <th className="hidden lg:table-cell px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t("common.contractBeginDate")}
                  </th>
                  <th className="px-3 sm:px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t("common.actions")}
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredCustomers.map((customer) => (
                  <tr key={customer.id} className="hover:bg-gray-50">
                    <td className="px-3 sm:px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {customer.customer_type === "individual"
                            ? `${customer.first_name} ${customer.last_name}`
                            : customer.company_name}
                        </div>
                        <div className="text-sm text-gray-500">
                          {customer.customer_type === "individual"
                            ? `${t("common.fatherName")}: ${
                                customer.father_name
                              }`
                            : `${t("common.voen")}: ${customer.voen}`}
                        </div>
                        <div className="mt-1">
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
                        {/* Mobile: Show address and phone inline */}
                        <div className="sm:hidden mt-2 space-y-1">
                          <div className="text-xs text-gray-600">
                            {customer.address}
                          </div>
                          <div className="text-xs text-gray-600">
                            {customer.phone}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="hidden sm:table-cell px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm text-gray-900">
                          {customer.address}
                        </div>
                        <div className="text-sm text-gray-500">
                          {customer.national_id}
                        </div>
                      </div>
                    </td>
                    <td className="hidden md:table-cell px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {customer.phone}
                      </div>
                      {customer.contacts && customer.contacts.length > 0 && (
                        <div className="text-sm text-gray-500">
                          {customer.contacts.length} {t("common.contacts")}
                        </div>
                      )}
                    </td>
                    <td className="px-3 sm:px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <CreditCard className="w-4 h-4 text-gray-400 mr-2" />
                        <span className="text-sm text-gray-900">
                          {getActiveContractsCount(customer.id)}
                        </span>
                      </div>
                      {/* Mobile: Show contract begin date */}
                      {getContractBeginDate(customer.id) && (
                        <div className="sm:hidden mt-1">
                          <div className="flex items-center">
                            <Calendar className="w-3 h-3 text-gray-400 mr-1" />
                            <span className="text-xs text-gray-500">
                              {formatDisplayDate(getContractBeginDate(customer.id)!)}
                            </span>
                          </div>
                        </div>
                      )}
                    </td>
                    <td className="hidden lg:table-cell px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {getContractBeginDate(customer.id) ? (
                        <div className="flex items-center">
                          <Calendar className="w-4 h-4 text-gray-400 mr-2" />
                          {formatDisplayDate(getContractBeginDate(customer.id)!)}
                        </div>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                    <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end space-x-1 sm:space-x-2">
                        <button
                          onClick={() => {
                            const firstContract = getFirstContract(customer.id);
                            if (firstContract) {
                              navigate(`/contracts/${firstContract.id}`);
                            } else {
                              navigate(`/customers/${customer.id}`);
                            }
                          }}
                          className="p-2 text-gray-400 hover:text-blue-600 rounded-lg hover:bg-gray-50"
                          title={t("common.viewDetails")}
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        {canEdit(user, "customers") && (
                          <button
                            onClick={() =>
                              navigate(`/customers/${customer.id}/edit`)
                            }
                            className="p-2 text-gray-400 hover:text-blue-600 rounded-lg hover:bg-gray-50"
                            title={t("common.editCustomer")}
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                        )}
                        {canDelete(user, "customers") && (
                          <button
                            onClick={() =>
                              handleDeleteClick(
                                customer.id || "",
                                customer.customer_type === "individual"
                                  ? `${customer.first_name} ${customer.last_name}`
                                  : customer.company_name ||
                                      t("common.unknownCompany")
                              )
                            }
                            className="p-2 text-gray-400 hover:text-red-600 rounded-lg hover:bg-red-50"
                            title={t("common.delete")}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {filteredCustomers.length === 0 && (
        <div className="text-center py-12">
          <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Search className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {t("common.noCustomersFound")}
          </h3>
          <p className="text-gray-500">
            {searchTerm
              ? t("common.tryAdjustingSearch")
              : t("common.getStartedByAdding")}
          </p>
          {canCreate(user, "customers") && (
            <button
              onClick={() => navigate("/customers/create")}
              className="mt-4 inline-flex items-center px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
            >
              <Plus className="w-4 h-4 mr-2" />
              {t("common.addCustomer")}
            </button>
          )}
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <DeleteConfirmationDialog
        isOpen={deleteDialog.isOpen}
        onClose={handleDeleteCancel}
        onConfirm={handleDeleteConfirm}
        title={t("pages.customers.deleteCustomer")}
        message={t("pages.customers.deleteConfirmation")}
        itemName={deleteDialog.customerName}
        isLoading={deleteDialog.isLoading}
      />
    </div>
  );
};

export default Customers;

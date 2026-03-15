import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "../i18n";
import { ArrowLeft, Save, Car } from "lucide-react";
import { getContractById, updateContract } from "../services/contracts";
import { getCompanies } from "../services/companies";
import { getCustomers } from "../services/customers";
import { getVehicles } from "../services/vehicles";
import { getPaymentsByContract } from "../services/payments";
import { Contract, ContractStatus, PaymentInterval, Driver } from "../types";
import { useData } from "../contexts/DataContext";
import ImprovedDateInput from "../components/ui/ImprovedDateInput";
import CustomerSelectionModal from "../components/CustomerSelectionModal";
import VehicleSelectionModal from "../components/VehicleSelectionModal";
import DriverManagement from "../components/DriverManagement";
import {
  getPermissionDocumentByContractId,
  upsertPermissionDocument,
  PermissionDocument,
} from "../services/permissionDocuments";
import {
  calculateContractDetails,
  validateContractCalculation,
  calculateContractEndDate,
} from "../utils/contractUtils";
import { calculateNextDueDateFromStartDate } from "../utils/paymentIntervalUtils";
import { createPayment } from "../services/payments";
import { showApiError, showApiSuccess } from "../utils/errorHandler";
import { showError } from "../services/notifications";

/** Müştəri adı: şirkətdirsə company_name, fiziki şəxsdirsə ad + soyad (null null qarşısını alır). */
function getCustomerDisplayName(customer: { customer_type?: string; company_name?: string | null; first_name?: string | null; last_name?: string | null } | null | undefined): string {
  if (!customer) return "";
  if (customer.customer_type === "company" && customer.company_name) return customer.company_name;
  const full = [customer.first_name, customer.last_name].filter(Boolean).join(" ").trim();
  return full || (customer.company_name ?? "") || "";
}

const ContractEdit: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { t } = useTranslation();
  const { loadContracts, loadPayments } = useData();

  // State for data loading
  const [companies, setCompanies] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [selectedCompany, setSelectedCompany] = useState<any>(null);
  const [payments, setPayments] = useState<any[]>([]);

  const [loading, setLoading] = useState(true);
  const [contract, setContract] = useState<Contract | null>(null);
  const [formData, setFormData] = useState({
    customer_id: "",
    company_id: "",
    selected_vehicle_id: "",
    vehicle: {
      license_plate: "",
      make: "",
      model: "",
      year: new Date().getFullYear(),
      color: "",
    },
    down_payment: 0,
    yearly_interest_rate: 20,
    term_months: 36,
    monthly_payment: 0,
    total_payable: 0,
    start_date: new Date().toISOString().split("T")[0],
    payment_start_date: new Date().toISOString().split("T")[0],
    next_due_date: new Date().toISOString().split("T")[0],
    end_date: "",
    status: ContractStatus.ACTIVE,
    remaining_balance: 0,
    months_already_paid: 0,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // State for customer selection modal
  const [isCustomerSelectionModalOpen, setIsCustomerSelectionModalOpen] =
    useState(false);
  const [selectedCustomerForModal, setSelectedCustomerForModal] =
    useState<any>(null);

  // State for vehicle selection modal
  const [isVehicleSelectionModalOpen, setIsVehicleSelectionModalOpen] =
    useState(false);
  const [selectedVehicleForModal, setSelectedVehicleForModal] =
    useState<any>(null);

  // State for permission document and drivers
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [permissionBeginDate, setPermissionBeginDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [permissionEndDate, setPermissionEndDate] = useState("");

  // Load all data
  useEffect(() => {
    const loadData = async () => {
      try {
        const [companiesData, customersData, vehiclesData] = await Promise.all([
          getCompanies(),
          getCustomers(),
          getVehicles(),
        ]);

        setCompanies(companiesData);
        setCustomers(customersData);
        setVehicles(vehiclesData);
      } catch (error) {
        showError(t('apiErrors.general.loadFailed'));
      }
    };

    loadData();
  }, []);

  useEffect(() => {
    const fetchContract = async () => {
      if (!id) return;

      try {
        const [contractData, contractPayments] = await Promise.all([
          getContractById(id),
          getPaymentsByContract(id),
        ]);

        if (contractData) {
          setContract(contractData as unknown as Contract);
          setPayments(contractPayments || []);

          // Calculate total paid from actual payments
          const totalPaid =
            contractPayments?.reduce(
              (sum, payment) => sum + payment.amount,
              0
            ) || 0;

          // Calculate end date using the utility function

          // Find the vehicle ID based on the vehicle data
          const matchingVehicle = vehicles.find(
            (v) =>
              v.license_plate === contractData.vehicle?.license_plate &&
              v.make === contractData.vehicle?.make &&
              v.model === contractData.vehicle?.model
          );

          // Find the selected customer for the modal
          const selectedCustomer = customers.find(
            (c) => c.id === contractData.customer_id
          );
          if (selectedCustomer) {
            setSelectedCustomerForModal(selectedCustomer);
          }

          // Calculate next due date immediately when contract is loaded
          const baseDate = new Date(contractData.start_date);
          const paymentsCount = contractData.payments_count || 0;
          const nextDueDate = calculateNextDueDateFromStartDate(
            baseDate,
            paymentsCount,
            PaymentInterval.MONTHLY
          );

          setFormData({
            customer_id: contractData.customer_id,
            company_id: contractData.company_id,
            selected_vehicle_id: matchingVehicle?.id || "", // Set the actual vehicle ID
            vehicle: {
              license_plate: contractData.vehicle?.license_plate || "",
              make: contractData.vehicle?.make || "",
              model: contractData.vehicle?.model || "",
              year: contractData.vehicle?.year || new Date().getFullYear(),
              color: contractData.vehicle?.color || "",
            },

            down_payment: contractData.down_payment,
            yearly_interest_rate: contractData.yearly_interest_rate || 20, // Use contract rate or default
            term_months: contractData.term_months,
            monthly_payment: contractData.monthly_payment,
            total_payable: contractData.total_payable,
            start_date: new Date(contractData.start_date)
              .toISOString()
              .split("T")[0],
            payment_start_date: new Date(contractData.payment_start_date)
              .toISOString()
              .split("T")[0],
            next_due_date: nextDueDate.toISOString().split("T")[0], // Set calculated next due date immediately
            end_date: "",
            status: contractData.status as ContractStatus,
            remaining_balance: contractData.remaining_balance,
            months_already_paid: paymentsCount, // This should represent only regular payments
          });
        }
      } catch (error) {
        console.error("Error fetching contract:", error);
        showApiError(error, 'contract');
      } finally {
        setLoading(false);
      }
    };

    if (vehicles.length > 0 && customers.length > 0) {
      fetchContract();
    }
  }, [id, vehicles, customers]);

  // Set the selected company when component mounts
  useEffect(() => {
    if (selectedCompany && !formData.company_id) {
      setFormData((prev) => ({
        ...prev,
        company_id: selectedCompany,
      }));
    }
  }, [selectedCompany, formData.company_id]);

  // Update selectedCompany when user changes company in form
  useEffect(() => {
    if (formData.company_id && formData.company_id !== selectedCompany) {
      setSelectedCompany(formData.company_id);
    }
  }, [formData.company_id, selectedCompany]);

  // Calculate permission end date based on payment start date
  useEffect(() => {
    if (formData.payment_start_date) {
      const paymentStartDate = new Date(formData.payment_start_date);
      const nextPaymentDate = new Date(paymentStartDate);
      nextPaymentDate.setMonth(nextPaymentDate.getMonth() + 1);

      setPermissionEndDate(nextPaymentDate.toISOString().split("T")[0]);
    }
  }, [formData.payment_start_date]);

  // Calculate monthly payment whenever relevant fields change
  useEffect(() => {
    // Only calculate if we have valid values
    if (
      formData.down_payment > 0 &&
      formData.term_months > 0 &&
      formData.yearly_interest_rate >= 0
    ) {
      // Validate inputs first
      const validation = validateContractCalculation(
        formData.down_payment,
        formData.yearly_interest_rate,
        formData.term_months
      );

      if (validation.isValid) {
        // Use enhanced calculation utility
        const calculation = calculateContractDetails(
          formData.down_payment,
          formData.yearly_interest_rate,
          formData.term_months
        );

        // Calculate remaining balance accounting for existing payments
        let actualRemainingBalance = calculation.totalPayable;

        // Calculate total paid from actual payments for accuracy
        const totalPaidFromPayments = payments.reduce(
          (sum, payment) => sum + payment.amount,
          0
        );

        if (totalPaidFromPayments > 0) {
          // Account for payments already made
          actualRemainingBalance = Math.max(
            0,
            calculation.totalPayable - totalPaidFromPayments
          );
        }

        setFormData((prev) => ({
          ...prev,
          monthly_payment: calculation.monthlyPayment,
          total_payable: calculation.totalPayable,
          remaining_balance: actualRemainingBalance,
        }));
      } else {
        // Reset calculated fields if validation fails
        setFormData((prev) => ({
          ...prev,
          monthly_payment: 0,
          total_payable: 0,
          remaining_balance: 0,
        }));
      }
    } else {
      // Reset calculated fields if inputs are invalid
      setFormData((prev) => ({
        ...prev,
        monthly_payment: 0,
        total_payable: 0,
        remaining_balance: 0,
      }));
    }
  }, [
    formData.down_payment,
    formData.yearly_interest_rate,
    formData.term_months,
    loading,
    contract?.total_paid,
    payments,
  ]);

  // Calculate end date when payment start date or term months change
  useEffect(() => {
    if (formData.payment_start_date && formData.term_months > 0) {
      const paymentStartDate = new Date(formData.payment_start_date);
      const endDate = calculateContractEndDate(
        paymentStartDate,
        formData.term_months
      );

      setFormData((prev) => ({
        ...prev,
        end_date: endDate.toISOString().split("T")[0],
      }));
    }
  }, [formData.payment_start_date, formData.term_months]);

  // Auto-set payment start date to one month after start date
  useEffect(() => {
    if (formData.start_date) {
      const startDate = new Date(formData.start_date);
      const paymentStartDate = new Date(startDate);
      paymentStartDate.setMonth(paymentStartDate.getMonth() + 1);

      setFormData((prev) => ({
        ...prev,
        payment_start_date: paymentStartDate.toISOString().split("T")[0],
      }));
    }
  }, [formData.start_date]);

  // Auto-set permission end date to one month after begin date
  useEffect(() => {
    if (permissionBeginDate) {
      const beginDate = new Date(permissionBeginDate);
      const endDate = new Date(beginDate);
      endDate.setMonth(endDate.getMonth() + 1);

      setPermissionEndDate(endDate.toISOString().split("T")[0]);
    }
  }, [permissionBeginDate]);

  // Reset months_already_paid if term_months becomes less than months_already_paid
  useEffect(() => {
    if (formData.months_already_paid > formData.term_months) {
      setFormData((prev) => ({
        ...prev,
        months_already_paid: 0,
      }));
    }
  }, [formData.term_months]);

  // Calculate next due date when start date, payment start date, or months_already_paid changes
  useEffect(() => {
    if ((formData.start_date || formData.payment_start_date) && !loading) {
      // Use start_date as the base for calculation if available, otherwise use payment_start_date
      const baseDate = formData.start_date
        ? new Date(formData.start_date)
        : new Date(formData.payment_start_date);
      const nextDueDate = calculateNextDueDateFromStartDate(
        baseDate,
        formData.months_already_paid || 0,
        PaymentInterval.MONTHLY
      );

      const newNextDueDate = nextDueDate.toISOString().split("T")[0];

      // Only update if the calculated date is different from current
      if (newNextDueDate !== formData.next_due_date) {
        setFormData((prev) => {
          return {
            ...prev,
            next_due_date: newNextDueDate,
          };
        });
      }
    }
  }, [
    formData.start_date,
    formData.payment_start_date,
    formData.months_already_paid,
    loading,
  ]);

  // Load permission document when contract is loaded
  useEffect(() => {
    const loadPermissionDocument = async () => {
      if (contract?.id) {
        try {
          // First try to use permission document from contract data
          if (contract.permission_document) {
            setDrivers(contract.permission_document.drivers || []);
            setPermissionBeginDate(
              (contract.permission_document as any).begin_date ||
                new Date().toISOString().split("T")[0]
            );
            setPermissionEndDate(
              (contract.permission_document as any).end_date ||
                new Date().toISOString().split("T")[0]
            );
          } else {
            // Fallback to fetching separately if not included in contract data
            const permissionDoc = await getPermissionDocumentByContractId(
              contract.id
            );
            if (permissionDoc) {
              setDrivers(permissionDoc.drivers as Driver[]);
              setPermissionBeginDate(
                permissionDoc.begin_date ||
                  new Date().toISOString().split("T")[0]
              );
              setPermissionEndDate(
                permissionDoc.end_date || new Date().toISOString().split("T")[0]
              );
            }
          }
        } catch (error) {
          // Permission document loading failed, continue without it
        }
      }
    };

    loadPermissionDocument();
  }, [contract?.id, contract?.permission_document]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      if (!contract) return;

      // Calculate next payment date based on payment interval using utility function
      // Use start_date as the base for calculation if available, otherwise use payment_start_date
      const baseDate = formData.start_date
        ? new Date(formData.start_date)
        : new Date(formData.payment_start_date);
      const nextDueDate = calculateNextDueDateFromStartDate(
        baseDate,
        formData.months_already_paid || 0,
        PaymentInterval.MONTHLY
      );

      const selectedCompany = companies.find(
        (c) => c.id === formData.company_id
      );
      const selectedCustomer = customers.find(
        (c) => c.id === formData.customer_id
      );

      if (!selectedCompany || !selectedCustomer) {
        throw new Error("Selected company or customer not found");
      }

      // Calculate total paid from actual payments for final update
      const totalPaidFromPayments = payments.reduce(
        (sum, payment) => sum + payment.amount,
        0
      );

      const updatedContract = {
        company_id: formData.company_id,
        customer_id: formData.customer_id,
        vehicle_id: formData.selected_vehicle_id,
        standard_purchase_price: formData.down_payment,
        down_payment: formData.down_payment,
        yearly_interest_rate: formData.yearly_interest_rate,
        term_months: formData.term_months,
        monthly_payment: formData.monthly_payment,
        total_payable: formData.total_payable,
        remaining_balance: formData.remaining_balance,
        total_paid: totalPaidFromPayments, // Update total_paid with actual payments
        start_date: new Date(formData.start_date).toISOString(),
        payment_start_date: new Date(formData.payment_start_date).toISOString(),
        next_due_date: nextDueDate.toISOString(),
        status: formData.status as
          | "active"
          | "completed"
          | "defaulted"
          | "cancelled",
        payment_interval: "monthly" as any,
        payments_count: formData.months_already_paid,
      };

      const updatedContractResult = await updateContract(
        contract.id,
        updatedContract
      );

      // Create payment records only for additional months that weren't already paid
      const originalPaymentCount = contract.payments_count || 0;
      const additionalPayments =
        formData.months_already_paid - originalPaymentCount;

      if (additionalPayments > 0) {
        try {
          for (
            let month = originalPaymentCount;
            month < formData.months_already_paid;
            month++
          ) {
            const baseDate = formData.start_date
              ? new Date(formData.start_date)
              : new Date(formData.payment_start_date);
            const paymentDate = new Date(baseDate);
            paymentDate.setMonth(paymentDate.getMonth() + month);

            const dueDate = new Date(baseDate);
            dueDate.setMonth(dueDate.getMonth() + month + 1); // due = next month after payment period

            const paymentData = {
              contractId: contract.id,
              customerId: formData.customer_id,
              companyId: formData.company_id,
              amount: formData.monthly_payment,
              dateISO: paymentDate.toISOString().split("T")[0], // YYYY-MM-DD for API
              dueDate: dueDate.toISOString().split("T")[0],
              paymentPeriod: month + 1,
              methodUI: "cash",
              isExtra: false,
              isPartial: false,
              notes: `Payment for month ${
                month + 1
              } (created during contract edit)`,
              daysLate: 0,
            };

            await createPayment(paymentData);
          }

          // Check if the payments_count was automatically updated by database triggers
          const contractAfterPayments = await getContractById(contract.id);
          // If the payments_count was overridden by database triggers, force update it again
          if (
            contractAfterPayments?.payments_count !==
            formData.months_already_paid
          ) {
            await updateContract(contract.id, {
              payments_count: formData.months_already_paid,
            });
          }
        } catch (paymentError) {
          console.error("Payment records creation failed:", paymentError);
          showApiError(
            paymentError instanceof Error ? paymentError : new Error(String(paymentError)),
            "payment"
          );
        }
      } 

      // Save permission document (always save to handle both adding and removing drivers)
      if (contract.id) {
        const permissionDoc: PermissionDocument = {
          contract_id: contract.id,
          begin_date: permissionBeginDate,
          end_date: permissionEndDate,
          drivers: drivers,
        };

        await upsertPermissionDocument(permissionDoc);
      }

      // Final check: Get the contract one more time to see the final state
      const finalContract = await getContractById(contract.id);
      // Refresh contracts and payments data before navigating
      await Promise.all([
        loadContracts(),
        loadPayments({ contract_id: contract.id })
      ]);

      // Show success message
      showApiSuccess(t('notifications.updated', { entity: t('common.contract') }), 'contract');
      
      // Navigate to contract detail page after successful update
      navigate(`/contracts/${contract.id}`);
    } catch (error) {
      if (error instanceof Error) {
        if (error.message === "Vehicle is already in an active contract") {
          showApiError(t('apiErrors.contract.vehicleNotAvailable'), 'contract');
        } else {
          showApiError(error, 'contract');
        }
      } else {
        showApiError(error, 'contract');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;

    if (name === "selected_vehicle_id") {
      const selectedVehicle = vehicles.find((v) => v.id === value);
      if (selectedVehicle) {
        setFormData((prev) => ({
          ...prev,
          selected_vehicle_id: value,
          vehicle: selectedVehicle,
        }));
      }
    } else if (name.startsWith("vehicle.")) {
      const vehicleField = name.split(".")[1];
      setFormData((prev) => ({
        ...prev,
        vehicle: {
          ...prev.vehicle,
          [vehicleField]: type === "number" ? parseInt(value) : value,
        },
      }));
    } else if (name === "months_already_paid") {
      // Special handling for months_already_paid to preserve original value when empty
      const numericValue =
        value === "" ? contract?.payments_count || 0 : parseFloat(value);
      setFormData((prev) => ({
        ...prev,
        [name]: numericValue,
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: type === "number" ? parseFloat(value) : value,
      }));
    }
  };

  const handleCustomerSelect = (customer: any) => {
    setSelectedCustomerForModal(customer);
    setFormData((prev) => ({
      ...prev,
      customer_id: customer.id,
    }));
  };

  const handleVehicleSelect = (vehicle: any) => {
    setSelectedVehicleForModal(vehicle);
    setFormData((prev) => ({
      ...prev,
      selected_vehicle_id: vehicle.id,
      vehicle: {
        ...prev.vehicle,
        license_plate: vehicle.license_plate,
        make: vehicle.make,
        model: vehicle.model,
        year: vehicle.year,
        color: vehicle.color,
        body_number: vehicle.body_number,
        engine: vehicle.engine,
      },
    }));
  };

  const handleOpenCustomerModal = () => {
    setIsCustomerSelectionModalOpen(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">{t("common.loading")}</p>
        </div>
      </div>
    );
  }

  if (!contract) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="bg-red-50 border border-red-200 rounded-md p-6">
            <p className="text-red-600">{t("common.contractNotFound")}</p>
            <button
              onClick={() => navigate("/contracts")}
              className="mt-4 px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md shadow-sm hover:bg-blue-700"
            >
              {t("common.backToContracts")}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Filter available vehicles (not in active contracts, except current contract)
  const availableVehicles = vehicles.filter((vehicle) => {
    // Filter by company first
    if (formData.company_id && vehicle.company_id !== formData.company_id) {
      return false;
    }

    // Always include the currently selected vehicle (for editing purposes)
    if (vehicle.id === formData.selected_vehicle_id) {
      return true;
    }

    // For now, show all vehicles for the selected company
    // The vehicle availability check can be added later if needed
    return true;
  });

  return (
    <div className="w-full space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-4" data-guide-id="contract-edit-header">
        <button
          onClick={() => navigate("/contracts")}
          className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-50"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {t("common.editContract")}
          </h1>
          <p className="text-gray-600">
            {t("common.updateContractInformation")}
          </p>
        </div>
      </div>

      {/* Form */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6" data-guide-id="contract-edit-form">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-md p-4">
              {error}
            </div>
          )}

          {/* Company and Customer Selection */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="company_id"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                {t("common.company")} *
              </label>
              <select
                id="company_id"
                name="company_id"
                value={formData.company_id}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">{t("common.selectACompany")}</option>
                {companies.map((company) => (
                  <option key={company.id} value={company.id}>
                    {company.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t("common.customer")} *
              </label>
              <div className="space-y-2">
                <button
                  type="button"
                  onClick={handleOpenCustomerModal}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-left bg-white hover:bg-gray-50 transition-colors"
                >
                  {selectedCustomerForModal ? (
                    <span className="text-gray-900">
                      {getCustomerDisplayName(selectedCustomerForModal) || t("common.unknownCustomer")} –{" "}
                      {selectedCustomerForModal.customer_type === "company"
                        ? (selectedCustomerForModal.voen || t("common.noId"))
                        : (selectedCustomerForModal.national_id || t("common.noId"))}
                    </span>
                  ) : (
                    <span className="text-gray-500">
                      {t("common.selectACustomer")}
                    </span>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Vehicle Selection */}
          <div className="border-t border-gray-200 pt-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">
                {t("common.vehicleInformation")}
              </h3>
              <button
                type="button"
                onClick={() => navigate("/vehicles/create")}
                className="inline-flex items-center px-3 py-1 text-sm font-medium text-blue-600 hover:text-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <Car className="w-4 h-4 mr-1" />
                {t("common.addVehicle")}
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t("common.vehicle")} *
                </label>
                <div className="space-y-2">
                  <button
                    type="button"
                    onClick={() => setIsVehicleSelectionModalOpen(true)}
                    disabled={!formData.company_id}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-left bg-white hover:bg-gray-50 transition-colors disabled:bg-gray-100 disabled:cursor-not-allowed"
                  >
                    {selectedVehicleForModal ? (
                      <span className="text-gray-900">
                        {selectedVehicleForModal.license_plate} -{" "}
                        {selectedVehicleForModal.make}{" "}
                        {selectedVehicleForModal.model} (
                        {selectedVehicleForModal.year})
                      </span>
                    ) : (
                      <span className="text-gray-500">
                        {!formData.company_id
                          ? t("common.selectACompanyFirst")
                          : t("common.selectAVehicle")}
                      </span>
                    )}
                  </button>
                  {!formData.company_id && (
                    <p className="mt-1 text-sm text-gray-500">
                      {t("common.selectCompanyToSeeVehicles")}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Selected Vehicle Details */}
            {formData.selected_vehicle_id && (
              <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                <h4 className="text-sm font-medium text-gray-700 mb-2">
                  {t("common.selectedVehicle")}
                </h4>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
                  <div>
                    <span className="font-medium text-gray-600">
                      {t("common.licensePlate")}:
                    </span>
                    <span className="ml-2 text-gray-900">
                      {formData.vehicle.license_plate}
                    </span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-600">
                      {t("common.make")}:
                    </span>
                    <span className="ml-2 text-gray-900">
                      {formData.vehicle.make}
                    </span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-600">
                      {t("common.model")}:
                    </span>
                    <span className="ml-2 text-gray-900">
                      {formData.vehicle.model}
                    </span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-600">
                      {t("common.year")}:
                    </span>
                    <span className="ml-2 text-gray-900">
                      {formData.vehicle.year}
                    </span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-600">
                      {t("common.color")}:
                    </span>
                    <span className="ml-2 text-gray-900">
                      {formData.vehicle.color}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Financial Information */}
          <div className="border-t border-gray-200 pt-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              {t("common.financialInformation")}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label
                  htmlFor="down_payment"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  {t("common.downPayment")} *
                </label>
                <input
                  type="number"
                  id="down_payment"
                  name="down_payment"
                  value={formData.down_payment || ""}
                  onChange={handleChange}
                  min="0"
                  step="0.01"
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="0.00"
                />
              </div>
              <div>
                <label
                  htmlFor="term_months"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  {t("common.termMonths")} *
                </label>
                <input
                  type="number"
                  id="term_months"
                  name="term_months"
                  value={formData.term_months}
                  onChange={handleChange}
                  min="1"
                  max="120"
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label
                  htmlFor="yearly_interest_rate"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  {t("common.yearlyInterestRatePercent")} *
                </label>
                <input
                  type="number"
                  id="yearly_interest_rate"
                  name="yearly_interest_rate"
                  value={formData.yearly_interest_rate || ""}
                  onChange={handleChange}
                  min="0"
                  max="100"
                  step="0.01"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="0.00 (0% faiz için 0 girin)"
                />
                <p className="text-xs text-gray-500 mt-1">
                  {t("common.yearlyInterestRateDescription") || "0% faiz oranı için 0 girin. Bu durumda aylık ödeme basit bölme ile hesaplanır."}
                </p>
              </div>
              <div>
                <label
                  htmlFor="months_already_paid"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  {t("common.monthsAlreadyPaid")}
                </label>
                <input
                  type="number"
                  id="months_already_paid"
                  name="months_already_paid"
                  value={formData.months_already_paid || ""}
                  onChange={handleChange}
                  min="0"
                  max={formData.term_months}
                  step="1"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder={`${contract?.payments_count || 0}`}
                />
                <p className="text-xs text-gray-500 mt-1">
                  {t("common.monthsAlreadyPaidDescription")}
                </p>
              </div>

              <div>
                <label
                  htmlFor="monthly_payment"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  {t("common.monthlyPaymentCalculated")}
                </label>
                <input
                  type="number"
                  id="monthly_payment"
                  name="monthly_payment"
                  value={
                    formData.monthly_payment
                      ? Number(formData.monthly_payment).toFixed(2)
                      : "0.00"
                  }
                  readOnly
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-700"
                  placeholder="0.00"
                />
                <p className="text-xs text-gray-500 mt-1">
                  {t("common.automaticallyCalculated")}
                </p>
              </div>
              <div>
                <label
                  htmlFor="total_payable"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  {t("common.totalPayableCalculated")}
                </label>
                <input
                  type="number"
                  id="total_payable"
                  name="total_payable"
                  value={
                    formData.total_payable
                      ? Number(formData.total_payable).toFixed(2)
                      : "0.00"
                  }
                  readOnly
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-700"
                  placeholder="0.00"
                />
                <p className="text-xs text-gray-500 mt-1">
                  {t("common.downPaymentPlusMonthly")}
                </p>
              </div>
            </div>
          </div>

          {/* Date Information */}
          <div className="border-t border-gray-200 pt-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              {t("common.dateInformation")}
            </h3>

            {/* Helpful message */}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <ImprovedDateInput
                  value={formData.start_date}
                  onChange={(value) =>
                    setFormData((prev) => ({ ...prev, start_date: value }))
                  }
                  label={t("common.startDate")}
                  required
                  placeholder="Başlama tarixini seçin"
                />
              </div>
              {/* <div>
                <ImprovedDateInput
                  value={formData.payment_start_date}
                  onChange={(value) => setFormData(prev => ({ ...prev, payment_start_date: value }))}
                  label={t('common.paymentStartDate')}
                  required
                  placeholder="Ödəniş başlama tarixini seçin"
                />
                <p className="text-xs text-gray-500 mt-1">
                  {t('common.autoSetOneMonthAfter')}
                </p>
              </div>
              */}
              <div>
                <ImprovedDateInput
                  value={formData.next_due_date || ""}
                  onChange={() => {}} // Disabled field, no onChange needed
                  label={t("common.nextDueDate")}
                  placeholder="Auto-calculated"
                  disabled
                  disableClear
                />
                <p className="text-xs text-gray-500 mt-1">
                  {t("common.autoCalculatedBasedOnPaymentInterval")}
                  <span className="block mt-1">
                    {t("common.nextDueDateFromStartOrPaymentStart")}
                  </span>
                  {contract && (
                    <span className="block mt-1">
                      {t("common.nextDueDateBasedOnPaymentsCount", {
                        count: contract.payments_count || 0,
                      })}
                    </span>
                  )}
                </p>
              </div>
            </div>
          </div>

          {/* Contract Status */}
          <div className="border-t border-gray-200 pt-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              {t("common.contractStatus")}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="status"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  {t("common.status")} *
                </label>
                <select
                  id="status"
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value={ContractStatus.ACTIVE}>
                    {t("common.active")}
                  </option>
                  <option value={ContractStatus.COMPLETED}>
                    {t("common.completed")}
                  </option>
                  <option value={ContractStatus.IMTINA_EDILMIS}>
                    {t("common.imtina_edilmis")}
                  </option>
                  <option value={ContractStatus.ALQI_SATQI}>
                    {t("common.alqi_satqi")}
                  </option>
                </select>
              </div>
            </div>
          </div>

          {/* Permission Document Section */}
          <div className="border-t border-gray-200 pt-6" data-guide-id="contract-edit-extra-drivers">
            {/* Driver Management */}
            <DriverManagement
              drivers={drivers}
              onDriversChange={setDrivers}
              disabled={isSubmitting}
            />
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-md p-4 text-red-600">
              {error}
            </div>
          )}

          {/* Submit Button */}
          <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={() => navigate("/contracts")}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              {t("common.cancel")}
            </button>
            <button
              type="submit"
              data-guide-id="contract-edit-save"
              disabled={
                isSubmitting || !formData.customer_id || !formData.company_id
              }
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Save className="w-4 h-4 mr-2" />
              {isSubmitting ? t("common.updating") : t("common.updateContract")}
            </button>
          </div>
        </form>
      </div>

      {/* Customer Selection Modal */}
      <CustomerSelectionModal
        isOpen={isCustomerSelectionModalOpen}
        onClose={() => setIsCustomerSelectionModalOpen(false)}
        customers={customers}
        onSelect={handleCustomerSelect}
        selectedCompanyId={formData.company_id}
      />

      {/* Vehicle Selection Modal */}
      <VehicleSelectionModal
        isOpen={isVehicleSelectionModalOpen}
        onClose={() => setIsVehicleSelectionModalOpen(false)}
        onSelect={handleVehicleSelect}
        vehicles={vehicles}
        selectedCompanyId={formData.company_id}
      />
    </div>
  );
};

export default ContractEdit;

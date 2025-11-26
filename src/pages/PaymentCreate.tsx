import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useTranslation } from "../i18n";
import { useData } from "../contexts/DataContext";

import { Payment, PaymentMethod } from "../types";
import {
  Car,
  User,
  Calendar,
  AlertTriangle,
  Building2,
  ArrowLeft,
  Search,
  ChevronDown,
  X,
} from "lucide-react";
// import GoogleDriveFileUpload from '../components/GoogleDriveFileUpload';
import { addMonths } from "date-fns";
import DatePicker from "../components/ui/DatePicker";
import { roundPaymentAmount, roundInterestAmount, roundPrincipalAmount } from "../utils/customRoundingUtils";
import { formatDisplayDate } from "../utils/dateUtils";
import {
  calculatePaymentDetailsWithPartialPayments,
  getInterestRateDisplay,
  calculateOverduePartialPaymentBreakdown,
  calculateFuturePaymentAfterPartial,
} from "../utils/paymentUtils";
import { calculateCorrectNextDueDate } from "../utils/contractUtils";
import { getPermissionDocumentByContractId } from "../services/permissionDocuments";
import { showApiError, showApiSuccess } from "../utils/errorHandler";
// import { printEtibarname } from '../utils/etibarnameUtils';
import PaymentSuccessModal from "../components/PaymentSuccessModal";
import { testPartialPaymentCalculationFix } from "../utils/testPartialPaymentFix";

const PaymentCreate: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { t } = useTranslation();
  const {
    contracts,
    customers,
    companies,
    payments,
    addPayment,
    contractsLoading,
    paymentsLoading,
    loadContracts,
    loadPayments,
  } = useData();

  // Debug: Log user information


  // Force refresh contract data when component mounts to ensure we have latest values
  useEffect(() => {
    loadContracts();
    
    // Test the partial payment calculation fix
    console.log('🧪 Running partial payment calculation test...');
    testPartialPaymentCalculationFix();
  }, [loadContracts]);

  // Load payments when component mounts to ensure we have payment data
  useEffect(() => {
    if (payments.length === 0 && !paymentsLoading) {
      loadPayments();
    }
  }, [payments.length, paymentsLoading]); // Removed loadPayments from dependencies to prevent infinite loop

  const searchInputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const [formData, setFormData] = useState({
    contractId: "",
    amount: "",
    paymentDate: new Date().toISOString().split("T")[0],
    paymentMethod: PaymentMethod.CASH,
    notes: "",
  });
  const [isPartialPayment, setIsPartialPayment] = useState(false);
  const [isExtraPayment, setIsExtraPayment] = useState(false);
  const [treatAsOnTime, setTreatAsOnTime] = useState(false);
  const [autoExtraPayment, setAutoExtraPayment] = useState(false);
  const [extraPaymentAmount, setExtraPaymentAmount] = useState(0);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [selectedContract, setSelectedContract] = useState<any>(null);
  const [paymentCalculation, setPaymentCalculation] = useState({
    baseAmount: 0,
    overdueDays: 0,
    overduePenalty: 0,
    totalAmount: 0,
    isOverdue: false,
    sophisticatedBreakdown: null as any,
    partialPaymentBreakdown: null as any,
  });
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [createdPayment, setCreatedPayment] = useState<Payment | null>(null);
  const [createdExtraPayment, setCreatedExtraPayment] = useState<Payment | null>(null);
  const [totalPaidAmount, setTotalPaidAmount] = useState<number>(0);
  const [contractDrivers, setContractDrivers] = useState<any[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Helper function to round amounts to 2 decimal places for display
  const roundAmount = (amount: number): number => {
    return roundPaymentAmount(amount);
  };

  // Contract search states
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredContracts, setFilteredContracts] = useState<any[]>(contracts);
  const [selectedIndex, setSelectedIndex] = useState(-1);

  // Load contracts if not already loaded
  useEffect(() => {
    if (contracts.length === 0 && !contractsLoading) {
      loadContracts();
    }
  }, [contracts.length, contractsLoading]); // Removed loadContracts from dependencies to prevent infinite loop

  // Update filtered contracts when contracts data is loaded
  // Only show active contracts for payment creation
  useEffect(() => {
    const activeContracts = contracts.filter((contract) =>
      ["active", "open", "defaulted"].includes(contract.status)
    );
    
    // const completedContracts = contracts.filter((contract) =>
    //   contract.status === "completed"
    // );
    
    setFilteredContracts(activeContracts);
  }, [contracts, customers]);

  // Filter contracts based on search term
  useEffect(() => {
    // First filter to only active contracts
    const activeContracts = contracts.filter((contract) =>
      ["active", "open", "defaulted"].includes(contract.status)
    );

    if (!searchTerm.trim()) {
      setFilteredContracts(activeContracts);
    } else {
      const filtered = activeContracts.filter((contract) => {
        const customer = customers.find((c) => c.id === contract.customer_id);
        const customerName = customer
          ? `${customer.first_name} ${customer.last_name} ${customer.father_name}`.toLowerCase()
          : "";
        const licensePlate =
          contract.vehicle?.license_plate?.toLowerCase() || "";
        const vehicleInfo = contract.vehicle
          ? `${contract.vehicle.make} ${contract.vehicle.model}`.toLowerCase()
          : "";

        return (
          licensePlate.includes(searchTerm.toLowerCase()) ||
          customerName.includes(searchTerm.toLowerCase()) ||
          vehicleInfo.includes(searchTerm.toLowerCase())
        );
      });
      setFilteredContracts(filtered);
    }
    setSelectedIndex(-1); // Reset selection when filtering
  }, [searchTerm, contracts, customers]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsDropdownOpen(false);
        setSelectedIndex(-1);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Focus search input when dropdown opens
  useEffect(() => {
    if (isDropdownOpen && searchInputRef.current) {
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 100);
    }
  }, [isDropdownOpen]);

  // Handle contractId from URL parameters
  useEffect(() => {
    const contractIdFromUrl = searchParams.get("contractId");
    if (contractIdFromUrl && contracts.length > 0) {
      const contract = contracts.find((c) => c.id === contractIdFromUrl);
      if (contract) {
        setFormData((prev) => ({ ...prev, contractId: contract.id }));
        setSelectedContract(contract);
      }
    }
  }, [searchParams, contracts]);

  // Calculate payment details when contract is selected
  useEffect(() => {
    if (formData.contractId) {
      const contract = contracts.find((c) => c.id === formData.contractId);
      if (contract) {
        // Use the contract data directly since it should now have complete vehicle information
        // The getActiveContracts function has been updated to include all vehicle fields
        setSelectedContract(contract);

        // Load default drivers from permission document for this contract
        (async () => {
          try {
            await getPermissionDocumentByContractId(contract.id);
          } catch (e) {
            console.error("Failed to load default drivers for contract", e);
          }
        })();

        // Note: Payment calculation will be updated when selectedContract is set with complete data
      }
    } else {
      setSelectedContract(null);
      setPaymentCalculation({
        baseAmount: 0,
        overdueDays: 0,
        overduePenalty: 0,
        totalAmount: 0,
        isOverdue: false,
        sophisticatedBreakdown: null,
        partialPaymentBreakdown: null,
      });
    }
  }, [
    formData.contractId,
    formData.paymentDate,
    contracts,
    treatAsOnTime,
    companies,
    isPartialPayment,
  ]);

  // Auto-detect extra payment when amount exceeds required payment
  useEffect(() => {
    if (selectedContract && formData.amount && !isPartialPayment && !isExtraPayment) {
      const enteredAmount = parseFloat(formData.amount);
      const requiredAmount = treatAsOnTime 
        ? paymentCalculation.baseAmount 
        : paymentCalculation.totalAmount;
      
      if (enteredAmount > requiredAmount) {
        const extraAmount = enteredAmount - requiredAmount;
        setAutoExtraPayment(true);
        setExtraPaymentAmount(extraAmount);
      } else {
        setAutoExtraPayment(false);
        setExtraPaymentAmount(0);
      }
    } else {
      setAutoExtraPayment(false);
      setExtraPaymentAmount(0);
    }
  }, [formData.amount, selectedContract, paymentCalculation, treatAsOnTime, isPartialPayment, isExtraPayment]);

  // Calculate payment details when selectedContract changes (with complete data)
  useEffect(() => {
    if (selectedContract && selectedContract.vehicle && !paymentsLoading) {
      // Use form payment date if available, otherwise use current date
      const paymentDate = formData.paymentDate ? new Date(formData.paymentDate) : new Date();
      // Try to find company in the companies array first
      let company = companies.find(
        (c) => c.id === selectedContract.company_id
      );

      // If company not found in companies array (user might not have access),
      // create a fallback company object using contract data and defaults
      if (!company && selectedContract.company) {
        company = {
          id: selectedContract.company_id,
          name: selectedContract.company.name || 'Unknown Company',
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

      // If still no company found, create a minimal fallback
      if (!company) {
        company = {
          id: selectedContract.company_id,
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

      if (company) {
        // Debug: Log company information
        // Get existing payments for this contract to calculate remaining amount
        const contractPayments = payments.filter(
          (p) => p.contract_id === selectedContract.id
        );
        
        // Debug: Log payments data
        console.log('🔍 PaymentCreate Debug:', {
          allPayments: payments.length,
          contractPayments: contractPayments.length,
          selectedContractId: selectedContract.id,
          formPaymentDate: formData.paymentDate,
          currentPaymentDate: paymentDate.toISOString().split('T')[0],
          currentDateLocal: new Date().toLocaleDateString('en-CA'),
          paymentsDetails: payments.map(p => ({
            id: p.id,
            contract_id: p.contract_id,
            amount: p.amount,
            payment_date: p.payment_date,
            is_partial: p.is_partial,
            is_extra: p.is_extra
          }))
        });

        // Use enhanced payment calculation utility with proper partial payment handling
        const calculation = calculatePaymentDetailsWithPartialPayments(
          selectedContract,
          paymentDate,
          company,
          treatAsOnTime,
          false, // excludeOverduePenalty - always false for now
          contractPayments
        );

        // Don't override baseAmount - it already contains the correct remaining amount after partial payments
        // The calculatePaymentDetails function handles adjusted_monthly_payment internally
        // and calculates the remaining amount correctly based on existing partial payments

        setPaymentCalculation({
          baseAmount: calculation.baseAmount,
          overdueDays: calculation.overdueDays,
          overduePenalty: calculation.overduePenalty,
          totalAmount: calculation.totalAmount,
          isOverdue: calculation.isOverdue,
          sophisticatedBreakdown: calculation.sophisticatedBreakdown,
          partialPaymentBreakdown: calculation.partialPaymentBreakdown,
        });

        // Auto-fill the amount - only if not a partial payment
        if (!isPartialPayment) {
          const amountToShow = treatAsOnTime
            ? calculation.baseAmount
            : calculation.totalAmount;
          setFormData((prev) => ({
            ...prev,
            amount: roundAmount(amountToShow).toString(),
          }));
        }
      }
    }
  }, [
    selectedContract,
    formData.paymentDate,
    treatAsOnTime,
    companies,
    isPartialPayment,
    payments,
    paymentsLoading,
  ]);

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: "",
      }));
    }
  };

  const handleTreatAsOnTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const checked = e.target.checked;
    setTreatAsOnTime(checked);
    
    // Immediately update the amount field when treat as on time is toggled
    if (!isPartialPayment && paymentCalculation.baseAmount > 0) {
      const amountToShow = checked
        ? paymentCalculation.baseAmount
        : paymentCalculation.totalAmount;
      setFormData((prev) => ({
        ...prev,
        amount: roundAmount(amountToShow).toString(),
      }));
    }
  };

  // const handleReceiptChange = (url: string) => {
  //   setReceiptUrl(url);
  //   setErrors(prev => ({ ...prev, receipt: '' }));
  // };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.contractId) {
      newErrors.contractId = t("pages.payments.createPayment.contractRequired");
    }

    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      newErrors.amount = t("pages.payments.createPayment.amountRequired");
    } else {
      const enteredAmount = parseFloat(formData.amount);

      if (isExtraPayment) {
        // For extra payments, validate that amount is positive (no specific amount required)
        if (enteredAmount <= 0) {
          newErrors.amount = t("pages.payments.createPayment.extraPaymentAmountRequired");
        }
      } else if (isPartialPayment) {
        // For partial payments, validate that amount doesn't exceed the total amount due (including penalties)
        // Use totalAmount for overdue payments (includes interest), baseAmount for on-time payments
        const maxAllowedAmount = paymentCalculation.isOverdue 
          ? paymentCalculation.totalAmount 
          : paymentCalculation.baseAmount;
        
        // Allow partial payments up to the maximum allowed amount for this payment period
        if (enteredAmount > maxAllowedAmount) {
          newErrors.amount = t("pages.payments.createPayment.amountExceedsRemaining", {
            amount: roundAmount(maxAllowedAmount)
          });
        } else if (enteredAmount <= 0) {
          newErrors.amount = t("pages.payments.createPayment.partialPaymentAmountRequired");
        }
      } else {
        // For full payments, validate that the entered amount is at least the calculated total
        const calculatedTotal = treatAsOnTime
          ? paymentCalculation.baseAmount
          : paymentCalculation.totalAmount;
        const roundedEnteredAmount = roundPaymentAmount(enteredAmount);
        const roundedCalculatedTotal = roundPaymentAmount(calculatedTotal);

        // Allow extra payment - only validate minimum amount
        if (roundedEnteredAmount < roundedCalculatedTotal) {
          if (treatAsOnTime) {
            newErrors.amount = t("pages.payments.createPayment.onTimePaymentAmount", {
              amount: roundedCalculatedTotal
            });
          } else {
            newErrors.amount = t("pages.payments.createPayment.totalPaymentAmount", {
              total: roundedCalculatedTotal,
              base: roundPaymentAmount(paymentCalculation.baseAmount),
              penalty: roundPaymentAmount(paymentCalculation.overduePenalty)
            });
          }
        }
      }
    }

    if (!formData.paymentDate) {
      newErrors.paymentDate = t(
        "pages.payments.createPayment.paymentDateRequired"
      );
    }

    if (!formData.paymentMethod) {
      newErrors.paymentMethod = t(
        "pages.payments.createPayment.paymentMethodRequired"
      );
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    // Prevent double submission
    if (isSubmitting) {
      return;
    }

    setIsSubmitting(true);

    try {
      if (!selectedContract) {
        setErrors({
          contractId: t(
            "pages.payments.createPayment.selectedContractNotFound"
          ),
        });
        return;
      }

      // Store the total amount entered by user
      const totalAmountEntered = parseFloat(formData.amount);
      setTotalPaidAmount(totalAmountEntered);

      // Calculate the base payment amount (without penalty)
      const basePaymentAmount = paymentCalculation.baseAmount;
      
      let paymentAmount: number;
      
      if (isExtraPayment) {
        // For extra payments, use the full entered amount
        paymentAmount = parseFloat(formData.amount);
      } else if (isPartialPayment && paymentCalculation.isOverdue && !treatAsOnTime) {
        // For overdue partial payments (when not treating as on-time), calculate principal portion after deducting interest
        const enteredAmount = parseFloat(formData.amount);
        const company = companies.find(c => c.id === selectedContract.company_id);
        const dailyInterestRate = company?.interest_rate || 1.0;
        
        // CRITICAL FIX: Use the remaining amount after partial payments for calculation
        const remainingAmount = paymentCalculation.baseAmount; // This is already the remaining amount (364₼)
        
        // Calculate the breakdown to get principal portion
        const breakdown = calculateOverduePartialPaymentBreakdown(
          remainingAmount, // Use remaining amount (364₼) instead of full monthly payment
          enteredAmount,
          paymentCalculation.overdueDays,
          dailyInterestRate
        );
        
        // Send only the principal portion to the backend
        paymentAmount = breakdown.principalPaid;
        
        console.log('🔧 CRITICAL FIX: API Payment Amount Calculation:', {
          enteredAmount,
          remainingAmount,
          breakdown: breakdown.calculationDebug,
          interestPaid: breakdown.interestPaid,
          principalPaid: breakdown.principalPaid,
          paymentAmount
        });
    
      } else if (isPartialPayment && treatAsOnTime) {
        // For partial payments when treating as on-time, use the full entered amount (no interest calculation)
        paymentAmount = parseFloat(formData.amount);
      } else if (isPartialPayment) {
        // For regular partial payments (not overdue), use the entered amount
        paymentAmount = parseFloat(formData.amount);
      } else {
        // For full payments, use the calculated amount
        paymentAmount = basePaymentAmount;
      }

      // CRITICAL FIX: Check if partial payments complete the monthly payment
      let shouldMarkAsComplete = false;
      if (isPartialPayment && !isExtraPayment) {
        // Get existing partial payments for this period
        const currentPeriodPayments = payments.filter(payment => {
          if (!payment.is_partial || payment.contract_id !== selectedContract.id) return false;
          
          const paymentDueDate = new Date(payment.due_date);
          const currentDueDate = new Date(calculateCorrectNextDueDate(selectedContract, true));
          
          const dueDateOnly = new Date(currentDueDate.getFullYear(), currentDueDate.getMonth(), currentDueDate.getDate());
          const paymentDueDateOnly = new Date(paymentDueDate.getFullYear(), paymentDueDate.getMonth(), paymentDueDate.getDate());
          
          return dueDateOnly.getFullYear() === paymentDueDateOnly.getFullYear() && 
                 dueDateOnly.getMonth() === paymentDueDateOnly.getMonth();
        });
        
        const totalExistingPartialPayments = currentPeriodPayments.reduce((sum, payment) => sum + payment.amount, 0);
        const totalAfterThisPayment = totalExistingPartialPayments + paymentAmount;
        const monthlyPayment = selectedContract?.adjusted_monthly_payment || selectedContract?.monthly_payment || 0;
        
        // Check if this payment completes the monthly amount
        if (totalAfterThisPayment >= monthlyPayment) {
          shouldMarkAsComplete = true;
          console.log('🔧 CRITICAL FIX: Partial payments complete monthly payment:', {
            totalExistingPartialPayments,
            currentPayment: paymentAmount,
            totalAfterThisPayment,
            monthlyPayment,
            shouldMarkAsComplete
          });
        }
      }

      // Debug: Log payment parameters
      console.log('🔍 PaymentCreate Debug:', {
        isPartialPayment,
        isExtraPayment,
        paymentAmount,
        formData
      });

      // Create regular payment first
      const createdPayment = await addPayment({
        contractId: formData.contractId,
        amount: paymentAmount, // Use entered amount for partial payments, calculated amount for full payments
        dateISO: formData.paymentDate, // 'YYYY-MM-DD' format
        methodUI: formData.paymentMethod, // UI label; will be mapped to enum
        isExtra: isExtraPayment, // Set based on extra payment checkbox
        isPartial: isPartialPayment, // Always mark as partial if user selected partial payment
        notes: formData.notes || null,
        expectedAmount: paymentCalculation.baseAmount, // Pass the expected amount for validation
        paymentPeriod: selectedContract.payments_count + 1, // Set correct payment period (first payment should be period 1, not 0)
      });

      // If auto extra payment is detected, create an extra payment
      let extraPayment = null;
      if (autoExtraPayment && extraPaymentAmount > 0) {
        try {
          extraPayment = await addPayment({
            contractId: formData.contractId,
            amount: extraPaymentAmount,
            dateISO: formData.paymentDate,
            methodUI: formData.paymentMethod,
            isExtra: true,
            isPartial: false,
            notes: `Auto extra payment - ${formData.notes || 'Excess payment'}`,
            expectedAmount: 0, // No expected amount for extra payments
            paymentPeriod: selectedContract.payments_count + 1, // Set correct payment period (first payment should be period 1, not 0)
          });
          setCreatedExtraPayment(extraPayment);
        } catch (error) {
          console.error("Error creating extra payment:", error);
          // Don't fail the whole operation if extra payment fails
        }
      }
    
      setCreatedPayment(createdPayment);
      setShowSuccessModal(true);
      // Load drivers for the success modal
      try {
        const permissionDoc = await getPermissionDocumentByContractId(
          selectedContract.id
        );
        let drivers: any[] = [];

        if (
          permissionDoc &&
          permissionDoc.drivers &&
          permissionDoc.drivers.length > 0
        ) {
          drivers = permissionDoc.drivers;
        } else {
          // If no permission document exists, create a default driver list with the main customer
          const customer = customers.find(
            (c) => c.id === selectedContract.customer_id
          );
          if (customer) {
            drivers = [
              {
                id: "main-customer",
                name: `${customer.first_name} ${customer.last_name} ${customer.father_name}`,
                licenseNumber: customer.license_number || "",
                license_category: customer.license_category || "",
                license_given_date: customer.license_given_date || null,
                phone: customer.phone || "",
                address: customer.address || "",
              },
            ];
          }
        }

        setContractDrivers(drivers);
      } catch (e) {
        console.error("Loading drivers failed:", e);
        setContractDrivers([]);
      }
    } catch (error) {
      console.error("Error creating payment:", error);
      showApiError(error, 'payment');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getCustomerName = (customerId: string) => {
    const customer = customers.find((c) => c.id === customerId);
    return customer
      ? `${customer.first_name} ${customer.last_name} ${customer.father_name}`
      : t("common.unknownCustomer");
  };

  const getCompanyName = (companyId: string) => {
    const company = companies.find((c) => c.id === companyId);
    return company ? company.name : t("common.unknownCompany");
  };


  const handleSuccessModalClose = () => {
    setShowSuccessModal(false);
    setCreatedPayment(null);
    setCreatedExtraPayment(null);
    setTotalPaidAmount(0);
    
    // Reload the page when modal is closed to refresh all data
    window.location.reload();
  };

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isDropdownOpen) return;

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setSelectedIndex((prev) =>
          prev < filteredContracts.length - 1 ? prev + 1 : prev
        );
        break;
      case "ArrowUp":
        e.preventDefault();
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : -1));
        break;
      case "Enter":
        e.preventDefault();
        if (selectedIndex >= 0 && filteredContracts[selectedIndex]) {
          const contract = filteredContracts[selectedIndex];
          setFormData((prev) => ({ ...prev, contractId: contract.id }));
          setSelectedContract(contract);
          setIsDropdownOpen(false);
          setSearchTerm("");
          setSelectedIndex(-1);
        }
        break;
      case "Escape":
        setIsDropdownOpen(false);
        setSelectedIndex(-1);
        break;
    }
  };

  return (
    <div className="w-full space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-4">
        <button
          onClick={() => navigate("/payments")}
          className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-50"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {t("pages.payments.createPayment.title")}
          </h1>
          <p className="text-gray-600">
            {t("pages.payments.createPayment.subtitle")}
          </p>
        </div>
      </div>

      {/* Form */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          {errors.submit && (
            <div className="bg-red-50 border border-red-200 rounded-md p-4">
              <p className="text-sm text-red-600">{errors.submit}</p>
            </div>
          )}

          {/* Contract Selection */}
          <div>
            <label
              htmlFor="contractId"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              {t("common.contracts")} *
            </label>
            <div ref={dropdownRef} className="relative">
              <div
                className={`flex items-center justify-between px-4 py-2 border rounded-lg focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-transparent ${
                  errors.contractId ? "border-red-300" : "border-gray-300"
                }`}
                onClick={() => setIsDropdownOpen(true)}
              >
                <div className="flex items-center space-x-2 flex-1">
                  <Car className="w-4 h-4 text-gray-500" />
                  <input
                    type="text"
                    id="contractId"
                    name="contractId"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    onFocus={() => setIsDropdownOpen(true)}
                    onKeyDown={handleKeyDown}
                    placeholder={
                      contractsLoading
                        ? t("common.loading")
                        : selectedContract && selectedContract.vehicle
                        ? `${selectedContract.vehicle.license_plate} - ${
                            selectedContract.vehicle.make
                          } ${
                            selectedContract.vehicle.model
                          } (${getCustomerName(selectedContract.customer_id)})`
                        : t("common.selectAContract")
                    }
                    className="w-full pr-10 text-sm text-gray-900 focus:outline-none"
                    ref={searchInputRef}
                    readOnly={false}
                  />
                </div>
                <div className="flex items-center space-x-2">
                  {selectedContract && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedContract(null);
                        setFormData((prev) => ({ ...prev, contractId: "" }));
                        setSearchTerm("");
                        setIsDropdownOpen(true);
                      }}
                      className="p-1 text-gray-400 hover:text-gray-600 rounded"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                  <Search className="w-4 h-4 text-gray-400" />
                  <ChevronDown
                    className={`w-4 h-4 text-gray-400 transition-transform ${
                      isDropdownOpen ? "rotate-180" : ""
                    }`}
                  />
                </div>
              </div>

              {isDropdownOpen && (
                <div className="absolute z-10 w-full bg-white rounded-lg shadow-lg border border-gray-200 mt-1">
                  {/* Contract list */}
                  <div className="max-h-48 overflow-y-auto">
                    {contractsLoading ? (
                      <div className="px-4 py-3 text-sm text-gray-500 text-center">
                        Loading contracts...
                      </div>
                    ) : filteredContracts.length > 0 ? (
                      filteredContracts.map((contract, index) => (
                        <div
                          key={contract.id}
                          className={`flex items-center px-4 py-3 cursor-pointer hover:bg-gray-50 border-b border-gray-100 last:border-b-0 ${
                            index === selectedIndex ? "bg-blue-50" : ""
                          }`}
                          onClick={() => {
                            setFormData((prev) => ({
                              ...prev,
                              contractId: contract.id,
                            }));
                            setSelectedContract(contract);
                            setIsDropdownOpen(false);
                            setSearchTerm("");
                            setSelectedIndex(-1);
                          }}
                          onMouseEnter={() => setSelectedIndex(index)}
                          onMouseLeave={() => setSelectedIndex(-1)}
                        >
                          <Car className="w-5 h-5 text-gray-500 mr-3" />
                          <div className="flex-1">
                            <p className="text-sm font-medium text-gray-900">
                              {contract.vehicle?.license_plate || "N/A"} -{" "}
                              {contract.vehicle?.make || "N/A"}{" "}
                              {contract.vehicle?.model || "N/A"}
                            </p>
                            <p className="text-sm text-gray-500">
                              {getCustomerName(contract.customer_id)}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-xs text-gray-400">
                              {formatDisplayDate(
                                calculateCorrectNextDueDate(contract, true) // Use contract start date
                              )}
                            </p>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="px-4 py-3 text-sm text-gray-500 text-center">
                        {searchTerm
                          ? t("common.noContractsFound")
                          : t("common.noContractsAvailable")}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
            {errors.contractId && (
              <p className="mt-1 text-sm text-red-600">{errors.contractId}</p>
            )}
          </div>

          {/* Contract Details */}
          {selectedContract && (
            <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                {t("pages.payments.createPayment.contractDetails")}
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center space-x-3">
                  <Car className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {selectedContract.vehicle?.make || "N/A"}{" "}
                      {selectedContract.vehicle?.model || "N/A"}
                    </p>
                    <p className="text-sm text-gray-500">
                      {selectedContract.vehicle?.license_plate || "N/A"} •{" "}
                      {selectedContract.vehicle?.year || "N/A"}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <User className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {getCustomerName(selectedContract.customer_id)}
                    </p>
                    <p className="text-sm text-gray-500">
                      {t("common.customer")}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <Building2 className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {getCompanyName(selectedContract.company_id)}
                    </p>
                    <p className="text-sm text-gray-500">
                      {t("common.company")}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <Calendar
                    className={`w-5 h-5 ${
                      paymentCalculation.isOverdue
                        ? "text-red-400"
                        : "text-gray-400"
                    }`}
                  />
                  <div>
                    <p
                      className={`text-sm font-medium ${
                        paymentCalculation.isOverdue
                          ? "text-red-600"
                          : "text-gray-900"
                      }`}
                    >
                      {formatDisplayDate(
                        calculateCorrectNextDueDate(selectedContract, true) // Use contract start date
                      )}
                      {paymentCalculation.isOverdue && !treatAsOnTime && (
                        <span className="ml-2 text-xs bg-red-100 text-red-800 px-2 py-1 rounded-full">
                          {paymentCalculation.overdueDays} {t("pages.payments.createPayment.daysOverdue")}
                        </span>
                      )}
                    </p>
                    <p className="text-sm text-gray-500">
                      {selectedContract.payments_count === 0
                        ? t("pages.payments.createPayment.firstPaymentDue")
                        : t("common.dueDate")}
                    </p>
                  </div>
                </div>
                
                {/* Remaining Balance */}
                {/* <div className="flex items-center space-x-3">
                  <div className="w-5 h-5 flex items-center justify-center">
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-green-600">
                      ₼{roundPaymentAmount(selectedContract.remaining_balance || 0).toLocaleString('en-US')}
                    </p>
                    <p className="text-sm text-gray-500">
                      {t("pages.payments.createPayment.contractRemainingBalance")}
                    </p>
                  </div>
                </div> */}
              </div>
            </div>
          )}

        
          {/* Payment Calculation */}
          {selectedContract && (
            <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">
                  {t("pages.payments.createPayment.paymentCalculation")}
                </h3>
                {paymentCalculation.isOverdue && !treatAsOnTime && (
                  <div className="flex items-center space-x-2">
                    <AlertTriangle className="w-5 h-5 text-red-500" />
                    <span className="text-sm font-medium text-red-600">
                      {t("pages.payments.createPayment.overduePayment")}
                    </span>
                  </div>
                )}
              </div>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">
                    {t("pages.payments.createPayment.monthlyPayment")}
                  </span>
                  <span className="text-sm font-medium text-gray-900">
                    ₼
                    {roundAmount(
                      selectedContract?.adjusted_monthly_payment ||
                        paymentCalculation.baseAmount
                    )}
                  </span>
                </div>

                {paymentCalculation.isOverdue &&
                  !treatAsOnTime && (
                    <>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-red-600 flex items-center">
                          <AlertTriangle className="w-4 h-4 mr-1" />
                          {t("pages.payments.createPayment.overdueDays")}
                        </span>
                        <span className="text-sm font-medium text-red-600">
                          {paymentCalculation.overdueDays} days
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">
                          {t("pages.payments.createPayment.dueDateUsed")}
                        </span>
                        <span className="text-sm font-medium text-gray-900">
                          {formatDisplayDate(
                            calculateCorrectNextDueDate(selectedContract, true) // Use contract start date
                          )}
                          {selectedContract.payments_count === 0 && (
                            <span className="ml-1 text-xs text-gray-500">
                              {t("pages.payments.createPayment.firstPayment")}
                            </span>
                          )}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">
                          {t("pages.payments.createPayment.dailyInterestRate")}
                        </span>
                        <span className="text-sm font-medium text-gray-900">
                          {(() => {
                            const company = companies.find(
                              (c) => c.id === selectedContract.company_id
                            );
                            const rate = company ? company.interest_rate : 1;
                            const isDefault = !company;
                            return getInterestRateDisplay(rate, isDefault);
                          })()}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-red-600">
                          {t("pages.payments.createPayment.penaltySeparate")}
                        </span>
                        <span className="text-sm font-medium text-red-600">
                          ₼{roundAmount(paymentCalculation.overduePenalty)}
                        </span>
                      </div>
                    </>
                  )}


                <div className="border-t border-blue-200 pt-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-gray-900">
                      {t("pages.payments.createPayment.basePaymentForContract")}
                    </span>
                    <span className="text-sm font-medium text-gray-900">
                      ₼
                      {roundAmount(
                        selectedContract?.adjusted_monthly_payment ||
                          paymentCalculation.baseAmount
                      )}
                    </span>
                  </div>
                  {paymentCalculation.overduePenalty > 0 && !treatAsOnTime && (
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-red-600">
                        {t("pages.payments.createPayment.penaltySeparate")}
                      </span>
                      <span className="text-sm font-medium text-red-600">
                        ₼{roundAmount(paymentCalculation.overduePenalty)}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between items-center pt-2 border-t border-blue-200">
                    <span className="text-sm font-medium text-gray-900">
                      {t("pages.payments.createPayment.totalAmountDue")}
                    </span>
                    <span className="text-lg font-bold text-blue-600">
                      ₼
                      {roundAmount(
                        treatAsOnTime
                          ? paymentCalculation.baseAmount
                          : paymentCalculation.totalAmount
                      )}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Late Payment Options */}
          {paymentCalculation.isOverdue && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 space-y-4">
              <div className="flex items-start space-x-3">
                <input
                  type="checkbox"
                  id="treatAsOnTime"
                  checked={treatAsOnTime}
                  onChange={handleTreatAsOnTimeChange}
                  className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <div className="flex-1">
                  <label
                    htmlFor="treatAsOnTime"
                    className="text-sm font-medium text-yellow-800"
                  >
                    {t("pages.payments.createPayment.treatAsOnTime")}
                  </label>
                  <p className="text-sm text-yellow-700 mt-1">
                    {t("pages.payments.createPayment.treatAsOnTimeDescription")}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Payment Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="amount"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                {t("common.paymentAmount")} *
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-500">
                  ₼
                </span>
                <input
                  type="number"
                  id="amount"
                  name="amount"
                  value={formData.amount}
                  onChange={(e) => {
                    // Ensure only numeric input (remove any non-numeric characters except decimal point)
                    const numericValue = e.target.value.replace(/[^0-9.]/g, "");
                    setFormData((prev) => ({
                      ...prev,
                      amount: numericValue,
                    }));
                  }}
                  step="0.01"
                  min="0"
                  className={`w-full pl-8 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.amount ? "border-red-300" : ""
                  }`}
                  placeholder="0.00"
                />
              </div>
              {errors.amount && (
                <p className="mt-1 text-sm text-red-600">{errors.amount}</p>
              )}
            </div>

            <div>
              <DatePicker
                value={formData.paymentDate}
                onChange={(value) =>
                  setFormData((prev) => ({ ...prev, paymentDate: value }))
                }
                label={t("common.paymentDate")}
                required
                error={errors.paymentDate}
              />
            </div>
          </div>
  {/* Auto Extra Payment Info */}
  {autoExtraPayment && extraPaymentAmount > 0 && (
            <div className="bg-green-50 rounded-lg p-4 border border-green-200">
              <div className="flex items-center space-x-3 mb-3">
                <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-sm font-bold">+</span>
                </div>
                <h3 className="text-lg font-medium text-green-900">
                  {t("pages.payments.createPayment.autoExtraPaymentDetected")}
                </h3>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-green-700">{t("pages.payments.createPayment.enteredAmount")}</span>
                  <span className="font-medium">₼{roundAmount(parseFloat(formData.amount))}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-green-700">{t("pages.payments.createPayment.requiredAmount")}</span>
                  <span className="font-medium">₼{roundAmount(treatAsOnTime ? paymentCalculation.baseAmount : paymentCalculation.totalAmount)}</span>
                </div>
                <div className="flex justify-between border-t pt-2">
                  <span className="text-green-800 font-bold">{t("pages.payments.createPayment.extraPaymentAmount")}</span>
                  <span className="font-bold text-green-800">₼{roundAmount(extraPaymentAmount)}</span>
                </div>
                <div className="mt-2 p-2 bg-green-100 rounded border border-green-300">
                  <p className="text-xs text-green-800">
                    <strong>{t("common.note")}:</strong> {t("pages.payments.createPayment.autoExtraPaymentNote")} 
                    <br />• ₼{roundAmount(treatAsOnTime ? paymentCalculation.baseAmount : paymentCalculation.totalAmount)} {t("pages.payments.createPayment.normalPayment")}
                    <br />• ₼{roundAmount(extraPaymentAmount)} {t("pages.payments.createPayment.extraPayment")}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Payment Type Options */}
          {selectedContract && (
            <div className="mt-4 space-y-4">
              {/* Partial Payment Option */}
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-center space-x-3 mb-3">
                  <input
                    type="checkbox"
                    id="isPartialPayment"
                    checked={isPartialPayment}
                    onChange={(e) => {
                      setIsPartialPayment(e.target.checked);
                      // Disable extra payment when partial is selected
                      if (e.target.checked) {
                        setIsExtraPayment(false);
                      }
                    }}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label
                    htmlFor="isPartialPayment"
                    className="text-sm font-medium text-blue-900"
                  >
                    {t("pages.payments.createPayment.partialPayment")}
                  </label>
                </div>

                 {/* Partial Payment Breakdown - Show when partial payment is selected and there's an amount */}
                 {isPartialPayment && formData.amount && parseFloat(formData.amount) > 0 && (
                   <>
                     
                     {/* Show existing partial payments for this period */}
                     {(() => {
                       const currentPeriodPayments = payments.filter(payment => {
                         if (!payment.is_partial || payment.contract_id !== selectedContract?.id) return false;
                         
                         const paymentDueDate = new Date(payment.due_date);
                         const currentDueDate = new Date(calculateCorrectNextDueDate(
                           selectedContract,
                           true // Use contract start date
                         ));
                         
                         const dueDateOnly = new Date(currentDueDate.getFullYear(), currentDueDate.getMonth(), currentDueDate.getDate());
                         const paymentDueDateOnly = new Date(paymentDueDate.getFullYear(), paymentDueDate.getMonth(), paymentDueDate.getDate());
                         
                         return dueDateOnly.getFullYear() === paymentDueDateOnly.getFullYear() && 
                                dueDateOnly.getMonth() === paymentDueDateOnly.getMonth();
                       });
                       
                       if (currentPeriodPayments.length > 0) {
                         const totalPaidThisPeriod = currentPeriodPayments.reduce((sum, payment) => sum + payment.amount, 0);
                         return (
                           <div className="mb-3 p-2 bg-gray-50 rounded border border-gray-200">
                             <h5 className="font-medium text-gray-800 mb-1">{t("pages.payments.createPayment.existingPartialPaymentsTitle")}</h5>
                             <div className="space-y-1 text-sm">
                               {currentPeriodPayments.map((payment, index) => (
                                 <div key={payment.id} className="flex justify-between">
                                   <span className="text-gray-600">{t("pages.payments.createPayment.paymentNumber", { number: index + 1 })}</span>
                                   <span className="font-medium">₼{roundAmount(payment.amount)}</span>
                                 </div>
                               ))}
                               <div className="flex justify-between border-t pt-1">
                                 <span className="text-gray-700 font-medium">{t("pages.payments.createPayment.totalPaid")}</span>
                                 <span className="font-bold">₼{roundAmount(totalPaidThisPeriod)}</span>
                               </div>
                             </div>
                           </div>
                         );
                       }
                       return null;
                     })()}
                    
                    {/* Show overdue partial payment breakdown with interest-first allocation */}
                    {paymentCalculation.isOverdue && !treatAsOnTime && (
                      <div className="mt-3 p-3 bg-red-50 rounded-lg border border-red-200">
                        <h4 className="font-semibold text-red-900 mb-2 flex items-center">
                          <span className="mr-2">⚠️</span>
                          {t("pages.payments.createPayment.overduePartialPaymentAllocation")}
                        </h4>
                        {(() => {
                          const company = companies.find(c => c.id === selectedContract.company_id);
                          const dailyInterestRate = company?.interest_rate || 1.0;
                          const partialAmount = parseFloat(formData.amount);
                          const monthlyPayment = selectedContract?.adjusted_monthly_payment || paymentCalculation.baseAmount;
                          
                          // FIXED: Get current period payments for accurate interest calculation
                          const currentPeriodPayments = payments.filter(payment => {
                            if (!payment.is_partial || payment.contract_id !== selectedContract?.id) return false;
                            
                            const paymentDueDate = new Date(payment.due_date);
                            const currentDueDate = new Date(calculateCorrectNextDueDate(
                              selectedContract,
                              true // Use contract start date
                            ));
                            
                            const dueDateOnly = new Date(currentDueDate.getFullYear(), currentDueDate.getMonth(), currentDueDate.getDate());
                            const paymentDueDateOnly = new Date(paymentDueDate.getFullYear(), paymentDueDate.getMonth(), paymentDueDate.getDate());
                            
                            // FIXED: Use more flexible date matching
                            return dueDateOnly.getFullYear() === paymentDueDateOnly.getFullYear() && 
                                   dueDateOnly.getMonth() === paymentDueDateOnly.getMonth() &&
                                   Math.abs(dueDateOnly.getDate() - paymentDueDateOnly.getDate()) <= 3;
                          });
                          
                          // CRITICAL FIX: Calculate breakdown using the corrected logic
                          // First, calculate the remaining amount after existing partial payments
                          const totalExistingPartialPayments = currentPeriodPayments.reduce((sum, payment) => sum + payment.amount, 0);
                          const remainingAmountAfterPartials = Math.max(0, monthlyPayment - totalExistingPartialPayments);
                          
                          console.log('🔧 CRITICAL FIX: UI Calculation Debug:', {
                            monthlyPayment,
                            totalExistingPartialPayments,
                            remainingAmountAfterPartials,
                            partialAmount,
                            overdueDays: paymentCalculation.overdueDays,
                            dailyInterestRate
                          });
                          
                          // Calculate breakdown for the new partial payment using the REMAINING amount
                          const breakdown = calculateOverduePartialPaymentBreakdown(
                            remainingAmountAfterPartials, // Use remaining amount (364₼) instead of full monthly payment (664₼)
                            partialAmount,
                            paymentCalculation.overdueDays,
                            dailyInterestRate,
                            0, // No already paid interest since we're calculating from remaining amount
                            currentPeriodPayments // Pass existing partial payments for accurate calculation
                          );
                          
                          console.log('🔧 CRITICAL FIX: Partial payment breakdown calculation:', {
                            monthlyPayment,
                            totalExistingPartialPayments,
                            remainingAmountAfterPartials,
                            partialAmount,
                            breakdown: breakdown.calculationDebug,
                            interestPaid: breakdown.interestPaid,
                            principalPaid: breakdown.principalPaid,
                            remainingInterest: breakdown.remainingInterest,
                            remainingPrincipal: breakdown.remainingPrincipal
                          });
                          
                          
                          // Calculate future interest after partial payment
                          const partialPaymentDate = new Date(formData.paymentDate);
                          const today = new Date();
                          const daysSincePartialPayment = Math.max(0, Math.floor((today.getTime() - partialPaymentDate.getTime()) / (1000 * 60 * 60 * 24)));
                          
                          // FIXED: Use the enhanced future payment calculation with better date tracking
                          const futurePaymentCalc = calculateFuturePaymentAfterPartial(
                            breakdown.remainingPrincipal,
                            daysSincePartialPayment,
                            dailyInterestRate,
                            partialPaymentDate, // Pass the actual date for better tracking
                            today // Pass current date for accurate calculation
                          );
                          
                          // Check if all interest is paid (important for future calculations)
                          const isInterestFullyPaid = breakdown.remainingInterest === 0;
                          
                          return (
                            <div className="space-y-2 text-sm">
                              <div className="grid grid-cols-2 gap-2">
                                <p className="text-gray-600">
                                  <strong>{t("pages.payments.createPayment.originalTotalInterest")}</strong> ₼{roundAmount(breakdown.totalOriginalOverdueInterest)}
                                </p>
                                <p className="text-gray-500">
                                  <strong>{t("pages.payments.createPayment.alreadyPaidInterest")}</strong> ₼{roundAmount(breakdown.alreadyPaidInterest)}
                                </p>
                                <p className="text-red-700">
                                  <strong>{t("pages.payments.createPayment.remainingInterestBeforePayment")}</strong> ₼{roundAmount(breakdown.remainingOverdueInterest)}
                                </p>
                                <p className="text-green-700">
                                  <strong>{t("pages.payments.createPayment.interestPaidThisPayment")}</strong> ₼{roundAmount(breakdown.interestPaid)}
                                </p>
                                <p className="text-blue-700">
                                  <strong>{t("pages.payments.createPayment.principalPaid")}</strong> ₼{roundAmount(breakdown.principalPaid)}
                                </p>
                                <p className="text-red-600">
                                  <strong>{t("pages.payments.createPayment.stillRemainingInterest")}</strong> ₼{roundAmount(breakdown.remainingInterest)}
                                </p>
                                <p className="text-purple-600">
                                  <strong>{t("pages.payments.createPayment.remainingPrincipal")}</strong> ₼{roundAmount(breakdown.remainingPrincipal)}
                                </p>
                                {/* <p className="text-orange-600">
                                  <strong>{t("pages.payments.createPayment.totalRemaining")}</strong> ₼{roundAmount(breakdown.remainingBalance)}
                                </p> */}
                              </div>
                              
                              {/* Show remaining amount to pay for this payment period */}
                              <div className="mt-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                                <h5 className="font-semibold text-blue-900 mb-2">{t("pages.payments.createPayment.paymentPeriodSummary")}</h5>
                                <div className="space-y-1 text-sm">
                                  <div className="flex justify-between">
                                    <span className="text-blue-700">{t("pages.payments.createPayment.monthlyPaymentRequired")}</span>
                                    <span className="font-medium">₼{roundAmount(monthlyPayment)}</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-gray-600">{t("pages.payments.createPayment.alreadyPaidThisPeriod")}</span>
                                    <span className="font-medium">₼{roundAmount(totalExistingPartialPayments)}</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-blue-700">{t("pages.payments.createPayment.remainingAmount")}</span>
                                    <span className="font-medium">₼{roundAmount(remainingAmountAfterPartials)}</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-blue-700">{t("pages.payments.createPayment.yourPaymentAmount")}</span>
                                    <span className="font-medium">₼{roundAmount(partialAmount)}</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-green-700">{t("pages.payments.createPayment.interestPaidThisPayment")}</span>
                                    <span className="font-medium text-green-600">₼{roundAmount(breakdown.interestPaid)}</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-gray-600">{t("pages.payments.createPayment.remainingInterest")}</span>
                                    <span className="font-medium text-gray-600">₼{roundAmount(breakdown.remainingInterest)}</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-blue-700">{t("pages.payments.createPayment.principalPaid")}</span>
                                    <span className="font-medium">₼{roundAmount(breakdown.principalPaid)}</span>
                                  </div>
                                  <div className="flex justify-between border-t pt-1">
                                    <span className="text-blue-800 font-bold">{t("pages.payments.createPayment.stillNeedToPayThisPeriod")}</span>
                                    <span className="font-bold text-blue-800">₼{roundAmount(Math.max(0, remainingAmountAfterPartials - breakdown.principalPaid))}</span>
                                  </div>
                                  {breakdown.remainingInterest === 0 && (
                                    <div className="flex justify-between">
                                      <span className="text-green-700">{t("pages.payments.createPayment.interestStatus")}</span>
                                      <span className="font-medium text-green-600">{t("pages.payments.createPayment.clearedFutureInterestStarts")}</span>
                                    </div>
                                  )}
                                </div>
                              </div>
                              
                              {/* Enhanced future interest calculation */}
                              {isInterestFullyPaid && breakdown.remainingPrincipal > 0 && (
                                <div className="mt-3 p-3 bg-green-50 rounded-lg border border-green-200">
                                  <h5 className="font-semibold text-green-900 mb-2 flex items-center">
                                    <span className="mr-2">✅</span>
                                    {t("pages.payments.createPayment.interestFullyPaid")}
                                  </h5>
                                  <div className="space-y-1 text-sm">
                                    <div className="flex justify-between">
                                      <span className="text-green-700">{t("common.status")}:</span>
                                      <span className="font-medium text-green-800">{t("pages.payments.createPayment.allOverdueInterestCleared")}</span>
                                    </div>
                                    <div className="flex justify-between">
                                      <span className="text-green-700">{t("pages.payments.createPayment.remainingPrincipal")}</span>
                                      <span className="font-medium">₼{roundAmount(breakdown.remainingPrincipal)}</span>
                                    </div>
                                    <div className="flex justify-between">
                                      <span className="text-green-700">{t("pages.payments.createPayment.futureInterestRate")}</span>
                                      <span className="font-medium">{dailyInterestRate}{t("pages.payments.createPayment.perDay")}</span>
                                    </div>
                                    <div className="p-2 bg-green-100 rounded border">
                                      <p className="text-xs text-green-800">
                                        <strong>{t("common.note")}:</strong> {t("pages.payments.createPayment.futureInterestNote", { 
                                          date: formData.paymentDate, 
                                          amount: roundAmount(breakdown.remainingPrincipal), 
                                          rate: dailyInterestRate 
                                        })}
                                      </p>
                                    </div>
                                  </div>
                                </div>
                              )}
                              
                              {/* Show accumulated interest if time has passed and interest is not fully paid */}
                              {!isInterestFullyPaid && daysSincePartialPayment > 0 && breakdown.remainingPrincipal > 0 && (
                                <div className="mt-3 p-3 bg-orange-50 rounded-lg border border-orange-200">
                                  <h5 className="font-semibold text-orange-900 mb-2 flex items-center">
                                    <span className="mr-2">📅</span>
                                    {t("pages.payments.createPayment.additionalInterestSincePartialPayment")}
                                  </h5>
                                  <div className="space-y-1 text-sm">
                                    <div className="flex justify-between">
                                      <span className="text-orange-700">{t("pages.payments.createPayment.daysSincePartialPayment")}</span>
                                      <span className="font-medium">{daysSincePartialPayment} {t("pages.payments.createPayment.days")}</span>
                                    </div>
                                    <div className="flex justify-between">
                                      <span className="text-orange-700">{t("pages.payments.createPayment.remainingPrincipalAmount")}</span>
                                      <span className="font-medium">₼{roundAmount(futurePaymentCalc.remainingPrincipal)}</span>
                                    </div>
                                    <div className="flex justify-between">
                                      <span className="text-orange-700">{t("pages.payments.createPayment.dailyInterestRateLabel")}</span>
                                      <span className="font-medium">{dailyInterestRate}{t("pages.payments.createPayment.perDay")}</span>
                                    </div>
                                    <div className="flex justify-between border-t pt-1">
                                      <span className="text-orange-800 font-medium">{t("pages.payments.createPayment.additionalInterest")}</span>
                                      <span className="font-bold text-orange-800">₼{roundAmount(futurePaymentCalc.accumulatedInterest)}</span>
                                    </div>
                                    <div className="flex justify-between border-t pt-1">
                                      <span className="text-red-800 font-bold">{t("pages.payments.createPayment.totalWithAdditionalInterest")}</span>
                                      <span className="font-bold text-red-800">₼{roundAmount(futurePaymentCalc.totalDue)}</span>
                                    </div>
                                    <div className="p-2 bg-orange-100 rounded border">
                                      <p className="text-xs text-orange-800">
                                        <strong>Calculation:</strong> {futurePaymentCalc.calculation || `₼${breakdown.remainingPrincipal} × ${dailyInterestRate}% × ${daysSincePartialPayment} days`}
                                      </p>
                                    </div>
                                  </div>
                                </div>
                              )}

                              <div className="mt-2 p-2 bg-yellow-50 rounded border border-yellow-300">
                                <p className="text-xs text-yellow-800">
                                  <strong>{t("common.note")}:</strong> {t("pages.payments.createPayment.interestFirstNote")}
                                </p>
                              </div>
                            </div>
                          );
                        })()}
                      </div>
                    )}

                     {/* Show partial payment breakdown when treating as on-time (even if actually overdue) */}
                     {paymentCalculation.isOverdue && treatAsOnTime && (
                       <div className="mt-3 p-3 bg-green-50 rounded-lg border border-green-200">
                         <h4 className="font-semibold text-green-900 mb-2 flex items-center">
                           <span className="mr-2">✅</span>
                           {t("pages.payments.createPayment.treatingAsOnTime")}
                         </h4>
                         <div className="space-y-2 text-sm">
                           <div className="flex justify-between">
                             <span className="text-green-700">{t("pages.payments.createPayment.thisPartialPayment")}</span>
                             <span className="font-medium">₼{roundAmount(parseFloat(formData.amount))}</span>
                           </div>
                           <div className="flex justify-between">
                             <span className="text-gray-600">{t("pages.payments.createPayment.monthlyPaymentRequired")}</span>
                             <span className="font-medium">₼{roundAmount(selectedContract?.adjusted_monthly_payment || selectedContract?.monthly_payment || 0)}</span>
                           </div>
                           <div className="flex justify-between">
                             <span className="text-gray-600">{t("pages.payments.createPayment.alreadyPaidThisPeriod")}</span>
                             <span className="font-medium">₼{roundAmount((selectedContract?.adjusted_monthly_payment || selectedContract?.monthly_payment || 0) - paymentCalculation.baseAmount)}</span>
                           </div>
                           <div className="flex justify-between border-t pt-2">
                             <span className="text-green-600 font-medium">{t("pages.payments.createPayment.remainingAfterThisPayment")}</span>
                             <span className="font-bold text-green-600">
                               ₼{roundAmount(paymentCalculation.baseAmount - parseFloat(formData.amount))}
                             </span>
                           </div>
                           <div className="mt-2 p-2 bg-green-100 rounded border border-green-300">
                             <p className="text-xs text-green-800">
                               <strong>{t("common.note")}:</strong> {t("pages.payments.createPayment.noInterestCharged")}
                             </p>
                           </div>
                         </div>
                       </div>
                     )}

                     {/* Show regular partial payment breakdown */}
                     {!paymentCalculation.isOverdue && (
                       <div className="space-y-2 text-sm">
                         <div className="flex justify-between">
                           <span className="text-blue-700">{t("pages.payments.createPayment.thisPartialPayment")}</span>
                           <span className="font-medium">₼{roundAmount(parseFloat(formData.amount))}</span>
                          </div>
                         <div className="flex justify-between">
                           <span className="text-gray-600">{t("pages.payments.createPayment.monthlyPaymentRequired")}</span>
                           <span className="font-medium">₼{roundAmount(selectedContract?.adjusted_monthly_payment || selectedContract?.monthly_payment || 0)}</span>
                        </div>
                         <div className="flex justify-between">
                           <span className="text-gray-600">{t("pages.payments.createPayment.alreadyPaidThisPeriod")}</span>
                           <span className="font-medium">₼{roundAmount((selectedContract?.adjusted_monthly_payment || selectedContract?.monthly_payment || 0) - paymentCalculation.baseAmount)}</span>
                          </div>
                         <div className="flex justify-between border-t pt-2">
                           <span className="text-orange-600 font-medium">{t("pages.payments.createPayment.remainingAfterThisPayment")}</span>
                           <span className="font-bold text-orange-600">
                             ₼{roundAmount(paymentCalculation.baseAmount - parseFloat(formData.amount))}
                           </span>
                        </div>
                         <div className="mt-2 p-2 bg-blue-50 rounded border border-blue-300">
                           <p className="text-xs text-blue-800">
                             <strong>{t("common.note")}:</strong> {t("pages.payments.createPayment.partialPaymentNote")}
                              </p>
                            </div>
                         
                         {/* Show completion message if this payment will complete the monthly amount */}
                         {parseFloat(formData.amount) >= paymentCalculation.baseAmount && (
                           <div className="mt-2 p-2 bg-green-50 rounded border border-green-300">
                             <p className="text-xs text-green-800">
                               <strong>✅ {t("common.completion")}:</strong> {t("pages.payments.createPayment.completionMessage")}
                             </p>
                      </div>
                    )}
                        </div>
                      )}
                  </>
                )}
              </div>

              {/* Extra Payment Option */}
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center space-x-3 mb-3">
                  <input
                    type="checkbox"
                    id="isExtraPayment"
                    checked={isExtraPayment}
                    onChange={(e) => {
                      setIsExtraPayment(e.target.checked);
                      // Disable partial payment when extra is selected
                      if (e.target.checked) {
                        setIsPartialPayment(false);
                      }
                    }}
                    className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                  />
                  <label
                    htmlFor="isExtraPayment"
                    className="text-sm font-medium text-green-900"
                  >
                    {t("pages.payments.createPayment.extraPayment")}
                  </label>
                </div>
              </div>
            </div>
          )}

          <div>
            <label
              htmlFor="paymentMethod"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              {t("common.paymentMethod")} *
            </label>
            <select
              id="paymentMethod"
              name="paymentMethod"
              value={formData.paymentMethod}
              onChange={handleInputChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value={PaymentMethod.AUTOMATIC}>
                {t("common.automatic")}
              </option>
              <option value={PaymentMethod.MANUAL}>{t("common.manual")}</option>
              <option value={PaymentMethod.CASH}>{t("common.cash")}</option>
              <option value={PaymentMethod.BANK_TRANSFER}>
                {t("common.bankTransfer")}
              </option>
              <option value={PaymentMethod.CARD_TO_CARD}>
                {t("common.cardToCard")}
              </option>
            </select>
          </div>

          {/* Receipt Upload */}
          {/* <GoogleDriveFileUpload
            value={receiptUrl}
            onChange={handleReceiptChange}
            label={t('pages.payments.createPayment.receiptOptional')}
            description={t('pages.payments.createPayment.supportedFormats')}
            accept="image/*,.pdf"
            maxSize={5}
            folderName="Payment Receipts"
            showPreview={true}
          /> */}

          <div>
            <label
              htmlFor="notes"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              {t("common.notes")}
            </label>
            <textarea
              id="notes"
              name="notes"
              value={formData.notes}
              onChange={handleInputChange}
              rows={3}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder={t("pages.payments.createPayment.optionalNotes")}
            />
          </div>

          {/* Submit Button */}
          <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={() => navigate("/payments")}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              {t("pages.payments.createPayment.cancel")}
            </button>
            <button
              type="submit"
              disabled={!selectedContract || isSubmitting}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? t("common.creating") : t("pages.payments.createPayment.createPayment")}
            </button>
          </div>
        </form>
      </div>

      {/* Payment Success Modal */}
      {showSuccessModal && createdPayment && selectedContract && (
        <PaymentSuccessModal
          isOpen={showSuccessModal}
          onClose={handleSuccessModalClose}
          paymentData={{
            id: createdPayment.id,
            amount: totalPaidAmount, // Use the total amount stored from user input
            paymentDate:
              createdPayment.payment_date instanceof Date
                ? createdPayment.payment_date.toISOString().split("T")[0]
                : createdPayment.payment_date,
            dueDate:
              createdPayment.due_date instanceof Date
                ? createdPayment.due_date.toISOString().split("T")[0]
                : createdPayment.due_date,
            nextDueDate: addMonths(new Date(createdPayment.payment_date), 1)
              .toISOString()
              .split("T")[0],
            paymentMethod: createdPayment.payment_method,
            notes: createdPayment.notes || "",
          }}
          contractData={{
            id: selectedContract.id,
            customer: (() => {
              const customer = customers.find(
                (c) => c.id === createdPayment.customer_id
              );
              if (customer) {
                return {
                  id: customer.id,
                  first_name: customer.first_name || "",
                  last_name: customer.last_name || "",
                  father_name: customer.father_name || "",
                  company_name: customer.company_name,
                  customer_type: customer.customer_type,
                  national_id: customer.national_id,
                  voen: customer.voen,
                  license_number: customer.license_number,
                  license_category: customer.license_category,
                  license_given_date: customer.license_given_date
                    ? customer.license_given_date instanceof Date
                      ? customer.license_given_date.toISOString().split("T")[0]
                      : customer.license_given_date
                    : undefined,
                  phone: customer.phone,
                  address: customer.address,
                };
              }
              return {
                id: createdPayment.customer_id,
                first_name: "Unknown",
                last_name: "Customer",
                customer_type: "individual",
                phone: "",
                address: "",
              };
            })(),
            vehicle: (() => {
              return selectedContract.vehicle || null;
            })(),
            company: companies.find(
              (c) => c.id === createdPayment.company_id
            ) || {
              id: createdPayment.company_id,
              name: "Unknown Company",
              voen: undefined,
              director: undefined,
              interest_rate: 1,
              created_at: new Date(),
              is_active: true,
            },
          }}
          drivers={contractDrivers}
        />
      )}
    </div>
  );
};

export default PaymentCreate;

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from '../i18n';
import { ArrowLeft, Save, Car, FileText } from 'lucide-react';
import { createContract } from '../services/contracts';
import { getActiveContractForVehicle } from '../services/contracts';
import { createPayment } from '../services/payments';
import { getCompanies } from '../services/companies';
import { getCustomers } from '../services/customers';
import { getVehicles } from '../services/vehicles';
import { useData } from '../contexts/DataContext';
import { ContractStatus, PaymentInterval } from '../types';
import ImprovedDateInput from '../components/ui/ImprovedDateInput';
import CustomerSelectionModal from '../components/CustomerSelectionModal';
import VehicleSelectionModal from '../components/VehicleSelectionModal';
import DriverManagement from '../components/DriverManagement';
import { Driver } from '../types';
import { upsertPermissionDocument, PermissionDocument } from '../services/permissionDocuments';
import { printYolVereqesi, YolVereqesiData } from '../utils/yolVereqesiUtils';
import { generateYolVereqesiHTML } from '../utils/yolVereqesiUtils';
import { calculateContractDetails, validateContractCalculation } from '../utils/contractUtils';
import { calculateNextDueDateFromStartDate } from '../utils/paymentIntervalUtils';
import { addOneMonthToDate } from '../utils/paymentUtils';
import { addMonths } from 'date-fns';
import { showApiError, showApiSuccess } from '../utils/errorHandler';

const ContractCreate: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { loadContracts, loadPayments } = useData();
  
  const [companies, setCompanies] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    customer_id: '',
    company_id: '',
    selected_vehicle_id: '',
    vehicle: {
      license_plate: '',
      make: '',
      model: '',
      year: new Date().getFullYear(),
      color: '',
      body_number: '',
      engine: ''
    },
    down_payment: 0,
    yearly_interest_rate: 20, // Default 20% yearly rate
    term_months: 36,
    monthly_payment: 0,
    total_payable: 0,
    start_date: new Date().toISOString().split('T')[0],
    payment_start_date: new Date().toISOString().split('T')[0], // Begin of payment date
    // end_date is calculated from start_date and term_months, not stored in database
    payment_interval: PaymentInterval.MONTHLY,
    status: ContractStatus.ACTIVE,
    remaining_balance: 0,
    months_already_paid: 0
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeContractForSelectedVehicle, setActiveContractForSelectedVehicle] = useState<any>(null);
  const [showCustomerModal, setShowCustomerModal] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
  const [showVehicleModal, setShowVehicleModal] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState<any>(null);

  // State for permission document and drivers
  const [drivers, setDrivers] = useState<Driver[]>([]);

  const [showDocumentPreview, setShowDocumentPreview] = useState(false);

  // Load data on component mount
  useEffect(() => {
    const loadData = async () => {
      try {
        const [companiesData, customersData, vehiclesData] = await Promise.all([
          getCompanies(),
          getCustomers(),
          getVehicles()
        ]);
        
        setCompanies(companiesData);
        setCustomers(customersData);
        setVehicles(vehiclesData);
        
        // Check which vehicles are in active contracts - optimized batch query
        try {
          // Vehicle availability checking removed
        } catch (error) {
          console.error('Error checking vehicle availability:', error);
        }
      } catch (error) {
        console.error('Error loading data:', error);
      }
    };

    loadData();
  }, []);

  // Removed DataContext-related useEffect hooks to prevent unnecessary API calls

  // Calculate permission end date based on payment start date
  useEffect(() => {
    if (formData.payment_start_date) {
      const paymentStartDate = new Date(formData.payment_start_date);
      const nextPaymentDate = new Date(paymentStartDate);
      nextPaymentDate.setMonth(nextPaymentDate.getMonth() + 1);
      
      // Permission end date is no longer used
    }
  }, [formData.payment_start_date]);

  // Calculate monthly payment whenever relevant fields change
  useEffect(() => {
    if (formData.down_payment > 0 && formData.term_months > 0 && formData.yearly_interest_rate >= 0) {
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
        
        setFormData(prev => ({
          ...prev,
          monthly_payment: calculation.monthlyPayment,
          total_payable: calculation.totalPayable,
          remaining_balance: calculation.remainingBalance
        }));
      } else {
        console.warn('Contract calculation validation failed:', validation.errors);
        // Reset calculated fields if validation fails
        setFormData(prev => ({
          ...prev,
          monthly_payment: 0,
          total_payable: 0,
          remaining_balance: 0
        }));
      }
    } else {
      // Reset calculated fields if inputs are invalid
      setFormData(prev => ({
        ...prev,
        monthly_payment: 0,
        total_payable: 0,
        remaining_balance: 0
      }));
    }
  }, [formData.down_payment, formData.yearly_interest_rate, formData.term_months]);

  // Reset months already paid when term changes
  useEffect(() => {
    if (formData.months_already_paid > formData.term_months) {
      setFormData(prev => ({
        ...prev,
        months_already_paid: 0
      }));
    }
  }, [formData.term_months]);

  // Automatically set payment start date to one month after contract start date
  useEffect(() => {
    if (formData.start_date) {
      const newPaymentStartDate = addOneMonthToDate(formData.start_date);
      setFormData(prev => ({
        ...prev,
        payment_start_date: newPaymentStartDate
      }));
    }
  }, [formData.start_date]);

  // End date is calculated from start_date and term_months, not stored in database
  // No useEffect needed since it's calculated in render

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    // Validate months already paid
    if (formData.months_already_paid > formData.term_months) {
      setError(t('common.monthsAlreadyPaidExceedsTerm'));
      setIsSubmitting(false);
      return;
    }

    try {
      // Calculate next payment date based on months already paid
      const paymentStartDate = new Date(formData.payment_start_date);
      let nextDueDate: Date;
      let totalPaid = 0;
      let totalPrincipalPaid = 0;
      let paymentsCount = 0;

      if (formData.months_already_paid > 0) {
        // Calculate next due date starting from the month after the last paid month
        nextDueDate = calculateNextDueDateFromStartDate(paymentStartDate, formData.months_already_paid, formData.payment_interval);
        
        // Calculate totals for paid months
        totalPaid = formData.monthly_payment * formData.months_already_paid;
        totalPrincipalPaid = formData.monthly_payment * formData.months_already_paid;
        paymentsCount = formData.months_already_paid;
      } else {
        // No months paid, start from first month
        nextDueDate = calculateNextDueDateFromStartDate(paymentStartDate, 0, formData.payment_interval);
      }

      const contractData = {
        customer_id: formData.customer_id,
        company_id: formData.company_id,
        vehicle_id: formData.selected_vehicle_id,
        standard_purchase_price: formData.down_payment,
        down_payment: formData.down_payment,
        yearly_interest_rate: formData.yearly_interest_rate,
        term_months: formData.term_months,
        monthly_payment: formData.monthly_payment,
        original_monthly_payment: formData.monthly_payment, // Set original monthly payment
        total_payable: formData.total_payable,
        start_date: formData.start_date,
        payment_start_date: paymentStartDate.toISOString(),
        next_due_date: nextDueDate.toISOString(),
        payment_interval: formData.payment_interval as 'monthly',
        status: formData.status as 'active',
        // The down_payment field represents the loan amount (amount being financed)
        // The remaining balance is the principal amount that still needs to be paid (without interest)
        remaining_balance: Math.max(0, formData.down_payment - totalPrincipalPaid),
        total_paid: totalPaid, // Do not include down payment in total paid
        total_principal_paid: totalPrincipalPaid, // Do not include down payment in principal paid
        total_extra_payments: 0,
        payments_count: paymentsCount
      };

      const createdContract = await createContract(contractData);

      // Create payment records for months already paid
      if (formData.months_already_paid > 0) {
        console.log(`Creating ${formData.months_already_paid} payment records for contract ${createdContract.id}`);
        
        try {
          for (let month = 0; month < formData.months_already_paid; month++) {
            // Use addMonths from date-fns to handle month calculations correctly
            const paymentDate = addMonths(new Date(paymentStartDate), month);
            
            // Due date should be the same as payment date for already paid months
            const dueDate = new Date(paymentDate);
            
            const paymentData = {
              contract_id: createdContract.id,
              customer_id: formData.customer_id,
              company_id: formData.company_id,
              amount: formData.monthly_payment,
              payment_date: paymentDate.toISOString(),
              due_date: dueDate.toISOString(),
              interest_amount: 0,
              payment_method: 'cash' as const,
              is_late: false,
              days_late: 0,
              notes: `Payment for month ${month + 1} (created during contract creation)`
            };
            
            console.log(`Creating payment ${month + 1}:`, paymentData);
            
            const createdPayment = await createPayment(paymentData);
            console.log(`Payment ${month + 1} created successfully:`, createdPayment);
          }
          
          console.log(`All ${formData.months_already_paid} payment records created successfully`);
          
          // Verify payments were created by querying them
          try {
            const { getPaymentsByContract } = await import('../services/payments');
            const createdPayments = await getPaymentsByContract(createdContract.id);
            console.log(`Verified ${createdPayments.length} payments exist for contract ${createdContract.id}:`, createdPayments);
          } catch (verifyError) {
            console.error('Error verifying payments:', verifyError);
          }
          
          // Show success message for payments created
          if (formData.months_already_paid > 0) {
            setError(null); // Clear any previous errors
            // You could also set a success message here if you want to show it
          }
        } catch (paymentError) {
          console.error('Error creating payment records:', paymentError);
          console.error('Payment creation failed, but contract was created successfully');
          // Continue with contract creation even if payment creation fails
          // The contract is already created at this point
        }
      }
      
      // Show success message about payments created
      if (formData.months_already_paid > 0) {
        console.log(`Contract created successfully with ${formData.months_already_paid} payment records`);
      }
      
      // Save permission document (always save to handle both adding and removing drivers)
      // Do this BEFORE navigation to ensure it completes and any errors are visible
      console.log('Saving permission document with drivers:', {
        driversCount: drivers.length,
        drivers: drivers,
        contractId: createdContract.id
      });
      
      // Always try to save permission document, even if drivers array is empty
      // This ensures we can handle both adding and removing drivers
      const permissionDoc: PermissionDocument = {
        contract_id: createdContract.id,
        begin_date: new Date().toISOString().split('T')[0], // Use current date as default
        end_date: new Date().toISOString().split('T')[0], // Use current date as default for end_date too
        drivers: drivers
      };
      
      console.log('Attempting to save permission document:', {
        contractId: createdContract.id,
        driversCount: drivers.length,
        drivers: drivers,
        permissionDoc: permissionDoc
      });
      
      try {
        const savedPermissionDoc = await upsertPermissionDocument(permissionDoc);
        console.log('Permission document saved successfully:', savedPermissionDoc);
        
        // Show success message if drivers were saved
        if (drivers.length > 0) {
          console.log(`Successfully saved ${drivers.length} drivers for contract ${createdContract.id}`);
        }
      } catch (permissionError) {
        console.error('Error saving permission document:', permissionError);
        console.error('Permission document data that failed:', permissionDoc);
        console.error('Full error details:', {
          error: permissionError,
          message: permissionError instanceof Error ? permissionError.message : 'Unknown error',
          stack: permissionError instanceof Error ? permissionError.stack : undefined
        });
        
        // Don't fail the contract creation, but show the error prominently
        const errorMessage = `Contract created successfully, but failed to save drivers: ${permissionError instanceof Error ? permissionError.message : 'Unknown error'}`;
        setError(errorMessage);
        
        // Also log to console for debugging
        console.error('DRIVER SAVE FAILED:', errorMessage);
      }
      
      // Refresh contracts and payments data before navigating
      await Promise.all([
        loadContracts(),
        loadPayments({ contract_id: createdContract.id })
      ]);
      
      // Show success message
      showApiSuccess(t('notifications.created', { entity: t('common.contract') }), 'contract');
      
      // Navigate directly to contract details page
      navigate(`/contracts/${createdContract.id}`);
    } catch (error) {
      console.error('Error creating contract:', error);
      if (error instanceof Error) {
        if (error.message === 'Vehicle is already in an active contract') {
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


  const handleCustomerSelect = (customer: any) => {
    setSelectedCustomer(customer);
    setFormData(prev => ({
      ...prev,
      customer_id: customer.id
    }));
  };

  const handleVehicleSelect = (vehicle: any) => {
    setSelectedVehicle(vehicle);
    setFormData(prev => ({
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
        engine: vehicle.engine
      }
    }));
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    if (name === 'selected_vehicle_id') {
      const selectedVehicle = vehicles.find(v => v.id === value);
      if (selectedVehicle) {
        // Check if selected vehicle is in active contract
        const checkVehicleContract = async () => {
          try {
            const activeContract = await getActiveContractForVehicle(selectedVehicle.id);
            setActiveContractForSelectedVehicle(activeContract);
          } catch (error) {
            console.error('Error checking vehicle contract:', error);
            setActiveContractForSelectedVehicle(null);
          }
        };
        checkVehicleContract();
        setFormData(prev => ({
          ...prev,
          selected_vehicle_id: value,
          vehicle: selectedVehicle
        }));
      }
    } else if (name.startsWith('vehicle.')) {
      const vehicleField = name.split('.')[1];
      setFormData(prev => ({
        ...prev,
        vehicle: {
          ...prev.vehicle,
          [vehicleField]: type === 'number' ? parseInt(value) : value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: type === 'number' ? parseFloat(value) : value
      }));
    }
  };


  const generateYolVereqesiData = (): YolVereqesiData | null => {
    if (!selectedCustomer || !formData.vehicle.license_plate) {
      return null;
    }

    return {
      contractId: 'NEW',
      customerName: `${selectedCustomer.first_name} ${selectedCustomer.last_name}`,
      customerType: selectedCustomer.customer_type,
      vehicleInfo: {
        licensePlate: formData.vehicle.license_plate,
        make: formData.vehicle.make,
        model: formData.vehicle.model,
        year: formData.vehicle.year,
        color: formData.vehicle.color,

      },
      drivers: drivers.map(driver => ({
        name: driver.name,
        licenseNumber: driver.licenseNumber,
        phone: driver.phone,
        address: driver.address
      })),
      permissionDates: {
        beginDate: new Date().toISOString().split('T')[0], // Use current date as default
        endDate: '' // Leave empty
      },
      paymentInfo: {
        paymentDate: new Date().toISOString(),
        amount: formData.monthly_payment,
        paymentNumber: 1
      },
      companyInfo: {
        name: companies.find(c => c.id === formData.company_id)?.name || '',
        voen: companies.find(c => c.id === formData.company_id)?.voen,
        director: companies.find(c => c.id === formData.company_id)?.director
      }
    };
  };


  return (
    <div className="w-full space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-4">
        <button
          onClick={() => navigate('/contracts')}
          className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-50"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{t('common.createNewContract')}</h1>
          <p className="text-gray-600">{t('common.addNewContract')}</p>
        </div>
      </div>

      {/* Form */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-md p-4">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          {/* Company and Customer Selection */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="company_id" className="block text-sm font-medium text-gray-700 mb-2">
                {t('common.company')} *
              </label>
              <select
                id="company_id"
                name="company_id"
                value={formData.company_id}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">{t('common.selectACompany')}</option>
                {companies.map(company => (
                  <option key={company.id} value={company.id}>
                    {company.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('common.customer')} *
              </label>
              <div className="space-y-2">
                <button
                  type="button"
                  onClick={() => setShowCustomerModal(true)}
                  disabled={!formData.company_id}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-left bg-white hover:bg-gray-50 transition-colors disabled:bg-gray-100 disabled:cursor-not-allowed"
                >
                  {selectedCustomer ? (
                    <span className="text-gray-900">
                      {selectedCustomer.first_name} {selectedCustomer.last_name} - {selectedCustomer.national_id || t('common.noId')}
                    </span>
                  ) : (
                    <span className="text-gray-500">
                      {!formData.company_id 
                        ? t('common.selectACompanyFirst') 
                        : t('common.selectACustomer')
                      }
                    </span>
                  )}
                </button>
                {!formData.company_id && (
                  <p className="mt-1 text-sm text-gray-500">{t('common.selectCompanyToSeeCustomers')}</p>
                )}
              </div>
            </div>
          </div>

          {/* Vehicle Selection */}
          <div className="border-t border-gray-200 pt-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">{t('common.vehicleInformation')}</h3>
              <button
                type="button"
                onClick={() => navigate('/vehicles/create')}
                className="inline-flex items-center px-3 py-1 text-sm font-medium text-blue-600 hover:text-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <Car className="w-4 h-4 mr-1" />
                {t('common.addVehicle')}
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('common.vehicle')} *
                </label>
                <div className="space-y-2">
                  <button
                    type="button"
                    onClick={() => setShowVehicleModal(true)}
                    disabled={!formData.company_id}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-left bg-white hover:bg-gray-50 transition-colors disabled:bg-gray-100 disabled:cursor-not-allowed"
                  >
                    {selectedVehicle ? (
                      <span className="text-gray-900">
                        {selectedVehicle.license_plate} - {selectedVehicle.make} {selectedVehicle.model} ({selectedVehicle.year})
                      </span>
                    ) : (
                      <span className="text-gray-500">
                        {!formData.company_id 
                          ? t('common.selectACompanyFirst') 
                          : t('common.selectAVehicle')
                        }
                      </span>
                    )}
                  </button>
                  {!formData.company_id && (
                    <p className="mt-1 text-sm text-gray-500">{t('common.selectCompanyToSeeVehicles')}</p>
                  )}
                </div>
              </div>
            </div>
            
            {/* Selected Vehicle Details */}
            {formData.selected_vehicle_id && (
              <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                <h4 className="text-sm font-medium text-gray-700 mb-2">{t('common.selectedVehicle')}</h4>
                
                {/* Warning if vehicle is in use */}
                {activeContractForSelectedVehicle && (
                  <div className="mb-3 p-3 bg-amber-50 border border-amber-200 rounded-md">
                    <p className="text-sm text-amber-800">
                      ⚠️ {t('common.vehicleInUseByContract')}
                    </p>
                  </div>
                )}
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
                  <div>
                    <span className="font-medium text-gray-600">{t('common.licensePlate')}:</span>
                    <span className="ml-2 text-gray-900">{formData.vehicle.license_plate}</span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-600">{t('common.make')}:</span>
                    <span className="ml-2 text-gray-900">{formData.vehicle.make}</span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-600">{t('common.model')}:</span>
                    <span className="ml-2 text-gray-900">{formData.vehicle.model}</span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-600">{t('common.year')}:</span>
                    <span className="ml-2 text-gray-900">{formData.vehicle.year}</span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-600">{t('common.color')}:</span>
                    <span className="ml-2 text-gray-900">{formData.vehicle.color}</span>
                  </div>
                  <div>
                    
                  </div>
                  {formData.vehicle.body_number && (
                    <div>
                      <span className="font-medium text-gray-600">{t('common.bodyNumber')}:</span>
                      <span className="ml-2 text-gray-900">{formData.vehicle.body_number}</span>
                    </div>
                  )}
                  {formData.vehicle.engine && (
                    <div>
                      <span className="font-medium text-gray-600">{t('common.engine')}:</span>
                      <span className="ml-2 text-gray-900">{formData.vehicle.engine}</span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Financial Information */}
          <div className="border-t border-gray-200 pt-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">{t('common.financialInformation')}</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label htmlFor="down_payment" className="block text-sm font-medium text-gray-700 mb-2">
                  {t('common.downPayment')} *
                </label>
                <input
                  type="number"
                  id="down_payment"
                  name="down_payment"
                  value={formData.down_payment || ''}
                  onChange={handleChange}
                  min="0"
                  step="0.01"
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="0.00"
                />
              </div>
              <div>
                <label htmlFor="term_months" className="block text-sm font-medium text-gray-700 mb-2">
                  {t('common.termMonths')} *
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
                <label htmlFor="yearly_interest_rate" className="block text-sm font-medium text-gray-700 mb-2">
                  {t('common.yearlyInterestRatePercent')} *
                </label>
                <input
                  type="number"
                  id="yearly_interest_rate"
                  name="yearly_interest_rate"
                  value={formData.yearly_interest_rate || ''}
                  onChange={handleChange}
                  min="0"
                  max="100"
                  step="0.01"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="0.00 (0% faiz için 0 girin)"
                />
                <p className="text-xs text-gray-500 mt-1">
                  {t('common.yearlyInterestRateDescription') || '0% faiz oranı için 0 girin. Bu durumda aylık ödeme basit bölme ile hesaplanır.'}
                </p>
              </div>
              <div>
                <label htmlFor="months_already_paid" className="block text-sm font-medium text-gray-700 mb-2">
                  {t('common.monthsAlreadyPaid')}
                </label>
                <input
                  type="number"
                  id="months_already_paid"
                  name="months_already_paid"
                  value={formData.months_already_paid || ''}
                  onChange={handleChange}
                  min="0"
                  max={formData.term_months}
                  step="1"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="0"
                />
                <p className="text-xs text-gray-500 mt-1">{t('common.monthsAlreadyPaidDescription')}</p>
              </div>
              <div>
                <label htmlFor="monthly_payment" className="block text-sm font-medium text-gray-700 mb-2">
                  {t('common.monthlyPaymentCalculated')}
                </label>
                <input
                  type="number"
                  id="monthly_payment"
                  name="monthly_payment"
                  value={formData.monthly_payment ? Number(formData.monthly_payment).toFixed(2) : '0.00'}
                  readOnly
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-700"
                  placeholder="0.00"
                />
                <p className="text-xs text-gray-500 mt-1">{t('common.automaticallyCalculated')}</p>
              </div>
              <div>
                <label htmlFor="total_payable" className="block text-sm font-medium text-gray-700 mb-2">
                  {t('common.totalPayableCalculated')}
                </label>
                <input
                  type="number"
                  id="total_payable"
                  name="total_payable"
                  value={formData.total_payable ? Number(formData.total_payable).toFixed(2) : '0.00'}
                  readOnly
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-700"
                  placeholder="0.00"
                />
                <p className="text-xs text-gray-500 mt-1">{t('common.totalPayable')}</p>
              </div>
            </div>
          </div>

          {/* Date Information */}
          <div className="border-t border-gray-200 pt-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">{t('common.dateInformation')}</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <ImprovedDateInput
                  value={formData.start_date}
                  onChange={(value) => setFormData(prev => ({ ...prev, start_date: value }))}
                  label={t('common.startDate')}
                  required
                  placeholder="Başlama tarixini seçin"
                />
              </div>
              <div>
                <ImprovedDateInput
                  label="Ödəniş Başlanğıc Tarixi *"
                  value={formData.payment_start_date}
                  onChange={(value) => setFormData(prev => ({ ...prev, payment_start_date: value }))}
                  required
                  disabled
                  placeholder="Ödəniş başlama tarixini seçin"
                />
                <p className="text-xs text-gray-500 mt-1">
                  {t('common.autoSetOneMonthAfter')}
                </p>
              </div>

            </div>
          </div>

          {/* Permission Document Section */}
          <div className="border-t border-gray-200 pt-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900 flex items-center">
                <FileText className="w-5 h-5 mr-2" />
                {t('common.permissionDocument')}
              </h3>
              {drivers.length > 0 && generateYolVereqesiData() && (
                <div className="flex space-x-2">
                  <button
                    type="button"
                    onClick={() => setShowDocumentPreview(!showDocumentPreview)}
                    className="inline-flex items-center px-3 py-2 text-sm font-medium text-green-600 hover:text-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                  >
                    <FileText className="w-4 h-4 mr-1" />
                    {showDocumentPreview ? t('common.hidePreview') : t('common.showPreview')}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const data = generateYolVereqesiData();
                      if (data) {
                        printYolVereqesi(data);
                      }
                    }}
                    className="inline-flex items-center px-3 py-2 text-sm font-medium text-blue-600 hover:text-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    <FileText className="w-4 h-4 mr-1" />
                    {t('common.printYolVereqesi')}
                  </button>
                </div>
              )}
            </div>
            
            <p className="text-sm text-gray-600 mb-4">{t('common.permissionDocumentInfo')}</p>
            


            {/* Driver Management */}
            <DriverManagement
              drivers={drivers}
              onDriversChange={setDrivers}
              disabled={isSubmitting}
            />

            {/* Document Preview */}
            {showDocumentPreview && generateYolVereqesiData() && (
              <div className="mt-6 border-t border-gray-200 pt-6">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-md font-medium text-gray-900">
                    {t('common.documentPreview')}
                  </h4>
                  <button
                    type="button"
                    onClick={() => {
                      const data = generateYolVereqesiData();
                      if (data) {
                        printYolVereqesi(data);
                      }
                    }}
                    className="inline-flex items-center px-3 py-2 text-sm font-medium text-blue-600 hover:text-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    <FileText className="w-4 h-4 mr-1" />
                    {t('common.printYolVereqesi')}
                  </button>
                </div>
                <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                  <div 
                    className="p-4 max-h-96 overflow-y-auto"
                    dangerouslySetInnerHTML={{ 
                      __html: generateYolVereqesiHTML(generateYolVereqesiData()!) 
                    }}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-100 border border-red-200 text-red-800 px-4 py-3 rounded relative mb-4" role="alert">
              <strong className="font-bold">{t('common.error')}:</strong>
              <span className="block sm:inline"> {error}</span>
            </div>
          )}

          {/* Submit Button */}
          <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={() => navigate('/contracts')}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              {t('common.cancel')}
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !formData.customer_id || !formData.company_id}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Save className="w-4 h-4 mr-2" />
              {isSubmitting ? t('common.creating') : t('common.createContract')}
            </button>
          </div>
        </form>
      </div>

      {/* Customer Selection Modal */}
      <CustomerSelectionModal
        isOpen={showCustomerModal}
        onClose={() => setShowCustomerModal(false)}
        onSelect={handleCustomerSelect}
        customers={customers}
        selectedCompanyId={formData.company_id}
      />

      {/* Vehicle Selection Modal */}
      <VehicleSelectionModal
        isOpen={showVehicleModal}
        onClose={() => setShowVehicleModal(false)}
        onSelect={handleVehicleSelect}
        vehicles={vehicles}
        selectedCompanyId={formData.company_id}
      />

    </div>
  );
};

export default ContractCreate;


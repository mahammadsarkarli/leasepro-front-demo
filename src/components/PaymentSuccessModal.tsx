import React, { useState, useEffect } from 'react';
import { useTranslation } from '../i18n';
import { useAuth } from '../contexts/AuthContext';
import { X, Printer, FileText, Calendar, User, Plus, Edit, Trash2 } from 'lucide-react';
import { printDocument, generatePaymentReceipt } from '../utils/pdfUtils';
import { printEtibarname } from '../utils/etibarnameUtils';
import ImprovedDateInput from './ui/ImprovedDateInput';
import { ContractStatus, PaymentMethod, CustomerType } from '../types';
import { formatDisplayDate } from '../utils/dateUtils';

interface PaymentSuccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  paymentData: {
    id: string;
    amount: number;
    paymentDate: string;
    dueDate: string;
    nextDueDate: string;
    paymentMethod: string;
    notes?: string;
  };
  contractData: {
    id: string;
    customer: {
      id: string;
      first_name: string;
      last_name: string;
      father_name?: string;
      company_name?: string;
      customer_type: string;
      national_id?: string;
      voen?: string;
      license_number?: string;
      license_category?: string;
      license_given_date?: string;
      phone?: string;
      address?: string;
    };
    vehicle: {
      id: string;
      company_id: string;
      license_plate: string;
      make: string;
      model: string;
      year: number;
      color: string;
      body_number: string;
      registration_certificate_number: string;
      engine: string;
      vin?: string;
      type?: string;
      texpasport_document?: string;
    };
    company: {
      id: string;
      name: string;
      logo?: string;
      voen?: string;
      director?: string;
    };
  };
  drivers: Array<{
    id: string;
    name: string;
    licenseNumber: string;
    license_category?: string;
    license_given_date?: Date;
    phone?: string;
    address?: string;
  }>;
}

const PaymentSuccessModal: React.FC<PaymentSuccessModalProps> = ({
  isOpen,
  onClose,
  paymentData,
  contractData,
  drivers
}) => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [etibarnameBeginDate, setEtibarnameBeginDate] = useState('');
  const [etibarnameEndDate, setEtibarnameEndDate] = useState('');
  const [editableDrivers, setEditableDrivers] = useState<any[]>([]);
  const [, setIsEditingDrivers] = useState(false);
  const [editingDriverId, setEditingDriverId] = useState<string | null>(null);
  const [editingDriver, setEditingDriver] = useState<any>({
    id: '',
    name: '',
    licenseNumber: '',
    license_category: '',
    license_given_date: null
  });
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [newDriver, setNewDriver] = useState<any>({
    id: '',
    name: '',
    licenseNumber: '',
    license_category: '',
    license_given_date: null
  });

  

  // Set default dates when modal opens and initialize editable drivers
  useEffect(() => {
    if (isOpen) {
      setEtibarnameBeginDate(paymentData.dueDate);
      setEtibarnameEndDate(paymentData.nextDueDate);
      // Ensure main customer is included in drivers list if not already present
      const mainCustomerDriver = {
        id: 'main-customer',
        name: `${contractData.customer.first_name} ${contractData.customer.last_name} ${contractData.customer.father_name}`,
        licenseNumber: contractData.customer.license_number || '',
        license_category: contractData.customer.license_category || '',
        license_given_date: contractData.customer.license_given_date ? new Date(contractData.customer.license_given_date) : null,
        phone: contractData.customer.phone || '',
        address: contractData.customer.address || ''
      };

      // Check if main customer is already in the drivers list
      const hasMainCustomer = drivers.some(driver => driver.id === 'main-customer');
      
      if (!hasMainCustomer) {
        // Add main customer to the beginning of the drivers list
        setEditableDrivers([mainCustomerDriver, ...drivers]);
      } else {
        setEditableDrivers(drivers);
      }
      
      setIsEditingDrivers(true); // Open directly to edit mode
    }
  }, [isOpen, paymentData.dueDate, paymentData.nextDueDate, drivers, contractData.customer]);

  // Driver management functions
  const removeDriver = (driverId: string) => {
    console.log('PaymentSuccessModal - Removing driver with ID:', driverId);
    console.log('PaymentSuccessModal - Current editableDrivers before removal:', editableDrivers);
    const updatedDrivers = editableDrivers.filter(driver => driver.id !== driverId);
    console.log('PaymentSuccessModal - Updated editableDrivers after removal:', updatedDrivers);
    setEditableDrivers(updatedDrivers);
  };

  const addDriver = () => {
    setIsAddingNew(true);
    setNewDriver({
      id: '',
      name: '',
      licenseNumber: '',
      license_category: '',
      license_given_date: null,
    });
  };

  const handleAddNewDriver = () => {
    if (!newDriver.name || !newDriver.licenseNumber) return;
    
    const driverToAdd = {
      ...newDriver,
      id: `driver-${Date.now()}`
    };
    
    setEditableDrivers([...editableDrivers, driverToAdd]);
    setIsAddingNew(false);
    setNewDriver({
      id: '',
      name: '',
      licenseNumber: '',
      license_category: '',
      license_given_date: null,
    });
  };

  const handleCancelAddNew = () => {
    setIsAddingNew(false);
    setNewDriver({
      id: '',
      name: '',
      licenseNumber: '',
      license_category: '',
      license_given_date: null,
    });
  };

  const handleEditDriver = (driver: any) => {
    setEditingDriver(driver);
    setEditingDriverId(driver.id);
  };

  const handleUpdateDriver = () => {
    setEditableDrivers(editableDrivers.map(driver =>
      driver.id === editingDriverId ? editingDriver : driver
    ));
    setEditingDriverId(null);
    setEditingDriver({
      id: '',
      name: '',
      licenseNumber: '',
      license_category: '',
      license_given_date: null,
    });
  };

  const handleCancelEdit = () => {
    setEditingDriverId(null);
    setEditingDriver({
      id: '',
      name: '',
      licenseNumber: '',
      license_category: '',
      license_given_date: null,
    });
  };

  // Removed auto-print to allow manual control after editing drivers

  if (!isOpen) return null;

  const handlePrintPaymentReceipt = () => {
    // Create a minimal contract object for the receipt
    const contractForReceipt = {
      id: contractData.id,
      customer_id: contractData.customer.id,
      company_id: contractData.company.id,
      vehicle: contractData.vehicle,
      standard_purchase_price: 0,
      down_payment: 0,
      yearly_interest_rate: 0,
      term_months: 0,
      monthly_payment: 0,
      original_monthly_payment: 0,
      total_payable: 0,
      start_date: new Date(),
      payment_start_date: new Date(),
      next_due_date: new Date(),
      payment_interval: 'monthly' as any,
      status: ContractStatus.OPEN,
      remaining_balance: 0,
      total_paid: 0,
      total_principal_paid: 0,
      total_extra_payments: 0,
      payments_count: 0,
      created_at: new Date(),
      updated_at: new Date()
    };

    const receiptData = {
      payment: {
        id: paymentData.id,
        amount: paymentData.amount,
        payment_date: new Date(paymentData.paymentDate),
        due_date: new Date(paymentData.dueDate),
        payment_method: paymentData.paymentMethod as PaymentMethod,
        notes: paymentData.notes || '',
        customer_id: contractData.customer.id,
        company_id: contractData.company.id,
        contract_id: contractData.id,
        interest_amount: 0,
        is_late: false,
        days_late: 0,
        created_at: new Date(),
        updated_at: new Date()
      },
      contract: contractForReceipt,
      customer: {
        id: contractData.customer.id,
        company_id: contractData.company.id,
        customer_type: contractData.customer.customer_type as CustomerType,
        first_name: contractData.customer.first_name,
        last_name: contractData.customer.last_name,
        company_name: contractData.customer.company_name,
        national_id: contractData.customer.national_id,
        voen: contractData.customer.voen,
        license_number: contractData.customer.license_number,
        license_category: contractData.customer.license_category,
        license_given_date: contractData.customer.license_given_date ? new Date(contractData.customer.license_given_date) : undefined,
        phone: contractData.customer.phone || '',
        address: contractData.customer.address || '',
        contacts: [],
        created_at: new Date(),
        is_active: true
      },
      company: {
        id: contractData.company.id,
        name: contractData.company.name,
        logo: contractData.company.logo,
        voen: contractData.company.voen,
        director: contractData.company.director,
        interest_rate: 1,
        created_at: new Date(),
        is_active: true
      },
      user: user?.full_name || t('common.unknownUser')
    };

    const htmlContent = generatePaymentReceipt(receiptData);
    printDocument(htmlContent, `payment-receipt-${paymentData.id}`);
  };


  const handlePrintEtibarname = () => {
    if (!etibarnameBeginDate || !etibarnameEndDate) {
      alert('Please select both begin and end dates for Etibarnamə');
      return;
    }

    // Use editable drivers array
    console.log('Printing with editable drivers:', editableDrivers);
    const allDrivers = editableDrivers.map(driver => ({
      id: driver.id,
      name: driver.name,
      licenseNumber: driver.licenseNumber,
      license_category: driver.license_category,
      license_given_date: driver.license_given_date,
      phone: driver.phone,
      address: driver.address
    }));

    // Check if main customer is in the drivers list
    const mainCustomerInDrivers = editableDrivers.some(driver => driver.id === 'main-customer');
    
    console.log('PaymentSuccessModal - Vehicle data being passed:', contractData.vehicle);
    console.log('PaymentSuccessModal - Vehicle data keys:', contractData.vehicle ? Object.keys(contractData.vehicle) : 'null');
    console.log('PaymentSuccessModal - Drivers data being passed:', allDrivers);
    console.log('PaymentSuccessModal - Main customer in drivers:', mainCustomerInDrivers);
    
    // Create a proper customer object that matches the Customer type
    const customerForEtibarname = {
      id: contractData.customer.id,
      company_id: contractData.company.id,
      customer_type: contractData.customer.customer_type as CustomerType,
      first_name: contractData.customer.first_name,
      last_name: contractData.customer.last_name,
      company_name: contractData.customer.company_name,
      national_id: contractData.customer.national_id,
      voen: contractData.customer.voen,
      license_number: contractData.customer.license_number,
      license_category: contractData.customer.license_category,
      license_given_date: contractData.customer.license_given_date ? new Date(contractData.customer.license_given_date) : undefined,
      phone: contractData.customer.phone || '',
      address: contractData.customer.address || '',
      contacts: [],
      created_at: new Date(),
      is_active: true
    };

    const etibarnameData = {
      contractId: contractData.id,
      customer: customerForEtibarname,
      company: {
        id: contractData.company.id,
        name: contractData.company.name,
        logo: contractData.company.logo,
        voen: contractData.company.voen,
        director: contractData.company.director,
        interest_rate: 1,
        created_at: new Date(),
        is_active: true
      },
      vehicle: contractData.vehicle,
      drivers: allDrivers,
      permissionDates: {
        beginDate: etibarnameBeginDate,
        endDate: etibarnameEndDate
      },
      paymentInfo: {
        paymentDate: paymentData.paymentDate,
        amount: paymentData.amount,
        paymentNumber: 1
      },
      excludeCustomerDetails: !mainCustomerInDrivers, // Exclude customer details if main customer is not in drivers list
      translations: {
        address: t('common.address'),
        phone: t('common.phone'),
        email: t('common.email')
      }
    };

    printEtibarname(etibarnameData, false, !mainCustomerInDrivers);
  };


  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900 flex items-center">
            <FileText className="w-6 h-6 mr-2 text-green-600" />
            {t('pages.payments.createPayment.paymentSuccess')}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Success Message */}
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center">
              <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center mr-3">
                <FileText className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <h3 className="text-sm font-medium text-green-800">
                  {t('pages.payments.createPayment.paymentRecordedSuccessfully')}
                </h3>
                <p className="text-sm text-green-700 mt-1">
                  {t('common.paymentAmount')}: ₼{Math.round(paymentData.amount)}
                </p>
              </div>
            </div>
          </div>

          {/* Document Options */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900">
              {t('pages.payments.createPayment.printDocuments')}
            </h3>

            {/* Payment Receipt */}
            <div className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
                    <Printer className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-gray-900">
                      {t('pages.payments.createPayment.paymentReceipt')}
                    </h4>
                    <p className="text-sm text-gray-500">
                      {t('pages.payments.createPayment.printPaymentReceipt')}
                    </p>
                  </div>
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={handlePrintPaymentReceipt}
                    className="inline-flex items-center px-3 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors"
                  >
                    <Printer className="w-4 h-4 mr-1" />
                    {t('common.print')}
                  </button>
                  {/* <button
                    onClick={handleDownloadPaymentReceipt}
                    className="inline-flex items-center px-3 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
                  >
                    <Download className="w-4 h-4 mr-1" />
                    {t('common.download')}
                  </button> */}
                </div>
              </div>
            </div>

                         {/* Etibarnamə */}
             <div className="border border-gray-200 rounded-lg p-4">
               <div className="flex items-start justify-between">
                 <div className="flex items-center">
                   <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center mr-3">
                     <FileText className="w-5 h-5 text-green-600" />
                   </div>
                   <div>
                     <h4 className="text-sm font-medium text-gray-900">
                       {t('pages.payments.createPayment.etibarname')}
                     </h4>
                     <p className="text-sm text-gray-500">
                       {t('pages.payments.createPayment.printEtibarname')}
                     </p>
                   </div>
                 </div>
                 <div className="flex space-x-2">
                   <button
                     onClick={handlePrintEtibarname}
                     className="inline-flex items-center px-3 py-2 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-md transition-colors"
                   >
                     <Printer className="w-4 h-4 mr-1" />
                     {t('common.print')}
                   </button>
                   {/* <button
                     onClick={handleDownloadEtibarname}
                     className="inline-flex items-center px-3 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
                   >
                     <Download className="w-4 h-4 mr-1" />
                     {t('common.download')}
                   </button> */}
                 </div>
               </div>

               {/* Date Selection for Etibarnamə - Always visible */}
               <div className="mt-4 pt-4 border-t border-gray-100">
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                   <div>
                     <label className="block text-sm font-medium text-gray-700 mb-1">
                       <Calendar className="w-4 h-4 inline mr-1" />
                       {t('pages.payments.createPayment.beginDate')}
                     </label>
                     <ImprovedDateInput
                       value={etibarnameBeginDate}
                       onChange={(value) => setEtibarnameBeginDate(value)}
                       placeholder={t('common.selectBeginDate')}
                     />
                   </div>
                   <div>
                     <label className="block text-sm font-medium text-gray-700 mb-1">
                       <Calendar className="w-4 h-4 inline mr-1" />
                       {t('pages.payments.createPayment.endDate')}
                     </label>
                     <ImprovedDateInput
                       value={etibarnameEndDate}
                       onChange={(value) => setEtibarnameEndDate(value)}
                       placeholder={t('common.selectEndDate')}
                     />
                   </div>
                 </div>
                 
                 
                 {/* Drivers Section */}
                 <div className="mt-4">
                   <div className="flex items-center justify-between mb-4">
                     <h3 className="text-lg font-medium text-gray-900 flex items-center">
                       <User className="w-5 h-5 mr-2" />
                       Sürücülər ({editableDrivers.length})
                     </h3>
                     <button
                       type="button"
                       onClick={addDriver}
                       className="inline-flex items-center px-3 py-2 text-sm font-medium text-blue-600 hover:text-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                     >
                       <Plus className="w-4 h-4 mr-1" />
                       Sürücü Əlavə Et
                     </button>
                   </div>

                   {/* Add New Driver Form */}
                   {isAddingNew && (
                     <div className="bg-gray-50 p-4 rounded-lg border mb-4">
                       <h4 className="text-sm font-medium text-gray-900 mb-3">
                         Yeni Sürücü Əlavə Et
                       </h4>
                       <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                         <div>
                           <label className="block text-sm font-medium text-gray-700 mb-1">
                             Ad Soyad *
                           </label>
                           <input
                             type="text"
                             value={newDriver.name}
                             onChange={(e) => setNewDriver((prev: any) => ({ ...prev, name: e.target.value }))}
                             className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                             placeholder="Ad soyadını daxil edin"
                           />
                         </div>
                         <div>
                           <label className="block text-sm font-medium text-gray-700 mb-1">
                             Sürücülük Vəsiqəsi *
                           </label>
                           <input
                             type="text"
                             value={newDriver.licenseNumber}
                             onChange={(e) => setNewDriver((prev: any) => ({ ...prev, licenseNumber: e.target.value }))}
                             className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                             placeholder="Vəsiqə nömrəsini daxil edin"
                           />
                         </div>
                         <div>
                           <label className="block text-sm font-medium text-gray-700 mb-1">
                             Kateqoriya
                           </label>
                           <input
                             type="text"
                             value={newDriver.license_category}
                             onChange={(e) => setNewDriver((prev: any) => ({ ...prev, license_category: e.target.value }))}
                             className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                             placeholder={t('common.categoryPlaceholder')}
                           />
                         </div>
                         <div>
                           <label className="block text-sm font-medium text-gray-700 mb-1">
                             Verilmə Tarixi
                           </label>
                           <input
                             type="date"
                             value={newDriver.license_given_date ? new Date(newDriver.license_given_date).toISOString().split('T')[0] : ''}
                             onChange={(e) => setNewDriver((prev: any) => ({ ...prev, license_given_date: e.target.value }))}
                             className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                           />
                         </div>
                       </div>
                       <div className="flex justify-end space-x-3 mt-4">
                         <button
                           type="button"
                           onClick={handleCancelAddNew}
                           className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
                         >
                           Ləğv et
                         </button>
                         <button
                           type="button"
                           onClick={handleAddNewDriver}
                           disabled={!newDriver.name || !newDriver.licenseNumber}
                           className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
                         >
                           Əlavə Et
                         </button>
                       </div>
                     </div>
                   )}

                   {/* Drivers List */}
                   {editableDrivers.length === 0 && !isAddingNew ? (
                     <div className="text-center py-8 border-2 border-dashed border-gray-300 rounded-lg">
                       <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                         <Plus className="w-6 h-6 text-gray-400" />
                       </div>
                       <p className="text-gray-500">Sürücü yoxdur</p>
                       <p className="text-sm text-gray-400 mt-1">
                         Sürücü əlavə etmək üçün yuxarıdakı düyməni basın
                       </p>
                     </div>
                   ) : editableDrivers.length > 0 ? (
                     <div className="space-y-3">
                       {editableDrivers.map((driver) => (
                         <div key={driver.id}>
                           {editingDriverId === driver.id ? (
                             // Edit Form
                             <div className="bg-gray-50 p-4 rounded-lg border">
                               <h4 className="text-sm font-medium text-gray-900 mb-3">
                                 Sürücü Redaktə Et
                               </h4>
                               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                 <div>
                                   <label className="block text-sm font-medium text-gray-700 mb-1">
                                     Ad Soyad *
                                   </label>
                                   <input
                                     type="text"
                                     value={editingDriver.name}
                                     onChange={(e) => setEditingDriver((prev: any) => ({ ...prev, name: e.target.value }))}
                                     className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                     placeholder="Ad soyadını daxil edin"
                                   />
                                 </div>
                                 <div>
                                   <label className="block text-sm font-medium text-gray-700 mb-1">
                                     Sürücülük Vəsiqəsi *
                                   </label>
                                   <input
                                     type="text"
                                     value={editingDriver.licenseNumber}
                                     onChange={(e) => setEditingDriver((prev: any) => ({ ...prev, licenseNumber: e.target.value }))}
                                     className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                     placeholder="Vəsiqə nömrəsini daxil edin"
                                   />
                                 </div>
                                 <div>
                                   <label className="block text-sm font-medium text-gray-700 mb-1">
                                     Kateqoriya
                                   </label>
                                   <input
                                     type="text"
                                     value={editingDriver.license_category}
                                     onChange={(e) => setEditingDriver((prev: any) => ({ ...prev, license_category: e.target.value }))}
                                     className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                     placeholder={t('common.categoryPlaceholder')}
                                   />
                                 </div>
                                 <div>
                                   <label className="block text-sm font-medium text-gray-700 mb-1">
                                     Verilmə Tarixi
                                   </label>
                                   <input
                                     type="date"
                                     value={editingDriver.license_given_date ? new Date(editingDriver.license_given_date).toISOString().split('T')[0] : ''}
                                     onChange={(e) => setEditingDriver((prev: any) => ({ ...prev, license_given_date: e.target.value }))}
                                     className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                   />
                                 </div>
                               </div>
                               <div className="flex justify-end space-x-3 mt-4">
                                 <button
                                   type="button"
                                   onClick={handleCancelEdit}
                                   className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
                                 >
                                   Ləğv et
                                 </button>
                                 <button
                                   type="button"
                                   onClick={handleUpdateDriver}
                                   disabled={!editingDriver.name || !editingDriver.licenseNumber}
                                   className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
                                 >
                                   Yenilə
                                 </button>
                               </div>
                             </div>
                           ) : (
                             // Display Mode
                             <div className="flex items-center justify-between p-3 bg-white border border-gray-200 rounded-lg">
                               <div className="flex-1">
                                 <div className="flex items-center space-x-3">
                                   <User className="w-5 h-5 text-gray-400" />
                                   <div>
                                     <h4 className="text-sm font-medium text-gray-900">
                                       {driver.name}
                                       {driver.id === 'main-customer' && (
                                         <span className="ml-2 text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                                           Əsas Sürücü
                                         </span>
                                       )}
                                     </h4>
                                     <p className="text-sm text-gray-500">
                                       Sürücülük Vəsiqəsi: {driver.licenseNumber || 'Məlumat yoxdur'}
                                     </p>
                                     {driver.license_category && (
                                       <p className="text-sm text-gray-500">
                                         Kateqoriya: {driver.license_category}
                                       </p>
                                     )}
                                     {driver.license_given_date && (
                                       <p className="text-sm text-gray-500">
                                         Verilmə Tarixi: {formatDisplayDate(driver.license_given_date)}
                                       </p>
                                     )}
                                   </div>
                                 </div>
                               </div>
                               <div className="flex items-center space-x-2">
                                 <button
                                   type="button"
                                   onClick={() => handleEditDriver(driver)}
                                   className="p-1 text-gray-400 hover:text-blue-600 transition-colors"
                                 >
                                   <Edit className="w-4 h-4" />
                                 </button>
                                 <button
                                   type="button"
                                   onClick={() => removeDriver(driver.id)}
                                   className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                                 >
                                   <Trash2 className="w-4 h-4" />
                                 </button>
                               </div>
                             </div>
                           )}
                         </div>
                       ))}
                     </div>
                   ) : null}
                 </div>
               </div>
             </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end p-6 border-t border-gray-200">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
          >
            {t('common.close')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default PaymentSuccessModal;

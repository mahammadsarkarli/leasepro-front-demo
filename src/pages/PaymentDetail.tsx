import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from '../i18n';
import { useData } from '../contexts/DataContext';
import { useAuth } from '../contexts/AuthContext';
import { PaymentMethod, ContractStatus } from '../types';
import { formatDisplayDate } from '../utils/dateUtils';
import { getPaymentMethodLabel } from '../utils/paymentUtils';
import { getDisplayMonthlyPayment } from '../utils/paymentCalculationUtils';
import { ReceiptData, generatePaymentReceipt } from '../utils/pdfUtils';
import { printDocument } from '../utils/pdfUtils';
import AuthorizationDialog from '../components/AuthorizationDialog';
import { ArrowLeft, DollarSign, CreditCard, Calendar, User, Trash2, Printer, CheckCircle, AlertCircle, Car, Building, Clock } from 'lucide-react';

const PaymentDetail: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { t } = useTranslation();
  const { payments, contracts, customers, companies, loadPayments, loadContracts, loadCustomers, loadCompanies, deletePayment } = useData();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showAuthorizationDialog, setShowAuthorizationDialog] = useState(false);

  // Load data if not already loaded
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        await Promise.all([
          loadPayments(),
          loadContracts(),
          loadCustomers(),
          loadCompanies()
        ]);
      } catch (error) {
        console.error('Error loading data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []); // Remove function dependencies to prevent repeated calls

  // Find payment and related data from context
  const payment = useMemo(() => {
    const foundPayment = payments.find(p => p.id === id);
    if (!foundPayment) return null;
    
    // Convert string dates to Date objects if needed
    return {
      ...foundPayment,
      payment_date: foundPayment.payment_date instanceof Date ? foundPayment.payment_date : new Date(foundPayment.payment_date),
      due_date: foundPayment.due_date instanceof Date ? foundPayment.due_date : new Date(foundPayment.due_date)
    };
  }, [payments, id]);

  const contract = useMemo(() => {
    if (!payment?.contract_id) return null;
    return contracts.find(c => c.id === payment.contract_id) || null;
  }, [contracts, payment]);

  const customer = useMemo(() => {
    if (!contract?.customer_id) return null;
    return customers.find(c => c.id === contract.customer_id) || null;
  }, [customers, contract]);

  const company = useMemo(() => {
    if (!customer?.company_id) return null;
    return companies.find(c => c.id === customer.company_id) || null;
  }, [companies, customer]);

  const handleDelete = async () => {
    if (!payment) return;
    
    try {
      await deletePayment(payment.id);
      setShowDeleteModal(false);
      navigate('/payments');
    } catch (error) {
      console.error('Error deleting payment:', error);
    }
  };

  const getPaymentMethodIcon = (method: PaymentMethod) => {
    switch (method) {
      case PaymentMethod.CASH:
        return <DollarSign className="w-4 h-4" />;
      case PaymentMethod.BANK_TRANSFER:
        return <CreditCard className="w-4 h-4" />;
      case PaymentMethod.CARD_TO_CARD:
        return <CreditCard className="w-4 h-4" />;
      case PaymentMethod.AUTOMATIC:
        return <CreditCard className="w-4 h-4" />;
      case PaymentMethod.MANUAL:
        return <CreditCard className="w-4 h-4" />;
      default:
        return <CreditCard className="w-4 h-4" />;
    }
  };



  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <p className="mt-6 text-lg text-gray-700 font-medium">{t('pages.payments.detail.loadingPayment')}</p>
        </div>
      </div>
    );
  }

  if (!payment) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto">
          <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-200">
            <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">{t('common.paymentNotFound')}</h2>
            <p className="text-gray-600 mb-6">{t('pages.payments.detail.paymentNotFound')}</p>
            <button
              onClick={() => navigate('/payments')}
              className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-lg shadow-sm hover:bg-blue-700 transition-colors"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              {t('pages.payments.detail.backToPayments')}
            </button>
          </div>
        </div>
      </div>
    );
  }



  const getReceiptData = (): ReceiptData | null => {
    if (!payment || !contract) return null;
    
    if (!customer || !company) return null;
    
    return {
      payment,
      contract,
      customer,
      company,
      user: user?.full_name || t('common.unknownUser')
    };
  };



  const handlePrint = () => {
    const receiptData = getReceiptData();
    if (receiptData) {
      const htmlContent = generatePaymentReceipt(receiptData);
      printDocument(htmlContent, `payment-receipt-${receiptData.payment.id}`);
    }
  };

  const handleAuthorizationDialogClose = () => {
    setShowAuthorizationDialog(false);
  };


  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate('/payments')}
            className="inline-flex items-center text-sm font-medium text-gray-600 hover:text-gray-900 mb-4 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            {t('pages.payments.detail.backToPayments')}
          </button>
          
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{t('pages.payments.detail.title')}</h1>
            </div>
            
            <div className="flex items-center space-x-3 mt-4 sm:mt-0">
              <button
                onClick={handlePrint}
                className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-lg shadow-sm hover:bg-blue-700 transition-colors"
              >
                <Printer className="w-4 h-4 mr-2" />
                {t('pages.payments.detail.print')}
              </button>
             
              
              {/* {canEdit && (
                <button
                  onClick={() => navigate(`/payments/${id}/edit`)}
                  className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-lg shadow-sm hover:bg-indigo-700 transition-colors"
                >
                  <Edit className="w-4 h-4 mr-2" />
                  {t('common.edit')}
                </button>
              )} */}
              
              {/* {canDelete && (
                <button
                  onClick={() => setShowDeleteModal(true)}
                  className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-lg shadow-sm hover:bg-red-700 transition-colors"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  {t('common.delete')}
                </button>
              )} */}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Payment Information */}
          <div className="lg:col-span-2 space-y-6">
            {/* Payment Status Card */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="bg-gradient-to-r from-green-500 to-emerald-600 px-6 py-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <CheckCircle className="w-8 h-8 text-white mr-3" />
                    <div>
                      <h2 className="text-xl font-semibold text-white">{t('pages.payments.detail.paymentSuccessful')}</h2>
                      <p className="text-green-100">{t('pages.payments.detail.paymentProcessed')}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-3xl font-bold text-white">₼{Math.round(payment.amount)}</div>
                    <div className="text-green-100 text-sm">{t('pages.payments.detail.amountPaid')}</div>
                  </div>
                </div>
              </div>
              
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="flex items-center p-4 bg-gray-50 rounded-lg">
                    <Calendar className="w-5 h-5 text-blue-600 mr-3" />
                    <div>
                      <p className="text-sm font-medium text-gray-500">{t('pages.payments.detail.paymentDate')}</p>
                      <p className="text-lg font-semibold text-gray-900">
                        {payment.payment_date && !isNaN(payment.payment_date.getTime()) ? formatDisplayDate(payment.payment_date) : t('common.invalidDate')}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center p-4 bg-gray-50 rounded-lg">
                    <Clock className="w-5 h-5 text-orange-600 mr-3" />
                    <div>
                      <p className="text-sm font-medium text-gray-500">{t('pages.payments.detail.dueDate')}</p>
                      <p className="text-lg font-semibold text-gray-900">
                        {payment.due_date && !isNaN(payment.due_date.getTime()) ? formatDisplayDate(payment.due_date) : t('common.invalidDate')}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center p-4 bg-gray-50 rounded-lg">
                    {getPaymentMethodIcon(payment.payment_method)}
                    <div className="ml-3">
                      <p className="text-sm font-medium text-gray-500">{t('pages.payments.detail.paymentMethod')}</p>
                      <p className="text-lg font-semibold text-gray-900">
                        {getPaymentMethodLabel(payment.payment_method, t)}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center p-4 bg-gray-50 rounded-lg">
                    <User className="w-5 h-5 text-purple-600 mr-3" />
                    <div>
                      <p className="text-sm font-medium text-gray-500">{t('common.createdBy')}</p>
                      <p className="text-lg font-semibold text-gray-900">
                        {payment.whoCreated || t('common.unknown')}
                      </p>
                    </div>
                  </div>
                  
                </div>
                
              </div>
            </div>

            {/* Contract Information */}
            {contract && (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="bg-gradient-to-r from-blue-500 to-indigo-600 px-6 py-4">
                  <div className="flex items-center">
                    <Car className="w-6 h-6 text-white mr-3" />
                    <h2 className="text-xl font-semibold text-white">{t('pages.payments.detail.contractInformation')}</h2>
                  </div>
                </div>
                
                <div className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                         <div>
                       <h3 className="text-lg font-semibold text-gray-900 mb-4">{t('pages.payments.detail.vehicleDetails')}</h3>
                      <div className="space-y-3">
                                                 <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                           <span className="text-sm font-medium text-gray-600">{t('pages.payments.detail.vehicle')}</span>
                          <span className="text-sm font-semibold text-gray-900">
                            {contract.vehicle.make} {contract.vehicle.model}
                          </span>
                        </div>
                                                 <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                           <span className="text-sm font-medium text-gray-600">{t('common.licensePlate')}</span>
                          <span className="text-sm font-semibold text-gray-900 font-mono">
                            {contract.vehicle.license_plate}
                          </span>
                        </div>
                                                 <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                           <span className="text-sm font-medium text-gray-600">{t('common.year')}</span>
                          <span className="text-sm font-semibold text-gray-900">{contract.vehicle.year}</span>
                        </div>
                      </div>
                    </div>
                    
                                         <div>
                       <h3 className="text-lg font-semibold text-gray-900 mb-4">{t('pages.payments.detail.financialDetails')}</h3>
                      <div className="space-y-3">
                                                 <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                           <span className="text-sm font-medium text-gray-600">{t('pages.payments.detail.monthlyPayment')}</span>
                          <span className="text-sm font-semibold text-gray-900">₼{Math.round(getDisplayMonthlyPayment(contract))}</span>
                        </div>
                                                 <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                           <span className="text-sm font-medium text-gray-600">{t('pages.payments.detail.remainingBalance')}</span>
                          <span className="text-sm font-semibold text-gray-900">₼{Math.round(contract.remaining_balance)}</span>
                        </div>
                                                 <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                           <span className="text-sm font-medium text-gray-600">{t('pages.payments.detail.status')}</span>
                          <span className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full ${
                            contract.status === ContractStatus.ACTIVE ? 'bg-green-100 text-green-800' :
                            contract.status === ContractStatus.COMPLETED ? 'bg-blue-100 text-blue-800' :
                            contract.status === ContractStatus.OPEN ? 'bg-yellow-100 text-yellow-800' :
                            contract.status === ContractStatus.TAMAMLANMIS ? 'bg-green-100 text-green-800' :
                            contract.status === ContractStatus.ALQI_SATQI ? 'bg-orange-100 text-orange-800' :
                            contract.status === ContractStatus.IMTINA_EDILMIS ? 'bg-red-100 text-red-800' :
                            'bg-red-100 text-red-800'
                          }`}>
                            {t(`common.${contract.status}`)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Sidebar - Customer & Company Info */}
          <div className="space-y-6">
            {/* Customer Information */}
            {customer && (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="bg-gradient-to-r from-purple-500 to-pink-600 px-6 py-4">
                  <div className="flex items-center">
                    <User className="w-6 h-6 text-white mr-3" />
                    <h2 className="text-xl font-semibold text-white">{t('common.customer')}</h2>
                  </div>
                </div>
                
                <div className="p-6">
                  <div className="text-center mb-4">
                    <div className="w-16 h-16 bg-gradient-to-br from-purple-400 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-3">
                      <span className="text-white text-xl font-bold">
                        {customer.first_name?.charAt(0) || ''}{customer.last_name?.charAt(0) || ''}
                      </span>
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      {customer.first_name} {customer.last_name}
                    </h3>
                    <p className="text-sm text-gray-600">{customer.father_name}</p>
                  </div>
                  
                  <div className="space-y-3">
                                         <div className="flex items-center p-3 bg-gray-50 rounded-lg">
                       <div className="w-2 h-2 bg-purple-500 rounded-full mr-3"></div>
                       <div>
                         <p className="text-xs font-medium text-gray-500">{t('pages.payments.detail.phone')}</p>
                        <p className="text-sm font-semibold text-gray-900">{customer.phone}</p>
                      </div>
                    </div>
                    
                                         <div className="flex items-center p-3 bg-gray-50 rounded-lg">
                       <div className="w-2 h-2 bg-purple-500 rounded-full mr-3"></div>
                       <div>
                         <p className="text-xs font-medium text-gray-500">{t('common.address')}</p>
                        <p className="text-sm font-semibold text-gray-900">{customer.address}</p>
                      </div>
                    </div>
                    
                    {customer.contacts && customer.contacts.length > 0 && (
                                             <div className="mt-4">
                         <h4 className="text-sm font-semibold text-gray-900 mb-2">{t('pages.payments.detail.emergencyContacts')}</h4>
                        <div className="space-y-2">
                          {customer.contacts.map((contact, index) => (
                            <div key={contact.id || index} className="p-2 bg-blue-50 rounded-lg border border-blue-200">
                              <p className="text-xs font-semibold text-blue-900">{contact.first_name} {contact.last_name}</p>
                              <p className="text-xs text-blue-700">{contact.relationship} • {contact.phone}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Company Information */}
            {company && (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="bg-gradient-to-r from-orange-500 to-red-600 px-6 py-4">
                  <div className="flex items-center">
                    <Building className="w-6 h-6 text-white mr-3" />
                    <h2 className="text-xl font-semibold text-white">{t('common.company')}</h2>
                  </div>
                </div>
                
                <div className="p-6">
                  <div className="text-center mb-4">
                    <div className="w-16 h-16 bg-gradient-to-br from-orange-400 to-red-500 rounded-full flex items-center justify-center mx-auto mb-3">
                      <span className="text-white text-xl font-bold">
                        {company.name.charAt(0)}
                      </span>
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900">{company.name}</h3>
                  </div>
                  
                  <div className="space-y-3">
                                         <div className="flex items-center p-3 bg-gray-50 rounded-lg">
                       <div className="w-2 h-2 bg-orange-500 rounded-full mr-3"></div>
                       <div>
                         <p className="text-xs font-medium text-gray-500">{t('pages.payments.detail.interestRate')}</p>
                        <p className="text-sm font-semibold text-gray-900">{company.interest_rate}%</p>
                      </div>
                    </div>
                    
                                         <div className="flex items-center p-3 bg-gray-50 rounded-lg">
                       <div className="w-2 h-2 bg-orange-500 rounded-full mr-3"></div>
                       <div>
                         <p className="text-xs font-medium text-gray-500">{t('pages.payments.detail.status')}</p>
                         <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                           company.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                         }`}>
                           {company.is_active ? t('pages.payments.detail.active') : t('pages.payments.detail.inactive')}
                         </span>
                       </div>
                     </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6">
            <div className="text-center">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Trash2 className="w-8 h-8 text-red-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">{t('pages.payments.detail.deletePayment')}</h3>
              <p className="text-gray-600 mb-6">
                {t('pages.payments.detail.deleteConfirmation')}
              </p>
              <div className="flex space-x-3">
                <button
                  onClick={() => setShowDeleteModal(false)}
                  className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  {t('common.cancel')}
                </button>
                <button
                  onClick={handleDelete}
                  className="flex-1 px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-lg hover:bg-red-700 transition-colors"
                >
                  {t('common.delete')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}


      {/* Authorization Dialog */}
      <AuthorizationDialog
        isOpen={showAuthorizationDialog}
        onClose={handleAuthorizationDialogClose}
        contract={contract!}
        customer={customer!}
        company={company!}
      />
    </div>
  );
};

export default PaymentDetail;

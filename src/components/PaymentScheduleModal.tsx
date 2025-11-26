import React, { useState, useEffect } from 'react';
import { useTranslation } from '../i18n';
import { Contract, Customer, Company } from '../types';
import { formatDisplayDate } from '../utils/dateUtils';
import { format, addMonths } from 'date-fns';
import { az } from 'date-fns/locale';
import { useData } from '../contexts/DataContext';
import PermissionDocumentModal from './PermissionDocumentModal';
import { 
  calculatePaymentSchedule, 
  getPaymentCalculationSummary,
  getDisplayMonthlyPayment,
  validatePaymentCalculation,
  PaymentScheduleItem as CalculatedPaymentScheduleItem
} from '../utils/paymentCalculationUtils';

// Use the centralized PaymentScheduleItem interface
type PaymentScheduleItem = CalculatedPaymentScheduleItem;

interface PaymentScheduleModalProps {
  isOpen: boolean;
  onClose: () => void;
  contract: Contract;
  customer: Customer;
  vehicle: Vehicle;
  company: Company;
}

const PaymentScheduleModal: React.FC<PaymentScheduleModalProps> = ({
  isOpen,
  onClose,
  contract,
  customer,
  company
}) => {
  const { t } = useTranslation();
  const { payments } = useData();
  const [paymentSchedule, setPaymentSchedule] = useState<PaymentScheduleItem[]>([]);
  const [totalInterest, setTotalInterest] = useState(0);
  const [showPermissionModal, setShowPermissionModal] = useState(false);
  const [showExtraPaymentModal, setShowExtraPaymentModal] = useState(false);

  // Custom date formatter for payment schedule
  const formatPaymentDate = (date: Date): string => {
    // Add validation to prevent invalid date errors
    if (!date || isNaN(date.getTime())) {
      return 'Invalid Date';
    }
    return format(date, 'dd.MM.yyyy', { locale: az });
  };

  useEffect(() => {
    console.log('🔍 PaymentScheduleModal useEffect triggered:', {
      isOpen,
      hasContract: !!contract,
      contractId: contract?.id,
      paymentsLength: payments.length
    });
    
    if (isOpen && contract) {
      console.log('🔍 PaymentScheduleModal - Generating payment schedule for contract:', contract.id);
      generatePaymentSchedule();
    }
  }, [isOpen, contract, payments]); // Also trigger when payments change

  const generatePaymentSchedule = () => {
    console.log('🔍 PaymentScheduleModal generatePaymentSchedule - Starting with contract:', {
      contractId: contract.id,
      yearly_interest_rate: contract.yearly_interest_rate,
      term_months: contract.term_months,
      monthly_payment: contract.monthly_payment,
      down_payment: contract.down_payment,
      standard_purchase_price: contract.standard_purchase_price,
      hasPayments: payments.length > 0,
      paymentsLength: payments.length
    });
    
    // For zero interest contracts, use fallback immediately
    if (contract.yearly_interest_rate === 0 && contract.term_months > 0) {
      console.log('🔍 Zero interest contract detected, using fallback schedule');
      const fallbackSchedule = generateFallbackSchedule(contract);
      setPaymentSchedule(fallbackSchedule);
      setTotalInterest(0);
      console.log('✅ Fallback schedule generated:', {
        scheduleLength: fallbackSchedule.length,
        firstItem: fallbackSchedule[0]
      });
      return;
    }
    
    // Validate payment calculation
    const validation = validatePaymentCalculation(contract, payments);
    if (!validation.isValid) {
      console.error('Payment calculation validation failed:', validation.errors);
      
      // Try fallback for any contract
      console.log('Attempting to generate fallback schedule due to validation failure');
      const fallbackSchedule = generateFallbackSchedule(contract);
      setPaymentSchedule(fallbackSchedule);
      setTotalInterest(0);
      return;
    }
    
    if (validation.warnings.length > 0) {
      console.warn('Payment calculation warnings:', validation.warnings);
    }
    
    // Use centralized payment calculation
    const schedule = calculatePaymentSchedule(contract, payments);
    
    // If schedule is empty, try fallback
    if (schedule.length === 0) {
      console.log('Empty schedule, generating fallback');
      const fallbackSchedule = generateFallbackSchedule(contract);
      setPaymentSchedule(fallbackSchedule);
      setTotalInterest(0);
    } else {
      setPaymentSchedule(schedule);
      // Calculate total interest
      const totalInterestAmount = schedule.reduce((sum, payment) => sum + payment.interest, 0);
      setTotalInterest(totalInterestAmount);
      
      console.log('Payment schedule generated:', {
        contractId: contract.id,
        scheduleLength: schedule.length,
        totalInterest: totalInterestAmount,
        hasExtraPayments: schedule.some(p => p.isExtraPaymentMonth)
      });
    }
  };

  const generateFallbackSchedule = (contract: Contract) => {
    console.log('🔍 generateFallbackSchedule - Contract data:', {
      contractId: contract.id,
      down_payment: contract.down_payment,
      standard_purchase_price: contract.standard_purchase_price,
      term_months: contract.term_months,
      monthly_payment: contract.monthly_payment,
      start_date: contract.start_date
    });
    
    const schedule = [];
    const loanAmount = Math.abs(contract.down_payment || contract.standard_purchase_price || 0);
    const monthlyPayment = contract.monthly_payment || (loanAmount / contract.term_months);
    const startDate = new Date(contract.start_date);
    
    console.log('🔍 Fallback calculation:', {
      loanAmount,
      monthlyPayment,
      termMonths: contract.term_months,
      startDate: startDate.toISOString()
    });
    
    let remainingBalance = loanAmount;
    
    for (let i = 1; i <= contract.term_months; i++) {
      const paymentDate = new Date(startDate);
      paymentDate.setMonth(paymentDate.getMonth() + i);
      
      const paymentAmount = Math.min(monthlyPayment, remainingBalance);
      remainingBalance -= paymentAmount;
      
      const scheduleItem = {
        month: i,
        dueDate: paymentDate,
        amount: paymentAmount,
        principal: paymentAmount,
        interest: 0,
        remainingBalance: Math.max(0, remainingBalance),
        extraPayment: 0,
        isExtraPaymentMonth: false,
        isRecalculatedPayment: false
      };
      
      schedule.push(scheduleItem);
      
      console.log(`🔍 Fallback month ${i}:`, {
        paymentAmount,
        remainingBalance: scheduleItem.remainingBalance,
        dueDate: paymentDate.toISOString()
      });
    }
    
    console.log('✅ PaymentScheduleModal Fallback schedule completed:', {
      totalItems: schedule.length,
      totalLoanAmount: loanAmount,
      monthlyPayment,
      firstItem: schedule[0],
      lastItem: schedule[schedule.length - 1]
    });
    
    return schedule;
  };

     const handlePrint = () => {
     // Create a printable version and trigger print
     const printWindow = window.open('', '_blank');
     if (printWindow) {
       printWindow.document.write(`
         <!DOCTYPE html>
         <html>
         <head>
           <title>Payment Schedule - ${customer.firstName} ${customer.lastName}</title>
           <style>
             body { 
               font-family: Arial, sans-serif; 
               margin: 0; 
               padding: 20px; 
               background: white;
               color: #333;
             }
             .customer-header {
               background: #4CAF50;
               color: white;
               padding: 15px;
               text-align: center;
               font-size: 16px;
               font-weight: bold;
               border-radius: 8px;
               margin-bottom: 20px;
             }
             .loan-summary {
               background: #f8f9fa;
               padding: 20px;
               margin: 20px 0;
               border-radius: 10px;
               border: 2px solid #e9ecef;
             }
             .loan-grid {
               display: grid;
               grid-template-columns: 1fr 1fr;
               gap: 15px;
               width: 100%;
               max-width: 100%;
             }
             .loan-row {
               display: flex;
               justify-content: space-between;
               align-items: center;
               padding: 8px 12px;
               background: white;
               border-radius: 6px;
               border: 1px solid #dee2e6;
               font-size: 12px;
             }
             .loan-label {
               color: #495057;
               font-weight: 500;
             }
             .loan-value {
               font-weight: bold;
               color: #212529;
               font-size: 13px;
             }
             .payment-instructions {
               background: #fff3cd;
               border: 2px solid #ffc107;
               padding: 15px;
               margin: 20px 0;
               border-radius: 8px;
               font-size: 12px;
               color: #856404;
               text-align: center;
               font-weight: 500;
             }
             table { 
               width: 100%; 
               border-collapse: collapse; 
               margin-top: 20px;
               font-size: 10px;
               border: 2px solid #dee2e6;
             }
             th { 
               background: #4CAF50;
               color: white;
               padding: 10px 6px;
               text-align: center;
               font-weight: bold;
               font-size: 11px;
               border: 1px solid #45a049;
             }
             td { 
               border: 1px solid #dee2e6; 
               padding: 6px 8px; 
               text-align: center;
               font-size: 10px;
             }
             tr:nth-child(even) {
               background-color: #f8f9fa;
             }
             .text-right { text-align: right; }
             .text-center { text-align: center; }
             .page-footer {
               display: flex;
               justify-content: space-between;
               align-items: center;
               margin-top: 30px;
               font-size: 12px;
               color: #666;
               padding: 15px;
               border-top: 1px solid #dee2e6;
             }
             @media print {
               body { margin: 0; }
               .loan-grid {
                 display: grid !important;
                 grid-template-columns: 1fr 1fr !important;
                 gap: 15px !important;
               }
               .loan-row {
                 display: flex !important;
                 justify-content: space-between !important;
                 align-items: center !important;
               }
             }
           </style>
         </head>
         <body>
          <div class="customer-header">
            ${customer.customer_type === 'company' 
              ? customer.company_name || '' 
              : `${customer.first_name} ${customer.last_name} ${customer.father_name ? customer.father_name + ' oğlu' : ''}`
            }
          </div>

           <div class="loan-summary">
             <h3 style="margin: 0 0 15px 0; font-size: 14px; font-weight: bold; color: #333; text-align: center;">${t('common.paymentScheduleModal.customerInformation')}</h3>
             <div class="loan-grid">
              <div class="loan-row">
                <span class="loan-label">${customer.customer_type === 'company' ? 'Şirkət adı:' : 'Ad:'}</span>
                <span class="loan-value">${customer.customer_type === 'company' 
                  ? customer.company_name || '' 
                  : `${customer.first_name} ${customer.last_name}`
                }</span>
              </div>
               <div class="loan-row">
                 <span class="loan-label">Telefon:</span>
                 <span class="loan-value">${customer.phone || 'N/A'}</span>
               </div>
               <div class="loan-row">
                 <span class="loan-label">Ünvan:</span>
                 <span class="loan-value">${customer.address || 'N/A'}</span>
               </div>
             </div>
           </div>

           <div class="loan-summary">
             <h3 style="margin: 0 0 15px 0; font-size: 14px; font-weight: bold; color: #333; text-align: center;">${t('common.paymentScheduleModal.loanInformation')}</h3>
             <div class="loan-grid">
               <div class="loan-row">
                 <span class="loan-label">${t('common.paymentScheduleModal.loanAmount')}</span>
                 <span class="loan-value">₼${Math.abs(contract.downPayment || 0)}</span>
               </div>
               <div class="loan-row">
                 <span class="loan-label">${t('common.paymentScheduleModal.loanTerm')}</span>
                 <span class="loan-value">${contract.termMonths || 36}</span>
               </div>
               <div class="loan-row">
                 <span class="loan-label">${t('common.licensePlate')}</span>
                 <span class="loan-value">${contract.vehicle.licensePlate}</span>
               </div>
               <div class="loan-row">
                 <span class="loan-label">${t('common.paymentScheduleModal.loanDate')}</span>
                 <span class="loan-value">${formatDisplayDate(contract.startDate)}</span>
               </div>
               <div class="loan-row">
                 <span class="loan-label">${t('common.paymentScheduleModal.paymentStartDate')}</span>
                 <span class="loan-value">${formatDisplayDate(contract.paymentStartDate || contract.startDate)}</span>
               </div>
               <div class="loan-row">
                 <span class="loan-label">${t('common.paymentScheduleModal.monthlyPayment')}</span>
                 <span class="loan-value">₼${Math.round(getDisplayMonthlyPayment(contract))}</span>
               </div>
               <div class="loan-row">
                 <span class="loan-label">${t('common.paymentScheduleModal.totalInterestPayable')}</span>
                 <span class="loan-value">₼${Math.abs(totalInterest || 0)}</span>
               </div>
             </div>
           </div>

           <div class="payment-instructions">
             ⚠️ ${t('common.paymentScheduleModal.paymentDays')}
           </div>

           <table>
             <thead>
               <tr>
                 <th>${t('common.paymentScheduleModal.scheduleTable.number')}</th>
                 <th>${t('common.paymentScheduleModal.scheduleTable.months')}</th>
                 <th>${t('common.paymentScheduleModal.scheduleTable.principalAmount')}</th>
                 <th>${t('common.paymentScheduleModal.scheduleTable.interest')}</th>
                 <th>${t('common.paymentScheduleModal.scheduleTable.totalPayment')}</th>
                 <th>${t('common.paymentScheduleModal.scheduleTable.remainingBalance')}</th>
               </tr>
             </thead>
             <tbody>
               ${paymentSchedule.map((row) => {
                 // Check if this month has an extra payment
                 const extraPayments = JSON.parse(localStorage.getItem('extraPayments') || '{}');
                 const contractExtraPayments = extraPayments[contract.id] || [];
                 const currentMonth = row.month - 1; // 0-based month index
                 
                 const extraPaymentThisMonth = contractExtraPayments.find((extraPayment: any) => {
                   const extraPaymentDate = new Date(extraPayment.payment_date);
                   const startDate = new Date(contract.payment_start_date || contract.start_date);
                   const monthsFromStart = Math.floor(
                     (extraPaymentDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24 * 30.44)
                   );
                   return monthsFromStart === currentMonth;
                 });
                 
                 return `
                   <tr>
                     <td class="text-center">${row.month}</td>
                     <td>${formatPaymentDate(row.dueDate)}</td>
                     <td class="text-right">₼${Math.abs(row.principal || 0)}</td>
                     <td class="text-right">₼${Math.abs(row.interest || 0)}</td>
                     <td class="text-right">₼${Math.abs((row.amount || 0) + (extraPaymentThisMonth ? extraPaymentThisMonth.amount : 0))}</td>
                     <td class="text-right">
                       ₼${Math.abs(row.remainingBalance || 0)}
                       ${extraPaymentThisMonth ? `<br><small style="color: #059669; font-weight: 500;">+₼${extraPaymentThisMonth.amount} ${t('common.extra')}</small>` : ''}
                     </td>
                   </tr>
                 `;
               }).join('')}
             </tbody>
           </table>

           <div class="page-footer">
             <div>${t('common.paymentScheduleModal.generatedOn')} ${formatDisplayDate(new Date())}</div>
             <div>${t('common.paymentScheduleModal.vehicleLeasingManagementSystem')}</div>
           </div>

           <!-- Signature and Stamp Areas -->
           <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-top: 40px; padding: 20px 0; min-height: 200px;">
             <!-- Company Director Section (Left) -->
             <div style="flex: 1; margin-right: 40px; text-align: center;">
               <div style="margin-bottom: 20px;">
                 <div style="font-size: 14px; font-weight: bold; color: #333; margin-bottom: 10px;">
                   ${t('common.creditor')}
                 </div>
                 <div style="font-size: 12px; color: #333; margin-bottom: 5px;">
                   ${company.name}
                 </div>
                 ${company.director ? `<div style="font-size: 11px; color: #666; margin-bottom: 5px;">${company.director}</div>` : ''}
                 ${company.voen ? `<div style="font-size: 10px; color: #666; margin-bottom: 5px;">VÖEN: ${company.voen}</div>` : ''}
                 ${company.easySignatureNumber ? `<div style="font-size: 10px; color: #666; margin-bottom: 15px;">Asan İmza: ${company.easySignatureNumber}</div>` : ''}
               </div>
               
               <!-- Company Stamp Area -->
               <div style="position: relative; margin-bottom: 20px;">
                 <div style="width: 80px; height: 80px; border: 2px solid #0066cc; border-radius: 50%; margin: 0 auto; display: flex; align-items: center; justify-content: center; background: linear-gradient(135deg, #f0f8ff 0%, #e6f3ff 100%); position: relative; overflow: hidden;">
                   <div style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); text-align: center; font-size: 6px; color: #0066cc; line-height: 1.1; font-weight: bold; width: 70px;">
                     <div style="margin-bottom: 2px;">AZƏRBAYCAN</div>
                     <div style="margin-bottom: 2px;">RESPUBLİKASI</div>
                     <div style="margin-bottom: 2px; font-size: 5px;">MƏHDUD MƏSULİYYƏTLİ</div>
                     <div style="font-size: 5px;">CƏMİYYƏT</div>
                   </div>
                   <div style="position: absolute; bottom: 8px; left: 50%; transform: translateX(-50%); font-size: 4px; color: #0066cc; font-weight: bold;">
                     ${company.name}
                   </div>
                 </div>
               </div>
               
               <!-- Director Signature Area -->
               <div style="margin-bottom: 20px;">
                 <div style="text-align: center; font-size: 12px; font-weight: 500; color: #333; margin-bottom: 15px;">
                   ${company.director || t('common.director')}
                 </div>
                 
                 <!-- Signature Line -->
                 <div style="border-top: 2px solid #333; padding-top: 10px; margin-bottom: 10px; min-height: 40px; position: relative;">
                   <div style="position: absolute; top: -8px; left: 50%; transform: translateX(-50%); background: white; padding: 0 10px; font-size: 10px; color: #666;">
                     ${t('common.signatureAndStamp')}
                   </div>
                 </div>
                 
                 <!-- Additional Signature Line -->
                 <div style="border-top: 1px solid #ccc; padding-top: 8px; margin-bottom: 5px; min-height: 30px;">
                   <div style="text-align: center; font-size: 9px; color: #999;">
                     ${t('common.additionalSignature')}
                   </div>
                 </div>
               </div>
             </div>

             <!-- Customer Section (Right) -->
             <div style="flex: 1; margin-left: 40px; text-align: center;">
               <div style="margin-bottom: 20px;">
                 <div style="font-size: 14px; font-weight: bold; color: #333; margin-bottom: 10px;">
                   ${t('common.debtor')}
                 </div>
                <div style="font-size: 12px; color: #333; margin-bottom: 5px;">
                  ${customer.customer_type === 'company' 
                    ? customer.company_name || '' 
                    : `${customer.first_name} ${customer.last_name}`
                  }
                </div>
                ${customer.customer_type !== 'company' && customer.father_name ? `<div style="font-size: 11px; color: #666; margin-bottom: 15px;">${customer.father_name} oğlu</div>` : ''}
               </div>
               
              <!-- Customer Signature Area -->
              <div style="margin-bottom: 20px;">
                <div style="text-align: center; font-size: 12px; font-weight: 500; color: #333; margin-bottom: 15px;">
                  ${customer.customer_type === 'company' 
                    ? customer.company_name || '' 
                    : `${customer.first_name} ${customer.last_name}`
                  }
                </div>
                 
                 <!-- Signature Line -->
                 <div style="border-top: 2px solid #333; padding-top: 10px; margin-bottom: 10px; min-height: 40px; position: relative;">
                   <div style="position: absolute; top: -8px; left: 50%; transform: translateX(-50%); background: white; padding: 0 10px; font-size: 10px; color: #666;">
                     ${t('common.customerSignature')}
                   </div>
                 </div>
                 
                 <!-- Date Line -->
                 <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 15px;">
                   <div style="flex: 1; border-top: 1px solid #ccc; padding-top: 8px; margin-right: 10px;">
                     <div style="text-align: center; font-size: 9px; color: #999;">
                       ${t('common.signature')}
                     </div>
                   </div>
                   <div style="flex: 1; border-top: 1px solid #ccc; padding-top: 8px; margin-left: 10px;">
                     <div style="text-align: center; font-size: 9px; color: #999;">
                       ${t('common.date')}
                     </div>
                   </div>
                 </div>
               </div>
               
               <!-- Date Area -->
               <div style="margin-top: 20px;">
                 <div style="font-size: 10px; color: #666; margin-bottom: 5px;">
                   ${t('common.date')}
                 </div>
                 <div style="font-size: 12px; color: #333; font-weight: 500;">
                   ${formatDisplayDate(contract.startDate)}
                 </div>
               </div>
             </div>
           </div>
         </body>
         </html>
       `);
       printWindow.document.close();
       
       // Wait for content to load then print
       setTimeout(() => {
         printWindow.print();
       }, 500);
     }
   };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-white flex items-center">
            <svg className="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            {t('common.paymentScheduleModal.title')}
          </h2>
          <button
            onClick={onClose}
            className="text-white hover:text-gray-200 transition-colors duration-200"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
          {/* Customer Header */}
          <div className="text-center mb-6">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              {customer.customer_type === 'company' 
                ? customer.company_name || '' 
                : `${customer.first_name} ${customer.last_name}`
              }
            </h1>
            <div className="text-sm text-gray-600">
              {customer.customer_type !== 'company' && customer.father_name && `${customer.father_name} oğlu`}
            </div>
          </div>

          {/* Loan Details */}
          <div className="bg-gray-50 rounded-lg p-6 mb-6 border border-gray-200">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-gray-700">{t('common.paymentScheduleModal.loanAmount')}</span>
                <span className="text-lg font-bold text-gray-900">₼{Math.abs(contract.downPayment || 0)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-gray-700">{t('common.paymentScheduleModal.loanTerm')}</span>
                <span className="text-lg font-bold text-gray-900">{contract.termMonths || 36}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-gray-700">{t('common.licensePlate')}</span>
                <span className="text-lg font-bold text-gray-900">{contract.vehicle.licensePlate}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-gray-700">{t('common.paymentScheduleModal.loanDate')}</span>
                <span className="text-lg font-semibold text-gray-900">{formatDisplayDate(contract.startDate)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-gray-700">{t('common.paymentScheduleModal.paymentStartDate')}</span>
                <span className="text-lg font-semibold text-gray-900">{formatDisplayDate(contract.paymentStartDate || contract.startDate)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-gray-700">{t('common.paymentScheduleModal.monthlyPayment')}</span>
                <span className="text-lg font-bold text-gray-900">₼{Math.round(getDisplayMonthlyPayment(contract))}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-gray-700">{t('common.paymentScheduleModal.totalInterestPayable')}</span>
                <span className="text-lg font-bold text-gray-900">₼{Math.abs(totalInterest || 0)}</span>
              </div>
            </div>
          </div>

          {/* Monthly Payment Adjustment Notice */}
          {(() => {
            const { payments } = useData();
            const contractPayments = payments.filter(p => p.contract_id === contract.id);
            const contractExtraPayments = contractPayments.filter(p => 
              p.notes && p.notes.toLowerCase().includes('extra payment')
            );
            const totalExtraPayments = contractExtraPayments.reduce((sum, payment) => sum + payment.amount, 0);
            
            if (totalExtraPayments > 0) {
              // Calculate adjusted monthly payment progressively
              const originalLoanAmount = Math.abs(contract.down_payment || 0);
              const monthlyRate = ((contract.yearly_interest_rate) / 12 / 100);
              const totalPayments = contract.term_months || 36;
              
              // Find the month when the first extra payment was applied
              const currentDate = new Date(contract.payment_start_date || contract.start_date);
              const extraPaymentMonths = new Map<number, number>();
              
              contractExtraPayments.forEach((extraPayment: any) => {
                const extraPaymentDate = new Date(extraPayment.payment_date);
                const monthsFromStart = Math.floor(
                  (extraPaymentDate.getTime() - currentDate.getTime()) / (1000 * 60 * 60 * 24 * 30.44)
                );
                if (monthsFromStart >= 0 && monthsFromStart < totalPayments) {
                  extraPaymentMonths.set(monthsFromStart, (extraPaymentMonths.get(monthsFromStart) || 0) + extraPayment.amount);
                }
              });
              
              const firstExtraPaymentMonth = Math.min(...Array.from(extraPaymentMonths.keys()));
              
              // Calculate the final adjusted monthly payment after ALL extra payments
              // This represents what the monthly payment should be after all extra payments are applied
              let adjustedMonthlyPayment = 0;
              if (totalExtraPayments > 0 && firstExtraPaymentMonth >= 0) {
                const adjustedRemainingBalance = originalLoanAmount - totalExtraPayments;
                const remainingPayments = totalPayments - firstExtraPaymentMonth - 1;
                
                if (remainingPayments > 0 && adjustedRemainingBalance > 0) {
                  const r = monthlyRate;
                  const n = remainingPayments;
                  const P = adjustedRemainingBalance;
                  if (r > 0 && n > 0) {
                    adjustedMonthlyPayment = P * (r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
                    adjustedMonthlyPayment = Math.round(adjustedMonthlyPayment * 100) / 100;
                  } else if (n > 0) {
                    // If no interest rate, just divide remaining balance by months
                    adjustedMonthlyPayment = Math.round((P / n) * 100) / 100;
                  }
                }
              }
              
              const originalMonthlyPayment = getDisplayMonthlyPayment(contract);
              const monthlyPaymentDifference = originalMonthlyPayment - adjustedMonthlyPayment;
              
              return (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
                  <div className="flex items-center mb-2">
                    <svg className="w-5 h-5 text-green-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="text-sm font-semibold text-green-800">
                      Monthly Payment Adjusted Due to Extra Payments
                    </span>
                  </div>
                  <div className="text-sm text-green-700 space-y-1">
                    <div>• Total Extra Payments Applied: <span className="font-semibold">₼{totalExtraPayments}</span></div>
                    <div>• Original Monthly Payment: <span className="font-semibold">₼{originalMonthlyPayment}</span></div>
                    <div>• New Monthly Payment: <span className="font-semibold">₼{adjustedMonthlyPayment}</span></div>
                    <div>• Monthly Payment Reduced: <span className="font-semibold text-green-600">₼{monthlyPaymentDifference}</span></div>
                    <div>• Remaining Balance: <span className="font-semibold">₼{adjustedRemainingBalance}</span></div>
                  </div>
                </div>
              );
            }
            return null;
          })()}

          {/* Payment Instructions */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
            <div className="text-sm font-medium text-yellow-800 mb-2">
              {t('common.paymentScheduleModal.paymentDays')}
            </div>
          </div>

          {/* Payment Schedule Table */}
          <div className="overflow-x-auto">
            <table className="w-full border-collapse border border-gray-300 bg-white">
              <thead>
                <tr className="bg-gray-100">
                  <th className="border border-gray-300 px-4 py-3 text-center font-bold text-gray-800">{t('common.paymentScheduleModal.scheduleTable.number')}</th>
                  <th className="border border-gray-300 px-4 py-3 text-left font-bold text-gray-800">{t('common.paymentScheduleModal.scheduleTable.months')}</th>
                  <th className="border border-gray-300 px-4 py-3 text-right font-bold text-gray-800">{t('common.paymentScheduleModal.scheduleTable.principalAmount')}</th>
                  <th className="border border-gray-300 px-4 py-3 text-right font-bold text-gray-800">{t('common.paymentScheduleModal.scheduleTable.interest')}</th>
                  <th className="border border-gray-300 px-4 py-3 text-right font-bold text-gray-800">{t('common.paymentScheduleModal.scheduleTable.totalPayment')}</th>
                  <th className="border border-gray-300 px-4 py-3 text-right font-bold text-gray-800">{t('common.paymentScheduleModal.scheduleTable.remainingBalance')}</th>
                </tr>
              </thead>
              <tbody>
                {console.log('🔍 PaymentScheduleModal Rendering payment schedule:', { 
                  scheduleLength: paymentSchedule.length, 
                  schedule: paymentSchedule,
                  firstItem: paymentSchedule[0],
                  lastItem: paymentSchedule[paymentSchedule.length - 1]
                })}
                {paymentSchedule.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="text-center py-8 text-gray-500">
                      {t('common.noDataAvailable')}
                    </td>
                  </tr>
                ) : paymentSchedule.map((row) => {
                  // Check if this month has an extra payment
                  const extraPayments = JSON.parse(localStorage.getItem('extraPayments') || '{}');
                  const contractExtraPayments = extraPayments[contract.id] || [];
                  const currentMonth = row.month - 1; // 0-based month index
                  
                  const extraPaymentThisMonth = contractExtraPayments.find((extraPayment: any) => {
                    const extraPaymentDate = new Date(extraPayment.payment_date);
                    const startDate = new Date(contract.payment_start_date || contract.start_date);
                    const monthsFromStart = Math.floor(
                      (extraPaymentDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24 * 30.44)
                    );
                    return monthsFromStart === currentMonth;
                  });
                  
                  return (
                    <tr key={row.month} className="hover:bg-gray-50 border-b border-gray-200">
                      <td className="border border-gray-300 px-4 py-3 text-center font-semibold text-gray-900">{row.month}</td>
                      <td className="border border-gray-300 px-4 py-3 text-gray-900">{formatPaymentDate(row.dueDate)}</td>
                      <td className="border border-gray-300 px-4 py-3 text-right font-semibold text-gray-900">₼{Math.abs(row.principal || 0)}</td>
                      <td className="border border-gray-300 px-4 py-3 text-right font-semibold text-gray-900">₼{Math.abs(row.interest || 0)}</td>
                      <td className="border border-gray-300 px-4 py-3 text-right font-semibold text-gray-900">
                        ₼{Math.abs((row.amount || 0) + (extraPaymentThisMonth ? extraPaymentThisMonth.amount : 0))}
                      </td>
                      <td className="border border-gray-300 px-4 py-3 text-right font-semibold text-gray-900">
                        <div>
                          <div>₼{Math.abs(row.remainingBalance || 0)}</div>
                                                     {extraPaymentThisMonth && (
                             <div className="text-xs text-green-600 font-medium">
                               +₼{extraPaymentThisMonth.amount} {t('common.extra')}
                             </div>
                           )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Signature and Stamp Areas */}
          <div className="mt-8 flex justify-between items-start">
            {/* Company Director Section (Left) */}
            <div className="flex-1 mr-8 text-center">
              <div className="mb-6">
                <div className="text-lg font-bold text-gray-900 mb-3">
                  {t('common.creditor')}
                </div>
                                 <div className="text-base text-gray-800 mb-2">
                   {company.name}
                 </div>
                 {company.director && (
                   <div className="text-sm text-gray-600 mb-2">
                     {company.director}
                   </div>
                 )}
                 {company.voen && (
                   <div className="text-xs text-gray-500 mb-2">
                     VÖEN: {company.voen}
                   </div>
                 )}
                 {company.easySignatureNumber && (
                   <div className="text-xs text-gray-500 mb-4">
                     Asan İmza: {company.easySignatureNumber}
                   </div>
                 )}
              </div>
              
              {/* Company Stamp Area */}
              <div className="mb-6">
                <div className="w-24 h-24 border-2 border-blue-600 rounded-full mx-auto flex items-center justify-center bg-gradient-to-br from-blue-50 to-blue-100 relative overflow-hidden">
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                    <div className="text-[8px] text-blue-600 font-bold leading-tight">
                      <div className="mb-1">AZƏRBAYCAN</div>
                      <div className="mb-1">RESPUBLİKASI</div>
                      <div className="text-[6px] mb-1">MƏHDUD MƏSULİYYƏTLİ</div>
                      <div className="text-[6px]">CƏMİYYƏT</div>
                    </div>
                  </div>
                  <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 text-[6px] text-blue-600 font-bold">
                    {company.name}
                  </div>
                </div>
              </div>
              
              {/* Director Signature Area */}
              <div className="mb-6">
                <div className="text-center text-sm font-medium text-gray-700 mb-4">
                  {company.director || t('common.director')}
                </div>
                
                {/* Signature Line */}
                <div className="relative border-t-2 border-gray-400 pt-3 mb-3 min-h-[50px]">
                  <div className="absolute -top-2 left-1/2 transform -translate-x-1/2 bg-white px-3 text-xs text-gray-500">
                    {t('common.signatureAndStamp')}
                  </div>
                </div>
                
                {/* Additional Signature Line */}
                <div className="border-t border-gray-300 pt-2 mb-2 min-h-[30px]">
                  <div className="text-center text-xs text-gray-400">
                    {t('common.additionalSignature')}
                  </div>
                </div>
              </div>
            </div>

            {/* Customer Section (Right) */}
            <div className="flex-1 ml-8 text-center">
              <div className="mb-6">
                <div className="text-lg font-bold text-gray-900 mb-3">
                  {t('common.debtor')}
                </div>
                <div className="text-base text-gray-800 mb-2">
                  {customer.customer_type === 'company' 
                    ? customer.company_name || '' 
                    : `${customer.first_name} ${customer.last_name}`
                  }
                </div>
                {customer.customer_type !== 'company' && customer.father_name && (
                  <div className="text-sm text-gray-600 mb-4">
                    {customer.father_name} oğlu
                  </div>
                )}
              </div>
              
              {/* Customer Signature Area */}
              <div className="mb-6">
                <div className="text-center text-sm font-medium text-gray-700 mb-4">
                  {customer.customer_type === 'company' 
                    ? customer.company_name || '' 
                    : `${customer.first_name} ${customer.last_name}`
                  }
                </div>
                
                {/* Signature Line */}
                <div className="relative border-t-2 border-gray-400 pt-3 mb-3 min-h-[50px]">
                  <div className="absolute -top-2 left-1/2 transform -translate-x-1/2 bg-white px-3 text-xs text-gray-500">
                    {t('common.customerSignature')}
                  </div>
                </div>
                
                {/* Signature and Date Lines */}
                <div className="flex justify-between items-center mt-4">
                  <div className="flex-1 border-t border-gray-300 pt-2 mr-3 min-h-[30px]">
                    <div className="text-center text-xs text-gray-400">
                      {t('common.signature')}
                    </div>
                  </div>
                  <div className="flex-1 border-t border-gray-300 pt-2 ml-3 min-h-[30px]">
                    <div className="text-center text-xs text-gray-400">
                      {t('common.date')}
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Date Area */}
              <div className="mt-6">
                <div className="text-xs text-gray-500 mb-2">
                  {t('common.date')}
                </div>
                <div className="text-sm text-gray-800 font-medium">
                  {formatDisplayDate(contract.startDate)}
                </div>
              </div>
            </div>
          </div>

          {/* Permission Document Section */}
          <div className="mt-8 border-t border-gray-200 pt-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">{t('common.permissionDocument')}</h3>
              <button
                onClick={() => setShowPermissionModal(true)}
                className="inline-flex items-center px-4 py-2 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 transition-colors duration-200"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                {contract.permissionDocument ? t('common.editPermissionDocument') : t('common.createPermissionDocument')}
              </button>
            </div>

            {contract.permissionDocument ? (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <span className="text-sm font-medium text-gray-700">{t('common.beginDate')}:</span>
                    <span className="ml-2 text-sm text-gray-900">
                      {formatDisplayDate(contract.permissionDocument.beginDate)}
                    </span>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-700">{t('common.endDate')}:</span>
                    <span className="ml-2 text-sm text-gray-900">
                      {formatDisplayDate(contract.permissionDocument.endDate)}
                    </span>
                  </div>
                </div>
                
                <div className="mb-4">
                  <span className="text-sm font-medium text-gray-700">{t('common.authorizedDrivers')}:</span>
                  <div className="mt-2 space-y-2">
                    {contract.permissionDocument.drivers.map((driver) => (
                      <div key={driver.id} className="bg-white rounded border border-green-200 p-3">
                        <div className="flex justify-between items-start">
                          <div>
                            <div className="font-medium text-gray-900">{driver.name}</div>
                            <div className="text-sm text-gray-600">{driver.licenseNumber}</div>
                            {driver.phone && (
                              <div className="text-sm text-gray-500">{driver.phone}</div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {contract.permissionDocument.notes && (
                  <div>
                    <span className="text-sm font-medium text-gray-700">{t('common.notes')}:</span>
                    <p className="mt-1 text-sm text-gray-900">{contract.permissionDocument.notes}</p>
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 text-center">
                <svg className="w-12 h-12 mx-auto mb-2 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <p className="text-gray-500">{t('common.noPermissionDocument')}</p>
              </div>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="bg-gray-50 px-6 py-4 flex justify-between items-center border-t border-gray-200">
          <div className="text-sm text-gray-600">
            {t('common.paymentScheduleModal.generatedOn')} {formatDisplayDate(new Date())}
          </div>
          <div className="flex space-x-3">
            <button
              onClick={handlePrint}
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors duration-200"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
              </svg>
              {t('common.print')}
            </button>
            <button
              onClick={onClose}
              className="inline-flex items-center px-4 py-2 bg-gray-600 text-white font-medium rounded-lg hover:bg-gray-700 transition-colors duration-200"
            >
              {t('common.close')}
            </button>
          </div>
        </div>
      </div>

      {/* Permission Document Modal */}
      <PermissionDocumentModal
        isOpen={showPermissionModal}
        onClose={() => setShowPermissionModal(false)}
        contract={contract}
        customer={customer}
        onSave={async () => {
          try {
            // Update the permission document using Supabase service
            // await updatePermissionDocument(contract.id, permissionDocument); // This line was removed
            // Update the local contract object
            // Object.assign(contract, { permissionDocument }); // This line was removed
            setShowPermissionModal(false);
          } catch (error) {
            console.error('Error saving permission document:', error);
          }
        }}
        existingDocument={contract.permissionDocument}
      />
    </div>
  );
};

export default PaymentScheduleModal;

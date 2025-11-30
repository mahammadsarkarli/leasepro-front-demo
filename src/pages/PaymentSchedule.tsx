import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useTranslation } from "../i18n";
import { useData } from "../contexts/DataContext";
import { Payment } from "../types";
import {
  ArrowLeft,
  Printer,
  Download,
  Calculator,
  Calendar,
  DollarSign,
  TrendingDown,
  Plus,
} from "lucide-react";
import { format } from "date-fns";
import { az } from "date-fns/locale";
import {
  calculatePaymentSchedule,
  getDisplayMonthlyPayment,
  validatePaymentCalculation,
  PaymentScheduleItem as CalculatedPaymentScheduleItem,
} from "../utils/paymentCalculationUtils";
import { roundPaymentAmount, roundInterestAmount, roundPrincipalAmount } from "../utils/customRoundingUtils";

// Use the centralized PaymentScheduleItem interface
type PaymentScheduleRow = CalculatedPaymentScheduleItem;

const PaymentSchedule: React.FC = () => {
  const { contractId } = useParams<{ contractId: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation();

  // Redirect if contractId is missing
  useEffect(() => {
    if (!contractId) {
      navigate('/contracts');
    }
  }, [contractId, navigate]);
  const { contracts, customers, companies, payments, loadPayments } = useData();

  const [paymentSchedule, setPaymentSchedule] = useState<PaymentScheduleRow[]>(
    []
  );
  const [totalInterest, setTotalInterest] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  const contract = contracts.find((c) => c.id === contractId);
  const customer = contract
    ? customers.find((c) => c.id === contract.customer_id)
    : null;
  const company = contract
    ? companies.find((c) => c.id === contract.company_id)
    : null;

  useEffect(() => {
    if (contract) {
      loadContractPayments();
    }
  }, [contract?.id]); // Only trigger when contract ID changes, not when contract properties change

  // Payments state'i değiştiğinde payment schedule'ı yeniden hesapla
  useEffect(() => {
    if (contract && !isLoading) {
      // Always generate payment schedule for any valid contract
      generatePaymentSchedule(payments);
    }
  }, [payments, contract, isLoading]);

  // Contract değiştiğinde loading state'ini sıfırla
  useEffect(() => {
    if (contract) {
      setIsLoading(false);
    }
  }, [contract]);

  const loadContractPayments = async () => {
    if (!contract) return;
    
    try {
      setIsLoading(true);
      
      // Sadece bu kontrata ait ödemeleri yükle
      await loadPayments({ contract_id: contract.id });
    } catch (error) {
      console.error("Error loading contract payments:", error);
      setIsLoading(false);
    }
  };

  const generatePaymentSchedule = (payments: Payment[]) => {
    if (!contract) {
      console.error("No contract found for payment schedule generation");
      return;
    }

    // Sadece bu kontrata ait olanları filtrele
    const contractSpecificPayments = payments.filter(
      (p) => p.contract_id === contract.id
    );

    // For zero interest contracts, generate fallback schedule immediately
    if (contract.yearly_interest_rate === 0 && contract.term_months > 0) {
      const fallbackSchedule = generateFallbackSchedule(contract);
      setPaymentSchedule(fallbackSchedule);
      setTotalInterest(0);
      setIsLoading(false);
      return;
    }

    const validation = validatePaymentCalculation(contract, contractSpecificPayments);
    if (!validation.isValid) {
      console.error(
        "Payment calculation validation failed:",
        validation.errors
      );
      
      // Try fallback for any contract
      const fallbackSchedule = generateFallbackSchedule(contract);
      setPaymentSchedule(fallbackSchedule);
      setTotalInterest(0);
      setIsLoading(false);
      return;
    }

    if (validation.warnings.length > 0) {
      console.warn("Payment calculation warnings:", validation.warnings);
    }
    
    // Use centralized payment calculation with contract-specific payments
    try {
      const schedule = calculatePaymentSchedule(contract, contractSpecificPayments);

      // If schedule is empty, try fallback
      if (schedule.length === 0) {
        const fallbackSchedule = generateFallbackSchedule(contract);
        setPaymentSchedule(fallbackSchedule);
        setTotalInterest(0);
        setIsLoading(false);
        return;
      }

      setPaymentSchedule(schedule);

      // Calculate total interest
      const totalInterestAmount = schedule.reduce(
        (sum, payment) => sum + payment.interest,
        0
      );
      setTotalInterest(totalInterestAmount);
      setIsLoading(false);
    } catch (error) {
      console.error("❌ Error generating payment schedule:", error);
      // Try fallback on error
      const fallbackSchedule = generateFallbackSchedule(contract);
      setPaymentSchedule(fallbackSchedule);
      setTotalInterest(0);
      setIsLoading(false);
    }
  };

  const generateFallbackSchedule = (contract: any) => {
    const schedule = [];
    const loanAmount = Math.abs(contract.down_payment || contract.standard_purchase_price || 0);
    const monthlyPayment = contract.monthly_payment || (loanAmount / contract.term_months);
    const startDate = new Date(contract.start_date);
    
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
    }
    
    return schedule;
  };

  const formatPaymentDate = (date: Date): string => {
    // Add validation to prevent invalid date errors
    if (!date || isNaN(date.getTime())) {
      return t("common.invalidDate");
    }
    return format(date, "dd.MM.yyyy", { locale: az });
  };

  const handlePrint = () => {
    // Generate print HTML with proper design
    const printHTML = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>${t("common.paymentSchedule")} - ${customer?.first_name} ${
      customer?.last_name
    }</title>
        <style>
          @media print {
            body { 
              margin: 0; 
              padding: 10px; 
              font-family: Arial, sans-serif; 
              font-size: 10px; 
              line-height: 1.2;
              color: #000;
            }
            .print-header { 
              text-align: center; 
              margin-bottom: 10px; 
              border-bottom: 1px solid #000;
              padding-bottom: 5px;
            }
            .print-header h1 { 
              font-size: 16px; 
              margin: 0 0 5px 0; 
              font-weight: bold;
            }
            .print-header h2 { 
              font-size: 14px; 
              margin: 0; 
              color: #666;
            }
            .info-section { 
              margin-bottom: 10px; 
              padding: 8px; 
              border: 1px solid #ccc; 
              background-color: #f9f9f9;
            }
            .info-row { 
              display: flex; 
              justify-content: space-between; 
              margin-bottom: 2px;
            }
            .info-row .label { 
              font-weight: bold; 
              color: #333;
            }
            .info-row .value { 
              color: #000;
            }
            .payment-instructions { 
              background-color: #fff3cd; 
              border: 1px solid #ffeaa7; 
              padding: 5px; 
              margin: 8px 0; 
              border-radius: 2px;
              font-size: 9px;
            }
            table { 
              width: 100%; 
              border-collapse: collapse; 
              margin-top: 10px;
              font-size: 9px;
            }
            th, td { 
              border: 1px solid #000; 
              padding: 3px; 
              text-align: center;
            }
            th { 
              background-color: #f0f0f0; 
              font-weight: bold;
              font-size: 8px;
            }
            .amount { 
              text-align: right;
            }
            .extra-payment { 
              background-color: #d4edda;
            }
            .recalculated-payment { 
              background-color: #fff3cd;
            }
            .signature-section { 
              margin-top: 15px; 
              display: flex; 
              justify-content: space-between; 
              align-items: flex-end;
            }
            .signature-block { 
              width: 45%; 
              text-align: center;
            }
            .signature-line { 
              border-bottom: 1px solid #000; 
              height: 25px; 
              margin-bottom: 5px;
              position: relative;
            }
            .signature-label { 
              font-weight: bold; 
              margin-bottom: 3px;
              font-size: 9px;
            }
          }
        </style>
      </head>
      <body>
        <div class="print-header">
          <h1>${
            company?.name ||
            t("common.paymentScheduleModal.vehicleLeasingManagementSystem")
          }</h1>
          <h2>${t("common.paymentSchedule")}</h2>
        </div>
        
        <div class="info-section">
          <div class="info-row">
            <span class="label">${t("customers.customerName")}:</span>
            <span class="value">${customer?.first_name} ${
      customer?.last_name
    }</span>
          </div>
          <div class="info-row">
            <span class="label">${t(
              "pages.contractDetail.vehicleInformation"
            )}:</span>
            <span class="value">${contract?.vehicle?.make} ${
      contract?.vehicle?.model
    } (${contract?.vehicle?.year})</span>
          </div>
          <div class="info-row">
            <span class="label">${t(
              "common.paymentScheduleModal.loanAmount"
            )}</span>
            <span class="value">₼${roundPaymentAmount(
              Math.abs(contract?.standard_purchase_price || 0)
            )}</span>
          </div>
          <div class="info-row">
            <span class="label">${t("common.monthlyPayment")}:</span>
            <span class="value">₼${
              contract ? roundPaymentAmount(getDisplayMonthlyPayment(contract)) : 0
            }</span>
          </div>
          <div class="info-row">
            <span class="label">${t("pages.paymentSchedule.term")}:</span>
            <span class="value">${contract?.term_months} ${t(
      "common.months"
    )}</span>
          </div>
          <div class="info-row">
            <span class="label">${t(
              "common.paymentScheduleModal.paymentStartDate"
            )}</span>
            <span class="value">${formatPaymentDate(
              new Date(
                contract?.payment_start_date || contract?.start_date || ""
              )
            )}</span>
          </div>
        </div>
        
        <div class="payment-instructions">
          ⚠️ ${t("common.paymentScheduleModal.paymentDays")}
        </div>
        
        <table>
          <thead>
            <tr>
              <th>${t("common.paymentScheduleModal.scheduleTable.number")}</th>
              <th>${t("common.paymentScheduleModal.scheduleTable.months")}</th>
              <th>${t(
                "common.paymentScheduleModal.scheduleTable.principalAmount"
              )}</th>
              <th>${t(
                "common.paymentScheduleModal.scheduleTable.interest"
              )}</th>
              <th>${t(
                "common.paymentScheduleModal.scheduleTable.totalPayment"
              )}</th>
              <th>${t(
                "common.paymentScheduleModal.scheduleTable.remainingBalance"
              )}</th>
              <th>${t("common.extraPayment")}</th>
            </tr>
          </thead>
          <tbody>
            ${paymentSchedule
              .map((row) => {
                let rowClass = "";
                if (row.isExtraPaymentMonth) {
                  rowClass = "extra-payment";
                } else if (row.isRecalculatedPayment) {
                  rowClass = "recalculated-payment";
                }

                return `
                <tr class="${rowClass}">
                  <td>${row.month}</td>
                  <td>${formatPaymentDate(row.dueDate)}</td>
                  <td class="amount">₼${roundPrincipalAmount(row.principal)}</td>
                  <td class="amount">₼${roundInterestAmount(row.interest)}</td>
                  <td class="amount">₼${roundPaymentAmount(row.amount)}</td>
                  <td class="amount">₼${roundPaymentAmount(row.remainingBalance)}</td>
                  <td class="amount">${
                    row.extraPayment > 0
                      ? `₼${roundPaymentAmount(row.extraPayment)}`
                      : "-"
                  }</td>
                </tr>
              `;
              })
              .join("")}
          </tbody>
        </table>
        
        <div class="signature-section">
          <div class="signature-block">
            <div class="signature-label">Kreditor</div>
            <div class="signature-label">${company?.name || ""}-nin ${t(
      "common.director"
    )} ${company?.director || ""}</div>
            <div class="signature-line"></div>
            <div class="signature-label">${t("common.signature")}</div>
          </div>
          <div class="signature-block">
            <div class="signature-label">${t("common.debtor")}</div>
            <div class="signature-label">${
      customer?.customer_type === 'company' 
        ? customer?.company_name || '' 
        : `${customer?.first_name} ${customer?.last_name}`
    }</div>
            <div class="signature-line"></div>
            <div class="signature-label">(${t("common.signature")})</div>
          </div>
        </div>
      </body>
      </html>
    `;

    const printWindow = window.open("", "_blank");
    if (printWindow) {
      printWindow.document.write(printHTML);
      printWindow.document.close();
      printWindow.focus();
      setTimeout(() => {
        printWindow.print();
        printWindow.close();
      }, 250);
    }
  };

  const handleDownload = () => {
    // Create CSV content
    const csvContent = [
      [
        "№",
        t("common.paymentScheduleModal.scheduleTable.months"),
        t("common.paymentScheduleModal.scheduleTable.principalAmount"),
        t("common.paymentScheduleModal.scheduleTable.interest"),
        t("common.paymentScheduleModal.scheduleTable.totalPayment"),
        t("common.paymentScheduleModal.scheduleTable.remainingBalance"),
        t("common.monthlyPayment"),
        t("common.extraPayment"),
        t("common.scenario"),
      ],
      ...paymentSchedule.map((row) => [
        row.month,
        formatPaymentDate(row.dueDate),
        roundPrincipalAmount(row.principal),
        roundInterestAmount(row.interest),
        roundPaymentAmount(row.amount),
        roundPaymentAmount(row.remainingBalance),
        roundPaymentAmount(row.amount),
        row.extraPayment > 0 ? roundPaymentAmount(row.extraPayment) : "-",
        row.isExtraPaymentMonth
          ? t("common.extraPaymentApplied")
          : row.isRecalculatedPayment
          ? t("common.recalculatedPayment")
          : t("common.regularPayment"),
      ]),
    ];

    const csvString = csvContent.map((row) => row.join(",")).join("\n");
    const blob = new Blob([csvString], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      `payment_schedule_${customer?.first_name}_${customer?.last_name}.csv`
    );
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Calculate extra payments info from database
  const contractPayments = payments.filter(
    (p) => p.contract_id === contract?.id
  );
  const extraPayments = contractPayments.filter(
    (p) => p.notes && p.notes.toLowerCase().includes("extra payment")
  );
  const totalExtraPayments = extraPayments.reduce(
    (sum, payment) => sum + payment.amount,
    0
  );

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">{t("common.loading")}...</p>
        </div>
      </div>
    );
  }

  if (!contract) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">{t("common.contractNotFound")}</p>
          <button
            onClick={() => navigate("/contracts")}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            {t("common.backToContracts")}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200" data-guide-id="payment-schedule-header">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <button
                onClick={() => navigate("/contracts")}
                className="mr-4 p-2 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <h1 className="text-xl font-semibold text-gray-900">
                {t("common.paymentSchedule")}
              </h1>
            </div>
            <div className="flex items-center space-x-3" data-guide-id="payment-schedule-actions">
              <button
                onClick={handlePrint}
                className="flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <Printer className="w-4 h-4 mr-2" />
                {t("common.print")}
              </button>
              <button
                onClick={handleDownload}
                className="flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <Download className="w-4 h-4 mr-2" />
                {t("common.download")}
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className=" mx-auto  py-8">
        {/* Contract Summary */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
          <div className="p-6">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
              <div className="flex items-center">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
                  <DollarSign className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">
                    {t("pages.paymentSchedule.loanAmount")}
                  </p>
                  <p className="text-lg font-semibold text-gray-900">
                    ₼
                    {roundPaymentAmount(
                      Math.abs(contract.standard_purchase_price || 0)
                    )}
                  </p>
                </div>
              </div>
              <div className="flex items-center">
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center mr-3">
                  <Calculator className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">
                    {t("pages.paymentSchedule.monthlyPayment")}
                  </p>
                  <p className="text-lg font-semibold text-gray-900">
                    ₼{roundPaymentAmount(getDisplayMonthlyPayment(contract))}
                  </p>
                </div>
              </div>
              <div className="flex items-center">
                <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center mr-3">
                  <Calendar className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">
                    {t("pages.paymentSchedule.term")}
                  </p>
                  <p className="text-lg font-semibold text-gray-900">
                    {contract.term_months} {t("common.months")}
                  </p>
                </div>
              </div>
              <div className="flex items-center">
                <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center mr-3">
                  <TrendingDown className="w-5 h-5 text-orange-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">
                    {t("common.totalInterest")}
                  </p>
                  <p className="text-lg font-semibold text-gray-900">
                    ₼{roundInterestAmount(totalInterest)}
                  </p>
                </div>
              </div>
              <div className="flex items-center">
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center mr-3">
                  <Plus className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">
                    {t("pages.paymentSchedule.extraPayments")}
                  </p>
                  <p className="text-lg font-semibold text-gray-900">
                    ₼{roundPaymentAmount(totalExtraPayments)}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Extra Payment Notice */}

        {/* Payment Schedule Table */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200" data-guide-id="payment-schedule-table">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t("common.paymentScheduleModal.scheduleTable.number")}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t("common.paymentScheduleModal.scheduleTable.months")}
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t(
                      "common.paymentScheduleModal.scheduleTable.principalAmount"
                    )}
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t("common.paymentScheduleModal.scheduleTable.interest")}
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t(
                      "common.paymentScheduleModal.scheduleTable.totalPayment"
                    )}
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t(
                      "common.paymentScheduleModal.scheduleTable.remainingBalance"
                    )}
                  </th>

                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t("common.extraPayment")}
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t("common.scenario")}
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {paymentSchedule.map((row) => {
                  let rowClass = "";
                  let scenarioLabel = t("common.regularPayment");

                  if (row.isExtraPaymentMonth) {
                    rowClass = "bg-green-50";
                    scenarioLabel = t("common.extraPaymentApplied");
                  }

                  return (
                    <tr key={row.month} className={rowClass}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {row.month}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatPaymentDate(row.dueDate)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                        ₼{roundPrincipalAmount(row.principal)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                        ₼{roundInterestAmount(row.interest)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 text-right">
                        ₼{roundPaymentAmount(row.amount)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                        ₼{roundPaymentAmount(row.remainingBalance)}
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                        {row.extraPayment > 0 ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            ₼{roundPaymentAmount(row.extraPayment)}
                          </span>
                        ) : (
                          "-"
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-center">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            row.isExtraPaymentMonth
                              ? "bg-green-100 text-green-800"
                              : row.isRecalculatedPayment
                              ? "bg-yellow-100 text-yellow-800"
                              : "bg-gray-100 text-gray-800"
                          }`}
                        >
                          {scenarioLabel}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentSchedule;

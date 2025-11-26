import React, { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "../i18n";
import { ArrowLeft, Upload, FileSpreadsheet, Trash2, RefreshCw, CheckCircle, AlertCircle, Building2 } from "lucide-react";
import { useData } from "../contexts/DataContext";
import { CustomerImportData, importCustomers, compareWithExistingCustomers, smartImportCustomers, analyzeExcelData } from "../services/customerImport";
import { useNotifications } from '../hooks/useNotifications';

const CustomerImport: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { companies, selectedCompany, setSelectedCompany } = useData();
  const { successMessages, errorMessages } = useNotifications();
  
  const [isImporting, setIsImporting] = useState(false);
  const [customersData, setCustomersData] = useState<CustomerImportData[]>([]);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [comparisonResult, setComparisonResult] = useState<any>(null);
  const [isComparing, setIsComparing] = useState(false);
  const [excelAnalysis, setExcelAnalysis] = useState<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      processExcelFile(file);
    }
  };

  const processExcelFile = async (file: File) => {
    setIsProcessing(true);
    try {
      // Parse the actual Excel file
      const data = await parseExcelFile(file);
      setCustomersData(data);
      setComparisonResult(null); // Reset comparison when new file is loaded
      
      // Analyze Excel data for company detection
      if (data.length > 0) {
        const analysis = await analyzeExcelData(data, companies);
        setExcelAnalysis(analysis);
        
        // Auto-suggest company if high confidence match found
        if (analysis.suggestedCompanyId && analysis.companyMatchConfidence > 0.8) {
          setSelectedCompany(analysis.suggestedCompanyId);
          successMessages.show(`Company detected: ${analysis.detectedCompanies.join(', ')} (${Math.round(analysis.companyMatchConfidence * 100)}% match)`);
        }
      }
    } catch (error) {
      console.error('Error processing Excel file:', error);
      errorMessages.show('Error processing Excel file. Please check the format.');
    } finally {
      setIsProcessing(false);
    }
  };

  const parseExcelFile = async (file: File): Promise<CustomerImportData[]> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = async (e) => {
        try {
          const data = e.target?.result;
          if (!data) {
            reject(new Error('No data read from file'));
            return;
          }

          // Import xlsx library dynamically
          const XLSX = await import('xlsx');
          
          // Parse the Excel file
          const workbook = XLSX.read(data, { type: 'array' });
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];
          
          // Convert to JSON
          const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
          
          console.log('Parsed Excel data:', jsonData);
          console.log('Number of rows:', jsonData.length);
          console.log('First few rows:', jsonData.slice(0, 5));
          
          // Skip header row and parse data
          const customers: CustomerImportData[] = [];
          
          for (let i = 1; i < jsonData.length; i++) {
            try {
              const row = jsonData[i] as any[];
              console.log(`Row ${i}:`, row);
              console.log(`Row ${i} type:`, typeof row, Array.isArray(row));
              
              if (row && Array.isArray(row) && row.length >= 4) {
                // Ensure all values are strings and handle undefined/null
                const customerName = String(row[1] || '').trim();
                const customerPhone = String(row[2] || '').trim();
                const additionalContacts = String(row[3] || '').trim();
                
                const customer: CustomerImportData = {
                  customer_name: customerName,
                  customer_phone: customerPhone,
                  additional_contacts: additionalContacts
                };
                
                console.log(`Customer ${i}:`, customer);
                
                // Only add if customer name exists and is not empty
                if (customerName && customerName !== '' && customerName !== 'N') {
                  customers.push(customer);
                } else {
                  console.log(`Row ${i} skipped - invalid customer name:`, customerName);
                }
              } else {
                console.log(`Row ${i} skipped - insufficient columns or not array:`, row);
              }
            } catch (rowError) {
              console.error(`Error processing row ${i}:`, rowError, 'Row data:', jsonData[i]);
            }
          }
          
          resolve(customers);
        } catch (error) {
          reject(error);
        }
      };

      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsArrayBuffer(file);
    });
  };

  const compareWithExisting = async () => {
    if (!selectedCompany) {
      errorMessages.show('Please select a company first');
      return;
    }

    if (customersData.length === 0) {
      errorMessages.show('Please upload an Excel file first');
      return;
    }

    setIsComparing(true);
    try {
      const result = await compareWithExistingCustomers(customersData, selectedCompany);
      setComparisonResult(result);
      successMessages.show(`Comparison complete: ${result.summary.new} new, ${result.summary.existing} existing, ${result.summary.needsUpdate} need updates`);
    } catch (error) {
      errorMessages.show(`Comparison failed: ${error}`);
    } finally {
      setIsComparing(false);
    }
  };

  const removeCustomerRow = (index: number) => {
    setCustomersData(customersData.filter((_, i) => i !== index));
    setComparisonResult(null); // Reset comparison when data changes
  };

  const clearAllData = () => {
    setCustomersData([]);
    setSelectedFile(null);
    setComparisonResult(null);
    setExcelAnalysis(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSmartImport = async () => {
    if (!selectedCompany) {
      errorMessages.show('Please select a company first');
      return;
    }

    if (customersData.length === 0) {
      errorMessages.show('Please add at least one customer');
      return;
    }

    setIsImporting(true);
    try {
      const results = await smartImportCustomers(customersData, selectedCompany);
      
      if (results.success > 0 || results.updated > 0) {
        successMessages.show(`Smart import complete: ${results.success} new customers, ${results.updated} updated customers`);
        if (results.failed > 0) {
          errorMessages.show(`Failed to process ${results.failed} customers`);
        }
        navigate('/customers');
      } else {
        errorMessages.show('No customers were processed successfully');
      }
    } catch (error) {
      errorMessages.show(`Smart import failed: ${error}`);
    } finally {
      setIsImporting(false);
    }
  };

  const handleImport = async () => {
    if (!selectedCompany) {
      errorMessages.show('Please select a company first');
      return;
    }

    if (customersData.length === 0) {
      errorMessages.show('Please add at least one customer');
      return;
    }

    setIsImporting(true);
    try {
      const results = await importCustomers(customersData, selectedCompany);
      
      if (results.success > 0) {
        successMessages.show(`Successfully imported ${results.success} customers`);
        if (results.failed > 0) {
          errorMessages.show(`Failed to import ${results.failed} customers`);
        }
        navigate('/customers');
      } else {
        errorMessages.show('No customers were imported successfully');
      }
    } catch (error) {
      errorMessages.show(`Import failed: ${error}`);
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <div className="w-full space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-4">
        <button
          onClick={() => navigate("/customers")}
          className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-50"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {t("common.importCustomers")}
          </h1>
          <p className="text-gray-600">{t("common.importCustomersFromExcel")}</p>
        </div>
      </div>

      {/* Company Selection */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {t("common.company")} *
          </label>
          <select
            value={selectedCompany || ""}
            onChange={(e) => setSelectedCompany(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            required
          >
            <option value="">{t("common.selectCompany")}</option>
            {companies.map((company) => (
              <option key={company.id} value={company.id}>
                {company.name}
              </option>
            ))}
          </select>
        </div>
        
        {/* Company Detection Results */}
        {excelAnalysis && excelAnalysis.detectedCompanies.length > 0 && (
          <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center space-x-2 mb-2">
              <Building2 className="w-5 h-5 text-blue-600" />
              <h4 className="font-medium text-blue-900">Company Detection Results</h4>
            </div>
            <div className="text-sm text-blue-800 space-y-2">
              <p><strong>Detected Companies in Excel:</strong></p>
              <ul className="list-disc list-inside space-y-1">
                {excelAnalysis.detectedCompanies.map((company: string, index: number) => (
                  <li key={index}>{company}</li>
                ))}
              </ul>
              {excelAnalysis.suggestedCompanyId && (
                <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded">
                  <p className="text-green-800">
                    <strong>Suggested Company:</strong> {
                      companies.find(c => c.id === excelAnalysis.suggestedCompanyId)?.name
                    } ({Math.round(excelAnalysis.companyMatchConfidence * 100)}% match)
                  </p>
                  <button
                    type="button"
                    onClick={() => setSelectedCompany(excelAnalysis.suggestedCompanyId)}
                    className="mt-2 px-3 py-1 bg-green-600 text-white text-xs rounded hover:bg-green-700"
                  >
                    Use This Company
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Excel File Upload */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">
          {t("common.uploadExcelFile")}
        </h3>
        
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
          <FileSpreadsheet className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          
          <div className="mb-4">
            <p className="text-lg font-medium text-gray-900 mb-2">
              {t("common.dragAndDropExcel")}
            </p>
            <p className="text-gray-600 mb-4">
              {t("common.excelFormatDescription")}
            </p>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx,.xls,.csv"
            onChange={handleFileSelect}
            className="hidden"
          />
          
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isProcessing}
            className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isProcessing ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                {t("common.processing")}
              </>
            ) : (
              <>
                <Upload className="w-5 h-5 mr-2" />
                {t("common.selectExcelFile")}
              </>
            )}
          </button>

          {selectedFile && (
            <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-green-800 text-sm">
                <strong>{t("common.fileSelected")}:</strong> {selectedFile.name}
              </p>
            </div>
          )}
        </div>

        <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <h4 className="font-medium text-blue-900 mb-2">{t("common.excelFormatRequirements")}</h4>
          <div className="text-sm text-blue-800 space-y-1">
            <p>• <strong>{t("common.customerName")}:</strong> AD SOYAD ATA ADI</p>
            <p>• <strong>{t("common.customerPhone")}:</strong> MÜŞTƏRİNİN NÖMRƏSİ</p>
            <p>• <strong>{t("common.additionalContacts")}:</strong> ƏLAVƏ NÖMRƏLƏR (ANASI, QARDAŞI, etc.)</p>
            <p>• <strong>Company:</strong> Selected from dropdown above (applies to all customers)</p>
          </div>
        </div>
      </div>

      {/* Smart Comparison Section */}
      {customersData.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900">
              Smart Customer Analysis
            </h3>
            <button
              type="button"
              onClick={compareWithExisting}
              disabled={isComparing || !selectedCompany}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg text-white bg-purple-600 hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isComparing ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Analyzing...
                </>
              ) : (
                <>
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Compare with Existing
                </>
              )}
            </button>
          </div>

          {comparisonResult && (
            <div className="mb-6 p-4 bg-purple-50 border border-purple-200 rounded-lg">
              <h4 className="font-medium text-purple-900 mb-3">Analysis Results</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">{comparisonResult.summary.total}</div>
                  <div className="text-purple-700">Total in Excel</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">{comparisonResult.summary.new}</div>
                  <div className="text-green-700">New Customers</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">{comparisonResult.summary.existing}</div>
                  <div className="text-blue-700">Existing Customers</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-orange-600">{comparisonResult.summary.needsUpdate}</div>
                  <div className="text-orange-700">Need Updates</div>
                </div>
              </div>
            </div>
          )}

          {/* Customer List with Status */}
          <div className="space-y-3">
            {customersData.map((customer, index) => {
              const existingInfo = comparisonResult?.existingCustomers.find(
                (ec: any) => ec.importData.customer_name === customer.customer_name
              );
              
              return (
                <div key={index} className={`flex items-center justify-between p-3 rounded-lg ${
                  existingInfo ? 'bg-blue-50 border border-blue-200' : 'bg-gray-50'
                }`}>
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <div className="font-medium">{customer.customer_name}</div>
                      {existingInfo && (
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                          existingInfo.needsUpdate 
                            ? 'bg-orange-100 text-orange-800' 
                            : 'bg-green-100 text-green-800'
                        }`}>
                          {existingInfo.needsUpdate ? (
                            <>
                              <AlertCircle className="w-3 h-3 mr-1" />
                              Needs Update
                            </>
                          ) : (
                            <>
                              <CheckCircle className="w-3 h-3 mr-1" />
                              Up to Date
                            </>
                          )}
                        </span>
                      )}
                    </div>
                    <div className="text-sm text-gray-600">
                      {customer.customer_phone}
                    </div>
                    {customer.additional_contacts && customer.additional_contacts.trim() !== '' && (
                      <div className="text-xs text-gray-500 mt-1">
                        {customer.additional_contacts.split(' ').filter(entry => entry.trim() !== '').length} əlavə əlaqə
                      </div>
                    )}
                    {existingInfo?.missingFields && existingInfo.missingFields.length > 0 && (
                      <div className="text-xs text-orange-600 mt-1">
                        Missing: {existingInfo.missingFields.join(', ')}
                      </div>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => removeCustomerRow(index)}
                    className="p-2 text-red-500 hover:text-red-700"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              );
            })}
          </div>

          <div className="mt-6 flex justify-end space-x-3">
            <button
              type="button"
              onClick={clearAllData}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
            >
              {t("common.clearAll")}
            </button>
            {comparisonResult ? (
              <button
                type="button"
                onClick={handleSmartImport}
                disabled={isImporting || !selectedCompany}
                className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isImporting ? 'Smart Importing...' : 'Smart Import (New + Updates)'}
              </button>
            ) : (
              <button
                type="button"
                onClick={handleImport}
                disabled={isImporting || !selectedCompany}
                className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isImporting ? t("common.importing") : t("common.importCustomers")}
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomerImport;

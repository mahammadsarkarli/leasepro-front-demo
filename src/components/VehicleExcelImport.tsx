import React, { useState, useRef, useEffect } from 'react';
import { useTranslation } from '../i18n';
import { Upload, FileSpreadsheet, X, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import * as XLSX from 'xlsx';
import { createVehicle, testDatabaseConnection } from '../services/vehicles';
import { useData } from '../contexts/DataContext';

interface ExcelVehicleData {
  make: string;
  model: string;
  color: string;
  year: string | number;
  license_plate: string;
  ban_vin_number: string;
  registration_certificate: string;
  registration_certificate_number: string;
  engine: string;
  company: string;
}

interface ImportResult {
  success: boolean;
  message: string;
  vehicle?: any;
  row?: number;
}

interface VehicleData {
  license_plate: string;
  make: string;
  model: string;
  year: number;
  color: string;
  engine: string;
  body_number: string;
  company_id: string;
  ban_vin_number?: string;
  registration_certificate?: string;
  registration_certificate_number?: string;
  [key: string]: any; // Allow additional properties during mapping
}

const VehicleExcelImport: React.FC = () => {
  const { t } = useTranslation();
  const { companies, refreshData } = useData();
  
  // Use local state for company selection since DataContext setSelectedCompany might not work
  const [selectedCompany, setSelectedCompany] = useState<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [isImporting, setIsImporting] = useState(false);
  const [importResults, setImportResults] = useState<ImportResult[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewData, setPreviewData] = useState<ExcelVehicleData[]>([]);
  


  // Monitor companies changes to auto-select first company if available
  useEffect(() => {
    if (companies.length > 0 && !selectedCompany) {
      console.log('Auto-selecting first company:', companies[0]);
      setSelectedCompany(companies[0]);
    }
  }, [companies, selectedCompany]);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.name.match(/\.(xlsx|xls)$/i)) {
      alert(t('common.pleaseSelectExcelFile') || 'Please select an Excel file (.xlsx or .xls)');
      return;
    }

    // Validate file size (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
      alert(t('common.fileTooLarge') || 'File size must be less than 5MB');
      return;
    }

    setSelectedFile(file);
    await previewExcelData(file);
  };

  const previewExcelData = async (file: File) => {
    try {
      const data = await readExcelFile(file);
      setPreviewData(data.slice(0, 5)); // Show first 5 rows as preview
    } catch (error) {
      console.error('Error reading Excel file:', error);
      alert(t('common.errorReadingFile') || 'Error reading Excel file');
    }
  };

  const readExcelFile = (file: File): Promise<ExcelVehicleData[]> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target?.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: 'array' });
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];
          
          // Get the range of the worksheet
          const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1');
          const maxCol = range.e.c; // Maximum column index
          
          // Convert to JSON with header row and preserve empty cells
          const jsonData = XLSX.utils.sheet_to_json(worksheet, { 
            header: 1,
            defval: '', // Default value for empty cells
            blankrows: false // Skip completely blank rows
          });
          
          if (jsonData.length < 2) {
            reject(new Error('Excel file must have at least a header row and one data row'));
            return;
          }

          const headers = jsonData[0] as string[];
          const rows = jsonData.slice(1) as any[][];

          console.log('Detected headers:', headers);
          console.log('Number of columns:', headers.length);

          // Flexible column handling - support both full format and basic format
          let headerMapping: { [key: string]: string } = {};
          let isBasicFormat = false;

          if (headers.length >= 9) {
            // Full format with 9+ columns
            headerMapping = {
              'Make': 'make',
              'Model': 'model',
              'Color': 'color',
              'Year': 'year',
              'License Plate (Dövlət qeydiyyat nişanı)': 'license_plate',
              'BAN / VIN Number': 'ban_vin_number',
              'Qeydiyyat şəhadətnaməsi (Registration Certificate)': 'registration_certificate',
              'Engine No (optional)': 'engine',
              'Company': 'company'
            };
            console.log('Using full format (9+ columns)');
          } else if (headers.length >= 2) {
            // Basic format with just Make and Model
            isBasicFormat = true;
            headerMapping = {
              'Make': 'make',
              'Model': 'model'
            };
            console.log('Using basic format (2+ columns)');
          } else if (headers.length === 1) {
            // Single column format - treat as vehicle makes
            isBasicFormat = true;
            headerMapping = {
              [headers[0]]: 'make' // Use whatever the header is as the make field
            };
            console.log('Using single column format (1 column)');
          } else {
            reject(new Error(`Excel file must have at least 1 column. Found: ${headers.length}.`));
            return;
          }



          const mappedData: ExcelVehicleData[] = rows.map((row, index) => {
            const mappedRow: any = {};
            
            // Ensure row has the correct number of columns
            const paddedRow = new Array(maxCol + 1).fill('').map((_, colIndex) => row[colIndex] || '');
            
            headers.forEach((header, colIndex) => {
              const mappedKey = headerMapping[header];
              if (mappedKey) {
                // Get value from the padded row to ensure correct column alignment
                const value = paddedRow[colIndex];
                mappedRow[mappedKey] = value;
              }
            });

            // For basic format, fill in default values for missing fields
            if (isBasicFormat) {
              mappedRow.color = mappedRow.color || 'Unknown';
              mappedRow.year = mappedRow.year || new Date().getFullYear();
              mappedRow.license_plate = mappedRow.license_plate || `TEMP-${Date.now()}-${index}`;
              mappedRow.ban_vin_number = mappedRow.ban_vin_number || `TEMP-VIN-${Date.now()}-${index}`;
              mappedRow.registration_certificate = mappedRow.registration_certificate || `TEMP-RC-${Date.now()}-${index}`;
              mappedRow.engine = mappedRow.engine || 'Unknown';
              mappedRow.company = mappedRow.company || '';
            }

            // Debug logging for troubleshooting
            console.log(`Row ${index + 1} parsed data:`, {
              original: row,
              padded: paddedRow,
              mapped: mappedRow,
              isBasicFormat
            });

            return mappedRow;
          });

          resolve(mappedData);
        } catch (error) {
          reject(error);
        }
      };

      reader.onerror = () => reject(new Error('Error reading file'));
      reader.readAsArrayBuffer(file);
    });
  };

  const validateVehicleData = (data: ExcelVehicleData, rowIndex: number): string[] => {
    const errors: string[] = [];
    
    // Debug logging to see what data we're actually getting
    console.log(`Validating row ${rowIndex}:`, data);
    
    // No required fields - everything is optional
    // Only validate data format if data is provided
    
    // Validate year (optional field)
    if (data.year && data.year.toString().trim()) {
      const yearNum = parseInt(data.year.toString().trim());
      if (isNaN(yearNum) || yearNum < 1900 || yearNum > new Date().getFullYear() + 1) {
        errors.push('Invalid year (must be between 1900 and ' + (new Date().getFullYear() + 1) + ')');
      }
    }

    // Validate company ID format (UUID) if provided
    if (data.company && data.company.toString().trim()) {
      if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(data.company.toString().trim())) {
        errors.push('Invalid company ID format (must be a valid UUID)');
      }
    }

    return errors;
  };

  const importVehicles = async () => {
    if (!selectedFile) return;

    // Check if a company is selected
    if (!selectedCompany?.id) {
      alert('Please select a company before importing vehicles.');
      return;
    }

    setIsImporting(true);
    setImportResults([]);
    
    try {
      // Check if user is online
      if (!navigator.onLine) {
        throw new Error('You are currently offline. Please check your internet connection and try again.');
      }
      
      // Check Supabase environment variables
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
      
      if (!supabaseUrl || !supabaseKey) {
        throw new Error('Supabase configuration missing. Please check your environment variables.');
      }
      
      console.log('Supabase URL:', supabaseUrl);
      console.log('Supabase Key exists:', !!supabaseKey);
      console.log('Selected Company ID:', selectedCompany.id);
      
      // Test database connection first
      console.log('Testing database connection...');
      let isConnected = false;
      try {
        isConnected = await testDatabaseConnection();
      } catch (error) {
        console.error('Database connection test error:', error);
        isConnected = false;
      }
      
      if (!isConnected) {
        throw new Error('Database connection failed. Please check your internet connection and try again. If the problem persists, contact your administrator.');
      }
      
      const excelData = await readExcelFile(selectedFile);
      const results: ImportResult[] = [];

      for (let i = 0; i < excelData.length; i++) {
        const rowData = excelData[i];
        const rowNumber = i + 2; // +2 because Excel is 1-indexed and we have header row

        // Validate data
        const validationErrors = validateVehicleData(rowData, rowNumber);
        
        if (validationErrors.length > 0) {
          results.push({
            success: false,
            message: `Row ${rowNumber}: ${validationErrors.join(', ')}`,
            row: rowNumber
          });
          continue;
        }

                try {
          // Validate company ID format
          let companyId = selectedCompany?.id;
          if (rowData.company && rowData.company.toString().trim()) {
            const companyValue = rowData.company.toString().trim();
            // Check if it's a valid UUID format
            if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(companyValue)) {
              companyId = companyValue;
            } else {
              console.warn(`Invalid company ID format in row ${rowNumber}: ${companyValue}. Using selected company instead.`);
            }
          }
          
          if (!companyId) {
            throw new Error('No valid company ID available. Please select a company first.');
          }

          // Prepare vehicle data with default values for all fields
          const vehicleData: VehicleData = {
            company_id: companyId,
            license_plate: rowData.license_plate?.toString().trim() || 'N/A',
            make: rowData.make?.toString().trim() || 'Unknown',
            model: rowData.model?.toString().trim() || 'Unknown',
            year: rowData.year && rowData.year.toString().trim() ? 
              parseInt(rowData.year.toString().trim()) : 
              new Date().getFullYear(),
            color: rowData.color?.toString().trim() || 'Unknown',
            body_number: rowData.registration_certificate?.toString().trim() || 'N/A',
            registration_certificate_number: rowData.ban_vin_number?.toString().trim() || 'N/A',
            engine: rowData.engine?.toString().trim() || 'N/A'
          };

          // Debug logging
          console.log('Attempting to create vehicle with data:', vehicleData);

          // Create vehicle with retry mechanism
          let newVehicle;
          let retryCount = 0;
          const maxRetries = 3;
          
          while (retryCount < maxRetries) {
            try {
              newVehicle = await createVehicle(vehicleData);
              break; // Success, exit retry loop
            } catch (error: any) {
              retryCount++;
              console.log(`Attempt ${retryCount} failed:`, error);
              
              if (retryCount >= maxRetries) {
                throw error; // Re-throw on final attempt
              }
              
              // Wait before retrying (exponential backoff)
              await new Promise(resolve => setTimeout(resolve, 1000 * retryCount));
            }
          }
          
          results.push({
            success: true,
            message: `Row ${rowNumber}: Vehicle ${rowData.make} ${rowData.model} imported successfully`,
            vehicle: newVehicle,
            row: rowNumber
          });
        } catch (error) {
          console.error(`Error creating vehicle for row ${rowNumber}:`, error);
          
          let errorMessage = 'Unknown error';
          if (error instanceof Error) {
            errorMessage = error.message;
          } else if (typeof error === 'object' && error !== null) {
            // Handle Supabase errors
            const supabaseError = error as any;
            if (supabaseError.message) {
              errorMessage = supabaseError.message;
            } else if (supabaseError.details) {
              errorMessage = supabaseError.details;
            } else if (supabaseError.hint) {
              errorMessage = supabaseError.hint;
            }
          }
          
          results.push({
            success: false,
            message: `Row ${rowNumber}: ${errorMessage}`,
            row: rowNumber
          });
        }
      }

      setImportResults(results);
      setShowResults(true);
      
      // Refresh data if any vehicles were imported successfully
      if (results.some(r => r.success)) {
        refreshData();
      }
      
    } catch (error) {
      console.error('Import error:', error);
      alert(t('common.importError') || 'Error during import');
    } finally {
      setIsImporting(false);
    }
  };

  const resetImport = () => {
    setSelectedFile(null);
    setPreviewData([]);
    setImportResults([]);
    setShowResults(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const downloadTemplate = () => {
    const templateData = [
      ['Make', 'Model', 'Color', 'Year', 'License Plate (Dövlət qeydiyyat nişanı)', 'BAN / VIN Number', 'Qeydiyyat şəhadətnaməsi (Registration Certificate)', 'Engine No (optional)', 'Company'],
      ['BYD', 'Destroyer 05 Plug-in Hibrid', 'ağmirvari', '2025', '90YZ706', 'LC0C76C49S0350081', 'BB787329', 'C25028563', '0542f290-76ba-4ccd-8910-b4a19217c764'],
      ['BYD', 'Destroyer 05 plug-in hibrid', 'ağmirvari', '', '90YT591', 'LC0C76C48R0692294', 'BB726258', '', '0542f290-76ba-4ccd-8910-b4a19217c764'],
      ['BMW', 'X5', 'Black', '2024', '10-AA-123', 'BMW123456789', 'RC234567', '3.0L Turbo', ''],
      ['Mercedes', 'C-Class', 'White', '2023', '10-BB-456', 'MBZ234567890', 'RC345678', '2.0L Turbo', '']
    ];

    const ws = XLSX.utils.aoa_to_sheet(templateData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Vehicles Template (Full Format)');
    
    // Also create a basic format template
    const basicTemplateData = [
      ['Make', 'Model'],
      ['BMW', '428i'],
      ['Ford', 'Fusion'],
      ['Hyundai', 'i40'],
      ['Infiniti', 'FX35'],
      ['Kia', 'Sorento'],
      ['Chevrolet', 'Aveo'],
      ['Mercedes', 'B-Class'],
      ['Porsche', 'Cayenne'],
      ['BYD', 'Destroyer 05'],
      ['Changan', 'Qiyuan Q05'],
      ['Hyundai', 'Accent'],
      ['Hyundai', 'Elantra'],
      ['Hyundai', 'Grandeur'],
      ['Hyundai', 'Santa Fe'],
      ['Range Rover', 'Evoque'],
      ['Toyota', 'Camry'],
      ['Toyota', 'Corolla']
    ];
    
        const basicWs = XLSX.utils.aoa_to_sheet(basicTemplateData);
    XLSX.utils.book_append_sheet(wb, basicWs, 'Basic Format (Make & Model Only)');
    
    XLSX.writeFile(wb, 'vehicles_import_templates.xlsx');
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
             <div className="flex items-center justify-between mb-6">
         <div>
           <h2 className="text-2xl font-bold text-gray-900">
             {t('vehicles.importFromExcel') || 'Import Vehicles from Excel'}
           </h2>
           {selectedCompany ? (
             <p className="text-sm text-gray-600 mt-1">
               Importing to company: <span className="font-medium text-blue-600">{selectedCompany.name}</span>
             </p>
           ) : (
             <p className="text-sm text-red-600 mt-1">
               ⚠️ Please select a company before importing
             </p>
           )}
         </div>
         <button
           onClick={downloadTemplate}
           className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
         >
           <FileSpreadsheet className="w-4 h-4 mr-2" />
           {t('common.downloadTemplate') || 'Download Template'}
         </button>
       </div>

             {!showResults && (
         <div className="space-y-6">
           {/* Company Selection */}
           <div className={`border rounded-lg p-4 ${!selectedCompany ? 'bg-yellow-50 border-yellow-200' : 'bg-green-50 border-green-200'}`}>
             <div className="flex items-center">
               <div className="flex-shrink-0">
                 {!selectedCompany ? (
                   <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                     <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                   </svg>
                 ) : (
                   <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                     <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                   </svg>
                 )}
               </div>
               <div className="ml-3">
                 <h3 className={`text-sm font-medium ${!selectedCompany ? 'text-yellow-800' : 'text-green-800'}`}>
                   {!selectedCompany ? 'Company Selection Required' : 'Company Selected'}
                 </h3>
                 <div className={`mt-2 text-sm ${!selectedCompany ? 'text-yellow-700' : 'text-green-700'}`}>
                   <p>{!selectedCompany ? 'Please select a company to import vehicles to:' : `Importing vehicles to: ${selectedCompany.name || 'Unknown Company'}`}</p>
                   
                   {/* Debug info */}
                   <div className="text-xs text-gray-500 mt-1">
                     Available companies: {companies.length}
                   </div>
                   
                   {companies.length > 0 ? (
                     <select 
                       className="mt-2 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                       value={selectedCompany?.id || ''}
                       onChange={(e) => {
                         if (e.target.value) {
                           const company = companies.find(c => c.id === e.target.value);
                           if (company) {
                             setSelectedCompany(company);
                             console.log('Selected company:', company);
                           }
                         } else {
                           setSelectedCompany(null);
                         }
                       }}
                     >
                       <option value="">Select a company...</option>
                       {companies.map(company => (
                         <option key={company.id} value={company.id}>
                           {company.name}
                         </option>
                       ))}
                     </select>
                   ) : (
                     <div className="mt-2 text-red-600 text-sm">
                       No companies available. Please add companies first.
                     </div>
                   )}
                 </div>
               </div>
             </div>
           </div>

           {/* File Upload Section */}
           <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls"
              onChange={handleFileSelect}
              className="hidden"
            />
            
            {!selectedFile ? (
              <div>
                <Upload className="mx-auto h-12 w-12 text-gray-400" />
                <div className="mt-4">
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    <FileSpreadsheet className="w-4 h-4 mr-2" />
                    {t('common.selectExcelFile') || 'Select Excel File'}
                  </button>
                </div>
                                 <p className="mt-2 text-sm text-gray-600">
                   {t('vehicles.excelImportInstructions') || 'Upload an Excel file (.xlsx or .xls) with vehicle data. Supports both full format (9 columns) and basic format (Make & Model only). Maximum file size: 5MB.'}
                 </p>
              </div>
            ) : (
              <div>
                <CheckCircle className="mx-auto h-8 w-8 text-green-500" />
                <p className="mt-2 text-sm font-medium text-gray-900">{selectedFile.name}</p>
                <p className="mt-1 text-sm text-gray-500">
                  {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                </p>
                <div className="mt-4 flex justify-center space-x-3">
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                  >
                    {t('common.changeFile') || 'Change File'}
                  </button>
                  <button
                    onClick={resetImport}
                    className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                  >
                    <X className="w-4 h-4 mr-1" />
                    {t('common.remove') || 'Remove'}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Preview Section */}
          {previewData.length > 0 && (
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-3">
                {t('common.preview') || 'Preview'} ({t('common.first5Rows') || 'First 5 rows'})
              </h3>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      {Object.keys(previewData[0] || {}).map((key) => (
                        <th key={key} className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          {key.replace(/_/g, ' ')}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {previewData.map((row, index) => (
                      <tr key={index}>
                        {Object.values(row).map((value, colIndex) => (
                          <td key={colIndex} className="px-3 py-2 text-sm text-gray-900">
                            {value || '-'}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

                     {/* Import Button */}
           {selectedFile && (
             <div className="text-center">
               <button
                 onClick={importVehicles}
                 disabled={isImporting || !selectedCompany}
                 className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
               >
                {isImporting ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    {t('common.importing') || 'Importing...'}
                  </>
                ) : (
                  <>
                    <Upload className="w-5 h-5 mr-2" />
                    {t('common.startImport') || 'Start Import'}
                  </>
                )}
                             </button>
               {!selectedCompany && (
                 <p className="mt-2 text-sm text-red-600">
                   ⚠️ Please select a company before importing vehicles
                 </p>
               )}
             </div>
           )}
        </div>
      )}

      {/* Results Section */}
      {showResults && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium text-gray-900">
              {t('common.importResults') || 'Import Results'}
            </h3>
            <button
              onClick={resetImport}
              className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
            >
              {t('common.importAnotherFile') || 'Import Another File'}
            </button>
          </div>

          <div className="space-y-2">
            {importResults.map((result, index) => (
              <div
                key={index}
                className={`flex items-center p-3 rounded-md ${
                  result.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
                }`}
              >
                {result.success ? (
                  <CheckCircle className="w-5 h-5 text-green-500 mr-3" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-red-500 mr-3" />
                )}
                <span className={`text-sm ${result.success ? 'text-green-800' : 'text-red-800'}`}>
                  {result.message}
                </span>
              </div>
            ))}
          </div>

          <div className="mt-6 p-4 bg-gray-50 rounded-md">
            <h4 className="text-sm font-medium text-gray-900 mb-2">
              {t('common.summary') || 'Summary'}
            </h4>
            <div className="text-sm text-gray-600">
              <p>
                {t('common.totalRows') || 'Total rows'}: {importResults.length}
              </p>
              <p>
                {t('common.successful') || 'Successful'}: {importResults.filter(r => r.success).length}
              </p>
              <p>
                {t('common.failed') || 'Failed'}: {importResults.filter(r => !r.success).length}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VehicleExcelImport;

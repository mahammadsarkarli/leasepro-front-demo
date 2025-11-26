import * as XLSX from 'xlsx';
import { Contract, Customer, Vehicle } from '../types';
import { calculateCorrectNextDueDate, calculateContractEndDate } from './contractUtils';

export interface ContractExportData {
  contract: Contract;
  customer: Customer | undefined;
  vehicle: Vehicle | undefined;
  company: { id: string; name: string } | undefined;
}

/**
 * Export contracts to Excel file
 */
export function exportContractsToExcel(contractsData: ContractExportData[], filename: string = 'Kontratlar.xlsx') {
  try {
    console.log('📊 Starting to export contracts to Excel...');
    
    // Filter out completed contracts
    const activeContractsData = contractsData.filter(({ contract }) => {
      const status = contract.status.toLowerCase();
      return status !== 'completed' && status !== 'tamamlanmis';
    });
    
    console.log(`📊 Filtered ${activeContractsData.length} contracts (excluded ${contractsData.length - activeContractsData.length} completed contracts)`);
    
    // Prepare data for Excel
    const excelData = activeContractsData.map(({ contract, customer, vehicle, company }) => {
      // Calculate end date
      const paymentBeginDate = new Date(contract.payment_start_date);
      const endDate = calculateContractEndDate(paymentBeginDate, contract.term_months);
      
      // Calculate next payment date
      const nextPaymentDate = calculateCorrectNextDueDate(contract, true);
      
      // Format customer name
      let customerName = 'Bilinməyən Müştəri';
      if (customer) {
        if (customer.customer_type === 'company' && customer.company_name) {
          customerName = customer.company_name;
        } else {
          customerName = `${customer.first_name || ''} ${customer.last_name || ''}`.trim();
        }
      }
      
      // Format drivers list
      let driversList = 'Yoxdur';
      if (contract.permission_document?.drivers && contract.permission_document.drivers.length > 0) {
        driversList = contract.permission_document.drivers
          .map((driver: any, index: number) => {
            const parts = [];
            parts.push(`${index + 1}.`);
            
            // Name
            if (driver.name) parts.push(driver.name);
            
            // License number
            if (driver.licenseNumber || driver.license_number) {
              parts.push(`VN: ${driver.licenseNumber || driver.license_number}`);
            }
            
            // License category
            if (driver.license_category) {
              parts.push(`Kateq: ${driver.license_category}`);
            }
            
            // License given date
            if (driver.license_given_date) {
              const givenDate = new Date(driver.license_given_date);
              const formattedDate = `${givenDate.getDate().toString().padStart(2, '0')}.${(givenDate.getMonth() + 1).toString().padStart(2, '0')}.${givenDate.getFullYear()}`;
              parts.push(`Tarix: ${formattedDate}`);
            }
            
            // Phone
            if (driver.phone) {
              parts.push(`Tel: ${driver.phone}`);
            }
            
            // Address
            if (driver.address) {
              parts.push(`Ünvan: ${driver.address}`);
            }
            
            return parts.join(', ');
          })
          .join(' | ');
      }
      
      // Format dates as dd.mm.yyyy
      const formatDate = (date: Date): string => {
        const day = date.getDate().toString().padStart(2, '0');
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const year = date.getFullYear();
        return `${day}.${month}.${year}`;
      };
      
      return {
        'Şirkət': company?.name || 'Bilinməyən Şirkət',
        'Müştəri': customerName,
        'Marka': vehicle?.make || '',
        'Model': vehicle?.model || '',
        'Dövlət Nömrəsi': vehicle?.license_plate || '',
        'İlkin Ödəniş (₼)': contract.down_payment || 0,
        'Aylıq Ödəniş (₼)': contract.monthly_payment || 0,
        'Başlanğıc Tarixi': formatDate(new Date(contract.start_date)),
        'Ödəniş Başlanğıc Tarixi': formatDate(new Date(contract.payment_start_date)),
        'Müddət (Ay)': contract.term_months,
        'Ödənilmiş Aylar': contract.payments_count || 0,
        'Növbəti Ödəniş Tarixi': formatDate(nextPaymentDate),
        'Bitmə Tarixi': formatDate(endDate),
        'Ümumi Məbləğ (₼)': contract.total_payable || 0,
        'Ödənilmiş Məbləğ (₼)': contract.total_paid || 0,
        'Qalan Borc (₼)': contract.remaining_balance || 0,
        'Faiz Dərəcəsi (%)': contract.yearly_interest_rate || 0,
        'Sürücülər': driversList,
        'Yaradılıb': contract.whoCreated || 'Bilinmir'
      };
    });
    
    console.log(`📊 Prepared ${excelData.length} contracts for export`);
    
    // Create worksheet
    const worksheet = XLSX.utils.json_to_sheet(excelData);
    
    // Set column widths
    const columnWidths = [
      { wch: 15 }, // Şirkət
      { wch: 20 }, // Müştəri
      { wch: 12 }, // Marka
      { wch: 12 }, // Model
      { wch: 12 }, // Dövlət Nömrəsi
      { wch: 15 }, // İlkin Ödəniş
      { wch: 15 }, // Aylıq Ödəniş
      { wch: 15 }, // Başlanğıc Tarixi
      { wch: 20 }, // Ödəniş Başlanğıc Tarixi
      { wch: 12 }, // Müddət
      { wch: 15 }, // Ödənilmiş Aylar
      { wch: 20 }, // Növbəti Ödəniş Tarixi
      { wch: 15 }, // Bitmə Tarixi
      { wch: 15 }, // Ümumi Məbləğ
      { wch: 15 }, // Ödənilmiş Məbləğ
      { wch: 15 }, // Qalan Borc
      { wch: 12 }, // Faiz Dərəcəsi
      { wch: 60 }, // Sürücülər
      { wch: 15 }  // Yaradılıb
    ];
    worksheet['!cols'] = columnWidths;
    
    // Create workbook
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Kontratlar');
    
    // Generate Excel file
    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([excelBuffer], { 
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
    });
    
    // Download file
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
    
    console.log('✅ Excel file exported successfully:', filename);
    return true;
  } catch (error) {
    console.error('❌ Error exporting contracts to Excel:', error);
    throw new Error('Excel faylı yaradılarkən xəta baş verdi');
  }
}

/**
 * Export filtered contracts to Excel
 */
export function exportFilteredContractsToExcel(
  contracts: Contract[], 
  customers: Customer[],
  companies: { id: string; name: string }[],
  filename?: string
) {
  const contractsData: ContractExportData[] = contracts.map(contract => ({
    contract,
    customer: customers.find(c => c.id === contract.customer_id),
    vehicle: contract.vehicle,
    company: companies.find(c => c.id === contract.company_id)
  }));
  
  return exportContractsToExcel(contractsData, filename);
}

/**
 * Export contracts grouped by company (each company gets its own worksheet)
 */
export function exportContractsGroupedByCompany(
  contracts: Contract[], 
  customers: Customer[],
  companies: { id: string; name: string }[],
  filename: string = 'Kontratlar_Şirkətlərə_Görə.xlsx'
) {
  try {
    console.log('📊 Starting to export contracts grouped by company...');
    
    // Filter out completed contracts
    const activeContracts = contracts.filter(contract => {
      const status = contract.status.toLowerCase();
      return status !== 'completed' && status !== 'tamamlanmis';
    });
    
    console.log(`📊 Filtered ${activeContracts.length} contracts (excluded ${contracts.length - activeContracts.length} completed contracts)`);
    
    // Group contracts by company
    const contractsByCompany = new Map<string, ContractExportData[]>();
    
    activeContracts.forEach(contract => {
      const companyId = contract.company_id;
      if (!contractsByCompany.has(companyId)) {
        contractsByCompany.set(companyId, []);
      }
      
      contractsByCompany.get(companyId)!.push({
        contract,
        customer: customers.find(c => c.id === contract.customer_id),
        vehicle: contract.vehicle,
        company: companies.find(c => c.id === companyId)
      });
    });
    
    console.log(`📊 Found ${contractsByCompany.size} companies with contracts`);
    
    // Create workbook
    const workbook = XLSX.utils.book_new();
    
    // Helper function to format dates
    const formatDate = (date: Date): string => {
      const day = date.getDate().toString().padStart(2, '0');
      const month = (date.getMonth() + 1).toString().padStart(2, '0');
      const year = date.getFullYear();
      return `${day}.${month}.${year}`;
    };
    
    // Create a worksheet for each company
    let totalContracts = 0;
    const companyStats: Array<{
      company: string;
      count: number;
      totalValue: number;
      totalPaid: number;
      remaining: number;
    }> = [];
    
    contractsByCompany.forEach((contractsData, companyId) => {
      const company = companies.find(c => c.id === companyId);
      const companyName = company?.name || 'Bilinməyən Şirkət';
      
      // Prepare data for this company
      const excelData = contractsData.map(({ contract, customer, vehicle }) => {
        // Calculate end date
        const paymentBeginDate = new Date(contract.payment_start_date);
        const endDate = calculateContractEndDate(paymentBeginDate, contract.term_months);
        
        // Calculate next payment date
        const nextPaymentDate = calculateCorrectNextDueDate(contract, true);
        
        // Format customer name
        let customerName = 'Bilinməyən Müştəri';
        if (customer) {
          if (customer.customer_type === 'company' && customer.company_name) {
            customerName = customer.company_name;
          } else {
            customerName = `${customer.first_name || ''} ${customer.last_name || ''}`.trim();
          }
        }
        
        // Format drivers list
        let driversList = 'Yoxdur';
        if (contract.permission_document?.drivers && contract.permission_document.drivers.length > 0) {
          driversList = contract.permission_document.drivers
            .map((driver: any, index: number) => {
              const parts = [];
              parts.push(`${index + 1}.`);
              
              // Name
              if (driver.name) parts.push(driver.name);
              
              // License number
              if (driver.licenseNumber || driver.license_number) {
                parts.push(`VN: ${driver.licenseNumber || driver.license_number}`);
              }
              
              // License category
              if (driver.license_category) {
                parts.push(`Kateq: ${driver.license_category}`);
              }
              
              // License given date
              if (driver.license_given_date) {
                const givenDate = new Date(driver.license_given_date);
                const formattedDate = `${givenDate.getDate().toString().padStart(2, '0')}.${(givenDate.getMonth() + 1).toString().padStart(2, '0')}.${givenDate.getFullYear()}`;
                parts.push(`Tarix: ${formattedDate}`);
              }
              
              // Phone
              if (driver.phone) {
                parts.push(`Tel: ${driver.phone}`);
              }
              
              // Address
              if (driver.address) {
                parts.push(`Ünvan: ${driver.address}`);
              }
              
              return parts.join(', ');
            })
            .join(' | ');
        }
        
        return {
          'Müştəri': customerName,
          'Marka': vehicle?.make || '',
          'Model': vehicle?.model || '',
          'Dövlət Nömrəsi': vehicle?.license_plate || '',
          'İlkin Ödəniş (₼)': contract.down_payment || 0,
          'Aylıq Ödəniş (₼)': contract.monthly_payment || 0,
          'Başlanğıc Tarixi': formatDate(new Date(contract.start_date)),
          'Ödəniş Başlanğıc Tarixi': formatDate(new Date(contract.payment_start_date)),
          'Müddət (Ay)': contract.term_months,
          'Ödənilmiş Aylar': contract.payments_count || 0,
          'Növbəti Ödəniş Tarixi': formatDate(nextPaymentDate),
          'Bitmə Tarixi': formatDate(endDate),
          'Ümumi Məbləğ (₼)': contract.total_payable || 0,
          'Ödənilmiş Məbləğ (₼)': contract.total_paid || 0,
          'Qalan Borc (₼)': contract.remaining_balance || 0,
          'Faiz Dərəcəsi (%)': contract.yearly_interest_rate || 0,
          'Sürücülər': driversList,
          'Yaradılıb': contract.whoCreated || 'Bilinmir'
        };
      });
      
      // Calculate company statistics
      const companyTotalValue = contractsData.reduce((sum, { contract }) => sum + (contract.total_payable || 0), 0);
      const companyTotalPaid = contractsData.reduce((sum, { contract }) => sum + (contract.total_paid || 0), 0);
      const companyRemaining = contractsData.reduce((sum, { contract }) => sum + (contract.remaining_balance || 0), 0);
      
      companyStats.push({
        company: companyName,
        count: contractsData.length,
        totalValue: companyTotalValue,
        totalPaid: companyTotalPaid,
        remaining: companyRemaining
      });
      
      totalContracts += contractsData.length;
      
      // Create worksheet
      const worksheet = XLSX.utils.json_to_sheet(excelData);
      
      // Set column widths
      const columnWidths = [
        { wch: 20 }, // Müştəri
        { wch: 12 }, // Marka
        { wch: 12 }, // Model
        { wch: 12 }, // Dövlət Nömrəsi
        { wch: 15 }, // İlkin Ödəniş
        { wch: 15 }, // Aylıq Ödəniş
        { wch: 15 }, // Başlanğıc Tarixi
        { wch: 20 }, // Ödəniş Başlanğıc Tarixi
        { wch: 12 }, // Müddət
        { wch: 15 }, // Ödənilmiş Aylar
        { wch: 20 }, // Növbəti Ödəniş Tarixi
        { wch: 15 }, // Bitmə Tarixi
        { wch: 15 }, // Ümumi Məbləğ
        { wch: 15 }, // Ödənilmiş Məbləğ
        { wch: 15 }, // Qalan Borc
        { wch: 12 }, // Faiz Dərəcəsi
        { wch: 40 }, // Sürücülər
        { wch: 15 }  // Yaradılıb
      ];
      worksheet['!cols'] = columnWidths;
      
      // Sanitize sheet name (Excel has restrictions)
      let sheetName = companyName.substring(0, 31); // Max 31 characters
      sheetName = sheetName.replace(/[:\\\/\?\*\[\]]/g, '_'); // Remove invalid characters
      
      // Append worksheet to workbook
      XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
      
      console.log(`✅ Added worksheet for ${companyName} with ${contractsData.length} contracts`);
    });
    
    // Create a summary worksheet
    const summaryData = companyStats.map(stat => ({
      'Şirkət': stat.company,
      'Kontrakt Sayı': stat.count,
      'Ümumi Məbləğ (₼)': Math.round(stat.totalValue * 100) / 100,
      'Ödənilmiş (₼)': Math.round(stat.totalPaid * 100) / 100,
      'Qalan Borc (₼)': Math.round(stat.remaining * 100) / 100,
      'Ödəniş Faizi (%)': stat.totalValue > 0 
        ? Math.round((stat.totalPaid / stat.totalValue) * 100 * 100) / 100 
        : 0
    }));
    
    // Add totals row
    const totals = {
      'Şirkət': 'ÜMUMI',
      'Kontrakt Sayı': totalContracts,
      'Ümumi Məbləğ (₼)': Math.round(companyStats.reduce((sum, s) => sum + s.totalValue, 0) * 100) / 100,
      'Ödənilmiş (₼)': Math.round(companyStats.reduce((sum, s) => sum + s.totalPaid, 0) * 100) / 100,
      'Qalan Borc (₼)': Math.round(companyStats.reduce((sum, s) => sum + s.remaining, 0) * 100) / 100,
      'Ödəniş Faizi (%)': 0
    };
    totals['Ödəniş Faizi (%)'] = totals['Ümumi Məbləğ (₼)'] > 0 
      ? Math.round((totals['Ödənilmiş (₼)'] / totals['Ümumi Məbləğ (₼)']) * 100 * 100) / 100 
      : 0;
    
    summaryData.push(totals);
    
    const summaryWorksheet = XLSX.utils.json_to_sheet(summaryData);
    summaryWorksheet['!cols'] = [
      { wch: 25 }, // Şirkət
      { wch: 15 }, // Kontrakt Sayı
      { wch: 18 }, // Ümumi Məbləğ
      { wch: 18 }, // Ödənilmiş
      { wch: 18 }, // Qalan Borc
      { wch: 15 }  // Ödəniş Faizi
    ];
    
    // Insert summary sheet at the beginning
    XLSX.utils.book_append_sheet(workbook, summaryWorksheet, 'Ümumi Məlumat');
    
    // Move summary sheet to the first position
    const sheets = workbook.SheetNames;
    const summaryIndex = sheets.indexOf('Ümumi Məlumat');
    if (summaryIndex > 0) {
      sheets.splice(summaryIndex, 1);
      sheets.unshift('Ümumi Məlumat');
    }
    
    // Generate Excel file
    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([excelBuffer], { 
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
    });
    
    // Download file
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
    
    console.log('✅ Excel file with grouped companies exported successfully:', filename);
    console.log(`📊 Total: ${totalContracts} contracts across ${contractsByCompany.size} companies`);
    return true;
  } catch (error) {
    console.error('❌ Error exporting contracts grouped by company:', error);
    throw new Error('Şirkətlərə görə qruplaşdırılmış Excel faylı yaradılarkən xəta baş verdi');
  }
}


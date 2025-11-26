import { Contract, Customer, Company, Vehicle } from '../types';
import { printDocument } from './pdfUtils';
import { safeFormatDate } from './dateUtils';

export interface XitamData {
  contract: Contract;
  customer: Customer;
  company: Company;
  vehicle: Vehicle;
}

export const generateXitamHTML = (data: XitamData): string => {
  const { contract, customer, company, vehicle } = data;
  
  const contractDate = safeFormatDate(contract.start_date, 'dd.MM.yyyy');
  const contractNumber = contract.contract_number || contract.id;
  
  const companyName = company.name || '';
  const directorName = company.director || '';
  
  const customerName = customer.customer_type === 'company' 
    ? customer.company_name || `${customer.first_name || ''} ${customer.last_name || ''}`.trim()
    : `${customer.first_name || ''} ${customer.last_name || ''} ${customer.father_name || ''}`.trim();
  
  const customerAddress = customer.address || '';
  
  // Şəxsiyyət vəsiqəsi məlumatları
  const nationalId = customer.national_id || '';
  
  const vehicleInfo = vehicle ? `${vehicle.make || ''} ${vehicle.model || ''}`.trim() : '';
  const vehicleColor = vehicle?.color || '';
  const vehicleRegistrationPlate = vehicle?.license_plate || '';
  
  const contractTermMonths = contract.term_months || 0;
  
  return `
    <!DOCTYPE html>
    <html lang="az">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Müqavilə Xitamı Ərizəsi - ${contract.id}</title>
      <style>
        @page {
          size: A4;
          margin: 10mm 12mm;
        }
        
        body {
          font-family: 'Times New Roman', serif;
          font-size: 11pt;
          line-height: 1.5;
          color: #000;
          margin: 0;
          padding: 10mm 12mm;
        }
        
        .document {
          max-width: 100%;
          margin: 0 auto;
          padding: 6mm 10mm;
        }
        
        .recipient-info {
          text-align: left;
          margin-bottom: 40px;
          font-size: 11pt;
          line-height: 1.6;
          width: 45%;
          margin-left: auto;
          padding: 6px 10px;
        }
        
        .recipient-heading {
          font-size: 13pt;
          letter-spacing: 0.04em;
          text-transform: uppercase;
          margin-bottom: 6px;
        }
        
        .recipient-body {
          font-size: 11pt;
        }
        
        .main-title {
          text-align: center;
          font-size: 18pt;
          font-weight: bold;
          margin: 30px 0;
        }
        
        .main-content {
          text-align: justify;
          margin-bottom: 25px;
          line-height: 1.8;
          font-size: 11pt;
        }
        
        .signature-section {
          margin-top: 60px;
          display: flex;
          flex-direction: column;
          gap: 35px;
        }
        
        .signature-row {
          display: flex;
          align-items: center;
          gap: 12px;
          font-size: 11pt;
        }
        
        .signature-label {
          font-weight: bold;
          min-width: 50px;
        }
        
        .signature-line {
          flex: 1;
          border-bottom: 1px solid #000;
          min-height: 18px;
        }
      </style>
    </head>
    <body>
      <div class="document">
        <div class="recipient-info">
          <p class="recipient-heading">“${companyName}”-nin Direktoru ${directorName ? `cənab ${directorName}` : ''}</p>
          <p class="recipient-body">${customerAddress} ünvanında qeydiyyatda olan ${customerName} tərəfindən</p>
        </div>
        
        <div class="main-title">Ərizə</div>
        
        <div class="main-content">
          Nəzərinizə çatdırmaq istəyirəm ki, mən ${customerName} (Şəxsiyyət vəsiqəsi: ${nationalId}) ${contractDate} tarixli, ${contractNumber} saylı Maliyyə Lizinqi müqaviləsi üzrə lizinq şərtləri ilə ${contractTermMonths} ay müddətinə “${vehicleInfo}” markalı (${vehicleColor}), ${vehicleRegistrationPlate} dövlət qeydiyyat nişanlı avtomobili lizinqə götürmüşəm.
        </div>
        
        <div class="main-content">
          Hal-hazırda maddi vəziyyətimin pisləşdiyini nəzərə alaraq bu günə hesablanmış borc məbləğinin güzəşt edilməklə, lizinq obyektini qaytarmaq şərti ilə ${contractDate} tarixli, ${contractNumber} saylı Maliyyə Lizinqi müqaviləsinə xitam verilməsini Sizdən xahiş edirəm.
        </div>
        
        <div class="signature-section">
          <div class="signature-row">
            <div class="signature-label">İmza:</div>
            <div class="signature-line"></div>
          </div>
          <div class="signature-row">
            <div class="signature-label">Tarix:</div>
            <div class="signature-line"></div>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;
};

export const printXitam = (data: XitamData): void => {
  const htmlContent = generateXitamHTML(data);
  printDocument(htmlContent, `xitam-${data.contract.id}`);
};


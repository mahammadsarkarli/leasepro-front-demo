import { Contract, Customer, Company, Vehicle } from '../types';
import { printDocument } from './pdfUtils';
import { safeFormatDate } from './dateUtils';

export interface TehvilTeslimData {
  contract: Contract;
  customer: Customer;
  company: Company;
  vehicle: Vehicle;
}

export const generateTehvilTeslimHTML = (data: TehvilTeslimData): string => {
  const { contract, customer, company, vehicle } = data;
  
  const currentDate = safeFormatDate(new Date(), 'dd.MM.yyyy');
  
  const companyName = company.name || '';
  const directorName = company.director || '';
  
  const customerName = customer.customer_type === 'company' 
    ? customer.company_name || `${customer.first_name || ''} ${customer.last_name || ''}`.trim()
    : `${customer.first_name || ''} ${customer.last_name || ''} ${customer.father_name || ''}`.trim();
  
  const vehicleInfo = vehicle ? `${vehicle.make || ''} ${vehicle.model || ''}`.trim() : '';
  const vehicleBodyNumber = vehicle?.body_number || '';
  const vehicleEngine = vehicle?.engine || '';
  const vehicleRegistrationPlate = vehicle?.license_plate || '';
  
  // Təhvil verən (genellikle şirket direktoru)
  const delivererName = directorName || '';
  
  return `
    <!DOCTYPE html>
    <html lang="az">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Təhvil-Təslim Aktı - ${contract.id}</title>
      <style>
        @page {
          size: A4;
          margin: 5mm;
        }
        
        body {
          font-family: 'Times New Roman', serif;
          font-size: 11pt;
          line-height: 1.5;
          color: #000;
          margin: 0;
          padding: 5mm;
        }
        
        .print-btn {
          position: fixed;
          top: 16px;
          right: 16px;
          background: #2563eb;
          color: #fff;
          border: 0;
          padding: 8px 12px;
          border-radius: 6px;
          cursor: pointer;
          z-index: 1000;
        }
        
        .no-print {
          display: block;
        }
        
        @media print {
          .no-print {
            display: none !important;
          }
        }
        
        .document {
          max-width: 100%;
          margin: 0 auto;
          padding: 5mm;
        }
        
        .header {
          text-align: center;
          margin-bottom: 20px;
        }
        
        .main-title {
          text-align: center;
          font-size: 18pt;
          font-weight: bold;
          margin: 20px 0;
          text-transform: uppercase;
        }
        
        .date-section {
          display: flex;
          justify-content: space-between;
          margin-bottom: 25px;
          font-size: 11pt;
        }
        
        .date-label {
          font-weight: bold;
        }
        
        .date-value {
          border-bottom: 1px solid #000;
          min-width: 80mm;
          display: inline-block;
          text-align: center;
        }
        
        .main-content {
          text-align: justify;
          margin-bottom: 30px;
          line-height: 1.6;
          font-size: 11pt;
        }
        
        .signature-section {
          margin-top: 40px;
        }
        
        .signature-row {
          display: flex;
          justify-content: space-between;
          margin-bottom: 15px;
          align-items: flex-start;
        }
        
        .signature-label {
          font-weight: bold;
          min-width: 100px;
        }
        
        .signature-name {
          flex: 1;
          border-bottom: 1px solid #000;
          margin-left: 10px;
          min-height: 20px;
          padding-left: 5px;
        }
      </style>
    </head>
    <body>
      <button class="print-btn no-print" onclick="window.print()">Çap Et</button>
      
      <div class="document">
        <div class="header">
          <div class="main-title">TƏHVİL-TƏSLİM AKTI</div>
        </div>
        
        <div class="date-section">
          <div class="date-label">Tarix:</div>
          <div class="date-value">${currentDate}</div>
        </div>
        
        <div class="main-content">
          Biz aşağıda imza edənlər, bir tərəfdən "<strong>${companyName}</strong>"-nin direktoru <strong>${delivererName}</strong> və digər tərəfdən müştəri <strong>${customerName}</strong>, bu aktı ondan ötrü tərtib etdik ki, həqiqətən "<strong>${companyName}</strong>" MMC-yə məxsus olan "<strong>${vehicleInfo}</strong>" markalı ${vehicleBodyNumber ? `<strong>${vehicleBodyNumber}</strong>` : ''} ban, ${vehicleEngine ? `<strong>${vehicleEngine}</strong>` : ''} mühərrik, ${vehicleRegistrationPlate ? `<strong>${vehicleRegistrationPlate}</strong>` : ''} qeydiyyat nişanları olan 1 (bir) ədəd nəqliyyat vasitəsi müştəriyə təhvil verilmişdir.
        </div>
        
        <div class="signature-section">
          <br />
          <br />

          <div class="signature-row">
            <div class="signature-label">Təhvil verdi:</div>
            <div class="signature-name">${delivererName}</div>
          </div>
          <br />
          <br />
          <br />
          <div class="signature-row">
            <div class="signature-label">Təhvil aldı:</div>
            <div class="signature-name">${customerName}</div>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;
};

export const printTehvilTeslim = (data: TehvilTeslimData): void => {
  const htmlContent = generateTehvilTeslimHTML(data);
  printDocument(htmlContent, `tehvil-teslim-${data.contract.id}`);
};


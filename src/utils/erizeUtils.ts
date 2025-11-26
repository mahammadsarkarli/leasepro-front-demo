import { Contract, Customer, Company, Vehicle } from '../types';
import { printDocument } from './pdfUtils';
import { safeFormatDate } from './dateUtils';

export interface ErizeData {
  contract: Contract;
  customer: Customer;
  company: Company;
  vehicle: Vehicle;
}

export const generateErizeHTML = (data: ErizeData): string => {
  const { contract, customer, company, vehicle } = data;
  
  const contractDate = safeFormatDate(new Date(), 'dd.MM.yyyy');
  
  const companyName = company.name || '';
  const directorName = company.director || '';
  const directorInitials = directorName;
  
  const customerName = customer.customer_type === 'company' 
    ? customer.company_name || `${customer.first_name || ''} ${customer.last_name || ''}`.trim()
    : `${customer.first_name || ''} ${customer.last_name || ''} ${customer.father_name || ''}`.trim();
  
  const customerAddress = customer.address || '';
  
  const vehicleMake = vehicle?.make || '';
  const vehicleModel = vehicle?.model || '';
  const vehicleInfo = `${vehicleMake} ${vehicleModel}`.trim();
  const vehicleColor = vehicle?.color || '';
  const vehicleBodyNumber = vehicle?.body_number || '';
  const vehicleEngine = vehicle?.engine || '';
  
  const contractTermMonths = contract.term_months || 0;
  
  return `
    <!DOCTYPE html>
    <html lang="az">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Ərizə - ${contract.id}</title>
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
          font-size: 16pt;
          font-weight: bold;
          margin: 40px 0;
          text-transform: uppercase;
        }
        
        .content {
          text-align: justify;
          margin-bottom: 50px;
          line-height: 1.8;
          font-size: 11pt;
        }
        
        .signature-section {
          margin-top: 60px;
          display: flex;
          flex-direction: column;
          gap: 40px;
        }
        
        .signature-line {
          border-bottom: 1px solid #000;
          min-width: 200px;
          min-height: 20px;
          margin-top: 5px;
        }
        
        .date-line {
          border-bottom: 1px solid #000;
          min-width: 100px;
          min-height: 20px;
          margin-top: 5px;
        }
      </style>
    </head>
    <body>
      <div class="document">
        <div class="recipient-info">
          <p class="recipient-heading">“${companyName}”-nin Direktoru cənab ${directorInitials}</p>
          <p class="recipient-body">${customerAddress} ünvanında yaşayan ${customerName} tərəfindən</p>
        </div>
        
        <div class="main-title">ƏRİZƏ</div>
        
        <div class="content">
          Yazıb Sizdən xahiş edirəm ki, mənə ${contractTermMonths} ay müddətinə ''<strong>${vehicleInfo}</strong>'' markalı, ${vehicleBodyNumber} Ban, ${vehicleEngine} mühərrik, ${vehicleColor} rəngli olan avtomobili lizinqə verilməsinə köməklik göstərəsiniz.
        </div>
        
        <div class="signature-section">
          <div>
            <div><strong>${customerName}</strong></div>
            <div style="margin-top: 10px;">
              İmza
              <div class="signature-line"></div>
            </div>
          </div>
          <div>
            <div>
              Tarix:
              <div class="date-line" style="display: inline-block; margin-left: 10px; min-width: 100px;">${contractDate}</div>
            </div>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;
};

export const printErize = (data: ErizeData): void => {
  const htmlContent = generateErizeHTML(data);
  printDocument(htmlContent, `erize-${data.contract.id}`);
};


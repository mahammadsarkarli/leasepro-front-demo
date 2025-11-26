import { Contract, Customer, Company, Vehicle } from '../types';
import { printDocument } from './pdfUtils';
import { safeFormatDate } from './dateUtils';

export interface IltizamData {
  contract: Contract;
  customer: Customer;
  company: Company;
  vehicle: Vehicle;
}

export const generateIltizamHTML = (data: IltizamData): string => {
  const { contract, customer, company, vehicle } = data;
  
  const contractDate = safeFormatDate(contract.start_date, 'dd.MM.yyyy');
  const contractNumber = contract.contract_number || contract.id;
  
  const companyName = company.name || '';
  const companyDirector = company.director || '';
  
  const customerName = customer.customer_type === 'company' 
    ? customer.company_name || `${customer.first_name || ''} ${customer.last_name || ''}`.trim()
    : `${customer.first_name || ''} ${customer.last_name || ''} ${customer.father_name || ''}`.trim();
    
  const customerAddress = customer.address || '';
  
  const vehicleInfo = vehicle ? `${vehicle.make || ''} ${vehicle.model || ''}`.trim() : '';
  
  return `
    <!DOCTYPE html>
    <html lang="az">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>İltizam - ${contract.id}</title>
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
          margin-bottom: 30px;
        }
        
        .recipient-info {
          text-align: left;
          margin-bottom: 30px;
          font-size: 11pt;
          line-height: 1.6;
          width: 45%;
          margin-left: auto;
          padding: 10px 14px;
        }
        
        .recipient-heading {
          font-size: 13pt;
          letter-spacing: 0.04em;
          text-transform: uppercase;
          margin-bottom: 8px;
        }
        
        .recipient-body {
          font-size: 11pt;
        }
        
        .main-title {
          text-align: center;
          font-size: 20pt;
          font-weight: bold;
          margin: 20px 0;
          text-transform: uppercase;
        }
        
        .main-content {
          text-align: justify;
          margin-bottom: 20px;
          line-height: 1.8;
          font-size: 11pt;
        }
        
        .signature-section {
          margin-top: 50px;
        }
        
        .signature-name {
          font-weight: bold;
          margin-bottom: 20px;
          font-size: 11pt;
        }
        
        .signature-row {
          display: flex;
          justify-content: space-between;
          margin-bottom: 15px;
          align-items: flex-start;
        }
        
        .signature-label {
          font-weight: bold;
          min-width: 80px;
        }
        
        .signature-value {
          flex: 1;
          border-bottom: 1px solid #000;
          margin-left: 10px;
          min-height: 20px;
          padding-left: 5px;
        }
        
        .date-value {
          font-weight: bold;
        }
      </style>
    </head>
    <body>
      <button class="print-btn no-print" onclick="window.print()">Çap Et</button>
      
      <div class="document">
        <div class="recipient-info">
          <p class="recipient-heading">“${companyName}”-nin direktoru cənab ${companyDirector}</p>
          <p class="recipient-body">Həmçinin müqavilənin müştərisi olan və ${customerAddress} ünvanında qeydiyyatda olmaqla yaşayan ${customerName} tərəfindən</p>
        </div>
        
        <div class="header">
          <div class="main-title">İLTİZAM</div>
        </div>
        
        <div class="main-content">
          Mən <strong>${customerName}</strong> bildirirəm ki, ${contractDate} tarixli, ${contractNumber} saylı maliyyə lizinqi müqaviləsi üzrə müvəqqəti sahiblik və istifadəmə verilmiş "<strong>${vehicleInfo}</strong>" markalı nəqliyyat vasitəsi ilə bağlı bütün öhdəliklərimi müqavilə şərtlərinə uyğun yerinə yetirəcəyəm. Lizinq ödənişlərinin gecikdirilməsi və ya icra edilməməsi halında lizinq predmetini “<strong>${companyName}</strong>”-yə qüsursuz vəziyyətdə təhvil verəcəyəm və şirkətin birtərəfli qaydada geri qəbul etməsinə etiraz etməyəcəyəm.
        </div>
        
        <div class="main-content">
          Bununla yanaşı, lizinq predmetinin qaytarılması zamanı “<strong>${companyName}</strong>” tərəfindən tərtib edilən bütün akt və sənədləri qəbul etdiyimi, həmin sənədlərdə göstərilən şərtlərə əməl edəcəyimi və şirkətə qarşı heç bir iddia, tələb və ya pretensiya irəli sürməyəcəyimi təsdiq edirəm.
        </div>
        
        <div class="main-content">
          Həmçinin bildirirəm ki, lizinq predmetindən istifadə etdiyim müddətdə onun təhlükəsizliyini və mühafizəsini təmin edəcəyəm, yaranan hər hansı zərər və ya qüsur barədə dərhal məlumat verəcəyəm və müqavilə üzrə qalan bütün məbləğləri gecikdirmədən ödəyəcəyəm.
        </div>
        
        <div class="signature-section">
          <div class="signature-name">
            <strong>${customerName}</strong>
          </div>
          
          <div class="signature-row">
            <div class="signature-label">İmza:</div>
            <div class="signature-value"></div>
          </div>
          
          <div class="signature-row">
            <div class="signature-label">Tarix:</div>
            <div class="signature-value date-value">${contractDate}</div>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;
};

export const printIltizam = (data: IltizamData): void => {
  const htmlContent = generateIltizamHTML(data);
  printDocument(htmlContent, `iltizam-${data.contract.id}`);
};


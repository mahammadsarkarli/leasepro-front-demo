import { Contract, Customer, Company, Vehicle } from '../types';
import { printDocument } from './pdfUtils';
import { safeFormatDate } from './dateUtils';

export interface AlqiSatqiData {
  contract: Contract;
  customer: Customer;
  company: Company;
  vehicle: Vehicle;
}

export const generateAlqiSatqiHTML = (data: AlqiSatqiData): string => {
  const { contract, customer, company, vehicle } = data;
  
  const contractDate = safeFormatDate(contract.start_date, 'MM/dd/yyyy');
  const currentDate = safeFormatDate(new Date(), 'MM/dd/yyyy');
  const companyName = company.name || '';
  const directorName = company.director || '';
  const companyAddress = company.address || '';
  const companyVoen = company.voen || '';
  
  const sellerName = customer.customer_type === 'company' 
    ? customer.company_name || `${customer.first_name || ''} ${customer.last_name || ''}`.trim()
    : `${customer.first_name || ''} ${customer.last_name || ''} ${customer.father_name || ''}`.trim();
  const sellerAddress = customer.address || '';
  const sellerNationalId = customer.national_id || '';
  
  const vehicleMake = vehicle?.make || '';
  const vehicleModel = vehicle?.model || '';
  const vehicleYear = vehicle?.year || '';
  const vehicleColor = vehicle?.color || '';
  const vehicleEngine = vehicle?.engine || '';
  const vehiclePlate = vehicle?.license_plate || '';
  const vehicleVin = vehicle?.vin || vehicle?.body_number || '';
  const vehicleBodyNumber = vehicle?.body_number || '';
  const vehicleRegistrationCertificate = vehicle?.registration_certificate_number || '';
  
  const salePrice = contract.standard_purchase_price || contract.total_payable || contract.down_payment || 0;
  const city = (companyAddress?.split(',')[0] || 'Bakı').trim();
  
  return `
    <!DOCTYPE html>
    <html lang="az">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Alqı-Satqı Müqaviləsi - ${contract.id}</title>
      <style>
        @page {
          size: A4;
          margin: 8mm;
        }
        
        body {
          font-family: 'Times New Roman', serif;
          font-size: 11pt;
          line-height: 1.4;
          color: #000;
          margin: 0;
          padding: 8mm;
        }
        
        .document {
          width: 100%;
          margin: 0 auto;
        }
        
        .center {
          text-align: center;
        }
        
        .line-field {
          display: inline-block;
          border-bottom: 1px solid #000;
          min-width: 120px;
          padding: 0 4px;
        }
        
        .wide-line {
          min-width: 250px;
        }
        
        .section-title {
          font-weight: bold;
          text-transform: uppercase;
          margin: 18px 0 10px;
        }
        
        .table {
          width: 100%;
          border-collapse: collapse;
          margin: 15px 0;
          font-size: 10pt;
        }
        
        .table td,
        .table th {
          border: 1px solid #000;
          padding: 6px;
        }
        
        .table th {
          text-align: left;
        }
        
        .signature-row {
          display: flex;
          justify-content: space-between;
          margin-top: 25px;
        }
        
        .signature-block {
          width: 48%;
          font-size: 10pt;
        }
        
        .signature-label {
          margin-bottom: 6px;
        }
        
        .signature-line {
          border-bottom: 1px solid #000;
          min-height: 22px;
        }
        
        .conditions {
          margin-top: 20px;
          font-size: 10.5pt;
          line-height: 1.6;
        }
        
        .conditions li {
          margin-bottom: 8px;
        }
      </style>
    </head>
    <body>
      <div class="document">
        <div class="center" style="font-size:11pt;">
          Azərbaycan Respublikasının Nazirlər Kabinetinin 1999 il 15 mart tarixli 39 nömrəli qərarına<br />
          əsasən təsdiq edilmiş Qaydaların 3 nömrəli təsnifatı
        </div>
        
        <div class="center" style="margin:20px 0;font-weight:bold;font-size:13pt;">
          Nəqliyyat vasitəsinin alqı-satqı müqaviləsi
        </div>
        
        <div style="display:flex; justify-content:space-between; font-size:11pt; margin-bottom:12px;">
          <div>${city} şəhəri</div>
          <div>${currentDate}</div>
        </div>
        
        <div style="margin-bottom:12px;">
          Biz satıcı <span class="line-field wide-line">${sellerName}</span>
          (şəxsiyyət vəsiqəsi: <span class="line-field">${sellerNationalId}</span>)
        </div>
        
        <div style="margin-bottom:12px;">
          və "Alıcı" "<strong>${companyName}</strong>" MMC
        </div>
        
        <div style="margin-bottom:18px;">
          (baş ofis ünvanı: <span class="line-field wide-line">${companyAddress}</span>) bu müqaviləni bağladıq.
        </div>
        
        <div class="section-title center">Müqavilə üzrə məlumatlar</div>
        
        <table class="table">
          <tr>
            <th style="width:30%;">Satıcının avtomobili</th>
            <td>${vehiclePlate}</td>
            <th style="width:20%;">Marka / Model</th>
            <td>${vehicleMake} ${vehicleModel}</td>
          </tr>
          <tr>
            <th>Buraxılış ili</th>
            <td>${vehicleYear}</td>
            <th>Mühərrik №</th>
            <td>${vehicleEngine}</td>
          </tr>
          <tr>
            <th>Şassi / Ban №</th>
            <td>${vehicleBodyNumber}</td>
            <th>VIN</th>
            <td>${vehicleVin}</td>
          </tr>
          <tr>
            <th>Dövlət qeydiyyat nişanı</th>
            <td>${vehiclePlate}</td>
            <th>Texniki pasport №</th>
            <td>${vehicleRegistrationCertificate}</td>
          </tr>
          <tr>
            <th>Rəngi</th>
            <td>${vehicleColor}</td>
            <th>Satış qiyməti (AZN)</th>
            <td>${salePrice}</td>
          </tr>
        </table>
        
        <ol class="conditions">
          <li>Satıcı ona məxsus olan nəqliyyat vasitəsini ${salePrice} manat müqabilində Alıcıya satır.</li>
          <li>Bu müqavilənin müddəti avtomobil alqı-satqısı tam başa çatana qədər qüvvədədir.</li>
          <li>Nəqliyyat vasitəsi ilə bağlı bütün sənədlər bu müqavilə imzalandıqdan sonra Alıcıya təhvil verilir.</li>
          <li>Müqavilə üzrə vergi və digər ödənişlər qanunvericiliyə uyğun olaraq tərəflər tərəfindən həyata keçirilir.</li>
          <li>Tərəflər bu müqavilə üzrə bütün şərtlərə əməl etməyə və lazım gəldikdə aidiyyəti dövlət orqanlarına təqdim etməyə razıdır.</li>
        </ol>
        
        <div class="signature-row">
          <div class="signature-block">
            <div class="signature-label">Satıcı:</div>
            <div class="signature-line"></div>
            <div style="margin-top:6px;">${sellerName}</div>
          </div>
          <div class="signature-block">
            <div class="signature-label">Alıcı ("${companyName}" MMC):</div>
            <div class="signature-line"></div>
            <div style="margin-top:6px;">Direktor ${directorName}</div>
          </div>
        </div>
        
        <div style="margin-top:25px; font-size:10pt;">
          Qeydiyyat məmurunun qeydi: ________________________________________________
        </div>
        
        <div style="margin-top:8px; font-size:10pt;">
          Qeydiyyat müəssisəsinin rəhbəri: ___________________________________________
        </div>
      </div>
    </body>
    </html>
  `;
};

export const printAlqiSatqi = (data: AlqiSatqiData): void => {
  const htmlContent = generateAlqiSatqiHTML(data);
  printDocument(htmlContent, `alqi-satqi-${data.contract.id}`);
};


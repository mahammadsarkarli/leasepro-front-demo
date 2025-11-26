import { Payment, Contract, Customer, Company } from '../types';
// date-fns not required here; safeFormatDate used instead
import { safeFormatDate } from './dateUtils';
// DYP modular templates
import { DypFormData } from './dypTypes';
import { getHead as dypHead, getClose as dypClose } from './dypTemplates/common';
import { generatePage1HTML, renderPage1Body } from './dypTemplates/page1';
import { generatePage2HTML, renderPage2Body } from './dypTemplates/page2';
import { generatePage3HTML, renderPage3Body } from './dypTemplates/page3';
import { generatePage4HTML, renderPage4Body } from './dypTemplates/page4';
import { generatePage5HTML, renderPage5Body } from './dypTemplates/page5';
import { renderPage6Body } from './dypTemplates/page6';

export interface ReceiptData {
  payment: Payment;
  contract: Contract;
  customer: Customer;
  company: Company;
  user: string; // User who added the payment
}

export interface AuthorizationData {
  contract: Contract;
  customer: Customer;
  company: Company;
  paymentDate: Date;
  nextPaymentDate: Date;
  user: string;
  contactInfo?: CompanyContactInfo;
}

export interface ExtraPerson {
  id: string;
  name: string;
  surname: string;
  driverLicenseNo: string;
  category: string;
  lastDate: string;
}

export interface AuthorizationDocumentData {
  contract: Contract;
  customer: Customer;
  company: Company;
  beginDate: Date;
  endDate: Date;
  extraPersons: ExtraPerson[];
}

export interface CompanyContactInfo {
  id: string;
  name: string;
  address: string;
  phoneNumbers: string[];
  email: string;
  insurancePhoneNumbers: string[];
}

export const generatePaymentReceipt = (data: ReceiptData): string => {
  const { payment, contract, customer, company, user } = data;
  
  // Validate and format payment date safely
  const formattedPaymentDate = safeFormatDate(payment.payment_date, 'dd.MM.yyyy');
  
  const receiptHTML = `
    <!DOCTYPE html>
    <html lang="az">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Ödəniş Qəbzi</title>
      <style>
        @media print {
          body { margin: 0; }
          .no-print { display: none !important; }
        }
        
        body {
          font-family: Arial, sans-serif;
          margin: 20px;
          line-height: 1.6;
          color: #000;
          background: white;
        }
        
        .receipt {
          max-width: 800px;
          margin: 0 auto;
          border: 2px solid #000;
          padding: 20px;
        }
        
        .header {
          text-align: center;
          border-bottom: 2px solid #000;
          padding-bottom: 15px;
          margin-bottom: 20px;
        }
        
        .title {
          font-size: 24px;
          font-weight: bold;
          text-decoration: underline;
          margin-bottom: 10px;
        }
        
        .company-info {
          display: flex;
          justify-content: space-between;
          margin-bottom: 20px;
        }
        
        .voen {
          font-weight: bold;
        }
        
        .date {
          text-align: right;
          text-decoration: underline;
        }
        
        .payment-details {
          margin-bottom: 20px;
        }
        
        .row {
          display: flex;
          margin-bottom: 10px;
          border-bottom: 1px solid #ccc;
          padding-bottom: 5px;
        }
        
        .label {
          font-weight: bold;
          min-width: 120px;
        }
        
        .value {
          flex: 1;
          text-decoration: underline;
        }
        
        .amount-section {
          margin: 20px 0;
        }
        
        .amount-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 10px 0;
        }
        
        .amount-label {
          font-weight: bold;
        }
        
        .amount-value {
          font-weight: bold;
          font-size: 18px;
          background-color: #e8f5e8;
          padding: 5px 15px;
          border: 1px solid #000;
        }
        
        .footer {
          margin-top: 30px;
          display: flex;
          justify-content: space-between;
          align-items: flex-end;
        }
        
        .executed-by {
          flex: 1;
        }
        
        .signature-section {
          text-align: right;
        }
        
        .signature-line {
          border-bottom: 1px solid #000;
          width: 150px;
          margin-bottom: 5px;
        }
        
        .signature-labels {
          display: flex;
          justify-content: space-between;
          width: 150px;
          margin-top: 5px;
        }
        
        .print-button {
          position: fixed;
          top: 20px;
          right: 20px;
          background: #007bff;
          color: white;
          border: none;
          padding: 10px 20px;
          border-radius: 5px;
          cursor: pointer;
          font-size: 14px;
        }
        
        .print-button:hover {
          background: #0056b3;
        }
      </style>
    </head>
    <body>
      <button class="print-button no-print" onclick="window.print()">Çap Et</button>
      
      <div class="receipt">
        <div class="header">
          <div class="title">${company.name || ''} ÖDƏNİŞ QƏBZİ</div>
        </div>
        
        <div class="company-info">
          <div class="voen">VÖEN № ${company.voen || 'Təyin edilməyib'}</div>
          <div class="date">TARİX ${formattedPaymentDate}</div>
        </div>
        
        <div class="payment-details">
          <div class="row">
            <div class="label">KİMDƏN:</div>
            <div class="value">${customer.first_name} ${customer.last_name}</div>
          </div>
          <div class="row">
            <div class="label"></div>
            <div class="value">${contract.vehicle.license_plate} QEYDİYYAT NİŞANLI AVTOMOBİL ÜZRƏ LİZİNQ ÖDƏNİŞİ</div>
          </div>
          <div class="row">
            <div class="label">ÖDƏNİŞ TARİXİ:</div>
            <div class="value">${formattedPaymentDate}</div>
          </div>
        </div>
        
        <div class="amount-section">
          <div class="amount-row">
            <div class="amount-label">MƏBLƏĞ</div>
            <div class="amount-value">${Math.round(payment.amount)} AZN</div>
          </div>
        </div>
        
        <div class="footer">
          <div class="executed-by">
            İCRA ETDİ: ${user}
          </div>
          <div class="signature-section">
            <div class="signature-line"></div>
            <div class="signature-labels">
              <div>İMZA</div>
              <div>M.Y</div>
            </div>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;
  
  return receiptHTML;
};

export const generateAuthorizationDocument = (data: AuthorizationDocumentData): string => {
  const { contract, customer, company, beginDate, endDate, extraPersons = [] } = data;
  
  // Validate and format dates safely
  const formattedBeginDate = safeFormatDate(beginDate, 'dd.MM.yyyy');
  const formattedEndDate = safeFormatDate(endDate, 'dd.MM.yyyy');
  
  const extraPersonsHTML = (extraPersons || []).length > 0 ? `
    <div class="extra-persons">
      <h3>Əlavə Sürücülər:</h3>
      <table class="extra-persons-table">
        <thead>
          <tr>
            <th>№</th>
            <th>Ad</th>
            <th>Soyad</th>
            <th>Sürücülük Vəsiqəsi</th>
            <th>Kateqoriya</th>
            <th>Son Tarix</th>
          </tr>
        </thead>
        <tbody>
          ${extraPersons.map((person, index) => `
            <tr>
              <td>${index + 1}</td>
              <td>${person.name}</td>
              <td>${person.surname}</td>
              <td>${person.driverLicenseNo}</td>
              <td>${person.category}</td>
              <td>${person.lastDate}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
  ` : '';

  const authHTML = `
    <!DOCTYPE html>
    <html lang="az">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>İcazə Sənədi</title>
      <style>
        @media print {
          body { margin: 0; }
          .no-print { display: none !important; }
          @page { margin: 10mm; }
        }
        
        body {
          font-family: Arial, sans-serif;
          margin: 10px;
          line-height: 1.3;
          color: #000;
          background: white;
          font-size: 12px;
        }
        
        .document {
          max-width: 800px;
          margin: 0 auto;
          border: 2px solid #000;
          padding: 15px;
          min-height: 100vh;
          display: flex;
          flex-direction: column;
        }
        
        .header {
          text-align: center;
          border-bottom: 2px solid #000;
          padding-bottom: 8px;
          margin-bottom: 12px;
        }
        
        .company-name {
          font-size: 16px;
          font-weight: bold;
          margin-bottom: 3px;
        }
        
        .company-type {
          font-size: 12px;
          margin-bottom: 6px;
        }
        
        .title {
          font-size: 20px;
          font-weight: bold;
          text-decoration: underline;
          margin-bottom: 6px;
        }
        
        .content {
          margin-bottom: 15px;
          flex: 1;
        }
        
        .paragraph {
          margin-bottom: 8px;
          text-align: justify;
        }
        
        .vehicle-details {
          margin: 10px 0;
          padding: 8px;
          border: 1px solid #ccc;
          background-color: #f9f9f9;
        }
        
        .detail-row {
          margin-bottom: 2px;
        }
        
        .authorized-person {
          font-weight: bold;
          margin: 10px 0;
          text-align: center;
        }
        
        .authorization-text {
          font-size: 16px;
          font-weight: bold;
          text-align: center;
          margin: 10px 0;
          text-decoration: underline;
        }
        
        .validity {
          margin: 10px 0;
          font-weight: bold;
        }
        
        .extra-persons {
          margin: 10px 0;
        }
        
        .extra-persons h3 {
          margin-bottom: 5px;
          font-size: 14px;
        }
        
        .extra-persons-table {
          width: 100%;
          border-collapse: collapse;
          margin-top: 5px;
          font-size: 10px;
        }
        
        .extra-persons-table th,
        .extra-persons-table td {
          border: 1px solid #000;
          padding: 3px 4px;
          text-align: center;
          font-size: 10px;
        }
        
        .extra-persons-table th {
          background-color: #f0f0f0;
          font-weight: bold;
        }
        
        .signature-section {
          margin-top: 15px;
          display: flex;
          justify-content: space-between;
        }
        
        .director {
          text-align: center;
        }
        
        .director-line {
          font-weight: bold;
          margin-bottom: 3px;
        }
        
        .director-name {
          font-weight: bold;
          text-decoration: underline;
        }
        
        .footer {
          margin-top: 15px;
          border-top: 1px solid #ccc;
          padding-top: 8px;
        }
        
        .contact-info {
          text-align: center;
          font-size: 10px;
        }
        
        .contact-row {
          margin-bottom: 2px;
        }
      </style>
    </head>
    <body>
      <div class="document">
        <div class="header">
          <div class="company-name">"${company.name || 'STAR LİZİNQ'}"</div>
          <div class="company-type">Məhdud Məsuliyyətli Cəmiyyəti</div>
          <div class="title">İCAZƏ SƏNƏDİ</div>
        </div>
        
        <div class="content">
          <div class="paragraph">
            "Star Lizinq" Məhdud Məsuliyyətli Cəmiyyətinə
          </div>
          
          <div class="vehicle-details">
            <div class="detail-row">Məxsus ${contract.vehicle.make} ${contract.vehicle.model} markalı,</div>
            <div class="detail-row">Rəngi ${contract.vehicle.color}, il ${contract.vehicle.year},</div>
            <div class="detail-row">Dövlət qeydiyyat nişanı: ${contract.vehicle.license_plate}</div>
            <div class="detail-row">BAN N№${contract.vehicle.body_number || 'N/A'}</div>
            ${contract.vehicle.engine ? `<div class="detail-row">Mühərrik: ${contract.vehicle.engine}</div>` : ''}
            <div class="detail-row">Qeydiyyat şəhadətnaməsi ${contract.id}</div>
          </div>
          
          <div class="paragraph">
            Avtomobilin idarə etək hüququ
          </div>
          
          <div class="paragraph">
            Azərbaycan Respublikası Mülki Məcəlləsinin 362.5-ci maddəsinə uyğun olaraq
          </div>
          
                     <div class="authorized-person">
             ${customer.first_name} ${customer.last_name} ${customer.father_name ? customer.father_name + ' oğlu' : ''}
           </div>
          
          ${extraPersonsHTML}
          
          <div class="authorization-text">
            İCAZƏ VERİLMİŞDİR
          </div>
          
          <div class="paragraph">
            Lizinq verənin razılığı olmadan bu icazə sənədi üzrə səlahiyyətlər başqa şəxslərə verilə BİLƏR
          </div>
          
          <div class="validity">
            Bu icazə sənədi ${formattedBeginDate} ci il tarixindən ${formattedEndDate} ci il tarixinədək qüvvədədir.
          </div>
        </div>
        
        <div class="signature-section">
          <div class="director">
            <div class="director-line">DİREKTOR</div>
            <div class="director-name">${company.director || 'PİRİYEV B.M.'}</div>
          </div>
        </div>
        
        <div class="footer">
          <div class="contact-info">
            <div class="contact-row">Bakı şəhəri, Nəriman Nərimanov, Tabriz küçəsi 55</div>
            <div class="contact-row">(+99499)7959696 (+99470)79595 15 (+99455) 79595 95</div>
            <div class="contact-row">Starlizinq@mail.ru</div>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;
  
  return authHTML;
};

export const printDocument = (htmlContent: string, filename: string) => {
  void filename; // reserved for future use (naming when saving as PDF)
  const printWindow = window.open('', '_blank');
  if (printWindow) {
    printWindow.document.write(htmlContent);
    printWindow.document.close();
    
    // Wait for content to load then print
    printWindow.onload = () => {
      printWindow.print();
    };
  }
};

export const downloadPDF = async (htmlContent: string, filename: string) => {
  try {
    // For now, we'll use the browser's print functionality to save as PDF
    // In a production environment, you might want to use a library like jsPDF or html2pdf
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(htmlContent);
      printWindow.document.close();
      
      printWindow.onload = () => {
        printWindow.print();
      };
    }
  } catch (error) {
    console.error('Error generating PDF:', error);
    // Fallback to print
    printDocument(htmlContent, filename);
  }
};

// DYP form tipi artık ./dypTypes içinden import ediliyor

// Geçici/örnek DYP sənədi HTML üretimi (gerçek şablonlar gelince güncellenecek)
export const generateDypDocumentHTML = (
  form: DypFormData,
  company: Company,
  templateKey: string = 'page1'
): string => {
  const baseHead = (title: string) => `
    <!DOCTYPE html>
    <html lang="az">
    <head>
      <meta charset="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <title>${title}</title>
      <style>
        @media print { body { margin: 0; } .no-print { display: none !important; } @page { margin: 10mm; size: A4; } }
        body { font-family: Arial, sans-serif; margin: 10px; color: #000; background: #fff; font-size: 11px; }
        .doc { width: 190mm; margin: 0 auto; padding: 0 8mm; }
        .header { text-align: center; border-bottom: 2px solid #000; padding-bottom: 8px; margin-bottom: 10px; }
        .title { font-size: 18px; font-weight: bold; }
        .subtitle { font-size: 12px; margin-top: 4px; }
        .section { margin: 10px 0; }
        .section-title { font-weight: bold; margin-bottom: 6px; }
        .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 6px 16px; }
        .row { display: flex; gap: 8px; align-items: baseline; }
        .label { min-width: 160px; font-weight: bold; }
        .value { flex: 1; border-bottom: 1px solid #000; padding: 0 2px 2px; }
        table { width: 100%; border-collapse: collapse; font-size: 10.5px; table-layout: fixed; }
        th, td { border: 1px solid #000; padding: 5px; text-align: center; vertical-align: middle; }
        thead th { font-weight: bold; }
        .print-btn { position: fixed; top: 16px; right: 16px; background:#2563eb; color:#fff; border:0; padding:8px 12px; border-radius:6px; }
        .footer { margin-top: 14px; display: flex; justify-content: space-between; }
        .topbar { display:flex; justify-content:space-between; align-items:flex-start; margin-bottom: 6mm; }
        .topbar .left { font-size: 12px; }
        .topbar .right { text-align:right; font-size: 11px; }
        .bigtitle { text-align:center; font-size: 20px; font-weight:700; letter-spacing:0.3px; margin-bottom: 2mm; }
        .akti { text-align:center; font-weight:700; margin-bottom: 2mm; }
        .my { text-align:right; font-weight:700; margin: 2mm 0; }
        .bottom-grid { display:grid; grid-template-columns: 1fr 80mm; gap: 6mm; align-items:start; }
        .underline { display:inline-block; min-width: 26mm; border-bottom: 1px solid #000; height: 0; }
        .line-long { flex: 1; border-bottom: 1px solid #000; height: 0; }
      </style>
    </head>
    <body>
      <button class="print-btn no-print" onclick="window.print()">Çap Et</button>
  `;

  const baseOpen = () => `<div class="doc">`;
  const baseClose = () => `
        <div class="footer">
          <div>${company?.address || ''}</div>
          <div>${company?.voen ? 'VÖEN: ' + company.voen : ''}</div>
        </div>
      </div>
    </body>
    </html>`;

  const vehicleRows = () => `
    <tr><th>Nəqliyyat vasitəsinin tipi</th><td></td><th>Banın tipi</th><td></td><th>Buraxılış ili</th><td>${form.manufactureYear || ''}</td></tr>
    <tr><th>İstehsalçı zavod</th><td></td><th>Maks kütlə (yük avt)</th><td></td><th>Yüksüz kütlə (yük avt)</th><td></td></tr>
    <tr><th>Qeydiyyat şəhadətnaməsi</th><td></td><th>Markası modeli</th><td></td><th>Banın №-si</th><td>${form.bodyNumber || ''}</td></tr>
    <tr><th>Mühərrik №-si</th><td>${form.engine || ''}</td><th>Şassi №-si</th><td></td><th>Rəngi</th><td>${form.color || ''}</td></tr>
    <tr><th>Dövlət qeydiyyat nişanı</th><td>${form.registrationPlate || ''}</td><th>Tranzit №-si</th><td></td><th></th><td></td></tr>
  `;

  const page1 = () => `${baseHead('Təhvil-Təslim Aktı')}
    ${baseOpen()}
      <div class="topbar">
        <div class="left">Müəssisə təşkilat</div>
        <div class="right">
          <div>"Təsdiq edirəm"</div>
          <div>Rəhbər şəxsin imzası,Soyadı,Adı</div>
          <div style="margin-top:6px;">"_____" "_____" 20____</div>
        </div>
      </div>
      <div class="bigtitle">NƏQLİYYAT VASİTƏLƏRİNİN TƏHVİL-TƏSLİM</div>
      <div class="akti">A K T I</div>
      <div class="my">M.Y</div>

      <div class="section">
        <table style="table-layout:fixed;">
          <colgroup>
            <col style="width:16%" />
            <col style="width:12%" />
            <col style="width:12%" />
            <col style="width:14%" />
            <col style="width:14%" />
            <col style="width:14%" />
            <col style="width:18%" />
          </colgroup>
          <thead>
            <tr>
              <th style="width:16%">Nəqliyyat vasitəsinin tipi</th>
              <th style="width:12%">Banın tipi</th>
              <th style="width:12%">Buraxılış ili</th>
              <th style="width:14%">İstehsalçı zavod</th>
              <th style="width:14%">Max kütləsi<br/>(yük avt)</th>
              <th style="width:14%">Yüksüz kütləsi<br/>(yük avt)</th>
              <th style="width:18%">Qeydiyyat Şahadətnaması</th>
            </tr>
          </thead>
          <tbody>
            ${[1,2,3,4].map(() => `
              <tr>
                <td></td><td></td><td>${form.manufactureYear || ''}</td><td></td><td></td><td></td><td></td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>

      <div class="section" style="margin-top:10px;">
        <table style="table-layout:fixed;">
          <colgroup>
            <col style="width:16%" />
            <col style="width:12%" />
            <col style="width:12%" />
            <col style="width:14%" />
            <col style="width:14%" />
            <col style="width:14%" />
            <col style="width:18%" />
          </colgroup>
          <thead>
            <tr>
              <th>Markası modeli</th>
              <th>Banın №-si</th>
              <th>Mühərrik №-si</th>
              <th>Şassi №-si</th>
              <th>Rəngi</th>
              <th>Dövlət Qeydiyyat nişanı</th>
              <th>Tranzit №-si</th>
            </tr>
          </thead>
          <tbody>
            ${[1,2,3].map(() => `
              <tr>
                <td></td>
                <td>${form.bodyNumber || ''}</td>
                <td>${form.engine || ''}</td>
                <td></td>
                <td>${form.color || ''}</td>
                <td>${form.registrationPlate || ''}</td>
                <td></td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>

      <div class="section bottom-grid" style="margin-top:12px;">
        <div>
          <div class="row"><div>"_____" "_____" 20____ <span>il</span></div></div>
        </div>
        <div>
          <div class="row" style="margin-bottom:6px;">Tarixli №-li əmri(sərəncam) əsasında</div>
          <div class="row" style="margin-bottom:6px;">İstismara qəbul edilmiş(verilmiş)</div>
          <div class="row">Baxış keçirilmişdir</div>
        </div>
      </div>

      <div class="section" style="margin-top:10px;">
        <div class="row"><div class="label">Qəbul vaxtı avtomobil</div><div class="value"></div><div style="margin-left:6px;">dir</div></div>
        <div class="row" style="margin-top:6px;"><div class="label">Ödəmə məbləği</div><div class="value"></div><div style="margin-left:6px;">manat</div></div>
      </div>
    ${baseClose()}`;

  const page2 = () => `${baseHead('Ərizə (Hüquqi Şəxslər)')}
    ${baseOpen()}
      <div class="header">
        <div class="title">A K T I (Davamı)</div>
      </div>

      <div class="section">
        <div class="row" style="justify-content:space-between;">
          <div><strong>Alma (maliyyə mənbəyi)</strong> <span class="line-long"></span></div>
        </div>
        <div class="row" style="justify-content:space-between;">
          <div><strong>Düzəltmə əmsalı</strong> <span class="line-long"></span></div>
        </div>
        <div class="row" style="justify-content:space-between;">
          <div><strong>Avtomobilin qısa xarakteristikası</strong> <span class="line-long"></span></div>
        </div>
        <div class="row" style="justify-content:space-between;">
          <div><strong>Avtomobilin texniki şərtlərə uyğundur, uyğun deyil</strong> <span class="line-long"></span></div>
        </div>
        <div class="row" style="justify-content:space-between;">
          <div><strong>Xırda iş (tələb olunur, olunmur)</strong> <span class="line-long"></span></div>
        </div>
        <div class="row" style="justify-content:space-between;">
          <div><strong>Avtomobilin sınaqdan keçirilməsinin nəticəsi</strong> <span class="line-long"></span></div>
        </div>
      </div>

      <div class="section" style="margin-top:12px;">
        <div style="font-weight:bold; margin-bottom:4px;">Komisiyanın rəyi</div>
        <div style="margin-bottom:6px;">Əlava</div>
        <table>
          <colgroup>
            <col style="width:50%" />
            <col style="width:20%" />
            <col style="width:30%" />
          </colgroup>
          <thead>
            <tr>
              <th>Komisiyanın üzvləri</th>
              <th>Vəzifəsi</th>
              <th>imzası,soyadı,adı</th>
            </tr>
          </thead>
          <tbody>
            ${[1,2,3].map(() => `
              <tr><td></td><td></td><td></td></tr>
            `).join('')}
          </tbody>
        </table>
      </div>

      <div class="section" style="margin-top:16px;">
        <div style="font-weight:bold;">Avtomobili (ləri)</div>
        <div style="margin-top:6px; font-weight:bold;">Təhsil verdim</div>
        <table>
          <colgroup>
            <col style="width:50%" />
            <col style="width:20%" />
            <col style="width:30%" />
          </colgroup>
          <tbody>
            <tr>
              <td class="line-long"></td>
              <td class="line-long"></td>
              <td class="line-long"></td>
            </tr>
            <tr>
              <td style="text-align:center;">&nbsp;</td>
              <td style="text-align:center;">Vəzifəsi</td>
              <td style="text-align:center;">imzası,soyadı,adı</td>
            </tr>
          </tbody>
        </table>
        <div style="margin-top:10px; font-weight:bold;">Təhsil aldım</div>
        <table>
          <colgroup>
            <col style="width:50%" />
            <col style="width:20%" />
            <col style="width:30%" />
          </colgroup>
          <tbody>
            <tr>
              <td class="line-long"></td>
              <td class="line-long"></td>
              <td class="line-long"></td>
            </tr>
            <tr>
              <td style="text-align:center;">&nbsp;</td>
              <td style="text-align:center;">Vəzifəsi</td>
              <td style="text-align:center;">imzası,soyadı,adı</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="section bottom-grid" style="margin-top:14px;">
        <div>
          <div>
            <span class="underline" style="min-width:24mm;"></span>
            <span style="margin:0 3mm;">"</span>
            <span class="underline" style="min-width:24mm;"></span>
            <span style="margin:0 3mm;">"</span>
            20<span class="underline" style="min-width:18mm;"></span> il
          </div>
        </div>
        <div style="text-align:right; font-weight:bold;">M.Y</div>
      </div>
    ${baseClose()}`;

  const page3 = () => `${baseHead('Alqı-satqı Müqaviləsi')}
    ${baseOpen()}
      <div class="header">
        <div class="title">Nəqliyyat vasitəsinin alqı-satqı MÜQAVİLƏSİ</div>
        <div class="subtitle">${company?.name || ''}</div>
      </div>
      <div class="section">
        <div class="row"><div class="label">Qeydiyyat nişanı</div><div class="value">${form.registrationPlate || ''}</div></div>
        <div class="row"><div class="label">Ban №</div><div class="value">${form.bodyNumber || ''}</div></div>
        <div class="row"><div class="label">Mühərrik №</div><div class="value">${form.engine || ''}</div></div>
        <div class="row"><div class="label">Rəng</div><div class="value">${form.color || ''}</div></div>
        <div class="row"><div class="label">Buraxılış ili</div><div class="value">${form.manufactureYear || ''}</div></div>
      </div>
    ${baseClose()}`;

  const page4 = () => `${baseHead('Ərizə (Fiziki Şəxslər)')}
    ${baseOpen()}
      <div class="header">
        <div class="title">ƏRİZƏ</div>
        <div class="subtitle">Fiziki şəxs üçün</div>
      </div>
      <div class="section">
        <div class="section-title">Nəqliyyat vasitəsi</div>
        <table><tbody>${vehicleRows()}</tbody></table>
      </div>
    ${baseClose()}`;

  const page5 = () => `${baseHead('DYP-nin Xidmət Qeydləri')}
    ${baseOpen()}
      <div class="header">
        <div class="title">DYP-nin XİDMƏTİ QEYDLƏRİ</div>
        <div class="subtitle">${company?.name || ''}</div>
      </div>
      <div class="section">
        <div class="row"><div class="label">Qeydiyyat nişanı</div><div class="value">${form.registrationPlate || ''}</div></div>
        <div class="row"><div class="label">Şassi №</div><div class="value"></div></div>
        <div class="row"><div class="label">Ban №</div><div class="value">${form.bodyNumber || ''}</div></div>
        <div class="row"><div class="label">Rəng</div><div class="value">${form.color || ''}</div></div>
      </div>
    ${baseClose()}`;

  switch (templateKey) {
    case 'page1':
      return generatePage1HTML(form, company);
    case 'page2':
      return generatePage2HTML(form, company);
    case 'page3':
      return generatePage3HTML(form, company);
    case 'page4':
      return generatePage4HTML(form, company);
      case 'page5':
        return generatePage5HTML(form, company);
      case 'page6':
        return dypHead('Akt (Davamı)') + renderPage6Body(form, company) + dypClose();
      default:
        return generatePage1HTML(form, company);
  }
};

// Tüm DYP səhifələrini tek HTML içinde ardışık sayfalar olarak üretir
export const generateDypAllDocumentsHTML = (
  form: DypFormData,
  company: Company
): string => {
  const head = dypHead('DYP Sənədləri — Hamısı');
  const body = [
    renderPage1Body(form, company),
    renderPage2Body(form, company),
    renderPage3Body(form, company),
    renderPage4Body(form, company),
    renderPage5Body(form, company),
    renderPage6Body(form, company)
  ].join('<div class="page-break"></div>');
  return head + body + dypClose();
};

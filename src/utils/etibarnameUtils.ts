import { Customer, Company, Vehicle, Driver } from "../types";
import { printDocument, downloadPDF } from "./pdfUtils";

// Helper function to check if a value should be displayed
const shouldDisplayValue = (value: any): boolean => {
  if (value === null || value === undefined || value === "") return false;
  if (value === "-" || value === "N/A" || value === "n/a") return false;
  if (typeof value === "string" && value.trim() === "") return false;
  return true;
};

export interface EtibarnameData {
  contractId: string;
  customer: Customer;
  company: Company;
  vehicle: Vehicle;
  drivers: Driver[];
  permissionDates: {
    beginDate: string;
    endDate: string;
  };
  paymentInfo: {
    paymentDate: string;
    amount: number;
    paymentNumber: number;
  };
  excludeCustomerDetails?: boolean; // Option to exclude main customer details
  translations?: {
    address: string;
    phone: string;
    email: string;
  };
}

export const generateCompanyEtibarnameHTML = (data: EtibarnameData): string => {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const day = date.getDate().toString().padStart(2, "0");
    const month = (date.getMonth() + 1).toString().padStart(2, "0");
    const year = date.getFullYear();
    return `${day}.${month}.${year}`;
  };

  // For company etibarname, use customer's company details if available, otherwise use individual name
  // If excludeCustomerDetails is true, don't include customer information
  const customerName = data.excludeCustomerDetails
    ? null
    : data.customer.company_name ||
      `${data.customer.first_name} ${data.customer.last_name}`;
  const customerVoen = data.excludeCustomerDetails ? null : data.customer.voen;
  return `
    <!DOCTYPE html>
    <html lang="az">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Etibarnamə - ${data.contractId}</title>
      <style>
        @page {
          size: A4;
          margin: 1.5cm;
        }
        
        html, body {
          height: 100%;
          margin: 0;
          padding: 0;
        }
        
        body {
          font-family: 'Times New Roman', serif;
          font-size: 11pt;
          line-height: 1.4;
          color: #000;
          padding: 15px;
          background: white;
          font-weight: bold;
        }
        
        .document-container {
          max-width: 100%;
          margin: 0 auto;
          border: 2px solid #000;
          padding: 20px;
          padding-bottom: 100px;
          min-height: calc(100vh - 30px);
          background: white;
          box-shadow: 0 0 10px rgba(0,0,0,0.1);
          position: relative;
        }
        
        .header {
          text-align: center;
          margin-bottom: 25px;
          border-bottom: 2px solid #000;
          padding-bottom: 12px;
        }
        
        .company-name {
          font-size: 16pt;
          font-weight: bold;
          margin-bottom: 6px;
          text-transform: uppercase;
          color: #1a365d;
        }
        
        .company-type {
          font-size: 12pt;
          font-weight: bold;
          margin-bottom: 12px;
          color: #2d3748;
        }
        
        .document-title {
          font-size: 18pt;
          font-weight: bold;
          margin: 20px 0;
          text-transform: uppercase;
          text-decoration: underline;
          color: #1a365d;
        }
        
        .content {
          text-align: left;
          margin-bottom: 25px;
        }
        
        .section {
          margin-bottom: 15px;
          text-align: justify;
          line-height: 1.5;
        }
        
        .vehicle-details {
          margin: 12px 0;
          padding: 10px;
          border: 1px solid #cbd5e0;
          background-color: #f7fafc;
          border-radius: 6px;
        }
        
        .vehicle-detail-row {
          margin-bottom: 4px;
          font-weight: 500;
        }
        
        .authorized-person {
          font-weight: bold;
          margin: 12px 0;
          text-align: center;
          font-size: 12pt;
          color: #2d3748;
        }
        
        .authorization-text {
          font-size: 14pt;
          font-weight: bold;
          text-align: center;
          margin: 12px 0;
          text-decoration: underline;
          color: #1a365d;
        }
        
        .validity {
          margin: 12px 0;
          font-weight: bold;
          color: #2d3748;
        }
        
        .extra-drivers {
          margin: 12px 0;
        }
        
        .extra-drivers h3 {
          margin-bottom: 6px;
          font-size: 12pt;
          color: #1a365d;
        }
        
        .signature-section {
          margin-top: 100px;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        
        .director-info {
          text-align: left;
          flex: 0 0 auto;
        }
        
        .director-title {
          font-weight: bold;
          font-size: 11pt;
        }
        
        .director-name {
          font-weight: bold;
          margin-top: 4px;
          padding-top: 30px;
          text-wrap: nowrap;
        }
        
        .signature-box {
          text-align: center;
          width: 200px;
          min-height: 60px;
        }
        
        .footer {
          position: fixed;
          bottom: 20px;
          left: 20px;
          right: 20px;
          border-top: 1px solid #cbd5e0;
          padding-top: 12px;
          background: white;
        }
        
        .contact-info {
          text-align: center;
          font-size: 9pt;
          color: #4a5568;
        }
        
        .contact-row {
          margin-bottom: 3px;
        }
        
        .contact-label {
          font-weight: bold;
          color: #2d3748;
        }
        
        @media print {
          @page {
            size: A4;
            margin: 1.5cm;
          }
          
          body {
            margin: 0;
            padding: 0;
          }
          
          .document-container {
            border: none;
            box-shadow: none;
            min-height: 0;
            height: auto;
            position: relative;
            padding: 10mm 15mm 25mm 15mm;
            page-break-inside: avoid;
            page-break-after: avoid;
          }
          
          .content {
            height: auto;
            padding-bottom: 60px;
          }
          
          .footer {
            position: fixed;
            bottom: 0;
            left: 0;
            right: 0;
            border-top: 1px solid #cbd5e0;
            padding: 10px 15mm;
            background: white;
            page-break-inside: avoid;
          }
        }
      </style>
    </head>
    <body>
      <div class="document-container">
        <div class="header">
          <div class="company-name">"${
            data.company.name || "SİPAR LİZİNQ"
          }"</div>
          <div class="company-type">Məhdud Məsuliyyətli Cəmiyyəti</div>
          <div class="document-title">ETİBARNAMƏ</div>
        </div>

        <div class="content">
          <div class="section">
            <strong>№:1</strong> 
            </div>
          <div class="section">
            <strong>
            ${formatDate(data.permissionDates.beginDate)}
            </strong> 
            </div>
          
          <div class="section">
            ${
              data.excludeCustomerDetails
                ? `"${data.company.name || "SİPAR LİZİNQ"}" MMC-ə məxsus olan`
                : `Verilir "${customerName}"${
                    customerVoen ? ` (VÖEN ${customerVoen})` : ""
                  } ondan ötrü ki, o "${
                    data.company.name || "SİPAR LİZİNQ"
                  }" MMC-ə məxsus olan`
            }
          </div>
          
          <div class="vehicle-details">
            ${
              shouldDisplayValue(data.vehicle?.make) &&
              shouldDisplayValue(data.vehicle?.model)
                ? `<div class="vehicle-detail-row">${data.vehicle.make} ${data.vehicle.model} markalı,</div>`
                : ""
            }
            ${
              shouldDisplayValue(data.vehicle?.type) ||
              shouldDisplayValue(data.vehicle?.year) ||
              shouldDisplayValue(data.vehicle?.color)
                ? `<div class="vehicle-detail-row">${
                    data.vehicle?.type && shouldDisplayValue(data.vehicle.type)
                      ? `Tipi-${data.vehicle.type}`
                      : ""
                  }${
                    data.vehicle?.type &&
                    shouldDisplayValue(data.vehicle.type) &&
                    (shouldDisplayValue(data.vehicle?.year) ||
                      shouldDisplayValue(data.vehicle?.color))
                      ? ", "
                      : ""
                  }${
                    data.vehicle?.year && shouldDisplayValue(data.vehicle.year)
                      ? `buraxılış ili -${data.vehicle.year}`
                      : ""
                  }${
                    data.vehicle?.year &&
                    shouldDisplayValue(data.vehicle.year) &&
                    data.vehicle?.color &&
                    shouldDisplayValue(data.vehicle.color)
                      ? ", "
                      : ""
                  }${
                    data.vehicle?.color &&
                    shouldDisplayValue(data.vehicle.color)
                      ? `rəngi-${data.vehicle.color}`
                      : ""
                  },</div>`
                : ""
            }
            ${
              shouldDisplayValue(data.vehicle?.license_plate)
                ? `<div class="vehicle-detail-row">Dövlət qeydiyyat nişanı ${data.vehicle.license_plate}</div>`
                : ""
            }
            ${
              shouldDisplayValue(data.vehicle?.engine)
                ? `<div class="vehicle-detail-row">Mühərrik kodu ${data.vehicle.engine}</div>`
                : ""
            }
            ${
              shouldDisplayValue(data.vehicle?.body_number)
                ? `<div class="vehicle-detail-row">Ban nömrəsi ${data.vehicle.body_number}</div>`
                : ""
            }
            ${
              shouldDisplayValue(data.vehicle?.vin)
                ? `<div class="vehicle-detail-row">VIN nömrəsi ${data.vehicle.vin}</div>`
                : ""
            }
            ${
              shouldDisplayValue(data.vehicle?.registration_certificate_number)
                ? `<div class="vehicle-detail-row">Qeydiyyat şəhadətnaməsi nömrəsi ${data.vehicle.registration_certificate_number}</div>`
                : ""
            }
          </div>
          
          <div class="section">
            Olan nəqliyyat vasitəsini Azərbaycan Respublikası ərazisində idarə etmək üçün üçüncü tərəflərə etibarnamə vermə səlahiyyəti verilir.
          </div>
          
          <div class="section">
            Bu etibarnamə üzrə səlahiyyətlər üçüncü şəxsə verilə bilər.
          </div>
          
          <div class="validity">
            Etibarnamə ${formatDate(
              data.permissionDates.endDate
            )} 18:00 tarixinədək qüvvədədir.
          </div>
          
          <div class="signature-section">
            <div class="signature-box">
              <div class="director-name">Direktor: ${
                data.company.director || "-"
              }</div>
            </div>
            <div class="signature-box" style="border-bottom: 2px solid #000;">&nbsp;</div>
          </div>
        </div>

        <div class="footer">
          <div class="contact-info">
            ${
              shouldDisplayValue(data.company.address)
                ? `<div class="contact-row"><span class="contact-label">${
                    data.translations?.address || "Ünvan"
                  }:</span> ${data.company.address}</div>`
                : ""
            }
            ${
              shouldDisplayValue(data.company.phone_numbers)
                ? `<div class="contact-row"><span class="contact-label">${
                    data.translations?.phone || "Telefon"
                  }:</span> ${data.company.phone_numbers}</div>`
                : ""
            }
            ${
              shouldDisplayValue(data.company.email)
                ? `<div class="contact-row"><span class="contact-label">${
                    data.translations?.email || "E-poçt"
                  }:</span> ${data.company.email}</div>`
                : ""
            }
          </div>
        </div>
      </div>
    </body>
    </html>
  `;
};

export const generateEtibarnameHTML = (data: EtibarnameData): string => {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const day = date.getDate().toString().padStart(2, "0");
    const month = (date.getMonth() + 1).toString().padStart(2, "0");
    const year = date.getFullYear();
    return `${day}.${month}.${year}`;
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("az-AZ", {
      style: "currency",
      currency: "AZN",
    }).format(amount);
  };

  // If excludeCustomerDetails is true, don't include customer information
  const customerName = data.excludeCustomerDetails
    ? null
    : data.customer.customer_type === "company"
    ? data.customer.company_name
    : `${data.customer.first_name} ${data.customer.last_name}`;

  const customerInfo = data.excludeCustomerDetails
    ? null
    : data.customer.customer_type === "company"
    ? `VÖEN: ${data.customer.voen || "Məlumat yoxdur"}`
    : `Şəxsiyyət vəsiqəsi: ${data.customer.national_id || "Məlumat yoxdur"}`;

  const customerLicenseInfo = data.customer.license_number
    ? `Sürücülük vəsiqəsi: ${data.customer.license_number}${
        data.customer.license_category
          ? `, Kateqoriya: ${data.customer.license_category}`
          : ""
      }${
        data.customer.license_given_date
          ? `, Verilmə tarixi: ${formatDate(
              data.customer.license_given_date.toString()
            )}`
          : ""
      }`
    : "";

  // Generate extra drivers HTML if there are additional drivers
  const extraDriversHTML =
    data.drivers.length > 0
      ? `
    <div class="extra-drivers">
      ${data.drivers
        .map((driver) => {
          return `<div class="authorized-person">${driver.name} (sürücülük ${
            driver.licenseNumber || "məlumat yoxdur"
          }, kateqoriya ${driver.license_category || "məlumat yoxdur"}, ${
            driver.license_given_date
              ? formatDate(driver.license_given_date.toString()) +
                " tarixdə verilmişdir"
              : "tarix məlumat yoxdur"
          })</div>`;
        })
        .join("")}
    </div>
  `
      : "";

  return `
    <!DOCTYPE html>
    <html lang="az">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Etibarnamə - ${data.contractId}</title>
      <style>
        @page {
          size: A4;
          margin: 1.5cm;
        }
        
        html, body {
          height: 100%;
          margin: 0;
          padding: 0;
        }
        
        body {
          font-family: 'Times New Roman', serif;
          font-size: 11pt;
          line-height: 1.4;
          color: #000;
          padding: 15px;
          background: white;
        }
        
        .document-container {
          max-width: 100%;
          margin: 0 auto;
          border: 2px solid #000;
          padding: 20px;
          padding-bottom: 100px;
          min-height: calc(100vh - 30px);
          background: white;
          box-shadow: 0 0 10px rgba(0,0,0,0.1);
          position: relative;
        }
        
        .header {
          text-align: center;
          margin-bottom: 25px;
          border-bottom: 2px solid #000;
          padding-bottom: 12px;
        }
        
        .company-name {
          font-size: 16pt;
          font-weight: bold;
          margin-bottom: 6px;
          text-transform: uppercase;
          color: #1a365d;
        }
        
        .company-type {
          font-size: 12pt;
          font-weight: bold;
          margin-bottom: 12px;
          color: #2d3748;
        }
        
        .document-title {
          font-size: 18pt;
          font-weight: bold;
          margin: 20px 0;
          text-transform: uppercase;
          text-decoration: underline;
          color: #1a365d;
        }
        
        .content {
          text-align: left;
          margin-bottom: 25px;
        }
        
        .section {
          margin-bottom: 15px;
          text-align: justify;
          line-height: 1.5;
        }
        
        .vehicle-details {
          margin: 12px 0;
          padding: 10px;
          border: 1px solid #cbd5e0;
          background-color: #f7fafc;
          border-radius: 6px;
        }
        
        .vehicle-detail-row {
          margin-bottom: 4px;
          font-weight: 500;
        }
        
        .authorized-person {
          font-weight: bold;
          margin: 12px 0;
          text-align: center;
          font-size: 12pt;
          color: #2d3748;
        }
        
        .authorization-text {
          font-size: 14pt;
          font-weight: bold;
          text-align: center;
          margin: 12px 0;
          text-decoration: underline;
          color: #1a365d;
        }
        
        .validity {
          margin: 12px 0;
          font-weight: bold;
          color: #2d3748;
        }
        
        .extra-drivers {
          margin: 12px 0;
        }
        
        .extra-drivers h3 {
          margin-bottom: 6px;
          font-size: 12pt;
          color: #1a365d;
        }
        
        .signature-section {
          margin-top: 100px;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        
        .director-info {
          text-align: left;
          flex: 0 0 auto;
        }
        
        .director-title {
          font-weight: bold;
          font-size: 11pt;
        }
        
        .director-name {
          font-weight: bold;
          margin-top: 4px;
          padding-top: 30px;
          text-wrap: nowrap;
        }
        
        .signature-box {
          text-align: center;
          width: 200px;
          min-height: 60px;
        }
        
        .footer {
          position: fixed;
          bottom: 20px;
          left: 20px;
          right: 20px;
          border-top: 1px solid #cbd5e0;
          padding-top: 12px;
          background: white;
        }
        
        .contact-info {
          text-align: center;
          font-size: 9pt;
          color: #4a5568;
        }
        
        .contact-row {
          margin-bottom: 3px;
        }
        
        .contact-label {
          font-weight: bold;
          color: #2d3748;
        }
        
        @media print {
          @page {
            size: A4;
            margin: 1.5cm;
          }
          
          body {
            margin: 0;
            padding: 0;
          }
          
          .document-container {
            border: none;
            box-shadow: none;
            min-height: 0;
            height: auto;
            position: relative;
            padding: 10mm 15mm 25mm 15mm;
            page-break-inside: avoid;
            page-break-after: avoid;
          }
          
          .content {
            height: auto;
            padding-bottom: 60px;
          }
          
          .footer {
            position: fixed;
            bottom: 0;
            left: 0;
            right: 0;
            border-top: 1px solid #cbd5e0;
            padding: 10px 15mm;
            background: white;
            page-break-inside: avoid;
          }
        }
      </style>
    </head>
    <body>
      <div class="document-container">
        <div class="header">
          <div class="company-name">"${
            data.company.name || "STAR LİZİNQ"
          }"</div>
          <div class="company-type">Məhdud Məsuliyyətli Cəmiyyəti</div>
          <div class="document-title">ETİBARNAMƏ</div>
        </div>

        <div class="content">
          <div class="section">
            "${
              data.company.name || "Şirkət"
            }" Məhdud Məsuliyyətli Cəmiyyətinə Məxsus
          </div>
          
          <div class="vehicle-details">
            ${
              shouldDisplayValue(data.vehicle?.make) &&
              shouldDisplayValue(data.vehicle?.model)
                ? `<div class="vehicle-detail-row">${data.vehicle.make} ${
                    data.vehicle.model
                  }${
                    data.vehicle?.type && shouldDisplayValue(data.vehicle.type)
                      ? ` ${data.vehicle.type} tipi`
                      : ""
                  }${
                    data.vehicle?.year && shouldDisplayValue(data.vehicle.year)
                      ? ` ${data.vehicle.year} il`
                      : ""
                  }${
                    data.vehicle?.color &&
                    shouldDisplayValue(data.vehicle.color)
                      ? ` ${data.vehicle.color} rəngli`
                      : ""
                  },</div>`
                : ""
            }
            ${
              shouldDisplayValue(data.vehicle?.license_plate)
                ? `<div class="vehicle-detail-row">Dövlət qeydiyyat nişanı: ${data.vehicle.license_plate}</div>`
                : ""
            }
            ${
              shouldDisplayValue(data.vehicle?.engine)
                ? `<div class="vehicle-detail-row">Mühərrik kodu: ${data.vehicle.engine}</div>`
                : ""
            }
            ${
              shouldDisplayValue(data.vehicle?.body_number)
                ? `<div class="vehicle-detail-row">Ban nömrəsi: ${data.vehicle.body_number}</div>`
                : ""
            }
            ${
              shouldDisplayValue(data.vehicle?.vin)
                ? `<div class="vehicle-detail-row">VIN nömrəsi: ${data.vehicle.vin}</div>`
                : ""
            }
            ${
              shouldDisplayValue(data.vehicle?.registration_certificate_number)
                ? `<div class="vehicle-detail-row">Qeydiyyat şəhadətnaməsi nömrəsi: ${data.vehicle.registration_certificate_number}</div>`
                : ""
            }
          </div>
          
          <div class="section">
            Avtomobilin idarə etmək hüququ
          </div>
          
          <div class="section">
            Azərbaycan Respublikası Mülki Məcəlləsinin 362.5-ci maddəsinə uyğun olaraq
          </div>
          
          ${extraDriversHTML}
          
          <div class="authorization-text">
            ETİBAR EDİLMİŞDİR
          </div>
          
          <div class="section">
            Lizinq verənin razılığı olmadan bu etibarnamə üzrə səlahiyyətlər başqa şəxslərə verilə BİLƏR
          </div>
          
          <div class="validity">
            Bu etibarnamə ${formatDate(
              data.permissionDates.beginDate
            )} tarixindən ${formatDate(
    data.permissionDates.endDate
  )} 18:00 tarixinə qədər qüvvədədir.
          </div>
          
          <div class="signature-section">
            <div class="signature-box">
            <div class="director-name">Direktor: ${data.company.director}</div>
            </div>
            <div class="signature-box" style="border-bottom: 2px solid #000;">
          </div>
          </div>
        </div>

        <div class="footer">
          <div class="contact-info">
            ${
              shouldDisplayValue(data.company.address)
                ? `<div class="contact-row"><span class="contact-label">${
                    data.translations?.address || "Ünvan"
                  }:</span> ${data.company.address}</div>`
                : ""
            }
            ${
              shouldDisplayValue(data.company.phone_numbers)
                ? `<div class="contact-row"><span class="contact-label">${
                    data.translations?.phone || "Telefon"
                  }:</span> ${data.company.phone_numbers}</div>`
                : ""
            }
            ${
              shouldDisplayValue(data.company.email)
                ? `<div class="contact-row"><span class="contact-label">${
                    data.translations?.email || "E-poçt"
                  }:</span> ${data.company.email}</div>`
                : ""
            }
          </div>
        </div>
      </div>
    </body>
    </html>
  `;
};

export const printCompanyEtibarname = (data: EtibarnameData): void => {
  const htmlContent = generateCompanyEtibarnameHTML(data);
  printDocument(htmlContent, `etibarname-company-${data.contractId}`);
};

export const printEtibarname = (
  data: EtibarnameData,
  forceCompanyVersion?: boolean,
  excludeCustomerDetails?: boolean
): void => {
  // Choose between individual and company etibarname based on customer type and company details
  const shouldUseCompanyVersion =
    forceCompanyVersion ||
    data.customer.customer_type === "company" ||
    (data.customer.customer_type === "individual" &&
      data.customer.company_name &&
      data.customer.voen);

  // Add excludeCustomerDetails to the data object
  const dataWithOptions = { ...data, excludeCustomerDetails };

  const htmlContent = shouldUseCompanyVersion
    ? generateCompanyEtibarnameHTML(dataWithOptions)
    : generateEtibarnameHTML(dataWithOptions);

  printDocument(htmlContent, `etibarname-${data.contractId}`);
};

export const downloadCompanyEtibarnamePDF = (data: EtibarnameData): void => {
  const htmlContent = generateCompanyEtibarnameHTML(data);
  downloadPDF(htmlContent, `etibarname-company-${data.contractId}`);
};

export const downloadEtibarnamePDF = (
  data: EtibarnameData,
  forceCompanyVersion?: boolean,
  excludeCustomerDetails?: boolean
): void => {
  // Choose between individual and company etibarname based on customer type and company details
  const shouldUseCompanyVersion =
    forceCompanyVersion ||
    data.customer.customer_type === "company" ||
    (data.customer.customer_type === "individual" &&
      data.customer.company_name &&
      data.customer.voen);

  // Add excludeCustomerDetails to the data object
  const dataWithOptions = { ...data, excludeCustomerDetails };

  const htmlContent = shouldUseCompanyVersion
    ? generateCompanyEtibarnameHTML(dataWithOptions)
    : generateEtibarnameHTML(dataWithOptions);

  downloadPDF(
    htmlContent,
    `etibarname-${shouldUseCompanyVersion ? "company-" : ""}${data.contractId}`
  );
};

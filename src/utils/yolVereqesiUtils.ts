import { format } from 'date-fns';
import { az } from 'date-fns/locale';

export interface YolVereqesiData {
  contractId: string;
  customerName: string;
  customerType: 'individual' | 'company';
  vehicleInfo: {
    licensePlate: string;
    make: string;
    model: string;
    year: number;
    color: string;
  
  };
  drivers: Array<{
    name: string;
    licenseNumber: string;
    phone?: string;
    address?: string;
  }>;
  permissionDates: {
    beginDate: string;
    endDate: string;
  };
  paymentInfo: {
    paymentDate: string;
    amount: number;
    paymentNumber: number;
  };
  companyInfo: {
    name: string;
    voen?: string;
    director?: string;
  };
}

export function generateYolVereqesiHTML(data: YolVereqesiData): string {
  const formatDate = (dateString: string) => {
    return format(new Date(dateString), 'dd.MM.yyyy', { locale: az });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('az-AZ', {
      style: 'currency',
      currency: 'AZN'
    }).format(amount);
  };

  return `
<!DOCTYPE html>
<html lang="az">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Yol Vərəqəsi - ${data.contractId}</title>
    <style>
        body {
            font-family: 'Arial', sans-serif;
            margin: 0;
            padding: 20px;
            background-color: #f5f5f5;
        }
        .container {
            max-width: 800px;
            margin: 0 auto;
            background-color: white;
            padding: 30px;
            border-radius: 8px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        .header {
            text-align: center;
            border-bottom: 2px solid #333;
            padding-bottom: 20px;
            margin-bottom: 30px;
        }
        .title {
            font-size: 24px;
            font-weight: bold;
            color: #333;
            margin-bottom: 10px;
        }
        .subtitle {
            font-size: 16px;
            color: #666;
        }
        .section {
            margin-bottom: 25px;
        }
        .section-title {
            font-size: 18px;
            font-weight: bold;
            color: #333;
            border-bottom: 1px solid #ddd;
            padding-bottom: 5px;
            margin-bottom: 15px;
        }
        .info-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 15px;
        }
        .info-item {
            display: flex;
            flex-direction: column;
        }
        .info-label {
            font-size: 12px;
            color: #666;
            margin-bottom: 3px;
        }
        .info-value {
            font-size: 14px;
            font-weight: 500;
            color: #333;
        }
        .drivers-table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 10px;
        }
        .drivers-table th,
        .drivers-table td {
            border: 1px solid #ddd;
            padding: 8px 12px;
            text-align: left;
        }
        .drivers-table th {
            background-color: #f8f9fa;
            font-weight: bold;
            font-size: 12px;
        }
        .drivers-table td {
            font-size: 12px;
        }
        .footer {
            margin-top: 40px;
            padding-top: 20px;
            border-top: 1px solid #ddd;
            display: flex;
            justify-content: space-between;
            align-items: flex-end;
        }
        .signature-section {
            text-align: center;
        }
        .signature-line {
            width: 200px;
            border-bottom: 1px solid #333;
            margin-bottom: 5px;
        }
        .signature-label {
            font-size: 12px;
            color: #666;
        }
        .document-info {
            font-size: 10px;
            color: #999;
            text-align: right;
        }
        @media print {
            body {
                background-color: white;
                padding: 0;
            }
            .container {
                box-shadow: none;
                border-radius: 0;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="title">YOL VƏRQƏSİ</div>
            <div class="subtitle">Road Permit Document</div>
        </div>

        <div class="section">
            <div class="section-title">Müştəri Məlumatları</div>
            <div class="info-grid">
                <div class="info-item">
                    <div class="info-label">Müştəri Adı</div>
                    <div class="info-value">${data.customerName}</div>
                </div>
                <div class="info-item">
                    <div class="info-label">Müştəri Tipi</div>
                    <div class="info-value">${data.customerType === 'individual' ? 'Fərdi' : 'Şirkət'}</div>
                </div>
            </div>
        </div>

        <div class="section">
            <div class="section-title">Nəqliyyat Vasitəsi Məlumatları</div>
            <div class="info-grid">
                <div class="info-item">
                    <div class="info-label">Nömrə Plakası</div>
                    <div class="info-value">${data.vehicleInfo.licensePlate}</div>
                </div>
                <div class="info-item">
                    <div class="info-label">Marka/Model</div>
                    <div class="info-value">${data.vehicleInfo.make} ${data.vehicleInfo.model}</div>
                </div>
                <div class="info-item">
                    <div class="info-label">İl</div>
                    <div class="info-value">${data.vehicleInfo.year}</div>
                </div>
                <div class="info-item">
                    <div class="info-label">Rəng</div>
                    <div class="info-value">${data.vehicleInfo.color}</div>
                </div>
                <div class="info-item">
                    <div class="info-label">BAN</div>
                    <div class="info-value">${data.vehicleInfo.body_number || 'N/A'}</div>
                </div>
                <div class="info-item">
                    <div class="info-label">Mühərrik</div>
                    <div class="info-value">${data.vehicleInfo.engine || 'N/A'}</div>
                </div>
            </div>
        </div>

        <div class="section">
            <div class="section-title">Sürücülər</div>
            <table class="drivers-table">
                <thead>
                    <tr>
                        <th>Ad Soyad</th>
                        <th>Sürücülük Vəsiqəsi</th>
                        <th>Telefon</th>
                        <th>Ünvan</th>
                    </tr>
                </thead>
                <tbody>
                    ${data.drivers.map(driver => `
                        <tr>
                            <td>${driver.name}</td>
                            <td>${driver.licenseNumber}</td>
                            <td>${driver.phone || '-'}</td>
                            <td>${driver.address || '-'}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>

        <div class="section">
            <div class="section-title">İcazə Məlumatları</div>
            <div class="info-grid">
                <div class="info-item">
                    <div class="info-label">Başlama Tarixi</div>
                    <div class="info-value">${formatDate(data.permissionDates.beginDate)}</div>
                </div>
                <div class="info-item">
                    <div class="info-label">Bitmə Tarixi</div>
                    <div class="info-value">${formatDate(data.permissionDates.endDate)}</div>
                </div>
            </div>
        </div>

        <div class="section">
            <div class="section-title">Ödəniş Məlumatları</div>
            <div class="info-grid">
                <div class="info-item">
                    <div class="info-label">Ödəniş Tarixi</div>
                    <div class="info-value">${formatDate(data.paymentInfo.paymentDate)}</div>
                </div>
                <div class="info-item">
                    <div class="info-label">Ödəniş Məbləği</div>
                    <div class="info-value">${formatCurrency(data.paymentInfo.amount)}</div>
                </div>
                <div class="info-item">
                    <div class="info-label">Ödəniş Nömrəsi</div>
                    <div class="info-value">${data.paymentInfo.paymentNumber}</div>
                </div>
            </div>
        </div>

        <div class="footer">
            <div class="signature-section">
                <div class="signature-line"></div>
                <div class="signature-label">İmza</div>
            </div>
            <div class="document-info">
                <div>Müqavilə ID: ${data.contractId}</div>
                <div>Yaradılma: ${formatDate(new Date().toISOString())}</div>
            </div>
        </div>
    </div>
</body>
</html>
  `;
}

export function printYolVereqesi(data: YolVereqesiData): void {
  const html = generateYolVereqesiHTML(data);
  
  // Create a new window for printing
  const printWindow = window.open('', '_blank');
  if (printWindow) {
    printWindow.document.write(html);
    printWindow.document.close();
    
    // Wait for content to load, then print
    printWindow.onload = () => {
      printWindow.print();
      // Close the window after printing (optional)
      // printWindow.close();
    };
  } else {
    // Fallback: print in current window
    const printFrame = document.createElement('iframe');
    printFrame.style.display = 'none';
    document.body.appendChild(printFrame);
    
    const frameDoc = printFrame.contentDocument || printFrame.contentWindow?.document;
    if (frameDoc) {
      frameDoc.write(html);
      frameDoc.close();
      
      printFrame.onload = () => {
        printFrame.contentWindow?.print();
        document.body.removeChild(printFrame);
      };
    }
  }
}

export function downloadYolVereqesiPDF(data: YolVereqesiData): void {
  // This would require a PDF generation library like jsPDF or html2pdf
  // For now, we'll create a downloadable HTML file
  const html = generateYolVereqesiHTML(data);
  const blob = new Blob([html], { type: 'text/html' });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.href = url;
  link.download = `yol-vereqesi-${data.contractId}-${format(new Date(), 'yyyy-MM-dd')}.html`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}


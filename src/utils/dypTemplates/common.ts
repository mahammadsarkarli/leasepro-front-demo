import { Company } from '../../types';
import { DypFormData } from '../dypTypes';

export const getHead = (title: string) => `
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
      .title { font-size: 20px; font-weight: bold; }
      .section { margin: 10px 0; }
      table { width: 100%; border-collapse: collapse; font-size: 10.5px; table-layout: fixed; }
      th, td { border: 1px solid #000; padding: 5px; text-align: center; vertical-align: middle; }
      thead th { font-weight: bold; }
      .print-btn { position: fixed; top: 16px; right: 16px; background:#2563eb; color:#fff; border:0; padding:8px 12px; border-radius:6px; }
      .footer { margin-top: 14px; display: flex; justify-content: space-between; }
      .topbar { display:flex; justify-content:space-between; align-items:flex-start; margin-bottom: 6mm; }
      .underline { display:inline-block; min-width: 26mm; border-bottom: 1px solid #000; height: 0; }
      .line-long { flex: 1; border-bottom: 1px solid #000; height: 0; }
      .page-break { page-break-after: always; }
    </style>
  </head>
  <body>
    <button class="print-btn no-print" onclick="window.print()">Çap Et</button>
`;

export const getClose = () => `
  </body>
  </html>
`;

export const vehicleRows = (form: DypFormData) => `
  <tr><th>Nəqliyyat vasitəsinin tipi</th><td></td><th>Banın tipi</th><td></td><th>Buraxılış ili</th><td>${form.manufactureYear || ''}</td></tr>
  <tr><th>İstehsalçı zavod</th><td></td><th>Maks kütlə (yük avt)</th><td></td><th>Yüksüz kütlə (yük avt)</th><td></td></tr>
  <tr><th>Qeydiyyat şəhadətnaməsi</th><td></td><th>Markası modeli</th><td></td><th>Banın №-si</th><td>${form.bodyNumber || ''}</td></tr>
  <tr><th>Mühərrik №-si</th><td>${form.engine || ''}</td><th>Şassi №-si</th><td></td><th>Rəngi</th><td>${form.color || ''}</td></tr>
  <tr><th>Dövlət qeydiyyat nişanı</th><td>${form.registrationPlate || ''}</td><th>Tranzit №-si</th><td></td><th></th><td></td></tr>
`;

export const footer = (company: Company) => `
  <div class="footer"><div>${company?.address || ''}</div><div>${company?.voen ? 'VÖEN: ' + company.voen : ''}</div></div>
`;



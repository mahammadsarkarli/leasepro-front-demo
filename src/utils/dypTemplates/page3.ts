import { Company } from '../../types';
import { DypFormData } from '../dypTypes';
import { getHead, getClose } from './common';

export const renderPage3Body = (form: DypFormData, company: Company): string => `
  <div class="doc">
    <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 6px; font-size: 9px;">
      <div>
        <div style="margin-bottom: 4px;">Hüquqi şəxslər üçün</div>
        <div>Dövlət Yol Polisi<span style="display:inline-block; min-width: 70mm; border-bottom:1px solid #000; margin-left: 6px;"></span></div>
      </div>
      <div style="text-align: right; font-size: 8px;">
        <div>Azərbaycan Respublikası DİN-ni</div>
        <div>1999-cu il "14"</div>
        <div>190 Nömrəli əmri,</div>
        <div>edilmiş Təlimata 1 nömrəli əl</div>
        <div style="margin-top: 4px; border-bottom: 1px solid #000; min-width: 45mm; text-align: right; padding-right: 2px;">qeydiyyat manta</div>
        <div style="margin-top: 2px; text-align: right; padding-right: 15px;">tara</div>
      </div>
    </div>

    <div style="text-align: center; font-size: 18px; font-weight: bold; margin: 8px 0;">ƏRİZƏ</div>

    <div class="section" style="font-size: 9px; margin-top: 6px;">
      <div style="margin-bottom: 4px;">(hüquqi şəxsin adı)</div>
      <div style="margin-bottom: 4px;"><strong>Hüquqi şəxsin ünvanı</strong><span style="display:inline-block; min-width: 85mm; border-bottom:1px solid #000; margin-left: 6px;"></span></div>
      <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
        <div><strong>Rayon</strong><span style="display:inline-block; min-width: 50mm; border-bottom:1px solid #000; margin-left: 6px;"></span></div>
        <div style="text-align: right;"><strong>telefon No-si</strong><span style="display:inline-block; min-width: 40mm; border-bottom:1px solid #000; margin-left: 6px;"></span></div>
      </div>
      <div style="margin-bottom: 4px;"><strong>Nəqliyyat vasitəsinin dayanacağının (qarajın)ünvanı</strong><span style="display:inline-block; min-width: 60mm; border-bottom:1px solid #000; margin-left: 6px;"></span></div>
      <div style="display: flex; justify-content: space-between; margin-bottom: 6px;">
        <div><strong>Rayon</strong><span style="display:inline-block; min-width: 50mm; border-bottom:1px solid #000; margin-left: 6px;"></span></div>
        <div style="text-align: right;"><strong>telefon No-si</strong><span style="display:inline-block; min-width: 40mm; border-bottom:1px solid #000; margin-left: 6px;"></span></div>
      </div>
      <div style="margin-bottom: 4px;"><strong>Xahiş olunur</strong><span style="display:inline-block; min-width: 95mm; border-bottom:1px solid #000; margin-left: 6px;"></span></div>
      <div style="border-bottom: 1px solid #000; min-height: 25px; margin-bottom: 2px;"></div>
      <div style="text-align: center; font-size: 8px; color: #666;">(İşin mahiyyəti izah edilir)</div>
    </div>

    <div class="section" style="font-size: 9px; margin-top: 6px;">
      <div style="margin-bottom: 6px;"><strong>Göstərilən sənədlər ərizəyə əlavə edilir:</strong></div>
      ${[1, 2, 3].map((num) => `
      <div style="margin-bottom: 4px;">${num}.<span style="display:inline-block; min-width: 100mm; border-bottom:1px solid #000; margin-left: 6px;"></span></div>
      `).join('')}
    </div>

    <div class="section" style="margin-top: 6px;">
      <table style="border-collapse: collapse; width: 100%; font-size: 9px; border: 1px solid #000;">
        <thead>
          <tr>
            <th colspan="2" style="border: 1px solid #000; padding: 3px; text-align: center; font-weight: bold; font-size: 10px;">Nəqliyyat vasitəsi barədə məlumat</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td style="border: 1px solid #000; padding: 2px 4px; width: 50%;">1.Nəqliyyat vasitəsinin tipi</td>
            <td style="border: 1px solid #000; padding: 2px 4px;"></td>
          </tr>
          <tr>
            <td style="border: 1px solid #000; padding: 2px 4px;">Markası, modeli</td>
            <td style="border: 1px solid #000; padding: 2px 4px;"></td>
          </tr>
          <tr>
            <td style="border: 1px solid #000; padding: 2px 4px;">Banın tipi</td>
            <td style="border: 1px solid #000; padding: 2px 4px;"></td>
          </tr>
          <tr>
            <td style="border: 1px solid #000; padding: 2px 4px;">İstehsalçı zavod</td>
            <td style="border: 1px solid #000; padding: 2px 4px;"></td>
          </tr>
          <tr>
            <td style="border: 1px solid #000; padding: 2px 4px;">Buraxılış ili</td>
            <td style="border: 1px solid #000; padding: 2px 4px;">${form.manufactureYear || ''}</td>
          </tr>
          <tr>
            <td style="border: 1px solid #000; padding: 2px 4px;">Mühərrik No-si</td>
            <td style="border: 1px solid #000; padding: 2px 4px;">${form.engine || ''}</td>
          </tr>
          <tr>
            <td style="border: 1px solid #000; padding: 2px 4px;">Ban No-si</td>
            <td style="border: 1px solid #000; padding: 2px 4px;">${form.bodyNumber || ''}</td>
          </tr>
          <tr>
            <td style="border: 1px solid #000; padding: 2px 4px;">Şassi No-si</td>
            <td style="border: 1px solid #000; padding: 2px 4px;"></td>
          </tr>
          <tr>
            <td style="border: 1px solid #000; padding: 2px 4px; line-height: 1.2;">Maksimum kütləsi<br/><span style="font-size: 8px;">(Yük avtomobilləri üçün)</span></td>
            <td style="border: 1px solid #000; padding: 2px 4px;"></td>
          </tr>
          <tr>
            <td style="border: 1px solid #000; padding: 2px 4px;">Rəngi</td>
            <td style="border: 1px solid #000; padding: 2px 4px;">${form.color || ''}</td>
          </tr>
          <tr>
            <td style="border: 1px solid #000; padding: 2px 4px; line-height: 1.2;">Yüksüz kütləsi<br/><span style="font-size: 8px;">(Yük avtomobilləri üçün)</span></td>
            <td style="border: 1px solid #000; padding: 2px 4px;"></td>
          </tr>
          <tr>
            <td style="border: 1px solid #000; padding: 2px 4px;">Dövlət q.n</td>
            <td style="border: 1px solid #000; padding: 2px 4px;">${form.registrationPlate || ''}</td>
          </tr>
          <tr>
            <td style="border: 1px solid #000; padding: 2px 4px;">Qeydiyyat şəhadətnaməsi</td>
            <td style="border: 1px solid #000; padding: 2px 4px;"></td>
          </tr>
          <tr>
            <td style="border: 1px solid #000; padding: 2px 4px;">Tranzit No-si</td>
            <td style="border: 1px solid #000; padding: 2px 4px;"></td>
          </tr>
        </tbody>
      </table>
    </div>

    <div class="section" style="font-size: 9px; margin-top: 6px;">
      <div style="margin-bottom: 4px;"><strong>Nəqliyyat vasitəsinin sənədləşdirilməsi Dövlət Yol Polisində etibar edilir</strong><span style="display:inline-block; min-width: 40mm; border-bottom:1px solid #000; margin-left: 6px;"></span></div>
    </div>

    <div class="section" style="font-size: 9px; margin-top: 6px;">
      <div style="margin-bottom: 4px;">(soyadyadı,atasınınadı)</div>
      <div style="margin-bottom: 4px;"><strong>Şəxsi imzası təstiq edilir</strong></div>
      <div style="display: flex; justify-content: space-between; margin-top: 8px;">
        <div><strong>Rəhbərin imzası</strong><span style="display:inline-block; min-width: 50mm; border-bottom:1px solid #000; margin-left: 6px;"></span></div>
        <div><strong>Baş mühasibin imzası</strong><span style="display:inline-block; min-width: 45mm; border-bottom:1px solid #000; margin-left: 6px;"></span></div>
        <div style="font-weight: bold;">M.Y</div>
      </div>
    </div>

    <div class="section" style="margin-top: 8px; border-top: 2px solid #000; padding-top: 6px;">
      <div style="font-weight: bold; font-size: 10px; margin-bottom: 4px;">DYP-nin XİDMƏTİ QEYDLƏRİ</div>
      <div style="font-size: 9px; margin-bottom: 6px;">(DYP əməkdaşın rəyi)</div>
      <div style="display: flex; justify-content: space-between; margin-bottom: 4px; font-size: 9px;">
        <div>* Verilib (alınıb): <span style="display:inline-block; min-width: 18mm; border-bottom:1px solid #000;"></span> 20<span style="display:inline-block; min-width: 12mm; border-bottom:1px solid #000;"></span> il</div>
        <div><strong>İmza</strong><span style="display:inline-block; min-width: 35mm; border-bottom:1px solid #000; margin-left: 6px;"></span></div>
      </div>
      <div style="margin-bottom: 4px; font-size: 9px;"><strong>Dövlət qeydiyyat nişanları və ya tranzit nömrəsi seriya</strong><span style="display:inline-block; min-width: 25mm; border-bottom:1px solid #000; margin-left: 6px;"></span> <strong>№</strong><span style="display:inline-block; min-width: 20mm; border-bottom:1px solid #000; margin-left: 6px;"></span></div>
      <div style="margin-bottom: 4px; font-size: 9px;"><strong>Qeydiyyat şəhadətnaməsi seriya</strong><span style="display:inline-block; min-width: 45mm; border-bottom:1px solid #000; margin-left: 6px;"></span> <strong>№</strong><span style="display:inline-block; min-width: 20mm; border-bottom:1px solid #000; margin-left: 6px;"></span></div>
      <div style="font-size: 9px;"><strong>Dövlət avtomobil müfəttişi (pasportçu)</strong><span style="display:inline-block; min-width: 50mm; border-bottom:1px solid #000; margin-left: 6px;"></span></div>
    </div>
  </div>
`;

export const generatePage3HTML = (form: DypFormData, company: Company): string =>
  getHead('Ərizə (Hüquqi Şəxslər)') + renderPage3Body(form, company) + getClose();



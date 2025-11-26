import { Company } from '../../types';
import { DypFormData } from '../dypTypes';
import { getHead, getClose } from './common';

export const renderPage5Body = (form: DypFormData, company: Company): string => `
  <div class="doc">
    <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 6px; font-size: 9px;">
      <div>
        <div style="font-weight: bold; margin-bottom: 4px;">Fiziki şəxslər üçün</div>
        <div style="font-weight: bold; margin-bottom: 4px;">Dövlət Yol Polisinin</div>
        <div style="font-weight: bold;"><strong>Fiziki şəxs</strong><span style="display:inline-block; min-width: 70mm; border-bottom:1px solid #000; margin-left: 6px;"></span></div>
      </div>
      <div style="text-align: right; font-size: 8px;">
        <div>Azərbaycan Respublikasının DİN-nin</div>
        <div>1999-cu il "34"yuntariki</div>
        <div>190 nömrəli əmri ilə təstiq</div>
        <div>edilmiş Təlimata 3 nömrəli əlavə</div>
        <div style="margin-top: 4px; border-bottom: 1px solid #000; min-width: 50mm; text-align: right; padding-right: 2px;">qeydiyyat məntəqəsinə</div>
        <div style="margin-top: 2px; text-align: right; padding-right: 15px;">tərəf<span style="display:inline-block; min-width: 20mm; border-bottom:1px solid #000; margin-left: 4px;"></span></div>
      </div>
    </div>

    <div style="font-size: 9px; margin-bottom: 8px;">
      <div style="border-bottom: 1px solid #000; min-height: 18px; margin-bottom: 6px;"></div>
      <div style="font-size: 8px; color: #666; margin-bottom: 4px;">(soyadı, adı, atasının adı)</div>
      <div style="margin-bottom: 4px;"><strong>Anadan olduğum gün,ay,il</strong><span style="display:inline-block; min-width: 80mm; border-bottom:1px solid #000; margin-left: 6px;"></span></div>
      <div style="margin-bottom: 4px;"><strong>Yaşayıram</strong><span style="display:inline-block; min-width: 20mm; border-bottom:1px solid #000; margin-left: 6px;"></span> <strong>şəhəri,</strong><span style="display:inline-block; min-width: 25mm; border-bottom:1px solid #000; margin-left: 6px;"></span> <strong>rayonu,</strong><span style="display:inline-block; min-width: 25mm; border-bottom:1px solid #000; margin-left: 6px;"></span> <strong>qəsəbəsi,</strong><span style="display:inline-block; min-width: 22mm; border-bottom:1px solid #000; margin-left: 6px;"></span></div>
      <div style="margin-bottom: 4px;"><strong>mikrorayon,</strong><span style="display:inline-block; min-width: 25mm; border-bottom:1px solid #000; margin-left: 6px;"></span> <strong>küçəsi</strong><span style="display:inline-block; min-width: 25mm; border-bottom:1px solid #000; margin-left: 6px;"></span> <strong>No-li korpus,</strong><span style="display:inline-block; min-width: 22mm; border-bottom:1px solid #000; margin-left: 6px;"></span> <strong>No-li bina</strong><span style="display:inline-block; min-width: 22mm; border-bottom:1px solid #000; margin-left: 6px;"></span> <strong>No-li mənzil</strong><span style="display:inline-block; min-width: 20mm; border-bottom:1px solid #000; margin-left: 6px;"></span></div>
      <div style="margin-bottom: 4px;"><strong>Şəxsiyyət vəsiqəsinin seriyası</strong> <strong>Nəsi</strong><span style="display:inline-block; min-width: 15mm; border-bottom:1px solid #000; margin-left: 6px;"></span> <strong>verilib</strong><span style="display:inline-block; min-width: 50mm; border-bottom:1px solid #000; margin-left: 6px;"></span></div>
      <div style="border-bottom: 1px solid #000; min-height: 18px; margin-bottom: 4px;"></div>
      <div style="font-size: 8px; color: #666; margin-bottom: 4px;">(orqanın adı, verilmə tarixi)</div>
      <div style="margin-bottom: 4px;"><strong>İş yerim</strong><span style="display:inline-block; min-width: 90mm; border-bottom:1px solid #000; margin-left: 6px;"></span></div>
      <div style="margin-bottom: 4px;"><strong>Vəzifəm</strong><span style="display:inline-block; min-width: 95mm; border-bottom:1px solid #000; margin-left: 6px;"></span></div>
      <div style="margin-bottom: 6px;"><strong>Ev telefonum</strong><span style="display:inline-block; min-width: 45mm; border-bottom:1px solid #000; margin-left: 6px;"></span> <strong>iş telefonum</strong><span style="display:inline-block; min-width: 45mm; border-bottom:1px solid #000; margin-left: 6px;"></span></div>
    </div>

    <div style="text-align: center; font-size: 18px; font-weight: bold; margin: 8px 0;">ƏRİZƏ</div>

    <div style="font-size: 9px; margin-bottom: 8px;">
      <div style="margin-bottom: 6px;"><strong>Xahiş edirəm mənə məxsus olan nəqliyyat vasitəsini:</strong></div>
      <div style="margin-bottom: 4px;"><strong>Markası</strong><span style="display:inline-block; min-width: 70mm; border-bottom:1px solid #000; margin-left: 6px;"></span></div>
      <div style="margin-bottom: 4px;"><strong>Dövlət qeydiyyat nişanı</strong><span style="display:inline-block; min-width: 60mm; ${!form.registrationPlate ? 'border-bottom:1px solid #000;' : ''} margin-left: 6px;">${form.registrationPlate || ''}</span> <strong>qeydiyyat şəhadətnaməsi</strong><span style="display:inline-block; min-width: 30mm; border-bottom:1px solid #000; margin-left: 6px;"></span></div>
      <div style="margin-bottom: 4px;"><strong>Nəqliyyat vasitəsinin tipi</strong><span style="display:inline-block; min-width: 70mm; border-bottom:1px solid #000; margin-left: 6px;"></span></div>
      <div style="margin-bottom: 4px;"><strong>Banın tipi</strong><span style="display:inline-block; min-width: 80mm; border-bottom:1px solid #000; margin-left: 6px;"></span></div>
      <div style="margin-bottom: 4px;"><strong>Mühərrik No-si</strong><span style="display:inline-block; min-width: 60mm; ${!form.engine ? 'border-bottom:1px solid #000;' : ''} margin-left: 6px;">${form.engine || ''}</span></div>
      <div style="margin-bottom: 4px;"><strong>Şassi Nosi</strong><span style="display:inline-block; min-width: 70mm; border-bottom:1px solid #000; margin-left: 6px;"></span></div>
      <div style="margin-bottom: 4px;"><strong>Ban Nosi</strong><span style="display:inline-block; min-width: 70mm; ${!form.bodyNumber ? 'border-bottom:1px solid #000;' : ''} margin-left: 6px;">${form.bodyNumber || ''}</span></div>
      <div style="margin-bottom: 4px;"><strong>Buraxılış ili</strong><span style="display:inline-block; min-width: 70mm; ${!form.manufactureYear ? 'border-bottom:1px solid #000;' : ''} margin-left: 6px;">${form.manufactureYear || ''}</span></div>
      <div style="margin-bottom: 6px;"><strong>Rəngi</strong><span style="display:inline-block; min-width: 80mm; ${!form.color ? 'border-bottom:1px solid #000;' : ''} margin-left: 6px;">${form.color || ''}</span></div>
      
      <div style="margin-bottom: 6px;">
        <div style="margin-bottom: 4px;"><strong>1. Çıxdaş edilməklə</strong></div>
        <div style="margin-bottom: 4px;"><strong>2. Komisyon mağaza vasitəsi ilə satılmaqla</strong></div>
        <div style="margin-bottom: 4px;"><strong>3. Yaşayış yeri bu ümənə dəyişilməklə</strong></div>
        <div style="margin-bottom: 4px;"><strong>4. Qəbul məntəqəsinə təhvil verilməklə</strong></div>
        <div style="margin-bottom: 4px;"><strong>5. Mülkiyyətçini dəyişməklə, bu şəxsə təhvil verməklə</strong></div>
        <div style="border-bottom: 1px solid #000; min-height: 18px; margin-top: 4px; margin-bottom: 4px;"></div>
        <div style="font-size: 8px; color: #666; margin-bottom: 4px;">(soyadı, adı, atasının adı)</div>
        <div style="margin-bottom: 4px;"><strong>Verilib:</strong><span style="display:inline-block; min-width: 20mm; border-bottom:1px solid #000; margin-left: 6px;"></span> <strong>şəxsiyyət vəsiqəsi seriyası</strong> <strong>No</strong><span style="display:inline-block; min-width: 15mm; border-bottom:1px solid #000; margin-left: 6px;"></span></div>
        <div style="margin-bottom: 4px;"><strong>əlaqədar qeydiyyatdan çıxarasınız.</strong></div>
        <div style="border-bottom: 1px solid #000; min-height: 18px; margin-bottom: 4px;"></div>
        <div style="font-size: 8px; color: #666; margin-bottom: 4px;">(orqanın adı, verilmə tarixi)</div>
        <div style="margin-bottom: 6px;"><strong>İmza</strong><span style="display:inline-block; min-width: 80mm; border-bottom:1px solid #000; margin-left: 6px;"></span></div>
      </div>
      
      <div style="margin-bottom: 6px;">
        <div style="margin-bottom: 4px;"><strong>Qeydiyyat hərəkətləri sahibin nümayəndəsi tərəfindən aparılır:</strong></div>
        <div style="border-bottom: 1px solid #000; min-height: 18px; margin-bottom: 4px;"></div>
        <div style="font-size: 8px; color: #666; margin-bottom: 4px;">(soyadı, adı, atasının adı)</div>
        <div style="margin-bottom: 4px;"><strong>Şəxsiyyət vəsiqəsi</strong><span style="display:inline-block; min-width: 50mm; border-bottom:1px solid #000; margin-left: 6px;"></span> <strong>Telefon</strong><span style="display:inline-block; min-width: 55mm; border-bottom:1px solid #000; margin-left: 6px;"></span></div>
        <div style="margin-bottom: 6px;"><strong>Ümanı</strong><span style="display:inline-block; min-width: 90mm; border-bottom:1px solid #000; margin-left: 6px;"></span></div>
      </div>
      
      <div style="margin-bottom: 6px;">
        <div style="font-weight: bold; margin-bottom: 4px;">Vəkalətnamə</div>
        <div style="border-bottom: 1px solid #000; min-height: 18px; margin-bottom: 4px;"></div>
        <div style="font-size: 8px; color: #666; margin-bottom: 4px;">(nə vaxt kim tərəfindən verilib, qeydiyyat №-si və tarixi)</div>
        <div style="margin-bottom: 6px;"><strong>Şəxsi imza</strong><span style="display:inline-block; min-width: 90mm; border-bottom:1px solid #000; margin-left: 6px;"></span></div>
      </div>
    </div>

    <div class="section" style="margin-top: 8px; border-top: 2px solid #000; padding-top: 6px;">
      <div style="font-weight: bold; font-size: 10px; margin-bottom: 4px;">DYP-nin XİDMƏTİ QEYDLƏRİ</div>
      <div style="font-size: 9px; margin-bottom: 4px;">
        <div style="margin-bottom: 4px;"><strong>Nəqliyyat vasitəsinin mühərrikinin,şassinin, banın nömrələr, rəngi və digər göstəriciləri bu</strong></div>
        <div style="margin-bottom: 4px;"><strong>Ərizədə göstərilənlərə uyğun gəlir</strong><span style="display:inline-block; min-width: 50mm; border-bottom:1px solid #000; margin-left: 6px;"></span></div>
        <div style="margin-bottom: 4px;"><strong>Texniki vəziyyəti</strong><span style="display:inline-block; min-width: 80mm; border-bottom:1px solid #000; margin-left: 6px;"></span></div>
        <div style="margin-bottom: 4px;"><strong>Dövlət avtomobil müfəttişi</strong><span style="display:inline-block; min-width: 65mm; border-bottom:1px solid #000; margin-left: 6px;"></span></div>
        <div style="margin-bottom: 4px;"><strong>İmza</strong><span style="display:inline-block; min-width: 85mm; border-bottom:1px solid #000; margin-left: 6px;"></span></div>
        <div style="margin-bottom: 4px;"><strong>Dövlət qeydiyyat nişanları təhvil alındı</strong><span style="display:inline-block; min-width: 50mm; border-bottom:1px solid #000; margin-left: 6px;"></span></div>
        <div style="margin-bottom: 4px;"><strong>Verilib</strong><span style="display:inline-block; min-width: 20mm; border-bottom:1px solid #000; margin-left: 6px;"></span> <strong>tranzit nişanları</strong><span style="display:inline-block; min-width: 60mm; border-bottom:1px solid #000; margin-left: 6px;"></span></div>
        <div style="margin-bottom: 4px;"><strong>Dövlət avtomobil müfəttişi (pasportçu)</strong><span style="display:inline-block; min-width: 50mm; border-bottom:1px solid #000; margin-left: 6px;"></span></div>
        <div style="margin-bottom: 0;"><strong>İmza</strong><span style="display:inline-block; min-width: 85mm; border-bottom:1px solid #000; margin-left: 6px;"></span></div>
      </div>
    </div>
  </div>
`;

export const generatePage5HTML = (form: DypFormData, company: Company): string =>
  getHead('Ərizə (Fiziki şəxs üçün)') + renderPage5Body(form, company) + getClose();



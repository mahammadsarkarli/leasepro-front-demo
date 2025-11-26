import { DypFormData, Company } from '../../types';

export const renderPage6Body = (form: DypFormData, company: Company): string => {
  const companyName = company.name || '';
  const directorName = company.director_name || '';
  const companyAddress = company.address || '';
  
  // Satıcı məlumatları - form'dan gələcək, yoxdursa boş
  const sellerName = form.sellerName || '';
  const sellerAddress = form.sellerAddress || '';
  
  // Avtomobil məlumatları
  const vehicleMake = form.vehicleMake || '';
  const registrationPlate = form.registrationPlate || '';
  const manufactureYear = form.manufactureYear || '';
  const engine = form.engine || '';
  const bodyNumber = form.bodyNumber || '';
  
  // Qiymət
  const price = form.price || 0;
  
  return `
    <div class="doc">
      <div style="text-align: right; font-size: 8px; margin-bottom: 8px;">
        <div>Azərbaycan Respublikası Nazirlər</div>
        <div>Kabinetinin 1999 il 15 mart</div>
        <div>tarixli 39 nömrəli qərarı ilə</div>
        <div>təstiq edilmiş Əsasnaməyə</div>
        <div style="margin-top: 4px;">1 nömrəli əlavə</div>
      </div>

      <div style="text-align: center; margin: 12px 0;">
        <div style="font-size: 16px; font-weight: bold; margin-bottom: 4px;">Nəqliyyat vasitəsinin alqı-satqı</div>
        <div style="font-size: 20px; font-weight: bold;">MÜQAVİLƏSİ</div>
      </div>

      <div style="display: flex; justify-content: space-between; font-size: 9px; margin-bottom: 10px;">
        <div><strong>BAKI Şəhəri</strong></div>
        <div>*<span style="display:inline-block; min-width: 8mm; border-bottom:1px solid #000;"></span> *<span style="display:inline-block; min-width: 8mm; border-bottom:1px solid #000;"></span> 20<span style="display:inline-block; min-width: 8mm; border-bottom:1px solid #000;"></span> il</div>
      </div>

      <div style="font-size: 9px; margin-bottom: 8px;">
        <div style="display: flex; margin-bottom: 6px;">
          <div style="min-width: 60px;"><strong>Biz satıcı</strong></div>
          <div style="flex: 1; border-bottom: 1px solid #000; min-height: 16px;">${sellerName || ''}</div>
        </div>
        <div style="padding-left: 60px; margin-bottom: 4px; font-size: 8px; color: #666;">(fiziki şəxs,şəxsiyyət vəsiqəsinin seriya və №-si,nə vaxt kim tərəfindən verilib,ünvan)</div>
        <div style="display: flex; margin-bottom: 4px;">
          <div style="flex: 1; border-bottom: 1px solid #000; min-height: 16px;">${sellerAddress || ''}</div>
        </div>
        <div style="padding-left: 60px; margin-bottom: 4px; font-size: 8px; color: #666;">(Hüquqi şəxs,vəkil edilmiş şəxs,şəxsiyyət vəsiqəsinin seriya və №-si)</div>
        <div style="display: flex; margin-bottom: 8px;">
          <div style="flex: 1; border-bottom: 1px solid #000; min-height: 16px;"></div>
        </div>
        <div style="padding-left: 60px; margin-bottom: 4px; font-size: 8px; color: #666;">(Nə vaxt və kim tərəfindən verilib,yerləşdiyi ünvan)</div>
      </div>

      <div style="font-size: 9px; margin-bottom: 8px;">
        <div style="display: flex; margin-bottom: 6px;">
          <div style="min-width: 60px;"><strong>VƏ "Alıcı"</strong></div>
          <div style="flex: 1; border-bottom: 1px solid #000; min-height: 16px;">"<strong>${companyName}</strong>" MMC</div>
        </div>
        <div style="padding-left: 60px; margin-bottom: 4px; font-size: 8px; color: #666;">(fiziki şəxs,şəxsiyyət vəsiqəsinin seriya və №-si,nə vaxt və kim tərəfindən verilib,yaşadığı ünvan)</div>
        <div style="display: flex; margin-bottom: 4px;">
          <div style="flex: 1; border-bottom: 1px solid #000; min-height: 16px;">${companyAddress || ''}</div>
        </div>
        <div style="padding-left: 60px; margin-bottom: 4px; font-size: 8px; color: #666;">(Hüquqi şəxs,vəkil edilmiş şəxs,şəxsiyyət vəsiqəsinin seriya və nömrəsi)</div>
        <div style="display: flex; margin-bottom: 8px;">
          <div style="flex: 1; border-bottom: 1px solid #000; min-height: 16px;"></div>
        </div>
        <div style="padding-left: 60px; margin-bottom: 4px; font-size: 8px; color: #666;">(Nə vaxt və kim tərəfindən verilib)</div>
      </div>

      <div style="font-size: 9px; margin-bottom: 8px;">
        <div style="margin-bottom: 6px;"><strong>Aşağıda göstərilən müqaviləni bağladıq:</strong></div>
        
        <div style="margin-bottom: 6px;"><strong>1.Satıcı özünə məxsus olan nəqliyyat vasitəsini satır:</strong></div>
        <div style="margin-bottom: 4px;"><strong>Markası</strong><span style="display:inline-block; min-width: 70mm; ${!vehicleMake ? 'border-bottom:1px solid #000;' : ''} margin-left: 6px;">${vehicleMake || ''}</span></div>
        <div style="margin-bottom: 4px;"><strong>Dövlət qeydiyyat nişan</strong><span style="display:inline-block; min-width: 65mm; ${!registrationPlate ? 'border-bottom:1px solid #000;' : ''} margin-left: 6px;">${registrationPlate || ''}</span> <strong>buraxılış ili</strong><span style="display:inline-block; min-width: 25mm; ${!manufactureYear ? 'border-bottom:1px solid #000;' : ''} margin-left: 6px;">${manufactureYear || ''}</span></div>
        <div style="margin-bottom: 4px;"><strong>Mühərrik</strong><span style="display:inline-block; min-width: 60mm; ${!engine ? 'border-bottom:1px solid #000;' : ''} margin-left: 6px;">${engine || ''}</span> <strong>Şassi№-si</strong><span style="display:inline-block; min-width: 55mm; border-bottom:1px solid #000; margin-left: 6px;"></span></div>
        <div style="margin-bottom: 4px;">*<span style="display:inline-block; min-width: 8mm; border-bottom:1px solid #000;"></span> *<span style="display:inline-block; min-width: 8mm; border-bottom:1px solid #000;"></span> 20<span style="display:inline-block; min-width: 8mm; border-bottom:1px solid #000;"></span><strong>ildə</strong> <strong>DYP tərəfindən verilmiş</strong><span style="display:inline-block; min-width: 50mm; border-bottom:1px solid #000; margin-left: 6px;"></span></div>
        <div style="padding-left: 20px; margin-bottom: 4px; font-size: 8px; color: #666;">(Qeydiyyat məntəqəsinin adı)</div>
        <div style="margin-bottom: 4px;"><strong>Seriyalı</strong><span style="display:inline-block; min-width: 15mm; border-bottom:1px solid #000; margin-left: 6px;"></span> <strong>№-li qeydiyyat şəhadətnaməsi</strong><span style="display:inline-block; min-width: 45mm; border-bottom:1px solid #000; margin-left: 6px;"></span></div>
        
        <div style="margin-bottom: 6px; margin-top: 8px;"><strong>2. Nəqliyyat vasitəsi</strong><span style="display:inline-block; min-width: 30mm; border-bottom:1px solid #000; margin-left: 6px;"></span> <strong>manata satılıb və bu məbləği "satıcı""alıcı"dan alıb.</strong></div>
        
        <div style="margin-bottom: 6px; margin-top: 8px;"><strong>3. Bu müqavilənin bir nüsxəsi</strong><span style="display:inline-block; min-width: 35mm; border-bottom:1px solid #000; margin-left: 6px;"></span> <strong>DYP-də saxlanılır və hərəsindən bir nüsxə də</strong></div>
        <div style="padding-left: 20px; margin-bottom: 4px; font-size: 8px; color: #666;">(Qeydiyyat məntəqəsinin adı)</div>
        <div style="margin-bottom: 6px;"><strong>"Satıcı" və "Alıcı"-nın istəyindən asılı olaraq onlarda qalır.</strong><span style="display:inline-block; min-width: 50mm; border-bottom:1px solid #000; margin-left: 6px;"></span></div>
        
        <div style="display: flex; justify-content: space-between; margin-top: 8px; margin-bottom: 6px;">
          <div style="flex: 1; margin-right: 20px;">
            <div style="border-bottom: 1px solid #000; min-height: 20px; margin-bottom: 2px;"></div>
            <div style="font-size: 8px; color: #666;">("Satıcı"-nın s.a.a. imzası)</div>
          </div>
          <div style="flex: 1;">
            <div style="border-bottom: 1px solid #000; min-height: 20px; margin-bottom: 2px;"></div>
            <div style="font-size: 8px; color: #666;">("Alıcı"-nın s.a.a. imzası)</div>
          </div>
        </div>
        
        <div style="margin-bottom: 6px; margin-top: 8px;"><strong>4. Müqavilədə göstərilənlər DYP-nin əməkdaşı</strong><span style="display:inline-block; min-width: 50mm; border-bottom:1px solid #000; margin-left: 6px;"></span></div>
        <div style="padding-left: 20px; margin-bottom: 4px; font-size: 8px; color: #666;">(qeydiyyat məntəqəsinin əməkdaşının soyadı)</div>
        <div style="margin-bottom: 6px;"><strong>tərəfindən yoxlanıldı və təqdim edilmiş sənədlərə uyğun gəlir.</strong></div>
        
        <div style="margin-bottom: 6px; margin-top: 8px;"><strong>5. Nəqliyyat vasitəsinin alqı-satqısının sənədləşdirilməsi üçün ödənc</strong></div>
        <div style="margin-bottom: 4px;">*<span style="display:inline-block; min-width: 8mm; border-bottom:1px solid #000;"></span> *<span style="display:inline-block; min-width: 8mm; border-bottom:1px solid #000;"></span> 20<span style="display:inline-block; min-width: 8mm; border-bottom:1px solid #000;"></span><strong>il tarixli</strong> <strong>№-li qəbzlə</strong><span style="display:inline-block; min-width: 25mm; border-bottom:1px solid #000; margin-left: 6px;"></span> <strong>məbləğində ödənilib.</strong><span style="display:inline-block; min-width: 50mm; border-bottom:1px solid #000; margin-left: 6px;"></span></div>
      </div>

      <div style="display: flex; justify-content: space-between; margin-top: 12px; font-size: 9px;">
        <div style="flex: 0 0 45%;">
          <div style="margin-bottom: 4px;"><strong>Qeydiyyat məntəqəsinin möhürü üçün yer</strong></div>
          <div style="border: 1px solid #000; min-height: 50px; min-width: 80px; margin-top: 4px;"></div>
        </div>
        <div style="flex: 0 0 50%; text-align: right;">
          <div style="margin-bottom: 4px;"><strong>Qeydiyyat məntəqəsinin Rəhbəri</strong></div>
          <div style="margin-bottom: 4px;">*<span style="display:inline-block; min-width: 8mm; border-bottom:1px solid #000;"></span> *<span style="display:inline-block; min-width: 8mm; border-bottom:1px solid #000;"></span> 20<span style="display:inline-block; min-width: 8mm; border-bottom:1px solid #000;"></span> il</div>
          <div style="border-bottom: 1px solid #000; min-width: 60mm; min-height: 20px; margin-left: auto; margin-top: 4px;"></div>
          <div style="font-size: 8px; color: #666; margin-top: 2px;">Soyadı,adı,imza</div>
        </div>
      </div>

      <div style="font-size: 7px; margin-top: 8px; padding-left: 4px;">
        *Müqavilənin nüsxələrinin sayı tərəflərə lazım olan miqdarda təyin edilir.
      </div>
    </div>
  `;
};


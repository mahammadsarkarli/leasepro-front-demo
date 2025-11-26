import { Company } from '../../types';
import { DypFormData } from '../dypTypes';
import { getHead, getClose } from './common';

export const renderPage2Body = (_form: DypFormData, _company: Company): string => `
  <div class="doc">
    <div class="header"><div class="title">A K T I (Davamı)</div></div>

    <div class="section" style="margin-top:12px; font-size: 11px;">
      <div style="margin-bottom: 8px;"><strong>Alma (maliyyə mənbəyi)</strong> <span style="display:inline-block; min-width: 100mm; border-bottom:1px solid #000; margin-left: 8px;"></span></div>
      <div style="margin-bottom: 8px;"><strong>Düzəltmə əmsalı</strong> <span style="display:inline-block; min-width: 110mm; border-bottom:1px solid #000; margin-left: 8px;"></span></div>
      <div style="margin-bottom: 8px;"><strong>Avtomobilin qısa xarakteristikası</strong> <span style="display:inline-block; min-width: 80mm; border-bottom:1px solid #000; margin-left: 8px;"></span></div>
      <div style="margin-bottom: 8px;"><strong>Avtomobilin texniki şərtlərə uyğundur, uyğun deyil</strong> <span style="display:inline-block; min-width: 60mm; border-bottom:1px solid #000; margin-left: 8px;"></span></div>
      <div style="margin-bottom: 8px;"><strong>Xırda iş (tələb olunur, olunmur)</strong> <span style="display:inline-block; min-width: 75mm; border-bottom:1px solid #000; margin-left: 8px;"></span></div>
      <div style="margin-bottom: 8px;"><strong>Avtomobilin sınaqdan keçirilməsinin nəticəsi</strong> <span style="display:inline-block; min-width: 60mm; border-bottom:1px solid #000; margin-left: 8px;"></span></div>
    </div>

    <div class="section" style="margin-top:12px; font-size: 11px;">
      <div style="font-weight:bold; margin-bottom: 8px;">Komisiyanın rəyi</div>
      <div style="border-bottom: 1px solid #000; min-height: 20px; margin-bottom: 12px;"></div>
      <div style="margin-bottom: 8px;"><strong>Əlavə</strong> <span style="display:inline-block; min-width: 110mm; border-bottom:1px solid #000; margin-left: 8px;"></span></div>
      
      <div style="font-weight:bold; margin-top: 12px; margin-bottom: 8px;">Komisiyanın üzvləri</div>
      ${[1, 2, 3].map((_, idx) => `
      <div style="display: flex; margin-bottom: ${idx < 2 ? '8px' : '0px'}; padding-bottom: ${idx < 2 ? '8px' : '0px'}; border-bottom: ${idx < 2 ? '1px solid #000' : 'none'};">
        <div style="flex: 0 0 45%; padding-right: 10px;"><span style="border-bottom:1px solid #000; display:inline-block; width: 100%; min-height: 20px;"></span></div>
        <div style="flex: 0 0 55%; padding-left: 10px;"><span style="border-bottom:1px solid #000; display:inline-block; width: 100%; min-height: 20px;"></span></div>
      </div>
      `).join('')}
      <div style="display: flex; margin-top: 8px; font-size: 10px;">
        <div style="flex: 0 0 45%; padding-right: 10px; text-align: left;">Vəzifəsi</div>
        <div style="flex: 0 0 55%; padding-left: 10px; text-align: left;">imzası,soyadı,adı</div>
      </div>
    </div>

    <div class="section" style="margin-top:16px; font-size: 11px;">
      <div style="font-weight:bold; margin-bottom: 8px;">Avtomobili (ləri)</div>
      <div style="font-weight:bold; margin-bottom: 8px;">Təhvil verdim</div>
      <div style="display: flex; margin-bottom: 8px; padding-bottom: 8px; border-bottom: 1px solid #000;">
        <div style="flex: 0 0 45%; padding-right: 10px;"><span style="border-bottom:1px solid #000; display:inline-block; width: 100%; min-height: 20px;"></span></div>
        <div style="flex: 0 0 55%; padding-left: 10px;"><span style="border-bottom:1px solid #000; display:inline-block; width: 100%; min-height: 20px;"></span></div>
      </div>
      <div style="display: flex; margin-bottom: 12px; font-size: 10px; padding-left: 0;">
        <div style="flex: 0 0 45%; padding-right: 10px; text-align: left;">Vəzifəsi</div>
        <div style="flex: 0 0 55%; padding-left: 10px; text-align: left;">imzası,soyadı,adı</div>
      </div>

      <div style="font-weight:bold; margin-bottom: 8px;">Təhvil aldım</div>
      <div style="display: flex; margin-bottom: 8px; padding-bottom: 8px; border-bottom: 1px solid #000;">
        <div style="flex: 0 0 45%; padding-right: 10px;"><span style="border-bottom:1px solid #000; display:inline-block; width: 100%; min-height: 20px;"></span></div>
        <div style="flex: 0 0 55%; padding-left: 10px;"><span style="border-bottom:1px solid #000; display:inline-block; width: 100%; min-height: 20px;"></span></div>
      </div>
      <div style="display: flex; font-size: 10px; padding-left: 0;">
        <div style="flex: 0 0 45%; padding-right: 10px; text-align: left;">Vəzifəsi</div>
        <div style="flex: 0 0 55%; padding-left: 10px; text-align: left;">imzası,soyadı,adı</div>
      </div>
    </div>

    <div class="section" style="margin-top:14px; display:flex; justify-content:space-between; align-items:center;">
      <div>
        "<span style="display:inline-block; min-width: 24mm; border-bottom:1px solid #000;"></span>"
        "<span style="display:inline-block; min-width: 24mm; border-bottom:1px solid #000;"></span>"
        20<span style="display:inline-block; min-width: 18mm; border-bottom:1px solid #000;"></span> il
      </div>
      <div style="text-align:right; font-weight:bold;">M.Y</div>
    </div>
  </div>
`;

export const generatePage2HTML = (form: DypFormData, company: Company): string =>
  getHead('AKTI (Davamı)') + renderPage2Body(form, company) + getClose();
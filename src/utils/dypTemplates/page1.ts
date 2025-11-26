import { Company } from '../../types';
import { DypFormData } from '../dypTypes';
import { getHead, getClose, footer } from './common';

export const renderPage1Body = (form: DypFormData, company: Company): string => `
  <div class="doc">
    <div class="topbar" style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:8px;">
      <div style="font-size:11px;">Müəssisə təşkilat</div>
      <div class="approval-block" style="text-align:right; font-size:10.5px;">
        <div>"Təsdiq edirəm"</div>
        <div>Rəhbər şəxsin imzası,Soyadı,Adı</div>
        <div style="margin-top:8px;">
          <span>"_____"</span>
          <span>"_____"</span>
          <span>20____</span>
        </div>
      </div>
    </div>
    <div class="header" style="border-bottom:2px solid #000; text-align:center; padding-bottom:8px; margin-bottom:10px;">
      <div class="title" style="font-size:20px; font-weight:bold; letter-spacing:0.5px;">NƏQLİYYAT VASİTƏLƏRİNİN TƏHVİL-TƏSLİM</div>
      <div style="margin-top:6px; font-weight:bold;">A K T I</div>
    </div>
    <div style="text-align:right; font-weight:bold; margin-bottom:6px;">M.Y</div>
    <div class="section">
      <table>
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
            <th>Nəqliyyat vasitəsinin tipi</th>
            <th>Banın tipi</th>
            <th>Buraxılış ili</th>
            <th>İstehsalçı zavod</th>
            <th>Max kütləsi (yük avt)</th>
            <th>Yüksüz kütləsi (yük avt)</th>
            <th>Qeydiyyat Şahadətnaması</th>
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
      <table>
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
    <div class="section" style="margin-top:12px;">
      <div class="row"><div class="label">"_____" 20____ il</div><div class="line-long"></div></div>
      <div class="row" style="margin-top:6px;"><div class="label">Tarixli №-li əmri(sərəncam) əsasında</div><div class="line-long"></div></div>
      <div class="row" style="margin-top:6px;"><div class="label">İstismara qəbul edilmiş(verilmiş)</div><div class="line-long"></div></div>
      <div class="row" style="margin-top:6px;"><div class="label">Baxış keçirilmişdir</div><div class="line-long"></div></div>
    </div>
    <div class="section" style="margin-top:10px;">
      <div class="row"><div class="label">Qəbul vaxtı avtomobil</div><div class="line-long"></div><div style="margin-left:6px;">dir</div></div>
      <div class="row" style="margin-top:6px;"><div class="label">Ödəmə məbləği</div><div class="line-long"></div><div style="margin-left:6px;">manat</div></div>
    </div>
    ${footer(company)}
  </div>
`;

export const generatePage1HTML = (form: DypFormData, company: Company): string =>
  getHead('Təhvil-Təslim Aktı') + renderPage1Body(form, company) + getClose();



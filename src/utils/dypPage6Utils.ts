import { Contract, Customer, Company, Vehicle } from '../types';
import { printDocument } from './pdfUtils';
import { safeFormatDate } from './dateUtils';
import { getHead, getClose } from './dypTemplates/common';
import { renderPage6Body } from './dypTemplates/page6';
import { DypFormData } from './dypTypes';

export interface DypPage6Data {
  contract: Contract;
  customer: Customer;
  company: Company;
  vehicle: Vehicle;
}

export const generateDypPage6HTML = (data: DypPage6Data): string => {
  const { contract, customer, company, vehicle } = data;
  
  // DypFormData formatına çevir
  const formData: DypFormData = {
    vehicleMake: vehicle ? `${vehicle.make || ''} ${vehicle.model || ''}`.trim() : '',
    registrationPlate: vehicle?.license_plate || '',
    manufactureYear: vehicle?.year?.toString() || '',
    engine: vehicle?.engine || '',
    bodyNumber: vehicle?.body_number || '',
    sellerName: customer.customer_type === 'company' 
      ? customer.company_name || `${customer.first_name || ''} ${customer.last_name || ''}`.trim()
      : `${customer.first_name || ''} ${customer.last_name || ''} ${customer.father_name || ''}`.trim(),
    sellerAddress: customer.address || '',
    price: Math.round(contract.down_payment || 0)
  };
  
  return getHead('Akt (Davamı)') + renderPage6Body(formData, company) + getClose();
};

export const printDypPage6 = (data: DypPage6Data): void => {
  const htmlContent = generateDypPage6HTML(data);
  printDocument(htmlContent, `dyp-page6-${data.contract.id}`);
};


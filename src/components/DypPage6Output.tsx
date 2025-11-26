import React from 'react';
import { Contract, Customer, Company, Vehicle } from '../types';
import { printDypPage6 } from '../utils/dypPage6Utils';
import { FileText } from 'lucide-react';

interface DypPage6OutputProps {
  contract: Contract;
  customer: Customer;
  company: Company;
  vehicle: Vehicle;
}

const DypPage6Output: React.FC<DypPage6OutputProps> = ({
  contract,
  customer,
  company,
  vehicle
}) => {
  const handlePrint = () => {
    printDypPage6({
      contract,
      customer,
      company,
      vehicle
    });
  };

  return (
    <button
      onClick={handlePrint}
      className="inline-flex items-center px-4 py-2 bg-gray-600 text-white font-medium rounded-lg hover:bg-gray-700 transition-colors duration-200 shadow-lg"
    >
      <FileText className="w-4 h-4 mr-2" />
      DYP Səhifə 6 (Alqı-Satqı) Çap Et
    </button>
  );
};

export default DypPage6Output;


import React from 'react';
import { Contract, Customer, Company, Vehicle } from '../types';
import { printXitam } from '../utils/xitamUtils';
import { FileX } from 'lucide-react';

interface XitamOutputProps {
  contract: Contract;
  customer: Customer;
  company: Company;
  vehicle: Vehicle;
}

const XitamOutput: React.FC<XitamOutputProps> = ({
  contract,
  customer,
  company,
  vehicle
}) => {
  const handlePrint = () => {
    printXitam({
      contract,
      customer,
      company,
      vehicle
    });
  };

  return (
    <button
      onClick={handlePrint}
      className="w-full inline-flex items-center justify-center px-4 py-3 bg-red-600 text-white font-medium rounded-lg hover:bg-red-700 transition-colors duration-200 shadow-lg"
    >
      <FileX className="w-4 h-4 mr-2" />
      Xitam Ərizəsini Çap Et
    </button>
  );
};

export default XitamOutput;


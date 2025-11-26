import React from 'react';
import { Contract, Customer, Company, Vehicle } from '../types';
import { printTehvilTeslim } from '../utils/tehvilTeslimUtils';
import { FileCheck } from 'lucide-react';

interface TehvilTeslimOutputProps {
  contract: Contract;
  customer: Customer;
  company: Company;
  vehicle: Vehicle;
}

const TehvilTeslimOutput: React.FC<TehvilTeslimOutputProps> = ({
  contract,
  customer,
  company,
  vehicle
}) => {
  const handlePrint = () => {
    printTehvilTeslim({
      contract,
      customer,
      company,
      vehicle
    });
  };

  return (
    <button
      onClick={handlePrint}
      className="w-full inline-flex items-center justify-center px-4 py-3 bg-teal-600 text-white font-medium rounded-lg hover:bg-teal-700 transition-colors duration-200 shadow-lg"
    >
      <FileCheck className="w-4 h-4 mr-2" />
      Təhvil-Təslim Aktını Çap Et
    </button>
  );
};

export default TehvilTeslimOutput;


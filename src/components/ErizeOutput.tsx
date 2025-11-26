import React from 'react';
import { Contract, Customer, Company, Vehicle } from '../types';
import { printErize } from '../utils/erizeUtils';
import { FileText } from 'lucide-react';

interface ErizeOutputProps {
  contract: Contract;
  customer: Customer;
  company: Company;
  vehicle: Vehicle;
}

const ErizeOutput: React.FC<ErizeOutputProps> = ({
  contract,
  customer,
  company,
  vehicle
}) => {
  const handlePrint = () => {
    printErize({
      contract,
      customer,
      company,
      vehicle
    });
  };

  return (
    <button
      onClick={handlePrint}
      className="w-full inline-flex items-center justify-center px-4 py-3 bg-purple-600 text-white font-medium rounded-lg hover:bg-purple-700 transition-colors duration-200 shadow-lg"
    >
      <FileText className="w-4 h-4 mr-2" />
      Ərizəni Çap Et
    </button>
  );
};

export default ErizeOutput;


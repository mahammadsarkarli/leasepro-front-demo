import React from 'react';
import { Contract, Customer, Company, Vehicle } from '../types';
import { printContractOutput } from '../utils/contractOutputUtils';
import { Printer } from 'lucide-react';

interface ContractOutputProps {
  contract: Contract;
  customer: Customer;
  company: Company;
  vehicle: Vehicle;
}

const ContractOutput: React.FC<ContractOutputProps> = ({
  contract,
  customer,
  company,
  vehicle
}) => {
  const handlePrint = () => {
    printContractOutput({
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
      <Printer className="w-4 h-4 mr-2" />
      Müqaviləni Çap Et
    </button>
  );
};

export default ContractOutput;


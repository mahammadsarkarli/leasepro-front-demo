import React from 'react';
import { Contract, Customer, Company, Vehicle } from '../types';
import { printIltizam } from '../utils/iltizamUtils';
import { HandHeart } from 'lucide-react';

interface IltizamOutputProps {
  contract: Contract;
  customer: Customer;
  company: Company;
  vehicle: Vehicle;
}

const IltizamOutput: React.FC<IltizamOutputProps> = ({
  contract,
  customer,
  company,
  vehicle
}) => {
  const handlePrint = () => {
    printIltizam({
      contract,
      customer,
      company,
      vehicle
    });
  };

  return (
    <button
      onClick={handlePrint}
      className="w-full inline-flex items-center justify-center px-4 py-3 bg-pink-600 text-white font-medium rounded-lg hover:bg-pink-700 transition-colors duration-200 shadow-lg"
    >
      <HandHeart className="w-4 h-4 mr-2" />
      İltizamı Çap Et
    </button>
  );
};

export default IltizamOutput;


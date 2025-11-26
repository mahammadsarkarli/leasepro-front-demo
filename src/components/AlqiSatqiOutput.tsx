import React from 'react';
import { Contract, Customer, Company, Vehicle } from '../types';
import { printAlqiSatqi } from '../utils/alqiSatqiUtils';
import { ShoppingCart } from 'lucide-react';

interface AlqiSatqiOutputProps {
  contract: Contract;
  customer: Customer; // Satıcı (seller)
  company: Company; // Alıcı (buyer)
  vehicle: Vehicle;
}

const AlqiSatqiOutput: React.FC<AlqiSatqiOutputProps> = ({
  contract,
  customer,
  company,
  vehicle
}) => {
  const handlePrint = () => {
    printAlqiSatqi({
      contract,
      customer,
      company,
      vehicle
    });
  };

  return (
    <button
      onClick={handlePrint}
      className="w-full inline-flex items-center justify-center px-4 py-3 bg-cyan-600 text-white font-medium rounded-lg hover:bg-cyan-700 transition-colors duration-200 shadow-lg"
    >
      <ShoppingCart className="w-4 h-4 mr-2" />
      Alqı-Satqı Müqaviləsini Çap Et
    </button>
  );
};

export default AlqiSatqiOutput;


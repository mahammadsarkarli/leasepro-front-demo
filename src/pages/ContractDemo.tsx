import React, { useState } from 'react';
import { useTranslation } from '../i18n';
import { printEtibarname, EtibarnameData } from '../utils/etibarnameUtils';
import { Customer, Company, Vehicle, Driver } from '../types';
import AuthorizationDialog from '../components/AuthorizationDialog';
import { FileText, Download, Eye, Plus, CheckCircle } from 'lucide-react';

const ContractDemo: React.FC = () => {
  const { t } = useTranslation();
  const [showAuthorizationDialog, setShowAuthorizationDialog] = useState(false);

  // Sample data for demonstration
  const sampleCustomer: Customer = {
    id: '1',
    first_name: 'Nureddin',
    last_name: 'Zeynalov',
    phone: '+994501234567',
    address: 'Bakı şəhəri, Nərimanov rayonu',
    customer_type: 'individual',
    national_id: '1234567890',
    license_number: 'AZE123456',
    license_category: 'B',
    license_given_date: new Date('2020-01-15'),
    company_id: '1',
    created_at: new Date(),
    updated_at: new Date()
  };

  const sampleCompany: Company = {
    id: '1',
    name: 'STAR LİZİNQ',
    director: 'B.M.Salch',
    voen: '1234567890',
    address: 'Bakı şəhəri, Nəriman Nərimanov, Təbriz küçəsi 55',
    phone: '(+99499)795 96 96 (+99470) 795 95 15 (+99455) 795 95 95',
    email: 'Starlizinq@mail.ru',
    created_at: new Date(),
    updated_at: new Date()
  };

  const sampleVehicle: Vehicle = {
    id: '1',
    make: 'Toyota',
    model: 'Camry',
    year: 2025,
    color: 'Ag',
    
    license_plate: '10vv201',
    engine: '2.5L',
    body_number: '124124124124',
    registration_certificate_number: 'RC123456789',
    company_id: '1',
    created_at: new Date(),
    updated_at: new Date()
  };

  const sampleContract = {
    id: '1',
    customer_id: '1',
    company_id: '1',
    vehicle: sampleVehicle,
    standard_purchase_price: 50000,
    down_payment: 10000,
    yearly_interest_rate: 20,
    term_months: 36,
    monthly_payment: 1500,
    total_payable: 54000,
    start_date: new Date('2025-08-29'),
    payment_start_date: new Date('2025-09-29'),
    next_due_date: new Date('2025-10-29'),
    payment_interval: 'monthly',
    status: 'active',
    created_at: new Date(),
    updated_at: new Date()
  };

  const handlePrintDemo = () => {
    const demoData: EtibarnameData = {
      contractId: sampleContract.id,
      customer: sampleCustomer,
      company: sampleCompany,
      vehicle: sampleVehicle,
      drivers: [
        {
          id: sampleCustomer.id,
          name: `${sampleCustomer.first_name} ${sampleCustomer.last_name}`,
          licenseNumber: sampleCustomer.license_number || '',
          license_category: sampleCustomer.license_category || '',
          license_given_date: sampleCustomer.license_given_date
        }
      ],
      permissionDates: {
        beginDate: '2025-08-29',
        endDate: '2025-09-29'
      },
      paymentInfo: {
        paymentDate: new Date().toISOString(),
        amount: 0,
        paymentNumber: 1
      },
      translations: {
        address: t('common.address'),
        phone: t('common.phone'),
        email: t('common.email')
      }
    };

    printEtibarname(demoData);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Təkmilləşdirilmiş Etibarnamə Sistemi
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Yeni kompakt dizayn və funksionallıq ilə etibarnamə yaratma və çap etmə sistemi
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {/* Feature 1 */}
          <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
              <FileText className="w-6 h-6 text-blue-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Dinamik Şirkət Adı
            </h3>
            <p className="text-gray-600 text-sm">
              Etibarnamədə şirkət adı avtomatik olaraq sistemdən götürülür və dəyişdirilə bilər.
            </p>
          </div>

          {/* Feature 2 */}
          <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
              <Download className="w-6 h-6 text-green-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              dd.mm.yyyy Tarix Formatı
            </h3>
            <p className="text-gray-600 text-sm">
              Bütün tarixlər Azərbaycan standartına uyğun dd.mm.yyyy formatında göstərilir.
            </p>
          </div>

          {/* Feature 3 */}
          <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
              <Plus className="w-6 h-6 text-purple-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Əlavə Sürücülər
            </h3>
            <p className="text-gray-600 text-sm">
              Əsas sürücüdən əlavə olaraq birdən çox sürücü əlavə edə bilərsiniz.
            </p>
          </div>

          {/* Feature 4 */}
          <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
            <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center mb-4">
              <CheckCircle className="w-6 h-6 text-orange-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Bir Səhifə Dizayn
            </h3>
            <p className="text-gray-600 text-sm">
              Optimizasiya edilmiş dizayn ilə bütün məlumatlar bir səhifədə yerləşir.
            </p>
          </div>
        </div>

        {/* Demo Section */}
        <div className="bg-white rounded-xl shadow-xl p-8 border border-gray-200">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Demo Etibarnamə
            </h2>
            <p className="text-gray-600">
              Aşağıdakı məlumatlarla etibarnamə yaradın və çap edin
            </p>
          </div>

          {/* Sample Data Display */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            {/* Customer Info */}
            <div className="bg-blue-50 rounded-lg p-4">
              <h3 className="font-semibold text-blue-900 mb-3">Müştəri Məlumatları</h3>
              <div className="space-y-2 text-sm">
                <div><span className="font-medium">Ad:</span> {sampleCustomer.first_name} {sampleCustomer.last_name}</div>
                <div><span className="font-medium">Telefon:</span> {sampleCustomer.phone}</div>
                <div><span className="font-medium">Sürücülük:</span> {sampleCustomer.license_number}</div>
                <div><span className="font-medium">Kateqoriya:</span> {sampleCustomer.license_category}</div>
              </div>
            </div>

            {/* Vehicle Info */}
            <div className="bg-green-50 rounded-lg p-4">
              <h3 className="font-semibold text-green-900 mb-3">Avtomobil Məlumatları</h3>
              <div className="space-y-2 text-sm">
                <div><span className="font-medium">Marka:</span> {sampleVehicle.make} {sampleVehicle.model}</div>
                <div><span className="font-medium">İl:</span> {sampleVehicle.year}</div>
                <div><span className="font-medium">Rəng:</span> {sampleVehicle.color}</div>
                <div><span className="font-medium">Nömrə:</span> {sampleVehicle.license_plate}</div>

              </div>
            </div>

            {/* Company Info */}
            <div className="bg-purple-50 rounded-lg p-4">
              <h3 className="font-semibold text-purple-900 mb-3">Şirkət Məlumatları</h3>
              <div className="space-y-2 text-sm">
                <div><span className="font-medium">Ad:</span> {sampleCompany.name}</div>
                <div><span className="font-medium">Direktor:</span> {sampleCompany.director}</div>
                <div><span className="font-medium">VÖEN:</span> {sampleCompany.voen}</div>
                <div><span className="font-medium">Ünvan:</span> {sampleCompany.address}</div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap justify-center gap-4">
            <button
              onClick={handlePrintDemo}
              className="inline-flex items-center px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors duration-200 shadow-lg"
            >
              <FileText className="w-5 h-5 mr-2" />
              Demo Etibarnaməni Çap Et
            </button>

            <button
              onClick={() => setShowAuthorizationDialog(true)}
              className="inline-flex items-center px-6 py-3 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 transition-colors duration-200 shadow-lg"
            >
              <Eye className="w-5 h-5 mr-2" />
              Əlavə Sürücülərlə Yarat
            </button>
          </div>
        </div>

        {/* Design Improvements Section */}
        <div className="mt-12 bg-white rounded-xl shadow-xl p-8 border border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
            Dizayn Təkmilləşdirmələri
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Əvvəlki Dizayn</h3>
              <ul className="space-y-2 text-gray-600 text-sm">
                <li>• Sadə mətn əsaslı dizayn</li>
                <li>• Ağ fon üzərində qara mətn</li>
                <li>• Minimal vizual elementlər</li>
                <li>• Sadə cədvəl strukturu</li>
                <li>• Əsas funksionallıq</li>
                <li>• Çoxlu boş sahələr</li>
              </ul>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Yeni Dizayn</h3>
              <ul className="space-y-2 text-gray-600 text-sm">
                <li>• Modern və professional görünüş</li>
                <li>• Rəngli başlıqlar və vurğular</li>
                <li>• Strukturlaşdırılmış bölmələr</li>
                <li>• Əlavə sürücülər cədvəli</li>
                <li>• Təkmilləşdirilmiş tipografiya</li>
                <li>• Responsive dizayn</li>
              </ul>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Kompakt Dizayn</h3>
              <ul className="space-y-2 text-gray-600 text-sm">
                <li>• Bir səhifə optimizasiyası</li>
                <li>• Azaldılmış boş sahələr</li>
                <li>• Kompakt mətn ölçüləri</li>
                <li>• Optimizasiya edilmiş məsafələr</li>
                <li>• Səmərəli sahə istifadəsi</li>
                <li>• Çap üçün optimizasiya</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Technical Specifications */}
        <div className="mt-8 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 text-center">
            Texniki Spesifikasiyalar
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
            <div className="text-center">
              <div className="font-semibold text-blue-600">Səhifə Ölçüsü</div>
              <div className="text-gray-600">A4 (210×297mm)</div>
            </div>
            <div className="text-center">
              <div className="font-semibold text-blue-600">Kənar Boşluqları</div>
              <div className="text-gray-600">1.5cm (hər tərəfdən)</div>
            </div>
            <div className="text-center">
              <div className="font-semibold text-blue-600">Mətn Ölçüsü</div>
              <div className="text-gray-600">11pt (əsas mətn)</div>
            </div>
            <div className="text-center">
              <div className="font-semibold text-blue-600">Sətir Məsafəsi</div>
              <div className="text-gray-600">1.4 (kompakt)</div>
            </div>
          </div>
        </div>
      </div>

      {/* Authorization Dialog */}
      {showAuthorizationDialog && (
        <AuthorizationDialog
          isOpen={showAuthorizationDialog}
          onClose={() => setShowAuthorizationDialog(false)}
          contract={sampleContract}
          customer={sampleCustomer}
          company={sampleCompany}
        />
      )}
    </div>
  );
};

export default ContractDemo;

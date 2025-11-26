import React, { useState } from 'react';
import { 
  ChevronRight, 
  ChevronLeft, 
  Download, 
  FileText, 
  CheckCircle
} from 'lucide-react';
import { useTranslation } from '../i18n';
import { useData } from '../contexts/DataContext';
import ImprovedDateInput from '../components/ui/ImprovedDateInput';
import { generateDypDocumentHTML, generateDypAllDocumentsHTML, printDocument, downloadPDF } from '../utils/pdfUtils';


interface DypSenedleriForm {
  girov: string;
  color: string;
  manufactureYear: string;
  bodyNumber: string;
  engine: string;
  registrationPlate: string;
  sellerName: string;
  sellerFullName: string;
  powerOfAttorneySeller: string;
  powerOfAttorneyNumber: string;
  passportSeries: string;
  authority: string;
  issueDate: string;
  address: string;
}

const DypSenedleri: React.FC = () => {
  const { t } = useTranslation();
  const { selectedCompany, companies } = useData();
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<DypSenedleriForm>({
    girov: '',
    color: '',
    manufactureYear: '',
    bodyNumber: '',
    engine: '',
    registrationPlate: '',
    sellerName: '',
    sellerFullName: '',
    powerOfAttorneySeller: '',
    powerOfAttorneyNumber: '',
    passportSeries: '',
    authority: '',
    issueDate: '',
    address: ''
  });

  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedFiles, setGeneratedFiles] = useState<string[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<string>('page1');



  const handleInputChange = (field: keyof DypSenedleriForm, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const nextStep = () => {
    if (currentStep < 4) {
      setCurrentStep(currentStep + 1);
    }
  };

  const previousStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const generateDocuments = async () => {
    setIsGenerating(true);
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const generatedFileNames = ['dyp_senedi_generated.docx'];
    setGeneratedFiles(generatedFileNames);
    setIsGenerating(false);
  };

  const downloadFile = (fileName: string) => {
    const link = document.createElement('a');
    link.href = '#';
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const downloadAll = () => {
    generatedFiles.forEach(fileName => downloadFile(fileName));
  };

  const handlePrint = () => {
    const company = companies.find(c => c.id === selectedCompany) || companies[0];
    if (!company) return;
    const html = generateDypDocumentHTML(formData as any, company, selectedTemplate);
    printDocument(html, 'dyp-sened');
  };

  const handleDownloadPDF = () => {
    const company = companies.find(c => c.id === selectedCompany) || companies[0];
    if (!company) return;
    const html = generateDypDocumentHTML(formData as any, company, selectedTemplate);
    downloadPDF(html, 'dyp-sened');
  };

  const handlePrintAll = () => {
    const company = companies.find(c => c.id === selectedCompany) || companies[0];
    if (!company) return;
    const html = generateDypAllDocumentsHTML(formData as any, company);
    printDocument(html, 'dyp-sened-all');
  };

  const handleShowTemplate = () => {
    const company =
      companies.find(c => c.id === selectedCompany) ||
      companies[0] ||
      ({ id: 'preview', name: 'Şirkət', interest_rate: 0, created_at: new Date(), is_active: true } as any);
    const html = generateDypDocumentHTML(formData as any, company, selectedTemplate);
    const preview = window.open('', '_blank');
    if (preview) {
      preview.document.write(html);
      preview.document.close();
      preview.focus();
    }
  };

  const isStepValid = (step: number) => {
    switch (step) {
      case 1:
        return formData.girov && formData.color && formData.manufactureYear && 
               formData.bodyNumber && formData.engine && formData.registrationPlate;
      case 2:
        return formData.sellerName && formData.sellerFullName && 
               formData.powerOfAttorneySeller && formData.powerOfAttorneyNumber;
      case 3:
        return formData.passportSeries && formData.authority && 
               formData.issueDate && formData.address;
      default:
        return true;
    }
  };

  const renderStepIndicator = () => (
    <div className="mb-8">
      <div className="flex items-center justify-center space-x-4">
        {[1, 2, 3, 4].map((step) => (
          <div key={step} className="flex items-center">
            <div className={`flex items-center justify-center w-10 h-10 rounded-full border-2 ${
              currentStep >= step 
                ? 'bg-blue-600 border-blue-600 text-white' 
                : 'bg-white border-gray-300 text-gray-500'
            }`}>
              {currentStep > step ? (
                <CheckCircle className="w-6 h-6" />
              ) : (
                <span className="font-semibold">{step}</span>
              )}
            </div>
            {step < 4 && (
              <div className={`w-16 h-0.5 mx-2 ${
                currentStep > step ? 'bg-blue-600' : 'bg-gray-300'
              }`} />
            )}
          </div>
        ))}
      </div>
      <div className="flex justify-center mt-4">
        <span className="text-sm text-gray-600">
          {t(`dypSenedleri.step${currentStep}`)}
        </span>
      </div>
    </div>
  );

  const renderVehicleInformation = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {t('dypSenedleri.girov')} *
          </label>
          <input
            type="text"
            value={formData.girov}
            onChange={(e) => handleInputChange('girov', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder={t('dypSenedleri.placeholders.girov')}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {t('dypSenedleri.color')} *
          </label>
          <input
            type="text"
            value={formData.color}
            onChange={(e) => handleInputChange('color', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder={t('dypSenedleri.placeholders.color')}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {t('dypSenedleri.manufactureYear')} *
          </label>
          <input
            type="text"
            value={formData.manufactureYear}
            onChange={(e) => handleInputChange('manufactureYear', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder={t('dypSenedleri.placeholders.manufactureYear')}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {t('dypSenedleri.bodyNumber')} *
          </label>
          <input
            type="text"
            value={formData.bodyNumber}
            onChange={(e) => handleInputChange('bodyNumber', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder={t('dypSenedleri.placeholders.bodyNumber')}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {t('dypSenedleri.engine')} *
          </label>
          <input
            type="text"
            value={formData.engine}
            onChange={(e) => handleInputChange('engine', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder={t('dypSenedleri.placeholders.engine')}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {t('dypSenedleri.registrationPlate')} *
          </label>
          <input
            type="text"
            value={formData.registrationPlate}
            onChange={(e) => handleInputChange('registrationPlate', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder={t('dypSenedleri.placeholders.registrationPlate')}
          />
        </div>
      </div>
    </div>
  );

  const renderSellerInformation = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {t('dypSenedleri.sellerName')} *
          </label>
          <input
            type="text"
            value={formData.sellerName}
            onChange={(e) => handleInputChange('sellerName', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder={t('dypSenedleri.placeholders.sellerName')}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {t('dypSenedleri.sellerFullName')} *
          </label>
          <input
            type="text"
            value={formData.sellerFullName}
            onChange={(e) => handleInputChange('sellerFullName', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder={t('dypSenedleri.placeholders.sellerFullName')}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {t('dypSenedleri.powerOfAttorneySeller')} *
          </label>
          <input
            type="text"
            value={formData.powerOfAttorneySeller}
            onChange={(e) => handleInputChange('powerOfAttorneySeller', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder={t('dypSenedleri.placeholders.powerOfAttorneySeller')}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {t('dypSenedleri.powerOfAttorneyNumber')} *
          </label>
          <input
            type="text"
            value={formData.powerOfAttorneyNumber}
            onChange={(e) => handleInputChange('powerOfAttorneyNumber', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder={t('dypSenedleri.placeholders.powerOfAttorneyNumber')}
          />
        </div>
      </div>
    </div>
  );

  const renderDocumentInformation = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {t('dypSenedleri.passportSeries')} *
          </label>
          <input
            type="text"
            value={formData.passportSeries}
            onChange={(e) => handleInputChange('passportSeries', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder={t('dypSenedleri.placeholders.passportSeries')}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {t('dypSenedleri.authority')} *
          </label>
          <input
            type="text"
            value={formData.authority}
            onChange={(e) => handleInputChange('authority', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder={t('dypSenedleri.placeholders.authority')}
          />
        </div>
        <div>
          <ImprovedDateInput
            value={formData.issueDate}
            onChange={(value) => handleInputChange('issueDate', value)}
            label={t('dypSenedleri.issueDate')}
            required
            placeholder="Sənəd tarixini seçin"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {t('dypSenedleri.address')} *
          </label>
          <input
            type="text"
            value={formData.address}
            onChange={(e) => handleInputChange('address', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder={t('dypSenedleri.placeholders.address')}
          />
        </div>
      </div>
    </div>
  );

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 1:
        return renderVehicleInformation();
      case 2:
        return renderSellerInformation();
      case 3:
        return renderDocumentInformation();
      case 4:
        return renderDocumentGeneration();
      default:
        return null;
    }
  };

  const renderDocumentGeneration = () => (
    <div className="space-y-6">
      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
        <div className="flex items-center">
          <CheckCircle className="w-5 h-5 text-green-600 mr-2" />
          <span className="text-green-800 font-medium">{t('dypSenedleri.formCompleted')}</span>
        </div>
      </div>

      <div className="flex justify-center">
        <button
          onClick={generateDocuments}
          disabled={isGenerating}
          className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
        >
          {isGenerating ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              {t('dypSenedleri.generatingDocuments')}
            </>
          ) : (
            <>
              <FileText className="w-4 h-4 mr-2" />
              {t('dypSenedleri.generateDocuments')}
            </>
          )}
        </button>
      </div>

      <div className="border border-gray-200 rounded-lg p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
          <div className="md:col-span-1">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Şablon
            </label>
            <select
              value={selectedTemplate}
              onChange={(e) => setSelectedTemplate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="page1">Page 1</option>
              <option value="page2">Page 2</option>
              <option value="page3">Page 3</option>
              <option value="page4">Page 4</option>
              <option value="page5">Page 5</option>
            </select>
          </div>
          <div className="flex gap-3 md:col-span-2">
            <button
              onClick={handleShowTemplate}
              className="bg-white text-gray-800 px-4 py-2 rounded-lg border border-gray-300 hover:bg-gray-50 flex items-center"
            >
              <FileText className="w-4 h-4 mr-2" />
              Şablonu Göster
            </button>
            <button
              onClick={handlePrint}
              className="bg-gray-800 text-white px-4 py-2 rounded-lg hover:bg-gray-900"
            >
              {t('print.print')}
            </button>
            <button
              onClick={handlePrintAll}
              className="bg-gray-700 text-white px-4 py-2 rounded-lg hover:bg-gray-800"
            >
              Hamısını Çap Et
            </button>
            <button
              onClick={handleDownloadPDF}
              className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center"
            >
              <Download className="w-4 h-4 mr-2" />
              {t('print.download')}
            </button>
          </div>
        </div>
      </div>

      {generatedFiles.length > 0 && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center">
              <CheckCircle className="w-5 h-5 text-green-600 mr-2" />
              <span className="text-green-800 font-medium">{t('dypSenedleri.documentsGenerated')}</span>
            </div>
            <button
              onClick={downloadAll}
              className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center"
            >
              <Download className="w-4 h-4 mr-2" />
              {t('dypSenedleri.downloadAll')}
            </button>
          </div>
          
          <div className="space-y-2">
            {generatedFiles.map((fileName, index) => (
              <div key={index} className="flex items-center justify-between bg-white rounded-lg p-3">
                <div className="flex items-center">
                  <FileText className="w-4 h-4 text-gray-500 mr-2" />
                  <span className="text-sm text-gray-700">{fileName}</span>
                </div>
                <button
                  onClick={() => downloadFile(fileName)}
                  className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                >
                  {t('common.download')}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {t('dypSenedleri.title')}
          </h1>
          <p className="text-gray-600">
            {t('dypSenedleri.description')}
          </p>
        {/* Önizleme araç çubuğu: alanlar boş olsa bile çalışır */}
        <div className="mt-4 bg-white border border-gray-200 rounded-lg p-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
            <div className="md:col-span-1">
              <label className="block text-sm font-medium text-gray-700 mb-2">Şablon</label>
              <select
                value={selectedTemplate}
                onChange={(e) => setSelectedTemplate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="page1">Page 1</option>
                <option value="page2">Page 2</option>
                <option value="page3">Page 3</option>
                <option value="page4">Page 4</option>
                <option value="page5">Page 5</option>
                <option value="page6">Page 6 (Alqı-Satqı)</option>
              </select>
            </div>
            <div className="flex gap-3 md:col-span-2">
              <button
                onClick={handleShowTemplate}
                className="bg-white text-gray-800 px-4 py-2 rounded-lg border border-gray-300 hover:bg-gray-50 flex items-center"
              >
                <FileText className="w-4 h-4 mr-2" />
                Şablonu Göster (Boş alanlarla)
              </button>
            </div>
          </div>
        </div>
        </div>

        {renderStepIndicator()}

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          {renderCurrentStep()}

          {currentStep < 4 && (
            <div className="flex justify-between mt-8 pt-6 border-t border-gray-200">
              <button
                onClick={previousStep}
                disabled={currentStep === 1}
                className="flex items-center px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="w-4 h-4 mr-2" />
                {t('dypSenedleri.previousStep')}
              </button>
              
              <button
                onClick={nextStep}
                disabled={!isStepValid(currentStep)}
                className="flex items-center px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {t('dypSenedleri.nextStep')}
                <ChevronRight className="w-4 h-4 ml-2" />
              </button>
            </div>
          )}
        </div>
      </div>

    </div>
  );
};

export default DypSenedleri;

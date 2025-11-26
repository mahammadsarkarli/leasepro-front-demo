import React, { useState } from 'react';
import { useTranslation } from '../i18n';
import { 
  Building2, 
  Mail, 
  Smartphone, 
  MapPin, 
  Save, 
  Edit3,
  X
} from 'lucide-react';

export interface CompanyContactInfo {
  id: string;
  name: string;
  address: string;
  phoneNumbers: string[];
  email: string;
  insurancePhoneNumbers: string[];
}

interface CompanyContactSettingsProps {
  contactInfo: CompanyContactInfo;
  onSave: (contactInfo: CompanyContactInfo) => void;
  isEditing?: boolean;
}

const CompanyContactSettings: React.FC<CompanyContactSettingsProps> = ({
  contactInfo,
  onSave,
  isEditing = false
}) => {
  const { t } = useTranslation();
  const [isEditMode, setIsEditMode] = useState(isEditing);
  const [formData, setFormData] = useState<CompanyContactInfo>(contactInfo);
  const [newPhone, setNewPhone] = useState('');
  const [newInsurancePhone, setNewInsurancePhone] = useState('');

  const handleInputChange = (field: keyof CompanyContactInfo, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const addPhoneNumber = () => {
    if (newPhone.trim()) {
      setFormData(prev => ({
        ...prev,
        phoneNumbers: [...prev.phoneNumbers, newPhone.trim()]
      }));
      setNewPhone('');
    }
  };

  const removePhoneNumber = (index: number) => {
    setFormData(prev => ({
      ...prev,
      phoneNumbers: prev.phoneNumbers.filter((_, i) => i !== index)
    }));
  };

  const addInsurancePhoneNumber = () => {
    if (newInsurancePhone.trim()) {
      setFormData(prev => ({
        ...prev,
        insurancePhoneNumbers: [...prev.insurancePhoneNumbers, newInsurancePhone.trim()]
      }));
      setNewInsurancePhone('');
    }
  };

  const removeInsurancePhoneNumber = (index: number) => {
    setFormData(prev => ({
      ...prev,
      insurancePhoneNumbers: prev.insurancePhoneNumbers.filter((_, i) => i !== index)
    }));
  };

  const handleSave = () => {
    onSave(formData);
    setIsEditMode(false);
  };

  const handleCancel = () => {
    setFormData(contactInfo);
    setIsEditMode(false);
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
            <Building2 className="w-4 h-4 text-blue-600" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900">
            {t('common.companyContactInformation')}
          </h2>
        </div>
        {!isEditMode && (
          <button
            onClick={() => setIsEditMode(true)}
            className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-lg shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
          >
            <Edit3 className="w-4 h-4 mr-2" />
            {t('common.edit')}
          </button>
        )}
      </div>

      <div className="space-y-6">
        {/* Company Name */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {t('common.companyName')}
          </label>
          {isEditMode ? (
            <input
              type="text"
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          ) : (
            <p className="text-gray-900 font-medium">{formData.name}</p>
          )}
        </div>

        {/* Address */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <MapPin className="w-4 h-4 inline mr-1" />
            {t('common.address')}
          </label>
          {isEditMode ? (
            <textarea
              value={formData.address}
              onChange={(e) => handleInputChange('address', e.target.value)}
              rows={2}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          ) : (
            <p className="text-gray-900">{formData.address}</p>
          )}
        </div>

        {/* Phone Numbers */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <Smartphone className="w-4 h-4 inline mr-1" />
            {t('common.phoneNumbers')}
          </label>
          {isEditMode ? (
            <div className="space-y-3">
              {formData.phoneNumbers.map((phone, index) => (
                <div key={index} className="flex items-center space-x-2">
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => {
                      const newPhones = [...formData.phoneNumbers];
                      newPhones[index] = e.target.value;
                      setFormData(prev => ({ ...prev, phoneNumbers: newPhones }));
                    }}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <button
                    onClick={() => removePhoneNumber(index)}
                    className="p-2 text-red-600 hover:text-red-800"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
              <div className="flex items-center space-x-2">
                <input
                  type="text"
                  value={newPhone}
                  onChange={(e) => setNewPhone(e.target.value)}
                  placeholder={t('common.addPhoneNumber')}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <button
                  onClick={addPhoneNumber}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  {t('common.add')}
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-1">
              {formData.phoneNumbers.map((phone, index) => (
                <p key={index} className="text-gray-900">{phone}</p>
              ))}
            </div>
          )}
        </div>

        {/* Email */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <Mail className="w-4 h-4 inline mr-1" />
            {t('common.email')}
          </label>
          {isEditMode ? (
            <input
              type="email"
              value={formData.email}
              onChange={(e) => handleInputChange('email', e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          ) : (
            <p className="text-gray-900">{formData.email}</p>
          )}
        </div>

        {/* Insurance Phone Numbers */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <Smartphone className="w-4 h-4 inline mr-1" />
            {t('common.insurancePhoneNumbers')}
          </label>
          {isEditMode ? (
            <div className="space-y-3">
              {formData.insurancePhoneNumbers.map((phone, index) => (
                <div key={index} className="flex items-center space-x-2">
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => {
                      const newPhones = [...formData.insurancePhoneNumbers];
                      newPhones[index] = e.target.value;
                      setFormData(prev => ({ ...prev, insurancePhoneNumbers: newPhones }));
                    }}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <button
                    onClick={() => removeInsurancePhoneNumber(index)}
                    className="p-2 text-red-600 hover:text-red-800"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
              <div className="flex items-center space-x-2">
                <input
                  type="text"
                  value={newInsurancePhone}
                  onChange={(e) => setNewInsurancePhone(e.target.value)}
                  placeholder={t('common.addInsurancePhoneNumber')}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <button
                  onClick={addInsurancePhoneNumber}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  {t('common.add')}
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-1">
              {formData.insurancePhoneNumbers.map((phone, index) => (
                <p key={index} className="text-gray-900">{phone}</p>
              ))}
            </div>
          )}
        </div>

        {/* Action Buttons */}
        {isEditMode && (
          <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
            <button
              onClick={handleCancel}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              {t('common.cancel')}
            </button>
            <button
              onClick={handleSave}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
            >
              <Save className="w-4 h-4 mr-2" />
              {t('common.saveChanges')}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default CompanyContactSettings;

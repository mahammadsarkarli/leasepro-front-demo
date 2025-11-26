import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "../i18n";
import { Plus, Save, Trash2, ArrowLeft } from "lucide-react";
import { createCompany } from "../services/companies";
import { useData } from "../contexts/DataContext";
import { showApiError, showApiSuccess } from "../utils/errorHandler";

const CompanyCreate: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { loadCompanies } = useData();
  const [formData, setFormData] = useState({
    name: "",
    interest_rate: 1.0,
    is_active: true,
    voen: "",
    director: "",
    director_passport_number: "",
    address: "",
    phone_numbers: [""],
    email: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      setError(null);
      await createCompany(formData);
      // Reload companies list to show the new company
      await loadCompanies();
      showApiSuccess(t('notifications.created', { entity: t('common.company') }), 'company');
      navigate("/companies");
    } catch (error) {
      console.error("Error creating company:", error);
      setError(error instanceof Error ? error.message : 'An error occurred');
      showApiError(error, 'company');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]:
        type === "checkbox"
          ? checked
          : type === "number"
          ? parseFloat(value)
          : value,
    }));
  };

  return (
    <div className="w-full space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-4">
        <button
          onClick={() => navigate("/companies")}
          className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-50"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {t("common.createNewCompany")}
          </h1>
          <p className="text-gray-600">{t("common.addNewCompany")}</p>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg
                className="h-5 w-5 text-red-400"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Error</h3>
              <div className="mt-2 text-sm text-red-700">{error}</div>
            </div>
          </div>
        </div>
      )}

      {/* Form */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Company Name */}
          <div>
            <label
              htmlFor="name"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              {t("common.companyName")} *
            </label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder={t("common.enterCompanyName")}
            />
          </div>

          {/* Interest Rate */}
          <div>
            <label
              htmlFor="interest_rate"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              {t("common.dailyInterestRatePercent")} *
            </label>
            <input
              type="number"
              id="interest_rate"
              name="interest_rate"
              value={formData.interest_rate}
              onChange={handleChange}
              step="0.01"
              min="0"
              max="10"
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="1.00"
            />
            <p className="text-sm text-gray-500 mt-1">
              {t("common.enterDailyInterestRate")}
            </p>
          </div>
          {/* VÖEN */}
          <div>
            <label
              htmlFor="voen"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              {t("common.voen")}
            </label>
            <input
              type="text"
              id="voen"
              name="voen"
              value={formData.voen}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder={t("common.enterVoen")}
            />
          </div>

          {/* Director Passport Number */}
          <div>
            <label
              htmlFor="director_passport_number"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              {t("common.directorPassportNumber")}
            </label>
            <input
              type="text"
              id="director_passport_number"
              name="director_passport_number"
              value={formData.director_passport_number}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder={t("common.enterDirectorPassportNumber")}
            />
          </div>


          {/* Address */}
          <div>
            <label
              htmlFor="address"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              {t("common.address")}
            </label>
            <textarea
              id="address"
              name="address"
              value={formData.address}
              onChange={handleChange}
              rows={3}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder={t("common.enterAddress")}
            />
          </div>

          {/* Phone Numbers */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t("common.phoneNumbers")} *
            </label>
            <div className="space-y-2">
              {formData.phone_numbers.map((phone, index) => (
                <div key={index} className="flex space-x-2">
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => {
                      const newPhoneNumbers = [...formData.phone_numbers];
                      newPhoneNumbers[index] = e.target.value;
                      setFormData((prev) => ({
                        ...prev,
                        phone_numbers: newPhoneNumbers,
                      }));
                    }}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder={t("common.enterPhoneNumber")}
                  />
                  {formData.phone_numbers.length > 1 && (
                    <button
                      type="button"
                      onClick={() => {
                        const newPhoneNumbers = formData.phone_numbers.filter(
                          (_, i) => i !== index
                        );
                        setFormData((prev) => ({
                          ...prev,
                          phone_numbers: newPhoneNumbers,
                        }));
                      }}
                      className="p-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-lg"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
              <button
                type="button"
                onClick={() =>
                  setFormData((prev) => ({
                    ...prev,
                    phone_numbers: [...prev.phone_numbers, ""],
                  }))
                }
                className="inline-flex items-center px-3 py-2 text-sm font-medium text-blue-600 hover:text-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <Plus className="w-4 h-4 mr-2" />
                {t("common.addPhoneNumber")}
              </button>
            </div>
          </div>

          {/* Email */}
          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              {t("common.email")}
            </label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder={t("common.enterEmail")}
            />
          </div>

          {/* Director */}
          <div>
            <label
              htmlFor="director"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              {t("common.director")}
            </label>
            <input
              type="text"
              id="director"
              name="director"
              value={formData.director}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder={t("common.enterDirector")}
            />
          </div>

          {/* Submit Button */}
          <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={() => navigate("/companies")}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              {t("common.cancel")}
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !formData.name}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Save className="w-4 h-4 mr-2" />
              {isSubmitting ? t("common.creating") : t("common.createCompany")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CompanyCreate;

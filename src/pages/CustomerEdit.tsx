import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "../i18n";
import { ArrowLeft, Save, User, Plus, Trash2 } from "lucide-react";
import {
  getCustomerById,
  updateCustomerWithContacts,
} from "../services/customers";
import { ContactInfo, CustomerType } from "../types";
import { useData } from "../contexts/DataContext";
import ImprovedDateInput from "../components/ui/ImprovedDateInput";
import { useNotifications } from "../hooks/useNotifications";
import { showApiError, showApiSuccess } from "../utils/errorHandler";
import { showError } from "../services/notifications";

const CustomerEdit: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { t } = useTranslation();
  const { companies, loadCompanies } = useData();
  const { success, error } = useNotifications();
  const [isLoading, setIsLoading] = useState(true);
  const [formData, setFormData] = useState({
    company_id: "",
    customer_type: CustomerType.INDIVIDUAL,
    first_name: "",
    last_name: "",
    father_name: "",
    phone: "",
    address: "",
    national_id: "",
    company_name: "",
    voen: "",
    license_number: "",
    license_category: "",
    license_given_date: "",
  });
  const [contacts, setContacts] = useState<ContactInfo[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [useCompanyDetailsForEtibarname, setUseCompanyDetailsForEtibarname] = useState(false);

  // Load companies on component mount
  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);
        await loadCompanies();
      } catch (error) {
        console.error("Error loading companies:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [loadCompanies]);

  // Load customer data
  useEffect(() => {
    const loadCustomer = async () => {
      if (id) {
        try {
          const customer = await getCustomerById(id);
          if (customer) {
            setFormData({
              company_id: customer.company_id || "",
              customer_type: (customer.customer_type as CustomerType) || CustomerType.INDIVIDUAL,
              first_name: customer.first_name || "",
              last_name: customer.last_name || "",
              father_name: customer.father_name || "",
              phone: customer.phone || "",
              address: customer.address || "",
              national_id: customer.national_id || "",
              company_name: customer.company_name || "",
              voen: customer.voen || "",
              license_number: customer.license_number || "",
              license_category: customer.license_category || "",
              license_given_date: customer.license_given_date || "",
            });
            setContacts(customer.contacts || []);
            
            // Initialize checkbox based on whether customer has company details
            setUseCompanyDetailsForEtibarname(
              !!(customer.company_name && customer.voen)
            );
          } else {
            error(t("common.customerNotFound"));
          }
        } catch (err) {
          console.error("Error loading customer:", err);
          showApiError(err, 'customer');
        } finally {
          setIsLoading(false);
        }
      }
    };

    loadCustomer();
  }, [id, t]);

  // No need for useEffect - company changes are handled directly in form

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;

    setIsSubmitting(true);

    try {
      // Clean form data - handle empty strings properly for database updates
      const cleanedFormData = {
        ...formData,
        // For required fields, only send if they have values
        first_name: formData.first_name || undefined,
        last_name: formData.last_name || undefined,
        father_name: formData.father_name || undefined,
        national_id: formData.national_id || undefined,
        address: formData.address || undefined,
        // For optional fields that can be cleared, send null if empty string
        company_name: formData.company_name === "" ? null : (formData.company_name || undefined),
        voen: formData.voen === "" ? null : (formData.voen || undefined),
        license_number: formData.license_number === "" ? null : (formData.license_number || undefined),
        license_category: formData.license_category === "" ? null : (formData.license_category || undefined),
        license_given_date: formData.license_given_date === "" ? null : (formData.license_given_date || undefined)
      };
      
      const updated = await updateCustomerWithContacts(id, cleanedFormData, contacts);
      if (updated) {
        showApiSuccess(t('notifications.updated', { entity: t('common.customer') }), 'customer');
        navigate("/customers");
      } else {
        showError(t('apiErrors.customer.updateFailed'));
      }
    } catch (err) {
      console.error("Error updating customer:", err);
      showApiError(err, 'customer');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]:
        type === "checkbox" ? (e.target as HTMLInputElement).checked : value,
    }));
  };

  const addContact = () => {
    const newContact: ContactInfo = {
      id: Date.now().toString(),
      customer_id: id || "",
      first_name: "",
      last_name: "",
      relationship: "",
      phone: "",
    };
    setContacts((prev) => [...prev, newContact]);
  };

  const removeContact = (contactId: string) => {
    setContacts((prev) => prev.filter((contact) => contact.id !== contactId));
  };

  const updateContact = (
    contactId: string,
    field: keyof ContactInfo,
    value: string
  ) => {
    setContacts((prev) =>
      prev.map((contact) =>
        contact.id === contactId ? { ...contact, [field]: value } : contact
      )
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="text-center">
          <User className="w-8 h-8 text-gray-400 mx-auto mb-2 animate-pulse" />
          <p className="text-gray-500">{t("common.loadingCustomer")}</p>
        </div>
      </div>
    );
  }

  // Error handling is now done via notifications, form stays visible

  return (
    <div className="w-full space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-4">
        <button
          onClick={() => navigate("/customers")}
          className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-50"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {t("common.editCustomer")}
          </h1>
          <p className="text-gray-600">
            {t("common.updateCustomerInformation")}
          </p>
        </div>
      </div>

      {/* Form */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Company Selection */}
          <div>
            <label
              htmlFor="company_id"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              {t("common.company")} *
            </label>
            <select
              id="company_id"
              name="company_id"
              value={formData.company_id}
              onChange={handleChange}
              required
              disabled={isLoading}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
            >
              <option value="">
                {isLoading ? t("common.loading") : t("common.selectCompany")}
              </option>
              {companies.map((company) => (
                <option key={company.id} value={company.id}>
                  {company.name}
                </option>
              ))}
            </select>
          </div>

          {/* Customer Type Selection */}
          <div>
            <label
              htmlFor="customer_type"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              {t("common.customerType")} *
            </label>
            <select
              id="customer_type"
              name="customer_type"
              value={formData.customer_type}
              onChange={handleChange}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value={CustomerType.INDIVIDUAL}>
                {t("common.individual")}
              </option>
              <option value={CustomerType.COMPANY}>
                {t("common.company")}
              </option>
            </select>
          </div>

          {/* Extra Company Details for Etibarname (for individual customers) */}
          {formData.customer_type === CustomerType.INDIVIDUAL && (
            <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
              <div className="flex items-center mb-3">
                <input
                  type="checkbox"
                  id="use_company_details_for_etibarname"
                  checked={useCompanyDetailsForEtibarname}
                  onChange={(e) => {
                    const isChecked = e.target.checked;
                    setUseCompanyDetailsForEtibarname(isChecked);
                    
                    // Clear company fields when checkbox is unchecked
                    if (!isChecked) {
                      setFormData(prev => ({
                        ...prev,
                        company_name: "",
                        voen: ""
                      }));
                    }
                  }}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="use_company_details_for_etibarname" className="ml-2 text-sm font-medium text-gray-700">
                  Etibarnamədə şirkət məlumatları göstər (fərdi müştəri üçün)
                </label>
              </div>
              
              {useCompanyDetailsForEtibarname && (
                <div className="space-y-4">
                  <div className="text-sm text-gray-600 mb-3">
                    <p>Bu seçim etibarnamədə şirkət məlumatlarının göstərilməsini təmin edəcək. Şirkət adı və VÖEN məlumatlarını aşağıdakı sahələrdə daxil edin.</p>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="company_name" className="block text-sm font-medium text-gray-700 mb-2">
                        Şirkət adı (Etibarnamə üçün)
                      </label>
                      <input
                        type="text"
                        id="company_name"
                        name="company_name"
                        value={formData.company_name}
                        onChange={handleChange}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Şirkət adını daxil edin"
                      />
                    </div>
                    <div>
                      <label htmlFor="voen" className="block text-sm font-medium text-gray-700 mb-2">
                        VÖEN (Etibarnamə üçün)
                      </label>
                      <input
                        type="text"
                        id="voen"
                        name="voen"
                        value={formData.voen}
                        onChange={handleChange}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="VÖEN nömrəsini daxil edin"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Conditional Fields based on Customer Type */}
          {formData.customer_type === CustomerType.INDIVIDUAL ? (
            <>
              {/* Individual Customer Fields */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label
                    htmlFor="first_name"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    {t("common.firstName")} *
                  </label>
                  <input
                    type="text"
                    id="first_name"
                    name="first_name"
                    value={formData.first_name}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder={t("common.enterFirstName")}
                  />
                </div>
                <div>
                  <label
                    htmlFor="last_name"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    {t("common.lastName")} *
                  </label>
                  <input
                    type="text"
                    id="last_name"
                    name="last_name"
                    value={formData.last_name}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder={t("common.enterLastName")}
                  />
                </div>
              </div>

              {/* Father Name and Phone */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label
                    htmlFor="father_name"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    {t("common.fatherName")} *
                  </label>
                  <input
                    type="text"
                    id="father_name"
                    name="father_name"
                    value={formData.father_name}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder={t("common.enterFatherName")}
                  />
                </div>
                <div>
                  <label
                    htmlFor="phone"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    {t("common.phone")} *
                  </label>
                  <input
                    type="tel"
                    id="phone"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder={t("common.enterPhoneNumber")}
                  />
                </div>
              </div>

              {/* National ID */}
              <div>
                <label
                  htmlFor="national_id"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  {t("common.nationalId")} *
                </label>
                <input
                  type="text"
                  id="national_id"
                  name="national_id"
                  value={formData.national_id}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder={t("common.enterNationalId")}
                />
              </div>
            </>
          ) : (
            <>
              {/* Company Customer Fields */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label
                    htmlFor="company_name"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    {t("common.companyName")} *
                  </label>
                  <input
                    type="text"
                    id="company_name"
                    name="company_name"
                    value={formData.company_name}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder={t("common.enterCompanyName")}
                  />
                </div>
                <div>
                  <label
                    htmlFor="voen"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    {t("common.voen")} *
                  </label>
                  <input
                    type="text"
                    id="voen"
                    name="voen"
                    value={formData.voen}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder={t("common.enterVoen")}
                  />
                </div>
              </div>

              {/* Phone */}
              <div>
                <label
                  htmlFor="phone"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  {t("common.phone")} *
                </label>
                <input
                  type="tel"
                  id="phone"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder={t("common.enterPhoneNumber")}
                />
              </div>
            </>
          )}

          {/* Address */}
          <div>
            <label
              htmlFor="address"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              {t("common.address")} *
            </label>
            <input
              type="text"
              id="address"
              name="address"
              value={formData.address}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder={t("common.enterFullAddress")}
            />
          </div>

          {/* License Information - Show only for individual customers without company checkbox */}
          {formData.customer_type === CustomerType.INDIVIDUAL && !useCompanyDetailsForEtibarname && (
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                {t("common.licenseInformation")}
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label
                    htmlFor="license_number"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    {t("common.licenseNumber")}
                  </label>
                  <input
                    type="text"
                    id="license_number"
                    name="license_number"
                    value={formData.license_number}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder={t("common.enterLicenseNumber")}
                  />
                </div>
                <div>
                  <label
                    htmlFor="license_category"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    {t("common.licenseCategory")}
                  </label>
                  <input
                    type="text"
                    id="license_category"
                    name="license_category"
                    value={formData.license_category}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder={t("common.enterLicenseCategory")}
                  />
                </div>
                <div>
                  <label
                    htmlFor="license_given_date"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    {t("common.licenseGivenDate")}
                  </label>
                  <ImprovedDateInput
                    value={formData.license_given_date}
                    onChange={(value) =>
                      setFormData((prev) => ({
                        ...prev,
                        license_given_date: value,
                      }))
                    }
                    placeholder={t("common.enterLicenseGivenDate")}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Contact Information */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">
                {t("common.contactInformation")}
              </h3>
              <button
                type="button"
                onClick={addContact}
                className="inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded-lg text-blue-600 bg-blue-50 hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <Plus className="w-4 h-4 mr-1" />
                {t("common.addContact")}
              </button>
            </div>

            {contacts.length === 0 ? (
              <div className="text-center py-8 border-2 border-dashed border-gray-300 rounded-lg">
                <User className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-500">{t("common.noContactsAdded")}</p>
                <p className="text-sm text-gray-400 mt-1">
                  {t("common.clickAddContactToAddInfo")}
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {contacts.map((contact, index) => (
                  <div
                    key={contact.id}
                    className="bg-gray-50 rounded-lg p-4 border border-gray-200"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-sm font-medium text-gray-700">
                        {index + 1}. {t("common.contact")}
                      </h4>
                      <button
                        type="button"
                        onClick={() => removeContact(contact.id)}
                        className="text-red-500 hover:text-red-700 p-1"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          {t("common.contactName")} *
                        </label>
                        <input
                          type="text"
                          value={contact.first_name}
                          onChange={(e) =>
                            updateContact(
                              contact.id,
                              "first_name",
                              e.target.value
                            )
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder={t("common.enterFirstName")}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          {t("common.contactSurname")} *
                        </label>
                        <input
                          type="text"
                          value={contact.last_name}
                          onChange={(e) =>
                            updateContact(
                              contact.id,
                              "last_name",
                              e.target.value
                            )
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder={t("common.enterLastName")}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          {t("common.relationship")} *
                        </label>
                        <input
                          type="text"
                          value={contact.relationship}
                          onChange={(e) =>
                            updateContact(
                              contact.id,
                              "relationship",
                              e.target.value
                            )
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder={t("common.enterRelationship")}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          {t("common.contactPhone")} *
                        </label>
                        <input
                          type="tel"
                          value={contact.phone}
                          onChange={(e) =>
                            updateContact(contact.id, "phone", e.target.value)
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder={t("common.enterContactPhone")}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Submit Button */}
          <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={() => navigate("/customers")}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              {t("common.cancel")}
            </button>
            <button
              type="submit"
              disabled={
                isSubmitting ||
                !formData.company_id ||
                (formData.customer_type === CustomerType.INDIVIDUAL &&
                  (!formData.first_name || !formData.last_name)) ||
                (formData.customer_type === CustomerType.COMPANY &&
                  (!formData.company_name || !formData.voen))
              }
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Save className="w-4 h-4 mr-2" />
              {isSubmitting ? t("common.saving") : t("common.saveChanges")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CustomerEdit;

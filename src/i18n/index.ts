import i18n from "i18next";
import { initReactI18next, useTranslation } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";

import enTranslations from "./locales/en.json";
import azTranslations from "./locales/az.json";

const resources = {
  en: {
    translation: enTranslations,
  },
  az: {
    translation: azTranslations,
  },
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: "en",
    debug: false, // Disable debug for production
    interpolation: {
      escapeValue: false,
    },
    detection: {
      order: ["localStorage", "navigator"],
      caches: ["localStorage"],
    },
    lng: "az", // Set default language to Azerbaijani
    keySeparator: ".",
    nsSeparator: ":",
    returnEmptyString: false,
    returnNull: false,
    returnObjects: false,
    returnKey: false,
    returnDetails: false,
    missingKeyHandler: (lng, ns, key) => {
      console.warn(`Missing translation key: ${key} for language: ${lng}`);
    },
  })
  .then(() => {});

export default i18n;
export { useTranslation };

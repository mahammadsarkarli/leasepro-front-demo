import i18n from "i18next";
import { initReactI18next, useTranslation } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";

import enTranslations from "./locales/en.json";
import azTranslations from "./locales/az.json";
import ruTranslations from "./locales/ru.json";

const resources = {
  en: {
    translation: enTranslations,
  },
  az: {
    translation: azTranslations,
  },
  ru: {
    translation: ruTranslations,
  },
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: "en",
    debug: true, // Enable debug to see translation issues
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
    // Ensure translations are loaded correctly
    load: 'languageOnly',
    cleanCode: true,
  })
  .then(() => {});

export default i18n;
export { useTranslation };

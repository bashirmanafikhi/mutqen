import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

// Load translations from local JSON files
const resources = {
  en: {
    translation: require('../locales/en/translation.json'),
  },
  ar: {
    translation: require('../locales/ar/translation.json'),
  },
};

i18n.use(initReactI18next).init({
  resources,
  lng: 'ar',
  fallbackLng: 'ar',
  interpolation: {
    escapeValue: false,
  },
  compatibilityJSON: 'v4',
});

export default i18n;

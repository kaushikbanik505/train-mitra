import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import en from './locales/en.json';
import hi from './locales/hi.json';
import bn from './locales/bn.json';
import ta from './locales/ta.json';
import mr from './locales/mr.json';
import kn from './locales/kn.json';
import pa from './locales/pa.json';
import or from './locales/or.json';
import te from './locales/te.json';

export const SUPPORTED_LANGUAGES = ['en', 'hi', 'bn', 'ta', 'mr', 'kn', 'pa', 'or', 'te'];

const stored = localStorage.getItem('language');
const initialLanguage = SUPPORTED_LANGUAGES.includes(stored) ? stored : 'en';

i18n.use(initReactI18next).init({
  resources: {
    en: { translation: en },
    hi: { translation: hi },
    bn: { translation: bn },
    ta: { translation: ta },
    mr: { translation: mr },
    kn: { translation: kn },
    pa: { translation: pa },
    or: { translation: or },
    te: { translation: te },
  },
  lng: initialLanguage,
  fallbackLng: 'en',
  interpolation: { escapeValue: false },
});

export function changeLanguage(code) {
  i18n.changeLanguage(code);
  localStorage.setItem('language', code);
}

export default i18n;

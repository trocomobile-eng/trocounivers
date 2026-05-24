import i18n from "i18next";
import { initReactI18next } from "react-i18next";

import fr from "../locales/fr/translation.json";
import en from "../locales/en/translation.json";

function getInitialLanguage() {
  try {
    const savedLanguage = localStorage.getItem("troco-lang");

    if (savedLanguage === "fr" || savedLanguage === "en") {
      return savedLanguage;
    }
  } catch (error) {
    console.log(error);
  }

  const browserLanguage = navigator.language?.slice(0, 2);

  if (browserLanguage === "en") {
    return "en";
  }

  return "fr";
}

i18n.use(initReactI18next).init({
  resources: {
    fr: {
      translation: fr,
    },
    en: {
      translation: en,
    },
  },
  lng: getInitialLanguage(),
  fallbackLng: "fr",
  interpolation: {
    escapeValue: false,
  },
});

export default i18n;

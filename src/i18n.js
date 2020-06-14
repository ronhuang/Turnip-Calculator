import i18n from "i18next";
import LanguageDetector from "i18next-browser-languagedetector";
import { translations } from "./locales";

i18n
  .use(LanguageDetector)
  .init({
    // we init with resources
    debug: process.env.NODE_ENV === "development",
    detection: {
      // order and from where user language should be detected
      order: [
        "querystring",
        "cookie",
        "localStorage",
        "navigator",
        "htmlTag",
        "path",
        "subdomain",
      ],
    },

    fallbackLng: "zh-TW",

    keySeparator: false, // we use content as keys

    interpolation: {
      escapeValue: false,
    },

    resources: translations,

    // have a common namespace used around the full app
    ns: ["translations"],
    defaultNS: "translations",
  });

export default i18n;

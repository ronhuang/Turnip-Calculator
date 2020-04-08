const i18n = require("i18next");
const LanguageDetector = require("i18next-browser-languagedetector");
const XHR = require("i18next-xhr-backend");

const translationEn = require("../locales/en/translation.json");
const translationEs = require("../locales/es/translation.json");
const translationDe = require("../locales/de/translation.json");
const translationFr = require("../locales/fr/translation.json");
const translationZh = require("../locales/zh/translation.json");
const translationZhTW = require("../locales/zh-TW/translation.json");

i18n
  .use(XHR)
  .use(LanguageDetector)
  .init({
    // we init with resources
    debug: true,
    detection: {
      // order and = require("where user language should be detected
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

    fallbackLng: "en",

    keySeparator: false, // we use content as keys

    interpolation: {
      escapeValue: false,
    },

    resources: {
      en: {
        translations: translationEn,
      },
      es: {
        translations: translationEs,
      },
      de: {
        translations: translationDe,
      },
      fr: {
        translations: translationFr,
      },
      zh: {
        translations: translationZh,
      },
      "zh-TW": {
        translations: translationZhTW,
      },
    },

    // have a common namespace used around the full app
    ns: ["translations"],
    defaultNS: "translations",
  });

module.exports = i18n;

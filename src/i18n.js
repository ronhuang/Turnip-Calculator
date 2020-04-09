const i18n = require("i18next");
const LanguageDetector = require("i18next-browser-languagedetector");

const translationEn = require("../locales/en/translation.json");
const translationEs = require("../locales/es/translation.json");
const translationDe = require("../locales/de/translation.json");
const translationFr = require("../locales/fr/translation.json");
const translationIt = require("../locales/it/translation.json");
const translationKr = require("../locales/kr/translation.json");
const translationZhCN = require("../locales/zh-CN/translation.json");
const translationZhTW = require("../locales/zh-TW/translation.json");
const translationZhHK = require("../locales/zh-HK/translation.json");

i18n
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

    fallbackLng: "zh-TW",

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
      it: {
        translations: translationIt,
      },
      kr: {
        translations: translationKr,
      },
      zh: {
        translations: translationZhCN,
      },
      "zh-CN": {
        translations: translationZhCN,
      },
      "zh-TW": {
        translations: translationZhTW,
      },
      "zh-HK": {
        translations: translationZhHK,
      },
    },

    // have a common namespace used around the full app
    ns: ["translations"],
    defaultNS: "translations",
  });

module.exports = i18n;

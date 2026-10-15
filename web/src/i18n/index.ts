import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import th from "./th.json";
import en from "./en.json";

const KEY = "bs.lang";
function stored(): string {
  try {
    return localStorage.getItem(KEY) ?? "th";
  } catch {
    return "th";
  }
}

void i18n.use(initReactI18next).init({
  resources: { th: { translation: th }, en: { translation: en } },
  lng: stored(),
  fallbackLng: "th",
  interpolation: { escapeValue: false },
});

i18n.on("languageChanged", (lng) => {
  document.documentElement.lang = lng;
  try {
    localStorage.setItem(KEY, lng);
  } catch {
    /* storage unavailable */
  }
});
document.documentElement.lang = i18n.language;

export default i18n;

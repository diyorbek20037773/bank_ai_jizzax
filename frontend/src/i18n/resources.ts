import common from "./locales/common";
import menu from "./locales/menu";
import login from "./locales/login";
import dashboard from "./locales/dashboard";
import assets from "./locales/assets";
import assetDetail from "./locales/assetDetail";
import assetForm from "./locales/assetForm";
import directory from "./locales/directory";
import audit from "./locales/audit";
import ai from "./locales/ai";
import requests from "./locales/requests";
import qr from "./locales/qr";
import myAssets from "./locales/myAssets";

export const LANGS = ["uz", "ru", "en"] as const;
export type Lang = (typeof LANGS)[number];

export const LANG_LABELS: Record<Lang, string> = {
  uz: "O'zbekcha",
  ru: "Русский",
  en: "English",
};

export const LANG_SHORT: Record<Lang, string> = {
  uz: "UZ",
  ru: "RU",
  en: "EN",
};

// Har bir namespace moduli { uz, ru, en } shaklida bo'ladi.
const modules: Record<string, any> = {
  common,
  menu,
  login,
  dashboard,
  assets,
  assetDetail,
  assetForm,
  directory,
  audit,
  ai,
  requests,
  qr,
  myAssets,
};

type Dict = Record<string, any>;

export const resources: Record<Lang, Dict> = { uz: {}, ru: {}, en: {} };
for (const [ns, mod] of Object.entries(modules)) {
  for (const lang of LANGS) {
    resources[lang][ns] = (mod && mod[lang]) || {};
  }
}

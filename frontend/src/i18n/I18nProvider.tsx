import { createContext, useContext, useState, useCallback, type ReactNode } from "react";
import { resources, LANGS, type Lang } from "./resources";

const STORAGE_KEY = "lang";

function detectInitial(): Lang {
  const saved = localStorage.getItem(STORAGE_KEY) as Lang | null;
  if (saved && LANGS.includes(saved)) return saved;
  const nav = navigator.language?.slice(0, 2).toLowerCase();
  if (nav === "ru") return "ru";
  if (nav === "en") return "en";
  return "uz";
}

function lookup(dict: any, path: string): string | undefined {
  return path.split(".").reduce((acc, key) => (acc == null ? undefined : acc[key]), dict);
}

type TFunc = (key: string, vars?: Record<string, string | number>) => string;

interface I18nValue {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: TFunc;
}

const I18nContext = createContext<I18nValue | null>(null);

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(detectInitial);

  const setLang = useCallback((l: Lang) => {
    localStorage.setItem(STORAGE_KEY, l);
    document.documentElement.setAttribute("lang", l);
    setLangState(l);
  }, []);

  const t = useCallback<TFunc>(
    (key, vars) => {
      let val = lookup(resources[lang], key);
      if (val == null) val = lookup(resources.uz, key); // fallback uz
      if (val == null) return key;
      if (vars) {
        return Object.keys(vars).reduce(
          (s, k) => s.replace(new RegExp(`\\{${k}\\}`, "g"), String(vars[k])),
          val
        );
      }
      return val;
    },
    [lang]
  );

  return <I18nContext.Provider value={{ lang, setLang, t }}>{children}</I18nContext.Provider>;
}

export function useI18n(): I18nValue {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useI18n must be used within I18nProvider");
  return ctx;
}

// Qulaylik uchun: const { t } = useT()
export function useT() {
  return useI18n();
}

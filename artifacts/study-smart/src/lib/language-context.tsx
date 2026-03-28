import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { useAuth } from "@workspace/replit-auth-web";
import { type LangCode, type Translations, LANGUAGES, getTranslations } from "./languages";

interface LanguageContextValue {
  lang: LangCode;
  t: Translations;
  isRTL: boolean;
  setLang: (code: LangCode) => void;
}

const LanguageContext = createContext<LanguageContextValue>({
  lang: "en",
  t: getTranslations("en"),
  isRTL: false,
  setLang: () => {},
});

export function LanguageProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [lang, setLangState] = useState<LangCode>(() => {
    const stored = localStorage.getItem("mind-forge-lang") as LangCode | null;
    return stored ?? "en";
  });

  useEffect(() => {
    const userLang = (user as { preferredLanguage?: string } | null)?.preferredLanguage as LangCode | undefined;
    if (userLang && LANGUAGES.find(l => l.code === userLang)) {
      setLangState(userLang);
      localStorage.setItem("mind-forge-lang", userLang);
    }
  }, [user]);

  useEffect(() => {
    const langDef = LANGUAGES.find(l => l.code === lang);
    if (langDef?.rtl) {
      document.documentElement.dir = "rtl";
      document.documentElement.lang = lang;
    } else {
      document.documentElement.dir = "ltr";
      document.documentElement.lang = lang;
    }
  }, [lang]);

  const setLang = (code: LangCode) => {
    setLangState(code);
    localStorage.setItem("mind-forge-lang", code);
  };

  const langDef = LANGUAGES.find(l => l.code === lang);
  const t = getTranslations(lang);

  return (
    <LanguageContext.Provider value={{ lang, t, isRTL: langDef?.rtl ?? false, setLang }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  return useContext(LanguageContext);
}

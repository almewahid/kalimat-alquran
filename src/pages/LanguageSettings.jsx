import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Globe, Check } from "lucide-react";
import { motion } from "framer-motion";
import { useToast } from "@/components/ui/use-toast";

/**
 * 🌍 إعدادات اللغة
 * 
 * دعم تعدد اللغات - العربية والإنجليزية
 */

const LANGUAGES = {
  ar: {
    code: "ar",
    name: "العربية",
    nativeName: "العربية",
    flag: "🇸🇦",
    dir: "rtl"
  },
  en: {
    code: "en",
    name: "English",
    nativeName: "English",
    flag: "🇬🇧",
    dir: "ltr"
  }
};

const TRANSLATIONS = {
  ar: {
    title: "اللغة",
    description: "اختر لغة التطبيق",
    currentLanguage: "اللغة الحالية",
    changeLanguage: "تغيير اللغة",
    saved: "تم الحفظ!",
    savedDescription: "تم تغيير اللغة بنجاح"
  },
  en: {
    title: "Language",
    description: "Choose app language",
    currentLanguage: "Current Language",
    changeLanguage: "Change Language",
    saved: "Saved!",
    savedDescription: "Language changed successfully"
  }
};

export default function LanguageSettings() {
  const { toast } = useToast();
  const [user, setUser] = useState(null);
  const [currentLanguage, setCurrentLanguage] = useState("ar");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadLanguage();
  }, []);

  const loadLanguage = async () => {
    try {
      const currentUser = await base44.auth.me();
      setUser(currentUser);
      const lang = currentUser?.preferences?.language || "ar";
      setCurrentLanguage(lang);
      
      // Apply direction
      document.documentElement.dir = LANGUAGES[lang].dir;
    } catch (error) {
      console.error("Error loading language:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const changeLanguage = async (langCode) => {
    try {
      const updatedPreferences = {
        ...user.preferences,
        language: langCode
      };

      await base44.auth.updateMe({ preferences: updatedPreferences });
      
      setCurrentLanguage(langCode);
      document.documentElement.dir = LANGUAGES[langCode].dir;

      const t = TRANSLATIONS[langCode];
      toast({
        title: t.saved,
        description: t.savedDescription,
        className: "bg-green-100 text-green-800"
      });

      // Reload to apply language
      setTimeout(() => window.location.reload(), 1000);

    } catch (error) {
      console.error("Error changing language:", error);
    }
  };

  if (isLoading) {
    return <div className="p-6 text-center">Loading...</div>;
  }

  const t = TRANSLATIONS[currentLanguage];

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
        <div className="text-center mb-8">
          <Globe className="w-16 h-16 text-primary mx-auto mb-4" />
          <h1 className="text-4xl font-bold gradient-text mb-2">{t.title}</h1>
          <p className="text-foreground/70">{t.description}</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>{t.currentLanguage}: {LANGUAGES[currentLanguage].nativeName} {LANGUAGES[currentLanguage].flag}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {Object.values(LANGUAGES).map((lang) => (
              <motion.div
                key={lang.code}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Card
                  className={`cursor-pointer transition-all ${
                    currentLanguage === lang.code
                      ? 'border-2 border-primary bg-primary/10'
                      : 'border-border hover:border-primary/50'
                  }`}
                  onClick={() => changeLanguage(lang.code)}
                >
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <span className="text-5xl">{lang.flag}</span>
                        <div>
                          <h3 className="text-2xl font-bold">{lang.nativeName}</h3>
                          <p className="text-foreground/70">{lang.name}</p>
                        </div>
                      </div>
                      {currentLanguage === lang.code && (
                        <Check className="w-8 h-8 text-primary" />
                      )}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Globe, Download, Copy, Check } from "lucide-react";
import { supabaseClient } from "@/components/api/supabaseClient";

/**
 * 🌍 أداة مساعدة للترجمة
 * استخدم GPT لترجمة النصوص العربية إلى الإنجليزية
 */

export default function TranslationHelper() {
  const [arabicText, setArabicText] = useState("");
  const [englishText, setEnglishText] = useState("");
  const [isTranslating, setIsTranslating] = useState(false);
  const [copied, setCopied] = useState(false);

  const translateText = async () => {
    if (!arabicText.trim()) return;

    setIsTranslating(true);
    try {
      // MyMemory API مجاني بدون مفتاح - حد 500 حرف لكل طلب
      const chunks = arabicText.match(/.{1,500}/gs) || [];
      const translations = await Promise.all(
        chunks.map(async (chunk) => {
          const res = await fetch(
            `https://api.mymemory.translated.net/get?q=${encodeURIComponent(chunk)}&langpair=ar|en`
          );
          const json = await res.json();
          if (json.responseStatus !== 200) throw new Error(json.responseDetails || "فشل الترجمة");
          return json.responseData.translatedText;
        })
      );
      setEnglishText(translations.join(""));
    } catch (error) {
      console.error("Translation error:", error);
      alert("خطأ في الترجمة: " + error.message);
    } finally {
      setIsTranslating(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(englishText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const downloadTranslation = () => {
    const blob = new Blob([englishText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'translation_en.txt';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-primary">
            <Globe className="w-6 h-6" />
            أداة الترجمة التلقائية
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert className="bg-blue-50 border-blue-200">
            <AlertDescription className="text-sm">
              💡 <strong>كيفية الاستخدام:</strong><br/>
              1. الصق النص العربي (يمكن أن يكون JSON أو نص عادي)<br/>
              2. اضغط "ترجم إلى الإنجليزية"<br/>
              3. انسخ الترجمة أو حملها كملف
            </AlertDescription>
          </Alert>

          <div className="grid md:grid-cols-2 gap-4">
            {/* Arabic Input */}
            <div>
              <label className="block text-sm font-medium mb-2 text-foreground/80">
                النص العربي
              </label>
              <Textarea
                value={arabicText}
                onChange={(e) => setArabicText(e.target.value)}
                placeholder='الصق النص العربي هنا...'
                className="h-96 font-mono text-sm"
                dir="rtl"
              />
            </div>

            {/* English Output */}
            <div>
              <label className="block text-sm font-medium mb-2 text-foreground/80">
                الترجمة الإنجليزية
              </label>
              <Textarea
                value={englishText}
                readOnly
                placeholder="English translation will appear here..."
                className="h-96 font-mono text-sm"
                dir="ltr"
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 justify-center">
            <Button
              onClick={translateText}
              disabled={isTranslating || !arabicText.trim()}
              className="bg-primary hover:bg-primary/90"
            >
              {isTranslating ? (
                <>جارٍ الترجمة...</>
              ) : (
                <>
                  <Globe className="w-4 h-4 ml-2" />
                  ترجم إلى الإنجليزية
                </>
              )}
            </Button>

            {englishText && (
              <>
                <Button
                  onClick={copyToClipboard}
                  variant="outline"
                  className="gap-2"
                >
                  {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  {copied ? "تم النسخ!" : "نسخ"}
                </Button>

                <Button
                  onClick={downloadTranslation}
                  variant="outline"
                  className="gap-2"
                >
                  <Download className="w-4 h-4" />
                  تحميل
                </Button>
              </>
            )}
          </div>

          {/* Example */}
          <Alert className="bg-green-50 border-green-200">
            <AlertDescription className="text-sm">
              <strong>مثال:</strong><br/>
              <code className="block mt-2 p-2 bg-white rounded text-xs">
                {`{
  "dashboard": {
    "welcome": "أهلاً وسهلاً",
    "continueJourney": "لنواصل رحلة التعلم"
  }
}`}
              </code>
              <br/>
              سيتم ترجمته إلى:
              <code className="block mt-2 p-2 bg-white rounded text-xs">
                {`{
  "dashboard": {
    "welcome": "Welcome",
    "continueJourney": "Let's continue the learning journey"
  }
}`}
              </code>
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    </div>
  );
}
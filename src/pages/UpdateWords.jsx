import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, CheckCircle, AlertCircle, RefreshCw, Database } from "lucide-react";
import { motion } from "framer-motion";

const SURAH_DATA = [
  { number: 1, name: "الفاتحة" }, { number: 2, name: "البقرة" }, { number: 3, name: "آل عمران" },
  { number: 4, name: "النساء" }, { number: 5, name: "المائدة" }, { number: 6, name: "الأنعام" },
  { number: 7, name: "الأعراف" }, { number: 8, name: "الأنفال" }, { number: 9, name: "التوبة" },
  { number: 10, name: "يونس" }, { number: 11, name: "هود" }, { number: 12, name: "يوسف" },
  { number: 13, name: "الرعد" }, { number: 14, name: "إبراهيم" }, { number: 15, name: "الحجر" },
  { number: 16, name: "النحل" }, { number: 17, name: "الإسراء" }, { number: 18, name: "الكهف" },
  { number: 19, name: "مريم" }, { number: 20, name: "طه" }, { number: 21, name: "الأنبياء" },
  { number: 22, name: "الحج" }, { number: 23, name: "المؤمنون" }, { number: 24, name: "النور" },
  { number: 25, name: "الفرقان" }, { number: 26, name: "الشعراء" }, { number: 27, name: "النمل" },
  { number: 28, name: "القصص" }, { number: 29, name: "العنكبوت" }, { number: 30, name: "الروم" },
  { number: 31, name: "لقمان" }, { number: 32, name: "السجدة" }, { number: 33, name: "الأحزاب" },
  { number: 34, name: "سبأ" }, { number: 35, name: "فاطر" }, { number: 36, name: "يس" },
  { number: 37, name: "الصافات" }, { number: 38, name: "ص" }, { number: 39, name: "الزمر" },
  { number: 40, name: "غافر" }, { number: 41, name: "فصلت" }, { number: 42, name: "الشورى" },
  { number: 43, name: "الزخرف" }, { number: 44, name: "الدخان" }, { number: 45, name: "الجاثية" },
  { number: 46, name: "الأحقاف" }, { number: 47, name: "محمد" }, { number: 48, name: "الفتح" },
  { number: 49, name: "الحجرات" }, { number: 50, name: "ق" }, { number: 51, name: "الذاريات" },
  { number: 52, name: "الطور" }, { number: 53, name: "النجم" }, { number: 54, name: "القمر" },
  { number: 55, name: "الرحمن" }, { number: 56, name: "الواقعة" }, { number: 57, name: "الحديد" },
  { number: 58, name: "المجادلة" }, { number: 59, name: "الحشر" }, { number: 60, name: "الممتحنة" },
  { number: 61, name: "الصف" }, { number: 62, name: "الجمعة" }, { number: 63, name: "المنافقون" },
  { number: 64, name: "التغابن" }, { number: 65, name: "الطلاق" }, { number: 66, name: "التحريم" },
  { number: 67, name: "الملك" }, { number: 68, name: "القلم" }, { number: 69, name: "الحاقة" },
  { number: 70, name: "المعارج" }, { number: 71, name: "نوح" }, { number: 72, name: "الجن" },
  { number: 73, name: "المزمل" }, { number: 74, name: "المدثر" }, { number: 75, name: "القيامة" },
  { number: 76, name: "الإنسان" }, { number: 77, name: "المرسلات" }, { number: 78, name: "النبأ" },
  { number: 79, name: "النازعات" }, { number: 80, name: "عبس" }, { number: 81, name: "التكوير" },
  { number: 82, name: "الانفطار" }, { number: 83, name: "المطففين" }, { number: 84, name: "الانشقاق" },
  { number: 85, name: "البروج" }, { number: 86, name: "الطارق" }, { number: 87, name: "الأعلى" },
  { number: 88, name: "الغاشية" }, { number: 89, name: "الفجر" }, { number: 90, name: "البلد" },
  { number: 91, name: "الشمس" }, { number: 92, name: "الليل" }, { number: 93, name: "الضحى" },
  { number: 94, name: "الشرح" }, { number: 95, name: "التين" }, { number: 96, name: "العلق" },
  { number: 97, name: "القدر" }, { number: 98, name: "البينة" }, { number: 99, name: "الزلزلة" },
  { number: 100, name: "العاديات" }, { number: 101, name: "القارعة" }, { number: 102, name: "التكاثر" },
  { number: 103, name: "العصر" }, { number: 104, name: "الهمزة" }, { number: 105, name: "الفيل" },
  { number: 106, name: "قريش" }, { number: 107, name: "الماعون" }, { number: 108, name: "الكوثر" },
  { number: 109, name: "الكافرون" }, { number: 110, name: "النصر" }, { number: 111, name: "المسد" },
  { number: 112, name: "الإخلاص" }, { number: 113, name: "الفلق" }, { number: 114, name: "الناس" }
];

export default function UpdateWords() {
  const [isUpdating, setIsUpdating] = useState(false);
  const [progress, setProgress] = useState("");
  const [logs, setLogs] = useState([]);
  const [error, setError] = useState("");

  const addSurahNumbers = async () => {
    setIsUpdating(true);
    setError("");
    setLogs([]);
    setProgress("🔄 بدء تحديث الكلمات...");
    
    try {
      const allWords = await base44.asServiceRole.entities.QuranicWord.list();
      
      const logMsg = `📊 تم تحميل ${allWords.length} كلمة`;
      setLogs(prev => [...prev, logMsg]);
      
      let updated = 0;
      let skipped = 0;
      
      for (let i = 0; i < allWords.length; i++) {
        const word = allWords[i];
        
        // إذا كان surah_number موجود بالفعل، تخطي
        if (word.surah_number) {
          skipped++;
          continue;
        }
        
        // البحث عن رقم السورة من الاسم
        const surahInfo = SURAH_DATA.find(s => s.name === word.surah_name);
        
        if (surahInfo) {
          await base44.asServiceRole.entities.QuranicWord.update(word.id, {
            surah_number: surahInfo.number
          });
          
          updated++;
          
          if (updated % 50 === 0) {
            const progressMsg = `⏳ تم تحديث ${updated} من ${allWords.length} كلمة...`;
            setProgress(progressMsg);
            setLogs(prev => [...prev, progressMsg]);
          }
        } else {
          const warnMsg = `⚠️ لم يُعثر على رقم السورة لـ: ${word.surah_name} (الكلمة: ${word.word})`;
          setLogs(prev => [...prev, warnMsg]);
          skipped++;
        }
      }
      
      const finalMsg = `✅ تم التحديث بنجاح! (${updated} كلمة محدثة، ${skipped} تم تخطيها)`;
      setProgress(finalMsg);
      setLogs(prev => [...prev, finalMsg]);
      
    } catch (err) {
      const errorMsg = `❌ خطأ: ${err.message}`;
      setError(errorMsg);
      setLogs(prev => [...prev, errorMsg]);
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-3xl font-bold gradient-text text-center mb-8">
          🔧 تحديث بيانات الكلمات
        </h1>

        <Alert className="mb-6 bg-blue-50 dark:bg-blue-900/20 border-blue-200">
          <Database className="w-5 h-5 text-blue-600" />
          <AlertDescription className="text-blue-800 dark:text-blue-300">
            <div className="font-bold mb-2">📌 إضافة رقم السورة (surah_number)</div>
            <p className="text-sm">
              • إذا كانت الكلمات تحتوي فقط على <strong>surah_name</strong> (اسم السورة)<br/>
              • سيتم إضافة <strong>surah_number</strong> (رقم السورة) تلقائياً<br/>
              • هذا ضروري لتشغيل الصوت بشكل صحيح
            </p>
          </AlertDescription>
        </Alert>

        <Card className="bg-card border-border shadow-lg">
          <CardHeader>
            <CardTitle className="text-primary flex items-center gap-2">
              <RefreshCw className="w-6 h-6" />
              إضافة أرقام السور للكلمات
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button
              onClick={addSurahNumbers}
              disabled={isUpdating}
              size="lg"
              className="w-full bg-primary hover:bg-primary/90"
            >
              {isUpdating ? (
                <>
                  <Loader2 className="w-5 h-5 ml-2 animate-spin" />
                  جارٍ التحديث...
                </>
              ) : (
                <>
                  <RefreshCw className="w-5 h-5 ml-2" />
                  بدء التحديث
                </>
              )}
            </Button>

            {error && (
              <Alert className="bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800">
                <AlertCircle className="w-5 h-5 text-red-600" />
                <AlertDescription className="text-red-800 dark:text-red-300">
                  {error}
                </AlertDescription>
              </Alert>
            )}

            {progress && !error && (
              <Alert className="bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <AlertDescription className="text-green-800 dark:text-green-300">
                  {progress}
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>

        {logs.length > 0 && (
          <Card className="mt-6 bg-card border-border shadow-lg">
            <CardHeader>
              <CardTitle className="text-primary">سجل العمليات</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 max-h-96 overflow-y-auto p-4 border border-border rounded-md bg-background-soft">
                {logs.map((log, index) => (
                  <div key={index} className="text-sm text-foreground/80 font-mono">
                    {log}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </motion.div>
    </div>
  );
}
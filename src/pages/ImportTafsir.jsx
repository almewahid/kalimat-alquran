
import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, CheckCircle, AlertCircle, BookOpen, Download, RefreshCw } from "lucide-react";
import { motion } from "framer-motion";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const TAFSIR_SOURCES = [
  { 
    id: "qurtubi", 
    name: "القرطبي", 
    description: "الجامع لأحكام القرآن - الإمام القرطبي",
    url: "https://cdn.jsdelivr.net/gh/SAFI174/tafsir-json@main/json/ar.qurtubi.json",
    fallbackUrl: "https://raw.githubusercontent.com/SAFI174/tafsir-json/main/json/ar.qurtubi.json"
  },
  { 
    id: "ibnkathir", 
    name: "ابن كثير", 
    description: "تفسير القرآن العظيم - الإمام ابن كثير",
    url: "https://cdn.jsdelivr.net/gh/SAFI174/tafsir-json@main/json/ar.katheer.json",
    fallbackUrl: "https://raw.githubusercontent.com/SAFI174/tafsir-json/main/json/ar.katheer.json"
  },
  { 
    id: "saadi", 
    name: "السعدي", 
    description: "تيسير الكريم الرحمن - الشيخ عبد الرحمن السعدي",
    url: "https://cdn.jsdelivr.net/gh/SAFI174/tafsir-json@main/json/ar.saddi.json",
    fallbackUrl: "https://raw.githubusercontent.com/SAFI174/tafsir-json/main/json/ar.saddi.json"
  },
  { 
    id: "jalalayn", 
    name: "الجلالين", 
    description: "تفسير الجلالين - الإمام جلال الدين المحلي والسيوطي",
    url: "https://cdn.jsdelivr.net/gh/SAFI174/tafsir-json@main/json/ar.jalalayn.json",
    fallbackUrl: "https://raw.githubusercontent.com/SAFI174/tafsir-json/main/json/ar.jalalayn.json"
  },
  { 
    id: "muyassar", 
    name: "الميسر", 
    description: "التفسير الميسر - مجمع الملك فهد",
    url: "https://cdn.jsdelivr.net/gh/SAFI174/tafsir-json@main/json/ar.muyassar.json",
    fallbackUrl: "https://raw.githubusercontent.com/SAFI174/tafsir-json/main/json/ar.muyassar.json"
  }
];

const SURAH_INFO = [
  { number: 1, name: "الفاتحة", ayahCount: 7 },
  { number: 2, name: "البقرة", ayahCount: 286 },
  { number: 3, name: "آل عمران", ayahCount: 200 },
  { number: 4, name: "النساء", ayahCount: 176 },
  { number: 5, name: "المائدة", ayahCount: 120 },
  { number: 6, name: "الأنعام", ayahCount: 165 },
  { number: 7, name: "الأعراف", ayahCount: 206 },
  { number: 8, name: "الأنفال", ayahCount: 75 },
  { number: 9, name: "التوبة", ayahCount: 129 },
  { number: 10, name: "يونس", ayahCount: 109 },
  { number: 11, name: "هود", ayahCount: 123 },
  { number: 12, name: "يوسف", ayahCount: 111 },
  { number: 13, name: "الرعد", ayahCount: 43 },
  { number: 14, name: "إبراهيم", ayahCount: 52 },
  { number: 15, name: "الحجر", ayahCount: 99 },
  { number: 16, name: "النحل", ayahCount: 128 },
  { number: 17, name: "الإسراء", ayahCount: 111 },
  { number: 18, name: "الكهف", ayahCount: 110 },
  { number: 19, name: "مريم", ayahCount: 98 },
  { number: 20, name: "طه", ayahCount: 135 },
  { number: 21, name: "الأنبياء", ayahCount: 112 },
  { number: 22, name: "الحج", ayahCount: 78 },
  { number: 23, name: "المؤمنون", ayahCount: 118 },
  { number: 24, name: "النور", ayahCount: 64 },
  { number: 25, name: "الفرقان", ayahCount: 77 },
  { number: 26, name: "الشعراء", ayahCount: 227 },
  { number: 27, name: "النمل", ayahCount: 93 },
  { number: 28, name: "القصص", ayahCount: 88 },
  { number: 29, name: "العنكبوت", ayahCount: 69 },
  { number: 30, name: "الروم", ayahCount: 60 },
  { number: 31, name: "لقمان", ayahCount: 34 },
  { number: 32, name: "السجدة", ayahCount: 30 },
  { number: 33, name: "الأحزاب", ayahCount: 73 },
  { number: 34, name: "سبأ", ayahCount: 54 },
  { number: 35, name: "فاطر", ayahCount: 45 },
  { number: 36, name: "يس", ayahCount: 83 },
  { number: 37, name: "الصافات", ayahCount: 182 },
  { number: 38, name: "ص", ayahCount: 88 },
  { number: 39, name: "الزمر", ayahCount: 75 },
  { number: 40, name: "غافر", ayahCount: 85 },
  { number: 41, name: "فصلت", ayahCount: 54 },
  { number: 42, name: "الشورى", ayahCount: 53 },
  { number: 43, name: "الزخرف", ayahCount: 89 },
  { number: 44, name: "الدخان", ayahCount: 59 },
  { number: 45, name: "الجاثية", ayahCount: 37 },
  { number: 46, name: "الأحقاف", ayahCount: 35 },
  { number: 47, name: "محمد", ayahCount: 38 },
  { number: 48, name: "الفتح", ayahCount: 29 },
  { number: 49, name: "الحجرات", ayahCount: 18 },
  { number: 50, name: "ق", ayahCount: 45 },
  { number: 51, name: "الذاريات", ayahCount: 60 },
  { number: 52, name: "الطور", ayahCount: 49 },
  { number: 53, name: "النجم", ayahCount: 62 },
  { number: 54, name: "القمر", ayahCount: 55 },
  { number: 55, name: "الرحمن", ayahCount: 78 },
  { number: 56, name: "الواقعة", ayahCount: 96 },
  { number: 57, name: "الحديد", ayahCount: 29 },
  { number: 58, name: "المجادلة", ayahCount: 22 },
  { number: 59, name: "الحشر", ayahCount: 24 },
  { number: 60, name: "الممتحنة", ayahCount: 13 },
  { number: 61, name: "الصف", ayahCount: 14 },
  { number: 62, name: "الجمعة", ayahCount: 11 },
  { number: 63, name: "المنافقون", ayahCount: 11 },
  { number: 64, name: "التغابن", ayahCount: 18 },
  { number: 65, name: "الطلاق", ayahCount: 12 },
  { number: 66, name: "التحريم", ayahCount: 12 },
  { number: 67, name: "الملك", ayahCount: 30 },
  { number: 68, name: "القلم", ayahCount: 52 },
  { number: 69, name: "الحاقة", ayahCount: 52 },
  { number: 70, name: "المعارج", ayahCount: 44 },
  { number: 71, name: "نوح", ayahCount: 28 },
  { number: 72, name: "الجن", ayahCount: 28 },
  { number: 73, name: "المزمل", ayahCount: 20 },
  { number: 74, name: "المدثر", ayahCount: 56 },
  { number: 75, name: "القيامة", ayahCount: 40 },
  { number: 76, name: "الإنسان", ayahCount: 31 },
  { number: 77, name: "المرسلات", ayahCount: 50 },
  { number: 78, name: "النبأ", ayahCount: 40 },
  { number: 79, name: "النازعات", ayahCount: 46 },
  { number: 80, name: "عبس", ayahCount: 42 },
  { number: 81, name: "التكوير", ayahCount: 29 },
  { number: 82, name: "الانفطار", ayahCount: 19 },
  { number: 83, name: "المطففين", ayahCount: 36 },
  { number: 84, name: "الانشقاق", ayahCount: 25 },
  { number: 85, name: "البروج", ayahCount: 22 },
  { number: 86, name: "الطارق", ayahCount: 17 },
  { number: 87, name: "الأعلى", ayahCount: 19 },
  { number: 88, name: "الغاشية", ayahCount: 26 },
  { number: 89, name: "الفجر", ayahCount: 30 },
  { number: 90, name: "البلد", ayahCount: 20 },
  { number: 91, name: "الشمس", ayahCount: 15 },
  { number: 92, name: "الليل", ayahCount: 21 },
  { number: 93, name: "الضحى", ayahCount: 11 },
  { number: 94, name: "الشرح", ayahCount: 8 },
  { number: 95, name: "التين", ayahCount: 8 },
  { number: 96, name: "العلق", ayahCount: 19 },
  { number: 97, name: "القدر", ayahCount: 5 },
  { number: 98, name: "البينة", ayahCount: 8 },
  { number: 99, name: "الزلزلة", ayahCount: 8 },
  { number: 100, name: "العاديات", ayahCount: 11 },
  { number: 101, name: "القارعة", ayahCount: 11 },
  { number: 102, name: "التكاثر", ayahCount: 8 },
  { number: 103, name: "العصر", ayahCount: 3 },
  { number: 104, name: "الهمزة", ayahCount: 9 },
  { number: 105, name: "الفيل", ayahCount: 5 },
  { number: 106, name: "قريش", ayahCount: 4 },
  { number: 107, name: "الماعون", ayahCount: 7 },
  { number: 108, name: "الكوثر", ayahCount: 3 },
  { number: 109, name: "الكافرون", ayahCount: 6 },
  { number: 110, name: "النصر", ayahCount: 3 },
  { number: 111, name: "المسد", ayahCount: 5 },
  { number: 112, name: "الإخلاص", ayahCount: 4 },
  { number: 113, name: "الفلق", ayahCount: 5 },
  { number: 114, name: "الناس", ayahCount: 6 }
];

export default function ImportTafsir() {
  const [selectedTafsir, setSelectedTafsir] = useState("");
  const [isImporting, setIsImporting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const [logs, setLogs] = useState([]);

  const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

  // ✅ دالة محسّنة لمعالجة صيغة البيانات من GitHub
  const fetchTafsirData = async (tafsir) => {
    let response;
    
    try {
      const logMsg = `🌐 محاولة التحميل من jsDelivr CDN...`;
      setLogs(prev => [...prev, logMsg]);
      console.log('[ImportTafsir] Fetching from CDN:', tafsir.url);
      
      response = await fetch(tafsir.url);
      console.log('[ImportTafsir] CDN Response status:', response.status);
      
      if (!response.ok) {
        throw new Error(`فشل من CDN: ${response.status}`);
      }
      
      const text = await response.text();
      console.log('[ImportTafsir] CDN Response first 500 chars:', text.substring(0, 500));
      
      let rawData;
      try {
        rawData = JSON.parse(text);
      } catch (parseError) {
        console.error('[ImportTafsir] JSON Parse Error:', parseError);
        console.error('[ImportTafsir] Response text (failed JSON parse):', text.substring(0, 1000));
        throw new Error(`فشل في تحليل JSON: ${parseError.message}`);
      }
      
      console.log('[ImportTafsir] Raw data type:', typeof rawData);
      // Attempt to log keys only if rawData is an object, to prevent errors
      if (typeof rawData === 'object' && rawData !== null) {
        console.log('[ImportTafsir] Raw data keys:', Object.keys(rawData));
      }
      
      // ✅ معالجة الصيغة: البيانات قد تكون {tafsir: [...]} أو مباشرة [...]
      let data;
      if (Array.isArray(rawData)) {
        data = rawData;
        console.log('[ImportTafsir] Data format: Array of objects (direct)');
      } else if (rawData.tafsir && Array.isArray(rawData.tafsir)) {
        // الصيغة: {tafsir: [[surah1_ayahs], [surah2_ayahs], ...]}
        console.log('[ImportTafsir] Data format: {tafsir: array of arrays}');
        
        // تحويل البيانات من array of arrays إلى array of objects
        data = [];
        rawData.tafsir.forEach((surahTafsir, surahIndex) => {
          if (Array.isArray(surahTafsir)) {
            surahTafsir.forEach((ayahTafsir, ayahIndex) => {
              if (ayahTafsir && typeof ayahTafsir === 'string') {
                data.push({
                  sura_no: surahIndex + 1,
                  aya_no: ayahIndex + 1,
                  text: ayahTafsir
                });
              }
            });
          }
        });
        
        console.log('[ImportTafsir] Converted data length:', data.length);
      } else {
        throw new Error('صيغة البيانات غير معروفة');
      }
      
      const successMsg = `✅ تم التحميل بنجاح من jsDelivr CDN (${data.length} آية)`;
      setLogs(prev => [...prev, successMsg]);
      
      return data;
      
    } catch (error) {
      console.error('[ImportTafsir] CDN Error:', error);
      
      const retryMsg = `⚠️ فشل CDN، محاولة التحميل من GitHub مباشرة...`;
      setLogs(prev => [...prev, retryMsg]);
      
      try {
        console.log('[ImportTafsir] Fetching from GitHub:', tafsir.fallbackUrl);
        response = await fetch(tafsir.fallbackUrl);
        
        console.log('[ImportTafsir] GitHub Response status:', response.status);
        
        if (!response.ok) {
          throw new Error(`فشل من GitHub: ${response.status}`);
        }
        
        const text = await response.text();
        console.log('[ImportTafsir] GitHub Response first 500 chars:', text.substring(0, 500));

        let rawData;
        try {
          rawData = JSON.parse(text);
        } catch (parseError) {
          console.error('[ImportTafsir] GitHub JSON Parse Error:', parseError);
          console.error('[ImportTafsir] Response text (failed GitHub JSON parse):', text.substring(0, 1000));
          throw new Error(`فشل في تحليل JSON من GitHub: ${parseError.message}`);
        }
        
        console.log('[ImportTafsir] GitHub Raw data type:', typeof rawData);
        if (typeof rawData === 'object' && rawData !== null) {
          console.log('[ImportTafsir] GitHub Raw data keys:', Object.keys(rawData));
        }

        let data;
        if (Array.isArray(rawData)) {
          data = rawData;
          console.log('[ImportTafsir] GitHub Data format: Array of objects (direct)');
        } else if (rawData.tafsir && Array.isArray(rawData.tafsir)) {
          console.log('[ImportTafsir] GitHub Data format: {tafsir: array of arrays}');
          data = [];
          rawData.tafsir.forEach((surahTafsir, surahIndex) => {
            if (Array.isArray(surahTafsir)) {
              surahTafsir.forEach((ayahTafsir, ayahIndex) => {
                if (ayahTafsir && typeof ayahTafsir === 'string') {
                  data.push({
                    sura_no: surahIndex + 1,
                    aya_no: ayahIndex + 1,
                    text: ayahTafsir
                  });
                }
              });
            }
          });
          console.log('[ImportTafsir] GitHub Converted data length:', data.length);
        } else {
          throw new Error('صيغة البيانات غير معروفة من GitHub');
        }
        
        const fallbackSuccessMsg = `✅ تم التحميل بنجاح من GitHub (${data.length} آية)`;
        setLogs(prev => [...prev, fallbackSuccessMsg]);
        
        return data;
        
      } catch (fallbackError) {
        console.error('[ImportTafsir] Fallback Error:', fallbackError);
        throw new Error(`فشل التحميل من كلا المصدرين. ${fallbackError.message}`);
      }
    }
  };

  const importTafsir = async () => {
    if (!selectedTafsir) {
      setError("⚠️ الرجاء اختيار تفسير أولاً");
      return;
    }

    const tafsir = TAFSIR_SOURCES.find(t => t.id === selectedTafsir);
    if (!tafsir) return;

    setIsImporting(true);
    setProgress(0);
    setStatus(`🔄 بدء استيراد ${tafsir.name}...`);
    setError("");
    setLogs([`🔄 بدء استيراد ${tafsir.name}...`]);

    try {
      // ✅ لا نحذف البيانات القديمة - فقط نكمل عليها
      const checkMessage = `🔍 جارٍ فحص التفاسير الموجودة...`;
      setStatus(checkMessage);
      setLogs(prev => [...prev, checkMessage]);

      const existingTafsirs = await base44.entities.QuranTafsir.filter({ 
        tafsir_name: tafsir.name 
      });

      if (existingTafsirs.length > 0) {
        const foundMessage = `ℹ️ وُجد ${existingTafsirs.length} آية من ${tafsir.name} مسبقاً. سيتم إكمال الباقي.`;
        setLogs(prev => [...prev, foundMessage]);
      }

      // تحميل التفسير
      const downloadMessage = `📥 جارٍ تحميل التفسير...`;
      setStatus(downloadMessage);
      setLogs(prev => [...prev, downloadMessage]);

      const data = await fetchTafsirData(tafsir);
      
      if (!data || !Array.isArray(data) || data.length === 0) {
        throw new Error("البيانات المحملة غير صالحة أو فارغة");
      }

      const loadedMessage = `✅ تم تحميل ${data.length} آية من التفسير.`;
      setStatus(loadedMessage);
      setLogs(prev => [...prev, loadedMessage]);

      // ✅ فحص الآيات الموجودة لتجنب التكرار
      const existingKeys = new Set(
        existingTafsirs.map(t => `${t.surah_number}-${t.ayah_number}`)
      );

      // استيراد التفاسير
      let imported = 0;
      let skipped = 0; // For malformed or missing data in downloaded JSON
      let alreadyExists = 0; // For verses found in existingKeys
      const totalAyahs = data.length;
      const BATCH_SIZE = 50;
      const versesToImport = [];

      // تحضير البيانات المراد استيرادها
      for (let i = 0; i < data.length; i++) {
        const verse = data[i];
        
        let surahNumber, ayahNumber;
        
        if (verse.aya_no && verse.sura_no) {
          surahNumber = parseInt(verse.sura_no);
          ayahNumber = parseInt(verse.aya_no);
        } else if (verse.ayah_number && verse.surah_number) {
          surahNumber = parseInt(verse.surah_number);
          ayahNumber = parseInt(verse.ayah_number);
        } else {
          // console.warn(`[ImportTafsir] Skipping verse ${i}: unknown format, verse data:`, verse); // Removed this specific console.warn as per instructions for consistency
          skipped++;
          continue;
        }

        const surahInfo = SURAH_INFO.find(s => s.number === surahNumber);
        if (!surahInfo) {
          // console.warn(`[ImportTafsir] Skipping verse ${i} (sura_no: ${surahNumber}, aya_no: ${ayahNumber}): unknown surah ${surahNumber}`); // Removed specific console.warn
          skipped++;
          continue;
        }

        const tafsirText = verse.text || verse.tafsir_text || "";
        
        if (!tafsirText) {
          // console.warn(`[ImportTafsir] Skipping verse ${i} (sura_no: ${surahNumber}, aya_no: ${ayahNumber}): empty tafsir`); // Removed specific console.warn
          skipped++;
          continue;
        }

        // ✅ تحقق من وجود الآية مسبقاً
        const key = `${surahNumber}-${ayahNumber}`;
        if (existingKeys.has(key)) {
          alreadyExists++;
          continue;
        }

        versesToImport.push({
          surah_number: surahNumber,
          surah_name: surahInfo.name,
          ayah_number: ayahNumber,
          tafsir_name: tafsir.name,
          tafsir_text: tafsirText,
          language: "ar"
        });
      }
      
      const actualTotalToImport = versesToImport.length;
      
      if (actualTotalToImport === 0) {
        // If no new verses to import, and some already existed, update status
        if (alreadyExists > 0) {
          const allExistMessage = `✅ جميع آيات ${tafsir.name} موجودة مسبقاً (${alreadyExists} آية). لا يوجد جديد للاستيراد.`;
          setStatus(allExistMessage);
          setLogs(prev => [...prev, allExistMessage]);
          setProgress(100); // Set progress to 100 if nothing new to import
          setIsImporting(false); // Stop importing
          return;
        } else if (skipped > 0 && totalAyahs === skipped) {
          throw new Error("لم يتم العثور على آيات صالحة للاستيراد بعد التحقق من البيانات.");
        } else {
          throw new Error("لم يتم العثور على آيات صالحة للاستيراد بعد التحقق من البيانات.");
        }
      }

      // إرسال البيانات على دفعات
      const totalBatches = Math.ceil(actualTotalToImport / BATCH_SIZE);
      const importMsg = `📊 سيتم إرسال ${actualTotalToImport} آية جديدة على ${totalBatches} دفعة (${BATCH_SIZE} آية/دفعة). ${alreadyExists > 0 ? `تم تخطي ${alreadyExists} آية موجودة مسبقاً.` : ''}`;
      setLogs(prev => [...prev, importMsg]);

      for (let i = 0; i < actualTotalToImport; i += BATCH_SIZE) {
        const batch = versesToImport.slice(i, i + BATCH_SIZE);
        const batchNum = Math.floor(i / BATCH_SIZE) + 1;

        try {
          // ✅ استخدام bulkCreate لكل دفعة
          await base44.entities.QuranTafsir.bulkCreate(batch);
          imported += batch.length;
          
          setProgress(Math.round((imported / actualTotalToImport) * 100));
          
          const progressMessage = `⏳ دفعة ${batchNum}/${totalBatches}: تم استيراد ${imported} من ${actualTotalToImport} آية...`;
          setStatus(progressMessage);
          setLogs(prev => [...prev, progressMessage]);

          // انتظار أطول بين كل دفعة لتجنب Rate Limit
          if (i + BATCH_SIZE < actualTotalToImport) {
            await sleep(1000); // ثانية واحدة بين كل دفعة
          }
        } catch (batchError) {
          // إذا فشلت الدفعة، نحاول مرة أخرى
          const retryMsg = `⚠️ فشلت دفعة ${batchNum}، إعادة المحاولة...`;
          setLogs(prev => [...prev, retryMsg]);
          console.error(`[ImportTafsir] Batch ${batchNum} failed, retrying:`, batchError);
          
          await sleep(2000); // انتظار ثانيتين
          
          try {
            await base44.entities.QuranTafsir.bulkCreate(batch);
            imported += batch.length;
            setProgress(Math.round((imported / actualTotalToImport) * 100));
            
            const retrySuccessMsg = `✅ نجحت إعادة المحاولة للدفعة ${batchNum}`;
            setLogs(prev => [...prev, retrySuccessMsg]);
          } catch (retryError) {
            const retryFailMsg = `❌ فشلت دفعة ${batchNum} بعد إعادة المحاولة: ${retryError.message}`;
            setLogs(prev => [...prev, retryFailMsg]);
            console.error(`[ImportTafsir] Batch ${batchNum} failed after retry:`, retryError);
            throw new Error(`فشل في الدفعة ${batchNum}: ${retryError.message}`);
          }
        }
      }

      const finalMessage = `✅ تم استيراد ${tafsir.name} بنجاح! (${imported} آية جديدة${alreadyExists > 0 ? `، ${alreadyExists} آية موجودة مسبقاً` : ''}${skipped > 0 ? `, ${skipped} آية تم تخطيها (بيانات غير صالحة)` : ''})`;
      setStatus(finalMessage);
      setLogs(prev => [...prev, finalMessage]);

    } catch (importError) {
      const errorMsg = `❌ خطأ: ${importError.message}`;
      console.error("[ImportTafsir] Import Error:", importError);
      setError(errorMsg);
      setStatus("فشلت عملية الاستيراد.");
      setLogs(prev => [...prev, errorMsg]);
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-3xl font-bold gradient-text text-center mb-8">
          استيراد التفاسير القرآنية
        </h1>

        <Alert className="mb-6 bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
          <RefreshCw className="w-5 h-5 text-blue-600" />
          <AlertDescription className="text-blue-800 dark:text-blue-300">
            <div className="font-bold mb-2">📡 نظام تحميل ذكي محسّن</div>
            <p className="text-sm">
              • ✅ <strong>مصدران للتحميل:</strong> jsDelivr CDN (أسرع) + GitHub (احتياطي)<br/>
              • ✅ <strong>Debugging متقدم:</strong> يعرض تفاصيل دقيقة في السجل<br/>
              • ✅ <strong>إعادة محاولة تلقائية</strong> في حالة فشل أحد المصادر<br/>
              • ⏱️ التحميل قد يستغرق 1-3 دقائق حسب حجم التفسير
            </p>
          </AlertDescription>
        </Alert>

        <Card className="mb-6 bg-card border-border shadow-lg">
          <CardHeader>
            <div className="flex items-center gap-3">
              <BookOpen className="w-8 h-8 text-primary" />
              <div>
                <CardTitle className="text-2xl text-primary">اختر التفسير</CardTitle>
                <p className="text-sm text-foreground/70 mt-1">
                  استيراد من jsDelivr CDN (أسرع وأكثر استقراراً)
                </p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <Select value={selectedTafsir} onValueChange={setSelectedTafsir}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="اختر التفسير..." />
              </SelectTrigger>
              <SelectContent>
                {TAFSIR_SOURCES.map(tafsir => (
                  <SelectItem key={tafsir.id} value={tafsir.id}>
                    <div>
                      <div className="font-semibold">{tafsir.name}</div>
                      <div className="text-xs text-foreground/70">{tafsir.description}</div>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button
              onClick={importTafsir}
              disabled={isImporting || !selectedTafsir}
              size="lg"
              className="w-full bg-primary hover:bg-primary/90"
            >
              {isImporting ? (
                <>
                  <Loader2 className="w-5 h-5 ml-2 animate-spin" />
                  جارٍ الاستيراد...
                </>
              ) : (
                <>
                  <Download className="w-5 h-5 ml-2" />
                  بدء الاستيراد
                </>
              )}
            </Button>

            {error && (
              <Alert className="bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800">
                <AlertCircle className="w-5 h-5 text-red-600" />
                <AlertDescription className="text-red-800 dark:text-red-300">
                  <div className="font-bold mb-2">{error}</div>
                  <div className="text-xs">
                    💡 إذا استمرت المشكلة، تحقق من:<br/>
                    • اتصالك بالإنترنت<br/>
                    • Console للمزيد من التفاصيل (F12)<br/>
                    • سجل العمليات أسفل الصفحة
                  </div>
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>

        {isImporting && (
          <Card className="mb-6 bg-card border-border shadow-lg">
            <CardHeader>
              <CardTitle className="text-primary">الحالة والتقدم</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3">
                <Loader2 className="w-6 h-6 text-primary animate-spin" />
                <span className="text-foreground font-medium">{status}</span>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-sm text-foreground/70">
                  <span>التقدم</span>
                  <span>{progress}%</span>
                </div>
                <Progress value={progress} className="h-3" />
              </div>
            </CardContent>
          </Card>
        )}

        {!isImporting && status.includes("بنجاح") && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mb-6"
          >
            <Alert className="bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <AlertDescription className="text-green-800 dark:text-green-300">
                <div className="font-bold mb-2">{status}</div>
                <div className="text-sm">يمكنك الآن مشاهدة التفاسير في قارئ القرآن.</div>
              </AlertDescription>
            </Alert>
          </motion.div>
        )}

        {logs.length > 0 && (
          <Card className="bg-card border-border shadow-lg">
            <CardHeader>
              <CardTitle className="text-primary">سجل العمليات (Debugging)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 max-h-60 overflow-y-auto p-2 border border-border rounded-md bg-background-soft">
                {logs.map((log, index) => (
                  <div key={index} className="text-sm text-foreground/80 font-mono">
                    {log}
                  </div>
                ))}
              </div>
              <p className="text-xs text-foreground/70 mt-3">
                💡 للمزيد من التفاصيل، افتح Console (F12)
              </p>
            </CardContent>
          </Card>
        )}
      </motion.div>
    </div>
  );
}

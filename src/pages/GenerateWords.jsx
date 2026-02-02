import React, { useState } from "react";
import { supabaseClient } from "@/components/api/supabaseClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Upload, Sparkles, FileText, AlertTriangle,
  CheckCircle, Loader2, Zap, BookOpen, Brain, Wand2, PlusCircle, Image as ImageIcon
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useToast } from "@/components/ui/use-toast";

const SURAHS = [
  "الفاتحة", "البقرة", "آل عمران", "النساء", "المائدة", "الأنعام", "الأعراف", "الأنفال", "التوبة", "يونس",
  "هود", "يوسف", "الرعد", "إبراهيم", "الحجر", "النحل", "الإسراء", "الكهف", "مريم", "طه",
  "الأنبياء", "الحج", "المؤمنون", "النور", "الفرقان", "الشعراء", "النمل", "القصص", "العنكبوت", "الروم",
  "لقمان", "السجدة", "الأحزاب", "سبأ", "فاطر", "يس", "الصافات", "ص", "الزمر", "غافر",
  "فصلت", "الشورى", "الزخرف", "الدخان", "الجاثية", "الأحقاف", "محمد", "الفتح", "الحجرات", "ق",
  "الذاريات", "الطور", "النجم", "القمر", "الرحمن", "الواقعة", "الحديد", "المجادلة", "الحشر", "الممتحنة",
  "الصف", "الجمعة", "المنافقون", "التغابن", "الطلاق", "التحريم", "الملك", "القلم", "الحاقة", "المعارج",
  "نوح", "الجن", "المزمل", "المدثر", "القيامة", "الإنسان", "المرسلات", "النبأ", "النازعات", "عبس",
  "التكوير", "الانفطار", "المطففين", "الانشقاق", "البروج", "الطارق", "الأعلى", "الغاشية", "الفجر", "البلد",
  "الشمس", "الليل", "الضحى", "الشرح", "التين", "العلق", "القدر", "البينة", "الزلزلة", "العاديات",
  "القارعة", "التكاثر", "العصر", "الهمزة", "الفيل", "قريش", "الماعون", "الكوثر", "الكافرون", "النصر",
  "المسد", "الإخلاص", "الفلق", "الناس"
];

const JUZ_SURAHS = {
  1: ["الفاتحة", "البقرة"], 2: ["البقرة"], 3: ["البقرة", "آل عمران"], 4: ["آل عمران", "النساء"], 5: ["النساء"], 6: ["النساء", "المائدة"], 7: ["المائدة", "الأنعام"], 8: ["الأنعام", "الأعراف"], 9: ["الأعراف", "الأنفال"], 10: ["الأنفال", "التوبة"], 11: ["التوبة", "يونس", "هود"], 12: ["هود", "يوسف"], 13: ["يوسف", "الرعد", "إبراهيم"], 14: ["الحجر", "النحل"], 15: ["الإسراء", "الكهف"], 16: ["الكهف", "مريم", "طه"], 17: ["الأنبياء", "الحج"], 18: ["المؤمنون", "النور", "الفرقان"], 19: ["الفرقان", "الشعراء", "النمل"], 20: ["النمل", "القصص", "العنكبوت"], 21: ["العنكبوت", "الروم", "لقمان", "السجدة", "الأحزاب"], 22: ["الأحزاب", "سبأ", "فاطر", "يس"], 23: ["يس", "الصافات", "ص", "الزمر"], 24: ["الزمر", "غافر", "فصلت"], 25: ["فصلت", "الشورى", "الزخرف", "الدخان", "الجاثية"], 26: ["الأحقاف", "محمد", "الفتح", "الحجرات", "ق", "الذاريات"], 27: ["الذاريات", "الطور", "النجم", "القمر", "الرحمن", "الواقعة", "الحديد"], 28: ["المجادلة", "الحشر", "الممتحنة", "الصف", "الجمعة", "المنافقون", "التغابن", "الطلاق", "التحريم"], 29: ["الملك", "القلم", "الحاقة", "المعارج", "نوح", "الجن", "المزمل", "المدثر", "القيامة", "الإنسان", "المرسلات"], 30: ["النبأ", "النازعات", "عبس", "التكوير", "الانفطار", "المطففين", "الانشقاق", "البروج", "الطارق", "الأعلى", "الغاشية", "الفجر", "البلد", "الشمس", "الليل", "الضحى", "الشرح", "التين", "العلق", "القدر", "البينة", "الزلزلة", "العاديات", "القارعة", "التكاثر", "العصر", "الهمزة", "الفيل", "قريش", "الماعون", "الكوثر", "الكافرون", "النصر", "المسد", "الإخلاص", "الفلق", "الناس"]
};

const removeArabicDiacritics = (text) => {
  if (!text) return "";
  return text
    .replace(/[\u064B-\u065F]/g, "")
    .replace(/[\u0670]/g, "")
    .replace(/[ًٌٍَُِّْ]/g, "")
    .replace(/ٱ/g, "ا")
    .trim();
};

function GenerateWords() {
  const { toast } = useToast();
  const [selectedFile, setSelectedFile] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentWordCount, setCurrentWordCount] = useState(0);
  const [totalWordsToProcess, setTotalWordsToProcess] = useState(0);
  const [processedWords, setProcessedWords] = useState([]);
  const [errors, setErrors] = useState([]);
  const [user, setUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [updateExisting, setUpdateExisting] = useState(false);

  const [showImageGallery, setShowImageGallery] = useState(false);
  const [galleryImages, setGalleryImages] = useState([]);
  const [selectedImageFor, setSelectedImageFor] = useState("");

  const [smartForm, setSmartForm] = useState({
    source_type: "juz",
    selected_juz: [],
    selected_surahs: [],
    difficulty_level: "مبتدئ"
  });

  const [manualForm, setManualForm] = useState({
    word: "",
    surah_name: "",
    ayah_number: "",
    juz_number: "",
    difficulty_level: "مبتدئ",
    meaning: "",
    category: "أخرى",
    root: "",
    aya_text: "",
    example_usage: "",
    image_url: "",
    audio_url: "",
    youtube_url: "",
    reflection_question: "",
    reflection_answer: "",
    alternative_meanings: ""
  });

  const [batchForm, setBatchForm] = useState({
    batch_text: "",
    difficulty_level: "مبتدئ"
  });

  const [fileEncoding, setFileEncoding] = useState("UTF-8");

  React.useEffect(() => {
    checkAdmin();
  }, []);

  const checkAdmin = async () => {
    try {
      const currentUser = await supabaseClient.auth.me();
      setUser(currentUser);
      setIsAdmin(currentUser.role === 'admin');
    } catch (error) {
      console.error("Error checking admin:", error);
      await logError("GenerateWords/checkAdmin", error.message, error);
    } finally {
      setIsLoading(false);
    }
  };

  const logError = async (context, message, details) => {
    try {
      await supabaseClient.functions.invoke("logAppError", {
        error_message: message,
        error_details: details ? JSON.stringify(details, Object.getOwnPropertyNames(details)) : "",
        context: context,
        user_email: user?.email || "unknown",
        additional_data: { page: "GenerateWords" }
      });
    } catch (err) {
      console.error("Failed to log error to backend:", err);
    }
  };

  const processUpsert = async (wordsToProcess, onProgress) => {
    const CHUNK_SIZE = 20;
    let createdCount = 0;
    let updatedCount = 0;
    const errors = [];

    for (let i = 0; i < wordsToProcess.length; i += CHUNK_SIZE) {
      const chunk = wordsToProcess.slice(i, i + CHUNK_SIZE);
      
      await Promise.all(chunk.map(async (wordData) => {
        try {
          // البحث عن الكلمة الموجودة
          const existing = await supabaseClient.entities.QuranicWord.filter({
            word: wordData.word,
            surah_name: wordData.surah_name,
            ayah_number: wordData.ayah_number,
            difficulty_level: wordData.difficulty_level
          });

          if (existing.length > 0) {
            if (updateExisting) {
              await supabaseClient.entities.QuranicWord.update(existing[0].id, wordData);
              updatedCount++;
            } else {
              // Skip if exists and no update requested
            }
          } else {
            await supabaseClient.entities.QuranicWord.create(wordData);
            createdCount++;
          }
        } catch (err) {
          errors.push({ word: wordData.word, error: err.message });
          await logError("GenerateWords/processUpsert", `Error processing word: ${wordData.word}`, err);
        }
      }));

      if (onProgress) onProgress(Math.min(95, Math.round(((i + CHUNK_SIZE) / wordsToProcess.length) * 100)));
    }

    return { createdCount, updatedCount, errors };
  };

  const processBatchWords = async () => {
    if (!batchForm.batch_text.trim()) return;

    setIsProcessing(true);
    setProgress(0);
    setErrors([]);
    
    try {
      const lines = batchForm.batch_text.trim().split('\n').filter(line => line.trim());
      setTotalWordsToProcess(lines.length);
      const parsedWords = [];

      for (let i = 0; i < lines.length; i++) {
        try {
          const tokens = lines[i].split(/\t+|\s{2,}/).map(p => p.trim()).filter(p => p);
          if (tokens.length < 2) throw new Error("بيانات غير كافية في السطر");

          const word = tokens[0];
          let surah_name = "";
          let difficulty = batchForm.difficulty_level;
          
          // Simple parsing logic (same as before)
          let potentialSurahIndex = -1;
          let potentialDifficultyIndex = -1;

          if (["مبتدئ", "متوسط", "متقدم"].includes(tokens[tokens.length - 1])) {
            difficulty = tokens[tokens.length - 1];
            potentialDifficultyIndex = tokens.length - 1;
          }

          if (potentialDifficultyIndex !== -1 && tokens.length > 2) {
            potentialSurahIndex = tokens.length - 2;
          } else if (potentialDifficultyIndex === -1 && tokens.length > 1) {
            potentialSurahIndex = tokens.length - 1;
          }

          if (potentialSurahIndex !== -1) {
            surah_name = tokens[potentialSurahIndex];
          }

          const cleanSurah = removeArabicDiacritics(surah_name);
          const matchedSurah = SURAHS.find(s => removeArabicDiacritics(s) === cleanSurah);
          
          if (!matchedSurah) throw new Error(`اسم السورة غير صحيح: ${surah_name}`);

          // Fetch Ayah for Context
          const cleanWord = removeArabicDiacritics(word);
          const ayahs = await supabaseClient.entities.QuranAyah.filter({
            surah_name: matchedSurah,
            ayah_text_simple: { '$ilike': `%${cleanWord}%` }
          });

          if (ayahs.length === 0) throw new Error(`لم يتم العثور على الكلمة "${word}" في سورة "${matchedSurah}"`);

          const ayah = ayahs[0];

          // LLM Generation
          const prompt = `Generate JSON for Quranic word:
Word: ${word}
Surah: ${matchedSurah}
Ayah: ${ayah.ayah_number}
Text: ${ayah.ayah_text}
Level: ${difficulty}

Fields required: meaning, category, root, aya_text (context), example_usage, reflection_question, reflection_answer, alternative_meanings (array).
Ensure aya_text is the full ayah text if Level is 'متقدم'.
`;
          
          const llmRes = await supabaseClient.integrations.Core.InvokeLLM({
            prompt,
            response_json_schema: {
              type: "object",
              properties: {
                meaning: {type: "string"},
                category: {type: "string"},
                root: {type: "string"},
                aya_text: {type: "string"},
                example_usage: {type: "string"},
                reflection_question: {type: "string"},
                reflection_answer: {type: "string"},
                alternative_meanings: {type: "array", items: {type: "string"}}
              }
            }
          });

          parsedWords.push({
            word: word,
            meaning: llmRes.meaning,
            surah_name: matchedSurah,
            ayah_number: ayah.ayah_number,
            juz_number: ayah.juz_number,
            difficulty_level: difficulty,
            category: llmRes.category || "أخرى",
            root: difficulty === "مبتدئ" ? "" : llmRes.root,
            aya_text: difficulty === "متقدم" ? ayah.ayah_text : (llmRes.aya_text || ayah.ayah_text),
            example_usage: llmRes.example_usage,
            reflection_question: llmRes.reflection_question,
            reflection_answer: llmRes.reflection_answer,
            alternative_meanings: llmRes.alternative_meanings || []
          });

          setProgress(Math.round(((i + 1) / lines.length) * 50));

        } catch (err) {
          setErrors(prev => [...prev, { word: lines[i], error: err.message }]);
          await logError("GenerateWords/processBatch", err.message, err);
        }
      }

      // Upsert
      const { createdCount, updatedCount, errors: upsertErrors } = await processUpsert(parsedWords, (p) => setProgress(50 + (p/2)));
      
      setErrors(prev => [...prev, ...upsertErrors]);
      setProcessedWords(parsedWords);
      setProgress(100);

      toast({
        title: "✅ اكتملت العملية",
        description: `تم إنشاء: ${createdCount} | تم تحديث: ${updatedCount}`,
        className: "bg-green-100 text-green-800"
      });

    } catch (error) {
      await logError("GenerateWords/Main", error.message, error);
      toast({ title: "خطأ غير متوقع", description: error.message, variant: "destructive" });
    } finally {
      setIsProcessing(false);
    }
  };

  // ... (Keep handleFileChange, openImageGallery, selectImageFromGallery, readFileContent helpers) ...
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) setSelectedFile(file);
  };

  const openImageGallery = async (formType) => {
    setSelectedImageFor(formType);
    try {
      const images = await supabaseClient.entities.images.list("-created_date", 50);
      setGalleryImages(images);
      setShowImageGallery(true);
    } catch (error) {
      console.error(error);
    }
  };

  const selectImageFromGallery = (url) => {
    if (selectedImageFor === "manual") setManualForm({...manualForm, image_url: url});
    setShowImageGallery(false);
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex items-center gap-3 mb-8">
        <Sparkles className="w-10 h-10 text-primary" />
        <div>
          <h1 className="text-3xl font-bold gradient-text">⚡ إدارة الكلمات (توليد واستيراد)</h1>
          <p className="text-foreground/70">إدارة شاملة للكلمات مع دعم التحديث والأخطاء</p>
        </div>
      </div>

      {/* Update Existing Toggle */}
      <Card className="mb-6 border-blue-200 bg-blue-50 dark:bg-blue-900/10">
        <CardContent className="p-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-blue-600" />
            <Label htmlFor="update-mode" className="font-semibold text-lg">تحديث السجلات الموجودة؟</Label>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">
              {updateExisting ? "نعم (تحديث البيانات)" : "لا (تجاهل الموجود)"}
            </span>
            <Switch
              id="update-mode"
              checked={updateExisting}
              onCheckedChange={setUpdateExisting}
            />
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="batch" className="w-full">
        <TabsList className="grid w-full grid-cols-3 mb-6">
          <TabsTrigger value="batch"><PlusCircle className="w-4 h-4 ml-2" /> دفعة نصية</TabsTrigger>
          {/* <TabsTrigger value="file"><Upload className="w-4 h-4 ml-2" /> ملف (CSV/Excel)</TabsTrigger> */}
          <TabsTrigger value="manual"><Brain className="w-4 h-4 ml-2" /> إدخال يدوي</TabsTrigger>
          <TabsTrigger value="smart"><Wand2 className="w-4 h-4 ml-2" /> توليد ذكي</TabsTrigger>
        </TabsList>

        <TabsContent value="batch">
          <Card>
            <CardHeader><CardTitle>إدخال نصي (دفعات)</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <Alert><AlertDescription>نسق: الكلمة [مسافة] السورة [مسافة] المستوى (اختياري)</AlertDescription></Alert>
              <Textarea 
                value={batchForm.batch_text}
                onChange={e => setBatchForm({...batchForm, batch_text: e.target.value})}
                rows={10}
                placeholder="رحمة  البقرة&#10;صبر  آل عمران  متوسط"
                className="font-mono"
              />
              <Button onClick={processBatchWords} disabled={isProcessing} className="w-full">
                {isProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : "بدء المعالجة"}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="manual">
          <Card>
            <CardHeader><CardTitle>إضافة يدوية</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <Input placeholder="الكلمة" value={manualForm.word} onChange={e => setManualForm({...manualForm, word: e.target.value})} />
                <Input placeholder="السورة" value={manualForm.surah_name} onChange={e => setManualForm({...manualForm, surah_name: e.target.value})} />
                <Input placeholder="رقم الآية" type="number" value={manualForm.ayah_number} onChange={e => setManualForm({...manualForm, ayah_number: e.target.value})} />
                <Textarea placeholder="سياق الآية (aya_text)" value={manualForm.aya_text} onChange={e => setManualForm({...manualForm, aya_text: e.target.value})} />
              </div>
              <Button 
                onClick={async () => {
                  setIsProcessing(true);
                  try {
                    await processUpsert([manualForm]);
                    toast({ title: "تم الحفظ" });
                  } catch(e) {
                    await logError("ManualSave", e.message, e);
                  } finally { setIsProcessing(false); }
                }} 
                disabled={isProcessing} 
                className="w-full"
              >
                حفظ
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="smart">
            <div className="p-4 text-center text-muted-foreground">
                (وظيفة التوليد الذكي تستخدم نفس منطق الدفعات في الخلفية)
            </div>
        </TabsContent>
      </Tabs>

      {/* Progress & Errors */}
      <AnimatePresence>
        {isProcessing && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-6">
            <Progress value={progress} className="h-4" />
            <p className="text-center mt-2 text-sm">{progress}% مكتمل</p>
          </motion.div>
        )}
      </AnimatePresence>

      {errors.length > 0 && (
        <Card className="mt-6 border-red-200 bg-red-50">
          <CardHeader><CardTitle className="text-red-700">سجل الأخطاء</CardTitle></CardHeader>
          <CardContent>
            <ul className="list-disc list-inside text-red-600 text-sm max-h-40 overflow-auto">
              {errors.map((e, i) => (
                <li key={i}><strong>{e.word}:</strong> {e.error}</li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
      
      {/* Image Gallery Modal */}
      <Dialog open={showImageGallery} onOpenChange={setShowImageGallery}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader><DialogTitle>معرض الصور</DialogTitle></DialogHeader>
          <div className="grid grid-cols-3 gap-4">
            {galleryImages.map(img => (
              <img 
                key={img.id} 
                src={img.url} 
                className="w-full h-32 object-cover cursor-pointer hover:opacity-80" 
                onClick={() => selectImageFromGallery(img.url)} 
              />
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default GenerateWords;
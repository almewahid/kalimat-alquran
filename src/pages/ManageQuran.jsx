
import React, { useState, useEffect, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { BookOpen, Search, Loader2, FileText, BarChart3, BookMarked, Filter, Copy, Download } from "lucide-react";
import { motion } from "framer-motion";
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

export default function ManageQuran() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [stats, setStats] = useState({
    totalAyahs: 0,
    totalWords: 0,
    surahStats: []
  });
  const [selectedSurah, setSelectedSurah] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [ayahs, setAyahs] = useState([]);
  const [filteredAyahs, setFilteredAyahs] = useState([]);
  const [isSurahPopoverOpen, setIsSurahPopoverOpen] = useState(false); // New state for surah popover
  
  // States for Words tab
  const [allWords, setAllWords] = useState([]);
  const [filteredWords, setFilteredWords] = useState([]);
  const [wordSearchTerm, setWordSearchTerm] = useState("");
  const [wordSurahFilter, setWordSurahFilter] = useState("all");
  const [wordLevelFilter, setWordLevelFilter] = useState("all");
  const [wordCategoryFilter, setWordCategoryFilter] = useState("all");

  const checkAdminAndLoadData = useCallback(async () => {
    try {
      const user = await base44.auth.me();
      setIsAdmin(user.role === 'admin');
      
      if (user.role !== 'admin') {
        setIsLoading(false);
        return;
      }

      const [allAyahsData, allWordsData] = await Promise.all([
        base44.entities.QuranAyah.list('-id', 10000),
        base44.entities.QuranicWord.list('-id', 10000)
      ]);

      setAyahs(allAyahsData);
      setFilteredAyahs(allAyahsData);
      setAllWords(allWordsData);
      setFilteredWords(allWordsData);

      // Calculate stats with difficulty levels
      const surahStatsMap = {};
      allAyahsData.forEach(ayah => {
        if (!surahStatsMap[ayah.surah_name]) {
          surahStatsMap[ayah.surah_name] = {
            name: ayah.surah_name,
            ayahCount: 0,
            wordCount: 0,
            beginnerWords: 0,
            intermediateWords: 0,
            advancedWords: 0
          };
        }
        surahStatsMap[ayah.surah_name].ayahCount++;
      });

      allWordsData.forEach(word => {
        if (surahStatsMap[word.surah_name]) {
          surahStatsMap[word.surah_name].wordCount++;
          
          if (word.difficulty_level === "مبتدئ") {
            surahStatsMap[word.surah_name].beginnerWords++;
          } else if (word.difficulty_level === "متوسط") {
            surahStatsMap[word.surah_name].intermediateWords++;
          } else if (word.difficulty_level === "متقدم") {
            surahStatsMap[word.surah_name].advancedWords++;
          }
        }
      });

      const surahStatsArray = Object.values(surahStatsMap).sort((a, b) =>
        SURAHS.indexOf(a.name) - SURAHS.indexOf(b.name)
      );

      setStats({
        totalAyahs: allAyahsData.length,
        totalWords: allWordsData.length,
        surahStats: surahStatsArray
      });

    } catch (error) {
      console.error("Error loading data:", error);
    } finally {
      setIsLoading(false);
    }
  }, []); // useCallback with empty dependency array because setters are stable

  useEffect(() => {
    checkAdminAndLoadData();
  }, [checkAdminAndLoadData]); // checkAdminAndLoadData is now stable

  useEffect(() => {
    filterAyahs();
  }, [selectedSurah, searchTerm, ayahs]);

  useEffect(() => {
    filterWords();
  }, [wordSearchTerm, wordSurahFilter, wordLevelFilter, wordCategoryFilter, allWords]);

  const filterAyahs = () => {
    let filtered = ayahs;

    if (selectedSurah !== "all") {
      filtered = filtered.filter(ayah => ayah.surah_name === selectedSurah);
    }

    if (searchTerm) {
      filtered = filtered.filter(ayah =>
        ayah.ayah_text?.includes(searchTerm) ||
        ayah.ayah_text_simple?.includes(searchTerm) ||
        ayah.ayah_number?.toString().includes(searchTerm)
      );
    }

    // Sort filteredAyahs by ayah_number ascending
    filtered.sort((a, b) => a.ayah_number - b.ayah_number);

    setFilteredAyahs(filtered.slice(0, 100));
  };

  const filterWords = () => {
    let filtered = allWords;

    if (wordSurahFilter !== "all") {
      filtered = filtered.filter(word => word.surah_name === wordSurahFilter);
    }

    if (wordLevelFilter !== "all") {
      filtered = filtered.filter(word => word.difficulty_level === wordLevelFilter);
    }

    if (wordCategoryFilter !== "all") {
      filtered = filtered.filter(word => word.category === wordCategoryFilter);
    }

    if (wordSearchTerm) {
      filtered = filtered.filter(word =>
        word.word?.includes(wordSearchTerm) ||
        word.meaning?.includes(wordSearchTerm) ||
        word.root?.includes(wordSearchTerm)
      );
    }

    setFilteredWords(filtered);
  };

  const copyTableToClipboard = () => {
    const headers = ["#", "الكلمة", "المعنى", "معانٍ بديلة", "سياق الآية", "السورة", "الآية", "التصنيف", "الجذر", "مثال", "سؤال تأملي", "إجابة", "المستوى"]; // Added المستوى to headers
    const rows = filteredWords.map((word, index) => [
      index + 1,
      word.word,
      word.meaning,
      (word.alternative_meanings || []).join(", "),
      word.context_snippet,
      word.surah_name,
      word.ayah_number,
      word.category,
      word.root || "-",
      word.example_usage || "-",
      word.reflection_question || "-",
      word.reflection_answer || "-",
      word.difficulty_level // Added difficulty_level
    ]);
    
    const text = [headers, ...rows].map(row => row.join("\t")).join("\n");
    navigator.clipboard.writeText(text);
    
    toast({
      title: "✅ تم النسخ",
      description: "تم نسخ الجدول إلى الحافظة. يمكنك لصقه في Excel مباشرة.",
      className: "bg-green-100 text-green-800"
    });
  };

  const downloadCSV = () => {
    const headers = ["#", "الكلمة", "المعنى", "معانٍ بديلة", "سياق الآية", "السورة", "الآية", "التصنيف", "الجذر", "مثال", "سؤال تأملي", "إجابة", "المستوى"]; // Added المستوى to headers
    const rows = filteredWords.map((word, index) => [
      index + 1,
      word.word,
      word.meaning,
      (word.alternative_meanings || []).join("; "), // CSV delimiter might be comma, so use semicolon for internal lists
      word.context_snippet,
      word.surah_name,
      word.ayah_number,
      word.category,
      word.root || "-",
      word.example_usage || "-",
      word.reflection_question || "-",
      word.reflection_answer || "-",
      word.difficulty_level // Added difficulty_level
    ]);
    
    const csvContent = [headers, ...rows]
      .map(row => row.map(cell => {
        // Enclose each cell in double quotes and escape existing double quotes
        const stringCell = String(cell || "");
        return `"${stringCell.replace(/"/g, '""')}"`;
      }).join(","))
      .join("\n");
    
    // Add BOM for UTF-8 encoding in Excel
    const blob = new Blob(["\uFEFF" + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `كلمات_قرآنية_${new Date().toLocaleDateString('ar')}.csv`;
    link.click();
    
    toast({
      title: "✅ تم التحميل",
      description: "تم تحميل ملف CSV بنجاح",
      className: "bg-green-100 text-green-800"
    });
  };

  const getCategoryColor = (category) => {
    const colors = {
      "أسماء": "bg-blue-100 text-blue-800",
      "أفعال": "bg-green-100 text-green-800",
      "صفات": "bg-yellow-100 text-yellow-800",
      "حروف": "bg-pink-100 text-pink-800",
      "أخرى": "bg-purple-100 text-purple-800"
    };
    return colors[category] || colors["أخرى"];
  };

  if (isLoading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-screen">
        <Loader2 className="w-12 h-12 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="p-6 max-w-2xl mx-auto mt-10">
        <Card className="bg-red-50 border-red-200">
          <CardContent className="p-6 text-center">
            <h2 className="text-xl font-bold text-red-700 mb-2">⛔ غير مصرح</h2>
            <p className="text-red-600">هذه الصفحة متاحة للمسؤولين فقط</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center gap-3 mb-8">
          <BookOpen className="w-10 h-10 text-primary" />
          <div>
            <h1 className="text-3xl font-bold gradient-text">إدارة القرآن الكريم</h1>
            <p className="text-foreground/70">عرض وإدارة السور والآيات والكلمات</p>
          </div>
        </div>

        <Tabs defaultValue="stats" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="stats">
              <BarChart3 className="w-4 h-4 ml-2" />
              الإحصائيات
            </TabsTrigger>
            <TabsTrigger value="surahs">
              <BookOpen className="w-4 h-4 ml-2" />
              السور
            </TabsTrigger>
            <TabsTrigger value="ayahs">
              <FileText className="w-4 h-4 ml-2" />
              الآيات
            </TabsTrigger>
            <TabsTrigger value="words">
              <BookMarked className="w-4 h-4 ml-2" />
              الكلمات
            </TabsTrigger>
          </TabsList>

          <TabsContent value="stats" className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>إحصائيات عامة</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between items-center p-4 bg-background-soft rounded-lg">
                    <span className="text-foreground/70">إجمالي الآيات</span>
                    <Badge className="text-lg">{stats.totalAyahs}</Badge>
                  </div>
                  <div className="flex justify-between items-center p-4 bg-background-soft rounded-lg">
                    <span className="text-foreground/70">إجمالي الكلمات المستخرجة</span>
                    <Badge className="text-lg">{stats.totalWords}</Badge>
                  </div>
                  <div className="flex justify-between items-center p-4 bg-background-soft rounded-lg">
                    <span className="text-foreground/70">عدد السور</span>
                    <Badge className="text-lg">{stats.surahStats.length}</Badge>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>معلومات سريعة</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-sm text-foreground/70">
                    • يمكنك استيراد آيات القرآن من صفحة "استيراد القرآن"
                  </p>
                  <p className="text-sm text-foreground/70">
                    • لتوليد كلمات جديدة، استخدم صفحة "توليد الكلمات"
                  </p>
                  <p className="text-sm text-foreground/70">
                    • السور والآيات متاحة للبحث في صفحة "البحث"
                  </p>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>إحصائيات السور التفصيلية</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {stats.surahStats.map((surah, index) => (
                    <div
                      key={index}
                      className="flex flex-col p-4 bg-background-soft rounded-lg hover:bg-primary/5 transition-colors border border-border"
                    >
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex items-center gap-3">
                          <span className="font-bold text-foreground/50 w-8">{index + 1}</span>
                          <span className="font-semibold text-lg">{surah.name}</span>
                        </div>
                        <div className="flex gap-2">
                          <Badge variant="outline">{surah.ayahCount} آية</Badge>
                          <Badge className="bg-primary/10 text-primary">{surah.wordCount} كلمة</Badge>
                        </div>
                      </div>
                      
                      {surah.wordCount > 0 && (
                        <div className="flex gap-2 flex-wrap">
                          <Badge variant="secondary" className="bg-green-100 text-green-800">
                            🟢 مبتدئ: {surah.beginnerWords}
                          </Badge>
                          <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                            🟡 متوسط: {surah.intermediateWords}
                          </Badge>
                          <Badge variant="secondary" className="bg-red-100 text-red-800">
                            🔴 متقدم: {surah.advancedWords}
                          </Badge>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="surahs" className="space-y-6">
            <Card>
              <CardContent className="p-6">
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {stats.surahStats.map((surah, index) => (
                    <Card
                      key={index}
                      className="cursor-pointer hover:shadow-lg transition-shadow"
                      onClick={() => {
                        setSelectedSurah(surah.name);
                        document.querySelector('[value="ayahs"]')?.click();
                      }}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-center gap-3 mb-3">
                          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary">
                            {index + 1}
                          </div>
                          <h3 className="font-bold text-lg">{surah.name}</h3>
                        </div>
                        <div className="flex gap-2 flex-wrap">
                          <Badge variant="outline">{surah.ayahCount} آية</Badge>
                          <Badge variant="outline">{surah.wordCount} كلمة</Badge>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="ayahs" className="space-y-6">
            <Card>
              <CardContent className="p-6">
                <div className="flex flex-col md:flex-row gap-4 mb-6">
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <Search className="w-5 h-5 text-foreground/50" />
                      <Input
                        placeholder="🔍 ابحث في نص الآيات..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="flex-1"
                      />
                    </div>
                  </div>
                  
                  {/* Replaced Select with Popover for Surah selection */}
                  <Popover open={isSurahPopoverOpen} onOpenChange={setIsSurahPopoverOpen}>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-full md:w-48 justify-between">
                        {selectedSurah === "all" ? "اختر السورة" : selectedSurah}
                        <BookOpen className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[300px] p-0" align="end">
                      <div className="grid grid-cols-2 gap-2 p-2 max-h-60 overflow-y-auto">
                        <Button
                          variant={selectedSurah === "all" ? "default" : "ghost"}
                          onClick={() => {
                            setSelectedSurah("all");
                            setIsSurahPopoverOpen(false);
                          }}
                          className="justify-center"
                        >
                          جميع السور
                        </Button>
                        {SURAHS.map((surah) => (
                          <Button
                            key={surah}
                            variant={selectedSurah === surah ? "default" : "ghost"}
                            onClick={() => {
                              setSelectedSurah(surah);
                              setIsSurahPopoverOpen(false);
                            }}
                            className="justify-center"
                          >
                            {surah}
                          </Button>
                        ))}
                      </div>
                    </PopoverContent>
                  </Popover>

                  <Badge variant="outline" className="flex items-center gap-2">
                    {filteredAyahs.length} آية
                  </Badge>
                </div>

                <div className="space-y-3 max-h-[600px] overflow-y-auto">
                  {filteredAyahs.length === 0 ? (
                    <div className="text-center p-12">
                      <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                      <p className="text-foreground/70">لا توجد آيات مطابقة</p>
                    </div>
                  ) : (
                    filteredAyahs.map((ayah, index) => (
                      <motion.div
                        key={ayah.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.02 }}
                      >
                        <Card className="hover:shadow-md transition-shadow">
                          <CardContent className="p-4">
                            <div className="flex justify-between items-start mb-3">
                              <div className="flex gap-3 flex-wrap">
                                <Badge>{ayah.surah_name}</Badge>
                                <Badge variant="outline">الآية {ayah.ayah_number}</Badge>
                                {ayah.juz_number && (
                                  <Badge variant="outline">الجزء {ayah.juz_number}</Badge>
                                )}
                              </div>
                            </div>
                            <p className="text-lg arabic-font leading-relaxed">
                              {ayah.ayah_text || ayah.ayah_text_simple}
                            </p>
                          </CardContent>
                        </Card>
                      </motion.div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="words" className="space-y-6">
            {/* Header with Stats */}
            <Card className="bg-gradient-to-r from-purple-500 to-indigo-600 text-white">
              <CardContent className="p-6">
                <div className="text-center">
                  <h2 className="text-2xl font-bold mb-2">📖 جدول الكلمات القرآنية</h2>
                  <p className="text-white/90 mb-4">كلمات قرآنية مع معانيها وتفاصيلها الكاملة</p>
                  <div className="flex justify-center gap-8 flex-wrap">
                    <div className="flex flex-col items-center gap-1">
                      <span className="text-3xl font-bold">{stats.totalWords}</span>
                      <span className="text-sm">كلمة إجمالية</span>
                    </div>
                    <div className="flex flex-col items-center gap-1">
                      <span className="text-3xl font-bold">{filteredWords.length}</span>
                      <span className="text-sm">نتائج مطابقة</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Notice */}
            <Card className="bg-yellow-50 border-yellow-200">
              <CardContent className="p-4">
                <p className="text-center text-yellow-800 text-sm">
                  💡 يمكنك نسخ الجدول كاملاً ولصقه مباشرة في Excel أو تصديره كملف CSV
                </p>
              </CardContent>
            </Card>

            {/* Controls */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Filter className="w-5 h-5" />
                  فلترة وتصفية الكلمات
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                  <div>
                    <label className="text-sm font-medium mb-2 block">البحث</label>
                    <div className="relative">
                      <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <Input
                        placeholder="ابحث في الكلمة، المعنى، الجذر..."
                        value={wordSearchTerm}
                        onChange={(e) => setWordSearchTerm(e.target.value)}
                        className="pr-10"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium mb-2 block">السورة</label>
                    <Select value={wordSurahFilter} onValueChange={setWordSurahFilter}>
                      <SelectTrigger>
                        <SelectValue placeholder="كل السور" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">كل السور</SelectItem>
                        {SURAHS.map((surah) => (
                          <SelectItem key={surah} value={surah}>{surah}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="text-sm font-medium mb-2 block">المستوى</label>
                    <Select value={wordLevelFilter} onValueChange={setWordLevelFilter}>
                      <SelectTrigger>
                        <SelectValue placeholder="كل المستويات" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">كل المستويات</SelectItem>
                        <SelectItem value="مبتدئ">مبتدئ</SelectItem>
                        <SelectItem value="متوسط">متوسط</SelectItem>
                        <SelectItem value="متقدم">متقدم</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="text-sm font-medium mb-2 block">التصنيف</label>
                    <Select value={wordCategoryFilter} onValueChange={setWordCategoryFilter}>
                      <SelectTrigger>
                        <SelectValue placeholder="كل التصنيفات" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">كل التصنيفات</SelectItem>
                        <SelectItem value="أسماء">أسماء</SelectItem>
                        <SelectItem value="أفعال">أفعال</SelectItem>
                        <SelectItem value="صفات">صفات</SelectItem>
                        <SelectItem value="حروف">حروف</SelectItem>
                        <SelectItem value="أخرى">أخرى</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="flex justify-between items-center gap-3 flex-wrap">
                  <Badge variant="outline" className="text-sm px-4 py-2">
                    📊 النتائج: {filteredWords.length} كلمة
                  </Badge>
                  
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => {
                        setWordSearchTerm("");
                        setWordSurahFilter("all");
                        setWordLevelFilter("all");
                        setWordCategoryFilter("all");
                      }}
                    >
                      🔄 إعادة تعيين
                    </Button>
                    <Button 
                      variant="default" 
                      size="sm"
                      onClick={copyTableToClipboard}
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      <Copy className="w-4 h-4 ml-2" />
                      نسخ الجدول
                    </Button>
                    <Button 
                      variant="default" 
                      size="sm"
                      onClick={downloadCSV}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      <Download className="w-4 h-4 ml-2" />
                      تصدير CSV
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Table */}
            <Card>
              <CardContent className="p-0">
                <div className="max-h-[600px] overflow-auto rounded-lg">
                  {filteredWords.length === 0 ? (
                    <div className="text-center p-16">
                      <div className="text-6xl mb-4 text-gray-400">🔍</div>
                      <p className="text-lg text-foreground/70">لم يتم العثور على نتائج مطابقة للفلاتر.</p>
                      <p className="text-sm text-foreground/50 mt-2">جرب البحث بكلمة مختلفة أو تغيير الفلاتر.</p>
                    </div>
                  ) : (
                    <table className="w-full text-sm">
                      <thead className="bg-gradient-to-r from-purple-500 to-indigo-600 text-white sticky top-0 z-10 shadow-md">
                        <tr>
                          <th className="p-3 text-right font-semibold border-l border-white/10 whitespace-nowrap">#</th>
                          <th className="p-3 text-right font-semibold border-l border-white/10 whitespace-nowrap">الكلمة</th>
                          <th className="p-3 text-right font-semibold border-l border-white/10 whitespace-nowrap">المعنى</th>
                          <th className="p-3 text-right font-semibold border-l border-white/10 whitespace-nowrap">معانٍ بديلة</th>
                          <th className="p-3 text-right font-semibold border-l border-white/10 whitespace-nowrap">سياق الآية</th>
                          <th className="p-3 text-right font-semibold border-l border-white/10 whitespace-nowrap">السورة</th>
                          <th className="p-3 text-right font-semibold border-l border-white/10 whitespace-nowrap">الآية</th>
                          <th className="p-3 text-right font-semibold border-l border-white/10 whitespace-nowrap">المستوى</th>
                          <th className="p-3 text-right font-semibold border-l border-white/10 whitespace-nowrap">التصنيف</th>
                          <th className="p-3 text-right font-semibold border-l border-white/10 whitespace-nowrap">الجذر</th>
                          <th className="p-3 text-right font-semibold border-l border-white/10 whitespace-nowrap">مثال</th>
                          <th className="p-3 text-right font-semibold border-l border-white/10 whitespace-nowrap">سؤال تأملي</th>
                          <th className="p-3 text-right font-semibold whitespace-nowrap">إجابة</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredWords.map((word, index) => (
                          <motion.tr
                            key={word.id}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: Math.min(index * 0.01, 0.5) }}
                            className={`border-b border-gray-200 hover:bg-purple-50 transition-colors ${
                              index % 2 === 0 ? 'bg-white' : 'bg-gray-50'
                            }`}
                          >
                            <td className="p-3 text-gray-500 border-l border-gray-200">{index + 1}</td>
                            <td className="p-3 border-l border-gray-200">
                              <span className="font-bold text-lg text-purple-600 arabic-font">
                                {word.word}
                              </span>
                            </td>
                            <td className="p-3 border-l border-gray-200 max-w-[150px] overflow-hidden text-ellipsis">
                              {word.meaning}
                            </td>
                            <td className="p-3 border-l border-gray-200 max-w-[150px] text-xs text-gray-600 overflow-hidden text-ellipsis">
                              {(word.alternative_meanings && word.alternative_meanings.length > 0) ? word.alternative_meanings.join("، ") : "-"}
                            </td>
                            <td className="p-3 border-l border-gray-200 max-w-[200px] overflow-hidden text-ellipsis">
                              <span className="arabic-font text-sm">{word.context_snippet || "-"}</span>
                            </td>
                            <td className="p-3 border-l border-gray-200">
                              <Badge variant="outline">{word.surah_name}</Badge>
                            </td>
                            <td className="p-3 text-center border-l border-gray-200">{word.ayah_number}</td>
                            <td className="p-3 border-l border-gray-200">
                              <Badge 
                                className={
                                  word.difficulty_level === "مبتدئ" 
                                    ? "bg-green-100 text-green-800"
                                    : word.difficulty_level === "متوسط"
                                    ? "bg-yellow-100 text-yellow-800"
                                    : "bg-red-100 text-red-800"
                                }
                              >
                                {word.difficulty_level}
                              </Badge>
                            </td>
                            <td className="p-3 border-l border-gray-200">
                              <Badge className={getCategoryColor(word.category)}>
                                {word.category}
                              </Badge>
                            </td>
                            <td className="p-3 text-sm text-gray-600 border-l border-gray-200 whitespace-nowrap">
                              {word.root || "-"}
                            </td>
                            <td className="p-3 max-w-[200px] text-xs text-gray-600 border-l border-gray-200 overflow-hidden text-ellipsis">
                              {word.example_usage || "-"}
                            </td>
                            <td className="p-3 max-w-[200px] text-xs text-gray-700 border-l border-gray-200 overflow-hidden text-ellipsis">
                              {word.reflection_question || "-"}
                            </td>
                            <td className="p-3 max-w-[200px] text-xs text-gray-600 overflow-hidden text-ellipsis">
                              {word.reflection_answer || "-"}
                            </td>
                          </motion.tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </motion.div>
    </div>
  );
}


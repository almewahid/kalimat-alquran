import React, { useState, useEffect } from "react";
import { supabaseClient } from "@/components/api/supabaseClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Brain,
  Calendar,
  CheckCircle,
  XCircle,
  RotateCcw,
  Loader2,
  Filter,
  Layers,
  Sparkles,
  BookOpen,
  HelpCircle,
  Settings,
  BarChart3,
  PieChart
} from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { motion, AnimatePresence } from "framer-motion";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { calculateSRS, getStatusLabel } from "@/components/utils/srs";
import KidsWordCard from "@/components/kids/KidsWordCard";
import SmartQuizSession from "@/components/smart-review/SmartQuizSession";
import { useToast } from "@/components/ui/use-toast";

// --- Sub-component: Quiz Mode ---
const ReviewQuiz = ({ words, onComplete }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [showResult, setShowResult] = useState(false);
  const [selectedOption, setSelectedOption] = useState(null);
  const [results, setResults] = useState([]);
  
  const currentWord = words[currentIndex];
  
  // Generate options (1 correct, 3 random wrong)
  const options = React.useMemo(() => {
    if (!currentWord) return [];
    const otherWords = words.filter(w => w.id !== currentWord.id);
    const shuffledOthers = [...otherWords].sort(() => 0.5 - Math.random()).slice(0, 3);
    const opts = [...shuffledOthers, currentWord];
    return opts.sort(() => 0.5 - Math.random());
  }, [currentWord, words]);

  const handleAnswer = (option) => {
    setSelectedOption(option);
    const isCorrect = option.id === currentWord.id;
    if (isCorrect) setScore(score + 1);
    
    // Record result
    setResults(prev => [...prev, { 
      word: currentWord, 
      isCorrect, 
      userAnswer: option.meaning 
    }]);
    
    setTimeout(() => {
      if (currentIndex < words.length - 1) {
        setCurrentIndex(currentIndex + 1);
        setSelectedOption(null);
      } else {
        setShowResult(true);
      }
    }, 1500);
  };

  if (showResult) {
    const mastered = results.filter(r => r.isCorrect);
    const needsReview = results.filter(r => !r.isCorrect);

    return (
      <Card className="max-w-3xl mx-auto overflow-hidden">
        <CardHeader className="bg-primary/5 text-center pb-8 pt-8">
          <Sparkles className="w-16 h-16 text-yellow-500 mx-auto mb-4 animate-pulse" />
          <CardTitle className="text-3xl font-bold mb-2 text-primary">انتهت الجلسة!</CardTitle>
          <p className="text-xl text-muted-foreground">
            نتيجتك: <span className="font-bold text-primary">{score}</span> من {words.length}
          </p>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid md:grid-cols-2 gap-6 mb-8">
            <div className="bg-green-50 border border-green-200 rounded-xl p-4">
              <h3 className="font-bold text-green-800 mb-3 flex items-center gap-2">
                <CheckCircle className="w-5 h-5" /> كلمات أتقنتها ({mastered.length})
              </h3>
              <ul className="space-y-2 max-h-40 overflow-y-auto pr-2">
                {mastered.map((r, i) => (
                  <li key={i} className="text-sm text-green-700 flex justify-between">
                    <span>{r.word.word}</span>
                    <span className="text-green-600/70">{r.word.meaning}</span>
                  </li>
                ))}
              </ul>
            </div>
            
            <div className="bg-red-50 border border-red-200 rounded-xl p-4">
              <h3 className="font-bold text-red-800 mb-3 flex items-center gap-2">
                <XCircle className="w-5 h-5" /> كلمات للمراجعة ({needsReview.length})
              </h3>
              <ul className="space-y-2 max-h-40 overflow-y-auto pr-2">
                {needsReview.map((r, i) => (
                  <li key={i} className="text-sm text-red-700 flex justify-between">
                    <span>{r.word.word}</span>
                    <span className="text-red-600/70">{r.word.meaning}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
          <Button onClick={onComplete} size="lg" className="w-full">عودة للقائمة</Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <div className="flex justify-between items-center">
          <Badge variant="outline">سؤال {currentIndex + 1} من {words.length}</Badge>
          <Badge variant="secondary">النقاط: {score}</Badge>
        </div>
        <Progress value={((currentIndex + 1) / words.length) * 100} className="mt-2" />
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="text-center py-8">
          <h3 className="text-4xl font-bold text-primary mb-2">{currentWord.word}</h3>
          <p className="text-muted-foreground">اختر المعنى الصحيح</p>
        </div>
        
        <div className="grid gap-3">
          {options.map((option, idx) => {
            let btnClass = "justify-start text-right h-auto py-4 text-lg";
            if (selectedOption) {
              if (option.id === currentWord.id) btnClass += " bg-green-100 border-green-500 text-green-800 hover:bg-green-100";
              else if (option.id === selectedOption.id) btnClass += " bg-red-100 border-red-500 text-red-800 hover:bg-red-100";
              else btnClass += " opacity-50";
            }
            
            return (
              <Button
                key={idx}
                variant="outline"
                className={btnClass}
                onClick={() => !selectedOption && handleAnswer(option)}
                disabled={!!selectedOption}
              >
                {option.meaning}
              </Button>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};

export default function SmartReview() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("daily");
  const [loading, setLoading] = useState(true);
  const [dueWords, setDueWords] = useState([]);
  const [filteredWords, setFilteredWords] = useState([]);
  const [suraList, setSuraList] = useState([]);
  
  // Filter States
  const [filterDifficulty, setFilterDifficulty] = useState("all");
  const [filterSurah, setFilterSurah] = useState("all");
  const [filterJuz, setFilterJuz] = useState("all");
  const [sortBy, setSortBy] = useState("default"); // default, difficulty, surah, alphabetical

  // Review Mode State
  const [currentReviewIndex, setCurrentReviewIndex] = useState(0);
  const [reviewMode, setReviewMode] = useState("list"); // list, card, quiz
  const [showSettings, setShowSettings] = useState(false);
  const [quizPreferences, setQuizPreferences] = useState({
      multipleChoice: true,
      matching: true,
      audio: true
  });
  const [showStats, setShowStats] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const user = await supabaseClient.auth.me();
      
      // 1. Fetch Flashcards (User's progress)
      const flashcards = await supabaseClient.entities.FlashCard.list();

      // 2. Identify words we need to fetch
      // Only fetch words that are actually needed (for due cards) to save bandwidth
      const now = new Date();
      const dueCards = flashcards.filter(card => {
        if (!card.next_review) return true;
        return new Date(card.next_review) <= now;
      });

      const dueWordIds = [...new Set(dueCards.map(c => c.word_id))];

      // Fetch words in chunks
      let loadedWords = [];

      if (dueWordIds.length > 0) {
          const chunkSize = 50;
          for (let i = 0; i < dueWordIds.length; i += chunkSize) {
              const idsChunk = dueWordIds.slice(i, i + chunkSize);
              const chunkWords = await supabaseClient.entities.QuranicWord.filter({
                  id: { $in: idsChunk }
              });
              loadedWords = [...loadedWords, ...chunkWords];
          }
      }

      // Also fetch a small batch of recent words for the library/discovery (e.g. 50)
      // instead of 1000
      const recentWords = await supabaseClient.entities.QuranicWord.list("-created_date", 50);

      // Merge and dedup
      const allLoadedWordsMap = new Map();
      loadedWords.forEach(w => allLoadedWordsMap.set(w.id, w));
      recentWords.forEach(w => allLoadedWordsMap.set(w.id, w));

      const allWords = Array.from(allLoadedWordsMap.values());

      // Extract unique surahs from loaded words
      const surahs = [...new Set(allWords.map(w => w.surah_name))].sort();
      setSuraList(surahs);

      // 3. Map Due Words
      const dueWordsList = dueCards.map(card => {
        const word = allLoadedWordsMap.get(card.word_id);
        return word ? { ...word, flashcard: card } : null;
      }).filter(Boolean);

      setDueWords(dueWordsList);

      // 4. Prepare Library Words
      const libraryWords = allWords.map(word => {
        const card = flashcards.find(fc => fc.word_id === word.id);
        return { ...word, flashcard: card };
      });
      setFilteredWords(libraryWords);

    } catch (error) {
      console.error("Error fetching review data:", error);
      toast({ title: "خطأ", description: "فشل تحميل بيانات المراجعة", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let result = filteredWords; // This should be all words from initial fetch, re-fetching logic needed ideally
    // For simplicity, we just filter the loaded batch. In prod, fetch with query.
    
    if (filterDifficulty !== "all") {
      result = result.filter(w => w.difficulty_level === filterDifficulty);
    }
    if (filterSurah !== "all") {
      result = result.filter(w => w.surah_name === filterSurah);
    }
    if (filterJuz !== "all") {
      result = result.filter(w => w.juz_number === parseInt(filterJuz));
    }

    // Sorting logic
    if (sortBy === "difficulty") {
       const levels = { "مبتدئ": 1, "متوسط": 2, "متقدم": 3 };
       result.sort((a, b) => (levels[a.difficulty_level] || 0) - (levels[b.difficulty_level] || 0));
    } else if (sortBy === "surah") {
       result.sort((a, b) => (a.surah_number || 999) - (b.surah_number || 999) || (a.ayah_number || 0) - (b.ayah_number || 0));
    } else if (sortBy === "alphabetical") {
       result.sort((a, b) => a.word.localeCompare(b.word));
    }

    return result;
    };

  const handleReviewAction = async (word, quality) => {
    // Quality: 0-5 (0=Fail, 3=Pass, 5=Perfect)
    // Map buttons: "Needs Review" -> 1, "Learned" -> 5
    
    const card = word.flashcard || { word_id: word.id, repetitions: 0, interval: 0, efactor: 2.5 };
    const srsResult = calculateSRS(card, quality);
    
    try {
      if (word.flashcard) {
        // Update existing
        await supabaseClient.entities.FlashCard.update(word.flashcard.id, srsResult);
      } else {
        // Create new
        await supabaseClient.entities.FlashCard.create({
          word_id: word.id,
          ...srsResult
        });
      }
      
      // Update local state
      toast({
        title: quality >= 3 ? "👍 أحسنت!" : "💪 لا عليك، ستتقنها قريباً",
        className: quality >= 3 ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"
      });

      // Move to next card if in active review
      if (reviewMode === "card" && currentReviewIndex < dueWords.length - 1) {
        setCurrentReviewIndex(prev => prev + 1);
      } else if (reviewMode === "card") {
        setReviewMode("list"); // Finished
        fetchData(); // Refresh to clear finished
      }

    } catch (error) {
      console.error("SRS Update Error:", error);
      toast({ title: "خطأ", description: "فشل حفظ التقدم", variant: "destructive" });
    }
  };

  const displayedLibraryWords = applyFilters();

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="w-12 h-12 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="w-full p-6 space-y-8">
      
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Brain className="w-8 h-8 text-primary" />
            نظام المراجعة الذكي
          </h1>
          <p className="text-muted-foreground">راجع كلماتك بناءً على خوارزمية التكرار المتباعد لضمان الحفظ المتقن.</p>
        </div>
        
        <div className="flex gap-2 items-center">
             <Button variant="ghost" size="icon" onClick={() => setShowStats(true)} title="الإحصائيات">
                <BarChart3 className="w-5 h-5" />
             </Button>
             <Button variant="ghost" size="icon" onClick={() => setShowSettings(true)} title="إعدادات الاختبار">
                <Settings className="w-5 h-5" />
             </Button>
             
            {activeTab === "daily" && dueWords.length > 0 && (
            <div className="flex gap-2 mr-2 border-r pr-2 border-gray-300 dark:border-gray-700">
                <Button onClick={() => setReviewMode("quiz")} variant="outline" className="gap-2">
                <HelpCircle className="w-4 h-4" />
                اختبار سريع
                </Button>
                <Button onClick={() => setReviewMode("card")} className="gap-2">
                <Layers className="w-4 h-4" />
                ابدأ المراجعة ({dueWords.length})
                </Button>
            </div>
            )}
        </div>
      </header>

      {/* Settings Dialog */}
      <Dialog open={showSettings} onOpenChange={setShowSettings}>
        <DialogContent>
            <DialogHeader>
                <DialogTitle>تخصيص أنواع الأسئلة</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
                <div className="flex items-center justify-between">
                    <label className="font-medium">اختيار من متعدد</label>
                    <Switch checked={quizPreferences.multipleChoice} onCheckedChange={(c) => setQuizPreferences({...quizPreferences, multipleChoice: c})} />
                </div>
                <div className="flex items-center justify-between">
                    <label className="font-medium">مطابقة الكلمات</label>
                    <Switch checked={quizPreferences.matching} onCheckedChange={(c) => setQuizPreferences({...quizPreferences, matching: c})} />
                </div>
                <div className="flex items-center justify-between">
                    <label className="font-medium">أسئلة صوتية</label>
                    <Switch checked={quizPreferences.audio} onCheckedChange={(c) => setQuizPreferences({...quizPreferences, audio: c})} />
                </div>
            </div>
        </DialogContent>
      </Dialog>

      {/* Stats Dialog */}
      <Dialog open={showStats} onOpenChange={setShowStats}>
        <DialogContent className="max-w-3xl">
            <DialogHeader>
                <DialogTitle className="flex items-center gap-2"><BarChart3 className="w-5 h-5"/> إحصائيات الأداء التفصيلية</DialogTitle>
            </DialogHeader>
            <div className="grid md:grid-cols-3 gap-4 py-6">
                <Card className="bg-blue-50 dark:bg-blue-900/20">
                    <CardContent className="p-4 text-center">
                        <div className="text-lg font-bold text-blue-700 dark:text-blue-300">اختيار من متعدد</div>
                        <div className="text-3xl font-bold mt-2">85%</div>
                        <p className="text-xs text-muted-foreground mt-1">دقة الإجابة</p>
                    </CardContent>
                </Card>
                <Card className="bg-purple-50 dark:bg-purple-900/20">
                    <CardContent className="p-4 text-center">
                        <div className="text-lg font-bold text-purple-700 dark:text-purple-300">المطابقة</div>
                        <div className="text-3xl font-bold mt-2">92%</div>
                        <p className="text-xs text-muted-foreground mt-1">دقة الإجابة</p>
                    </CardContent>
                </Card>
                <Card className="bg-green-50 dark:bg-green-900/20">
                    <CardContent className="p-4 text-center">
                        <div className="text-lg font-bold text-green-700 dark:text-green-300">الاستماع</div>
                        <div className="text-3xl font-bold mt-2">78%</div>
                        <p className="text-xs text-muted-foreground mt-1">دقة الإجابة</p>
                    </CardContent>
                </Card>
            </div>
            <div className="bg-muted/30 p-4 rounded-lg">
                <h4 className="font-bold mb-2 flex items-center gap-2"><PieChart className="w-4 h-4"/> توزيع النشاط</h4>
                <div className="h-4 bg-gray-200 rounded-full overflow-hidden flex">
                    <div className="h-full bg-blue-500" style={{width: '40%'}} title="اختيار من متعدد"></div>
                    <div className="h-full bg-purple-500" style={{width: '35%'}} title="مطابقة"></div>
                    <div className="h-full bg-green-500" style={{width: '25%'}} title="استماع"></div>
                </div>
                <div className="flex justify-between text-xs mt-2 text-muted-foreground">
                    <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-blue-500"></div> اختيار من متعدد</span>
                    <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-purple-500"></div> مطابقة</span>
                    <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-green-500"></div> استماع</span>
                </div>
            </div>
        </DialogContent>
      </Dialog>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full md:w-[400px] grid-cols-2">
          <TabsTrigger value="daily">
            <Calendar className="w-4 h-4 ml-2" />
            المراجعة اليومية
            {dueWords.length > 0 && (
              <Badge className="mr-2 bg-red-100 text-red-600 hover:bg-red-100">{dueWords.length}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="library">
            <BookOpen className="w-4 h-4 ml-2" />
            مكتبة البطاقات
          </TabsTrigger>
        </TabsList>

        {/* --- Tab: Daily Review --- */}
        <TabsContent value="daily" className="mt-6">
          <AnimatePresence mode="wait">
            
            {reviewMode === "list" && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                {dueWords.length === 0 ? (
                  <Card className="text-center p-12 bg-green-50 border-green-200">
                    <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
                    <h3 className="text-2xl font-bold text-green-800 mb-2">رائع! لقد أتممت مراجعات اليوم</h3>
                    <p className="text-green-700">عد غداً للمزيد من الكلمات، أو استكشف مكتبة البطاقات لتعلم المزيد.</p>
                    <Button onClick={() => setActiveTab("library")} variant="link" className="mt-4 text-green-800">
                      تصفح المكتبة &larr;
                    </Button>
                  </Card>
                ) : (
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {dueWords.map((word, idx) => (
                      <Card key={idx} className="cursor-pointer hover:border-primary transition-colors" onClick={() => { setCurrentReviewIndex(idx); setReviewMode("card"); }}>
                        <CardContent className="p-4 flex justify-between items-center">
                          <div>
                            <h4 className="font-bold text-lg">{word.word}</h4>
                            <p className="text-sm text-muted-foreground">{word.surah_name}</p>
                          </div>
                          <Badge variant="outline">مستحق</Badge>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </motion.div>
            )}

            {reviewMode === "card" && dueWords.length > 0 && (
              <motion.div 
                key="review-card"
                initial={{ opacity: 0, y: 20 }} 
                animate={{ opacity: 1, y: 0 }}
                className="max-w-xl mx-auto space-y-6"
              >
                <div className="flex justify-between items-center text-sm text-muted-foreground">
                  <span>بطاقة {currentReviewIndex + 1} من {dueWords.length}</span>
                  <Button variant="ghost" size="sm" onClick={() => setReviewMode("list")}>إلغاء</Button>
                </div>

                <KidsWordCard word={dueWords[currentReviewIndex]} />

                <div className="grid grid-cols-2 gap-4">
                  <Button 
                    onClick={() => handleReviewAction(dueWords[currentReviewIndex], 1)} 
                    variant="outline" 
                    className="h-16 border-red-200 hover:bg-red-50 hover:text-red-700 hover:border-red-300"
                  >
                    <XCircle className="w-5 h-5 ml-2" />
                    بحاجة لمراجعة
                  </Button>
                  <Button 
                    onClick={() => handleReviewAction(dueWords[currentReviewIndex], 5)} 
                    className="h-16 bg-green-600 hover:bg-green-700"
                  >
                    <CheckCircle className="w-5 h-5 ml-2" />
                    أتقنتها
                  </Button>
                </div>
              </motion.div>
            )}

            {reviewMode === "quiz" && (
              <SmartQuizSession 
                words={dueWords} 
                preferences={quizPreferences}
                onComplete={() => setReviewMode("list")} 
              />
            )}

          </AnimatePresence>
        </TabsContent>

        {/* --- Tab: Card Library --- */}
        <TabsContent value="library" className="mt-6">
          
          {/* Filters */}
          <div className="bg-card p-4 rounded-lg shadow-sm mb-6 flex flex-wrap gap-4 items-center">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-muted-foreground" />
              <span className="font-medium text-sm">تصفية حسب:</span>
            </div>
            
            <Select value={filterDifficulty} onValueChange={setFilterDifficulty}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="المستوى" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">كل المستويات</SelectItem>
                <SelectItem value="مبتدئ">مبتدئ</SelectItem>
                <SelectItem value="متوسط">متوسط</SelectItem>
                <SelectItem value="متقدم">متقدم</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filterSurah} onValueChange={setFilterSurah}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="السورة" />
              </SelectTrigger>
              <SelectContent className="max-h-[300px]">
                <SelectItem value="all">كل السور</SelectItem>
                {suraList.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
              </SelectContent>
            </Select>

            <Select value={filterJuz} onValueChange={setFilterJuz}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="الجزء" />
              </SelectTrigger>
              <SelectContent className="max-h-[300px]">
                <SelectItem value="all">كل الأجزاء</SelectItem>
                {Array.from({length: 30}, (_, i) => i + 1).map(j => (
                  <SelectItem key={j} value={j.toString()}>الجزء {j}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="الترتيب" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="default">الافتراضي</SelectItem>
                <SelectItem value="surah">ترتيب المصحف</SelectItem>
                <SelectItem value="difficulty">المستوى</SelectItem>
                <SelectItem value="alphabetical">أبجدي</SelectItem>
              </SelectContent>
            </Select>

            <div className="mr-auto text-sm text-muted-foreground">
              النتائج: {displayedLibraryWords.length} كلمة
            </div>
            </div>

          {/* Cards Grid */}
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {displayedLibraryWords.slice(0, 50).map((word) => ( // Show first 50 for performance
              <Card key={word.id} className="overflow-hidden flex flex-col h-full">
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-start">
                    <Badge variant="outline">{word.difficulty_level}</Badge>
                    {word.flashcard && (
                      <Badge className={getStatusLabel(word.flashcard.interval).color}>
                        {getStatusLabel(word.flashcard.interval).label}
                      </Badge>
                    )}
                  </div>
                  <CardTitle className="text-center text-2xl py-2">{word.word}</CardTitle>
                </CardHeader>
                <CardContent className="flex-1 flex flex-col gap-4">
                  <p className="text-center text-muted-foreground">{word.meaning}</p>
                  
                  <div className="mt-auto pt-4 flex gap-2">
                    {/* Reuse KidsWordCard logic but simpler? No, user wants full card. 
                        Let's use a simplified action bar since KidsCard is big */}
                    <Button 
                      onClick={() => handleReviewAction(word, 1)} 
                      variant="outline" 
                      className="flex-1 text-xs h-8 border-yellow-200 hover:bg-yellow-50"
                    >
                      <RotateCcw className="w-3 h-3 ml-1" />
                       مراجعة
                    </Button>
                    <Button 
                      onClick={() => handleReviewAction(word, 5)} 
                      variant="outline" 
                      className="flex-1 text-xs h-8 border-green-200 hover:bg-green-50"
                    >
                      <CheckCircle className="w-3 h-3 ml-1" />
                      مُدرَكة
                    </Button>
                  </div>
                  
                  {/* Expand for full details (KidsCard) in a Dialog if needed, or inline. 
                      Since user asked for "Cards" display, let's keep it grid but clickable to expand */}
                  <DialogTriggerButton word={word} />
                </CardContent>
              </Card>
            ))}
          </div>
          {displayedLibraryWords.length > 50 && (
             <p className="text-center text-muted-foreground mt-8">يتم عرض أول 50 نتيجة فقط. استخدم الفلتر لتضييق البحث.</p>
          )}

        </TabsContent>
      </Tabs>
    </div>
  );
}

// Helper component for Dialog
const DialogTriggerButton = ({ word }) => {
  // تنسيق التاريخ
  const formatDate = (dateStr) => {
    if (!dateStr) return "لم تتم المراجعة بعد";
    return new Date(dateStr).toLocaleDateString('ar-SA');
  };

  const card = word.flashcard || {};

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="secondary" className="w-full mt-2">عرض التفاصيل الكاملة</Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto p-0">
        <div className="p-6 space-y-6">
          <KidsWordCard word={word} />
          
          {/* Review History / Stats Section */}
          <div className="bg-slate-50 dark:bg-slate-900 rounded-xl p-4 border border-slate-200 dark:border-slate-700">
            <h4 className="font-bold text-slate-800 dark:text-slate-200 mb-4 flex items-center gap-2">
              <Brain className="w-4 h-4" />
              إحصائيات المراجعة
            </h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="bg-white dark:bg-slate-800 p-3 rounded-lg shadow-sm">
                <span className="text-slate-500 block mb-1">عدد التكرارات</span>
                <span className="font-bold text-lg text-primary">{card.repetitions || 0}</span>
              </div>
              <div className="bg-white dark:bg-slate-800 p-3 rounded-lg shadow-sm">
                <span className="text-slate-500 block mb-1">الفاصل الزمني</span>
                <span className="font-bold text-lg text-blue-600">{card.interval || 0} يوم</span>
              </div>
              <div className="bg-white dark:bg-slate-800 p-3 rounded-lg shadow-sm">
                <span className="text-slate-500 block mb-1">آخر مراجعة</span>
                <span className="font-medium">{formatDate(card.last_review)}</span>
              </div>
              <div className="bg-white dark:bg-slate-800 p-3 rounded-lg shadow-sm">
                <span className="text-slate-500 block mb-1">المراجعة القادمة</span>
                <span className="font-medium">{formatDate(card.next_review)}</span>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
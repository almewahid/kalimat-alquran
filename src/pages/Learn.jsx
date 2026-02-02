import React, { useState, useEffect, useCallback } from "react";
import { supabaseClient } from "@/components/api/supabaseClient";
import { getDueCards, updateCardWithSM2 } from "../components/srs/SRSAlgorithm";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";
import { useToast } from "@/components/ui/use-toast";
import { ArrowRight, ArrowLeft, CheckCircle, Brain, Trophy, Zap, Loader2, RotateCcw, Shuffle, Star, AlertCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

import WordCard from "../components/learn/WordCard";
import KidsWordCard from "../components/kids/KidsWordCard";
import LearningProgress from "../components/learn/LearningProgress";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";

import { triggerConfetti } from "../components/common/Confetti";
import { playSound } from "../components/common/SoundEffects";

import { WordsCache } from "../components/utils/WordsCache";

const createPageUrl = (pageName) => `/${pageName}`;

export default function Learn() {
  const { toast } = useToast();
  const [words, setWords] = useState([]);
  const [originalWords, setOriginalWords] = useState([]); // ✅ حفظ الترتيب الأصلي
  const [currentIndex, setCurrentIndex] = useState(0);
  const [learnedTodayCount, setLearnedTodayCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [flashCardMap, setFlashCardMap] = useState(new Map());
  const [displayWord, setDisplayWord] = useState(null);
  const [userLevel, setUserLevel] = useState(null);
  const [isShuffled, setIsShuffled] = useState(false);
  const [reviewWord, setReviewWord] = useState(null);
  const [isMarkingLearned, setIsMarkingLearned] = useState(false);

  const [userPreferences, setUserPreferences] = useState({
    sound_effects_enabled: true,
    confetti_enabled: true
  });

  useEffect(() => {
    const loadPreferences = async () => {
      try {
        const currentUser = await supabaseClient.auth.me();
        if (currentUser.preferences) {
          setUserPreferences({
            sound_effects_enabled: currentUser.preferences.sound_effects_enabled !== false,
            confetti_enabled: currentUser.preferences.confetti_enabled !== false
          });
        }
      } catch (error) {
        console.log("Could not load preferences:", error);
      }
    };
    loadPreferences();
  }, []);

  const loadLearningData = useCallback(async () => {
    setIsLoading(true);
    try {
      const currentUser = await supabaseClient.auth.me();
      setUser(currentUser);
      
      const level = currentUser?.preferences?.learning_level || "all";
      setUserLevel(level);
      
      console.log('[Learn.js] 🔍 بدء تحميل البيانات...');
      console.log('[Learn.js] 👤 المستخدم:', currentUser.email);
      console.log('[Learn.js] 📊 المستوى المحدد:', level);
      
      let allWords;
      let allFlashCards;

      WordsCache.clear();
      
      const flashCardsPromise = supabaseClient.entities.FlashCard.filter({ created_by: currentUser.email });

      // Fetch words efficiently
      // If level is specific, filter by it. If 'all', limit to 200.
      let wordsPromise;
      if (level && level !== "all") {
          wordsPromise = supabaseClient.entities.QuranicWord.filter({ difficulty_level: level });
      } else {
          wordsPromise = supabaseClient.entities.QuranicWord.list("-created_date", 200);
      }

      [allWords, allFlashCards] = await Promise.all([
        wordsPromise,
        flashCardsPromise,
      ]);
      WordsCache.set(allWords);
      
      console.log('[Learn.js] 📚 إجمالي الكلمات المحملة:', allWords.length);
      
      console.log('[Learn.js] 🔍 عينة من مستويات الصعوبة:');
      allWords.slice(0, 5).forEach(w => {
        console.log(`  - الكلمة: "${w.word}", المستوى: "${w.difficulty_level}", النوع: ${typeof w.difficulty_level}`);
      });
      
      const uniqueLevels = [...new Set(allWords.map(w => w.difficulty_level))].filter(Boolean);
      console.log('[Learn.js] 📋 جميع المستويات المتاحة:', uniqueLevels);
      
      let levelFilteredWords = allWords;
      if (level !== "all") {
        levelFilteredWords = allWords.filter(word => {
          const wordLevel = (word.difficulty_level || "").trim();
          const targetLevel = level.trim();
          return wordLevel === targetLevel;
        });
        console.log(`[Learn.js] 🎯 كلمات بعد فلترة المستوى (${level}):`, levelFilteredWords.length);
        
        if (levelFilteredWords.length === 0) {
          console.log('[Learn.js] ⚠️ لم نجد كلمات بمستوى:', level);
          console.log('[Learn.js] 💡 المستويات المتاحة هي:', uniqueLevels);
        }
      }
      
      if (levelFilteredWords.length === 0 && level !== "all") {
        toast({
          title: "⚠️ لا توجد كلمات بهذا المستوى",
          description: `لم نجد كلمات بمستوى "${level}". المستويات المتاحة: ${uniqueLevels.length > 0 ? uniqueLevels.join('، ') : 'لا توجد مستويات محددة'}. يمكنك تغيير المستوى من الإعدادات أو إضافة كلمات جديدة.`,
          variant: "destructive",
          duration: 8000
        });
        setWords([]);
        setOriginalWords([]);
        setIsLoading(false);
        return;
      }
      
      let filteredWords = levelFilteredWords;
      if (currentUser.preferences) {
        const { source_type, selected_juz, selected_surahs } = currentUser.preferences;
        
        console.log('[Learn.js] 🔧 إعدادات المصدر:', { source_type, selected_juz, selected_surahs });
        
        if (source_type === 'juz' && selected_juz?.length > 0) {
            const beforeJuzFilter = filteredWords.length;
            filteredWords = filteredWords.filter(word => selected_juz.includes(word.juz_number));
            console.log('[Learn.js] 📖 كلمات بعد فلترة الأجزاء:', filteredWords.length, `(كان ${beforeJuzFilter})`);
            
            if (filteredWords.length === 0 && beforeJuzFilter > 0) {
              toast({
                title: "⚠️ لا توجد كلمات في الأجزاء المحددة",
                description: "لم نجد كلمات في الأجزاء التي اخترتها. جرب اختيار أجزاء أخرى أو اختر 'جميع القرآن' من الإعدادات.",
                variant: "destructive",
                duration: 6000
              });
              setWords([]);
              setOriginalWords([]);
              setIsLoading(false);
              return;
            }
        } else if (source_type === 'surah' && selected_surahs?.length > 0) {
            const beforeSurahFilter = filteredWords.length;
            filteredWords = filteredWords.filter(word => selected_surahs.includes(word.surah_name));
            console.log('[Learn.js] 📜 كلمات بعد فلترة السور:', filteredWords.length, `(كان ${beforeSurahFilter})`);
            
            if (filteredWords.length === 0 && beforeSurahFilter > 0) {
              toast({
                title: "⚠️ لا توجد كلمات في السور المحددة",
                description: "لم نجد كلمات في السور التي اخترتها. جرب اختيار سور أخرى أو اختر 'جميع القرآن' من الإعدادات.",
                variant: "destructive",
                duration: 6000
              });
              setWords([]);
              setOriginalWords([]);
              setIsLoading(false);
              return;
            }
        } else {
          console.log('[Learn.js] ✅ لا توجد فلترة مصدر (جميع القرآن)');
        }
      }

      console.log('[Learn.js] ✅ إجمالي الكلمات بعد الفلترة:', filteredWords.length);

      const newFlashCardMap = new Map(allFlashCards.map(fc => [fc.word_id, fc]));
      setFlashCardMap(newFlashCardMap);
      
      console.log('[Learn.js] 🃏 عدد FlashCards:', allFlashCards.length);
      
      const dueFlashCards = getDueCards(allFlashCards);
      console.log('[Learn.js] ⏰ عدد FlashCards المستحقة للمراجعة:', dueFlashCards.length);
      
      const dueWordIds = new Set(dueFlashCards.map(fc => fc.word_id));
      const reviewWords = filteredWords.filter(word => dueWordIds.has(word.id));
      console.log('[Learn.js] 📝 كلمات المراجعة:', reviewWords.length);
      
      const newWords = filteredWords.filter(word => !newFlashCardMap.has(word.id));
      console.log('[Learn.js] 🆕 كلمات جديدة:', newWords.length);
      
      const sortedReviewWords = reviewWords.sort((a, b) => {
        const fcA = newFlashCardMap.get(a.id);
        const fcB = newFlashCardMap.get(b.id);
        const dateA = fcA ? new Date(fcA.next_review) : new Date(0);
        const dateB = fcB ? new Date(fcB.next_review) : new Date(0);
        return dateA.getTime() - dateB.getTime();
      });

      const sessionWords = [...sortedReviewWords, ...newWords];
      console.log('[Learn.js] 🎓 إجمالي كلمات الجلسة:', sessionWords.length);
      
      if (sessionWords.length > 0) {
        console.log('[Learn.js] 📝 أول كلمة في الجلسة:', sessionWords[0].word);
      }
      
      setWords(sessionWords);
      setOriginalWords(sessionWords); // ✅ حفظ الترتيب الأصلي
      setCurrentIndex(0);
      setIsShuffled(false); // ✅ إعادة تعيين حالة الخلط
      
      console.log('[Learn.js] ✅ تم تحميل البيانات بنجاح');
      
    } catch (error) {
      console.error("[Learn.js] ❌ خطأ في تحميل البيانات:", error);
      toast({
        title: "خطأ في تحميل البيانات",
        description: "حدث خطأ أثناء تحميل كلمات التعلم والمراجعة. يرجى المحاولة مرة أخرى.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    loadLearningData();
  }, [loadLearningData]);

  useEffect(() => {
    console.log('[Learn.js] 🔄 تحديث displayWord, currentIndex:', currentIndex, 'words.length:', words.length);
    if (words.length > 0 && currentIndex < words.length) {
      const word = words[currentIndex];
      console.log('[Learn.js] 📌 عرض الكلمة:', word?.word);
      setDisplayWord(word);
    } else {
      console.log('[Learn.js] ⚠️ لا توجد كلمة لعرضها');
      setDisplayWord(null);
    }
  }, [currentIndex, words]);


  const handleWordLearned = async () => {
    if (!displayWord || !user) return;
    
    setIsMarkingLearned(true); // ✅ تفعيل حالة "جاري التعليم" لإظهار الصح فوراً
    
    const currentWord = displayWord;
    const isNew = !flashCardMap.has(currentWord.id);
    
    if (isNew) {
      try {
        let [progress] = await supabaseClient.entities.UserProgress.filter({ created_by: user.email });

        let oldTotalXP = progress?.total_xp || 0;

        if (!progress) {
          progress = await supabaseClient.entities.UserProgress.create({ created_by: user.email });
        }

        const newCardData = { word_id: currentWord.id, created_by: user.email, is_new: true };
        const flashcard = await supabaseClient.entities.FlashCard.create(newCardData);

        const updatedCard = updateCardWithSM2(flashcard, 5);
        await supabaseClient.entities.FlashCard.update(flashcard.id, updatedCard);

        const xpGained = 10;
        const newTotalXP = oldTotalXP + xpGained;
        const newLearnedWords = [...new Set([...(progress.learned_words || []), currentWord.id])];

        await supabaseClient.entities.UserProgress.update(progress.id, {
          learned_words: newLearnedWords,
          words_learned: newLearnedWords.length,
          total_xp: newTotalXP,
          current_level: Math.floor(newTotalXP / 100) + 1
        });
  
        setFlashCardMap(prevMap => new Map(prevMap).set(flashcard.word_id, updatedCard));
        setLearnedTodayCount(prev => prev + 1);
        
        if (userPreferences.sound_effects_enabled) {
          playSound('achievement');
        }

        const newLevel = Math.floor(newTotalXP / 100) + 1;
        const oldLevel = Math.floor(oldTotalXP / 100) + 1;
        
        if (newLevel > oldLevel && userPreferences.confetti_enabled) {
          triggerConfetti('levelUp');
        }

        toast({
          title: "✅ تم الحفظ بنجاح",
          description: "أحسنت! الكلمة أُضيفت إلى مراجعاتك.",
          duration: 3000,
          className: "bg-green-100 text-green-800 top-0 right-0",
        });
      } catch (error) {
        console.error("Error marking new word as learned:", error);
        toast({
          title: "خطأ في حفظ الكلمة",
          description: "حدث خطأ في حفظ التقدم. يرجى المحاولة مرة أخرى.",
          variant: "destructive",
        });
        setIsMarkingLearned(false);
        return;
      }
    } else {
      try {
        const flashcard = flashCardMap.get(currentWord.id);
        if (!flashcard) {
          console.warn("Flashcard not found for review word:", currentWord.id);
          setIsMarkingLearned(false);
          return;
        }

        const updatedCard = updateCardWithSM2(flashcard, 5);
        await supabaseClient.entities.FlashCard.update(flashcard.id, updatedCard);
        
        setFlashCardMap(prevMap => new Map(prevMap).set(flashcard.word_id, updatedCard));
        
        toast({
          title: "🔁 تمت المراجعة",
          description: updatedCard.next_review_message || "ستظهر لك هذه الكلمة مجددًا في المستقبل.",
          duration: 4000,
          className: "bg-blue-100 text-blue-800 top-0 right-0",
        });
      } catch (error) {
        console.error("Error marking word as reviewed:", error);
        toast({
          title: "خطأ في تحديث المراجعة",
          description: "حدث خطأ في تحديث المراجعة. يرجى المحاولة مرة أخرى.",
          variant: "destructive",
        });
        setIsMarkingLearned(false);
        return;
      }
    }
    
    // ✅ الانتقال للكلمة التالية بدلاً من حذف الحالية للحفاظ على الخريطة
    setTimeout(() => {
      setIsMarkingLearned(false);
      if (currentIndex < words.length - 1) {
        setCurrentIndex(prev => prev + 1);
      } else {
        // إذا وصلنا لنهاية القائمة، نعيد التحميل
        loadLearningData();
      }
    }, 600); // تأخير بسيط لرؤية الصح
  };


  const goToNext = () => {
    if (currentIndex < words.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      loadLearningData();
    }
  };

  const goToPrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  // ✅ خلط الكلمات
  const shuffleWords = () => {
    const shuffled = [...words].sort(() => Math.random() - 0.5);
    setWords(shuffled);
    setCurrentIndex(0);
    setIsShuffled(true);
  };

  // ✅ إعادة الترتيب الأصلي
  const restoreOrder = () => {
    setWords([...originalWords]);
    setCurrentIndex(0);
    setIsShuffled(false);
  };

  const resetSession = () => {
    loadLearningData();
    setCurrentIndex(0);
  };

  // ✅ حفظ كلمة كـ "صعبة"
  const markAsDifficult = async () => {
    if (!displayWord || !user) return;
    
    try {
      // تحقق من وجود السجل
      const existingRecords = await supabaseClient.entities.FavoriteWord.filter({
        word_id: displayWord.id,
        created_by: user.email
      });

      if (existingRecords.length === 0) {
        await supabaseClient.entities.FavoriteWord.create({
          word_id: displayWord.id
        });

        toast({
          title: "⭐ تم الإضافة للمفضلة",
          description: "يمكنك مراجعة هذه الكلمة من صفحة المفضلة",
          className: "bg-amber-100 text-amber-800"
        });
      } else {
        toast({
          title: "ℹ️ الكلمة موجودة بالفعل",
          description: "هذه الكلمة مضافة مسبقاً للمفضلة",
          className: "bg-blue-100 text-blue-800"
        });
      }
    } catch (error) {
      console.error("Error marking as difficult:", error);
      toast({
        title: "خطأ",
        description: "حدث خطأ أثناء إضافة الكلمة للمفضلة",
        variant: "destructive"
      });
    }
  };
  
  const currentWord = displayWord;
  const isReviewWord = currentWord && flashCardMap.has(currentWord.id) && !flashCardMap.get(currentWord.id)?.is_new;

  if (isLoading || (words.length > 0 && !displayWord)) {
    return (
      <div className="p-6 flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-primary mx-auto animate-spin" />
          <p className="text-foreground/70 mt-4">جارٍ تحضير جلسة التعلم...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto relative z-10">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex-1" />
            <h1 className="text-3xl md:text-4xl font-bold gradient-text text-center">
              تعلم ومراجعة
            </h1>
            <div className="flex-1 flex justify-end gap-2">
              {isShuffled ? (
                <Button 
                  variant="outline" 
                  size="icon"
                  onClick={restoreOrder}
                  title="إعادة الترتيب الأصلي"
                  className="rounded-full"
                >
                  <RotateCcw className="w-5 h-5" />
                </Button>
              ) : (
                <Button 
                  variant="outline" 
                  size="icon"
                  onClick={shuffleWords}
                  title="خلط الكلمات"
                  className="rounded-full"
                >
                  <Shuffle className="w-5 h-5" />
                </Button>
              )}
              <Button 
                variant="outline" 
                size="icon"
                onClick={resetSession}
                title="بدء جلسة جديدة"
                className="rounded-full"
              >
                <RotateCcw className="w-5 h-5" />
              </Button>
            </div>
          </div>
          <p className="text-center text-foreground/70 mb-6 md:mb-8">ابدأ رحلتك في تعلم كلمات القرآن الكريم.</p>
          
          <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
            <p className="text-sm text-blue-800 dark:text-blue-300 text-center">
              💡 <strong>ملاحظة:</strong> يمكنك التحكم في ظهور عناصر بطاقة التعلم من خلال: <strong>الإعدادات → عناصر البطاقة → حفظ التغييرات</strong>
            </p>
          </div>
          
          <LearningProgress 
            words={words}
            currentIndex={currentIndex}
            learnedToday={learnedTodayCount}
            onReviewWord={setReviewWord}
            isMarkingLearned={isMarkingLearned}
          />
        </motion.div>

        {/* ✅ نافذة المراجعة السريعة */}
        <Dialog open={!!reviewWord} onOpenChange={(open) => !open && setReviewWord(null)}>
          <DialogContent className="max-w-lg p-0 overflow-hidden bg-transparent border-none shadow-none">
             {reviewWord && (
               <div className="relative">
                 <div className="absolute top-2 right-2 z-50">
                   {/* Close handled by Dialog usually, but we can add explicit close if needed */}
                 </div>
                 <KidsWordCard 
                    word={reviewWord} 
                    onMarkLearned={() => setReviewWord(null)} // Close on "Learned" click (simulating done)
                 />
               </div>
             )}
          </DialogContent>
        </Dialog>

        {words.length === 0 ? (
           <div className="text-center max-w-lg mx-auto mt-12">
            <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }}>
              <Card className="bg-card shadow-md rounded-2xl border border-border p-8 transition-all duration-300 ease-in-out hover:shadow-lg">
                <CheckCircle className="w-16 h-16 text-primary mx-auto mb-4" />
                <h2 className="text-2xl font-bold text-foreground mb-2">أحسنت صنعًا!</h2>
                <p className="text-foreground/70 mb-6">
                  لا توجد كلمات جديدة أو مراجعات مستحقة الآن. أنت على اطلاع دائم!
                </p>
                <Button asChild size="lg" className="bg-primary hover:bg-primary/90 rounded-xl">
                  <Link to={createPageUrl("Quiz")}>
                    <Brain className="w-5 h-5 ml-2" />
                    اختبر معرفتك الآن
                  </Link>
                </Button>
              </Card>
            </motion.div>
          </div>
        ) : (
          <div className="grid lg:grid-cols-3 gap-6 md:gap-8">
            <div className="lg:col-span-2">
              <AnimatePresence mode="wait">
                {/* ✅ عرض بطاقة خاصة للمبتدئين */}
                {userLevel === "مبتدئ" ? (
                  <KidsWordCard 
                    key={currentWord?.id || currentIndex}
                    word={currentWord}
                    onMarkLearned={handleWordLearned}
                  />
                ) : (
                  <WordCard 
                    key={currentWord?.id || currentIndex}
                    word={currentWord}
                    onMarkLearned={handleWordLearned}
                    isReviewWord={isReviewWord} 
                    userLevel={userLevel}
                  />
                )}
              </AnimatePresence>

              {/* زر إضافة للمفضلة */}
              <div className="flex justify-center mt-4">
                <Button
                  variant="outline"
                  size="lg"
                  onClick={markAsDifficult}
                  className="gap-2 bg-amber-50 hover:bg-amber-100 border-amber-300 text-amber-700 dark:bg-amber-900/20 dark:hover:bg-amber-900/30"
                >
                  <Star className="w-5 h-5" />
                  إضافة للمفضلة
                </Button>
              </div>

              <div className="flex justify-between items-center mt-6">
                <Button
                  variant="outline"
                  size="lg"
                  onClick={goToPrevious}
                  disabled={currentIndex === 0}
                  className="flex items-center gap-2 rounded-xl bg-card"
                >
                  <ArrowRight className="w-5 h-5" />
                  السابق
                </Button>
                
                <div className="text-center">
                  <p className="text-sm font-medium text-foreground/70">
                    {currentIndex + 1} / {words.length}
                  </p>
                </div>

                <Button
                  size="lg"
                  onClick={goToNext}
                  disabled={currentIndex === words.length - 1}
                  className="flex items-center gap-2 rounded-xl bg-primary text-primary-foreground"
                >
                  التالي
                  <ArrowLeft className="w-5 h-5" />
                </Button>
              </div>
            </div>

            <div className="space-y-6 md:space-y-8">
              <Card className="bg-card shadow-md rounded-2xl border border-border transition-all duration-300 ease-in-out hover:shadow-lg">
                <CardHeader>
                  <CardTitle className="text-primary font-semibold text-lg flex items-center gap-2">
                    <Trophy className="w-5 h-5 text-primary" />
                    إنجازات اليوم
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-foreground/80">كلمات جديدة</span>
                      <Badge className="bg-primary/10 text-primary rounded-md">
                        {learnedTodayCount}
                      </Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-foreground/80">نقاط الخبرة</span>
                      <Badge className="bg-background-soft text-foreground border border-border rounded-md">
                        +{learnedTodayCount * 10} XP
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-card shadow-md rounded-2xl border border-border transition-all duration-300 ease-in-out hover:shadow-lg">
                <CardContent className="p-6">
                  <div className="text-center">
                    <Zap className="w-12 h-12 mx-auto mb-3 text-primary" />
                    <h3 className="text-lg font-bold text-primary mb-2">استمر في التقدم</h3>
                    <p className="text-foreground/80 text-sm mb-4">
                      حوّل معرفتك إلى نقاط في قسم الاختبار.
                    </p>
                    <Button asChild variant="default" className="w-full rounded-xl">
                      <Link to={createPageUrl("Quiz")}>
                        <Brain className="w-4 h-4 ml-2" />
                        ابدأ الاختبار
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
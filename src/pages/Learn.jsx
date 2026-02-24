import React, { useState, useEffect, useCallback } from "react";
import { supabaseClient } from "@/components/api/supabaseClient";
import { getDueCards, updateCardWithSM2 } from "../components/srs/SRSAlgorithm";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { useToast } from "@/components/ui/use-toast";
import { ArrowRight, ArrowLeft, Brain, Loader2, RotateCcw, Shuffle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

import WordCard from "../components/learn/WordCard";
import KidsWordCard from "../components/kids/KidsWordCard";
import LearningProgress from "../components/learn/LearningProgress";
import { Dialog, DialogContent } from "@/components/ui/dialog";

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
      
      const flashCardsPromise = supabaseClient.entities.FlashCard.filter({ user_email: currentUser.email });

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
        let [progress] = await supabaseClient.entities.UserProgress.filter({ user_email: user.email });
        
        let oldTotalXP = progress?.total_xp || 0;
        
        if (!progress) {
          progress = await supabaseClient.entities.UserProgress.create({ 
            user_email: user.email,
            total_xp: 0,
            current_level: 1,
            words_learned: 0,
            learned_words: []
          });
        }

        // ✅ تحقق من وجود FlashCard
        const [existingCard] = await supabaseClient.entities.FlashCard.filter({
          user_email: user.email,
          word_id: currentWord.id
        });

        let flashcard;
        if (existingCard) {
          console.log('FlashCard already exists, updating...');
          flashcard = existingCard;
        } else {
          const newCardData = { 
            word_id: String(currentWord.id), // ✅ Text type
            user_email: user.email,
            user_id: user.id, // ✅ إضافة user_id
            is_new: true,
            interval: 0,
            efactor: 2.5, // ✅ اسم صحيح
            repetitions: 0,
            next_review: new Date().toISOString() // ✅ اسم صحيح
          };
          
          // ✅ استخدام Supabase مباشرة
          const { data, error } = await supabaseClient.supabase
            .from('flash_cards')
            .insert([newCardData])
            .select()
            .single();
            
          if (error) throw error;
          flashcard = data;
        }

        const updatedCard = updateCardWithSM2(flashcard, 5);
        
        // ✅ تحديث FlashCard باستخدام Supabase مباشرة
        const { error: updateCardError } = await supabaseClient.supabase
          .from('flash_cards')
          .update(updatedCard)
          .eq('id', flashcard.id);
        
        if (updateCardError) throw updateCardError;

        const xpGained = 10;
        const newTotalXP = oldTotalXP + xpGained;
        const newLearnedWords = [...new Set([...(progress.learned_words || []), currentWord.id])];

        // ✅ تحديث UserProgress باستخدام Supabase مباشرة
        const { error: updateProgressError } = await supabaseClient.supabase
          .from('user_progress')
          .update({
            learned_words: newLearnedWords,
            words_learned: newLearnedWords.length,
            total_xp: newTotalXP,
            current_level: Math.floor(newTotalXP / 100) + 1
          })
          .eq('id', progress.id);
        
        if (updateProgressError) throw updateProgressError;

        console.log('✅ Progress updated:', { 
          words_learned: newLearnedWords.length, 
          total_xp: newTotalXP 
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
          duration: 3000,
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
        user_email: user.email
      });

      if (existingRecords.length === 0) {
        await supabaseClient.entities.FavoriteWord.create({
          word_id: displayWord.id
        });

        toast({
          title: "⭐ تم الإضافة للمفضلة",
          description: "يمكنك مراجعة هذه الكلمة من صفحة المفضلة",
          duration: 3000,
        });
      } else {
        toast({
          title: "ℹ️ الكلمة موجودة بالفعل",
          description: "هذه الكلمة مضافة مسبقاً للمفضلة",
          duration: 3000,
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
          <p className="text-foreground/70 mt-4">لحظة... نُحضّر كلماتك! 🌟</p>
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
          <div className="flex items-center justify-between mb-6 gap-2">
            {/* أقصى اليمين: زر الخلط */}
            <div className="flex-shrink-0">
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
            </div>

            {/* الوسط: العنوان الملوّن */}
            <h1 className="text-2xl md:text-3xl font-black text-center flex-1">
              <span className="bg-gradient-to-r from-yellow-400 via-pink-500 to-purple-500 bg-clip-text text-transparent">
                تعلَّ وارتقِ
              </span>
              {" "}
              <span className="inline-block animate-bounce">🌟</span>
            </h1>

            {/* أقصى اليسار: مربعا الإحصاء */}
            <div className="flex gap-2 flex-shrink-0">
              <div className="bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800 rounded-xl px-3 py-1.5 text-center min-w-[56px]">
                <p className="text-[10px] text-indigo-500 font-medium leading-none mb-0.5">إنجاز اليوم</p>
                <p className="text-base font-black text-indigo-700 dark:text-indigo-300 leading-none">+{learnedTodayCount}</p>
              </div>
              <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-xl px-3 py-1.5 text-center min-w-[56px]">
                <p className="text-[10px] text-emerald-500 font-medium leading-none mb-0.5">النجوم</p>
                <p className="text-base font-black text-emerald-700 dark:text-emerald-300 leading-none">⭐{learnedTodayCount * 10}</p>
              </div>
            </div>
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
                <span className="text-6xl block mx-auto mb-4">🌟</span>
                <h2 className="text-2xl font-bold text-foreground mb-2">أحسنت! تعلمت كل كلمات اليوم!</h2>
                <p className="text-foreground/70 mb-6">
                  لا توجد كلمات جديدة الآن، تعال غداً لتتعلم المزيد!
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
          <div className="max-w-2xl mx-auto">
            <AnimatePresence mode="wait">
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

            <div className="flex justify-between items-center mt-6">
              <Button
                variant="outline"
                size="lg"
                onClick={goToPrevious}
                disabled={currentIndex === 0}
                className="h-14 px-6 flex items-center gap-2 rounded-2xl bg-card text-base font-bold"
              >
                <ArrowRight className="w-6 h-6" />
                السابق
              </Button>

              <p className="text-base font-bold text-foreground/70">
                {currentIndex + 1} / {words.length}
              </p>

              <Button
                size="lg"
                onClick={goToNext}
                disabled={currentIndex === words.length - 1}
                className="h-14 px-6 flex items-center gap-2 rounded-2xl bg-primary text-primary-foreground text-base font-bold"
              >
                التالي
                <ArrowLeft className="w-6 h-6" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
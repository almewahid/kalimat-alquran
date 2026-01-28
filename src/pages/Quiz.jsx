
import React, { useState, useEffect, useCallback, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { updateCardWithSM2, getDueCards } from "../components/srs/SRSAlgorithm";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  Brain,
  Clock,
  Trophy,
  RotateCcw,
  Heart,
  Loader2,
  CheckCircle,
  Play
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

import QuizQuestion from "../components/quiz/QuizQuestion";
import QuizResults from "../components/quiz/QuizResults";
import HeartsDisplay from "../components/common/HeartsDisplay";
import TasbihModal from "../components/common/TasbihModal";
import DifficultyRating from "../components/quiz/DifficultyRating";

import WaveEffect from "../components/common/WaveEffect";
import { playSound } from "../components/common/SoundEffects";
import { triggerConfetti } from "../components/common/Confetti";
import { useToast } from "@/components/ui/use-toast";

export default function Quiz() {
  const { toast } = useToast();
  
  const [quizState, setQuizState] = useState('setup');
  const [questions, setQuestions] = useState([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState([]);
  const [timeLeft, setTimeLeft] = useState(30);
  const [startTime, setStartTime] = useState(null);
  const [hearts, setHearts] = useState(5);
  const [showTasbihModal, setShowTasbihModal] = useState(false);
  const [quizEnded, setQuizEnded] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [quizMode, setQuizMode] = useState('');
  const [userLevel, setUserLevel] = useState(null);

  const audioPlayerRef = useRef(null);

  const [showDifficultyRating, setShowDifficultyRating] = useState(false);
  const [pendingAnswerData, setPendingAnswerData] = useState(null);
  const [isProcessingRating, setIsProcessingRating] = useState(false); // 🔥 NEW: منع الضغط المتكرر

  const [showWaveEffect, setShowWaveEffect] = useState(false);
  const [userPreferences, setUserPreferences] = useState({
    sound_effects_enabled: true,
    confetti_enabled: true,
    animations_enabled: true
  });

  const [quizTimeLimit, setQuizTimeLimit] = useState(30); // NEW

  // Effect to load user preferences on component mount
  useEffect(() => {
    const loadPreferences = async () => {
      try {
        const user = await base44.auth.me();
        if (user.preferences) {
          setUserPreferences({
            sound_effects_enabled: user.preferences.sound_effects_enabled !== false,
            confetti_enabled: user.preferences.confetti_enabled !== false,
            animations_enabled: user.preferences.animations_enabled !== false
          });
          // Also set the initial quizTimeLimit from preferences if available
          setQuizTimeLimit(user.preferences.quiz_time_limit !== undefined ? user.preferences.quiz_time_limit : 30);
        }
      } catch (error) {
        console.log("Could not load preferences:", error);
      }
    };
    loadPreferences();
  }, []);

  const playAudioUrl = useCallback((url) => {
    if (audioPlayerRef.current && url) {
        audioPlayerRef.current.src = url;
        audioPlayerRef.current.play().catch(e => console.log(e));
    }
  }, []);

  const finishQuiz = useCallback(async (finalAnswers) => {
    setQuizEnded(true);
    const correctCount = finalAnswers.filter(a => a.is_correct).length;
    const totalTime = Math.floor((Date.now() - startTime) / 1000);
    const baseXP = correctCount * 15;
    const heartBonus = hearts * 5;
    const xpEarned = baseXP + heartBonus;

    // Perfect score celebration
    if (correctCount === questions.length && questions.length > 0 && userPreferences.confetti_enabled) {
      triggerConfetti('perfectScore');
      toast({
        title: "أحسنت!",
        description: "لقد حققت علامة كاملة في هذا الاختبار!",
        duration: 5000,
      });
    }

    try {
      await base44.entities.QuizSession.create({
        score: Math.round((correctCount / questions.length) * 100),
        total_questions: questions.length,
        correct_answers: correctCount,
        xp_earned: xpEarned,
        questions_data: finalAnswers,
        completion_time: totalTime
      });

      const user = await base44.auth.me();
      const [currentProgress] = await base44.entities.UserProgress.filter({ created_by: user.email });

      if (currentProgress) {
        const newTotalXP = (currentProgress.total_xp || 0) + xpEarned;
        const previousLevel = currentProgress.current_level || 0;
        const newLevel = Math.floor(newTotalXP / 100) + 1;
        const newStreak = correctCount >= questions.length * 0.7 ?
          (currentProgress.quiz_streak || 0) + 1 : 0;

        await base44.entities.UserProgress.update(currentProgress.id, {
          total_xp: newTotalXP,
          current_level: newLevel,
          quiz_streak: newStreak,
          last_quiz_date: new Date().toISOString().split('T')[0],
        });

        // Check for level up and trigger confetti/toast
        if (newLevel > previousLevel && userPreferences.confetti_enabled) {
          triggerConfetti('levelUp');
          toast({
            title: "تهانينا!",
            description: `لقد وصلت إلى المستوى ${newLevel}!`,
            duration: 5000,
          });
        }
      }

      setQuizState('results');
    } catch (error) {
      console.error("Error finishing quiz:", error);
      toast({
        title: "خطأ",
        description: "حدث خطأ أثناء إنهاء الاختبار.",
        variant: "destructive",
      });
    }
  }, [startTime, questions, hearts, userPreferences, toast]);

  const moveToNextQuestion = useCallback(() => {
     if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
      setTimeLeft(quizTimeLimit); // Reset time for next question
    } else {
      finishQuiz([...answers, pendingAnswerData]);
    }
  }, [currentQuestionIndex, questions.length, answers, pendingAnswerData, finishQuiz, quizTimeLimit]);

  const processAnswerSRS = useCallback(async (quality) => {
      if (!pendingAnswerData || isProcessingRating) return; // 🔥 منع الضغط المتكرر
      
      setIsProcessingRating(true); // 🔥 قفل الزر

      const { word_id } = pendingAnswerData;

      try {
        const user = await base44.auth.me();
        let [flashcard] = await base44.entities.FlashCard.filter({ word_id, created_by: user.email });

        if (!flashcard) {
          flashcard = await base44.entities.FlashCard.create({ word_id, created_by: user.email });
        }

        const updatedCard = updateCardWithSM2(flashcard, quality);
        await base44.entities.FlashCard.update(flashcard.id, updatedCard);

      } catch(e) {
        console.error("Failed to update flashcard:", e);
        toast({
          title: "خطأ",
          description: "فشل تحديث بطاقة المراجعة.",
          variant: "destructive",
        });
      }

      const newAnswers = [...answers, { ...pendingAnswerData, srs_quality: quality }];
      setAnswers(newAnswers);

      setTimeout(() => {
        setShowDifficultyRating(false);
        setPendingAnswerData(null);
        setIsProcessingRating(false); // 🔥 فتح الزر مرة أخرى
        moveToNextQuestion();
      }, 500);

  }, [answers, pendingAnswerData, moveToNextQuestion, toast, isProcessingRating]);


  const handleAnswer = useCallback((selectedAnswer) => {
    const question = questions[currentQuestionIndex];
    if (!question || quizEnded || showDifficultyRating) return;

    const isCorrect = selectedAnswer === question.correctAnswer;
    const answerData = {
      word_id: question.word.id,
      selected_answer: selectedAnswer,
      correct_answer: question.correctAnswer,
      is_correct: isCorrect
    };

    setPendingAnswerData(answerData);

    if (isCorrect) {
      // Play correct sound
      if (userPreferences.sound_effects_enabled) {
        playSound('correctAnswer');
      }
      
      // Show wave effect
      if (userPreferences.animations_enabled) {
        setShowWaveEffect(true);
        setTimeout(() => setShowWaveEffect(false), 1000);
      }
      
      setShowDifficultyRating(true);
    } else {
      // Play wrong sound
      if (userPreferences.sound_effects_enabled) {
        playSound('wrongAnswer');
      }
      
      const newHearts = hearts - 1;
      setHearts(newHearts);
      if (newHearts <= 0) {
        setShowTasbihModal(true);
        setQuizEnded(true);
        processAnswerSRS(1); // Quality 1 for incorrect, no hearts left
      } else {
        processAnswerSRS(2); // Quality 2 for incorrect, but still hearts left
      }
    }
  }, [questions, currentQuestionIndex, quizEnded, showDifficultyRating, hearts, processAnswerSRS, userPreferences]);


  const handleTimeout = useCallback(() => {
    if (quizEnded || showDifficultyRating) return;
    // ✅ تصحيح: عند انتهاء الوقت، نعامله كإجابة خاطئة لهذا السؤال فقط (لا ننهي الاختبار كله)
    handleAnswer(""); // إجابة فارغة = خطأ
  }, [quizEnded, showDifficultyRating, handleAnswer]);


  useEffect(() => {
    let timer;
    // ✅ إذا كان quiz_time_limit = 0، لا نشغل المؤقت
    if (quizState === 'active' && quizTimeLimit > 0 && timeLeft > 0 && !quizEnded && !showDifficultyRating) {
      timer = setInterval(() => setTimeLeft(prev => prev - 1), 1000);
    } else if (quizState === 'active' && quizTimeLimit > 0 && timeLeft === 0) {
      handleTimeout();
    }
    return () => clearInterval(timer);
  }, [quizState, timeLeft, quizEnded, showDifficultyRating, handleTimeout, quizTimeLimit]);


  const startQuiz = async (mode) => {
    setQuizMode(mode);
    setIsLoading(true);
    try {
      const user = await base44.auth.me();
      
      // ✅ تحميل إعدادات الوقت من تفضيلات المستخدم
      const timeLimit = user?.preferences?.quiz_time_limit !== undefined 
        ? user.preferences.quiz_time_limit 
        : 60; // ✅ تغيير الافتراضي من 30 إلى 60
      setQuizTimeLimit(timeLimit);
      
      const level = user?.preferences?.learning_level || "all";
      setUserLevel(level);
      
      const [allWords, allFlashCards] = await Promise.all([
          base44.entities.QuranicWord.list(),
          base44.entities.FlashCard.filter({ created_by: user.email })
      ]);

      console.log('[pages/Quiz.js] Total words:', allWords.length);
      console.log('[pages/Quiz.js] User level:', level);

      // ✅ CRITICAL FIX: Filter by difficulty level FIRST
      let levelFilteredWords = allWords;
      if (level !== "all") {
        levelFilteredWords = allWords.filter(word => word.difficulty_level === level);
        console.log(`[pages/Quiz.js] Words after level filter (${level}):`, levelFilteredWords.length);
      }

      // ⚠️ If no words at this level, show helpful message
      if (levelFilteredWords.length === 0 && level !== "all") {
        toast({
          title: "⚠️ لا توجد كلمات بهذا المستوى",
          description: `لم نجد كلمات بمستوى "${level}". جرب تغيير المستوى من الإعدادات.`,
          variant: "destructive",
          duration: 6000
        });
        setQuestions([]);
        setQuizState('setup');
        setIsLoading(false);
        return;
      }

      // Then filter by source preferences
      let sourceFilteredWords = levelFilteredWords;
      if (user.preferences) {
        const { source_type, selected_juz, selected_surahs } = user.preferences;
        
        if (source_type === 'juz' && selected_juz?.length > 0) {
            const beforeFilter = sourceFilteredWords.length;
            sourceFilteredWords = sourceFilteredWords.filter(word => selected_juz.includes(word.juz_number));
            console.log('[pages/Quiz.js] Words after juz filter:', sourceFilteredWords.length);
            
            if (sourceFilteredWords.length === 0 && beforeFilter > 0) {
              toast({
                title: "⚠️ لا توجد كلمات في الأجزاء المحددة",
                description: "لم نجد كلمات في الأجزاء التي اخترتها. جرب اختيار أجزاء أخرى من الإعدادات.",
                variant: "destructive",
                duration: 6000
              });
              setQuestions([]);
              setQuizState('setup');
              setIsLoading(false);
              return;
            }
        } else if (source_type === 'surah' && selected_surahs?.length > 0) {
            const beforeFilter = sourceFilteredWords.length;
            sourceFilteredWords = sourceFilteredWords.filter(word => selected_surahs.includes(word.surah_name));
            console.log('[pages/Quiz.js] Words after surah filter:', sourceFilteredWords.length);
            
            if (sourceFilteredWords.length === 0 && beforeFilter > 0) {
              toast({
                title: "⚠️ لا توجد كلمات في السور المحددة",
                description: "لم نجد كلمات في السور التي اخترتها. جرب اختيار سور أخرى من الإعدادات.",
                variant: "destructive",
                duration: 6000
              });
              setQuestions([]);
              setQuizState('setup');
              setIsLoading(false);
              return;
            }
        }
      }

      let quizWords = [];

      if (mode === 'review') {
        const dueFlashCards = getDueCards(allFlashCards);
        const dueWordIds = new Set(dueFlashCards.map(fc => fc.word_id));
        quizWords = sourceFilteredWords.filter(word => dueWordIds.has(word.id));
      } else {
        quizWords = sourceFilteredWords.sort(() => Math.random() - 0.5).slice(0, 10);
      }

      if (quizWords.length === 0) {
        toast({
          title: mode === 'review' ? "لا توجد مراجعات" : "لا توجد كلمات",
          description: mode === 'review' 
            ? "لا توجد كلمات مستحقة للمراجعة الآن. جرب الاختبار العام!"
            : "لم نجد كلمات كافية للاختبار. جرب تغيير إعداداتك.",
          variant: "default",
          duration: 5000
        });
        setQuestions([]);
        setQuizState('setup');
        setIsLoading(false);
        return;
      }

      const quizQuestions = quizWords.map(word => {
        const wrongAnswers = allWords
          .filter(w => w.id !== word.id && w.meaning !== word.meaning)
          .sort(() => Math.random() - 0.5)
          .slice(0, 3)
          .map(w => ({ meaning: w.meaning, audio_url: w.audio_url }));

        const options = [{ meaning: word.meaning, audio_url: word.audio_url }, ...wrongAnswers]
          .sort(() => Math.random() - 0.5);

        return { word, options, correctAnswer: word.meaning };
      });

      setQuestions(quizQuestions);
      setQuizState('active');
      setCurrentQuestionIndex(0);
      setAnswers([]);
      setTimeLeft(timeLimit); // ✅ استخدام الوقت من الإعدادات
      setHearts(5);
      setQuizEnded(false);
      setStartTime(Date.now());

    } catch (error) {
      console.error("Error starting quiz:", error);
      toast({
        title: "خطأ",
        description: "حدث خطأ أثناء بدء الاختبار.",
        variant: "destructive",
      });
    } finally {
        setIsLoading(false);
    }
  };

  const handleHeartRestored = () => {
    setHearts(1);
    setQuizEnded(false);
    setShowTasbihModal(false);
    moveToNextQuestion();
  };

  const restartQuiz = () => {
    setQuizState('setup');
    setQuestions([]);
    setCurrentQuestionIndex(0);
    setAnswers([]);
    setQuizMode('');
    setTimeLeft(quizTimeLimit); // Reset time for potential new quiz setup
  };

  const renderContent = () => {
    switch (quizState) {
      case 'setup':
        return (
          <motion.div key="setup" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <Card className="bg-card border-border">
              <CardHeader className="text-center">
                  <Brain className="w-12 h-12 mx-auto text-primary mb-4" />
                  <CardTitle className="text-2xl font-bold">اختبار ومراجعة</CardTitle>
                  <p className="text-foreground/70">اختر نوع الاختبار الذي تريده</p>
              </CardHeader>
              <CardContent className="text-center p-6 space-y-4">
                  <Button onClick={() => startQuiz('review')} disabled={isLoading} size="lg" className="w-full bg-primary text-primary-foreground">
                      {isLoading ? <Loader2 className="w-5 h-5 ml-2 animate-spin" /> : <><Play className="w-5 h-5 ml-2"/>ابدأ المراجعة</>}
                  </Button>
                  <p className="text-sm text-foreground/70">مراجعة الكلمات المستحقة فقط</p>

                  <div className="my-4 border-t border-border"></div>

                  <Button onClick={() => startQuiz('all')} disabled={isLoading} size="lg" variant="outline" className="w-full">
                      {isLoading ? <Loader2 className="w-5 h-5 ml-2 animate-spin" /> : <><Brain className="w-5 h-5 ml-2"/>ابدأ اختبار عام</>}
                  </Button>
                  <p className="text-sm text-foreground/70">اختبار 10 كلمات عشوائية</p>

                  {questions.length === 0 && !isLoading && quizMode === 'review' && (
                    <p className="text-green-600 mt-4 text-sm">
                      لا توجد مراجعات مستحقة اليوم. أحسنت!
                    </p>
                  )}
              </CardContent>
            </Card>
          </motion.div>
        );

      case 'active':
        return (
          <motion.div
            key="quiz-active"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="space-y-6"
          >
            <Card className="bg-card backdrop-blur-sm border-border">
              <CardContent className="p-6">
                <div className="flex justify-between items-center mb-4">
                  <div>
                    <h2 className="text-xl font-bold text-primary">
                      السؤال {currentQuestionIndex + 1} من {questions.length}
                    </h2>
                    <p className="text-primary/80">اختر المعنى الصحيح</p>
                  </div>

                  <div className="flex items-center gap-4">
                    <HeartsDisplay hearts={hearts} maxHearts={5} />

                    {/* ✅ عرض المؤقت فقط إذا كان الوقت محدد */}
                    {quizTimeLimit > 0 && (
                      <div className="text-center">
                        <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400">
                          <Clock className="w-5 h-5" />
                          <span className="text-2xl font-bold">{timeLeft}</span>
                        </div>
                        <p className="text-xs text-foreground/70">ثانية</p>
                      </div>
                    )}
                    
                    {/* ✅ إذا كان الوقت غير محدد، نعرض رسالة */}
                    {quizTimeLimit === 0 && (
                      <div className="text-center">
                        <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
                          <Clock className="w-5 h-5" />
                          <span className="text-sm font-medium">⏳ بدون حد زمني</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                <Progress
                  value={((currentQuestionIndex + 1) / questions.length) * 100}
                  className="h-2 bg-primary/20"
                />
              </CardContent>
            </Card>

            {!quizEnded && questions.length > 0 && !showDifficultyRating && (
              <QuizQuestion
                question={questions[currentQuestionIndex]}
                onAnswer={handleAnswer}
                timeLeft={timeLeft}
                onPlayAudio={playAudioUrl}
                userLevel={userLevel}
              />
            )}

            {quizEnded && !showTasbihModal && (
              <Card className="bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800">
                <CardContent className="p-8 text-center">
                  <h3 className="text-xl font-bold text-red-700 dark:text-red-400 mb-2">انتهت الجلسة</h3>
                  <p className="text-red-600 dark:text-red-500 mb-4">
                    لقد استنفدت كل قلوبك. يمكنك مراجعة النتائج.
                  </p>
                   <Button onClick={() => finishQuiz(answers)} className="bg-primary text-primary-foreground">
                        عرض النتائج
                    </Button>
                </CardContent>
              </Card>
            )}
          </motion.div>
        );

      case 'results':
        return (
          <QuizResults
            questions={questions}
            answers={answers}
            onRestart={restartQuiz}
            heartBonus={hearts * 5}
          />
        );

      default: return null;
    }
  }


  return (
    <div className="p-6 max-w-4xl mx-auto">
      <audio ref={audioPlayerRef} preload="auto" />

      {/* Wave Effect */}
      {showWaveEffect && userPreferences.animations_enabled && <WaveEffect trigger={showWaveEffect} color="#10b981" />}

      {showDifficultyRating && (
        <DifficultyRating
          onRating={processAnswerSRS}
          isCorrectAnswer={pendingAnswerData?.is_correct}
          isProcessing={isProcessingRating}
        />
      )}

      <TasbihModal
        isOpen={showTasbihModal}
        onClose={() => {
          setShowTasbihModal(false);
          finishQuiz(answers);
        }}
        onHeartRestored={handleHeartRestored}
      />

      <AnimatePresence mode="wait">
        {renderContent()}
      </AnimatePresence>
    </div>
  );
}

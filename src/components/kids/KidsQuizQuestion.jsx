import React, { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, XCircle, Volume2, Star, Sparkles, BookOpen, Headphones } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useAudio } from "@/components/common/AudioContext";

export default function KidsQuizQuestion({ question, onAnswer, timeLeft }) {
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [hasAnswered, setHasAnswered] = useState(false);
  const [showStars, setShowStars] = useState(false);
  
  const { playAyah, playWord, playMeaning } = useAudio();

  useEffect(() => {
    console.log('[KidsQuizQuestion] 📝 Question data:', {
      word: question?.word?.word,
      surah_number: question?.word?.surah_number,
      ayah_number: question?.word?.ayah_number,
      surah_name: question?.word?.surah_name,
      context_snippet: question?.word?.context_snippet
    });
  }, [question]);

  const handleAnswerSelect = (optionMeaning) => {
    if (hasAnswered) return;

    setSelectedAnswer(optionMeaning);
    setHasAnswered(true);

    const isCorrect = optionMeaning === question.correctAnswer;
    if (isCorrect) {
      setShowStars(true);
      setTimeout(() => setShowStars(false), 2000);
    }

    setTimeout(() => {
      onAnswer(optionMeaning);
      setSelectedAnswer(null);
      setHasAnswered(false);
    }, 2000);
  };

  const handlePlayAyahRecitation = () => {
    console.log('[KidsQuizQuestion] 🎵 Attempting to play ayah');
    
    if (!question?.word?.surah_number || !question?.word?.ayah_number) {
      console.warn('[KidsQuizQuestion] ❌ Missing surah/ayah numbers');
      return;
    }
    
    console.log('[KidsQuizQuestion] ✅ Playing ayah:', `${question.word.surah_number}:${question.word.ayah_number}`);
    playAyah(question.word.surah_number, question.word.ayah_number, question.word);
  };

  const handlePlayWordAudio = () => {
    console.log('[KidsQuizQuestion] 🔵 Attempting to play word audio');
    
    if (!question?.word?.surah_number || !question?.word?.ayah_number || !question?.word?.word) {
      console.warn('[KidsQuizQuestion] ❌ Missing data for word audio');
      return;
    }
    
    console.log('[KidsQuizQuestion] ✅ Playing word:', question.word.word);
    playWord(question.word.surah_number, question.word.ayah_number, question.word.word, question.word);
  };

  const handlePlayMeaningAudio = (meaning) => {
    console.log('[KidsQuizQuestion] 🟣 Playing meaning TTS');
    playMeaning(meaning);
  };

  const categoryEmojis = {
    "أسماء": "📛",
    "أفعال": "⚡",
    "صفات": "✨",
    "حروف": "🔤",
    "أخرى": "📖"
  };

  return (
    <motion.div
      key={question?.word?.id}
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="relative"
    >
      <AnimatePresence>
        {showStars && (
          <motion.div
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0 }}
            className="absolute inset-0 flex items-center justify-center pointer-events-none z-50"
          >
            {[...Array(5)].map((_, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 0 }}
                animate={{
                  opacity: [0, 1, 0],
                  y: [0, -100, -200],
                  x: [(i - 2) * 50, (i - 2) * 100]
                }}
                transition={{ duration: 1.5, delay: i * 0.1 }}
              >
                <Star className="w-12 h-12 text-yellow-400 fill-yellow-400" />
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      <Card className="bg-gradient-to-br from-purple-100 to-pink-100 dark:from-purple-900/30 dark:to-pink-900/30 border-4 border-purple-300 dark:border-purple-700 shadow-2xl overflow-hidden">
        <CardContent className="p-6 md:p-8">
          {/* عنوان مرح */}
          <div className="text-center mb-6">
            <motion.div
              animate={{ rotate: [0, 10, -10, 0] }}
              transition={{ duration: 0.5, repeat: Infinity, repeatDelay: 2 }}
              className="inline-block"
            >
              <Sparkles className="w-8 h-8 text-purple-500 mx-auto mb-2" />
            </motion.div>
            <h3 className="text-2xl font-bold text-purple-800 dark:text-purple-300">
              ما معنى هذه الكلمة؟
            </h3>
          </div>

          {/* الكلمة */}
          <div className="text-center mb-6 bg-white/80 dark:bg-gray-800/80 p-8 rounded-3xl shadow-xl border-4 border-purple-200">
            <motion.h2
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              className="text-7xl md:text-8xl font-bold text-purple-600 dark:text-purple-400 arabic-font mb-6 drop-shadow-lg"
            >
              {question?.word?.word}
            </motion.h2>

            {/* أزرار الصوت */}
            {question?.word?.surah_number && question?.word?.ayah_number && (
              <div className="flex justify-center gap-4 mb-6 flex-wrap">
                {/* نطق الكلمة */}
                <Button
                  size="lg"
                  onClick={handlePlayWordAudio}
                  className="bg-gradient-to-r from-blue-400 to-blue-600 hover:from-blue-500 hover:to-blue-700 text-white gap-2 text-lg px-6 py-6 rounded-3xl shadow-2xl border-4 border-blue-300 transform hover:scale-105 transition-all"
                >
                  <Headphones className="w-7 h-7" />
                  <span className="font-bold">نطق الكلمة</span>
                </Button>
              </div>
            )}

            {/* ✅ نص الآية مع رقمها وزر صوت */}
            {question?.word?.context_snippet && (
              <div className="mt-6 p-6 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/30 dark:to-orange-900/30 rounded-2xl border-4 border-amber-300 dark:border-amber-700 shadow-lg">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <BookOpen className="w-5 h-5 text-amber-700 dark:text-amber-400" />
                    <h4 className="text-sm font-bold text-amber-800 dark:text-amber-300">
                      📖 الآية الكريمة
                    </h4>
                  </div>
                  
                  {/* زر صوت الآية */}
                  {question.word.surah_number && question.word.ayah_number && (
                    <Button
                      onClick={handlePlayAyahRecitation}
                      size="sm"
                      variant="outline"
                      className="border-2 border-amber-400 hover:bg-amber-100"
                    >
                      <Volume2 className="w-4 h-4 ml-1" />
                      استمع
                    </Button>
                  )}
                </div>
                
                <p className="text-xl text-amber-900 dark:text-amber-200 arabic-font leading-relaxed mb-3 font-semibold break-words">
                  {question.word.context_snippet}
                </p>
                
                <Badge variant="outline" className="bg-amber-100 dark:bg-amber-900/50 border-2 border-amber-400 text-base px-4 py-2">
                  📚 سورة {question.word.surah_name} - آية {question.word.ayah_number}
                </Badge>
              </div>
            )}

            {/* الفئة */}
            {question?.word?.category && (
              <div className="mt-4">
                <Badge className="text-xl px-6 py-3 bg-purple-200 text-purple-800 dark:bg-purple-800 dark:text-purple-200 border-2 border-purple-400">
                  {categoryEmojis[question.word.category] || "📖"} {question.word.category}
                </Badge>
              </div>
            )}
          </div>

          {/* الخيارات - مع مربعات أكبر وكسر النص */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {question?.options?.map((option, index) => {
              const isSelected = selectedAnswer === option.meaning;
              const isCorrect = hasAnswered && option.meaning === question.correctAnswer;
              const isWrong = hasAnswered && isSelected && option.meaning !== question.correctAnswer;

              const colors = [
                "from-red-400 to-red-500 border-red-300",
                "from-blue-400 to-blue-500 border-blue-300",
                "from-green-400 to-green-500 border-green-300",
                "from-yellow-400 to-yellow-500 border-yellow-300"
              ];

              return (
                <motion.div
                  key={index}
                  whileHover={!hasAnswered ? { scale: 1.08, rotate: 2 } : {}}
                  whileTap={!hasAnswered ? { scale: 0.95 } : {}}
                >
                  <Button
                    onClick={() => !hasAnswered && handleAnswerSelect(option.meaning)}
                    disabled={hasAnswered}
                    className={`
                      w-full min-h-[150px] text-xl p-6 rounded-3xl font-bold shadow-2xl transition-all duration-300 border-4
                      ${!hasAnswered ? `bg-gradient-to-br ${colors[index]} text-white hover:shadow-3xl` : ''}
                      ${isCorrect ? 'bg-gradient-to-br from-green-500 to-green-600 text-white scale-110 ring-8 ring-green-300 border-green-400' : ''}
                      ${isWrong ? 'bg-gradient-to-br from-red-500 to-red-600 text-white scale-95 border-red-400' : ''}
                      ${!isSelected && !isCorrect && hasAnswered ? 'opacity-40' : ''}
                    `}
                  >
                    <span className="flex flex-col items-center justify-center w-full gap-3">
                      <span className="text-center leading-relaxed break-words whitespace-normal">{option.meaning}</span>
                      <div className="flex items-center gap-3">
                        {isCorrect && (
                          <CheckCircle className="w-10 h-10 animate-bounce" />
                        )}
                        {isWrong && (
                          <XCircle className="w-10 h-10 animate-pulse" />
                        )}
                        
                        {/* 🟣 زر TTS للمعنى */}
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={(e) => {
                            e.stopPropagation();
                            handlePlayMeaningAudio(option.meaning);
                          }}
                          className="h-12 w-12 hover:bg-white/30 rounded-full"
                        >
                          <Volume2 className="w-6 h-6" />
                        </Button>
                      </div>
                    </span>
                  </Button>
                </motion.div>
              );
            })}
          </div>

          {/* رسالة تشجيعية */}
          {hasAnswered && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-8 text-center"
            >
              {selectedAnswer === question.correctAnswer ? (
                <div className="bg-gradient-to-r from-green-100 to-emerald-100 dark:from-green-900/30 dark:to-emerald-900/30 p-6 rounded-3xl border-4 border-green-400 shadow-xl">
                  <p className="text-3xl font-bold text-green-700 dark:text-green-300">
                    🎉 أحسنت! إجابة ممتازة! 🌟
                  </p>
                </div>
              ) : (
                <div className="bg-gradient-to-r from-red-100 to-pink-100 dark:from-red-900/30 dark:to-pink-900/30 p-6 rounded-3xl border-4 border-red-400 shadow-xl">
                  <p className="text-3xl font-bold text-red-700 dark:text-red-300">
                    💪 حاول مرة أخرى! أنت تتعلم! 📚
                  </p>
                </div>
              )}
            </motion.div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
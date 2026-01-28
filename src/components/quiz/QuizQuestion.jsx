import React, { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, XCircle, Volume2 } from "lucide-react";
import { motion } from "framer-motion";
import { useAudio } from "@/components/common/AudioContext";

import KidsQuizQuestion from "../kids/KidsQuizQuestion";

export default function QuizQuestion({ question, onAnswer, timeLeft, onPlayAudio, userLevel }) {
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [hasAnswered, setHasAnswered] = useState(false);
  
  const { playAyah, playWord, playMeaning } = useAudio();

  useEffect(() => {
    console.log('[QuizQuestion] 📝 Question data:', {
      word: question?.word?.word,
      surah_number: question?.word?.surah_number,
      ayah_number: question?.word?.ayah_number,
      surah_name: question?.word?.surah_name,
      context_snippet: question?.word?.context_snippet
    });
  }, [question]);

  if (userLevel === "مبتدئ") {
    return <KidsQuizQuestion
      question={question}
      onAnswer={onAnswer}
      timeLeft={timeLeft}
      onPlayAudio={onPlayAudio}
      userLevel={userLevel}
    />;
  }

  const handleAnswerSelect = (optionMeaning) => {
    if (hasAnswered) return;

    setSelectedAnswer(optionMeaning);
    setHasAnswered(true);

    setTimeout(() => {
      onAnswer(optionMeaning);
      setSelectedAnswer(null);
      setHasAnswered(false);
    }, 1500);
  };

  const handlePlayAyahRecitation = (e) => {
    e.stopPropagation();
    console.log('[QuizQuestion] 🎵 Attempting to play ayah');
    console.log('[QuizQuestion] Word data:', question?.word);
    
    if (!question?.word?.surah_number || !question?.word?.ayah_number) {
      console.warn('[QuizQuestion] ❌ Missing surah/ayah:', {
        surah_number: question?.word?.surah_number,
        ayah_number: question?.word?.ayah_number
      });
      return;
    }
    
    console.log('[QuizQuestion] ✅ Playing ayah:', `${question.word.surah_number}:${question.word.ayah_number}`);
    playAyah(question.word.surah_number, question.word.ayah_number, question.word);
  };

  const handlePlayWordAudio = (e) => {
    e.stopPropagation();
    console.log('[QuizQuestion] 🔵 Attempting to play word');
    
    if (!question?.word?.surah_number || !question?.word?.ayah_number || !question?.word?.word) {
      console.warn('[QuizQuestion] ❌ Missing data for word audio:', {
        surah_number: question?.word?.surah_number,
        ayah_number: question?.word?.ayah_number,
        word: question?.word?.word
      });
      return;
    }
    
    console.log('[QuizQuestion] ✅ Playing word:', question.word.word);
    playWord(question.word.surah_number, question.word.ayah_number, question.word.word, question.word);
  };

  const handlePlayMeaningAudio = (e, meaning) => {
    e.stopPropagation();
    playMeaning(meaning);
  };

  const highlightWordInAyah = (ayahText, word) => {
    if (!ayahText || !word) return ayahText;
    
    const wordPattern = new RegExp(`(${word.replace(/[\u064B-\u065F\u0670]/g, '')})`, 'g');
    const parts = ayahText.split(wordPattern);

    if (parts.length === 1 && !ayahText.includes(word)) {
      return ayahText;
    }

    return (
      <>
        {parts.map((part, index) => (
          <React.Fragment key={index}>
            {part && wordPattern.test(part.replace(/[\u064B-\u065F\u0670]/g, '')) ? (
              <span className="text-primary font-bold bg-primary/20 px-2 py-1 rounded text-3xl">
                {part}
              </span>
            ) : (
              part
            )}
          </React.Fragment>
        ))}
      </>
    );
  };

  return (
    <motion.div
      key={question.word.id}
      initial={{ opacity: 0, x: 100 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -100 }}
      transition={{ duration: 0.3 }}
    >
      <Card className="bg-card backdrop-blur-sm border-border shadow-xl">
        <CardContent className="p-4 md:p-8">
          {/* الكلمة */}
          <div className="text-center mb-6">
            <h2 className="text-5xl md:text-6xl font-bold text-primary arabic-font mb-4">
              {question.word.word}
            </h2>
            
            {/* ✅ زرين منفصلين - تلاوة الآية و نطق الكلمة */}
            <div className="flex justify-center gap-3 mb-2">
              {/* 1️⃣ تلاوة الآية (أخضر) */}
              <Button 
                size="icon" 
                variant="ghost" 
                onClick={handlePlayAyahRecitation}
                className="hover:bg-green-100 dark:hover:bg-green-900/30"
                title="🎵 تلاوة الآية كاملة (قارئ)"
              >
                <Volume2 className="w-6 h-6 text-green-600" />
              </Button>

              {/* 2️⃣ نطق الكلمة (أزرق) */}
              <Button 
                size="icon" 
                variant="ghost" 
                onClick={handlePlayWordAudio}
                className="hover:bg-blue-100 dark:hover:bg-blue-900/30"
                title="🗣️ نطق الكلمة فقط"
              >
                <Volume2 className="w-6 h-6 text-blue-600" />
              </Button>
            </div>
            
            <p className="text-xs text-foreground/60">
              🟢 تلاوة | 🔵 نطق الكلمة
            </p>
          </div>

          {/* ✅ الآية الكاملة مع رقمها - لجميع المستويات */}
          {question.word.context_snippet && (
            <div className="mb-4 bg-amber-50 dark:bg-amber-900/20 p-6 rounded-xl border-2 border-amber-200 dark:border-amber-800">
              <p className="text-xl md:text-2xl text-center text-foreground arabic-font leading-loose mb-3">
                {highlightWordInAyah(question.word.context_snippet, question.word.word)}
              </p>
              
              {/* ✅ رقم الآية واسم السورة */}
              <div className="text-center mt-3">
                <Badge variant="outline" className="text-sm px-3 py-1 bg-amber-100 dark:bg-amber-900/50 border-amber-300">
                  📖 سورة {question.word.surah_name} - آية {question.word.ayah_number}
                </Badge>
              </div>
            </div>
          )}

          {/* الخيارات */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {question.options.map((option, index) => {
              const isSelected = selectedAnswer === option.meaning;
              const isCorrect = hasAnswered && option.meaning === question.correctAnswer;
              const isWrong = hasAnswered && isSelected && option.meaning !== question.correctAnswer;

              return (
                <motion.div
                  key={index}
                  whileHover={!hasAnswered ? { scale: 1.02 } : {}}
                  whileTap={!hasAnswered ? { scale: 0.98 } : {}}
                >
                  <Button
                    onClick={() => !hasAnswered && handleAnswerSelect(option.meaning)}
                    disabled={hasAnswered}
                    className={`
                      w-full min-h-[70px] h-auto text-base md:text-lg p-4 rounded-xl transition-all duration-300
                      ${!hasAnswered ? 'bg-background-soft hover:bg-primary/10 border-2 border-border hover:border-primary text-foreground' : ''}
                      ${isCorrect ? 'bg-green-100 dark:bg-green-900/30 border-2 border-green-500 text-green-900 dark:text-green-100' : ''}
                      ${isWrong ? 'bg-red-100 dark:bg-red-900/30 border-2 border-red-500 text-red-900 dark:text-red-100' : ''}
                      ${!isSelected && !isCorrect && hasAnswered ? 'opacity-50' : ''}
                      whitespace-normal break-words text-right
                    `}
                  >
                    <span className="flex items-center justify-between w-full gap-3">
                      <span className="flex-1 leading-relaxed text-left">{option.meaning}</span>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        {isCorrect && <CheckCircle className="w-6 h-6 text-green-600" />}
                        {isWrong && <XCircle className="w-6 h-6 text-red-600" />}
                        
                        {/* ✅ 3️⃣ زر TTS للمعنى (بنفسجي) */}
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={(e) => handlePlayMeaningAudio(e, option.meaning)}
                          className="h-8 w-8 hover:bg-purple-100 dark:hover:bg-purple-900/30"
                          title="استمع للمعنى (TTS)"
                        >
                          <Volume2 className="w-4 h-4 text-purple-600" />
                        </Button>
                      </div>
                    </span>
                  </Button>
                </motion.div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
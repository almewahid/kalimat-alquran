import React, { useState, useMemo, useEffect } from 'react';
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Sparkles, CheckCircle, XCircle, Trophy, BarChart, ArrowRight } from "lucide-react";
import { useAudio } from "@/components/common/AudioContext";
import { supabaseClient } from "@/components/api/supabaseClient";
import { triggerConfetti } from "@/components/common/Confetti";

import FillInTheBlankQuiz from './FillInTheBlankQuiz';
import VisualMatchQuiz from './VisualMatchQuiz';
import AudioRecognitionQuiz from './AudioRecognitionQuiz';
import VerseAssemblyQuiz from './VerseAssemblyQuiz';
import { useToast } from "@/components/ui/use-toast";

// Default Multiple Choice Component
const MultipleChoiceQuiz = ({ word, options, onAnswer }) => {
    const { playMeaning } = useAudio();

    const handlePlayMeaning = (e, text) => {
        e.stopPropagation();
        playMeaning(text);
    };

    return (
        <div className="space-y-6">
             <div className="text-center py-8">
               <h3 className="text-4xl font-bold text-primary mb-2">{word.word}</h3>
               <p className="text-muted-foreground">اختر المعنى الصحيح</p>
             </div>
             <div className="grid gap-3">
               {options.map((option, idx) => (
                 <div key={idx} className="relative group">
                     <Button
                       variant="outline"
                       className="w-full justify-between text-right h-auto py-4 text-lg px-6 pr-14 hover:border-primary hover:bg-primary/5 transition-all"
                       onClick={() => onAnswer(option)}
                     >
                       <span>{option.meaning}</span>
                     </Button>
                 </div>
               ))}
             </div>
        </div>
    );
};

export default function SmartQuizSession({ words, onComplete, preferences = { multipleChoice: true, matching: true, audio: true } }) {
  const { toast } = useToast();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [showResult, setShowResult] = useState(false);
  const [quizType, setQuizType] = useState('multiple-choice');
  const [feedback, setFeedback] = useState(null); // { type: 'success' | 'error', message: '' }
  const [resultsHistory, setResultsHistory] = useState([]); // Array of { word, isCorrect, type }
  const [xpEarned, setXpEarned] = useState(0);

  const currentWord = words[currentIndex];

  // Determine available quiz types for the current word
  const availableTypes = useMemo(() => {
      if (!currentWord) return [];
      const types = [];
      
      if (preferences.multipleChoice) types.push('multiple-choice');
      
      if (preferences.audio && (currentWord.audio_url || (currentWord.surah_number && currentWord.ayah_number))) {
          types.push('audio-recognition');
      }
      
      if (preferences.matching) types.push('visual-match');

      if (preferences.multipleChoice && currentWord.aya_text && currentWord.aya_text.split(' ').length > 3) {
          types.push('fill-in-blank');
          types.push('verse-assembly');
      }

      // Fallback if no types match preferences
      if (types.length === 0) types.push('multiple-choice');

      return types;
  }, [currentWord, preferences]);

  // Select random quiz type when word changes
  useEffect(() => {
      if (availableTypes.length > 0) {
          const randomType = availableTypes[Math.floor(Math.random() * availableTypes.length)];
          setQuizType(randomType);
      }
      setFeedback(null);
  }, [currentIndex, availableTypes]);

  // Generate distractors
  const currentOptions = useMemo(() => {
      if (!currentWord) return [];
      const otherWords = words.filter(w => w.id !== currentWord.id);
      const shuffledOthers = [...otherWords].sort(() => 0.5 - Math.random()).slice(0, 3);
      const opts = [...shuffledOthers, currentWord];
      return opts.sort(() => 0.5 - Math.random());
  }, [currentWord, words]);

  const handleAnswer = (answerData) => {
      let isCorrect = false;

      if (answerData && answerData.isCorrect === true) {
          isCorrect = true;
      } else if (answerData && answerData.id === currentWord.id) {
          isCorrect = true;
      }

      // Record result
      const resultEntry = {
          word: currentWord,
          isCorrect: isCorrect,
          type: quizType
      };
      setResultsHistory(prev => [...prev, resultEntry]);

      if (isCorrect) {
          setScore(prev => prev + 1);
          setFeedback({ type: 'success', message: 'إجابة صحيحة! أحسنت' });
          triggerConfetti('correctAnswer');
      } else {
          setFeedback({ type: 'error', message: `خطأ. الصواب: ${currentWord.meaning}` });
      }

      // Delay next question
      setTimeout(() => {
          if (currentIndex < words.length - 1) {
              setCurrentIndex(prev => prev + 1);
          } else {
              finishQuiz();
          }
      }, 1500);
  };

  const finishQuiz = async () => {
      // Calculate XP
      // Base XP: 10 per word
      // Bonus: 5 per correct answer
      // Perfect Score Bonus: 50
      const correctCount = resultsHistory.filter(r => r.isCorrect).length + (feedback?.type === 'success' ? 1 : 0); // Include last answer
      const totalWords = words.length;
      
      let totalXP = (totalWords * 5) + (correctCount * 10);
      if (correctCount === totalWords) totalXP += 50;

      setXpEarned(totalXP);
      setShowResult(true);

      if (correctCount === totalWords) triggerConfetti('perfectScore');
      else triggerConfetti('achievement');

      // Save XP to UserProgress
      try {
          const user = await supabaseClient.supabase.auth.getUser();
          const [progress] = await supabaseClient.entities.UserProgress.filter({ user_email: user.email });
          
          if (progress) {
              await supabaseClient.entities.UserProgress.update(progress.id, {
                  total_xp: (progress.total_xp || 0) + totalXP,
                  quiz_streak: (progress.quiz_streak || 0) + 1
              });
          } else {
              await supabaseClient.entities.UserProgress.create({
                  user_email: user.email,
                  total_xp: totalXP,
                  quiz_streak: 1,
                  current_level: 1
              });
          }
          
          // Log Quiz Session
          await supabaseClient.entities.QuizSession.create({
              score: correctCount,
              total_questions: totalWords,
              correct_answers: correctCount,
              xp_earned: totalXP,
              user_email: user.email
          });

      } catch (error) {
          console.error("Error saving XP:", error);
      }
  };

  if (showResult) {
    const correctAnswers = resultsHistory.filter(r => r.isCorrect);
    const wrongAnswers = resultsHistory.filter(r => !r.isCorrect);
    
    return (
      <Card className="max-w-3xl mx-auto overflow-hidden border-2 border-primary/10 shadow-xl">
        <CardHeader className="bg-gradient-to-b from-primary/10 to-transparent text-center pb-8 pt-8">
          <Trophy className="w-20 h-20 text-yellow-500 mx-auto mb-4 animate-bounce" />
          <h2 className="text-3xl font-bold mb-2 text-primary">تقرير الأداء</h2>
          <div className="flex justify-center gap-4 mt-4">
             <Badge className="text-lg py-1 px-4 bg-yellow-100 text-yellow-800 hover:bg-yellow-200 border-yellow-200">
                +{xpEarned} XP
             </Badge>
             <Badge className="text-lg py-1 px-4 bg-primary/10 text-primary hover:bg-primary/20 border-primary/20">
                {Math.round((score / words.length) * 100)}%
             </Badge>
          </div>
        </CardHeader>
        
        <CardContent className="p-6">
          <div className="grid md:grid-cols-2 gap-6 mb-8">
             {/* نقاط القوة */}
             <div className="bg-green-50/50 rounded-xl p-4 border border-green-100">
                <h3 className="font-bold text-green-700 mb-3 flex items-center gap-2">
                   <CheckCircle className="w-5 h-5" />
                   نقاط القوة ({correctAnswers.length})
                </h3>
                {correctAnswers.length > 0 ? (
                    <ul className="space-y-2 max-h-40 overflow-y-auto pr-2 custom-scrollbar">
                        {correctAnswers.map((item, i) => (
                            <li key={i} className="text-sm bg-white p-2 rounded-lg shadow-sm flex justify-between items-center">
                                <span className="font-medium text-green-900">{item.word.word}</span>
                                <Badge variant="outline" className="text-xs bg-green-50 text-green-600 border-green-200">ممتاز</Badge>
                            </li>
                        ))}
                    </ul>
                ) : (
                    <p className="text-sm text-gray-500 italic">لا يوجد إجابات صحيحة</p>
                )}
             </div>

             {/* نقاط التحسين */}
             <div className="bg-red-50/50 rounded-xl p-4 border border-red-100">
                <h3 className="font-bold text-red-700 mb-3 flex items-center gap-2">
                   <BarChart className="w-5 h-5" />
                   تحتاج مراجعة ({wrongAnswers.length})
                </h3>
                {wrongAnswers.length > 0 ? (
                    <ul className="space-y-2 max-h-40 overflow-y-auto pr-2 custom-scrollbar">
                        {wrongAnswers.map((item, i) => (
                            <li key={i} className="text-sm bg-white p-2 rounded-lg shadow-sm flex justify-between items-center">
                                <span className="font-medium text-red-900">{item.word.word}</span>
                                <span className="text-xs text-red-500">{item.word.meaning}</span>
                            </li>
                        ))}
                    </ul>
                ) : (
                    <p className="text-sm text-gray-500 italic">لا يوجد أخطاء، أحسنت!</p>
                )}
             </div>
          </div>

          <Button onClick={onComplete} size="lg" className="w-full bg-primary hover:bg-primary/90 text-white rounded-xl py-6 text-lg shadow-lg hover:shadow-xl transition-all">
             العودة للقائمة الرئيسية <ArrowRight className="mr-2 w-5 h-5" />
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (!currentWord) return null;

  return (
    <Card className="max-w-2xl mx-auto overflow-hidden border-2 border-primary/5 shadow-lg">
      <CardHeader className="bg-muted/30 pb-6">
        <div className="flex justify-between items-center mb-4">
          <Badge variant="outline" className="text-base px-3 py-1">
             سؤال {currentIndex + 1} من {words.length}
          </Badge>
          <div className="flex items-center gap-2">
             <Trophy className="w-4 h-4 text-yellow-500" />
             <span className="font-bold text-primary">{score * 10} XP</span>
          </div>
        </div>
        <Progress value={((currentIndex + 1) / words.length) * 100} className="h-2" />
      </CardHeader>
      
      <CardContent className="p-6 min-h-[400px] relative">
         {/* Feedback Overlay */}
         {feedback && (
             <div className={`absolute inset-0 z-50 flex items-center justify-center bg-white/90 backdrop-blur-sm transition-all rounded-xl`}>
                 <div className="text-center animate-in zoom-in duration-300">
                     <div className={`mb-4 w-20 h-20 mx-auto rounded-full flex items-center justify-center ${feedback.type === 'success' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                        {feedback.type === 'success' ? <CheckCircle className="w-10 h-10" /> : <XCircle className="w-10 h-10" />}
                     </div>
                     <div className={`text-2xl font-bold ${feedback.type === 'success' ? 'text-green-700' : 'text-red-700'}`}>
                         {feedback.message}
                     </div>
                 </div>
             </div>
         )}

         {quizType === 'multiple-choice' && (
             <MultipleChoiceQuiz word={currentWord} options={currentOptions} onAnswer={handleAnswer} />
         )}
         {quizType === 'audio-recognition' && (
             <AudioRecognitionQuiz word={currentWord} options={currentOptions} onAnswer={handleAnswer} />
         )}
         {quizType === 'visual-match' && (
             <VisualMatchQuiz word={currentWord} options={currentOptions} onAnswer={handleAnswer} />
         )}
         {quizType === 'fill-in-blank' && (
             <FillInTheBlankQuiz word={currentWord} options={currentOptions} onAnswer={handleAnswer} />
         )}
         {quizType === 'verse-assembly' && (
             <VerseAssemblyQuiz word={currentWord} onAnswer={handleAnswer} />
         )}
      </CardContent>
    </Card>
  );
}
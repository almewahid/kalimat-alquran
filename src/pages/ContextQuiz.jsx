import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Brain, CheckCircle, XCircle, BookOpen } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useToast } from "@/components/ui/use-toast";

export default function ContextQuiz() {
  const { toast } = useToast();
  const [questions, setQuestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [score, setScore] = useState(0);
  const [isFinished, setIsFinished] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadQuiz();
  }, []);

  const loadQuiz = async () => {
    try {
      const [words, ayahs] = await Promise.all([
        base44.entities.QuranicWord.list(),
        base44.entities.QuranAyah.list()
      ]);

      // Create questions from words that have ayah context
      const quizQuestions = words
        .filter(w => w.surah_name && w.ayah_number)
        .sort(() => Math.random() - 0.5)
        .slice(0, 10)
        .map(word => {
          // Find the ayah
          const ayah = ayahs.find(a => 
            a.surah_name === word.surah_name && 
            a.ayah_number === word.ayah_number
          );

          // Get wrong answers
          const wrongWords = words
            .filter(w => w.id !== word.id && w.meaning !== word.meaning)
            .sort(() => Math.random() - 0.5)
            .slice(0, 3);

          const options = [word, ...wrongWords]
            .sort(() => Math.random() - 0.5);

          return {
            ayah: ayah?.ayah_text || `الآية ${word.ayah_number} من سورة ${word.surah_name}`,
            word: word.word,
            correctMeaning: word.meaning,
            options: options.map(w => ({ word: w.word, meaning: w.meaning }))
          };
        });

      setQuestions(quizQuestions);
    } catch (error) {
      console.error("Error loading quiz:", error);
      toast({
        title: "خطأ",
        description: "حدث خطأ في تحميل الاختبار",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleAnswer = (answer) => {
    setSelectedAnswer(answer);
    
    setTimeout(() => {
      const isCorrect = answer === questions[currentIndex].correctMeaning;
      if (isCorrect) {
        setScore(score + 1);
      }
      
      if (currentIndex < questions.length - 1) {
        setCurrentIndex(currentIndex + 1);
        setSelectedAnswer(null);
      } else {
        setIsFinished(true);
      }
    }, 1500);
  };

  if (isLoading) {
    return <div className="p-6 text-center">جارٍ تحميل الاختبار...</div>;
  }

  if (questions.length === 0) {
    return (
      <div className="p-6 max-w-2xl mx-auto">
        <Card>
          <CardContent className="p-8 text-center">
            <p className="text-lg">لا توجد آيات كافية لإنشاء اختبار السياق</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isFinished) {
    const percentage = Math.round((score / questions.length) * 100);
    
    return (
      <div className="p-6 max-w-2xl mx-auto">
        <Card>
          <CardHeader className="text-center">
            <Brain className="w-16 h-16 mx-auto mb-4 text-primary" />
            <CardTitle>نتيجة اختبار السياق</CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <div className="text-5xl font-bold text-primary mb-4">{percentage}%</div>
            <p>{score} من {questions.length} إجابة صحيحة</p>
            <Button onClick={() => window.location.reload()} className="mt-6">
              إعادة الاختبار
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const currentQuestion = questions[currentIndex];

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-6">
        <div className="flex justify-between items-center mb-2">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <BookOpen className="w-6 h-6" />
            اختبار السياق
          </h2>
          <Badge>{currentIndex + 1} / {questions.length}</Badge>
        </div>
        <Progress value={((currentIndex + 1) / questions.length) * 100} className="h-2" />
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={currentIndex}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <Card className="mb-6 bg-blue-50 dark:bg-blue-900/20 border-blue-200">
            <CardContent className="p-6">
              <p className="text-xl arabic-font leading-loose text-center">
                {currentQuestion.ayah}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <p className="text-center text-lg mb-6">
                ما معنى كلمة: <span className="text-3xl font-bold text-primary">{currentQuestion.word}</span>
              </p>

              <div className="grid gap-4">
                {currentQuestion.options.map((option, index) => {
                  const isSelected = selectedAnswer === option.meaning;
                  const isCorrect = option.meaning === currentQuestion.correctMeaning;
                  
                  let buttonClass = "border-border hover:bg-background-soft";
                  if (isSelected) {
                    buttonClass = isCorrect 
                      ? "border-green-400 bg-green-50 text-green-800"
                      : "border-red-400 bg-red-50 text-red-800";
                  }

                  return (
                    <Button
                      key={index}
                      variant="outline"
                      onClick={() => !selectedAnswer && handleAnswer(option.meaning)}
                      disabled={!!selectedAnswer}
                      className={`w-full p-5 text-lg border-2 ${buttonClass} min-h-[70px]`}
                    >
                      <span className="flex-1 text-right">{option.meaning}</span>
                      {isSelected && (
                        isCorrect ? <CheckCircle className="w-5 h-5" /> : <XCircle className="w-5 h-5" />
                      )}
                    </Button>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
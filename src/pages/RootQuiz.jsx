import React, { useState, useEffect, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ArrowRight, Brain, CheckCircle, XCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useToast } from "@/components/ui/use-toast";

export default function RootQuiz() {
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
      const words = await base44.entities.QuranicWord.list();
      
      // Filter words with roots
      const wordsWithRoots = words.filter(w => w.root);
      
      // Group by root
      const rootGroups = {};
      wordsWithRoots.forEach(word => {
        if (!rootGroups[word.root]) {
          rootGroups[word.root] = [];
        }
        rootGroups[word.root].push(word);
      });

      // Create questions from roots with multiple words
      const quizQuestions = Object.entries(rootGroups)
        .filter(([root, words]) => words.length >= 2)
        .slice(0, 10)
        .map(([root, rootWords]) => {
          const correctWord = rootWords[Math.floor(Math.random() * rootWords.length)];
          
          // Get wrong answers from different roots
          const wrongWords = words
            .filter(w => w.root !== root && w.root)
            .sort(() => Math.random() - 0.5)
            .slice(0, 3);
          
          const options = [correctWord, ...wrongWords]
            .sort(() => Math.random() - 0.5);
          
          return {
            root,
            correctWord: correctWord.word,
            options: options.map(w => w.word)
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
      const isCorrect = answer === questions[currentIndex].correctWord;
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

  const restartQuiz = () => {
    setCurrentIndex(0);
    setScore(0);
    setSelectedAnswer(null);
    setIsFinished(false);
    loadQuiz();
  };

  if (isLoading) {
    return <div className="p-6 text-center">جارٍ تحميل الاختبار...</div>;
  }

  if (questions.length === 0) {
    return (
      <div className="p-6 max-w-2xl mx-auto">
        <Card>
          <CardContent className="p-8 text-center">
            <p className="text-lg">لا توجد كلمات كافية لإنشاء اختبار الجذور</p>
            <p className="text-sm text-foreground/70 mt-2">يرجى إضافة المزيد من الكلمات مع الجذور</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isFinished) {
    const percentage = Math.round((score / questions.length) * 100);
    
    return (
      <div className="p-6 max-w-2xl mx-auto">
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}>
          <Card className="bg-card border-border">
            <CardHeader className="text-center">
              <Brain className="w-16 h-16 mx-auto mb-4 text-primary" />
              <CardTitle className="text-2xl font-bold">نتيجة اختبار الجذور</CardTitle>
            </CardHeader>
            <CardContent className="text-center space-y-4">
              <div className="text-5xl font-bold text-primary">{percentage}%</div>
              <p className="text-lg">
                أجبت على {score} من {questions.length} بشكل صحيح
              </p>
              <div className="flex gap-3 justify-center mt-6">
                <Button onClick={restartQuiz} size="lg" className="bg-primary">
                  <ArrowRight className="w-5 h-5 ml-2" />
                  إعادة الاختبار
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    );
  }

  const currentQuestion = questions[currentIndex];

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-6">
        <div className="flex justify-between items-center mb-2">
          <h2 className="text-xl font-bold">اختبار الجذور 🌳</h2>
          <Badge>{currentIndex + 1} / {questions.length}</Badge>
        </div>
        <Progress value={((currentIndex + 1) / questions.length) * 100} className="h-2" />
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={currentIndex}
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -50 }}
        >
          <Card className="bg-card border-border">
            <CardContent className="p-8">
              <div className="text-center mb-8">
                <p className="text-lg text-foreground/80 mb-4">أي كلمة من نفس جذر:</p>
                <div className="text-6xl font-bold text-primary arabic-font">
                  {currentQuestion.root}
                </div>
              </div>

              <div className="grid gap-4">
                {currentQuestion.options.map((option, index) => {
                  const isSelected = selectedAnswer === option;
                  const isCorrect = option === currentQuestion.correctWord;
                  
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
                      onClick={() => !selectedAnswer && handleAnswer(option)}
                      disabled={!!selectedAnswer}
                      className={`w-full p-6 text-2xl border-2 transition-all ${buttonClass} arabic-font`}
                    >
                      <span className="flex-1">{option}</span>
                      {isSelected && (
                        isCorrect ? <CheckCircle className="w-6 h-6 text-green-600" /> : <XCircle className="w-6 h-6 text-red-600" />
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
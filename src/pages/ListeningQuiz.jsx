import React, { useState, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Volume2, Brain, CheckCircle, XCircle, VolumeX } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useToast } from "@/components/ui/use-toast";

export default function ListeningQuiz() {
  const { toast } = useToast();
  const audioRef = useRef(null);
  const [questions, setQuestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [score, setScore] = useState(0);
  const [isFinished, setIsFinished] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [hasPlayedAudio, setHasPlayedAudio] = useState(false);

  useEffect(() => {
    loadQuiz();
  }, []);

  const loadQuiz = async () => {
    try {
      const words = await base44.entities.QuranicWord.list();

      // Filter words with audio
      const wordsWithAudio = words.filter(w => w.audio_url);

      if (wordsWithAudio.length < 4) {
        toast({
          title: "تنبيه",
          description: "لا توجد كلمات كافية مع صوت لإنشاء الاختبار",
          variant: "destructive"
        });
        setIsLoading(false);
        return;
      }

      const quizQuestions = wordsWithAudio
        .sort(() => Math.random() - 0.5)
        .slice(0, 10)
        .map(word => {
          const wrongWords = words
            .filter(w => w.id !== word.id && w.meaning !== word.meaning)
            .sort(() => Math.random() - 0.5)
            .slice(0, 3);

          const options = [word, ...wrongWords]
            .sort(() => Math.random() - 0.5);

          return {
            word: word.word,
            audioUrl: word.audio_url,
            correctMeaning: word.meaning,
            options: options.map(w => w.meaning)
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

  const playAudio = () => {
    if (audioRef.current && questions[currentIndex]?.audioUrl) {
      audioRef.current.src = questions[currentIndex].audioUrl;
      audioRef.current.play().catch(e => console.log(e));
      setHasPlayedAudio(true);
    }
  };

  useEffect(() => {
    if (questions.length > 0 && currentIndex < questions.length) {
      setHasPlayedAudio(false);
      // Auto-play when question loads
      setTimeout(() => {
        playAudio();
      }, 500);
    }
  }, [currentIndex, questions]);

  const handleAnswer = (answer) => {
    if (!hasPlayedAudio) {
      toast({
        title: "تنبيه",
        description: "استمع للصوت أولاً",
        variant: "default"
      });
      return;
    }

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
            <VolumeX className="w-16 h-16 mx-auto mb-4 text-gray-400" />
            <p className="text-lg">لا توجد كلمات كافية مع صوت لإنشاء الاختبار</p>
            <p className="text-sm text-foreground/70 mt-2">يرجى إضافة روابط صوتية للكلمات</p>
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
            <CardTitle>نتيجة اختبار الاستماع</CardTitle>
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
      <audio ref={audioRef} preload="auto" />

      <div className="mb-6">
        <div className="flex justify-between items-center mb-2">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Volume2 className="w-6 h-6" />
            اختبار الاستماع
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
          <Card className="mb-6">
            <CardContent className="p-8 text-center">
              <Button
                size="lg"
                onClick={playAudio}
                className="w-48 h-48 rounded-full bg-primary hover:bg-primary/90"
              >
                <Volume2 className="w-24 h-24" />
              </Button>
              <p className="mt-4 text-foreground/70">اضغط لسماع الكلمة</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <p className="text-center text-lg mb-6">ما معنى الكلمة التي سمعتها؟</p>

              <div className="grid gap-4">
                {currentQuestion.options.map((option, index) => {
                  const isSelected = selectedAnswer === option;
                  const isCorrect = option === currentQuestion.correctMeaning;
                  
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
                      onClick={() => handleAnswer(option)}
                      disabled={!!selectedAnswer}
                      className={`w-full p-5 text-lg border-2 ${buttonClass} min-h-[70px]`}
                    >
                      <span className="flex-1 text-right">{option}</span>
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
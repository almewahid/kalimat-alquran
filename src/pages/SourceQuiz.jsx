import React, { useState, useEffect } from "react";
import { supabaseClient } from "@/components/api/supabaseClient";
import { useAudio } from "@/components/common/AudioContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Brain, BookOpen, CheckCircle, XCircle, Trophy, Clock, RotateCcw, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useToast } from "@/components/ui/use-toast";

const SURAHS = [
  "الفاتحة", "البقرة", "آل عمران", "النساء", "المائدة", "الأنعام", "الأعراف", "الأنفال",
  "التوبة", "يونس", "هود", "يوسف", "الرعد", "إبراهيم", "الحجر", "النحل", "الإسراء",
  "الكهف", "مريم", "طه", "الأنبياء", "الحج", "المؤمنون", "النور", "الفرقان",
  "الشعراء", "النمل", "القصص", "العنكبوت", "الروم", "لقمان", "السجدة", "الأحزاب",
  "سبأ", "فاطر", "يس", "الصافات", "ص", "الزمر", "غافر", "فصلت", "الشورى",
  "الزخرف", "الدخان", "الجاثية", "الأحقاف", "محمد", "الفتح", "الحجرات", "ق",
  "الذاريات", "الطور", "النجم", "القمر", "الرحمن", "الواقعة", "الحديد", "المجادلة",
  "الحشر", "الممتحنة", "الصف", "الجمعة", "المنافقون", "التغابن", "الطلاق", "التحريم",
  "الملك", "القلم", "الحاقة", "المعارج", "نوح", "الجن", "المزمل", "المدثر",
  "القيامة", "الإنسان", "المرسلات", "النبأ", "النازعات", "عبس", "التكوير", "الانفطار",
  "المطففين", "الانشقاق", "البروج", "الطارق", "الأعلى", "الغاشية", "الفجر", "البلد",
  "الشمس", "الليل", "الضحى", "الشرح", "التين", "العلق", "القدر", "البينة",
  "الزلزلة", "العاديات", "القارعة", "التكاثر", "العصر", "الهمزة", "الفيل", "قريش",
  "الماعون", "الكوثر", "الكافرون", "النصر", "المسد", "الإخلاص", "الفلق", "الناس"
];

export default function SourceQuiz() {
  const { toast } = useToast();
  const { playWord } = useAudio();
  const [mode, setMode] = useState("setup"); // setup, quiz, results
  const [sourceType, setSourceType] = useState("surah");
  const [selectedSource, setSelectedSource] = useState("");
  const [questions, setQuestions] = useState([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState([]);
  const [selectedOption, setSelectedOption] = useState(null);
  const [startTime, setStartTime] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [previousResults, setPreviousResults] = useState([]);

  useEffect(() => {
    loadPreviousResults();
  }, []);

  const loadPreviousResults = async () => {
    try {
      const user = await supabaseClient.auth.me();
      const results = await supabaseClient.entities.SourceQuiz.filter({
        user_email: user.email,
        completed: true
      });
      setPreviousResults(results.sort((a, b) => 
        new Date(b.completion_date) - new Date(a.completion_date)
      ).slice(0, 5));
    } catch (error) {
      console.error("Error loading results:", error);
    }
  };

  const startQuiz = async () => {
    if (!selectedSource) {
      toast({
        title: "⚠️ تنبيه",
        description: "يرجى اختيار مصدر الاختبار",
        variant: "destructive",
        duration: 3000
      });
      return;
    }

    setIsLoading(true);
    try {
      const user = await supabaseClient.auth.me();
      
      // جلب الكلمات حسب المصدر
      let words = [];
      if (sourceType === "surah") {
        words = await supabaseClient.entities.QuranicWord.filter({
          surah_name: selectedSource
        });
      } else {
        words = await supabaseClient.entities.QuranicWord.filter({
          juz_number: parseInt(selectedSource)
        });
      }

      if (words.length === 0) {
        toast({
          title: "⚠️ لا توجد كلمات",
          description: "لم نجد كلمات في هذا المصدر",
          variant: "destructive",
          duration: 3000
        });
        setIsLoading(false);
        return;
      }

      // اختيار 10 كلمات عشوائية
      const selectedWords = words.sort(() => Math.random() - 0.5).slice(0, Math.min(10, words.length));
      const allWords = await supabaseClient.entities.QuranicWord.list("-created_date", 200);

      // إنشاء الأسئلة
      const quizQuestions = selectedWords.map(word => {
        const wrongAnswers = allWords
          .filter(w => w.id !== word.id && w.meaning !== word.meaning)
          .sort(() => Math.random() - 0.5)
          .slice(0, 3);

        const options = [word, ...wrongAnswers].sort(() => Math.random() - 0.5);
        return { word, options, correctAnswer: word.meaning };
      });

      setQuestions(quizQuestions);
      setCurrentQuestionIndex(0);
      setAnswers([]);
      setMode("quiz");
      setStartTime(Date.now());

    } catch (error) {
      console.error("Error starting quiz:", error);
      toast({
        title: "خطأ",
        description: "حدث خطأ أثناء بدء الاختبار",
        variant: "destructive",
        duration: 3000
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleAnswer = async (option) => {
    if (selectedOption) return;

    const isCorrect = option.id === questions[currentQuestionIndex].word.id;
    setSelectedOption(option);

    const newAnswers = [...answers, {
      word_id: questions[currentQuestionIndex].word.id,
      selected_answer: option.meaning,
      correct_answer: questions[currentQuestionIndex].correctAnswer,
      is_correct: isCorrect
    }];
    setAnswers(newAnswers);

    // تحديث WordProgress
    try {
      const user = await supabaseClient.auth.me();
      const wordId = questions[currentQuestionIndex].word.id;
      
      const [existingProgress] = await supabaseClient.entities.WordProgress.filter({
        word_id: wordId,
        user_email: user.email
      });

      const now = new Date().toISOString();
      const newHistory = {
        date: now,
        quality: isCorrect ? 5 : 2,
        time_spent: 0
      };

      if (existingProgress) {
        const history = existingProgress.review_history || [];
        const correctCount = existingProgress.correct_count + (isCorrect ? 1 : 0);
        const mistakesCount = existingProgress.mistakes_count + (isCorrect ? 0 : 1);
        const totalReviews = existingProgress.total_reviews + 1;
        const confidenceScore = Math.min(100, (correctCount / totalReviews) * 100);

        await supabaseClient.entities.WordProgress.update(existingProgress.id, {
          total_reviews: totalReviews,
          correct_count: correctCount,
          mistakes_count: mistakesCount,
          last_review_date: now,
          review_history: [...history, newHistory],
          confidence_score: confidenceScore
        });
      } else {
        await supabaseClient.entities.WordProgress.create({
          word_id: wordId,
          user_email: user.email,
          total_reviews: 1,
          correct_count: isCorrect ? 1 : 0,
          mistakes_count: isCorrect ? 0 : 1,
          last_review_date: now,
          review_history: [newHistory],
          confidence_score: isCorrect ? 100 : 0
        });
      }
    } catch (error) {
      console.error("Error updating word progress:", error);
    }

    setTimeout(() => {
      if (currentQuestionIndex < questions.length - 1) {
        setCurrentQuestionIndex(currentQuestionIndex + 1);
        setSelectedOption(null);
      } else {
        finishQuiz(newAnswers);
      }
    }, 1500);
  };

  const finishQuiz = async (finalAnswers) => {
    const correctCount = finalAnswers.filter(a => a.is_correct).length;
    const timeTaken = Math.floor((Date.now() - startTime) / 1000);
    const scorePercentage = (correctCount / questions.length) * 100;

    try {
      const user = await supabaseClient.auth.me();
      await supabaseClient.entities.SourceQuiz.create({
        user_email: user.email,
        source_type: sourceType,
        source_name: selectedSource,
        total_questions: questions.length,
        correct_answers: correctCount,
        score_percentage: scorePercentage,
        time_taken: timeTaken,
        completed: true,
        completion_date: new Date().toISOString(),
        questions_data: finalAnswers
      });

      // تحديث تقدم المستخدم
      const xpGained = correctCount * 20;
      const [progress] = await supabaseClient.entities.UserProgress.filter({
        user_email: user.email
      });

      if (progress) {
        await supabaseClient.entities.UserProgress.update(progress.id, {
          total_xp: (progress.total_xp || 0) + xpGained,
          current_level: Math.floor(((progress.total_xp || 0) + xpGained) / 100) + 1
        });
      }

      loadPreviousResults();
      setMode("results");
    } catch (error) {
      console.error("Error saving quiz results:", error);
    }
  };

  const resetQuiz = () => {
    setMode("setup");
    setSelectedSource("");
    setQuestions([]);
    setCurrentQuestionIndex(0);
    setAnswers([]);
    setSelectedOption(null);
  };

  if (mode === "quiz") {
    const currentQuestion = questions[currentQuestionIndex];
    
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center mb-4">
              <Badge variant="outline">سؤال {currentQuestionIndex + 1} من {questions.length}</Badge>
              <Badge>{sourceType === "surah" ? selectedSource : `الجزء ${selectedSource}`}</Badge>
            </div>
            <Progress value={((currentQuestionIndex + 1) / questions.length) * 100} />
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="text-center py-8">
              <h3 
                className="text-5xl font-bold text-primary mb-4 cursor-pointer hover:text-primary/80 transition-colors"
                onClick={() => playWord(
                  currentQuestion.word.surah_number, 
                  currentQuestion.word.ayah_number, 
                  currentQuestion.word.word,
                  currentQuestion.word
                )}
              >
                🔊 {currentQuestion.word.word}
              </h3>
              <p className="text-muted-foreground">اختر المعنى الصحيح (اضغط على الكلمة للاستماع)</p>
            </div>

            <div className="grid gap-3">
              {currentQuestion.options.map((option, idx) => {
                let btnClass = "justify-start text-right h-auto py-4 text-lg transition-all";
                if (selectedOption) {
                  if (option.id === currentQuestion.word.id) {
                    btnClass += " bg-green-100 border-green-500 text-green-800";
                  } else if (option.id === selectedOption.id) {
                    btnClass += " bg-red-100 border-red-500 text-red-800";
                  } else {
                    btnClass += " opacity-50";
                  }
                }

                return (
                  <Button
                    key={idx}
                    variant="outline"
                    className={btnClass}
                    onClick={() => !selectedOption && handleAnswer(option)}
                    disabled={!!selectedOption}
                    onMouseEnter={() => {
                      if (!selectedOption) {
                        // استخدام Google TTS للنطق
                        const utterance = new SpeechSynthesisUtterance(option.meaning);
                        utterance.lang = 'ar-SA';
                        utterance.rate = 0.9;
                        window.speechSynthesis.speak(utterance);
                      }
                    }}
                  >
                    🔊 {option.meaning}
                  </Button>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (mode === "results") {
    const correctCount = answers.filter(a => a.is_correct).length;
    const scorePercentage = (correctCount / questions.length) * 100;

    return (
      <div className="p-6 max-w-4xl mx-auto">
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}>
          <Card>
            <CardHeader className="text-center pb-8">
              <Trophy className="w-20 h-20 text-yellow-500 mx-auto mb-4" />
              <CardTitle className="text-3xl mb-2">انتهى الاختبار!</CardTitle>
              <p className="text-2xl text-primary font-bold">
                {correctCount} من {questions.length} ({scorePercentage.toFixed(0)}%)
              </p>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid md:grid-cols-2 gap-4">
                <Card className="bg-green-50 border-green-200">
                  <CardContent className="p-4 text-center">
                    <CheckCircle className="w-8 h-8 text-green-600 mx-auto mb-2" />
                    <p className="text-sm text-green-700">إجابات صحيحة</p>
                    <p className="text-3xl font-bold text-green-800">{correctCount}</p>
                  </CardContent>
                </Card>
                <Card className="bg-red-50 border-red-200">
                  <CardContent className="p-4 text-center">
                    <XCircle className="w-8 h-8 text-red-600 mx-auto mb-2" />
                    <p className="text-sm text-red-700">إجابات خاطئة</p>
                    <p className="text-3xl font-bold text-red-800">{questions.length - correctCount}</p>
                  </CardContent>
                </Card>
              </div>

              <div className="space-y-2">
                <h4 className="font-bold text-lg mb-3">نتائج الأسئلة:</h4>
                {answers.map((answer, idx) => {
                  const word = questions[idx].word;
                  return (
                    <div key={idx} className={`p-3 rounded-lg border ${answer.is_correct ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                      <div className="flex justify-between items-center">
                        <span className="font-bold">{word.word}</span>
                        {answer.is_correct ? (
                          <CheckCircle className="w-5 h-5 text-green-600" />
                        ) : (
                          <XCircle className="w-5 h-5 text-red-600" />
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">الإجابة الصحيحة: {answer.correct_answer}</p>
                      {!answer.is_correct && (
                        <p className="text-sm text-red-600">اخترت: {answer.selected_answer}</p>
                      )}
                    </div>
                  );
                })}
              </div>

              <Button onClick={resetQuiz} size="lg" className="w-full">
                <RotateCcw className="w-5 h-5 ml-2" />
                اختبار جديد
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold gradient-text mb-2">اختبار حسب المصدر</h1>
        <p className="text-muted-foreground">اختبر معرفتك بكلمات سورة أو جزء محدد</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="w-6 h-6 text-primary" />
            إعداد الاختبار
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">نوع المصدر</label>
              <div className="grid grid-cols-2 gap-3">
                <Button
                  variant={sourceType === "surah" ? "default" : "outline"}
                  onClick={() => {
                    setSourceType("surah");
                    setSelectedSource("");
                  }}
                  className="h-20"
                >
                  <BookOpen className="w-6 h-6 ml-2" />
                  سورة
                </Button>
                <Button
                  variant={sourceType === "juz" ? "default" : "outline"}
                  onClick={() => {
                    setSourceType("juz");
                    setSelectedSource("");
                  }}
                  className="h-20"
                >
                  <BookOpen className="w-6 h-6 ml-2" />
                  جزء
                </Button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                {sourceType === "surah" ? "اختر السورة" : "اختر الجزء"}
              </label>
              {sourceType === "surah" ? (
                <Select value={selectedSource} onValueChange={setSelectedSource}>
                  <SelectTrigger>
                    <SelectValue placeholder="اختر السورة" />
                  </SelectTrigger>
                  <SelectContent className="max-h-[300px]">
                    {SURAHS.map((surah, idx) => (
                      <SelectItem key={idx} value={surah}>{surah}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <Select value={selectedSource} onValueChange={setSelectedSource}>
                  <SelectTrigger>
                    <SelectValue placeholder="اختر الجزء" />
                  </SelectTrigger>
                  <SelectContent className="max-h-[300px]">
                    {Array.from({ length: 30 }, (_, i) => i + 1).map(juz => (
                      <SelectItem key={juz} value={juz.toString()}>الجزء {juz}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
          </div>

          <Button 
            onClick={startQuiz} 
            disabled={isLoading || !selectedSource}
            size="lg" 
            className="w-full"
          >
            {isLoading ? (
              <><Loader2 className="w-5 h-5 ml-2 animate-spin" /> جارٍ التحميل...</>
            ) : (
              <><Brain className="w-5 h-5 ml-2" /> ابدأ الاختبار</>
            )}
          </Button>
        </CardContent>
      </Card>

      {previousResults.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="w-6 h-6 text-primary" />
              آخر النتائج
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {previousResults.map((result, idx) => (
                <div key={idx} className="flex justify-between items-center p-3 bg-muted/30 rounded-lg">
                  <div>
                    <p className="font-medium">
                      {result.source_type === "surah" ? result.source_name : `الجزء ${result.source_name}`}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(result.completion_date).toLocaleDateString('ar-SA')}
                    </p>
                  </div>
                  <Badge className={result.score_percentage >= 70 ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"}>
                    {result.score_percentage.toFixed(0)}%
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
import React, { useState, useEffect } from "react";
import { supabaseClient } from "@/components/api/supabaseClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress as ProgressBar } from "@/components/ui/progress";
import { 
  Trophy, 
  Target, 
  Calendar, 
  TrendingUp,
  Flame,
  BookOpen,
  Brain
} from "lucide-react";
import { motion } from "framer-motion";
import { format, isValid, parseISO } from "date-fns";
import { ar } from "date-fns/locale";

import WeeklyChart from "../components/progress/WeeklyChart";
import { QuizPerformanceChart, DifficultyDistributionChart, ReviewStatusChart } from "../components/progress/ProgressCharts";
import { FlashCard } from "@/api/entities"; // Assuming you have this exported, or use supabaseClient.entities.FlashCard

export default function Progress() {
  const [userProgress, setUserProgress] = useState(null);
  const [quizSessions, setQuizSessions] = useState([]);
  const [totalWords, setTotalWords] = useState(0);
  const [weeklyData, setWeeklyData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // New States for detailed charts
  const [quizTrendData, setQuizTrendData] = useState([]);
  const [difficultyData, setDifficultyData] = useState([]);
  const [reviewStatusData, setReviewStatusData] = useState([]);

  useEffect(() => {
    loadProgressData();
  }, []);

  const loadProgressData = async () => {
    try {
      const user = await supabaseClient.auth.me();
      if (!user?.email) {
        console.warn("User email not found");
        setIsLoading(false);
        return;
      }

      // 1. Load User Progress
      const progressList = await supabaseClient.entities.UserProgress.filter({ created_by: user.email });
      const progress = progressList[0] || {
        total_xp: 0,
        current_level: 1,
        words_learned: 0,
        quiz_streak: 0,
        learned_words: []
      };
      setUserProgress(progress);

      // 2. Load Quiz Sessions
      const sessions = await supabaseClient.entities.QuizSession.filter({ created_by: user.email }, '-created_date');
      const validSessions = sessions.filter(session => session && typeof session === 'object');
      setQuizSessions(validSessions);

      // 3. Load All Words & FlashCards
      const words = await supabaseClient.entities.QuranicWord.list();
      const flashcards = await supabaseClient.entities.FlashCard.filter({ created_by: user.email });
      
      setTotalWords(Array.isArray(words) ? words.length : 0);

      // --- Process Weekly XP Data ---
      const last7Days = [];
      for (let i = 6; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];
        
        const dayXP = validSessions
          .filter(session => session.created_date?.startsWith(dateStr))
          .reduce((sum, session) => sum + (session.xp_earned || 0), 0);

        last7Days.push({
          date: format(date, 'EEE', { locale: ar }),
          xp: dayXP
        });
      }
      setWeeklyData(last7Days);

      // --- Process Quiz Trend Data (Last 10 quizzes) ---
      const trendData = validSessions
        .slice(0, 10)
        .reverse()
        .map(session => ({
          date: format(parseISO(session.created_date), 'd MMM', { locale: ar }),
          score: session.score || 0
        }));
      setQuizTrendData(trendData);

      // --- Process Difficulty Distribution ---
      // We need to match learned words with their difficulty
      const learnedWordIds = new Set(progress.learned_words || []);
      const learnedWordsList = words.filter(w => learnedWordIds.has(w.id));
      
      const difficultyCounts = learnedWordsList.reduce((acc, w) => {
        const level = w.difficulty_level || 'غير محدد';
        acc[level] = (acc[level] || 0) + 1;
        return acc;
      }, {});

      const pieData = Object.entries(difficultyCounts).map(([name, value]) => ({ name, value }));
      if (pieData.length === 0) pieData.push({ name: 'لا يوجد بيانات', value: 1 }); // Placeholder
      setDifficultyData(pieData);

      // --- Process Review Status (SRS Intervals) ---
      // Categorize by interval: New (<1 day), Learning (1-3 days), Review (4-14 days), Mastered (>14 days)
      const statusCounts = {
        new: 0,
        learning: 0,
        review: 0,
        mastered: 0
      };

      flashcards.forEach(card => {
        const interval = card.interval || 0;
        if (interval <= 1) statusCounts.new++;
        else if (interval <= 3) statusCounts.learning++;
        else if (interval <= 14) statusCounts.review++;
        else statusCounts.mastered++;
      });

      const barData = [
        { name: 'جديدة', count: statusCounts.new, color: '#8884d8' },
        { name: 'تعلم', count: statusCounts.learning, color: '#82ca9d' },
        { name: 'مراجعة', count: statusCounts.review, color: '#ffc658' },
        { name: 'متقنة', count: statusCounts.mastered, color: '#00C49F' },
      ];
      setReviewStatusData(barData);

      setIsLoading(false);
    } catch (error) {
      console.error("Error loading progress data:", error);
      setIsLoading(false);
    }
  };

  const getCompletionPercentage = () => {
    if (!userProgress || totalWords === 0) return 0;
    const wordsLearned = typeof userProgress.words_learned === 'number' ? userProgress.words_learned : 0;
    return Math.round((wordsLearned / totalWords) * 100);
  };

  const getLevelProgress = () => {
    if (!userProgress) return 0;
    const currentLevel = typeof userProgress.current_level === 'number' ? userProgress.current_level : 1;
    const totalXP = typeof userProgress.total_xp === 'number' ? userProgress.total_xp : 0;
    
    const currentLevelXP = (currentLevel - 1) * 100;
    const nextLevelXP = currentLevel * 100;
    const progressInLevel = totalXP - currentLevelXP;
    const levelRange = nextLevelXP - currentLevelXP;
    
    return Math.max(0, Math.min(100, (progressInLevel / levelRange) * 100));
  };

  const getAverageScore = () => {
    const validScores = quizSessions
      .filter(session => typeof session.score === 'number')
      .map(session => session.score);
    
    if (validScores.length === 0) return 0;
    
    return Math.round(
      validScores.reduce((sum, score) => sum + score, 0) / validScores.length
    );
  };

  const formatSessionDate = (dateString) => {
    if (!dateString) return 'لا يوجد تاريخ';
    
    try {
      const date = parseISO(dateString);
      if (!isValid(date)) return 'تاريخ غير صالح';
      return format(date, 'dd MMM yyyy', { locale: ar });
    } catch (error) {
      console.warn("Error formatting date:", dateString);
      return 'تاريخ غير صالح';
    }
  };

  if (isLoading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-screen">
        <div className="text-center" role="status" aria-busy="true" aria-live="polite">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4" aria-hidden="true"></div>
          <p className="text-primary">جارٍ تحميل بيانات التقدم...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-8">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <h1 className="text-3xl font-bold gradient-text mb-2">تقدمك في التعلم</h1>
          <p className="text-primary">تابع إنجازاتك ومستواك</p>
        </motion.div>

        {/* Level and XP Overview */}
        <div className="grid lg:grid-cols-3 gap-6 mb-8">
           <Card className="lg:col-span-2 bg-card shadow-md rounded-2xl border border-border transition-all duration-300 ease-in-out hover:shadow-lg">
             <CardHeader>
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                            <Trophy className="w-6 h-6 text-primary" />
                        </div>
                        <div>
                            <CardTitle className="text-primary font-semibold text-2xl">المستوى {userProgress?.current_level || 1}</CardTitle>
                            <p className="text-foreground/70">إجمالي النقاط: {userProgress?.total_xp || 0} XP</p>
                        </div>
                    </div>
                </div>
             </CardHeader>
            <CardContent className="pt-0 p-6">
              <div className="space-y-2">
                <div className="flex justify-between text-sm text-foreground/80">
                  <span>التقدم للمستوى التالي</span>
                  <span>{Math.round(getLevelProgress())}%</span>
                </div>
                <ProgressBar 
                  value={getLevelProgress()} 
                  className="h-3"
                  aria-label={`تقدم المستوى: ${Math.round(getLevelProgress())}%`}
                />
                <p className="text-foreground/70 text-sm">
                  {100 - ((userProgress?.total_xp || 0) % 100)} نقطة للمستوى التالي
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card shadow-md rounded-2xl border border-border transition-all duration-300 ease-in-out hover:shadow-lg">
            <CardHeader>
              <CardTitle className="text-primary font-semibold flex items-center gap-2">
                <Flame className="w-5 h-5 text-primary" />
                سلسلة النجاح
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center">
                <div className="text-3xl font-bold text-orange-500 mb-2">
                  {userProgress?.quiz_streak || 0}
                </div>
                <p className="text-foreground/70 text-sm">اختبار متتالي ناجح</p>
                {(userProgress?.quiz_streak || 0) >= 7 && (
                  <Badge className="mt-3 bg-background-soft text-foreground border border-border">
                    🔥 في قمة الحماس!
                  </Badge>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Statistics Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="bg-card shadow-md rounded-2xl border border-border transition-all duration-300 ease-in-out hover:shadow-lg">
            <CardContent className="p-6 text-center">
              <BookOpen className="w-8 h-8 text-blue-500 mx-auto mb-3" />
              <div className="text-2xl font-bold text-foreground">
                {userProgress?.words_learned || 0}
              </div>
              <p className="text-foreground/70 text-sm">كلمة متعلمة</p>
              <div className="mt-2">
                <ProgressBar 
                  value={getCompletionPercentage()} 
                  className="h-2"
                  aria-label={`إكمال التعلم: ${getCompletionPercentage()}%`}
                />
                <p className="text-xs text-blue-500 mt-1">
                  {getCompletionPercentage()}% مكتمل
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card shadow-md rounded-2xl border border-border transition-all duration-300 ease-in-out hover:shadow-lg">
            <CardContent className="p-6 text-center">
              <Brain className="w-8 h-8 text-purple-500 mx-auto mb-3" />
              <div className="text-2xl font-bold text-foreground">
                {quizSessions.length}
              </div>
              <p className="text-foreground/70 text-sm">اختبار مكتمل</p>
            </CardContent>
          </Card>

          <Card className="bg-card shadow-md rounded-2xl border border-border transition-all duration-300 ease-in-out hover:shadow-lg">
            <CardContent className="p-6 text-center">
              <Target className="w-8 h-8 text-purple-500 mx-auto mb-3" />
              <div className="text-2xl font-bold text-foreground">
                {getAverageScore()}%
              </div>
              <p className="text-foreground/70 text-sm">متوسط النتائج</p>
            </CardContent>
          </Card>

          <Card className="bg-card shadow-md rounded-2xl border border-border transition-all duration-300 ease-in-out hover:shadow-lg">
            <CardContent className="p-6 text-center">
              <TrendingUp className="w-8 h-8 text-green-500 mx-auto mb-3" />
              <div className="text-2xl font-bold text-foreground">
                {weeklyData.reduce((sum, day) => sum + (day.xp || 0), 0)}
              </div>
              <p className="text-foreground/70 text-sm">نقاط هذا الأسبوع</p>
            </CardContent>
          </Card>
        </div>

        {/* Charts and Details */}
        {/* Charts Grid */}
        <div className="grid lg:grid-cols-2 gap-6">
          <WeeklyChart data={weeklyData} />
          <QuizPerformanceChart data={quizTrendData} />
        </div>

        <div className="grid md:grid-cols-2 gap-6">
           <DifficultyDistributionChart data={difficultyData} />
           <ReviewStatusChart data={reviewStatusData} />
        </div>

        {/* Recent Quizzes List */}
        <Card className="bg-card shadow-md rounded-2xl border border-border transition-all duration-300 ease-in-out hover:shadow-lg">
            <CardHeader>
              <CardTitle className="text-primary font-semibold flex items-center gap-2">
                <Calendar className="w-5 h-5 text-primary" />
                سجل آخر الاختبارات
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3" role="list" aria-label="قائمة آخر الاختبارات">
                {quizSessions.slice(0, 5).map((session, index) => (
                  <motion.div
                    key={session.id || `session-${index}`}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="flex justify-between items-center p-3 bg-background-soft rounded-lg hover:bg-muted/50 transition-colors"
                    role="listitem"
                  >
                    <div>
                      <p className="font-medium text-foreground">
                        {session.correct_answers || 0} من {session.total_questions || 0} إجابات صحيحة
                      </p>
                      <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                        <Calendar className="w-3 h-3" />
                        {formatSessionDate(session.created_date)}
                      </p>
                    </div>
                    <div className="text-left flex flex-col items-end gap-1">
                      <Badge 
                        className={
                          (session.score || 0) >= 80 ? "bg-green-100 text-green-700 hover:bg-green-200" :
                          (session.score || 0) >= 60 ? "bg-yellow-100 text-yellow-700 hover:bg-yellow-200" :
                          "bg-red-100 text-red-700 hover:bg-red-200"
                        }
                      >
                        {session.score || 0}%
                      </Badge>
                      <span className="text-xs font-bold text-primary flex items-center gap-1">
                        +{session.xp_earned || 0} XP
                      </span>
                    </div>
                  </motion.div>
                ))}
                {quizSessions.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    <p>لم تقم بأي اختبار بعد</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
      </div>
    </div>
  );
}
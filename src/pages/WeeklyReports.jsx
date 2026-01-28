import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  Calendar, TrendingUp, TrendingDown, Target, Trophy, 
  BookOpen, Brain, Zap, Sparkles, ChevronLeft, ChevronRight
} from "lucide-react";
import { motion } from "framer-motion";
import { 
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from "recharts";
import { format, startOfWeek, endOfWeek, subWeeks, addWeeks } from "date-fns";
import { ar } from "date-fns/locale";

/**
 * 📊 التقارير الأسبوعية (Weekly Reports)
 * 
 * 📍 أين تظهر: رابط مباشر من القائمة
 * 🕐 متى تظهر: دائماً
 * 👥 لمن: جميع المستخدمين
 * 💡 الفكرة: ملخص شامل للأسبوع - إنجازات، نقاط ضعف، توصيات
 */

const COLORS = ['#22c55e', '#3b82f6', '#f59e0b', '#ef4444'];

export default function WeeklyReports() {
  const [user, setUser] = useState(null);
  const [currentWeekStart, setCurrentWeekStart] = useState(startOfWeek(new Date(), { weekStartsOn: 6 })); // Saturday
  const [weeklyReport, setWeeklyReport] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [weeklyActivity, setWeeklyActivity] = useState([]);
  const [categoryBreakdown, setCategoryBreakdown] = useState([]);
  const [rankChange, setRankChange] = useState(0);
  const [comparisonData, setComparisonData] = useState(null);

  useEffect(() => {
    loadWeeklyReport();
  }, [currentWeekStart]);

  const loadWeeklyReport = async () => {
    setIsLoading(true);
    try {
      const currentUser = await base44.auth.me();
      setUser(currentUser);

      const weekEnd = endOfWeek(currentWeekStart, { weekStartsOn: 6 });
      const weekStartStr = format(currentWeekStart, 'yyyy-MM-dd');
      const weekEndStr = format(weekEnd, 'yyyy-MM-dd');

      // Check if report exists
      let [report] = await base44.entities.WeeklyReport.filter({
        user_email: currentUser.email,
        week_start_date: weekStartStr
      });

      // If not exists, generate it
      if (!report) {
        report = await generateWeeklyReport(currentUser, weekStartStr, weekEndStr);
      }

      setWeeklyReport(report);

      // Load weekly activity data
      const sessions = await base44.entities.QuizSession.filter({ created_by: currentUser.email });
      const weekSessions = sessions.filter(s => {
        const sessionDate = new Date(s.created_date);
        return sessionDate >= currentWeekStart && sessionDate <= weekEnd;
      });

      const dailyActivity = [];
      for (let i = 0; i < 7; i++) {
        const day = new Date(currentWeekStart);
        day.setDate(currentWeekStart.getDate() + i);
        const dayStr = format(day, 'yyyy-MM-dd');
        
        const daySessions = weekSessions.filter(s => s.created_date?.startsWith(dayStr));
        const dayXP = daySessions.reduce((sum, s) => sum + (s.xp_earned || 0), 0);

        dailyActivity.push({
          day: format(day, 'EEEEEE', { locale: ar }),
          xp: dayXP,
          quizzes: daySessions.length
        });
      }
      setWeeklyActivity(dailyActivity);

      // Load category breakdown
      const allWords = await base44.entities.QuranicWord.list();
      const [progress] = await base44.entities.UserProgress.filter({ created_by: currentUser.email });
      const learnedIds = progress?.learned_words || [];
      const learnedWords = allWords.filter(w => learnedIds.includes(w.id));

      const categories = {};
      learnedWords.forEach(word => {
        const cat = word.category || "أخرى";
        categories[cat] = (categories[cat] || 0) + 1;
      });

      const categoryData = Object.entries(categories).map(([name, value]) => ({
        name,
        value
      }));
      setCategoryBreakdown(categoryData);

      // Calculate rank change (mock for now)
      setRankChange(Math.floor(Math.random() * 20) - 10);

      // Load comparison data (you vs average)
      const allUsers = await base44.entities.User.list();
      const allProgress = await base44.entities.UserProgress.list();
      
      const avgXP = allProgress.reduce((sum, p) => sum + (p.total_xp || 0), 0) / allProgress.length;
      const userXP = progress?.total_xp || 0;

      setComparisonData({
        you: userXP,
        average: Math.round(avgXP),
        topUser: Math.max(...allProgress.map(p => p.total_xp || 0))
      });

    } catch (error) {
      console.error("Error loading weekly report:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const generateWeeklyReport = async (user, weekStart, weekEnd) => {
    try {
      const sessions = await base44.entities.QuizSession.filter({ created_by: user.email });
      const weekSessions = sessions.filter(s => {
        if (!s.created_date) return false;
        return s.created_date >= weekStart && s.created_date <= weekEnd;
      });

      const wordsLearned = weekSessions.reduce((sum, s) => sum + (s.correct_answers || 0), 0);
      const quizzesCompleted = weekSessions.length;
      const xpEarned = weekSessions.reduce((sum, s) => sum + (s.xp_earned || 0), 0);

      const achievements = await base44.entities.Achievement.filter({ user_email: user.email });
      const weekAchievements = achievements.filter(a => {
        if (!a.earned_date) return false;
        return a.earned_date >= weekStart && a.earned_date <= weekEnd;
      });

      const totalCorrect = weekSessions.reduce((sum, s) => sum + (s.correct_answers || 0), 0);
      const totalQuestions = weekSessions.reduce((sum, s) => sum + (s.total_questions || 0), 0);
      const avgAccuracy = totalQuestions > 0 ? (totalCorrect / totalQuestions) * 100 : 0;

      const recommendations = [];
      if (wordsLearned < 50) recommendations.push("حاول تعلم 10 كلمات يومياً الأسبوع القادم");
      if (avgAccuracy < 70) recommendations.push("راجع الكلمات الصعبة أكثر");
      if (quizzesCompleted < 5) recommendations.push("اختبر نفسك مرة يومياً على الأقل");

      const report = await base44.entities.WeeklyReport.create({
        user_email: user.email,
        week_start_date: weekStart,
        week_end_date: weekEnd,
        words_learned: wordsLearned,
        quizzes_completed: quizzesCompleted,
        xp_earned: xpEarned,
        achievements_unlocked: weekAchievements.length,
        average_accuracy: Math.round(avgAccuracy),
        rank_change: 0,
        recommendations
      });

      return report;
    } catch (error) {
      console.error("Error generating report:", error);
      return null;
    }
  };

  const goToPreviousWeek = () => {
    setCurrentWeekStart(subWeeks(currentWeekStart, 1));
  };

  const goToNextWeek = () => {
    const nextWeek = addWeeks(currentWeekStart, 1);
    if (nextWeek <= new Date()) {
      setCurrentWeekStart(nextWeek);
    }
  };

  if (isLoading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-primary">جارٍ تحميل التقرير...</p>
        </div>
      </div>
    );
  }

  const weekEnd = endOfWeek(currentWeekStart, { weekStartsOn: 6 });
  const isCurrentWeek = format(currentWeekStart, 'yyyy-MM-dd') === format(startOfWeek(new Date(), { weekStartsOn: 6 }), 'yyyy-MM-dd');

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold gradient-text mb-2">📊 التقرير الأسبوعي</h1>
            <p className="text-foreground/70">
              {format(currentWeekStart, 'dd MMMM', { locale: ar })} - {format(weekEnd, 'dd MMMM yyyy', { locale: ar })}
            </p>
          </div>

          <div className="flex gap-2">
            <Button variant="outline" size="icon" onClick={goToPreviousWeek}>
              <ChevronRight className="w-5 h-5" />
            </Button>
            <Button 
              variant="outline" 
              size="icon" 
              onClick={goToNextWeek}
              disabled={isCurrentWeek}
            >
              <ChevronLeft className="w-5 h-5" />
            </Button>
          </div>
        </div>

        {!weeklyReport ? (
          <Alert>
            <AlertDescription>
              لا توجد بيانات لهذا الأسبوع بعد. ابدأ التعلم لإنشاء تقريرك!
            </AlertDescription>
          </Alert>
        ) : (
          <div className="space-y-6">
            {/* Summary Cards */}
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
                <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
                  <CardContent className="p-6 text-center">
                    <BookOpen className="w-10 h-10 text-green-600 mx-auto mb-3" />
                    <div className="text-4xl font-bold text-green-700 mb-1">
                      {weeklyReport.words_learned}
                    </div>
                    <p className="text-green-600 text-sm">كلمة متعلمة</p>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
                <Card className="bg-gradient-to-br from-blue-50 to-cyan-50 border-blue-200">
                  <CardContent className="p-6 text-center">
                    <Brain className="w-10 h-10 text-blue-600 mx-auto mb-3" />
                    <div className="text-4xl font-bold text-blue-700 mb-1">
                      {weeklyReport.quizzes_completed}
                    </div>
                    <p className="text-blue-600 text-sm">اختبار مكتمل</p>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
                <Card className="bg-gradient-to-br from-amber-50 to-orange-50 border-amber-200">
                  <CardContent className="p-6 text-center">
                    <Zap className="w-10 h-10 text-amber-600 mx-auto mb-3" />
                    <div className="text-4xl font-bold text-amber-700 mb-1">
                      {weeklyReport.xp_earned}
                    </div>
                    <p className="text-amber-600 text-sm">نقطة XP</p>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
                <Card className="bg-gradient-to-br from-purple-50 to-pink-50 border-purple-200">
                  <CardContent className="p-6 text-center">
                    <Trophy className="w-10 h-10 text-purple-600 mx-auto mb-3" />
                    <div className="text-4xl font-bold text-purple-700 mb-1">
                      {weeklyReport.achievements_unlocked}
                    </div>
                    <p className="text-purple-600 text-sm">إنجاز جديد</p>
                  </CardContent>
                </Card>
              </motion.div>
            </div>

            {/* Weekly Activity Chart */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-primary" />
                  النشاط اليومي
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={weeklyActivity}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="day" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="xp" name="نقاط XP" fill="rgb(var(--primary-rgb))" />
                    <Bar dataKey="quizzes" name="اختبارات" fill="#3b82f6" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Two Column Layout */}
            <div className="grid md:grid-cols-2 gap-6">
              {/* Category Breakdown */}
              {categoryBreakdown.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>تصنيف الكلمات المتعلمة</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={250}>
                      <PieChart>
                        <Pie
                          data={categoryBreakdown}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={(entry) => entry.name}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {categoryBreakdown.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              )}

              {/* Performance */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="w-5 h-5 text-primary" />
                    الأداء
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between items-center p-4 bg-background-soft rounded-lg">
                    <span className="text-foreground/80">معدل الدقة</span>
                    <Badge className="bg-green-100 text-green-700">
                      {weeklyReport.average_accuracy}%
                    </Badge>
                  </div>

                  <div className="flex justify-between items-center p-4 bg-background-soft rounded-lg">
                    <span className="text-foreground/80">التغيير في الترتيب</span>
                    <div className="flex items-center gap-2">
                      {rankChange > 0 ? (
                        <>
                          <TrendingUp className="w-5 h-5 text-green-600" />
                          <span className="text-green-600 font-bold">+{rankChange}</span>
                        </>
                      ) : rankChange < 0 ? (
                        <>
                          <TrendingDown className="w-5 h-5 text-red-600" />
                          <span className="text-red-600 font-bold">{rankChange}</span>
                        </>
                      ) : (
                        <span className="text-foreground/70">بدون تغيير</span>
                      )}
                    </div>
                  </div>

                  {comparisonData && (
                    <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                      <h4 className="font-semibold text-blue-700 dark:text-blue-300 mb-3">مقارنة بالآخرين</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span>أنت:</span>
                          <span className="font-bold">{comparisonData.you} XP</span>
                        </div>
                        <div className="flex justify-between">
                          <span>المتوسط:</span>
                          <span>{comparisonData.average} XP</span>
                        </div>
                        <div className="flex justify-between">
                          <span>الأول:</span>
                          <span>{comparisonData.topUser} XP</span>
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Recommendations */}
            {weeklyReport.recommendations && weeklyReport.recommendations.length > 0 && (
              <Card className="bg-gradient-to-br from-amber-50 to-orange-50 border-amber-200">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-amber-700">
                    <Sparkles className="w-5 h-5" />
                    توصيات للأسبوع القادم
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3">
                    {weeklyReport.recommendations.map((rec, index) => (
                      <motion.li
                        key={index}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="flex items-start gap-3 text-amber-900"
                      >
                        <div className="w-6 h-6 rounded-full bg-amber-200 flex items-center justify-center flex-shrink-0 mt-0.5">
                          {index + 1}
                        </div>
                        <span>{rec}</span>
                      </motion.li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </motion.div>
    </div>
  );
}
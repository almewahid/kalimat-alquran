import React, { useState, useEffect } from "react";
import { supabaseClient } from "@/components/api/supabaseClient";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, TrendingUp, Award, Book, Flame, Target, Calendar } from "lucide-react";
import { motion } from "framer-motion";
import WeeklyChart from "../components/progress/WeeklyChart";
import AchievementsList from "../components/progress/AchievementsList";
import { QuizPerformanceChart, DifficultyDistributionChart, ReviewStatusChart } from "../components/progress/ProgressCharts";

export default function ProgressSupabase() {
  const [user, setUser] = useState(null);

  // ✅ Load user
  const { data: userData } = useQuery({
    queryKey: ['user-progress'],
    queryFn: async () => {
      const currentUser = await supabaseClient.auth.me();
      setUser(currentUser);
      return currentUser;
    },
  });

  // ✅ Load progress
  const { data: progress, isLoading: progressLoading } = useQuery({
    queryKey: ['progress-detail', user?.email],
    queryFn: async () => {
      if (!user?.email) return null;
      const data = await supabaseClient.entities.UserProgress.filter({
        user_email: user.email
      });
      return data[0] || {
        total_xp: 0,
        current_level: 1,
        words_learned: 0,
        quiz_streak: 0,
        consecutive_login_days: 1
      };
    },
    enabled: !!user?.email,
  });

  // ✅ Load quiz sessions
  const { data: quizSessions } = useQuery({
    queryKey: ['quiz-sessions', user?.email],
    queryFn: async () => {
      if (!user?.email) return [];
      return await supabaseClient.entities.QuizSession.filter(
        { user_email: user.email },
        '-created_date',
        100
      );
    },
    enabled: !!user?.email,
  });

  // ✅ Load achievements
  const { data: achievements } = useQuery({
    queryKey: ['achievements', user?.email],
    queryFn: async () => {
      if (!user?.email) return [];
      return await supabaseClient.entities.Achievement.filter(
        { user_email: user.email },
        '-earned_date'
      );
    },
    enabled: !!user?.email,
  });

  // ✅ Load badges
  const { data: badges } = useQuery({
    queryKey: ['badges', user?.email],
    queryFn: async () => {
      if (!user?.email) return [];
      return await supabaseClient.entities.UserBadge.filter(
        { user_email: user.email },
        '-earned_date'
      );
    },
    enabled: !!user?.email,
  });

  // Calculate statistics
  const stats = {
    totalXP: progress?.total_xp || 0,
    currentLevel: progress?.current_level || 1,
    wordsLearned: progress?.words_learned || 0,
    quizStreak: progress?.quiz_streak || 0,
    loginStreak: progress?.consecutive_login_days || 1,
    totalQuizzes: quizSessions?.length || 0,
    averageScore: quizSessions?.length > 0
      ? Math.round(
          quizSessions.reduce((sum, q) => sum + (q.correct_answers / q.total_questions) * 100, 0) / quizSessions.length
        )
      : 0,
  };

  // Prepare weekly data
  const weeklyData = React.useMemo(() => {
    if (!quizSessions) return [];

    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - (6 - i));
      return date.toISOString().split('T')[0];
    });

    return last7Days.map(date => {
      const dayQuizzes = quizSessions.filter(q => 
        q.created_date?.startsWith(date)
      );
      return {
        day: new Date(date).toLocaleDateString('ar-EG', { weekday: 'short' }),
        xp: dayQuizzes.reduce((sum, q) => sum + (q.xp_earned || 0), 0),
        quizzes: dayQuizzes.length
      };
    });
  }, [quizSessions]);

  if (progressLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-12 h-12 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-accent/5 p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold gradient-text mb-2">تقدمك في التعلم</h1>
              <p className="text-foreground/70">تابع إنجازاتك وإحصائياتك</p>
            </div>
            <Badge className="bg-green-100 text-green-700 border-green-300">
              🟢 Supabase Backend
            </Badge>
          </div>
        </motion.div>

        {/* Stats Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 border-blue-200">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <TrendingUp className="w-8 h-8 text-blue-600" />
                  <Badge variant="outline" className="bg-blue-100">المستوى {stats.currentLevel}</Badge>
                </div>
                <p className="text-3xl font-bold text-blue-900 dark:text-blue-100">{stats.totalXP}</p>
                <p className="text-sm text-blue-700 dark:text-blue-300">نقاط الخبرة</p>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 border-green-200">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <Book className="w-8 h-8 text-green-600" />
                  <Badge variant="outline" className="bg-green-100">كلمات</Badge>
                </div>
                <p className="text-3xl font-bold text-green-900 dark:text-green-100">{stats.wordsLearned}</p>
                <p className="text-sm text-green-700 dark:text-green-300">كلمة متعلمة</p>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card className="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20 border-orange-200">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <Flame className="w-8 h-8 text-orange-600" />
                  <Badge variant="outline" className="bg-orange-100">🔥</Badge>
                </div>
                <p className="text-3xl font-bold text-orange-900 dark:text-orange-100">{stats.loginStreak}</p>
                <p className="text-sm text-orange-700 dark:text-orange-300">أيام متتالية</p>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <Card className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 border-purple-200">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <Target className="w-8 h-8 text-purple-600" />
                  <Badge variant="outline" className="bg-purple-100">{stats.averageScore}%</Badge>
                </div>
                <p className="text-3xl font-bold text-purple-900 dark:text-purple-100">{stats.totalQuizzes}</p>
                <p className="text-sm text-purple-700 dark:text-purple-300">اختبار مكتمل</p>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Charts */}
        <div className="grid lg:grid-cols-2 gap-6 mb-8">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5 }}
          >
            <Card className="bg-card shadow-md">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-primary">
                  <Calendar className="w-5 h-5" />
                  نشاط الأسبوع
                </CardTitle>
              </CardHeader>
              <CardContent>
                <WeeklyChart data={weeklyData} />
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.6 }}
          >
            <Card className="bg-card shadow-md">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-primary">
                  <Award className="w-5 h-5" />
                  الإنجازات الأخيرة
                </CardTitle>
              </CardHeader>
              <CardContent>
                <AchievementsList achievements={achievements?.slice(0, 5) || []} />
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Detailed Progress Charts */}
        <div className="grid lg:grid-cols-2 gap-6 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
          >
            <QuizPerformanceChart 
              data={quizSessions?.slice(0, 10).map((q, i) => ({
                date: new Date(q.created_date).toLocaleDateString('ar-EG', { day: 'numeric', month: 'short' }),
                score: Math.round((q.correct_answers / q.total_questions) * 100)
              })) || []}
            />
          </motion.div>
        </div>

        {/* Badges Section */}
        {badges && badges.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
            className="mt-8"
          >
            <Card className="bg-card shadow-md">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-primary">
                  <Award className="w-5 h-5" />
                  الشارات المكتسبة ({badges.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {badges.map((badge, index) => (
                    <div
                      key={badge.id || index}
                      className="flex flex-col items-center p-4 bg-accent/30 rounded-lg hover:bg-accent/50 transition-colors"
                    >
                      <span className="text-4xl mb-2">{badge.badge_icon}</span>
                      <p className="font-medium text-sm text-center">{badge.badge_name}</p>
                      <p className="text-xs text-foreground/70 text-center mt-1">
                        {badge.badge_description}
                      </p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </div>
    </div>
  );
}
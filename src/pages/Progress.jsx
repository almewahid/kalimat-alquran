import React, { useState, useEffect } from "react";
import { supabaseClient } from "@/components/api/supabaseClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress as ProgressBar } from "@/components/ui/progress";
import { motion } from "framer-motion";
import { format, isValid, parseISO } from "date-fns";
import { ar } from "date-fns/locale";

import WeeklyChart from "../components/progress/WeeklyChart";
import { FlashCard } from "@/api/entities";

const STATS = [
  { key: "words_learned",  emoji: "📚", label: "كلمة تعلّمتها",   color: "bg-blue-50 border-blue-200",   text: "text-blue-600"   },
  { key: "quiz_streak",    emoji: "🔥", label: "اختبار متتالي",   color: "bg-orange-50 border-orange-200", text: "text-orange-500" },
  { key: "avg_score",      emoji: "🎯", label: "متوسط نتائجك",    color: "bg-purple-50 border-purple-200", text: "text-purple-600" },
  { key: "weekly_xp",      emoji: "⭐", label: "نقطة هذا الأسبوع", color: "bg-amber-50 border-amber-200",  text: "text-amber-600"  },
];

function scoreEmoji(score) {
  if (score >= 90) return "🌟";
  if (score >= 70) return "😊";
  if (score >= 50) return "🙂";
  return "💪";
}

export default function Progress() {
  const [userProgress, setUserProgress] = useState(null);
  const [quizSessions, setQuizSessions] = useState([]);
  const [totalWords, setTotalWords] = useState(0);
  const [weeklyData, setWeeklyData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadProgressData();
  }, []);

  const loadProgressData = async () => {
    try {
      const user = await supabaseClient.auth.me();
      if (!user?.email) { setIsLoading(false); return; }

      const progressList = await supabaseClient.entities.UserProgress.filter({ user_email: user.email });
      const progress = progressList[0] || {
        total_xp: 0, current_level: 1, words_learned: 0, quiz_streak: 0, learned_words: []
      };
      setUserProgress(progress);

      const sessions = await supabaseClient.entities.QuizSession.filter({ user_email: user.email }, '-created_date');
      const validSessions = sessions.filter(s => s && typeof s === 'object');
      setQuizSessions(validSessions);

      const words = await supabaseClient.entities.QuranicWord.list();
      setTotalWords(Array.isArray(words) ? words.length : 0);

      const last7Days = [];
      for (let i = 6; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];
        const dayXP = validSessions
          .filter(s => s.created_date?.startsWith(dateStr))
          .reduce((sum, s) => sum + (s.xp_earned || 0), 0);
        last7Days.push({ date: format(date, 'EEE', { locale: ar }), xp: dayXP });
      }
      setWeeklyData(last7Days);
    } catch (error) {
      console.error("Error loading progress data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const getLevelProgress = () => {
    if (!userProgress) return 0;
    const lvl = userProgress.current_level || 1;
    const xp  = userProgress.total_xp || 0;
    return Math.max(0, Math.min(100, ((xp - (lvl - 1) * 100) / 100) * 100));
  };

  const getAverageScore = () => {
    const scores = quizSessions.filter(s => typeof s.score === 'number').map(s => s.score);
    if (!scores.length) return 0;
    return Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
  };

  const getCompletionPercentage = () => {
    if (!userProgress || !totalWords) return 0;
    return Math.round(((userProgress.words_learned || 0) / totalWords) * 100);
  };

  const weeklyXP = weeklyData.reduce((sum, d) => sum + (d.xp || 0), 0);

  const statsValues = {
    words_learned: userProgress?.words_learned || 0,
    quiz_streak:   userProgress?.quiz_streak   || 0,
    avg_score:     `${getAverageScore()}%`,
    weekly_xp:     weeklyXP,
  };

  if (isLoading) {
    return (
      <div className="p-6 flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <motion.div
          animate={{ scale: [1, 1.15, 1] }}
          transition={{ repeat: Infinity, duration: 1.4 }}
          className="text-6xl"
        >
          📊
        </motion.div>
        <p className="text-lg font-semibold text-muted-foreground">جاري تحميل تقدّمك...</p>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-6">

      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground mb-1">🌟 رحلتك في التعلّم!</h1>
        <p className="text-sm text-muted-foreground">
          {(userProgress?.words_learned || 0) > 0
            ? `أحسنت! تعلّمت ${userProgress.words_learned} كلمة حتى الآن 🎉`
            : "ابدأ رحلتك وتعلّم كلمات جديدة كل يوم!"}
        </p>
      </div>

      {/* Level Card */}
      <Card className="rounded-2xl border-2 border-amber-200 bg-gradient-to-l from-amber-50 to-yellow-50 shadow-sm">
        <CardContent className="p-5">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-14 h-14 bg-amber-100 rounded-2xl flex items-center justify-center text-3xl flex-shrink-0">
              🏆
            </div>
            <div className="flex-1">
              <p className="text-lg font-bold text-amber-700">
                المستوى {userProgress?.current_level || 1}
              </p>
              <p className="text-sm text-amber-600">
                {userProgress?.total_xp || 0} نقطة إجمالاً
              </p>
            </div>
            {(userProgress?.quiz_streak || 0) >= 7 && (
              <Badge className="bg-orange-100 text-orange-700 border-orange-200 text-sm px-3">
                🔥 في قمة الحماس!
              </Badge>
            )}
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-sm font-medium text-amber-700">
              <span>نحو المستوى {(userProgress?.current_level || 1) + 1}</span>
              <span>{Math.round(getLevelProgress())}%</span>
            </div>
            <ProgressBar value={getLevelProgress()} className="h-5 rounded-full" />
            <p className="text-xs text-amber-600">
              تحتاج {100 - ((userProgress?.total_xp || 0) % 100)} نقطة للمستوى القادم
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-3">
        {STATS.map((stat) => (
          <Card key={stat.key} className={`rounded-2xl border-2 ${stat.color}`}>
            <CardContent className="p-4 text-center">
              <div className="text-3xl mb-2">{stat.emoji}</div>
              <div className={`text-2xl font-bold ${stat.text}`}>
                {statsValues[stat.key]}
              </div>
              <p className="text-xs text-muted-foreground mt-1 leading-tight">{stat.label}</p>
              {stat.key === "words_learned" && totalWords > 0 && (
                <div className="mt-2">
                  <ProgressBar value={getCompletionPercentage()} className="h-2 rounded-full" />
                  <p className="text-xs text-blue-500 mt-1">{getCompletionPercentage()}% من الكلمات</p>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Weekly Activity Chart */}
      <div>
        <h2 className="text-lg font-bold text-foreground mb-3 flex items-center gap-2">
          📅 نشاطك هذا الأسبوع
        </h2>
        <WeeklyChart data={weeklyData} />
      </div>

      {/* Recent Quizzes */}
      <div>
        <h2 className="text-lg font-bold text-foreground mb-3 flex items-center gap-2">
          📝 آخر الاختبارات
        </h2>

        {quizSessions.length === 0 ? (
          <Card className="rounded-2xl border-2 border-dashed">
            <CardContent className="p-8 text-center">
              <p className="text-4xl mb-3">🎓</p>
              <p className="text-base font-semibold text-foreground/70">لم تقم بأي اختبار بعد</p>
              <p className="text-sm text-muted-foreground">ابدأ اختباراً الآن وشوف نتيجتك!</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {quizSessions.slice(0, 3).map((session, index) => (
              <motion.div
                key={session.id || `session-${index}`}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.08 }}
              >
                <Card className="rounded-2xl border-2">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <span className="text-3xl flex-shrink-0">{scoreEmoji(session.score || 0)}</span>
                      <div className="flex-1">
                        <p className="font-bold text-foreground">
                          {session.correct_answers || 0} من {session.total_questions || 0} إجابة صحيحة
                        </p>
                        <p className="text-xs text-muted-foreground">
                          +{session.xp_earned || 0} نقطة
                        </p>
                      </div>
                      <Badge
                        className={
                          (session.score || 0) >= 80 ? "bg-green-100 text-green-700 text-sm px-3" :
                          (session.score || 0) >= 60 ? "bg-yellow-100 text-yellow-700 text-sm px-3" :
                          "bg-red-100 text-red-700 text-sm px-3"
                        }
                      >
                        {session.score || 0}%
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
}

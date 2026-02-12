import React, { useState, useEffect } from "react";
import { supabaseClient } from "@/components/api/supabaseClient";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { Loader2, AlertCircle, BookOpen } from "lucide-react";
import { useQuery } from "@tanstack/react-query"; // ✅ استخدام React Query

import LevelCard from "../components/dashboard/LevelCard";
import StatsGrid from "../components/dashboard/StatsGrid";
import RecentWords from "../components/dashboard/RecentWords";
import QuickActions from "../components/dashboard/QuickActions";
import TutorialModal from "../components/onboarding/TutorialModal";
import GlobalSearch from "../components/search/GlobalSearch";

const createPageUrl = (pageName) => `/${pageName}`;

export default function Dashboard() {
  const [showTutorial, setShowTutorial] = useState(false);

  // ✅ استخدام useQuery لجلب بيانات المستخدم والتقدم بشكل محسن
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["dashboardData"],
    queryFn: async () => {
      const { data: { user: currentUser } } = await supabaseClient.supabase.auth.getUser();

      const [progressData] = await supabaseClient.entities.UserProgress.filter({ 
        user_email: currentUser.email 
      });

      let finalProgress = progressData;

      if (!progressData) {
        finalProgress = await supabaseClient.entities.UserProgress.create({
          user_email: currentUser.email,
          total_xp: 0,
          current_level: 1,
          words_learned: 0,
          quiz_streak: 0,
          learned_words: [],
          consecutive_login_days: 1,
          last_login_date: new Date().toISOString().split('T')[0]
        });
      } else {
        // تحديث تسجيل الدخول اليومي
        const today = new Date().toISOString().split('T')[0];
        const lastLogin = progressData.last_login_date;

        if (lastLogin !== today) {
          const yesterday = new Date();
          yesterday.setDate(yesterday.getDate() - 1);
          const yesterdayStr = yesterday.toISOString().split('T')[0];

          const newConsecutiveDays = lastLogin === yesterdayStr 
            ? (progressData.consecutive_login_days || 0) + 1 
            : 1;

          await supabaseClient.entities.UserProgress.update(progressData.id, {
            last_login_date: today,
            consecutive_login_days: newConsecutiveDays
          });
          finalProgress = { ...progressData, consecutive_login_days: newConsecutiveDays, last_login_date: today };
        }
      }

      // جلب الكلمات والاختبارات بالتوازي
      const [allWords, quizSessions] = await Promise.all([
        supabaseClient.entities.QuranicWord.list(), // يمكن تحسين هذا بفلترة الكلمات المطلوبة فقط مستقبلاً
        supabaseClient.entities.QuizSession.filter({ user_email: currentUser.email })
      ]);

      const learnedWordIds = finalProgress?.learned_words || [];
      console.log('📚 Learned word IDs:', learnedWordIds);
      
      // ✅ التعديل الجديد: تحويل الطرفين إلى نصوص لضمان المطابقة
      const learned = allWords.filter(word => {
        // نأخذ الـ ID ونحوله لنص
        const wordId = String(word.id || word._id); 
        
        // نبحث عنه داخل المصفوفة (مع تحويل عناصر المصفوفة لنصوص أيضاً للأمان)
        return learnedWordIds.some(learnedId => String(learnedId) === wordId);
      }).slice(0, 6);
      
      console.log('📖 Learned words found:', learned.length);

      const sortedQuizzes = quizSessions.sort((a, b) => 
        new Date(b.created_date) - new Date(a.created_date)
      ).slice(0, 3);

      const today = new Date().toISOString().split('T')[0];
      const todayQuizzes = quizSessions.filter(q => q.created_date.startsWith(today));
      const todayXP = todayQuizzes.reduce((sum, q) => sum + (q.xp_earned || 0), 0);

      // ✅ جلب الاسم من user_profiles
      const { data: profile } = await supabaseClient.supabase
        .from('user_profiles')
        .select('full_name')
        .eq('user_id', currentUser.id)
        .single();

      const userName = profile?.full_name || currentUser.email?.split('@')[0] || 'صديقي';

      return {
        user: currentUser,
        userName: userName,
        userProgress: finalProgress,
        learnedWords: learned,
        recentQuizzes: sortedQuizzes,
        dailyXPEarned: todayXP
      };
    }
  });

  useEffect(() => {
    const checkTutorial = async () => {
      if (data?.user && data?.userProgress) {
        // التحقق من user_profiles.preferences
        const { data: profile } = await supabaseClient.supabase
          .from('user_profiles')
          .select('preferences')
          .eq('user_id', data.user.id)
          .single();
        
        const hasSeenTutorial = profile?.preferences?.tutorial_completed;
        
        if (!hasSeenTutorial && data.userProgress.words_learned === 0) {
          setShowTutorial(true);
        }
      }
    };
    checkTutorial();
  }, [data]);

  const { user, userName, userProgress, learnedWords, recentQuizzes, dailyXPEarned } = data || {};

  // حساب التقدم نحو المستوى التالي
  const currentLevelXP = userProgress?.total_xp || 0;
  const currentLevel = userProgress?.current_level || 1;
  const xpForCurrentLevel = (currentLevel - 1) * 100;
  const xpForNextLevel = currentLevel * 100;
  const xpInCurrentLevel = currentLevelXP - xpForCurrentLevel;
  const xpNeededForNextLevel = xpForNextLevel - xpForCurrentLevel;
  const levelProgress = (xpInCurrentLevel / xpNeededForNextLevel) * 100;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto mb-4" />
          <p className="text-foreground/70 text-lg">جارٍ تحميل لوحة التحكم...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 max-w-2xl mx-auto">
        <Card className="bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800">
          <CardContent className="p-8 text-center">
            <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-red-700 dark:text-red-400 mb-2">
              خطأ في تحميل البيانات
            </h2>
            <p className="text-red-600 dark:text-red-300 mb-6">
              {error.message || "حدث خطأ غير متوقع"}
            </p>
            <div className="space-y-3">
              <Button onClick={refetch} className="w-full">
                إعادة المحاولة
              </Button>
              <div className="text-sm text-red-600 dark:text-red-400 space-y-1">
                <p>💡 خطوات استكشاف الأخطاء:</p>
                <ul className="text-right space-y-1">
                  <li>• تحقق من اتصالك بالإنترنت</li>
                  <li>• تأكد من تسجيل دخولك</li>
                  <li>• حاول تحديث الصفحة (F5)</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!userProgress) {
    return (
      <div className="p-6 max-w-2xl mx-auto">
        <Card className="bg-card border-border">
          <CardContent className="p-8 text-center">
            <BookOpen className="w-16 h-16 text-primary mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-primary mb-2">
              مرحباً بك في كلمات القرآن! 🌟
            </h2>
            <p className="text-foreground/70 mb-6">
              ابدأ رحلتك في تعلم معاني القرآن الكريم
            </p>
            <Button 
              onClick={refetch}
              size="lg"
              className="bg-primary text-primary-foreground"
            >
              ابدأ الآن
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 w-full">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        {/* رسالة ترحيبية */}
        <div className="mb-6">
          <h1 className="text-3xl md:text-4xl font-bold gradient-text mb-2">
            مرحباً، {userName?.split(' ')[0] || 'صديقي'} 👋
          </h1>
          <p className="text-foreground/70 text-lg">
            استمر في رحلتك لتعلم كلمات القرآن الكريم
          </p>
        </div>

        {/* شريط البحث الشامل */}
        <div className="mb-8">
          <GlobalSearch />
        </div>

        {/* بطاقة المستوى */}
        <LevelCard
          level={currentLevel}
          xp={currentLevelXP}
          xpForNext={xpForNextLevel}
          progress={levelProgress}
          dailyXP={dailyXPEarned}
        />

        {/* الإحصائيات */}
        <StatsGrid
          wordsLearned={userProgress.words_learned || 0}
          quizStreak={userProgress.quiz_streak || 0}
          loginStreak={userProgress.consecutive_login_days || 1}
          recentQuizzes={recentQuizzes}
        />

        {/* الكلمات الأخيرة */}
        <RecentWords words={learnedWords} />

        {/* الإجراءات السريعة */}
        <QuickActions />

        {/* الدليل التعليمي */}
        <TutorialModal
          isOpen={showTutorial}
          onClose={async (settings) => {
            setShowTutorial(false);
            // الإعدادات تم حفظها بالفعل في TutorialModal
            // فقط نحدّث البيانات
            if (settings) {
              refetch();
            }
          }}
        />
      </motion.div>
    </div>
  );
}
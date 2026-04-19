import React, { useState, useEffect } from "react";
import { supabaseClient } from "@/components/api/supabaseClient";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { Loader2, AlertCircle, BookOpen, Brain, Trophy } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";

import LevelCard from "../components/dashboard/LevelCard";
import StatsGrid from "../components/dashboard/StatsGrid";
import RecentWords from "../components/dashboard/RecentWords";
import QuickActions from "../components/dashboard/QuickActions";
import TutorialModal from "../components/onboarding/TutorialModal";

const createPageUrl = (pageName) => `/${pageName}`;

export default function Dashboard() {
  const [showTutorial, setShowTutorial] = useState(false);

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["dashboardData"],
    queryFn: async () => {
      const currentUser = await supabaseClient.auth.me();

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

      const [allWords, quizSessions] = await Promise.all([
        supabaseClient.entities.QuranicWord.list(),
        supabaseClient.entities.QuizSession.filter({ user_email: currentUser.email })
      ]);

      const learnedWordIds = (finalProgress?.learned_words || [])
        .filter(id => id && id.length === 36);

      const learned = learnedWordIds
        .slice(-6)
        .map(id => allWords.find(word => String(word.id) === String(id)))
        .filter(Boolean)
        .reverse();

      const sortedQuizzes = quizSessions.sort((a, b) =>
        new Date(b.created_date) - new Date(a.created_date)
      ).slice(0, 3);

      const today = new Date().toISOString().split('T')[0];
      const todayQuizzes = quizSessions.filter(q => q.created_date.startsWith(today));
      const todayXP = todayQuizzes.reduce((sum, q) => sum + (q.xp_earned || 0), 0);

      const { data: profile } = await supabaseClient.supabase
        .from('user_profiles')
        .select('full_name')
        .eq('user_id', currentUser.id)
        .single();

      const userName = profile?.full_name || currentUser.email?.split('@')[0] || 'صديقي';

      return {
        user: currentUser,
        userName,
        userProgress: finalProgress,
        learnedWords: learned,
        allWords,
        recentQuizzes: sortedQuizzes,
        dailyXPEarned: todayXP
      };
    }
  });

  useEffect(() => {
    const checkTutorial = async () => {
      if (data?.user && data?.userProgress) {
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

  const { userName, userProgress, dailyXPEarned } = data || {};

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
          <p className="text-foreground/70 text-lg">لحظة... نُحضّر مغامرتك! 🌟</p>
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
              حدث خطأ ما
            </h2>
            <p className="text-red-600 dark:text-red-300 mb-6">
              {error.message || "حدث خطأ غير متوقع"}
            </p>
            <Button onClick={refetch} className="w-full">
              حاول مرة أخرى
            </Button>
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
              مرحباً في كلمات القرآن! 🌟
            </h2>
            <p className="text-foreground/70 mb-6">
              ابدأ رحلتك في تعلم معاني القرآن الكريم
            </p>
            <Button onClick={refetch} size="lg" className="bg-primary text-primary-foreground">
              ابدأ الآن
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const firstName = userName?.split(' ')[0] || 'صديقي';

  return (
    <div className="p-4 md:p-6 w-full max-w-2xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <div className="mb-5">
          <h1 className="text-3xl md:text-4xl font-black text-foreground mb-1">
            السلام عليكم يا {firstName}! 👋
          </h1>
          <p className="text-foreground/60 text-base">
            استمر في رحلتك اليوم
          </p>
        </div>

        <StatsGrid
          wordsLearned={userProgress.words_learned || 0}
          consecutiveLoginDays={userProgress.consecutive_login_days || 1}
        />

        <QuickActions wordsLearned={userProgress.words_learned || 0} />

        <LevelCard
          level={currentLevel}
          xp={currentLevelXP}
          xpForNext={xpForNextLevel}
          progress={levelProgress}
          dailyXP={dailyXPEarned}
        />

        <RecentWords
          learnedWordsIds={userProgress.learned_words}
          allWords={data?.allWords || []}
        />

        <div className="grid grid-cols-2 gap-3 mb-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Link to="/Quiz">
              <div className="h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center gap-2 cursor-pointer shadow-md shadow-blue-200 dark:shadow-none">
                <Brain className="w-5 h-5 text-white" />
                <span className="text-white text-base font-bold">اختبار بسيط</span>
              </div>
            </Link>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
          >
            <Link to="/Achievements">
              <div className="h-14 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center gap-2 cursor-pointer shadow-md shadow-purple-200 dark:shadow-none">
                <Trophy className="w-5 h-5 text-white" />
                <span className="text-white text-base font-bold">إنجازاتي</span>
              </div>
            </Link>
          </motion.div>
        </div>

        {/* الدليل التعليمي */}
        <TutorialModal
          isOpen={showTutorial}
          onClose={async (settings) => {
            setShowTutorial(false);
            if (settings && data?.user) {
              try {
                // جلب الـ preferences الحالية
                const { data: profile } = await supabaseClient.supabase
                  .from('user_profiles')
                  .select('preferences')
                  .eq('user_id', data.user.id)
                  .single();

                // حفظ كل الإعدادات مع kids_mode_enabled و tutorial_completed
                const newPreferences = {
                  ...profile?.preferences,
                  tutorial_completed: true,
                  learning_level: settings.learning_level,
                  kids_mode_enabled: settings.kids_mode_enabled,
                  daily_new_words_goal: settings.daily_new_words_goal,
                  daily_review_words_goal: settings.daily_review_words_goal,
                  sound_effects_enabled: settings.sound_effects_enabled,
                  animations_enabled: settings.animations_enabled,
                  confetti_enabled: settings.confetti_enabled,
                };

                await supabaseClient.supabase
                  .from('user_profiles')
                  .update({ preferences: newPreferences })
                  .eq('user_id', data.user.id);

                refetch();
              } catch (err) {
                console.error("Error saving tutorial settings:", err);
              }
            }
          }}
        />
      </motion.div>
    </div>
  );
}
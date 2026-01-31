import React, { useState, useEffect } from "react";
import { supabaseClient } from "@/components/api/supabaseClient";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  BookOpen, 
  Brain, 
  Trophy, 
  TrendingUp, 
  Star, 
  Search,
  Sparkles,
  Flame,
  Target,
  Award,
  Zap,
  CheckCircle2
} from "lucide-react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import LevelCard from "../components/dashboard/LevelCard";
import StatsGrid from "../components/dashboard/StatsGrid";
import RecentWords from "../components/dashboard/RecentWords";
import QuickActions from "../components/dashboard/QuickActions";
import TutorialModal from "../components/onboarding/TutorialModal";

export default function DashboardSupabase() {
  const [user, setUser] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [showTutorial, setShowTutorial] = useState(false);

  // ✅ Fetch user data using Supabase
  const { data: userData, isLoading: userLoading } = useQuery({
    queryKey: ['user'],
    queryFn: async () => {
      const currentUser = await supabaseClient.auth.me();
      setUser(currentUser);
      return currentUser;
    },
  });

  // ✅ Fetch user progress
  const { data: progress } = useQuery({
    queryKey: ['userProgress', user?.email],
    queryFn: async () => {
      if (!user?.email) return null;
      const data = await supabaseClient.entities.UserProgress.filter({
        user_email: user.email
      });
      return data[0] || { total_xp: 0, current_level: 1, words_learned: 0, quiz_streak: 0 };
    },
    enabled: !!user?.email,
  });

  // ✅ Fetch learned words with details
  const { data: learnedWords } = useQuery({
    queryKey: ['learnedWords', user?.email],
    queryFn: async () => {
      if (!user?.email || !progress?.learned_words?.length) return [];
      
      const words = await supabaseClient.entities.QuranicWord.list('', 1000);
      return words.filter(w => progress.learned_words.includes(w.id)).slice(0, 10);
    },
    enabled: !!user?.email && !!progress?.learned_words?.length,
  });

  // ✅ Fetch recent quiz sessions
  const { data: recentQuizzes } = useQuery({
    queryKey: ['recentQuizzes', user?.email],
    queryFn: async () => {
      if (!user?.email) return [];
      return await supabaseClient.entities.QuizSession.filter(
        { user_email: user.email },
        '-created_date',
        5
      );
    },
    enabled: !!user?.email,
  });

  // ✅ Fetch today's XP (من activity_logs أو quiz_sessions)
  const { data: todayXP } = useQuery({
    queryKey: ['todayXP', user?.email],
    queryFn: async () => {
      if (!user?.email) return 0;
      const today = new Date().toISOString().split('T')[0];
      
      const sessions = await supabaseClient.entities.QuizSession.filter({
        user_email: user.email
      });
      
      const todaySessions = sessions.filter(s => 
        s.created_date?.startsWith(today)
      );
      
      return todaySessions.reduce((sum, s) => sum + (s.xp_earned || 0), 0);
    },
    enabled: !!user?.email,
  });

  // Update last login on mount
  useEffect(() => {
    const updateLastLogin = async () => {
      if (!user?.email || !progress?.id) return;
      
      // Skip if using Base44 fallback (no real Supabase data)
      if (user._usingBase44Fallback) {
        console.log('⚠️ Skipping last login update - using Base44 fallback');
        return;
      }

      try {
        const today = new Date().toISOString().split('T')[0];

        const lastLogin = progress.last_login_date;
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = yesterday.toISOString().split('T')[0];

        let newConsecutiveDays = progress.consecutive_login_days || 1;
        
        if (lastLogin === yesterdayStr) {
          newConsecutiveDays += 1;
        } else if (lastLogin !== today) {
          newConsecutiveDays = 1;
        }

        if (lastLogin !== today) {
          await supabaseClient.entities.UserProgress.update(progress.id, {
            last_login_date: today,
            consecutive_login_days: newConsecutiveDays
          });
        }
      } catch (error) {
        console.error('Error updating last login:', error);
      }
    };

    updateLastLogin();
  }, [user, progress]);

  // Check if tutorial should be shown
  useEffect(() => {
    if (user && progress) {
      const hasSeenTutorial = user.preferences?.has_seen_tutorial;
      const isNewUser = (progress.words_learned || 0) === 0;
      
      if (!hasSeenTutorial && isNewUser) {
        setShowTutorial(true);
      }
    }
  }, [user, progress]);

  const handleCloseTutorial = async () => {
    setShowTutorial(false);
    if (user) {
      await supabaseClient.auth.updateMe({
        preferences: {
          ...user.preferences,
          has_seen_tutorial: true
        }
      });
    }
  };

  if (userLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  const stats = {
    wordsLearned: progress?.words_learned || 0,
    quizStreak: progress?.quiz_streak || 0,
    totalXP: progress?.total_xp || 0,
    todayXP: todayXP || 0,
    currentLevel: progress?.current_level || 1,
    consecutiveLoginDays: progress?.consecutive_login_days || 1,
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-accent/5 p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header with Badge */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center justify-between mb-4 flex-wrap gap-4">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold gradient-text mb-2">
                مرحباً، {user?.full_name || 'عزيزي الطالب'} 👋
              </h1>
              <p className="text-foreground/70">
                استمر في رحلتك لتعلم كلمات القرآن الكريم
              </p>
              {/* Supabase Badge */}
              <Badge className="mt-2 bg-green-100 text-green-700 border-green-300">
                🟢 Powered by Supabase (تجريبي)
              </Badge>
            </div>
            
            <div className="relative w-full md:w-96">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-foreground/50" />
              <Input
                placeholder="ابحث عن كلمة أو آية..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && searchQuery.trim()) {
                    window.location.href = createPageUrl(`Search?q=${encodeURIComponent(searchQuery)}`);
                  }
                }}
                className="pr-10 bg-card border-border"
              />
            </div>
          </div>
        </motion.div>

        {/* Level Card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
          className="mb-6"
        >
          <LevelCard 
            level={stats.currentLevel}
            totalXP={stats.totalXP}
          />
        </motion.div>

        {/* Stats Grid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-8"
        >
          <StatsGrid stats={stats} />
        </motion.div>

        {/* Main Content Grid */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          {/* Recent Words */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
          >
            <RecentWords words={learnedWords || []} />
          </motion.div>

          {/* Recent Quizzes */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
          >
            <Card className="bg-card shadow-md h-full">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-primary">
                  <Trophy className="w-5 h-5" />
                  آخر الاختبارات
                </CardTitle>
              </CardHeader>
              <CardContent>
                {recentQuizzes && recentQuizzes.length > 0 ? (
                  <div className="space-y-3">
                    {recentQuizzes.map((quiz, index) => (
                      <div
                        key={quiz.id || index}
                        className="flex items-center justify-between p-3 bg-accent/30 rounded-lg hover:bg-accent/50 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                            (quiz.correct_answers / quiz.total_questions) >= 0.8 
                              ? 'bg-green-100 text-green-600' 
                              : 'bg-orange-100 text-orange-600'
                          }`}>
                            <Trophy className="w-5 h-5" />
                          </div>
                          <div>
                            <p className="font-medium">
                              {quiz.correct_answers} / {quiz.total_questions}
                            </p>
                            <p className="text-sm text-foreground/70">
                              {new Date(quiz.created_date).toLocaleDateString('ar-EG')}
                            </p>
                          </div>
                        </div>
                        <Badge variant="outline" className="bg-primary/10">
                          +{quiz.xp_earned} XP
                        </Badge>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-foreground/70">
                    <Trophy className="w-12 h-12 mx-auto mb-3 text-foreground/30" />
                    <p>لم تقم بأي اختبار بعد</p>
                    <Link to={createPageUrl('QuizTypes')}>
                      <Button className="mt-4" size="sm">
                        ابدأ اختبارك الأول
                      </Button>
                    </Link>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <QuickActions />
        </motion.div>

        {/* Tutorial Modal */}
        {showTutorial && (
          <TutorialModal onClose={handleCloseTutorial} />
        )}
      </div>
    </div>
  );
}
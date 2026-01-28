import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Trophy, Star, Zap, Crown, Lock, Sparkles, TrendingUp } from "lucide-react";
import { motion } from "framer-motion";
import { format } from "date-fns";
import { ar } from "date-fns/locale";

const ACHIEVEMENT_DEFINITIONS = [
  // Daily Streak Achievements
  { type: "daily_streak", name: "المواظب", icon: "🔥", description: "سجل دخول لمدة 7 أيام متتالية", value: 7, rarity: "common", xp: 50, gems: 10 },
  { type: "daily_streak", name: "الملتزم", icon: "⚡", description: "سجل دخول لمدة 14 يوم متتالي", value: 14, rarity: "rare", xp: 100, gems: 25 },
  { type: "daily_streak", name: "الماراثون", icon: "💪", description: "سجل دخول لمدة 30 يوم متتالي", value: 30, rarity: "epic", xp: 200, gems: 50 },
  { type: "daily_streak", name: "الأسطورة", icon: "👑", description: "سجل دخول لمدة 100 يوم متتالي", value: 100, rarity: "legendary", xp: 500, gems: 150 },
  
  // Words Milestones
  { type: "words_milestone", name: "المبتدئ", icon: "📖", description: "تعلم 50 كلمة", value: 50, rarity: "common", xp: 30, gems: 5 },
  { type: "words_milestone", name: "المثابر", icon: "📚", description: "تعلم 100 كلمة", value: 100, rarity: "common", xp: 50, gems: 15 },
  { type: "words_milestone", name: "الحافظ", icon: "🎓", description: "تعلم 500 كلمة", value: 500, rarity: "rare", xp: 150, gems: 40 },
  { type: "words_milestone", name: "العالم", icon: "🌟", description: "تعلم 1000 كلمة", value: 1000, rarity: "epic", xp: 300, gems: 100 },
  { type: "words_milestone", name: "المعلم", icon: "⭐", description: "تعلم 2000 كلمة", value: 2000, rarity: "legendary", xp: 600, gems: 200 },
  
  // Quiz Master
  { type: "quiz_master", name: "المجتهد", icon: "🧠", description: "اجتز 10 اختبارات", value: 10, rarity: "common", xp: 40, gems: 10 },
  { type: "quiz_master", name: "الخبير", icon: "🎯", description: "اجتز 50 اختبار", value: 50, rarity: "rare", xp: 120, gems: 30 },
  { type: "quiz_master", name: "الأستاذ", icon: "🏆", description: "اجتز 100 اختبار", value: 100, rarity: "epic", xp: 250, gems: 75 },
  
  // Perfect Scores
  { type: "perfect_score", name: "المتقن", icon: "💯", description: "احصل على 100% في اختبار", value: 1, rarity: "rare", xp: 80, gems: 20 },
  { type: "perfect_score", name: "الكمال", icon: "✨", description: "احصل على 100% في 5 اختبارات", value: 5, rarity: "epic", xp: 200, gems: 60 },
  
  // Speed Learner
  { type: "speed_learner", name: "السريع", icon: "⚡", description: "تعلم 10 كلمات في يوم واحد", value: 10, rarity: "rare", xp: 70, gems: 20 },
  { type: "speed_learner", name: "البرق", icon: "🚀", description: "تعلم 20 كلمة في يوم واحد", value: 20, rarity: "epic", xp: 150, gems: 50 },
];

const RARITY_COLORS = {
  common: { bg: "bg-gray-100", text: "text-gray-700", border: "border-gray-300", glow: "shadow-gray-200" },
  rare: { bg: "bg-blue-100", text: "text-blue-700", border: "border-blue-300", glow: "shadow-blue-200" },
  epic: { bg: "bg-purple-100", text: "text-purple-700", border: "border-purple-300", glow: "shadow-purple-200" },
  legendary: { bg: "bg-amber-100", text: "text-amber-700", border: "border-amber-300", glow: "shadow-amber-200" }
};

export default function Achievements() {
  const [user, setUser] = useState(null);
  const [userAchievements, setUserAchievements] = useState([]);
  const [userProgress, setUserProgress] = useState(null);
  const [userGems, setUserGems] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadAchievementsData();
  }, []);

  const loadAchievementsData = async () => {
    try {
      const currentUser = await base44.auth.me();
      setUser(currentUser);

      const [achievements, progressList, gemsList] = await Promise.all([
        base44.entities.Achievement.filter({ user_email: currentUser.email }),
        base44.entities.UserProgress.filter({ created_by: currentUser.email }),
        base44.entities.UserGems.filter({ user_email: currentUser.email })
      ]);

      setUserAchievements(achievements);
      setUserProgress(progressList[0] || {});
      setUserGems(gemsList[0] || { current_gems: 0 });

      // Check and award new achievements
      await checkNewAchievements(currentUser.email, progressList[0] || {}, achievements);

    } catch (error) {
      console.error("Error loading achievements:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const checkNewAchievements = async (userEmail, progress, existingAchievements) => {
    const earnedTypes = new Set(existingAchievements.map(a => `${a.achievement_type}_${a.achievement_value}`));
    
    for (const achievement of ACHIEVEMENT_DEFINITIONS) {
      const key = `${achievement.type}_${achievement.value}`;
      if (earnedTypes.has(key)) continue;

      let shouldAward = false;

      switch (achievement.type) {
        case "daily_streak":
          shouldAward = (progress.consecutive_login_days || 0) >= achievement.value;
          break;
        case "words_milestone":
          shouldAward = (progress.words_learned || 0) >= achievement.value;
          break;
        case "quiz_master":
          const sessions = await base44.entities.QuizSession.filter({ created_by: userEmail });
          shouldAward = sessions.length >= achievement.value;
          break;
        case "perfect_score":
          const perfectSessions = await base44.entities.QuizSession.filter({ 
            created_by: userEmail,
            score: 100 
          });
          shouldAward = perfectSessions.length >= achievement.value;
          break;
        case "speed_learner":
          // Check today's learned words
          const today = new Date().toISOString().split('T')[0];
          const todayWords = progress.learned_words?.filter(w => 
            w.learned_date?.startsWith(today)
          ) || [];
          shouldAward = todayWords.length >= achievement.value;
          break;
      }

      if (shouldAward) {
        await awardAchievement(userEmail, achievement);
      }
    }
  };

  const awardAchievement = async (userEmail, achievement) => {
    try {
      // Create achievement record
      await base44.entities.Achievement.create({
        user_email: userEmail,
        achievement_type: achievement.type,
        achievement_name: achievement.name,
        achievement_icon: achievement.icon,
        achievement_description: achievement.description,
        achievement_value: achievement.value,
        rarity: achievement.rarity,
        reward_xp: achievement.xp,
        reward_gems: achievement.gems,
        earned_date: new Date().toISOString()
      });

      // Award XP
      const progressList = await base44.entities.UserProgress.filter({ created_by: userEmail });
      if (progressList.length > 0) {
        const progress = progressList[0];
        const newTotalXP = (progress.total_xp || 0) + achievement.xp;
        await base44.entities.UserProgress.update(progress.id, {
          total_xp: newTotalXP,
          current_level: Math.floor(newTotalXP / 100) + 1
        });
      }

      // Award Gems
      const gemsList = await base44.entities.UserGems.filter({ user_email: userEmail });
      if (gemsList.length > 0) {
        const gems = gemsList[0];
        await base44.entities.UserGems.update(gems.id, {
          total_gems: (gems.total_gems || 0) + achievement.gems,
          current_gems: (gems.current_gems || 0) + achievement.gems
        });
      } else {
        await base44.entities.UserGems.create({
          user_email: userEmail,
          total_gems: achievement.gems,
          current_gems: achievement.gems
        });
      }

      // Reload data
      loadAchievementsData();

    } catch (error) {
      console.error("Error awarding achievement:", error);
    }
  };

  const getAchievementProgress = (achievement) => {
    if (!userProgress) return 0;

    switch (achievement.type) {
      case "daily_streak":
        return Math.min((userProgress.consecutive_login_days || 0) / achievement.value * 100, 100);
      case "words_milestone":
        return Math.min((userProgress.words_learned || 0) / achievement.value * 100, 100);
      default:
        return 0;
    }
  };

  const isAchievementEarned = (achievement) => {
    return userAchievements.some(a => 
      a.achievement_type === achievement.type && 
      a.achievement_value === achievement.value
    );
  };

  const groupedAchievements = ACHIEVEMENT_DEFINITIONS.reduce((acc, achievement) => {
    if (!acc[achievement.type]) {
      acc[achievement.type] = [];
    }
    acc[achievement.type].push(achievement);
    return acc;
  }, {});

  const categoryNames = {
    daily_streak: { name: "السلسلة اليومية", icon: "🔥" },
    words_milestone: { name: "إنجازات الكلمات", icon: "📚" },
    quiz_master: { name: "خبير الاختبارات", icon: "🧠" },
    perfect_score: { name: "النتائج المثالية", icon: "💯" },
    speed_learner: { name: "التعلم السريع", icon: "⚡" }
  };

  if (isLoading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold gradient-text mb-2">🏆 الإنجازات</h1>
          <p className="text-foreground/70">اجمع الشارات واكسب الجواهر!</p>
        </div>

        {/* Stats Overview */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <Card className="bg-gradient-to-br from-amber-50 to-orange-50 border-amber-200">
            <CardContent className="p-6 text-center">
              <Sparkles className="w-8 h-8 text-amber-600 mx-auto mb-2" />
              <div className="text-3xl font-bold text-amber-900">
                {userGems?.current_gems || 0}
              </div>
              <p className="text-sm text-amber-700 mt-1">جواهرك الحالية</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-50 to-pink-50 border-purple-200">
            <CardContent className="p-6 text-center">
              <Trophy className="w-8 h-8 text-purple-600 mx-auto mb-2" />
              <div className="text-3xl font-bold text-purple-900">
                {userAchievements.length}
              </div>
              <p className="text-sm text-purple-700 mt-1">إنجاز مفتوح</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-blue-50 to-cyan-50 border-blue-200">
            <CardContent className="p-6 text-center">
              <Star className="w-8 h-8 text-blue-600 mx-auto mb-2" />
              <div className="text-3xl font-bold text-blue-900">
                {userAchievements.filter(a => a.rarity === "legendary" || a.rarity === "epic").length}
              </div>
              <p className="text-sm text-blue-700 mt-1">إنجاز نادر</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
            <CardContent className="p-6 text-center">
              <TrendingUp className="w-8 h-8 text-green-600 mx-auto mb-2" />
              <div className="text-3xl font-bold text-green-900">
                {Math.round((userAchievements.length / ACHIEVEMENT_DEFINITIONS.length) * 100)}%
              </div>
              <p className="text-sm text-green-700 mt-1">نسبة الإكمال</p>
            </CardContent>
          </Card>
        </div>

        {/* Achievement Categories */}
        {Object.entries(groupedAchievements).map(([type, achievements], categoryIndex) => {
          const category = categoryNames[type];
          if (!category) return null;

          return (
            <motion.div
              key={type}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: categoryIndex * 0.1 }}
              className="mb-8"
            >
              <Card className="bg-card shadow-md">
                <CardHeader>
                  <CardTitle className="text-primary flex items-center gap-2">
                    <span className="text-2xl">{category.icon}</span>
                    {category.name}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {achievements.map((achievement, index) => {
                      const isEarned = isAchievementEarned(achievement);
                      const progress = getAchievementProgress(achievement);
                      const rarity = RARITY_COLORS[achievement.rarity];
                      const earnedData = userAchievements.find(a => 
                        a.achievement_type === achievement.type && 
                        a.achievement_value === achievement.value
                      );

                      return (
                        <motion.div
                          key={`${achievement.type}-${achievement.value}`}
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: index * 0.05 }}
                          whileHover={{ scale: isEarned ? 1.05 : 1.02 }}
                          className={`
                            relative p-6 rounded-xl border-2 transition-all duration-300
                            ${isEarned 
                              ? `${rarity.bg} ${rarity.border} shadow-lg ${rarity.glow}` 
                              : 'bg-gray-50 border-gray-200 opacity-60'
                            }
                          `}
                        >
                          {/* Lock icon for locked achievements */}
                          {!isEarned && (
                            <div className="absolute top-2 right-2">
                              <Lock className="w-5 h-5 text-gray-400" />
                            </div>
                          )}

                          {/* Achievement Icon */}
                          <div className="text-center mb-4">
                            <div className={`
                              text-5xl mb-2 transition-all duration-300
                              ${isEarned ? 'scale-100 filter-none' : 'scale-90 grayscale'}
                            `}>
                              {achievement.icon}
                            </div>
                            <h3 className={`
                              font-bold text-lg mb-1
                              ${isEarned ? rarity.text : 'text-gray-500'}
                            `}>
                              {achievement.name}
                            </h3>
                            <Badge className={`
                              text-xs
                              ${isEarned 
                                ? `${rarity.bg} ${rarity.text}` 
                                : 'bg-gray-200 text-gray-600'
                              }
                            `}>
                              {achievement.rarity === "legendary" && "🌟 أسطوري"}
                              {achievement.rarity === "epic" && "💎 ملحمي"}
                              {achievement.rarity === "rare" && "⭐ نادر"}
                              {achievement.rarity === "common" && "✨ عادي"}
                            </Badge>
                          </div>

                          {/* Description */}
                          <p className="text-sm text-center text-foreground/70 mb-4">
                            {achievement.description}
                          </p>

                          {/* Progress or Earned Date */}
                          {isEarned ? (
                            <div className="text-center">
                              <div className="flex items-center justify-center gap-4 mb-2">
                                <Badge variant="outline" className="bg-background-soft">
                                  <Zap className="w-3 h-3 ml-1 text-primary" />
                                  +{achievement.xp} XP
                                </Badge>
                                <Badge variant="outline" className="bg-background-soft">
                                  <Sparkles className="w-3 h-3 ml-1 text-amber-500" />
                                  +{achievement.gems} 💎
                                </Badge>
                              </div>
                              {earnedData?.earned_date && (
                                <p className="text-xs text-foreground/60">
                                  حصلت عليه في {format(new Date(earnedData.earned_date), "PPP", { locale: ar })}
                                </p>
                              )}
                            </div>
                          ) : (
                            <div>
                              <div className="flex justify-between text-xs text-foreground/70 mb-2">
                                <span>التقدم</span>
                                <span>{Math.round(progress)}%</span>
                              </div>
                              <Progress value={progress} className="h-2" />
                            </div>
                          )}
                        </motion.div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </motion.div>
    </div>
  );
}
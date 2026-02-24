import React, { useState, useEffect } from "react";
import { supabaseClient } from "@/components/api/supabaseClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Trophy, Star, Zap, Crown, Lock, Sparkles, TrendingUp, Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import { format } from "date-fns";
import { ar } from "date-fns/locale";

const ACHIEVEMENT_DEFINITIONS = [
  { type: "daily_streak",  name: "المواظب",  icon: "🔥", description: "سجل دخول لمدة 7 أيام متتالية",   value: 7,    rarity: "common",    xp: 50,  gems: 10  },
  { type: "daily_streak",  name: "الملتزم",  icon: "⚡", description: "سجل دخول لمدة 14 يوم متتالي",   value: 14,   rarity: "rare",      xp: 100, gems: 25  },
  { type: "daily_streak",  name: "الماراثون",icon: "💪", description: "سجل دخول لمدة 30 يوم متتالي",   value: 30,   rarity: "epic",      xp: 200, gems: 50  },
  { type: "daily_streak",  name: "الأسطورة", icon: "👑", description: "سجل دخول لمدة 100 يوم متتالي",  value: 100,  rarity: "legendary", xp: 500, gems: 150 },
  { type: "words_milestone",name: "المبتدئ", icon: "📖", description: "تعلم 50 كلمة",                    value: 50,   rarity: "common",    xp: 30,  gems: 5   },
  { type: "words_milestone",name: "المثابر", icon: "📚", description: "تعلم 100 كلمة",                   value: 100,  rarity: "common",    xp: 50,  gems: 15  },
  { type: "words_milestone",name: "الحافظ",  icon: "🎓", description: "تعلم 500 كلمة",                   value: 500,  rarity: "rare",      xp: 150, gems: 40  },
  { type: "words_milestone",name: "العالم",  icon: "🌟", description: "تعلم 1000 كلمة",                  value: 1000, rarity: "epic",      xp: 300, gems: 100 },
  { type: "words_milestone",name: "المعلم",  icon: "⭐", description: "تعلم 2000 كلمة",                  value: 2000, rarity: "legendary", xp: 600, gems: 200 },
  { type: "quiz_master",   name: "المجتهد",  icon: "🧠", description: "اجتز 10 اختبارات",                value: 10,   rarity: "common",    xp: 40,  gems: 10  },
  { type: "quiz_master",   name: "الخبير",   icon: "🎯", description: "اجتز 50 اختبار",                  value: 50,   rarity: "rare",      xp: 120, gems: 30  },
  { type: "quiz_master",   name: "الأستاذ",  icon: "🏆", description: "اجتز 100 اختبار",                 value: 100,  rarity: "epic",      xp: 250, gems: 75  },
  { type: "perfect_score", name: "المتقن",   icon: "💯", description: "احصل على 100% في اختبار",         value: 1,    rarity: "rare",      xp: 80,  gems: 20  },
  { type: "perfect_score", name: "الكمال",   icon: "✨", description: "احصل على 100% في 5 اختبارات",    value: 5,    rarity: "epic",      xp: 200, gems: 60  },
  { type: "speed_learner", name: "السريع",   icon: "⚡", description: "تعلم 10 كلمات في يوم واحد",       value: 10,   rarity: "rare",      xp: 70,  gems: 20  },
  { type: "speed_learner", name: "البرق",    icon: "🚀", description: "تعلم 20 كلمة في يوم واحد",        value: 20,   rarity: "epic",      xp: 150, gems: 50  },
];

const RARITY_CONFIG = {
  common:    { bg: "bg-gray-100 dark:bg-gray-800",     text: "text-gray-700 dark:text-gray-300",   border: "border-gray-300",   bar: "from-gray-400 to-slate-400",     label: "✨ عادي"      },
  rare:      { bg: "bg-blue-50 dark:bg-blue-950/30",   text: "text-blue-700 dark:text-blue-300",   border: "border-blue-300",   bar: "from-blue-500 to-cyan-500",      label: "⭐ نادر"      },
  epic:      { bg: "bg-purple-50 dark:bg-purple-950/30",text: "text-purple-700 dark:text-purple-300",border: "border-purple-300",bar: "from-purple-500 to-pink-500",    label: "💎 ملحمي"    },
  legendary: { bg: "bg-amber-50 dark:bg-amber-950/20", text: "text-amber-700 dark:text-amber-400", border: "border-amber-300",  bar: "from-amber-500 to-yellow-500",   label: "🌟 أسطوري"   },
};

const CATEGORY_CONFIG = {
  daily_streak:   { bar: "from-red-500 to-orange-500",    icon: "from-red-500 to-orange-500"    },
  words_milestone:{ bar: "from-green-500 to-emerald-500", icon: "from-green-500 to-emerald-500" },
  quiz_master:    { bar: "from-blue-500 to-indigo-500",   icon: "from-blue-500 to-indigo-500"   },
  perfect_score:  { bar: "from-purple-500 to-pink-500",   icon: "from-purple-500 to-pink-500"   },
  speed_learner:  { bar: "from-amber-500 to-yellow-500",  icon: "from-amber-500 to-yellow-500"  },
};

const categoryNames = {
  daily_streak:   { name: "السلسلة اليومية",    icon: "🔥" },
  words_milestone:{ name: "إنجازات الكلمات",    icon: "📚" },
  quiz_master:    { name: "خبير الاختبارات",     icon: "🧠" },
  perfect_score:  { name: "النتائج المثالية",    icon: "💯" },
  speed_learner:  { name: "التعلم السريع",       icon: "⚡" },
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
      const currentUser = await supabaseClient.auth.me();
      setUser(currentUser);

      const [achievements, progressList, gemsList] = await Promise.all([
        supabaseClient.entities.Achievement.filter({ user_email: currentUser.email }),
        supabaseClient.entities.UserProgress.filter({ user_email: currentUser.email }),
        supabaseClient.entities.UserGems.filter({ user_email: currentUser.email }),
      ]);

      setUserAchievements(achievements);
      setUserProgress(progressList[0] || {});
      setUserGems(gemsList[0] || { current_gems: 0 });

      await checkNewAchievements(currentUser.email, progressList[0] || {}, achievements);
    } catch (error) {
      console.error("Error loading achievements:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const checkNewAchievements = async (userEmail, progress, existingAchievements) => {
    const earnedTypes = new Set(
      existingAchievements.map((a) => `${a.achievement_type}_${a.achievement_value}`)
    );

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
        case "quiz_master": {
          const sessions = await supabaseClient.entities.QuizSession.filter({ user_email: userEmail });
          shouldAward = sessions.length >= achievement.value;
          break;
        }
        case "perfect_score": {
          const perfectSessions = await supabaseClient.entities.QuizSession.filter({
            user_email: userEmail,
            score: 100,
          });
          shouldAward = perfectSessions.length >= achievement.value;
          break;
        }
        case "speed_learner": {
          const today = new Date().toISOString().split("T")[0];
          const todayWords = progress.learned_words?.filter((w) =>
            w.learned_date?.startsWith(today)
          ) || [];
          shouldAward = todayWords.length >= achievement.value;
          break;
        }
      }

      if (shouldAward) await awardAchievement(userEmail, achievement);
    }
  };

  const awardAchievement = async (userEmail, achievement) => {
    try {
      await supabaseClient.entities.Achievement.create({
        user_email: userEmail,
        achievement_type: achievement.type,
        achievement_name: achievement.name,
        achievement_icon: achievement.icon,
        achievement_description: achievement.description,
        achievement_value: achievement.value,
        rarity: achievement.rarity,
        reward_xp: achievement.xp,
        reward_gems: achievement.gems,
        earned_date: new Date().toISOString(),
      });

      const progressList = await supabaseClient.entities.UserProgress.filter({ user_email: userEmail });
      if (progressList.length > 0) {
        const p = progressList[0];
        const newXP = (p.total_xp || 0) + achievement.xp;
        await supabaseClient.entities.UserProgress.update(p.id, {
          total_xp: newXP,
          current_level: Math.floor(newXP / 100) + 1,
        });
      }

      const gemsList = await supabaseClient.entities.UserGems.filter({ user_email: userEmail });
      if (gemsList.length > 0) {
        const g = gemsList[0];
        await supabaseClient.entities.UserGems.update(g.id, {
          total_gems: (g.total_gems || 0) + achievement.gems,
          current_gems: (g.current_gems || 0) + achievement.gems,
        });
      } else {
        await supabaseClient.entities.UserGems.create({
          user_email: userEmail,
          total_gems: achievement.gems,
          current_gems: achievement.gems,
        });
      }

      loadAchievementsData();
    } catch (error) {
      console.error("Error awarding achievement:", error);
    }
  };

  const getAchievementProgress = (achievement) => {
    if (!userProgress) return 0;
    switch (achievement.type) {
      case "daily_streak":
        return Math.min(((userProgress.consecutive_login_days || 0) / achievement.value) * 100, 100);
      case "words_milestone":
        return Math.min(((userProgress.words_learned || 0) / achievement.value) * 100, 100);
      default:
        return 0;
    }
  };

  const isAchievementEarned = (achievement) =>
    userAchievements.some(
      (a) => a.achievement_type === achievement.type && a.achievement_value === achievement.value
    );

  const groupedAchievements = ACHIEVEMENT_DEFINITIONS.reduce((acc, a) => {
    if (!acc[a.type]) acc[a.type] = [];
    acc[a.type].push(a);
    return acc;
  }, {});

  const earnedCount = userAchievements.length;
  const rareCount = userAchievements.filter(
    (a) => a.rarity === "legendary" || a.rarity === "epic"
  ).length;
  const completionPct = Math.round((earnedCount / ACHIEVEMENT_DEFINITIONS.length) * 100);

  if (isLoading) {
    return (
      <div className="p-6 flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <Loader2 className="w-12 h-12 animate-spin text-amber-500" />
        <p className="text-foreground/60">جارٍ تحميل الإنجازات...</p>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>

        {/* ── الهيدر ── */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-amber-500 to-yellow-500 flex items-center justify-center mx-auto mb-4 shadow-lg">
            <Trophy className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-4xl font-bold gradient-text mb-2">الإنجازات</h1>
          <p className="text-foreground/70">اجمع الشارات واكسب الجواهر!</p>
        </div>

        {/* ── بطاقات الإحصاء ── */}
        <div className="grid md:grid-cols-4 gap-4 mb-8">
          {[
            { gradient: "from-amber-500 to-orange-500",  Icon: Sparkles, value: userGems?.current_gems || 0,  label: "جواهرك الحالية" },
            { gradient: "from-purple-500 to-pink-500",   Icon: Trophy,   value: earnedCount,                  label: "إنجاز مفتوح"    },
            { gradient: "from-blue-500 to-cyan-500",     Icon: Star,     value: rareCount,                    label: "إنجاز نادر"     },
            { gradient: "from-green-500 to-emerald-500", Icon: TrendingUp,value: `${completionPct}%`,          label: "نسبة الإكمال"   },
          ].map(({ gradient, Icon, value, label }, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.07 }}
            >
              <Card className="overflow-hidden shadow-md hover:shadow-lg transition-shadow">
                <div className={`h-4 bg-gradient-to-r ${gradient}`} />
                <CardContent className="p-5 text-center">
                  <div className={`w-12 h-12 rounded-full bg-gradient-to-br ${gradient} flex items-center justify-center mx-auto mb-3 shadow-lg`}>
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  <div className="text-3xl font-bold">{value}</div>
                  <p className="text-sm text-foreground/60 mt-1">{label}</p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* ── فئات الإنجازات ── */}
        {Object.entries(groupedAchievements).map(([type, achievements], categoryIndex) => {
          const category = categoryNames[type];
          const catCfg = CATEGORY_CONFIG[type];
          if (!category) return null;

          return (
            <motion.div
              key={type}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: categoryIndex * 0.08 }}
              className="mb-8"
            >
              <Card className="overflow-hidden shadow-md">
                <div className={`h-4 bg-gradient-to-r ${catCfg.bar}`} />
                <CardHeader>
                  <CardTitle className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${catCfg.icon} flex items-center justify-center shadow-lg`}>
                      <span className="text-lg">{category.icon}</span>
                    </div>
                    {category.name}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
                    {achievements.map((achievement, index) => {
                      const isEarned = isAchievementEarned(achievement);
                      const progress = getAchievementProgress(achievement);
                      const r = RARITY_CONFIG[achievement.rarity];
                      const earnedData = userAchievements.find(
                        (a) =>
                          a.achievement_type === achievement.type &&
                          a.achievement_value === achievement.value
                      );

                      return (
                        <motion.div
                          key={`${achievement.type}-${achievement.value}`}
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: index * 0.05 }}
                          whileHover={{ scale: isEarned ? 1.03 : 1.01 }}
                          className={`
                            relative rounded-xl border-2 overflow-hidden transition-all duration-300 min-h-[260px]
                            ${isEarned ? `${r.bg} ${r.border} shadow-lg` : "bg-gray-50 dark:bg-gray-900/20 border-gray-200 opacity-60"}
                          `}
                        >
                          {/* شريط الـ rarity للمفتوحة */}
                          {isEarned && (
                            <div className={`h-2 bg-gradient-to-r ${r.bar}`} />
                          )}

                          {/* قفل للمغلقة */}
                          {!isEarned && (
                            <div className="absolute top-3 left-3">
                              <Lock className="w-4 h-4 text-gray-400" />
                            </div>
                          )}

                          <div className="p-5">
                            {/* الأيقونة */}
                            <div className="text-center mb-3">
                              <div className={`text-5xl mb-2 transition-all duration-300 ${!isEarned ? "grayscale" : ""}`}>
                                {achievement.icon}
                              </div>
                              <h3 className={`font-bold text-lg mb-1 ${isEarned ? r.text : "text-gray-500"}`}>
                                {achievement.name}
                              </h3>
                              <Badge className={`text-xs border-0 ${isEarned ? `${r.bg} ${r.text}` : "bg-gray-200 text-gray-600"}`}>
                                {r.label}
                              </Badge>
                            </div>

                            {/* الوصف */}
                            <p className="text-sm text-center text-foreground/70 mb-4">
                              {achievement.description}
                            </p>

                            {/* التقدم أو تاريخ الحصول */}
                            {isEarned ? (
                              <div className="text-center space-y-2">
                                <div className="flex items-center justify-center gap-3">
                                  <span className="text-xs px-2 py-1 rounded-full bg-white/60 dark:bg-black/20 font-medium">
                                    +{achievement.xp} ⭐ نقطة
                                  </span>
                                  <span className="text-xs px-2 py-1 rounded-full bg-white/60 dark:bg-black/20 font-medium">
                                    +{achievement.gems} 💎
                                  </span>
                                </div>
                                {earnedData?.earned_date && (
                                  <p className="text-xs text-foreground/50">
                                    {format(new Date(earnedData.earned_date), "PPP", { locale: ar })}
                                  </p>
                                )}
                              </div>
                            ) : (
                              <div>
                                <div className="flex justify-between text-xs text-foreground/60 mb-1.5">
                                  <span>التقدم</span>
                                  <span>{Math.round(progress)}%</span>
                                </div>
                                <Progress value={progress} className="h-2" />
                              </div>
                            )}
                          </div>
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

import React, { useState, useEffect } from "react";
import { supabaseClient } from "@/components/api/supabaseClient";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Trophy, Target, Loader2, CheckCircle, Play } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useToast } from "@/components/ui/use-toast";
import { format } from "date-fns";
import { ar } from "date-fns/locale";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

const TYPE_CONFIG = {
  learn_words:     { bar: "from-green-400 to-emerald-500",  bg: "bg-green-50 dark:bg-green-950/20",   icon: "📚", label: "تعلّم كلمات جديدة",    route: "Learn"       },
  quiz_score:      { bar: "from-blue-400 to-indigo-500",    bg: "bg-blue-50 dark:bg-blue-950/20",     icon: "🎯", label: "اجتاز اختباراً",        route: "QuizTypes"   },
  streak_maintain: { bar: "from-orange-400 to-red-500",     bg: "bg-orange-50 dark:bg-orange-950/20", icon: "🔥", label: "حافظ على تسلسلك",       route: "Learn"       },
  time_challenge:  { bar: "from-purple-400 to-pink-500",    bg: "bg-purple-50 dark:bg-purple-950/20", icon: "⏱️", label: "تحدي الوقت",            route: "SmartReview" },
  default:         { bar: "from-amber-400 to-yellow-500",   bg: "bg-amber-50 dark:bg-amber-950/20",   icon: "🏆", label: "أكمل التحدي",           route: "Learn"       },
};

const getType = (type) => TYPE_CONFIG[type] || TYPE_CONFIG.default;

const GOAL_LABEL = {
  learn_words:     (v) => `تعلّم ${v} كلمات جديدة`,
  quiz_score:      (v) => `احصل على ${v}% في الاختبار`,
  streak_maintain: ()  => `سجّل نشاطاً واحداً على الأقل`,
  time_challenge:  (v) => `أكمل في ${v} دقيقة`,
  default:         (v) => `الهدف: ${v}`,
};

const getGoalLabel = (type, value) =>
  (GOAL_LABEL[type] || GOAL_LABEL.default)(value);

const getGreeting = () => {
  const hour = new Date().getHours();
  if (hour < 12) return "صباح الخير! 🌅";
  if (hour < 17) return "مرحباً! ☀️";
  return "مساء الخير! 🌙";
};

export default function DailyChallenges() {
  const { toast } = useToast();
  const [user, setUser] = useState(null);
  const [todayChallenges, setTodayChallenges] = useState([]);
  const [userProgress, setUserProgress] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadDailyChallenges();
  }, []);

  const loadDailyChallenges = async () => {
    try {
      const currentUser = await supabaseClient.auth.me();
      setUser(currentUser);

      const todayStr = format(new Date(), "yyyy-MM-dd");

      let challenges = await supabaseClient.entities.DailyChallenge.filter({
        challenge_date: todayStr,
      });

      if (challenges.length === 0) {
        const defaultChallenges = [
          {
            challenge_date: todayStr,
            challenge_title: "تعلم 10 كلمات جديدة",
            challenge_description: "تعلم 10 كلمات جديدة اليوم",
            challenge_type: "learn_words",
            goal_value: 10,
            reward_xp: 50,
            reward_gems: 10,
          },
          {
            challenge_date: todayStr,
            challenge_title: "اجتاز اختبار بنتيجة 90%",
            challenge_description: "احصل على 90% أو أكثر في أي اختبار",
            challenge_type: "quiz_score",
            goal_value: 90,
            reward_xp: 75,
            reward_gems: 15,
          },
          {
            challenge_date: todayStr,
            challenge_title: "حافظ على سلسلة النجاح",
            challenge_description: "سجل دخول واكمل نشاط واحد على الأقل",
            challenge_type: "streak_maintain",
            goal_value: 1,
            reward_xp: 30,
            reward_gems: 5,
          },
        ];

        for (const challenge of defaultChallenges) {
          await supabaseClient.entities.DailyChallenge.create(challenge);
        }

        challenges = await supabaseClient.entities.DailyChallenge.filter({
          challenge_date: todayStr,
        });
      }

      setTodayChallenges(challenges);

      const progressList = await supabaseClient.entities.DailyChallengeProgress.filter({
        user_email: currentUser.email,
      });
      setUserProgress(progressList);
    } catch (error) {
      console.error("Error loading daily challenges:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const getChallengeProgress = (challengeId) =>
    userProgress.find((p) => p.challenge_id === challengeId);

  const getProgressPercentage = (challenge) => {
    const progress = getChallengeProgress(challenge.id);
    if (!progress) return 0;
    return Math.min(100, Math.round((progress.progress_value / challenge.goal_value) * 100));
  };

  const isCompleted = (challengeId) =>
    getChallengeProgress(challengeId)?.completed || false;

  if (isLoading) {
    return (
      <div className="p-6 flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <Loader2 className="w-12 h-12 animate-spin text-orange-500" />
        <p className="text-foreground/60 text-lg">جارٍ تحميل التحديات...</p>
      </div>
    );
  }

  const completedCount = todayChallenges.filter((c) => isCompleted(c.id)).length;
  const totalCount = todayChallenges.length;
  const allDone = completedCount === totalCount && totalCount > 0;
  const overallPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  return (
    <div className="p-4 max-w-2xl mx-auto">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>

        {/* ── الهيدر ── */}
        <div className="text-center mb-6">
          <motion.div
            animate={{ rotate: [0, -10, 10, -10, 0] }}
            transition={{ duration: 1.2, delay: 0.4, repeat: allDone ? Infinity : 0, repeatDelay: 3 }}
            className="text-6xl mb-3"
          >
            {allDone ? "🏆" : "🔥"}
          </motion.div>
          <h1 className="text-3xl font-bold gradient-text mb-1">التحديات اليومية</h1>
          <p className="text-foreground/60 text-sm font-medium">
            {getGreeting()} هيا نكمل تحديات اليوم!
          </p>
        </div>

        {todayChallenges.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center gap-4">
            <div className="text-7xl">🌙</div>
            <p className="text-foreground/70 font-bold text-xl">لا توجد تحديات اليوم</p>
            <p className="text-foreground/50">تعال غداً لتجد تحديات جديدة!</p>
          </div>
        ) : (
          <div className="space-y-4">

            {/* ── بطاقة التقدم الكلي ── */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.1 }}
            >
              <Card className={`overflow-hidden shadow-md ${allDone ? "border-2 border-green-400" : ""}`}>
                <div className={`h-2 bg-gradient-to-r ${allDone ? "from-green-400 to-emerald-500" : "from-orange-400 to-red-500"}`} />
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center shadow ${allDone ? "bg-gradient-to-br from-green-400 to-emerald-500" : "bg-gradient-to-br from-orange-400 to-red-500"}`}>
                        {allDone
                          ? <CheckCircle className="w-5 h-5 text-white" />
                          : <Trophy className="w-5 h-5 text-white" />
                        }
                      </div>
                      <div>
                        <p className="font-bold text-foreground text-sm">
                          {allDone ? "🎉 أحسنت! أكملت جميع التحديات!" : "تقدّمك اليوم"}
                        </p>
                        <p className="text-xs text-foreground/60">
                          {completedCount} من {totalCount} تحديات مكتملة
                        </p>
                      </div>
                    </div>
                    <span className="text-2xl font-bold text-primary">{overallPercent}%</span>
                  </div>
                  <Progress value={overallPercent} className="h-4 rounded-full" />
                </CardContent>
              </Card>
            </motion.div>

            {/* ── حالة اكتمال الكل ── */}
            <AnimatePresence>
              {allDone && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  className="bg-gradient-to-r from-green-400 to-emerald-500 rounded-2xl p-5 text-center text-white shadow-lg"
                >
                  <div className="text-5xl mb-2">🎊</div>
                  <p className="text-xl font-bold">بطل اليوم!</p>
                  <p className="text-sm opacity-90 mt-1">أكملت كل التحديات — عظيم جداً!</p>
                </motion.div>
              )}
            </AnimatePresence>

            {/* ── بطاقات التحديات ── */}
            <AnimatePresence>
              {todayChallenges.map((challenge, index) => {
                const completed = isCompleted(challenge.id);
                const progressPercent = getProgressPercentage(challenge);
                const progress = getChallengeProgress(challenge.id);
                const cfg = getType(challenge.challenge_type);

                return (
                  <motion.div
                    key={challenge.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <Card className={`overflow-hidden shadow-md transition-all ${completed ? "border-2 border-green-400" : "border border-border"}`}>
                      {/* شريط اللون العلوي */}
                      <div className={`h-3 bg-gradient-to-r ${completed ? "from-green-400 to-emerald-500" : cfg.bar}`} />

                      <CardContent className="p-4">
                        {/* الرأس: الأيقونة + العنوان */}
                        <div className="flex items-center gap-3 mb-4">
                          <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${completed ? "from-green-400 to-emerald-500" : cfg.bar} flex items-center justify-center shadow flex-shrink-0`}>
                            <span className="text-3xl">
                              {completed ? "✅" : cfg.icon}
                            </span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="font-bold text-lg text-foreground leading-snug">
                              {challenge.challenge_title}
                            </h3>
                            <p className="text-sm text-foreground/60 mt-0.5 line-clamp-1">
                              {getGoalLabel(challenge.challenge_type, challenge.goal_value)}
                            </p>
                          </div>
                        </div>

                        {/* المكافآت */}
                        <div className="flex flex-wrap gap-2 mb-4">
                          <Badge className="bg-amber-100 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400 border-0 gap-1 text-sm px-3 py-1">
                            ⭐ {challenge.reward_xp} نجمة
                          </Badge>
                          <Badge className="bg-purple-100 text-purple-700 dark:bg-purple-950/30 dark:text-purple-400 border-0 text-sm px-3 py-1">
                            💎 {challenge.reward_gems} جوهرة
                          </Badge>
                        </div>

                        {/* التقدم أو الإنجاز */}
                        {completed ? (
                          <div className="bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-2xl p-3 flex items-center gap-3">
                            <span className="text-2xl">🎉</span>
                            <p className="font-bold text-green-700 dark:text-green-400 text-base">
                              تم إكمال التحدي! أحسنت!
                            </p>
                          </div>
                        ) : (
                          <div className={`${cfg.bg} rounded-2xl p-3 mb-3`}>
                            <div className="flex justify-between text-sm text-foreground/70 mb-2 font-medium">
                              <span>التقدم</span>
                              <span className="font-bold text-foreground">
                                {progress?.progress_value || 0} / {challenge.goal_value}
                              </span>
                            </div>
                            <Progress value={progressPercent} className="h-4 rounded-full" />
                          </div>
                        )}

                        {/* زر الابدأ */}
                        {!completed && (
                          <Link to={createPageUrl(cfg.route)}>
                            <Button className={`w-full mt-1 gap-2 bg-gradient-to-r ${cfg.bar} border-0 text-white font-bold text-base py-5 rounded-2xl shadow`}>
                              <Play className="w-5 h-5" />
                              ابدأ التحدي
                            </Button>
                          </Link>
                        )}
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </AnimatePresence>

            {/* ملاحظة أسفل الصفحة */}
            <p className="text-center text-xs text-foreground/40 pt-2 pb-4">
              🔄 تتجدد التحديات كل يوم · المكافآت تُمنح فوراً عند الإكمال
            </p>
          </div>
        )}
      </motion.div>
    </div>
  );
}

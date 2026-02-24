import React, { useState, useEffect } from "react";
import { supabaseClient } from "@/components/api/supabaseClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Trophy, Target, Loader2, Calendar, CheckCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useToast } from "@/components/ui/use-toast";
import { format } from "date-fns";
import { ar } from "date-fns/locale";

const TYPE_CONFIG = {
  learn_words:     { bar: "from-green-500 to-emerald-500",  bg: "bg-green-50 dark:bg-green-950/20",  icon: "📚" },
  quiz_score:      { bar: "from-blue-500 to-indigo-500",    bg: "bg-blue-50 dark:bg-blue-950/20",    icon: "🎯" },
  streak_maintain: { bar: "from-red-500 to-orange-500",     bg: "bg-red-50 dark:bg-red-950/20",      icon: "🔥" },
  time_challenge:  { bar: "from-purple-500 to-pink-500",    bg: "bg-purple-50 dark:bg-purple-950/20",icon: "⏱️" },
  default:         { bar: "from-amber-500 to-yellow-500",   bg: "bg-amber-50 dark:bg-amber-950/20",  icon: "🏆" },
};

const getType = (type) => TYPE_CONFIG[type] || TYPE_CONFIG.default;

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
        <p className="text-foreground/60">جارٍ تحميل التحديات...</p>
      </div>
    );
  }

  const completedCount = todayChallenges.filter((c) => isCompleted(c.id)).length;
  const totalCount = todayChallenges.length;
  const allDone = completedCount === totalCount && totalCount > 0;

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>

        {/* ── الهيدر ── */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center mx-auto mb-4 shadow-lg">
            <Calendar className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-4xl font-bold gradient-text mb-2">التحديات اليومية</h1>
          <p className="text-foreground/70">
            {format(new Date(), "EEEE، d MMMM yyyy", { locale: ar })}
          </p>
        </div>

        {todayChallenges.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center gap-3">
            <div className="text-6xl">🌙</div>
            <p className="text-foreground/70 font-medium text-lg">لا توجد تحديات اليوم</p>
            <p className="text-sm text-foreground/50">تعال غداً لتجد تحديات جديدة!</p>
          </div>
        ) : (
          <div className="space-y-5">

            {/* ── ملخص التقدم اليومي ── */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.1 }}
            >
              <Card className={`overflow-hidden shadow-md ${allDone ? "border-2 border-green-400" : ""}`}>
                <div className={`h-4 bg-gradient-to-r ${allDone ? "from-green-500 to-emerald-500" : "from-orange-500 to-red-500"}`} />
                <CardContent className="p-5">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center shadow-lg ${allDone ? "bg-gradient-to-br from-green-500 to-emerald-500" : "bg-gradient-to-br from-orange-500 to-red-500"}`}>
                        {allDone
                          ? <CheckCircle className="w-5 h-5 text-white" />
                          : <Trophy className="w-5 h-5 text-white" />
                        }
                      </div>
                      <div>
                        <p className="font-bold text-foreground">
                          {allDone ? "🎉 أحسنت! أكملت كل التحديات!" : "تقدمك اليوم"}
                        </p>
                        <p className="text-sm text-foreground/60">
                          {completedCount} / {totalCount} تحديات مكتملة
                        </p>
                      </div>
                    </div>
                    <span className="text-2xl font-bold text-primary">
                      {Math.round((completedCount / totalCount) * 100)}%
                    </span>
                  </div>
                  <Progress
                    value={(completedCount / totalCount) * 100}
                    className="h-3"
                  />
                </CardContent>
              </Card>
            </motion.div>

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
                    <Card className={`overflow-hidden shadow-md transition-all ${completed ? "border-2 border-green-400" : ""}`}>
                      <div className={`h-4 bg-gradient-to-r ${completed ? "from-green-500 to-emerald-500" : cfg.bar}`} />

                      <CardContent className="p-5">
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex items-center gap-3">
                            <div className={`w-14 h-14 rounded-full bg-gradient-to-br ${completed ? "from-green-500 to-emerald-500" : cfg.bar} flex items-center justify-center shadow-lg flex-shrink-0`}>
                              <span className="text-2xl">
                                {completed ? "✅" : cfg.icon}
                              </span>
                            </div>
                            <div>
                              <h3 className="font-bold text-lg text-foreground">
                                {challenge.challenge_title}
                              </h3>
                              <p className="text-sm text-foreground/60">
                                {challenge.challenge_description}
                              </p>
                            </div>
                          </div>
                        </div>

                        {/* المكافآت */}
                        <div className="flex flex-wrap gap-2 mb-4">
                          <Badge className="bg-amber-100 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400 border-0 gap-1">
                            <Trophy className="w-3 h-3" />
                            {challenge.reward_xp} ⭐ نقطة
                          </Badge>
                          <Badge className="bg-purple-100 text-purple-700 dark:bg-purple-950/30 dark:text-purple-400 border-0">
                            💎 {challenge.reward_gems} جوهرة
                          </Badge>
                          <Badge variant="outline" className="gap-1 text-xs">
                            <Target className="w-3 h-3" />
                            الهدف: {challenge.goal_value}
                          </Badge>
                        </div>

                        {/* التقدم أو الإنجاز */}
                        {completed ? (
                          <div className="bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-xl p-3 flex items-center gap-3">
                            <span className="text-2xl">🎉</span>
                            <p className="font-bold text-green-700 dark:text-green-400">
                              تم إكمال التحدي!
                            </p>
                          </div>
                        ) : (
                          <div className={`${cfg.bg} rounded-xl p-3`}>
                            <div className="flex justify-between text-sm text-foreground/70 mb-2">
                              <span>التقدم</span>
                              <span className="font-medium">
                                {progress?.progress_value || 0} / {challenge.goal_value}
                              </span>
                            </div>
                            <Progress value={progressPercent} className="h-3" />
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </AnimatePresence>

            {/* ملاحظة صغيرة في الأسفل */}
            <p className="text-center text-xs text-foreground/40 pt-2">
              🔄 تتجدد التحديات كل يوم · المكافآت تُمنح فوراً عند الإكمال
            </p>
          </div>
        )}
      </motion.div>
    </div>
  );
}

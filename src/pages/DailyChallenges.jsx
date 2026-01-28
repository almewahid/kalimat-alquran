import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Trophy, Target, Users, Loader2, Calendar, CheckCircle, Clock } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useToast } from "@/components/ui/use-toast";
import { format } from "date-fns";
import { ar } from "date-fns/locale";

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
      const currentUser = await base44.auth.me();
      setUser(currentUser);

      const todayStr = format(new Date(), 'yyyy-MM-dd');

      let challenges = await base44.entities.DailyChallenge.filter({
        challenge_date: todayStr
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
            reward_gems: 10
          },
          {
            challenge_date: todayStr,
            challenge_title: "اجتاز اختبار بنتيجة 90%",
            challenge_description: "احصل على 90% أو أكثر في أي اختبار",
            challenge_type: "quiz_score",
            goal_value: 90,
            reward_xp: 75,
            reward_gems: 15
          },
          {
            challenge_date: todayStr,
            challenge_title: "حافظ على سلسلة النجاح",
            challenge_description: "سجل دخول واكمل نشاط واحد على الأقل",
            challenge_type: "streak_maintain",
            goal_value: 1,
            reward_xp: 30,
            reward_gems: 5
          }
        ];

        for (const challenge of defaultChallenges) {
          await base44.entities.DailyChallenge.create(challenge);
        }

        challenges = await base44.entities.DailyChallenge.filter({
          challenge_date: todayStr
        });
      }

      setTodayChallenges(challenges);

      const progressList = await base44.entities.DailyChallengeProgress.filter({
        user_email: currentUser.email
      });

      setUserProgress(progressList);

    } catch (error) {
      console.error("Error loading daily challenges:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const getChallengeProgress = (challengeId) => {
    return userProgress.find(p => p.challenge_id === challengeId);
  };

  const getProgressPercentage = (challenge) => {
    const progress = getChallengeProgress(challenge.id);
    if (!progress) return 0;
    return Math.min(100, Math.round((progress.progress_value / challenge.goal_value) * 100));
  };

  const isCompleted = (challengeId) => {
    const progress = getChallengeProgress(challengeId);
    return progress?.completed || false;
  };

  const getChallengeIcon = (type) => {
    switch (type) {
      case "learn_words": return "📚";
      case "quiz_score": return "🎯";
      case "streak_maintain": return "🔥";
      case "time_challenge": return "⏱️";
      default: return "🏆";
    }
  };

  if (isLoading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-screen">
        <Loader2 className="w-12 h-12 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
        <div className="text-center mb-8">
          <Calendar className="w-16 h-16 text-primary mx-auto mb-4" />
          <h1 className="text-4xl font-bold gradient-text mb-2">التحديات اليومية</h1>
          <p className="text-foreground/70">
            {format(new Date(), 'EEEE، d MMMM yyyy', { locale: ar })}
          </p>
        </div>

        {todayChallenges.length === 0 ? (
          <Alert>
            <AlertDescription>
              لا توجد تحديات لهذا اليوم. تحقق لاحقاً!
            </AlertDescription>
          </Alert>
        ) : (
          <div className="space-y-6">
            <AnimatePresence>
              {todayChallenges.map((challenge, index) => {
                const completed = isCompleted(challenge.id);
                const progressPercent = getProgressPercentage(challenge);
                const progress = getChallengeProgress(challenge.id);

                return (
                  <motion.div
                    key={challenge.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <Card className={`bg-card shadow-md ${completed ? 'border-2 border-green-500' : ''}`}>
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="text-5xl">{getChallengeIcon(challenge.challenge_type)}</div>
                            <div>
                              <CardTitle className="text-xl">{challenge.challenge_title}</CardTitle>
                              <p className="text-sm text-foreground/70 mt-1">{challenge.challenge_description}</p>
                            </div>
                          </div>
                          {completed && (
                            <CheckCircle className="w-8 h-8 text-green-500" />
                          )}
                        </div>
                      </CardHeader>

                      <CardContent className="space-y-4">
                        <div className="flex flex-wrap gap-2">
                          <Badge variant="outline" className="gap-1">
                            <Target className="w-3 h-3" />
                            الهدف: {challenge.goal_value}
                          </Badge>
                          <Badge className="bg-amber-100 text-amber-700 gap-1">
                            <Trophy className="w-3 h-3" />
                            {challenge.reward_xp} XP
                          </Badge>
                          <Badge className="bg-purple-100 text-purple-700">
                            💎 {challenge.reward_gems}
                          </Badge>
                        </div>

                        {!completed && (
                          <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                              <span>التقدم</span>
                              <span>{progress?.progress_value || 0} / {challenge.goal_value}</span>
                            </div>
                            <Progress value={progressPercent} />
                          </div>
                        )}

                        {completed && (
                          <Alert className="bg-green-50 border-green-200">
                            <AlertDescription className="text-green-800 flex items-center gap-2">
                              <CheckCircle className="w-4 h-4" />
                              <span>تم إكمال التحدي! 🎉</span>
                            </AlertDescription>
                          </Alert>
                        )}
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </AnimatePresence>

            <Card className="bg-primary/5 border-primary/20">
              <CardContent className="p-6">
                <h3 className="font-bold mb-3 flex items-center gap-2">
                  <Clock className="w-5 h-5 text-primary" />
                  ملاحظة مهمة
                </h3>
                <ul className="text-sm space-y-2 text-foreground/80">
                  <li className="flex items-start gap-2">
                    <span className="text-primary">•</span>
                    <span>تتجدد التحديات اليومية كل 24 ساعة في منتصف الليل</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary">•</span>
                    <span>يتم منح المكافآت فوراً عند إكمال التحدي</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary">•</span>
                    <span>يتم تحديث التقدم تلقائياً أثناء استخدامك للتطبيق</span>
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>
        )}
      </motion.div>
    </div>
  );
}
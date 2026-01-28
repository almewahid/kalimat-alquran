import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Trophy, Calendar, Target, Users, ArrowLeft, Loader2, Award, Flame, CheckCircle } from "lucide-react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { format, differenceInDays, isAfter } from "date-fns";
import { ar } from "date-fns/locale";
import { useToast } from "@/components/ui/use-toast";

const CHALLENGE_TYPE_LABELS = {
  learn_new_words: { label: "تعلم كلمات جديدة", icon: "📚" },
  review_words: { label: "مراجعة كلمات", icon: "🔄" },
  complete_quizzes: { label: "إكمال اختبارات", icon: "🧠" },
  maintain_streak: { label: "الحفاظ على السلسلة", icon: "🔥" }
};

export default function ChallengeDetail() {
  const { toast } = useToast();
  const [user, setUser] = useState(null);
  const [challenge, setChallenge] = useState(null);
  const [group, setGroup] = useState(null);
  const [progress, setProgress] = useState(null);
  const [leaderboard, setLeaderboard] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const urlParams = new URLSearchParams(window.location.search);
  const challengeId = urlParams.get('id');

  useEffect(() => {
    loadChallengeData();
  }, [challengeId]);

  const loadChallengeData = async () => {
    try {
      const currentUser = await base44.auth.me();
      setUser(currentUser);

      const challengeData = await base44.entities.GroupChallenge.filter({ id: challengeId });
      if (challengeData.length === 0) {
        toast({ title: "❌ التحدي غير موجود", variant: "destructive" });
        return;
      }

      const currentChallenge = challengeData[0];
      setChallenge(currentChallenge);

      const groupData = await base44.entities.Group.filter({ id: currentChallenge.group_id });
      if (groupData.length > 0) {
        setGroup(groupData[0]);
      }

      const userProgress = await base44.entities.ChallengeProgress.filter({
        challenge_id: challengeId,
        user_email: currentUser.email
      });

      if (userProgress.length > 0) {
        setProgress(userProgress[0]);
      }

      // Load leaderboard
      const allProgress = await base44.entities.ChallengeProgress.filter({ challenge_id: challengeId });
      const sortedProgress = allProgress.sort((a, b) => b.progress_value - a.progress_value);
      
      const allUsers = await base44.entities.User.list();
      const leaderboardData = sortedProgress.map((prog, index) => {
        const userInfo = allUsers.find(u => u.email === prog.user_email);
        return {
          ...prog,
          rank: index + 1,
          user_name: userInfo?.full_name || prog.user_email,
          user_email: prog.user_email
        };
      });

      setLeaderboard(leaderboardData);

    } catch (error) {
      console.error("Error loading challenge data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const checkAndUpdateProgress = async () => {
    if (!challenge || !user) return;

    try {
      const userProgressData = await base44.entities.UserProgress.filter({ created_by: user.email });
      if (userProgressData.length === 0) return;

      const userProg = userProgressData[0];
      let newProgressValue = 0;

      switch (challenge.challenge_type) {
        case "learn_new_words":
          newProgressValue = userProg.words_learned || 0;
          break;
        case "review_words":
          // Count reviews from quiz sessions
          const sessions = await base44.entities.QuizSession.filter({ created_by: user.email });
          newProgressValue = sessions.length;
          break;
        case "complete_quizzes":
          const quizSessions = await base44.entities.QuizSession.filter({ created_by: user.email });
          newProgressValue = quizSessions.length;
          break;
        case "maintain_streak":
          newProgressValue = userProg.quiz_streak || 0;
          break;
      }

      if (progress && newProgressValue !== progress.progress_value) {
        const isCompleted = newProgressValue >= challenge.goal_count;
        const updateData = {
          progress_value: newProgressValue,
          completed: isCompleted,
          last_update: new Date().toISOString()
        };

        if (isCompleted && !progress.completed) {
          updateData.completion_date = new Date().toISOString();
          
          // Award badge
          await base44.entities.UserBadge.create({
            user_email: user.email,
            badge_name: challenge.reward_badge,
            badge_icon: "🏆",
            badge_description: `إكمال تحدي: ${challenge.title}`,
            challenge_id: challenge.id,
            earned_date: new Date().toISOString()
          });

          // Award XP
          const newTotalXP = (userProg.total_xp || 0) + challenge.reward_xp;
          await base44.entities.UserProgress.update(userProg.id, {
            total_xp: newTotalXP,
            current_level: Math.floor(newTotalXP / 100) + 1
          });

          toast({
            title: "🎉 تهانينا! أكملت التحدي",
            description: `حصلت على ${challenge.reward_xp} نقطة خبرة وشارة ${challenge.reward_badge}`,
            className: "bg-green-100 text-green-800"
          });
        }

        await base44.entities.ChallengeProgress.update(progress.id, updateData);
        loadChallengeData();
      }
    } catch (error) {
      console.error("Error updating progress:", error);
    }
  };

  useEffect(() => {
    if (challenge && progress) {
      checkAndUpdateProgress();
    }
  }, [challenge, progress]);

  if (isLoading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-screen">
        <Loader2 className="w-12 h-12 animate-spin text-primary" />
      </div>
    );
  }

  if (!challenge) {
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <Alert variant="destructive">
          <AlertDescription>التحدي غير موجود</AlertDescription>
        </Alert>
      </div>
    );
  }

  const typeInfo = CHALLENGE_TYPE_LABELS[challenge.challenge_type] || {};
  const progressPercentage = progress ? Math.min((progress.progress_value / challenge.goal_count) * 100, 100) : 0;
  const daysLeft = differenceInDays(new Date(challenge.end_date), new Date());
  const isExpired = daysLeft < 0;
  const isCompleted = progress?.completed;
  const myRank = leaderboard.findIndex(item => item.user_email === user?.email) + 1;

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Link to={createPageUrl(`GroupDetail?id=${challenge.group_id}`)}>
            <Button variant="ghost" size="icon">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-3xl font-bold gradient-text">{challenge.title}</h1>
              <Badge className="bg-blue-100 text-blue-700">
                {typeInfo.icon} {typeInfo.label}
              </Badge>
              {isCompleted && (
                <Badge className="bg-green-100 text-green-700">
                  <CheckCircle className="w-3 h-3 ml-1" />
                  مكتمل
                </Badge>
              )}
            </div>
            {challenge.description && (
              <p className="text-foreground/70">{challenge.description}</p>
            )}
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-6 mb-8">
          {/* Progress Card */}
          <Card className="lg:col-span-2 bg-card shadow-md">
            <CardHeader>
              <CardTitle className="text-primary flex items-center gap-2">
                <Target className="w-5 h-5" />
                تقدمك في التحدي
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <div className="flex justify-between mb-2">
                  <span className="text-sm text-foreground/80">الإنجاز</span>
                  <span className="text-sm font-medium text-primary">
                    {progress?.progress_value || 0} / {challenge.goal_count}
                  </span>
                </div>
                <Progress value={progressPercentage} className="h-3" />
                <p className="text-xs text-foreground/70 mt-2 text-center">
                  {Math.round(progressPercentage)}% مكتمل
                </p>
              </div>

              {isCompleted ? (
                <Alert className="bg-green-50 border-green-200">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  <AlertDescription className="text-green-800">
                    🎉 مبروك! لقد أكملت التحدي وحصلت على {challenge.reward_xp} نقطة خبرة
                  </AlertDescription>
                </Alert>
              ) : isExpired ? (
                <Alert className="bg-red-50 border-red-200">
                  <AlertDescription className="text-red-800">
                    ⏰ انتهت مدة التحدي. لم تتمكن من إكماله هذه المرة.
                  </AlertDescription>
                </Alert>
              ) : (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-sm text-blue-800">
                    💪 استمر في التقدم! متبقي {challenge.goal_count - (progress?.progress_value || 0)} لإكمال التحدي
                  </p>
                </div>
              )}

              {progress?.last_update && (
                <p className="text-xs text-foreground/70">
                  آخر تحديث: {format(new Date(progress.last_update), "PPP 'الساعة' p", { locale: ar })}
                </p>
              )}
            </CardContent>
          </Card>

          {/* Stats Card */}
          <div className="space-y-6">
            <Card className="bg-card shadow-md">
              <CardContent className="p-6 space-y-4">
                <div className="flex items-center gap-3">
                  <Calendar className="w-5 h-5 text-primary" />
                  <div>
                    <p className="text-sm text-foreground/70">المدة المتبقية</p>
                    <p className="text-lg font-bold text-foreground">
                      {isExpired ? "انتهى" : `${daysLeft} يوم`}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Trophy className="w-5 h-5 text-amber-500" />
                  <div>
                    <p className="text-sm text-foreground/70">المكافأة</p>
                    <p className="text-lg font-bold text-foreground">
                      +{challenge.reward_xp} XP
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Award className="w-5 h-5 text-purple-500" />
                  <div>
                    <p className="text-sm text-foreground/70">ترتيبك</p>
                    <p className="text-lg font-bold text-foreground">
                      #{myRank || "-"}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Users className="w-5 h-5 text-blue-500" />
                  <div>
                    <p className="text-sm text-foreground/70">المشاركون</p>
                    <p className="text-lg font-bold text-foreground">
                      {leaderboard.length}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {challenge.reward_badge && (
              <Card className="bg-gradient-to-br from-amber-50 to-orange-50 border-amber-200">
                <CardContent className="p-6 text-center">
                  <div className="text-4xl mb-2">🏆</div>
                  <p className="font-bold text-amber-900">{challenge.reward_badge}</p>
                  <p className="text-xs text-amber-700 mt-1">شارة الإكمال</p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {/* Leaderboard */}
        <Card className="bg-card shadow-md">
          <CardHeader>
            <CardTitle className="text-primary flex items-center gap-2">
              <Trophy className="w-6 h-6" />
              لوحة الترتيب
            </CardTitle>
          </CardHeader>
          <CardContent>
            {leaderboard.length === 0 ? (
              <div className="text-center py-8 text-foreground/70">
                لا يوجد مشاركون بعد
              </div>
            ) : (
              <div className="space-y-3">
                {leaderboard.map((item, index) => {
                  const isCurrentUser = item.user_email === user?.email;
                  const medalEmoji = index === 0 ? "🥇" : index === 1 ? "🥈" : index === 2 ? "🥉" : null;

                  return (
                    <motion.div
                      key={item.user_email}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className={`flex items-center gap-4 p-4 rounded-lg ${
                        isCurrentUser ? "bg-primary/10 border-2 border-primary" : "bg-background-soft"
                      }`}
                    >
                      <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/10">
                        {medalEmoji ? (
                          <span className="text-2xl">{medalEmoji}</span>
                        ) : (
                          <span className="font-bold text-primary">#{item.rank}</span>
                        )}
                      </div>

                      <div className="flex-1">
                        <p className="font-medium text-foreground">
                          {item.user_name}
                          {isCurrentUser && (
                            <Badge variant="outline" className="mr-2 text-xs">أنت</Badge>
                          )}
                        </p>
                        <p className="text-sm text-foreground/70">
                          {item.progress_value} / {challenge.goal_count}
                        </p>
                      </div>

                      <div className="text-left">
                        <Progress 
                          value={(item.progress_value / challenge.goal_count) * 100} 
                          className="h-2 w-24 mb-1"
                        />
                        <p className="text-xs text-foreground/70">
                          {Math.round((item.progress_value / challenge.goal_count) * 100)}%
                        </p>
                      </div>

                      {item.completed && (
                        <CheckCircle className="w-5 h-5 text-green-600" />
                      )}
                    </motion.div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
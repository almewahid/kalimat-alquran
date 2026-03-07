import React, { useState, useEffect } from "react";
import { supabaseClient } from "@/components/api/supabaseClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Trophy, Calendar, Target, Users, ArrowLeft, Loader2, Award, CheckCircle, BookOpen, Trash2 } from "lucide-react";
import { motion } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { format, differenceInDays } from "date-fns";
import { ar } from "date-fns/locale";
import { useToast } from "@/components/ui/use-toast";

const CHALLENGE_TYPE_LABELS = {
  learn_new_words: { label: "تعلم كلمات جديدة", icon: "📚" },
  learn_and_review: { label: "تعلم الجديد ومراجعة القديم", icon: "🔄" },
  complete_quizzes: { label: "إكمال اختبارات", icon: "🧠" },
  maintain_streak: { label: "الحفاظ على السلسلة", icon: "🔥" }
};

export default function ChallengeDetail() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [challenge, setChallenge] = useState(null);
  const [group, setGroup] = useState(null);
  const [progress, setProgress] = useState(null);
  const [leaderboard, setLeaderboard] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [challengeWords, setChallengeWords] = useState([]);
  const [isLeader, setIsLeader] = useState(false);
const [showDeleteDialog, setShowDeleteDialog] = useState(false);
const [isDeleting, setIsDeleting] = useState(false);
const isDeletingRef = React.useRef(false);  // ← أضف هذا السطر

  const urlParams = new URLSearchParams(window.location.search);
  const challengeId = urlParams.get('id');

  useEffect(() => {
    loadChallengeData();
  }, [challengeId]);

  const loadChallengeData = async () => {
    try {
      const currentUser = await supabaseClient.auth.me();
      setUser(currentUser);

      const challengeData = await supabaseClient.entities.GroupChallenge.filter({ id: challengeId });
if (challengeData.length === 0) {
  if (!isDeletingRef.current) {  // ← استخدم الـ ref
    toast({ title: "❌ التحدي غير موجود", variant: "destructive" });
  }
  return;
}

      const currentChallenge = challengeData[0];
      setChallenge(currentChallenge);

      // ── جلب بيانات المجموعة ──
      let leaderEmail = null;
      const groupData = await supabaseClient.entities.Group.filter({ id: currentChallenge.group_id });
      if (groupData.length > 0) {
        setGroup(groupData[0]);
        leaderEmail = groupData[0].leader_email;
        const leaderStatus = leaderEmail === currentUser.email;
        setIsLeader(leaderStatus);
      }

      // ── جلب كلمات التحدي حسب المصدر والمستوى ──
      {
        const allWords = await supabaseClient.entities.QuranicWord.list();
        let filtered = allWords;

        if (currentChallenge.source_type === "surah" && currentChallenge.source_details?.length > 0) {
          filtered = filtered.filter(w =>
            currentChallenge.source_details.includes(String(w.surah_number))
          );
        } else if (currentChallenge.source_type === "juz" && currentChallenge.source_details?.length > 0) {
          filtered = filtered.filter(w =>
            currentChallenge.source_details.includes(String(w.juz_number))
          );
        }

        if (currentChallenge.difficulty_level && currentChallenge.difficulty_level !== "الكل") {
          filtered = filtered.filter(w => w.difficulty_level === currentChallenge.difficulty_level);
        }

        setChallengeWords(filtered);
      }

      // ── جلب جميع سجلات التقدم للتحدي (كل المشاركين) ──
      const allProgress = await supabaseClient.entities.ChallengeProgress.filter({ challenge_id: challengeId });

      console.log("[ChallengeDetail] كل السجلات:", allProgress.length, "- الرئيس:", leaderEmail);

      // تحديد تقدم العضو الحالي (إذا لم يكن رئيساً)
      const isCurrentUserLeader = leaderEmail === currentUser.email;
      if (!isCurrentUserLeader) {
        const userProgress = allProgress.find(p => p.user_email === currentUser.email);
        if (userProgress) {
          setProgress(userProgress);
        }
      }

      // ── بناء لوحة الترتيب (استثناء الرئيس فقط) ──
      const membersProgress = leaderEmail
        ? allProgress.filter(p => p.user_email !== leaderEmail)
        : allProgress;

      const sortedProgress = [...membersProgress].sort((a, b) => b.progress_value - a.progress_value);

      console.log("[ChallengeDetail] أعضاء لوحة الترتيب:", sortedProgress.length);

      const allUsers = await supabaseClient.entities.User.list();
      const leaderboardData = sortedProgress.map((prog, index) => {
        const userInfo = allUsers.find(u => u.email === prog.user_email);
        return {
          ...prog,
          rank: index + 1,
          user_name: userInfo?.full_name || prog.user_email,
        };
      });

      setLeaderboard(leaderboardData);

    } catch (error) {
      console.error("Error loading challenge data:", error);
    } finally {
      setIsLoading(false);
    }
  };
const handleDeleteChallenge = async () => {
  setIsDeleting(true);
  isDeletingRef.current = true;  // ← أضف هذا
  try {
    const allProgress = await supabaseClient.entities.ChallengeProgress.filter({ challenge_id: challengeId });
    for (const prog of allProgress) {
      await supabaseClient.entities.ChallengeProgress.delete(prog.id);
    }
    await supabaseClient.entities.GroupChallenge.delete(challengeId);
    toast({ title: "✅ تم حذف التحدي", description: "تم حذف التحدي وجميع بيانات المشاركين بنجاح" });
    setShowDeleteDialog(false);
    setIsDeleting(false);
    navigate(createPageUrl(`GroupDetail?id=${challenge.group_id}`));
  } catch (error) {
    toast({ title: "❌ خطأ في الحذف", variant: "destructive" });
    isDeletingRef.current = false;  // ← أضف هذا
    setIsDeleting(false);
    setShowDeleteDialog(false);
  }
};
  const checkAndUpdateProgress = async () => {
    if (!challenge || !user || isLeader) return;

    try {
      const userProgressData = await supabaseClient.entities.UserProgress.filter({ user_email: user.email });
      if (userProgressData.length === 0) return;

      const userProg = userProgressData[0];
      let newProgressValue = 0;

      switch (challenge.challenge_type) {
        case "learn_new_words":
          newProgressValue = userProg.words_learned || 0;
          break;
        case "learn_and_review":
          newProgressValue = (userProg.words_learned || 0) + (userProg.words_reviewed || 0);
          break;
        case "complete_quizzes":
          const sessions = await supabaseClient.entities.QuizSession.filter({ user_email: user.email });
          newProgressValue = sessions.length;
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

          await supabaseClient.entities.UserBadge.create({
            user_email: user.email,
            badge_name: challenge.reward_badge,
            badge_icon: "🏆",
            badge_description: `إكمال تحدي: ${challenge.title}`,
            challenge_id: challenge.id,
            earned_date: new Date().toISOString()
          });

          const newTotalXP = (userProg.total_xp || 0) + challenge.reward_xp;
          await supabaseClient.entities.UserProgress.update(userProg.id, {
            total_xp: newTotalXP,
            current_level: Math.floor(newTotalXP / 100) + 1
          });

          toast({
            title: "🎉 تهانينا! أكملت التحدي",
            description: `حصلت على ${challenge.reward_xp} نقطة خبرة وشارة ${challenge.reward_badge}`,
            className: "bg-green-100 text-green-800"
          });
        }

        await supabaseClient.entities.ChallengeProgress.update(progress.id, updateData);
        loadChallengeData();
      }
    } catch (error) {
      console.error("Error updating progress:", error);
    }
  };

  useEffect(() => {
    if (challenge && progress && !isLeader) {
      checkAndUpdateProgress();
    }
  }, [challenge, progress, isLeader]);

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

  const SURAH_NAMES = {
    "1": "الفاتحة", "2": "البقرة", "3": "آل عمران", "4": "النساء", "5": "المائدة",
    "6": "الأنعام", "7": "الأعراف", "8": "الأنفال", "9": "التوبة", "10": "يونس",
    "11": "هود", "12": "يوسف", "13": "الرعد", "14": "إبراهيم", "15": "الحجر",
    "16": "النحل", "17": "الإسراء", "18": "الكهف", "19": "مريم", "20": "طه",
    "21": "الأنبياء", "22": "الحج", "23": "المؤمنون", "24": "النور", "25": "الفرقان",
    "26": "الشعراء", "27": "النمل", "28": "القصص", "29": "العنكبوت", "30": "الروم",
    "31": "لقمان", "32": "السجدة", "33": "الأحزاب", "34": "سبأ", "35": "فاطر",
    "36": "يس", "37": "الصافات", "38": "ص", "39": "الزمر", "40": "غافر",
    "41": "فصلت", "42": "الشورى", "43": "الزخرف", "44": "الدخان", "45": "الجاثية",
    "46": "الأحقاف", "47": "محمد", "48": "الفتح", "49": "الحجرات", "50": "ق",
    "51": "الذاريات", "52": "الطور", "53": "النجم", "54": "القمر", "55": "الرحمن",
    "56": "الواقعة", "57": "الحديد", "58": "المجادلة", "59": "الحشر", "60": "الممتحنة",
    "61": "الصف", "62": "الجمعة", "63": "المنافقون", "64": "التغابن", "65": "الطلاق",
    "66": "التحريم", "67": "الملك", "68": "القلم", "69": "الحاقة", "70": "المعارج",
    "71": "نوح", "72": "الجن", "73": "المزمل", "74": "المدثر", "75": "القيامة",
    "76": "الإنسان", "77": "المرسلات", "78": "النبأ", "79": "النازعات", "80": "عبس",
    "81": "التكوير", "82": "الانفطار", "83": "المطففين", "84": "الانشقاق", "85": "البروج",
    "86": "الطارق", "87": "الأعلى", "88": "الغاشية", "89": "الفجر", "90": "البلد",
    "91": "الشمس", "92": "الليل", "93": "الضحى", "94": "الشرح", "95": "التين",
    "96": "العلق", "97": "القدر", "98": "البينة", "99": "الزلزلة", "100": "العاديات",
    "101": "القارعة", "102": "التكاثر", "103": "العصر", "104": "الهمزة", "105": "الفيل",
    "106": "قريش", "107": "الماعون", "108": "الكوثر", "109": "الكافرون", "110": "النصر",
    "111": "المسد", "112": "الإخلاص", "113": "الفلق", "114": "الناس"
  };
  const sourceLabel = challenge.source_type === "surah"
    ? `سورة (${challenge.source_details?.map(n => SURAH_NAMES[n] || n).join("، ")})`
    : challenge.source_type === "juz"
    ? `جزء (${challenge.source_details?.join("، ")})`
    : "جميع الكلمات";

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
              <h1 className="text-3xl font-bold">{challenge.title}</h1>
              <Badge className="bg-blue-100 text-blue-700">
                {typeInfo.icon} {typeInfo.label}
              </Badge>
              {isCompleted && !isLeader && (
                <Badge className="bg-green-100 text-green-700">
                  <CheckCircle className="w-3 h-3 ml-1" />
                  مكتمل
                </Badge>
              )}
              {isLeader && (
                <Badge className="bg-purple-100 text-purple-700">
                  👑 رئيس المجموعة
                </Badge>
              )}
            </div>
            {challenge.description && (
              <p className="text-foreground/70">{challenge.description}</p>
            )}
         </div>  {/* إغلاق flex-1 */}

          {isLeader && (
            <Button variant="destructive" size="sm" onClick={() => setShowDeleteDialog(true)} className="flex items-center gap-2">
              <Trash2 className="w-4 h-4" />
              حذف التحدي
            </Button>
          )}

        </div>    {/* إغلاق Header */}

        {/* رئيس المجموعة - عرض إداري */}
        {isLeader ? (
          <div className="grid lg:grid-cols-3 gap-6 mb-8">
            <Card className="lg:col-span-2 bg-card shadow-md">
              <CardHeader>
                <CardTitle className="text-primary flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  إحصائيات التحدي
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div className="p-4 bg-blue-50 rounded-lg">
                    <p className="text-2xl font-bold text-blue-700">{leaderboard.length}</p>
                    <p className="text-sm text-blue-600">مشارك</p>
                  </div>
                  <div className="p-4 bg-green-50 rounded-lg">
                    <p className="text-2xl font-bold text-green-700">
                      {leaderboard.filter(l => l.completed).length}
                    </p>
                    <p className="text-sm text-green-600">أكملوا</p>
                  </div>
                  <div className="p-4 bg-amber-50 rounded-lg">
                    <p className="text-2xl font-bold text-amber-700">
                      {isExpired ? "انتهى" : `${daysLeft} يوم`}
                    </p>
                    <p className="text-sm text-amber-600">متبقي</p>
                  </div>
                </div>

                <div className="p-3 bg-muted/30 rounded-lg">
                  <p className="text-sm font-medium mb-1">📖 مصدر المادة</p>
                  <p className="text-sm text-foreground/70">{sourceLabel}</p>
                  {challengeWords.length > 0 && (
                    <p className="text-xs text-foreground/50 mt-1">{challengeWords.length} كلمة في التحدي</p>
                  )}
                </div>

                <Alert className="bg-purple-50 border-purple-200">
                  <AlertDescription className="text-purple-800">
                    👑 أنت رئيس المجموعة - لا تشارك في التحدي بل تديره
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>

            <Card className="bg-card shadow-md">
              <CardContent className="p-6 space-y-4">
                <div className="flex items-center gap-3">
                  <Calendar className="w-5 h-5 text-primary" />
                  <div>
                    <p className="text-sm text-foreground/70">تاريخ الانتهاء</p>
                    <p className="font-bold">{format(new Date(challenge.end_date), "PPP", { locale: ar })}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Trophy className="w-5 h-5 text-amber-500" />
                  <div>
                    <p className="text-sm text-foreground/70">المكافأة</p>
                    <p className="font-bold">+{challenge.reward_xp} XP</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Target className="w-5 h-5 text-blue-500" />
                  <div>
                    <p className="text-sm text-foreground/70">الهدف</p>
                    <p className="font-bold">{challenge.goal_count}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        ) : (
          /* عضو عادي - عرض تقدمه */
          <div className="grid lg:grid-cols-3 gap-6 mb-8">
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

                <div className="p-3 bg-muted/30 rounded-lg">
                  <p className="text-sm font-medium mb-2 flex items-center gap-2">
                    <BookOpen className="w-4 h-4" />
                    {challengeWords.length > 0 ? `كلمات التحدي (${challengeWords.length} كلمة)` : "كلمات التحدي"}
                  </p>
                  <Button
                    size="sm"
                    onClick={() => navigate(createPageUrl(`Learn?challenge_id=${challengeId}`))}
                    className="w-full"
                  >
                    ابدأ التعلم من كلمات التحدي
                  </Button>
                </div>

                {isCompleted ? (
                  <Alert className="bg-green-50 border-green-200">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    <AlertDescription className="text-green-800">
                      🎉 مبروك! حصلت على {challenge.reward_xp} نقطة خبرة
                    </AlertDescription>
                  </Alert>
                ) : isExpired ? (
                  <Alert className="bg-red-50 border-red-200">
                    <AlertDescription className="text-red-800">
                      ⏰ انتهت مدة التحدي.
                    </AlertDescription>
                  </Alert>
                ) : (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <p className="text-sm text-blue-800">
                      💪 متبقي {challenge.goal_count - (progress?.progress_value || 0)} لإكمال التحدي
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

            <div className="space-y-6">
              <Card className="bg-card shadow-md">
                <CardContent className="p-6 space-y-4">
                  <div className="flex items-center gap-3">
                    <Calendar className="w-5 h-5 text-primary" />
                    <div>
                      <p className="text-sm text-foreground/70">المدة المتبقية</p>
                      <p className="text-lg font-bold">{isExpired ? "انتهى" : `${daysLeft} يوم`}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Trophy className="w-5 h-5 text-amber-500" />
                    <div>
                      <p className="text-sm text-foreground/70">المكافأة</p>
                      <p className="text-lg font-bold">+{challenge.reward_xp} XP</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Award className="w-5 h-5 text-purple-500" />
                    <div>
                      <p className="text-sm text-foreground/70">ترتيبك</p>
                      <p className="text-lg font-bold">#{myRank || "-"}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Users className="w-5 h-5 text-blue-500" />
                    <div>
                      <p className="text-sm text-foreground/70">المشاركون</p>
                      <p className="text-lg font-bold">{leaderboard.length}</p>
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
        )}

        {/* لوحة الترتيب */}
        <Card className="bg-card shadow-md">
          <CardHeader>
            <CardTitle className="text-primary flex items-center gap-2">
              <Trophy className="w-6 h-6" />
              لوحة الترتيب
            </CardTitle>
          </CardHeader>
          <CardContent>
            {leaderboard.length === 0 ? (
              <div className="text-center py-8 text-foreground/70">لا يوجد مشاركون بعد</div>
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
                        isCurrentUser ? "bg-primary/10 border-2 border-primary" : "bg-muted/30"
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
                        <p className="font-medium">
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
        <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
  <AlertDialogContent>
    <AlertDialogHeader>
      <AlertDialogTitle>هل أنت متأكد من حذف التحدي؟</AlertDialogTitle>
      <AlertDialogDescription>
        سيتم حذف التحدي "{challenge.title}" وجميع بيانات المشاركين نهائياً. لا يمكن التراجع.
      </AlertDialogDescription>
    </AlertDialogHeader>
    <AlertDialogFooter>
      <AlertDialogCancel disabled={isDeleting}>إلغاء</AlertDialogCancel>
      <AlertDialogAction onClick={handleDeleteChallenge} disabled={isDeleting} className="bg-red-600 hover:bg-red-700">
        {isDeleting ? <><Loader2 className="w-4 h-4 animate-spin ml-2" /> جاري الحذف...</> : <><Trash2 className="w-4 h-4 ml-2" /> تأكيد الحذف</>}
      </AlertDialogAction>
    </AlertDialogFooter>
  </AlertDialogContent>
</AlertDialog>
      </motion.div>
    </div>
  );
}
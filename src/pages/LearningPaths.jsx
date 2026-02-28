import React, { useState, useEffect } from "react";
import { supabaseClient } from "@/components/api/supabaseClient";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Play, Loader2, ArrowLeft } from "lucide-react";
import { motion } from "framer-motion";
import { useToast } from "@/components/ui/use-toast";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

const DEFAULT_PATHS = [
  {
    path_name: "30 يوم لحفظ جزء عم",
    path_description: "خطة مكثفة لحفظ جزء عم كاملاً في شهر واحد",
    duration_days: 30,
    difficulty_level: "مبتدئ",
    target_words_count: 200,
    icon: "🌙",
    daily_goals: Array.from({length: 30}, (_, i) => ({
      day: i + 1, new_words: 7, review_words: 10, quizzes: 1
    }))
  },
  {
    path_name: "3 أشهر للمستوى المتقدم",
    path_description: "رحلة تعليمية شاملة للوصول للمستوى المتقدم",
    duration_days: 90,
    difficulty_level: "متقدم",
    target_words_count: 1000,
    icon: "🎓",
    daily_goals: Array.from({length: 90}, (_, i) => ({
      day: i + 1, new_words: 12, review_words: 20, quizzes: 2
    }))
  },
  {
    path_name: "أساسيات القرآن - 7 أيام",
    path_description: "تعلم الكلمات الأكثر تكراراً في القرآن",
    duration_days: 7,
    difficulty_level: "مبتدئ",
    target_words_count: 50,
    icon: "📖",
    daily_goals: Array.from({length: 7}, (_, i) => ({
      day: i + 1, new_words: 8, review_words: 5, quizzes: 1
    }))
  },
  {
    path_name: "رحلة الحفظ - 60 يوم",
    path_description: "خطة متوسطة لحفظ كلمات مختارة من القرآن",
    duration_days: 60,
    difficulty_level: "متوسط",
    target_words_count: 500,
    icon: "🚀",
    daily_goals: Array.from({length: 60}, (_, i) => ({
      day: i + 1, new_words: 9, review_words: 15, quizzes: 2
    }))
  }
];

const DIFFICULTY_CONFIG = {
  "مبتدئ": { stars: "⭐",      label: "طفل",    color: "bg-green-100 text-green-700 dark:bg-green-950/30 dark:text-green-400" },
  "متوسط": { stars: "⭐⭐",    color: "bg-amber-100 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400" },
  "متقدم": { stars: "⭐⭐⭐",  color: "bg-red-100 text-red-700 dark:bg-red-950/30 dark:text-red-400" },
};

// مكافأة تقديرية مشتقة من مدة المسار
const getRewards = (path) => ({
  stars: path.duration_days * 7,
  gems:  path.duration_days * 3,
});

export default function LearningPaths() {
  const { toast } = useToast();
  const [user, setUser]           = useState(null);
  const [paths, setPaths]         = useState([]);
  const [userPaths, setUserPaths] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => { loadPathsData(); }, []);

  const loadPathsData = async () => {
    try {
      const currentUser = await supabaseClient.auth.me();
      setUser(currentUser);

      let allPaths = await supabaseClient.entities.LearningPath.list();

      if (allPaths.length === 0) {
        for (const pathData of DEFAULT_PATHS) {
          await supabaseClient.entities.LearningPath.create(pathData);
        }
        allPaths = await supabaseClient.entities.LearningPath.list();
      }

      setPaths(allPaths);

      const enrolled = await supabaseClient.entities.UserLearningPath.filter({
        user_email: currentUser.email
      });
      setUserPaths(enrolled);

    } catch (error) {
      console.error("Error loading paths:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const isEnrolled  = (pathId) => userPaths.some(up => up.path_id === pathId);
  const getUserPath = (pathId) => userPaths.find(up => up.path_id === pathId);

  // المسار الموصى به: الأقصر مدةً بين المستوى مبتدئ
  const recommendedId = paths
    .filter(p => p.difficulty_level === "مبتدئ")
    .sort((a, b) => a.duration_days - b.duration_days)[0]?.id;

  const handleEnroll = async (path) => {
    try {
      await supabaseClient.entities.UserLearningPath.create({
        user_email:          user.email,
        path_id:             path.id,
        start_date:          new Date().toISOString(),
        current_day:         1,
        completed_days:      [],
        is_completed:        false,
        progress_percentage: 0
      });

      toast({
        title:       "🎉 تم التسجيل بنجاح!",
        description: `بدأت رحلتك في ${path.path_name}`,
        className:   "bg-green-100 text-green-800"
      });

      loadPathsData();
    } catch (error) {
      console.error("Error enrolling:", error);
      toast({
        title:   "❌ فشل التسجيل",
        description: "حدث خطأ، حاول مرة أخرى",
        variant: "destructive"
      });
    }
  };

  if (isLoading) {
    return (
      <div className="p-6 flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <Loader2 className="w-12 h-12 animate-spin text-primary" />
        <p className="text-foreground/60 text-lg">جارٍ تحميل المسارات...</p>
      </div>
    );
  }

  return (
    <div className="p-4 max-w-4xl mx-auto">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>

        {/* ── الهيدر ── */}
        <div className="text-center mb-8">
          <div className="text-6xl mb-3">🗺️</div>
          <h1 className="text-3xl font-bold gradient-text mb-1">المسارات التعليمية</h1>
          <p className="text-foreground/60 text-sm">اختر مسارك وابدأ رحلتك مع القرآن</p>
        </div>

        {/* ── شبكة البطاقات ── */}
        <div className="grid md:grid-cols-2 gap-5">
          {paths.map((path, index) => {
            const enrolled    = isEnrolled(path.id);
            const userPath    = getUserPath(path.id);
            const isRecommended = path.id === recommendedId && !enrolled;
            const difficulty  = DIFFICULTY_CONFIG[path.difficulty_level] || DIFFICULTY_CONFIG["مبتدئ"];
            const rewards     = getRewards(path);

            // لون الشريط العلوي والحدود بحسب الحالة
            const topBar = enrolled
              ? "from-green-400 to-emerald-500"
              : isRecommended
                ? "from-amber-400 to-yellow-500"
                : "from-primary/60 to-primary";

            const cardBorder = enrolled
              ? "border-2 border-green-400"
              : isRecommended
                ? "border-2 border-amber-400"
                : "border border-border";

            return (
              <motion.div
                key={path.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className={`overflow-hidden shadow-md h-full flex flex-col ${cardBorder}`}>

                  {/* شريط اللون العلوي */}
                  <div className={`h-3 bg-gradient-to-r ${topBar} flex-shrink-0`} />

                  <CardContent className="p-4 flex flex-col flex-1 gap-4">

                    {/* ── الرأس: الأيقونة + الاسم + badge موصى به ── */}
                    <div className="flex items-start gap-3">
                      <div className="text-5xl flex-shrink-0 leading-none">{path.icon}</div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2 flex-wrap">
                          <h2 className="font-bold text-lg text-foreground leading-tight">{path.path_name}</h2>
                          {isRecommended && (
                            <Badge className="bg-amber-100 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400 border-0 text-xs whitespace-nowrap flex-shrink-0">
                              ✨ موصى به
                            </Badge>
                          )}
                          {enrolled && (
                            <Badge className="bg-green-100 text-green-700 dark:bg-green-950/30 dark:text-green-400 border-0 text-xs whitespace-nowrap flex-shrink-0">
                              ✅ مسجّل
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-foreground/60 mt-1 line-clamp-2">{path.path_description}</p>
                      </div>
                    </div>

                    {/* ── تفاصيل المسار ── */}
                    <div className="flex flex-wrap gap-2">
                      <Badge variant="outline" className="gap-1 text-sm">
                        ⏱ {path.duration_days} يوم
                      </Badge>
                      <Badge variant="outline" className="gap-1 text-sm">
                        📖 {path.target_words_count} كلمة
                      </Badge>
                      <Badge className={`${difficulty.color} border-0 text-sm`}>
                        {difficulty.stars} {difficulty.label || path.difficulty_level}
                      </Badge>
                    </div>

                    {/* ── شريط التقدم (إذا مسجّل) ── */}
                    {enrolled && userPath && (
                      <div className="bg-green-50 dark:bg-green-950/20 rounded-2xl p-3 space-y-2">
                        <div className="flex justify-between text-sm font-medium">
                          <span className="text-foreground/70">اليوم {userPath.current_day} من {path.duration_days}</span>
                          <span className="text-green-700 dark:text-green-400 font-bold">
                            {userPath.progress_percentage || 0}%
                          </span>
                        </div>
                        <Progress value={userPath.progress_percentage || 0} className="h-4 rounded-full" />
                      </div>
                    )}

                    {/* ── معاينة المكافآت (إذا لم يُسجّل) ── */}
                    {!enrolled && (
                      <div className="flex gap-2 flex-wrap">
                        <span className="text-xs text-foreground/50">عند الإتمام:</span>
                        <Badge className="bg-amber-100 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400 border-0 text-xs">
                          ⭐ {rewards.stars} نجمة
                        </Badge>
                        <Badge className="bg-purple-100 text-purple-700 dark:bg-purple-950/30 dark:text-purple-400 border-0 text-xs">
                          💎 {rewards.gems} جوهرة
                        </Badge>
                      </div>
                    )}

                    {/* ── الزر الرئيسي ── */}
                    <div className="mt-auto">
                      {enrolled ? (
                        <Link to={createPageUrl("Learn")}>
                          <Button className="w-full gap-2 bg-gradient-to-r from-green-500 to-emerald-500 border-0 text-white font-bold text-base py-5 rounded-2xl shadow">
                            <ArrowLeft className="w-5 h-5" />
                            واصل رحلتك
                          </Button>
                        </Link>
                      ) : (
                        <Button
                          onClick={() => handleEnroll(path)}
                          className={`w-full gap-2 bg-gradient-to-r ${isRecommended ? "from-amber-400 to-yellow-500" : topBar} border-0 text-white font-bold text-base py-5 rounded-2xl shadow`}
                        >
                          <Play className="w-5 h-5" />
                          ابدأ المسار
                        </Button>
                      )}
                    </div>

                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>

      </motion.div>
    </div>
  );
}

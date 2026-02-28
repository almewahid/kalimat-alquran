import React, { useState, useEffect } from "react";
import { supabaseClient } from "@/components/api/supabaseClient";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";

const LEVEL_CONFIG = {
  "مبتدئ":      { emoji: "🌱", label: "طفل",   color: "bg-green-50 border-green-200",  badge: "bg-green-100 text-green-700",  banner: "from-green-100 to-green-200"  },
  "beginner":   { emoji: "🌱", label: "طفل",   color: "bg-green-50 border-green-200",  badge: "bg-green-100 text-green-700",  banner: "from-green-100 to-green-200"  },
  "متوسط":      { emoji: "📚", label: "متوسط", color: "bg-blue-50 border-blue-200",    badge: "bg-blue-100 text-blue-700",    banner: "from-blue-100 to-blue-200"    },
  "intermediate":{ emoji: "📚", label: "متوسط", color: "bg-blue-50 border-blue-200",    badge: "bg-blue-100 text-blue-700",    banner: "from-blue-100 to-blue-200"    },
  "متقدم":      { emoji: "🎓", label: "متقدم", color: "bg-purple-50 border-purple-200", badge: "bg-purple-100 text-purple-700", banner: "from-purple-100 to-purple-200" },
  "advanced":   { emoji: "🎓", label: "متقدم", color: "bg-purple-50 border-purple-200", badge: "bg-purple-100 text-purple-700", banner: "from-purple-100 to-purple-200" },
};

function getLevelConfig(level) {
  return LEVEL_CONFIG[level] || { emoji: "📖", color: "bg-amber-50 border-amber-200", badge: "bg-amber-100 text-amber-700", banner: "from-amber-100 to-amber-200" };
}

export default function Courses() {
  const [courses, setCourses] = useState([]);
  const [userProgress, setUserProgress] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCourses();
  }, []);

  const fetchCourses = async () => {
    try {
      const user = await supabaseClient.auth.me();
      const [allCourses, progressList] = await Promise.all([
        supabaseClient.entities.Course.filter({ is_active: true }, "-created_date"),
        supabaseClient.entities.UserCourseProgress.filter({ user_email: user.email })
      ]);

      setCourses(allCourses);

      const progressMap = {};
      progressList.forEach(p => {
        progressMap[p.course_id] = p;
      });
      setUserProgress(progressMap);

    } catch (error) {
      console.error("Error fetching courses:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6 flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <motion.div
          animate={{ scale: [1, 1.15, 1] }}
          transition={{ repeat: Infinity, duration: 1.4 }}
          className="text-6xl"
        >
          📚
        </motion.div>
        <p className="text-lg font-semibold text-muted-foreground">جاري تحميل الدورات...</p>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-6">

      {/* Header */}
      <div className="text-center">
        <div className="text-5xl mb-2">🎓</div>
        <h1 className="text-3xl font-bold text-foreground mb-1">الدورات التعليمية</h1>
        <p className="text-sm text-muted-foreground">مسارات منظمة لتعلم كلمات القرآن مع شهادات إتمام</p>
      </div>

      {/* Courses Grid */}
      {courses.length === 0 ? (
        <div className="text-center py-16 flex flex-col items-center gap-4">
          <span className="text-8xl">🌱</span>
          <p className="text-xl font-bold text-foreground/70">لا توجد دورات متاحة حالياً</p>
          <p className="text-sm text-muted-foreground">تابعنا للحصول على دورات جديدة قريباً!</p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {courses.map((course) => {
            const progress    = userProgress[course.id];
            const totalWords  = course.words_ids?.length || 0;
            const completed   = progress?.completed_words_count || 0;
            const percent     = totalWords > 0 ? Math.round((completed / totalWords) * 100) : 0;
            const isCompleted = progress?.is_completed;
            const cfg         = getLevelConfig(course.level);

            return (
              <Card key={course.id} className={`rounded-2xl border-2 overflow-hidden flex flex-col hover:shadow-md transition-all ${cfg.color}`}>

                {/* Banner */}
                <div className={`h-28 bg-gradient-to-br ${cfg.banner} flex flex-col items-center justify-center relative`}>
                  {course.image_url ? (
                    <img src={course.image_url} alt={course.title} className="w-full h-full object-cover absolute inset-0" />
                  ) : (
                    <span className="text-5xl">{cfg.emoji}</span>
                  )}
                  {isCompleted && (
                    <div className="absolute top-2 right-2 bg-green-500 text-white text-xs font-bold px-2 py-1 rounded-xl">
                      ✅ مكتملة
                    </div>
                  )}
                  <div className="absolute top-2 left-2">
                    <Badge className={`text-xs font-bold border-0 ${cfg.badge}`}>{cfg.label || course.level || "عام"}</Badge>
                  </div>
                </div>

                <CardContent className="p-4 flex-1 space-y-3">
                  <div>
                    <h2 className="font-bold text-foreground text-base leading-tight">{course.title}</h2>
                    {course.description && (
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{course.description}</p>
                    )}
                  </div>

                  {/* Progress */}
                  <div>
                    <div className="flex justify-between text-xs text-muted-foreground mb-1">
                      <span>📖 {completed}/{totalWords} كلمة</span>
                      <span className="font-bold">{percent}%</span>
                    </div>
                    <Progress value={percent} className="h-3 rounded-full" />
                  </div>

                  {course.enable_certificate && (
                    <p className="text-xs text-amber-600 font-semibold">🏆 شهادة إتمام متاحة</p>
                  )}
                </CardContent>

                <CardFooter className="p-4 pt-0 flex gap-2">
                  {isCompleted ? (
                    <>
                      <Button asChild className="flex-1 rounded-2xl font-bold h-10 bg-green-600 hover:bg-green-700">
                        <Link to={`/CourseDetail?id=${course.id}`}>✅ مراجعة</Link>
                      </Button>
                      {course.enable_certificate && (
                        <Button asChild variant="outline" className="flex-1 rounded-2xl font-bold h-10 border-2 border-amber-400 text-amber-700 hover:bg-amber-50">
                          <Link to={`/CertificateView?id=${progress.certificate_id || 'preview'}`}>🏆 الشهادة</Link>
                        </Button>
                      )}
                    </>
                  ) : (
                    <Button asChild className="w-full rounded-2xl font-bold h-10">
                      <Link to={`/CourseDetail?id=${course.id}`}>
                        {percent > 0 ? "▶️ أكمل التعلم" : "🚀 ابدأ التعلم"}
                      </Link>
                    </Button>
                  )}
                </CardFooter>
              </Card>
            );
          })}
        </div>
      )}

    </div>
  );
}

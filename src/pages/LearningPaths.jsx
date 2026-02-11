import React, { useState, useEffect } from "react";
import { supabaseClient } from "@/components/api/supabaseClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Map, Clock, Target, CheckCircle, Play, Trophy, Calendar, Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import { useToast } from "@/components/ui/use-toast";

const DEFAULT_PATHS = [
  {
    path_name: "30 يوم لحفظ جزء عم",
    path_description: "خطة مكثفة لحفظ جزء عم كاملاً في شهر واحد",
    duration_days: 30,
    difficulty_level: "مبتدئ",
    target_words_count: 200,
    icon: "🌙",
    daily_goals: Array.from({length: 30}, (_, i) => ({
      day: i + 1,
      new_words: 7,
      review_words: 10,
      quizzes: 1
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
      day: i + 1,
      new_words: 12,
      review_words: 20,
      quizzes: 2
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
      day: i + 1,
      new_words: 8,
      review_words: 5,
      quizzes: 1
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
      day: i + 1,
      new_words: 9,
      review_words: 15,
      quizzes: 2
    }))
  }
];

export default function LearningPaths() {
  const { toast } = useToast();
  const [user, setUser] = useState(null);
  const [paths, setPaths] = useState([]);
  const [userPaths, setUserPaths] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadPathsData();
  }, []);

  const loadPathsData = async () => {
    try {
      const currentUser = await supabaseClient.supabase.auth.getUser();
      setUser(currentUser);

      let allPaths = await supabaseClient.entities.LearningPath.list();
      
      if (allPaths.length === 0) {
        for (const pathData of DEFAULT_PATHS) {
          await supabaseClient.entities.LearningPath.create(pathData);
        }
        allPaths = await supabaseClient.entities.LearningPath.list();
      }
      
      setPaths(allPaths);

      const enrolled = await supabaseClient.entities.UserLearningPath.filter({ user_email: currentUser.email });
      setUserPaths(enrolled);

    } catch (error) {
      console.error("Error loading paths:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const isEnrolled = (pathId) => {
    return userPaths.some(up => up.path_id === pathId);
  };

  const getUserPath = (pathId) => {
    return userPaths.find(up => up.path_id === pathId);
  };

  const handleEnroll = async (path) => {
    try {
      await supabaseClient.entities.UserLearningPath.create({
        user_email: user.email,
        path_id: path.id,
        start_date: new Date().toISOString(),
        current_day: 1,
        completed_days: [],
        is_completed: false,
        progress_percentage: 0
      });

      toast({
        title: "🎉 تم التسجيل بنجاح!",
        description: `بدأت رحلتك في ${path.path_name}`,
        className: "bg-green-100 text-green-800"
      });

      loadPathsData();

    } catch (error) {
      console.error("Error enrolling in path:", error);
      toast({
        title: "❌ فشل التسجيل",
        description: "حدث خطأ، حاول مرة أخرى",
        variant: "destructive"
      });
    }
  };

  const getDifficultyColor = (level) => {
    switch (level) {
      case "مبتدئ": return "bg-green-100 text-green-700";
      case "متوسط": return "bg-yellow-100 text-yellow-700";
      case "متقدم": return "bg-red-100 text-red-700";
      default: return "bg-gray-100 text-gray-700";
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
    <div className="p-6 max-w-7xl mx-auto">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
        <div className="text-center mb-8">
          <Map className="w-16 h-16 text-primary mx-auto mb-4" />
          <h1 className="text-4xl font-bold gradient-text mb-2">المسارات التعليمية</h1>
          <p className="text-foreground/70">خطط منظمة لتحقيق أهدافك</p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {paths.map((path, index) => {
            const enrolled = isEnrolled(path.id);
            const userPath = getUserPath(path.id);

            return (
              <motion.div
                key={path.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className={`bg-card shadow-md ${enrolled ? 'border-2 border-primary' : ''}`}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="text-5xl">{path.icon}</div>
                        <div className="flex-1 max-w-full overflow-hidden">
                          <CardTitle className="text-xl break-words">{path.path_name}</CardTitle>
                          <p className="text-sm text-foreground/70 mt-1 break-words">{path.path_description}</p>
                        </div>
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-4">
                    <div className="flex flex-wrap gap-2">
                      <Badge variant="outline" className="gap-1">
                        <Clock className="w-3 h-3" />
                        {path.duration_days} يوم
                      </Badge>
                      <Badge variant="outline" className="gap-1">
                        <Target className="w-3 h-3" />
                        {path.target_words_count} كلمة
                      </Badge>
                      <Badge className={getDifficultyColor(path.difficulty_level)}>
                        {path.difficulty_level}
                      </Badge>
                    </div>

                    {enrolled && userPath && (
                      <div className="space-y-2 max-h-64 overflow-y-auto">
                        <div className="flex justify-between text-sm">
                          <span>التقدم</span>
                          <span>{userPath.progress_percentage || 0}%</span>
                        </div>
                        <Progress value={userPath.progress_percentage || 0} />
                        <p className="text-sm text-foreground/70">
                          اليوم {userPath.current_day} من {path.duration_days}
                        </p>
                      </div>
                    )}

                    <Button
                      onClick={() => !enrolled && handleEnroll(path)}
                      disabled={enrolled}
                      className="w-full"
                    >
                      {enrolled ? (
                        <><CheckCircle className="w-4 h-4 ml-2" />مسجل بالفعل</>
                      ) : (
                        <><Play className="w-4 h-4 ml-2" />ابدأ المسار</>
                      )}
                    </Button>
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
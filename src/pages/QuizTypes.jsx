import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Brain, BookOpen, Target, Zap, Trophy, Clock, Settings } from "lucide-react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { base44 } from "@/api/base44Client";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

const createPageUrl = (pageName) => `/${pageName}`;

const allQuizTypes = [
  {
    id: "normal",
    title: "اختبار عادي",
    description: "اختبر معرفتك بمعاني الكلمات القرآنية",
    icon: Brain,
    color: "from-blue-500 to-cyan-500",
    link: createPageUrl("Quiz"),
    levels: ["مبتدئ", "متوسط", "متقدم"],
    difficulty: "سهل",
    hasPracticeMode: true
  },
  {
    id: "roots",
    title: "اختبار الجذور",
    description: "اختبر معرفتك بجذور الكلمات",
    icon: Target,
    color: "from-green-500 to-emerald-500",
    link: createPageUrl("RootQuiz"),
    levels: ["متوسط", "متقدم"],
    difficulty: "متوسط",
    hasPracticeMode: true
  },
  {
    id: "context",
    title: "اختبار السياق",
    description: "اختبر فهمك للكلمات في سياق الآيات",
    icon: BookOpen,
    color: "from-purple-500 to-pink-500",
    link: createPageUrl("ContextQuiz"),
    levels: ["متوسط", "متقدم"],
    difficulty: "متوسط",
    hasPracticeMode: true
  },
  {
    id: "matching",
    title: "اختبار المطابقة",
    description: "طابق الكلمات مع معانيها بسرعة",
    icon: Zap,
    color: "from-yellow-500 to-orange-500",
    link: createPageUrl("Quiz"),
    levels: ["مبتدئ", "متوسط", "متقدم"],
    difficulty: "سهل",
    badge: "جديد",
    hasPracticeMode: true
  },
  {
    id: "speed",
    title: "اختبار السرعة",
    description: "اختبار سريع - 30 ثانية لكل سؤال",
    icon: Clock,
    color: "from-red-500 to-pink-500",
    link: createPageUrl("Quiz"),
    levels: ["متوسط", "متقدم"],
    difficulty: "صعب",
    badge: "تحدي",
    hasPracticeMode: false
  },
  {
    id: "championship",
    title: "اختبار البطولة",
    description: "اختبار شامل لجميع المهارات - احصل على لقب",
    icon: Trophy,
    color: "from-amber-500 to-yellow-600",
    link: createPageUrl("Quiz"),
    levels: ["متقدم"],
    difficulty: "خبير",
    badge: "🏆",
    hasPracticeMode: false
  }
];

const SURAHS = [
  "الفاتحة", "البقرة", "آل عمران", "النساء", "المائدة", "الأنعام", "الأعراف", "الأنفال", "التوبة", "يونس"
  // يمكن إضافة المزيد...
];

export default function QuizTypes() {
  const [userLevel, setUserLevel] = useState("متوسط");
  const [practiceModeOpen, setPracticeModeOpen] = useState(false);
  const [selectedQuiz, setSelectedQuiz] = useState(null);
  const [practiceOptions, setPracticeOptions] = useState({
    selectedJuz: [],
    selectedSurahs: [],
    selectedCategories: []
  });

  useEffect(() => {
    loadUserLevel();
  }, []);

  const loadUserLevel = async () => {
    try {
      const user = await base44.auth.me();
      const level = user?.preferences?.learning_level || "متوسط";
      setUserLevel(level);
    } catch (error) {
      console.error("Error loading user level:", error);
    }
  };

  const availableQuizzes = allQuizTypes.filter(quiz => 
    quiz.levels.includes(userLevel)
  );

  const handlePracticeMode = (quiz) => {
    setSelectedQuiz(quiz);
    setPracticeModeOpen(true);
  };

  const handleStartPractice = () => {
    // يمكن إضافة المنطق لحفظ خيارات التمرين وبدء الاختبار
    console.log("Practice options:", practiceOptions);
    setPracticeModeOpen(false);
    // التوجيه إلى صفحة الاختبار مع الخيارات
    window.location.href = `${selectedQuiz?.link}?practice=true`;
  };

  const toggleJuz = (juz) => {
    setPracticeOptions(prev => ({
      ...prev,
      selectedJuz: prev.selectedJuz.includes(juz)
        ? prev.selectedJuz.filter(j => j !== juz)
        : [...prev.selectedJuz, juz]
    }));
  };

  const toggleSurah = (surah) => {
    setPracticeOptions(prev => ({
      ...prev,
      selectedSurahs: prev.selectedSurahs.includes(surah)
        ? prev.selectedSurahs.filter(s => s !== surah)
        : [...prev.selectedSurahs, surah]
    }));
  };

  const toggleCategory = (category) => {
    setPracticeOptions(prev => ({
      ...prev,
      selectedCategories: prev.selectedCategories.includes(category)
        ? prev.selectedCategories.filter(c => c !== category)
        : [...prev.selectedCategories, category]
    }));
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-8"
      >
        <h1 className="text-4xl font-bold gradient-text mb-3">اختر نوع الاختبار</h1>
        <p className="text-foreground/70 text-lg">اختر النوع المناسب لك واختبر مهاراتك</p>
        <p className="text-primary text-sm mt-2">مستواك الحالي: <strong>{userLevel}</strong></p>
      </motion.div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {availableQuizzes.map((quiz, index) => (
          <motion.div
            key={quiz.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card className="hover:shadow-xl transition-all duration-300 hover:-translate-y-2 overflow-hidden group relative">
              <div className={`h-2 bg-gradient-to-r ${quiz.color}`}></div>
              
              {quiz.badge && (
                <div className="absolute top-4 left-4 z-10">
                  <span className="px-3 py-1 bg-white dark:bg-gray-800 text-primary font-bold text-xs rounded-full shadow-lg">
                    {quiz.badge}
                  </span>
                </div>
              )}
              
              <CardHeader>
                <div className={`w-16 h-16 rounded-full bg-gradient-to-br ${quiz.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                  <quiz.icon className="w-8 h-8 text-white" />
                </div>
                <CardTitle className="text-xl flex items-center gap-2">
                  {quiz.title}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-foreground/70 mb-3">{quiz.description}</p>
                
                <div className="flex items-center gap-2 mb-4">
                  <span className="text-xs px-2 py-1 rounded-full bg-primary/10 text-primary font-medium">
                    {quiz.difficulty}
                  </span>
                </div>
                
                <div className="flex gap-2">
                  <Link to={quiz.link} className="flex-1">
                    <Button className={`w-full bg-gradient-to-r ${quiz.color} hover:opacity-90 text-white border-0`}>
                      ابدأ الاختبار
                    </Button>
                  </Link>
                  
                  {quiz.hasPracticeMode && (
                    <Dialog open={practiceModeOpen && selectedQuiz?.id === quiz.id} onOpenChange={setPracticeModeOpen}>
                      <DialogTrigger asChild>
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => handlePracticeMode(quiz)}
                          title="وضع التمرين"
                        >
                          <Settings className="w-5 h-5" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                        <DialogHeader>
                          <DialogTitle>⚙️ وضع التمرين - {quiz.title}</DialogTitle>
                          <DialogDescription>
                            اختر المواضيع أو مجموعات الكلمات التي تريد التركيز عليها
                          </DialogDescription>
                        </DialogHeader>
                        
                        <div className="space-y-6 py-4">
                          {/* اختيار الأجزاء */}
                          <div>
                            <h3 className="font-semibold mb-3">اختر الأجزاء:</h3>
                            <div className="grid grid-cols-5 gap-2">
                              {Array.from({ length: 30 }, (_, i) => i + 1).map(juz => (
                                <div key={juz} className="flex items-center">
                                  <Checkbox
                                    id={`juz-${juz}`}
                                    checked={practiceOptions.selectedJuz.includes(juz)}
                                    onCheckedChange={() => toggleJuz(juz)}
                                  />
                                  <Label htmlFor={`juz-${juz}`} className="mr-2 cursor-pointer">
                                    {juz}
                                  </Label>
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* اختيار السور */}
                          <div>
                            <h3 className="font-semibold mb-3">اختر السور:</h3>
                            <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto">
                              {SURAHS.map((surah, idx) => (
                                <div key={surah} className="flex items-center">
                                  <Checkbox
                                    id={`surah-${idx}`}
                                    checked={practiceOptions.selectedSurahs.includes(surah)}
                                    onCheckedChange={() => toggleSurah(surah)}
                                  />
                                  <Label htmlFor={`surah-${idx}`} className="mr-2 cursor-pointer text-sm">
                                    {idx + 1}. {surah}
                                  </Label>
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* اختيار الفئات */}
                          <div>
                            <h3 className="font-semibold mb-3">اختر الفئات:</h3>
                            <div className="grid grid-cols-2 gap-2">
                              {["أسماء", "أفعال", "صفات", "حروف", "أخرى"].map(category => (
                                <div key={category} className="flex items-center">
                                  <Checkbox
                                    id={`cat-${category}`}
                                    checked={practiceOptions.selectedCategories.includes(category)}
                                    onCheckedChange={() => toggleCategory(category)}
                                  />
                                  <Label htmlFor={`cat-${category}`} className="mr-2 cursor-pointer">
                                    {category}
                                  </Label>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>

                        <div className="flex gap-2">
                          <Button onClick={handleStartPractice} className="flex-1 bg-primary">
                            ابدأ التمرين
                          </Button>
                          <Button variant="outline" onClick={() => setPracticeModeOpen(false)}>
                            إلغاء
                          </Button>
                        </div>
                      </DialogContent>
                    </Dialog>
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {availableQuizzes.length === 0 && (
        <div className="text-center py-12">
          <p className="text-foreground/70 text-lg">لا توجد اختبارات متاحة لمستواك الحالي.</p>
        </div>
      )}
    </div>
  );
}
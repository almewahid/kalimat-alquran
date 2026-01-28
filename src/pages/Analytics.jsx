
import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { 
  Users, BookOpen, Brain, Trophy, TrendingUp, 
  Calendar, Zap, Target, BarChart3, PieChart
} from "lucide-react";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, 
  PieChart as RePieChart, Pie, Cell, ResponsiveContainer, LineChart, Line
} from "recharts";
import { motion } from "framer-motion";

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];
const SURAHS = [
  "الفاتحة", "البقرة", "آل عمران", "النساء", "المائدة", "الأنعام", "الأعراف", "الأنفال", "التوبة", "يونس",
  "هود", "يوسف", "الرعد", "إبراهيم", "الحجر", "النحل", "الإسراء", "الكهف", "مريم", "طه",
  "الأنبياء", "الحج", "المؤمنون", "النور", "الفرقان", "الشعراء", "النمل", "القصص", "العنكبوت", "الروم",
  "لقمان", "السجدة", "الأحزاب", "سبأ", "فاطر", "يس", "الصافات", "ص", "الزمر", "غافر",
  "فصلت", "الشورى", "الزخرف", "الدخان", "الجاثية", "الأحقاف", "محمد", "الفتح", "الحجرات", "ق",
  "الذاريات", "الطور", "النجم", "القمر", "الرحمن", "الواقعة", "الحديد", "المجادلة", "الحشر", "الممتحنة",
  "الصف", "الجمعة", "المنافقون", "التغابن", "الطلاق", "التحريم", "الملك", "القلم", "الحاقة", "المعارج",
  "نوح", "الجن", "المزمل", "المدثر", "القيامة", "الإنسان", "المرسلات", "النبأ", "النازعات", "عبس",
  "التكوير", "الانفطار", "المطففين", "الانشقاق", "البروج", "الطارق", "الأعلى", "الغاشية", "الفجر", "البلد",
  "الشمس", "الليل", "الضحى", "الشرح", "التين", "العلق", "القدر", "البينة", "الزلزلة", "العاديات",
  "القارعة", "التكاثر", "العصر", "الهمزة", "الفيل", "قريش", "الماعون", "الكوثر", "الكافرون", "النصر",
  "المسد", "الإخلاص", "الفلق", "الناس"
];

export default function Analytics() {
  const [isLoading, setIsLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  
  // Users Stats
  const [totalUsers, setTotalUsers] = useState(0);
  const [activeUsers, setActiveUsers] = useState(0);
  const [newUsersThisWeek, setNewUsersThisWeek] = useState(0);
  
  // Words Stats
  const [totalWords, setTotalWords] = useState(0);
  const [wordsBySurah, setWordsBySurah] = useState([]);
  const [wordsByJuz, setWordsByJuz] = useState([]);
  const [wordsByDifficulty, setWordsByDifficulty] = useState([]);
  const [wordsByCategory, setWordsByCategory] = useState([]);
  
  // Quiz Stats
  const [totalQuizzes, setTotalQuizzes] = useState(0);
  const [averageScore, setAverageScore] = useState(0);
  const [quizzesThisWeek, setQuizzesThisWeek] = useState([]);
  
  // Engagement Stats
  const [avgSessionTime, setAvgSessionTime] = useState(0);
  const [dailyActiveUsers, setDailyActiveUsers] = useState([]);

  useEffect(() => {
    checkAdminAndLoadData();
  }, []);

  const checkAdminAndLoadData = async () => {
    try {
      const user = await base44.auth.me();
      if (user.role !== 'admin') {
        setIsAdmin(false);
        setIsLoading(false);
        return;
      }
      setIsAdmin(true);
      await loadAnalytics();
    } catch (error) {
      console.error("Error checking admin:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadAnalytics = async () => {
    try {
      // Load Users
      const users = await base44.entities.User.list();
      setTotalUsers(users.length);
      
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      const newUsers = users.filter(u => new Date(u.created_date) >= weekAgo);
      setNewUsersThisWeek(newUsers.length);
      
      // Load Words
      const words = await base44.entities.QuranicWord.list();
      setTotalWords(words.length);
      
      // Words by Surah (top 10)
      const surahCount = {};
      words.forEach(word => {
        surahCount[word.surah_name] = (surahCount[word.surah_name] || 0) + 1;
      });
      const topSurahs = Object.entries(surahCount)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
        .map(([name, count]) => ({ name, count }));
      setWordsBySurah(topSurahs);
      
      // Words by Juz
      const juzCount = {};
      words.forEach(word => {
        const juz = word.juz_number || 1;
        juzCount[juz] = (juzCount[juz] || 0) + 1;
      });
      const juzData = Object.entries(juzCount)
        .map(([juz, count]) => ({ juz: `الجزء ${juz}`, count }))
        .sort((a, b) => parseInt(a.juz.split(' ')[1]) - parseInt(b.juz.split(' ')[1]));
      setWordsByJuz(juzData);
      
      // Words by Difficulty
      const difficultyCount = {
        "مبتدئ": 0,
        "متوسط": 0,
        "متقدم": 0
      };
      words.forEach(word => {
        const diff = word.difficulty_level || "مبتدئ";
        difficultyCount[diff] = (difficultyCount[diff] || 0) + 1;
      });
      setWordsByDifficulty([
        { name: "مبتدئ", value: difficultyCount["مبتدئ"] },
        { name: "متوسط", value: difficultyCount["متوسط"] },
        { name: "متقدم", value: difficultyCount["متقدم"] }
      ]);
      
      // Words by Category
      const categoryCount = {
        "أسماء": 0,
        "أفعال": 0,
        "صفات": 0,
        "حروف": 0,
        "أخرى": 0
      };
      words.forEach(word => {
        const cat = word.category || "أخرى";
        categoryCount[cat] = (categoryCount[cat] || 0) + 1;
      });
      setWordsByCategory([
        { name: "أسماء", value: categoryCount["أسماء"] },
        { name: "أفعال", value: categoryCount["أفعال"] },
        { name: "صفات", value: categoryCount["صفات"] },
        { name: "حروف", value: categoryCount["حروف"] },
        { name: "أخرى", value: categoryCount["أخرى"] }
      ]);
      
      // Load Quizzes
      const quizzes = await base44.entities.QuizSession.list();
      setTotalQuizzes(quizzes.length);
      
      const validScores = quizzes.filter(q => typeof q.score === 'number').map(q => q.score);
      const avg = validScores.length > 0 
        ? Math.round(validScores.reduce((sum, score) => sum + score, 0) / validScores.length)
        : 0;
      setAverageScore(avg);
      
      // Quizzes this week
      const quizzesThisWeekData = quizzes.filter(q => new Date(q.created_date) >= weekAgo);
      const dailyQuizzes = {};
      quizzesThisWeekData.forEach(q => {
        const date = q.created_date?.split('T')[0];
        if (date) {
          dailyQuizzes[date] = (dailyQuizzes[date] || 0) + 1;
        }
      });
      const quizChartData = Object.entries(dailyQuizzes)
        .map(([date, count]) => ({ date, count }))
        .sort((a, b) => a.date.localeCompare(b.date));
      setQuizzesThisWeek(quizChartData);
      
      // Active Users (last 7 days)
      const activeUsersData = await Promise.all(
        users.map(async (user) => {
          const progress = await base44.entities.UserProgress.filter({ created_by: user.email });
          if (progress.length > 0 && progress[0].last_login_date) {
            return { email: user.email, lastLogin: progress[0].last_login_date };
          }
          return null;
        })
      );
      
      const activeCount = activeUsersData.filter(u => 
        u && new Date(u.lastLogin) >= weekAgo
      ).length;
      setActiveUsers(activeCount);
      
      // Daily Active Users
      const dailyActive = {};
      activeUsersData.forEach(u => {
        if (u && new Date(u.lastLogin) >= weekAgo) {
          const date = u.lastLogin;
          dailyActive[date] = (dailyActive[date] || 0) + 1;
        }
      });
      const dauData = Object.entries(dailyActive)
        .map(([date, count]) => ({ date, count }))
        .sort((a, b) => a.date.localeCompare(b.date));
      setDailyActiveUsers(dauData);
      
    } catch (error) {
      console.error("Error loading analytics:", error);
    }
  };

  if (isLoading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-primary">جارٍ تحميل البيانات...</p>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="p-6 max-w-2xl mx-auto">
        <Card className="bg-red-50 border-red-200">
          <CardContent className="p-8 text-center">
            <p className="text-red-700 text-lg font-semibold">⛔ غير مصرح</p>
            <p className="text-red-600 mt-2">هذه الصفحة متاحة للمسؤولين فقط.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center gap-3 mb-8">
          <BarChart3 className="w-10 h-10 text-primary" />
          <div>
            <h1 className="text-3xl font-bold gradient-text">📊 التحليلات المتقدمة</h1>
            <p className="text-foreground/70">مؤشرات الأداء الرئيسية</p>
          </div>
        </div>

        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">نظرة عامة</TabsTrigger>
            <TabsTrigger value="users">المستخدمون</TabsTrigger>
            <TabsTrigger value="words">📚 الكلمات</TabsTrigger>
            <TabsTrigger value="engagement">التفاعل</TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <Card className="bg-gradient-to-br from-blue-50 to-cyan-50 border-blue-200">
                <CardContent className="p-6 text-center">
                  <Users className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                  <div className="text-3xl font-bold text-blue-900">{totalUsers}</div>
                  <p className="text-sm text-blue-700 mt-1">إجمالي المستخدمين</p>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
                <CardContent className="p-6 text-center">
                  <BookOpen className="w-8 h-8 text-green-600 mx-auto mb-2" />
                  <div className="text-3xl font-bold text-green-900">{totalWords}</div>
                  <p className="text-sm text-green-700 mt-1">إجمالي الكلمات</p>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-purple-50 to-pink-50 border-purple-200">
                <CardContent className="p-6 text-center">
                  <Brain className="w-8 h-8 text-purple-600 mx-auto mb-2" />
                  <div className="text-3xl font-bold text-purple-900">{totalQuizzes}</div>
                  <p className="text-sm text-purple-700 mt-1">إجمالي الاختبارات</p>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-amber-50 to-orange-50 border-amber-200">
                <CardContent className="p-6 text-center">
                  <Target className="w-8 h-8 text-amber-600 mx-auto mb-2" />
                  <div className="text-3xl font-bold text-amber-900">{averageScore}%</div>
                  <p className="text-sm text-amber-700 mt-1">متوسط النتائج</p>
                </CardContent>
              </Card>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>الاختبارات الأسبوعية</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={quizzesThisWeek}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Line type="monotone" dataKey="count" stroke="#8884d8" name="الاختبارات" />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>المستخدمون النشطون يومياً</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={dailyActiveUsers}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="count" fill="#82ca9d" name="المستخدمون" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="users">
            <div className="grid md:grid-cols-3 gap-6 mb-8">
              <Card>
                <CardContent className="p-6 text-center">
                  <Users className="w-8 h-8 text-primary mx-auto mb-2" />
                  <div className="text-3xl font-bold text-foreground">{totalUsers}</div>
                  <p className="text-sm text-foreground/70 mt-1">إجمالي المستخدمين</p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6 text-center">
                  <Zap className="w-8 h-8 text-green-500 mx-auto mb-2" />
                  <div className="text-3xl font-bold text-foreground">{activeUsers}</div>
                  <p className="text-sm text-foreground/70 mt-1">مستخدم نشط (7 أيام)</p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6 text-center">
                  <TrendingUp className="w-8 h-8 text-blue-500 mx-auto mb-2" />
                  <div className="text-3xl font-bold text-foreground">{newUsersThisWeek}</div>
                  <p className="text-sm text-foreground/70 mt-1">مستخدم جديد هذا الأسبوع</p>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>المستخدمون النشطون يومياً</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={400}>
                  <LineChart data={dailyActiveUsers}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="count" stroke="#8884d8" name="المستخدمون النشطون" />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="words">
            <div className="mb-8">
              <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
                <CardContent className="p-8 text-center">
                  <BookOpen className="w-16 h-16 text-green-600 mx-auto mb-4" />
                  <div className="text-5xl font-bold text-green-900">{totalWords}</div>
                  <p className="text-lg text-green-700 mt-2">إجمالي الكلمات في القاعدة</p>
                </CardContent>
              </Card>
            </div>

            {/* تقسيمات الكلمات */}
            <div className="grid md:grid-cols-2 gap-6 mb-8">
              <Card>
                <CardHeader>
                  <CardTitle>📖 الكلمات حسب مستوى الصعوبة</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {wordsByDifficulty.map((item, index) => {
                      const percentage = totalWords > 0 ? Math.round((item.value / totalWords) * 100) : 0;
                      return (
                        <div key={`difficulty-${index}`}>
                          <div className="flex justify-between mb-1">
                            <span className="font-medium">{item.name}</span>
                            <span className="text-foreground/70">{item.value} ({percentage}%)</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-primary h-2 rounded-full transition-all duration-500"
                              style={{ width: `${percentage}%` }}
                            ></div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>🏷️ الكلمات حسب التصنيف</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {wordsByCategory.map((item, index) => {
                      const percentage = totalWords > 0 ? Math.round((item.value / totalWords) * 100) : 0;
                      return (
                        <div key={`category-${index}`}>
                          <div className="flex justify-between mb-1">
                            <span className="font-medium">{item.name}</span>
                            <span className="text-foreground/70">{item.value} ({percentage}%)</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-secondary h-2 rounded-full transition-all duration-500"
                              style={{ width: `${percentage}%` }}
                            ></div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>📚 أكثر 10 سور بالكلمات</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={400}>
                    <BarChart data={wordsBySurah} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis type="number" />
                      <YAxis dataKey="name" type="category" width={100} />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="count" fill="#82ca9d" name="عدد الكلمات" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>🔢 الكلمات حسب الأجزاء</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={400}>
                    <BarChart data={wordsByJuz}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="juz" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="count" fill="#8884d8" name="عدد الكلمات" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="engagement">
            <div className="grid md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>الاختبارات الأسبوعية</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={quizzesThisWeek}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="count" fill="#8884d8" name="الاختبارات" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>معلومات عامة</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center p-4 bg-background-soft rounded-lg">
                      <span className="text-foreground/80">متوسط النتائج</span>
                      <Badge className="text-lg">{averageScore}%</Badge>
                    </div>
                    <div className="flex justify-between items-center p-4 bg-background-soft rounded-lg">
                      <span className="text-foreground/80">إجمالي الاختبارات</span>
                      <Badge className="text-lg">{totalQuizzes}</Badge>
                    </div>
                    <div className="flex justify-between items-center p-4 bg-background-soft rounded-lg">
                      <span className="text-foreground/80">مستخدم نشط (7 أيام)</span>
                      <Badge className="text-lg">{activeUsers}</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </motion.div>
    </div>
  );
}

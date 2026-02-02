import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabaseClient } from "@/components/api/supabaseClient";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
  AreaChart,
  Area
} from "recharts";
import { 
  Loader2, 
  TrendingUp, 
  Users, 
  Award, 
  BookOpen, 
  Target, 
  Calendar,
  Download,
  Share2,
  AlertCircle,
  CheckCircle2,
  Lightbulb
} from "lucide-react";
import ShareButton from "@/components/common/ShareButton";
import { motion } from "framer-motion";

export default function Reports() {
  const [activeTab, setActiveTab] = useState("overview");

  const { data, isLoading, error } = useQuery({
    queryKey: ["reportsData"],
    queryFn: async () => {
      const response = await supabaseClient.functions.invoke("getReportsData");
      return response.data;
    }
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-12 h-12 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 text-center">
        <p className="text-red-500">حدث خطأ أثناء تحميل التقرير. يرجى المحاولة لاحقاً.</p>
      </div>
    );
  }

  const { stats, averages, history, suggestions } = data;

  // Comparison Data for Charts
  const comparisonData = [
    { name: "الكلمات المتعلمة", user: stats.wordsLearned, avg: averages.words },
    { name: "نقاط الخبرة (XP)", user: stats.totalXP, avg: averages.xp },
  ];

  const quizComparisonData = [
    { name: "دقة الإجابات", user: stats.quizAvg, avg: averages.quizAvg }
  ];

  // App details for sharing
  const appShareUrl = window.location.origin;
  const storeUrl = "https://play.google.com/store/apps/details?id=com.kalimat.quran";
  
  const shareText = `
📊 تقريري في تطبيق كلمات القرآن:
✨ المستوى: ${stats.level}
📚 الكلمات المتعلمة: ${stats.wordsLearned}
🏆 النقاط: ${stats.totalXP}
🔥 التتابع اليومي: ${stats.streak} يوم

انضم إلي وابدأ رحلة تعلم كلمات القرآن!
حمل التطبيق: ${storeUrl}
أو زر موقعنا: ${appShareUrl}
  `.trim();

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold gradient-text flex items-center gap-2">
              <TrendingUp className="w-8 h-8 text-primary" />
              التقارير والإحصائيات
            </h1>
            <p className="text-foreground/70">تحليل شامل لتقدمك وأدائك مقارنة بالمستخدمين الآخرين</p>
          </div>
          <ShareButton 
            title="تقرير تقدمي في كلمات القرآن" 
            text={shareText}
            url={appShareUrl}
            className="bg-primary text-primary-foreground hover:bg-primary/90"
          />
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatCard 
            icon={BookOpen} 
            label="الكلمات المتعلمة" 
            value={stats.wordsLearned} 
            subValue={`${stats.wordsLearned - averages.words > 0 ? '+' : ''}${stats.wordsLearned - averages.words} عن المتوسط`}
            trend={stats.wordsLearned >= averages.words ? "up" : "down"}
            color="blue"
          />
          <StatCard 
            icon={Award} 
            label="نقاط الخبرة (XP)" 
            value={stats.totalXP} 
            subValue={`المستوى ${stats.level}`}
            color="purple"
          />
          <StatCard 
            icon={Target} 
            label="دقة الاختبارات" 
            value={`${stats.quizAvg}%`} 
            subValue={`المتوسط العام ${averages.quizAvg}%`}
            trend={stats.quizAvg >= averages.quizAvg ? "up" : "down"}
            color="green"
          />
          <StatCard 
            icon={Calendar} 
            label="الاستمرارية" 
            value={`${stats.streak} أيام`} 
            subValue="تتابع يومي"
            color="orange"
          />
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 lg:w-[400px]">
            <TabsTrigger value="overview">نظرة عامة</TabsTrigger>
            <TabsTrigger value="comparison">مقارنة الأداء</TabsTrigger>
            <TabsTrigger value="suggestions">التوصيات</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              {/* Learning History Chart */}
              <Card className="col-span-1 md:col-span-2">
                <CardHeader>
                  <CardTitle>تطور تعلم الكلمات</CardTitle>
                  <CardDescription>عدد الكلمات التي تعلمتها عبر الزمن</CardDescription>
                </CardHeader>
                <CardContent className="h-[300px]">
                  {history && history.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={history}>
                        <defs>
                          <linearGradient id="colorWords" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#1E7855" stopOpacity={0.8}/>
                            <stop offset="95%" stopColor="#1E7855" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip 
                            contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                        />
                        <Area type="monotone" dataKey="words" stroke="#1E7855" fillOpacity={1} fill="url(#colorWords)" name="كلمات جديدة" />
                      </AreaChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex items-center justify-center h-full text-muted-foreground">
                      لا توجد بيانات كافية للعرض بعد
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Comparison Tab */}
          <TabsContent value="comparison" className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>مقارنة التقدم</CardTitle>
                  <CardDescription>أداؤك مقابل متوسط المستخدمين</CardDescription>
                </CardHeader>
                <CardContent className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={comparisonData} layout="vertical" barSize={20}>
                      <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                      <XAxis type="number" />
                      <YAxis dataKey="name" type="category" width={100} />
                      <Tooltip cursor={{fill: 'transparent'}} />
                      <Legend />
                      <Bar dataKey="user" name="أنا" fill="#1E7855" radius={[0, 4, 4, 0]} />
                      <Bar dataKey="avg" name="المتوسط العام" fill="#94a3b8" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>مقارنة دقة الاختبارات</CardTitle>
                  <CardDescription>نسبة الإجابات الصحيحة</CardDescription>
                </CardHeader>
                <CardContent className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={quizComparisonData} barSize={40}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="name" />
                      <YAxis domain={[0, 100]} />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="user" name="أنا" fill="#8884d8" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="avg" name="المتوسط العام" fill="#94a3b8" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Suggestions Tab */}
          <TabsContent value="suggestions" className="space-y-6">
            <div className="grid gap-4">
              {suggestions.map((suggestion, idx) => (
                <Card key={idx} className={`border-r-4 ${
                    suggestion.type === 'success' ? 'border-r-green-500' : 
                    suggestion.type === 'warning' ? 'border-r-yellow-500' : 
                    suggestion.type === 'info' ? 'border-r-blue-500' : 'border-r-gray-500'
                }`}>
                  <CardContent className="p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                    <div className="flex items-start gap-4">
                        <div className={`p-3 rounded-full ${
                             suggestion.type === 'success' ? 'bg-green-100 text-green-600' : 
                             suggestion.type === 'warning' ? 'bg-yellow-100 text-yellow-600' : 
                             suggestion.type === 'info' ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-600'
                        }`}>
                            {suggestion.type === 'success' ? <CheckCircle2 className="w-6 h-6" /> : 
                             suggestion.type === 'warning' ? <AlertCircle className="w-6 h-6" /> : 
                             <Lightbulb className="w-6 h-6" />}
                        </div>
                        <div>
                            <h3 className="text-lg font-bold mb-1">{suggestion.title}</h3>
                            <p className="text-foreground/70">{suggestion.description}</p>
                        </div>
                    </div>
                    {suggestion.actionLink && (
                        <Button asChild className="shrink-0">
                            <a href={suggestion.actionLink}>{suggestion.actionLabel}</a>
                        </Button>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
            
            <Card className="mt-8 bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
                <CardContent className="p-8 text-center">
                    <img 
                        src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68b74ae8214aa5bfcb70e378/6d983cb3c_.png" 
                        alt="Logo" 
                        className="w-16 h-16 mx-auto mb-4"
                    />
                    <h3 className="text-xl font-bold mb-2">شارك إنجازاتك مع أصدقائك</h3>
                    <p className="text-foreground/70 mb-6 max-w-md mx-auto">
                        شجع أصدقائك على تعلم القرآن من خلال مشاركة تقريرك. ستحصل على نقاط إضافية عند انضمامهم!
                    </p>
                    <div className="flex justify-center gap-4">
                        <ShareButton 
                            title="كلمات القرآن - تقرير التقدم" 
                            text={shareText}
                            url={appShareUrl}
                            className="bg-primary text-primary-foreground hover:bg-primary/90 w-full md:w-auto"
                        />
                         <Button variant="outline" className="gap-2" onClick={() => window.open('https://play.google.com/store/apps/details?id=com.kalimat.quran', '_blank')}>
                            <Download className="w-4 h-4" />
                            تحميل التطبيق
                        </Button>
                    </div>
                </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </motion.div>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, subValue, trend, color }) {
    const colors = {
        blue: "text-blue-600 bg-blue-100",
        purple: "text-purple-600 bg-purple-100",
        green: "text-green-600 bg-green-100",
        orange: "text-orange-600 bg-orange-100",
    };

    return (
        <Card>
            <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                    <div className={`p-3 rounded-xl ${colors[color]}`}>
                        <Icon className="w-6 h-6" />
                    </div>
                    {trend && (
                        <Badge variant="outline" className={trend === "up" ? "text-green-600 bg-green-50 border-green-200" : "text-red-600 bg-red-50 border-red-200"}>
                            {trend === "up" ? "▲" : "▼"}
                        </Badge>
                    )}
                </div>
                <div className="space-y-1">
                    <p className="text-sm font-medium text-foreground/60">{label}</p>
                    <h3 className="text-2xl font-bold">{value}</h3>
                    <p className="text-xs text-foreground/50">{subValue}</p>
                </div>
            </CardContent>
        </Card>
    );
}
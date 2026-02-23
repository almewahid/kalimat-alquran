import React, { useState, useEffect } from "react";
import { supabaseClient } from "@/components/api/supabaseClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BarChart3, TrendingUp, Target, Award, Loader2 } from "lucide-react";
import { motion } from "framer-motion";

export default function WordProgressStats() {
  const [loading, setLoading] = useState(true);
  const [wordProgress, setWordProgress] = useState([]);
  const [stats, setStats] = useState({
    totalWords: 0,
    masteredWords: 0,
    avgConfidence: 0,
    totalReviews: 0
  });

  useEffect(() => {
    loadProgress();
  }, []);

  const loadProgress = async () => {
    setLoading(true);
    try {
      const user = await supabaseClient.auth.me();
      const progress = await supabaseClient.entities.WordProgress.filter({
        user_email: user.email
      });

      const words = await supabaseClient.entities.QuranicWord.filter({
        id: { $in: progress.map(p => p.word_id) }
      });

      const wordMap = new Map(words.map(w => [w.id, w]));
      const enriched = progress.map(p => ({
        ...p,
        word: wordMap.get(p.word_id)
      })).filter(p => p.word);

      setWordProgress(enriched);

      const totalReviews = progress.reduce((sum, p) => sum + (p.total_reviews || 0), 0);
      const avgConfidence = progress.length > 0 
        ? progress.reduce((sum, p) => sum + (p.confidence_score || 0), 0) / progress.length 
        : 0;
      const masteredWords = progress.filter(p => (p.confidence_score || 0) >= 80).length;

      setStats({
        totalWords: progress.length,
        masteredWords,
        avgConfidence,
        totalReviews
      });
    } catch (error) {
      console.error("Error loading progress:", error);
    } finally {
      setLoading(false);
    }
  };

  const getMasteryColor = (score) => {
    if (score >= 80) return "bg-green-100 text-green-800 border-green-300";
    if (score >= 60) return "bg-blue-100 text-blue-800 border-blue-300";
    if (score >= 40) return "bg-yellow-100 text-yellow-800 border-yellow-300";
    return "bg-red-100 text-red-800 border-red-300";
  };

  const getMasteryLabel = (score) => {
    if (score >= 80) return "متقن";
    if (score >= 60) return "جيد";
    if (score >= 40) return "متوسط";
    return "مبتدئ";
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-12 h-12 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-4xl font-bold gradient-text mb-2">تقدمك في الكلمات</h1>
        <p className="text-muted-foreground">تتبع مفصل لتقدمك في تعلم كل كلمة</p>
      </div>

      <div className="grid md:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardContent className="p-6 text-center">
            <BarChart3 className="w-8 h-8 text-primary mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">إجمالي الكلمات</p>
            <p className="text-3xl font-bold text-primary">{stats.totalWords}</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6 text-center">
            <Award className="w-8 h-8 text-green-600 mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">كلمات متقنة</p>
            <p className="text-3xl font-bold text-green-600">{stats.masteredWords}</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6 text-center">
            <TrendingUp className="w-8 h-8 text-blue-600 mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">متوسط الثقة</p>
            <p className="text-3xl font-bold text-blue-600">{stats.avgConfidence.toFixed(0)}%</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6 text-center">
            <Target className="w-8 h-8 text-purple-600 mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">إجمالي المراجعات</p>
            <p className="text-3xl font-bold text-purple-600">{stats.totalReviews}</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="all" className="w-full">
        <TabsList className="grid w-full md:w-[400px] grid-cols-4">
          <TabsTrigger value="all">الكل</TabsTrigger>
          <TabsTrigger value="mastered">متقن</TabsTrigger>
          <TabsTrigger value="learning">قيد التعلم</TabsTrigger>
          <TabsTrigger value="weak">يحتاج مراجعة</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="mt-6">
          <WordProgressList words={wordProgress} getMasteryColor={getMasteryColor} getMasteryLabel={getMasteryLabel} />
        </TabsContent>

        <TabsContent value="mastered" className="mt-6">
          <WordProgressList 
            words={wordProgress.filter(w => (w.confidence_score || 0) >= 80)} 
            getMasteryColor={getMasteryColor} 
            getMasteryLabel={getMasteryLabel} 
          />
        </TabsContent>

        <TabsContent value="learning" className="mt-6">
          <WordProgressList 
            words={wordProgress.filter(w => (w.confidence_score || 0) >= 40 && (w.confidence_score || 0) < 80)} 
            getMasteryColor={getMasteryColor} 
            getMasteryLabel={getMasteryLabel} 
          />
        </TabsContent>

        <TabsContent value="weak" className="mt-6">
          <WordProgressList 
            words={wordProgress.filter(w => (w.confidence_score || 0) < 40)} 
            getMasteryColor={getMasteryColor} 
            getMasteryLabel={getMasteryLabel} 
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function WordProgressList({ words, getMasteryColor, getMasteryLabel }) {
  if (words.length === 0) {
    return (
      <Card>
        <CardContent className="p-12 text-center text-muted-foreground">
          لا توجد كلمات في هذه الفئة
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
      {words.map((item, idx) => (
        <motion.div
          key={idx}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: idx * 0.05 }}
        >
          <Card>
            <CardHeader className="pb-3">
              <div className="flex justify-between items-start">
                <CardTitle className="text-2xl">{item.word.word}</CardTitle>
                <Badge className={getMasteryColor(item.confidence_score || 0)}>
                  {getMasteryLabel(item.confidence_score || 0)}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground">{item.word.meaning}</p>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>مستوى الإتقان</span>
                    <span className="font-bold">{(item.confidence_score || 0).toFixed(0)}%</span>
                  </div>
                  <Progress value={item.confidence_score || 0} className="h-2" />
                </div>

                <div className="grid grid-cols-3 gap-2 text-center text-sm">
                  <div className="bg-green-50 p-2 rounded">
                    <p className="text-green-600 font-bold">{item.correct_count || 0}</p>
                    <p className="text-xs text-muted-foreground">صحيح</p>
                  </div>
                  <div className="bg-red-50 p-2 rounded">
                    <p className="text-red-600 font-bold">{item.mistakes_count || 0}</p>
                    <p className="text-xs text-muted-foreground">خطأ</p>
                  </div>
                  <div className="bg-blue-50 p-2 rounded">
                    <p className="text-blue-600 font-bold">{item.total_reviews || 0}</p>
                    <p className="text-xs text-muted-foreground">مراجعات</p>
                  </div>
                </div>

                {item.last_review_date && (
                  <p className="text-xs text-muted-foreground text-center">
                    آخر مراجعة: {new Date(item.last_review_date).toLocaleDateString('ar-SA')}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      ))}
    </div>
  );
}
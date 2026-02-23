import React, { useState, useEffect } from "react";
import { supabaseClient } from "@/components/api/supabaseClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Loader2, CheckCircle, BookOpen, Trophy } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { useToast } from "@/components/ui/use-toast";
import WordCard from "../components/learn/WordCard";

// استخدام نفس بطاقة التعلم مع دعم الفيديو الداخلي وصوت2

export default function CustomPathLearn() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [path, setPath] = useState(null);
  const [words, setWords] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [learnedInSession, setLearnedInSession] = useState([]);
  const [userGroups, setUserGroups] = useState([]);

  const urlParams = new URLSearchParams(window.location.search);
  const pathId = urlParams.get('pathId');

  useEffect(() => {
    loadPath();
  }, [pathId]);

  const loadPath = async () => {
    try {
      const user = await supabaseClient.auth.me();
      
      const pathData = await supabaseClient.entities.CustomLearningPath.filter({ id: pathId });
      if (pathData.length === 0) {
        toast({ title: "❌ المسار غير موجود", variant: "destructive" });
        return;
      }

      const currentPath = pathData[0];
      setPath(currentPath);

      // جلب الكلمات
      const allWords = await supabaseClient.entities.QuranicWord.list();
      const pathWords = allWords.filter(w => currentPath.selected_words?.includes(w.id));
      setWords(pathWords);

      // جلب المجموعات
      const allGroups = await supabaseClient.entities.Group.list();
      const myGroups = allGroups.filter(g => g.leader_email === user.email);
      setUserGroups(myGroups);

      // تحديث آخر وصول
      await supabaseClient.entities.CustomLearningPath.update(pathId, {
        last_accessed: new Date().toISOString()
      });
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleMarkLearned = async () => {
    const currentWord = words[currentIndex];
    if (!currentWord) return;

    try {
      const newLearnedCount = (path.learned_words_count || 0) + 1;
      const newProgress = (newLearnedCount / path.total_words_count) * 100;

      await supabaseClient.entities.CustomLearningPath.update(path.id, {
        learned_words_count: newLearnedCount,
        progress_percentage: newProgress
      });

      setLearnedInSession([...learnedInSession, currentWord.id]);
      
      if (currentIndex < words.length - 1) {
        setCurrentIndex(currentIndex + 1);
      } else {
        toast({ title: "🎉 أنهيت جميع كلمات هذا المسار!" });
      }
    } catch (error) {
      console.error(error);
    }
  };

  const handleCreateChallenge = async () => {
    if (userGroups.length === 0) {
      toast({ 
        title: "⚠️ تحتاج لإنشاء مجموعة أولاً",
        description: "يمكنك إنشاء مجموعة من صفحة المجموعات",
        variant: "destructive" 
      });
      return;
    }

    navigate(createPageUrl(`CreateChallengeFromPath?pathId=${path.id}`));
  };

  if (isLoading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-screen">
        <Loader2 className="w-12 h-12 animate-spin text-primary" />
      </div>
    );
  }

  if (!path || words.length === 0) {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <Card>
          <CardContent className="text-center py-12">
            <p className="text-foreground/70">لا توجد كلمات في هذا المسار</p>
            <Link to={createPageUrl("CustomLearningPaths")}>
              <Button variant="outline" className="mt-4">العودة</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  const currentWord = words[currentIndex];
  const progress = ((currentIndex + 1) / words.length) * 100;

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-center gap-4 mb-6">
        <Link to={createPageUrl("CustomLearningPaths")}>
          <Button variant="ghost" size="icon">
            <ArrowLeft className="w-5 h-5" />
          </Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold">{path.path_name}</h1>
          <p className="text-sm text-foreground/70">
            {currentIndex + 1} / {words.length} كلمة
          </p>
        </div>
        <Badge className="bg-primary/10 text-primary">
          {path.difficulty_level}
        </Badge>
        <Button 
          onClick={handleCreateChallenge}
          variant="outline"
          className="gap-2"
          title="إنشاء تحدي من هذا المسار"
        >
          <Trophy className="w-5 h-5" />
          تحدي
        </Button>
      </div>

      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="flex justify-between text-sm mb-2">
            <span>تقدم الجلسة</span>
            <span className="font-bold">{progress.toFixed(0)}%</span>
          </div>
          <Progress value={progress} className="h-2" />
        </CardContent>
      </Card>

      {currentWord && (
        <WordCard 
          word={currentWord}
          onMarkLearned={handleMarkLearned}
          showActions={true}
          isReviewWord={false}
          userLevel={path?.difficulty_level || "متوسط"}
        />
      )}

      {currentIndex >= words.length - 1 && (
        <Card className="mt-6 bg-green-50 dark:bg-green-900/20 border-green-200">
          <CardContent className="text-center py-8">
            <CheckCircle className="w-16 h-16 text-green-600 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-green-700 mb-2">أحسنت!</h3>
            <p className="text-green-600">أكملت جميع كلمات هذا المسار</p>
            <Link to={createPageUrl("CustomLearningPaths")}>
              <Button className="mt-4">العودة للمسارات</Button>
            </Link>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
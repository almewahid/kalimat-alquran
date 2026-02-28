import React, { useState, useEffect } from "react";
import { supabaseClient } from "@/components/api/supabaseClient";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ChevronRight, ChevronLeft } from "lucide-react";
import { motion } from "framer-motion";

const WORDS_PER_PAGE = 10;

const MASTERY_CONFIG = {
  mastered: { label: "⭐ راسخة",        color: "bg-green-100 text-green-700 border-green-200",     card: "border-green-200 bg-green-50/50"  },
  good:     { label: "📚 جيدة",          color: "bg-blue-100 text-blue-700 border-blue-200",        card: "border-blue-200 bg-blue-50/50"    },
  medium:   { label: "📝 متوسطة",        color: "bg-yellow-100 text-yellow-700 border-yellow-200",  card: "border-yellow-200 bg-yellow-50/50"},
  beginner: { label: "💪 تحتاج تدريب",  color: "bg-red-100 text-red-700 border-red-200",           card: "border-red-200 bg-red-50/50"      },
};

function getMastery(score) {
  if (score >= 80) return MASTERY_CONFIG.mastered;
  if (score >= 60) return MASTERY_CONFIG.good;
  if (score >= 40) return MASTERY_CONFIG.medium;
  return MASTERY_CONFIG.beginner;
}

// "راسخة" = راجعتها بنجاح حتى صار موعد مراجعتها بعد 21 يوم أو أكثر
const STATS = [
  { key: "totalWords",    emoji: "📖", label: "كلمة درستها",          color: "bg-blue-50 border-blue-200",    text: "text-blue-600"   },
  { key: "masteredWords", emoji: "⭐", label: "كلمة راسخة في ذاكرتك", color: "bg-green-50 border-green-200",  text: "text-green-600"  },
  { key: "avgConfidence", emoji: "💪", label: "مستوى ثقتك",           color: "bg-purple-50 border-purple-200", text: "text-purple-600"},
  { key: "totalReviews",  emoji: "🔄", label: "مرة راجعت فيها",       color: "bg-amber-50 border-amber-200",   text: "text-amber-600"  },
];

export default function WordProgressStats() {
  const [loading, setLoading] = useState(true);
  const [wordProgress, setWordProgress] = useState([]);
  const [stats, setStats] = useState({
    totalWords: 0, masteredWords: 0, avgConfidence: 0, totalReviews: 0
  });

  useEffect(() => { loadProgress(); }, []);

  // confidence مشتق من interval (SM-2):
  // 0→10%، 1-3→25%، 4-9→50%، 10-20→70%، 21+→90-100%
  const intervalToConfidence = (interval) => {
    if (interval >= 21) return Math.min(100, 90 + Math.floor((interval - 21) / 5));
    if (interval >= 10) return 70;
    if (interval >= 4)  return 50;
    if (interval >= 1)  return 25;
    return 10;
  };

  const loadProgress = async () => {
    setLoading(true);
    try {
      const user = await supabaseClient.auth.me();

      const flashcards = await supabaseClient.entities.FlashCard.filter({ user_email: user.email });
      const reviewed   = flashcards.filter(fc => !fc.is_new);

      const wordIds = reviewed.map(fc => String(fc.word_id)).filter(Boolean);
      const words   = wordIds.length > 0
        ? await supabaseClient.entities.QuranicWord.filter({ id: { $in: wordIds } })
        : [];

      // word_id في flash_cards مخزّن كـ string
      const wordMap = new Map(words.map(w => [String(w.id), w]));

      const enriched = reviewed
        .map(fc => ({
          ...fc,
          word:             wordMap.get(String(fc.word_id)),
          confidence_score: intervalToConfidence(fc.interval || 0),
          correct_count:    fc.repetitions   || 0,
          total_reviews:    fc.total_reviews || 0,
        }))
        .filter(fc => fc.word);

      setWordProgress(enriched);

      setStats({
        totalWords:    enriched.length,
        masteredWords: enriched.filter(fc => (fc.interval || 0) >= 21).length,
        avgConfidence: enriched.length > 0
          ? Math.round(enriched.reduce((s, fc) => s + fc.confidence_score, 0) / enriched.length)
          : 0,
        totalReviews: enriched.reduce((s, fc) => s + fc.total_reviews, 0),
      });
    } catch (error) {
      console.error("Error loading progress:", error);
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
          📖
        </motion.div>
        <p className="text-lg font-semibold text-muted-foreground">جاري تحميل كلماتك...</p>
      </div>
    );
  }

  const statsValues = {
    totalWords:    stats.totalWords,
    masteredWords: stats.masteredWords,
    avgConfidence: `${stats.avgConfidence}%`,
    totalReviews:  stats.totalReviews,
  };

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-6">

      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground mb-1">📖 كلماتك المتعلّمة!</h1>
        <p className="text-sm text-muted-foreground">
          {stats.totalWords > 0
            ? `درست ${stats.totalWords} كلمة، منها ${stats.masteredWords} راسخة في ذاكرتك 🌟`
            : "ابدأ التعلّم وستجد كلماتك هنا!"}
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-3">
        {STATS.map((stat) => (
          <Card key={stat.key} className={`rounded-2xl border-2 ${stat.color}`}>
            <CardContent className="p-4 text-center">
              <div className="text-3xl mb-2">{stat.emoji}</div>
              <div className={`text-2xl font-bold ${stat.text}`}>
                {statsValues[stat.key]}
              </div>
              <p className="text-xs text-muted-foreground mt-1 leading-tight">{stat.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* ملاحظة توضيحية */}
      {stats.masteredWords > 0 && (
        <p className="text-xs text-muted-foreground bg-green-50 border border-green-200 rounded-xl px-4 py-2">
          ⭐ <strong>الكلمة الراسخة</strong> = راجعتها بنجاح عدة مرات حتى صارت تُختبر كل 21 يوم أو أكثر
        </p>
      )}

      {/* Tabs + WordList */}
      {wordProgress.length > 0 ? (
        <Tabs defaultValue="all" className="w-full">
          <TabsList className="grid w-full grid-cols-3 rounded-2xl h-11">
            <TabsTrigger value="all"      className="rounded-xl text-sm font-bold">الكل</TabsTrigger>
            <TabsTrigger value="mastered" className="rounded-xl text-sm font-bold">⭐ راسخة</TabsTrigger>
            <TabsTrigger value="weak"     className="rounded-xl text-sm font-bold">💪 تحتاج تدريب</TabsTrigger>
          </TabsList>

          <TabsContent value="all"      className="mt-4">
            <WordList words={wordProgress} />
          </TabsContent>
          <TabsContent value="mastered" className="mt-4">
            <WordList words={wordProgress.filter(w => w.confidence_score >= 80)} />
          </TabsContent>
          <TabsContent value="weak"     className="mt-4">
            <WordList words={wordProgress.filter(w => w.confidence_score < 60)} />
          </TabsContent>
        </Tabs>
      ) : (
        <div className="text-center py-16 flex flex-col items-center gap-4">
          <span className="text-8xl">🌱</span>
          <p className="text-xl font-bold text-foreground/70">لا توجد كلمات بعد</p>
          <p className="text-sm text-muted-foreground">تعلّم كلمات جديدة وستظهر هنا!</p>
        </div>
      )}

    </div>
  );
}

function WordList({ words }) {
  const [page, setPage] = useState(1);

  // إعادة الصفحة للأولى عند تغيير قائمة الكلمات (تبديل الـ Tab)
  useEffect(() => { setPage(1); }, [words]);

  if (words.length === 0) {
    return (
      <div className="text-center py-12 flex flex-col items-center gap-3">
        <span className="text-6xl">🔍</span>
        <p className="text-base font-semibold text-foreground/70">لا توجد كلمات في هذه الفئة</p>
      </div>
    );
  }

  const totalPages  = Math.ceil(words.length / WORDS_PER_PAGE);
  const pageWords   = words.slice((page - 1) * WORDS_PER_PAGE, page * WORDS_PER_PAGE);

  return (
    <div className="space-y-4">
      <div className="grid md:grid-cols-2 gap-3">
        {pageWords.map((item, idx) => {
          const score   = item.confidence_score || 0;
          const mastery = getMastery(score);

          return (
            <motion.div
              key={item.id || idx}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: idx * 0.03 }}
            >
              <Card className={`rounded-2xl border-2 transition-all hover:shadow-md ${mastery.card}`}>
                <CardContent className="p-4">

                  {/* Word + Badge */}
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-xl font-bold text-foreground leading-tight">
                        {item.word.word}
                      </p>
                      {item.word.meaning && (
                        <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
                          {item.word.meaning}
                        </p>
                      )}
                    </div>
                    <Badge className={`flex-shrink-0 text-xs border ${mastery.color}`}>
                      {mastery.label}
                    </Badge>
                  </div>

                  {/* Progress Bar */}
                  <div className="mb-3">
                    <div className="flex justify-between text-xs text-muted-foreground mb-1">
                      <span>مستوى الإتقان</span>
                      <span className="font-bold">{score}%</span>
                    </div>
                    <Progress value={score} className="h-4 rounded-full" />
                  </div>

                  {/* Mini Stats */}
                  <div className="grid grid-cols-2 gap-2 text-center">
                    <div className="bg-green-50 rounded-xl p-1.5">
                      <p className="text-green-600 font-bold text-sm">{item.correct_count}</p>
                      <p className="text-xs text-muted-foreground">✅ تكرار ناجح</p>
                    </div>
                    <div className="bg-blue-50 rounded-xl p-1.5">
                      <p className="text-blue-600 font-bold text-sm">{item.total_reviews}</p>
                      <p className="text-xs text-muted-foreground">🔄 مراجعة</p>
                    </div>
                  </div>

                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-3 pt-2">
          <Button
            variant="outline"
            className="rounded-2xl px-5 gap-2 font-bold"
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
          >
            <ChevronRight className="w-4 h-4" />
            السابق
          </Button>
          <span className="text-sm font-semibold text-muted-foreground px-2">
            {page} / {totalPages}
          </span>
          <Button
            variant="outline"
            className="rounded-2xl px-5 gap-2 font-bold"
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
          >
            التالي
            <ChevronLeft className="w-4 h-4" />
          </Button>
        </div>
      )}
    </div>
  );
}

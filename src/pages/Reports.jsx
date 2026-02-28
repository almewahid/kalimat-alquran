import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/components/api/supabaseClient";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer
} from "recharts";
import { motion } from "framer-motion";
import ShareButton from "@/components/common/ShareButton";

const STATS = [
  { key: "wordsLearned", emoji: "📚", label: "كلمة تعلّمتها",    color: "bg-blue-50 border-blue-200",    text: "text-blue-600"   },
  { key: "totalXP",      emoji: "⭐", label: "نقطة جمعتها",      color: "bg-amber-50 border-amber-200",   text: "text-amber-600"  },
  { key: "quizAvg",      emoji: "🎯", label: "متوسط نتائجك",     color: "bg-purple-50 border-purple-200", text: "text-purple-600" },
  { key: "streak",       emoji: "🔥", label: "يوم متتالي",        color: "bg-orange-50 border-orange-200", text: "text-orange-500" },
];

const SUGGESTION_CONFIG = {
  success: { emoji: "🌟", card: "border-green-200 bg-green-50"  },
  warning: { emoji: "⚠️", card: "border-yellow-200 bg-yellow-50"},
  info:    { emoji: "💡", card: "border-blue-200 bg-blue-50"    },
};

export default function Reports() {
  const { data, isLoading, error } = useQuery({
    queryKey: ["reportsData"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("غير مسجل دخول");

      const [
        { data: userProgress },
        { data: quizSessions },
        { data: allProgress },
        { data: allQuizSessions },
      ] = await Promise.all([
        supabase.from("user_progress")
          .select("total_xp, current_level, words_learned, consecutive_login_days")
          .eq("user_id", user.id).maybeSingle(),
        supabase.from("quiz_sessions")
          .select("score, correct_answers, created_date")
          .eq("user_id", user.id).order("created_date", { ascending: true }),
        supabase.from("user_progress").select("total_xp, words_learned"),
        supabase.from("quiz_sessions").select("score"),
      ]);

      const userQuizSessions = quizSessions || [];

      const stats = {
        wordsLearned: userProgress?.words_learned || 0,
        totalXP:      userProgress?.total_xp || 0,
        level:        userProgress?.current_level || 1,
        streak:       userProgress?.consecutive_login_days || 0,
        quizAvg:      userQuizSessions.length > 0
          ? Math.round(userQuizSessions.reduce((s, q) => s + (q.score || 0), 0) / userQuizSessions.length)
          : 0,
      };

      const progressList = allProgress || [];
      const quizList     = allQuizSessions || [];
      const averages = {
        words:   progressList.length > 0 ? Math.round(progressList.reduce((s, p) => s + (p.words_learned || 0), 0) / progressList.length) : 0,
        quizAvg: quizList.length > 0    ? Math.round(quizList.reduce((s, q) => s + (q.score || 0), 0) / quizList.length) : 0,
      };

      const monthNames = ["يناير","فبراير","مارس","أبريل","مايو","يونيو","يوليو","أغسطس","سبتمبر","أكتوبر","نوفمبر","ديسمبر"];
      const monthlyMap = {};
      userQuizSessions.forEach(session => {
        const date = new Date(session.created_date);
        const key  = `${date.getFullYear()}-${date.getMonth()}`;
        if (!monthlyMap[key]) monthlyMap[key] = { name: monthNames[date.getMonth()], words: 0, _ts: date.getTime() };
        monthlyMap[key].words += session.correct_answers || 0;
      });
      const history = Object.values(monthlyMap).sort((a, b) => a._ts - b._ts).slice(-6).map(({ name, words }) => ({ name, words }));

      const suggestions = [];
      if (stats.streak >= 7) {
        suggestions.push({ type: "success", title: "استمرارية رائعة! 🎉", description: `حافظت على ${stats.streak} يوماً متتالياً، أنت بطل!` });
      } else if (stats.streak < 3) {
        suggestions.push({ type: "warning", title: "تذكّر تدرس كل يوم", description: "حاول الدراسة يومياً لبناء عادة قوية.", actionLink: "/Learn", actionLabel: "ابدأ الآن 🚀" });
      }
      if (stats.quizAvg >= averages.quizAvg) {
        suggestions.push({ type: "success", title: "دقتك ممتازة! 🎯", description: `نتائجك ${stats.quizAvg}% أفضل من كثير من المستخدمين.` });
      } else {
        suggestions.push({ type: "info", title: "راجع الكلمات الصعبة", description: "جرّب المراجعة الذكية لتحسين نتائجك.", actionLink: "/SmartReview", actionLabel: "مراجعة ذكية 🧠" });
      }
      if (stats.wordsLearned >= averages.words) {
        suggestions.push({ type: "success", title: "تقدّم ممتاز في الكلمات! 📚", description: `تعلّمت ${stats.wordsLearned} كلمة، أحسنت!` });
      } else {
        suggestions.push({ type: "info", title: "تعلّم المزيد من الكلمات", description: "ابدأ جلسة تعلّم جديدة الآن.", actionLink: "/Learn", actionLabel: "تعلّم الآن 📖" });
      }

      return { stats, history, suggestions };
    }
  });

  if (isLoading) {
    return (
      <div className="p-6 flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <motion.div
          animate={{ scale: [1, 1.15, 1] }}
          transition={{ repeat: Infinity, duration: 1.4 }}
          className="text-6xl"
        >
          📊
        </motion.div>
        <p className="text-lg font-semibold text-muted-foreground">جاري تحميل تقريرك...</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="p-6 text-center">
        <p className="text-5xl mb-4">😕</p>
        <p className="font-semibold text-foreground/70">حدث خطأ أثناء تحميل التقرير</p>
        <p className="text-xs text-muted-foreground mt-1">{error?.message}</p>
      </div>
    );
  }

  const { stats, history, suggestions } = data;
  const appShareUrl = window.location.origin;
  const shareText = `📊 تقريري في كلمات القرآن:\n✨ المستوى: ${stats.level}\n📚 كلمة تعلّمتها: ${stats.wordsLearned}\n⭐ النقاط: ${stats.totalXP}\n🔥 التتابع اليومي: ${stats.streak} يوم\nانضم إليّ! ${appShareUrl}`.trim();

  const statsValues = {
    wordsLearned: stats.wordsLearned,
    totalXP:      stats.totalXP,
    quizAvg:      `${stats.quizAvg}%`,
    streak:       stats.streak,
  };

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-6">

      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-1">📊 تقريرك!</h1>
          <p className="text-sm text-muted-foreground">
            أنت في المستوى <strong>{stats.level}</strong> — واصل التقدم! 💪
          </p>
        </div>
        <ShareButton
          title="تقرير تقدمي في كلمات القرآن"
          text={shareText}
          url={appShareUrl}
        />
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-3">
        {STATS.map((stat) => (
          <Card key={stat.key} className={`rounded-2xl border-2 ${stat.color}`}>
            <CardContent className="p-4 text-center">
              <div className="text-3xl mb-2">{stat.emoji}</div>
              <div className={`text-2xl font-bold ${stat.text}`}>{statsValues[stat.key]}</div>
              <p className="text-xs text-muted-foreground mt-1 leading-tight">{stat.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Tabs */}
      <Tabs defaultValue="progress" className="w-full">
        <TabsList className="grid w-full grid-cols-2 rounded-2xl h-11">
          <TabsTrigger value="progress"    className="rounded-xl text-sm font-bold">📈 تقدمي</TabsTrigger>
          <TabsTrigger value="suggestions" className="rounded-xl text-sm font-bold">💡 نصائح</TabsTrigger>
        </TabsList>

        {/* Progress Tab */}
        <TabsContent value="progress" className="mt-4 space-y-4">
          <Card className="rounded-2xl border-2">
            <CardContent className="p-4">
              <p className="text-sm font-bold text-foreground mb-4">📅 نشاطك آخر 6 أشهر</p>
              {history.length > 0 ? (
                <div className="h-[220px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={history}>
                      <defs>
                        <linearGradient id="colorWords" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%"  stopColor="#1E7855" stopOpacity={0.7} />
                          <stop offset="95%" stopColor="#1E7855" stopOpacity={0}   />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                      <YAxis tick={{ fontSize: 12 }} />
                      <Tooltip contentStyle={{ borderRadius: "12px", border: "none", boxShadow: "0 4px 12px rgba(0,0,0,0.1)" }} />
                      <Area type="monotone" dataKey="words" stroke="#1E7855" fillOpacity={1} fill="url(#colorWords)" name="كلمات" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="h-[180px] flex flex-col items-center justify-center gap-3 text-muted-foreground">
                  <span className="text-5xl">📭</span>
                  <p className="text-sm">لا توجد بيانات بعد — ابدأ التعلّم!</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Suggestions Tab */}
        <TabsContent value="suggestions" className="mt-4 space-y-3">
          {suggestions.map((s, idx) => {
            const cfg = SUGGESTION_CONFIG[s.type] || SUGGESTION_CONFIG.info;
            return (
              <Card key={idx} className={`rounded-2xl border-2 ${cfg.card}`}>
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <span className="text-2xl flex-shrink-0">{cfg.emoji}</span>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-foreground leading-tight mb-1">{s.title}</p>
                      <p className="text-sm text-foreground/70">{s.description}</p>
                    </div>
                  </div>
                  {s.actionLink && (
                    <div className="mt-3">
                      <Button size="sm" className="rounded-xl font-bold w-full" asChild>
                        <a href={s.actionLink}>{s.actionLabel}</a>
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </TabsContent>
      </Tabs>

    </div>
  );
}

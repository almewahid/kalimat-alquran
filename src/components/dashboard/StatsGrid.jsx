import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BookOpen, Brain, Target, Calendar, Flame } from "lucide-react";
import { motion } from "framer-motion";

export default function StatsGrid({ wordsLearned = 0, totalWords = 0, quizStreak = 0, recentSessions = [], consecutiveLoginDays = 1 }) {
  const statsData = [
    {
      title: "الكلمات المتعلمة",
      value: wordsLearned || 0,
      total: totalWords || 0,
      icon: BookOpen,
      color: "blue",
      percentage: totalWords > 0 ? Math.round((wordsLearned / totalWords) * 100) : 0
    },
    {
      title: "أيام متتالية",
      value: consecutiveLoginDays || 1,
      icon: Flame,
      color: "red",
      streak: true,
      unit: "أيام"
    },
    {
      title: "سلسلة النجاح",
      value: quizStreak || 0,
      icon: Target,
      color: "purple",
      streak: true,
      unit: "اختبارات"
    },
    {
      title: "الاختبارات المكتملة",
      value: (recentSessions || []).length,
      icon: Brain,
      color: "green"
    }
  ];

  const colorClasses = {
    blue: "text-blue-500",
    red: "text-red-500",
    purple: "text-purple-500",
    green: "text-green-500",
  };

  return (
    <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {statsData.map((stat, index) => (
        <motion.div
          key={stat.title}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.05 }}
        >
          <Card className="bg-card border-border shadow-md">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-foreground/80">{stat.title}</CardTitle>
              <stat.icon className={`w-5 h-5 ${colorClasses[stat.color]}`} />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-foreground">{stat.value}</div>
              {stat.percentage !== undefined && (
                <p className="text-xs text-foreground/70 mt-1">
                  {stat.percentage}% من إجمالي الكلمات
                </p>
              )}
              {stat.streak && (
                <p className="text-xs text-foreground/70 mt-1">
                  {stat.unit} متتالية
                </p>
              )}
            </CardContent>
          </Card>
        </motion.div>
      ))}
    </div>
  );
}
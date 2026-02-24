import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { motion } from "framer-motion";

export default function LevelCard({ level, xp, progress, dailyXP }) {
  const currentLevel = level || 1;
  const totalXP = xp || 0;
  const progressPercentage = progress || 0;

  const nextLevelXP = currentLevel * 100;
  const currentLevelXP = (currentLevel - 1) * 100;
  const xpInLevel = totalXP - currentLevelXP;
  const remainingXP = nextLevelXP - totalXP;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="mb-6"
    >
      <Card className="bg-card shadow-md rounded-2xl border border-border">
        <CardContent className="p-5">
          {/* رأس البطاقة */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <span className="text-5xl leading-none">🏆</span>
              <div>
                <p className="text-sm text-foreground/60 font-medium">مستواك الآن</p>
                <p className="text-5xl font-black text-primary leading-none">
                  {currentLevel}
                </p>
              </div>
            </div>

            {dailyXP > 0 && (
              <div className="flex flex-col items-center bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-xl px-3 py-2">
                <span className="text-lg">⚡</span>
                <span className="text-sm font-bold text-yellow-600 dark:text-yellow-400">
                  +{dailyXP} اليوم
                </span>
              </div>
            )}
          </div>

          {/* شريط التقدم */}
          <div className="space-y-2">
            <Progress value={progressPercentage} className="h-4 rounded-full" />
            <div className="flex justify-between text-sm">
              <span className="text-foreground/70">
                نجومك ⭐ {xpInLevel}
              </span>
              <span className="font-semibold text-primary">
                اكسب {remainingXP} نجمة للمستوى التالي
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

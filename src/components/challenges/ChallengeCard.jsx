import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Trophy, Calendar, Target, Users, Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { format, differenceInDays } from "date-fns";
import { ar } from "date-fns/locale";

const CHALLENGE_TYPE_LABELS = {
  learn_new_words: { label: "تعلم كلمات جديدة", icon: "📚", color: "bg-blue-100 text-blue-700" },
  review_words: { label: "مراجعة كلمات", icon: "🔄", color: "bg-purple-100 text-purple-700" },
  complete_quizzes: { label: "إكمال اختبارات", icon: "🧠", color: "bg-green-100 text-green-700" },
  maintain_streak: { label: "الحفاظ على السلسلة", icon: "🔥", color: "bg-orange-100 text-orange-700" }
};

export default function ChallengeCard({ challenge, index, userEmail }) {
  const [progress, setProgress] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadProgress();
  }, [challenge.id, userEmail]);

  const loadProgress = async () => {
    try {
      const userProgress = await base44.entities.ChallengeProgress.filter({
        challenge_id: challenge.id,
        user_email: userEmail
      });

      if (userProgress.length > 0) {
        setProgress(userProgress[0]);
      }
    } catch (error) {
      console.error("Error loading progress:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const typeInfo = CHALLENGE_TYPE_LABELS[challenge.challenge_type] || {};
  const progressPercentage = progress ? Math.min((progress.progress_value / challenge.goal_count) * 100, 100) : 0;
  
  const daysLeft = differenceInDays(new Date(challenge.end_date), new Date());
  const isExpired = daysLeft < 0;
  const isCompleted = progress?.completed;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
    >
      <Link to={createPageUrl(`ChallengeDetail?id=${challenge.id}`)}>
        <Card className="hover:shadow-lg transition-all cursor-pointer h-full">
          <CardContent className="p-6">
            {/* Header */}
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <Badge className={typeInfo.color}>
                    {typeInfo.icon} {typeInfo.label}
                  </Badge>
                  {isCompleted && (
                    <Badge className="bg-green-100 text-green-700">
                      ✅ مكتمل
                    </Badge>
                  )}
                  {isExpired && !isCompleted && (
                    <Badge className="bg-red-100 text-red-700">
                      ⏰ منتهي
                    </Badge>
                  )}
                </div>
                <h3 className="font-bold text-lg text-foreground">{challenge.title}</h3>
                {challenge.description && (
                  <p className="text-sm text-foreground/70 mt-1 line-clamp-2">{challenge.description}</p>
                )}
              </div>
            </div>

            {/* Progress */}
            {isLoading ? (
              <div className="flex justify-center py-4">
                <Loader2 className="w-6 h-6 animate-spin text-primary" />
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-foreground/80">التقدم</span>
                  <span className="font-medium text-primary">
                    {progress?.progress_value || 0} / {challenge.goal_count}
                  </span>
                </div>
                <Progress value={progressPercentage} className="h-2" />
                <p className="text-xs text-foreground/70 text-center">
                  {Math.round(progressPercentage)}% مكتمل
                </p>
              </div>
            )}

            {/* Footer */}
            <div className="mt-4 pt-4 border-t border-border flex items-center justify-between text-sm">
              <div className="flex items-center gap-1 text-foreground/70">
                <Calendar className="w-4 h-4" />
                <span>{isExpired ? "انتهى" : `${daysLeft} يوم متبقي`}</span>
              </div>
              <div className="flex items-center gap-1 text-foreground/70">
                <Trophy className="w-4 h-4 text-amber-500" />
                <span>+{challenge.reward_xp} XP</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </Link>
    </motion.div>
  );
}
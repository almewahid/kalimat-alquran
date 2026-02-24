import React, { useState, useEffect } from "react";
import { supabaseClient } from "@/components/api/supabaseClient";
import { Card, CardContent } from "@/components/ui/card";
import { motion } from "framer-motion";
import { Crown, Gift, Loader2, ArrowRight } from "lucide-react";
import RewardsDisplay from "@/components/kids/RewardsDisplay";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

const STAT_CARDS = [
  { key: "stars",    emoji: "⭐", label: "نجمة",     from: "from-yellow-400", to: "to-orange-400",  text: "text-yellow-700", bg: "from-yellow-50 to-orange-50",   border: "border-yellow-300"  },
  { key: "medals",   emoji: "🥇", label: "ميدالية",  from: "from-blue-400",   to: "to-indigo-400",  text: "text-blue-700",   bg: "from-blue-50 to-indigo-50",     border: "border-blue-300"    },
  { key: "trophies", emoji: "🏆", label: "كأس",      from: "from-purple-400", to: "to-pink-400",    text: "text-purple-700", bg: "from-purple-50 to-pink-50",     border: "border-purple-300"  },
];

export default function KidsRewards() {
  const [rewards, setRewards] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadRewards(); }, []);

  const loadRewards = async () => {
    try {
      const user = await supabaseClient.auth.me();
      const [userRewards] = await supabaseClient.entities.KidsReward.filter({
        user_email: user.email
      });

      if (!userRewards) {
        const newRewards = await supabaseClient.entities.KidsReward.create({
          user_email: user.email,
          stars: 0, medals: 0, trophies: 0, level: 1, avatar: "🌟"
        });
        setRewards(newRewards);
      } else {
        setRewards(userRewards);
      }
    } catch (error) {
      console.error("Error loading rewards:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <div className="text-6xl animate-bounce">🏆</div>
        <Loader2 className="w-10 h-10 animate-spin text-yellow-500" />
        <p className="text-foreground/60 text-lg font-medium">جارٍ تحميل مكافآتك...</p>
      </div>
    );
  }

  const collectedRewards  = rewards?.collected_rewards || [];
  const level             = rewards?.level || 1;
  const nextLevelStars    = level * 10;
  const currentStars      = rewards?.stars || 0;
  const progressToNext    = Math.min(100, ((currentStars % nextLevelStars) / nextLevelStars) * 100);

  return (
    <div className="p-4 max-w-2xl mx-auto">

      {/* زر العودة */}
      <div className="mb-4">
        <Link
          to={createPageUrl("KidsMode")}
          className="inline-flex items-center gap-2 text-sm text-foreground/50 hover:text-foreground transition-colors"
        >
          <ArrowRight className="w-4 h-4" />
          العودة لوضع الأطفال
        </Link>
      </div>

      {/* ── الهيدر ── */}
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="text-center mb-6"
      >
        <motion.div
          animate={{ rotate: [0, -10, 10, -10, 0] }}
          transition={{ duration: 1.5, delay: 0.5, repeat: Infinity, repeatDelay: 3 }}
          className="text-7xl mb-3"
        >
          {rewards?.avatar || "🌟"}
        </motion.div>
        <h1 className="text-3xl font-bold gradient-text mb-1">مكافآتي</h1>
        <p className="text-foreground/60 text-sm">كل الجوائز التي جمعتها!</p>
      </motion.div>

      {/* RewardsDisplay */}
      <div className="flex justify-center mb-6 overflow-hidden">
        <RewardsDisplay rewards={rewards} />
      </div>

      {/* ── شريط تقدم المستوى ── */}
      <Card className="overflow-hidden shadow-md mb-5 border-2 border-purple-300">
        <div className="h-3 bg-gradient-to-r from-purple-400 to-pink-500" />
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-yellow-400 to-orange-400 flex items-center justify-center shadow">
                <Crown className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="font-bold text-lg text-foreground">المستوى {level}</p>
                <p className="text-xs text-foreground/55">
                  {currentStars % nextLevelStars} / {nextLevelStars} نجمة للمستوى التالي
                </p>
              </div>
            </div>
            <span className="text-2xl font-bold text-purple-600">{Math.round(progressToNext)}%</span>
          </div>

          <div className="w-full bg-muted rounded-full h-5 overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${progressToNext}%` }}
              transition={{ duration: 1.2, ease: "easeOut" }}
              className="h-full bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full flex items-center justify-end pr-2"
            >
              {progressToNext > 15 && (
                <span className="text-white text-xs font-bold">🌟</span>
              )}
            </motion.div>
          </div>
        </CardContent>
      </Card>

      {/* ── بطاقات الإحصاء ── */}
      <div className="grid grid-cols-3 gap-3 mb-5">
        {STAT_CARDS.map(({ key, emoji, label, bg, border, text }, i) => (
          <motion.div
            key={key}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            whileHover={{ scale: 1.05 }}
          >
            <Card className={`overflow-hidden border-2 ${border}`}>
              <div className={`h-2 bg-gradient-to-r from-${key === "stars" ? "yellow" : key === "medals" ? "blue" : "purple"}-400 to-${key === "stars" ? "orange" : key === "medals" ? "indigo" : "pink"}-400`} />
              <CardContent className={`p-3 text-center bg-gradient-to-br ${bg}`}>
                <div className="text-3xl mb-1">{emoji}</div>
                <p className={`text-2xl font-bold ${text}`}>{rewards?.[key] || 0}</p>
                <p className={`text-xs mt-0.5 ${text} opacity-80`}>{label}</p>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* ── سجل المكافآت ── */}
      <Card className="overflow-hidden shadow-md border border-border">
        <div className="h-3 bg-gradient-to-r from-amber-400 to-yellow-500" />
        <CardContent className="p-4">
          <div className="flex items-center gap-2 mb-4">
            <Gift className="w-5 h-5 text-amber-500" />
            <h2 className="font-bold text-lg">سجل المكافآت</h2>
          </div>

          {collectedRewards.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground">
              <div className="text-6xl mb-3">🎁</div>
              <p className="font-bold text-base mb-1">لا توجد مكافآت بعد</p>
              <p className="text-sm opacity-70">العب الألعاب لتحصل على مكافآت!</p>
              <Link to={createPageUrl("KidsGames")}>
                <button className="mt-4 px-6 py-3 rounded-2xl bg-gradient-to-r from-pink-400 to-rose-500 text-white font-bold text-sm shadow">
                  🎮 العب الآن
                </button>
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {collectedRewards.map((reward, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: idx * 0.04 }}
                  whileHover={{ scale: 1.05 }}
                >
                  <Card className="border border-border hover:shadow-md transition-shadow">
                    <CardContent className="p-3 text-center">
                      <div className="text-4xl mb-1">{reward.icon}</div>
                      <p className="text-xs font-medium text-foreground line-clamp-1">{reward.name}</p>
                      <p className="text-xs text-foreground/40 mt-0.5">
                        {new Date(reward.earned_date).toLocaleDateString("ar-SA")}
                      </p>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

    </div>
  );
}

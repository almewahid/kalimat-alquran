import React, { useState, useEffect } from "react";
import { supabaseClient } from "@/components/api/supabaseClient";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { Crown, Gift, Loader2, ArrowRight, Gamepad2 } from "lucide-react";
import RewardsDisplay, { RewardAnimation } from "@/components/kids/RewardsDisplay";
import KidsGame from "@/components/kids/KidsGame";
import { grantKidsReward } from "@/components/kids/kidsRewardsUtils";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

const STAT_CARDS = [
  { key: "stars",    emoji: "⭐", label: "نجمة",    bg: "from-yellow-50 to-orange-50",  border: "border-yellow-300", text: "text-yellow-700" },
  { key: "medals",   emoji: "🥇", label: "ميدالية", bg: "from-blue-50 to-indigo-50",    border: "border-blue-300",   text: "text-blue-700"   },
  { key: "trophies", emoji: "🏆", label: "كأس",     bg: "from-purple-50 to-pink-50",    border: "border-purple-300", text: "text-purple-700" },
];

export default function KidsRewards() {
  const [rewards, setRewards]       = useState(null);
  const [gameWords, setGameWords]   = useState([]);
  const [loading, setLoading]       = useState(true);
  const [showGame, setShowGame]     = useState(false);
  const [showReward, setShowReward] = useState(null);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    try {
      const user = await supabaseClient.auth.me();

      // تحميل المكافآت
      const [userRewards] = await supabaseClient.entities.KidsReward.filter({ user_email: user.email });
      if (!userRewards) {
        const newRewards = await supabaseClient.entities.KidsReward.create({
          stars: 0, medals: 0, trophies: 0, level: 1, avatar: "🌟"
        });
        setRewards(newRewards);
      } else {
        setRewards(userRewards);
      }

      // تحميل كلمات المراجعة للألعاب (من الـ flashcards)
      const flashcards = await supabaseClient.entities.FlashCard.filter({ user_email: user.email });
      if (flashcards.length > 0) {
        const wordIds = [...new Set(flashcards.map(fc => fc.word_id))].slice(0, 10);
        const words = await supabaseClient.entities.QuranicWord.filter({ id: { $in: wordIds } });
        setGameWords(words);
      }
    } catch (error) {
      console.error("Error loading data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleGameComplete = async (result) => {
    const { score, stars, moves } = result;
    const earnedMedal   = (score !== undefined && score >= 80) || (moves !== undefined && moves < 6);
    const earnedTrophy  = score !== undefined && score >= 100;

    await grantKidsReward({
      stars:    stars || 1,
      medals:   earnedMedal  ? 1 : 0,
      trophies: earnedTrophy ? 1 : 0,
      source:   "ألعاب المراجعة"
    });

    setShowGame(false);
    setShowReward(earnedTrophy ? "trophy" : earnedMedal ? "medal" : "star");
    await loadData();
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

  // ── وضع اللعبة ──
  if (showGame) {
    return (
      <div className="relative">
        <div className="px-4 pt-4">
          <button
            onClick={() => setShowGame(false)}
            className="inline-flex items-center gap-2 text-sm text-foreground/50 hover:text-foreground transition-colors"
          >
            <ArrowRight className="w-4 h-4" />
            العودة للمكافآت
          </button>
        </div>
        <KidsGame words={gameWords} onComplete={handleGameComplete} />
        {showReward && <RewardAnimation type={showReward} onComplete={() => setShowReward(null)} />}
      </div>
    );
  }

  const collectedRewards = rewards?.collected_rewards || [];
  const level            = rewards?.level || 1;
  const nextLevelStars   = level * 10;
  const currentStars     = rewards?.stars || 0;
  const progressToNext   = Math.min(100, ((currentStars % nextLevelStars) / nextLevelStars) * 100);

  return (
    <div className="p-4 max-w-2xl mx-auto">

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
        <h1 className="text-3xl font-bold mb-1">مكافآتي</h1>
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
              {progressToNext > 15 && <span className="text-white text-xs font-bold">🌟</span>}
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
              <CardContent className={`p-3 text-center bg-gradient-to-br ${bg}`}>
                <div className="text-3xl mb-1">{emoji}</div>
                <p className={`text-2xl font-bold ${text}`}>{rewards?.[key] || 0}</p>
                <p className={`text-xs mt-0.5 ${text} opacity-80`}>{label}</p>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* ── قسم الألعاب ── */}
      <Card className="overflow-hidden shadow-md mb-5 border-2 border-green-300">
        <div className="h-3 bg-gradient-to-r from-green-400 to-emerald-500" />
        <CardContent className="p-4">
          <div className="flex items-center gap-2 mb-3">
            <Gamepad2 className="w-5 h-5 text-green-600" />
            <h2 className="font-bold text-lg">العب وتعلّم!</h2>
          </div>

          {gameWords.length >= 3 ? (
            <div className="text-center">
              <p className="text-sm text-muted-foreground mb-3">
                لديك <span className="font-bold text-green-600">{gameWords.length}</span> كلمة مراجعة جاهزة للعب
              </p>
              <Button
                onClick={() => setShowGame(true)}
                className="w-full h-14 text-lg font-bold rounded-2xl bg-gradient-to-r from-green-400 to-emerald-500 hover:from-green-500 hover:to-emerald-600 text-white border-0"
              >
                🎮 العب الآن!
              </Button>
            </div>
          ) : (
            <div className="text-center py-4 text-muted-foreground">
              <div className="text-4xl mb-2">📚</div>
              <p className="text-sm font-medium">تعلّم كلمات أولاً للعب!</p>
              <Link to={createPageUrl("Learn")}>
                <Button variant="outline" className="mt-3 rounded-2xl border-green-300 text-green-700">
                  ⭐ ابدأ التعلم
                </Button>
              </Link>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── سجل المكافآت ── */}
      <Card className="overflow-hidden shadow-md border border-border">
        <div className="h-3 bg-gradient-to-r from-amber-400 to-yellow-500" />
        <CardContent className="p-4">
          <div className="flex items-center gap-2 mb-4">
            <Gift className="w-5 h-5 text-amber-500" />
            <h2 className="font-bold text-lg">سجل المكافآت</h2>
          </div>

          {collectedRewards.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <div className="text-5xl mb-3">🎁</div>
              <p className="font-bold text-base mb-1">لا توجد مكافآت بعد</p>
              <p className="text-sm opacity-70">تعلّم واحصل على نجوم!</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[...collectedRewards].reverse().map((reward, idx) => (
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
                      <p className="text-xs font-bold text-foreground line-clamp-1">{reward.name}</p>
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

      {showReward && <RewardAnimation type={showReward} onComplete={() => setShowReward(null)} />}
    </div>
  );
}

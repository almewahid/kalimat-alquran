import React, { useState, useEffect } from "react";
import { supabaseClient } from "@/components/api/supabaseClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import { Star, Award, Trophy, Sparkles, Gift, Crown, Loader2 } from "lucide-react";
import RewardsDisplay from "@/components/kids/RewardsDisplay";

export default function KidsRewards() {
  const [rewards, setRewards] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadRewards();
  }, []);

  const loadRewards = async () => {
    try {
      const { data: { user } } = await supabaseClient.supabase.auth.getUser();
      const [userRewards] = await supabaseClient.entities.KidsReward.filter({
        user_email: user.email
      });

      if (!userRewards) {
        // Create initial rewards
        const newRewards = await supabaseClient.entities.KidsReward.create({
          user_email: user.email,
          stars: 0,
          medals: 0,
          trophies: 0,
          level: 1,
          avatar: "🌟"
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
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-12 h-12 animate-spin text-primary" />
      </div>
    );
  }

  const collectedRewards = rewards?.collected_rewards || [];
  const nextLevelStars = (rewards?.level || 1) * 10;
  const currentStars = rewards?.stars || 0;
  const progressToNextLevel = (currentStars % nextLevelStars) / nextLevelStars * 100;

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="text-center mb-8"
      >
        <div className="text-8xl mb-4">{rewards?.avatar || "🌟"}</div>
        <h1 className="text-5xl font-bold gradient-text mb-2">مكافآتي</h1>
        <p className="text-xl text-muted-foreground">شاهد كل الجوائز التي جمعتها!</p>
      </motion.div>

      <div className="flex justify-center mb-8">
        <RewardsDisplay rewards={rewards} className="scale-125" />
      </div>

      {/* Level Progress */}
      <Card className="mb-8 bg-gradient-to-br from-purple-100 to-pink-100 border-purple-300">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <Crown className="w-8 h-8 text-yellow-500" />
              <div>
                <h3 className="text-2xl font-bold">المستوى {rewards?.level || 1}</h3>
                <p className="text-sm text-muted-foreground">
                  {currentStars % nextLevelStars} / {nextLevelStars} نجمة للمستوى التالي
                </p>
              </div>
            </div>
            <Sparkles className="w-12 h-12 text-purple-500" />
          </div>
          <div className="w-full bg-white rounded-full h-6 overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${progressToNextLevel}%` }}
              transition={{ duration: 1, ease: "easeOut" }}
              className="h-full bg-gradient-to-r from-yellow-400 to-orange-500 flex items-center justify-center text-white text-sm font-bold"
            >
              {Math.round(progressToNextLevel)}%
            </motion.div>
          </div>
        </CardContent>
      </Card>

      {/* Stats Grid */}
      <div className="grid md:grid-cols-3 gap-6 mb-8">
        <motion.div whileHover={{ scale: 1.05 }}>
          <Card className="bg-gradient-to-br from-yellow-100 to-orange-100 border-yellow-300">
            <CardContent className="p-8 text-center">
              <Star className="w-16 h-16 text-yellow-500 fill-yellow-500 mx-auto mb-4" />
              <h3 className="text-5xl font-bold text-yellow-700 mb-2">{rewards?.stars || 0}</h3>
              <p className="text-lg text-yellow-600">نجمة</p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div whileHover={{ scale: 1.05 }}>
          <Card className="bg-gradient-to-br from-blue-100 to-indigo-100 border-blue-300">
            <CardContent className="p-8 text-center">
              <Award className="w-16 h-16 text-blue-500 mx-auto mb-4" />
              <h3 className="text-5xl font-bold text-blue-700 mb-2">{rewards?.medals || 0}</h3>
              <p className="text-lg text-blue-600">ميدالية</p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div whileHover={{ scale: 1.05 }}>
          <Card className="bg-gradient-to-br from-purple-100 to-pink-100 border-purple-300">
            <CardContent className="p-8 text-center">
              <Trophy className="w-16 h-16 text-purple-500 mx-auto mb-4" />
              <h3 className="text-5xl font-bold text-purple-700 mb-2">{rewards?.trophies || 0}</h3>
              <p className="text-lg text-purple-600">كأس</p>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Collected Rewards */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-2xl">
            <Gift className="w-6 h-6 text-primary" />
            سجل المكافآت
          </CardTitle>
        </CardHeader>
        <CardContent>
          {collectedRewards.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <div className="text-6xl mb-4">🎁</div>
              <p className="text-xl">لم تجمع أي مكافآت بعد</p>
              <p className="text-sm mt-2">العب الألعاب لتحصل على مكافآت!</p>
            </div>
          ) : (
            <div className="grid md:grid-cols-4 gap-4">
              {collectedRewards.map((reward, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: idx * 0.05 }}
                >
                  <Card className="hover:shadow-lg transition-shadow">
                    <CardContent className="p-4 text-center">
                      <div className="text-5xl mb-2">{reward.icon}</div>
                      <p className="text-sm font-medium">{reward.name}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {new Date(reward.earned_date).toLocaleDateString('ar-SA')}
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
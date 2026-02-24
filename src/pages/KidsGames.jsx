import React, { useState, useEffect } from "react";
import { supabaseClient } from "@/components/api/supabaseClient";
import { useToast } from "@/components/ui/use-toast";
import KidsGame from "@/components/kids/KidsGame";
import { RewardAnimation } from "@/components/kids/RewardsDisplay";
import { Loader2, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

export default function KidsGames() {
  const { toast } = useToast();
  const [words, setWords]           = useState([]);
  const [loading, setLoading]       = useState(true);
  const [showReward, setShowReward] = useState(null);

  useEffect(() => { loadWords(); }, []);

  const loadWords = async () => {
    try {
      const user  = await supabaseClient.auth.me();
      const level = user?.preferences?.learning_level || "مبتدئ";

      const allWords = await supabaseClient.entities.QuranicWord.filter({
        difficulty_level: level
      });

      setWords(allWords.sort(() => Math.random() - 0.5).slice(0, 10));
    } catch (error) {
      console.error("Error loading words:", error);
      toast({ title: "خطأ", description: "فشل في تحميل الكلمات", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleGameComplete = async (result) => {
    try {
      const user = await supabaseClient.auth.me();
      const { score, stars } = result;

      const [rewards] = await supabaseClient.entities.KidsReward.filter({
        user_email: user.email
      });

      if (rewards) {
        await supabaseClient.entities.KidsReward.update(rewards.id, {
          stars:    (rewards.stars    || 0) + (stars || 1),
          medals:   (rewards.medals   || 0) + (score >= 80 ? 1 : 0),
          trophies: (rewards.trophies || 0) + (score >= 100 ? 1 : 0),
          collected_rewards: [
            ...(rewards.collected_rewards || []),
            { type: "star", name: `نجمة اللعبة ${Date.now()}`, icon: "⭐", earned_date: new Date().toISOString() }
          ]
        });
      } else {
        await supabaseClient.entities.KidsReward.create({
          user_email: user.email,
          stars:    stars || 1,
          medals:   score >= 80  ? 1 : 0,
          trophies: score >= 100 ? 1 : 0,
          level: 1,
          collected_rewards: [
            { type: "star", name: `نجمة اللعبة ${Date.now()}`, icon: "⭐", earned_date: new Date().toISOString() }
          ]
        });
      }

      setShowReward(stars >= 3 ? "trophy" : stars >= 2 ? "medal" : "star");

      toast({
        title:       "🎉 أحسنت!",
        description: `حصلت على ${stars} نجمة!`,
        className:   "bg-yellow-100 text-yellow-800",
        duration:    3000
      });

      setTimeout(() => { loadWords(); }, 2000);
    } catch (error) {
      console.error("Error updating rewards:", error);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <div className="text-6xl animate-bounce">🎮</div>
        <Loader2 className="w-10 h-10 animate-spin text-pink-500" />
        <p className="text-foreground/60 text-lg font-medium">جارٍ تحضير الألعاب...</p>
      </div>
    );
  }

  return (
    <div className="relative">
      {/* زر العودة لوضع الأطفال */}
      <div className="px-4 pt-4">
        <Link
          to={createPageUrl("KidsMode")}
          className="inline-flex items-center gap-2 text-sm text-foreground/50 hover:text-foreground transition-colors"
        >
          <ArrowRight className="w-4 h-4" />
          العودة لوضع الأطفال
        </Link>
      </div>

      <KidsGame words={words} onComplete={handleGameComplete} />

      {showReward && (
        <RewardAnimation
          type={showReward}
          onComplete={() => setShowReward(null)}
        />
      )}
    </div>
  );
}

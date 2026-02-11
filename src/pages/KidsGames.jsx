import React, { useState, useEffect } from "react";
import { supabaseClient } from "@/components/api/supabaseClient";
import { useToast } from "@/components/ui/use-toast";
import KidsGame from "@/components/kids/KidsGame";
import { RewardAnimation } from "@/components/kids/RewardsDisplay";
import { Loader2 } from "lucide-react";

export default function KidsGames() {
  const { toast } = useToast();
  const [words, setWords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showReward, setShowReward] = useState(null);

  useEffect(() => {
    loadWords();
  }, []);

  const loadWords = async () => {
    try {
      const user = await supabaseClient.supabase.auth.getUser();
      const level = user?.preferences?.learning_level || "مبتدئ";
      
      const allWords = await supabaseClient.entities.QuranicWord.filter({
        difficulty_level: level
      });
      
      setWords(allWords.sort(() => Math.random() - 0.5).slice(0, 10));
    } catch (error) {
      console.error("Error loading words:", error);
      toast({
        title: "خطأ",
        description: "فشل في تحميل الكلمات",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleGameComplete = async (result) => {
    try {
      const user = await supabaseClient.supabase.auth.getUser();
      const { score, stars, moves } = result;

      // Update rewards
      const [rewards] = await supabaseClient.entities.KidsReward.filter({
        user_email: user.email
      });

      if (rewards) {
        await supabaseClient.entities.KidsReward.update(rewards.id, {
          stars: (rewards.stars || 0) + (stars || 1),
          medals: (rewards.medals || 0) + (score >= 80 ? 1 : 0),
          trophies: (rewards.trophies || 0) + (score >= 100 ? 1 : 0),
          collected_rewards: [
            ...(rewards.collected_rewards || []),
            {
              type: "star",
              name: `نجمة اللعبة ${Date.now()}`,
              icon: "⭐",
              earned_date: new Date().toISOString()
            }
          ]
        });
      } else {
        await supabaseClient.entities.KidsReward.create({
          user_email: user.email,
          stars: stars || 1,
          medals: score >= 80 ? 1 : 0,
          trophies: score >= 100 ? 1 : 0,
          level: 1,
          collected_rewards: [
            {
              type: "star",
              name: `نجمة اللعبة ${Date.now()}`,
              icon: "⭐",
              earned_date: new Date().toISOString()
            }
          ]
        });
      }

      // Show reward animation
      setShowReward(stars >= 3 ? "trophy" : stars >= 2 ? "medal" : "star");

      toast({
        title: "🎉 أحسنت!",
        description: `حصلت على ${stars} نجمة!`,
        className: "bg-yellow-100 text-yellow-800",
        duration: 3000
      });

      // Reload words for next game
      setTimeout(() => {
        loadWords();
      }, 2000);
    } catch (error) {
      console.error("Error updating rewards:", error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-12 h-12 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <>
      <KidsGame words={words} onComplete={handleGameComplete} />
      {showReward && (
        <RewardAnimation 
          type={showReward} 
          onComplete={() => setShowReward(null)} 
        />
      )}
    </>
  );
}
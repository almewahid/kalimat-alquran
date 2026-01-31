import React, { useState, useEffect } from "react";
import { supabaseClient } from "@/components/api/supabaseClient";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Heart, Loader2, Trash2, BookOpen } from "lucide-react";
import { motion } from "framer-motion";
import WordCard from "../components/learn/WordCard";
import KidsWordCard from "../components/kids/KidsWordCard";

export default function FavoritesSupabase() {
  const queryClient = useQueryClient();
  const [user, setUser] = useState(null);
  const [learningLevel, setLearningLevel] = useState("مبتدئ");
  const [filterLevel, setFilterLevel] = useState("all");

  // ✅ Load user
  const { data: userData } = useQuery({
    queryKey: ['user-favorites'],
    queryFn: async () => {
      const currentUser = await supabaseClient.auth.me();
      setUser(currentUser);
      setLearningLevel(currentUser?.preferences?.learning_level || "مبتدئ");
      return currentUser;
    },
  });

  // ✅ Load favorite words
  const { data: favoriteWords, isLoading } = useQuery({
    queryKey: ['favorite-words', user?.email],
    queryFn: async () => {
      if (!user?.email) return [];

      // Get favorite records
      const favorites = await supabaseClient.entities.FavoriteWord.filter({
        user_email: user.email
      });

      if (favorites.length === 0) return [];

      // Get word details
      const wordIds = favorites.map(f => f.word_id);
      const allWords = await supabaseClient.entities.QuranicWord.list('', 1000);
      return allWords.filter(w => wordIds.includes(w.id));
    },
    enabled: !!user?.email,
  });

  // ✅ Remove from favorites
  const removeFavoriteMutation = useMutation({
    mutationFn: async (wordId) => {
      if (!user?.email) return;

      const favorites = await supabaseClient.entities.FavoriteWord.filter({
        word_id: wordId,
        user_email: user.email
      });

      if (favorites.length > 0) {
        await supabaseClient.entities.FavoriteWord.delete(favorites[0].id);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['favorite-words']);
    },
  });

  // Filter words by difficulty
  const filteredWords = favoriteWords?.filter(word => {
    if (filterLevel === "all") return true;
    return word.difficulty_level === filterLevel;
  }) || [];

  // Count by level
  const levelCounts = {
    all: favoriteWords?.length || 0,
    مبتدئ: favoriteWords?.filter(w => w.difficulty_level === "مبتدئ").length || 0,
    متوسط: favoriteWords?.filter(w => w.difficulty_level === "متوسط").length || 0,
    متقدم: favoriteWords?.filter(w => w.difficulty_level === "متقدم").length || 0,
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-12 h-12 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-accent/5 p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center justify-between mb-4 flex-wrap gap-4">
            <div>
              <h1 className="text-3xl font-bold gradient-text mb-2 flex items-center gap-2">
                <Heart className="w-8 h-8 text-red-500 fill-red-500" />
                كلماتي المفضلة
              </h1>
              <p className="text-foreground/70">
                الكلمات التي حفظتها للمراجعة لاحقاً
              </p>
            </div>
            <Badge className="bg-green-100 text-green-700 border-green-300">
              🟢 Supabase Backend
            </Badge>
          </div>

          {/* Filters */}
          <div className="flex gap-2 flex-wrap">
            <Button
              variant={filterLevel === "all" ? "default" : "outline"}
              onClick={() => setFilterLevel("all")}
              size="sm"
              className="gap-2"
            >
              الكل
              <Badge variant="secondary">{levelCounts.all}</Badge>
            </Button>
            <Button
              variant={filterLevel === "مبتدئ" ? "default" : "outline"}
              onClick={() => setFilterLevel("مبتدئ")}
              size="sm"
              className="gap-2"
            >
              مبتدئ
              <Badge variant="secondary">{levelCounts.مبتدئ}</Badge>
            </Button>
            <Button
              variant={filterLevel === "متوسط" ? "default" : "outline"}
              onClick={() => setFilterLevel("متوسط")}
              size="sm"
              className="gap-2"
            >
              متوسط
              <Badge variant="secondary">{levelCounts.متوسط}</Badge>
            </Button>
            <Button
              variant={filterLevel === "متقدم" ? "default" : "outline"}
              onClick={() => setFilterLevel("متقدم")}
              size="sm"
              className="gap-2"
            >
              متقدم
              <Badge variant="secondary">{levelCounts.متقدم}</Badge>
            </Button>
          </div>
        </motion.div>

        {/* Words Grid */}
        {filteredWords.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <Card className="bg-card shadow-lg">
              <div className="p-12 text-center">
                <Heart className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h2 className="text-2xl font-bold mb-2">
                  {filterLevel === "all" 
                    ? "لا توجد كلمات مفضلة بعد"
                    : `لا توجد كلمات مفضلة بمستوى ${filterLevel}`
                  }
                </h2>
                <p className="text-foreground/70 mb-6">
                  اضغط على أيقونة القلب في صفحة التعلم لإضافة كلمات إلى المفضلة
                </p>
                <Button className="gap-2">
                  <BookOpen className="w-5 h-5" />
                  ابدأ التعلم
                </Button>
              </div>
            </Card>
          </motion.div>
        ) : (
          <div className="grid md:grid-cols-2 gap-6">
            {filteredWords.map((word, index) => (
              <motion.div
                key={word.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="relative"
              >
                {learningLevel === "مبتدئ" ? (
                  <KidsWordCard
                    word={word}
                    onMarkLearned={() => {}}
                    isReviewWord={false}
                  />
                ) : (
                  <WordCard
                    word={word}
                    onMarkLearned={() => {}}
                    isReviewWord={false}
                    userLevel={learningLevel}
                  />
                )}
                
                {/* Remove Button */}
                <Button
                  variant="destructive"
                  size="icon"
                  className="absolute top-4 left-4 z-10"
                  onClick={() => removeFavoriteMutation.mutate(word.id)}
                  title="إزالة من المفضلة"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
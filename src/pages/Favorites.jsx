import React, { useState, useEffect, useCallback } from "react";
import { supabaseClient } from "@/components/api/supabaseClient";
import WordCard from "../components/learn/WordCard";
import KidsWordCard from "../components/kids/KidsWordCard";
import { Star, Frown, Loader2, Filter } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";

const createPageUrl = (pageName) => `/${pageName}`;

export default function FavoritesPage() {
  const [favoriteWords, setFavoriteWords] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [userLevel, setUserLevel] = useState("متوسط");
  const [filterLevel, setFilterLevel] = useState("all");

  const loadFavorites = useCallback(async () => {
    setIsLoading(true);
    try {
      const user = await supabaseClient.auth.me();
      const level = user?.preferences?.learning_level || "متوسط";
      setUserLevel(level);

      const favoriteRecords = await supabaseClient.entities.FavoriteWord.filter({ user_email: user.email });
      const wordIds = favoriteRecords.map(f => f.word_id);

      if (wordIds.length > 0) {
        const allWords = await supabaseClient.entities.QuranicWord.list();
        const words = allWords.filter(w => wordIds.includes(w.id));
        const orderedWords = wordIds.map(id => words.find(w => w.id === id)).filter(Boolean).reverse();
        setFavoriteWords(orderedWords);
      } else {
        setFavoriteWords([]);
      }
    } catch (error) {
      console.error("Error loading favorites:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadFavorites();
  }, [loadFavorites]);

  const handleFavoriteChange = () => {
    loadFavorites();
  };

  const handleRemoveFavorite = async (wordId) => {
    try {
      const user = await supabaseClient.auth.me();
      const favoriteRecords = await supabaseClient.entities.FavoriteWord.filter({
        word_id: wordId,
        user_email: user.email
      });

      if (favoriteRecords.length > 0) {
        await supabaseClient.entities.FavoriteWord.delete(favoriteRecords[0].id);
        loadFavorites();
      }
    } catch (error) {
      console.error("Error removing favorite:", error);
    }
  };

  // تصفية حسب مستوى الصعوبة
  const filteredWords = filterLevel === "all" 
    ? favoriteWords 
    : favoriteWords.filter(w => w.difficulty_level === filterLevel);

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-center gap-4 mb-8"
      >
        <Star className="w-8 h-8 text-amber-500" />
        <h1 className="text-3xl font-bold gradient-text">كلماتي المفضلة</h1>
      </motion.div>

      {/* فلتر المستوى */}
      {favoriteWords.length > 0 && (
        <Card className="mb-6 bg-card border-border">
          <CardContent className="p-4">
            <div className="flex items-center gap-4 flex-wrap">
              <div className="flex items-center gap-2">
                <Filter className="w-5 h-5 text-foreground/70" />
                <span className="text-sm font-medium text-foreground/70">فلتر حسب المستوى:</span>
              </div>
              <div className="flex gap-2">
                <Button
                  variant={filterLevel === "all" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setFilterLevel("all")}
                >
                  الكل ({favoriteWords.length})
                </Button>
                <Button
                  variant={filterLevel === "مبتدئ" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setFilterLevel("مبتدئ")}
                >
                  طفل ({favoriteWords.filter(w => w.difficulty_level === "مبتدئ").length})
                </Button>
                <Button
                  variant={filterLevel === "متوسط" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setFilterLevel("متوسط")}
                >
                  متوسط ({favoriteWords.filter(w => w.difficulty_level === "متوسط").length})
                </Button>
                <Button
                  variant={filterLevel === "متقدم" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setFilterLevel("متقدم")}
                >
                  متقدم ({favoriteWords.filter(w => w.difficulty_level === "متقدم").length})
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {isLoading ? (
        <div className="text-center py-16">
          <Loader2 className="w-12 h-12 text-primary mx-auto animate-spin" />
          <p className="text-foreground/70 mt-4">جارٍ تحميل المفضلة...</p>
        </div>
      ) : (
        <AnimatePresence>
          {filteredWords.length > 0 ? (
            <div className="grid grid-cols-1 gap-6">
              {filteredWords.map((word, index) => (
                <motion.div
                  key={word.id}
                  layout
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  transition={{ delay: index * 0.05 }}
                >
                  {userLevel === "مبتدئ" ? (
                    <KidsWordCard
                      word={word}
                      onMarkLearned={() => {}}
                    />
                  ) : (
                    <WordCard
                      word={word}
                      onMarkLearned={() => {}}
                      isReviewWord={true}
                      userLevel={userLevel}
                    />
                  )}
                  <div className="flex justify-center mt-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleRemoveFavorite(word.id)}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      حذف من المفضلة
                    </Button>
                  </div>
                </motion.div>
              ))}
            </div>
          ) : favoriteWords.length > 0 && filteredWords.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center py-16 bg-card border border-border rounded-xl"
            >
              <Frown className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h2 className="text-xl font-bold text-foreground mb-2">لا توجد كلمات بهذا المستوى</h2>
              <p className="text-foreground/70">
                جرب تغيير الفلتر لرؤية كلمات أخرى.
              </p>
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center py-16 bg-card border border-border rounded-xl"
            >
              <Frown className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h2 className="text-xl font-bold text-foreground mb-2">لا توجد كلمات مفضلة بعد</h2>
              <p className="text-foreground/70">
                يمكنك إضافة كلمات إلى المفضلة من صفحة التعلم بالضغط على زر "إضافة للمفضلة" ⭐
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      )}
    </div>
  );
}
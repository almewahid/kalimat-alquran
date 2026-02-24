import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Star } from "lucide-react";
import { motion } from "framer-motion";

export default function RecentWords({ learnedWordsIds, allWords }) {
  const [recentWords, setRecentWords] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsLoading(true);
    if (!learnedWordsIds || learnedWordsIds.length === 0 || !allWords || allWords.length === 0) {
      setRecentWords([]);
      setIsLoading(false);
      return;
    }

    const recentLearnedIds = learnedWordsIds.slice(-6);
    const filteredRecent = allWords.filter(word => recentLearnedIds.includes(word.id));
    const sortedRecent = filteredRecent
      .sort((a, b) => recentLearnedIds.indexOf(a.id) - recentLearnedIds.indexOf(b.id))
      .reverse();

    setRecentWords(sortedRecent);
    setIsLoading(false);
  }, [learnedWordsIds, allWords]);

  const categoryColors = {
    "أسماء": "bg-blue-100 text-blue-800",
    "أفعال": "bg-green-100 text-green-800",
    "صفات": "bg-purple-100 text-purple-800",
    "حروف": "bg-orange-100 text-orange-800",
    "أخرى": "bg-gray-100 text-gray-700"
  };

  return (
    <Card className="bg-card shadow-md rounded-2xl border border-border mb-6">
      <CardHeader className="pb-3">
        <CardTitle className="text-primary font-semibold flex items-center gap-2 text-lg">
          <Star className="w-5 h-5 text-yellow-500 fill-yellow-500" />
          آخر الكلمات المتعلمة
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="text-center py-6">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-3" />
            <p className="text-primary text-sm">لحظة... نُحضّر كلماتك 🌟</p>
          </div>
        ) : recentWords.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {recentWords.map((word, index) => (
              <motion.div
                key={word.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.08 }}
                className="rounded-xl border border-border bg-background-soft overflow-hidden"
              >
                {/* صورة الكلمة إن وُجدت */}
                {word.image_url && (
                  <img
                    src={word.image_url}
                    alt={word.meaning || word.word}
                    className="w-full h-20 object-cover"
                  />
                )}
                <div className="p-3 text-center">
                  <h3 className="text-xl font-bold text-foreground arabic-font mb-1">
                    {word.word}
                  </h3>
                  <p className="text-primary text-sm mb-2">{word.meaning}</p>
                  <Badge
                    className={`${categoryColors[word.category] || categoryColors["أخرى"]} border-transparent text-xs`}
                  >
                    {word.category}
                  </Badge>
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <span className="text-5xl block mb-3">📖</span>
            <p className="text-foreground/80 font-semibold text-lg">ابدأ وستظهر كلماتك هنا! 🎉</p>
            <p className="text-foreground/60 text-sm mt-1">تعلّم كلمتك الأولى الآن</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

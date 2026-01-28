import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BookOpen, Star } from "lucide-react";
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
    const sortedRecent = filteredRecent.sort((a, b) => 
      recentLearnedIds.indexOf(a.id) - recentLearnedIds.indexOf(b.id)
    ).reverse();

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
    <Card className="bg-card shadow-md rounded-2xl border border-border transition-all duration-300 ease-in-out hover:shadow-lg">
      <CardHeader>
        <CardTitle className="text-primary font-semibold flex items-center gap-2">
          <Star className="w-5 h-5 text-primary" />
          آخر الكلمات المتعلمة
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-3"></div>
            <p className="text-primary text-sm">جارٍ التحميل...</p>
          </div>
        ) : recentWords.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {recentWords.map((word, index) => (
              <motion.div
                key={word.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="p-4 bg-background-soft rounded-lg border border-border"
              >
                <div className="text-center mb-3">
                  <h3 className="text-2xl font-bold text-foreground arabic-font">
                    {word.word}
                  </h3>
                  <p className="text-primary mt-1">{word.meaning}</p>
                </div>
                <div className="flex justify-between items-center">
                  <Badge className={`${categoryColors[word.category] || categoryColors["أخرى"]} border-transparent`}>
                    {word.category}
                  </Badge>
                  <span className="text-xs text-foreground/70">
                    {word.surah_name}
                  </span>
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <BookOpen className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-foreground/70">لم تتعلم أي كلمات بعد</p>
            <p className="text-foreground/70 text-sm">ابدأ التعلم لترى الكلمات هنا</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
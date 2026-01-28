import React, { useState, useEffect, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Search, X, Loader2, BookOpen, Star, Volume2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { useAudio } from "@/components/common/AudioContext";

// دالة تنظيف النص العربي
const normalizeArabicText = (text) => {
  if (!text) return '';
  return text
    .replace(/[\u064B-\u065F]/g, '')
    .replace(/[\u0670]/g, '')
    .replace(/[\u0600-\u061C]/g, '')
    .replace(/[\u06D6-\u06FF]/g, '')
    .replace(/\u0640/g, '')
    .replace(/ٱ/g, 'ا')
    .replace(/أ/g, 'ا')
    .replace(/إ/g, 'ا')
    .replace(/آ/g, 'ا')
    .replace(/ى/g, 'ي')
    .replace(/ة/g, 'ه')
    .trim();
};

export default function GlobalSearch() {
  const [searchTerm, setSearchTerm] = useState("");
  const [results, setResults] = useState({
    words: [],
    verses: [],
    favorites: []
  });
  const [isLoading, setIsLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [user, setUser] = useState(null);

  const { playAyah, playWord } = useAudio();

  useEffect(() => {
    const loadUser = async () => {
      try {
        const currentUser = await base44.auth.me();
        setUser(currentUser);
      } catch (error) {
        console.log("User not logged in:", error);
      }
    };
    loadUser();
  }, []);

  const performSearch = useCallback(async (term) => {
    if (!term || term.length < 2) {
      setResults({ words: [], verses: [], favorites: [] });
      return;
    }

    setIsLoading(true);
    try {
      const normalizedTerm = normalizeArabicText(term);

      // البحث في الكلمات القرآنية
      const [allWords, allVerses] = await Promise.all([
        base44.entities.QuranicWord.list(),
        base44.entities.QuranAyah.list()
      ]);

      // تصفية الكلمات
      const matchedWords = allWords.filter(word => {
        const normalizedWord = normalizeArabicText(word.word);
        const normalizedMeaning = normalizeArabicText(word.meaning);
        const normalizedRoot = normalizeArabicText(word.root);
        
        return (
          normalizedWord.includes(normalizedTerm) ||
          normalizedMeaning.includes(normalizedTerm) ||
          normalizedRoot?.includes(normalizedTerm)
        );
      }).slice(0, 10);

      // تصفية الآيات
      const matchedVerses = allVerses.filter(verse => {
        const normalizedText = normalizeArabicText(verse.ayah_text_simple);
        return normalizedText.includes(normalizedTerm);
      }).slice(0, 10);

      // البحث في المفضلة (إذا كان المستخدم مسجل دخول)
      let matchedFavorites = [];
      if (user) {
        const favorites = await base44.entities.FavoriteWord.filter({ created_by: user.email });
        const favoriteWordIds = favorites.map(f => f.word_id);
        matchedFavorites = matchedWords.filter(w => favoriteWordIds.includes(w.id));
      }

      setResults({
        words: matchedWords,
        verses: matchedVerses,
        favorites: matchedFavorites
      });
      setShowResults(true);
    } catch (error) {
      console.error("Search error:", error);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  // Debounce البحث
  useEffect(() => {
    const timer = setTimeout(() => {
      performSearch(searchTerm);
    }, 500);

    return () => clearTimeout(timer);
  }, [searchTerm, performSearch]);

  const highlightMatch = (text, term) => {
    if (!term) return text;
    const normalizedText = normalizeArabicText(text);
    const normalizedTerm = normalizeArabicText(term);
    const index = normalizedText.indexOf(normalizedTerm);
    
    if (index === -1) return text;
    
    const start = index;
    const end = index + term.length;
    
    return (
      <>
        {text.substring(0, start)}
        <mark className="bg-yellow-200 dark:bg-yellow-800 font-bold">
          {text.substring(start, end)}
        </mark>
        {text.substring(end)}
      </>
    );
  };

  const handlePlayWord = (word) => {
    if (word.surah_number && word.ayah_number && word.word) {
      playWord(word.surah_number, word.ayah_number, word.word, word);
    }
  };

  const handlePlayVerse = (verse) => {
    if (verse.surah_number && verse.ayah_number) {
      playAyah(verse.surah_number, verse.ayah_number, verse);
    }
  };

  const totalResults = results.words.length + results.verses.length;

  return (
    <div className="relative w-full max-w-2xl mx-auto">
      {/* شريط البحث */}
      <div className="relative">
        <Search className="absolute right-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-foreground/50" />
        <Input
          type="text"
          placeholder="ابحث عن كلمة، معنى، أو آية..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          onFocus={() => searchTerm && setShowResults(true)}
          className="pr-12 pl-12 h-14 text-lg rounded-2xl border-2 focus:border-primary"
        />
        {searchTerm && (
          <Button
            variant="ghost"
            size="icon"
            onClick={() => {
              setSearchTerm("");
              setShowResults(false);
              setResults({ words: [], verses: [], favorites: [] });
            }}
            className="absolute left-2 top-1/2 transform -translate-y-1/2"
          >
            <X className="w-5 h-5" />
          </Button>
        )}
        {isLoading && (
          <Loader2 className="absolute left-12 top-1/2 transform -translate-y-1/2 w-5 h-5 text-primary animate-spin" />
        )}
      </div>

      {/* نتائج البحث */}
      <AnimatePresence>
        {showResults && totalResults > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute top-full mt-2 w-full z-50"
          >
            <Card className="bg-card border-2 border-border shadow-2xl max-h-[500px] overflow-y-auto">
              <CardContent className="p-4">
                {/* عدد النتائج */}
                <div className="flex items-center justify-between mb-4 pb-3 border-b border-border">
                  <p className="text-sm font-semibold text-foreground/70">
                    {totalResults} نتيجة
                  </p>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowResults(false)}
                  >
                    إغلاق
                  </Button>
                </div>

                {/* نتائج الكلمات */}
                {results.words.length > 0 && (
                  <div className="mb-6">
                    <h3 className="text-lg font-bold text-primary mb-3 flex items-center gap-2">
                      <BookOpen className="w-5 h-5" />
                      الكلمات ({results.words.length})
                    </h3>
                    <div className="space-y-2">
                      {results.words.map((word) => (
                        <Link
                          key={word.id}
                          to={createPageUrl("Learn")}
                          onClick={() => setShowResults(false)}
                        >
                          <motion.div
                            whileHover={{ scale: 1.02 }}
                            className="p-4 rounded-lg bg-background-soft hover:bg-primary/5 border border-border cursor-pointer transition-all"
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div className="flex-1">
                                <p className="text-2xl font-bold text-primary mb-1 arabic-font">
                                  {highlightMatch(word.word, searchTerm)}
                                </p>
                                <p className="text-base text-foreground/80 mb-2">
                                  {highlightMatch(word.meaning, searchTerm)}
                                </p>
                                {word.surah_name && (
                                  <Badge variant="outline" className="text-xs">
                                    {word.surah_name} - آية {word.ayah_number}
                                  </Badge>
                                )}
                              </div>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  handlePlayWord(word);
                                }}
                              >
                                <Volume2 className="w-5 h-5 text-blue-600" />
                              </Button>
                            </div>
                          </motion.div>
                        </Link>
                      ))}
                    </div>
                  </div>
                )}

                {/* نتائج الآيات */}
                {results.verses.length > 0 && (
                  <div className="mb-6">
                    <h3 className="text-lg font-bold text-primary mb-3 flex items-center gap-2">
                      <BookOpen className="w-5 h-5" />
                      الآيات ({results.verses.length})
                    </h3>
                    <div className="space-y-2">
                      {results.verses.map((verse) => (
                        <Link
                          key={verse.id}
                          to={createPageUrl("QuranReader")}
                          onClick={() => setShowResults(false)}
                        >
                          <motion.div
                            whileHover={{ scale: 1.02 }}
                            className="p-4 rounded-lg bg-amber-50 dark:bg-amber-900/20 hover:bg-amber-100 dark:hover:bg-amber-900/30 border border-amber-200 dark:border-amber-800 cursor-pointer transition-all"
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div className="flex-1">
                                <p className="text-xl text-amber-900 dark:text-amber-100 arabic-font leading-loose mb-2">
                                  {highlightMatch(verse.ayah_text, searchTerm)}
                                </p>
                                <Badge variant="outline" className="bg-amber-100 dark:bg-amber-900/50 border-amber-300">
                                  {verse.surah_name} - آية {verse.ayah_number}
                                </Badge>
                              </div>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  handlePlayVerse(verse);
                                }}
                              >
                                <Volume2 className="w-5 h-5 text-green-600" />
                              </Button>
                            </div>
                          </motion.div>
                        </Link>
                      ))}
                    </div>
                  </div>
                )}

                {/* رابط البحث المتقدم */}
                <Link to={createPageUrl("Search")} onClick={() => setShowResults(false)}>
                  <Button variant="outline" className="w-full mt-4">
                    <Search className="w-4 h-4 ml-2" />
                    البحث المتقدم
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* رسالة عدم وجود نتائج */}
      {showResults && searchTerm && totalResults === 0 && !isLoading && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="absolute top-full mt-2 w-full z-50"
        >
          <Card className="bg-card border-2 border-border shadow-2xl">
            <CardContent className="p-6 text-center">
              <p className="text-foreground/70 mb-4">لم يتم العثور على نتائج</p>
              <Link to={createPageUrl("Search")} onClick={() => setShowResults(false)}>
                <Button variant="outline">
                  جرب البحث المتقدم
                </Button>
              </Link>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </div>
  );
}
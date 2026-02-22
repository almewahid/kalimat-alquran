import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import { Volume2, VolumeX, Bookmark, BookmarkCheck, BookMarked, Gauge } from "lucide-react";

const TAFSIR_COLORS = [
  { bg: "bg-blue-50 dark:bg-blue-900/20", border: "border-blue-200 dark:border-blue-800", text: "text-blue-700 dark:text-blue-300", content: "text-blue-900 dark:text-blue-200" },
  { bg: "bg-purple-50 dark:bg-purple-900/20", border: "border-purple-200 dark:border-purple-800", text: "text-purple-700 dark:text-purple-300", content: "text-purple-900 dark:text-purple-200" },
  { bg: "bg-green-50 dark:bg-green-900/20", border: "border-green-200 dark:border-green-800", text: "text-green-700 dark:text-green-300", content: "text-green-900 dark:text-green-200" },
];

export default function AyahCard({
  ayah, index,
  selectedSurah, currentAyah, searchScope, currentSurahName,
  isBookmarked,
  isWordByWordMode,
  currentPlayingAyah, currentPlayingWords, currentWordIndex,
  wordMeanings,
  fontSize, fontFamily,
  showTafsir, selectedTafsirs, tafsirData,
  playAyah, stopWordByWord, playWordByWord, toggleBookmark,
}) {
  const [hoveredWord, setHoveredWord] = useState(null);

  const currentAyahSurahNum = searchScope === "all" ? ayah.surah_number : selectedSurah;
  const isCurrentAyah = ayah.ayah_number === currentAyah && currentAyahSurahNum === selectedSurah;
  const isPlayingWordByWord = currentPlayingAyah === ayah.ayah_number && currentAyahSurahNum === selectedSurah;

  const renderAyahText = (ayahText, ayahNumber) => {
    if (!ayahText) return null;

    const words = ayahText.split(/(\s+)/);

    return words.map((word, i) => {
      if (/^\s+$/.test(word)) return word;

      const cleanWord = word
        .replace(/[\u064B-\u065F\u0670\u06D6-\u06ED]/g, '')
        .replace(/[أإآا]/g, 'ا')
        .replace(/[ىي]/g, 'ي')
        .replace(/ة/g, 'ه');

      const meaning = wordMeanings[cleanWord];

      let isCurrentWord = false;
      if (isWordByWordMode &&
          currentPlayingAyah === ayahNumber &&
          currentPlayingWords.length > 0 &&
          currentWordIndex >= 0 &&
          currentWordIndex < currentPlayingWords.length) {
        const apiWord = currentPlayingWords[currentWordIndex]
          .replace(/[\u064B-\u065F\u0670\u06D6-\u06ED]/g, '')
          .replace(/[أإآا]/g, 'ا')
          .replace(/[ىي]/g, 'ي')
          .replace(/ة/g, 'ه');
        isCurrentWord = cleanWord === apiWord;
      }

      if (meaning || isCurrentWord) {
        return (
          <span
            key={i}
            className={`
              inline-block cursor-pointer px-1 rounded transition-all duration-300 relative
              ${isCurrentWord ? 'bg-blue-500 text-white scale-110 shadow-xl ring-4 ring-blue-300 animate-pulse' : 'hover:bg-yellow-200 dark:hover:bg-yellow-700'}
            `}
            onMouseEnter={() => !isCurrentWord && setHoveredWord({ word, meaning, index: i })}
            onMouseLeave={() => setHoveredWord(null)}
          >
            {word}
            {hoveredWord?.index === i && !isCurrentWord && meaning && (
              <span className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-black text-white text-sm rounded-lg shadow-lg z-50 whitespace-nowrap">
                {meaning}
                <span className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-8 border-r-8 border-t-8 border-transparent border-t-black"></span>
              </span>
            )}
          </span>
        );
      }

      return <span key={i}>{word}</span>;
    });
  };

  return (
    <motion.div
      key={ayah.id || `${ayah.surah_number}-${ayah.ayah_number}`}
      id={`ayah-${ayah.ayah_number}`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
    >
      <Card className={`
        ${isCurrentAyah ? 'border-2 border-primary shadow-lg' : ''}
        ${isPlayingWordByWord ? 'border-2 border-blue-500 shadow-xl' : ''}
        hover:shadow-md transition-all
      `}>
        <CardContent className="p-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <Badge variant="outline" className="bg-primary/10 text-primary">
                {searchScope === "all" && ayah.surah_name ? (
                  <span className="ml-1">{ayah.surah_name} - آية {ayah.ayah_number}</span>
                ) : (
                  `آية ${ayah.ayah_number}`
                )}
              </Badge>
            </div>
            <div className="flex gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => playAyah(ayah.surah_number || selectedSurah, ayah.ayah_number)}
                title="تشغيل الآية كاملة"
              >
                <Volume2 className="w-4 h-4" />
              </Button>

              {isPlayingWordByWord ? (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={stopWordByWord}
                  className="text-red-600 hover:bg-red-50"
                  title="إيقاف التشغيل كلمة تلو كلمة"
                >
                  <VolumeX className="w-4 h-4" />
                </Button>
              ) : (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => playWordByWord(ayah.ayah_number, ayah.surah_number || selectedSurah)}
                  title="تشغيل كلمة تلو كلمة"
                  disabled={isWordByWordMode}
                  className="hover:bg-blue-50 hover:text-blue-600"
                >
                  <Gauge className="w-4 h-4" />
                </Button>
              )}

              <Button
                variant="ghost"
                size="icon"
                onClick={() => toggleBookmark(ayah.surah_number || selectedSurah, ayah.ayah_number)}
              >
                {isBookmarked ? (
                  <BookmarkCheck className="w-4 h-4 text-primary fill-primary" />
                ) : (
                  <Bookmark className="w-4 h-4" />
                )}
              </Button>
            </div>
          </div>

          <div className={`grid gap-6 ${showTafsir ? 'lg:grid-cols-2' : ''}`}>
            <div>
              <p
                className="text-center leading-loose arabic-font mb-4"
                style={{ fontSize: `${fontSize}px`, fontFamily: fontFamily }}
              >
                {renderAyahText(ayah.ayah_text, ayah.ayah_number)}
              </p>
              <div className="text-center text-sm text-foreground/70 mb-4">
                {ayah.surah_name || currentSurahName} - آية {ayah.ayah_number}
              </div>
            </div>

            {showTafsir && (
              <div className="space-y-3 border-t lg:border-t-0 lg:border-r lg:pr-6 pt-4 lg:pt-0">
                {selectedTafsirs.map((tafsir, idx) => {
                  if (tafsir === "none") return null;
                  if (!tafsirData[idx] || !tafsirData[idx][ayah.ayah_number]) {
                    return (
                      <div key={idx} className="p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
                        <p className="text-sm text-amber-800 dark:text-amber-300 font-medium mb-2">
                          📥 لا يوجد تفسير متاح لهذه الآية
                        </p>
                        <p className="text-xs text-amber-700 dark:text-amber-400">
                          💡 تحتاج لتحميل التفسير من <strong>الإعدادات → إدارة التفاسير</strong>
                        </p>
                      </div>
                    );
                  }

                  const color = TAFSIR_COLORS[idx];
                  return (
                    <div key={idx} className={`p-4 ${color.bg} border ${color.border} rounded-lg`}>
                      <h4 className={`font-semibold ${color.text} mb-2 flex items-center gap-2`}>
                        <BookMarked className="w-4 h-4" />
                        تفسير {tafsir}
                      </h4>
                      <p className={`${color.content} text-sm leading-relaxed`}>
                        {tafsirData[idx][ayah.ayah_number]}
                      </p>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

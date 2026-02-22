import { Loader2 } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import AyahCard from "./AyahCard";

export default function AyahList({
  filteredAyahs, searchQuery, isLoading,
  // AyahCard props
  selectedSurah, currentAyah, searchScope, currentSurahName,
  bookmarks,
  isWordByWordMode,
  currentPlayingAyah, currentPlayingWords, currentWordIndex,
  wordMeanings,
  fontSize, fontFamily,
  showTafsir, selectedTafsirs, tafsirData,
  playAyah, stopWordByWord, playWordByWord, toggleBookmark,
}) {
  if (isLoading && searchQuery.trim() === "") {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <AnimatePresence mode="wait">
        {filteredAyahs.length === 0 && searchQuery.trim() !== "" ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-8 text-foreground/70">
            لا توجد نتائج مطابقة لبحثك.
          </motion.div>
        ) : (
          filteredAyahs.map((ayah, index) => {
            const currentAyahSurahNum = searchScope === "all" ? ayah.surah_number : selectedSurah;
            const bookmarkId = `${currentAyahSurahNum}_${ayah.ayah_number}`;
            const isBookmarked = bookmarks.includes(bookmarkId);

            return (
              <AyahCard
                key={ayah.id || `${ayah.surah_number}-${ayah.ayah_number}`}
                ayah={ayah}
                index={index}
                selectedSurah={selectedSurah}
                currentAyah={currentAyah}
                searchScope={searchScope}
                currentSurahName={currentSurahName}
                isBookmarked={isBookmarked}
                isWordByWordMode={isWordByWordMode}
                currentPlayingAyah={currentPlayingAyah}
                currentPlayingWords={currentPlayingWords}
                currentWordIndex={currentWordIndex}
                wordMeanings={wordMeanings}
                fontSize={fontSize}
                fontFamily={fontFamily}
                showTafsir={showTafsir}
                selectedTafsirs={selectedTafsirs}
                tafsirData={tafsirData}
                playAyah={playAyah}
                stopWordByWord={stopWordByWord}
                playWordByWord={playWordByWord}
                toggleBookmark={toggleBookmark}
              />
            );
          })
        )}
      </AnimatePresence>
    </div>
  );
}

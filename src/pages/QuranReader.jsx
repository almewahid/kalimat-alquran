import { useState, useEffect, useRef } from "react";
import { supabaseClient } from "@/components/api/supabaseClient";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";
import { BookOpen } from "lucide-react";
import { motion } from "framer-motion";

import { SURAHS, removeArabicDiacritics } from "@/components/quran-reader/constants";
import SurahSelector from "@/components/quran-reader/SurahSelector";
import ReciterSelector from "@/components/quran-reader/ReciterSelector";
import SearchBar from "@/components/quran-reader/SearchBar";
import RangeControls from "@/components/quran-reader/RangeControls";
import PlaybackControls from "@/components/quran-reader/PlaybackControls";
import DisplaySettings from "@/components/quran-reader/DisplaySettings";
import AyahList from "@/components/quran-reader/AyahList";

export default function QuranReader() {
  const { toast } = useToast();
  const audioRef = useRef(null);
  const wordByWordStopRef = useRef(false);

  const [selectedSurah, setSelectedSurah] = useState(1);
  const [ayahs, setAyahs] = useState([]);
  const [allAyahs, setAllAyahs] = useState([]);
  const [currentAyah, setCurrentAyah] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchScope, setSearchScope] = useState("current");
  const [bookmarks, setBookmarks] = useState([]);
  const [selectedReciter, setSelectedReciter] = useState("Husary_128kbps");
  const [playbackSpeed, setPlaybackSpeed] = useState(1.0);
  const [customReciters] = useState([]);

  const [isPlaying, setIsPlaying] = useState(false);
  const [autoPlay, setAutoPlay] = useState(false);

  const [fromAyah, setFromAyah] = useState(1);
  const [toAyah, setToAyah] = useState(1);

  const [fontSize, setFontSize] = useState(24);
  const [fontFamily, setFontFamily] = useState("Amiri");
  const [repeatAyah, setRepeatAyah] = useState(false);

  const [showTafsir, setShowTafsir] = useState(false);
  const [selectedTafsirs, setSelectedTafsirs] = useState(["none", "none", "none"]);
  const [tafsirData, setTafsirData] = useState([{}, {}, {}]);

  const [wordMeanings, setWordMeanings] = useState({});

  const [isWordByWordMode, setIsWordByWordMode] = useState(false);
  const [currentWordIndex, setCurrentWordIndex] = useState(-1);
  const [currentPlayingAyah, setCurrentPlayingAyah] = useState(null);
  const [currentPlayingWords, setCurrentPlayingWords] = useState([]);

  // تحميل كل آيات القرآن مرة واحدة عند أول تشغيل فقط (للبحث الشامل)
  useEffect(() => {
    loadAllAyahs();
    loadBookmarks();
  }, []);

  // إعادة تحميل بيانات السورة عند تغييرها
  useEffect(() => {
    loadSurah(selectedSurah);
    loadWordMeanings();
  }, [selectedSurah]);

  useEffect(() => {
    if (showTafsir && ayahs.length > 0) {
      selectedTafsirs.forEach((tafsir, index) => {
        if (tafsir !== "none") {
          loadTafsir(selectedSurah, tafsir, index);
        }
      });
    }
  }, [showTafsir, selectedTafsirs, selectedSurah]);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.playbackRate = playbackSpeed;
    }
  }, [playbackSpeed]);

  const loadSurah = async (surahNumber) => {
    setIsLoading(true);
    try {
      const ayahsData = await supabaseClient.entities.QuranAyah.filter(
        { surah_number: surahNumber },
        'ayah_number',
        500
      );
      const sortedAyahs = ayahsData.sort((a, b) => a.ayah_number - b.ayah_number);
      setAyahs(sortedAyahs);
      setCurrentAyah(1);
      setFromAyah(1);
      setToAyah(sortedAyahs.length);
    } catch (error) {
      console.error("Error loading surah:", error);
      toast({ title: "خطأ في التحميل", description: "حدث خطأ أثناء تحميل السورة", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const loadAllAyahs = async () => {
    try {
      const allData = await supabaseClient.entities.QuranAyah.list('-id', 7000);
      setAllAyahs(allData);
    } catch (error) {
      console.error("Error loading all ayahs:", error);
    }
  };

  const loadWordMeanings = async () => {
    try {
      let words = [];
      if (searchScope === "all" && searchQuery) {
        words = await supabaseClient.entities.QuranicWord.list();
      } else {
        words = await supabaseClient.entities.QuranicWord.filter({
          surah_name: SURAHS.find(s => s.number === selectedSurah)?.name
        });
      }
      const meaningsMap = {};
      words.forEach(word => {
        const cleanWord = word.word?.replace(/[\u064B-\u065F\u0670]/g, '');
        if (cleanWord) meaningsMap[cleanWord] = word.meaning;
      });
      setWordMeanings(meaningsMap);
    } catch (error) {
      console.log("Could not load word meanings:", error);
    }
  };

  const loadTafsir = async (surahNumber, tafsirName, index) => {
    try {
      if (tafsirName === "none") return;
      const localTafsirs = await supabaseClient.entities.QuranTafsir.filter({
        surah_number: surahNumber,
        tafsir_name: tafsirName
      });
      let tafsirMap = {};
      if (localTafsirs && localTafsirs.length > 0) {
        localTafsirs.forEach(t => { tafsirMap[t.ayah_number] = t.tafsir_text; });
      } else {
        try {
          const tafsirId = tafsirName.replace('ar-tafseer-', '');
          const response = await fetch(`https://api.quran.com/api/v4/quran/tafsirs/${tafsirId}`);
          if (response.ok) {
            const data = await response.json();
            data.tafsirs?.forEach(t => {
              const verseKey = t.verse_key.split(':');
              if (parseInt(verseKey[0]) === surahNumber) {
                tafsirMap[parseInt(verseKey[1])] = t.text;
              }
            });
          }
        } catch (apiError) {
          console.error("Error loading from API:", apiError);
        }
      }
      setTafsirData(prev => {
        const newData = [...prev];
        newData[index] = tafsirMap;
        return newData;
      });
    } catch (error) {
      console.error("Error loading tafsir:", error);
    }
  };

  const loadBookmarks = async () => {
    try {
      const user = await supabaseClient.auth.me();
      setBookmarks(user.preferences?.quran_bookmarks || []);
    } catch (error) {
      console.log("Error loading bookmarks:", error);
    }
  };

  const toggleBookmark = async (surahNum, ayahNum) => {
    try {
      const user = await supabaseClient.auth.me();
      const bookmarkId = `${surahNum}_${ayahNum}`;
      const currentBookmarks = user.preferences?.quran_bookmarks || [];
      let newBookmarks;
      if (currentBookmarks.includes(bookmarkId)) {
        newBookmarks = currentBookmarks.filter(b => b !== bookmarkId);
        toast({ title: "تم إزالة العلامة المرجعية" });
      } else {
        newBookmarks = [...currentBookmarks, bookmarkId];
        toast({ title: "تمت إضافة علامة مرجعية" });
      }
      await supabaseClient.auth.updateMe({ preferences: { ...user.preferences, quran_bookmarks: newBookmarks } });
      setBookmarks(newBookmarks);
    } catch (error) {
      console.error("Error toggling bookmark:", error);
    }
  };

  const playAyah = (surahNum, ayahNum) => {
    const audioUrl = `https://everyayah.com/data/${selectedReciter}/${String(surahNum).padStart(3, '0')}${String(ayahNum).padStart(3, '0')}.mp3`;
    if (audioRef.current) {
      audioRef.current.src = audioUrl;
      audioRef.current.playbackRate = playbackSpeed;
      audioRef.current.play();
      setIsPlaying(true);
      setCurrentAyah(ayahNum);
      if (surahNum !== selectedSurah && searchScope === "all") {
        setSelectedSurah(surahNum);
      }
      setTimeout(() => {
        document.getElementById(`ayah-${ayahNum}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 100);
    }
  };

  const pauseAyah = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      setIsPlaying(false);
    }
  };

  const handleAudioEnd = () => {
    if (repeatAyah) {
      setTimeout(() => playAyah(selectedSurah, currentAyah), 500);
    } else {
      setIsPlaying(false);
      if (autoPlay && currentAyah < toAyah && currentAyah < ayahs.length) {
        setTimeout(() => playAyah(selectedSurah, currentAyah + 1), 500);
      } else {
        setAutoPlay(false);
      }
    }
  };

  const goToNextAyah = () => {
    if (currentAyah < ayahs.length) {
      const nextAyah = currentAyah + 1;
      setCurrentAyah(nextAyah);
      if (isPlaying) playAyah(selectedSurah, nextAyah);
    }
  };

  const goToPreviousAyah = () => {
    if (currentAyah > 1) {
      const prevAyah = currentAyah - 1;
      setCurrentAyah(prevAyah);
      if (isPlaying) playAyah(selectedSurah, prevAyah);
    }
  };

  const playSelectedRange = () => {
    if (fromAyah < 1 || toAyah > ayahs.length || fromAyah > toAyah) {
      toast({ title: "نطاق غير صحيح", description: "الرجاء اختيار نطاق صحيح من الآيات", variant: "destructive" });
      return;
    }
    setCurrentAyah(fromAyah);
    playAyah(selectedSurah, fromAyah);
    setAutoPlay(true);
  };

  const playWordAudio = (audioUrl) => {
    return new Promise((resolve) => {
      const fullUrl = audioUrl.startsWith('http') ? audioUrl : `https://verses.quran.com/${audioUrl}`;
      const audio = new Audio(fullUrl);
      audio.onended = () => resolve();
      audio.onerror = () => resolve();
      audio.play().catch(() => resolve());
    });
  };

  const playWordByWord = async (ayahNumber, surahNumber) => {
    setIsWordByWordMode(true);
    setCurrentPlayingAyah(ayahNumber);
    setCurrentWordIndex(0);
    wordByWordStopRef.current = false;
    try {
      const response = await fetch(
        `https://api.quran.com/api/v4/verses/by_key/${surahNumber}:${ayahNumber}?words=true&word_fields=text_uthmani,audio_url`
      );
      if (!response.ok) throw new Error('Failed to fetch word data');
      const data = await response.json();
      const words = data.verse?.words || [];
      if (words.length === 0) {
        toast({ title: "غير متوفر", description: "الصوت الكلمة تلو الكلمة غير متوفر لهذه الآية", variant: "destructive" });
        setIsWordByWordMode(false);
        setCurrentPlayingAyah(null);
        return;
      }
      setCurrentPlayingWords(words.map(w => w.text_uthmani));
      for (let i = 0; i < words.length; i++) {
        if (wordByWordStopRef.current) break;
        const word = words[i];
        if (word.audio_url) {
          setCurrentWordIndex(i);
          await playWordAudio(word.audio_url);
          await new Promise(resolve => setTimeout(resolve, 400));
        }
      }
      setIsWordByWordMode(false);
      setCurrentWordIndex(-1);
      setCurrentPlayingAyah(null);
      setCurrentPlayingWords([]);
    } catch (error) {
      console.error("Error in word-by-word playback:", error);
      toast({ title: "خطأ", description: "فشل تشغيل الصوت كلمة تلو كلمة. تأكد من اتصال الإنترنت.", variant: "destructive" });
      setIsWordByWordMode(false);
      setCurrentWordIndex(-1);
      setCurrentPlayingAyah(null);
      setCurrentPlayingWords([]);
    }
  };

  const stopWordByWord = () => {
    wordByWordStopRef.current = true;
    if (audioRef.current && !audioRef.current.paused) {
      audioRef.current.pause();
      audioRef.current.src = '';
    }
    setIsWordByWordMode(false);
    setCurrentWordIndex(-1);
    setCurrentPlayingAyah(null);
  };

  const filteredAyahs = searchQuery.trim()
    ? (() => {
        const cleanQuery = removeArabicDiacritics(searchQuery.trim());
        const dataToSearch = searchScope === "all" ? allAyahs : ayahs;
        return dataToSearch.filter(ayah => {
          const cleanText = removeArabicDiacritics(ayah.ayah_text || ayah.ayah_text_simple || "");
          return cleanText.includes(cleanQuery);
        });
      })()
    : ayahs;

  const currentSurahName = SURAHS.find(s => s.number === selectedSurah)?.name || "";

  return (
    <div className="min-h-screen p-4 md:p-6">
      <audio ref={audioRef} onEnded={handleAudioEnd} preload="none" />

      <div className="max-w-6xl mx-auto">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <BookOpen className="w-8 h-8 text-primary" />
              <h1 className="text-3xl font-bold gradient-text">قارئ القرآن الكريم</h1>
            </div>
            <Badge className="bg-primary/10 text-primary">
              {currentSurahName} - آية {currentAyah}
            </Badge>
          </div>
        </motion.div>

        <Card className="mb-6 bg-card">
          <CardContent className="p-4">
            <div className="grid md:grid-cols-3 gap-4">
              <SurahSelector selectedSurah={selectedSurah} setSelectedSurah={setSelectedSurah} />
              <ReciterSelector
                selectedReciter={selectedReciter}
                setSelectedReciter={setSelectedReciter}
                customReciters={customReciters}
                playbackSpeed={playbackSpeed}
                setPlaybackSpeed={setPlaybackSpeed}
              />
              <SearchBar
                searchQuery={searchQuery}
                setSearchQuery={setSearchQuery}
                searchScope={searchScope}
                setSearchScope={setSearchScope}
                filteredAyahs={filteredAyahs}
                currentSurahName={currentSurahName}
              />
            </div>

            <RangeControls
              fromAyah={fromAyah}
              setFromAyah={setFromAyah}
              toAyah={toAyah}
              setToAyah={setToAyah}
              ayahCount={ayahs.length}
              playSelectedRange={playSelectedRange}
            />

            <PlaybackControls
              currentAyah={currentAyah}
              ayahCount={ayahs.length}
              isPlaying={isPlaying}
              autoPlay={autoPlay}
              setAutoPlay={setAutoPlay}
              goToPreviousAyah={goToPreviousAyah}
              goToNextAyah={goToNextAyah}
              playAyah={playAyah}
              pauseAyah={pauseAyah}
              selectedSurah={selectedSurah}
            />

            <DisplaySettings
              fontSize={fontSize}
              setFontSize={setFontSize}
              fontFamily={fontFamily}
              setFontFamily={setFontFamily}
              repeatAyah={repeatAyah}
              setRepeatAyah={setRepeatAyah}
              showTafsir={showTafsir}
              setShowTafsir={setShowTafsir}
              selectedTafsirs={selectedTafsirs}
              setSelectedTafsirs={setSelectedTafsirs}
            />
          </CardContent>
        </Card>

        <AyahList
          filteredAyahs={filteredAyahs}
          searchQuery={searchQuery}
          isLoading={isLoading}
          selectedSurah={selectedSurah}
          currentAyah={currentAyah}
          searchScope={searchScope}
          currentSurahName={currentSurahName}
          bookmarks={bookmarks}
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
      </div>
    </div>
  );
}

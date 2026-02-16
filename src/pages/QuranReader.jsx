import React, { useState, useEffect, useRef } from "react";
import { supabaseClient } from "@/components/api/supabaseClient";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import { Switch } from "@/components/ui/switch";
import { 
  BookOpen, 
  Search, 
  Volume2, 
  VolumeX, 
  Play, 
  Pause, 
  SkipBack, 
  SkipForward,
  Bookmark,
  BookmarkCheck,
  Loader2,
  Type,
  BookMarked,
  Settings2,
  PlusCircle,
  Gauge
} from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Slider } from "@/components/ui/slider";
import { motion, AnimatePresence } from "framer-motion";

const SURAHS = [
  { number: 1, name: "الفاتحة", ayahCount: 7 },
  { number: 2, name: "البقرة", ayahCount: 286 },
  { number: 3, name: "آل عمران", ayahCount: 200 },
  { number: 4, name: "النساء", ayahCount: 176 },
  { number: 5, name: "المائدة", ayahCount: 120 },
  { number: 6, name: "الأنعام", ayahCount: 165 },
  { number: 7, name: "الأعراف", ayahCount: 206 },
  { number: 8, name: "الأنفال", ayahCount: 75 },
  { number: 9, name: "التوبة", ayahCount: 129 },
  { number: 10, name: "يونس", ayahCount: 109 },
  { number: 11, name: "هود", ayahCount: 123 },
  { number: 12, name: "يوسف", ayahCount: 111 },
  { number: 13, name: "الرعد", ayahCount: 43 },
  { number: 14, name: "إبراهيم", ayahCount: 52 },
  { number: 15, name: "الحجر", ayahCount: 99 },
  { number: 16, name: "النحل", ayahCount: 128 },
  { number: 17, name: "الإسراء", ayahCount: 111 },
  { number: 18, name: "الكهف", ayahCount: 110 },
  { number: 19, name: "مريم", ayahCount: 98 },
  { number: 20, name: "طه", ayahCount: 135 },
  { number: 21, name: "الأنبياء", ayahCount: 112 },
  { number: 22, name: "الحج", ayahCount: 78 },
  { number: 23, name: "المؤمنون", ayahCount: 118 },
  { number: 24, name: "النور", ayahCount: 64 },
  { number: 25, name: "الفرقان", ayahCount: 77 },
  { number: 26, name: "الشعراء", ayahCount: 227 },
  { number: 27, name: "النمل", ayahCount: 93 },
  { number: 28, name: "القصص", ayahCount: 88 },
  { number: 29, name: "العنكبوت", ayahCount: 69 },
  { number: 30, name: "الروم", ayahCount: 60 },
  { number: 31, name: "لقمان", ayahCount: 34 },
  { number: 32, name: "السجدة", ayahCount: 30 },
  { number: 33, name: "الأحزاب", ayahCount: 73 },
  { number: 34, name: "سبأ", ayahCount: 54 },
  { number: 35, name: "فاطر", ayahCount: 45 },
  { number: 36, name: "يس", ayahCount: 83 },
  { number: 37, name: "الصافات", ayahCount: 182 },
  { number: 38, name: "ص", ayahCount: 88 },
  { number: 39, name: "الزمر", ayahCount: 75 },
  { number: 40, name: "غافر", ayahCount: 85 },
  { number: 41, name: "فصلت", ayahCount: 54 },
  { number: 42, name: "الشورى", ayahCount: 53 },
  { number: 43, name: "الزخرف", ayahCount: 89 },
  { number: 44, name: "الدخان", ayahCount: 59 },
  { number: 45, name: "الجاثية", ayahCount: 37 },
  { number: 46, name: "الأحقاف", ayahCount: 35 },
  { number: 47, name: "محمد", ayahCount: 38 },
  { number: 48, name: "الفتح", ayahCount: 29 },
  { number: 49, name: "الحجرات", ayahCount: 18 },
  { number: 50, name: "ق", ayahCount: 45 },
  { number: 51, name: "الذاريات", ayahCount: 60 },
  { number: 52, name: "الطور", ayahCount: 49 },
  { number: 53, name: "النجم", ayahCount: 62 },
  { number: 54, name: "القمر", ayahCount: 55 },
  { number: 55, name: "الرحمن", ayahCount: 78 },
  { number: 56, name: "الواقعة", ayahCount: 96 },
  { number: 57, name: "الحديد", ayahCount: 29 },
  { number: 58, name: "المجادلة", ayahCount: 22 },
  { number: 59, name: "الحشر", ayahCount: 24 },
  { number: 60, name: "الممتحنة", ayahCount: 13 },
  { number: 61, name: "الصف", ayahCount: 14 },
  { number: 62, name: "الجمعة", ayahCount: 11 },
  { number: 63, name: "المنافقون", ayahCount: 11 },
  { number: 64, name: "التغابن", ayahCount: 18 },
  { number: 65, name: "الطلاق", ayahCount: 12 },
  { number: 66, name: "التحريم", ayahCount: 12 },
  { number: 67, name: "الملك", ayahCount: 30 },
  { number: 68, name: "القلم", ayahCount: 52 },
  { number: 69, name: "الحاقة", ayahCount: 52 },
  { number: 70, name: "المعارج", ayahCount: 44 },
  { number: 71, name: "نوح", ayahCount: 28 },
  { number: 72, name: "الجن", ayahCount: 28 },
  { number: 73, name: "المزمل", ayahCount: 20 },
  { number: 74, name: "المدثر", ayahCount: 56 },
  { number: 75, name: "القيامة", ayahCount: 40 },
  { number: 76, name: "الإنسان", ayahCount: 31 },
  { number: 77, name: "المرسلات", ayahCount: 50 },
  { number: 78, name: "النبأ", ayahCount: 40 },
  { number: 79, name: "النازعات", ayahCount: 46 },
  { number: 80, name: "عبس", ayahCount: 42 },
  { number: 81, name: "التكوير", ayahCount: 29 },
  { number: 82, name: "الانفطار", ayahCount: 19 },
  { number: 83, name: "المطففين", ayahCount: 36 },
  { number: 84, name: "الانشقاق", ayahCount: 25 },
  { number: 85, name: "البروج", ayahCount: 22 },
  { number: 86, name: "الطارق", ayahCount: 17 },
  { number: 87, name: "الأعلى", ayahCount: 19 },
  { number: 88, name: "الغاشية", ayahCount: 26 },
  { number: 89, name: "الفجر", ayahCount: 30 },
  { number: 90, name: "البلد", ayahCount: 20 },
  { number: 91, name: "الشمس", ayahCount: 15 },
  { number: 92, name: "الليل", ayahCount: 21 },
  { number: 93, name: "الضحى", ayahCount: 11 },
  { number: 94, name: "الشرح", ayahCount: 8 },
  { number: 95, name: "التين", ayahCount: 8 },
  { number: 96, name: "العلق", ayahCount: 19 },
  { number: 97, name: "القدر", ayahCount: 5 },
  { number: 98, name: "البينة", ayahCount: 8 },
  { number: 99, name: "الزلزلة", ayahCount: 8 },
  { number: 100, name: "العاديات", ayahCount: 11 },
  { number: 101, name: "القارعة", ayahCount: 11 },
  { number: 102, name: "التكاثر", ayahCount: 8 },
  { number: 103, name: "العصر", ayahCount: 3 },
  { number: 104, name: "الهمزة", ayahCount: 9 },
  { number: 105, name: "الفيل", ayahCount: 5 },
  { number: 106, name: "قريش", ayahCount: 4 },
  { number: 107, name: "الماعون", ayahCount: 7 },
  { number: 108, name: "الكوثر", ayahCount: 3 },
  { number: 109, name: "الكافرون", ayahCount: 6 },
  { number: 110, name: "النصر", ayahCount: 3 },
  { number: 111, name: "المسد", ayahCount: 5 },
  { number: 112, name: "الإخلاص", ayahCount: 4 },
  { number: 113, name: "الفلق", ayahCount: 5 },
  { number: 114, name: "الناس", ayahCount: 6 }
];

const RECITERS = [
  { id: "Husary_128kbps", name: "محمود خليل الحصري" },
  { id: "Abdul_Basit_Murattal_192kbps", name: "عبد الباسط عبد الصمد" },
  { id: "Minshawy_Murattal_128kbps", name: "محمد صديق المنشاوي" },
  { id: "Alafasy_128kbps", name: "مشاري العفاسي" },
  { id: "Ghamadi_40kbps", name: "سعد الغامدي" }
];

const TAFSIR_OPTIONS = [
  { id: "none", name: "بدون تفسير" },
  { id: "ar-tafseer-al-jalalayn", name: "الجلالين" },
  { id: "ar-tafseer-al-qurtubi", name: "القرطبي" },
  { id: "ar-tafseer-ibn-katheer", name: "ابن كثير" },
  { id: "ar-tafseer-al-sa-dee", name: "السعدي" },
  { id: "ar-tafseer-al-muyassar", name: "الميسر" }
];

// دالة لإزالة التشكيل من النص العربي
const removeArabicDiacritics = (text) => {
  if (!text) return "";
  return text
    .replace(/[\u064B-\u065F\u0670]/g, "") // إزالة التشكيل
    .replace(/[أإآٱ]/g, "ا") // توحيد الألف
    .replace(/ى/g, "ي") // توحيد الياء
    .replace(/ؤ/g, "و") // تحويل الواو المهموزة
    .replace(/ئ/g, "ي") // تحويل الياء المهموزة
    .replace(/ة/g, "ه") // توحيد التاء المربوطة
    .trim();
};

export default function QuranReader() {
  const { toast } = useToast();
  const audioRef = useRef(null);
  const wordByWordStopRef = useRef(false); // ✅ للتحكم بإيقاف الكلمات
  
  const [selectedSurah, setSelectedSurah] = useState(1);
  const [ayahs, setAyahs] = useState([]);
  const [allAyahs, setAllAyahs] = useState([]); // لتخزين كل الآيات للبحث الشامل
  const [currentAyah, setCurrentAyah] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchScope, setSearchScope] = useState("current"); // current أو all
  const [bookmarks, setBookmarks] = useState([]);
  const [selectedReciter, setSelectedReciter] = useState("Husary_128kbps");
  const [playbackSpeed, setPlaybackSpeed] = useState(1.0);
  const [showRecitersModal, setShowRecitersModal] = useState(false);
  const [customReciters, setCustomReciters] = useState([]); // In a real app, load from DB/Storage

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
  const [hoveredWord, setHoveredWord] = useState(null);
  
  const [isWordByWordMode, setIsWordByWordMode] = useState(false);
  const [currentWordIndex, setCurrentWordIndex] = useState(-1);
  const [currentPlayingAyah, setCurrentPlayingAyah] = useState(null);
  const [currentPlayingWords, setCurrentPlayingWords] = useState([]); // ✅ حفظ الكلمات من API

  useEffect(() => {
    loadSurah(selectedSurah);
    loadBookmarks();
    loadWordMeanings();
    loadAllAyahs(); // تحميل كل الآيات مرة واحدة للبحث
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

  const loadSurah = async (surahNumber) => {
    setIsLoading(true);
    try {
      const ayahsData = await supabaseClient.entities.QuranAyah.filter(
  { surah_number: surahNumber },
  'ayah_number', // ترتيب تصاعدي
  500 // ← كافي لأطول سورة (البقرة 286 آية)
);
      
      const sortedAyahs = ayahsData.sort((a, b) => a.ayah_number - b.ayah_number);
      setAyahs(sortedAyahs);
      setCurrentAyah(1);
      setFromAyah(1);
      setToAyah(sortedAyahs.length);
    } catch (error) {
      console.error("Error loading surah:", error);
      toast({
        title: "خطأ في التحميل",
        description: "حدث خطأ أثناء تحميل السورة",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  // تحميل كل آيات القرآن للبحث الشامل
  const loadAllAyahs = async () => {
    try {
      const allData = await supabaseClient.entities.QuranAyah.list('-id', 7000); // 7000 آية (القرآن كاملاً)
      setAllAyahs(allData);
    } catch (error) {
      console.error("Error loading all ayahs:", error);
    }
  };

  const loadWordMeanings = async () => {
    try {
      // Load meanings for current displayed ayahs (optimization: could filter by ayah range if huge)
      // For now, load all words for the selected surah OR all words if global search
      let words = [];
      if (searchScope === "all" && searchQuery) {
          // If searching globally, we might need all words. 
          // Optimization: fetch words only for displayed ayahs in result?
          // For simplicity, let's fetch all words (might be heavy, maybe stick to current surah logic and accept limitations or paginate)
          // Better: just fetch words.
          words = await supabaseClient.entities.QuranicWord.list();
      } else {
          words = await supabaseClient.entities.QuranicWord.filter({
            surah_name: SURAHS.find(s => s.number === selectedSurah)?.name
          });
      }
      
      const meaningsMap = {};
      words.forEach(word => {
        const cleanWord = word.word?.replace(/[\u064B-\u065F\u0670]/g, '');
        if (cleanWord) {
          meaningsMap[cleanWord] = word.meaning;
        }
      });
      
      setWordMeanings(meaningsMap);
    } catch (error) {
      console.log("Could not load word meanings:", error);
    }
  };

  const loadTafsir = async (surahNumber, tafsirName, index) => {
    try {
      if (tafsirName === "none") return;
      
      // محاولة التحميل من قاعدة البيانات المحلية أولاً
      const localTafsirs = await supabaseClient.entities.QuranTafsir.filter({
        surah_number: surahNumber,
        tafsir_name: tafsirName
      });

      let tafsirMap = {};
      
      if (localTafsirs && localTafsirs.length > 0) {
        // التفسير موجود محلياً
        localTafsirs.forEach(t => {
          tafsirMap[t.ayah_number] = t.tafsir_text;
        });
      } else {
        // التحميل من API خارجية كبديل
        try {
          const tafsirId = tafsirName.replace('ar-tafseer-', '');
          const response = await fetch(
            `https://api.quran.com/api/v4/quran/tafsirs/${tafsirId}`
          );
          
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
      const userBookmarks = user.preferences?.quran_bookmarks || [];
      setBookmarks(userBookmarks);
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
      
      await supabaseClient.auth.updateMe({
        preferences: {
          ...user.preferences,
          quran_bookmarks: newBookmarks
        }
      });
      
      setBookmarks(newBookmarks);
    } catch (error) {
      console.error("Error toggling bookmark:", error);
    }
  };

  const playSelectedRange = () => {
    if (fromAyah < 1 || toAyah > ayahs.length || fromAyah > toAyah) {
      toast({ 
        title: "نطاق غير صحيح", 
        description: "الرجاء اختيار نطاق صحيح من الآيات",
        variant: "destructive"
      });
      return;
    }
    
    setCurrentAyah(fromAyah);
    playAyah(selectedSurah, fromAyah);
    setAutoPlay(true);
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
      
      // التمرير التلقائي للآية
      setTimeout(() => {
        const ayahElement = document.getElementById(`ayah-${ayahNum}`);
        if (ayahElement) {
          ayahElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 100);
    }
  };

  // Update speed dynamically if playing
  useEffect(() => {
    if (audioRef.current) {
        audioRef.current.playbackRate = playbackSpeed;
    }
  }, [playbackSpeed]);

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
      if (isPlaying) {
        playAyah(selectedSurah, nextAyah);
      }
    }
  };

  const goToPreviousAyah = () => {
    if (currentAyah > 1) {
      const prevAyah = currentAyah - 1;
      setCurrentAyah(prevAyah);
      if (isPlaying) {
        playAyah(selectedSurah, prevAyah);
      }
    }
  };

  const playWordByWord = async (ayahNumber, surahNumber) => {
    setIsWordByWordMode(true);
    setCurrentPlayingAyah(ayahNumber);
    setCurrentWordIndex(0);
    wordByWordStopRef.current = false; // ✅ السماح بالتشغيل
    
    try {
      const response = await fetch(
        `https://api.quran.com/api/v4/verses/by_key/${surahNumber}:${ayahNumber}?words=true&word_fields=text_uthmani,audio_url`
      );
      
      if (!response.ok) {
        throw new Error('Failed to fetch word data');
      }
      
      const data = await response.json();
      const words = data.verse?.words || [];
      
      if (words.length === 0) {
        toast({
          title: "غير متوفر",
          description: "الصوت الكلمة تلو الكلمة غير متوفر لهذه الآية",
          variant: "destructive"
        });
        setIsWordByWordMode(false);
        setCurrentPlayingAyah(null);
        return;
      }
      
      // ✅ حفظ الكلمات من API
      setCurrentPlayingWords(words.map(w => w.text_uthmani));
      
      // ✅ تحميل أول كلمة مسبقاً للحصول على user interaction
      if (words[0]?.audio_url) {
        const firstAudio = new Audio(words[0].audio_url);
        firstAudio.load();
      }
      
      for (let i = 0; i < words.length; i++) {
        if (wordByWordStopRef.current) break; // ✅ التحقق من ref
        
        const word = words[i];
        
        if (word.audio_url) {
          setCurrentWordIndex(i); // ✅ تحديث الآن قبل التشغيل
          await playWordAudio(word.audio_url);
          await new Promise(resolve => setTimeout(resolve, 400));
        }
      }
      
      setIsWordByWordMode(false);
      setCurrentWordIndex(-1);
      setCurrentPlayingAyah(null);
      setCurrentPlayingWords([]); // ✅ مسح الكلمات
      
    } catch (error) {
      console.error("Error in word-by-word playback:", error);
      toast({
        title: "خطأ",
        description: "فشل تشغيل الصوت كلمة تلو كلمة. تأكد من اتصال الإنترنت.",
        variant: "destructive"
      });
      setIsWordByWordMode(false);
      setCurrentWordIndex(-1);
      setCurrentPlayingAyah(null);
      setCurrentPlayingWords([]);
    }
  };

  const playWordAudio = (audioUrl) => {
    return new Promise((resolve, reject) => {
      // ✅ إضافة base URL إذا كان الرابط نسبياً
      const fullUrl = audioUrl.startsWith('http') 
        ? audioUrl 
        : `https://verses.quran.com/${audioUrl}`;
      
      const audio = new Audio(fullUrl);
      audio.onended = () => resolve();
      audio.onerror = (error) => {
        console.warn('Audio playback failed:', fullUrl, error);
        resolve(); // ✅ نستمر بدلاً من reject
      };
      
      // ✅ محاولة التشغيل مع معالجة الخطأ
      audio.play().catch((err) => {
        console.warn('Play rejected:', err);
        resolve(); // ✅ نستمر بدلاً من reject
      });
    });
  };

  const stopWordByWord = () => {
    wordByWordStopRef.current = true; // ✅ إيقاف التشغيل
    
    // If an audio is playing through audioRef, stop it.
    if (audioRef.current && !audioRef.current.paused) {
      audioRef.current.pause();
      audioRef.current.src = ''; // Clear source to prevent unexpected playback
    }
    setIsWordByWordMode(false);
    setCurrentWordIndex(-1);
    setCurrentPlayingAyah(null);
  };

  // البحث المحسّن (مع وبدون تشكيل + في السورة أو القرآن كله)
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

  const renderAyahTextWithMeanings = (ayahText, ayahNumber) => {
    if (!ayahText) return null;
    
    const words = ayahText.split(/(\s+)/);
    
    return words.map((word, index) => {
      if (/^\s+$/.test(word)) return word;
      
      // ✅ تنظيف شامل للكلمة (إزالة كل التشكيل)
      const cleanWord = word
        .replace(/[\u064B-\u065F\u0670\u06D6-\u06ED]/g, '') // كل التشكيل
        .replace(/[أإآا]/g, 'ا') // توحيد الألف
        .replace(/[ىي]/g, 'ي') // توحيد الياء
        .replace(/ة/g, 'ه'); // تاء مربوطة
      
      const meaning = wordMeanings[cleanWord];
      
      // ✅ مطابقة الكلمة مع الكلمات من API
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
            key={index}
            className={`
              inline-block cursor-pointer px-1 rounded transition-all duration-300 relative
              ${isCurrentWord ? 'bg-blue-500 text-white scale-110 shadow-xl ring-4 ring-blue-300 animate-pulse' : 'hover:bg-yellow-200 dark:hover:bg-yellow-700'}
            `}
            onMouseEnter={() => !isCurrentWord && setHoveredWord({ word, meaning, index })}
            onMouseLeave={() => setHoveredWord(null)}
          >
            {word}
            {hoveredWord?.index === index && !isCurrentWord && meaning && (
              <span className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-black text-white text-sm rounded-lg shadow-lg z-50 whitespace-nowrap">
                {meaning}
                <span className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-8 border-r-8 border-t-8 border-transparent border-t-black"></span>
              </span>
            )}
          </span>
        );
      }
      
      return <span key={index}>{word}</span>;
    });
  };

  return (
    <div className="min-h-screen p-4 md:p-6">
      <audio ref={audioRef} onEnded={handleAudioEnd} preload="none" />

      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
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
              <div>
                <label className="text-sm font-medium mb-2 block">اختر السورة</label>
                <Select value={String(selectedSurah)} onValueChange={(v) => setSelectedSurah(Number(v))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="max-h-[300px]">
                    {SURAHS.map(surah => (
                      <SelectItem key={surah.number} value={String(surah.number)}>
                        {surah.number}. {surah.name} ({surah.ayahCount} آية)
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">القارئ والصوت</label>
                <div className="flex gap-2">
                    <Select value={selectedReciter} onValueChange={setSelectedReciter}>
                    <SelectTrigger className="flex-1">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        {RECITERS.map(reciter => (
                        <SelectItem key={reciter.id} value={reciter.id}>
                            {reciter.name}
                        </SelectItem>
                        ))}
                        {customReciters.map(reciter => (
                        <SelectItem key={reciter.id} value={reciter.id}>
                            {reciter.name} (مخصص)
                        </SelectItem>
                        ))}
                    </SelectContent>
                    </Select>
                    
                    <Dialog>
                        <DialogTrigger asChild>
                            <Button variant="outline" size="icon" title="إعدادات التلاوة">
                                <Settings2 className="w-4 h-4" />
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>إدارة التلاوات والصوت</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-6 py-4">
                                <div>
                                    <label className="text-sm font-medium mb-2 flex items-center gap-2">
                                        <Gauge className="w-4 h-4" /> سرعة التلاوة ({playbackSpeed}x)
                                    </label>
                                    <Slider 
                                        value={[playbackSpeed]} 
                                        min={0.5} 
                                        max={2.0} 
                                        step={0.1} 
                                        onValueChange={([v]) => setPlaybackSpeed(v)} 
                                        className="w-full"
                                    />
                                    <div className="flex justify-between text-xs text-muted-foreground mt-1">
                                        <span>0.5x (بطيء)</span>
                                        <span>1.0x (عادي)</span>
                                        <span>2.0x (سريع)</span>
                                    </div>
                                </div>

                                <div className="border-t pt-4">
                                    <h4 className="font-medium mb-2">إضافة قراء جدد</h4>
                                    <p className="text-sm text-muted-foreground mb-3">يمكنك إضافة روابط تلاوات مخصصة هنا (ميزة تجريبية)</p>
                                    <Button variant="outline" className="w-full" onClick={() => toast({title: "قريباً", description: "سيتم تفعيل إضافة القراء قريباً"})}>
                                        <PlusCircle className="w-4 h-4 ml-2" />
                                        إضافة قارئ جديد
                                    </Button>
                                </div>
                            </div>
                        </DialogContent>
                    </Dialog>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">بحث</label>
                <div className="relative">
                  <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground/50" />
                  <Input
                    placeholder="ابحث في الآيات..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pr-10"
                  />
                </div>
              </div>
            </div>

            {/* نطاق البحث - جديد */}
            {searchQuery.trim() && (
              <div className="mt-3 flex items-center gap-2 p-3 bg-primary/5 rounded-lg flex-wrap">
                <span className="text-sm font-medium text-foreground/80">نطاق البحث:</span>
                <div className="flex gap-2">
                  <Button
                    variant={searchScope === "current" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSearchScope("current")}
                  >
                    السورة الحالية ({currentSurahName})
                  </Button>
                  <Button
                    variant={searchScope === "all" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSearchScope("all")}
                  >
                    القرآن كاملاً
                  </Button>
                </div>
                {searchScope === "all" && (
                  <Badge variant="secondary" className="mr-auto">
                    {filteredAyahs.length} نتيجة
                  </Badge>
                )}
              </div>
            )}

            <div className="mt-4 p-3 bg-background-soft rounded-lg">
              <div className="flex items-center gap-4 flex-wrap">
                <span className="text-sm font-medium">اختر نطاق الآيات:</span>
                <div className="flex items-center gap-2">
                  <label className="text-sm">من آية:</label>
                  <Input
                    type="number"
                    min="1"
                    max={ayahs.length}
                    value={fromAyah}
                    onChange={(e) => setFromAyah(Number(e.target.value))}
                    className="w-20"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <label className="text-sm">إلى آية:</label>
                  <Input
                    type="number"
                    min={fromAyah}
                    max={ayahs.length}
                    value={toAyah}
                    onChange={(e) => setToAyah(Number(e.target.value))}
                    className="w-20"
                  />
                </div>
                <Button
                  size="sm"
                  onClick={playSelectedRange}
                  className="bg-blue-600 hover:bg-blue-700 gap-2"
                >
                  <Play className="w-4 h-4" />
                  تشغيل النطاق
                </Button>
              </div>
            </div>

            <div className="mt-4 flex items-center justify-center gap-3 p-3 bg-background-soft rounded-lg">
              <Button
                variant="outline"
                size="icon"
                onClick={goToPreviousAyah}
                disabled={currentAyah === 1}
              >
                <SkipBack className="w-4 h-4" />
              </Button>

              {isPlaying ? (
                <Button onClick={pauseAyah} size="lg" className="gap-2">
                  <Pause className="w-5 h-5" />
                  إيقاف
                </Button>
              ) : (
                <Button onClick={() => playAyah(selectedSurah, currentAyah)} size="lg" className="gap-2">
                  <Play className="w-5 h-5" />
                  تشغيل
                </Button>
              )}

              <Button
                variant="outline"
                size="icon"
                onClick={goToNextAyah}
                disabled={currentAyah === ayahs.length}
              >
                <SkipForward className="w-4 h-4" />
              </Button>

              <div className="mr-4 flex items-center gap-2">
                <Button
                  variant={autoPlay ? "default" : "outline"}
                  size="sm"
                  onClick={() => setAutoPlay(!autoPlay)}
                  className="gap-2"
                >
                  {autoPlay ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
                  {autoPlay ? "متصل" : "منفصل"}
                </Button>
              </div>
            </div>

            <div className="mt-4 space-y-4">
              <div className="flex flex-wrap items-center gap-4 p-3 bg-background-soft rounded-lg">
                <div className="flex items-center gap-3">
                  <Type className="w-4 h-4 text-foreground/70" />
                  <span className="text-sm">حجم الخط:</span>
                  <Button variant="outline" size="sm" onClick={() => setFontSize(Math.max(16, fontSize - 2))}>-</Button>
                  <span className="text-sm font-bold">{fontSize}</span>
                  <Button variant="outline" size="sm" onClick={() => setFontSize(Math.min(40, fontSize + 2))}>+</Button>
                </div>
                
                <div className="flex items-center gap-3 border-r pr-4 mr-4">
                    <span className="text-sm">نوع الخط:</span>
                    <Select value={fontFamily} onValueChange={setFontFamily}>
                        <SelectTrigger className="w-32 h-8">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="Amiri">Amiri (نسخ)</SelectItem>
                            <SelectItem value="Scheherazade New">Scheherazade (واضح)</SelectItem>
                            <SelectItem value="Cairo">Cairo (عصري)</SelectItem>
                            <SelectItem value="Uthmanic">عثماني</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                <div className="flex items-center gap-2 border-r pr-4 mr-4">
                    <span className="text-sm">تكرار التلاوة:</span>
                    <Switch checked={repeatAyah} onCheckedChange={setRepeatAyah} />
                </div>
              </div>

              <div className="p-3 bg-background-soft rounded-lg space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <BookMarked className="w-4 h-4 text-primary" />
                    <span className="text-sm font-medium">عرض التفسير</span>
                  </div>
                  <Switch checked={showTafsir} onCheckedChange={setShowTafsir} />
                </div>

                {showTafsir && (
                  <div className="space-y-3">
                    {[0, 1, 2].map(index => (
                      <div key={index}>
                        <label className="text-xs text-foreground/70 mb-1 block">
                          التفسير {index + 1}
                        </label>
                        <Select 
                          value={selectedTafsirs[index]} 
                          onValueChange={(value) => {
                            setSelectedTafsirs(prev => {
                              const newTafsirs = [...prev];
                              newTafsirs[index] = value;
                              return newTafsirs;
                            });
                          }}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="اختر التفسير" />
                          </SelectTrigger>
                          <SelectContent>
                            {TAFSIR_OPTIONS.map(tafsir => (
                              <SelectItem key={tafsir.id} value={tafsir.id}>
                                {tafsir.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {isLoading && searchQuery.trim() === "" ? ( // Only show loader if not searching (search results might load dynamically)
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : (
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
                  const isCurrentAyah = ayah.ayah_number === currentAyah && currentAyahSurahNum === selectedSurah;
                  const isPlayingWordByWord = currentPlayingAyah === ayah.ayah_number && currentAyahSurahNum === selectedSurah;

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
                                    {renderAyahTextWithMeanings(ayah.ayah_text, ayah.ayah_number)}
                                  </p>
                                  <div className="text-center text-sm text-foreground/70 mb-4">
                                    {ayah.surah_name || currentSurahName} - آية {ayah.ayah_number}
                                  </div>
                              </div>

                              {showTafsir && (
                                <div className="space-y-3 border-t lg:border-t-0 lg:border-r lg:pr-6 pt-4 lg:pt-0">
                                  {selectedTafsirs.map((tafsir, idx) => {
                                const currentAyahSurah = searchScope === "all" ? ayah.surah_number : selectedSurah;
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
                                
                                const colors = [
                                  { bg: "bg-blue-50 dark:bg-blue-900/20", border: "border-blue-200 dark:border-blue-800", text: "text-blue-700 dark:text-blue-300", content: "text-blue-900 dark:text-blue-200" },
                                  { bg: "bg-purple-50 dark:bg-purple-900/20", border: "border-purple-200 dark:border-purple-800", text: "text-purple-700 dark:text-purple-300", content: "text-purple-900 dark:text-purple-200" },
                                  { bg: "bg-green-50 dark:bg-green-900/20", border: "border-green-200 dark:border-green-800", text: "text-green-700 dark:text-green-300", content: "text-green-900 dark:text-green-200" }
                                ];

                                return (
                                  <div key={idx} className={`p-4 ${colors[idx].bg} border ${colors[idx].border} rounded-lg`}>
                                    <h4 className={`font-semibold ${colors[idx].text} mb-2 flex items-center gap-2`}>
                                      <BookMarked className="w-4 h-4" />
                                      تفسير {tafsir}
                                    </h4>
                                    <p className={`${colors[idx].content} text-sm leading-relaxed`}>
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
                })
              )}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
}
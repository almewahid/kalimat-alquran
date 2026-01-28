"use client";
import React, { useState, useEffect, useMemo, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger
} from "@/components/ui/tabs";
import {
  Search as SearchIcon,
  BookOpen,
  FileText,
  Loader2
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import debounce from "lodash/debounce";

/* ---------- مساعدة: إزالة التشكيل وتوحيد الحروف ---------- */
const removeArabicDiacritics = (text) => {
  if (!text) return "";
  return String(text)
    .replace(/[\u0617-\u061A\u064B-\u065F\u0670]/g, "")
    .replace(/[إأآٱ]/g, "ا")
    .replace(/ى/g, "ي")
    .replace(/ؤ/g, "و")
    .replace(/ئ/g, "ي")
    .replace(/[ًٌٍَُِّْ]/g, "")
     // تحويل الألف الخنجرية (ـٰ) إلى ألف عادية
    .replace(/ٰ/g, "ا")
    // إزالة التطويل
    .replace(/ـ/g, "")
    // إزالة رموز الوقف القرآنية إن وجدت
    .replace(/[۞۩۝ۣ۪ۭ۟۠ۡۧ۫۬]/g, "")
    .trim();
};

/* ---------- مقارنة الآية مع المصطلح (بدون استخراج الجذر) ---------- */
const ayahContainsTerm = (ayahText, searchTerm, matchMode = "partial") => {
  if (!ayahText || !searchTerm) return false;
  const cleanAyah = removeArabicDiacritics(ayahText);
  const cleanTerm = removeArabicDiacritics(searchTerm);
  const ayahWords = cleanAyah.split(/\s+/);

  return ayahWords.some((w) => {
    if (matchMode === "exact") {
      return w === cleanTerm;
    } else {
      return (
        w === cleanTerm ||
        w.includes(cleanTerm) ||
        cleanTerm.includes(w) ||
        w.startsWith(cleanTerm) ||
        w.endsWith(cleanTerm)
      );
    }
  });
};

/* ---------- عد مرات الظهور ---------- */
const countOccurrences = (text, term) => {
  if (!text || !term) return 0;
  const cleanText = removeArabicDiacritics(text);
  const cleanTerm = removeArabicDiacritics(term);
  const rx = new RegExp(cleanTerm, "g");
  const m = cleanText.match(rx);
  return m ? m.length : 0;
};
/* ---------- تمييز النص (تطابق تام = أصفر، جزئي = برتقالي) ---------- */
const highlightMatch = (text, term) => {
  if (!term) return text;

  const cleanTerm = removeArabicDiacritics(term);
  if (!cleanTerm) return text;

  const words = text.split(/(\s+)/);

  return (
    <>
      {words.map((word, i) => {
        const cleanWord = removeArabicDiacritics(word);

        // ✅ تطابق تام
        if (cleanWord === cleanTerm) {
          return (
            <span key={i} className="bg-yellow-300 text-black px-1 rounded font-semibold">
              {word}
            </span>
          );
        }

        // 🔶 تطابق جزئي داخل الكلمة
        if (cleanWord.includes(cleanTerm) && cleanWord !== cleanTerm) {
          // نستخدم regex يطابق الحروف الجزئية بعد إزالة التشكيل
          const pattern = new RegExp(`(${cleanTerm})`, "gi");
          const parts = word.split(pattern);

          return (
            <span key={i}>
              {parts.map((p, j) =>
                removeArabicDiacritics(p).includes(cleanTerm) &&
                removeArabicDiacritics(p) !== "" ? (
                  <span key={j} className="bg-orange-400 text-black px-1 rounded">
                    {p}
                  </span>
                ) : (
                  <span key={j}>{p}</span>
                )
              )}
            </span>
          );
        }

        // بدون تطابق
        return <span key={i}>{word}</span>;
      })}
    </>
  );
};

/* ---------- Toast بسيط لعرض الرسائل الصغيرة أسفل الصفحة ---------- */
function Toast({ message, onClose }) {
  useEffect(() => {
    if (!message) return;
    const t = setTimeout(() => onClose(), 2400);
    return () => clearTimeout(t);
  }, [message, onClose]);

  if (!message) return null;
  return (
    <div className="fixed left-1/2 transform -translate-x-1/2 bottom-6 z-50">
      <div className="bg-black/90 text-white px-4 py-2 rounded-md shadow-lg">
        {message}
      </div>
    </div>
  );
}

/* ---------- المكون الرئيسي ---------- */
export default function Search() {
  const [searchTerm, setSearchTerm] = useState("");
  const [matchMode, setMatchMode] = useState("partial");
  const [allAyahs, setAllAyahs] = useState([]);
  const [allWords, setAllWords] = useState([]);
  const [searchResults, setSearchResults] = useState({ words: [], ayahs: [] });
  const [isSearching, setIsSearching] = useState(false);
  const [loadingAyahs, setLoadingAyahs] = useState(true);
  const [loadingWords, setLoadingWords] = useState(true);
  const [activeTab, setActiveTab] = useState("words");
  const [selectedSurah, setSelectedSurah] = useState("all");

  const [internalWordQuery, setInternalWordQuery] = useState("");
  const [internalAyahQuery, setInternalAyahQuery] = useState("");
  const [toastMessage, setToastMessage] = useState("");

  /* ---------- تحميل البيانات من base44 ---------- */
  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        setLoadingAyahs(true);
        const ayahs = await base44.entities.QuranAyah.list("-id", 10000);
        if (!mounted) return;
        const processed = ayahs.map((a) => ({
          ...a,
          clean_text: removeArabicDiacritics(a.ayah_text),
        }));
        setAllAyahs(processed);
      } catch (err) {
        console.error("❌ خطأ في تحميل الآيات:", err);
        setAllAyahs([]);
      } finally {
        setLoadingAyahs(false);
      }

      try {
        setLoadingWords(true);
        const words = await base44.entities.QuranicWord.list();
        if (!mounted) return;
        setAllWords(words || []);
      } catch (err) {
        console.error("❌ خطأ في تحميل الكلمات:", err);
        setAllWords([]);
      } finally {
        setLoadingWords(false);
      }
    };
    load();
    return () => {
      mounted = false;
    };
  }, []);

  /* ---------- ترتيب أسماء السور ---------- */
  const allSurahList = useMemo(() => {
    const map = {};
    allAyahs.forEach((a) => {
      if (a.surah_name && typeof a.surah_number !== "undefined") {
        if (!map[a.surah_name]) map[a.surah_name] = a.surah_number;
      }
    });
    const uniques = Array.from(new Set(allAyahs.map((a) => a.surah_name))).map((name) => ({
      name,
      num: map[name] ?? 9999,
    }));
    uniques.sort((x, y) => x.num - y.num || x.name.localeCompare(y.name));
    return uniques.map((u) => u.name);
  }, [allAyahs]);

  /* ---------- الدالة الرئيسية للبحث ---------- */
  const performSearch = useMemo(
    () =>
      debounce((term, useSurah = selectedSurah, mode = matchMode) => {
        if (!term || term.trim().length < 2) {
          setSearchResults({ words: [], ayahs: [] });
          return;
        }
        setIsSearching(true);
        try {
          const cleanTerm = removeArabicDiacritics(term);

          // فلترة الكلمات (بدون الجذر)
          const filteredWords = (allWords || []).filter((w) => {
            if (useSurah !== "all" && w.surah_name !== useSurah) return false;
            const cw = removeArabicDiacritics(w.word || "");
            const cm = removeArabicDiacritics(w.meaning || "");
            const cs = removeArabicDiacritics(w.surah_name || "");
            return (
              cw.includes(cleanTerm) ||
              cm.includes(cleanTerm) ||
              cs.includes(cleanTerm)
            );
          });

          // فلترة الآيات
          const filteredAyahs = (allAyahs || [])
            .filter((a) => {
              if (useSurah !== "all" && a.surah_name !== useSurah) return false;
              return ayahContainsTerm(a.ayah_text, term, mode);
            })
            .map((a) => ({
              ...a,
              occurrences: countOccurrences(a.ayah_text, term),
            }))
            .sort((x, y) => {
              if (x.surah_number && y.surah_number) {
                if (x.surah_number !== y.surah_number) return x.surah_number - y.surah_number;
                return x.ayah_number - y.ayah_number;
              }
              if (x.surah_name !== y.surah_name) return x.surah_name.localeCompare(y.surah_name);
              return x.ayah_number - y.ayah_number;
            });

          setSearchResults({
            words: filteredWords.slice(0, 200),
            ayahs: filteredAyahs.slice(0, 200),
          });
        } catch (err) {
          console.error("خطأ أثناء البحث:", err);
          setSearchResults({ words: [], ayahs: [] });
        } finally {
          setIsSearching(false);
        }
      }, 300),
    [allAyahs, allWords, matchMode, selectedSurah]
  );

  useEffect(() => {
    performSearch(searchTerm, selectedSurah, matchMode);
  }, [searchTerm, matchMode, selectedSurah, performSearch]);

  const loadingAll = loadingAyahs || loadingWords;

  /* ---------- واجهة المستخدم ---------- */
  return (
    <div className="p-6 max-w-6xl mx-auto bg-gradient-to-b from-gray-50 to-gray-100 rounded-xl shadow-inner">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-3xl font-bold text-center mb-6 text-primary">
          البحث في القرآن الكريم
        </h1>

        {/* شريط البحث */}
        <Card className="mb-6 bg-white shadow-lg border border-gray-200">
          <CardContent className="p-6">
            <div className="relative mb-4">
              <SearchIcon className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <Input
                placeholder="ابحث عن كلمة أو آية..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pr-10 text-lg shadow-sm"
              />
              {(isSearching || loadingAll) && (
                <Loader2 className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 animate-spin text-primary" />
              )}
            </div>

            <div className="flex flex-col md:flex-row gap-3 justify-between items-center">
              <div className="flex gap-2 border rounded-lg p-1 bg-muted/40">
                <button
                  onClick={() => setMatchMode("exact")}
                  className={`px-3 py-1 rounded-md ${matchMode === "exact" ? "bg-yellow-200 text-black font-semibold" : "hover:bg-muted"}`}
                >
                  🔹 تطابق دقيق
                </button>
                <button
                  onClick={() => setMatchMode("partial")}
                  className={`px-3 py-1 rounded-md ${matchMode === "partial" ? "bg-orange-200 text-black font-semibold" : "hover:bg-muted"}`}
                >
                  🔸 تطابق جزئي
                </button>
              </div>

              <select
                className="border rounded-md p-2 bg-white shadow-sm"
                value={selectedSurah}
                onChange={(e) => setSelectedSurah(e.target.value)}
              >
                <option value="all">كل السور</option>
                {allSurahList.map((s, i) => (
                  <option key={i} value={s}>{s}</option>
                ))}
              </select>
            </div>
          </CardContent>
        </Card>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="words"><BookOpen className="w-4 h-4" /> الكلمات ({searchResults.words.length})</TabsTrigger>
            <TabsTrigger value="ayahs"><FileText className="w-4 h-4" /> الآيات ({searchResults.ayahs.length})</TabsTrigger>
          </TabsList>

          {/* تبويب الكلمات */}
          <TabsContent value="words">
            <AnimatePresence>
              {searchResults.words.length > 0 ? (
                <>
                  <div className="flex items-center gap-2 mb-4">
                    <Input
                      placeholder="🔍 ابحث داخل نتائج الكلمات..."
                      value={internalWordQuery}
                      onChange={(e) => setInternalWordQuery(e.target.value)}
                      className="text-right"
                    />
                    {internalWordQuery && (
                      <button onClick={() => setInternalWordQuery("")} className="px-3 py-1 rounded-md bg-muted/20">❌</button>
                    )}
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    {searchResults.words.map((word) => (
                      <motion.div key={word.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                        <Card className="bg-white border border-gray-200 shadow-md hover:shadow-lg transition-all">
                          <CardHeader className="flex items-center justify-between">
                            <CardTitle className="text-2xl text-primary arabic-font">{word.word}</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <p className="text-foreground mb-2">{word.meaning}</p>
                            {word.root && (
                              <p className="text-sm text-gray-500 mb-2">
                                <strong>الجذر:</strong> {word.root}
                              </p>
                            )}
                            <div className="flex gap-2 flex-wrap mt-2">
                              <Badge variant="outline">{word.surah_name}</Badge>
                              <Badge variant="outline">الآية {word.ayah_number}</Badge>
                            </div>
                          </CardContent>
                        </Card>
                      </motion.div>
                    ))}
                  </div>
                </>
              ) : (
                <div className="text-center py-12">
                  {!loadingAll && searchTerm.trim().length >= 2 && !isSearching ? (
                    <p className="text-foreground/70">لم يتم العثور على كلمات</p>
                  ) : null}
                </div>
              )}
            </AnimatePresence>
          </TabsContent>

          {/* تبويب الآيات */}
          <TabsContent value="ayahs">
            <AnimatePresence>
              {searchResults.ayahs.length > 0 ? (
                <div className="space-y-4">
                  {searchResults.ayahs.map((ayah) => (
                    <motion.div key={`${ayah.surah_number}-${ayah.ayah_number}`} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                      <Card className="bg-white border border-gray-200 shadow-md hover:shadow-lg">
                        <CardHeader>
                          <div className="flex items-center gap-2 flex-wrap">
                            <Badge className="bg-primary text-primary-foreground">{ayah.surah_name}</Badge>
                            <Badge variant="outline">الآية {ayah.ayah_number}</Badge>
                            <Badge variant="outline">الجزء {ayah.juz_number}</Badge>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <p className="text-lg text-foreground arabic-font leading-loose text-right">
                            {highlightMatch(ayah.ayah_text, searchTerm, matchMode)}
                          </p>
                          <p className="text-sm text-muted-foreground text-right mt-2">
                            ظهرت الكلمة{" "}
                            <strong>{ayah.occurrences ?? countOccurrences(ayah.ayah_text, searchTerm)}</strong>{" "}
                            مرة/مرات في هذه الآية
                          </p>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  {!loadingAll && searchTerm.trim().length >= 2 && !isSearching ? (
                    <p className="text-foreground/70">لم يتم العثور على آيات</p>
                  ) : null}
                </div>
              )}
            </AnimatePresence>
          </TabsContent>
        </Tabs>
      </motion.div>

      <Toast message={toastMessage} onClose={() => setToastMessage("")} />
    </div>
  );
}

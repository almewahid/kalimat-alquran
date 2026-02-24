import React, { useState, useEffect } from "react";
import { supabaseClient } from "@/components/api/supabaseClient";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Volume2, CheckCircle, BookOpen, Eye, Loader2, RotateCcw, Heart, Headphones, Play, Pause } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useAudio } from "@/components/common/AudioContext";

export default function KidsWordCard({ word, onMarkLearned }) {
  const { playAyah, playWord, playMeaning, isPlaying, currentType, pause, resume, stopAll, registerAudio, unregisterAudio } = useAudio();
  const [showMeaning, setShowMeaning] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);
  const [favoriteLoading, setFavoriteLoading] = useState(false);
  const [isPlayingAudio1, setIsPlayingAudio1] = useState(false);
  const [isPlayingAudio2, setIsPlayingAudio2] = useState(false);

  // ✅ Refs لعناصر الصوت
  const audioRef1 = React.useRef(null);
  const audioRef2 = React.useRef(null);

  useEffect(() => {
    checkFavoriteStatus();
    setIsPlayingAudio1(false);
    setIsPlayingAudio2(false);
  }, [word?.id]);

  // ✅ تسجيل عناصر audio عند التحميل
  useEffect(() => {
    if (audioRef1.current) registerAudio(audioRef1.current);
    if (audioRef2.current) registerAudio(audioRef2.current);

    // ✅ إيقاف الأصوات الأخرى عند تشغيل أي صوت
    const handleAudio1Play = () => {
      stopAll(audioRef1.current);
    };

    const handleAudio2Play = () => {
      stopAll(audioRef2.current);
    };

    const audio1 = audioRef1.current;
    const audio2 = audioRef2.current;

    const handleAudio1Ended = () => setIsPlayingAudio1(false);
    const handleAudio2Ended = () => setIsPlayingAudio2(false);
    const handleAudio1Pause = () => setIsPlayingAudio1(false);
    const handleAudio2Pause = () => setIsPlayingAudio2(false);

    if (audio1) audio1.addEventListener('play', handleAudio1Play);
    if (audio2) audio2.addEventListener('play', handleAudio2Play);
    if (audio1) audio1.addEventListener('ended', handleAudio1Ended);
    if (audio2) audio2.addEventListener('ended', handleAudio2Ended);
    if (audio1) audio1.addEventListener('pause', handleAudio1Pause);
    if (audio2) audio2.addEventListener('pause', handleAudio2Pause);

    return () => {
      if (audio1) {
        audio1.removeEventListener('play', handleAudio1Play);
        audio1.removeEventListener('ended', handleAudio1Ended);
        audio1.removeEventListener('pause', handleAudio1Pause);
        unregisterAudio(audio1);
      }
      if (audio2) {
        audio2.removeEventListener('play', handleAudio2Play);
        audio2.removeEventListener('ended', handleAudio2Ended);
        audio2.removeEventListener('pause', handleAudio2Pause);
        unregisterAudio(audio2);
      }
    };
  }, [registerAudio, unregisterAudio, stopAll]);

  const checkFavoriteStatus = async () => {
    if (!word) return;
    try {
      const user = await supabaseClient.auth.me();
      const favorites = await supabaseClient.entities.FavoriteWord.filter({
        word_id: word.id,
        user_email: user.email
      });
      setIsFavorite(favorites.length > 0);
    } catch (error) {
      console.log("Error checking favorite status:", error);
    }
  };

  const toggleFavorite = async () => {
    if (favoriteLoading || !word) return;
    setFavoriteLoading(true);
    try {
      const user = await supabaseClient.auth.me();
      const favorites = await supabaseClient.entities.FavoriteWord.filter({
        word_id: word.id,
        user_email: user.email
      });

      if (favorites.length > 0) {
        await supabaseClient.entities.FavoriteWord.delete(favorites[0].id);
        setIsFavorite(false);
      } else {
        await supabaseClient.entities.FavoriteWord.create({ word_id: word.id });
        setIsFavorite(true);
      }
    } catch (error) {
      console.error("Error toggling favorite:", error);
    } finally {
      setFavoriteLoading(false);
    }
  };

  const loadUserNote = async () => {
    if (!word) return;
    try {
      const user = await supabaseClient.auth.me();
      const notes = await supabaseClient.entities.UserNote.filter({
        word_id: word.id,
        user_email: user.email
      });
      if (notes.length > 0) {
        setUserNote(notes[0].content);
      } else {
        setUserNote("");
      }
    } catch (error) {
      console.log("Error loading note:", error);
    }
  };

  const saveNote = async () => {
    if (noteLoading || !word) return;
    setNoteLoading(true);
    try {
      const user = await supabaseClient.auth.me();
      const notes = await supabaseClient.entities.UserNote.filter({
        word_id: word.id,
        user_email: user.email
      });

      if (notes.length > 0) {
        if (userNote.trim()) {
          await supabaseClient.entities.UserNote.update(notes[0].id, { content: userNote });
        } else {
          await supabaseClient.entities.UserNote.delete(notes[0].id);
        }
      } else if (userNote.trim()) {
        await supabaseClient.entities.UserNote.create({
          word_id: word.id,
          content: userNote
        });
      }
      setShowNoteDialog(false);
      loadUserNote();
    } catch (error) {
      console.error("Error saving note:", error);
    } finally {
      setNoteLoading(false);
    }
  };

  const handlePlayAyahRecitation = () => {
    if (!word?.surah_number || !word?.ayah_number) {
      console.warn('⚠️ معلومات الآية غير متوفرة');
      return;
    }
    playAyah(word.surah_number, word.ayah_number, word);
  };

  const handlePlayWordAudio = () => {
    if (!word?.surah_number || !word?.ayah_number || !word?.word) {
      console.warn('⚠️ معلومات الكلمة غير مكتملة');
      return;
    }
    playWord(word.surah_number, word.ayah_number, word.word, word);
  };

  const handleSpeakMeaning = () => {
    if (!word?.meaning) return;
    const textToSpeak = `${word.meaning}. ${word.alternative_meanings?.join('، ') || ''}`;
    playMeaning(textToSpeak);
  };

  const handleToggleAudio1 = () => {
    if (!audioRef1.current) return;
    if (isPlayingAudio1) {
      audioRef1.current.pause();
      setIsPlayingAudio1(false);
    } else {
      stopAll(audioRef1.current);
      audioRef1.current.play().then(() => setIsPlayingAudio1(true)).catch(() => {});
    }
  };

  const handleToggleAudio2 = () => {
    if (!audioRef2.current) return;
    if (isPlayingAudio2) {
      audioRef2.current.pause();
      setIsPlayingAudio2(false);
    } else {
      stopAll(audioRef2.current);
      audioRef2.current.play().then(() => setIsPlayingAudio2(true)).catch(() => {});
    }
  };

  const getYouTubeEmbedUrl = (url) => {
    if (!url) return null;
    let videoId = null;
    if (url.includes('youtube.com/watch?v=')) {
      videoId = url.split('v=')[1]?.split('&')[0];
    } else if (url.includes('youtu.be/')) {
      videoId = url.split('youtu.be/')[1]?.split('?')[0];
    } else if (url.includes('youtube.com/embed/')) {
      videoId = url.split('embed/')[1]?.split('?')[0];
    }
    return videoId ? `https://www.youtube.com/embed/${videoId}` : null;
  };

  // ✅ دالة لتمييز الكلمة المستهدفة داخل الآية
  const highlightWordInText = (text, targetWord) => {
    if (!text || !targetWord) return text;
    
    // تطبيع النصوص للمقارنة (إزالة التشكيل)
    const normalize = (t) => t.replace(/[\u064B-\u065F\u0670\u06D6-\u06ED]/g, "");
    
    // تقسيم النص إلى كلمات
    const words = text.split(' ');
    
    return words.map((w, index) => {
      // مقارنة الكلمة الحالية بالكلمة المستهدفة (مع وبدون تشكيل)
      const isMatch = normalize(w).includes(normalize(targetWord)) || normalize(targetWord).includes(normalize(w));
      
      return (
        <span key={index} className={isMatch ? "text-primary font-extrabold bg-primary/10 px-1 rounded-md mx-0.5 inline-block transform scale-110" : "mx-0.5"}>
          {w}{' '}
        </span>
      );
    });
  };

  const embedUrl = getYouTubeEmbedUrl(word.youtube_url);

  if (!word) return null;

  return (
    <motion.div
      key={word.id}
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ duration: 0.3 }}
      className="relative w-full"
    >
      {/* Toolbar Icons */}
      <div className="flex justify-end items-center gap-2 mb-3">
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleFavorite}
          disabled={favoriteLoading}
          className={isFavorite ? "bg-red-100 text-red-600 hover:bg-red-200 border-2 border-red-300" : "bg-gray-100 hover:bg-gray-200 border-2 border-gray-300"}
        >
          {favoriteLoading ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <Heart className={`w-5 h-5 ${isFavorite ? 'fill-current' : ''}`} />
          )}
        </Button>

        <Button
          variant="ghost"
          size="icon"
          onClick={() => setShowMeaning(false)}
          className="bg-purple-100 hover:bg-purple-200 text-purple-700 border-2 border-purple-300"
        >
          <RotateCcw className="w-5 h-5" />
        </Button>
      </div>

      <Card className="bg-gradient-to-br from-yellow-100 via-pink-100 to-purple-100 dark:from-yellow-900/30 dark:via-pink-900/30 dark:to-purple-900/30 border-4 border-primary/30 shadow-2xl rounded-3xl overflow-hidden">
        {/* Stars decoration */}
        <div className="absolute inset-0 w-full h-full pointer-events-none opacity-20">
          {[...Array(8)].map((_, i) => (
            <motion.div
              key={i}
              animate={{ y: [0, -10, 0], rotate: [0, 360] }}
              transition={{ duration: 3 + i, repeat: Infinity, ease: "easeInOut" }}
              className="absolute text-3xl"
              style={{ left: `${Math.random() * 100}%`, top: `${Math.random() * 100}%` }}
            >
              ⭐
            </motion.div>
          ))}
        </div>

        <CardContent className="p-8 relative z-10 text-center">
          {/* الكلمة واسم السورة */}
          <div className="text-center mb-6">
            <motion.div
              key={`word-display-${word.id}`}
              animate={{ scale: [1, 1.05, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="mb-4 flex flex-row items-center justify-center gap-6" // ✅ جعلناها flex-row
            >
              <h2 className="text-6xl font-bold text-primary dark:text-purple-300 arabic-font drop-shadow-lg">
                {word.word}
              </h2>

              {/* ✅ زر تشغيل صوت الكلمة بجانب الكلمة مباشرة */}
              {(word.surah_number || word.surah_name) && word.ayah_number && (
                <Button
                  onClick={handlePlayWordAudio}
                  variant="ghost"
                  size="icon"
                  className="rounded-full bg-white/50 hover:bg-primary/20 text-primary w-14 h-14 border-2 border-primary/20 shadow-sm"
                  title="نطق الكلمة"
                >
                  <Volume2 className="w-8 h-8" />
                </Button>
              )}
            </motion.div>
            
            <Badge className="bg-primary/20 text-primary dark:text-purple-200 border-2 border-primary dark:border-purple-500 text-lg px-4 py-2 rounded-full">
              سورة {word.surah_name} - آية {word.ayah_number}
            </Badge>
          </div>

          {/* الصورة */}
          {word.image_url && (
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="mx-auto mb-6"
            >
              <img
                src={word.image_url}
                alt={word.word}
                className="w-full max-w-sm h-64 object-cover rounded-3xl border-4 border-white shadow-xl mx-auto"
              />
            </motion.div>
          )}

          <AnimatePresence mode="wait">
            {!showMeaning ? (
              <motion.div
                key="question"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="text-center space-y-6"
              >
                {/* كارت السؤال */}
                <div className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm rounded-2xl p-6 border-4 border-dashed border-primary/30 shadow-inner">
                  <div className="text-5xl mb-2">🤔</div>
                  <p className="text-2xl font-bold text-foreground dark:text-gray-100 mb-2">
                    ماذا تعني هذه الكلمة؟
                  </p>
                  <p className="text-lg text-foreground/70 dark:text-gray-300">اضغط الزر لتعرف المعنى!</p>
                </div>

                {/* زر اكتشف المعنى */}
                <Button
                  onClick={() => setShowMeaning(true)}
                  size="lg"
                  className="w-full py-6 text-xl bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500 hover:from-pink-600 hover:via-purple-600 hover:to-indigo-600 text-white font-bold hover:scale-105 transition-transform rounded-2xl shadow-xl border-4 border-white/50"
                >
                  <Eye className="w-6 h-6 ml-3" />
                  اكتشف المعنى! 
                </Button>

                {/* ✅ وحدة تحكم صوتية مدمجة وسلسة */}
                {(word.surah_number || word.surah_name) && word.ayah_number && (
                  <div className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-md rounded-2xl p-2 shadow-sm border border-white/50 flex items-center justify-center gap-2">
                     <Button
                        onClick={handlePlayWordAudio}
                        variant="ghost"
                        className="flex-1 rounded-xl hover:bg-blue-100 text-blue-700"
                      >
                        <Volume2 className="w-5 h-5 ml-2" />
                        نطق الكلمة
                      </Button>
                      
                      <div className="w-px h-8 bg-gray-300/50"></div>

                      <Button
                        onClick={handlePlayAyahRecitation}
                        variant="ghost"
                        className="flex-1 rounded-xl hover:bg-green-100 text-green-700"
                      >
                        <Headphones className="w-5 h-5 ml-2" />
                        تلاوة الآية
                      </Button>
                  </div>
                )}
              </motion.div>
            ) : (
              <motion.div
                key="answer"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className="space-y-6"
              >
                {/* كارت المعنى */}
                <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/30 dark:to-emerald-900/30 rounded-2xl p-6 border-4 border-green-200 dark:border-green-800 text-center shadow-lg">
                  <h3 className="text-xl font-bold text-green-700 dark:text-green-300 mb-2">المعنى:</h3>
                  <p className="text-3xl font-extrabold text-green-900 dark:text-green-100 mb-4">{word.meaning}</p>
                  
                  {/* زر صوت المعنى */}
                  <Button
                    onClick={handleSpeakMeaning}
                    variant="outline"
                    size="sm"
                    className="mt-2 border-green-300 hover:bg-green-100 text-green-700"
                  >
                    <Volume2 className="w-4 h-4 ml-2" />
                    استمع للمعنى
                  </Button>
                  
                  {word.alternative_meanings && word.alternative_meanings.length > 0 && (
                    <div className="mt-4 text-right border-t border-green-200 pt-3">
                      <p className="text-sm font-semibold text-green-600 dark:text-green-400 mb-1">معاني إضافية:</p>
                      <ul className="list-disc list-inside text-green-800 dark:text-green-200 text-sm">
                        {word.alternative_meanings.map((alt, index) => (
                          <li key={index}>{alt}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>

                {/* ✅ السياق أو المثال مع تمييز الكلمة */}
                {(word.aya_text || word.example_usage) && (
                  <div className="bg-amber-50 dark:bg-amber-900/20 rounded-2xl p-6 border-4 border-amber-200 dark:border-amber-800 shadow-md">
                    <div className="flex items-center justify-between mb-3 border-b border-amber-200/50 pb-2">
                      <p className="text-lg font-bold text-amber-800 dark:text-amber-200 flex items-center gap-2">
                        <BookOpen className="w-5 h-5" />
                        {word.aya_text ? "سياق الآية" : "مثال"}
                      </p>
                      {/* زر صوت الآية */}
                      {(word.surah_number || word.surah_name) && word.ayah_number && (
                        <Button
                          onClick={handlePlayAyahRecitation}
                          variant="ghost"
                          size="sm"
                          className="hover:bg-amber-100 text-amber-700"
                        >
                          <Headphones className="w-4 h-4 ml-2" />
                          استمع
                        </Button>
                      )}
                    </div>
                    <p className="text-xl text-amber-900 dark:text-amber-100 arabic-font leading-loose text-center">
                      {highlightWordInText(word.aya_text || word.example_usage, word.word)}
                    </p>
                  </div>
                )}

                {/* مشغل الصوت المخصص - audio_url */}
                {word.audio_url && (
                  <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 0.3 }}
                    className="mx-auto mb-4 max-w-md"
                  >
                    <audio ref={audioRef1} src={word.audio_url} className="hidden" />
                    <button
                      onClick={handleToggleAudio1}
                      className="w-full bg-indigo-50 dark:bg-indigo-900/20 rounded-2xl p-4 border-2 border-indigo-200 dark:border-indigo-700 flex items-center gap-4 shadow-sm hover:bg-indigo-100 dark:hover:bg-indigo-900/30 transition-colors"
                    >
                      <div className={`w-14 h-14 rounded-full flex items-center justify-center shadow-md flex-shrink-0 transition-colors ${isPlayingAudio1 ? 'bg-indigo-500' : 'bg-indigo-100 dark:bg-indigo-800'}`}>
                        {isPlayingAudio1
                          ? <Pause className="w-7 h-7 text-white" />
                          : <Play className="w-7 h-7 text-indigo-600 dark:text-indigo-300" />
                        }
                      </div>
                      <div className="text-right">
                        <p className="text-indigo-800 dark:text-indigo-200 font-bold text-base">الشرح بالفصحى</p>
                        <p className="text-indigo-500 text-xs mt-0.5">{isPlayingAudio1 ? 'جارٍ التشغيل...' : 'اضغط للاستماع 🔊'}</p>
                      </div>
                    </button>
                  </motion.div>
                )}

                {/* مشغل الصوت الإضافي - audio2_url */}
                {word.audio2_url && (
                  <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 0.35 }}
                    className="mx-auto mb-4 max-w-md"
                  >
                    <audio ref={audioRef2} src={word.audio2_url} className="hidden" />
                    <button
                      onClick={handleToggleAudio2}
                      className="w-full bg-orange-50 dark:bg-orange-900/20 rounded-2xl p-4 border-2 border-orange-200 dark:border-orange-700 flex items-center gap-4 shadow-sm hover:bg-orange-100 dark:hover:bg-orange-900/30 transition-colors"
                    >
                      <div className={`w-14 h-14 rounded-full flex items-center justify-center shadow-md flex-shrink-0 transition-colors ${isPlayingAudio2 ? 'bg-orange-500' : 'bg-orange-100 dark:bg-orange-800'}`}>
                        {isPlayingAudio2
                          ? <Pause className="w-7 h-7 text-white" />
                          : <Headphones className="w-7 h-7 text-orange-600 dark:text-orange-300" />
                        }
                      </div>
                      <div className="text-right">
                        <p className="text-orange-800 dark:text-orange-200 font-bold text-base">الشرح بالعامية</p>
                        <p className="text-orange-500 text-xs mt-0.5">{isPlayingAudio2 ? 'جارٍ التشغيل...' : 'اضغط للاستماع 🎧'}</p>
                      </div>
                    </button>
                  </motion.div>
                )}

                {/* فيديو اليوتيوب */}
                {embedUrl && (
                  <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 0.4 }}
                    className="mx-auto"
                  >
                    <div className="relative w-full max-w-2xl mx-auto rounded-2xl overflow-hidden border-4 border-red-200 dark:border-red-800 shadow-lg" style={{ paddingBottom: '56.25%', height: 0 }}>
                      <iframe
                        className="absolute top-0 left-0 w-full h-full"
                        src={embedUrl}
                        title="فيديو توضيحي"
                        frameBorder="0"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                      ></iframe>
                    </div>
                    <p className="text-center text-red-600 dark:text-red-400 font-semibold mt-2 text-sm">
                      📺 شاهد الفيديو التوضيحي
                    </p>
                  </motion.div>
                )}

                {/* زر حفظت الكلمة */}
                <Button
                  onClick={onMarkLearned}
                  size="lg"
                  className="w-full py-6 text-xl bg-gradient-to-r from-green-600 to-emerald-600 hover:scale-105 transition-transform rounded-2xl shadow-xl mt-4"
                >
                  <CheckCircle className="w-6 h-6 ml-3" />
                  تعلمت الكلمة! 🎉
                </Button>
              </motion.div>
            )}
          </AnimatePresence>
        </CardContent>
      </Card>

    </motion.div>
  );
}
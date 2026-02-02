import React, { useState, useEffect } from "react";
import { supabaseClient } from "@/components/api/supabaseClient";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Volume2, CheckCircle, BookOpen, Sparkles, Heart, StickyNote, Repeat, Star } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useAudio } from "@/components/common/AudioContext";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";

export default function WordCard({ word, onMarkLearned, isReviewWord, userLevel }) {
  const [userNote, setUserNote] = useState("");
  const [cardElements, setCardElements] = useState([]);
  const [isFavorite, setIsFavorite] = useState(false);
  const [showNoteDialog, setShowNoteDialog] = useState(false);
  const [isFlipped, setIsFlipped] = useState(false);
  const [starRating, setStarRating] = useState(0);
  const { playAyah, playWord, playMeaning } = useAudio();

  useEffect(() => {
    const loadPreferences = async () => {
      try {
        const user = await supabaseClient.auth.me();
        if (user?.preferences?.word_card_elements) {
          setCardElements(user.preferences.word_card_elements);
        } else {
          setCardElements([
            { id: "meaning", visible: true },
            { id: "alternative_meanings", visible: true },
            { id: "root", visible: true },
            { id: "aya_text", visible: true },
            { id: "example", visible: true },
            { id: "reflection", visible: true },
            { id: "image", visible: true },
            { id: "youtube", visible: true },
            { id: "audio1", visible: true },
            { id: "audio2", visible: true }
          ]);
        }
      } catch (error) {
        console.log("Could not load card preferences:", error);
      }
    };
    loadPreferences();
  }, []);

  useEffect(() => {
    const loadNoteAndFavorite = async () => {
      if (!word) return;
      try {
        const user = await supabaseClient.auth.me();
        
        // Load note
        const notes = await supabaseClient.entities.UserNote.filter({
          word_id: word.id,
          created_by: user.email
        });
        if (notes.length > 0) {
          setUserNote(notes[0].content);
        }

        // Load favorite status
        const favorites = await supabaseClient.entities.FavoriteWord.filter({
          word_id: word.id,
          created_by: user.email
        });
        setIsFavorite(favorites.length > 0);
      } catch (error) {
        console.log("Could not load note/favorite:", error);
      }
    };
    loadNoteAndFavorite();
  }, [word]);

  const handleToggleFavorite = async () => {
    if (!word) return;
    try {
      const user = await supabaseClient.auth.me();
      const favorites = await supabaseClient.entities.FavoriteWord.filter({
        word_id: word.id,
        created_by: user.email
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
    }
  };

  const handleSaveNote = async () => {
    if (!word) return;
    try {
      const user = await supabaseClient.auth.me();
      const existingNotes = await supabaseClient.entities.UserNote.filter({
        word_id: word.id,
        created_by: user.email
      });

      if (existingNotes.length > 0) {
        await supabaseClient.entities.UserNote.update(existingNotes[0].id, { content: userNote });
      } else {
        await supabaseClient.entities.UserNote.create({
          word_id: word.id,
          content: userNote
        });
      }
      setShowNoteDialog(false);
    } catch (error) {
      console.error("Error saving note:", error);
    }
  };

  const handlePlayAyahRecitation = () => {
    if (!word?.surah_number || !word?.ayah_number) {
      alert('⚠️ معلومات الآية غير متوفرة لهذه الكلمة.');
      return;
    }
    playAyah(word.surah_number, word.ayah_number, word);
  };

  const handlePlayWordAudio = () => {
    if (!word?.surah_number || !word?.ayah_number || !word?.word) {
      alert('⚠️ معلومات الكلمة غير مكتملة.');
      return;
    }
    playWord(word.surah_number, word.ayah_number, word.word, word);
  };

  const handleSpeakMeaning = () => {
    if (!word?.meaning) return;
    const textToSpeak = `${word.meaning}. ${word.alternative_meanings?.join('، ') || ''}`;
    playMeaning(textToSpeak);
  };

  const handlePlayAudio1 = () => {
    if (word?.audio_url) {
      const audio = new Audio(word.audio_url);
      audio.play();
    }
  };

  const handlePlayAudio2 = () => {
    if (word?.audio2_url) {
      const audio = new Audio(word.audio2_url);
      audio.play();
    }
  };

  const isElementVisible = (elementId) => {
    const element = cardElements.find(el => el.id === elementId);
    return element ? element.visible : true;
  };

  if (!word) return null;

  const isBeginner = userLevel === "مبتدئ";

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.3 }}
      className="w-full"
    >
      <Card className="bg-card backdrop-blur-sm border-border shadow-xl overflow-hidden">
        <CardContent className="p-6 md:p-8">
          {/* Header Actions */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              {/* Favorite Button */}
              <Button
                variant="ghost"
                size="icon"
                onClick={handleToggleFavorite}
                className={`${isFavorite ? 'text-red-500' : 'text-gray-400'} hover:text-red-600`}
              >
                <Heart className={`w-6 h-6 ${isFavorite ? 'fill-current' : ''}`} />
              </Button>

              {/* Notes Button */}
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowNoteDialog(true)}
                className="text-yellow-600 hover:text-yellow-700"
              >
                <StickyNote className="w-6 h-6" />
              </Button>

              {/* Flip Card Button (للكبار فقط) */}
              {!isBeginner && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsFlipped(!isFlipped)}
                  className="text-blue-600 hover:text-blue-700"
                >
                  <Repeat className="w-6 h-6" />
                </Button>
              )}
            </div>

            {/* Star Rating (للمبتدئين فقط) */}
            {isBeginner && (
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    onClick={() => setStarRating(star)}
                    className="focus:outline-none"
                  >
                    <Star
                      className={`w-6 h-6 ${
                        star <= starRating
                          ? 'fill-yellow-400 text-yellow-400'
                          : 'text-gray-300'
                      }`}
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Card Content - Flippable for Adults */}
          <AnimatePresence mode="wait">
            {(!isBeginner && isFlipped) ? (
              // Back Side - Meaning Only
              <motion.div
                key="back"
                initial={{ rotateY: 180 }}
                animate={{ rotateY: 0 }}
                exit={{ rotateY: 180 }}
                transition={{ duration: 0.6 }}
                className="text-center"
              >
                <div className="min-h-[300px] flex flex-col items-center justify-center">
                  <h3 className="text-3xl font-bold text-primary mb-4">المعنى:</h3>
                  <p className="text-4xl font-bold text-green-600">{word.meaning}</p>
                </div>
              </motion.div>
            ) : (
              // Front Side - Full Word Card
              <motion.div
                key="front"
                initial={{ rotateY: -180 }}
                animate={{ rotateY: 0 }}
                exit={{ rotateY: -180 }}
                transition={{ duration: 0.6 }}
              >
                {/* Word Header */}
                <div className="text-center mb-6">
                  <motion.h2
                    className="text-5xl md:text-6xl font-bold text-primary mb-4 arabic-font"
                    initial={{ scale: 0.9 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 200 }}
                  >
                    {word.word}
                  </motion.h2>

                  {/* الآية الكاملة */}
                  {word.aya_text && (
                    <div className="bg-amber-50 dark:bg-amber-900/20 p-6 rounded-xl border-2 border-amber-200 dark:border-amber-800 mb-4">
                      <div className="flex items-start justify-between mb-3">
                        <h4 className="text-sm font-semibold text-amber-800 dark:text-amber-300 flex items-center gap-2">
                          <BookOpen className="w-4 h-4" />
                          📖 الآية الكريمة
                        </h4>
                        
                        {word.surah_number && word.ayah_number && (
                          <Button
                            size="sm"
                            onClick={handlePlayAyahRecitation}
                            className="bg-green-600 hover:bg-green-700 gap-1 h-8"
                            title="استمع لتلاوة الآية"
                          >
                            <Volume2 className="w-4 h-4" />
                            <span className="text-xs">تلاوة</span>
                          </Button>
                        )}
                      </div>
                      
                      <p className="text-lg md:text-xl text-center text-amber-900 dark:text-amber-100 arabic-font leading-loose mb-3">
                        {word.aya_text}
                      </p>
                      
                      <div className="text-center">
                        <Badge variant="outline" className="bg-amber-100 dark:bg-amber-900/50 border-amber-300">
                          سورة {word.surah_name} - آية {word.ayah_number}
                        </Badge>
                      </div>
                    </div>
                  )}

                  {/* أزرار التحكم */}
                  <div className="flex justify-center gap-3 mb-4 flex-wrap">
                    {word.surah_number && word.ayah_number && (
                      <Button
                        size="lg"
                        onClick={handlePlayWordAudio}
                        className="bg-blue-600 hover:bg-blue-700 gap-2"
                        title="استمع لنطق الكلمة فقط"
                      >
                        <Volume2 className="w-5 h-5" />
                        🔵 نطق الكلمة
                      </Button>
                    )}

                    <Button
                      size="lg"
                      onClick={() => {
                        setIsFlipped(true);
                        setTimeout(() => {
                          onMarkLearned();
                        }, 600);
                      }}
                      className="bg-primary hover:bg-primary/90 gap-2"
                    >
                      <CheckCircle className="w-5 h-5" />
                      {isReviewWord ? "راجعتها" : "حفظتها"}
                    </Button>
                  </div>
                </div>

                {/* Card Elements */}
                <div className="space-y-6">
                  {/* المعنى */}
                  {word.meaning && isElementVisible("meaning") && (
                    <div className="bg-green-50 dark:bg-green-900/20 p-6 rounded-xl border border-green-200 dark:border-green-800">
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="text-lg font-semibold text-green-800 dark:text-green-300 flex items-center gap-2">
                          <BookOpen className="w-5 h-5" />
                          المعنى
                        </h3>
                        <Button
                          size="sm"
                          onClick={handleSpeakMeaning}
                          className="bg-purple-600 hover:bg-purple-700 gap-2"
                          title="استمع للمعنى (TTS)"
                        >
                          <Volume2 className="w-4 h-4" />
                          🟣 استمع
                        </Button>
                      </div>
                      <p className="text-2xl font-bold text-green-900 dark:text-green-100">
                        {word.meaning}
                      </p>
                    </div>
                  )}

                  {/* المعاني البديلة */}
                  {word.alternative_meanings && word.alternative_meanings.length > 0 && isElementVisible("alternative_meanings") && (
                    <div className="bg-blue-50 dark:bg-blue-900/20 p-6 rounded-xl border border-blue-200 dark:border-blue-800">
                      <h3 className="text-lg font-semibold text-blue-800 dark:text-blue-300 mb-3">
                        معانٍ بديلة
                      </h3>
                      <ul className="space-y-2">
                        {word.alternative_meanings.map((meaning, index) => (
                          <li key={index} className="flex items-center gap-2 text-blue-900 dark:text-blue-100">
                            <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                            <span className="text-lg">{meaning}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* الجذر */}
                  {word.root && isElementVisible("root") && (
                    <div className="bg-purple-50 dark:bg-purple-900/20 p-6 rounded-xl border border-purple-200 dark:border-purple-800">
                      <h3 className="text-lg font-semibold text-purple-800 dark:text-purple-300 mb-3">
                        الجذر اللغوي
                      </h3>
                      <p className="text-3xl font-bold text-purple-900 dark:text-purple-100 arabic-font text-center">
                        {word.root}
                      </p>
                    </div>
                  )}

                  {/* مثال الاستخدام */}
                  {word.example_usage && isElementVisible("example") && (
                    <div className="bg-orange-50 dark:bg-orange-900/20 p-6 rounded-xl border border-orange-200 dark:border-orange-800">
                      <h3 className="text-lg font-semibold text-orange-800 dark:text-orange-300 mb-3">
                        مثال الاستخدام
                      </h3>
                      <p className="text-lg text-orange-900 dark:text-orange-100 italic">
                        "{word.example_usage}"
                      </p>
                    </div>
                  )}

                  {/* السؤال التأملي */}
                  {word.reflection_question && isElementVisible("reflection") && (
                    <div className="bg-pink-50 dark:bg-pink-900/20 p-6 rounded-xl border border-pink-200 dark:border-pink-800">
                      <h3 className="text-lg font-semibold text-pink-800 dark:text-pink-300 mb-3 flex items-center gap-2">
                        <Sparkles className="w-5 h-5" />
                        سؤال للتفكير
                      </h3>
                      <p className="text-lg text-pink-900 dark:text-pink-100 mb-3">
                        {word.reflection_question}
                      </p>
                      {word.reflection_answer && (
                        <details className="mt-3">
                          <summary className="cursor-pointer text-sm text-pink-700 dark:text-pink-400 hover:underline">
                            اضغط لرؤية الإجابة
                          </summary>
                          <p className="mt-2 text-pink-800 dark:text-pink-200 p-3 bg-white dark:bg-gray-800 rounded-lg">
                            {word.reflection_answer}
                          </p>
                        </details>
                      )}
                    </div>
                  )}

                  {/* الصورة */}
                  {word.image_url && isElementVisible("image") && (
                    <div className="bg-gray-50 dark:bg-gray-900/20 p-6 rounded-xl border border-gray-200 dark:border-gray-800">
                      <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-300 mb-3">
                        صورة توضيحية
                      </h3>
                      <img
                        src={word.image_url}
                        alt={word.word}
                        className="w-full rounded-lg shadow-md"
                      />
                    </div>
                  )}

                  {/* فيديو يوتيوب */}
                  {word.youtube_url && isElementVisible("youtube") && (
                    <div className="bg-red-50 dark:bg-red-900/20 p-6 rounded-xl border border-red-200 dark:border-red-800">
                      <h3 className="text-lg font-semibold text-red-800 dark:text-red-300 mb-3">
                        📹 فيديو تعليمي
                      </h3>
                      <a
                        href={word.youtube_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline"
                      >
                        شاهد على يوتيوب
                      </a>
                    </div>
                  )}

                  {/* صوت 1 */}
                  {word.audio_url && isElementVisible("audio1") && (
                    <div className="bg-indigo-50 dark:bg-indigo-900/20 p-6 rounded-xl border border-indigo-200 dark:border-indigo-800">
                      <div className="flex items-center justify-between">
                        <h3 className="text-lg font-semibold text-indigo-800 dark:text-indigo-300">
                          🎵 صوت 1
                        </h3>
                        <Button onClick={handlePlayAudio1} size="sm" className="bg-indigo-600 hover:bg-indigo-700">
                          <Volume2 className="w-4 h-4 ml-2" />
                          تشغيل
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* صوت 2 */}
                  {word.audio2_url && isElementVisible("audio2") && (
                    <div className="bg-teal-50 dark:bg-teal-900/20 p-6 rounded-xl border border-teal-200 dark:border-teal-800">
                      <div className="flex items-center justify-between">
                        <h3 className="text-lg font-semibold text-teal-800 dark:text-teal-300">
                          🎵 صوت 2
                        </h3>
                        <Button onClick={handlePlayAudio2} size="sm" className="bg-teal-600 hover:bg-teal-700">
                          <Volume2 className="w-4 h-4 ml-2" />
                          تشغيل
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </CardContent>
      </Card>

      {/* Notes Dialog */}
      <Dialog open={showNoteDialog} onOpenChange={setShowNoteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>ملاحظتك الشخصية</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Textarea
              value={userNote}
              onChange={(e) => setUserNote(e.target.value)}
              placeholder="أضف ملاحظاتك الخاصة هنا..."
              className="min-h-[150px]"
            />
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowNoteDialog(false)}>
                إلغاء
              </Button>
              <Button onClick={handleSaveNote}>
                حفظ
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}
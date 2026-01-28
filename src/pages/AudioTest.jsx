import React, { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, XCircle, Volume2, SkipForward } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

// ✅ إشعار بسيط يظهر للمستخدم عند فشل الصوت
const Notification = ({ message, onClose }) => (
  <motion.div
    initial={{ opacity: 0, y: -10 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -10 }}
    className="fixed top-5 left-1/2 transform -translate-x-1/2 bg-red-600 text-white px-6 py-3 rounded-xl shadow-lg z-50"
  >
    {message}
    <Button
      variant="ghost"
      size="sm"
      onClick={onClose}
      className="ml-3 text-white hover:bg-red-700"
    >
      إغلاق
    </Button>
  </motion.div>
);

// 🔊 Text-to-Speech للمعاني - صوت رجل محسّن
const speakText = (text, lang = 'ar-SA') => {
  if ('speechSynthesis' in window) {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = lang;
    utterance.rate = 0.8;
    utterance.pitch = 0.7;
    utterance.volume = 1;

    const voices = window.speechSynthesis.getVoices();
    const maleVoice = voices.find(voice =>
      voice.lang.startsWith('ar') &&
      (voice.name.toLowerCase().includes('male') ||
       voice.name.includes('مذكر') ||
       voice.name.includes('Majed') ||
       voice.name.includes('Tarik'))
    );

    if (maleVoice) {
      utterance.voice = maleVoice;
    } else {
      const anyArabicVoice = voices.find(voice => voice.lang.startsWith('ar'));
      if (anyArabicVoice) utterance.voice = anyArabicVoice;
    }

    window.speechSynthesis.speak(utterance);
  }
};

// ✅ دالة تنظيف النص العربي المحسّنة - إزالة التشكيل والرموز الخاصة
const normalizeArabicText = (text) => {
  if (!text) return '';
  return text
    .replace(/[\u064B-\u065F]/g, '') // التشكيل الأساسي (فتحة، ضمة، كسرة، إلخ)
    .replace(/[\u0670]/g, '') // ألف خنجرية
    .replace(/[\u0600-\u061C]/g, '') // رموز قرآنية وسكون خاص (U+0601)
    .replace(/[\u06D6-\u06FF]/g, '') // رموز التلاوة والوقف
    .replace(/\u0640/g, '') // ✅ Tatweel - حرف التطويل (ـ)
    .replace(/ٱ/g, 'ا') // ألف الوصل
    .replace(/أ/g, 'ا') // همزة على ألف
    .replace(/إ/g, 'ا') // همزة تحت ألف
    .replace(/آ/g, 'ا') // ألف مد
    .replace(/ى/g, 'ي') // ألف مقصورة
    .replace(/ة/g, 'ه') // تاء مربوطة
    .replace(/[^\u0600-\u06FF\s]/g, '') // إزالة أي شيء ليس عربي
    .trim();
};

// ✅ أمثلة متنوعة للاختبار
const TEST_EXAMPLES = [
  {
    id: 1,
    word: "ٱللَّهِ",
    surah_name: "الفاتحة",
    surah_number: 1,
    ayah_number: 1,
    aya_text: "بِسۡمِ ٱللَّهِ ٱلرَّحۡمَٰنِ ٱلرَّحِيمِ",
    correctAnswer: "الله - اسم الذات الإلهية"
  },
  {
    id: 2,
    word: "ٱلرَّحۡمَٰنِ",
    surah_name: "الفاتحة",
    surah_number: 1,
    ayah_number: 3,
    aya_text: "ٱلرَّحۡمَٰنِ ٱلرَّحِيمِ",
    correctAnswer: "الرحمن الذي وسعت رحمته كل شيء"
  },
  {
    id: 3,
    word: "نَعۡبُدُ",
    surah_name: "الفاتحة",
    surah_number: 1,
    ayah_number: 5,
    aya_text: "إِيَّاكَ نَعۡبُدُ وَإِيَّاكَ نَسۡتَعِينُ",
    correctAnswer: "نعبد - نطيع ونخضع لله"
  },
  {
    id: 4,
    word: "ٱلصِّرَٰطَ",
    surah_name: "الفاتحة",
    surah_number: 1,
    ayah_number: 6,
    aya_text: "ٱهۡدِنَا ٱلصِّرَٰطَ ٱلۡمُسۡتَقِيمَ",
    correctAnswer: "الصراط - الطريق المستقيم"
  },
  {
    id: 5,
    word: "ٱلۡكِتَٰبُ",
    surah_name: "البقرة",
    surah_number: 2,
    ayah_number: 2,
    aya_text: "ذَٰلِكَ ٱلۡكِتَٰبُ لَا رَيۡبَۛ فِيهِۛ",
    correctAnswer: "الكتاب - القرآن الكريم"
  }
];

export default function AudioTest() {
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [hasAnswered, setHasAnswered] = useState(false);
  const [audioPlayer] = useState(new Audio());
  const [notification, setNotification] = useState(null);
  const [currentExampleIndex, setCurrentExampleIndex] = useState(0);

  const testQuestion = {
    word: TEST_EXAMPLES[currentExampleIndex],
    options: [
      { meaning: TEST_EXAMPLES[currentExampleIndex].correctAnswer },
      { meaning: "معنى آخر 1" },
      { meaning: "معنى آخر 2" },
      { meaning: "معنى آخر 3" }
    ],
    correctAnswer: TEST_EXAMPLES[currentExampleIndex].correctAnswer
  };

  const showNotification = (msg) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 4000);
  };

  const handleAnswerSelect = (optionMeaning) => {
    if (hasAnswered) return;
    setSelectedAnswer(optionMeaning);
    setHasAnswered(true);

    setTimeout(() => {
      setSelectedAnswer(null);
      setHasAnswered(false);
    }, 2000);
  };

  const goToNextExample = () => {
    setCurrentExampleIndex((prev) => (prev + 1) % TEST_EXAMPLES.length);
    setSelectedAnswer(null);
    setHasAnswered(false);
  };

  // ✅ 1. تلاوة الآية الكاملة (قارئ حقيقي - مشاري العفاسي)
  const handlePlayAyahRecitation = async (e) => {
    e.stopPropagation();

    const word = testQuestion.word;
    if (!word?.surah_number || !word?.ayah_number) {
      console.warn("❌ Missing surah/ayah numbers");
      showNotification("❌ معلومات الآية غير متوفرة");
      return;
    }

    console.log("🎵 [AudioTest] Playing ayah:", `${word.surah_number}:${word.ayah_number}`);

    try {
      audioPlayer.pause();
      audioPlayer.currentTime = 0;

      const sources = [
        `https://verses.quran.com/${word.surah_number}_${word.ayah_number}.mp3`,
        `https://cdn.alquran.cloud/media/audio/ayah/ar.alafasy/${word.surah_number}:${word.ayah_number}`,
        `https://everyayah.com/data/Alafasy_128kbps/${String(word.surah_number).padStart(3, '0')}${String(word.ayah_number).padStart(3, '0')}.mp3`
      ];

      let played = false;

      for (let i = 0; i < sources.length; i++) {
        console.log(`🔗 [AudioTest] Trying source ${i + 1}:`, sources[i]);
        
        try {
          audioPlayer.src = sources[i];
          await audioPlayer.play();
          console.log(`✅ [AudioTest] Playing from source ${i + 1}`);
          played = true;
          break;
        } catch (err) {
          console.log(`⚠️ [AudioTest] Source ${i + 1} failed:`, err.message);
          if (i === sources.length - 1) {
            showNotification("❌ لم يتم العثور على صوت هذه الآية حاليًا");
          }
        }
      }

    } catch (err) {
      console.error("❌ [AudioTest] General error:", err);
      showNotification("⚠️ حدث خطأ أثناء تشغيل الصوت");
    }
  };

  // ✅ 2. نطق الكلمة فقط (من Quran.com API - مع إصلاح URL)
  const handlePlayWordAudio = async (e) => {
    e.stopPropagation();
    
    const word = testQuestion.word;
    if (!word?.surah_number || !word?.ayah_number) {
      console.warn("❌ Missing surah/ayah for word audio");
      showNotification("❌ معلومات الكلمة غير متوفرة");
      return;
    }
    
    console.log("🔵 [AudioTest] Fetching word audio:", `${word.surah_number}:${word.ayah_number}`);
    
    try {
      const response = await fetch(
        `https://api.quran.com/api/v4/verses/by_key/${word.surah_number}:${word.ayah_number}?words=true&word_fields=text_uthmani,audio_url`
      );
      
      if (!response.ok) {
        console.error("❌ API response not ok:", response.status);
        throw new Error('Failed to fetch word audio');
      }
      
      const data = await response.json();
      const words = data.verse?.words || [];
      
      console.log("📊 [AudioTest] Words from API:", words.length);
      console.log("📝 [AudioTest] API Words:", words.map(w => w.text_uthmani));
      console.log("🎯 [AudioTest] Target word:", word.word);
      
      const normalizedTarget = normalizeArabicText(word.word);
      console.log("🧹 [AudioTest] Normalized target:", normalizedTarget);
      
      let matchingWord = null;
      
      for (const w of words) {
        const normalizedAPIWord = normalizeArabicText(w.text_uthmani);
        console.log(`🔍 [AudioTest] Comparing: "${normalizedAPIWord}" vs "${normalizedTarget}"`);
        
        if (normalizedAPIWord === normalizedTarget) {
          matchingWord = w;
          console.log("✅ [AudioTest] Exact match found!");
          break;
        }
      }
      
      if (!matchingWord) {
        console.log("🔍 [AudioTest] Trying partial match...");
        for (const w of words) {
          const normalizedAPIWord = normalizeArabicText(w.text_uthmani);
          if (normalizedAPIWord.includes(normalizedTarget) || normalizedTarget.includes(normalizedAPIWord)) {
            matchingWord = w;
            console.log("✅ [AudioTest] Partial match found!");
            break;
          }
        }
      }
      
      if (matchingWord?.audio_url) {
        console.log("✅ [AudioTest] Found word audio:", matchingWord.audio_url);
        console.log("📝 [AudioTest] Matched word:", matchingWord.text_uthmani);
        
        let fullAudioUrl = matchingWord.audio_url;
        if (!fullAudioUrl.startsWith('http')) {
          fullAudioUrl = `https://audio.qurancdn.com/${fullAudioUrl}`;
        }
        
        console.log("🔗 [AudioTest] Full audio URL:", fullAudioUrl);
        
        audioPlayer.pause();
        audioPlayer.currentTime = 0;
        audioPlayer.src = fullAudioUrl;
        
        try {
          await audioPlayer.play();
          console.log("✅ [AudioTest] Word audio playing successfully!");
        } catch (playError) {
          console.error("❌ [AudioTest] Play error:", playError);
          showNotification("❌ فشل تشغيل صوت الكلمة");
        }
      } else {
        console.log("⚠️ [AudioTest] Word audio not found");
        showNotification("⚠️ صوت الكلمة غير متوفر");
      }
    } catch (error) {
      console.error("❌ [AudioTest] Error:", error);
      showNotification("❌ فشل تحميل صوت الكلمة");
    }
  };

  // ✅ 3. TTS للمعنى
  const handlePlayMeaningAudio = (e, meaning) => {
    e.stopPropagation();
    console.log("🟣 [AudioTest] Playing meaning TTS:", meaning.substring(0, 30) + "...");
    speakText(meaning, 'ar-SA');
  };

  const highlightWordInAyah = (ayahText, word) => {
    if (!ayahText || !word) return ayahText;

    const parts = ayahText.split(word);
    return (
      <>
        {parts.map((part, index) => (
          <React.Fragment key={index}>
            {part}
            {index < parts.length - 1 && (
              <span className="text-primary font-bold bg-primary/20 px-2 py-1 rounded text-3xl">
                {word}
              </span>
            )}
          </React.Fragment>
        ))}
      </>
    );
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <AnimatePresence>
        {notification && (
          <Notification message={notification} onClose={() => setNotification(null)} />
        )}
      </AnimatePresence>

      <div className="mb-6 text-center">
        <h1 className="text-3xl font-bold gradient-text mb-2">🎵 اختبار نظام الصوت</h1>
        <p className="text-foreground/70">صفحة تجريبية لاختبار الأصوات الثلاثة</p>
        
        <div className="mt-3 flex items-center justify-center gap-3">
          <Badge variant="outline" className="text-base">
            مثال {currentExampleIndex + 1} من {TEST_EXAMPLES.length}
          </Badge>
          <Button
            size="sm"
            onClick={goToNextExample}
            className="gap-2"
          >
            المثال التالي
            <SkipForward className="w-4 h-4" />
          </Button>
        </div>
        
        <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200">
          <p className="text-sm text-blue-800 dark:text-blue-300 mb-2">
            <strong>الأزرار:</strong>
          </p>
          <ul className="text-xs text-blue-700 dark:text-blue-400 space-y-1">
            <li>🟢 الأخضر = تلاوة الآية كاملة (قارئ حقيقي - مشاري العفاسي)</li>
            <li>🔵 الأزرق = نطق الكلمة فقط (Quran.com API)</li>
            <li>🟣 البنفسجي = نطق المعنى (TTS - صوت روبوت)</li>
          </ul>
        </div>
      </div>

      <motion.div
        key={currentExampleIndex}
        initial={{ opacity: 0, x: 100 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -100 }}
        transition={{ duration: 0.3 }}
      >
        <Card className="bg-card backdrop-blur-sm border-border shadow-xl">
          <CardContent className="p-4 md:p-8">
            <div className="text-center mb-6">
              <h2 className="text-5xl md:text-6xl font-bold text-primary arabic-font mb-4">
                {testQuestion.word.word}
              </h2>
              <div className="flex justify-center gap-2">
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={handlePlayAyahRecitation}
                  className="mt-2 hover:bg-green-100 dark:hover:bg-green-900/30"
                  title="🎵 تلاوة الآية كاملة (قارئ حقيقي - مشاري العفاسي)"
                >
                  <Volume2 className="w-8 h-8 text-green-600" />
                </Button>
                
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={handlePlayWordAudio}
                  className="mt-2 hover:bg-blue-100 dark:hover:bg-blue-900/30"
                  title="🗣️ نطق الكلمة فقط (Quran.com API)"
                >
                  <Volume2 className="w-8 h-8 text-blue-600" />
                </Button>
              </div>
              <p className="text-xs text-foreground/60 mt-2">
                🟢 تلاوة الآية (قارئ) | 🔵 نطق الكلمة (API)
              </p>
            </div>

            {testQuestion.word.aya_text && (
              <div className="mb-4 bg-amber-50 dark:bg-amber-900/20 p-6 rounded-xl border-2 border-amber-200 dark:border-amber-800">
                <p className="text-xl md:text-2xl text-center text-foreground arabic-font leading-loose">
                  {highlightWordInAyah(testQuestion.word.aya_text, testQuestion.word.word)}
                </p>
              </div>
            )}

            <div className="text-center mb-6">
              <Badge variant="outline" className="text-base px-4 py-2 bg-background-soft">
                سورة {testQuestion.word.surah_name} - آية {testQuestion.word.ayah_number}
              </Badge>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {testQuestion.options.map((option, index) => {
                const isSelected = selectedAnswer === option.meaning;
                const isCorrect = hasAnswered && option.meaning === testQuestion.correctAnswer;
                const isWrong = hasAnswered && isSelected && option.meaning !== testQuestion.correctAnswer;

                return (
                  <motion.div
                    key={index}
                    whileHover={!hasAnswered ? { scale: 1.02 } : {}}
                    whileTap={!hasAnswered ? { scale: 0.98 } : {}}
                  >
                    <Button
                      onClick={() => !hasAnswered && handleAnswerSelect(option.meaning)}
                      disabled={hasAnswered}
                      className={`
                        w-full min-h-[70px] h-auto text-base md:text-lg p-4 rounded-xl transition-all duration-300
                        ${!hasAnswered ? 'bg-background-soft hover:bg-primary/10 border-2 border-border hover:border-primary text-foreground' : ''}
                        ${isCorrect ? 'bg-green-100 dark:bg-green-900/30 border-2 border-green-500 text-green-900 dark:text-green-100' : ''}
                        ${isWrong ? 'bg-red-100 dark:bg-red-900/30 border-2 border-red-500 text-red-900 dark:text-red-100' : ''}
                        ${!isSelected && !isCorrect && hasAnswered ? 'opacity-50' : ''}
                        whitespace-normal break-words text-right
                      `}
                    >
                      <span className="flex items-center justify-between w-full gap-3">
                        <span className="flex-1 leading-relaxed text-left overflow-wrap-anywhere">{option.meaning}</span>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          {isCorrect && <CheckCircle className="w-6 h-6 text-green-600 dark:text-green-400" />}
                          {isWrong && <XCircle className="w-6 h-6 text-red-600 dark:text-red-400" />}
                          
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={(e) => handlePlayMeaningAudio(e, option.meaning)}
                            className="h-8 w-8 hover:bg-purple-100 dark:hover:bg-purple-900/30"
                            title="🟣 استمع للمعنى (TTS)"
                          >
                            <Volume2 className="w-5 h-5 text-purple-600" />
                          </Button>
                        </div>
                      </span>
                    </Button>
                  </motion.div>
                );
              })}
            </div>

            <div className="mt-8 p-4 bg-gray-50 dark:bg-gray-900/20 rounded-lg border border-gray-200">
              <h3 className="font-bold mb-2">📝 ملاحظات التجربة:</h3>
              <ul className="text-sm space-y-1 text-foreground/80">
                <li>• افتح Console (F12) لرؤية رسائل Debugging التفصيلية</li>
                <li>• 🟢 الزر الأخضر = تلاوة الآية **كاملة**</li>
                <li>• 🔵 الزر الأزرق = نطق الكلمة **فقط** من Quran.com API</li>
                <li>• 🟣 الأزرار البنفسجية = نطق المعنى بـ TTS</li>
                <li>• اضغط "المثال التالي" لتجربة كلمات مختلفة من سور مختلفة</li>
              </ul>
              
              <div className="mt-4 p-3 bg-green-50 dark:bg-green-900/20 rounded border border-green-200">
                <p className="text-xs text-green-800 dark:text-green-300">
                  <strong>✅ تم الإصلاح:</strong>
                </p>
                <ul className="text-xs text-green-700 dark:text-green-400 mt-1 space-y-1">
                  <li>✓ إضافة البادئة للروابط النسبية: https://audio.qurancdn.com/</li>
                  <li>✓ 5 أمثلة متنوعة من سور مختلفة للاختبار</li>
                  <li>✓ Debugging شامل في Console</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
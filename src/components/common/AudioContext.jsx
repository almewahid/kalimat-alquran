import React, { createContext, useContext, useState, useRef, useCallback, useEffect } from 'react';
import { supabaseClient } from "@/components/api/supabaseClient";
import { TextToSpeech } from '@capacitor-community/text-to-speech';

const AudioContext = createContext();

export const useAudio = () => {
  const context = useContext(AudioContext);
  if (!context) {
    throw new Error('useAudio must be used within AudioProvider');
  }
  return context;
};

// ✅ دالة تنظيف النص العربي (مطابقة تماماً لـ AudioTest)
const normalizeArabicText = (text) => {
  if (!text) return '';
  return text
    .replace(/[\u064B-\u065F]/g, '') // التشكيل الأساسي
    .replace(/[\u0670]/g, '') // ألف خنجرية
    .replace(/[\u0600-\u061C]/g, '') // رموز قرآنية
    .replace(/[\u06D6-\u06FF]/g, '') // رموز التلاوة والوقف
    .replace(/\u0640/g, '') // Tatweel
    .replace(/ٱ/g, 'ا')
    .replace(/أ/g, 'ا')
    .replace(/إ/g, 'ا')
    .replace(/آ/g, 'ا')
    .replace(/ى/g, 'ي')
    .replace(/ة/g, 'ه')
    .replace(/[^\u0600-\u06FF\s]/g, '')
    .trim();
};

// 📝 وظيفة مساعدة لتسجيل الأخطاء في الخلفية
const logErrorToBackend = async (context, message, details) => {
  console.error(`[${context}] ${message}`, details);
  try {
    let userEmail = "anonymous";
    try {
      const user = await supabaseClient.supabase.auth.getUser();
      if (user) userEmail = user.email;
    } catch (e) { /* ignore auth error */ }

    await supabaseClient.entities.ErrorLog.create({
      error_message: message,
      error_details: typeof details === 'object' ? JSON.stringify(details) : String(details),
      context: context,
    });
  } catch (err) {
    console.error("Failed to send error log to backend:", err);
  }
};

export const AudioProvider = ({ children }) => {
  const audioRef = useRef(new Audio());
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentWord, setCurrentWord] = useState(null);
  const [currentType, setCurrentType] = useState(null); // 'ayah' | 'word' | 'meaning'
  const [error, setError] = useState(null);
  const [volume, setVolume] = useState(1);
  
  // 🆕 قائمة تشغيل للمقاطع الصوتية المتتابعة (للكلمات المركبة)
  const [playlist, setPlaylist] = useState([]);
  
  // ✅ مرجع لحفظ عناصر audio الخارجية (الفصحى/العامية)
  const externalAudiosRef = useRef(new Set());

  // ✅ 1. تلاوة الآية (مع حالة تحميل)
  const playAyah = useCallback(async (surahNumber, ayahNumber, wordData) => {
    if (!surahNumber || !ayahNumber) {
      const msg = 'معلومات الآية غير متوفرة (رقم السورة أو الآية مفقود)';
      setError(`❌ ${msg}`);
      logErrorToBackend('AudioContext/playAyah', msg, { surahNumber, ayahNumber, wordData });
      return;
    }

    console.log(`[AudioContext] 🎵 Playing ayah: ${surahNumber}:${ayahNumber}`);
    setPlaylist([]); // Clear playlist for single ayah
    
    // إظهار حالة تحميل
    setCurrentWord(wordData);
    setCurrentType('ayah');
    setError('⏳ جارٍ تحميل الصوت...');
    setIsPlaying(false);

    try {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;

      const sources = [
        `https://verses.quran.com/${surahNumber}_${ayahNumber}.mp3`,
        `https://cdn.alquran.cloud/media/audio/ayah/ar.alafasy/${surahNumber}:${ayahNumber}`,
        `https://everyayah.com/data/Alafasy_128kbps/${String(surahNumber).padStart(3, '0')}${String(ayahNumber).padStart(3, '0')}.mp3`
      ];

      let played = false;

      for (let i = 0; i < sources.length; i++) {
        try {
          audioRef.current.src = sources[i];
          audioRef.current.volume = volume;
          
          // انتظار تحميل البيانات الكافية للتشغيل
          await new Promise((resolve, reject) => {
            const handleCanPlay = () => {
              audioRef.current.removeEventListener('canplay', handleCanPlay);
              audioRef.current.removeEventListener('error', handleError);
              resolve();
            };
            
            const handleError = (e) => {
              audioRef.current.removeEventListener('canplay', handleCanPlay);
              audioRef.current.removeEventListener('error', handleError);
              reject(e);
            };
            
            audioRef.current.addEventListener('canplay', handleCanPlay, { once: true });
            audioRef.current.addEventListener('error', handleError, { once: true });
            audioRef.current.load();
          });
          
          await audioRef.current.play();
          
          setIsPlaying(true);
          setCurrentWord(wordData);
          setCurrentType('ayah');
          setError(null); // إزالة رسالة التحميل
          
          console.log(`[AudioContext] ✅ Playing from source ${i + 1}`);
          played = true;
          break;
        } catch (err) {
          console.warn(`[AudioContext] ⚠️ Source ${i + 1} failed:`, err.message);
        }
      }

      if (!played) {
        const msg = 'فشل تشغيل صوت الآية من جميع المصادر';
        setError(`❌ ${msg}`);
        setIsPlaying(false);
        logErrorToBackend('AudioContext/playAyah', msg, { surahNumber, ayahNumber, sources });
      }

    } catch (err) {
      const msg = 'حدث خطأ غير متوقع أثناء تشغيل تلاوة الآية';
      setError(`⚠️ ${msg}`);
      setIsPlaying(false);
      logErrorToBackend('AudioContext/playAyah', msg, err);
    }
  }, [volume]);

  // ✅ 2. نطق الكلمة (يدعم الكلمات المركبة مثل "النهار معاشا")
  const playWord = useCallback(async (surahNumber, ayahNumber, word, wordData) => {
    if (!surahNumber || !ayahNumber || !word) {
      const msg = 'معلومات الكلمة غير متوفرة (السورة، الآية، أو نص الكلمة)';
      setError(`❌ ${msg}`);
      logErrorToBackend('AudioContext/playWord', msg, { surahNumber, ayahNumber, word });
      return;
    }

    console.log(`[AudioContext] 🔵 Fetching word audio: ${surahNumber}:${ayahNumber} word: ${word}`);
    setPlaylist([]); // Reset playlist
    
    // إظهار حالة تحميل
    setCurrentWord(wordData || { word, surah_number: surahNumber, ayah_number: ayahNumber });
    setCurrentType('word');
    setError('⏳ جارٍ تحميل الصوت...');
    setIsPlaying(false);

    try {
      // استخدام API Quran.com
      const response = await fetch(
        `https://api.quran.com/api/v4/verses/by_key/${surahNumber}:${ayahNumber}?words=true&word_fields=text_uthmani,audio_url`
      );

      if (!response.ok) {
        throw new Error(`API Error: ${response.status}`);
      }

      const data = await response.json();
      const words = data.verse?.words || [];

      // 1. تقسيم الكلمة المدخلة إلى أجزاء (في حال كانت مركبة)
      const targetParts = normalizeArabicText(word).split(/\s+/).filter(p => p.length > 0);
      
      if (targetParts.length === 0) {
        throw new Error("الكلمة فارغة أو تحتوي رموز غير صالحة");
      }

      console.log(`[AudioContext] 🎯 Target parts:`, targetParts);

      let matchedSequence = [];
      let matchStartIndex = -1;

      // 2. البحث عن التسلسل المتطابق في كلمات الآية
      for (let i = 0; i < words.length; i++) {
        // تطبيع الكلمة الحالية من الآية
        const currentApiWord = normalizeArabicText(words[i].text_uthmani);
        
        // هل تطابق الجزء الأول من الكلمة المستهدفة؟
        if (currentApiWord === targetParts[0] || currentApiWord.includes(targetParts[0]) || targetParts[0].includes(currentApiWord)) {
          // بداية تطابق محتمل
          let potentialSequence = [words[i]];
          let isFullMatch = true;

          // التحقق من باقي الأجزاء
          for (let j = 1; j < targetParts.length; j++) {
            if (i + j >= words.length) {
              isFullMatch = false; // تجاوزنا نهاية الآية
              break;
            }
            
            const nextApiWord = normalizeArabicText(words[i + j].text_uthmani);
            const nextTargetPart = targetParts[j];

            if (nextApiWord === nextTargetPart || nextApiWord.includes(nextTargetPart) || nextTargetPart.includes(nextApiWord)) {
              potentialSequence.push(words[i + j]);
            } else {
              isFullMatch = false;
              break;
            }
          }

          if (isFullMatch) {
            matchedSequence = potentialSequence;
            matchStartIndex = i;
            break; // وجدنا التطابق!
          }
        }
      }

      // 3. Fallback: Aggressive search (ignore order if strict sequence fails, mostly for weird edge cases)
      if (matchedSequence.length === 0 && targetParts.length > 1) {
         console.log('[AudioContext] 🕵️ Trying loose match for multiple words...');
         const foundWords = [];
         targetParts.forEach(part => {
             const found = words.find(w => {
                 const norm = normalizeArabicText(w.text_uthmani);
                 return norm === part || norm.includes(part) || part.includes(norm);
             });
             if(found) foundWords.push(found);
         });
         if(foundWords.length === targetParts.length) {
             matchedSequence = foundWords;
         }
      }

      // Fallback for single word exact match failure (original logic)
      if (matchedSequence.length === 0 && targetParts.length === 1) {
          console.log('[AudioContext] 🕵️ Trying aggressive single word match...');
          const superCleanTarget = targetParts[0].replace(/[اأإآ]/g, '');
          for (const w of words) {
            const superCleanApi = normalizeArabicText(w.text_uthmani).replace(/[اأإآ]/g, '');
            if (superCleanApi === superCleanTarget || superCleanApi.includes(superCleanTarget)) {
              matchedSequence = [w];
              break;
            }
          }
      }

      if (matchedSequence.length > 0) {
        // استخراج روابط الصوت الصالحة
        const audioUrls = matchedSequence
          .map(w => w.audio_url)
          .filter(url => url)
          .map(url => url.startsWith('http') ? url : `https://audio.qurancdn.com/${url}`);

        if (audioUrls.length > 0) {
          console.log(`[AudioContext] ✅ Playing sequence: ${audioUrls.length} clips`);
          
          // Set up playlist (first one plays immediately, rest go to state)
          const [firstUrl, ...restUrls] = audioUrls;
          setPlaylist(restUrls);

          audioRef.current.pause();
          audioRef.current.currentTime = 0;
          audioRef.current.src = firstUrl;
          audioRef.current.volume = volume;
          
          try {
            await audioRef.current.play();
            setIsPlaying(true);
            setCurrentWord(wordData || { word, surah_number: surahNumber, ayah_number: ayahNumber });
            setCurrentType('word');
            setError(null); // إزالة رسالة التحميل
          } catch (playErr) {
            throw new Error(`Playback failed: ${playErr.message}`);
          }
        } else {
           throw new Error("تم العثور على الكلمات لكن لا توجد ملفات صوتية لها");
        }
      } else {
        const msg = `لم يتم العثور على الكلمة/العبارة في نص الآية (${word})`;
        console.warn(`[AudioContext] ${msg}`);
        setError(`⚠️ ${msg}`);
        setIsPlaying(false);
        logErrorToBackend('AudioContext/playWord', msg, { 
          surahNumber, ayahNumber, word, targetParts, 
          apiWords: words.map(w => w.text_uthmani)
        });
      }
    } catch (error) {
      const msg = 'فشل تحميل أو تشغيل صوت الكلمة';
      setError(`❌ ${msg}`);
      setIsPlaying(false);
      logErrorToBackend('AudioContext/playWord', msg, { 
        error: error.message, surahNumber, ayahNumber, word 
      });
    }
  }, [volume]);

  // ✅ 3. TTS للمعنى - يعمل على الموبايل والكمبيوتر
  const playMeaning = useCallback(async (meaningText) => {
    console.log('[AudioContext/TTS] Starting playMeaning');
    
    setPlaylist([]);
    setIsPlaying(true);
    setCurrentType('meaning');
    setError(null);

    try {
      // ✅ استخدام Capacitor TTS (يعمل على الموبايل والكمبيوتر)
      console.log('[AudioContext/TTS] Using Capacitor TTS');
      
      await TextToSpeech.speak({
        text: meaningText,
        lang: 'ar-SA',
        rate: 0.8,
        pitch: 1.0,
        volume: 1.0,
        category: 'ambient',
      });
      
      console.log('[AudioContext/TTS] Capacitor TTS completed successfully');
      
      // تحديث الحالة بعد الانتهاء
      setIsPlaying(false);
      setCurrentWord(null);
      setCurrentType(null);
      
    } catch (error) {
      console.error('[AudioContext/TTS] Capacitor TTS Error:', error);
      
      // ⚡ Fallback للمتصفحات التي لا تدعم Capacitor
      console.log('[AudioContext/TTS] Trying Web Speech API fallback...');
      
      if ('speechSynthesis' in window) {
        try {
          await playMeaningWebSpeech(meaningText);
        } catch (webError) {
          console.error('[AudioContext/TTS] Web Speech API also failed:', webError);
          setError('❌ فشل النطق');
          setIsPlaying(false);
        }
      } else {
        setError('⚠️ النطق الصوتي غير متاح');
        setIsPlaying(false);
      }
    }
  }, [volume]);

  // ✅ Fallback: Web Speech API (للمتصفحات العادية)
  const playMeaningWebSpeech = useCallback(async (meaningText) => {
    return new Promise((resolve, reject) => {
      window.speechSynthesis.cancel();
      
      const utterance = new SpeechSynthesisUtterance(meaningText);
      utterance.lang = 'ar-SA';
      utterance.rate = 0.8;
      utterance.pitch = 0.7;
      utterance.volume = volume;

      utterance.onend = () => {
        console.log('[AudioContext/TTS] Web Speech ended');
        setIsPlaying(false);
        setCurrentWord(null);
        setCurrentType(null);
        resolve();
      };

      utterance.onerror = (event) => {
        console.error('[AudioContext/TTS] Web Speech error:', event);
        reject(event);
      };

      window.speechSynthesis.speak(utterance);
    });
  }, [volume]);

  // ✅ التحكم بالتشغيل
  const pause = useCallback(() => {
    if (currentType === 'meaning') {
      window.speechSynthesis.cancel();
    } else {
      audioRef.current.pause();
    }
    setIsPlaying(false);
  }, [currentType]);

  const resume = useCallback(() => {
    if (currentType !== 'meaning' && audioRef.current.src) {
      audioRef.current.play();
      setIsPlaying(true);
    }
  }, [currentType]);

  const stop = useCallback(() => {
    setPlaylist([]); // Clear playlist on stop
    if (currentType === 'meaning') {
      window.speechSynthesis.cancel();
    } else {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      audioRef.current.src = '';
    }
    setIsPlaying(false);
    setCurrentWord(null); // Hide player
    setCurrentType(null);
    setError(null); // Clear error on close
  }, [currentType]);

  // ✅ إيقاف جميع الأصوات (AudioContext + الأصوات الخارجية)
  // exceptAudio: عنصر audio لا نريد إيقافه (للفصحى/العامية)
  const stopAll = useCallback((exceptAudio = null) => {
    // إيقاف AudioContext فقط إذا لم يكن في وضع التشغيل النشط
    setPlaylist([]);
    window.speechSynthesis.cancel();
    
    // لا نوقف audioRef.current إذا كان في وضع التحميل أو التشغيل
    if (audioRef.current.paused || audioRef.current.ended) {
      audioRef.current.currentTime = 0;
      audioRef.current.src = '';
    }
    
    setIsPlaying(false);
    setCurrentWord(null);
    setCurrentType(null);
    setError(null);
    
    // إيقاف جميع الأصوات المسجلة (ما عدا المستثنى)
    externalAudiosRef.current.forEach(audio => {
      if (audio && audio !== exceptAudio && !audio.paused) {
        audio.pause();
        audio.currentTime = 0;
      }
    });
  }, []);

  // ✅ تسجيل عنصر audio خارجي
  const registerAudio = useCallback((audioElement) => {
    if (audioElement) {
      externalAudiosRef.current.add(audioElement);
    }
  }, []);

  // ✅ إلغاء تسجيل عنصر audio خارجي
  const unregisterAudio = useCallback((audioElement) => {
    if (audioElement) {
      externalAudiosRef.current.delete(audioElement);
    }
  }, []);

  const changeVolume = useCallback((newVolume) => {
    setVolume(newVolume);
    audioRef.current.volume = newVolume;
  }, []);

  // ✅ مراقبة انتهاء الصوت
  useEffect(() => {
    const audio = audioRef.current;
    
    const handleEnded = async () => {
      if (playlist.length > 0) {
        // Play next item in playlist
        const [nextUrl, ...remaining] = playlist;
        setPlaylist(remaining);
        
        console.log('[AudioContext] ⏭️ Playing next segment...');
        audio.src = nextUrl;
        try {
          await audio.play();
        } catch (e) {
          console.error("Error playing next segment:", e);
          setIsPlaying(false);
        }
      } else {
        // Finished everything
        setIsPlaying(false);
        // Auto-hide after short delay to show it finished
        setTimeout(() => {
            setCurrentWord(null);
            setCurrentType(null);
        }, 500);
      }
    };

    const handleError = () => {
      setIsPlaying(false);
      setError('⚠️جاري تحميل الصوت...');
    };

    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('error', handleError);

    return () => {
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('error', handleError);
    };
  }, [playlist]); // Re-bind when playlist changes

  const value = {
    isPlaying,
    currentWord,
    currentType,
    error,
    volume,
    playAyah,
    playWord,
    playMeaning,
    pause,
    resume,
    stop,
    stopAll, // ✅ إيقاف جميع الأصوات
    registerAudio, // ✅ تسجيل audio خارجي
    unregisterAudio, // ✅ إلغاء تسجيل audio
    changeVolume,
    clearError: () => setError(null)
  };

  return (
    <AudioContext.Provider value={value}>
      {children}
    </AudioContext.Provider>
  );
};

export default AudioProvider;
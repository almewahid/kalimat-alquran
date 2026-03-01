import React, { createContext, useContext, useState, useRef, useCallback, useEffect } from 'react';
import { supabaseClient } from "@/components/api/supabaseClient";
import { TextToSpeech } from '@capacitor-community/text-to-speech';
import { Capacitor } from '@capacitor/core';

const AudioContext = createContext();

export const useAudio = () => {
  const context = useContext(AudioContext);
  if (!context) {
    throw new Error('useAudio must be used within AudioProvider');
  }
  return context;
};

// ✅ دالة تنظيف النص العربي
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
    .replace(/[^\u0600-\u06FF\s]/g, '')
    .trim();
};

// 📝 تسجيل الأخطاء في الخلفية
const logErrorToBackend = async (context, message, details) => {
  console.error(`[${context}] ${message}`, details);
  try {
    let userEmail = "anonymous";
    try {
      const user = await supabaseClient.auth.me();
      if (user) userEmail = user.email;
    } catch (e) { /* ignore */ }
    await supabaseClient.entities.ErrorLog.create({
      error_message: message,
      error_details: typeof details === 'object' ? JSON.stringify(details) : String(details),
      context: context,
    });
  } catch (err) {
    console.error("Failed to send error log to backend:", err);
  }
};

// ✅ Web Speech API — يعمل على الموبايل وiOS مع جميع الـ quirks
const speakWithWebSpeech = (text, { rate = 0.8, pitch = 0.7, volume = 1 } = {}) => {
  return new Promise((resolve, reject) => {
    if (!('speechSynthesis' in window)) {
      return reject(new Error('speechSynthesis not supported'));
    }

    // إيقاف أي شيء جاري
    window.speechSynthesis.cancel();

    const utter = new SpeechSynthesisUtterance(text);
    utter.lang = 'ar-SA';
    utter.rate = rate;
    utter.pitch = pitch;
    utter.volume = volume;

    const assignVoiceAndSpeak = () => {
      const voices = window.speechSynthesis.getVoices();
      const arabicVoice =
        voices.find(v => v.lang === 'ar-SA') ||
        voices.find(v => v.lang.startsWith('ar'));
      if (arabicVoice) utter.voice = arabicVoice;

      // ✅ iOS Safari: speechSynthesis يتوقف بعد ~15 ثانية — نعيد resume() دورياً
      let resumeInterval = null;
      const startResumeInterval = () => {
        resumeInterval = setInterval(() => {
          if (window.speechSynthesis.speaking) {
            window.speechSynthesis.resume();
          } else {
            clearInterval(resumeInterval);
          }
        }, 10000);
      };

      utter.onstart = () => startResumeInterval();

      utter.onend = () => {
        clearInterval(resumeInterval);
        resolve();
      };

      utter.onerror = (event) => {
        clearInterval(resumeInterval);
        // "interrupted" يحدث عند cancel() — ليس خطأ حقيقي
        if (event.error === 'interrupted' || event.error === 'canceled') {
          resolve();
        } else {
          reject(event);
        }
      };

      window.speechSynthesis.speak(utter);
    };

    // ✅ iOS: الأصوات تُحمَّل بشكل async — ننتظرها إن لم تكن جاهزة
    const voices = window.speechSynthesis.getVoices();
    if (voices.length > 0) {
      assignVoiceAndSpeak();
    } else {
      window.speechSynthesis.onvoiceschanged = () => {
        window.speechSynthesis.onvoiceschanged = null;
        assignVoiceAndSpeak();
      };
      // timeout للأجهزة التي لا تُطلق onvoiceschanged
      setTimeout(() => {
        if (window.speechSynthesis.onvoiceschanged !== null) {
          window.speechSynthesis.onvoiceschanged = null;
          assignVoiceAndSpeak();
        }
      }, 1000);
    }
  });
};

export const AudioProvider = ({ children }) => {
  const audioRef = useRef(new Audio());
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentWord, setCurrentWord] = useState(null);
  const [currentType, setCurrentType] = useState(null); // 'ayah' | 'word' | 'meaning'
  const [error, setError] = useState(null);
  const [volume, setVolume] = useState(1);

  // ✅ playlist محفوظ في ref لتجنب stale closure في handleEnded
  const playlistRef = useRef([]);
  const externalAudiosRef = useRef(new Set());
  const currentTypeRef = useRef(null);

  // مزامنة currentType مع currentTypeRef
  const updateCurrentType = (type) => {
    currentTypeRef.current = type;
    setCurrentType(type);
  };

  // ✅ handleEnded بدون dependency على playlist (يقرأ من ref)
  const handleEnded = useCallback(async () => {
    if (playlistRef.current.length > 0) {
      const [nextUrl, ...remaining] = playlistRef.current;
      playlistRef.current = remaining;

      console.log('[AudioContext] ⏭️ Playing next segment...');
      audioRef.current.src = nextUrl;
      try {
        await audioRef.current.play();
      } catch (e) {
        console.error("Error playing next segment:", e);
        setIsPlaying(false);
      }
    } else {
      setIsPlaying(false);
      setError(null);
      setTimeout(() => {
        setCurrentWord(null);
        updateCurrentType(null);
      }, 500);
    }
  }, []);

  const handleError = useCallback((e) => {
    if (!audioRef.current.src || audioRef.current.src === window.location.href) {
      console.log('[AudioContext] Ignored error: audio.src is empty.');
      return;
    }
    setIsPlaying(false);
    logErrorToBackend('AudioContext/handleError', 'Audio playback error', {
      error_message: e.message || e.type,
      error_code: audioRef.current.error?.code,
      audio_src: audioRef.current.src,
    });
    setError(null);
    setCurrentWord(null);
    updateCurrentType(null);
  }, []);

  // ✅ 1. تلاوة الآية
  const playAyah = useCallback(async (surahNumber, ayahNumber, wordData) => {
    if (!surahNumber || !ayahNumber) {
      const msg = 'معلومات الآية غير متوفرة (رقم السورة أو الآية مفقود)';
      setError(`❌ ${msg}`);
      logErrorToBackend('AudioContext/playAyah', msg, { surahNumber, ayahNumber });
      return;
    }

    console.log(`[AudioContext] 🎵 Playing ayah: ${surahNumber}:${ayahNumber}`);
    playlistRef.current = [];

    setCurrentWord(wordData);
    updateCurrentType('ayah');
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
          await audioRef.current.play();
          setIsPlaying(true);
          setCurrentWord(wordData);
          updateCurrentType('ayah');
          setError(null);
          console.log(`[AudioContext] ✅ Playing from source ${i + 1}`);
          played = true;
          break;
        } catch (err) {
          console.warn(`[AudioContext] ⚠️ Source ${i + 1} failed:`, err.message);
          audioRef.current.pause();
          audioRef.current.currentTime = 0;
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

  // ✅ 2. نطق الكلمة (يدعم الكلمات المركبة)
  const playWord = useCallback(async (surahNumber, ayahNumber, word, wordData) => {
    if (!surahNumber || !ayahNumber || !word) {
      const msg = 'معلومات الكلمة غير متوفرة (السورة، الآية، أو نص الكلمة)';
      setError(`❌ ${msg}`);
      logErrorToBackend('AudioContext/playWord', msg, { surahNumber, ayahNumber, word });
      return;
    }

    console.log(`[AudioContext] 🔵 Fetching word audio: ${surahNumber}:${ayahNumber} word: ${word}`);
    playlistRef.current = [];

    setCurrentWord(wordData || { word, surah_number: surahNumber, ayah_number: ayahNumber });
    updateCurrentType('word');
    setError('⏳ جارٍ تحميل الصوت...');
    setIsPlaying(false);

    try {
      const response = await fetch(
        `https://api.quran.com/api/v4/verses/by_key/${surahNumber}:${ayahNumber}?words=true&word_fields=text_uthmani,audio_url`
      );

      if (!response.ok) throw new Error(`API Error: ${response.status}`);

      const data = await response.json();
      const words = data.verse?.words || [];

      const targetParts = normalizeArabicText(word).split(/\s+/).filter(p => p.length > 0);

      if (targetParts.length === 0) throw new Error("الكلمة فارغة أو تحتوي رموز غير صالحة");

      console.log(`[AudioContext] 🎯 Target parts:`, targetParts);

      let matchedSequence = [];

      for (let i = 0; i < words.length; i++) {
        const currentApiWord = normalizeArabicText(words[i].text_uthmani);

        if (currentApiWord === targetParts[0] || currentApiWord.includes(targetParts[0]) || targetParts[0].includes(currentApiWord)) {
          let potentialSequence = [words[i]];
          let isFullMatch = true;

          for (let j = 1; j < targetParts.length; j++) {
            if (i + j >= words.length) { isFullMatch = false; break; }
            const nextApiWord = normalizeArabicText(words[i + j].text_uthmani);
            const nextTargetPart = targetParts[j];

            if (nextApiWord === nextTargetPart || nextApiWord.includes(nextTargetPart) || nextTargetPart.includes(nextApiWord)) {
              potentialSequence.push(words[i + j]);
            } else {
              isFullMatch = false; break;
            }
          }

          if (isFullMatch) { matchedSequence = potentialSequence; break; }
        }
      }

      // Fallback: loose multi-word match
      if (matchedSequence.length === 0 && targetParts.length > 1) {
        const foundWords = [];
        targetParts.forEach(part => {
          const found = words.find(w => {
            const norm = normalizeArabicText(w.text_uthmani);
            return norm === part || norm.includes(part) || part.includes(norm);
          });
          if (found) foundWords.push(found);
        });
        if (foundWords.length === targetParts.length) matchedSequence = foundWords;
      }

      // Fallback: aggressive single-word match
      if (matchedSequence.length === 0 && targetParts.length === 1) {
        const superCleanTarget = targetParts[0].replace(/[اأإآ]/g, '');
        for (const w of words) {
          const superCleanApi = normalizeArabicText(w.text_uthmani).replace(/[اأإآ]/g, '');
          if (superCleanApi === superCleanTarget || superCleanApi.includes(superCleanTarget)) {
            matchedSequence = [w]; break;
          }
        }
      }

      if (matchedSequence.length > 0) {
        const audioUrls = matchedSequence
          .map(w => w.audio_url)
          .filter(url => url)
          .map(url => url.startsWith('http') ? url : `https://audio.qurancdn.com/${url}`);

        if (audioUrls.length > 0) {
          console.log(`[AudioContext] ✅ Playing sequence: ${audioUrls.length} clips`);
          const [firstUrl, ...restUrls] = audioUrls;
          playlistRef.current = restUrls;

          audioRef.current.pause();
          audioRef.current.currentTime = 0;
          audioRef.current.src = firstUrl;
          audioRef.current.volume = volume;

          try {
            await audioRef.current.play();
            setIsPlaying(true);
            setCurrentWord(wordData || { word, surah_number: surahNumber, ayah_number: ayahNumber });
            updateCurrentType('word');
            setError(null);
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
        logErrorToBackend('AudioContext/playWord', msg, { surahNumber, ayahNumber, word, targetParts, apiWords: words.map(w => w.text_uthmani) });
      }
    } catch (error) {
      const msg = 'فشل تحميل أو تشغيل صوت الكلمة';
      setError(`❌ ${msg}`);
      setIsPlaying(false);
      logErrorToBackend('AudioContext/playWord', msg, { error: error.message, surahNumber, ayahNumber, word });
    }
  }, [volume]);

  // ✅ 3. TTS للمعنى — يعمل على الموبايل (iOS/Android) وسطح المكتب
  const playMeaning = useCallback(async (meaningText) => {
    if (!meaningText) return;

    console.log('[AudioContext/TTS] Starting playMeaning');

    playlistRef.current = [];
    setIsPlaying(true);
    updateCurrentType('meaning');
    setError(null);

    const isNative = Capacitor.isNativePlatform();

    if (isNative) {
      // ✅ تطبيق Native (Android/iOS) — استخدم Capacitor TTS
      try {
        console.log('[AudioContext/TTS] Native: using Capacitor TTS');
        await TextToSpeech.speak({
          text: meaningText,
          lang: 'ar-SA',
          rate: 0.8,
          pitch: 1.0,
          volume: 1.0,
          category: 'ambient',
        });
        console.log('[AudioContext/TTS] Capacitor TTS completed');
        setIsPlaying(false);
        setCurrentWord(null);
        updateCurrentType(null);
      } catch (err) {
        console.error('[AudioContext/TTS] Capacitor TTS failed, trying Web Speech:', err);
        try {
          await speakWithWebSpeech(meaningText, { volume });
          setIsPlaying(false);
          setCurrentWord(null);
          updateCurrentType(null);
        } catch (webErr) {
          setError('❌ فشل النطق الصوتي');
          setIsPlaying(false);
        }
      }
    } else {
      // ✅ متصفح ويب (موبايل أو سطح مكتب) — استخدم Web Speech API مع كامل الإصلاحات
      if ('speechSynthesis' in window) {
        console.log('[AudioContext/TTS] Web: using Web Speech API');
        try {
          await speakWithWebSpeech(meaningText, { volume });
          setIsPlaying(false);
          setCurrentWord(null);
          updateCurrentType(null);
        } catch (err) {
          console.error('[AudioContext/TTS] Web Speech API failed:', err);
          setError('❌ فشل النطق الصوتي');
          setIsPlaying(false);
        }
      } else {
        setError('⚠️ النطق الصوتي غير متاح في هذا المتصفح');
        setIsPlaying(false);
      }
    }
  }, [volume]);

  // ✅ التحكم بالتشغيل
  const pause = useCallback(() => {
    if (currentTypeRef.current === 'meaning') {
      window.speechSynthesis?.cancel();
    } else {
      audioRef.current.pause();
    }
    setIsPlaying(false);
  }, []);

  const resume = useCallback(() => {
    if (currentTypeRef.current !== 'meaning' && audioRef.current.src) {
      audioRef.current.play();
      setIsPlaying(true);
    }
  }, []);

  const stop = useCallback(() => {
    playlistRef.current = [];
    if (currentTypeRef.current === 'meaning') {
      window.speechSynthesis?.cancel();
    } else {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      audioRef.current.removeEventListener('error', handleError);
      audioRef.current.src = '';
      audioRef.current.addEventListener('error', handleError);
    }
    setIsPlaying(false);
    setCurrentWord(null);
    updateCurrentType(null);
    setError(null);
  }, [handleError]);

  const stopAll = useCallback((exceptAudio = null) => {
    playlistRef.current = [];
    window.speechSynthesis?.cancel();

    if (audioRef.current.paused || audioRef.current.ended) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      audioRef.current.removeEventListener('error', handleError);
      audioRef.current.src = '';
      audioRef.current.addEventListener('error', handleError);
    }

    setIsPlaying(false);
    setCurrentWord(null);
    updateCurrentType(null);
    setError(null);

    externalAudiosRef.current.forEach(audio => {
      if (audio && audio !== exceptAudio && !audio.paused) {
        audio.pause();
        audio.currentTime = 0;
      }
    });
  }, [handleError]);

  const registerAudio = useCallback((audioElement) => {
    if (audioElement) externalAudiosRef.current.add(audioElement);
  }, []);

  const unregisterAudio = useCallback((audioElement) => {
    if (audioElement) externalAudiosRef.current.delete(audioElement);
  }, []);

  const changeVolume = useCallback((newVolume) => {
    setVolume(newVolume);
    audioRef.current.volume = newVolume;
  }, []);

  // ✅ فتح AudioContext على أول لمسة/نقر (مطلوب على Android)
  useEffect(() => {
    const audio = audioRef.current;
    let unlocked = false;
    const SILENT_WAV = 'data:audio/wav;base64,UklGRigAAABXQVZFZm10IBIAAAABAAEARKwAAIhYAQACABAAZGF0YQAAAAA=';

    const unlock = () => {
      if (unlocked) return;
      unlocked = true;
      audio.src = SILENT_WAV;
      audio.play().then(() => {
        audio.pause();
        audio.currentTime = 0;
        console.log('[AudioContext] 🔓 Audio unlocked on first gesture');
      }).catch(() => {});
    };

    document.addEventListener('touchstart', unlock, { once: true, passive: true });
    document.addEventListener('click', unlock, { once: true });

    return () => {
      document.removeEventListener('touchstart', unlock);
      document.removeEventListener('click', unlock);
    };
  }, []);

  // ✅ ربط event listeners على audioRef — مرة واحدة فقط
  useEffect(() => {
    const audio = audioRef.current;
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('error', handleError);
    return () => {
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('error', handleError);
    };
  }, [handleEnded, handleError]);

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
    stopAll,
    registerAudio,
    unregisterAudio,
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
// 🎙️ نظام TTS محسّن - يدعم صوت رجل عربي

/**
 * دالة TTS محسّنة مع أفضل ممارسات لاختيار صوت رجل عربي
 * 
 * @param {string} text - النص المراد قراءته
 * @param {string} lang - لغة النص (افتراضياً: ar-SA)
 * @param {object} options - خيارات إضافية (rate, pitch, volume)
 * @returns {Promise} - Promise يكتمل عند انتهاء النطق
 */
export const speakText = (text, lang = 'ar-SA', options = {}) => {
  return new Promise((resolve, reject) => {
    if (!('speechSynthesis' in window)) {
      console.warn('[SpeechUtils] Web Speech API غير مدعوم في هذا المتصفح');
      reject(new Error('TTS غير مدعوم في هذا المتصفح'));
      return;
    }

    // إلغاء أي صوت قيد التشغيل
    window.speechSynthesis.cancel();

    const setVoiceAndSpeak = () => {
      const utterance = new SpeechSynthesisUtterance(text);
      
      // إعدادات الصوت
      utterance.lang = lang;
      utterance.rate = options.rate || 0.8;  // سرعة متوسطة
      utterance.pitch = options.pitch || 0.7; // نبرة منخفضة (رجل)
      utterance.volume = options.volume || 1; // مستوى الصوت كامل

      const voices = window.speechSynthesis.getVoices();
      console.log('[SpeechUtils] Available voices:', voices.map(v => ({ name: v.name, lang: v.lang })));

      // ✅ محاولة إيجاد أي صوت عربي ذكوري
      const maleVoice = voices.find(voice => {
        const isArabic = voice.lang.startsWith('ar');
        const isMale = 
          voice.name.toLowerCase().includes('male') ||
          voice.name.toLowerCase().includes('majed') ||
          voice.name.toLowerCase().includes('naayf') ||
          voice.name.toLowerCase().includes('tarik') ||
          voice.name.toLowerCase().includes('hamed') ||
          voice.name.toLowerCase().includes('omar') ||
          voice.name.includes('مذكر');
        
        return isArabic && isMale;
      });

      if (maleVoice) {
        console.log('[SpeechUtils] ✅ Found male Arabic voice:', maleVoice.name);
        utterance.voice = maleVoice;
      } else {
        // ✅ محاولة الحصول على أفضل صوت عربي متاح (حتى لو أنثى)
        const anyArabicVoice = voices.find(voice => voice.lang.startsWith('ar'));
        if (anyArabicVoice) {
          console.log('[SpeechUtils] ⚠️ No male voice found, using:', anyArabicVoice.name);
          utterance.voice = anyArabicVoice;
          // ✅ تقليل pitch للصوت الأنثوي ليبدو أقرب للذكوري
          utterance.pitch = 0.5;
        } else {
          console.warn('[SpeechUtils] ❌ No Arabic voices available');
        }
      }

      // معالجة الأحداث
      utterance.onend = () => {
        console.log('[SpeechUtils] Speech completed');
        resolve();
      };

      utterance.onerror = (event) => {
        console.error('[SpeechUtils] TTS Error:', event.error);
        reject(event);
      };

      // تشغيل الصوت
      window.speechSynthesis.speak(utterance);
    };

    // ⚡ إصلاح مشكلة الموبايل - الانتظار حتى تحميل الأصوات
    const voices = window.speechSynthesis.getVoices();
    if (voices.length === 0) {
      console.log('[SpeechUtils] Waiting for voices to load...');
      // إضافة timeout للموبايل
      let voicesLoaded = false;
      const timeout = setTimeout(() => {
        if (!voicesLoaded) {
          console.warn('[SpeechUtils] Timeout waiting for voices, proceeding anyway');
          setVoiceAndSpeak();
        }
      }, 1000);

      window.speechSynthesis.addEventListener('voiceschanged', () => {
        voicesLoaded = true;
        clearTimeout(timeout);
        setVoiceAndSpeak();
      }, { once: true });
    } else {
      setVoiceAndSpeak();
    }
  });
};

/**
 * إيقاف الصوت الحالي
 */
export const stopSpeaking = () => {
  if ('speechSynthesis' in window) {
    window.speechSynthesis.cancel();
  }
};

/**
 * الحصول على قائمة الأصوات العربية المتاحة
 * @returns {Array} قائمة الأصوات العربية
 */
export const getArabicVoices = () => {
  if (!('speechSynthesis' in window)) return [];
  
  const voices = window.speechSynthesis.getVoices();
  return voices.filter(voice => voice.lang.startsWith('ar'));
};

/**
 * فحص توفر صوت رجل عربي
 * @returns {boolean}
 */
export const hasMaleArabicVoice = () => {
  const arabicVoices = getArabicVoices();
  return arabicVoices.some(voice => 
    voice.name.toLowerCase().includes('male') ||
    voice.name.includes('مذكر') ||
    voice.name.includes('Majed') ||
    voice.name.includes('Naayf')
  );
};

/**
 * إزالة التشكيل من النص العربي
 * @param {string} text - النص العربي
 * @returns {string} النص بدون تشكيل
 */
export const removeHarakat = (text) => {
  if (!text) return '';
  return text.replace(/[\u064B-\u0652\u0670]/g, '');
};

/**
 * نطق كلمة من الآية (حل مشكلة: لم يتم العثور على الكلمة)
 * @param {string} word - الكلمة المراد نطقها
 * @param {string} ayahText - نص الآية
 * @returns {Promise}
 */
export const speakWordFromAyah = (word, ayahText) => {
  if (!word) {
    return Promise.reject(new Error('الكلمة غير موجودة'));
  }

  // إذا لم يكن هناك نص آية، انطق الكلمة مباشرة
  if (!ayahText) {
    console.log('[SpeechUtils] No ayah text, speaking word directly:', word);
    return speakText(word);
  }

  // إزالة التشكيل للبحث
  const cleanWord = removeHarakat(word);
  const cleanAyah = removeHarakat(ayahText);

  console.log('[SpeechUtils] Searching for word:', cleanWord, 'in ayah:', cleanAyah);

  // البحث عن الكلمة في الآية
  if (cleanAyah.includes(cleanWord)) {
    console.log('[SpeechUtils] ✅ Word found in ayah, speaking word:', word);
    return speakText(word);
  } else {
    // محاولة البحث عن جزء من الكلمة
    const wordParts = cleanWord.split(' ');
    const foundPart = wordParts.find(part => cleanAyah.includes(part));
    
    if (foundPart) {
      console.log('[SpeechUtils] ⚠️ Found partial match, speaking original word:', word);
      return speakText(word);
    } else {
      // إذا لم تجد الكلمة، انطق الكلمة مباشرة (وليس الآية كاملة)
      console.warn('[SpeechUtils] ⚠️ Word not found in ayah, speaking word anyway:', word);
      return speakText(word);
    }
  }
};

/**
 * نطق قائمة الخيارات بالتتابع (حل مشكلة: نطق الخيارات)
 * @param {Array<string>} options - قائمة الخيارات
 * @returns {Promise}
 */
export const speakOptions = async (options) => {
  if (!Array.isArray(options) || options.length === 0) {
    return Promise.reject(new Error('لا توجد خيارات'));
  }

  if (!('speechSynthesis' in window)) {
    return Promise.reject(new Error('TTS غير مدعوم في هذا المتصفح'));
  }

  console.log('[SpeechUtils] Speaking options:', options);

  // نطق الخيارات واحداً تلو الآخر
  for (let i = 0; i < options.length; i++) {
    try {
      await speakText(`الخيار ${i + 1}: ${options[i]}`, 'ar-SA', { rate: 0.9 });
      // توقف قصير بين الخيارات
      await new Promise(resolve => setTimeout(resolve, 300));
    } catch (error) {
      console.error('[SpeechUtils] Error speaking option:', error);
    }
  }
};
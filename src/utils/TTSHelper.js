/**
 * 🎙️ نظام TTS محسّن خصيصاً للموبايل
 * يحل مشكلة: TTS غير مدعوم في هذا المتصفح
 */

// دالة للحصول على الأصوات مع الانتظار
const getVoicesWithRetry = () => {
  return new Promise((resolve) => {
    let voices = window.speechSynthesis.getVoices();
    
    if (voices.length > 0) {
      resolve(voices);
      return;
    }

    // الانتظار لتحميل الأصوات
    let attempts = 0;
    const maxAttempts = 10;
    
    const checkVoices = setInterval(() => {
      voices = window.speechSynthesis.getVoices();
      attempts++;
      
      if (voices.length > 0 || attempts >= maxAttempts) {
        clearInterval(checkVoices);
        resolve(voices);
      }
    }, 100);

    // كذلك الاستماع لحدث voiceschanged
    window.speechSynthesis.addEventListener('voiceschanged', () => {
      clearInterval(checkVoices);
      resolve(window.speechSynthesis.getVoices());
    }, { once: true });
  });
};

/**
 * نطق نص عربي - يعمل على الموبايل والكمبيوتر
 * @param {string} text - النص المراد نطقه
 * @param {object} options - خيارات إضافية
 * @returns {Promise}
 */
export const speakArabicText = async (text, options = {}) => {
  if (!text) {
    return Promise.reject(new Error('لا يوجد نص للنطق'));
  }

  if (!('speechSynthesis' in window)) {
    return Promise.reject(new Error('TTS غير مدعوم في هذا المتصفح'));
  }

  console.log('[TTS] Starting speech for:', text.substring(0, 50));

  // إيقاف أي نطق سابق
  window.speechSynthesis.cancel();

  try {
    // الانتظار لتحميل الأصوات
    const voices = await getVoicesWithRetry();
    console.log('[TTS] Loaded voices:', voices.length);

    const utterance = new SpeechSynthesisUtterance(text);
    
    // إعدادات النطق
    utterance.lang = options.lang || 'ar-SA';
    utterance.rate = options.rate || 0.8;
    utterance.pitch = options.pitch || 0.7;
    utterance.volume = options.volume || 1;

    // البحث عن صوت عربي
    let selectedVoice = null;

    if (voices.length > 0) {
      // البحث عن صوت عربي ذكوري
      selectedVoice = voices.find(voice => 
        voice.lang.startsWith('ar') && (
          voice.name.toLowerCase().includes('male') ||
          voice.name.includes('Majed') ||
          voice.name.includes('Naayf') ||
          voice.name.includes('Tarik')
        )
      );

      // إذا لم يجد، ابحث عن أي صوت عربي
      if (!selectedVoice) {
        selectedVoice = voices.find(voice => voice.lang.startsWith('ar'));
      }

      // إذا لم يجد عربي، استخدم الصوت الافتراضي
      if (!selectedVoice && voices.length > 0) {
        selectedVoice = voices[0];
      }
    }

    if (selectedVoice) {
      utterance.voice = selectedVoice;
      console.log('[TTS] Using voice:', selectedVoice.name);
    } else {
      console.warn('[TTS] No voices found, using browser default');
    }

    // تشغيل النطق مع Promise
    return new Promise((resolve, reject) => {
      utterance.onstart = () => {
        console.log('[TTS] Speech started');
      };

      utterance.onend = () => {
        console.log('[TTS] Speech ended');
        resolve();
      };

      utterance.onerror = (event) => {
        console.error('[TTS] Speech error:', event);
        reject(new Error(`فشل النطق: ${event.error}`));
      };

      // محاولة التشغيل
      try {
        window.speechSynthesis.speak(utterance);
        
        // ⚡ إصلاح مشكلة الموبايل: إعادة المحاولة إذا لم يبدأ
        setTimeout(() => {
          if (!window.speechSynthesis.speaking) {
            console.warn('[TTS] Not speaking, retrying...');
            window.speechSynthesis.cancel();
            window.speechSynthesis.speak(utterance);
          }
        }, 100);
      } catch (error) {
        reject(error);
      }
    });
  } catch (error) {
    console.error('[TTS] Error:', error);
    return Promise.reject(error);
  }
};

/**
 * نطق قائمة من الخيارات
 * @param {Array<string>} options - قائمة الخيارات
 * @returns {Promise}
 */
export const speakOptions = async (options) => {
  if (!Array.isArray(options) || options.length === 0) {
    return Promise.reject(new Error('لا توجد خيارات'));
  }

  console.log('[TTS] Speaking options:', options.length);

  for (let i = 0; i < options.length; i++) {
    try {
      await speakArabicText(`الخيار ${i + 1}: ${options[i]}`, { rate: 0.9 });
      // توقف قصير بين الخيارات
      await new Promise(resolve => setTimeout(resolve, 300));
    } catch (error) {
      console.error('[TTS] Error speaking option', i, error);
    }
  }
};

/**
 * إيقاف النطق
 */
export const stopSpeaking = () => {
  if ('speechSynthesis' in window) {
    window.speechSynthesis.cancel();
  }
};

/**
 * فحص الدعم
 */
export const isTTSSupported = () => {
  return 'speechSynthesis' in window;
};

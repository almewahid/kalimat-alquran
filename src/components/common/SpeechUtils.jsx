
// 🎙️ نظام TTS محسّن - يدعم صوت رجل عربي

/**
 * دالة TTS محسّنة مع أفضل ممارسات لاختيار صوت رجل عربي
 * 
 * @param {string} text - النص المراد قراءته
 * @param {string} lang - لغة النص (افتراضياً: ar-SA)
 * @param {object} options - خيارات إضافية (rate, pitch, volume)
 */
export const speakText = (text, lang = 'ar-SA', options = {}) => {
  if (!('speechSynthesis' in window)) {
    console.warn('[SpeechUtils] Web Speech API غير مدعوم في هذا المتصفح');
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

    // معالجة الأخطاء
    utterance.onerror = (event) => {
      console.error('[SpeechUtils] TTS Error:', event.error);
    };

    // تشغيل الصوت
    window.speechSynthesis.speak(utterance);
  };

  // معالجة حالة عدم تحميل الأصوات بعد
  if (window.speechSynthesis.getVoices().length === 0) {
    console.log('[SpeechUtils] Waiting for voices to load...');
    window.speechSynthesis.onvoiceschanged = setVoiceAndSpeak;
  } else {
    setVoiceAndSpeak();
  }
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

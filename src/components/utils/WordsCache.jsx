/**
 * 💾 Words Caching System
 * يخزن الكلمات المحملة في localStorage لتحسين الأداء
 */

const CACHE_KEY = 'quran_words_cache';
const CACHE_EXPIRY = 24 * 60 * 60 * 1000; // 24 hours

export const WordsCache = {
  /**
   * حفظ الكلمات في Cache
   */
  set: (words) => {
    try {
      const cacheData = {
        words,
        timestamp: Date.now()
      };
      localStorage.setItem(CACHE_KEY, JSON.stringify(cacheData));
    } catch (error) {
      console.error('Error saving words to cache:', error);
    }
  },

  /**
   * جلب الكلمات من Cache
   */
  get: () => {
    try {
      const cached = localStorage.getItem(CACHE_KEY);
      if (!cached) return null;

      const cacheData = JSON.parse(cached);
      const now = Date.now();

      // تحقق من صلاحية Cache
      if (now - cacheData.timestamp > CACHE_EXPIRY) {
        WordsCache.clear();
        return null;
      }

      return cacheData.words;
    } catch (error) {
      console.error('Error reading words from cache:', error);
      return null;
    }
  },

  /**
   * مسح Cache
   */
  clear: () => {
    try {
      localStorage.removeItem(CACHE_KEY);
    } catch (error) {
      console.error('Error clearing cache:', error);
    }
  },

  /**
   * تحديث كلمة واحدة في Cache
   */
  updateWord: (wordId, updatedWord) => {
    try {
      const cached = WordsCache.get();
      if (!cached) return;

      const updatedWords = cached.map(w => 
        w.id === wordId ? { ...w, ...updatedWord } : w
      );

      WordsCache.set(updatedWords);
    } catch (error) {
      console.error('Error updating word in cache:', error);
    }
  }
};
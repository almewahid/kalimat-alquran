
/**
 * تطبيق خوارزمية SM-2 للتكرار المتباعد مع تحسينات الأمان والسجل والعرض المحلي بالعربية
 * وإضافة تذكير ذكي حسب جودة الإجابة
 */
export function updateCardWithSM2(card, quality) {
  const now = new Date();
  let efactor = card.efactor || 2.5;
  let interval = card.interval || 1;
  let repetitions = card.repetitions || 0;

  // ✅ حماية لقيمة quality — لضمان بقائها ضمن النطاق [0,5]
  quality = Math.max(0, Math.min(quality, 5));

  if (quality < 3) {
    repetitions = 0;
    interval = 1;
  } else {
    if (repetitions === 0) {
      interval = 1;
    } else if (repetitions === 1) {
      interval = 6;
    } else {
      interval = Math.round(interval * efactor);
    }
    
    efactor = efactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));
    if (efactor < 1.3) efactor = 1.3;
    
    repetitions += 1;
  }

  const nextReview = new Date(now);
  nextReview.setDate(now.getDate() + interval);

  const days = Math.round((nextReview - now) / (1000 * 60 * 60 * 24));
  const options = { weekday: "long", day: "numeric", month: "long", year: "numeric", hour: "numeric", minute: "2-digit", hour12: true };
  const formattedDate = nextReview.toLocaleDateString("ar-EG", options);

  let message = "";
  if (quality === 5) {
    message = `🕓 مراجعتك القادمة ستكون بعد ${days} ${days === 1 ? "يوم" : "أيام"}، يوم ${formattedDate}`;
  } else if (quality === 3) {
    message = `💪 إن شاء الله المراجعة قريبًا بعد ${days} ${days === 1 ? "يوم" : "أيام"}، يوم ${formattedDate}`;
  } else if (quality <= 2) {
    message = `🔁 لا تقلق، ستراجعها غدًا إن شاء الله لتثبيتها بإذن الله ❤️ (يوم ${formattedDate})`;
  }

  const totalReviews = (card.total_reviews || 0) + 1;

  return {
    ...card,
    efactor: Math.round(efactor * 100) / 100,
    interval,
    repetitions,
    next_review: nextReview.toISOString(),
    next_review_message: message,
    last_review: now.toISOString(),
    is_new: false,
    last_quality: quality,
    total_reviews: totalReviews
  };
}

/**
 * ✅ تحديد البطاقات المستحقة للمراجعة اليوم
 * إصلاح: جعلها أكثر مرونة لتشمل الكلمات المستحقة
 */
export function getDueCards(flashcards) {
  const now = new Date();
  console.log('[SRS] 🔍 فحص FlashCards المستحقة...');
  console.log('[SRS] 📅 الوقت الحالي:', now.toISOString());
  console.log('[SRS] 🃏 عدد FlashCards الإجمالي:', flashcards.length);
  
  const dueCards = flashcards.filter((card) => {
    // الكلمات الجديدة دائماً مستحقة
    if (card.is_new) {
      return true;
    }
    
    // التحقق من تاريخ المراجعة القادمة
    if (!card.next_review) {
      return true; // إذا لم يكن هناك تاريخ، فهي مستحقة
    }
    
    const nextReviewDate = new Date(card.next_review);
    const isDue = nextReviewDate <= now;
    
    return isDue;
  });
  
  console.log('[SRS] 📊 عدد الكلمات المستحقة:', dueCards.length);
  return dueCards;
}

/**
 * ترتيب البطاقات حسب الأولوية (الأقدم أولاً ثم الأصعب)
 */
export function prioritizeCards(cards) {
  return [...cards].sort((a, b) => {
    const diff = new Date(a.next_review) - new Date(b.next_review);
    return diff !== 0 ? diff : a.efactor - b.efactor;
  });
}

/**
 * ✅ تنسيق التاريخ باللغة العربية المحلية
 */
export function formatDateArabic(date) {
  const d = new Date(date);
  return d.toLocaleString("ar-EG", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

/**
 * ✅ إنشاء نص تذكير ذكي بالعربية للمراجعة القادمة حسب جودة الإجابة
 */
export function getNextReviewMessage(nextReviewDate, interval, quality) {
  const d = new Date(nextReviewDate);
  const formattedDate = formatDateArabic(d);

  let dayText;
  if (interval === 0) {
    dayText = "اليوم";
  } else if (interval === 1) {
    dayText = "غدًا";
  } else {
    dayText = `بعد ${interval} ${interval === 2 ? "يومين" : "أيام"}`;
  }

  if (quality <= 2) {
    return `🔁 لا تقلق، ستراجعها ${dayText} إن شاء الله لتثبيتها بإذن الله ❤️ (يوم ${formattedDate})`;
  } else if (quality === 3) {
    return `💪 إن شاء الله المراجعة قريبًا ${dayText}، يوم ${formattedDate}`;
  } else {
    return `🕓 مراجعتك القادمة ستكون ${dayText}، يوم ${formattedDate}`;
  }
}

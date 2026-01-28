import React from "react";
import { base44 } from "@/api/base44Client";

/**
 * 🌍 نظام تعدد اللغات (Multi-Language System)
 * يدعم العربية والإنجليزية بشكل كامل
 */

export const LANGUAGES = {
  ar: {
    code: 'ar',
    name: 'العربية',
    dir: 'rtl',
    flag: '🇸🇦'
  },
  en: {
    code: 'en',
    name: 'English',
    dir: 'ltr',
    flag: '🇺🇸'
  }
};

export const translations = {
  ar: {
    // Navigation
    nav: {
      dashboard: "الرئيسية",
      learn: "التعلم",
      quiz: "الاختبار",
      search: "البحث",
      quran: "القرآن الكريم",
      favorites: "مفضلتي",
      groups: "المجموعات",
      friends: "الأصدقاء",
      leaderboard: "لوحة الترتيب",
      achievements: "الإنجازات",
      shop: "المتجر",
      learningPaths: "المسارات التعليمية",
      dailyChallenges: "التحديات اليومية",
      notifications: "الإشعارات",
      progress: "التقدم",
      weeklyReports: "التقارير الأسبوعية",
      help: "المساعدة",
      settings: "الإعدادات"
    },
    
    // Dashboard
    dashboard: {
      welcome: "أهلاً وسهلاً",
      continueJourney: "لنواصل رحلة تعلم كلمات القرآن الكريم",
      level: "المستوى",
      totalXP: "إجمالي النقاط",
      nextLevel: "التقدم للمستوى التالي",
      pointsRemaining: "نقطة متبقية",
      wordsLearned: "الكلمات المتعلمة",
      consecutiveDays: "أيام متتالية",
      successStreak: "سلسلة النجاح",
      quizzesCompleted: "الاختبارات المكتملة",
      recentWords: "آخر الكلمات المتعلمة",
      quickActions: "ماذا تريد أن تفعل؟",
      startLearning: "ابدأ التعلم",
      testYourself: "اختبر نفسك",
      trackProgress: "تابع تقدمك"
    },
    
    // Learning
    learning: {
      newWords: "كلمات جديدة",
      review: "المراجعة",
      word: "الكلمة",
      meaning: "المعنى",
      surah: "السورة",
      ayah: "الآية",
      category: "التصنيف",
      difficulty: "الصعوبة",
      example: "مثال",
      reflection: "تأمل",
      markAsLearned: "أتقنت الكلمة",
      addToFavorites: "أضف للمفضلة",
      hear: "استمع",
      next: "التالي",
      previous: "السابق"
    },
    
    // Quiz
    quiz: {
      selectType: "اختر نوع الاختبار",
      normalQuiz: "اختبار عادي",
      speedQuiz: "اختبار سريع",
      difficultyLevel: "مستوى الصعوبة",
      beginner: "مبتدئ",
      intermediate: "متوسط",
      advanced: "متقدم",
      questionsCount: "عدد الأسئلة",
      startQuiz: "ابدأ الاختبار",
      question: "سؤال",
      of: "من",
      submit: "إرسال",
      nextQuestion: "السؤال التالي",
      results: "النتائج",
      score: "النتيجة",
      correct: "صحيح",
      wrong: "خطأ",
      xpEarned: "نقاط مكتسبة",
      tryAgain: "حاول مرة أخرى",
      backToDashboard: "العودة للرئيسية"
    },
    
    // Settings
    settings: {
      account: "الحساب",
      appearance: "المظهر",
      learning: "التعلم",
      notifications: "الإشعارات",
      privacy: "الخصوصية",
      language: "اللغة",
      theme: "الوضع الليلي",
      colorScheme: "نظام الألوان",
      dailyGoal: "الهدف اليومي",
      saveChanges: "حفظ التغييرات"
    },
    
    // Common
    common: {
      loading: "جارٍ التحميل...",
      save: "حفظ",
      cancel: "إلغاء",
      delete: "حذف",
      edit: "تعديل",
      add: "إضافة",
      search: "بحث",
      filter: "تصفية",
      all: "الكل",
      today: "اليوم",
      week: "الأسبوع",
      month: "الشهر",
      year: "السنة",
      yes: "نعم",
      no: "لا",
      ok: "حسناً",
      error: "خطأ",
      success: "نجح",
      warning: "تحذير",
      info: "معلومة"
    }
  },
  
  en: {
    // Navigation
    nav: {
      dashboard: "Dashboard",
      learn: "Learn",
      quiz: "Quiz",
      search: "Search",
      quran: "Quran",
      favorites: "Favorites",
      groups: "Groups",
      friends: "Friends",
      leaderboard: "Leaderboard",
      achievements: "Achievements",
      shop: "Shop",
      learningPaths: "Learning Paths",
      dailyChallenges: "Daily Challenges",
      notifications: "Notifications",
      progress: "Progress",
      weeklyReports: "Weekly Reports",
      help: "Help",
      settings: "Settings"
    },
    
    // Dashboard
    dashboard: {
      welcome: "Welcome",
      continueJourney: "Let's continue learning Quranic words",
      level: "Level",
      totalXP: "Total XP",
      nextLevel: "Progress to next level",
      pointsRemaining: "points remaining",
      wordsLearned: "Words Learned",
      consecutiveDays: "Consecutive Days",
      successStreak: "Success Streak",
      quizzesCompleted: "Quizzes Completed",
      recentWords: "Recently Learned Words",
      quickActions: "What would you like to do?",
      startLearning: "Start Learning",
      testYourself: "Test Yourself",
      trackProgress: "Track Progress"
    },
    
    // Learning
    learning: {
      newWords: "New Words",
      review: "Review",
      word: "Word",
      meaning: "Meaning",
      surah: "Surah",
      ayah: "Ayah",
      category: "Category",
      difficulty: "Difficulty",
      example: "Example",
      reflection: "Reflection",
      markAsLearned: "Mark as Learned",
      addToFavorites: "Add to Favorites",
      hear: "Listen",
      next: "Next",
      previous: "Previous"
    },
    
    // Quiz
    quiz: {
      selectType: "Select Quiz Type",
      normalQuiz: "Normal Quiz",
      speedQuiz: "Speed Quiz",
      difficultyLevel: "Difficulty Level",
      beginner: "Beginner",
      intermediate: "Intermediate",
      advanced: "Advanced",
      questionsCount: "Number of Questions",
      startQuiz: "Start Quiz",
      question: "Question",
      of: "of",
      submit: "Submit",
      nextQuestion: "Next Question",
      results: "Results",
      score: "Score",
      correct: "Correct",
      wrong: "Wrong",
      xpEarned: "XP Earned",
      tryAgain: "Try Again",
      backToDashboard: "Back to Dashboard"
    },
    
    // Settings
    settings: {
      account: "Account",
      appearance: "Appearance",
      learning: "Learning",
      notifications: "Notifications",
      privacy: "Privacy",
      language: "Language",
      theme: "Dark Mode",
      colorScheme: "Color Scheme",
      dailyGoal: "Daily Goal",
      saveChanges: "Save Changes"
    },
    
    // Common
    common: {
      loading: "Loading...",
      save: "Save",
      cancel: "Cancel",
      delete: "Delete",
      edit: "Edit",
      add: "Add",
      search: "Search",
      filter: "Filter",
      all: "All",
      today: "Today",
      week: "Week",
      month: "Month",
      year: "Year",
      yes: "Yes",
      no: "No",
      ok: "OK",
      error: "Error",
      success: "Success",
      warning: "Warning",
      info: "Info"
    }
  }
};

/**
 * Hook للحصول على الترجمات
 */
export const useTranslation = () => {
  const [language, setLanguage] = React.useState('ar');
  
  React.useEffect(() => {
    const loadLanguage = async () => {
      try {
        const user = await base44.auth.me();
        const userLang = user?.preferences?.language || 'ar';
        setLanguage(userLang);
        document.documentElement.lang = userLang;
        document.documentElement.dir = LANGUAGES[userLang].dir;
      } catch (error) {
        console.error("Error loading language:", error);
      }
    };
    loadLanguage();
  }, []);
  
  const t = (key) => {
    const keys = key.split('.');
    let value = translations[language];
    
    for (const k of keys) {
      value = value?.[k];
      if (!value) break;
    }
    
    return value || key;
  };
  
  const changeLanguage = async (newLang) => {
    setLanguage(newLang);
    document.documentElement.lang = newLang;
    document.documentElement.dir = LANGUAGES[newLang].dir;
    
    try {
      const user = await base44.auth.me();
      await base44.auth.updateMe({
        preferences: {
          ...user.preferences,
          language: newLang
        }
      });
    } catch (error) {
      console.error("Error saving language:", error);
    }
  };
  
  return { t, language, changeLanguage, languages: LANGUAGES };
};
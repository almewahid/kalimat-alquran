
import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  BookOpen, Trophy, ShoppingBag, Map, Calendar, Users, Bell,
  Settings, Heart, Sparkles, Target, HelpCircle, CheckCircle2,
  Activity, Volume2, Bug // Added Volume2 and Bug
} from "lucide-react";
import { motion } from "framer-motion";

export default function Help() {
  const [activeSection, setActiveSection] = useState("overview");

  const pages = [
    {
      name: "الرئيسية",
      path: "Dashboard",
      icon: "🏠",
      when: "عند تسجيل الدخول",
      for: "الجميع",
      description: "بطاقة المستوى، الإحصائيات، الكلمات الأخيرة، أزرار سريعة"
    },
    {
      name: "التعلم",
      path: "Learn",
      icon: "📚",
      when: "دائماً",
      for: "الجميع",
      description: "تعلم كلمات جديدة، نظام المراجعة الذكي SRS، بطاقات تفاعلية"
    },
    {
      name: "الاختبار",
      path: "Quiz",
      icon: "🧠",
      when: "دائماً",
      for: "الجميع",
      description: "اختبارات متنوعة، نظام القلوب (5 قلوب)، مكافآت XP"
    },
    {
      name: "الإنجازات",
      path: "Achievements",
      icon: "🏆",
      when: "دائماً",
      for: "الجميع",
      description: "السلسلة اليومية، إنجازات الكلمات، خبير الاختبارات، شارات نادرة"
    },
    {
      name: "المتجر",
      path: "Shop",
      icon: "🛍️",
      when: "دائماً",
      for: "الجميع",
      description: "ثيمات، خلفيات، إطارات، قوى خاصة - كلها بالجواهر المكتسبة"
    },
    {
      name: "المسارات التعليمية",
      path: "LearningPaths",
      icon: "🗺️",
      when: "دائماً",
      for: "الجميع",
      description: "خطط منظمة: 30 يوم لجزء عم، 3 أشهر للمتقدم، 7 أيام للأساسيات"
    },
    {
      name: "التحديات اليومية",
      path: "DailyChallenges",
      icon: "📅",
      when: "تتجدد كل 24 ساعة",
      for: "الجميع",
      description: "3 تحديات يومية: تعلم 10 كلمات، اجتاز اختبار 90%، استمر بالسلسلة"
    },
    {
      name: "الأصدقاء",
      path: "Friends",
      icon: "👥",
      when: "دائماً",
      for: "الجميع",
      description: "إضافة أصدقاء، طلبات صداقة، متابعة التقدم، المنافسة"
    },
    {
      name: "الإشعارات",
      path: "Notifications",
      icon: "🔔",
      when: "دائماً",
      for: "الجميع",
      description: "تذكيرات المراجعة، تحذيرات السلسلة، إنجازات، طلبات صداقة"
    },
    {
      name: "المجموعات",
      path: "Groups",
      icon: "👥",
      when: "دائماً",
      for: "الجميع",
      description: "إنشاء مجموعات، الانضمام بالكود، تحديات جماعية"
    },
    {
      name: "لوحة الترتيب",
      path: "Leaderboard",
      icon: "🏆",
      when: "دائماً",
      for: "الجميع",
      description: "ترتيب حسب النقاط، الكلمات، الأيام المتتالية - أعلى 100 مستخدم"
    },
    {
      name: "التقدم",
      path: "Progress",
      icon: "📊",
      when: "دائماً",
      for: "الجميع",
      description: "رسم بياني أسبوعي، إحصائيات تفصيلية، آخر الاختبارات"
    },
    {
      name: "الإعدادات",
      path: "Settings",
      icon: "⚙️",
      when: "دائماً",
      for: "الجميع",
      description: "المظهر، الثيمات، الألوان، الخلفيات، الأهداف اليومية، مصدر الكلمات"
    },
    {
      name: "البحث",
      path: "Search",
      icon: "🔍",
      when: "دائماً",
      for: "الجميع",
      description: "البحث في الكلمات بالعربية أو الترجمة"
    },
    {
      name: "المفضلة",
      path: "Favorites",
      icon: "❤️",
      when: "دائماً",
      for: "الجميع",
      description: "الكلمات المحفوظة في المفضلة"
    },
    {
      name: "القرآن الكريم",
      path: "QuranReader",
      icon: "📖",
      when: "دائماً",
      for: "الجميع",
      description: "قراءة القرآن بالتفسير والترجمة"
    }
  ];

  const systems = [
    {
      name: "نظام النقاط (XP)",
      icon: "⭐",
      details: [
        "كل كلمة متعلمة = 10 XP",
        "كل اختبار ناجح = 20-50 XP",
        "كل تحدي مكتمل = 30-75 XP",
        "كل 100 XP = مستوى جديد"
      ]
    },
    {
      name: "نظام الجواهر (Gems)",
      icon: "💎",
      earned: [
        "إكمال الإنجازات",
        "التحديات اليومية",
        "النتائج المثالية",
        "الأيام المتتالية",
        "تحديات المجموعات"
      ],
      used: [
        "شراء الثيمات (80-150 جوهرة)",
        "شراء الخلفيات (40-60 جوهرة)",
        "شراء الإطارات (100-200 جوهرة)",
        "القوى الخاصة (50-100 جوهرة)"
      ]
    },
    {
      name: "نظام القلوب (Hearts)",
      icon: "❤️",
      details: [
        "5 قلوب في كل اختبار",
        "خسارة قلب مع كل خطأ",
        "استعادة قلب واحد بالتسبيح",
        "شراء إعادة القلوب من المتجر"
      ]
    },
    {
      name: "نظام المراجعة الذكي (SRS)",
      icon: "🔄",
      details: [
        "يعتمد على خوارزمية SM-2",
        "يحدد موعد المراجعة التالي",
        "يتكيف مع أدائك",
        "مراجعة الكلمات قبل نسيانها"
      ]
    }
  ];

  const levels = [
    {
      name: "مبتدئ (وضع الأطفال)",
      icon: "👶",
      color: "bg-green-100 text-green-700",
      features: [
        "كلمات بسيطة وسهلة",
        "واجهة ملونة ومرحة",
        "مكافآت بصرية",
        "بدون الجذور والتحليل اللغوي",
        "مناسب للأطفال من 3-7 سنوات"
      ]
    },
    {
      name: "متوسط",
      icon: "📚",
      color: "bg-yellow-100 text-yellow-700",
      features: [
        "كلمات متوسطة الصعوبة",
        "سياق أوسع للكلمات",
        "تحديات أكبر",
        "تحليل لغوي بسيط"
      ]
    },
    {
      name: "متقدم",
      icon: "🎓",
      color: "bg-red-100 text-red-700",
      features: [
        "كلمات معقدة ونادرة",
        "الجذور والمشتقات (فقط للمتقدم)",
        "تحليل لغوي عميق",
        "سياق تاريخي ولغوي",
        "تحديات صعبة"
      ]
    }
  ];

  const achievements = [
    { type: "daily_streak", name: "السلسلة اليومية", icon: "🔥", examples: ["3 أيام", "7 أيام", "30 يوم", "100 يوم"] },
    { type: "words_milestone", name: "إنجازات الكلمات", icon: "📚", examples: ["50 كلمة", "100 كلمة", "500 كلمة", "1000 كلمة"] },
    { type: "quiz_master", name: "خبير الاختبارات", icon: "🧠", examples: ["10 اختبارات", "50 اختبار", "100 اختبار"] },
    { type: "speed_learner", name: "التعلم السريع", icon: "⚡", examples: ["10 كلمات في يوم", "20 كلمة في يوم"] },
    { type: "perfect_score", name: "النتيجة المثالية", icon: "⭐", examples: ["100% في 5 اختبارات", "100% في 20 اختبار"] },
    { type: "surah_complete", name: "إتمام السور", icon: "📖", examples: ["سورة الفاتحة", "جزء عم"] },
    { type: "group_leader", name: "قائد المجموعات", icon: "👑", examples: ["إنشاء 3 مجموعات", "إنشاء 10 مجموعات"] },
    { type: "challenger", name: "المتحدي", icon: "🎯", examples: ["10 تحديات", "50 تحدي"] }
  ];

  const notifications = [
    { type: "review_reminder", name: "تذكير المراجعة", icon: "📚", color: "text-blue-600" },
    { type: "streak_warning", name: "تحذير السلسلة", icon: "⚠️", color: "text-orange-600" },
    { type: "achievement_earned", name: "إنجاز جديد", icon: "🏆", color: "text-yellow-600" },
    { type: "challenge_invite", name: "دعوة تحدي", icon: "🎯", color: "text-purple-600" },
    { type: "friend_request", name: "طلب صداقة", icon: "👥", color: "text-green-600" },
    { type: "rank_change", name: "تغيير الترتيب", icon: "📊", color: "text-indigo-600" },
    { type: "daily_challenge", name: "تحدي يومي", icon: "📅", color: "text-pink-600" }
  ];

  const completedFeatures = [
    "نظام الإشعارات والتذكيرات",
    "نظام الإنجازات والشارات (10 أنواع)",
    "نظام المكافآت والجواهر",
    "ثيمات متعددة (4 ألوان + 4 خلفيات)",
    "المسارات التعليمية (4 مسارات)",
    "التحديات اليومية (3 تحديات)",
    "ميزات اجتماعية (الأصدقاء)",
    "المتجر (4 أقسام)",
    "نظام المجموعات",
    "لوحة الترتيب",
    "تحسين الإحصائيات",
    "نظام SRS للمراجعة الذكية",
    "واجهة خاصة للأطفال (مبتدئ)"
  ];

  const helpTopics = [
    {
      id: "start-learning",
      icon: HelpCircle,
      title: "❓ كيف أبدأ التعلم؟",
      content: (
        <ol className="list-decimal list-inside space-y-2">
          <li>سجل دخولك للتطبيق</li>
          <li>اذهب إلى صفحة "التعلم" من القائمة الجانبية</li>
          <li>اختر كلمات جديدة للتعلم</li>
          <li>بعد التعلم، اذهب إلى "الاختبار" لاختبار معرفتك</li>
          <li>تابع تقدمك في صفحة "التقدم"</li>
        </ol>
      )
    },
    {
      id: "earn-gems",
      icon: Sparkles,
      title: "💎 كيف أكسب الجواهر؟",
      content: (
        <ul className="space-y-2 text-foreground/80">
          <li className="flex items-start gap-2 justify-end">
            <span>أكمل الإنجازات واحصل على جواهر</span>
            <Trophy className="w-5 h-5 text-yellow-600 mt-0.5" />
          </li>
          <li className="flex items-start gap-2 justify-end">
            <span>شارك في التحديات اليومية</span>
            <Calendar className="w-5 h-5 text-purple-600 mt-0.5" />
          </li>
          <li className="flex items-start gap-2 justify-end">
            <span>أكمل تحديات المجموعات</span>
            <Users className="w-5 h-5 text-green-600 mt-0.5" />
          </li>
          <li className="flex items-start gap-2 justify-end">
            <span>(100%) احصل على نتائج مثالية</span>
            <Target className="w-5 h-5 text-blue-600 mt-0.5" />
          </li>
          <li className="flex items-start gap-2 justify-end">
            <span>حافظ على سلسلتك اليومية</span>
            <Activity className="w-5 h-5 text-orange-600 mt-0.5" />
          </li>
        </ul>
      )
    },
    {
      id: "no-hearts",
      icon: Heart,
      title: "❤️ ماذا أفعل عند نفاذ القلوب؟",
      content: (
        <ul className="space-y-2">
          <li>استخدم نافذة التسبيح لاسترجاع قلب واحد •</li>
          <li>(50 جوهرة) اشترِ "إعادة القلوب" من المتجر •</li>
          <li>انتظر حتى اليوم التالي لاستعادة القلوب تلقائياً •</li>
        </ul>
      )
    },
    {
      id: "add-friends",
      icon: Users,
      title: "👥 كيف أضيف أصدقاء؟",
      content: (
        <ol className="list-decimal list-inside space-y-2">
          <li>اذهب إلى صفحة "الأصدقاء"</li>
          <li>أدخل البريد الإلكتروني للصديق</li>
          <li>اضغط "إرسال طلب"</li>
          <li>انتظر حتى يقبل صديقك الطلب</li>
        </ol>
      )
    },
    {
      id: "learning-paths",
      icon: Map,
      title: "🗺️ ما هي المسارات التعليمية؟",
      content: (
        <>
          <p className="mb-3">
            المسارات التعليمية هي خطط منظمة تساعدك على تحقيق أهداف محددة في فترة زمنية معينة.
          </p>
          <p className="font-medium mb-2">:المسارات المتاحة</p>
          <ul className="space-y-1">
            <li>(مبتدئ) 30 يوم لحفظ جزء عم •</li>
            <li>(متقدم) 3 أشهر للمستوى المتقدم •</li>
            <li>(مبتدئ) أساسيات القرآن - 7 أيام •</li>
            <li>(متوسط) رحلة الحفظ - 60 يوم •</li>
          </ul>
        </>
      )
    },
    {
      id: "achievements-vs-challenges",
      icon: Trophy,
      title: "🏆 ما الفرق بين الإنجازات والتحديات؟",
      content: (
        <div className="space-y-3">
          <div>
            <strong className="text-primary">:الإنجازات</strong>
            <p>(مثل: حفظ 100 كلمة، 30 يوم متتالي) أهداف طويلة المدى تُحقق تلقائياً بمرور الوقت</p>
          </div>
          <div>
            <strong className="text-primary">:التحديات اليومية</strong>
            <p>(مثل: تعلم 10 كلمات اليوم) أهداف قصيرة المدى تتجدد كل 24 ساعة</p>
          </div>
          <div>
            <strong className="text-primary">:تحديات المجموعات</strong>
            <p>تحديات خاصة ينشئها رئيس المجموعة لأعضائها</p>
          </div>
        </div>
      )
    },
    {
      id: "common-issues",
      icon: Bug,
      title: "🐛 حل المشاكل الشائعة",
      content: (
        <div className="space-y-4 text-foreground/80">
          <div>
            <strong className="text-red-600">الصفحة لا تظهر؟</strong>
            <ul className="mt-1 space-y-1 text-sm">
              <li>تأكد من تسجيل الدخول •</li>
              <li>(F5) حدّث الصفحة •</li>
              <li>(Ctrl+Shift+Delete) امسح الكاش •</li>
            </ul>
          </div>
          <div>
            <strong className="text-red-600">الإشعارات لا تصل؟</strong>
            <ul className="mt-1 space-y-1 text-sm">
              <li>تحقق من صفحة الإشعارات مباشرة •</li>
              <li>تأكد من إعدادات المتصفح •</li>
            </ul>
          </div>
          <div>
            <strong className="text-red-600">لا أرى تقدمي؟</strong>
            <ul className="mt-1 space-y-1 text-sm">
              <li>اذهب إلى صفحة "التقدم" •</li>
              <li>تأكد من إكمال اختبار واحد على الأقل •</li>
              <li>حدّث الصفحة •</li>
            </ul>
          </div>
        </div>
      )
    },
    {
      id: "tts-voice",
      icon: Volume2,
      title: "🎙️ تحسين صوت النطق (TTS)",
      description: "كيفية الحصول على صوت رجل عربي أفضل",
      content: (
        <div className="space-y-4">
          <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
            <h4 className="font-semibold text-blue-800 dark:text-blue-300 mb-2">💡 الطريقة الحالية (مجاني)</h4>
            <p className="text-sm text-blue-700 dark:text-blue-400 mb-2">
              التطبيق يستخدم Web Speech API المدمج في المتصفح. الأصوات المتاحة تعتمد على:
            </p>
            <ul className="list-disc list-inside text-sm text-blue-700 dark:text-blue-400 space-y-1">
              <li>نظام التشغيل (Windows/Mac/Android/iOS)</li>
              <li>المتصفح (Chrome/Safari/Firefox)</li>
              <li>الأصوات المثبتة على جهازك</li>
            </ul>
          </div>

          <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg border border-green-200 dark:border-green-800">
            <h4 className="font-semibold text-green-800 dark:text-green-300 mb-2">✅ نصائح لتحسين الصوت:</h4>
            <ul className="list-decimal list-inside text-sm text-green-700 dark:text-green-400 space-y-2">
              <li><strong>Chrome على Windows:</strong> اذهب إلى Settings → Languages → Add "Arabic" → Text-to-speech → اختر "Microsoft Naayf" (صوت رجل سعودي)</li>
              <li><strong>Chrome على Mac:</strong> System Preferences → Accessibility → Spoken Content → اختر صوت "Tarik" أو "Maged"</li>
              <li><strong>Safari على Mac/iPhone:</strong> يأتي مع أصوات عربية ممتازة افتراضياً</li>
              <li><strong>Android:</strong> Settings → Accessibility → Text-to-speech → Install "Arabic voices"</li>
            </ul>
          </div>

          <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg border border-purple-200 dark:border-purple-800">
            <h4 className="font-semibold text-purple-800 dark:text-purple-300 mb-2">🚀 الحل الاحترافي (مدفوع)</h4>
            <p className="text-sm text-purple-700 dark:text-purple-400 mb-3">
              للحصول على صوت رجل عربي عالي الجودة، يمكن استخدام خدمات TTS المتقدمة:
            </p>
            <div className="space-y-3">
              <div className="bg-white dark:bg-gray-800 p-3 rounded border">
                <h5 className="font-bold text-sm mb-1">Google Cloud Text-to-Speech ⭐ (الأفضل)</h5>
                <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">
                  • أصوات عربية احترافية (Wavenet)<br/>
                  • السعر: ~$4 لكل مليون حرف<br/>
                  • التجربة المجانية: 1 مليون حرف/شهر
                </p>
                <a href="https://cloud.google.com/text-to-speech" target="_blank" rel="noopener noreferrer" className="text-blue-600 text-xs underline">
                  cloud.google.com/text-to-speech →
                </a>
              </div>

              <div className="bg-white dark:bg-gray-800 p-3 rounded border">
                <h5 className="font-bold text-sm mb-1">Microsoft Azure Speech</h5>
                <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">
                  • أصوات عربية متعددة (خليجي، مصري، شامي)<br/>
                  • السعر: ~$4 لكل مليون حرف<br/>
                  • التجربة المجانية: 5 ساعات صوت/شهر
                </p>
                <a href="https://azure.microsoft.com/services/cognitive-services/text-to-speech" target="_blank" rel="noopener noreferrer" className="text-blue-600 text-xs underline">
                  azure.microsoft.com/speech →
                </a>
              </div>

              <div className="bg-white dark:bg-gray-800 p-3 rounded border">
                <h5 className="font-bold text-sm mb-1">ElevenLabs 🎯 (AI متقدم)</h5>
                <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">
                  • أحدث تقنية AI - صوت طبيعي جداً<br/>
                  • يدعم العربية بجودة عالية<br/>
                  • السعر: من $5/شهر
                </p>
                <a href="https://elevenlabs.io" target="_blank" rel="noopener noreferrer" className="text-blue-600 text-xs underline">
                  elevenlabs.io →
                </a>
              </div>
            </div>
          </div>

          <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg border border-yellow-200 dark:border-yellow-800">
            <h4 className="font-semibold text-yellow-800 dark:text-yellow-300 mb-2">⚙️ كيفية التطبيق (للمطورين)</h4>
            <p className="text-sm text-yellow-700 dark:text-yellow-400 mb-2">
              إذا أردت استخدام Google Cloud TTS:
            </p>
            <pre className="bg-gray-900 text-green-400 p-3 rounded text-xs overflow-x-auto">
{`// 1. إنشاء API Key من Google Cloud Console
// 2. إنشاء Backend Function في pages/functions/
import { TextToSpeechClient } from '@google-cloud/text-to-speech';

export default async (req) => {
  const { text } = await req.json();
  const client = new TextToSpeechClient({
    apiKey: Deno.env.get('GOOGLE_TTS_API_KEY')
  });
  
  const [response] = await client.synthesizeSpeech({
    input: { text },
    voice: {
      languageCode: 'ar-SA',
      name: 'ar-SA-Wavenet-A', // صوت رجل
    },
    audioConfig: { audioEncoding: 'MP3' },
  });
  
  return new Response(response.audioContent, {
    headers: { 'Content-Type': 'audio/mp3' }
  });
}`}
            </pre>
          </div>
        </div>
      )
    }
  ];

  return (
    <div className="p-6 max-w-7xl mx-auto" dir="rtl">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold gradient-text mb-2">📚 دليل الاستخدام</h1>
          <p className="text-foreground/70 text-right">كل ما تحتاج معرفته عن تطبيق كلمات القرآن</p>
        </div>

        <Tabs value={activeSection} onValueChange={setActiveSection} className="w-full" dir="rtl">
          <TabsList className="grid w-full grid-cols-2 md:grid-cols-5 mb-8">
            <TabsTrigger value="overview" className="gap-2">
              <HelpCircle className="w-4 h-4" />
              <span>نظرة عامة</span>
            </TabsTrigger>
            <TabsTrigger value="pages" className="gap-2">
              <BookOpen className="w-4 h-4" />
              <span>الصفحات</span>
            </TabsTrigger>
            <TabsTrigger value="systems" className="gap-2">
              <Target className="w-4 h-4" />
              <span>الأنظمة</span>
            </TabsTrigger>
            <TabsTrigger value="features" className="gap-2">
              <CheckCircle2 className="w-4 h-4" />
              <span>الميزات</span>
            </TabsTrigger>
            <TabsTrigger value="faq" className="gap-2">
              <Activity className="w-4 h-4" />
              <span>أسئلة شائعة</span>
            </TabsTrigger>
          </TabsList>

          {/* نظرة عامة */}
          <TabsContent value="overview" dir="rtl">
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-right">
                    <Sparkles className="w-6 h-6 text-primary" />
                    <span>ما هو تطبيق كلمات القرآن؟</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-right">
                  <p className="text-foreground/80 mb-4">
                    تطبيق تعليمي تفاعلي لتعلم معاني كلمات القرآن الكريم باستخدام أنظمة التعلم الحديثة والتحفيز.
                  </p>
                  <div className="grid md:grid-cols-3 gap-4 mt-6">
                    <div className="p-4 bg-primary/5 rounded-lg text-right">
                      <div className="text-3xl mb-2 text-center">📚</div>
                      <h4 className="font-bold mb-1">تعلم ذكي</h4>
                      <p className="text-sm text-foreground/70">نظام SRS للمراجعة المتباعدة</p>
                    </div>
                    <div className="p-4 bg-primary/5 rounded-lg text-right">
                      <div className="text-3xl mb-2 text-center">🎮</div>
                      <h4 className="font-bold mb-1">تحفيز مستمر</h4>
                      <p className="text-sm text-foreground/70">إنجازات، جواهر، تحديات</p>
                    </div>
                    <div className="p-4 bg-primary/5 rounded-lg text-right">
                      <div className="text-3xl mb-2 text-center">👥</div>
                      <h4 className="font-bold mb-1">تعلم اجتماعي</h4>
                      <p className="text-sm text-foreground/70">أصدقاء، مجموعات، منافسة</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-right">المستويات التعليمية</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {levels.map((level) => (
                      <div key={level.name} className="p-4 border rounded-lg text-right">
                        <div className="flex items-center gap-3 mb-3 justify-end">
                          <Badge className={level.color}>{level.name}</Badge>
                          <div className="text-4xl">{level.icon}</div>
                        </div>
                        <ul className="space-y-1">
                          {level.features.map((feature, idx) => (
                            <li key={idx} className="text-sm text-foreground/80 flex items-start gap-2 justify-end text-right">
                              <span>{feature}</span>
                              <span className="text-primary mt-1">•</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* الصفحات */}
          <TabsContent value="pages" dir="rtl">
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {pages.map((page) => (
                <motion.div
                  key={page.path}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="h-full"
                >
                  <Card className="h-full hover:shadow-lg transition-all">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-lg text-right justify-end">
                        <span>{page.name}</span>
                        <span className="text-3xl">{page.icon}</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="text-right">
                      <div className="space-y-2 text-sm">
                        <div className="flex flex-wrap items-center gap-2 justify-end">
                          <Badge variant="outline" className="bg-green-50 text-green-700">
                            {page.for}
                          </Badge>
                          <Badge variant="outline" className="bg-blue-50 text-blue-700">
                            {page.when}
                          </Badge>
                        </div>
                        <p className="text-foreground/70">{page.description}</p>
                        <p className="text-xs text-foreground/50">/{page.path} :المسار</p>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </TabsContent>

          {/* الأنظمة */}
          <TabsContent value="systems" dir="rtl">
            <div className="space-y-6">
              {systems.map((system) => (
                <Card key={system.name}>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-right justify-end">
                      <span>{system.name}</span>
                      <span className="text-3xl">{system.icon}</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="text-right">
                    {system.details && (
                      <ul className="space-y-2">
                        {system.details.map((detail, idx) => (
                          <li key={idx} className="flex items-start gap-2 text-foreground/80 justify-end">
                            <span>{detail}</span>
                            <CheckCircle2 className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                          </li>
                        ))}
                      </ul>
                    )}
                    {system.earned && (
                      <div className="mt-4">
                        <h4 className="font-bold mb-2 text-green-700 text-right">:كيف تكسبها ✅</h4>
                        <ul className="space-y-1 text-right">
                          {system.earned.map((item, idx) => (
                            <li key={idx} className="text-sm text-foreground/80">{item} •</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {system.used && (
                      <div className="mt-4">
                        <h4 className="font-bold mb-2 text-blue-700 text-right">:كيف تستخدمها 🛍️</h4>
                        <ul className="space-y-1 text-right">
                          {system.used.map((item, idx) => (
                            <li key={idx} className="text-sm text-foreground/80">{item} •</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-right justify-end">
                    <span>أنواع الإنجازات</span>
                    <Trophy className="w-6 h-6 text-primary" />
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-2 gap-4">
                    {achievements.map((ach) => (
                      <div key={ach.type} className="p-4 border rounded-lg text-right">
                        <div className="flex items-center gap-2 mb-2 justify-end">
                          <h4 className="font-bold">{ach.name}</h4>
                          <span className="text-2xl">{ach.icon}</span>
                        </div>
                        <div className="text-xs text-foreground/70 text-right">
                          {ach.examples.join(" • ")} :أمثلة
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-right justify-end">
                    <span>أنواع الإشعارات</span>
                    <Bell className="w-6 h-6 text-primary" />
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-2 gap-3">
                    {notifications.map((notif) => (
                      <div key={notif.type} className="flex items-center gap-3 p-3 bg-background-soft rounded-lg justify-end">
                        <span className="font-medium">{notif.name}</span>
                        <span className={`text-2xl ${notif.color}`}>{notif.icon}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* الميزات المنجزة */}
          <TabsContent value="features" dir="rtl">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-right justify-end">
                  <span>(13/19) الميزات المنجزة</span>
                  <CheckCircle2 className="w-6 h-6 text-green-600" />
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-3">
                  {completedFeatures.map((feature, idx) => (
                    <div key={idx} className="flex items-start gap-2 p-3 bg-green-50 rounded-lg text-right justify-end">
                      <span className="text-sm font-medium text-green-800">{feature}</span>
                      <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                    </div>
                  ))}
                </div>

                <Alert className="mt-6 bg-blue-50 border-blue-200">
                  <AlertDescription className="text-blue-800 text-right">
                    <strong>:ملاحظات مهمة</strong>
                    <ul className="mt-2 space-y-1 text-sm text-right">
                      <li>تظهر فقط للمستوى المتقدم :الجذور •</li>
                      <li>هو المستوى المبتدئ مع واجهة مبسطة :وضع الأطفال •</li>
                      <li>لا يمكن شراؤها بمال حقيقي، فقط كسبها :الجواهر •</li>
                      <li>تُستعاد يومياً في الاختبارات :القلوب •</li>
                      <li>يمكن الانضمام لأكثر من مجموعة :المجموعات •</li>
                    </ul>
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>

            <Card className="mt-6">
              <CardHeader>
                <CardTitle className="text-right">خيارات المظهر في الإعدادات</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="text-right">
                    <h4 className="font-bold mb-3 text-primary">(4 خيارات) 🎨 نظام الألوان</h4>
                    <ul className="space-y-2 text-sm">
                      <li className="flex items-center gap-2 justify-end">
                        <span>(افتراضي) زمردي</span>
                        <div className="w-4 h-4 rounded bg-emerald-600"></div>
                      </li>
                      <li className="flex items-center gap-2 justify-end">
                        <span>أزرق سماوي</span>
                        <div className="w-4 h-4 rounded bg-blue-500"></div>
                      </li>
                      <li className="flex items-center gap-2 justify-end">
                        <span>بنفسجي ملكي</span>
                        <div className="w-4 h-4 rounded bg-purple-600"></div>
                      </li>
                      <li className="flex items-center gap-2 justify-end">
                        <span>برتقالي دافئ</span>
                        <div className="w-4 h-4 rounded bg-orange-500"></div>
                      </li>
                    </ul>
                  </div>

                  <div className="text-right">
                    <h4 className="font-bold mb-3 text-primary">(4 خيارات) 🖼️ الخلفيات</h4>
                    <ul className="space-y-2 text-sm">
                      <li>عاجي ناعم •</li>
                      <li>أبيض نقي •</li>
                      <li>كريمي •</li>
                      <li>أزرق فاتح •</li>
                    </ul>
                  </div>

                  <div className="text-right">
                    <h4 className="font-bold mb-3 text-primary">(3 خيارات) 📦 نمط الكروت</h4>
                    <ul className="space-y-2 text-sm">
                      <li>(ألوان فاتحة مريحة) ناعم •</li>
                      <li>(ألوان واضحة محددة) متباين •</li>
                      <li>(تصميم نظيف) بسيط •</li>
                    </ul>
                  </div>

                  <div className="text-right">
                    <h4 className="font-bold mb-3 text-primary">(3 خيارات) 🔘 نمط الأزرار</h4>
                    <ul className="space-y-2 text-sm">
                      <li>(حواف دائرية) دائري •</li>
                      <li>(حواف حادة) حاد •</li>
                      <li>(حواف ناعمة قليلاً) ناعم •</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* أسئلة شائعة */}
          <TabsContent value="faq" dir="rtl">
            <div className="space-y-4 text-right">
              {helpTopics.map((topic) => (
                <Card key={topic.id}>
                  <CardHeader>
                    <CardTitle className="text-right flex items-center gap-2 justify-end">
                      <span>{topic.title}</span>
                      {topic.icon && <topic.icon className="w-6 h-6 text-primary flex-shrink-0" />}
                    </CardTitle>
                    {topic.description && (
                      <p className="text-sm text-foreground/70 text-right">{topic.description}</p>
                    )}
                  </CardHeader>
                  <CardContent className="text-foreground/80 text-right">
                    {topic.content}
                  </CardContent>
                </Card>
              ))}

              <Alert className="bg-primary/5 border-primary/20">
                <AlertDescription className="text-foreground text-right">
                  <strong>:نصيحة</strong> 💡
                  <br />
                  .لأفضل تجربة تعلم، حاول أن تخصص 15-20 دقيقة يومياً للتطبيق
                  <br />
                  !الاستمرارية أهم من الكمية
                </AlertDescription>
              </Alert>
            </div>
          </TabsContent>
        </Tabs>
      </motion.div>
    </div>
  );
}

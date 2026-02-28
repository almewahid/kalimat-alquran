import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function Help() {
  const [activeSection, setActiveSection] = useState("overview");

  const levels = [
    {
      name: "طفل (وضع الأطفال)",
      icon: "👶",
      color: "bg-green-50 border-green-200",
      text: "text-green-700",
      features: ["كلمات بسيطة وسهلة", "واجهة ملونة ومرحة", "مكافآت بصرية", "مناسب للأطفال من 3-7 سنوات"]
    },
    {
      name: "متوسط",
      icon: "📚",
      color: "bg-yellow-50 border-yellow-200",
      text: "text-yellow-700",
      features: ["كلمات متوسطة الصعوبة", "سياق أوسع للكلمات", "تحليل لغوي بسيط"]
    },
    {
      name: "متقدم",
      icon: "🎓",
      color: "bg-red-50 border-red-200",
      text: "text-red-700",
      features: ["كلمات معقدة ونادرة", "الجذور والمشتقات", "تحليل لغوي عميق", "تحديات صعبة"]
    }
  ];

  const systems = [
    {
      name: "نظام النقاط (XP)",
      icon: "⭐",
      color: "bg-amber-50 border-amber-200",
      details: ["كل كلمة متعلمة = 10 XP", "كل اختبار ناجح = 20-50 XP", "كل تحدي مكتمل = 30-75 XP", "كل 100 XP = مستوى جديد"]
    },
    {
      name: "نظام الجواهر",
      icon: "💎",
      color: "bg-blue-50 border-blue-200",
      details: ["تُكسب من: الإنجازات، التحديات، النتائج المثالية", "تُصرف في: الثيمات (80-150 💎)، الخلفيات (40-60 💎)"]
    },
    {
      name: "نظام القلوب",
      icon: "❤️",
      color: "bg-pink-50 border-pink-200",
      details: ["5 قلوب في كل اختبار", "خسارة قلب مع كل خطأ", "استعادة قلب واحد بالتسبيح", "القلوب تُستعاد كل يوم"]
    },
    {
      name: "نظام المراجعة الذكي (SRS)",
      icon: "🔄",
      color: "bg-purple-50 border-purple-200",
      details: ["يعتمد على خوارزمية SM-2", "يحدد موعد المراجعة التالي", "يتكيف مع أدائك", "مراجعة الكلمات قبل نسيانها"]
    }
  ];

  const achievements = [
    { name: "السلسلة اليومية",    icon: "🔥", examples: "3 / 7 / 30 / 100 يوم" },
    { name: "إنجازات الكلمات",   icon: "📚", examples: "50 / 100 / 500 / 1000 كلمة" },
    { name: "خبير الاختبارات",   icon: "🧠", examples: "10 / 50 / 100 اختبار" },
    { name: "التعلم السريع",      icon: "⚡", examples: "10 / 20 كلمة في يوم واحد" },
    { name: "النتيجة المثالية",   icon: "⭐", examples: "100% في 5 / 20 اختبار" },
    { name: "إتمام السور",        icon: "📖", examples: "سورة الفاتحة / جزء عم" },
    { name: "قائد المجموعات",    icon: "👑", examples: "إنشاء 3 / 10 مجموعات" },
    { name: "المتحدي",           icon: "🎯", examples: "10 / 50 تحدي" },
  ];

  const helpTopics = [
    {
      id: "start-learning",
      title: "❓ كيف أبدأ التعلم؟",
      content: (
        <ol className="list-decimal list-inside space-y-2 text-foreground/80">
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
      title: "💎 كيف أكسب الجواهر؟",
      content: (
        <ul className="space-y-2 text-foreground/80">
          <li className="flex items-center gap-2">🏆 أكمل الإنجازات واحصل على جواهر</li>
          <li className="flex items-center gap-2">📅 شارك في التحديات اليومية</li>
          <li className="flex items-center gap-2">👥 أكمل تحديات المجموعات</li>
          <li className="flex items-center gap-2">🎯 احصل على نتائج مثالية (100%)</li>
          <li className="flex items-center gap-2">🔥 حافظ على سلسلتك اليومية</li>
        </ul>
      )
    },
    {
      id: "no-hearts",
      title: "❤️ ماذا أفعل عند نفاذ القلوب؟",
      content: (
        <ul className="space-y-2 text-foreground/80">
          <li className="flex items-center gap-2">🤲 استخدم نافذة التسبيح لاسترجاع قلب واحد</li>
          <li className="flex items-center gap-2">🛍️ اشترِ "إعادة القلوب" من المتجر (50 جوهرة)</li>
          <li className="flex items-center gap-2">⏰ انتظر حتى اليوم التالي لاستعادة القلوب تلقائياً</li>
        </ul>
      )
    },
    {
      id: "add-friends",
      title: "👥 كيف أضيف أصدقاء؟",
      content: (
        <ol className="list-decimal list-inside space-y-2 text-foreground/80">
          <li>اذهب إلى صفحة "الأصدقاء"</li>
          <li>أدخل البريد الإلكتروني للصديق</li>
          <li>اضغط "إرسال طلب"</li>
          <li>انتظر حتى يقبل صديقك الطلب</li>
        </ol>
      )
    },
    {
      id: "achievements-vs-challenges",
      title: "🏆 ما الفرق بين الإنجازات والتحديات؟",
      content: (
        <div className="space-y-3 text-foreground/80">
          <div className="p-3 bg-amber-50 rounded-2xl border border-amber-200">
            <p className="font-bold text-amber-700 mb-1">🏆 الإنجازات</p>
            <p className="text-sm">أهداف طويلة المدى تُحقق تلقائياً بمرور الوقت (مثل: حفظ 100 كلمة، 30 يوم متتالي)</p>
          </div>
          <div className="p-3 bg-purple-50 rounded-2xl border border-purple-200">
            <p className="font-bold text-purple-700 mb-1">📅 التحديات اليومية</p>
            <p className="text-sm">أهداف قصيرة المدى تتجدد كل 24 ساعة (مثل: تعلم 10 كلمات اليوم)</p>
          </div>
          <div className="p-3 bg-green-50 rounded-2xl border border-green-200">
            <p className="font-bold text-green-700 mb-1">👥 تحديات المجموعات</p>
            <p className="text-sm">تحديات خاصة ينشئها رئيس المجموعة لأعضائها</p>
          </div>
        </div>
      )
    },
    {
      id: "common-issues",
      title: "🐛 حل المشاكل الشائعة",
      content: (
        <div className="space-y-4 text-foreground/80">
          <div className="p-3 bg-red-50 rounded-2xl border border-red-200">
            <p className="font-bold text-red-700 mb-2">الصفحة لا تظهر؟</p>
            <ul className="space-y-1 text-sm">
              <li>• تأكد من تسجيل الدخول</li>
              <li>• حدّث الصفحة (F5)</li>
              <li>• امسح الكاش (Ctrl+Shift+Delete)</li>
            </ul>
          </div>
          <div className="p-3 bg-orange-50 rounded-2xl border border-orange-200">
            <p className="font-bold text-orange-700 mb-2">الإشعارات لا تصل؟</p>
            <ul className="space-y-1 text-sm">
              <li>• تحقق من صفحة الإشعارات مباشرة</li>
              <li>• تأكد من إعدادات المتصفح</li>
            </ul>
          </div>
          <div className="p-3 bg-blue-50 rounded-2xl border border-blue-200">
            <p className="font-bold text-blue-700 mb-2">لا أرى تقدمي؟</p>
            <ul className="space-y-1 text-sm">
              <li>• اذهب إلى صفحة "التقدم"</li>
              <li>• تأكد من إكمال اختبار واحد على الأقل</li>
              <li>• حدّث الصفحة</li>
            </ul>
          </div>
        </div>
      )
    }
  ];

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-6" dir="rtl">

      {/* Header */}
      <div className="text-center">
        <div className="text-6xl mb-3">📚</div>
        <h1 className="text-3xl font-bold text-foreground mb-2">دليل الاستخدام</h1>
        <p className="text-sm text-muted-foreground">كل ما تحتاج معرفته عن تطبيق كلمات القرآن</p>
      </div>

      <Tabs value={activeSection} onValueChange={setActiveSection} className="w-full" dir="rtl">
        <TabsList className="grid w-full grid-cols-3 rounded-2xl h-12">
          <TabsTrigger value="overview"  className="rounded-xl font-bold text-sm">📖 نظرة عامة</TabsTrigger>
          <TabsTrigger value="systems"   className="rounded-xl font-bold text-sm">🏆 الأنظمة</TabsTrigger>
          <TabsTrigger value="faq"       className="rounded-xl font-bold text-sm">❓ أسئلة</TabsTrigger>
        </TabsList>

        {/* نظرة عامة */}
        <TabsContent value="overview" className="mt-4 space-y-4" dir="rtl">

          {/* App description */}
          <Card className="rounded-2xl border-2">
            <CardContent className="p-5 text-center">
              <p className="text-foreground/80 leading-relaxed mb-5">
                تطبيق تعليمي تفاعلي لتعلم معاني كلمات القرآن الكريم باستخدام أنظمة التعلم الحديثة والتحفيز.
              </p>
              <div className="grid grid-cols-3 gap-3">
                <div className="p-3 bg-primary/5 rounded-2xl">
                  <div className="text-3xl mb-1">📚</div>
                  <p className="text-xs font-bold">تعلم ذكي</p>
                  <p className="text-xs text-muted-foreground">نظام SRS</p>
                </div>
                <div className="p-3 bg-primary/5 rounded-2xl">
                  <div className="text-3xl mb-1">🎮</div>
                  <p className="text-xs font-bold">تحفيز مستمر</p>
                  <p className="text-xs text-muted-foreground">إنجازات وجواهر</p>
                </div>
                <div className="p-3 bg-primary/5 rounded-2xl">
                  <div className="text-3xl mb-1">👥</div>
                  <p className="text-xs font-bold">تعلم اجتماعي</p>
                  <p className="text-xs text-muted-foreground">أصدقاء ومجموعات</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Levels */}
          <p className="text-base font-bold text-foreground px-1">🎯 المستويات التعليمية</p>
          {levels.map((level) => (
            <Card key={level.name} className={`rounded-2xl border-2 ${level.color}`}>
              <CardContent className="p-4">
                <div className="flex items-center gap-3 mb-3">
                  <span className="text-3xl">{level.icon}</span>
                  <span className={`font-bold text-base ${level.text}`}>{level.name}</span>
                </div>
                <ul className="space-y-1">
                  {level.features.map((feature, idx) => (
                    <li key={idx} className="text-sm text-foreground/80 flex items-center gap-2">
                      <span className="text-primary">•</span>
                      {feature}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        {/* الأنظمة */}
        <TabsContent value="systems" className="mt-4 space-y-4" dir="rtl">

          {systems.map((system) => (
            <Card key={system.name} className={`rounded-2xl border-2 ${system.color}`}>
              <CardContent className="p-4">
                <div className="flex items-center gap-3 mb-3">
                  <span className="text-3xl">{system.icon}</span>
                  <span className="font-bold text-base text-foreground">{system.name}</span>
                </div>
                <ul className="space-y-1">
                  {system.details.map((detail, idx) => (
                    <li key={idx} className="text-sm text-foreground/80 flex items-center gap-2">
                      <span className="text-primary">•</span>
                      {detail}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          ))}

          {/* Achievements */}
          <p className="text-base font-bold text-foreground px-1">🏅 أنواع الإنجازات</p>
          <div className="grid grid-cols-2 gap-3">
            {achievements.map((ach) => (
              <Card key={ach.name} className="rounded-2xl border-2">
                <CardContent className="p-3 text-center">
                  <div className="text-2xl mb-1">{ach.icon}</div>
                  <p className="font-bold text-sm text-foreground">{ach.name}</p>
                  <p className="text-xs text-muted-foreground mt-1">{ach.examples}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* أسئلة شائعة */}
        <TabsContent value="faq" className="mt-4 space-y-4" dir="rtl">
          {helpTopics.map((topic) => (
            <Card key={topic.id} className="rounded-2xl border-2">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-bold">{topic.title}</CardTitle>
              </CardHeader>
              <CardContent>
                {topic.content}
              </CardContent>
            </Card>
          ))}

          <Alert className="bg-primary/5 border-primary/20 rounded-2xl">
            <AlertDescription className="text-foreground text-sm leading-relaxed">
              💡 <strong>نصيحة:</strong> لأفضل تجربة تعلم، حاول أن تخصص 15-20 دقيقة يومياً للتطبيق. الاستمرارية أهم من الكمية!
            </AlertDescription>
          </Alert>
        </TabsContent>
      </Tabs>

    </div>
  );
}

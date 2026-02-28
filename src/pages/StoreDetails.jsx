import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Copy, Check, ExternalLink } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function StoreDetails() {
  const [copiedSection, setCopiedSection] = useState(null);

  const copyToClipboard = (text, section) => {
    navigator.clipboard.writeText(text);
    setCopiedSection(section);
    setTimeout(() => setCopiedSection(null), 2000);
  };

  // Google Play Store Data
  const googlePlayData = {
    appName: "كلمات القرآن - تعلم معاني القرآن",
    shortDescription: "تطبيق تفاعلي لتعلم معاني كلمات القرآن الكريم بطريقة ممتعة مع اختبارات ذكية وتتبع التقدم",
    fullDescription: `🌟 كلمات القرآن - رحلتك لفهم كلام الله

اكتشف معاني القرآن الكريم بطريقة عصرية وممتعة! تطبيق "كلمات القرآن" يساعدك على تعلم وحفظ معاني كلمات القرآن الكريم من خلال منهج تفاعلي مدروس بعناية.

✨ المميزات الرئيسية:
📖 تعلم تفاعلي: تعلم معاني الكلمات مع سياقها القرآني الكامل
🎯 اختبارات ذكية: اختبر نفسك بأنواع مختلفة من الأسئلة
🔄 مراجعة ذكية: نظام SRS لمراجعة الكلمات في الوقت المناسب
📊 تتبع التقدم: راقب تطورك مع إحصائيات مفصلة
🏆 التحديات: شارك في تحديات يومية واكسب الإنجازات
👥 تعلم جماعي: انضم لمجموعات وتعلم مع الأصدقاء
🎨 تخصيص كامل: قم بتخصيص ثيم التطبيق حسب ذوقك
🔊 استماع للآيات: استمع لتلاوة الآيات من مشاهير القراء
📚 قارئ قرآن مدمج: اقرأ القرآن الكريم كاملاً داخل التطبيق
⭐ المفضلة: احفظ كلماتك المفضلة للمراجعة السريعة
📝 ملاحظات شخصية: أضف ملاحظاتك الخاصة على الكلمات

🎓 مستويات تعليمية:
- طفل: ابدأ مع الكلمات الأساسية
- متوسط: توسع في فهم المعاني
- متقدم: احترف معاني القرآن الكريم

🌙 مناسب للجميع:
- الطلاب والدارسين
- المعلمين والدعاة
- محبي القرآن الكريم
- الباحثين عن فهم أعمق

📱 تجربة سلسة:
- واجهة عربية أنيقة
- دعم كامل للوضع المظلم
- عمل بدون إنترنت (بعد التحميل الأول)
- مزامنة تلقائية بين الأجهزة

انضم الآن لأكثر من 10,000 مستخدم يتعلمون معاني القرآن الكريم!`,
    keywords: "قرآن، معاني القرآن، تعلم القرآن، كلمات القرآن، تفسير، دراسة إسلامية، تعليم ديني، حفظ القرآن، مراجعة قرآنية",
    category: "التعليم",
    supportEmail: "support@kalimat-quran.com",
    additionalRequirements: [
      {
        title: "سياسة الخصوصية",
        link: "/PrivacyPolicy",
        description: "رابط سياسة الخصوصية الكاملة"
      },
      {
        title: "أمان البيانات",
        content: "التطبيق لا يجمع أي بيانات شخصية حساسة. البيانات المخزنة:\n- معلومات الحساب الأساسية (البريد والاسم)\n- تقدم التعلم والإحصائيات\n- التفضيلات والإعدادات\n\nجميع البيانات مشفرة ومحمية."
      },
      {
        title: "الفئة العمرية",
        content: "مناسب لجميع الأعمار (3+)"
      },
      {
        title: "الإعلانات",
        content: "لا يحتوي التطبيق على إعلانات"
      },
      {
        title: "عمليات الشراء",
        content: "لا توجد عمليات شراء داخل التطبيق - مجاني بالكامل"
      }
    ]
  };

  // Apple App Store Data
  const appStoreData = {
    appName: "كلمات القرآن",
    subtitle: "تعلم معاني القرآن الكريم",
    description: `تطبيق كلمات القرآن يساعدك على فهم وحفظ معاني كلمات القرآن الكريم بطريقة تفاعلية وممتعة.

المميزات:
• تعلم معاني الكلمات مع سياقها القرآني
• اختبارات تفاعلية متنوعة
• نظام مراجعة ذكي
• تتبع دقيق لتقدمك
• تحديات يومية وإنجازات
• مجموعات تعليمية
• قارئ قرآن مدمج
• ملاحظات شخصية
• دعم كامل للغة العربية
• واجهة أنيقة وسهلة الاستخدام

مناسب لجميع المستويات من المبتدئين إلى المتقدمين. ابدأ رحلتك اليوم في فهم كلام الله!`,
    keywords: "قرآن,معاني,تعلم,تفسير,إسلام,دراسة,تعليم,حفظ,مراجعة,عربي",
    category: "Education",
    supportEmail: "support@kalimat-quran.com",
    privacyPolicy: "https://kalimat-allah.base44.app/PrivacyPolicy"
  };

  // App Features for Marketing
  const appFeatures = {
    hero: "🌟 اكتشف معاني القرآن الكريم بطريقة عصرية وممتعة!",
    mainFeatures: [
      {
        icon: "📖",
        title: "تعلم تفاعلي ذكي",
        description: "تعلم معاني كلمات القرآن مع سياقها الكامل في الآيات الكريمة، مع أمثلة وشروحات مفصلة"
      },
      {
        icon: "🎯",
        title: "اختبارات متنوعة",
        description: "اختبر نفسك بأساليب مختلفة: اختيار من متعدد، ترتيب الكلمات، التعرف الصوتي، والمزيد"
      },
      {
        icon: "🔄",
        title: "مراجعة ذكية (SRS)",
        description: "نظام متطور يذكرك بمراجعة الكلمات في الوقت المثالي للحفظ الدائم"
      },
      {
        icon: "📊",
        title: "تتبع شامل للتقدم",
        description: "راقب تطورك بإحصائيات دقيقة، رسوم بيانية، وتقارير أسبوعية مفصلة"
      },
      {
        icon: "🏆",
        title: "تحديات وإنجازات",
        description: "شارك في تحديات يومية، اكسب النقاط، واحصل على شارات الإنجاز"
      },
      {
        icon: "👥",
        title: "تعلم جماعي",
        description: "انضم لمجموعات، شارك التحديات مع الأصدقاء، وتنافس في لوحة المتصدرين"
      },
      {
        icon: "🎨",
        title: "تخصيص كامل",
        description: "اختر الثيم المفضل، حجم الخط، الألوان، والمزيد لتجربة شخصية مريحة"
      },
      {
        icon: "🔊",
        title: "استماع للآيات",
        description: "استمع لتلاوة الآيات الكريمة من أشهر القراء مع إمكانية تكرار وتشغيل بطيء"
      },
      {
        icon: "📚",
        title: "قارئ قرآن متكامل",
        description: "اقرأ القرآن الكريم كاملاً مع التفسير والترجمة داخل التطبيق"
      },
      {
        icon: "⭐",
        title: "قائمة المفضلة",
        description: "احفظ الكلمات المهمة لك للوصول السريع والمراجعة المستمرة"
      },
      {
        icon: "📝",
        title: "ملاحظات شخصية",
        description: "دون ملاحظاتك وأفكارك الخاصة على كل كلمة لفهم أعمق"
      },
      {
        icon: "🌙",
        title: "تصميم أنيق",
        description: "واجهة عربية جميلة، دعم كامل للوضع المظلم، وتجربة سلسة على جميع الأجهزة"
      }
    ],
    learningLevels: [
      { level: "🌱 طفل", description: "ابدأ مع الكلمات الأساسية والمعاني البسيطة" },
      { level: "🌿 متوسط", description: "توسع في فهمك للمعاني والسياقات المختلفة" },
      { level: "🌳 متقدم", description: "احترف معاني القرآن الكريم وأصبح مرجعاً" }
    ],
    targetAudience: [
      "📚 الطلاب والدارسين",
      "👨‍🏫 المعلمين والدعاة",
      "❤️ محبي القرآن الكريم",
      "🔍 الباحثين عن فهم أعمق",
      "👨‍👩‍👧‍👦 العائلات المسلمة"
    ],
    benefits: [
      "✨ فهم أعمق لكلام الله",
      "💪 تحسين قدرة الحفظ والاستيعاب",
      "⏰ توفير الوقت مع نظام مراجعة ذكي",
      "🎯 تحقيق أهداف تعليمية واضحة",
      "🤝 بناء عادات تعلم يومية",
      "🌟 تطوير علاقة أقوى مع القرآن"
    ],
    callToAction: "🚀 ابدأ رحلتك اليوم وانضم لأكثر من 10,000 متعلم!"
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 dark:from-gray-900 dark:to-gray-800 p-4 md:p-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-6xl mx-auto"
      >
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold gradient-text mb-2">📱 بيانات المتاجر</h1>
          <p className="text-foreground/60">جميع البيانات المطلوبة لنشر التطبيق على المتاجر - جاهزة للنسخ واللصق</p>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="google" className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-6">
            <TabsTrigger value="google" className="text-lg">
              🤖 Google Play
            </TabsTrigger>
            <TabsTrigger value="apple" className="text-lg">
              🍎 App Store
            </TabsTrigger>
            <TabsTrigger value="features" className="text-lg">
              ✨ المزايا
            </TabsTrigger>
          </TabsList>

          {/* Google Play Tab */}
          <TabsContent value="google" className="space-y-6">
            {/* App Name */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>📱 اسم التطبيق</span>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => copyToClipboard(googlePlayData.appName, "google-name")}
                  >
                    {copiedSection === "google-name" ? (
                      <Check className="w-4 h-4 ml-2" />
                    ) : (
                      <Copy className="w-4 h-4 ml-2" />
                    )}
                    نسخ
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-lg bg-muted p-4 rounded-lg">{googlePlayData.appName}</p>
              </CardContent>
            </Card>

            {/* Short Description */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>📝 الوصف المختصر (80 حرف)</span>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => copyToClipboard(googlePlayData.shortDescription, "google-short")}
                  >
                    {copiedSection === "google-short" ? (
                      <Check className="w-4 h-4 ml-2" />
                    ) : (
                      <Copy className="w-4 h-4 ml-2" />
                    )}
                    نسخ
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="bg-muted p-4 rounded-lg">{googlePlayData.shortDescription}</p>
                <p className="text-sm text-foreground/60 mt-2">
                  عدد الأحرف: {googlePlayData.shortDescription.length}
                </p>
              </CardContent>
            </Card>

            {/* Full Description */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>📄 الوصف الكامل (4000 حرف)</span>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => copyToClipboard(googlePlayData.fullDescription, "google-full")}
                  >
                    {copiedSection === "google-full" ? (
                      <Check className="w-4 h-4 ml-2" />
                    ) : (
                      <Copy className="w-4 h-4 ml-2" />
                    )}
                    نسخ
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="bg-muted p-4 rounded-lg whitespace-pre-line">
                  {googlePlayData.fullDescription}
                </div>
                <p className="text-sm text-foreground/60 mt-2">
                  عدد الأحرف: {googlePlayData.fullDescription.length}
                </p>
              </CardContent>
            </Card>

            {/* Keywords */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>🔑 الكلمات المفتاحية</span>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => copyToClipboard(googlePlayData.keywords, "google-keywords")}
                  >
                    {copiedSection === "google-keywords" ? (
                      <Check className="w-4 h-4 ml-2" />
                    ) : (
                      <Copy className="w-4 h-4 ml-2" />
                    )}
                    نسخ
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="bg-muted p-4 rounded-lg">{googlePlayData.keywords}</p>
              </CardContent>
            </Card>

            {/* Category & Support */}
            <div className="grid md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>📂 الفئة</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-lg bg-muted p-4 rounded-lg">{googlePlayData.category}</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>📧 بريد الدعم</span>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => copyToClipboard(googlePlayData.supportEmail, "google-email")}
                    >
                      {copiedSection === "google-email" ? (
                        <Check className="w-4 h-4 ml-2" />
                      ) : (
                        <Copy className="w-4 h-4 ml-2" />
                      )}
                      نسخ
                    </Button>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-lg bg-muted p-4 rounded-lg">{googlePlayData.supportEmail}</p>
                </CardContent>
              </Card>
            </div>

            {/* Additional Requirements */}
            <Card>
              <CardHeader>
                <CardTitle>📋 متطلبات إضافية</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {googlePlayData.additionalRequirements.map((req, index) => (
                  <div key={index} className="border-b border-border pb-4 last:border-0">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-semibold text-lg">{req.title}</h4>
                      {req.link && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => window.open(`https://kalimat-allah.base44.app${req.link}`, '_blank')}
                        >
                          <ExternalLink className="w-4 h-4 ml-2" />
                          فتح
                        </Button>
                      )}
                      {req.content && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => copyToClipboard(req.content, `google-req-${index}`)}
                        >
                          {copiedSection === `google-req-${index}` ? (
                            <Check className="w-4 h-4 ml-2" />
                          ) : (
                            <Copy className="w-4 h-4 ml-2" />
                          )}
                          نسخ
                        </Button>
                      )}
                    </div>
                    {req.description && (
                      <p className="text-foreground/60 text-sm">{req.description}</p>
                    )}
                    {req.content && (
                      <p className="bg-muted p-3 rounded-lg mt-2 whitespace-pre-line text-sm">
                        {req.content}
                      </p>
                    )}
                    {req.link && (
                      <p className="text-sm text-primary mt-2">
                        🔗 {`https://kalimat-allah.base44.app${req.link}`}
                      </p>
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Apple App Store Tab */}
          <TabsContent value="apple" className="space-y-6">
            {/* App Name */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>📱 App Name</span>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => copyToClipboard(appStoreData.appName, "apple-name")}
                  >
                    {copiedSection === "apple-name" ? (
                      <Check className="w-4 h-4 ml-2" />
                    ) : (
                      <Copy className="w-4 h-4 ml-2" />
                    )}
                    نسخ
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-lg bg-muted p-4 rounded-lg">{appStoreData.appName}</p>
              </CardContent>
            </Card>

            {/* Subtitle */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>📝 Subtitle (30 characters)</span>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => copyToClipboard(appStoreData.subtitle, "apple-subtitle")}
                  >
                    {copiedSection === "apple-subtitle" ? (
                      <Check className="w-4 h-4 ml-2" />
                    ) : (
                      <Copy className="w-4 h-4 ml-2" />
                    )}
                    نسخ
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="bg-muted p-4 rounded-lg">{appStoreData.subtitle}</p>
                <p className="text-sm text-foreground/60 mt-2">
                  Characters: {appStoreData.subtitle.length}
                </p>
              </CardContent>
            </Card>

            {/* Description */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>📄 Description (4000 characters)</span>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => copyToClipboard(appStoreData.description, "apple-desc")}
                  >
                    {copiedSection === "apple-desc" ? (
                      <Check className="w-4 h-4 ml-2" />
                    ) : (
                      <Copy className="w-4 h-4 ml-2" />
                    )}
                    نسخ
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="bg-muted p-4 rounded-lg whitespace-pre-line">
                  {appStoreData.description}
                </div>
                <p className="text-sm text-foreground/60 mt-2">
                  Characters: {appStoreData.description.length}
                </p>
              </CardContent>
            </Card>

            {/* Keywords */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>🔑 Keywords (100 characters)</span>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => copyToClipboard(appStoreData.keywords, "apple-keywords")}
                  >
                    {copiedSection === "apple-keywords" ? (
                      <Check className="w-4 h-4 ml-2" />
                    ) : (
                      <Copy className="w-4 h-4 ml-2" />
                    )}
                    نسخ
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="bg-muted p-4 rounded-lg">{appStoreData.keywords}</p>
                <p className="text-sm text-foreground/60 mt-2">
                  Characters: {appStoreData.keywords.length}
                </p>
              </CardContent>
            </Card>

            {/* Category, Email & Privacy */}
            <div className="grid md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>📂 Category</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-lg bg-muted p-4 rounded-lg">{appStoreData.category}</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>📧 Support Email</span>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => copyToClipboard(appStoreData.supportEmail, "apple-email")}
                    >
                      {copiedSection === "apple-email" ? (
                        <Check className="w-4 h-4 ml-2" />
                      ) : (
                        <Copy className="w-4 h-4 ml-2" />
                      )}
                      نسخ
                    </Button>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-lg bg-muted p-4 rounded-lg">{appStoreData.supportEmail}</p>
                </CardContent>
              </Card>
            </div>

            {/* Privacy Policy */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>🔒 Privacy Policy URL</span>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => window.open(appStoreData.privacyPolicy, '_blank')}
                  >
                    <ExternalLink className="w-4 h-4 ml-2" />
                    فتح
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-primary bg-muted p-4 rounded-lg break-all">
                  {appStoreData.privacyPolicy}
                </p>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Features Tab */}
          <TabsContent value="features" className="space-y-6">
            {/* Hero */}
            <Card className="bg-gradient-to-r from-green-500 to-blue-500 text-white">
              <CardContent className="p-8">
                <h2 className="text-3xl font-bold text-center">{appFeatures.hero}</h2>
              </CardContent>
            </Card>

            {/* Main Features */}
            <Card>
              <CardHeader>
                <CardTitle className="text-2xl">🎯 المزايا الرئيسية</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-6">
                  {appFeatures.mainFeatures.map((feature, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="bg-muted p-4 rounded-lg"
                    >
                      <div className="text-3xl mb-2">{feature.icon}</div>
                      <h3 className="text-xl font-bold mb-2">{feature.title}</h3>
                      <p className="text-foreground/70">{feature.description}</p>
                    </motion.div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Learning Levels */}
            <Card>
              <CardHeader>
                <CardTitle className="text-2xl">📚 المستويات التعليمية</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {appFeatures.learningLevels.map((level, index) => (
                    <div key={index} className="bg-muted p-4 rounded-lg">
                      <h3 className="text-xl font-bold mb-2">{level.level}</h3>
                      <p className="text-foreground/70">{level.description}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Target Audience */}
            <Card>
              <CardHeader>
                <CardTitle className="text-2xl">👥 مناسب لـ</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-3">
                  {appFeatures.targetAudience.map((audience, index) => (
                    <div key={index} className="bg-muted p-3 rounded-lg text-lg">
                      {audience}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Benefits */}
            <Card>
              <CardHeader>
                <CardTitle className="text-2xl">💎 الفوائد</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-3">
                  {appFeatures.benefits.map((benefit, index) => (
                    <div key={index} className="bg-muted p-3 rounded-lg text-lg">
                      {benefit}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Call to Action */}
            <Card className="bg-gradient-to-r from-purple-500 to-pink-500 text-white">
              <CardContent className="p-8">
                <h2 className="text-3xl font-bold text-center">{appFeatures.callToAction}</h2>
              </CardContent>
            </Card>

            {/* Copy All Features */}
            <div className="text-center">
              <Button
                size="lg"
                onClick={() => {
                  const allFeatures = `
${appFeatures.hero}

المزايا الرئيسية:
${appFeatures.mainFeatures.map(f => `${f.icon} ${f.title}: ${f.description}`).join('\n')}

المستويات التعليمية:
${appFeatures.learningLevels.map(l => `${l.level}: ${l.description}`).join('\n')}

مناسب لـ:
${appFeatures.targetAudience.join('\n')}

الفوائد:
${appFeatures.benefits.join('\n')}

${appFeatures.callToAction}
                  `;
                  copyToClipboard(allFeatures, "all-features");
                }}
                className="bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700"
              >
                {copiedSection === "all-features" ? (
                  <>
                    <Check className="w-5 h-5 ml-2" />
                    تم النسخ!
                  </>
                ) : (
                  <>
                    <Copy className="w-5 h-5 ml-2" />
                    نسخ جميع المزايا
                  </>
                )}
              </Button>
            </div>
          </TabsContent>
        </Tabs>

        {/* Success Toast */}
        <AnimatePresence>
          {copiedSection && (
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 50 }}
              className="fixed bottom-8 right-8 bg-green-600 text-white px-6 py-3 rounded-lg shadow-lg flex items-center gap-2 z-50"
            >
              <Check className="w-5 h-5" />
              <span>تم النسخ بنجاح!</span>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, ArrowRight, BookOpen, Brain, Heart, Trophy, Settings, Sparkles, Volume2, Zap, Target, CheckCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const tutorialSteps = [
  {
    id: "welcome",
    title: "أهلاً وسهلاً! 🌟",
    content: "مرحباً بك في رحلة تعلم كلمات القرآن الكريم!\nهنا ستتعلم معاني الكلمات القرآنية بطريقة ممتعة وسهلة مع ألعاب واختبارات تحفّزك على الاستمرار 🎮",
    icon: BookOpen,
    color: "emerald"
  },
  {
    id: "hearts",
    title: "القلوب هي حياتك 💕",
    content: "تبدأ كل جلسة اختبار بـ 5 قلوب ❤️❤️❤️❤️❤️\n\nكل إجابة خاطئة تأخذ منك قلباً واحداً.\n\n💡 نصيحة: عند انتهاء القلوب يمكنك استعادة قلب عبر التسبيح!",
    icon: Heart,
    color: "red"
  },
  {
    id: "xp",
    title: "ارتقِ في المستويات! 🏆",
    content: "كل كلمة تتعلمها = 10 نقاط XP ⭐\nكل اختبار تجتازه = المزيد من النقاط!\n\nكلما ارتفعت نقاطك، ارتفع مستواك وحصلت على إنجازات رائعة.",
    icon: Trophy,
    color: "blue"
  },
  {
    id: "features",
    title: "ماذا ستجد في التطبيق؟ 🎁",
    content: "📖 قارئ القرآن مع التفسير والصوت\n🧠 مراجعة ذكية تتذكر ما تعلمته\n👥 مجموعات وتحديات مع الأصدقاء\n🏅 شهادات رسمية عند إتمام الدورات\n🎯 مسارات تعليمية منظمة",
    icon: Sparkles,
    color: "purple"
  },
  {
    id: "settings",
    title: "اضبط تجربتك الآن ⚙️",
    content: "اختر ما يناسبك لنبدأ رحلة التعلم معاً",
    icon: Settings,
    color: "orange",
    isSettings: true
  },
  {
    id: "ready",
    title: "أنت جاهز! انطلق الآن 🚀",
    content: "رحلتك في تعلم كلمات القرآن الكريم تبدأ الآن!\n\n🟢 اضغط على «التعلم» لتتعلم كلمات جديدة\n🎯 أو «الاختبار» لتختبر ما تعرفه\n\nبالتوفيق! 🤲",
    icon: Brain,
    color: "green"
  }
];

export default function TutorialModal({ isOpen, onClose }) {
  const [currentStep, setCurrentStep] = useState(0);
  
  // إعدادات المستخدم
  const [userSettings, setUserSettings] = useState({
    learning_level: "مبتدئ",
    daily_new_words_goal: 10,
    daily_review_words_goal: 20,
    sound_effects_enabled: true,
    animations_enabled: true,
    confetti_enabled: true
  });

  const nextStep = () => {
    if (currentStep < tutorialSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      // حفظ الإعدادات وإغلاق الـ Tutorial
      handleFinish();
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const skipTutorial = () => {
    handleFinish();
  };

  const handleFinish = () => {
    // سيتم تمرير الإعدادات إلى الـ parent component
    onClose(userSettings);
  };

  const currentStepData = tutorialSteps[currentStep];

  const renderStepContent = () => {
    if (currentStepData.id === "settings") {
      return (
        <Card className="bg-background-soft border-border">
          <CardContent className="p-6 space-y-6">
            {/* تحديد المستوى */}
            <div>
              <Label className="text-lg font-semibold mb-3 block flex items-center gap-2">
                <Target className="w-5 h-5 text-primary" />
                مستوى التعلم
              </Label>
              <Select
                value={userSettings.learning_level}
                onValueChange={(value) => setUserSettings(prev => ({ ...prev, learning_level: value }))}
              >
                <SelectTrigger className="w-full text-base">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="مبتدئ">
                    <div className="flex flex-col items-start">
                      <span className="font-semibold">مبتدئ</span>
                      <span className="text-xs text-foreground/70">مبسط جداً ومناسب للأطفال</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="متوسط">
                    <div className="flex flex-col items-start">
                      <span className="font-semibold">متوسط</span>
                      <span className="text-xs text-foreground/70">معاني واضحة ومختصرة</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="متقدم">
                    <div className="flex flex-col items-start">
                      <span className="font-semibold">متقدم</span>
                      <span className="text-xs text-foreground/70">معاني عميقة وتحليل لغوي</span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* الأهداف اليومية */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-sm font-semibold mb-2 block">
                  🆕 كلمات جديدة يومياً
                </Label>
                <Input
                  type="number"
                  min="1"
                  max="50"
                  value={userSettings.daily_new_words_goal}
                  onChange={(e) => setUserSettings(prev => ({ 
                    ...prev, 
                    daily_new_words_goal: parseInt(e.target.value) || 10 
                  }))}
                  className="text-base"
                />
              </div>
              <div>
                <Label className="text-sm font-semibold mb-2 block">
                  🔁 مراجعة يومية
                </Label>
                <Input
                  type="number"
                  min="1"
                  max="100"
                  value={userSettings.daily_review_words_goal}
                  onChange={(e) => setUserSettings(prev => ({ 
                    ...prev, 
                    daily_review_words_goal: parseInt(e.target.value) || 20 
                  }))}
                  className="text-base"
                />
              </div>
            </div>

            {/* التأثيرات */}
            <div className="space-y-4 pt-4 border-t border-border">
              <h3 className="font-semibold text-base flex items-center gap-2">
                <Zap className="w-5 h-5 text-primary" />
                التأثيرات والرسوم المتحركة
              </h3>

              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-background rounded-lg">
                  <Label htmlFor="sound-effects" className="flex flex-col gap-1 cursor-pointer">
                    <span className="flex items-center gap-2 font-medium">
                      <Volume2 className="w-4 h-4" />
                      المؤثرات الصوتية
                    </span>
                    <span className="text-xs text-foreground/70">أصوات عند الإجابة الصحيحة/الخاطئة</span>
                  </Label>
                  <Switch
                    id="sound-effects"
                    checked={userSettings.sound_effects_enabled}
                    onCheckedChange={(checked) => setUserSettings(prev => ({ 
                      ...prev, 
                      sound_effects_enabled: checked 
                    }))}
                  />
                </div>

                <div className="flex items-center justify-between p-3 bg-background rounded-lg">
                  <Label htmlFor="animations" className="flex flex-col gap-1 cursor-pointer">
                    <span className="flex items-center gap-2 font-medium">
                      🌊 تأثير الموجة
                    </span>
                    <span className="text-xs text-foreground/70">موجة جميلة عند الإجابة الصحيحة</span>
                  </Label>
                  <Switch
                    id="animations"
                    checked={userSettings.animations_enabled}
                    onCheckedChange={(checked) => setUserSettings(prev => ({ 
                      ...prev, 
                      animations_enabled: checked 
                    }))}
                  />
                </div>

                <div className="flex items-center justify-between p-3 bg-background rounded-lg">
                  <Label htmlFor="confetti" className="flex flex-col gap-1 cursor-pointer">
                    <span className="flex items-center gap-2 font-medium">
                      🎉 احتفالات Confetti
                    </span>
                    <span className="text-xs text-foreground/70">احتفال عند رفع المستوى أو إنجاز</span>
                  </Label>
                  <Switch
                    id="confetti"
                    checked={userSettings.confetti_enabled}
                    onCheckedChange={(checked) => setUserSettings(prev => ({ 
                      ...prev, 
                      confetti_enabled: checked 
                    }))}
                  />
                </div>
              </div>
            </div>

            {/* ملاحظة */}
            <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
              <p className="text-sm text-blue-800 dark:text-blue-300 flex items-start gap-2">
                <Settings className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <span>
                  💡 يمكنك تعديل هذه الإعدادات في أي وقت من خلال: <strong>القائمة الجانبية → الإعدادات</strong>
                </span>
              </p>
            </div>
          </CardContent>
        </Card>
      );
    }

    return (
      <Card className={`bg-background-soft border-border mb-6`}>
        <CardContent className="p-8">
          <div className={`w-16 h-16 mx-auto mb-4 bg-${currentStepData.color}-500 rounded-full flex items-center justify-center`}>
            <currentStepData.icon className="w-8 h-8 text-white" />
          </div>
          
          <h2 className="text-xl font-bold text-foreground mb-4">
            {currentStepData.title}
          </h2>
          
          <p className="text-foreground/80 leading-relaxed whitespace-pre-line">
            {currentStepData.content}
          </p>
        </CardContent>
      </Card>
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-2xl bg-card max-h-[90vh] overflow-y-auto" dir="rtl">
        <div className="text-center">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              {renderStepContent()}
            </motion.div>
          </AnimatePresence>

          {/* Progress Indicators */}
          <div className="flex justify-center gap-2 mb-6">
            {tutorialSteps.map((_, index) => (
              <div
                key={index}
                className={`h-2 rounded-full transition-all ${
                  index === currentStep 
                    ? `bg-primary w-8` 
                    : index < currentStep 
                    ? 'bg-primary/50 w-2'
                    : 'bg-border w-2'
                }`}
              />
            ))}
          </div>

          {/* Navigation Buttons */}
          <div className="flex justify-between items-center">
            <Button
              variant="ghost"
              onClick={skipTutorial}
              className="text-foreground/70"
            >
              تخطي الشرح
            </Button>

            <div className="flex gap-2">
              {currentStep > 0 && (
                <Button
                  variant="outline"
                  onClick={prevStep}
                  className="gap-2"
                >
                  <ArrowRight className="w-4 h-4" />
                  السابق
                </Button>
              )}
              
              <Button
                onClick={nextStep}
                className="bg-primary text-primary-foreground hover:bg-primary/90 gap-2"
              >
                {currentStep === tutorialSteps.length - 1 ? (
                  <>
                    <CheckCircle className="w-4 h-4" />
                    ابدأ التعلم!
                  </>
                ) : (
                  <>
                    التالي
                    <ArrowLeft className="w-4 h-4" />
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
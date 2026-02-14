/* 
 * ✨ دليل استخدام Toast المحسّن
 * 
 * الآن مع:
 * ✅ إغلاق تلقائي
 * ✅ زر X يعمل
 * ✅ 4 أنواع بألوان ناعمة
 * ✅ دعم RTL كامل
 */

import React from 'react';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';

const ToastExamples = () => {
  const { toast } = useToast();

  // ✅ مثال 1: Toast نجاح (أخضر ناعم)
  const showSuccess = () => {
    toast({
      title: "تم الحفظ بنجاح!",
      description: "أحسنت، الكلمة أُضيفت إلى مراجعاتك.",
      variant: "success",
      duration: 3000  // 3 ثوانٍ
    });
  };

  // ❌ مثال 2: Toast خطأ (أحمر ناعم)
  const showError = () => {
    toast({
      title: "حدث خطأ",
      description: "لم نتمكن من حفظ البيانات، حاول مرة أخرى",
      variant: "destructive",
      duration: 5000  // 5 ثوانٍ للأخطاء
    });
  };

  // ⚠️ مثال 3: Toast تحذير (كهرماني ناعم - ليس أصفر فاقع!)
  const showWarning = () => {
    toast({
      title: "تنبيه",
      description: "تأكد من إدخال جميع البيانات المطلوبة",
      variant: "warning",
      duration: 4000
    });
  };

  // ℹ️ مثال 4: Toast معلومة (أزرق ناعم)
  const showInfo = () => {
    toast({
      title: "معلومة",
      description: "هذه الكلمة ستظهر في مراجعتك القادمة",
      variant: "info",
      duration: 3000
    });
  };

  // 📝 مثال 5: Toast بدون عنوان
  const showDescriptionOnly = () => {
    toast({
      description: "تم نسخ الرابط بنجاح",
      variant: "success",
      duration: 2000  // 2 ثانية فقط
    });
  };

  // ⏱️ مثال 6: Toast بمدة طويلة
  const showLongDuration = () => {
    toast({
      title: "إشعار مهم",
      description: "هذا الإشعار سيبقى لمدة 10 ثوانٍ حتى تقرأه جيداً",
      variant: "info",
      duration: 10000  // 10 ثوانٍ
    });
  };

  // 🚫 مثال 7: Toast بدون إغلاق تلقائي (يحتاج إغلاق يدوي)
  const showPermanent = () => {
    toast({
      title: "إشعار دائم",
      description: "هذا الإشعار لن يختفي حتى تضغط على زر الإغلاق",
      variant: "warning",
      duration: 0  // 0 = لا يختفي تلقائياً
    });
  };

  return (
    <div className="p-8 space-y-4 max-w-2xl mx-auto">
      <h2 className="text-3xl font-bold mb-6 gradient-text">أمثلة Toast المحسّن</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Button 
          onClick={showSuccess}
          className="bg-green-500 hover:bg-green-600 h-16"
        >
          ✅ نجاح
        </Button>

        <Button 
          onClick={showError}
          className="bg-red-500 hover:bg-red-600 h-16"
        >
          ❌ خطأ
        </Button>

        <Button 
          onClick={showWarning}
          className="bg-amber-500 hover:bg-amber-600 h-16"
        >
          ⚠️ تحذير
        </Button>

        <Button 
          onClick={showInfo}
          className="bg-blue-500 hover:bg-blue-600 h-16"
        >
          ℹ️ معلومة
        </Button>

        <Button 
          onClick={showDescriptionOnly}
          className="bg-purple-500 hover:bg-purple-600 h-16"
        >
          📝 بدون عنوان
        </Button>

        <Button 
          onClick={showLongDuration}
          className="bg-indigo-500 hover:bg-indigo-600 h-16"
        >
          ⏱️ مدة طويلة (10ث)
        </Button>

        <Button 
          onClick={showPermanent}
          className="bg-orange-500 hover:bg-orange-600 h-16 col-span-full"
        >
          🚫 بدون إغلاق تلقائي
        </Button>
      </div>

      <div className="mt-12 p-6 bg-blue-50 dark:bg-blue-900/20 rounded-xl">
        <h3 className="font-bold text-lg mb-4">📌 ملاحظات مهمة:</h3>
        <ul className="space-y-2 text-sm">
          <li>✅ <strong>الإغلاق التلقائي:</strong> كل Toast يختفي بعد المدة المحددة</li>
          <li>✅ <strong>زر الإغلاق:</strong> زر X في الزاوية اليسرى العليا يعمل دائماً</li>
          <li>✅ <strong>الألوان الناعمة:</strong> تم استبدال الأصفر الفاقع بكهرماني ناعم</li>
          <li>✅ <strong>دعم RTL:</strong> التصميم مناسب تماماً للعربية</li>
          <li>✅ <strong>الوضع الداكن:</strong> يعمل تلقائياً مع Dark Mode</li>
        </ul>
      </div>
    </div>
  );
};


// 🎯 أمثلة واقعية من التطبيق

// مثال 1: في صفحة التعلم - عند حفظ كلمة
export const handleWordSave = (toast) => {
  toast({
    title: "تم الحفظ بنجاح!",
    description: "أحسنت، الكلمة أُضيفت إلى مراجعاتك.",
    variant: "success",
    duration: 3000
  });
};

// مثال 2: في صفحة الاختبار - إجابة صحيحة
export const handleCorrectAnswer = (toast) => {
  toast({
    description: "✅ إجابة صحيحة! +10 نقاط",
    variant: "success",
    duration: 2000
  });
};

// مثال 3: في صفحة الاختبار - إجابة خاطئة
export const handleWrongAnswer = (toast, correctAnswer) => {
  toast({
    title: "❌ إجابة خاطئة",
    description: `الإجابة الصحيحة: ${correctAnswer}`,
    variant: "destructive",
    duration: 4000
  });
};

// مثال 4: في صفحة المراجعة - تذكير
export const handleReviewReminder = (toast, count) => {
  toast({
    title: "📚 حان وقت المراجعة",
    description: `لديك ${count} كلمة في انتظار المراجعة`,
    variant: "info",
    duration: 5000
  });
};

// مثال 5: في صفحة الإنجازات - إنجاز جديد
export const handleNewAchievement = (toast, achievementName) => {
  toast({
    title: "🏆 إنجاز جديد!",
    description: `مبروك! حصلت على: ${achievementName}`,
    variant: "success",
    duration: 6000
  });
};

// مثال 6: في الإعدادات - حفظ ناجح
export const handleSettingsSave = (toast) => {
  toast({
    description: "تم حفظ الإعدادات بنجاح",
    variant: "success",
    duration: 2000
  });
};

// مثال 7: خطأ في الشبكة
export const handleNetworkError = (toast) => {
  toast({
    title: "⚠️ خطأ في الاتصال",
    description: "تحقق من اتصالك بالإنترنت",
    variant: "warning",
    duration: 5000
  });
};

// مثال 8: تحذير قبل حذف
export const handleDeleteWarning = (toast) => {
  toast({
    title: "⚠️ تأكيد الحذف",
    description: "هذا الإجراء لا يمكن التراجع عنه",
    variant: "warning",
    duration: 0  // لن يختفي حتى يقرر المستخدم
  });
};


export default ToastExamples;


/* 
 * 📊 جدول الأنواع والألوان
 * 
 * ┌──────────────┬────────────────────┬──────────────────┬─────────────┐
 * │ variant      │ اللون              │ الاستخدام        │ المدة       │
 * ├──────────────┼────────────────────┼──────────────────┼─────────────┤
 * │ success      │ أخضر ناعم          │ نجاح العمليات    │ 2-3 ثوانٍ   │
 * │ destructive  │ أحمر ناعم          │ أخطاء            │ 4-5 ثوانٍ   │
 * │ warning      │ كهرماني ناعم       │ تحذيرات          │ 4-5 ثوانٍ   │
 * │ info         │ أزرق ناعم          │ معلومات          │ 3-4 ثوانٍ   │
 * │ default      │ حسب الثيم          │ عام              │ 3 ثوانٍ     │
 * └──────────────┴────────────────────┴──────────────────┴─────────────┘
 * 
 * 💡 نصيحة: استخدم duration: 0 للإشعارات المهمة التي تحتاج تأكيد يدوي
 */

import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function Support() {
  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: "كلمات القرآن",
        text: "تعلّم كلمات القرآن الكريم بطريقة ممتعة وتفاعلية",
        url: window.location.origin,
      });
    }
  };

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-6">

      {/* Header */}
      <div className="text-center">
        <div className="text-6xl mb-3">💖</div>
        <h1 className="text-3xl font-bold text-foreground mb-2">ادعم التطبيق</h1>
        <p className="text-sm text-muted-foreground max-w-sm mx-auto leading-relaxed">
          تطبيق كلمات القرآن مجاني وسيظل كذلك.
          مساهمتك تساعدنا في الاستمرار وإضافة ميزات جديدة.
        </p>
      </div>

      {/* Donate Card */}
      <Card className="rounded-2xl border-2 border-blue-200 bg-blue-50">
        <CardContent className="p-6 text-center">
          <div className="text-5xl mb-3">🌱</div>
          <h2 className="text-xl font-bold text-foreground mb-2">تبرّع بمبلغ بسيط</h2>
          <p className="text-sm text-muted-foreground mb-5 leading-relaxed">
            كل تبرع، مهما كان صغيراً، يصنع فرقاً كبيراً.
            جزاكم الله خيراً وجعله في ميزان حسناتكم.
          </p>
          <Button
            className="w-full rounded-2xl font-bold text-base h-12 bg-[#0070BA] hover:bg-[#003087] text-white"
            onClick={() => window.open("https://www.paypal.com/ncp/payment/H5PSH6F7B7YF6", "_blank")}
          >
            💳 تبرّع عبر PayPal
          </Button>
        </CardContent>
      </Card>

      {/* Share Card */}
      <Card className="rounded-2xl border-2 border-green-200 bg-green-50">
        <CardContent className="p-6 text-center">
          <div className="text-5xl mb-3">🌍</div>
          <h2 className="text-xl font-bold text-foreground mb-2">انشر التطبيق</h2>
          <p className="text-sm text-muted-foreground mb-5 leading-relaxed">
            الدال على الخير كفاعله.
            شارك التطبيق مع أصدقائك وعائلتك.
          </p>
          <Button
            variant="outline"
            className="w-full rounded-2xl font-bold text-base h-12 border-2 border-green-300 hover:bg-green-100"
            onClick={handleShare}
          >
            📤 شارك التطبيق
          </Button>
        </CardContent>
      </Card>

      {/* Thank you */}
      <Card className="rounded-2xl border-2 border-amber-200 bg-gradient-to-l from-amber-50 to-yellow-50">
        <CardContent className="p-6 text-center">
          <div className="text-4xl mb-3">🏆</div>
          <h3 className="text-lg font-bold text-foreground mb-2">شكراً لداعمينا ❤️</h3>
          <p className="text-sm text-muted-foreground leading-relaxed">
            نسعى لإطلاق مسابقات قرآنية تحفّز على التدبر
            وتجعل التعلّم أقرب إلى القلوب.
          </p>
        </CardContent>
      </Card>

    </div>
  );
}

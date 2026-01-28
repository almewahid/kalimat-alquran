import React from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Heart, Globe, Trophy } from "lucide-react";
import { motion } from "framer-motion";

export default function Support() {
  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Card className="bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-950/30 dark:to-purple-950/30 border-2 border-indigo-100 dark:border-indigo-900 shadow-xl overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500" />
          
          <CardHeader className="text-center pt-12 pb-8">
            <div className="mx-auto bg-white dark:bg-gray-800 p-4 rounded-full shadow-lg w-20 h-20 flex items-center justify-center mb-6">
              <Heart className="w-10 h-10 text-red-500 fill-red-500 animate-pulse" />
            </div>
            <CardTitle className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600 mb-4">
              دعم التطبيق
            </CardTitle>
            <CardDescription className="text-lg max-w-2xl mx-auto">
              تطبيق كلمات القرآن مجاني وسيظل كذلك. مساهمتك تساعدنا في تغطية احتياجاتنا وتكاليف الخوادم وتطوير ميزات جديدة لخدمة كتاب الله.            </CardDescription>
          </CardHeader>

          <CardContent className="p-8">
            <div className="grid md:grid-cols-2 gap-8 mb-12">
              <Card className="bg-white dark:bg-gray-800 border-none shadow-md hover:shadow-lg transition-shadow">
                <CardContent className="p-6 text-center">
                  <div className="text-6xl mb-4">🌱</div>
                  <h3 className="text-xl font-bold mb-2">تبرع بمبلغ بسيط</h3>
                  <p className="text-muted-foreground mb-6">
ما نقوم به في كلمات القرآن ليس عملًا عابرًا، بل رسالة…
كل كلمة تُقرأ، وكل معنى يُفهم، هو لبنة في ميزان الحسنات.                  </p>
                  <Button 
                    className="w-full bg-[#0070BA] hover:bg-[#003087] text-white" 
                    onClick={() => window.open('https://www.paypal.com/ncp/payment/H5PSH6F7B7YF6', '_blank')}
                  >
                    تبرع عبر PayPal
                  </Button>
                </CardContent>
              </Card>

              <Card className="bg-white dark:bg-gray-800 border-none shadow-md hover:shadow-lg transition-shadow">
                <CardContent className="p-6 text-center">
                  <Globe className="w-12 h-12 text-green-500 mx-auto mb-4" />
                  <h3 className="text-xl font-bold mb-2">نشر التطبيق</h3>
                  <p className="text-muted-foreground mb-6">
                    الدال على الخير كفاعله. ساعدنا في نشر التطبيق بين أصدقائك وعائلتك.
                  </p>
                  <Button variant="outline" className="w-full" onClick={() => {
                    if (navigator.share) {
                      navigator.share({
                        title: 'كلمات القرآن',
                        text: 'تعلم كلمات القرآن الكريم بطريقة ممتعة وتفاعلية',
                        url: window.location.origin
                      });
                    }
                  }}>
                    مشاركة التطبيق
                  </Button>
                </CardContent>
              </Card>
            </div>

            <div className="bg-primary/5 rounded-2xl p-8 text-center">
              <h3 className="text-2xl font-bold text-primary mb-4">شكراً لداعمينا ❤️</h3>
              <p className="text-muted-foreground max-w-xl mx-auto mb-6">
                كل تبرع، مهما كان صغيراً، يصنع فرقاً كبيراً في استمرار هذه المنصة التعليمية.
                جزاكم الله خيراً وجعله في ميزان حسناتكم.
              </p>
              
              <div className="mt-6 bg-gradient-to-r from-purple-100 to-indigo-100 dark:from-purple-900/30 dark:to-indigo-900/30 rounded-xl p-6 border-2 border-purple-200 dark:border-purple-700">
                <div className="text-4xl mb-3">🏆</div>
                <p className="text-purple-900 dark:text-purple-100 font-medium leading-relaxed">
                  نسعى لإطلاق مسابقات قرآنية<br/>
                  تحفّز على التدبر، وتزيد الشغف، وتجعل التعلّم أقرب إلى القلوب.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
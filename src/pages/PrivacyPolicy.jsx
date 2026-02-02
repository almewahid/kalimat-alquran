import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield, Lock, Eye, UserCheck, Database, Globe } from "lucide-react";

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 dark:from-gray-900 dark:to-gray-800 p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <Shield className="w-16 h-16 mx-auto mb-4 text-primary" />
          <h1 className="text-4xl font-bold gradient-text mb-2">سياسة الخصوصية</h1>
          <p className="text-foreground/60">آخر تحديث: 2 فبراير 2026</p>
        </div>

        {/* Introduction */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <p className="text-lg leading-relaxed">
              نحن في تطبيق "كلمات القرآن" نلتزم بحماية خصوصيتك وأمان بياناتك. توضح هذه السياسة كيفية جمع واستخدام وحماية معلوماتك الشخصية.
            </p>
          </CardContent>
        </Card>

        {/* Data Collection */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="w-5 h-5" />
              البيانات التي نجمعها
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="font-semibold mb-2">1. معلومات الحساب الأساسية:</h3>
              <ul className="list-disc list-inside space-y-1 text-foreground/80">
                <li>البريد الإلكتروني</li>
                <li>الاسم الكامل</li>
                <li>صورة الملف الشخصي (اختياري)</li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold mb-2">2. بيانات التعلم والتقدم:</h3>
              <ul className="list-disc list-inside space-y-1 text-foreground/80">
                <li>الكلمات المتعلمة والمحفوظة</li>
                <li>نتائج الاختبارات والتقييمات</li>
                <li>سجل المراجعة وأوقات الدراسة</li>
                <li>الإنجازات والشارات المكتسبة</li>
                <li>النقاط والترتيب في لوحة المتصدرين</li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold mb-2">3. التفضيلات والإعدادات:</h3>
              <ul className="list-disc list-inside space-y-1 text-foreground/80">
                <li>تفضيلات الثيم والألوان</li>
                <li>إعدادات الإشعارات</li>
                <li>تفضيلات اللغة والخط</li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold mb-2">4. البيانات الاجتماعية (اختياري):</h3>
              <ul className="list-disc list-inside space-y-1 text-foreground/80">
                <li>قائمة الأصدقاء والمتابعين</li>
                <li>المجموعات المنضم إليها</li>
                <li>التحديات والمنافسات</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        {/* Data Usage */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserCheck className="w-5 h-5" />
              كيف نستخدم بياناتك
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3 text-foreground/80">
              <li className="flex items-start gap-2">
                <span className="text-primary mt-1">✓</span>
                <span>توفير وتحسين خدمات التطبيق</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary mt-1">✓</span>
                <span>تتبع تقدمك التعليمي وتقديم توصيات مخصصة</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary mt-1">✓</span>
                <span>إرسال إشعارات تذكيرية ومعلومات مهمة</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary mt-1">✓</span>
                <span>تمكين الميزات الاجتماعية والمنافسات</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary mt-1">✓</span>
                <span>تحليل الاستخدام لتحسين التطبيق</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary mt-1">✓</span>
                <span>الامتثال للالتزامات القانونية</span>
              </li>
            </ul>
          </CardContent>
        </Card>

        {/* Data Protection */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lock className="w-5 h-5" />
              حماية بياناتك
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3 text-foreground/80">
              <li className="flex items-start gap-2">
                <span className="text-primary mt-1">🔒</span>
                <span>تشفير جميع البيانات أثناء النقل والتخزين</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary mt-1">🔒</span>
                <span>استخدام خوادم آمنة ومحمية</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary mt-1">🔒</span>
                <span>نسخ احتياطي منتظم للبيانات</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary mt-1">🔒</span>
                <span>محدودية الوصول للبيانات (فقط للمخولين)</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary mt-1">🔒</span>
                <span>مراجعة أمنية دورية</span>
              </li>
            </ul>
          </CardContent>
        </Card>

        {/* Data Sharing */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="w-5 h-5" />
              مشاركة البيانات
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="mb-4 font-semibold text-lg">نحن لا نبيع أو نؤجر بياناتك الشخصية لأي طرف ثالث.</p>
            <p className="mb-2">قد نشارك بياناتك فقط في الحالات التالية:</p>
            <ul className="space-y-2 text-foreground/80">
              <li className="flex items-start gap-2">
                <span className="text-primary mt-1">•</span>
                <span>مع مزودي الخدمات الذين يساعدوننا في تشغيل التطبيق (مثل الاستضافة والتحليلات)</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary mt-1">•</span>
                <span>عند الحاجة للامتثال للقوانين أو الأوامر القانونية</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary mt-1">•</span>
                <span>في حالة دمج أو بيع الشركة (مع إخطارك مسبقاً)</span>
              </li>
            </ul>
          </CardContent>
        </Card>

        {/* User Rights */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Eye className="w-5 h-5" />
              حقوقك
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="mb-4">لديك الحق في:</p>
            <ul className="space-y-2 text-foreground/80">
              <li className="flex items-start gap-2">
                <span className="text-primary mt-1">✓</span>
                <span>الوصول إلى بياناتك الشخصية ومراجعتها</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary mt-1">✓</span>
                <span>تصحيح أو تحديث معلوماتك</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary mt-1">✓</span>
                <span>حذف حسابك وجميع بياناتك</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary mt-1">✓</span>
                <span>تصدير بياناتك</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary mt-1">✓</span>
                <span>الاعتراض على معالجة بياناتك</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary mt-1">✓</span>
                <span>سحب الموافقة في أي وقت</span>
              </li>
            </ul>
          </CardContent>
        </Card>

        {/* Children's Privacy */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>👶 خصوصية الأطفال</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-foreground/80">
              التطبيق مناسب لجميع الأعمار. بالنسبة للأطفال تحت 13 عاماً، نطلب موافقة ولي الأمر قبل جمع أي معلومات شخصية. نحن ملتزمون بحماية خصوصية الأطفال وفقاً للقوانين المعمول بها.
            </p>
          </CardContent>
        </Card>

        {/* Cookies & Tracking */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>🍪 ملفات تعريف الارتباط والتتبع</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-foreground/80 mb-3">
              نستخدم تقنيات مثل ملفات تعريف الارتباط والتخزين المحلي لـ:
            </p>
            <ul className="space-y-2 text-foreground/80">
              <li className="flex items-start gap-2">
                <span className="text-primary mt-1">•</span>
                <span>تذكر تفضيلاتك وإعداداتك</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary mt-1">•</span>
                <span>تحسين تجربة الاستخدام</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary mt-1">•</span>
                <span>تحليل استخدام التطبيق</span>
              </li>
            </ul>
            <p className="text-foreground/80 mt-3">
              يمكنك التحكم في ملفات تعريف الارتباط من خلال إعدادات المتصفح.
            </p>
          </CardContent>
        </Card>

        {/* Updates to Policy */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>📝 التحديثات على السياسة</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-foreground/80">
              قد نقوم بتحديث سياسة الخصوصية هذه من وقت لآخر. سنخطرك بأي تغييرات جوهرية عبر البريد الإلكتروني أو إشعار داخل التطبيق. يُعتبر استمرارك في استخدام التطبيق بعد التغييرات موافقة على السياسة المحدثة.
            </p>
          </CardContent>
        </Card>

        {/* Contact */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>📧 اتصل بنا</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-foreground/80 mb-4">
              إذا كان لديك أي أسئلة أو استفسارات حول سياسة الخصوصية أو بياناتك الشخصية، يرجى التواصل معنا:
            </p>
            <div className="bg-muted p-4 rounded-lg space-y-2">
              <p><strong>البريد الإلكتروني:</strong> support@kalimat-quran.com</p>
              <p><strong>الموقع:</strong> https://kalimat-allah.base44.app</p>
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center text-foreground/60 mt-8">
          <p className="text-sm">
            © 2026 كلمات القرآن. جميع الحقوق محفوظة.
          </p>
        </div>
      </div>
    </div>
  );
}
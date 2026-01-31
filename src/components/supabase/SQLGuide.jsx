import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Copy, CheckCircle2, Database, Shield, AlertTriangle } from "lucide-react";
import { motion } from "framer-motion";

export default function SQLGuide() {
  const [copiedIndex, setCopiedIndex] = useState(null);

  const copyToClipboard = (text, index) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const sqlScripts = [
    {
      title: "0️⃣ إنشاء RPC Function لـ Base44 Context",
      description: "ضروري لعمل RLS مع Base44 Auth",
      sql: `-- إنشاء الـ Function لضبط السياق
CREATE OR REPLACE FUNCTION set_user_context(p_user_id TEXT, p_user_email TEXT)
RETURNS void AS $$
BEGIN
  PERFORM set_config('app.current_user_id', p_user_id, false);
  PERFORM set_config('app.current_user_email', p_user_email, false);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- السماح لجميع المستخدمين باستدعاء هذه الـ Function
GRANT EXECUTE ON FUNCTION set_user_context TO authenticated, anon;`
    },
    {
      title: "1️⃣ إضافة حقل base44_user_id (للربط مع Base44)",
      description: "نضيف حقل جديد لتخزين معرف Base44 بجانب Supabase UUID",
      sql: `-- إضافة base44_user_id لجدول user_profiles
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS base44_user_id TEXT;
CREATE INDEX IF NOT EXISTS idx_user_profiles_base44_id ON user_profiles(base44_user_id);

-- إضافة base44_user_id للجداول الأخرى
ALTER TABLE user_progress ADD COLUMN IF NOT EXISTS base44_user_id TEXT;
ALTER TABLE favorite_words ADD COLUMN IF NOT EXISTS base44_user_id TEXT;
ALTER TABLE quiz_sessions ADD COLUMN IF NOT EXISTS base44_user_id TEXT;
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS base44_user_id TEXT;
ALTER TABLE flash_cards ADD COLUMN IF NOT EXISTS base44_user_id TEXT;
ALTER TABLE user_notes ADD COLUMN IF NOT EXISTS base44_user_id TEXT;

-- إنشاء indexes للأداء
CREATE INDEX IF NOT EXISTS idx_user_progress_base44_id ON user_progress(base44_user_id);
CREATE INDEX IF NOT EXISTS idx_favorite_words_base44_id ON favorite_words(base44_user_id);
CREATE INDEX IF NOT EXISTS idx_quiz_sessions_base44_id ON quiz_sessions(base44_user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_base44_id ON notifications(base44_user_id);`
    },
    {
      title: "2️⃣ إصلاح RLS: user_profiles (إزالة recursion)",
      description: "سياسات بسيطة وآمنة بدون استدعاء ذاتي",
      sql: `-- حذف السياسات القديمة
DROP POLICY IF EXISTS "Users can read own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON user_profiles;

-- سياسات جديدة بسيطة
CREATE POLICY "Users can read own profile"
ON user_profiles FOR SELECT
USING (user_id = auth.uid() OR base44_user_id = current_setting('app.current_user_id', true));

CREATE POLICY "Users can update own profile"
ON user_profiles FOR UPDATE
USING (user_id = auth.uid() OR base44_user_id = current_setting('app.current_user_id', true));

CREATE POLICY "Users can insert own profile"
ON user_profiles FOR INSERT
WITH CHECK (user_id = auth.uid() OR base44_user_id = current_setting('app.current_user_id', true));

-- تفعيل RLS
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;`
    },
    {
      title: "3️⃣ RLS: user_progress",
      description: "السماح للمستخدم بقراءة وتعديل تقدمه فقط",
      sql: `-- حذف السياسات القديمة
DROP POLICY IF EXISTS "Users can read own progress" ON user_progress;
DROP POLICY IF EXISTS "Users can insert own progress" ON user_progress;
DROP POLICY IF EXISTS "Users can update own progress" ON user_progress;

-- سياسات جديدة
CREATE POLICY "Users can read own progress"
ON user_progress FOR SELECT
USING (
  user_id = auth.uid() OR 
  base44_user_id = current_setting('app.current_user_id', true) OR
  user_email = current_setting('app.current_user_email', true)
);

CREATE POLICY "Users can insert own progress"
ON user_progress FOR INSERT
WITH CHECK (
  user_id = auth.uid() OR 
  base44_user_id = current_setting('app.current_user_id', true)
);

CREATE POLICY "Users can update own progress"
ON user_progress FOR UPDATE
USING (
  user_id = auth.uid() OR 
  base44_user_id = current_setting('app.current_user_id', true) OR
  user_email = current_setting('app.current_user_email', true)
);

ALTER TABLE user_progress ENABLE ROW LEVEL SECURITY;`
    },
    {
      title: "4️⃣ RLS: favorite_words, quiz_sessions, notifications",
      description: "نفس المنطق للجداول الأخرى",
      sql: `-- favorite_words
DROP POLICY IF EXISTS "Users can manage own favorites" ON favorite_words;
CREATE POLICY "Users can manage own favorites"
ON favorite_words FOR ALL
USING (
  user_id = auth.uid() OR 
  base44_user_id = current_setting('app.current_user_id', true)
);
ALTER TABLE favorite_words ENABLE ROW LEVEL SECURITY;

-- quiz_sessions
DROP POLICY IF EXISTS "Users can manage own quizzes" ON quiz_sessions;
CREATE POLICY "Users can manage own quizzes"
ON quiz_sessions FOR ALL
USING (
  user_id = auth.uid() OR 
  base44_user_id = current_setting('app.current_user_id', true) OR
  user_email = current_setting('app.current_user_email', true)
);
ALTER TABLE quiz_sessions ENABLE ROW LEVEL SECURITY;

-- notifications
DROP POLICY IF EXISTS "Users can read own notifications" ON notifications;
CREATE POLICY "Users can read own notifications"
ON notifications FOR SELECT
USING (
  user_id = auth.uid() OR 
  base44_user_id = current_setting('app.current_user_id', true) OR
  user_email = current_setting('app.current_user_email', true)
);

CREATE POLICY "Users can update own notifications"
ON notifications FOR UPDATE
USING (
  user_id = auth.uid() OR 
  base44_user_id = current_setting('app.current_user_id', true)
);
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;`
    },
    {
      title: "5️⃣ الجداول العامة (بدون RLS)",
      description: "السماح للجميع بقراءة المحتوى القرآني",
      sql: `-- تعطيل RLS للجداول العامة
ALTER TABLE quranic_words DISABLE ROW LEVEL SECURITY;
ALTER TABLE quran_ayahs DISABLE ROW LEVEL SECURITY;
ALTER TABLE quran_tafsirs DISABLE ROW LEVEL SECURITY;
ALTER TABLE courses DISABLE ROW LEVEL SECURITY;
ALTER TABLE categories DISABLE ROW LEVEL SECURITY;
ALTER TABLE images DISABLE ROW LEVEL SECURITY;
ALTER TABLE audios DISABLE ROW LEVEL SECURITY;
ALTER TABLE landing_pages DISABLE ROW LEVEL SECURITY;

-- أو إضافة سياسة قراءة عامة (إذا كنت تريد إبقاء RLS مفعل)
CREATE POLICY "Anyone can read quran content"
ON quranic_words FOR SELECT
USING (true);

CREATE POLICY "Anyone can read ayahs"
ON quran_ayahs FOR SELECT
USING (true);`
    },
    {
      title: "6️⃣ Admin Policies",
      description: "السماح للمدراء بالوصول الكامل",
      sql: `-- المدراء لديهم وصول كامل لكل شيء
CREATE POLICY "Admins have full access to user_progress"
ON user_progress FOR ALL
USING (
  (SELECT role FROM user_profiles WHERE user_id = auth.uid()) = 'admin'
);

CREATE POLICY "Admins have full access to quiz_sessions"
ON quiz_sessions FOR ALL
USING (
  (SELECT role FROM user_profiles WHERE user_id = auth.uid()) = 'admin'
);

CREATE POLICY "Admins have full access to notifications"
ON notifications FOR ALL
USING (
  (SELECT role FROM user_profiles WHERE user_id = auth.uid()) = 'admin'
);`
    }
  ];

  return (
    <div className="space-y-6">
      <Card className="bg-orange-50 dark:bg-orange-900/20 border-orange-300">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-orange-800 dark:text-orange-300">
            <AlertTriangle className="w-5 h-5" />
            تعليمات مهمة
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-orange-900 dark:text-orange-200">
          <p>
            <strong>1.</strong> افتح Supabase Dashboard → SQL Editor
          </p>
          <p>
            <strong>2.</strong> انسخ كل SQL script وشغله بالترتيب
          </p>
          <p>
            <strong>3.</strong> تأكد من عدم وجود أخطاء قبل الانتقال للتالي
          </p>
          <p>
            <strong>4.</strong> بعد تطبيق كل السياسات، ارجع لصفحة TestRLS وشغل الاختبارات مرة أخرى
          </p>
        </CardContent>
      </Card>

      {sqlScripts.map((script, index) => (
        <motion.div
          key={index}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
        >
          <Card className="bg-card border-border">
            <CardHeader>
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <CardTitle className="text-lg mb-2 flex items-center gap-2">
                    <Database className="w-5 h-5 text-blue-600" />
                    {script.title}
                  </CardTitle>
                  <p className="text-sm text-foreground/70">
                    {script.description}
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => copyToClipboard(script.sql, index)}
                  className="shrink-0"
                >
                  {copiedIndex === index ? (
                    <>
                      <CheckCircle2 className="w-4 h-4 ml-2 text-green-600" />
                      تم النسخ
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4 ml-2" />
                      نسخ
                    </>
                  )}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <pre className="bg-gray-900 text-green-400 p-4 rounded-lg overflow-x-auto text-sm font-mono dir-ltr text-left">
                {script.sql}
              </pre>
            </CardContent>
          </Card>
        </motion.div>
      ))}

      <Card className="bg-green-50 dark:bg-green-900/20 border-green-300">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-green-800 dark:text-green-300">
            <CheckCircle2 className="w-5 h-5" />
            خطوات ما بعد التطبيق
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-green-900 dark:text-green-200">
          <p>✅ بعد تطبيق جميع السياسات:</p>
          <ol className="list-decimal mr-6 space-y-2">
            <li>ارجع لصفحة TestRLS وشغل الاختبارات</li>
            <li>يجب أن تنجح جميع الاختبارات</li>
            <li>جرب صفحات Supabase: Dashboard, Learn, Progress, Favorites</li>
            <li>تأكد من عدم وجود أخطاء runtime</li>
          </ol>
        </CardContent>
      </Card>
    </div>
  );
}
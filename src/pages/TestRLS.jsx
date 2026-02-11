import React, { useState } from "react";
import { supabaseClient } from "@/components/api/supabaseClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, XCircle, Loader2, Shield, AlertTriangle, Database } from "lucide-react";
import { motion } from "framer-motion";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import SQLGuide from "../components/supabase/SQLGuide";

export default function TestRLS() {
  const [user, setUser] = useState(null);
  const [testResults, setTestResults] = useState([]);
  const [isRunning, setIsRunning] = useState(false);

  const loadUser = async () => {
    const currentUser = await supabaseClient.supabase.auth.getUser();
    setUser(currentUser);
    return currentUser;
  };

  const runTests = async () => {
    setIsRunning(true);
    setTestResults([]);
    const results = [];

    try {
      const currentUser = await loadUser();
      
      if (!currentUser) {
        results.push({ 
          test: "🔐 تسجيل الدخول", 
          status: "error",
          error: "يجب تسجيل الدخول أولاً في Supabase",
          note: "⚠️ استخدم Base44 Auth حالياً - Supabase Auth غير مفعل بعد"
        });
        setTestResults(results);
        setIsRunning(false);
        return;
      }

      // ✅ Test 1: Read own user profile
      try {
        await supabaseClient.entities.User.filter({ base44_user_id: currentUser.id });
        results.push({ test: "قراءة ملف المستخدم الخاص", status: "success" });
      } catch (error) {
        results.push({ test: "قراءة ملف المستخدم الخاص", status: "error", error: error.message });
      }

      // ✅ Test 2: Create user progress
      try {
        const progressData = {
          base44_user_id: currentUser.id,
          user_email: currentUser.email,
          total_xp: 50,
          words_learned: 5,
          current_level: 1,
        };
        await supabaseClient.entities.UserProgress.create(progressData);
        results.push({ test: "إنشاء سجل تقدم", status: "success" });
      } catch (error) {
        results.push({ test: "إنشاء سجل تقدم", status: "error", error: error.message });
      }

      // ✅ Test 3: Read user progress
      try {
        await supabaseClient.entities.UserProgress.filter({ user_email: currentUser.email });
        results.push({ test: "قراءة سجل التقدم الخاص", status: "success" });
      } catch (error) {
        results.push({ test: "قراءة سجل التقدم الخاص", status: "error", error: error.message });
      }

      // ✅ Test 4: Create favorite word
      try {
        await supabaseClient.entities.FavoriteWord.create({ 
          base44_user_id: currentUser.id,
          user_email: currentUser.email,
          word_id: "test-word-123" 
        });
        results.push({ test: "إضافة كلمة للمفضلة", status: "success" });
      } catch (error) {
        results.push({ test: "إضافة كلمة للمفضلة", status: "error", error: error.message });
      }

      // ✅ Test 5: Read Quran content (public)
      try {
        const ayahs = await supabaseClient.entities.QuranAyah.list('-ayah_number', 5);
        results.push({ 
          test: "قراءة آيات القرآن (عامة)", 
          status: ayahs.length > 0 ? "success" : "warning",
          note: `تم جلب ${ayahs.length} آيات`
        });
      } catch (error) {
        results.push({ test: "قراءة آيات القرآن", status: "error", error: error.message });
      }

      // ✅ Test 6: Create quiz session
      try {
        await supabaseClient.entities.QuizSession.create({
          base44_user_id: currentUser.id,
          user_email: currentUser.email,
          score: 80,
          total_questions: 10,
          correct_answers: 8,
          xp_earned: 40,
          completion_time: 120
        });
        results.push({ test: "حفظ نتيجة اختبار", status: "success" });
      } catch (error) {
        results.push({ test: "حفظ نتيجة اختبار", status: "error", error: error.message });
      }

      // ✅ Test 7: Create notification
      try {
        await supabaseClient.entities.Notification.create({
          base44_user_id: currentUser.id,
          user_email: currentUser.email,
          notification_type: "system",
          title: "اختبار RLS",
          message: "هذا اختبار للتأكد من عمل RLS",
          icon: "🧪",
          is_read: false
        });
        results.push({ test: "إنشاء إشعار", status: "success" });
      } catch (error) {
        results.push({ test: "إنشاء إشعار", status: "error", error: error.message });
      }

      // ⛔ Test 8: Try reading another user's data (should FAIL)
      try {
        await supabaseClient.entities.UserProgress.filter({ 
          user_email: "another-user@example.com" 
        });
        results.push({ 
          test: "محاولة قراءة بيانات مستخدم آخر", 
          status: "warning",
          note: "⚠️ تم السماح بقراءة بيانات مستخدم آخر - RLS غير مفعل!"
        });
      } catch (error) {
        results.push({ 
          test: "محاولة قراءة بيانات مستخدم آخر", 
          status: "success",
          note: "✅ تم منع الوصول بنجاح - RLS يعمل!"
        });
      }

      // ✅ Test 9: Subscribe to realtime changes
      try {
        const unsubscribe = supabaseClient.entities.UserProgress.subscribe((event) => {
          console.log("Realtime event:", event);
        });
        
        results.push({ 
          test: "Realtime Subscriptions", 
          status: "success",
          note: "تم الاشتراك في التحديثات المباشرة"
        });
        
        // Cleanup
        setTimeout(() => unsubscribe(), 1000);
      } catch (error) {
        results.push({ 
          test: "Realtime Subscriptions", 
          status: "error", 
          error: error.message 
        });
      }

    } catch (error) {
      results.push({ 
        test: "خطأ عام", 
        status: "error", 
        error: error.message 
      });
    }

    setTestResults(results);
    setIsRunning(false);
  };

  const successCount = testResults.filter(r => r.status === "success").length;
  const errorCount = testResults.filter(r => r.status === "error").length;
  const warningCount = testResults.filter(r => r.status === "warning").length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-accent/5 p-4 md:p-6">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="mb-8">
            <h1 className="text-3xl font-bold gradient-text mb-2 flex items-center gap-2">
              <Shield className="w-8 h-8 text-blue-600" />
              اختبار وإصلاح RLS Policies
            </h1>
            <p className="text-foreground/70">
              اختبار شامل لصلاحيات الأمان + دليل SQL لإصلاح المشاكل
            </p>
            <Badge className="mt-2 bg-green-100 text-green-700 border-green-300">
              🟢 Supabase Security Test & Fix
            </Badge>
          </div>

          {user && (
            <Card className="mb-6 bg-blue-50 dark:bg-blue-900/20 border-blue-200">
              <CardContent className="p-4">
                <p className="text-sm">
                  <strong>المستخدم الحالي:</strong> {user.email}
                </p>
                <p className="text-sm">
                  <strong>الدور:</strong> {user.role}
                </p>
                {user._usingBase44Fallback && (
                  <p className="text-xs text-orange-600 mt-2">
                    ⚠️ يستخدم Base44 Auth حالياً - Supabase Auth غير مفعل
                  </p>
                )}
              </CardContent>
            </Card>
          )}

          <Tabs defaultValue="test" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="test" className="gap-2">
                <Shield className="w-4 h-4" />
                تشغيل الاختبارات
              </TabsTrigger>
              <TabsTrigger value="fix" className="gap-2">
                <Database className="w-4 h-4" />
                دليل الإصلاح (SQL)
              </TabsTrigger>
            </TabsList>

            <TabsContent value="test">
              <Card className="mb-6">
                <CardHeader>
                  <CardTitle>تشغيل الاختبارات</CardTitle>
                </CardHeader>
                <CardContent>
              <Button
                onClick={runTests}
                disabled={isRunning}
                size="lg"
                className="w-full gap-2"
              >
                {isRunning ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    جاري التشغيل...
                  </>
                ) : (
                  <>
                    <Shield className="w-5 h-5" />
                    ابدأ الاختبار
                  </>
                )}
              </Button>

              {testResults.length > 0 && (
                <div className="mt-6 grid grid-cols-3 gap-4">
                  <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                    <CheckCircle2 className="w-8 h-8 text-green-600 mx-auto mb-2" />
                    <p className="text-2xl font-bold text-green-900 dark:text-green-100">
                      {successCount}
                    </p>
                    <p className="text-sm text-green-700 dark:text-green-300">نجح</p>
                  </div>
                  <div className="text-center p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
                    <XCircle className="w-8 h-8 text-red-600 mx-auto mb-2" />
                    <p className="text-2xl font-bold text-red-900 dark:text-red-100">
                      {errorCount}
                    </p>
                    <p className="text-sm text-red-700 dark:text-red-300">فشل</p>
                  </div>
                  <div className="text-center p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                    <AlertTriangle className="w-8 h-8 text-yellow-600 mx-auto mb-2" />
                    <p className="text-2xl font-bold text-yellow-900 dark:text-yellow-100">
                      {warningCount}
                    </p>
                    <p className="text-sm text-yellow-700 dark:text-yellow-300">تحذير</p>
                  </div>
                </div>
              )}
                </CardContent>
              </Card>

              {testResults.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>نتائج الاختبار</CardTitle>
                  </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {testResults.map((result, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className={`p-4 rounded-lg border ${
                        result.status === "success"
                          ? "bg-green-50 dark:bg-green-900/20 border-green-200"
                          : result.status === "warning"
                          ? "bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200"
                          : "bg-red-50 dark:bg-red-900/20 border-red-200"
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        {result.status === "success" ? (
                          <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5" />
                        ) : result.status === "warning" ? (
                          <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5" />
                        ) : (
                          <XCircle className="w-5 h-5 text-red-600 mt-0.5" />
                        )}
                        <div className="flex-1">
                          <p className="font-medium">{result.test}</p>
                          {result.error && (
                            <p className="text-sm text-red-700 dark:text-red-300 mt-1">
                              {result.error}
                            </p>
                          )}
                          {result.note && (
                            <p className="text-sm mt-1 opacity-80">
                              {result.note}
                            </p>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="fix">
            <SQLGuide />
          </TabsContent>
        </Tabs>
        </motion.div>
      </div>
    </div>
  );
}
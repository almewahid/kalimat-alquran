import React, { useState, useEffect } from "react";
import { supabaseClient } from "@/components/api/supabaseClient";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";
import { Download, Trash2 } from "lucide-react";
import { motion } from "framer-motion";

const ACTIVITY_LABELS = {
  data_export:      "📥 تصدير البيانات",
  login:            "🔑 تسجيل دخول",
  logout:           "👋 تسجيل خروج",
  settings_update:  "⚙️ تحديث الإعدادات",
  profile_update:   "👤 تحديث الملف الشخصي",
  password_change:  "🔐 تغيير كلمة المرور",
  quiz_completed:   "🎯 اختبار مكتمل",
};

export default function PrivacySettings() {
  const { toast } = useToast();
  const [user, setUser] = useState(null);
  const [privacySettings, setPrivacySettings] = useState({
    hideRankFromOthers: false,
    hideProfileFromSearch: false,
    allowFriendRequests: true,
    showOnlineStatus: true,
    allowGroupInvites: true,
    shareProgressWithFriends: true
  });
  const [activityLog, setActivityLog] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    loadPrivacyData();
  }, []);

  const loadPrivacyData = async () => {
    try {
      const currentUser = await supabaseClient.auth.me();
      setUser(currentUser);

      if (currentUser.privacy_settings) {
        setPrivacySettings(prev => ({ ...prev, ...currentUser.privacy_settings }));
      }

      const logs = await supabaseClient.entities.ActivityLog.filter({
        user_email: currentUser.email
      }, '-created_date', 20);
      setActivityLog(logs);
    } catch (error) {
      console.error("Error loading privacy data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveSettings = async () => {
    try {
      await supabaseClient.auth.updateMe({
        privacy_settings: privacySettings
      });

      toast({
        title: "✅ تم الحفظ!",
        description: "تم حفظ إعدادات الخصوصية بنجاح.",
        className: "bg-green-100 text-green-800"
      });
    } catch (error) {
      console.error("Error saving privacy settings:", error);
      toast({
        title: "❌ خطأ",
        description: "فشل حفظ الإعدادات. حاول مرة أخرى.",
        variant: "destructive"
      });
    }
  };

  const handleExportData = async () => {
    try {
      const [progress, quizzes, notes, favorites] = await Promise.all([
        supabaseClient.entities.UserProgress.filter({ user_email: user.email }),
        supabaseClient.entities.QuizSession.filter({ user_email: user.email }),
        supabaseClient.entities.UserNote.filter({ user_email: user.email }),
        supabaseClient.entities.FavoriteWord.filter({ user_email: user.email })
      ]);

      const userData = {
        user: {
          email: user.email,
          full_name: user.full_name,
          created_date: user.created_date
        },
        progress,
        quizzes,
        notes,
        favorites,
        exportDate: new Date().toISOString()
      };

      const dataStr = JSON.stringify(userData, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(dataBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `my-quran-words-data-${new Date().toISOString().split('T')[0]}.json`;
      link.click();
      URL.revokeObjectURL(url);

      toast({
        title: "✅ تم التصدير!",
        description: "تم تصدير بياناتك بنجاح.",
        className: "bg-green-100 text-green-800"
      });

      await supabaseClient.entities.ActivityLog.create({
        user_email: user.email,
        activity_type: "data_export",
        description: "تم تصدير البيانات الشخصية",
        metadata: { exportDate: new Date().toISOString() }
      });
    } catch (error) {
      console.error("Error exporting data:", error);
      toast({
        title: "❌ خطأ",
        description: "فشل تصدير البيانات. حاول مرة أخرى.",
        variant: "destructive"
      });
    }
  };

  const handleDeleteAccount = async () => {
    try {
      const [progress, quizzes, notes, favorites, flashcards] = await Promise.all([
        supabaseClient.entities.UserProgress.filter({ user_email: user.email }),
        supabaseClient.entities.QuizSession.filter({ user_email: user.email }),
        supabaseClient.entities.UserNote.filter({ user_email: user.email }),
        supabaseClient.entities.FavoriteWord.filter({ user_email: user.email }),
        supabaseClient.entities.FlashCard.filter({ user_email: user.email })
      ]);

      await Promise.all([
        ...progress.map(p => supabaseClient.entities.UserProgress.delete(p.id)),
        ...quizzes.map(q => supabaseClient.entities.QuizSession.delete(q.id)),
        ...notes.map(n => supabaseClient.entities.UserNote.delete(n.id)),
        ...favorites.map(f => supabaseClient.entities.FavoriteWord.delete(f.id)),
        ...flashcards.map(f => supabaseClient.entities.FlashCard.delete(f.id))
      ]);

      toast({
        title: "✅ تم الحذف",
        description: "تم حذف حسابك وبياناتك بنجاح. سيتم تسجيل خروجك الآن.",
        className: "bg-green-100 text-green-800"
      });

      setTimeout(() => {
        supabaseClient.auth.logout();
      }, 2000);
    } catch (error) {
      console.error("Error deleting account:", error);
      setConfirmDelete(false);
      toast({
        title: "❌ خطأ",
        description: "فشل حذف الحساب. حاول مرة أخرى.",
        variant: "destructive"
      });
    }
  };

  if (isLoading) {
    return (
      <div className="p-6 flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <motion.div
          animate={{ scale: [1, 1.15, 1] }}
          transition={{ repeat: Infinity, duration: 1.4 }}
          className="text-6xl"
        >
          🔒
        </motion.div>
        <p className="text-lg font-semibold text-muted-foreground">جاري تحميل إعدادات الخصوصية...</p>
      </div>
    );
  }

  const PRIVACY_SWITCHES = [
    {
      id: "hideRankFromOthers",
      emoji: "👁️",
      label: "إخفاء ترتيبي عن الآخرين",
      description: "لن يظهر ترتيبك في لوحة الترتيب للآخرين",
    },
    {
      id: "hideProfileFromSearch",
      emoji: "🔍",
      label: "إخفاء ملفي الشخصي من البحث",
      description: "لن يتمكن الآخرون من العثور عليك في البحث",
    },
    {
      id: "allowFriendRequests",
      emoji: "👥",
      label: "السماح بطلبات الصداقة",
      description: "يمكن للآخرين إرسال طلبات صداقة لك",
    },
    {
      id: "showOnlineStatus",
      emoji: "🟢",
      label: "إظهار حالة الاتصال",
      description: "يظهر للأصدقاء ما إذا كنت متصلاً الآن",
    },
    {
      id: "allowGroupInvites",
      emoji: "🏘️",
      label: "السماح بدعوات المجموعات",
      description: "يمكن للآخرين دعوتك للانضمام لمجموعاتهم",
    },
    {
      id: "shareProgressWithFriends",
      emoji: "📊",
      label: "مشاركة التقدم مع الأصدقاء",
      description: "يمكن للأصدقاء رؤية تقدمك وإنجازاتك",
    },
  ];

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-6">

      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground mb-1">🔒 الخصوصية والأمان</h1>
        <p className="text-sm text-muted-foreground">تحكم في خصوصية معلوماتك</p>
      </div>

      {/* Privacy Settings Card */}
      <Card className="rounded-2xl border-2">
        <CardHeader>
          <CardTitle>🛡️ إعدادات الخصوصية</CardTitle>
          <CardDescription>تحكم في من يمكنه رؤية معلوماتك</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {PRIVACY_SWITCHES.map(sw => (
            <div key={sw.id} className="flex items-center justify-between gap-3 p-4 bg-muted/50 rounded-2xl">
              <Label htmlFor={sw.id} className="flex flex-col gap-1 flex-1 min-w-0 cursor-pointer">
                <span className="font-semibold flex items-center gap-2">
                  <span>{sw.emoji}</span>
                  {sw.label}
                </span>
                <span className="text-xs font-normal text-muted-foreground">{sw.description}</span>
              </Label>
              <Switch
                id={sw.id}
                checked={privacySettings[sw.id]}
                onCheckedChange={(checked) =>
                  setPrivacySettings({ ...privacySettings, [sw.id]: checked })
                }
              />
            </div>
          ))}

          <Button onClick={handleSaveSettings} className="w-full h-12 rounded-2xl font-bold mt-2">
            💾 حفظ إعدادات الخصوصية
          </Button>
        </CardContent>
      </Card>

      {/* Data Management Card */}
      <Card className="rounded-2xl border-2">
        <CardHeader>
          <CardTitle>📁 إدارة البيانات</CardTitle>
          <CardDescription>تصدير أو حذف بياناتك الشخصية</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert className="bg-blue-50 border-blue-200 rounded-2xl">
            <AlertDescription className="text-blue-800">
              <strong>📋 تصدير البيانات (GDPR):</strong> يمكنك تصدير جميع بياناتك في أي وقت. سيتم تنزيل ملف JSON يحتوي على كل معلوماتك.
            </AlertDescription>
          </Alert>

          <Button onClick={handleExportData} variant="outline" className="w-full gap-2 h-12 rounded-2xl font-bold border-2">
            <Download className="w-4 h-4" />
            📥 تصدير بياناتي الشخصية
          </Button>

          <div className="border-t pt-4 space-y-3">
            <Alert className="bg-red-50 border-red-200 rounded-2xl">
              <AlertDescription className="text-red-800">
                <strong>⚠️ حذف الحساب:</strong> سيتم حذف جميع بياناتك نهائياً. هذا الإجراء لا يمكن التراجع عنه.
              </AlertDescription>
            </Alert>

            {!confirmDelete ? (
              <Button
                onClick={() => setConfirmDelete(true)}
                variant="destructive"
                className="w-full gap-2 h-12 rounded-2xl font-bold"
              >
                <Trash2 className="w-4 h-4" />
                حذف حسابي نهائياً
              </Button>
            ) : (
              <div className="space-y-3 p-4 bg-red-50 rounded-2xl border-2 border-red-200">
                <p className="text-center font-bold text-red-700 text-base">🚨 هل أنت متأكد تماماً؟</p>
                <p className="text-center text-sm text-red-600">سيتم حذف جميع بياناتك نهائياً ولا يمكن التراجع!</p>
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    onClick={handleDeleteAccount}
                    variant="destructive"
                    className="rounded-2xl font-bold h-11"
                  >
                    نعم، احذف نهائياً
                  </Button>
                  <Button
                    onClick={() => setConfirmDelete(false)}
                    variant="outline"
                    className="rounded-2xl font-bold h-11 border-2"
                  >
                    إلغاء
                  </Button>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Activity Log Card */}
      <Card className="rounded-2xl border-2">
        <CardHeader>
          <CardTitle>🔐 سجل النشاط</CardTitle>
          <CardDescription>آخر 20 نشاط على حسابك</CardDescription>
        </CardHeader>
        <CardContent>
          {activityLog.length > 0 ? (
            <div className="space-y-3">
              {activityLog.map((log, index) => (
                <div key={index} className="p-4 bg-muted/50 rounded-2xl flex justify-between items-start gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-foreground text-sm">{log.description}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {new Date(log.created_date).toLocaleString('ar-EG')}
                    </p>
                  </div>
                  <Badge variant="outline" className="flex-shrink-0 text-xs rounded-xl">
                    {ACTIVITY_LABELS[log.activity_type] || `📋 ${log.activity_type}`}
                  </Badge>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 flex flex-col items-center gap-3">
              <span className="text-5xl">📋</span>
              <p className="font-semibold text-foreground/70">لا توجد أنشطة مسجلة حتى الآن</p>
            </div>
          )}
        </CardContent>
      </Card>

    </div>
  );
}

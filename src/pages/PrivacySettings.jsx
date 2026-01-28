import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";
import { Shield, Eye, EyeOff, Download, Trash2, Lock } from "lucide-react";
import { motion } from "framer-motion";

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

  useEffect(() => {
    loadPrivacyData();
  }, []);

  const loadPrivacyData = async () => {
    try {
      const currentUser = await base44.auth.me();
      setUser(currentUser);
      
      if (currentUser.privacy_settings) {
        setPrivacySettings(prev => ({ ...prev, ...currentUser.privacy_settings }));
      }
      
      const logs = await base44.entities.ActivityLog.filter({ 
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
      await base44.auth.updateMe({
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
        base44.entities.UserProgress.filter({ created_by: user.email }),
        base44.entities.QuizSession.filter({ created_by: user.email }),
        base44.entities.UserNote.filter({ created_by: user.email }),
        base44.entities.FavoriteWord.filter({ created_by: user.email })
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
      
      await base44.entities.ActivityLog.create({
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
    const confirmed = window.confirm(
      "⚠️ تحذير: هل أنت متأكد من حذف حسابك؟ هذا الإجراء لا يمكن التراجع عنه."
    );
    
    if (!confirmed) return;
    
    const doubleConfirm = window.confirm(
      "🚨 تأكيد نهائي: سيتم حذف جميع بياناتك نهائياً. هل أنت متأكد؟"
    );
    
    if (!doubleConfirm) return;
    
    try {
      const [progress, quizzes, notes, favorites, flashcards] = await Promise.all([
        base44.entities.UserProgress.filter({ created_by: user.email }),
        base44.entities.QuizSession.filter({ created_by: user.email }),
        base44.entities.UserNote.filter({ created_by: user.email }),
        base44.entities.FavoriteWord.filter({ created_by: user.email }),
        base44.entities.FlashCard.filter({ created_by: user.email })
      ]);
      
      await Promise.all([
        ...progress.map(p => base44.entities.UserProgress.delete(p.id)),
        ...quizzes.map(q => base44.entities.QuizSession.delete(q.id)),
        ...notes.map(n => base44.entities.UserNote.delete(n.id)),
        ...favorites.map(f => base44.entities.FavoriteWord.delete(f.id)),
        ...flashcards.map(f => base44.entities.FlashCard.delete(f.id))
      ]);
      
      toast({
        title: "✅ تم الحذف",
        description: "تم حذف حسابك وبياناتك بنجاح. سيتم تسجيل خروجك الآن.",
        className: "bg-green-100 text-green-800"
      });
      
      setTimeout(() => {
        base44.auth.logout();
      }, 2000);
    } catch (error) {
      console.error("Error deleting account:", error);
      toast({
        title: "❌ خطأ",
        description: "فشل حذف الحساب. حاول مرة أخرى.",
        variant: "destructive"
      });
    }
  };

  if (isLoading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center gap-3 mb-8">
          <Shield className="w-10 h-10 text-primary" />
          <div>
            <h1 className="text-3xl font-bold gradient-text">🔒 الخصوصية والأمان</h1>
            <p className="text-foreground/70">تحكم في خصوصية معلوماتك</p>
          </div>
        </div>

        <Card className="mb-8">
          <CardHeader>
            <CardTitle>إعدادات الخصوصية</CardTitle>
            <CardDescription>تحكم في من يمكنه رؤية معلوماتك</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <Label htmlFor="hideRank" className="flex flex-col gap-1">
                <span className="flex items-center gap-2">
                  <EyeOff className="w-4 h-4" />
                  إخفاء ترتيبي عن الآخرين
                </span>
                <span className="text-xs font-normal text-foreground/60">
                  لن يظهر ترتيبك في لوحة الترتيب للآخرين
                </span>
              </Label>
              <Switch
                id="hideRank"
                checked={privacySettings.hideRankFromOthers}
                onCheckedChange={(checked) => 
                  setPrivacySettings({ ...privacySettings, hideRankFromOthers: checked })
                }
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="hideProfile" className="flex flex-col gap-1">
                <span className="flex items-center gap-2">
                  <Eye className="w-4 h-4" />
                  إخفاء ملفي الشخصي من البحث
                </span>
                <span className="text-xs font-normal text-foreground/60">
                  لن يتمكن الآخرون من العثور عليك في البحث
                </span>
              </Label>
              <Switch
                id="hideProfile"
                checked={privacySettings.hideProfileFromSearch}
                onCheckedChange={(checked) => 
                  setPrivacySettings({ ...privacySettings, hideProfileFromSearch: checked })
                }
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="friendRequests" className="flex flex-col gap-1">
                <span>السماح بطلبات الصداقة</span>
                <span className="text-xs font-normal text-foreground/60">
                  يمكن للآخرين إرسال طلبات صداقة لك
                </span>
              </Label>
              <Switch
                id="friendRequests"
                checked={privacySettings.allowFriendRequests}
                onCheckedChange={(checked) => 
                  setPrivacySettings({ ...privacySettings, allowFriendRequests: checked })
                }
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="onlineStatus" className="flex flex-col gap-1">
                <span>إظهار حالة الاتصال</span>
                <span className="text-xs font-normal text-foreground/60">
                  يظهر للأصدقاء ما إذا كنت متصلاً الآن
                </span>
              </Label>
              <Switch
                id="onlineStatus"
                checked={privacySettings.showOnlineStatus}
                onCheckedChange={(checked) => 
                  setPrivacySettings({ ...privacySettings, showOnlineStatus: checked })
                }
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="groupInvites" className="flex flex-col gap-1">
                <span>السماح بدعوات المجموعات</span>
                <span className="text-xs font-normal text-foreground/60">
                  يمكن للآخرين دعوتك للانضمام لمجموعاتهم
                </span>
              </Label>
              <Switch
                id="groupInvites"
                checked={privacySettings.allowGroupInvites}
                onCheckedChange={(checked) => 
                  setPrivacySettings({ ...privacySettings, allowGroupInvites: checked })
                }
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="shareProgress" className="flex flex-col gap-1">
                <span>مشاركة التقدم مع الأصدقاء</span>
                <span className="text-xs font-normal text-foreground/60">
                  يمكن للأصدقاء رؤية تقدمك وإنجازاتك
                </span>
              </Label>
              <Switch
                id="shareProgress"
                checked={privacySettings.shareProgressWithFriends}
                onCheckedChange={(checked) => 
                  setPrivacySettings({ ...privacySettings, shareProgressWithFriends: checked })
                }
              />
            </div>

            <Button onClick={handleSaveSettings} className="w-full">
              حفظ إعدادات الخصوصية
            </Button>
          </CardContent>
        </Card>

        <Card className="mb-8">
          <CardHeader>
            <CardTitle>إدارة البيانات</CardTitle>
            <CardDescription>تصدير أو حذف بياناتك الشخصية</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert className="bg-blue-50 border-blue-200">
              <AlertDescription className="text-blue-800">
                <strong>📋 تصدير البيانات (GDPR):</strong> يمكنك تصدير جميع بياناتك في أي وقت. سيتم تنزيل ملف JSON يحتوي على كل معلوماتك.
              </AlertDescription>
            </Alert>

            <Button onClick={handleExportData} variant="outline" className="w-full gap-2">
              <Download className="w-4 h-4" />
              تصدير بياناتي الشخصية
            </Button>

            <Alert className="bg-red-50 border-red-200 mt-6">
              <AlertDescription className="text-red-800">
                <strong>⚠️ حذف الحساب:</strong> سيتم حذف جميع بياناتك نهائياً. هذا الإجراء لا يمكن التراجع عنه.
              </AlertDescription>
            </Alert>

            <Button onClick={handleDeleteAccount} variant="destructive" className="w-full gap-2">
              <Trash2 className="w-4 h-4" />
              حذف حسابي نهائياً
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lock className="w-5 h-5" />
              سجل النشاط
            </CardTitle>
            <CardDescription>آخر 20 نشاط على حسابك</CardDescription>
          </CardHeader>
          <CardContent>
            {activityLog.length > 0 ? (
              <div className="space-y-3">
                {activityLog.map((log, index) => (
                  <div key={index} className="p-4 bg-background-soft rounded-lg border border-border">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-medium text-foreground">{log.description}</p>
                        <p className="text-xs text-foreground/60 mt-1">
                          {new Date(log.created_date).toLocaleString('ar-EG')}
                        </p>
                      </div>
                      <Badge variant="outline">{log.activity_type}</Badge>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-foreground/70 text-center py-8">
                لا توجد أنشطة مسجلة حتى الآن
              </p>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
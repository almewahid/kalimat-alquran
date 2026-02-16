import React, { useEffect, useState } from "react";
import { supabaseClient } from "@/components/api/supabaseClient";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Download, X, AlertCircle } from "lucide-react";

const CURRENT_APP_VERSION = "1.0.0"; // تحديث هذا الرقم عند كل إصدار جديد

export default function AppUpdateChecker() {
  const [showUpdateDialog, setShowUpdateDialog] = useState(false);
  const [latestVersion, setLatestVersion] = useState(null);
  const [updateMessage, setUpdateMessage] = useState("");

  useEffect(() => {
    checkForUpdates();
  }, []);

  const checkForUpdates = async () => {
    try {
      const user = await supabaseClient.auth.me();
      if (!user) return;

      // التحقق من النسخة المخزنة للمستخدم
      let userVersions = await supabaseClient.entities.AppUsersVersion.filter({
        user_email: user.email
      });

      const userVersion = userVersions[0]?.app_version || "0.0.0";

      // مقارنة النسخ
      if (compareVersions(CURRENT_APP_VERSION, userVersion) > 0) {
        // يوجد تحديث
        setLatestVersion(CURRENT_APP_VERSION);
        setUpdateMessage(`نسخة جديدة متاحة: ${CURRENT_APP_VERSION}`);
        setShowUpdateDialog(true);
      } else if (userVersion !== CURRENT_APP_VERSION) {
        // تحديث سجل المستخدم إلى النسخة الحالية
        await updateUserVersion(user.email);
      }
    } catch (error) {
      console.error("Error checking for updates:", error);
    }
  };

  const compareVersions = (v1, v2) => {
    const parts1 = v1.split('.').map(Number);
    const parts2 = v2.split('.').map(Number);
    
    for (let i = 0; i < 3; i++) {
      if (parts1[i] > parts2[i]) return 1;
      if (parts1[i] < parts2[i]) return -1;
    }
    return 0;
  };

  const updateUserVersion = async (email) => {
    try {
      const existing = await supabaseClient.entities.AppUsersVersion.filter({
        user_email: email
      });

      const deviceInfo = `${navigator.platform} - ${navigator.userAgent.substring(0, 100)}`;

      if (existing.length > 0) {
        await supabaseClient.entities.AppUsersVersion.update(existing[0].id, {
          app_version: CURRENT_APP_VERSION,
          device_info: deviceInfo,
          updated_date: new Date().toISOString()
        });
      } else {
        await supabaseClient.entities.AppUsersVersion.create({
          user_email: email,
          app_version: CURRENT_APP_VERSION,
          platform: "web",
          device_info: deviceInfo
        });
      }
    } catch (error) {
      console.error("Error updating version:", error);
    }
  };

  const handleUpdate = async () => {
    try {
      const user = await supabaseClient.auth.me();
      await updateUserVersion(user.email);
      
      // إعادة تحميل الصفحة للحصول على آخر تحديث
      window.location.reload();
    } catch (error) {
      console.error("Error updating app:", error);
    }
  };

  const handleSkip = async () => {
    setShowUpdateDialog(false);
    
    // تسجيل أن المستخدم تخطى التحديث
    try {
      const user = await supabaseClient.auth.me();
      localStorage.setItem(`skipped_update_${CURRENT_APP_VERSION}`, user.email);
    } catch (error) {
      console.error("Error:", error);
    }
  };

  return (
    <Dialog open={showUpdateDialog} onOpenChange={setShowUpdateDialog}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-primary">
            <Download className="w-6 h-6" />
            تحديث متاح!
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <Alert className="bg-blue-50 dark:bg-blue-900/20 border-blue-200">
            <AlertCircle className="w-5 h-5 text-blue-600" />
            <AlertDescription className="text-blue-800 dark:text-blue-300">
              <div className="font-bold mb-2">{updateMessage}</div>
              <p className="text-sm">
                يتوفر إصدار جديد من التطبيق مع تحسينات ومميزات جديدة.
              </p>
            </AlertDescription>
          </Alert>

          <div className="text-sm text-foreground/70 space-y-2">
            <p className="font-semibold">✨ ما الجديد:</p>
            <ul className="list-disc list-inside space-y-1 pr-4">
              <li>تحسينات في الأداء</li>
              <li>إصلاح مشاكل معروفة</li>
              <li>مميزات جديدة</li>
            </ul>
          </div>
        </div>

        <DialogFooter className="flex gap-2">
          <Button
            variant="outline"
            onClick={handleSkip}
            className="gap-2"
          >
            <X className="w-4 h-4" />
            لاحقاً
          </Button>
          <Button
            onClick={handleUpdate}
            className="bg-primary hover:bg-primary/90 gap-2"
          >
            <Download className="w-4 h-4" />
            تحديث الآن
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
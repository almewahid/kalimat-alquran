import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Bell, Clock, Flame, Trophy, Users, Zap, CheckCircle, Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import { useToast } from "@/components/ui/use-toast";

/**
 * 🔔 صفحة إدارة الإشعارات الذكية (Notification Manager)
 * 
 * 📍 أين تظهر: من الإعدادات → "إشعاراتي" أو صفحة مستقلة
 * 🕐 متى تظهر: دائماً متاحة
 * 👥 لمن: جميع المستخدمين المسجلين
 * 💡 الفكرة: التحكم الكامل في الإشعارات الذكية والتذكيرات
 */

export default function NotificationManager() {
  const { toast } = useToast();
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  
  const [settings, setSettings] = useState({
    // Daily Review Reminder
    daily_review_enabled: true,
    daily_review_time: "20:00",
    
    // Flashcard Review Reminder
    flashcard_reminder_enabled: true,
    flashcard_reminder_hours_before: 2,
    
    // Streak Warning
    streak_warning_enabled: true,
    streak_warning_time: "22:00",
    
    // Group Challenge Notification
    group_challenge_enabled: true,
    
    // Leaderboard Change Notification
    leaderboard_change_enabled: true,
    
    // Achievement Notifications
    achievement_notifications_enabled: true,
    
    // Friend Request Notifications
    friend_request_enabled: true
  });

  useEffect(() => {
    loadNotificationSettings();
  }, []);

  const loadNotificationSettings = async () => {
    try {
      const currentUser = await base44.auth.me();
      setUser(currentUser);

      if (currentUser.notification_settings) {
        setSettings(prev => ({ ...prev, ...currentUser.notification_settings }));
      }

    } catch (error) {
      console.error("Error loading notification settings:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const saveSettings = async () => {
    setIsSaving(true);
    try {
      await base44.auth.updateMe({
        notification_settings: settings
      });

      toast({
        title: "✅ تم الحفظ!",
        description: "تم حفظ إعدادات الإشعارات بنجاح",
        className: "bg-green-100 text-green-800"
      });

      // Setup scheduled notifications
      await setupScheduledNotifications();

    } catch (error) {
      console.error("Error saving notification settings:", error);
      toast({
        title: "❌ خطأ",
        description: "حدث خطأ أثناء الحفظ",
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };

  const setupScheduledNotifications = async () => {
    // هنا يمكن إضافة منطق لإعداد الإشعارات المجدولة
    // في بيئة إنتاج حقيقية، ستحتاج إلى خدمة خلفية لإرسال الإشعارات
    console.log("Setting up scheduled notifications with:", settings);
  };

  const handleToggle = (key) => {
    setSettings(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleTimeChange = (key, value) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  if (isLoading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-screen">
        <Loader2 className="w-12 h-12 animate-spin text-primary" />
      </div>
    );
  }

  const notificationTypes = [
    {
      id: "daily_review",
      icon: Clock,
      title: "تذكير المراجعة اليومية",
      description: "تلقي تذكير يومي في وقت محدد للمراجعة",
      enabledKey: "daily_review_enabled",
      timeKey: "daily_review_time",
      hasTime: true,
      color: "blue"
    },
    {
      id: "flashcard_reminder",
      icon: Zap,
      title: "تذكير مراجعة البطاقات",
      description: "إشعار عند اقتراب موعد مراجعة كلمة (قبل ساعتين)",
      enabledKey: "flashcard_reminder_enabled",
      color: "purple"
    },
    {
      id: "streak_warning",
      icon: Flame,
      title: "تحذير انقطاع السلسلة",
      description: "تذكير إذا لم تسجل دخول اليوم (في المساء)",
      enabledKey: "streak_warning_enabled",
      timeKey: "streak_warning_time",
      hasTime: true,
      color: "orange"
    },
    {
      id: "group_challenge",
      icon: Users,
      title: "تحديات المجموعة",
      description: "إشعار عند إنشاء تحدي جديد في مجموعتك",
      enabledKey: "group_challenge_enabled",
      color: "green"
    },
    {
      id: "leaderboard_change",
      icon: Trophy,
      title: "تغييرات الترتيب",
      description: "إشعار عند تجاوزك في الترتيب أو تجاوز أحد لك",
      enabledKey: "leaderboard_change_enabled",
      color: "amber"
    },
    {
      id: "achievement",
      icon: CheckCircle,
      title: "الإنجازات",
      description: "إشعار فوري عند الحصول على إنجاز جديد",
      enabledKey: "achievement_notifications_enabled",
      color: "emerald"
    },
    {
      id: "friend_request",
      icon: Users,
      title: "طلبات الصداقة",
      description: "إشعار عند تلقي طلب صداقة جديد",
      enabledKey: "friend_request_enabled",
      color: "pink"
    }
  ];

  const getColorClasses = (color) => {
    const colors = {
      blue: "text-blue-500",
      purple: "text-purple-500",
      orange: "text-orange-500",
      green: "text-green-500",
      amber: "text-amber-500",
      emerald: "text-emerald-500",
      pink: "text-pink-500"
    };
    return colors[color] || "text-primary";
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
        <div className="text-center mb-8">
          <Bell className="w-16 h-16 text-primary mx-auto mb-4" />
          <h1 className="text-3xl font-bold gradient-text mb-2">إدارة الإشعارات</h1>
          <p className="text-foreground/70">تحكم في التنبيهات والتذكيرات الذكية</p>
        </div>

        <Alert className="mb-6 bg-blue-50 border-blue-200">
          <AlertDescription className="text-sm text-blue-800">
            💡 الإشعارات الذكية تساعدك على الاستمرار والتحسن! يمكنك تخصيص كل نوع حسب احتياجاتك.
          </AlertDescription>
        </Alert>

        <div className="space-y-4 mb-8">
          {notificationTypes.map((type, index) => (
            <motion.div
              key={type.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <Card className="bg-card shadow-md">
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <div className={`w-12 h-12 rounded-full bg-${type.color}-100 flex items-center justify-center flex-shrink-0`}>
                      <type.icon className={`w-6 h-6 ${getColorClasses(type.color)}`} />
                    </div>

                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-bold text-foreground">{type.title}</h3>
                        <Switch
                          checked={settings[type.enabledKey]}
                          onCheckedChange={() => handleToggle(type.enabledKey)}
                        />
                      </div>
                      <p className="text-sm text-foreground/70">{type.description}</p>

                      {type.hasTime && settings[type.enabledKey] && (
                        <div className="mt-4 flex items-center gap-2">
                          <Label htmlFor={`${type.id}-time`} className="text-sm">الوقت:</Label>
                          <Input
                            id={`${type.id}-time`}
                            type="time"
                            value={settings[type.timeKey]}
                            onChange={(e) => handleTimeChange(type.timeKey, e.target.value)}
                            className="w-32"
                          />
                        </div>
                      )}

                      {settings[type.enabledKey] && (
                        <Badge className="mt-3 bg-green-100 text-green-700 border-transparent">
                          مفعّل
                        </Badge>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        <Card className="bg-primary/5 border-primary/20">
          <CardContent className="p-6">
            <h3 className="font-bold mb-3 flex items-center gap-2">
              <Zap className="w-5 h-5 text-primary" />
              كيف تعمل الإشعارات الذكية؟
            </h3>
            <ul className="text-sm space-y-2 text-foreground/80">
              <li className="flex items-start gap-2">
                <span className="text-primary">•</span>
                <span><strong>تذكير المراجعة:</strong> يُرسل في الوقت المحدد يومياً لتذكيرك بالمراجعة</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary">•</span>
                <span><strong>مراجعة البطاقات:</strong> يُرسل قبل موعد مراجعة الكلمة بساعتين (نظام SRS)</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary">•</span>
                <span><strong>تحذير السلسلة:</strong> يُرسل في المساء إذا لم تسجل دخول اليوم</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary">•</span>
                <span><strong>تحديات المجموعة:</strong> يُرسل فوراً عند إنشاء تحدي جديد</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary">•</span>
                <span><strong>الترتيب:</strong> يُرسل عند تغيير ترتيبك (صعود أو هبوط)</span>
              </li>
            </ul>
          </CardContent>
        </Card>

        <div className="mt-8 flex justify-center">
          <Button
            onClick={saveSettings}
            disabled={isSaving}
            size="lg"
            className="w-full md:w-auto min-w-[200px]"
          >
            {isSaving ? (
              <><Loader2 className="w-5 h-5 ml-2 animate-spin" />جارٍ الحفظ...</>
            ) : (
              <><CheckCircle className="w-5 h-5 ml-2" />حفظ الإعدادات</>
            )}
          </Button>
        </div>
      </motion.div>
    </div>
  );
}
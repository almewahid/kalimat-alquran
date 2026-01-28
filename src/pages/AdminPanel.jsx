import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Shield, Users, Bell, Trophy, ShoppingBag, Calendar,
  Send, Plus, Edit, Trash2, Eye, Loader2, AlertTriangle,
  BarChart3, Settings, Package, Clock, Zap, Play, BookOpen, Award, ExternalLink // Added Award, ExternalLink
} from "lucide-react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { useToast } from "@/components/ui/use-toast";
import { SmartNotificationSystem } from "../components/notifications/SmartNotificationSystem"; // Added SmartNotificationSystem import

/**
 * 🛡️ لوحة تحكم الإدارة (Admin Panel)
 *
 * 📍 أين تظهر: رابط مباشر للمسؤولين فقط
 * 🕐 متى تظهر: دائماً متاحة للمسؤولين
 * 👥 لمن: المسؤولين فقط (role === 'admin')
 * 💡 الفكرة: التحكم الكامل في التطبيق - إشعارات، تحديات، متجر، مستخدمين، تحليلات
 */

export default function AdminPanel() {
  const { toast } = useToast();
  const [user, setUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Stats
  const [totalUsers, setTotalUsers] = useState(0);
  const [totalWords, setTotalWords] = useState(0);
  const [totalChallenges, setTotalChallenges] = useState(0);
  const [totalGroups, setTotalGroups] = useState(0);
  const [totalCourses, setTotalCourses] = useState(0);
  const [totalCertificates, setTotalCertificates] = useState(0);

  // Notification Form (for manual sending)
  const [notificationForm, setNotificationForm] = useState({
    notification_type: "announcement",
    title: "",
    message: "",
    icon: "📢",
    target_type: "all", // all, specific_user, user_level, group
    target_value: "",
    action_url: ""
  });

  // Challenge Management
  const [challenges, setChallenges] = useState([]);
  const [challengeForm, setChallengeForm] = useState({
    challenge_date: new Date().toISOString().split('T')[0],
    challenge_title: "",
    challenge_description: "",
    challenge_type: "learn_words",
    goal_value: 10,
    reward_xp: 50,
    reward_gems: 10
  });

  // Shop Management (Form not fully implemented in UI yet)
  const [shopItems, setShopItems] = useState([]);
  const [shopForm, setShopForm] = useState({
    item_type: "theme",
    item_name: "",
    item_price: 100,
    item_icon: "🎨",
    item_description: ""
  });

  // Users Management
  const [allUsers, setAllUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [userSearchTerm, setUserSearchTerm] = useState("");

  // NEW: Smart Notification Scheduler
  const [notificationSchedule, setNotificationSchedule] = useState({
    daily_review_time: "09:00",
    enabled: true
  });

  useEffect(() => {
    checkAdminAndLoadData();
  }, []);

  const checkAdminAndLoadData = async () => {
    try {
      const currentUser = await base44.auth.me();
      setUser(currentUser);

      if (currentUser.role !== 'admin') {
        setIsAdmin(false);
        setIsLoading(false);
        return;
      }

      setIsAdmin(true);

      // Load all data
      // تحميل البيانات الأساسية
      const [users, words, dailyChallenges, groups] = await Promise.all([
        base44.entities.User.list(),
        base44.entities.QuranicWord.list(),
        base44.entities.DailyChallenge.list(),
        base44.entities.Group.list()
      ]);

      setTotalUsers(users.length);
      setTotalWords(words.length);
      setTotalChallenges(dailyChallenges.length);
      setTotalGroups(groups.length);

      // تحميل الدورات والشهادات بشكل منفصل
      try {
        const courses = await base44.entities.Course.list();
        setTotalCourses(courses.length);
      } catch (courseError) { console.warn("Could not load courses:", courseError); }

      try {
        const certs = await base44.entities.Certificate.list();
        setTotalCertificates(certs.length);
      } catch (certError) { console.warn("Could not load certificates:", certError); }

      setAllUsers(users);
      setFilteredUsers(users);
      // Sort challenges by date descending for display
      setChallenges(dailyChallenges.sort((a, b) => new Date(b.challenge_date).getTime() - new Date(a.challenge_date).getTime()));

      // Load Smart Notification Scheduler settings if available from admin user preferences
      if (currentUser.admin_notification_scheduler) {
        setNotificationSchedule(prev => ({
          ...prev, // Keep initial defaults as fallback
          daily_review_time: currentUser.admin_notification_scheduler.daily_review_time || prev.daily_review_time,
          enabled: currentUser.admin_notification_scheduler.enabled !== undefined ? currentUser.admin_notification_scheduler.enabled : prev.enabled,
        }));
      }

    } catch (error) {
      console.error("Error loading admin data:", error);
      toast({
        title: "❌ خطأ في التحميل",
        description: "فشل تحميل بيانات لوحة الإدارة.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const sendNotification = async () => {
    if (!notificationForm.title || !notificationForm.message) {
      toast({
        title: "⚠️ بيانات ناقصة",
        description: "يرجى ملء العنوان والرسالة.",
        variant: "destructive"
      });
      return;
    }

    try {
      let targetUserEmails = [];
      const existingUserEmails = new Set(allUsers.map(u => u.email)); // To ensure we send only to existing users

      switch (notificationForm.target_type) {
        case "all":
          targetUserEmails = Array.from(existingUserEmails);
          break;
        case "specific_user":
          if (notificationForm.target_value && existingUserEmails.has(notificationForm.target_value)) {
            targetUserEmails = [notificationForm.target_value];
          } else {
            toast({
              title: "⚠️ خطأ في المستهدف",
              description: `البريد الإلكتروني "${notificationForm.target_value}" غير موجود أو غير صالح.`,
              variant: "destructive"
            });
            return;
          }
          break;
        case "user_level":
          const level = parseInt(notificationForm.target_value, 10);
          if (isNaN(level) || level <= 0) {
            toast({
              title: "⚠️ مستوى غير صالح",
              description: "يرجى إدخال رقم مستوى صحيح وموجب.",
              variant: "destructive"
            });
            return;
          }
          const progressList = await base44.entities.UserProgress.list();
          targetUserEmails = progressList
            .filter(p => p.current_level >= level && existingUserEmails.has(p.created_by))
            .map(p => p.created_by);
          break;
        case "group":
          if (!notificationForm.target_value) {
            toast({
              title: "⚠️ معرف المجموعة مطلوب",
              description: "يرجى إدخال معرف المجموعة.",
              variant: "destructive"
            });
            return;
          }
          const groups = await base44.entities.Group.filter({ id: notificationForm.target_value });
          const targetGroup = groups.length > 0 ? groups[0] : null;

          if (targetGroup && targetGroup.members) {
            targetUserEmails = targetGroup.members.filter(memberEmail => existingUserEmails.has(memberEmail));
          } else {
            toast({
              title: "⚠️ المجموعة غير موجودة",
              description: `المجموعة بالمعرف "${notificationForm.target_value}" غير موجودة أو ليس لديها أعضاء.`,
              variant: "destructive"
            });
            return;
          }
          break;
        default:
          toast({
            title: "⚠️ نوع مستهدف غير صالح",
            description: "نوع المستهدف المحدد غير صالح.",
            variant: "destructive"
          });
          return;
      }

      if (targetUserEmails.length === 0) {
        toast({
          title: "⚠️ لا مستخدمين للإرسال",
          description: "لم يتم العثور على مستخدمين مطابقين للإشعار بناءً على المعايير المحددة.",
          variant: "destructive"
        });
        return;
      }

      // Send notifications concurrently
      await Promise.all(targetUserEmails.map(userEmail =>
        base44.entities.Notification.create({
          user_email: userEmail,
          notification_type: notificationForm.notification_type,
          title: notificationForm.title,
          message: notificationForm.message,
          icon: notificationForm.icon,
          action_url: notificationForm.action_url || null,
          is_read: false
        })
      ));

      toast({
        title: "✅ تم الإرسال!",
        description: `تم إرسال الإشعار إلى ${targetUserEmails.length} مستخدم.`,
        className: "bg-green-100 text-green-800"
      });

      // Reset form after successful sending
      setNotificationForm({
        notification_type: "announcement",
        title: "",
        message: "",
        icon: "📢",
        target_type: "all",
        target_value: "",
        action_url: ""
      });

    } catch (error) {
      console.error("Error sending notifications:", error);
      toast({
        title: "❌ فشل الإرسال",
        description: `حدث خطأ أثناء الإرسال: ${error.message}`,
        variant: "destructive"
      });
    }
  };

  const createChallenge = async () => {
    if (!challengeForm.challenge_title || !challengeForm.challenge_description || challengeForm.goal_value <= 0 || challengeForm.reward_xp < 0 || challengeForm.reward_gems < 0) {
      toast({
        title: "⚠️ بيانات ناقصة أو غير صالحة",
        description: "يرجى ملء جميع الحقول والتأكد من القيم الصحيحة (الهدف > 0، المكافآت >= 0).",
        variant: "destructive"
      });
      return;
    }

    try {
      await base44.entities.DailyChallenge.create(challengeForm);

      toast({
        title: "✅ تم الإنشاء!",
        description: "تم إنشاء التحدي بنجاح.",
        className: "bg-green-100 text-green-800"
      });

      // Reset form after successful creation
      setChallengeForm({
        challenge_date: new Date().toISOString().split('T')[0],
        challenge_title: "",
        challenge_description: "",
        challenge_type: "learn_words",
        goal_value: 10,
        reward_xp: 50,
        reward_gems: 10
      });

      checkAdminAndLoadData(); // Reload challenges to update list

    } catch (error) {
      console.error("Error creating challenge:", error);
      toast({
        title: "❌ فشل الإنشاء",
        description: `حدث خطأ أثناء إنشاء التحدي: ${error.message}`,
        variant: "destructive"
      });
    }
  };

  const deleteChallenge = async (challengeId) => {
    try {
      await base44.entities.DailyChallenge.delete(challengeId);
      toast({
        title: "✅ تم الحذف",
        description: "تم حذف التحدي بنجاح.",
      });
      checkAdminAndLoadData(); // Reload challenges to update list
    } catch (error) {
      console.error("Error deleting challenge:", error);
      toast({
        title: "❌ فشل الحذف",
        description: `حدث خطأ أثناء حذف التحدي: ${error.message}`,
        variant: "destructive"
      });
    }
  };

  const searchUsers = (term) => {
    setUserSearchTerm(term);
    if (!term) {
      setFilteredUsers(allUsers);
      return;
    }

    const filtered = allUsers.filter(u =>
      u.full_name?.toLowerCase().includes(term.toLowerCase()) ||
      u.email?.toLowerCase().includes(term.toLowerCase())
    );
    setFilteredUsers(filtered);
  };

  // NEW: Function to save Smart Notification Scheduler settings
  const handleSaveNotificationSchedule = async () => {
    try {
      await base44.auth.updateMe({
        admin_notification_scheduler: notificationSchedule
      });

      toast({
        title: "✅ تم الحفظ!",
        description: "تم حفظ إعدادات جدولة الإشعارات الذكية.",
        className: "bg-green-100 text-green-800"
      });
    } catch (error) {
      console.error("Error saving notification schedule:", error);
      toast({
        title: "❌ فشل الحفظ",
        description: `حدث خطأ أثناء حفظ إعدادات الجدولة: ${error.message}`,
        variant: "destructive"
      });
    }
  };

  // --- Sub-component for Certificates ---
const CertificatesList = () => {
  const [certificates, setCertificates] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadCerts = async () => {
      try {
        const data = await base44.entities.Certificate.list("-issue_date", 50);
        setCertificates(data);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    loadCerts();
  }, []);

  const handleDeleteCert = async (id) => {
    if (!confirm("هل أنت متأكد من حذف هذه الشهادة؟")) return;
    try {
      await base44.entities.Certificate.delete(id);
      setCertificates(prev => prev.filter(c => c.id !== id));
      toast({ title: "تم الحذف بنجاح" });
    } catch (e) {
      toast({ title: "خطأ في الحذف", variant: "destructive" });
    }
  };

  if (loading) return <Loader2 className="w-6 h-6 animate-spin mx-auto" />;

  return (
    <div className="space-y-2">
      {certificates.length === 0 ? (
        <p className="text-center text-muted-foreground py-4">لا توجد شهادات صادرة بعد.</p>
      ) : (
        certificates.map(cert => (
          <div key={cert.id} className="flex items-center justify-between p-3 bg-background-soft rounded-lg border">
            <div>
              <h4 className="font-bold text-sm">{cert.user_name}</h4>
              <p className="text-xs text-muted-foreground">{cert.course_title} - {new Date(cert.issue_date).toLocaleDateString('ar-SA')}</p>
              <span className="text-[10px] text-gray-400 font-mono">{cert.code}</span>
            </div>
            <div className="flex gap-2">
              <Button size="sm" variant="ghost" asChild>
                <Link to={`/CertificateView?id=${cert.id}`} target="_blank">
                  <ExternalLink className="w-4 h-4 text-blue-500" />
                </Link>
              </Button>
              <Button size="sm" variant="ghost" onClick={() => handleDeleteCert(cert.id)}>
                <Trash2 className="w-4 h-4 text-red-500" />
              </Button>
            </div>
          </div>
        ))
      )}
    </div>
  );
};

  // NEW: Function to manually trigger Smart Notification System checks
  const runNotificationCheck = async () => {
    if (!notificationSchedule.enabled) {
      toast({
        title: "⚠️ الإشعارات الذكية غير مفعلة",
        description: "يرجى تفعيل نظام الإشعارات الذكية قبل تشغيل الفحص اليدوي.",
        variant: "warning"
      });
      return;
    }

    try {
      toast({
        title: "⏳ جارٍ فحص الإشعارات...",
        description: "يتم فحص المراجعات والسلاسل وتحديات المجموعات وتغييرات الترتيب وإرسال الإشعارات اللازمة...",
      });

      // Execute all Smart Notification System checks concurrently
      await Promise.all([
        SmartNotificationSystem.checkDueReviews(),
        SmartNotificationSystem.checkStreaks(),
        SmartNotificationSystem.checkGroupChallenges(),
        SmartNotificationSystem.checkRankChanges() // Using checkRankChanges as per component implementation
      ]);

      toast({
        title: "✅ تم الانتهاء",
        description: "تم فحص جميع المستخدمين وإرسال الإشعارات اللازمة.",
        className: "bg-green-100 text-green-800"
      });
    } catch (error) {
      console.error("Error running notification check:", error);
      toast({
        title: "❌ خطأ",
        description: `فشل تشغيل نظام الإشعارات الذكية: ${error.message}`,
        variant: "destructive"
      });
    }
  };

  if (isLoading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-screen">
        <Loader2 className="w-12 h-12 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="p-6 max-w-2xl mx-auto">
        <Alert variant="destructive">
          <AlertTriangle className="w-5 h-5" />
          <AlertDescription className="text-lg">
            <strong>⛔ غير مصرح</strong><br />
            هذه الصفحة متاحة للمسؤولين فقط.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center gap-3 mb-8">
          <Shield className="w-10 h-10 text-primary" />
          <div>
            <h1 className="text-4xl font-bold gradient-text">لوحة تحكم الإدارة</h1>
            <p className="text-foreground/70">التحكم الكامل في التطبيق</p>
          </div>
        </div>

        {/* Stats Overview */}
        <div className="grid md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="p-6 text-center">
              <Users className="w-8 h-8 text-blue-500 mx-auto mb-2" />
              <div className="text-3xl font-bold">{totalUsers}</div>
              <p className="text-sm text-foreground/70">مستخدم</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6 text-center">
              <Package className="w-8 h-8 text-green-500 mx-auto mb-2" />
              <div className="text-3xl font-bold">{totalWords}</div>
              <p className="text-sm text-foreground/70">كلمة</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6 text-center">
              <Trophy className="w-8 h-8 text-amber-500 mx-auto mb-2" />
              <div className="text-3xl font-bold">{totalChallenges}</div>
              <p className="text-sm text-foreground/70">تحدي</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6 text-center">
              <Users className="w-8 h-8 text-purple-500 mx-auto mb-2" />
              <div className="text-3xl font-bold">{totalGroups}</div>
              <p className="text-sm text-foreground/70">مجموعة</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6 text-center">
              <Award className="w-8 h-8 text-amber-600 mx-auto mb-2" />
              <div className="text-3xl font-bold">{totalCertificates}</div>
              <p className="text-sm text-foreground/70">شهادة</p>
            </CardContent>
          </Card>

          <Link to="/AdminCourses">
            <Card className="hover:bg-accent/50 transition-colors cursor-pointer h-full">
              <CardContent className="p-6 text-center">
                <BookOpen className="w-8 h-8 text-indigo-500 mx-auto mb-2" />
                <div className="text-3xl font-bold">{totalCourses}</div>
                <p className="text-sm text-foreground/70">دورة تعليمية</p>
                <Badge className="mt-2" variant="outline">إدارة الدورات &larr;</Badge>
              </CardContent>
            </Card>
          </Link>
        </div>

        {/* Tabs: Reordered and updated with new structure */}
        <Tabs defaultValue="smart-notifications" className="w-full"> {/* Changed default value */}
          <TabsList className="grid w-full grid-cols-6"> {/* Adjusted for 6 tabs */}
            <TabsTrigger value="manual-notifications">
              <Send className="w-4 h-4 ml-2" />
              إرسال إشعار
            </TabsTrigger>
            <TabsTrigger value="smart-notifications">
              <Bell className="w-4 h-4 ml-2" />
              إشعارات ذكية
            </TabsTrigger>
            <TabsTrigger value="challenges">
              <Trophy className="w-4 h-4 ml-2" />
              التحديات
            </TabsTrigger>
            <TabsTrigger value="shop">
              <ShoppingBag className="w-4 h-4 ml-2" />
              المتجر
            </TabsTrigger>
            <TabsTrigger value="users">
              <Users className="w-4 h-4 ml-2" />
              المستخدمون
            </TabsTrigger>
            <TabsTrigger value="stats"> {/* Renamed from "analytics" */}
              <BarChart3 className="w-4 h-4 ml-2" />
              التحليلات
            </TabsTrigger>
            <TabsTrigger value="certificates">
              <Award className="w-4 h-4 ml-2" />
              الشهادات
            </TabsTrigger>
          </TabsList>

          {/* Manual Notifications Tab (Previously 'notifications', now for manual sends) */}
          <TabsContent value="manual-notifications" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Send className="w-5 h-5" />
                  إرسال إشعار يدوي
                </CardTitle>
                <p className="text-foreground/70">
                  إرسال إشعارات مخصصة لجميع المستخدمين أو لمجموعات/أفراد محددين.
                </p>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium mb-2 block">نوع الإشعار</label>
                    <Select
                      value={notificationForm.notification_type}
                      onValueChange={(value) => setNotificationForm({...notificationForm, notification_type: value})}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="اختر نوع الإشعار"/>
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="announcement">📢 إعلان</SelectItem>
                        <SelectItem value="review_reminder">🔄 تذكير مراجعة</SelectItem>
                        <SelectItem value="achievement_earned">🏆 إنجاز</SelectItem>
                        <SelectItem value="challenge_invite">🎯 دعوة تحدي</SelectItem>
                        <SelectItem value="streak_warning">⚠️ تحذير سلسلة</SelectItem>
                        <SelectItem value="custom">💬 مخصص</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="text-sm font-medium mb-2 block">الأيقونة (Emoji)</label>
                    <Input
                      value={notificationForm.icon}
                      onChange={(e) => setNotificationForm({...notificationForm, icon: e.target.value})}
                      placeholder="مثال: 📢, 🏆, 🔥"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">العنوان</label>
                  <Input
                    value={notificationForm.title}
                    onChange={(e) => setNotificationForm({...notificationForm, title: e.target.value})}
                    placeholder="عنوان الإشعار الرئيسي"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">الرسالة</label>
                  <Textarea
                    value={notificationForm.message}
                    onChange={(e) => setNotificationForm({...notificationForm, message: e.target.value})}
                    placeholder="محتوى رسالة الإشعار"
                    rows={3}
                  />
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium mb-2 block">إرسال إلى</label>
                    <Select
                      value={notificationForm.target_type}
                      onValueChange={(value) => setNotificationForm({...notificationForm, target_type: value, target_value: ""})}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="اختر المستهدف"/>
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">الجميع</SelectItem>
                        <SelectItem value="specific_user">مستخدم محدد (بريد إلكتروني)</SelectItem>
                        <SelectItem value="user_level">مستخدمو مستوى محدد (الحد الأدنى)</SelectItem>
                        <SelectItem value="group">مجموعة محددة (معرف المجموعة)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {notificationForm.target_type !== "all" && (
                    <div>
                      <label className="text-sm font-medium mb-2 block">القيمة المستهدفة</label>
                      <Input
                        value={notificationForm.target_value}
                        onChange={(e) => setNotificationForm({...notificationForm, target_value: e.target.value})}
                        placeholder={
                          notificationForm.target_type === "specific_user" ? "البريد الإلكتروني للمستخدم" :
                          notificationForm.target_type === "user_level" ? "رقم المستوى (مثال: 5)" :
                          "معرف المجموعة"
                        }
                      />
                    </div>
                  )}
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">رابط الإجراء (اختياري)</label>
                  <Input
                    value={notificationForm.action_url}
                    onChange={(e) => setNotificationForm({...notificationForm, action_url: e.target.value})}
                    placeholder="مثال: /dashboard, /learn, /quiz"
                  />
                </div>

                <Button onClick={sendNotification} className="w-full" size="lg">
                  <Send className="w-5 h-5 ml-2" />
                  إرسال الإشعار
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Smart Notifications Scheduler Tab (NEW - content from outline, replaces old 'scheduler') */}
          <TabsContent value="smart-notifications" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bell className="w-5 h-5" />
                  نظام الإشعارات الذكية التلقائي
                </CardTitle>
                <p className="text-foreground/70">
                  يرسل إشعارات تلقائية للمستخدمين بناءً على نشاطهم.
                </p>
              </CardHeader>
              <CardContent className="space-y-6">
                <Alert className="bg-blue-50 dark:bg-blue-900/20 border-blue-200">
                  <AlertDescription>
                    <p className="font-medium mb-2">📋 أنواع الإشعارات التلقائية:</p>
                    <ul className="list-disc list-inside space-y-1 text-sm">
                      <li>⏰ تذكير يومي بالمراجعة (كلمات مستحقة)</li>
                      <li>🔔 إشعار عند اقتراب موعد مراجعة كلمة</li>
                      <li>🔥 تحذير عند انقطاع السلسلة اليومية</li>
                      <li>🎯 إخطار عند إنشاء تحدي جديد في المجموعة</li>
                      <li>📊 إشعار عند تغيير ترتيبك في Leaderboard</li>
                      <li>🎉 تهنئة عند سلسلة طويلة (7، 14، 30 يوم)</li>
                    </ul>
                  </AlertDescription>
                </Alert>

                <div className="grid md:grid-cols-2 gap-4">
                  <div className="p-4 bg-background-soft rounded-lg border">
                    <Label htmlFor="daily-time" className="flex items-center gap-2 mb-2">
                      <Clock className="w-4 h-4" />
                      وقت التذكير اليومي للمراجعة
                    </Label>
                    <Input
                      id="daily-time"
                      type="time"
                      value={notificationSchedule.daily_review_time}
                      onChange={(e) => setNotificationSchedule(prev => ({
                        ...prev,
                        daily_review_time: e.target.value
                      }))}
                    />
                    <p className="text-xs text-foreground/70 mt-2">
                      سيتم إرسال التذكير اليومي (إن كان مفعّلاً) في هذا الوقت.
                    </p>
                  </div>

                  <div className="p-4 bg-background-soft rounded-lg border">
                    <Label className="flex items-center justify-between mb-2">
                      <span className="flex items-center gap-2">
                        <Zap className="w-4 h-4" />
                        تفعيل نظام الإشعارات الذكية
                      </span>
                      <Switch
                        checked={notificationSchedule.enabled}
                        onCheckedChange={(checked) => setNotificationSchedule(prev => ({
                          ...prev,
                          enabled: checked
                        }))}
                      />
                    </Label>
                    <p className="text-xs text-foreground/70 mt-2">
                      عند التفعيل، سيقوم النظام بفحص وإرسال الإشعارات التلقائية بناءً على الإعدادات.
                    </p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <Button onClick={handleSaveNotificationSchedule} className="flex-1">
                    💾 حفظ إعدادات الجدولة
                  </Button>
                  <Button onClick={runNotificationCheck} variant="outline" className="flex-1">
                    🚀 تشغيل الفحص الآن (اختبار)
                  </Button>
                </div>

                <Alert className="bg-amber-50 border-amber-200">
                  <AlertDescription className="text-amber-800 text-xs">
                    💡 <strong>ملاحظة هامة:</strong> لجدولة الإشعارات التلقائية للتشغيل اليومي، تحتاج لإعداد Cron Job على السيرفر يقوم باستدعاء نقطة نهاية (API endpoint) مخصصة لتشغيل هذا الفحص بشكل دوري. زر "تشغيل الفحص الآن" هو للاختبار اليدوي.
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>سجل الإشعارات المرسلة مؤخراً (وهمي)</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="flex justify-between items-center p-3 bg-background-soft rounded-lg border">
                      <div>
                        <p className="font-medium text-sm">تذكير بالمراجعة لمجموعة من المستخدمين</p>
                        <p className="text-xs text-foreground/70">تم إرسال {10 + i * 5} إشعار</p>
                      </div>
                      <Badge variant="outline">قبل {i + 1} ساعة</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Challenges Tab */}
          <TabsContent value="challenges" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Plus className="w-5 h-5" />
                  إنشاء تحدي جديد
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium mb-2 block">التاريخ</label>
                    <Input
                      type="date"
                      value={challengeForm.challenge_date}
                      onChange={(e) => setChallengeForm({...challengeForm, challenge_date: e.target.value})}
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium mb-2 block">نوع التحدي</label>
                    <Select
                      value={challengeForm.challenge_type}
                      onValueChange={(value) => setChallengeForm({...challengeForm, challenge_type: value})}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="اختر نوع التحدي"/>
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="learn_words">تعلم كلمات</SelectItem>
                        <SelectItem value="quiz_score">نتيجة اختبار</SelectItem>
                        <SelectItem value="streak_maintain">الحفاظ على السلسلة</SelectItem>
                        <SelectItem value="time_challenge">تحدي الوقت</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">العنوان</label>
                  <Input
                    value={challengeForm.challenge_title}
                    onChange={(e) => setChallengeForm({...challengeForm, challenge_title: e.target.value})}
                    placeholder="عنوان التحدي (مثال: تحدي الكلمات الجديد)"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">الوصف</label>
                  <Textarea
                    value={challengeForm.challenge_description}
                    onChange={(e) => setChallengeForm({...challengeForm, challenge_description: e.target.value})}
                    placeholder="وصف تفصيلي للتحدي"
                    rows={2}
                  />
                </div>

                <div className="grid md:grid-cols-3 gap-4">
                  <div>
                    <label className="text-sm font-medium mb-2 block">الهدف</label>
                    <Input
                      type="number"
                      value={challengeForm.goal_value}
                      onChange={(e) => setChallengeForm({...challengeForm, goal_value: parseInt(e.target.value, 10)})}
                      min="1"
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium mb-2 block">مكافأة XP</label>
                    <Input
                      type="number"
                      value={challengeForm.reward_xp}
                      onChange={(e) => setChallengeForm({...challengeForm, reward_xp: parseInt(e.target.value, 10)})}
                      min="0"
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium mb-2 block">مكافأة الجواهر</label>
                    <Input
                      type="number"
                      value={challengeForm.reward_gems}
                      onChange={(e) => setChallengeForm({...challengeForm, reward_gems: parseInt(e.target.value, 10)})}
                      min="0"
                    />
                  </div>
                </div>

                <Button onClick={createChallenge} className="w-full" size="lg">
                  <Plus className="w-5 h-5 ml-2" />
                  إنشاء التحدي
                </Button>
              </CardContent>
            </Card>

            {/* Existing Challenges */}
            <Card>
              <CardHeader>
                <CardTitle>التحديات الموجودة ({challenges.length})</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {challenges.slice(0, 10).map((challenge) => (
                    <div key={challenge.id} className="flex items-center justify-between p-4 bg-background-soft rounded-lg border">
                      <div>
                        <h4 className="font-bold">{challenge.challenge_title}</h4>
                        <p className="text-sm text-foreground/70">{challenge.challenge_description}</p>
                        <div className="flex items-center gap-2 mt-2">
                          <Badge variant="outline">{challenge.challenge_date}</Badge>
                          <Badge variant="secondary">{challenge.challenge_type}</Badge>
                          <Badge className="bg-amber-100 text-amber-700">{challenge.reward_xp} XP</Badge>
                          <Badge className="bg-purple-100 text-purple-700">{challenge.reward_gems} 💎</Badge>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => deleteChallenge(challenge.id)}
                        title="حذف التحدي"
                      >
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </Button>
                    </div>
                  ))}
                  {challenges.length > 10 && (
                    <p className="text-center text-sm text-foreground/70 mt-4">
                      و {challenges.length - 10} تحديات أخرى... (يتم عرض أول 10 تحديات فقط)
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Shop Tab */}
          <TabsContent value="shop" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>إدارة المتجر</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-foreground/70">
                  يتم إدارة عناصر المتجر من خلال الكود حالياً. سيتم إضافة واجهة الإدارة قريباً.
                </p>
                <p className="text-sm text-foreground/60 mt-2">
                  (هذه الوظيفة قيد التطوير وستسمح بإنشاء وتحرير وحذف عناصر المتجر مثل الثيمات، الأيقونات، وغيرها).
                </p>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Users Tab */}
          <TabsContent value="users" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>المستخدمون ({filteredUsers.length})</span>
                  <Input
                    placeholder="🔍 بحث بالاسم أو البريد..."
                    value={userSearchTerm}
                    onChange={(e) => searchUsers(e.target.value)}
                    className="w-64"
                  />
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 max-h-[600px] overflow-y-auto">
                  {filteredUsers.slice(0, 50).map((u) => (
                    <div key={u.email} className="flex items-center justify-between p-3 bg-background-soft rounded-lg border">
                      <div>
                        <h4 className="font-bold">{u.full_name || u.email.split('@')[0]}</h4> {/* Fallback for full_name */}
                        <p className="text-sm text-foreground/70">{u.email}</p>
                      </div>
                      <Badge className={u.role === 'admin' ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'}>
                        {u.role === 'admin' ? '🛡️ مسؤول' : '👤 مستخدم'}
                      </Badge>
                    </div>
                  ))}
                  {filteredUsers.length > 50 && (
                    <p className="text-center text-sm text-foreground/70 mt-4">
                      و {filteredUsers.length - 50} مستخدمين آخرين... (عرض أول 50 فقط)
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Certificates Tab */}
          <TabsContent value="certificates" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Award className="w-5 h-5" />
                  سجل الشهادات الصادرة
                </CardTitle>
                <p className="text-foreground/70">
                  قائمة بجميع الشهادات التي تم إصدارها للمستخدمين.
                </p>
              </CardHeader>
              <CardContent>
                <CertificatesList />
              </CardContent>
            </Card>
          </TabsContent>

          {/* Analytics Tab (Renamed to Stats, with updated content) */}
          <TabsContent value="stats" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>التحليلات المتقدمة</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-foreground/70 mb-4">
                  إحصائيات تفصيلية عن النشاط والمستخدمين. (هذه البيانات وهمية لأغراض العرض).
                </p>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="p-4 bg-background-soft rounded-lg border">
                    <h4 className="font-bold mb-2">معدل النشاط اليومي</h4>
                    <div className="text-3xl font-bold text-primary">
                      {Math.round(totalUsers * 0.35)}
                    </div>
                    <p className="text-sm text-foreground/70">مستخدم نشط يومياً</p>
                  </div>

                  <div className="p-4 bg-background-soft rounded-lg border">
                    <h4 className="font-bold mb-2">معدل الإكمال</h4>
                    <div className="text-3xl font-bold text-green-600">67%</div>
                    <p className="text-sm text-foreground/70">من الاختبارات تم إكمالها</p>
                  </div>

                  <div className="p-4 bg-background-soft rounded-lg border">
                    <h4 className="font-bold mb-2">الكلمات الأكثر صعوبة</h4>
                    <div className="text-sm space-y-1">
                      <div>1. يعظكم - 45% خطأ</div>
                      <div>2. صرط - 38% خطأ</div>
                      <div>3. أنلزمكموها - 42% خطأ</div>
                    </div>
                  </div>

                  <div className="p-4 bg-background-soft rounded-lg border">
                    <h4 className="font-bold mb-2">أوقات الذروة</h4>
                    <div className="text-sm space-y-1">
                      <div>🌙 8-10 مساءً: 40%</div>
                      <div>☀️ 2-4 عصراً: 25%</div>
                      <div>🌅 9-11 صباحاً: 20%</div>
                    </div>
                  </div>

                  <div className="p-4 bg-background-soft rounded-lg border col-span-2">
                    <h4 className="font-bold mb-2">أحدث التسجيلات</h4>
                    <ul className="list-disc list-inside text-sm space-y-1">
                        <li>مستخدم جديد 'محمد أ' سجل قبل يومين</li>
                        <li>مستخدم جديد 'فاطمة س' سجلت اليوم</li>
                        <li>مستخدم جديد 'أحمد ب' سجل قبل ساعة</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </motion.div>
    </div>
  );
}
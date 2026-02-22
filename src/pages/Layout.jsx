import React, { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { supabaseClient } from "@/components/api/supabaseClient";
import { useAuth } from "@/contexts/AuthContext";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      cacheTime: 1000 * 60 * 30,
      refetchOnWindowFocus: false,
    },
  },
});

const createPageUrl = (pageName) => `/${pageName}`;
import { AudioProvider } from "@/components/common/AudioContext";
import GlobalAudioPlayer from "../components/common/GlobalAudioPlayer";
import AppUpdateChecker from "../components/common/AppUpdateChecker";
import DynamicLandingPage from "../components/common/DynamicLandingPage";
import {
  Home,
  BookOpen,
  Brain,
  Trophy,
  BarChart3,
  Settings as SettingsIcon,
  Search,
  Heart,
  BookMarked,
  HelpCircle,
  Users,
  Award,
  ShoppingBag,
  Map,
  Calendar,
  Bell,
  UserPlus,
  Shield,
  LineChart,
  FileText,
  Zap,
  Lock,
  Gift,
  Baby,
  Image,
  BookText,
  Volume2,
  Music,
  AlertTriangle,
  LogOut,
  TrendingUp,
  Smartphone
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarProvider,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const navigationItems = [
  { title: "الرئيسية", url: createPageUrl("Dashboard"), icon: Home },
  { title: "التعلم", url: createPageUrl("Learn"), icon: BookOpen },
  { title: "المراجعة الذكية", url: createPageUrl("SmartReview"), icon: Brain },
  { title: "الاختبار", url: createPageUrl("QuizTypes"), icon: Brain },
  { title: "اختبار حسب المصدر", url: createPageUrl("SourceQuiz"), icon: BookOpen },
  { title: "قارئ القرآن", url: createPageUrl("QuranReader"), icon: BookText },
  { title: "البحث", url: createPageUrl("Search"), icon: Search },
  { title: "مفضلتي", url: createPageUrl("Favorites"), icon: Heart },
];

const socialItems = [
  { title: "المجموعات", url: createPageUrl("Groups"), icon: Users },
  { title: "الأصدقاء", url: createPageUrl("Friends"), icon: UserPlus },
  { title: "لوحة الترتيب", url: createPageUrl("Leaderboard"), icon: Trophy },
  { title: "دعوة الأصدقاء", url: createPageUrl("ReferralSystem"), icon: Gift },
];

const gamificationItems = [
  { title: "الإنجازات", url: createPageUrl("Achievements"), icon: Award },
  { title: "المتجر", url: createPageUrl("Shop"), icon: ShoppingBag },
  { title: "المسارات التعليمية", url: createPageUrl("LearningPaths"), icon: Map },
  { title: "مساراتي المخصصة", url: createPageUrl("CustomLearningPaths"), icon: TrendingUp },
  { title: "التحديات اليومية", url: createPageUrl("DailyChallenges"), icon: Calendar },
];

const systemItems = [
  { title: "وضع الأطفال", url: createPageUrl("KidsMode"), icon: Baby },
  { title: "الإشعارات", url: createPageUrl("Notifications"), icon: Bell },
  { title: "ملاحظاتي", url: createPageUrl("ManageNotes"), icon: FileText },
  { title: "الملف الشخصي", url: createPageUrl("UserProfile"), icon: UserPlus },
  { title: "التقدم", url: createPageUrl("Progress"), icon: BarChart3 },
  { title: "تقدم الكلمات", url: createPageUrl("WordProgressStats"), icon: TrendingUp },
  { title: "التقارير الشاملة", url: createPageUrl("Reports"), icon: FileText },
  { title: "الخصوصية والأمان", url: createPageUrl("PrivacySettings"), icon: Lock },
  { title: "المساعدة", url: createPageUrl("Help"), icon: HelpCircle },
  { title: "الإعدادات", url: createPageUrl("Settings"), icon: SettingsIcon },
  { title: "ادعم التطبيق", url: createPageUrl("Support"), icon: Heart },
];



const adminItems = [
  { title: "لوحة التحكم", url: createPageUrl("AdminPanel"), icon: Shield },
  { title: "التحليلات المتقدمة", url: createPageUrl("Analytics"), icon: LineChart },
  { title: "إدارة المستخدمين", url: createPageUrl("ManageUsers"), icon: Users },
  { title: "إدارة المجموعات", url: createPageUrl("ManageGroups"), icon: Users },
  { title: "توليد الكلمات", url: createPageUrl("GenerateWords"), icon: Zap },
  { title: "استيراد القرآن", url: createPageUrl("ImportQuran"), icon: BookMarked },
  { title: "إدارة القرآن", url: createPageUrl("ManageQuran"), icon: BookOpen },
  { title: "إدارة الصور", url: createPageUrl("ManageImages"), icon: Image },
  { title: "الدورات والشهادات", url: createPageUrl("ManageCertificates"), icon: BookOpen },
  { title: "إدارة الصوتيات", url: createPageUrl("ManageAudios"), icon: Music },
  { title: "صفحات الهبوط", url: createPageUrl("ManageLandingPages"), icon: Zap },
  { title: "تتبع نسخة التطبيق", url: createPageUrl("AppVersionTracking"), icon: Smartphone },
  { title: "سجلات الأخطاء", url: createPageUrl("ErrorLogs"), icon: AlertTriangle },
  { title: "اختبار الصوت", url: createPageUrl("AudioTest"), icon: Volume2 },
];

const LOGO_URL = "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68b74ae8214aa5bfcb70e378/6d983cb3c_.png";

// Component صغير يغلق القائمة تلقائياً في الموبايل عند تغيير الصفحة
function MobileCloser() {
  const { setOpenMobile, isMobile } = useSidebar();
  const location = useLocation();

  useEffect(() => {
    if (isMobile) {
      setOpenMobile(false);
    }
  }, [location.pathname, isMobile]);

  return null;
}

export default function Layout({ children }) {
  const location = useLocation();
  const { user, isAdmin, preferences } = useAuth();
  const [theme, setTheme] = useState("light");
  const [colorScheme, setColorScheme] = useState("default");
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const [isMobile, setIsMobile] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
      setSidebarOpen(window.innerWidth >= 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // مزامنة الثيم مع تفضيلات المستخدم من AuthContext
  useEffect(() => {
    setTheme(preferences.theme || "light");
    setColorScheme(preferences.color_scheme || "default");
  }, [preferences]);

  // إشعارات: جلب مرة + تحديث كل 60 ثانية
  useEffect(() => {
    if (!user) return;
    let interval;
    const fetchNotifications = async () => {
      try {
        const notifications = await supabaseClient.entities.Notification.filter({
          user_email: user.email,
          is_read: false
        });
        setUnreadNotifications(notifications.length);
      } catch {
        // خطأ في الشبكة
      }
    };
    fetchNotifications();
    interval = setInterval(fetchNotifications, 60_000);
    return () => clearInterval(interval);
  }, [user]);

  useEffect(() => {
    if (isMobile) setSidebarOpen(false);
  }, [location.pathname, isMobile]);

  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove("light", "dark");
    root.classList.add(theme);
    
    root.classList.remove("theme-default", "theme-blue", "theme-purple", "theme-orange");
    root.classList.add(`theme-${colorScheme}`);
  }, [theme, colorScheme]);

  return (
    <QueryClientProvider client={queryClient}>
    <AudioProvider>
      <div dir="rtl" className={`theme-${colorScheme} min-h-screen bg-background text-foreground transition-all duration-500 ease-in-out`}>
        <SidebarProvider open={sidebarOpen} onOpenChange={setSidebarOpen}>
          <MobileCloser />
          <div className="min-h-screen flex w-full" dir="rtl">
            <Sidebar className="sidebar-right border-l border-border bg-card/95 backdrop-blur-md" side="right" variant="sidebar" collapsible="icon">
              <SidebarHeader className="border-b border-border p-6">
                <div className="text-center">
                  <img
                    src={LOGO_URL}
                    alt="شعار كلمات القرآن"
                    className="w-20 h-20 mx-auto mb-3"
                  />
                  <h2 className="text-xl font-bold gradient-text">كلمات القرآن</h2>
                </div>
              </SidebarHeader>

              <SidebarContent className="p-4">
                <SidebarGroup>
                  <SidebarGroupLabel className="text-sm font-semibold text-foreground/70 mb-3">
                    القائمة الرئيسية
                  </SidebarGroupLabel>
                  <SidebarGroupContent>
                    <SidebarMenu className="space-y-2">
                      {navigationItems.map((item) => (
                        <SidebarMenuItem key={item.title}>
                          <SidebarMenuButton
                            asChild
                            className={`rounded-xl transition-all duration-300 ${
                              location.pathname === item.url
                                ? "bg-primary/10 text-primary shadow-sm"
                                : "hover:bg-primary/5 hover:text-primary/90"
                            }`}
                          >
                            <Link to={item.url} className="flex items-center gap-3 px-4 py-3" onClick={() => isMobile && setSidebarOpen(false)}>
                              <item.icon className="w-5 h-5" />
                              <span className="font-medium">{item.title}</span>
                            </Link>
                          </SidebarMenuButton>
                        </SidebarMenuItem>
                      ))}
                    </SidebarMenu>
                  </SidebarGroupContent>
                </SidebarGroup>

                <SidebarGroup className="mt-6">
                  <SidebarGroupLabel className="text-sm font-semibold text-foreground/70 mb-3">
                    👥 التفاعل الاجتماعي
                  </SidebarGroupLabel>
                  <SidebarGroupContent>
                    <SidebarMenu className="space-y-2">
                      {socialItems.map((item) => (
                        <SidebarMenuItem key={item.title}>
                          <SidebarMenuButton
                            asChild
                            className={`rounded-xl transition-all duration-300 ${
                              location.pathname === item.url
                                ? "bg-primary/10 text-primary shadow-sm"
                                : "hover:bg-primary/5 hover:text-primary/90"
                            }`}
                          >
                            <Link to={item.url} className="flex items-center gap-3 px-4 py-3" onClick={() => isMobile && setSidebarOpen(false)}>
                              <item.icon className="w-5 h-5" />
                              <span className="font-medium">{item.title}</span>
                            </Link>
                          </SidebarMenuButton>
                        </SidebarMenuItem>
                      ))}
                    </SidebarMenu>
                  </SidebarGroupContent>
                </SidebarGroup>

                <SidebarGroup className="mt-6">
                  <SidebarGroupLabel className="text-sm font-semibold text-foreground/70 mb-3">
                    🎮 التحفيز والمكافآت
                  </SidebarGroupLabel>
                  <SidebarGroupContent>
                    <SidebarMenu className="space-y-2">
                      {gamificationItems.map((item) => (
                        <SidebarMenuItem key={item.title}>
                          <SidebarMenuButton
                            asChild
                            className={`rounded-xl transition-all duration-300 ${
                              location.pathname === item.url
                                ? "bg-primary/10 text-primary shadow-sm"
                                : "hover:bg-primary/5 hover:text-primary/90"
                            }`}
                          >
                            <Link to={item.url} className="flex items-center gap-3 px-4 py-3" onClick={() => isMobile && setSidebarOpen(false)}>
                              <item.icon className="w-5 h-5" />
                              <span className="font-medium">{item.title}</span>
                            </Link>
                          </SidebarMenuButton>
                        </SidebarMenuItem>
                      ))}
                    </SidebarMenu>
                  </SidebarGroupContent>
                </SidebarGroup>

                <SidebarGroup className="mt-6">
                  <SidebarGroupLabel className="text-sm font-semibold text-foreground/70 mb-3">
                    ⚙️ النظام
                  </SidebarGroupLabel>
                  <SidebarGroupContent>
                    <SidebarMenu className="space-y-2">
                      {systemItems.map((item) => (
                        <SidebarMenuItem key={item.title}>
                          <SidebarMenuButton
                            asChild
                            className={`rounded-xl transition-all duration-300 relative ${
                              location.pathname === item.url
                                ? "bg-primary/10 text-primary shadow-sm"
                                : "hover:bg-primary/5 hover:text-primary/90"
                            }`}
                          >
                            <Link to={item.url} className="flex items-center gap-3 px-4 py-3">
                              <item.icon className="w-5 h-5" />
                              <span className="font-medium">{item.title}</span>
                              {item.title === "الإشعارات" && unreadNotifications > 0 && (
                                <span className="absolute top-2 left-2 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                                  {unreadNotifications}
                                </span>
                              )}
                            </Link>
                          </SidebarMenuButton>
                        </SidebarMenuItem>
                      ))}
                    </SidebarMenu>
                  </SidebarGroupContent>
                </SidebarGroup>

                {isAdmin && (
                  <SidebarGroup className="mt-6">
                    <SidebarGroupLabel className="text-sm font-semibold text-foreground/70 mb-3">
                      🛡️ لوحة المدير
                    </SidebarGroupLabel>
                    <SidebarGroupContent>
                      <SidebarMenu className="space-y-2">
                        {adminItems.map((item) => (
                          <SidebarMenuItem key={item.title}>
                            <SidebarMenuButton
                              asChild
                              className={`rounded-xl transition-all duration-300 ${
                                location.pathname === item.url
                                  ? "bg-red-100 text-red-700 shadow-sm dark:bg-red-900/30"
                                  : "hover:bg-red-50 hover:text-red-700 dark:hover:bg-red-900/20"
                              }`}
                            >
                              <Link to={item.url} className="flex items-center gap-3 px-4 py-3">
                                <item.icon className="w-5 h-5" />
                                <span className="font-medium">{item.title}</span>
                              </Link>
                            </SidebarMenuButton>
                          </SidebarMenuItem>
                        ))}
                        <SidebarMenuItem>
                          <SidebarMenuButton
                            asChild
                            className={`rounded-xl transition-all duration-300 ${
                              location.pathname === createPageUrl("StoreDetails")
                                ? "bg-red-100 text-red-700 shadow-sm dark:bg-red-900/30"
                                : "hover:bg-red-50 hover:text-red-700 dark:hover:bg-red-900/20"
                            }`}
                          >
                            <Link to={createPageUrl("StoreDetails")} className="flex items-center gap-3 px-4 py-3">
                              <ShoppingBag className="w-5 h-5" />
                              <span className="font-medium">بيانات المتاجر</span>
                            </Link>
                          </SidebarMenuButton>
                        </SidebarMenuItem>
                      </SidebarMenu>
                    </SidebarGroupContent>
                  </SidebarGroup>
                )}



                {/* Logout Button */}
                <SidebarGroup className="mt-6 border-t pt-4">
                  <SidebarGroupContent>
                    <Button
                      variant="ghost"
                      className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                      onClick={() => setShowLogoutDialog(true)}
                    >
                      <LogOut className="w-5 h-5 ml-2" />
                      تسجيل الخروج
                    </Button>
                  </SidebarGroupContent>
                </SidebarGroup>
              </SidebarContent>
            </Sidebar>

            <main className="flex-1 overflow-auto bg-background">
              <header className="bg-card/80 backdrop-blur-sm border-b border-border px-6 py-4 md:hidden sticky top-0 z-40">
                <div className="flex items-center gap-4">
                  <h1 className="text-xl font-bold gradient-text">كلمات القرآن</h1>
                  <SidebarTrigger className="hover:bg-background-soft p-2 rounded-lg transition-colors duration-200 mr-auto" />
                </div>
              </header>

              <div className="w-full">
                <DynamicLandingPage />
                {children}
              </div>
            </main>
          </div>
        </SidebarProvider>

        <GlobalAudioPlayer />

        <AlertDialog open={showLogoutDialog} onOpenChange={setShowLogoutDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>تسجيل الخروج</AlertDialogTitle>
              <AlertDialogDescription>
                هل أنت متأكد من تسجيل الخروج من حسابك؟
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>إلغاء</AlertDialogCancel>
              <AlertDialogAction
                className="bg-red-600 hover:bg-red-700"
                onClick={() => supabaseClient.auth.logout()}
              >
                تسجيل الخروج
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </AudioProvider>
    </QueryClientProvider>
  );
}
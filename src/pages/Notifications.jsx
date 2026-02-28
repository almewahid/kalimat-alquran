import React, { useState, useEffect } from "react";
import { supabaseClient } from "@/components/api/supabaseClient";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Bell, CheckCheck, Loader2, Heart, Star, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useToast } from "@/components/ui/use-toast";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

/**
 * 🔔 صفحة الإشعارات (Notifications)
 *
 * 📍 أين تظهر: من القائمة الجانبية → "الإشعارات"
 * 🕐 متى تظهر: دائماً متاحة
 * 👥 لمن: جميع المستخدمين المسجلين
 * 💡 الفكرة: عرض جميع الإشعارات (طلبات صداقة، تذكيرات، إنجازات، تحديات)
 */

const NOTIFICATION_CONFIG = {
  friend_request:  { emoji: "👋", bg: "bg-blue-50",   border: "border-blue-200",   dot: "bg-blue-400"   },
  friend_accepted: { emoji: "🤝", bg: "bg-blue-50",   border: "border-blue-200",   dot: "bg-blue-400"   },
  achievement:     { emoji: "🏆", bg: "bg-amber-50",  border: "border-amber-200",  dot: "bg-amber-400"  },
  reminder:        { emoji: "⏰", bg: "bg-purple-50", border: "border-purple-200", dot: "bg-purple-400" },
  challenge:       { emoji: "⚔️", bg: "bg-green-50",  border: "border-green-200",  dot: "bg-green-400"  },
  streak_warning:  { emoji: "🔥", bg: "bg-red-50",    border: "border-red-200",    dot: "bg-red-400"    },
  support:         { emoji: "💖", bg: "bg-pink-50",   border: "border-pink-200",   dot: "bg-pink-400"   },
  default:         { emoji: "📢", bg: "bg-gray-50",   border: "border-gray-200",   dot: "bg-gray-400"   },
};

function simplifyDate(dateStr) {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now - date;
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  if (diffDays === 0) return "اليوم";
  if (diffDays === 1) return "أمس";
  if (diffDays < 7) return `منذ ${diffDays} أيام`;
  return date.toLocaleDateString("ar-SA", { month: "short", day: "numeric" });
}

export default function NotificationsPage() {
  const { toast } = useToast();
  const [notifications, setNotifications] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadNotifications();
  }, []);

  const loadNotifications = async () => {
    try {
      const currentUser = await supabaseClient.auth.me();

      const dynamicNotifications = await supabaseClient.entities.Notification.filter({
        user_email: currentUser.email,
      });

      const supportNotification = {
        id: "support-app",
        title: "ادعم تطوير التطبيق",
        message: "مساهمتك تساعدنا في الاستمرار وإضافة ميزات جديدة 💪",
        notification_type: "support",
        created_date: new Date().toISOString(),
        is_read: false,
        isStatic: true,
        link: "Support",
      };

      const all = [supportNotification, ...dynamicNotifications.map(n => ({ ...n, isStatic: false }))];
      all.sort((a, b) => new Date(b.created_date) - new Date(a.created_date));
      setNotifications(all);
    } catch (error) {
      console.error("Error loading notifications:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const markAsRead = async (notificationId) => {
    try {
      await supabaseClient.entities.Notification.update(notificationId, { is_read: true });
      setNotifications(prev =>
        prev.map(n => n.id === notificationId ? { ...n, is_read: true } : n)
      );
    } catch (error) {
      console.error("Error marking notification as read:", error);
    }
  };

  const markAllAsRead = async () => {
    try {
      const unread = notifications.filter(n => !n.is_read && !n.isStatic);
      for (const n of unread) {
        await supabaseClient.entities.Notification.update(n.id, { is_read: true });
      }
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
      toast({
        title: "✅ تمام!",
        description: "قرأت كل الأخبار",
        className: "bg-green-100 text-green-800",
      });
    } catch (error) {
      console.error("Error marking all as read:", error);
    }
  };

  const deleteNotification = async (notificationId, e) => {
    e.stopPropagation();
    try {
      await supabaseClient.entities.Notification.delete(notificationId);
      setNotifications(prev => prev.filter(n => n.id !== notificationId));
    } catch (error) {
      console.error("Error deleting notification:", error);
    }
  };

  if (isLoading) {
    return (
      <div className="p-6 flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <motion.div
          animate={{ scale: [1, 1.1, 1] }}
          transition={{ repeat: Infinity, duration: 1.5 }}
          className="text-6xl"
        >
          🔔
        </motion.div>
        <p className="text-lg font-semibold text-muted-foreground">جاري تحميل أخبارك...</p>
      </div>
    );
  }

  const unreadCount = notifications.filter(n => !n.is_read).length;
  const hasUnreadDynamic = notifications.some(n => !n.is_read && !n.isStatic);

  return (
    <div className="p-6 max-w-2xl mx-auto">

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-1">
              🔔 أخبارك!
            </h1>
            {unreadCount > 0 ? (
              <p className="text-base font-medium text-amber-600 flex items-center gap-1">
                <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                عندك <span className="font-bold text-lg">{unreadCount}</span> رسالة جديدة
              </p>
            ) : (
              <p className="text-sm text-muted-foreground">قرأت كل أخبارك ✅</p>
            )}
          </div>

          {hasUnreadDynamic && (
            <Button
              onClick={markAllAsRead}
              variant="outline"
              className="rounded-2xl text-sm font-bold gap-2 border-2"
            >
              <CheckCheck className="w-4 h-4" />
              قرأت الكل
            </Button>
          )}
        </div>

        {/* Empty State */}
        {notifications.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-16 flex flex-col items-center gap-4"
          >
            <span className="text-8xl">😴</span>
            <p className="text-xl font-bold text-foreground/70">لا أخبار الآن</p>
            <p className="text-sm text-muted-foreground">تعلّم كلمة جديدة وستجد أخباراً هنا!</p>
            <Link to={createPageUrl("SmartReview")}>
              <Button className="rounded-2xl text-base font-bold px-6 py-3 mt-2 gap-2">
                ابدأ التعلّم 🚀
              </Button>
            </Link>
          </motion.div>
        ) : (
          <div className="space-y-3">
            <AnimatePresence>
              {notifications.map((notification) => {
                const type = notification.notification_type || notification.type || "default";
                const config = NOTIFICATION_CONFIG[type] || NOTIFICATION_CONFIG.default;
                const icon = notification.icon || config.emoji;
                const isRead = notification.is_read;

                return (
                  <motion.div
                    key={notification.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    layout
                  >
                    <Card
                      className={`
                        border-2 rounded-2xl transition-all
                        ${isRead
                          ? "border-gray-100 bg-white/60 opacity-80"
                          : `${config.border} ${config.bg} shadow-md`}
                        ${!notification.isStatic && !isRead ? "cursor-pointer hover:shadow-lg" : ""}
                      `}
                      onClick={!notification.isStatic && !isRead
                        ? () => markAsRead(notification.id)
                        : undefined}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start gap-3">

                          {/* Icon */}
                          <div className={`
                            flex-shrink-0 w-12 h-12 rounded-2xl flex items-center justify-center text-2xl
                            ${isRead ? "bg-gray-100" : config.bg}
                          `}>
                            {notification.isStatic && type === "support"
                              ? <Heart className="w-6 h-6 text-pink-500 fill-pink-200" />
                              : icon}
                          </div>

                          {/* Content */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1 flex-wrap">
                              <h3 className="font-bold text-base leading-tight">{notification.title}</h3>
                              {!isRead && (
                                <span className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${config.dot}`} />
                              )}
                              {isRead && (
                                <span className="text-xs text-muted-foreground">✅</span>
                              )}
                            </div>

                            <p className="text-sm text-foreground/75 leading-relaxed mb-2">
                              {notification.message}
                            </p>

                            <div className="flex items-center justify-between">
                              <span className="text-xs text-muted-foreground font-medium">
                                {simplifyDate(notification.created_date)}
                              </span>
                              {notification.isStatic && notification.link && (
                                <Link to={createPageUrl(notification.link)}>
                                  <Button
                                    variant="link"
                                    className="px-0 h-auto text-xs text-primary font-bold"
                                    onClick={e => e.stopPropagation()}
                                  >
                                    تفاصيل ←
                                  </Button>
                                </Link>
                              )}
                            </div>
                          </div>

                          {/* Delete Button (non-static only) */}
                          {!notification.isStatic && (
                            <button
                              onClick={(e) => deleteNotification(notification.id, e)}
                              className="flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center text-muted-foreground hover:bg-red-50 hover:text-red-400 transition-colors"
                              aria-label="حذف الإشعار"
                            >
                              <X className="w-5 h-5" />
                            </button>
                          )}

                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}
    </div>
  );
}

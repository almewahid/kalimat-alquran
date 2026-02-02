import React, { useState, useEffect } from "react";
import { supabaseClient } from "@/components/api/supabaseClient";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Bell, CheckCheck, Trash2, Loader2, Heart } from "lucide-react"; // Added Heart icon
import { motion, AnimatePresence } from "framer-motion";
import { useToast } from "@/components/ui/use-toast";
import { formatDistanceToNow } from "date-fns";
import { ar } from "date-fns/locale";
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

export default function NotificationsPage() { // Changed component name to NotificationsPage
  const { toast } = useToast();
  const [user, setUser] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [staticNotifications, setStaticNotifications] = React.useState([]); // Added staticNotifications state

  useEffect(() => {
    // Add static support notification
    setStaticNotifications([
      {
        id: "support-app",
        title: "ادعم تطوير التطبيق",
        message: "مساهمتك تساعدنا في الاستمرار وتطوير ميزات جديدة لخدمة القرآن الكريم.",
        type: "support",
        date: new Date().toISOString(), // Use date for static
        read: false, // Use read for static
        link: "Support"
      }
    ]);

    loadNotifications();
  }, []);

  const loadNotifications = async () => {
    try {
      const currentUser = await supabaseClient.auth.me();
      setUser(currentUser);

      const allDynamicNotifications = await supabaseClient.entities.Notification.filter({
        user_email: currentUser.email
      });

      setNotifications(allDynamicNotifications);

    } catch (error) {
      console.error("Error loading notifications:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const markAsRead = async (notificationId) => {
    try {
      // Only mark dynamic notifications as read
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
      const unreadDynamicNotifications = notifications.filter(n => !n.is_read);
      for (const notification of unreadDynamicNotifications) {
        await supabaseClient.entities.Notification.update(notification.id, { is_read: true });
      }

      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));

      toast({
        title: "✅ تم",
        description: "تم تعليم جميع الإشعارات كمقروءة",
        className: "bg-green-100 text-green-800"
      });
    } catch (error) {
      console.error("Error marking all as read:", error);
    }
  };

  const deleteNotification = async (notificationId) => {
    try {
      // Only delete dynamic notifications
      await supabaseClient.entities.Notification.delete(notificationId);
      setNotifications(prev => prev.filter(n => n.id !== notificationId));

      toast({
        title: "تم الحذف",
        description: "تم حذف الإشعار",
      });
    } catch (error) {
      console.error("Error deleting notification:", error);
    }
  };

  const getNotificationStyle = (type) => {
    switch (type) {
      case "friend_request":
      case "friend_accepted":
        return "border-blue-200 bg-blue-50";
      case "achievement":
        return "border-amber-200 bg-amber-50";
      case "reminder":
        return "border-purple-200 bg-purple-50";
      case "challenge":
        return "border-green-200 bg-green-50";
      case "streak_warning":
        return "border-red-200 bg-red-50";
      default:
        return "border-border bg-card";
    }
  };

  if (isLoading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-screen">
        <Loader2 className="w-12 h-12 animate-spin text-primary" />
      </div>
    );
  }

  // Combine and normalize notifications
  const combinedNotifications = [
    ...staticNotifications.map(n => ({
      ...n,
      created_date: n.date, // Normalize date property
      is_read: n.read,     // Normalize read property
      isStatic: true,      // Flag to identify static notifications
    })),
    ...notifications.map(n => ({
      ...n,
      isStatic: false,     // Flag to identify dynamic notifications
    }))
  ];

  combinedNotifications.sort((a, b) => new Date(b.created_date) - new Date(a.created_date));
  const allNotifications = combinedNotifications;

  const unreadCount = allNotifications.filter(n => !n.is_read).length;

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold gradient-text mb-2">🔔 الإشعارات</h1>
            <p className="text-foreground/70">
              لديك {unreadCount} إشعار غير مقروء
            </p>
          </div>
          {unreadCount > 0 && notifications.some(n => !n.is_read) && ( // Only show mark all read for dynamic notifications
            <Button onClick={markAllAsRead} variant="outline">
              <CheckCheck className="w-4 h-4 ml-2" />
              تعليم الكل كمقروء
            </Button>
          )}
        </div>

        {allNotifications.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <Bell className="w-12 h-12 mx-auto mb-4 opacity-20" />
            <p>لا توجد إشعارات جديدة</p>
          </div>
        ) : (
          <div className="space-y-4"> {/* Changed to space-y-4 */}
            <AnimatePresence>
              {allNotifications.map((notification) => (
                <motion.div
                  key={notification.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                >
                  <Card
                    className={`${
                      notification.isStatic
                        ? `transition-all hover:shadow-md ${!notification.is_read ? 'bg-primary/5 border-primary/20' : ''}`
                        : `${getNotificationStyle(notification.notification_type)} border-2 ${!notification.is_read ? 'shadow-md' : 'opacity-75'} transition-all hover:shadow-lg cursor-pointer`
                    }`}
                    onClick={notification.isStatic ? undefined : () => !notification.is_read && markAsRead(notification.id)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-4">
                        {/* Icon part */}
                        {notification.isStatic ? (
                          <div className={`p-2 rounded-full ${notification.type === 'support' ? 'bg-pink-100 text-pink-600' : 'bg-blue-100 text-blue-600'}`}>
                            {notification.type === 'support' ? <Heart className="w-5 h-5" /> : <Bell className="w-5 h-5" />}
                          </div>
                        ) : (
                          <span className="text-3xl">{notification.icon || "📢"}</span>
                        )}

                        <div className="flex-1">
                          <div className="flex justify-between items-start mb-1">
                            <div className="flex items-center gap-2">
                              <h3 className="font-bold text-lg">{notification.title}</h3>
                              {!notification.is_read && (
                                <Badge className="bg-primary text-primary-foreground text-xs">
                                  جديد
                                </Badge>
                              )}
                            </div>
                            <span className="text-xs text-muted-foreground">
                              {notification.isStatic
                                ? new Date(notification.created_date).toLocaleDateString('ar-SA')
                                : formatDistanceToNow(new Date(notification.created_date), { addSuffix: true, locale: ar })}
                            </span>
                          </div>
                          <p className="text-foreground/80 text-sm mt-1 mb-2">
                            {notification.message}
                          </p>
                          {notification.isStatic && notification.link && (
                            <Link to={createPageUrl(notification.link)}>
                              <Button variant="link" className="px-0 mt-2 h-auto text-primary">
                                عرض التفاصيل &larr;
                              </Button>
                            </Link>
                          )}
                        </div>

                        {/* Delete Button (only for non-static notifications) */}
                        {!notification.isStatic && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteNotification(notification.id);
                            }}
                          >
                            <Trash2 className="w-4 h-4 text-red-500" />
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </motion.div>
    </div>
  );
}
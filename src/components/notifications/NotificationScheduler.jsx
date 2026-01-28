import { SmartNotificationSystem } from "./SmartNotificationSystem";

/**
 * 📅 جدولة الإشعارات التلقائية
 * 
 * يعمل في الخلفية ويرسل الإشعارات في أوقات محددة
 */

class NotificationScheduler {
  constructor() {
    this.intervals = [];
  }

  start() {
    // فحص المراجعات المستحقة كل ساعة
    this.intervals.push(
      setInterval(() => {
        SmartNotificationSystem.checkDueReviews();
      }, 3600000) // كل ساعة
    );

    // فحص السلاسل المنقطعة كل 6 ساعات
    this.intervals.push(
      setInterval(() => {
        SmartNotificationSystem.checkStreaks();
      }, 21600000) // كل 6 ساعات
    );

    // فحص التحديات الجديدة كل 30 دقيقة
    this.intervals.push(
      setInterval(() => {
        SmartNotificationSystem.checkGroupChallenges();
      }, 1800000) // كل 30 دقيقة
    );

    // فحص التغييرات في الترتيب كل 12 ساعة
    this.intervals.push(
      setInterval(() => {
        SmartNotificationSystem.checkRankChanges();
      }, 43200000) // كل 12 ساعة
    );

    // التذكير اليومي كل ساعة (سيفحص إذا كان الوقت مناسب للمستخدم)
    this.intervals.push(
      setInterval(() => {
        SmartNotificationSystem.sendDailyReminders();
      }, 3600000) // كل ساعة
    );

    console.log("✅ تم تشغيل نظام الإشعارات الذكية التلقائي");
  }

  stop() {
    this.intervals.forEach(interval => clearInterval(interval));
    this.intervals = [];
    console.log("⏹️ تم إيقاف نظام الإشعارات");
  }
}

export const notificationScheduler = new NotificationScheduler();

// تشغيل تلقائي عند تحميل التطبيق
if (typeof window !== 'undefined') {
  notificationScheduler.start();
}

export default notificationScheduler;
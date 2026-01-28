import { base44 } from "@/api/base44Client";

/**
 * 🔔 نظام الإشعارات الذكية التلقائي
 * 
 * يعمل في الخلفية ويرسل إشعارات تلقائية للمستخدمين:
 * 1. تذكير يومي بالمراجعة (وقت محدد من المستخدم)
 * 2. إشعار عند اقتراب موعد مراجعة كلمة
 * 3. تذكير عند انقطاع السلسلة اليومية
 * 4. إشعار عند إنشاء تحدي جديد في المجموعة
 * 5. إخطار عند تجاوزك في الترتيب أو تجاوز أحد لك
 */

export const SmartNotificationSystem = {
  
  /**
   * فحص المراجعات المستحقة وإرسال إشعارات
   */
  async checkDueReviews() {
    try {
      const users = await base44.entities.User.list();
      
      for (const user of users) {
        const flashcards = await base44.entities.FlashCard.filter({ created_by: user.email });
        const now = new Date();
        
        // كلمات مستحقة للمراجعة
        const dueCards = flashcards.filter(card => {
          const nextReview = new Date(card.next_review);
          return nextReview <= now;
        });
        
        if (dueCards.length > 0) {
          await base44.entities.Notification.create({
            user_email: user.email,
            notification_type: "review_reminder",
            title: "⏰ وقت المراجعة!",
            message: `لديك ${dueCards.length} كلمة مستحقة للمراجعة اليوم. حافظ على تقدمك! 💪`,
            icon: "📚"
          });
        }
        
        // كلمات قريبة من موعد المراجعة (خلال ساعة)
        const upcomingCards = flashcards.filter(card => {
          const nextReview = new Date(card.next_review);
          const diff = nextReview - now;
          return diff > 0 && diff < 3600000; // خلال ساعة
        });
        
        if (upcomingCards.length > 0) {
          await base44.entities.Notification.create({
            user_email: user.email,
            notification_type: "review_reminder",
            title: "🔔 قريباً: موعد المراجعة",
            message: `${upcomingCards.length} كلمة ستحتاج للمراجعة خلال ساعة. استعد! ⏳`,
            icon: "⏰"
          });
        }
      }
    } catch (error) {
      console.error("Error checking due reviews:", error);
    }
  },

  /**
   * فحص السلاسل المنقطعة
   */
  async checkStreaks() {
    try {
      const users = await base44.entities.User.list();
      const today = new Date().toISOString().split('T')[0];
      
      for (const user of users) {
        const [progress] = await base44.entities.UserProgress.filter({ created_by: user.email });
        
        if (!progress) continue;
        
        const lastLoginDate = progress.last_login_date;
        const consecutiveDays = progress.consecutive_login_days || 0;
        
        // تحذير إذا لم يسجل دخول اليوم وكان لديه سلسلة
        if (lastLoginDate !== today && consecutiveDays > 0) {
          await base44.entities.Notification.create({
            user_email: user.email,
            notification_type: "streak_warning",
            title: "🔥 احذر! سلسلتك في خطر",
            message: `لديك سلسلة ${consecutiveDays} أيام. سجل دخولك اليوم للحفاظ عليها! 💪`,
            icon: "⚠️"
          });
        }
        
        // تهنئة على سلسلة طويلة
        if (consecutiveDays > 0 && consecutiveDays % 7 === 0) {
          await base44.entities.Notification.create({
            user_email: user.email,
            notification_type: "achievement_earned",
            title: "🎉 إنجاز رائع!",
            message: `مبروك! وصلت لسلسلة ${consecutiveDays} يوم متواصل! 🔥✨`,
            icon: "🏆"
          });
        }
      }
    } catch (error) {
      console.error("Error checking streaks:", error);
    }
  },

  /**
   * فحص التحديات الجديدة في المجموعات
   */
  async checkGroupChallenges() {
    try {
      const groups = await base44.entities.Group.list();
      
      for (const group of groups) {
        const challenges = await base44.entities.GroupChallenge.filter({
          group_id: group.id,
          is_active: true
        });
        
        // تحديات جديدة (أُنشئت خلال آخر 24 ساعة)
        const newChallenges = challenges.filter(c => {
          const createdDate = new Date(c.created_date);
          const now = new Date();
          const diff = now - createdDate;
          return diff < 86400000; // 24 ساعة
        });
        
        if (newChallenges.length > 0) {
          for (const member of group.members) {
            for (const challenge of newChallenges) {
              await base44.entities.Notification.create({
                user_email: member,
                notification_type: "challenge_invite",
                title: "🎯 تحدي جديد في مجموعتك!",
                message: `تحدي "${challenge.title}" في مجموعة ${group.name}. شارك الآن! 🚀`,
                icon: "🏁"
              });
            }
          }
        }
      }
    } catch (error) {
      console.error("Error checking group challenges:", error);
    }
  },

  /**
   * فحص التغييرات في الترتيب (Leaderboard)
   */
  async checkRankChanges() {
    try {
      const allUsers = await base44.entities.User.list();
      const allProgress = await base44.entities.UserProgress.list();
      
      // ترتيب حسب XP
      const sorted = allProgress
        .sort((a, b) => (b.total_xp || 0) - (a.total_xp || 0))
        .map((p, index) => ({ ...p, rank: index + 1 }));
      
      for (const userProgress of sorted) {
        const previousRank = userProgress.previous_rank || userProgress.rank;
        const currentRank = userProgress.rank;
        
        // تم تجاوزه
        if (previousRank < currentRank) {
          await base44.entities.Notification.create({
            user_email: userProgress.created_by,
            notification_type: "rank_change",
            title: "📉 تم تجاوزك!",
            message: `نزلت للمرتبة ${currentRank}. حان وقت العودة للمنافسة! 💪`,
            icon: "⬇️"
          });
        }
        
        // تجاوز أحداً
        if (previousRank > currentRank) {
          await base44.entities.Notification.create({
            user_email: userProgress.created_by,
            notification_type: "rank_change",
            title: "📈 صعدت في الترتيب!",
            message: `أحسنت! أصبحت في المرتبة ${currentRank}. استمر! 🔥`,
            icon: "⬆️"
          });
        }
        
        // تحديث الترتيب السابق
        if (userProgress.id) {
          await base44.entities.UserProgress.update(userProgress.id, {
            previous_rank: currentRank
          });
        }
      }
    } catch (error) {
      console.error("Error checking rank changes:", error);
    }
  },

  /**
   * التذكير اليومي (حسب وقت المستخدم المفضل)
   */
  async sendDailyReminders() {
    try {
      const users = await base44.entities.User.list();
      const currentHour = new Date().getHours();
      
      for (const user of users) {
        const preferredHour = user.preferences?.reminder_time || 20; // افتراضي 8 مساءً
        
        if (currentHour === preferredHour) {
          const [progress] = await base44.entities.UserProgress.filter({ created_by: user.email });
          
          await base44.entities.Notification.create({
            user_email: user.email,
            notification_type: "daily_challenge",
            title: "🌙 وقت التعلم اليومي!",
            message: `لديك ${progress?.words_to_review?.length || 0} كلمة للمراجعة. ابدأ الآن! 📖`,
            icon: "🕐"
          });
        }
      }
    } catch (error) {
      console.error("Error sending daily reminders:", error);
    }
  },

  /**
   * تشغيل جميع الفحوصات
   */
  async runAll() {
    await this.checkDueReviews();
    await this.checkStreaks();
    await this.checkGroupChallenges();
    await this.checkRankChanges();
    await this.sendDailyReminders();
  }
};

export default SmartNotificationSystem;
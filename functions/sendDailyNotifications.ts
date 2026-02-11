import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'

/**
 * دالة إرسال الإشعارات اليومية التلقائية
 * تُستدعى يومياً عبر Cron Job أو Automation مجدولة
 */
Deno.serve(async (req) => {
  try {
    // إنشاء Supabase client باستخدام service role
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // جلب جميع البيانات المطلوبة
    const { data: allUsers } = await supabase
      .from('user_profiles')
      .select('*')
    
    const { data: allProgress } = await supabase
      .from('user_progress')
      .select('*')
    
    const { data: allFlashcards } = await supabase
      .from('flash_cards')
      .select('*')
    
    const { data: allGroups } = await supabase
      .from('groups')
      .select('*')
    
    const { data: allGroupChallenges } = await supabase
      .from('group_challenges')
      .select('*')
    
    let notificationsSent = 0
    const today = new Date().toISOString().split('T')[0]

    // 1. تذكير المراجعة اليومية (للكلمات المستحقة)
    for (const user of allUsers || []) {
      const userFlashcards = allFlashcards?.filter(fc => fc.created_by === user.email) || []
      const dueCards = userFlashcards.filter(fc => {
        const nextReview = new Date(fc.next_review)
        return nextReview <= new Date()
      })

      if (dueCards.length > 0 && user.notification_settings?.daily_review_enabled !== false) {
        await supabase
          .from('notifications')
          .insert({
            user_email: user.email,
            notification_type: "review_reminder",
            title: "🔔 لديك كلمات للمراجعة",
            message: `لديك ${dueCards.length} كلمة مستحقة للمراجعة اليوم`,
            icon: "📚",
            action_url: "/SmartReview",
            is_read: false
          })
        notificationsSent++
      }
    }

    // 2. تحذير انقطاع السلسلة (للذين لم يسجلوا دخول اليوم)
    for (const user of allUsers || []) {
      const userProgress = allProgress?.find(p => p.created_by === user.email)
      const lastLogin = userProgress?.last_login_date
      
      if (lastLogin && lastLogin !== today && user.notification_settings?.streak_warning_enabled !== false) {
        await supabase
          .from('notifications')
          .insert({
            user_email: user.email,
            notification_type: "streak_warning",
            title: "⚠️ انتبه! سلسلتك في خطر",
            message: "لم تسجل دخول اليوم، سجل الآن للحفاظ على سلسلتك",
            icon: "🔥",
            action_url: "/Dashboard",
            is_read: false
          })
        notificationsSent++
      }
    }

    // 3. إشعار بالتحديات الجديدة
    const newChallenges = allGroupChallenges?.filter(gc => {
      const startDate = new Date(gc.start_date).toISOString().split('T')[0]
      return startDate === today && gc.is_active
    }) || []

    for (const challenge of newChallenges) {
      const group = allGroups?.find(g => g.id === challenge.group_id)
      if (group && group.members) {
        for (const memberEmail of group.members) {
          const user = allUsers?.find(u => u.email === memberEmail)
          if (user?.notification_settings?.group_challenge_enabled !== false) {
            await supabase
              .from('notifications')
              .insert({
                user_email: memberEmail,
                notification_type: "challenge_invite",
                title: `🎯 تحدي جديد في ${group.name}`,
                message: challenge.title,
                icon: "🏆",
                action_url: `/GroupDetail?id=${group.id}`,
                is_read: false
              })
            notificationsSent++
          }
        }
      }
    }

    // 4. تهنئة بالسلاسل الطويلة
    for (const user of allUsers || []) {
      const userProgress = allProgress?.find(p => p.created_by === user.email)
      const streak = userProgress?.consecutive_login_days || 0
      
      if ([7, 14, 30, 60, 100].includes(streak)) {
        await supabase
          .from('notifications')
          .insert({
            user_email: user.email,
            notification_type: "achievement_earned",
            title: `🎉 مبروك! ${streak} يوم متواصل`,
            message: `أنت رائع! حافظت على سلسلة ${streak} يوم متتالي`,
            icon: "🔥",
            action_url: "/Dashboard",
            is_read: false
          })
        notificationsSent++
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        notificationsSent,
        message: `تم إرسال ${notificationsSent} إشعار بنجاح`
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error sending daily notifications:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
})
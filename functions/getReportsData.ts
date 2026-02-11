import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'

/**
 * جلب بيانات التقارير للمستخدم
 */
Deno.serve(async (req) => {
    try {
        // إنشاء Supabase client
        const supabaseUrl = Deno.env.get('SUPABASE_URL')!
        const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
        
        const supabase = createClient(supabaseUrl, supabaseServiceKey)

        // الحصول على JWT token من header
        const authHeader = req.headers.get('Authorization')
        if (!authHeader) {
            return new Response(
                JSON.stringify({ error: 'Unauthorized' }),
                { status: 401, headers: { 'Content-Type': 'application/json' } }
            )
        }

        // التحقق من المستخدم الحالي
        const token = authHeader.replace('Bearer ', '')
        const { data: { user }, error: userError } = await supabase.auth.getUser(token)
        
        if (userError || !user) {
            return new Response(
                JSON.stringify({ error: 'Unauthorized' }),
                { status: 401, headers: { 'Content-Type': 'application/json' } }
            )
        }

        // 1. جلب تقدم المستخدم (الحالة الحالية)
        const { data: userProgressList } = await supabase
            .from('user_progress')
            .select('*')
            .eq('created_by', user.email)
        
        let userProgress = userProgressList?.[0]

        if (!userProgress) {
            // إنشاء افتراضي إذا لم يكن موجود
            userProgress = { words_learned: 0, total_xp: 0, current_level: 1 }
        }

        // 2. جلب جلسات الاختبارات للمستخدم (لتحليل الأداء)
        const { data: userQuizzes } = await supabase
            .from('quiz_sessions')
            .select('*')
            .eq('created_by', user.email)
        
        // حساب متوسط درجات الاختبارات
        let totalPercentage = 0
        let validQuizzes = 0
        
        userQuizzes?.forEach(q => {
            if (q.total_questions > 0) {
                const correct = q.correct_answers !== undefined ? q.correct_answers : 0
                totalPercentage += (correct / q.total_questions) * 100
                validQuizzes++
            }
        })
        
        const userQuizAvg = validQuizzes > 0 ? Math.round(totalPercentage / validQuizzes) : 0

        // 3. جلب سجل الأنشطة (للمخطط الزمني/التاريخ)
        const { data: activityLogs } = await supabase
            .from('activity_logs')
            .select('*')
            .eq('user_email', user.email)
            .eq('activity_type', 'word_learned')
            .order('created_at', { ascending: false })
            .limit(500)

        // معالجة سجل الأنشطة للمخطط (تجميع حسب الشهر)
        const historyData: Record<string, number> = {}
        const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
        
        activityLogs?.forEach(log => {
            const date = new Date(log.created_at)
            const key = `${months[date.getMonth()]} ${date.getFullYear()}` // مثال: "Jan 2024"
            historyData[key] = (historyData[key] || 0) + 1
        })

        // تحويل إلى مصفوفة لـ Recharts
        const historyChartData = Object.keys(historyData).map(key => ({
            name: key,
            words: historyData[key]
        }))

        // 4. بيانات المقارنة (المتوسطات)
        // جلب عينة من المستخدمين لحساب المتوسطات
        const { data: allProgress } = await supabase
            .from('user_progress')
            .select('*')
            .order('updated_at', { ascending: false })
            .limit(50)
        
        let totalWordsSystem = 0
        let totalXPSystem = 0
        let countSystem = allProgress?.length || 0

        allProgress?.forEach(p => {
            totalWordsSystem += (p.words_learned || 0)
            totalXPSystem += (p.total_xp || 0)
        })

        const avgWords = countSystem > 0 ? Math.floor(totalWordsSystem / countSystem) : 0
        const avgXP = countSystem > 0 ? Math.floor(totalXPSystem / countSystem) : 0

        // 5. توليد الاقتراحات
        const suggestions: any[] = []
        
        // اقتراح تقدم الكلمات
        if (userProgress.words_learned < avgWords) {
            suggestions.push({
                id: 1,
                title: "زد من حصيلتك اللغوية",
                description: `أنت أقل من متوسط المستخدمين بـ ${avgWords - userProgress.words_learned} كلمة. حاول تعلم 5 كلمات جديدة اليوم!`,
                actionLabel: "تعلم الآن",
                actionLink: "/Learn",
                type: "warning"
            })
        } else {
            suggestions.push({
                id: 1,
                title: "أداء ممتاز!",
                description: `أنت متقدم على المتوسط بـ ${userProgress.words_learned - avgWords} كلمة. حافظ على هذا الزخم!`,
                actionLabel: "تابع التعلم",
                actionLink: "/Learn",
                type: "success"
            })
        }

        // اقتراح أداء الاختبارات
        if (userQuizAvg < 70) {
            suggestions.push({
                id: 2,
                title: "تحسين دقة الإجابات",
                description: `معدل درجاتك في الاختبارات (${userQuizAvg}%) يمكن أن يكون أفضل. جرب مراجعة الكلمات التي أخطأت فيها.`,
                actionLabel: "المراجعة الذكية",
                actionLink: "/SmartReview",
                type: "info"
            })
        } else {
            suggestions.push({
                id: 2,
                title: "دقة عالية!",
                description: `معدل إجاباتك الصحيحة ${userQuizAvg}%، وهذا رائع. هل أنت مستعد لتحدي أصعب؟`,
                actionLabel: "تحدي جديد",
                actionLink: "/QuizTypes",
                type: "success"
            })
        }
        
        // اقتراح الاستمرارية
        const loginStreak = userProgress.consecutive_login_days || 1
        if (loginStreak < 3) {
            suggestions.push({
                id: 3,
                title: "الاستمرارية هي السر",
                description: "حاول استخدام التطبيق يومياً لمدة 7 أيام متتالية لمضاعفة سرعة تعلمك.",
                actionLabel: null,
                type: "tip"
            })
        }

        return new Response(
            JSON.stringify({
                stats: {
                    wordsLearned: userProgress.words_learned || 0,
                    totalXP: userProgress.total_xp || 0,
                    level: userProgress.current_level || 1,
                    quizAvg: userQuizAvg,
                    streak: loginStreak
                },
                averages: {
                    words: avgWords,
                    xp: avgXP,
                    quizAvg: 75 // متوسط تقديري للنظام
                },
                history: historyChartData,
                suggestions
            }),
            { status: 200, headers: { 'Content-Type': 'application/json' } }
        )

    } catch (error) {
        console.error('Error getting reports data:', error)
        return new Response(
            JSON.stringify({ error: error.message }),
            { status: 500, headers: { 'Content-Type': 'application/json' } }
        )
    }
})
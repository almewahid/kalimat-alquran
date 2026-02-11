import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'

/**
 * تحليل سلوك المستخدم وتقديم توصيات ذكية
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

        // 1. تحليل أوقات تسجيل الدخول لمعرفة أفضل وقت للمراجعة
        // جلب آخر 50 تسجيل دخول
        const { data: loginLogs, error: logsError } = await supabase
            .from('activity_logs')
            .select('*')
            .eq('user_email', user.email)
            .eq('activity_type', 'login')
            .order('created_at', { ascending: false })
            .limit(50)

        let bestHour = 20; // افتراضي 8 مساءً
        if (loginLogs && loginLogs.length > 0) {
            const hours: Record<number, number> = {}
            loginLogs.forEach(log => {
                const hour = new Date(log.created_at).getHours()
                hours[hour] = (hours[hour] || 0) + 1
            })
            bestHour = parseInt(Object.keys(hours).reduce((a, b) => 
                hours[parseInt(a)] > hours[parseInt(b)] ? a : b
            ))
        }

        // 2. تحديد الكلمات الضعيفة (فاصل SRS منخفض)
        const { data: flashcards, error: flashcardsError } = await supabase
            .from('flash_cards')
            .select('*')
            .eq('created_by', user.email)
            .lt('interval', 3) // الفاصل أقل من 3 أيام يعني ضعيف
            .limit(5)

        const weakWordIds = flashcards?.map(fc => fc.word_id) || []
        let weakWords: any[] = []
        
        if (weakWordIds.length > 0) {
            const { data: words, error: wordsError } = await supabase
                .from('quranic_words')
                .select('*')
                .in('id', weakWordIds)
            
            weakWords = words || []
        }

        // 3. اقتراح سورة (بناءً على الكلمات غير المتعلمة)
        // منطق مبسط: يمكن تطويره لاحقاً للتحقق من التقدم لكل سورة
        const suggestedSurah = "النبأ"

        return new Response(
            JSON.stringify({
                bestReviewTime: `${bestHour}:00`,
                weakWords: weakWords.map(w => w.word),
                suggestedSurah: suggestedSurah,
                smartAlerts: [
                    `أفضل وقت للمراجعة هو ${bestHour}:00 بناءً على نشاطك.`,
                    weakWords.length > 0 
                        ? `لديك ${weakWords.length} كلمات تحتاج لتركيز إضافي.` 
                        : "مستواك ممتاز في الكلمات الحالية!",
                    `نقترح عليك البدء بتعلم سورة ${suggestedSurah}.`
                ]
            }),
            { status: 200, headers: { 'Content-Type': 'application/json' } }
        )

    } catch (error) {
        console.error('Error analyzing user behavior:', error)
        return new Response(
            JSON.stringify({ error: error.message }),
            { status: 500, headers: { 'Content-Type': 'application/json' } }
        )
    }
})
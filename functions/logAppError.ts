import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'

/**
 * تسجيل أخطاء التطبيق
 */
Deno.serve(async (req) => {
    try {
        // التحقق من طريقة الطلب
        if (req.method !== 'POST') {
            return new Response(
                JSON.stringify({ error: 'Method not allowed' }),
                { status: 405, headers: { 'Content-Type': 'application/json' } }
            )
        }

        // إنشاء Supabase client
        const supabaseUrl = Deno.env.get('SUPABASE_URL')!
        const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
        
        const supabase = createClient(supabaseUrl, supabaseServiceKey)

        // الحصول على البيانات من body
        const payload = await req.json()
        const { error_message, error_details, context, user_email, additional_data } = payload

        // التحقق من الحقول المطلوبة
        if (!error_message || !context) {
            return new Response(
                JSON.stringify({ error: 'Missing required fields' }),
                { status: 400, headers: { 'Content-Type': 'application/json' } }
            )
        }

        // طباعة الخطأ في console للرؤية الفورية
        console.error(`[AppError] ${context}: ${error_message}`, error_details)

        // حفظ الخطأ في جدول error_logs
        const { error: insertError } = await supabase
            .from('error_logs')
            .insert({
                error_message,
                error_details: error_details ? JSON.stringify(error_details) : "",
                context,
                user_email: user_email || "anonymous",
                timestamp: new Date().toISOString(),
                additional_data: additional_data || {}
            })

        if (insertError) {
            console.error("Failed to insert error log:", insertError)
        }

        return new Response(
            JSON.stringify({ success: true }),
            { status: 200, headers: { 'Content-Type': 'application/json' } }
        )
        
    } catch (error) {
        console.error("Failed to log error:", error)
        // إرجاع success على أي حال لعدم كسر تدفق التطبيق
        return new Response(
            JSON.stringify({ success: false, error: error.message }),
            { status: 200, headers: { 'Content-Type': 'application/json' } }
        )
    }
})